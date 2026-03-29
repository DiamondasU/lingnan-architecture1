# 岭南建筑研究整合搜索处理网站

这是一个纯静态前端版本的多页面原型，已经拆成：

- `index.html` 首页
- `pages/search.html` 文献检索
- `pages/reader.html` 文献阅读
- `pages/assistant.html` AI 助手
- `pages/library.html` 收藏与历史
- `pages/settings.html` 设置

## 已接入

- OpenAlex 实时文献检索
- Crossref DOI 元数据补充
- Cloudflare Pages Functions 代理 OpenAI Responses API
- 开放获取 PDF 嵌入式阅读
- 本地收藏夹、历史记录、最近检索结果缓存

## 使用方式

1. 本地预览时运行 `run-local.ps1` 或 `python -m http.server 8080`
2. 打开 `http://localhost:8080/`
3. 先去 `pages/settings.html` 填写 `OpenAlex mailto`
4. 回到 `pages/search.html` 做实时检索
5. 点击“阅读全文”进入单独阅读页
6. 点击“送入 AI”或进入 `pages/assistant.html` 做整合

## 公开部署到 Cloudflare Pages

1. 把 `lingnan-archive` 整个目录上传到 GitHub 仓库
2. 在 Cloudflare Pages 中连接这个仓库
3. 构建设置：
   - Framework preset: `None`
   - Build command: 留空
   - Build output directory: `/`
4. 在 Pages 项目中添加环境变量：
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`，例如 `gpt-5-mini`
   - `OPENAI_BASE_URL`，例如 `https://api.openai.com/v1`
   - `OPENAI_REASONING_EFFORT`，例如 `low`
   - `OPENAI_MAX_OUTPUT_TOKENS`，例如 `1400`
5. 部署完成后，你会得到一个公开网址，例如 `https://xxx.pages.dev`

## 说明

- 如果文献没有开放 PDF，阅读页会退化为摘要 + DOI / 来源页跳转。
- 现在 AI 已经改成服务端代理，更适合公开部署。
- 如果要做真正面向大众的中文学术平台，后续建议继续接入更适合中文馆藏的数据库和权限体系。
