---
title: Sorting JS排序算法
description: 
date: 2022-07-25T16:00:00.000+00:00
duration: 12min
---

手写排序算法


## 冒泡排序
```js
function bubbleSort(arr: any) {
  const len = arr.length
  for (let i = len - 1; i > 0; i--) {
    for (let j = 0; j < i; j++) {
      if (arr[j] > arr[j + 1])
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
    }
  }
  return arr
}
```

## 选择排序

｜遍历数组 找出最小的一个 放到最前面，再遍历剩余元素 重复此操作

```js
function selectSort(arr: any) {
  const len = arr.length
  for (let i = 0; i < len; i++) {
    let minIndex = i
    for (let j = i + 1; j < len; j++) {
      if (arr[j] < arr[minIndex])
        minIndex = j
    }
    if (i !== minIndex)
      [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]]
  }
  return arr
}
```

## 插入排序

｜遍历数组 找出最小的一个 放到最前面，再遍历剩余元素 重复此操作
```js
function insertSort(arr: any) {
  const len = arr.length
  for (let i = 1; i < len; i++) {
    for (let j = i - 1; j >= 0; j--) {
      if (arr[i] >= arr[j]) {
        [arr[i], arr[j + 1]] = [arr[j + 1], arr[i]]
        break
      }
      if (j === 0 && arr[i] < arr[j])
        arr.splice(0, 0, arr.splice(i, 1)[0])
    }
  }
  return arr
}
```



## 归并排序
｜将数组对半分2组，分成最小粒度时 组里只有一个元素或者没有元素，此时每个小组都是有序数组
｜然后重复 将2个有序数组拼接成一个数组
```js
function mergeSort(arr: any) {
  const len = arr.length
  if (len < 2)
    return arr
  const center = ~~(len / 2)
  const L = arr.slice(0, center)
  const R = arr.slice(center)
  return merge(mergeSort(L), mergeSort(R))
}

function merge(L: any, R: any) {
  const res = []
  while (L.length || R.length) {
    if (!L.length) {
      res.push(...R)
      break
    }
    else if (!R.length) {
      res.push(...L)
      break
    }
    else { res.push(L[0] < R[0] ? L.shift() : R.shift()) }
  }
  return res
}
```

## 快速排序
｜随机取一个基数，下面算法直接取第一个元素作为基数。以基数分成 小于和大于它的2个数组，递归之，最终粒度只有一个或者没有元素时返回
```js
function quickSort(arr: any) {
  const len = arr.length
  if (len < 2)
    return arr
  const p = arr[0]
  const L = arr.slice(1).filter(num => num <= p)
  const R = arr.slice(1).filter(num => num > p)
  return [...quickSort(L), p, ...quickSort(R)]
}
```