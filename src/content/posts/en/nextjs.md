---
title: Next.Js
description: Trying out Next.js
date: 2021-09-01T16:00:00.000+00:00
duration: 12min
lang: en
---

> Next.js is a React framework for server-side rendering.

[Next.js official website](https://nextjs.org/)

Like Vue, React downloads data on the client, generates HTML with JavaScript, and then renders it on the page.

This raises a few issues:
1. It is not ideal for SEO.
2. The initial load is slow, affecting the user experience.

Next.js addresses this by generating some static pages on the server ahead of time.

## Introduction
```javascript
// Directory overview
- componnents // Components
- lib // Utilities
- pages // Pages
-- _app.js // This file is loaded for every page
- public // Static assets
- styles // Styles
```
The pages directory contains the pages of the website.

For example, pages/index.js becomes the home page.

Let us use the official example to explain the data flow.

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

During the server-side build:
1. Locate ```/pages/[id].js```, a dynamic route. The ```[id]``` represents multiple pages whose paths are generated dynamically.
2. Each item in the array returned by ```getStaticPaths``` describes a page. Its ```id``` is used for the route path. For example, ```[{ id: 123 }, { id: 456 }]``` produces the pages ```/123``` and ```/456```.
3. ```getStaticPaths``` calls the imported ```getAllPostIds``` function to read Markdown files from the filesystem and generate page information. A database could also provide this data.

4. At this point, the page paths are available.

5. For a page that does not use a dynamic route, such as ```/pages/123.js```, ```getStaticPaths``` is not required.

6. ```getStaticProps``` supplies the data needed to render each page, using the information provided by ```getStaticPaths``` in the previous step.

7. ```getPostData``` finds the Markdown file by id and parses it as page data, creating a cached page.

8. When the client requests the page, the cached file is returned directly.






## Impressions
1. Generating routes automatically from filenames in ```/pages/``` is convenient.

Given a file named ```/pages/123.js```,

visiting ```example.com/123``` routes directly to that page.

Nested files are supported too: ```example.com/directory/123``` maps to ```/pages/directory/123.js```.

2. Dynamic routes can automate page-path generation further, making future maintenance easier.

## Pitfalls

1. Components in ```conponents``` cannot access server-side resources directly. For example, they cannot use ```getStaticProps``` to fetch their rendering data. They need data available on the client, such as props passed from the ```page``` or static data.
