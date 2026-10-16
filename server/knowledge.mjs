import { readFileSync } from 'node:fs'

const knowledge = JSON.parse(readFileSync(new URL('./generated/knowledge.json', import.meta.url), 'utf8'))

export function tokenize(text) {
  const normalized = text.toLowerCase().normalize('NFKC')
  const english = normalized.match(/[a-z0-9_]+/g) || []
  const chinese = normalized.match(/[\u3400-\u9FFF]+/g) || []
  return [...new Set([...english, ...chinese.flatMap(word => word.length === 1 ? [word] : Array.from({ length: word.length - 1 }, (_, i) => word.slice(i, i + 2)))])]
}

export function retrieve(question, _currentPath = '', history = [], documents = knowledge) {
  const terms = tokenize(question)
  const previous = tokenize(history.filter(m => m.role === 'user').slice(-2).map(m => m.content).join(' '))
  const broad = /招聘|适合|匹配|岗位|介绍|优势|JD|job|hire|fit/i.test(question)
  const scored = documents.map((chunk) => {
    const title = `${chunk.title} ${(chunk.skills || []).join(' ')}`.toLowerCase()
    const body = chunk.text.toLowerCase()
    const scoreTerms = tokens => tokens.reduce((score, term) => score + (title.includes(term) ? 5 : 0) + (body.includes(term) ? 1 : 0), 0)
    const score = scoreTerms(terms) + scoreTerms(previous) * 0.2 + (broad && ['project', 'experience', 'achievement', 'resume'].includes(chunk.type) ? 2 : 0)
    return { ...chunk, score }
  }).sort((a, b) => b.score - a.score)
  const selected = []
  const counts = new Map()
  let length = 0
  // Always include the published resume, bounded to keep model context predictable.
  const ordered = [...scored.filter(chunk => chunk.type === 'resume'), ...scored.filter(chunk => chunk.type !== 'resume' && chunk.score > 0)]
  for (const chunk of ordered) {
    if ((counts.get(chunk.id) || 0) >= 2 || length + chunk.text.length > 12000)
      continue
    selected.push(chunk)
    counts.set(chunk.id, (counts.get(chunk.id) || 0) + 1)
    length += chunk.text.length
    if (selected.length === 8)
      break
  }
  return selected
}

export { knowledge }
