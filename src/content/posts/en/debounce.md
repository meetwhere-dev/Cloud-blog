---
title: Debounce & Throttle
description: 
date: 2022-07-19T16:00:00.000+00:00
duration: 12min
lang: en
---

For frequently repeated interactions, we often want many actions to trigger only a few function calls to avoid wasted work and improve the user experience.
For example, mousemove, scroll, resize, and input events fire frequently. If their handlers are expensive, we need to limit how often they run.
There are two ways to do this:

1. Debounce: when a function is called repeatedly, only the last call takes effect.
2. Throttle: when a function is called repeatedly, it runs at spaced intervals.

## Debounce

```javascript
/**
 * 
 * @param fn Function to debounce
 * @param delay Delay
 */
function debounce(fn, delay = 0) {
  // Keep the timer in a closure
  let timer = null;

  // Return a debounced function
  return function (...args) {
    // Cancel the previous timer each time this function runs (if it has not fired yet)
    clearTimeout(timer);
    // Store the new timer
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  }
}

// Usage
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


## Throttle

```js
/**
 *
 * @param fn Function to throttle
 * @param delay Delay
 */
function throttle(fn, delay = 0) {
  // Record when the returned function starts running in the closure.
  let startTime = null
  return function (...args) {
    const now = new Date()
    // Run again based on the time elapsed since the last execution
    if (!startTime || now - startTime > delay) {
      // Update the start time
      startTime = now
      fn(...args)
    }
  }
}

// Alternative implementation
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

// Usage
const _throttleFn = throttle((x) => {
  console.log('x:', x)
})

for (let i = 0; i < 10; i++)
  _throttleFn(i)

document.addEventListener('mousemove', throttle(() => {
  console.log('now:', +new Date())
}, 500))
```
