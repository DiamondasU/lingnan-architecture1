import { DEFAULT_CONFIG } from "./config.js";
import { inferBuildingGroup, inferDynasty, normalizeWorkType } from "./data.js";

function compactText(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function normalizeOpenAlexId(id) {
  return String(id || "").replace(/^https?:\/\/openalex\.org\//i, "");
}

export function decodeInvertedIndex(inverted) {
  if (!inverted || typeof inverted !== "object") return "";
  const entries = [];
  for (const [word, positions] of Object.entries(inverted)) {
    positions.forEach((position) => entries.push([position, word]));
  }
  return entries
    .sort((a, b) => a[0] - b[0])
    .map(([, word]) => word)
    .join(" ");
}

export function buildOpenAlexSearchUrl({
  query,
  page = 1,
  filters = {},
  settings = DEFAULT_CONFIG
}) {
  const url = new URL("/works", settings.openAlex.baseUrl);
  const scopedQuery = compactText(query || settings.app.defaultQuery);
  url.searchParams.set("search", scopedQuery);
  url.searchParams.set("page", String(page));
  url.searchParams.set("per-page", String(settings.app.pageSize || 12));
  url.searchParams.set("sort", "relevance_score:desc");
  url.searchParams.set(
    "select",
    "id,doi,display_name,publication_year,publication_date,language,type,primary_location,locations,open_access,authorships,biblio,keywords,concepts,referenced_works_count,cited_by_count,abstract_inverted_index"
  );

  if (settings.openAlex.apiKey) url.searchParams.set("api_key", settings.openAlex.apiKey);
  if (settings.openAlex.includeXpac) url.searchParams.set("include_xpac", "true");
  if (settings.openAlex.mailto) url.searchParams.set("mailto", settings.openAlex.mailto);

  const filterParts = [];
  if (filters.openAccessOnly) filterParts.push("is_oa:true");
  if (filters.language) filterParts.push(`language:${filters.language}`);
  if (filters.fromYear) filterParts.push(`from_publication_date:${filters.fromYear}-01-01`);
  if (filters.toYear) filterParts.push(`to_publication_date:${filters.toYear}-12-31`);
  if (filterParts.length) url.searchParams.set("filter", filterParts.join(","));

  return url.toString();
}

export async function searchOpenAlex(options) {
  const url = buildOpenAlexSearchUrl(options);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`OpenAlex 检索失败：${response.status}`);
  const payload = await response.json();
  return {
    meta: payload.meta,
    results: (payload.results || []).map(normalizeOpenAlexWork)
  };
}

export async function getOpenAlexWork(id, settings = DEFAULT_CONFIG) {
  const safeId = encodeURIComponent(normalizeOpenAlexId(id));
  const url = new URL(`/works/${safeId}`, settings.openAlex.baseUrl);
  if (settings.openAlex.apiKey) url.searchParams.set("api_key", settings.openAlex.apiKey);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`OpenAlex 文献详情获取失败：${response.status}`);
  return normalizeOpenAlexWork(await response.json());
}

