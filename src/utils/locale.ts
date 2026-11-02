// We currently provide Chinese and English; unsupported browser languages use English.
export function browserLocale(languages: readonly string[] = [], language = ''): 'en' | 'zh-CN' {
  const preferred = languages.find(value => value.trim()) || language
  return /^zh(?:[-_]|$)/i.test(preferred.trim()) ? 'zh-CN' : 'en'
}
