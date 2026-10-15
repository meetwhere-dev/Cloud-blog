# 博客问答助手

现有 Vue 3 / vite-ssg 博客继续作为静态站点部署在同一个 Vercel 项目。`api/chat.mjs` 是 Node.js 服务端函数，通过 Google Gemini 原生 `streamGenerateContent` API 调用 `gemini-3.5-flash-lite`，向 Vue 聊天窗口返回 SSE 流。

## Vercel 配置

1. 保留现有 Vercel 项目及 Git 仓库关联。提交本次改动后使用现有 Git 发布流程；不需要新建网站。
2. 项目 Node.js 版本使用 **22.x**，构建命令 `pnpm build`，输出目录 `dist`。仓库 `vercel.json` 已配置函数最长 60 秒；接口使用共享的 30 秒总超时，包含限流检查、请求、重试等待和流式输出。
3. 在 Vercel Settings → Environment Variables 中设置：

| 变量 | 值 | 说明 |
| --- | --- | --- |
| `GEMINI_API_KEY` | Google AI Studio 免费层项目的 API Key | 必填；只在服务端读取 |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | 主模型，已作为代码默认值 |
| `GEMINI_FALLBACK_MODEL` | `gemini-3.1-flash-lite` | 备用模型；设置为空可关闭备用 |
| `UPSTASH_REDIS_REST_URL` | Redis 的 REST URL | Production 必填，共享限流计数 |
| `UPSTASH_REDIS_REST_TOKEN` | Redis 的 REST Token | Production 必填，写权限 |

