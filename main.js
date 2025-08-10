// main.js — Azure OpenAI Chat Completions (2024-12-01-preview)
// 双文本框模板（system/user），支持 $text $from $to $detect；不内置任何固定指令。
// temperature 留空则不传；若因 temperature 报 400，自动去掉重试。

async function translate(text, from, to, options) {
  const { config, detect, utils } = options;

  // HTTP
  const fetch =
    (utils?.http && utils.http.fetch) ||
    utils?.tauriFetch ||
    utils?.fetch;
  const Body = utils?.http?.Body;

  if (!fetch || !Body) {
    throw "[AzureOpenAI Plugin] 找不到 HTTP 模块（utils.http.fetch/Body）。请升级 Pot 或检查模板。";
  }

  // 配置
  const endpoint   = (config?.endpoint || "").trim().replace(/\/+$/g, "");
  const apiKey     = (config?.apiKey || "").trim();
  const apiVersion = (config?.apiVersion || "2024-12-01-preview").trim();
  const deployment = (config?.deployment || "").trim();
  const model      = (config?.model || "").trim(); // 可选

  // 新：两个大文本框
  const sysTpl  = (config?.systemTemplate || "").trim();
  const userTpl = (config?.userTemplate   || "").trim();

  const maxTokens = (config?.maxTokens === undefined || config?.maxTokens === "")
    ? undefined : Number(config.maxTokens);

  // temperature：留空不传
  let temperature = config?.temperature;
  if (temperature === "" || temperature === undefined || temperature === null) {
    temperature = undefined;
  } else {
    const t = Number(temperature);
    temperature = Number.isFinite(t) ? t : undefined;
  }

  if (!endpoint)   throw "[AzureOpenAI Plugin] 请填写 Endpoint（Azure 终结点）。";
  if (!apiKey)     throw "[AzureOpenAI Plugin] 请填写 API Key。";
  if (!deployment) throw "[AzureOpenAI Plugin] 请填写 Deployment（部署名）。";

  // 占位符替换
  const replacements = {
    "$text":   String(text ?? ""),
    "$from":   String(from ?? ""),
    "$to":     String(to ?? ""),
    "$detect": String(detect ?? "")
  };

  function fill(tpl) {
    let s = String(tpl || "");
    for (const [k, v] of Object.entries(replacements)) {
      s = s.split(k).join(v);
    }
    return s;
  }

  const filledSys  = sysTpl  ? fill(sysTpl)  : "";
  const filledUser = userTpl ? fill(userTpl) : "";

  // messages 组装：按顺序 system -> user
  const messages = [];
  if (filledSys)  messages.push({ role: "system", content: filledSys });
  if (filledUser) messages.push({ role: "user",   content: filledUser });

  // 若两个模板都没有包含 $text，则补一条原文
  const templatesContainText =
    (/\$text\b/.test(sysTpl) || /\$text\b/.test(userTpl));
  if (!templatesContainText) {
    messages.push({ role: "user", content: String(text ?? "") });
  }

  const url = `${endpoint}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;

  const basePayload = {
    messages,
    ...(model ? { model } : {}),
    ...(Number.isFinite(maxTokens) ? { max_completion_tokens: maxTokens } : {}),
    ...(Number.isFinite(temperature) ? { temperature } : {})
  };

  async function call(payload) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey
      },
      body: Body.json(payload)
    });
    if (!res.ok) {
      const detail = typeof res?.data === "string" ? res.data : JSON.stringify(res?.data || {}, null, 2);
      throw `Http Request Error\nHttp Status: ${res.status}\n${detail}`;
    }
    return res.data;
  }

  let data;
  try {
    data = await call(basePayload);
  } catch (e) {
    const msg = String(e);
    if (/param"\s*:\s*"temperature"/i.test(msg) || /'temperature'/.test(msg)) {
      const { temperature: _t, ...withoutTemp } = basePayload;
      data = await call(withoutTemp);
    } else {
      throw e;
    }
  }

  if (data?.error) {
    throw `[Azure Error] ${JSON.stringify(data.error, null, 2)}`;
  }

  const content =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.delta?.content ??
    "";

  return String(content).trim();
}

globalThis.translate = translate;
