---
title: input autocomplete 自动填充问题
description: 
date: 2025-03-027T16:00:00.000+00:00
duration: 3min
---

想要触发自动填充
有1个必要条件

1. 需要有一个input type="password" 的元素

当你需要禁止它的自动填充时候

只需要在input元素上加上autocomplete="new-password" 即可

但是它只是不在开始时为你自动填充

它还是会帮你记住并 给你弹窗显示被选项


<form>

  <h2>带自动填充的表单</h2>
  <input
    type="email"
    required
    name="email"
    placeholder="email"
    class="mt-22px w-full h-70px px-16px bg-#F8F9FA rounded-8px border outline-none"
  />
  <input
    type="password"
    required
    name="password"
    placeholder="password"
    class="mt-22px w-full h-70px px-16px bg-#F8F9FA rounded-8px border outline-none"
  />
  <button
    type="submit"
    class="mt-22px w-full h-70px bg-#000000 rounded-8px text-white"
  >
    Login
  </button>
</form>

```html
<form>
  <input
    type="email"
    required
    name="email"
    placeholder="email"
  />
  <input
    type="password"
    required
    name="password"
    placeholder="password"
  />
  <button
    type="submit"
  >
    Login
  </button>
</form>
```


<form>
  <h2>不带自动填充的表单</h2>
  <input
    type="email"
    required
    name="email"
    placeholder="email"
    class="mt-22px w-full h-70px px-16px bg-#F8F9FA rounded-8px border outline-none"
  />
  <input
    type="password"
    required
    name="password"
    autocomplete="new-password"
    placeholder="password"
    class="mt-22px w-full h-70px px-16px bg-#F8F9FA rounded-8px border outline-none"
  />
  <button
    type="submit"
    class="mt-22px w-full h-70px bg-#000000 rounded-8px text-white"
  >
    Login
  </button>
</form>

```html
<form>
  <input
    type="email"
    required
    name="email"
    placeholder="email"
  />
  <input
    type="password"
    required
    name="password"
    autocomplete="new-password"
    placeholder="password"
  />
  <button
    type="submit"
  >
    Login
  </button>
</form>
```


## 参考
[如何关闭表单自动填充](https://developer.mozilla.org/zh-CN/docs/Web/Security/Practical_implementation_guides/Turning_off_form_autocompletion)
