// Handles arbitrary UTF-8 / network boundaries and both LF and CRLF streams.
export async function* readSSE(body) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true })
      while (true) {
        const match = /\r?\n\r?\n/.exec(buffer)
        if (!match)
          break
        const frame = buffer.slice(0, match.index)
        buffer = buffer.slice(match.index + match[0].length)
        const data = frame.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n')
        if (data)
          yield data
      }
      if (buffer.length > 128000)
        throw new Error('Stream frame too large')
      if (done)
        break
    }
    if (buffer.trim())
      throw new Error('Incomplete stream frame')
  }
  finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}

export function encodeEvent(data) {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
}
