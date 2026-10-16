import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import matter from 'gray-matter'
import { safePublicUrl } from '../server/profile-contract.mjs'

export async function buildKnowledge(root = new URL('../knowledge/profile/', import.meta.url)) {
  const chunks = []
  const ids = new Set()
  async function visit(directory) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory)
      if (entry.isDirectory()) {
        await visit(file)
        continue
      }
      if (!entry.isFile() || !entry.name.endsWith('.md'))
        continue
      const { data, content } = matter(await readFile(file, 'utf8'))
      if (data.status !== 'published')
        continue
      const text = content.replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '').trim()
      if (!text.replace(/[#*\s-]/g, ''))
        continue
      if (!/^[a-z0-9][a-z0-9-]*$/.test(data.id || '') || !data.title || !['overview', 'resume', 'experience', 'project', 'achievement', 'contact'].includes(data.type))
        throw new Error(`Invalid published profile metadata: ${entry.name}`)
      if (ids.has(data.id))
        throw new Error(`Duplicate profile id: ${data.id}`)
      ids.add(data.id)
      const links = (Array.isArray(data.links) ? data.links : []).map(link => ({ label: String(link.label || '公开链接'), url: safePublicUrl(link.url) })).filter(link => link.url)
      const contact = data.type === 'contact' ? safePublicUrl(data.contact, true) : ''
      for (let offset = 0; offset < text.length; offset += 1200)
        chunks.push({ id: data.id, title: String(data.title), type: data.type, skills: Array.isArray(data.skills) ? data.skills.map(String) : [], text: text.slice(offset, offset + 1600), links, ...(contact ? { contact } : {}) })
    }
  }
  await visit(root)
  return chunks
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const chunks = await buildKnowledge()
  await mkdir(new URL('../server/generated/', import.meta.url), { recursive: true })
  await writeFile(new URL('../server/generated/knowledge.json', import.meta.url), `${JSON.stringify(chunks, null, 2)}\n`)
  console.log(`Profile knowledge: ${chunks.length} chunks`)
}
