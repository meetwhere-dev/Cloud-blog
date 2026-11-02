import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { RouterView, createMemoryHistory, createRouter } from 'vue-router'
import { createI18n } from 'vue-i18n'
import { createHead } from '@vueuse/head'
import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import './browser-mocks'
import routes from 'pages-generated'
import NavBar from '../src/components/NavBar.vue'

const messages = import.meta.globEager('../locales/*.yml')
const en = messages['../locales/en.yml'].default
const zh = messages['../locales/zh-CN.yml'].default

const sourceDir = resolve('src/pages/posts')
const englishDir = resolve('src/content/posts/en')
const files = readdirSync(sourceDir).filter(file => file !== 'index.md' && file.endsWith('.md'))
const markdown = new MarkdownIt({ html: true })

function structure(content: string) {
  const tokens = markdown.parse(content, {})
  return {
    headings: tokens.filter(token => token.type === 'heading_open').map(token => token.tag),
    fences: tokens.filter(token => token.type === 'fence').map(token => token.info),
    links: tokens.flatMap(token => token.children || [])
      .filter(token => token.type === 'image' || token.type === 'link_open')
      .map(token => token.attrGet('src') || token.attrGet('href')),
  }
}

describe('bilingual blog content', () => {
  it('has complete translations with matching dates, sections, code blocks and asset links', () => {
    expect(files).toHaveLength(11)
    expect(readdirSync(englishDir).sort()).toEqual([...files].sort())
    for (const file of files) {
      const original = matter(readFileSync(resolve(sourceDir, file), 'utf8'))
      const english = matter(readFileSync(resolve(englishDir, file), 'utf8'))
      expect(english.data.lang).toBe('en')
      expect(english.data.title).toBeTruthy()
      expect(english.data.date).toEqual(original.data.date)
      expect(english.data.duration).toEqual(original.data.duration)
      expect(structure(english.content)).toEqual(structure(original.content))
      // The Chinese regex is executable sample code, not untranslated prose.
      expect(english.content.replace('/我的订单/', '')).not.toMatch(/[\u4E00-\u9FFF]/)
    }
  })
})

describe('bilingual blog navigation', () => {
  let unmount = () => {}
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    Element.prototype.scrollIntoView = vi.fn()
  })
  afterEach(() => {
    unmount()
    vi.restoreAllMocks()
  })

  async function open(path: string) {
    const router = createRouter({ history: createMemoryHistory(), routes })
    const i18n = createI18n({ legacy: false, locale: 'en', messages: { en, 'zh-CN': zh } })
    await router.push(path)
    await router.isReady()
    const page = mount(defineComponent({ render: () => h('div', [h(NavBar), h(RouterView)]) }), {
      global: { plugins: [router, i18n, createHead()] },
    })
    unmount = () => page.unmount()
    await flushPromises()
    return { router, i18n, page }
  }

  it('renders all 11 original URLs in English and switches the complete article to Chinese', async () => {
    const { page, router } = await open('/posts/2048-threejs')
    for (const file of files) {
      const slug = file.replace(/\.md$/, '')
      await router.push(`/posts/${slug}`)
      await flushPromises()
      const english = matter(readFileSync(resolve(englishDir, file), 'utf8')).data
      const original = matter(readFileSync(resolve(sourceDir, file), 'utf8')).data
      await page.get('.post-language button:nth-child(2)').trigger('click')
      await flushPromises()
      expect(page.findAll('article')).toHaveLength(1)
      expect(page.get('article').attributes('lang')).toBe('en')
      expect(page.get('h1').text()).toBe(english.title)
      expect(page.get('.post-language button:nth-child(2)').attributes('aria-pressed')).toBe('true')
      const englishCodeCount = page.findAll('article pre').length
      await page.get('.post-language button').trigger('click')
      await flushPromises()
      expect(page.get('article').attributes('lang')).toBe('zh-CN')
      expect(page.get('h1').text()).toBe(original.title)
      expect(page.findAll('article pre')).toHaveLength(englishCodeCount)
      expect(router.currentRoute.value.path).toBe(`/posts/${slug}`)
    }
  })

  it('synchronizes navigation, metadata and the list, and clears anchors on language changes', async () => {
    const { page, router, i18n } = await open('/posts/2048-threejs')
    expect(i18n.global.locale.value).toBe('en')
    const anchor = page.get('article h2 a')
    await anchor.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.hash).not.toBe('')
    await page.get('a[title="Change languages"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.hash).toBe('')
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
    expect(page.get('article').text()).toContain('2019 年写过一个 2048')
    expect(document.title).toBe('把我的第一个 2048 小游戏，用 AI 重新做了一遍')
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain('翻出 2019 年')
    await router.push('/posts')
    await flushPromises()
    expect(page.findAll('a.item')).toHaveLength(11)
    expect(page.get('a.item').text()).toContain('把我的第一个 2048 小游戏')
    await page.get('a[title="切换语言"]').trigger('click')
    await nextTick()
    expect(page.findAll('a.item')).toHaveLength(11)
    expect(page.get('a.item').text()).toContain('Rebuilding My First 2048 Game with AI')
    await page.get('a.item').trigger('click')
    await flushPromises()
    expect(page.get('article').attributes('lang')).toBe('en')
    expect(document.title).toBe('Rebuilding My First 2048 Game with AI')
  })
})
