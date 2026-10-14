<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { readSSE } from '../../server/sse.mjs'

interface Source { title: string; path: string; date?: string }
interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  sources: Source[]
  state: 'complete' | 'loading' | 'error' | 'stopped'
}
const route = useRoute()
const open = ref(false)
const question = ref('')
const busy = ref(false)
const error = ref('')
const messages = ref<Message[]>([])
const input = ref<HTMLTextAreaElement>()
const panel = ref<HTMLElement>()
const launcher = ref<HTMLButtonElement>()
const transcript = ref<HTMLElement>()
const suggestions = ['介绍一下博客作者', '有哪些关于 Vue 和 Nuxt 的文章？', 'Vite 如何引入静态资源？']
let request: AbortController | undefined
let nextId = 0

watch(open, async (visible) => {
  await nextTick()
  if (visible)
    input.value?.focus()
  else
    launcher.value?.focus()
})
watch(() => messages.value.map(message => message.content).join('') + busy.value, async () => {
  const element = transcript.value
  const nearBottom = element && element.scrollHeight - element.scrollTop - element.clientHeight < 120
  await nextTick()
  if (nearBottom && element)
    element.scrollTop = element.scrollHeight
})
onBeforeUnmount(() => request?.abort())

function citedSources(message: Message) {
  const cited = new Set(Array.from(message.content.matchAll(/\[([1-9]\d*)\]/g), match => Number(match[1])))
  return message.sources.map((source, index) => ({ ...source, number: index + 1 })).filter(source => cited.has(source.number))
}
function stop() {
  request?.abort()
}
function reset() {
  if (busy.value)
    return
  messages.value = []
  error.value = ''
  input.value?.focus()
}
function keyboard(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    open.value = false
    return
  }
  if (event.key !== 'Tab')
    return
  const elements = Array.from(panel.value?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], textarea:not(:disabled)') || [])
  const first = elements[0]
  const last = elements[elements.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  }
  else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}
async function send(value = question.value, retry = false) {
  const text = value.trim()
  if (busy.value || !text || text.length > 2000)
    return
  error.value = ''
  if (retry) {
    const failed = messages.value[messages.value.length - 1]
    if (failed?.role === 'assistant' && failed.state !== 'complete')
      messages.value.pop()
  }
  else {
    messages.value.push({ id: ++nextId, role: 'user', content: text, sources: [], state: 'complete' })
  }
  question.value = ''
  // Only successful exchanges go back to the model, within the server's context budget.
  const history = messages.value.slice(0, -1).filter(message => message.state === 'complete').slice(-8)
    .map(({ role, content }) => ({ role, content: content.slice(0, 900) }))
  const payload = [...history, { role: 'user', content: text }]
  messages.value.push({ id: ++nextId, role: 'assistant', content: '', sources: [], state: 'loading' })
  const answer = messages.value[messages.value.length - 1]
  busy.value = true
  request = new AbortController()
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: payload, currentPath: route.path }),
      signal: request.signal,
    })
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body.error || '暂时无法连接问答助手，请稍后重试。')
    }
    if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream'))
      throw new Error('未收到有效回答，请重试。')
    let completed = false
    for await (const data of readSSE(response.body)) {
      const event = JSON.parse(data)
      if (event.type === 'sources')
        answer.sources = event.sources.filter((source: Source) => typeof source.path === 'string' && /^\/(?!\/)/.test(source.path) && !/[\\\s]/.test(source.path))

      else if (event.type === 'delta')
        answer.content += event.text

      else if (event.type === 'error')
        throw new Error(event.message)

      else if (event.type === 'done')
        completed = true
    }
    if (!completed)
      throw new Error('回答中断，请重试。')
    answer.state = 'complete'
  }
  catch (cause) {
    if (request.signal.aborted) {
      answer.state = 'stopped'
      error.value = '已停止生成。'
    }
    else {
      answer.state = 'error'
      error.value = cause instanceof Error ? cause.message : '请求失败，请重试。'
    }
  }
  finally {
    busy.value = false
    request = undefined
    await nextTick()
    input.value?.focus()
  }
}
function retry() {
  const lastQuestion = [...messages.value].reverse().find(message => message.role === 'user')
  if (lastQuestion)
    send(lastQuestion.content, true)
}
</script>

