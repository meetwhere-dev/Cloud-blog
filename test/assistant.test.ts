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

  it('answers all shortcuts locally in both languages', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch')
    const { page, i18n } = openAssistant()
    await page.get('.assistant-launcher').trigger('click')
    for (const language of ['en', 'zh-CN']) {
      i18n.global.locale.value = language
      await flushPromises()
      for (let index = 0; index < 3; index++) {
        const question = page.findAll('.assistant-suggestion')[index].text().replace('↗', '').trim()
        await page.findAll('.assistant-suggestion')[index].trigger('click')
        expect(page.get('.assistant-message.user').text()).toContain(question)
        expect(page.get('.assistant-message.assistant').text()).toContain(index === 0 ? 'React' : index === 1 ? 'Zendesk' : 'PatternGo')
        expect(page.get('.assistant-message.assistant').text()).toContain(i18n.global.t(`assistant.quickAnswer${index + 1}`).trim())
        expect(fetcher).not.toHaveBeenCalled()
        await page.get(`[aria-label="${i18n.global.t('assistant.newChat')}"]`).trigger('click')
      }
    }
  })

  it('calls AI for a follow-up and includes the fixed exchange as context', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('data: {"type":"delta","text":"Follow-up answer"}\n\ndata: {"type":"done"}\n\n', {
      headers: { 'Content-Type': 'text/event-stream' },
    }))
    const { page } = openAssistant()
    await page.get('.assistant-launcher').trigger('click')
    await page.get('.assistant-suggestion').trigger('click')
    expect(fetcher).not.toHaveBeenCalled()
    await page.get('textarea').setValue('Tell me more about the first project.')
    await page.get('form').trigger('submit')
    await flushPromises()
    expect(fetcher).toHaveBeenCalledTimes(1)
    const body = JSON.parse(String(fetcher.mock.calls[0][1]?.body))
    expect(body.messages.map((message: { role: string }) => message.role)).toEqual(['user', 'assistant', 'user'])
    expect(body.messages[1].content).toContain('Mastra')
    expect(body.messages[2].content).toBe('Tell me more about the first project.')
    expect(page.text()).toContain('Follow-up answer')
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
