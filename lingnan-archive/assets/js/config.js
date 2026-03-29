export const APP_NAME = "岭南建筑研究整合搜索处理网站";

export const DEFAULT_CONFIG = {
  app: {
    defaultQuery: "岭南建筑 Lingnan architecture",
    pageSize: 12
  },
  openAlex: {
    baseUrl: "https://api.openalex.org",
    apiKey: "",
    mailto: "",
    includeXpac: false
  },
  crossref: {
    baseUrl: "https://api.crossref.org",
    mailto: ""
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
    model: "gpt-5-mini",
    reasoningEffort: "low",
    maxOutputTokens: 1400
  }
};

export const STORAGE_KEYS = {
  settings: "lingnan-site-settings-v2",
  favorites: "lingnan-site-favorites-v2",
  history: "lingnan-site-history-v2",
  recentResults: "lingnan-site-recent-results-v2"
};

export const OPENAI_SYSTEM_PROMPT = `
你是“岭南建筑研究整合助手”。
请始终用简体中文输出。
你的任务是基于用户提供的文献元数据、摘要、年份、作者、来源和收藏偏好，生成可靠、清晰、适合学术梳理的研究整合结果。

输出要求：
1. 优先依据提供给你的文献上下文，不要虚构不存在的结论。
2. 如果资料不足，要明确指出“现有文献不足以支持该判断”。
3. 默认给出：研究概览、时间线或类型线、关键术语解释、推荐继续检索的关键词。
4. 如果用户要求翻译、白话解释或术语说明，请单独列出。
5. 输出语气应稳重、学术、清晰，不要夸张。
`;
