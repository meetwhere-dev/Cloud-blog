---
title: Nuxt 3 X I18n 配置及bug
description: 
date: 2022-10-28T16:00:00.000+00:00
duration: 5min
---

[I18n官网](https://i18n.nuxtjs.org/)


目前 I18n 对 nuxt3 还在适配中，
其中发现 几个 I18n 不能正常使用的问题

1. nuxt3项目内必须要有 pages 文件夹，否则i18n工作不正常
2. I18n 需要更新到8.0.0以上 才能支持 nuxt3（虽然它官网还是7.3）
3. 不能自动侦测客户端语言

[最小配置案例](https://github.com/meetwhere-dev/nuxt3-i18n-start-template)

其中第三个问题相关源码片段如下

```javascript
// detectBrowserLanguage.js 的源码片段

  if (!useCookie) {
    // 当设置 useCooki: false 时 才会去获取浏览器默认语言
    matchedLocale = getBrowserLocale(nuxtI18nInternalOptions, context);
  }
  __DEBUG__ && console.log("detectBrowserLanguage matchedLocale", matchedLocale);
  const finalLocale = matchedLocale || fallbackLocale;
  const vueI18nLocale = locale || nuxtI18nOptions.vueI18n.locale;
  __DEBUG__ && console.log("detectBrowserLanguage first finaleLocale", finalLocale);
  __DEBUG__ && console.log("detectBrowserLanguage vueI18nLocale", vueI18nLocale);

  // 下面逻辑不知为何这样设置，总体看下来 只有将配置改为 
  // useCookie:false
  // strategy: "no_prefix"
  // 才能默认取浏览器的语言
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

最终的配置项：
```javascript
// ./nuxt.config.js

import { defineNuxtConfig } from 'nuxt/config'
// import asd from '@nuxtjs/i18n'
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/i18n' // 加载 i18n 模块
  ],
  i18n: {
    locales: [
      { code: 'cn', iso: 'cn', file: 'cn.json' },
      { code: 'zh', iso: 'zh', file: 'zh.json' },
      { code: 'en', iso: 'en', file: 'en.json' },
      { code: 'zh-CN', iso: 'zh-CN', file: 'zh-CN.json' }
    ],
    langDir: 'i18n/', // 存放语言文件的地方
    defaultLocale: 'en', // 默认语言
    lazy: true, // 懒加载，被使用到的时候才去请求该语言文件
    strategy: 'no_prefix', // 我不需要生成多语言路由,且它的默认设置会影响自动侦测客户端语言 所以设为 no_prefix 其他设置请参考 https://i18n.nuxtjs.org/strategies
    detectBrowserLanguage: { // 自动侦测语言，如果是服务端渲染时，会从请求头中获取；如果在客户端会通过 navigator.language 获取；
      useCookie: false, // 优先从 cookie 中获取 使用的语言 该选择设置为 true 时将不会自动侦测客户端语言，只会从cookies中获取 取不到会取默认值
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',  // recommended 仅在根路径才会侦测
    },
    vueI18n: {
      legacy: false,
      locale: 'en',
      fallbackLocale: 'en',
    }
  }
})
```
