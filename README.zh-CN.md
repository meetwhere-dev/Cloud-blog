# Cloud 博客

万云峰（Cloud Wan）的个人网站，记录前端、全栈开发与 AI 应用实践，展示项目作品、交互实验和个人简历。

[English](./README.md) · 简体中文

## 内容与功能

- 中英文技术文章，使用 Markdown 编写并静态生成。
- 项目作品与交互实验，包括 Vector Studio、Three.js 2048 和烟花实验室。
- 中英文个人简历，支持打印。
- 个人简历 AI：基于公开个人资料回答问题，支持流式输出与来源引用。
- 深浅色主题、语言切换和 PWA 安装。

## 本地开发

使用 Node.js 22.x 和 `package.json` 中指定的 pnpm 版本。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

默认访问 `http://localhost:3333`。开发命令会先同步 Vector Studio 静态资源。

需要调试 AI 助手时，将 `.env.example` 复制为 `.env.local`，填写所需配置，并在另一个终端执行：

```sh
node scripts/build-knowledge.mjs
pnpm dev:chat
```

前端将 `/api` 请求代理到本地 3334 端口。环境变量、模型和生产限流配置见 [个人简历 AI 文档](./docs/blog-assistant.md)。不要提交密钥或本地环境文件。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | 启动前端开发服务 |
| `pnpm dev:chat` | 启动本地 AI 接口 |
| `pnpm build` | 同步作品资源、生成资料索引并构建静态站点 |
| `pnpm preview` | 预览构建产物；不包含 AI 服务端函数 |
| `pnpm lint` | 检查代码风格 |
| `pnpm typecheck` | 检查 Vue 与 TypeScript 类型 |
| `pnpm test:unit --run` | 运行前端单元测试 |
| `pnpm test:chat` | 运行模拟模型的接口与资料测试 |
| `pnpm test:e2e` | 打开 Cypress；需先启动前端服务 |

## 项目结构

- `src/pages/`：首页、文章、作品、简历和游戏路由。
- `src/content/`：英文文章与英文简历。
- `src/components/`：导航、文章布局、文章列表与 AI 助手。
- `locales/`：中文和英文界面文案。
- `knowledge/profile/`：AI 助手的公开个人资料来源。
- `api/`、`server/`：聊天接口、检索、模型调用、限流与可选日志。
- `vector-studio/`：矢量绘图工具源码，通过脚本同步到静态目录。
- `public/`：图标、图片与独立演示资源。
- `scripts/`：资料索引、资源同步和本地服务脚本。
- `test/`、`cypress/`：单元、接口与浏览器测试。

## 内容维护

中文文章放在 `src/pages/posts/`，英文译文放在 `src/content/posts/en/`，两者使用同名文件，并保持日期等元数据一致。作品条目在 `src/pages/projects.vue` 中维护，界面文案通过 `locales/` 管理。

AI 资料维护方式见 [个人资料说明](./knowledge/profile/README.md)。修改资料后重新生成索引；生产构建会自动生成。

## 部署

主站部署在 Vercel，配置见 `vercel.json`：执行 `pnpm build`，静态输出目录为 `dist`，`api/chat.mjs` 作为服务端函数发布。AI 功能还需配置模型服务和生产共享限流，详见 [部署说明](./docs/blog-assistant.md)。

仓库保留 Netlify 与 Docker 静态托管配置，它们不会自动部署 Vercel 聊天函数；完整 AI 功能应使用 Vercel 或另行接入后端。

## 技术与许可

Vue 3、TypeScript、Vite、UnoCSS、vite-ssg、Vue Router、Vue I18n；AI 接口使用 Node.js 和 SSE。

项目起源于 [Vitesse](https://github.com/antfu/vitesse)。保留原始 MIT 版权声明，见 [LICENSE](./LICENSE)。
