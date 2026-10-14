import { readFileSync } from 'node:fs'

const knowledge = JSON.parse(readFileSync(new URL('./generated/knowledge.json', import.meta.url), 'utf8'))

export function tokenize(text) {
  const normalized = text.toLowerCase().normalize('NFKC')
  const english = normalized.match(/[a-z0-9_]+/g) || []
  const chinese = normalized.match(/[\u3400-\u9FFF]+/g) || []
  return [...new Set([...english, ...chinese.flatMap(word => word.length === 1 ? [word] : Array.from({ length: word.length - 1 }, (_, i) => word.slice(i, i + 2)))])]
}

export function retrieve(question, currentPath = '', history = []) {
  const terms = tokenize(question)
  const previous = tokenize(history.filter(m => m.role === 'user').slice(-2).map(m => m.content).join(' '))
  const refersToPage = /这篇|这里|当前|本文|文中|这段|this (page|post|article)|\bhere\b/i.test(question)
  const scored = knowledge.map((chunk) => {
    const title = chunk.title.toLowerCase()
    const body = chunk.text.toLowerCase()
    const scoreTerms = tokens => tokens.reduce((score, term) => score + (title.includes(term) ? 5 : 0) + (body.includes(term) ? 1 : 0), 0)
    const score = scoreTerms(terms)
    // Page/history hints help follow-up questions without replacing the current question.
    const hint = (refersToPage && chunk.path === currentPath ? 4 : 0) + scoreTerms(previous) * 0.2
    return { ...chunk, score: score + hint }
  }).filter(chunk => chunk.score > 0).sort((a, b) => b.score - a.score)
  const selected = []
  const perPage = new Map()
  const threshold = Math.max(1, (scored[0]?.score || 0) * 0.3)
  for (const chunk of scored) {
    if (chunk.score < threshold)
      continue
    if ((perPage.get(chunk.path) || 0) >= 2)
      continue
    selected.push(chunk)
    perPage.set(chunk.path, (perPage.get(chunk.path) || 0) + 1)
    if (selected.length === 5)
      break
  }
  return selected
}