<template>
  <div class="blog-assistant">
    <button v-if="!open" ref="launcher" class="assistant-launcher" aria-haspopup="dialog" aria-controls="blog-assistant-panel" :aria-expanded="open" @click="open = true">
      <span aria-hidden="true">✦</span> 博客问答
    </button>
    <section v-if="open" id="blog-assistant-panel" ref="panel" class="assistant-panel" role="dialog" aria-modal="true" aria-labelledby="assistant-title" @keydown="keyboard">
      <header class="assistant-header">
        <div>
          <div class="assistant-eyebrow">
            CLOUD’S BLOG
          </div>
          <h2 id="assistant-title">
            博客问答助手 <span aria-hidden="true">✦</span>
          </h2>
        </div>
        <div class="assistant-actions">
          <button :disabled="busy" title="开启新对话" aria-label="开启新对话" @click="reset">
            ↻
          </button>
          <button title="关闭问答助手" aria-label="关闭问答助手" @click="open = false">
            ×
          </button>
        </div>
      </header>
      <div ref="transcript" class="assistant-transcript">
        <div v-if="!messages.length" class="assistant-welcome">
          <div class="assistant-spark" aria-hidden="true">
            ✦
          </div>
          <h3>从一个问题开始</h3>
          <p>想了解作者，或找一篇技术文章？<br>我会从这个博客的公开内容中寻找答案。</p>
          <button v-for="suggestion in suggestions" :key="suggestion" class="assistant-suggestion" @click="send(suggestion)">
            {{ suggestion }} <span aria-hidden="true">↗</span>
          </button>
        </div>
        <ol v-else class="assistant-messages" aria-label="对话记录">
          <li v-for="message in messages" :key="message.id" class="assistant-message" :class="[message.role]">
            <span class="assistant-role">{{ message.role === 'user' ? '你' : '博客助手' }}</span>
            <div class="assistant-content">
              {{ message.content || (message.state === 'loading' ? '正在查阅博客…' : '未生成回答') }}
            </div>
            <div v-if="citedSources(message).length" class="assistant-sources">
              <span>参考原文</span>
              <a v-for="source in citedSources(message)" :key="source.path" :href="source.path" target="_blank" rel="noopener noreferrer">[{{ source.number }}] {{ source.title }} <small v-if="source.date">{{ source.date }}</small> ↗</a>
            </div>
            <small v-if="message.state === 'stopped' || message.state === 'error'" class="assistant-incomplete">{{ message.state === 'stopped' ? '已停止 · 回答可能不完整' : '生成失败 · 回答可能不完整' }}</small>
          </li>
        </ol>
      </div>
      <div class="assistant-status" role="status" aria-live="polite">
        <template v-if="error">
          {{ error }} <button v-if="!busy" @click="retry">
            重新尝试
          </button>
        </template>
        <template v-else-if="busy">
          正在生成回答…
        </template>
      </div>
      <form class="assistant-form" @submit.prevent="send()">
        <label class="sr-only" for="assistant-question">输入博客相关问题</label>
        <textarea id="assistant-question" ref="input" v-model="question" rows="2" maxlength="2000" :disabled="busy" placeholder="问问博客里的内容…" @keydown.enter.exact="!$event.isComposing && ($event.preventDefault(), send())" />
        <button v-if="busy" type="button" class="assistant-send" @click="stop">
          停止
        </button>
        <button v-else type="submit" class="assistant-send" :disabled="!question.trim()">
          发送 ↑
        </button>
      </form>
      <p class="assistant-disclaimer">
        AI 回答仅供参考，请以原文为准。问题将发送给模型服务，请勿输入敏感信息。
      </p>
    </section>
  </div>
</template>

