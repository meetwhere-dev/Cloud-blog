import { readSSE } from './sse.mjs'

export class ModelError extends Error {
  constructor(code, retryable = false, retryAfterMs = 0) {
    super(code)
    this.code = code
    this.retryable = retryable
    this.retryAfterMs = retryAfterMs
  }
}

export function abortableSleep(ms, signal) {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted()
    let timer
    const onAbort = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', onAbort)
      reject(signal.reason)
    }
    timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

function classifyError(status, payload, headers = new Headers()) {
  // Examine provider metadata only for classification; never forward raw errors or keys.
  const retryHeader = headers.get('retry-after')
  const headerMs = retryHeader
    ? (/^\d+(\.\d+)?$/.test(retryHeader) ? Number(retryHeader) * 1000 : Date.parse(retryHeader) - Date.now())
    : 0
  if (status === 429) {
    const detail = JSON.stringify(payload.error || {}).toLowerCase()
    const daily = /perday|per_day|per day|daily|\brpd\b|quota_exceeded/.test(detail)
    const minute = /perminute|per_minute|per minute|persecond|per second|rate_limit_exceeded/.test(detail)
    const retryInfo = payload.error?.details?.find(item => item['@type']?.endsWith('RetryInfo'))
    const retrySeconds = Number.parseFloat(retryInfo?.retryDelay || '')
    const delayMs = Math.max(0, Number.isFinite(retrySeconds) ? retrySeconds * 1000 : 0, Number.isFinite(headerMs) ? headerMs : 0)
    if (daily || (!minute && !retryInfo && !retryHeader))
      return new ModelError('quota')
    return new ModelError('rate_limit', true, delayMs)
  }
  if ([408, 500, 502, 503, 504].includes(status))
    return new ModelError('unavailable', true, Number.isFinite(headerMs) ? Math.max(0, headerMs) : 0)
  return new ModelError('configuration')
}

export function failureMessage(cause, signal, partial = false, hasSources = true) {
  const hint = hasSources ? '或先阅读下方资料' : ''
  if (signal.aborted && signal.reason?.name === 'TimeoutError')
    return partial ? `回答超时，已保留生成内容。请重新生成${hint}。` : `等待回答超时，请稍后重试${hint}。`
  if (partial)
    return `回答中断，已保留生成内容。请重新生成${hint}。`
  if (cause?.code === 'quota')
    return `模型调用额度不足，请等待配额恢复${hint}。`
  if (cause?.code === 'rate_limit')
    return `提问较多，暂时无法生成回答。请稍后重试${hint}。`
  if (cause?.code === 'blocked')
    return `模型未能回答这个问题，请调整问题${hint}。`
  if (cause?.code === 'length')
    return `回答超过长度限制，请缩短问题${hint}。`
  if (cause?.code === 'configuration')
    return `模型服务配置暂时不可用，请稍后再试${hint}。`
  return `服务暂时繁忙，请稍后重试${hint}。`
}

export async function generateAnswer({ key, models, body, signal, fetcher, onText, onStatus, sleep = abortableSleep, random = Math.random, deadline }) {
  let receivedText = false
  let outputSize = 0
  let lastError = new ModelError('unavailable', true)
  for (let modelIndex = 0; modelIndex < models.length; modelIndex++) {
    const model = models[modelIndex]
    if (!/^[a-z0-9.-]+$/.test(model))
      throw new ModelError('configuration')
    if (modelIndex)
      onStatus('正在尝试备用服务…')
    const attempts = modelIndex === 0 ? 3 : 1
    for (let attempt = 0; attempt < attempts; attempt++) {
      signal.throwIfAborted()
      try {
        let response
        try {
          response = await fetcher(new URL(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`), {
            method: 'POST',
            headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal,
          })
        }
        catch (cause) {
          if (signal.aborted)
            throw cause
          throw new ModelError('unavailable', true)
        }
        if (!response.ok)
          throw classifyError(response.status, await response.json().catch(() => ({})), response.headers)
        if (!response.body)
          throw new ModelError('unavailable', true)
        let finished = false
        try {
          for await (const data of readSSE(response.body)) {
            const event = JSON.parse(data)
            if (event.error) {
              const status = Number(event.error.code) || ({ RESOURCE_EXHAUSTED: 429, UNAVAILABLE: 503, INVALID_ARGUMENT: 400, PERMISSION_DENIED: 403 })[event.error.status] || 500
              throw classifyError(status, { error: event.error })
            }
            if (event.promptFeedback?.blockReason)
              throw new ModelError('blocked')
            const candidate = event.candidates?.[0]
            if (candidate?.finishReason && candidate.finishReason !== 'STOP')
              throw new ModelError(candidate.finishReason === 'MAX_TOKENS' ? 'length' : 'blocked')
            for (const part of candidate?.content?.parts || []) {
              if (part.thought || typeof part.text !== 'string' || !part.text)
                continue
              outputSize += part.text.length
              if (outputSize > 16000)
                throw new ModelError('length')
              receivedText = true
              onText(part.text)
            }
            if (candidate?.finishReason === 'STOP') {
              finished = true
              break
            }
          }
        }
        catch (cause) {
          if (cause instanceof ModelError || signal.aborted)
            throw cause
          throw new ModelError('unavailable', true)
        }
        if (!finished || !receivedText)
          throw new ModelError('unavailable', true)
        return
      }
      catch (cause) {
        if (signal.aborted || receivedText || !(cause instanceof ModelError) || !cause.retryable)
          throw cause
        lastError = cause
        if (attempt + 1 < attempts) {
          const delay = Math.max((2 ** attempt) * 1000 + Math.floor(random() * 300), cause.retryAfterMs)
          // Never retry sooner than Retry-After, or keep a request alive past its budget.
          if (Date.now() + delay >= deadline)
            throw cause
          onStatus('服务繁忙，正在重试…')
          await sleep(delay, signal)
        }
      }
    }
  }
  throw lastError
}
