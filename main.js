// main.js
// 调用 Azure OpenAI Chat Completions（REST）进行翻译
// 需要在 info.json 的 needs 中配置：endpoint、apiKey、deployment、apiVersion、systemPrompt、temperature

async function translate(text, from, to, options) {
  const { config, detect, utils } = options;

  // tauri http 模块
  const http = utils?.http;
  const fetch = utils?.tauriFetch || http?.fetch; // 兼容可能存在的 tauriFetch 命名
  const Body = http?.Body;

  if (!fetch || !Body) {
    throw "运行环境缺少 tauri http 模块（utils.http.fetch / Body）。";
  }

  // 读取配置（在 info.json 的 needs 中暴露给用户填写/选择）
  const endpointRaw   = (config?.endpoint || "").trim();
  const endpoint      = endpointRaw.replace(/\/+$/, ""); // 去掉末尾斜杠
  const apiKey        = (config?.apiKey || "").trim();
  const deployment    = (config?.deployment || "").trim();         // 例如：gpt-5-mini-20250809
  const apiVersion    = (config?.apiVersion || "2024-12-01-preview").trim();
  const systemPrompt  = (config?.systemPrompt || `You are a translation engine. Translate the user's text to the target language. Return ONLY the translated text, no explanations.`).trim();
  const temperature   = isNaN(Number(config?.temperature)) ? 0.2 : Number(config?.temperature);

  if (!endpoint || !apiKey || !deployment) {
    throw "请在插件设置中填写完整的 endpoint、apiKey、deployment。";
  }

  // 语言处理：from 可能是 "auto"
  const source = (from && from !== "auto") ? from : (detect || "auto");
  const target = to || "auto";

  // 构造 messages。把 from/to 传给模型，要求仅返回译文。
  const messages = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content:
        (source === "auto"
          ? `Translate the following text into ${target}.`
          : `Translate the following text from ${source} to ${target}.`)
        + ` Return ONLY the translated text without additional notes.\n\n` + String(text)
    }
  ];

  // Azure Chat Completions（REST）URL：
  // POST {endpoint}/openai/deployments/{deployment}/chat/completions?api-version={apiVersion}
  const url = `${endpoint}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;

  // 注意：在 deployments 路径下，通常无需再传 model 字段
  const payload = {
    messages,
    temperature,
    max_tokens: 4096,
    n: 1
    // 如需服务端流式：stream: true（但 Tauri fetch 不便直接消费 SSE，建议先用非流式）
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
      "Accept": "application/json"
    },
    body: Body.json(payload)
  });

  if (!res.ok) {
    // res.data 通常已是 JSON
    throw `Http Request Error\nHttp Status: ${res.status}\n${JSON.stringify(res.data)}`;
  }

  const data = res.data;
  const choice = data?.choices?.[0];

  // Azure Chat Completions 正常返回在 choices[0].message.content
  let out = choice?.message?.content ?? choice?.text ?? "";

  if (!out || typeof out !== "string") {
    throw `Invalid response: ${JSON.stringify(data)}`;
  }

  // 返回纯文本译文
  return out.trim();
}

export { translate };
