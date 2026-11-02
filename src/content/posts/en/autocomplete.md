---
title: Input Autocomplete Issues
description: 
date: 2025-03-02T16:00:00.000+00:00
duration: 3min
lang: en
---

To trigger autofill, there is one prerequisite:

1. There needs to be an input element with type="password".

When you want to disable autofill,

add autocomplete="new-password" to the input element.

However, this only stops it from filling in the field initially.

The browser will still remember values and show them as suggestions in a popup.


<form>

  <h2>Form with autofill</h2>
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
  <h2>Form without autofill</h2>
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


## References
[How to turn off form autocompletion](https://developer.mozilla.org/zh-CN/docs/Web/Security/Practical_implementation_guides/Turning_off_form_autocompletion)
