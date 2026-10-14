import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import { handleChat } from '../server/chat.mjs'

createServer(async (req, res) => {
  const controller = new AbortController()
  res.on('close', () => {
    if (!res.writableEnded)
      controller.abort()
  })
  try {
    const request = new Request(`http://localhost:3333${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : Readable.toWeb(req),
      duplex: 'half',
      signal: controller.signal,
    })
    const response = req.url === '/api/chat' ? await handleChat(request) : new Response(null, { status: 404 })
    res.writeHead(response.status, Object.fromEntries(response.headers))
    if (response.body)
      Readable.fromWeb(response.body).pipe(res)
    else
      res.end()
  }
  catch {
    res.writeHead(500)
    res.end('Local API error')
  }
}).listen(3334, '127.0.0.1', () => console.log('Chat API: http://127.0.0.1:3334 (proxied by Vite)'))
