import {
  getFavorites,
  getHistory,
  removeFavorite,
  saveFavorites,
  clearHistoryStore
} from "./store.js";
import { emptyState, favoriteCard, historyCard, mountShell } from "./ui.js";

mountShell({
  pageKey: "library",
  title: "收藏与历史",
  subtitle: "把文献、术语、研究快照和 AI 操作历史整理成自己的工作台。"
});

let favorites = getFavorites();
let history = getHistory();

const folderSelect = document.getElementById("folder-select");
const newFolderInput = document.getElementById("folder-input");
const createFolderButton = document.getElementById("create-folder");
const favoritesGrid = document.getElementById("favorites-grid");
const historyGrid = document.getElementById("history-grid");
const clearHistoryButton = document.getElementById("clear-history");

folderSelect.innerHTML = favorites.folders.map((folder) => `<option value="${folder}">${folder}</option>`).join("");
folderSelect.value = favorites.selectedFolder;

folderSelect.addEventListener("change", () => {
  favorites.selectedFolder = folderSelect.value;
  saveFavorites(favorites);
  renderFavorites();
});

createFolderButton.addEventListener("click", () => {
  const folderName = newFolderInput.value.trim();
  if (!folderName || favorites.folders.includes(folderName)) return;
  favorites.folders.push(folderName);
  favorites.selectedFolder = folderName;
  saveFavorites(favorites);
  folderSelect.innerHTML = favorites.folders.map((folder) => `<option value="${folder}">${folder}</option>`).join("");
  folderSelect.value = folderName;
  newFolderInput.value = "";
  renderFavorites();
});

favoritesGrid.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-favorite]");
  if (!removeButton) return;
  favorites = removeFavorite(removeButton.dataset.removeFavorite);
  renderFavorites();
});

clearHistoryButton.addEventListener("click", () => {
  clearHistoryStore();
  history = [];
  renderHistory();
});

renderFavorites();
renderHistory();

function renderFavorites() {
  const items = favorites.items.filter((item) => item.folder === favorites.selectedFolder);
  favoritesGrid.innerHTML = items.length ? items.map(favoriteCard).join("") : emptyState("当前收藏夹还没有内容。");
}

function renderHistory() {
  historyGrid.innerHTML = history.length ? history.map(historyCard).join("") : emptyState("还没有历史记录。");
}
