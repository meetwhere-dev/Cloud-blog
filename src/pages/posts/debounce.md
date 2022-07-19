---
title: Debounce & Throttle
description: 
date: 2022-07-19T16:00:00.000+00:00
duration: 12min
---

在一些频繁操作的情景下，为了避免性能浪费，提升用户体验，我们会希望多次操作仅触发少量次数。
例如：mousemove，scroll，resize，input 等事件触发的次数会比较频繁，如果它们绑定的事件性能开销比较大，就需要进行限制其触发频率。
那么有两种方式可以达到这样的目的

1，Debounce 防抖：多次执行同一个函数，使最后一次执行生效
2，Throttle 节流；多次执行同一个函数，会间隔一段时间执行

## Debounce 防抖

```javascript
/**
 * 
 * @param fn 要防抖的函数
 * @param delay 延迟时间
 */
function debounce(fn, delay = 0) {
  // 利用闭包将清除事件存起来
  let timer = null;

  // 返回一个防抖函数
  return function (...args) {
    // 每次执行该防抖函数，先清除上一次的（如果上一次还没开始执行 上一次就不用执行了）
    clearTimeout(timer);
    // 将新的timer 存起来
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  }
}

// 用法
const _debounceFn = debounce(function (x) {
  console.log('x:', x);
})

for (let i = 0; i < 10; i++) {
  _debounceFn(i)
}

document.addEventListener('mousemove', debounce(function () {
  console.log('now:', new Date());
}, 500));
```


## Throttle 节流

```js
/**
 *
 * @param fn 要节流的函数
 * @param delay 延迟时间
 */
function throttle(fn, delay = 0) {
  // 闭包内记录下 返回的函数 开始执行的时间。
  let startTime = null
  return function (...args) {
    const now = new Date()
    // 根据与上次执行的时间差再次执行该函数
    if (!startTime || now - startTime > delay) {
      // 刷新开始执行时间
      startTime = now
      fn(...args)
    }
  }
}

// 写法2
function throttle2(fn, delay = 0) {
  let timer = null
  return function (...args) {
    if (timer)
      return
    timer = setTimeout(() => {
      fn(...args)
      clearTimeout(timer)
    }, delay)
  }
}

// 用法
const _throttleFn = throttle((x) => {
  console.log('x:', x)
})

for (let i = 0; i < 10; i++)
  _throttleFn(i)

document.addEventListener('mousemove', throttle(() => {
  console.log('now:', +new Date())
}, 500))
```