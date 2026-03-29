import { searchCrossref, searchOpenAlex } from "./api.js";
import { BUILDING_GROUP_OPTIONS, DYNASTY_OPTIONS } from "./data.js";
import {
  addFavorite,
  buildFavoriteItem,
  getFavorites,
  getSettings,
  pushHistory,
  saveRecentResults
} from "./store.js";
import { emptyState, loadingState, mountShell, recordCard } from "./ui.js";

const state = {
  settings: getSettings(),
  favorites: getFavorites(),
  filters: {
    query: new URLSearchParams(location.search).get("q") || "",
    person: "",
    dynasty: "",
    group: "",
    openAccessOnly: false,
    language: "",
    fromYear: "",
    toYear: "",
    type: ""
  },
  results: []
};

mountShell({
  pageKey: "search",
  title: "文献检索",
  subtitle: "实时检索 OpenAlex，并用 Crossref 辅助补全 DOI 元数据。点击任意条目可进入独立阅读页。"
});

const queryInput = document.getElementById("query-input");
const personInput = document.getElementById("person-input");
const oaToggle = document.getElementById("oa-toggle");
const languageSelect = document.getElementById("language-select");
const fromYearInput = document.getElementById("from-year");
const toYearInput = document.getElementById("to-year");
const dynastyWrap = document.getElementById("dynasty-chips");
const groupWrap = document.getElementById("group-chips");
const typeSelect = document.getElementById("type-select");
const searchButton = document.getElementById("run-search");
const resetButton = document.getElementById("reset-search");
const statusBox = document.getElementById("search-status");
const resultGrid = document.getElementById("results-grid");

queryInput.value = state.filters.query;

renderChipGroup(dynastyWrap, DYNASTY_OPTIONS, "dynasty");
renderChipGroup(groupWrap, BUILDING_GROUP_OPTIONS, "group");

searchButton.addEventListener("click", runSearch);
resetButton.addEventListener("click", resetFilters);
resultGrid.addEventListener("click", handleResultActions);
dynastyWrap.addEventListener("click", handleChipClick);
groupWrap.addEventListener("click", handleChipClick);

if (state.filters.query) {
  runSearch();
} else {
  statusBox.innerHTML = emptyState("先输入一个岭南建筑相关主题，再开始实时检索。");
  resultGrid.innerHTML = emptyState("例如：开平碉楼、陈家祠、骑楼街、西关大屋。");
}

function renderChipGroup(container, options, key) {
  container.innerHTML = options
    .map(
      (item) => `
        <button class="chip ${state.filters[key] === item ? "active" : ""}" data-filter-key="${key}" data-filter-value="${item}">
          ${item}
        </button>
      `
    )
    .join("");
}

function handleChipClick(event) {
  const button = event.target.closest("[data-filter-key]");
  if (!button) return;
  const key = button.dataset.filterKey;
  const value = button.dataset.filterValue;
  state.filters[key] = state.filters[key] === value ? "" : value;
  renderChipGroup(dynastyWrap, DYNASTY_OPTIONS, "dynasty");
  renderChipGroup(groupWrap, BUILDING_GROUP_OPTIONS, "group");
  renderResults();
}

function syncFilters() {
  state.filters.query = queryInput.value.trim();
  state.filters.person = personInput.value.trim().toLowerCase();
  state.filters.openAccessOnly = oaToggle.checked;
  state.filters.language = languageSelect.value;
  state.filters.fromYear = fromYearInput.value.trim();
  state.filters.toYear = toYearInput.value.trim();
  state.filters.type = typeSelect.value;
}

