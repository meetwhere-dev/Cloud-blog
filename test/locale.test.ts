import { describe, expect, it } from 'vitest'
import { browserLocale } from '../src/utils/locale'

describe('initial browser language', () => {
  it('uses Chinese for all Chinese regional preferences', () => {
    for (const language of ['zh', 'zh-CN', 'zh-TW', 'zh-HK', 'zh-Hant', 'ZH-cn'])
      expect(browserLocale([language, 'en'])).toBe('zh-CN')
  })
  it('honors the first preference and falls back to English for unsupported languages', () => {
    expect(browserLocale(['en-US', 'zh-CN'])).toBe('en')
    expect(browserLocale(['ja-JP', 'zh-CN'])).toBe('en')
    expect(browserLocale([], 'zh-CN')).toBe('zh-CN')
    expect(browserLocale()).toBe('en')
  })
})
