import { copyFile, mkdir } from 'node:fs/promises'

const source = new URL('../vector-studio/', import.meta.url)
const destination = new URL('../public/vector-studio/', import.meta.url)
await mkdir(destination, { recursive: true })
for (const file of ['index.html', 'studio.css', 'studio.js', 'geometry.mjs', 'favicon.ico'])
  await copyFile(new URL(file, source), new URL(file, destination))
console.log('Vector Studio: synced blog assets')
