---
title: Sorting Algorithms in JavaScript
description: 
date: 2022-07-25T16:00:00.000+00:00
duration: 12min
lang: en
---

Implementing sorting algorithms by hand.


## Bubble Sort
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

## Selection Sort

Scan the array, find the smallest element, and move it to the front. Repeat with the remaining elements.

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

## Insertion Sort

Scan the array, find the smallest element, and move it to the front. Repeat with the remaining elements.
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



## Merge Sort
Split the array into two halves until each group has one element or none. At that point, each group is sorted.
Then repeatedly merge two sorted arrays into one.
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

## Quick Sort
Choose a pivot; the implementation below simply uses the first element. Partition the other elements into two arrays based on the pivot and recurse, returning when an array has one element or none.
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
