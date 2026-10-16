import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { pathToFileURL } from 'node:url'
import { buildKnowledge } from '../scripts/build-knowledge.mjs'
import { MAX_BYTES, chatPayload, safePublicUrl } from '../server/profile-contract.mjs'

test('only explicitly published nonempty profile files are indexed; IDs are unique', async () => {
  const directory = await mkdtemp(`${tmpdir()}/profile-test-`)
  const root = pathToFileURL(`${directory}/`)
  const document = (id, status, body) => `---\nid: ${id}\ntitle: Test\ntype: project\nstatus: ${status}\nskills: [Agent]\nlinks:\n  - label: Demo\n    url: https://example.com/demo\n  - label: Unsafe\n    url: javascript:alert(1)\n---\n${body}`
  try {
    await writeFile(new URL('published.md', root), document('real', 'published', '本人负责工具调用'))
    await writeFile(new URL('draft.md', root), document('draft', 'draft', '不可公开'))
    await writeFile(new URL('empty.md', root), document('empty', 'published', '<!-- 请填写 -->'))
    await writeFile(new URL('old-blog.md', root), '# 博客文章\n不应该索引')
    const chunks = await buildKnowledge(root)
    assert.equal(chunks.length, 1)
    assert.equal(chunks[0].id, 'real')
    assert.equal(chunks[0].links.length, 1)
    assert.deepEqual(chunks[0].skills, ['Agent'])
    await writeFile(new URL('duplicate.md', root), document('real', 'published', '重复'))
    await assert.rejects(buildKnowledge(root), /Duplicate/)
  }
  finally { await rm(directory, { recursive: true, force: true }) }
})

test('production template library is empty and never imports blog pages', async () => {
  // Repository templates stay draft until the owner supplies real material.
  const chunks = await buildKnowledge()
  assert.ok(chunks.every(chunk => chunk.id && !('path' in chunk)))
})

test('client preserves full latest JD while trimming old messages to server budgets', () => {
  const history = Array.from({ length: 11 }, () => ({ role: 'user', content: '中'.repeat(8000) }))
  const text = '新'.repeat(8000)
  const messages = chatPayload(history, text)
  assert.equal(messages.length, 3)
  assert.equal(messages.at(-1).content, text)
  assert.ok(new TextEncoder().encode(JSON.stringify({ messages })).length <= MAX_BYTES)
  const escaped = chatPayload(history.map(message => ({ ...message, content: '\u0001'.repeat(8000) })), '\u0001'.repeat(8000))
  assert.ok(new TextEncoder().encode(JSON.stringify({ messages: escaped })).length <= MAX_BYTES)
  assert.throws(() => chatPayload([], 'x'.repeat(8001)), /8,000/)
})

test('only safe explicit public links and simple contact emails are accepted', () => {
  assert.equal(safePublicUrl('javascript:alert(1)'), '')
  assert.equal(safePublicUrl('https://user:secret@example.com'), '')
  assert.equal(safePublicUrl('mailto:me@example.com'), '')
  assert.equal(safePublicUrl('mailto:me@example.com', true), 'mailto:me@example.com')
  assert.equal(safePublicUrl('mailto:me@example.com?bcc=other@example.com', true), '')
})
