---
title: Next.Js
description: Next.Js 体验
date: 2021-09-01T16:00:00.000+00:00
duration: 12min
---

> Next.Js 是一个服务端渲染的 React 框架

[Next.Js 官网](https://nextjs.org/)

由于 React 和 Vue 一样，都是在客户端 下载完资料后，由 JS 生成html 内容，再渲染在客户端页面上。

那么就会有几个问题
1. 不利于 SEO
2. 首次加载速度慢，影响用户体验。

Nextjs 就是为了解决该问题的一个框架，它提前在服务端生成了部分静态页面。

## 简介
```javascript
// 文件夹说明
- componnents // 组件
- lib // 工具库
- pages // 页面
-- _app.js // 该文件 会在每个页面都加载一次
- public // 静态资源
- styles // 样式
```
pages 内 存的是网站的每个页面。

比如我们放一个 pages/index.js 那么这里就是网站主页

我们以官方例子 来讲解 数据的流动

```javascript
// /posts/[id].js
import Layout from '../components/layout'
export default function Post({ postData }) {
  return (
    <Layout>
      {postData.title}
      <br />
      {postData.id}
      <br />
      {postData.date}
    </Layout>
  )
}

import { getAllPostIds, getPostData } from '../../lib/posts'

export async function getStaticProps({ params }) {
  const postData = getPostData(params.id)
  return {
    props: {
      postData
    }
  }
}

export async function getStaticPaths() {
  const paths = getAllPostIds()
  return {
    paths,
    fallback: false
  }
}
```


```javascript
// lib/posts.js
export function getAllPostIds() {
  const fileNames = fs.readdirSync(postsDirectory)

  // Returns an array that looks like this:
  // [
  //   {
  //     params: {
  //       id: 'ssg-ssr'
  //     }
  //   },
  //   {
  //     params: {
  //       id: 'pre-rendering'
  //     }
  //   }
  // ]
  return fileNames.map(fileName => {
    return {
      params: {
        id: fileName.replace(/\.md$/, '')
      }
    }
  })
}

export function getPostData(id) {
  const fullPath = path.join(postsDirectory, `${id}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents)

  // Combine the data with the id
  return {
    id,
    ...matterResult.data
  }
}
```

在服务端 build 的时候
1. 找到 ```/pages/[id].js``` 这是一个动态路由， 其中的 ```[id]``` 代指许多页面，这些页面的路径 是动态生成的。
2. 通过 内的 ```getStaticPaths``` 方法返回的数组，数组内的每个元素都是一个页面的信息，取其中的 ```id``` 作为路由路径，比如数组为 ```[{ id: 123 }, { id: 456 }]``` 将生成 ```/123```,```/456``` 2个页面。
3. ```getStaticPaths``` 方法又通过 引入的 ```getAllPostIds``` 方法 读取文件系统中的 md 文件作为 资料源，生成相应的页面信息。（这一步同样可以 通过连接数据库来获取）

4. ------至此页面的路径有了-----

5. 如果页面不是动态路由生成的,比如这样的一个文件 ```/pages/123.js``` 那么可以不需要 ```getStaticPaths``` 方法

6. 渲染页面所需的数据，通过 ```getStaticProps``` 方法，该方法参数就是 上一步 ```getStaticPaths``` 所提供的每一个元素。

7. 通过 ```getPostData``` 方法 用id 找出该MD 文件，解析它作为页面的资料使用。创建出页面缓存

8. 当客户端请求时 将直接返回缓存文件给他






## 体验
1. 自动根据 ```/pages/``` 内的文件名生成路由 很方便

假如有个文件 ```/pages/123.js```

那么当用户访问 ```example.com/123``` 就会直接路由到 该页面

支持多层级的文件 比如 ```example.com/directory/123```   ===》 ```/pages/directory/123.js```

2. 对于想进一步偷懒的 还可以使用动态路由，自动生成页面路径。方便后续维护

## 踩坑

1. ```conponents``` 内组件 是不能和服务端的资源有交集的，比如 组件内 是不能通过 ```getStaticProps``` 直接获取渲染用的资料的, 如果组件需要用到的资料 都必须是在客户端运行的部分 比如从 ```page``` 那边传过来的数据 或者一些静态数据。
