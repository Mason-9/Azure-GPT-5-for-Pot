# Azure GPT-5 for Pot 🧩

解决问题：当前Pot不支持Azure的GPT5系列，本插件解决了这一问题
 特点：**零内置提示词**、支持 **System/User 双模板**、占位符 **`$text $from $to $detect`**、自动处理 **temperature 400** 重试。

------

## 🚀 快速上手

1. 把本插件放到 Pot 的插件目录并启用（`azure_gpt5`）。
   - 方法1：直接下载plugin.com.pot-app.azure_gpt5.potext使用
   - 方法2：[Releases](https://github.com/Mason-9/Azure-GPT-5-for-Pot/releases)中自行下载
   - 注意插件的后缀是potext
2. 在插件设置里，按下面的表格填写你的 Azure 配置。
3. 写好你的 System/User Prompt 模板（支持占位符）。
4. 保存后在 Pot 中选用该引擎开始翻译。

------

## ⚙️ 字段填写对照表

> 示例配置：
>
> ```
> toml复制编辑endpoint  = "https://<your_resource_name>.cognitiveservices.azure.com/"
> model_name       = "gpt-5-mini"
> deployment       = "gpt-5-mini-20250809"
> subscription_key = "<your-api-key>"
> api_version      = "2024-12-01-preview"
> ```

在 **插件设置** 中按下列方式填写：

| 插件字段（UI）                    | 该填什么              | 示例/格式                                                   | 说明                                                         |
| --------------------------------- | --------------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| **Endpoint**                      | 你的 Azure 资源终结点 | `https://<your_resource_name>.cognitiveservices.azure.com/` | 需要 **https + 域名**，末尾斜杠可有可无（插件会自动处理）。  |
| **API Key**                       | `subscription_key`    | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`                          | Azure 资源的密钥。                                           |
| **Deployment 名称**               | `deployment`          | `gpt-5-mini-20250809`                                       | **Azure 部署名**（不是模型名）。真正决定调用的是它。         |
| **API Version**                   | `api_version`         | `2024-12-01-preview`                                        | 与你资源/地区可用版本一致。默认为此版本。                    |
| **Model（可选）**                 | `model_name`          | `gpt-5-mini`                                                | 可留空。多数情况下 **Azure 只看 deployment**。仅当你的网关/代理需要 `model` 字段时再填。 |
| **System Prompt**                 | 你的系统提示词模板    | 见下方示例                                                  | 支持占位符；为空则不发送 system 消息。                       |
| **User Prompt**                   | 你的用户提示词模板    | 见下方示例                                                  | 支持占位符；为空则不发送 user 消息。                         |
| **Max Completion Tokens（可选）** | 响应 token 上限       | `512`                                                       | 对应 `max_completion_tokens`。留空则不传。                   |
| **Temperature（建议留空）**       | 采样温度              | *留空*                                                      | GPT-5 系列目前只支持默认值。若你误填导致 400，本插件会自动移除后重试。 |



------

## 🧠 Prompt 模板与占位符

插件不自带指令，你完全掌控提示词。支持的占位符：

- **`$text`**：待翻译文本
- **`$from`**：源语言（当 Pot 不是自动检测时）
- **`$to`**：目标语言
- **`$detect`**：检测到的源语言（当 Pot 使用“自动”时）

> ✨ 行为说明
>
> - 我们会把 **System** 消息（若填写）放在前面，再放 **User** 消息（若填写）。
> - **如果两份模板都没有出现 `$text`**，插件会 **额外** 把原文作为一条 `user` 消息发送，避免漏传文本。

### 示例 1：常规翻译

**System Prompt**

```
sql


复制编辑
You are a professional translation engine. Keep meaning accurate and natural.
```

**User Prompt**

```
nginx复制编辑Translate from "{$from || $detect}" to "$to". Only output the translation.

$text
```

### 示例 2：带术语/风格

**System Prompt**

```
vbnet


复制编辑
You follow the client's style guide strictly: concise, fluent, no machine tone.
```

**User Prompt**

```
vbnet复制编辑Language: $to
Domain: software localization
Constraints: keep markdown and punctuation.

$text
```

> 💡 Pot 一些 UI 版本不渲染多行文本框，但本插件支持在输入框中写 `\n` 作为换行，或直接粘贴多行内容（我们会自动处理）。

------

## 🔧 进阶选项

- **Max Completion Tokens**：限制响应长度，防止过长输出或控费。
- **Temperature**：请保持 **空**。如果误填导致 `Unsupported value: 'temperature'…` 的 400 错误，插件会自动去掉并重试，但为了干净的日志，建议一开始就留空。

------

## 🐞 故障排查

- **400: unsupported_value temperature**
   留空 Temperature。插件已内置重试逻辑，但建议直接不填。
- **401/403**
   检查 API Key 是否正确、资源是否允许此版本/部署，或是否跨区域。
- **404**
   部署名不对或资源名拼写错误。
- **超时/网络问题**
   需要代理的环境，请确保系统/应用层代理设置正确。

------

## 🔒 安全提示

- API Key 仅用于直连你的 Azure 资源；请勿外泄。
- 有需要时你可以在 Azure 门户随时 **轮换密钥**。

------

## 📝 许可证 & 致谢

- 本插件使用 Azure OpenAI **Chat Completions** 接口。
- 感谢 Pot 提供的插件接口能力。

有问题/改进建议，欢迎在仓库提交 Issue/PR！🥳