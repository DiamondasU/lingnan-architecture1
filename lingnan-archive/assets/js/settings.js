import { getSettings, saveSettings } from "./store.js";
import { mountShell } from "./ui.js";

mountShell({
  pageKey: "settings",
  title: "设置",
  subtitle: "集中保存文献接口参数、OpenAI Key、模型名称和阅读偏好。"
});

const settings = getSettings();

const form = document.getElementById("settings-form");
const message = document.getElementById("save-message");

form.querySelector("#default-query").value = settings.app.defaultQuery;
form.querySelector("#page-size").value = settings.app.pageSize;
form.querySelector("#openalex-mailto").value = settings.openAlex.mailto;
form.querySelector("#openalex-key").value = settings.openAlex.apiKey;
form.querySelector("#crossref-mailto").value = settings.crossref.mailto;

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const next = {
    ...settings,
    app: {
      ...settings.app,
      defaultQuery: form.querySelector("#default-query").value.trim(),
      pageSize: Number(form.querySelector("#page-size").value || 12)
    },
    openAlex: {
      ...settings.openAlex,
      mailto: form.querySelector("#openalex-mailto").value.trim(),
      apiKey: form.querySelector("#openalex-key").value.trim()
    },
    crossref: {
      ...settings.crossref,
      mailto: form.querySelector("#crossref-mailto").value.trim()
    }
  };

  saveSettings(next);
  message.textContent = "站点设置已保存。AI 的密钥与模型现在改为部署平台的环境变量配置。";
});