export async function searchCrossref(query, settings = DEFAULT_CONFIG) {
  const url = new URL("/works", settings.crossref.baseUrl);
  url.searchParams.set("query.bibliographic", compactText(query));
  url.searchParams.set("rows", "8");
  url.searchParams.set(
    "select",
    "DOI,title,author,published-print,published-online,container-title,URL,abstract,type,language,subject"
  );
  if (settings.crossref.mailto) url.searchParams.set("mailto", settings.crossref.mailto);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Crossref 检索失败：${response.status}`);
  const payload = await response.json();
  return (payload.message?.items || []).map(normalizeCrossrefWork);
}

export async function getCrossrefWorkByDoi(doi, settings = DEFAULT_CONFIG) {
  if (!doi) return null;
  const cleanDoi = doi.replace(/^https?:\/\/doi\.org\//i, "");
  const url = new URL(`/works/${encodeURIComponent(cleanDoi)}`, settings.crossref.baseUrl);
  if (settings.crossref.mailto) url.searchParams.set("mailto", settings.crossref.mailto);
  const response = await fetch(url);
  if (!response.ok) return null;
  const payload = await response.json();
  return normalizeCrossrefWork(payload.message);
}

function normalizeOpenAlexWork(work) {
  const title = compactText(work.display_name || "未命名文献");
  const abstract = decodeInvertedIndex(work.abstract_inverted_index);
  const authors = (work.authorships || []).map((item) => item.author?.display_name).filter(Boolean);
  const locations = work.locations || [];
  const pdfUrl = work.primary_location?.pdf_url || locations.find((item) => item.pdf_url)?.pdf_url || "";
  const landingPageUrl =
    work.primary_location?.landing_page_url ||
    locations.find((item) => item.landing_page_url)?.landing_page_url ||
    work.doi ||
    "";
  const combinedText = compactText(
    [title, abstract, ...(work.keywords || []).map((item) => item.display_name), ...(work.concepts || []).map((item) => item.display_name)].join(" ")
  );

  return {
    source: "openalex",
    id: normalizeOpenAlexId(work.id),
    sourceId: work.id,
    title,
    doi: work.doi || "",
    authors,
    year: work.publication_year || "",
    date: work.publication_date || "",
    language: work.language || "unknown",
    type: normalizeWorkType(work.type),
    journal: work.primary_location?.source?.display_name || "",
    abstract,
    fullTextUrl: pdfUrl,
    landingPageUrl,
    openAccess: Boolean(work.open_access?.is_oa || pdfUrl),
    citedByCount: work.cited_by_count || 0,
    referencesCount: work.referenced_works_count || 0,
    dynasty: inferDynasty(combinedText),
    buildingGroup: inferBuildingGroup(combinedText),
    keywords: [
      ...(work.keywords || []).map((item) => item.display_name),
      ...(work.concepts || []).slice(0, 6).map((item) => item.display_name)
    ].filter(Boolean),
    raw: work
  };
}

function normalizeCrossrefWork(work) {
  const title = Array.isArray(work.title) ? work.title[0] : work.title || "未命名文献";
  const authors = (work.author || [])
    .map((author) => [author.given, author.family].filter(Boolean).join(" "))
    .filter(Boolean);
  const published =
    work["published-print"]?.["date-parts"]?.[0] ||
    work["published-online"]?.["date-parts"]?.[0] ||
    [];
  const abstract = compactText((work.abstract || "").replace(/<[^>]+>/g, " "));
  const combinedText = compactText([title, abstract, ...(work.subject || [])].join(" "));

  return {
    source: "crossref",
    id: work.DOI || title,
    sourceId: work.DOI || title,
    title: compactText(title),
    doi: work.DOI ? `https://doi.org/${work.DOI}` : "",
    authors,
    year: published[0] || "",
    date: published.filter(Boolean).join("-"),
    language: work.language || "unknown",
    type: normalizeWorkType(work.type),
    journal: Array.isArray(work["container-title"]) ? work["container-title"][0] : "",
    abstract,
    fullTextUrl: "",
    landingPageUrl: work.URL || (work.DOI ? `https://doi.org/${work.DOI}` : ""),
    openAccess: false,
    citedByCount: 0,
    referencesCount: 0,
    dynasty: inferDynasty(combinedText),
    buildingGroup: inferBuildingGroup(combinedText),
    keywords: work.subject || [],
    raw: work
  };
}

export async function synthesizeViaProxy({
  prompt,
  contextRecords,
  favorites
}) {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt,
      contextRecords,
      favorites
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `AI 代理调用失败：${response.status}`);
  }
  return payload.text || "";
}

function buildResearchContext(prompt, contextRecords = [], favorites = []) {
  const context = contextRecords
    .slice(0, 12)
    .map((record, index) => {
      return [
        `文献 ${index + 1}`,
        `标题：${record.title}`,
        `作者：${record.authors?.join("、") || "未知"}`,
        `年代：${record.year || "未知"}`,
        `类型：${record.type || "未知"}`,
        `推测朝代：${record.dynasty || "未标注"}`,
        `推测建筑群：${record.buildingGroup || "未标注"}`,
        `摘要：${record.abstract || "暂无摘要"}`,
        `关键词：${(record.keywords || []).slice(0, 8).join("、") || "暂无"}`
      ].join("\n");
    })
    .join("\n\n");

  const favoriteSummary = favorites
    .slice(0, 8)
    .map((item) => `${item.title}（${item.folder}）`)
    .join("、");

  return [
    `用户任务：${prompt}`,
    "",
    "文献上下文：",
    context || "暂无上下文文献。",
    "",
    `用户收藏偏好：${favoriteSummary || "暂无收藏。"}`,
    "",
    "请生成适合岭南建筑研究的整合性回答。"
  ].join("\n");
}

function extractResponseText(payload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const texts = [];
  for (const outputItem of payload.output || []) {
    if (outputItem.type !== "message") continue;
    for (const contentItem of outputItem.content || []) {
      if (contentItem.type === "output_text" && contentItem.text) {
        texts.push(contentItem.text);
      }
    }
  }
  return texts.join("\n\n").trim();
}
