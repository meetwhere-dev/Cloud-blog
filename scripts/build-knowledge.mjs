import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import matter from 'gray-matter'

const root = new URL('../src/pages/', import.meta.url)
const files = ['index.md', 'about.md', ...(await readdir(new URL('posts/', root))).filter(name => name.endsWith('.md') && name !== 'index.md').sort().map(name => `posts/${name}`)]
const chunks = []
for (const file of files) {
  const { data, content } = matter(await readFile(new URL(file, root), 'utf8'))
  if (data.draft || data.ai === false || !data.title)
    continue
  // Keep code examples and Markdown links, but never index executable Vue/HTML blocks.
  const text = content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '').trim()
  const path = file === 'index.md' ? '/' : `/${file.replace(/\.md$/, '')}`
  // Overlap preserves context around chunk boundaries, including long code blocks.
  for (let offset = 0; offset < text.length; offset += 1200)
    chunks.push({ title: String(data.title), path, date: data.date ? new Date(data.date).toISOString().slice(0, 10) : '', text: text.slice(offset, offset + 1600) })
}
await mkdir(new URL('../server/generated/', import.meta.url), { recursive: true })
await writeFile(new URL('../server/generated/knowledge.json', import.meta.url), `${JSON.stringify(chunks, null, 2)}\n`)
console.log(`Knowledge: ${files.length} Markdown files, ${chunks.length} chunks`)
