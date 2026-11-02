import { randomUUID } from 'node:crypto'

export function normalizeChatId(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value.toLowerCase() : randomUUID()
}

export function d1Configured(env) {
  return env.CHAT_LOG_ENABLED === 'true'
    && /^[0-9a-f]{32}$/i.test(env.CLOUDFLARE_ACCOUNT_ID || '')
    && /^[0-9a-f-]{36}$/i.test(env.CLOUDFLARE_D1_DATABASE_ID || '')
    && !!env.CLOUDFLARE_API_TOKEN
}

export async function queryD1(env, sql, params = [], { fetcher = fetch, timeoutMs = 3000 } = {}) {
  if (!/^[0-9a-f]{32}$/i.test(env.CLOUDFLARE_ACCOUNT_ID || '') || !/^[0-9a-f-]{36}$/i.test(env.CLOUDFLARE_D1_DATABASE_ID || '') || !env.CLOUDFLARE_API_TOKEN)
    throw new Error('Missing or invalid Cloudflare D1 configuration')
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${env.CLOUDFLARE_D1_DATABASE_ID}/query`
  // This signal must not inherit the chat request's cancellation: partial replies still need saving.
  const response = await fetcher(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, params }),
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!response.ok)
    throw new Error(`D1 request failed (HTTP ${response.status})`)
  const data = await response.json()
  if (data.success !== true || !Array.isArray(data.result) || !data.result.length || data.result.some(result => result.success !== true))
    throw new Error('D1 query failed')
  return data.result
}

export const UPSERT_TURN = `INSERT INTO chat_turns
(id, conversation_id, question_id, user_message, assistant_message, status, model, interface_locale, source_ids, error_code, started_at, finished_at, duration_ms)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET assistant_message = excluded.assistant_message, status = excluded.status,
model = excluded.model, error_code = excluded.error_code, finished_at = excluded.finished_at, duration_ms = excluded.duration_ms`

// One row per server request; upstream retries update that row, user retries create a new attempt.
export function startChatLog({ env, fetcher = fetch, waitUntil, conversationId, questionId, question, locale, sourceIds, startedAt, model, warn = console.warn }) {
  if (!d1Configured(env))
    return { finish: async () => {} }
  const id = randomUUID()
  let resolveLifetime
  const lifetime = new Promise((resolve) => { resolveLifetime = resolve })
  // Register before starting the stream, so Vercel keeps cancellation cleanup alive.
  waitUntil?.(lifetime)
  const write = async (answer, status, activeModel, errorCode, finishedAt) => {
    try {
      await queryD1(env, UPSERT_TURN, [id, conversationId, questionId, question, answer, status, activeModel, locale, JSON.stringify(sourceIds), errorCode, startedAt, finishedAt, finishedAt === null ? null : Math.max(0, finishedAt - startedAt)], { fetcher })
    }
    catch {
      // Never log the question, reply, API token or provider response to application logs.
      warn('[chat-log] D1 write failed; check configuration and database availability.')
    }
  }
  const initialWrite = write('', 'generating', model, '', null)
  let finished
  return {
    finish({ answer, status, model: activeModel, errorCode = '' }) {
      if (!finished) {
        const finishedAt = Date.now()
        finished = initialWrite.then(() => write(answer, status, activeModel, errorCode, finishedAt)).finally(() => resolveLifetime())
      }
      return finished
    },
  }
}
