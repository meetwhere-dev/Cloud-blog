# Cloud Blog

Cloud Wan’s personal website: writing about frontend engineering, full-stack development and AI applications, alongside projects, interactive experiments and a resume.

English · [简体中文](./README.zh-CN.md)

## Features

- Bilingual Markdown articles with static-site generation.
- Project showcase and interactive demos, including Vector Studio, Three.js 2048 and Fireworks Studio.
- Chinese and English resume with print support.
- Resume AI assistant grounded in public profile material, with streaming answers and source references.
- Light and dark themes, language switching and PWA installation.

## Development

Use Node.js 22.x and the pnpm version specified in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3333`. The development command synchronizes Vector Studio assets before starting Vite.

For the AI assistant, copy `.env.example` to `.env.local`, configure the required environment variables and run these commands in another terminal:

```sh
node scripts/build-knowledge.mjs
pnpm dev:chat
```

Vite proxies `/api` to port 3334. See the [assistant documentation](./docs/blog-assistant.md) for model, environment and production rate-limit configuration. Never commit credentials or local environment files.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the frontend development server |
| `pnpm dev:chat` | Start the local chat API |
| `pnpm build` | Synchronize demo assets, index profile material and build the static site |
| `pnpm preview` | Preview the static build without the chat function |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Check Vue and TypeScript types |
| `pnpm test:unit --run` | Run frontend unit tests |
| `pnpm test:chat` | Run API and profile tests with mocked model responses |
| `pnpm test:e2e` | Open Cypress after starting the frontend server |

## Structure and content

- `src/pages/`: home, articles, projects, resume and game routes.
- `src/content/`: English articles and resume.
- `src/components/`: navigation, article layout, post list and AI assistant.
- `locales/`: Chinese and English interface text.
- `knowledge/profile/`: public profile material for the AI assistant.
- `api/` and `server/`: chat endpoint, retrieval, model calls, rate limiting and optional logging.
- `vector-studio/`: drawing tool source synchronized into static assets.
- `public/`: icons, images and standalone demos.
- `scripts/`: indexing, asset synchronization and local server scripts.
- `test/` and `cypress/`: unit, API and browser tests.

Add Chinese articles to `src/pages/posts/` and matching English translations to `src/content/posts/en/`, using the same filename and consistent date metadata. Maintain project entries in `src/pages/projects.vue` and interface copy in `locales/`.

Follow the [profile guide](./knowledge/profile/README.md) when updating AI source material. Rebuild the index after changes; production builds do this automatically.

## Deployment

The primary deployment is Vercel. `vercel.json` configures `pnpm build`, the `dist` output directory and the `api/chat.mjs` server function. Configure the model service and shared production rate limiter as described in the [deployment guide](./docs/blog-assistant.md).

The repository also retains Netlify and Docker configurations for static hosting. These do not deploy the Vercel chat function; use Vercel or connect a separate backend for the full AI experience.

## Stack and license

Vue 3, TypeScript, Vite, UnoCSS, vite-ssg, Vue Router and Vue I18n. The AI endpoint uses Node.js and SSE.

Originally based on [Vitesse](https://github.com/antfu/vitesse). The original MIT copyright notice is retained in [LICENSE](./LICENSE).
