import { synthesizeViaProxy } from "./api.js";
import { getFavorites, getRecentResults, pushHistory } from "./store.js";
import { emptyState, escapeHtml, mountShell, recordCard } from "./ui.js";

mountShell({
  pageKey: "assistant",
  title: "AI 助手",
  subtitle: "读取最近检索结果和收藏夹，通过 OpenAI Responses API 生成研究综述、白话解释、翻译与检索建议。"
});

const favorites = getFavorites();
const recentResults = getRecentResults();
const promptInput = document.getElementById("assistant-prompt");
const runButton = document.getElementById("run-assistant");
const output = document.getElementById("assistant-output");
const contextGrid = document.getElementById("assistant-context");
const includeRecent = document.getElementById("include-recent");
const includeFavorites = document.getElementById("include-favorites");
const incomingTitle = new URLSearchParams(location.search).get("title")?.trim();
const draftPrompt = localStorage.getItem("lingnan-ai-draft-prompt");

promptInput.value = draftPrompt
  ? draftPrompt
  : incomingTitle
    ? `请整理与“${incomingTitle}”相关的研究脉络，并解释关键术语。`
    : "请整合最近检索到的岭南建筑文献，生成一份研究概览。";

renderContext();

runButton.addEventListener("click", async () => {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    output.innerHTML = emptyState("请输入你希望 AI 完成的任务。");
    return;
  }

  const contextRecords = includeRecent.checked ? recentResults : [];
  const selectedFavorites = includeFavorites.checked ? favorites.items : [];

  output.innerHTML = `<div class="card"><p class="meta-row">处理中</p><h3>正在调用网站 AI 服务...</h3><p class="summary">公开部署后，OpenAI key 会保存在服务器环境变量里，不再出现在浏览器中。</p></div>`;

  try {
    const result = await synthesizeViaProxy({
      prompt,
      contextRecords,
      favorites: selectedFavorites
    });

    output.innerHTML = `<article class="card"><p class="meta-row">AI 输出</p><div class="article-copy">${escapeHtml(result).replace(/\n/g, "<br>")}</div></article>`;
    pushHistory({
      type: "AI",
      title: "生成研究整合",
      detail: prompt,
      time: new Date().toLocaleString("zh-CN", { hour12: false })
    });
    localStorage.removeItem("lingnan-ai-draft-prompt");
  } catch (error) {
    output.innerHTML = emptyState(error.message || "AI 调用失败。");
  }
});

function renderContext() {
  if (!recentResults.length) {
    contextGrid.innerHTML = emptyState("还没有最近检索结果。先去文献检索页找几篇真实文献，再回来做整合会更有内容。");
    return;
  }

  contextGrid.innerHTML = recentResults
    .slice(0, 4)
    .map((record) => recordCard(record, { isFavorite: false, hideActions: true }))
    .join("");
}
