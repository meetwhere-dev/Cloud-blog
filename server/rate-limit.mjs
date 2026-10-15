import { createHash } from 'node:crypto'

const buckets = new Map()
export async function allowRequest(request, env, fetcher, signal = request.signal) {
  // On Vercel, use its platform-provided client IP header, never a client session ID.
  const ip = request.headers.get('x-vercel-forwarded-for') || 'local'
  const identity = createHash('sha256').update(ip).digest('hex')
  const key = `blog-chat:${identity}:${Math.floor(Date.now() / 60000)}`
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    const response = await fetcher(env.UPSTASH_REDIS_REST_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(['EVAL', 'local n=redis.call(\'INCR\',KEYS[1]); if n==1 then redis.call(\'EXPIRE\',KEYS[1],120) end; return n', '1', key]),
      signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
    })
    if (!response.ok)
      throw new Error('Rate limiter unavailable')
    const data = await response.json()
    if (typeof data.result !== 'number')
      throw new Error('Rate limiter unavailable')
    return data.result <= 10
  }
  // Local/preview fallback only. Production requires a shared counter.
  if (env.VERCEL_ENV === 'production')
    throw new Error('Production rate limiter is not configured')
  const now = Date.now()
  for (const [id, bucket] of buckets) {
    if (bucket.expires <= now)
      buckets.delete(id)
  }
  const bucket = buckets.get(key) || { count: 0, expires: now + 120000 }
  bucket.count++
  buckets.set(key, bucket)
  return bucket.count <= 10
}
