---
title: Importing Static Assets in Vite
description: 
date: 2022-03-01T16:00:00.000+00:00
duration: 10min
lang: en
---

I recently migrated a company project to vite + yarn.
During testing, I found that some static asset imports no longer worked.

Error message:

```javascript
Uncaught (in promise) ReferenceError: require is not defined
```

Original code:

```javascript
<img
  :src="require('@/assets/images/tip.png')"
>
```

The original project was built with Vue CLI and used CJS-style imports.

Vite fully adopts the ESM standard,

so the require-based approach is not compatible.

Here are a few ways to resolve this:

### Method 1

```javascript
<script setup>
import imgSrc from '@/assets/images/tip.png';
</script>

<img
  :src="imgSrc"
>
```

### Method 2
Place the asset in the public/images folder.

```javascript
<img
  src="/images/tip.png"
>
```

### Method 3

Use native ESM functionality to construct the path.


```javascript
<img
  :src="new URL('./tip.png', import.meta.url).href"
>
```


Let us break this down: 
```javascript
'./tip.png', // Location relative to this module
import.meta.url // Path to this module
```
The tip.png file should be placed at './tip.png' relative to the module containing this code.

This method cannot be used in SSR, since the server environment is Node.


## References
[!importing-asset-as-url](https://vitejs.bootcss.com/guide/assets.html#importing-asset-as-url)