async function runSearch() {
  syncFilters();
  if (!state.filters.query) {
    statusBox.innerHTML = emptyState("请输入检索词。");
    return;
  }

  statusBox.innerHTML = loadingState("正在连接 OpenAlex 与 Crossref...");
  resultGrid.innerHTML = loadingState("检索结果整理中...");

  try {
    const [openAlexPayload, crossrefPayload] = await Promise.all([
      searchOpenAlex({ query: state.filters.query, filters: state.filters, settings: state.settings }),
      searchCrossref(state.filters.query, state.settings).catch(() => [])
    ]);
    history.replaceState({}, "", `?q=${encodeURIComponent(state.filters.query)}`);

    state.results = mergeResults(openAlexPayload.results, crossrefPayload);
    saveRecentResults(state.results);
    pushHistory({
      type: "检索",
      title: `检索：${state.filters.query}`,
      detail: `共得到 ${state.results.length} 条候选文献，已保存到最近检索结果。`,
      time: new Date().toLocaleString("zh-CN", { hour12: false })
    });
    renderResults();
  } catch (error) {
    statusBox.innerHTML = emptyState(error.message || "检索失败。");
    resultGrid.innerHTML = "";
  }
}

function mergeResults(openAlexResults, crossrefResults) {
  const seen = new Set();
  const merged = [];
  [...openAlexResults, ...crossrefResults].forEach((item) => {
    const key = item.doi || `${item.source}:${item.title}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(item);
  });
  return merged;
}

function filteredResults() {
  return state.results.filter((item) => {
    const authorText = (item.authors || []).join(" ").toLowerCase();
    return (
      (!state.filters.person || authorText.includes(state.filters.person)) &&
      (!state.filters.dynasty || item.dynasty === state.filters.dynasty) &&
      (!state.filters.group || item.buildingGroup === state.filters.group) &&
      (!state.filters.type || item.type === state.filters.type) &&
      (!state.filters.openAccessOnly || item.openAccess) &&
      (!state.filters.language || item.language === state.filters.language)
    );
  });
}

function renderResults() {
  const filtered = filteredResults();
  statusBox.innerHTML = `
    <div class="card small-card">
      <p class="meta-row">实时结果</p>
      <h3>${filtered.length} 条可见文献</h3>
      <p class="summary">主检索词：${state.filters.query || "未填写"}。其中优先展示 OpenAlex 返回的开放获取文献；Crossref 条目用于补充 DOI 元数据。</p>
    </div>
  `;

  if (!filtered.length) {
    resultGrid.innerHTML = emptyState("没有匹配到结果。可以试着缩短关键词，或取消朝代、建筑群与开放获取限制。");
    return;
  }

  const favoriteSet = new Set(state.favorites.items.map((item) => `${item.source}:${item.id}`));
  resultGrid.innerHTML = filtered
    .map((record) =>
      recordCard(record, { isFavorite: favoriteSet.has(`${record.source}:${record.id}`) })
    )
    .join("");
}

function handleResultActions(event) {
  const favoriteButton = event.target.closest("[data-favorite-id]");
  const promptButton = event.target.closest("[data-prompt-title]");

  if (favoriteButton) {
    const record = filteredResults().find((item) => item.id === favoriteButton.dataset.favoriteId);
    if (!record) return;
    addFavorite(
      buildFavoriteItem({
        kind: "record",
        folder: state.favorites.selectedFolder,
        title: record.title,
        summary: `${record.dynasty} · ${record.buildingGroup} · ${record.abstract || "已保存阅读入口"}`,
        source: record.source,
        id: record.id,
        extra: { doi: record.doi, fullTextUrl: record.fullTextUrl }
      })
    );
    state.favorites = getFavorites();
    renderResults();
    return;
  }

  if (promptButton) {
    localStorage.setItem("lingnan-ai-draft-prompt", `请基于最近检索结果，整理与“${promptButton.dataset.promptTitle}”相关的研究脉络。`);
    location.href = "./assistant.html";
  }
}

function resetFilters() {
  state.filters = {
    query: "",
    person: "",
    dynasty: "",
    group: "",
    openAccessOnly: false,
    language: "",
    fromYear: "",
    toYear: "",
    type: ""
  };
  queryInput.value = "";
  personInput.value = "";
  oaToggle.checked = false;
  languageSelect.value = "";
  fromYearInput.value = "";
  toYearInput.value = "";
  typeSelect.value = "";
  renderChipGroup(dynastyWrap, DYNASTY_OPTIONS, "dynasty");
  renderChipGroup(groupWrap, BUILDING_GROUP_OPTIONS, "group");
  statusBox.innerHTML = emptyState("筛选已重置。");
  resultGrid.innerHTML = emptyState("重新输入主题后即可继续检索。");
}
