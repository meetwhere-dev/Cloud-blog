# 界面语言

`zh-CN.yml` 和 `en.yml` 分别维护中文与英文界面文案，由 `src/modules/i18n.ts` 自动加载。

新增文案时同步维护两种语言的键。文章译文放在 `src/content/posts/en/`，英文简历放在 `src/content/resume.en.md`，不放在界面语言文件中。

AI 助手的按钮和状态跟随界面语言；回答语言由访客问题决定，详见 `docs/blog-assistant.md`。