<style scoped>
.blog-assistant { --chat-bg: #fff; --chat-soft: #f4f7f6; --chat-text: #243b37; --chat-muted: #6b7d78; --chat-line: #dde7e3; --chat-accent: #0f766e; position: fixed; right: 24px; bottom: 24px; z-index: 1000; color: var(--chat-text); text-align: left; font-size: 14px; line-height: 1.6; }
:global(html.dark) .blog-assistant { --chat-bg: #17211f; --chat-soft: #202e2a; --chat-text: #e1ece7; --chat-muted: #9eafa7; --chat-line: #34463e; --chat-accent: #5ed3bc; }
button { cursor: pointer; font: inherit; }
button:disabled { cursor: default; opacity: .45; }
button:focus-visible, a:focus-visible, textarea:focus-visible { outline: 2px solid var(--chat-accent); outline-offset: 3px; }
.assistant-launcher { background: var(--chat-accent); color: var(--chat-bg); border-radius: 30px; padding: 13px 20px; box-shadow: 0 6px 24px #0002; font-weight: 600; }
.assistant-launcher span { margin-right: 8px; }
.assistant-panel { width: 400px; height: min(680px, calc(100dvh - 48px)); max-height: calc(100vh - 48px); display: flex; flex-direction: column; border: 1px solid var(--chat-line); border-radius: 20px; background: var(--chat-bg); box-shadow: 0 16px 70px #0003; overflow: hidden; }
.assistant-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid var(--chat-line); }
.assistant-eyebrow { font-size: 10px; letter-spacing: .16em; color: var(--chat-muted); }
h2 { font-size: 17px; font-weight: 600; margin: 3px 0 0; }
h2 span { color: var(--chat-accent); margin-left: 5px; }
.assistant-actions { display: flex; gap: 6px; }
.assistant-actions button { width: 32px; height: 32px; border-radius: 50%; background: var(--chat-soft); font-size: 22px; }
.assistant-transcript { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 20px; }
.assistant-welcome { padding-top: 20px; }
.assistant-spark { color: var(--chat-accent); font-size: 30px; }
h3 { font-size: 22px; font-weight: 600; margin: 12px 0 8px; }
.assistant-welcome p { color: var(--chat-muted); margin-bottom: 24px; }
.assistant-suggestion { display: flex; align-items: center; justify-content: space-between; width: 100%; border: 1px solid var(--chat-line); border-radius: 10px; padding: 12px; text-align: left; margin: 10px 0; }
.assistant-suggestion:hover { background: var(--chat-soft); }
.assistant-suggestion span { color: var(--chat-accent); }
.assistant-messages { list-style: none; padding: 0; margin: 0; }
.assistant-message { margin-bottom: 24px; }
.assistant-role { display: block; color: var(--chat-muted); font-size: 11px; margin-bottom: 6px; }
.assistant-content { white-space: pre-wrap; overflow-wrap: anywhere; }
.user .assistant-content { background: var(--chat-soft); border-radius: 12px; padding: 12px; }
.assistant-sources { margin-top: 14px; border-top: 1px solid var(--chat-line); padding-top: 10px; font-size: 12px; }
.assistant-sources > span { color: var(--chat-muted); font-size: 11px; }
.assistant-sources a { display: block; color: var(--chat-accent); margin-top: 5px; text-decoration: none; overflow-wrap: anywhere; }
.assistant-sources a:hover { text-decoration: underline; }
.assistant-sources small { color: var(--chat-muted); }
.assistant-status { color: var(--chat-muted); font-size: 12px; padding: 0 20px 8px; min-height: 27px; }
.assistant-status button { color: var(--chat-accent); text-decoration: underline; margin-left: 6px; }
.assistant-incomplete { display: block; color: var(--chat-muted); margin-top: 8px; }
.assistant-form { display: flex; align-items: flex-end; gap: 8px; margin: 0 16px; padding: 10px; background: var(--chat-soft); border: 1px solid var(--chat-line); border-radius: 12px; }
textarea { flex: 1; min-width: 0; resize: none; background: transparent; border: none; font: inherit; color: var(--chat-text); }
textarea::placeholder { color: var(--chat-muted); }
.assistant-send { background: var(--chat-accent); color: var(--chat-bg); padding: 6px 12px; border-radius: 8px; white-space: nowrap; }
.assistant-disclaimer { color: var(--chat-muted); font-size: 10px; padding: 10px 20px 14px; margin: 0; }
@media (max-width: 480px) { .blog-assistant { right: 12px; bottom: 12px; } .assistant-panel { width: calc(100vw - 24px); height: min(680px, calc(100dvh - 24px)); max-height: calc(100vh - 24px); } }
</style>
