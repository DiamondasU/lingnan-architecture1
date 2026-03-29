import { DEFAULT_CONFIG, STORAGE_KEYS } from "./config.js";

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getSettings() {
  const saved = safeRead(STORAGE_KEYS.settings, {});
  return {
    ...DEFAULT_CONFIG,
    ...saved,
    app: { ...DEFAULT_CONFIG.app, ...(saved.app || {}) },
    openAlex: { ...DEFAULT_CONFIG.openAlex, ...(saved.openAlex || {}) },
    crossref: { ...DEFAULT_CONFIG.crossref, ...(saved.crossref || {}) },
    openai: { ...DEFAULT_CONFIG.openai, ...(saved.openai || {}) }
  };
}

export function saveSettings(settings) {
  safeWrite(STORAGE_KEYS.settings, settings);
}

export function getFavorites() {
  return safeRead(STORAGE_KEYS.favorites, {
    folders: ["默认收藏夹", "文献精读", "术语卡片"],
    selectedFolder: "默认收藏夹",
    items: []
  });
}

export function saveFavorites(payload) {
  safeWrite(STORAGE_KEYS.favorites, payload);
}

export function addFavorite(item) {
  const favorites = getFavorites();
  const exists = favorites.items.some(
    (entry) => entry.kind === item.kind && entry.id === item.id && entry.folder === item.folder
  );
  if (exists) return favorites;
  favorites.items.unshift(item);
  saveFavorites(favorites);
  return favorites;
}

export function removeFavorite(itemKey) {
  const favorites = getFavorites();
  favorites.items = favorites.items.filter((entry) => entry.itemKey !== itemKey);
  saveFavorites(favorites);
  return favorites;
}

export function getHistory() {
  return safeRead(STORAGE_KEYS.history, []);
}

export function pushHistory(entry) {
  const next = [entry, ...getHistory()].slice(0, 40);
  safeWrite(STORAGE_KEYS.history, next);
  return next;
}

export function clearHistoryStore() {
  safeWrite(STORAGE_KEYS.history, []);
}

export function saveRecentResults(results) {
  safeWrite(STORAGE_KEYS.recentResults, results.slice(0, 20));
}

export function getRecentResults() {
  return safeRead(STORAGE_KEYS.recentResults, []);
}

export function buildFavoriteItem({ kind, folder, title, summary, source, id, extra = {} }) {
  return {
    itemKey: `${kind}:${source}:${id}:${folder}`,
    kind,
    folder,
    title,
    summary,
    source,
    id,
    extra,
    savedAt: new Date().toLocaleString("zh-CN", { hour12: false })
  };
}
