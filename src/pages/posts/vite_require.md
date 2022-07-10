---
title: Vite 静态资源引入问题
description: 
date: 2022-03-01T16:00:00.000+00:00
duration: 30min
---

最近将公司的项目迁移至 vite + yarn
测试过程中发现 部分静态资源引入失效

报错提示：

```javascript
Uncaught (in promise) ReferenceError: require is not defined
```

原本代码：

```javascript
<img
  :src="require('@/assets/images/tip.png')"
>
```

产生原因是 原项目采用 vue cli 构建，底层用的是 CJS 的写法

而 vite 全面引入 ESM 规范

自然就不兼容 require 的引入方式

解决方法可以通过

### 方法一

```javascript
<script setup>
import imgSrc from '@/assets/images/tip.png';
</script>

<img
  :src="imgSrc"
>
```

### 方法二
将该资源放到 public/images 文件夹下

```javascript
<img
  src="/images/tip.png"
>
```

### 方法三

利用 ESM 的生功能 拼接路径


```javascript
<img
  :src="new URL('./tip.png', import.meta.url).href"
>
```


我们拆解一下 
```javascript
'./tip.png', // 相对 该模块 的位置
import.meta.url // 指向该模块的路径
```
此时 tip.png 就应该放在 相对 该代码所在模块 相对的 './tip.png' 位置 了

该方法无法在 SSR 中使用，毕竟服务器上环境就是 node 了


## 参考
[!importing-asset-as-url](https://vitejs.bootcss.com/guide/assets.html#importing-asset-as-url)
