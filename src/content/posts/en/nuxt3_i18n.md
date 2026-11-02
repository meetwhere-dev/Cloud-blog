---
title: Nuxt 3 and I18n Configuration and Bugs
description: 
date: 2022-10-28T16:00:00.000+00:00
duration: 5min
lang: en
---

[I18n official website](https://i18n.nuxtjs.org/)


At the time of writing, I18n support for Nuxt 3 is still being adapted.
I encountered several issues that prevent I18n from working properly:

1. A Nuxt 3 project must have a pages folder; otherwise, i18n does not work properly.
2. I18n needs to be updated to version 8.0.0 or later to support Nuxt 3 (although the official website still shows 7.3).
3. The client language is not detected automatically.

[Minimal configuration example](https://github.com/meetwhere-dev/nuxt3-i18n-start-template)

Here is the source code related to the third issue:

```javascript
// Excerpt from detectBrowserLanguage.js

  if (!useCookie) {
    // The default browser language is only retrieved when useCookie is false
    matchedLocale = getBrowserLocale(nuxtI18nInternalOptions, context);
  }
  __DEBUG__ && console.log("detectBrowserLanguage matchedLocale", matchedLocale);
  const finalLocale = matchedLocale || fallbackLocale;
  const vueI18nLocale = locale || nuxtI18nOptions.vueI18n.locale;
  __DEBUG__ && console.log("detectBrowserLanguage first finaleLocale", finalLocale);
  __DEBUG__ && console.log("detectBrowserLanguage vueI18nLocale", vueI18nLocale);

  // I am not sure why the logic below is written this way. It appears that only these settings 
  // useCookie:false
  // strategy: "no_prefix"
  // allow the browser language to be used by default
  if (finalLocale && (!useCookie || alwaysRedirect || !cookieLocale)) {
    if (strategy === "no_prefix") {
      return finalLocale;
    } else {
      if (finalLocale !== vueI18nLocale && path !== "/") {
        __DEBUG__ && console.log("detectBrowserLanguage finalLocale !== vueI18nLocale", finalLocale);
        return finalLocale;
      }
    }
  }
  return "";
```

Final configuration:
```javascript
// ./nuxt.config.js

import { defineNuxtConfig } from 'nuxt/config'
// import asd from '@nuxtjs/i18n'
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/i18n' // Load the i18n module
  ],
  i18n: {
    locales: [
      { code: 'cn', iso: 'cn', file: 'cn.json' },
      { code: 'zh', iso: 'zh', file: 'zh.json' },
      { code: 'en', iso: 'en', file: 'en.json' },
      { code: 'zh-CN', iso: 'zh-CN', file: 'zh-CN.json' }
    ],
    langDir: 'i18n/', // Directory containing locale files
    defaultLocale: 'en', // Default language
    lazy: true, // Lazy-load locale files when needed
    strategy: 'no_prefix', // I do not need localized routes, and the default affects client language detection, so I use no_prefix. For other settings, see https://i18n.nuxtjs.org/strategies
    detectBrowserLanguage: { // Detect the language from request headers during SSR or from navigator.language on the client
      useCookie: false, // Prefer the language stored in cookies. When true, this reads cookies instead of detecting the client language and falls back to the default if unavailable
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',  // recommended: detect only at the root path
    },
    vueI18n: {
      legacy: false,
      locale: 'en',
      fallbackLocale: 'en',
    }
  }
})
```
