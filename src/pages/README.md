# 页面与路由

此目录下的 `.vue` 和 `.md` 文件通过 `vite-plugin-pages` 生成路由；README 不作为页面发布。

- `index.vue`：个人介绍首页。
- `projects.vue`：作品与交互实验入口。
- `resume.vue`：双语简历与打印布局。
- `posts/`：文章列表和中文文章；同名英文译文放在 `src/content/posts/en/`。
- `games/`：站内游戏页面。
- `[...all].vue`：未找到页面时的返回入口。

文章元数据由 `vite.config.ts` 读取，文章布局与语言切换由 `src/components/Post.vue` 管理。源码可使用 `~/` 引用 `src/` 下的模块。
