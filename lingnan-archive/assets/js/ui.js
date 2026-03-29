import { APP_NAME } from "./config.js";

export function pageTemplate({ pageKey, title, subtitle }) {
  const shellPaths =
    pageKey === "home"
      ? {
          home: "./index.html",
          search: "./pages/search.html",
          assistant: "./pages/assistant.html",
          library: "./pages/library.html",
          settings: "./pages/settings.html"
        }
      : {
          home: "../index.html",
          search: "./search.html",
          assistant: "./assistant.html",
          library: "./library.html",
          settings: "./settings.html"
        };
  const navItems = [
    { key: "home", label: "首页", href: shellPaths.home },
    { key: "search", label: "文献检索", href: shellPaths.search },
    { key: "assistant", label: "AI 助手", href: shellPaths.assistant },
    { key: "library", label: "收藏与历史", href: shellPaths.library },
    { key: "settings", label: "设置", href: shellPaths.settings }
  ];

  return `
    <header class="topbar">
      <a class="brand" href="${shellPaths.home}">
        <span class="brand-badge" aria-hidden="true"></span>
        <span>
          <strong>${APP_NAME}</strong>
          <em>${subtitle || "岭南文献与建筑知识平台"}</em>
        </span>
      </a>
      <nav class="topnav">
        ${navItems
          .map(
            (item) => `
              <a class="nav-link ${item.key === pageKey ? "active" : ""}" href="${item.href}">${item.label}</a>
            `
          )
          .join("")}
      </nav>
    </header>
    <section class="hero-strip">
      <div>
        <p class="eyebrow">Lingnan Archive Research Platform</p>
        <h1>${title}</h1>
        <p class="hero-subtitle">${subtitle}</p>
      </div>
    </section>
  `;
}

export function mountShell({ pageKey, title, subtitle }) {
  const shell = document.getElementById("app-shell");
  shell.innerHTML = pageTemplate({ pageKey, title, subtitle });
  document.title = `${title} · ${APP_NAME}`;
}

export function formatAuthors(authors = []) {
  if (!authors.length) return "未知作者";
  return authors.slice(0, 4).join("、");
}

export function formatType(type) {
  const map = {
    "journal-article": "期刊论文",
    "book-chapter": "章节",
    book: "图书",
    dissertation: "学位论文",
    dataset: "数据集",
    report: "报告",
    "conference-paper": "会议论文",
    "posted-content": "预印本",
    other: "其他"
  };
  return map[type] || type || "其他";
}

export function formatSource(record) {
  return [record.journal, record.year].filter(Boolean).join(" · ") || "来源待补充";
}

export function escapeHtml(value = "") {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function recordCard(record, options = {}) {
  const favoriteLabel = options.isFavorite ? "已收藏" : "收藏";
  const readerHref = `./reader.html?source=${encodeURIComponent(record.source)}&id=${encodeURIComponent(record.id)}&title=${encodeURIComponent(record.title)}`;
  const actions = options.hideActions
    ? ""
    : `
      <div class="card-actions">
        <a class="button button-primary" href="${readerHref}">阅读全文</a>
        <button class="button button-secondary" data-favorite-id="${escapeHtml(record.id)}">${favoriteLabel}</button>
        <button class="button button-ghost" data-prompt-title="${escapeHtml(record.title)}">送入 AI</button>
      </div>
    `;
  return `
    <article class="card record-card">
      <div class="card-top">
        <div>
          <p class="meta-row">${escapeHtml(record.dynasty)} · ${escapeHtml(record.buildingGroup)}</p>
          <h3>${escapeHtml(record.title)}</h3>
          <p class="meta-row">${escapeHtml(formatAuthors(record.authors))}</p>
        </div>
        <span class="badge">${escapeHtml(formatType(record.type))}</span>
      </div>
      <p class="summary">${escapeHtml(record.abstract || "暂无摘要，建议进入阅读页查看 DOI 或全文链接。").slice(0, 260)}</p>
      <div class="meta-stack">
        <span>${escapeHtml(formatSource(record))}</span>
        <span>${record.openAccess ? "开放获取" : "元数据可用"}</span>
        <span>${record.citedByCount || 0} 次引用</span>
      </div>
      <div class="tag-row">
        ${(record.keywords || [])
          .slice(0, 5)
          .map((keyword) => `<span class="tag">${escapeHtml(keyword)}</span>`)
          .join("")}
      </div>
      ${actions}
    </article>
  `;
}

export function emptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

export function loadingState(message = "加载中...") {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

export function historyCard(item) {
  return `
    <article class="card small-card">
      <p class="meta-row">${escapeHtml(item.type)} · ${escapeHtml(item.time || "")}</p>
      <h3>${escapeHtml(item.title)}</h3>
      <p class="summary">${escapeHtml(item.detail || "")}</p>
    </article>
  `;
}

export function favoriteCard(item) {
  return `
    <article class="card small-card">
      <p class="meta-row">${escapeHtml(item.folder)} · ${escapeHtml(item.savedAt || "")}</p>
      <h3>${escapeHtml(item.title)}</h3>
      <p class="summary">${escapeHtml(item.summary || "")}</p>
      <div class="card-actions">
        <button class="button button-secondary" data-remove-favorite="${escapeHtml(item.itemKey)}">移出</button>
      </div>
    </article>
  `;
}
