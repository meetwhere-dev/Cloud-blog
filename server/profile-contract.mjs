export const MAX_MESSAGE = 8000
export const MAX_TOTAL = 24000
export const MAX_BYTES = 128 * 1024

export function safePublicUrl(value, allowEmail = false) {
  if (typeof value !== 'string' || /[\s\\]/.test(value))
    return ''
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' && !url.username && !url.password)
      return url.href
    if (allowEmail && /^mailto:[^?@]+@[^?@]+$/.test(value))
      return value
  }
  catch {}
  return ''
}

export function chatPayload(history, text) {
  if (!text.trim() || text.length > MAX_MESSAGE)
    throw new Error('问题或职位描述最多 8,000 字，请缩短后再发送。')
  const messages = [...history.filter(message => message.content.length <= MAX_MESSAGE).slice(-11), { role: 'user', content: text }]
  while (messages.length > 1 && (messages.reduce((sum, message) => sum + message.content.length, 0) > MAX_TOTAL || new TextEncoder().encode(JSON.stringify({ messages })).length > MAX_BYTES))
    messages.shift()
  return messages
}
