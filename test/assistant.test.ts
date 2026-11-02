import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { defineComponent, h } from 'vue'
import BlogAssistant from '../src/components/BlogAssistant.vue'

const locales = import.meta.globEager('../locales/*.yml')
let unmount = () => {}
afterEach(() => {
  unmount()
  vi.restoreAllMocks()
})

function openAssistant() {
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages: {
      'en': locales['../locales/en.yml'].default,
      'zh-CN': locales['../locales/zh-CN.yml'].default,
    },
  })
  const page = mount(defineComponent({ render: () => h(BlogAssistant) }), { global: { plugins: [i18n] } })
  unmount = () => page.unmount()
  return { page, i18n }
}

describe('resume assistant languages', () => {
  it('localizes the launcher, suggestions and controls with the site language', async () => {
    const { page, i18n } = openAssistant()
    expect(page.text()).toContain('Resume AI')
    await page.get('.assistant-launcher').trigger('click')
    expect(page.text()).toContain('Start with a question')
    expect(page.get('.assistant-suggestion').text()).toContain('What projects')
    i18n.global.locale.value = 'zh-CN'
    await flushPromises()
    expect(page.text()).toContain('个人简历 AI')
    expect(page.get('.assistant-suggestion').text()).toContain('你最近在忙什么项目')
    expect(page.get('textarea').attributes('placeholder')).toContain('询问项目经验')
  })

  it('keeps the original question and model reply independent of the English interface', async () => {
    let body: { locale: string; messages: { role: string; content: string }[] } | undefined
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (_, options) => {
      body = JSON.parse(String(options?.body))
      const events = [{ type: 'sources', sources: [] }, { type: 'delta', text: '他负责 Agent 工具调用。' }, { type: 'done' }]
      return new Response(events.map(event => `data: ${JSON.stringify(event)}\n\n`).join(''), {
        headers: { 'Content-Type': 'text/event-stream' },
      })
    })
    const { page } = openAssistant()
    await page.get('.assistant-launcher').trigger('click')
    await page.get('textarea').setValue('介绍他的 AI 项目')
    await page.get('form').trigger('submit')
    await flushPromises()
    expect(body?.locale).toBe('en')
    expect(body?.messages.at(-1)?.content).toBe('介绍他的 AI 项目')
    expect(page.get('.assistant-message.assistant').text()).toContain('他负责 Agent 工具调用。')
    expect(page.get('h2').text()).toContain('Resume AI')
  })

  it('uses localized error codes instead of showing Chinese server errors in English UI', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: '服务繁忙', code: 'unavailable' }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    }))
    const { page } = openAssistant()
    await page.get('.assistant-launcher').trigger('click')
    await page.get('textarea').setValue('What projects has he built?')
    await page.get('form').trigger('submit')
    await flushPromises()
    expect(page.get('.assistant-status').text()).toContain('The service is busy')
    expect(page.text()).not.toContain('服务繁忙')
  })
})
