const SYSTEM_PROMPT = `
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

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function joinApiUrl(baseUrl, path) {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(path, normalizedBase).toString();
}

function buildResearchContext(prompt, contextRecords = [], favorites = []) {
  const context = contextRecords
    .slice(0, 12)
    .map((record, index) => {
      return [
        `文献 ${index + 1}`,
        `标题：${record.title || "未知"}`,
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

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.OPENAI_API_KEY) {
    return json({ error: "服务器尚未配置 OPENAI_API_KEY。" }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "请求体不是合法 JSON。" }, 400);
  }

  const prompt = (body.prompt || "").trim();
  if (!prompt) {
    return json({ error: "缺少 prompt。" }, 400);
  }

  const model = env.OPENAI_MODEL || "gpt-5-mini";
  const baseUrl = env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const reasoningEffort = env.OPENAI_REASONING_EFFORT || "low";
  const maxOutputTokens = Number(env.OPENAI_MAX_OUTPUT_TOKENS || "1400");

  const response = await fetch(joinApiUrl(baseUrl, "responses"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      reasoning: { effort: reasoningEffort },
      max_output_tokens: maxOutputTokens,
      instructions: SYSTEM_PROMPT,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildResearchContext(prompt, body.contextRecords || [], body.favorites || [])
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    return json({ error: `OpenAI 调用失败：${response.status} ${errorText}` }, 500);
  }

  const payload = await response.json();
  return json({ text: extractResponseText(payload) || "模型未返回可读文本。" });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      Allow: "POST, OPTIONS"
    }
  });
}