从 [Google AI Studio](https://aistudio.google.com/apikey) 创建或选择免费层项目的 Key。免费层有调用配额；项目若已开启付费计费，API 请求可能收费，代码不能指定“免费模式”。本实现不启用联网搜索等额外工具，Google 返回 503 等临时故障时有限重试，并可切换到指定备用模型；日额度耗尽或未知原因的 429 不重试、不切换。不会自动选择未配置的模型。免费层输入输出可能用于 Google 产品改进；访客请勿输入敏感信息。旧 `OPENAI_*` 变量不再被代码读取，确认迁移完成后可从 Vercel 删除。

可在 Vercel Marketplace 连接 Upstash Redis，将对应 REST 凭证配置到以上变量中。Redis 只保存 IP 哈希和短期计数，不保存聊天内容或知识库。为 Preview 和 Production 分别配置环境变量后重新部署。不要给密钥变量加 `VITE_` 前缀，也不要提交 `.env.local`。

Production 缺少共享限流配置或 Redis 故障时，聊天接口返回 503；博客正常浏览不受影响。Preview/本地使用单实例内存限流。每个 IP 每自然分钟允许 10 次请求；这不是全站费用上限，仍应在模型账户设置用量告警/预算，并按实际流量调整平台防护。

4. 若 Vercel 控制台已有“全部请求重写到 `/index.html`”的配置，移除它或明确排除 `/api/*`。当前 SSG 输出独立 HTML 页面，仓库启用了 `cleanUrls`，使 `/posts/文章名` 对应生成的 `.html` 文件；没有添加全站 SPA 重写，避免吞掉函数请求。
5. 部署后验证：打开右下角“博客问答” → 问“Nuxt i18n 如何配置？” → 确认逐步出现回答 → 原文链接可打开 → 停止、重试和手机布局正常。

## 本地开发

需要 Node.js 22 和现有 pnpm 7。

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
# 在 .env.local 中填写 GEMINI_API_KEY；不要提交该文件
node scripts/build-knowledge.mjs
pnpm dev:chat
```

另开一个终端运行 `pnpm dev`，访问 `http://localhost:3333`。Vite 将 `/api` 代理到本地 3334 端口，使用与 Vercel 相同的请求处理代码。`dev:chat` 会监听 `.env.local` 和服务端代码变更并自动重启接口；修改模型后不需要手动重启。修改 Markdown 后重新运行索引脚本，索引变化会触发 API 重启。

```sh
pnpm test:chat
pnpm typecheck
pnpm build
```

`test:chat` 使用模拟的 Gemini SSE，不产生模型费用。真实模型端到端验证需要配置有效 API Key，并确认 Google 项目有模型访问权限与可用配额。

## 知识更新与范围

- `scripts/build-knowledge.mjs` 在每次构建时读取 `src/pages/index.md`、`about.md` 和 `posts/*.md`（排除文章目录页）。
- 标题、日期、路径及正文被切成带重叠的片段；构建索引保存在 `server/generated/knowledge.json`，不会复制到网站静态目录，通过 `includeFiles` 随函数发布。
- 设置 frontmatter `ai: false` 或 `draft: true` 可以从 AI 索引排除内容；这不会将已有博客页面变为私密页面。
- 检索使用英文词与中文二字片段，并参考当前页面和近期用户问题。最多选 5 个片段，每篇最多 2 个。第一版没有向量数据库或联网搜索。
- 来源标题、链接和编号来自服务端检索结果；回答正文使用 `[1]` 等编号，正常回答时来源区仅展示正文中有效编号对应的原文链接；回答失败时展示检索到的相关文章，供用户直接阅读。来源是检索参考，模型结论仍需核对原文。
- 聊天正文以纯文本渲染，不执行模型返回的 HTML；Markdown 标记保留为文本。只给服务器提供的站内原文链接生成可点击入口。
- 不保存持久聊天记录。当前页面会话的消息存在 Vue 内存中，刷新页面即清除。请求会把有限历史和检索片段发送给 Google Gemini；免费层可能将输入输出用于产品改进，日志/保留政策按 Google 账户条款执行。
- 单条消息最多 2000 字、请求最多 24 KB、上下文最多 12 条/10000 字、模型输出最多 2400 token，推理级别为 LOW；正文超过 16000 字、超时或上游未正常结束都会显示中断并允许重试。
- 第一版仅支持公开博客问答，不执行操作、不查询私人信息。

## 主要文件

- `src/components/BlogAssistant.vue`：响应式聊天窗口、流式读取、停止/重试、来源链接。
- `api/chat.mjs`：Vercel Web Standard 函数入口。
- `server/chat.mjs`：输入校验、知识上下文、Gemini 调用和 SSE 转发。
- `server/gemini.mjs`：模型调用、错误分类、重试、备用模型与取消等待。
- `server/knowledge.mjs`：轻量检索。
- `server/rate-limit.mjs`：共享限流与本地降级。
- `server/sse.mjs`：处理 UTF-8 和网络分包的 SSE 解析器。
- `test/chat.test.mjs`：检索、流式、校验、异常、取消与限流测试。

接口实现参考：[Vercel Node.js Functions](https://vercel.com/docs/functions/runtimes/node-js)、[Gemini Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite)、[Gemini 流式接口](https://ai.google.dev/api/generate-content#method:-models.streamgeneratecontent)、[Gemini 免费层定价](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite)。


## 重试与失败处理

- 主模型首次请求失败且未输出文字时，对 408/500/502/503/504、网络故障以及明确的短期限流，最多重试两次，约等待 1 秒、2 秒并加入随机延迟；尊重 Google 的 `Retry-After` / `RetryInfo`。等待时显示“服务繁忙，正在重试…”。
- 主模型三次尝试仍失败时，调用备用模型一次。备用与主模型相同则不重复调用，备用为空则关闭切换。所有尝试共用 30 秒总预算，不会为每次重试重新计时；服务建议等待时间超过剩余预算时直接结束。
- 400/401/403/404、内容限制、输出长度限制、每日额度耗尽及无法判定是否短期限流的 429 不重试、不切换，避免重复消耗配额。
- 已输出任何回答文字后，失败时保留原文并提示重新生成，不会接上另一个模型的回答。
- 点击停止或关闭请求连接，立即取消上游请求和退避等待，后续不再调用模型。本地 Vite 代理会销毁对应后端请求；Vercel 函数启用了 `supportsCancellation`，以便断开连接时向接口传递取消信号。
- 检索结果在请求模型前发送给页面；即使模型全部失败，仍显示相关文章链接。无检索结果时不会生成虚构链接。
- 30 秒后显示超时提示；最终繁忙、配额不足或配置错误均显示对应消息。API 在流式连接建立后通过 `error` 事件报告模型失败，客户端不能仅凭 HTTP 200 判断回答成功，应以 `done` 事件为准。
- 原有 `GEMINI_MODEL` 环境变量会覆盖代码默认值。部署此版本时，应在 Vercel 中同步将其改为主模型并添加备用模型变量，然后重新部署。
