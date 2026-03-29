import { getCrossrefWorkByDoi, getOpenAlexWork, searchOpenAlex } from "./api.js";
import {
  addFavorite,
  buildFavoriteItem,
  getFavorites,
  getSettings,
  pushHistory
} from "./store.js";
import { emptyState, escapeHtml, loadingState, mountShell } from "./ui.js";

mountShell({
  pageKey: "search",
  title: "全文阅读",
  subtitle: "优先展示开放获取 PDF；如果没有开放全文，则展示摘要、DOI 和外部来源入口。"
});

const params = new URLSearchParams(location.search);
const source = params.get("source");
const id = params.get("id");
const title = params.get("title") || "文献阅读";
const settings = getSettings();
let favorites = getFavorites();

const main = document.getElementById("reader-root");
main.innerHTML = loadingState("正在加载文献详情...");

if (!source || !id) {
  main.innerHTML = emptyState("缺少文献参数，请从检索页重新进入。");
} else {
  loadRecord();
}

async function loadRecord() {
  try {
    let primaryRecord = null;
    let secondaryRecord = null;

    if (source === "openalex") {
      primaryRecord = await getOpenAlexWork(id, settings);
      secondaryRecord = primaryRecord.doi ? await getCrossrefWorkByDoi(primaryRecord.doi, settings) : null;
    } else {
      secondaryRecord = await getCrossrefWorkByDoi(id, settings);
      if (secondaryRecord?.doi) {
        const searchResult = await searchOpenAlex({ query: secondaryRecord.doi, settings, filters: {} }).catch(() => null);
        primaryRecord = searchResult?.results?.find((item) => item.doi === secondaryRecord.doi) || null;
      }
    }

    const record = primaryRecord || secondaryRecord;
    if (!record) {
      main.innerHTML = emptyState("没有找到该文献的详细信息。");
      return;
    }

    pushHistory({
      type: "阅读",
      title: record.title,
      detail: `打开了一篇 ${record.source} 文献阅读页。`,
      time: new Date().toLocaleString("zh-CN", { hour12: false })
    });

    renderReader(record, secondaryRecord);
  } catch (error) {
    main.innerHTML = emptyState(error.message || `无法读取《${title}》`);
  }
}

function renderReader(record, crossrefRecord) {
  const isFavorite = favorites.items.some((item) => item.id === record.id && item.source === record.source);
  const embed = record.fullTextUrl
    ? `<iframe class="reader-frame" src="${record.fullTextUrl}" title="${record.title}"></iframe>`
    : `<div class="empty-state">这篇文献当前没有直接可嵌入的开放 PDF。你仍然可以通过 DOI 或来源页继续阅读。</div>`;

  main.innerHTML = `
    <section class="reader-layout">
      <article class="content-panel reader-body">
        <div>
          <p class="meta-row">${record.dynasty} · ${record.buildingGroup} · ${record.year || "年份待补"}</p>
          <h1 class="reader-title">${record.title}</h1>
          <p class="hero-subtitle">${(record.authors || []).join("、") || "未知作者"} · ${record.journal || "来源待补"}</p>
        </div>
        <div class="card-actions">
          <a class="button button-primary" href="${record.fullTextUrl || record.landingPageUrl || record.doi || "#"}" target="_blank" rel="noreferrer">打开原始全文</a>
          <button class="button button-secondary" id="save-record">${isFavorite ? "已收藏" : "收藏文献"}</button>
          <a class="button button-ghost" href="./assistant.html?title=${encodeURIComponent(record.title)}">送入 AI</a>
        </div>
        ${embed}
        <section class="article-section">
          <h2>摘要与导读</h2>
          <div class="article-copy">${escapeHtml(record.abstract || "暂无摘要。建议结合 DOI 或来源页继续追踪。")} </div>
        </section>
        <section class="article-section">
          <h2>阅读线索</h2>
          <ul class="list">
            <li>推测朝代：${record.dynasty}</li>
            <li>推测建筑群：${record.buildingGroup}</li>
            <li>文献类型：${record.type}</li>
            <li>开放获取：${record.openAccess ? "是" : "否"}</li>
            <li>引用次数：${record.citedByCount || 0}</li>
          </ul>
        </section>
      </article>

      <aside class="panel">
        <h2 class="section-title">来源信息</h2>
        <div class="field-stack">
          <div class="card small-card">
            <p class="meta-row">OpenAlex / Crossref</p>
            <p class="summary">DOI：${record.doi || "暂无"}</p>
            <p class="summary">来源页：${record.landingPageUrl ? `<a href="${record.landingPageUrl}" target="_blank" rel="noreferrer">打开外部来源</a>` : "暂无"}</p>
          </div>
          ${
            crossrefRecord
              ? `<div class="card small-card">
                  <p class="meta-row">Crossref 补充元数据</p>
                  <p class="summary">来源刊物：${crossrefRecord.journal || "暂无"}</p>
                  <p class="summary">时间：${crossrefRecord.date || crossrefRecord.year || "暂无"}</p>
                </div>`
              : ""
          }
          <div class="card small-card">
            <p class="meta-row">阅读建议</p>
            <p class="summary">如果正文无法嵌入，多半是该文献只公开了 DOI 或落地页，没有公开 PDF。此时建议点击“打开原始全文”，再从出版方页面继续查阅。</p>
          </div>
        </div>
      </aside>
    </section>
  `;

  document.getElementById("save-record")?.addEventListener("click", () => {
    addFavorite(
      buildFavoriteItem({
        kind: "record",
        folder: favorites.selectedFolder,
        title: record.title,
        summary: `${record.dynasty} · ${record.buildingGroup} · ${record.abstract || "已保存阅读入口"}`,
        source: record.source,
        id: record.id,
        extra: { doi: record.doi, fullTextUrl: record.fullTextUrl, landingPageUrl: record.landingPageUrl }
      })
    );
    favorites = getFavorites();
    renderReader(record, crossrefRecord);
  });
}
