# 公开上线最短路径

这套站点已经适配 Cloudflare Pages + Pages Functions。

## 你需要准备

- 一个 GitHub 账号
- 一个 Cloudflare 账号

## 第一步：把项目传到 GitHub

推荐做法是直接把整个 `lingnan-archive` 文件夹上传到一个新的 GitHub 仓库。

仓库里需要包含：

- `index.html`
- `pages/`
- `assets/`
- `functions/`

## 第二步：在 Cloudflare Pages 创建项目

1. 登录 Cloudflare
2. 进入 `Workers & Pages`
3. 选择 `Create application`
4. 选择 `Pages`
5. 选择 `Connect to Git`
6. 连接你刚才上传的 GitHub 仓库

## 第三步：构建设置

构建时这样填：

- Framework preset: `None`
- Build command: 留空
- Build output directory: `/`

## 第四步：添加环境变量

在 Cloudflare Pages 项目设置里添加：

- `OPENAI_API_KEY`
- `OPENAI_MODEL` = `gpt-5-mini`
- `OPENAI_BASE_URL` = `https://api.openai.com/v1`
- `OPENAI_REASONING_EFFORT` = `low`
- `OPENAI_MAX_OUTPUT_TOKENS` = `1400`

## 第五步：部署完成

部署成功后会拿到一个公开网址，例如：

- `https://lingnan-archive.pages.dev`

这时候别人就能直接打开，不再是 `localhost`。

## 说明

- 检索页的 OpenAlex / Crossref 不需要你自己再写后端。
- AI 现在已经走服务端函数代理，不会把 OpenAI key 暴露给访问者。
