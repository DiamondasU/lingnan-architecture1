import { CURATED_READING_SEEDS, LINGNAN_TOPIC_SUGGESTIONS } from "./data.js";
import { getFavorites, getHistory, getRecentResults } from "./store.js";
import { mountShell } from "./ui.js";

mountShell({
  pageKey: "home",
  title: "首页",
  subtitle: "把岭南建筑的真实文献检索、全文阅读、AI 整合和个人研究夹拆成清晰页面。"
});

const root = document.getElementById("page-root");
const favorites = getFavorites();
const history = getHistory();
const recent = getRecentResults();

root.innerHTML = `
  <section class="stats-grid">
    <article class="stat-card"><strong>${recent.length}</strong><span class="stat-label">最近保存的真实检索结果</span></article>
    <article class="stat-card"><strong>${favorites.items.length}</strong><span class="stat-label">已收藏文献与资料卡</span></article>
    <article class="stat-card"><strong>${favorites.folders.length}</strong><span class="stat-label">个人收藏夹数量</span></article>
    <article class="stat-card"><strong>${history.length}</strong><span class="stat-label">最近操作历史</span></article>
  </section>

  <section class="content-panel" style="margin-top:20px;">
    <h2 class="section-title">研究入口</h2>
    <div class="record-grid">
      <article class="card">
        <p class="meta-row">真实数据源</p>
        <h3>文献检索页</h3>
        <p class="summary">接入 OpenAlex 实时检索，并用 Crossref 补充 DOI 元数据。可继续按朝代、建筑群、人物和开放获取状态做前端筛选。</p>
        <div class="card-actions"><a class="button button-primary" href="./pages/search.html">进入检索</a></div>
      </article>
      <article class="card">
        <p class="meta-row">整篇阅读</p>
        <h3>全文阅读页</h3>
        <p class="summary">点击任一文献即可进入独立阅读页。若文献有开放 PDF，会直接嵌入阅读器；否则展示 DOI、摘要和跳转入口。</p>
        <div class="card-actions"><a class="button button-primary" href="./pages/search.html">先找一篇文献</a></div>
      </article>
      <article class="card">
        <p class="meta-row">真正模型接入</p>
        <h3>AI 助手页</h3>
        <p class="summary">通过 OpenAI Responses API 读取你的最近检索结果和收藏夹，输出研究综述、术语解释、翻译或下一步检索建议。</p>
        <div class="card-actions"><a class="button button-primary" href="./pages/assistant.html">进入 AI 助手</a></div>
      </article>
      <article class="card">
        <p class="meta-row">研究工作台</p>
        <h3>收藏与历史</h3>
        <p class="summary">把文献、阅读入口和研究快照分别归档到收藏夹，并回看最近的检索、阅读和 AI 操作历史。</p>
        <div class="card-actions"><a class="button button-primary" href="./pages/library.html">打开工作台</a></div>
      </article>
    </div>
  </section>

  <section class="content-panel" style="margin-top:20px;">
    <h2 class="section-title">推荐检索主题</h2>
    <div class="quick-links">
      ${LINGNAN_TOPIC_SUGGESTIONS.map(
        (item) =>
          `<a class="button button-secondary" href="./pages/search.html?q=${encodeURIComponent(item)}">${item}</a>`
      ).join("")}
    </div>
  </section>

  <section class="content-panel" style="margin-top:20px;">
    <h2 class="section-title">策展式阅读起点</h2>
    <div class="record-grid">
      ${CURATED_READING_SEEDS.map(
        (item) => `
          <article class="card">
            <p class="meta-row">起始主题</p>
            <h3>${item.title}</h3>
            <p class="summary">${item.summary}</p>
            <div class="card-actions">
              <a class="button button-primary" href="./pages/search.html?q=${encodeURIComponent(item.query)}">检索这一主题</a>
            </div>
          </article>
        `
      ).join("")}
    </div>
    <p class="footer-note">提示：如果你希望长期使用真实接口，先去设置页填写 mailto、OpenAlex API Key（可选）和 OpenAI API Key，再开始检索和 AI 整理会更稳定。</p>
  </section>
`;
