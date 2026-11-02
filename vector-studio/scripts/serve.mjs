import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
const root = new URL(process.argv.includes('--dist') ? '../dist/' : '../', import.meta.url)
const port = Number(process.env.PORT || 3340)
const files = new Map([
  ['/index.html', 'text/html; charset=utf-8'],
  ['/studio.css', 'text/css; charset=utf-8'],
  ['/studio.js', 'text/javascript; charset=utf-8'],
  ['/geometry.mjs', 'text/javascript; charset=utf-8'],
  ['/favicon.ico', 'image/x-icon'],
])
const server = createServer(async (req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return
  }
  const pathname = new URL(req.url, 'http://localhost').pathname
  const path = pathname === '/' ? '/index.html' : pathname
  if (!files.has(path)) { res.writeHead(404).end('Not found'); return }
  try {
    const body = await readFile(new URL(path.slice(1), root))
    res.writeHead(200, { 'Content-Type': files.get(path), 'Cache-Control': 'no-store' })
    res.end(req.method === 'HEAD' ? undefined : body)
  } catch {
    res.writeHead(404).end('File not found. For preview, run npm run build first.')
  }
})
server.on('error', error => { console.error(error.message); process.exitCode = 1 })
server.listen(port, '127.0.0.1', () => console.log(`线迹：http://127.0.0.1:${port}`))
