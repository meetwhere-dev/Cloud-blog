import { distance, length, nearestPoint, pathData } from './geometry.mjs'
const $ = id => document.getElementById(id)
const svg = $('canvas'), ns = 'http://www.w3.org/2000/svg'
let paths = [], selected = null, tool = 'select', pending = [], pointer = null, drag = null, hover = null, sequence = 0
const undo = [], redo = []
const hints = { select: '点击路径选中；拖动路径移动位置，拖动圆点调整端点或曲线控制点。', line: '依次点击起点、终点。按住 Shift 将直线约束为水平或垂直。', curve: '依次点击起点、终点、第一控制点、第二控制点。完成后可拖动控制点微调。', detect: '移动到路径附近（12 px 内），查看最近点、距离与沿路径的累计长度；点击可固定选择。' }
const names = { select: '选择 / 编辑', line: '绘制直线', curve: '绘制曲线', detect: '侦测 / 测量' }
const copy = value => JSON.parse(JSON.stringify(value))
const snapshot = () => ({ paths: copy(paths), selected })
function record() { undo.push(snapshot()); if (undo.length > 100) undo.shift(); redo.length = 0 }
function travel(from, to) { if (!from.length) return; to.push(snapshot()); const state = from.pop(); paths = state.paths; selected = state.selected; pending = []; hover = null; render() }
function el(tag, attrs, parent, content) { const node = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v); if (content != null) node.textContent = content; parent.append(node); return node }
function switchTool(value) { tool = value; pending = []; hover = null; $('status').textContent = '准备就绪'; render() }
function coordinates(e) { const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse()); return { x: point.x, y: point.y } }
function hit(point) { let result = null; for (const path of paths) { const found = nearestPoint(path.points, point); if (found.distance <= 12 && (!result || found.distance < result.distance)) result = { ...found, path } } return result }
function constrained(point, shift) { if (!shift || !pending.length || tool !== 'line') return point; const start = pending[0]; return Math.abs(point.x - start.x) > Math.abs(point.y - start.y) ? { x: point.x, y: start.y } : { x: start.x, y: point.y } }
function preview() {
  $('draft').replaceChildren()
  if (!pending.length || !pointer) return
  let pts = tool === 'line' ? [pending[0], pointer] : pending.length === 1 ? [pending[0], pointer] : [pending[0], pending[2] || pointer, pending.length === 3 ? pointer : pending[1], pending[1]]
  el('path', { d: pathData(pts), fill: 'none', stroke: '#6c9151', 'stroke-width': 2, 'stroke-dasharray': '6 5' }, $('draft'))
  for (const p of pending) el('circle', { cx: p.x, cy: p.y, r: 4, fill: '#6c9151' }, $('draft'))
}
function panel() {
  const active = hover?.path || paths.find(p => p.id === selected)
  $('length').textContent = active ? length(active.points).toFixed(2) : '—'
  $('measure-title').textContent = hover ? '侦测路径长度' : '选中路径长度'
  $('measure-note').textContent = active ? `${active.name} · ${active.points.length === 2 ? '两点间的精确距离' : '贝塞尔曲线近似弧长'}` : '选择一条路径，查看测量结果'
  $('kind').textContent = active ? active.points.length === 2 ? '直线' : '三次贝塞尔曲线' : '—'
  const format = p => `${p.x.toFixed(1)}, ${p.y.toFixed(1)}`
  $('from').textContent = active ? format(active.points[0]) : '—'
  $('to').textContent = active ? format(active.points.at(-1)) : '—'
  $('chord').textContent = active ? `${distance(active.points[0], active.points.at(-1)).toFixed(2)} px` : '—'
  $('detect-info').hidden = tool !== 'detect'
  $('nearest').textContent = hover ? `最近点 (${format(hover.point)}) · 距离 ${hover.distance.toFixed(2)} px · 从起点累计 ${hover.along.toFixed(2)} px` : '悬停路径附近，侦测最近点'
  $('delete').disabled = !paths.some(p => p.id === selected)
}
function render() {
  svg.dataset.tool = tool
  for (const button of document.querySelectorAll('[data-tool]')) { button.classList.toggle('active', button.dataset.tool === tool); button.setAttribute('aria-pressed', button.dataset.tool === tool) }
  $('mode').textContent = names[tool]; $('hint').textContent = hints[tool]
  $('empty').hidden = paths.length > 0 || pending.length > 0 || tool === 'line' || tool === 'curve'
  $('grid-bg').setAttribute('visibility', $('grid').checked ? 'visible' : 'hidden')
  $('paths').replaceChildren(); $('handles').replaceChildren(); $('path-list').replaceChildren(); $('probe').replaceChildren()
  let total = 0
  for (const path of paths) {
    const measured = length(path.points); total += measured
    el('path', { d: pathData(path.points), fill: 'none', stroke: path.id === selected || path.id === hover?.path.id ? '#467b43' : '#354b42', 'stroke-width': path.id === selected ? 2.8 : 2, 'stroke-linecap': 'round' }, $('paths'))
    if ($('labels').checked) { const p = path.points[Math.floor(path.points.length / 2)]; el('text', { x: (path.points[0].x + path.points.at(-1).x) / 2, y: path.points.length === 2 ? (path.points[0].y + p.y) / 2 - 13 : path.points.at(-1).y - 18, class: 'path-label', 'text-anchor': 'middle' }, $('paths'), `${measured.toFixed(2)} px`) }
    const row = document.createElement('button'); row.className = `path-row${path.id === selected ? ' selected' : ''}`; row.setAttribute('aria-pressed', path.id === selected)
    row.innerHTML = `<span>${path.points.length === 2 ? '╱' : '∿'}</span><span>${path.name}</span><span>${measured.toFixed(2)} px</span>`
    row.onclick = () => { selected = path.id; switchTool('select') }; $('path-list').append(row)
    if (path.id === selected && tool === 'select') {
      if (path.points.length === 4) for (const [a, b] of [[0, 1], [3, 2]]) el('line', { x1: path.points[a].x, y1: path.points[a].y, x2: path.points[b].x, y2: path.points[b].y, stroke: '#a6b58d', 'stroke-dasharray': '4 4' }, $('handles'))
      path.points.forEach((p, i) => el('circle', { cx: p.x, cy: p.y, r: 6, fill: i === 0 || i === path.points.length - 1 ? '#fff' : '#dbe8ca', stroke: '#567d40', 'stroke-width': 2, 'data-handle': i, class: 'handle' }, $('handles')))
    }
  }
  if (!paths.length) { const note = document.createElement('p'); note.className = 'no-paths'; note.textContent = '还没有路径，开始绘制吧'; $('path-list').append(note) }
  if (hover) { el('circle', { cx: hover.point.x, cy: hover.point.y, r: 6, fill: '#fff', stroke: '#af7f36', 'stroke-width': 2 }, $('probe')) }
  $('count').textContent = `${paths.length} 条`; $('total').innerHTML = `${total.toFixed(2)} <small>px</small>`
  $('undo').disabled = !undo.length; $('redo').disabled = !redo.length; $('clear').disabled = !paths.length; $('export').disabled = !paths.length
  panel(); preview()
}
svg.addEventListener('pointerdown', e => {
  if (e.button !== 0) return
  const point = constrained(coordinates(e), e.shiftKey)
  if (point.x < 0 || point.y < 0 || point.x > 1000 || point.y > 700) return
  svg.focus(); pointer = point
  if (tool === 'line' || tool === 'curve') {
    pending.push(point)
    if (pending.length === (tool === 'line' ? 2 : 4)) {
      record(); const id = ++sequence
      paths.push({ id, name: `${tool === 'line' ? '直线' : '曲线'} ${String(id).padStart(2, '0')}`, points: tool === 'line' ? [...pending] : [pending[0], pending[2], pending[3], pending[1]] }); selected = id; pending = []; $('status').textContent = '绘制完成 · 可继续绘制，或按 V 编辑'
    } else $('status').textContent = tool === 'line' ? '点击终点完成直线 · Shift 约束方向' : ['','第 2 / 4 步 · 点击终点','第 3 / 4 步 · 点击第一控制点','第 4 / 4 步 · 点击第二控制点'][pending.length]
    render(); return
  }
  if (tool === 'detect') { selected = hit(point)?.path.id || null; render(); return }
  const handle = e.target.getAttribute('data-handle')
  if (handle !== null) { const path = paths.find(p => p.id === selected); drag = { path, handle: Number(handle), start: point, original: copy(path.points), saved: false } }
  else { const found = hit(point); selected = found?.path.id || null; if (found) drag = { path: found.path, handle: null, start: point, original: copy(found.path.points), saved: false } }
  if (drag) svg.setPointerCapture(e.pointerId)
  render()
})
svg.addEventListener('pointermove', e => {
  pointer = constrained(coordinates(e), e.shiftKey)
  $('coordinates').textContent = `X ${pointer.x.toFixed(1)}   Y ${pointer.y.toFixed(1)}`
  if (drag) {
    if (!drag.saved && distance(pointer, drag.start) < 0.1) return
    if (!drag.saved) { record(); drag.saved = true }
    if (drag.handle !== null) drag.path.points[drag.handle] = { ...pointer }
    else drag.path.points = drag.original.map(p => ({ x: p.x + pointer.x - drag.start.x, y: p.y + pointer.y - drag.start.y }))
    render()
  } else if (tool === 'detect') { hover = hit(pointer); render() } else preview()
})
function endDrag(e) { drag = null; if (svg.hasPointerCapture(e.pointerId)) svg.releasePointerCapture(e.pointerId) }
svg.addEventListener('pointerup', endDrag); svg.addEventListener('pointercancel', endDrag)
svg.addEventListener('pointerleave', () => { if (!drag) { hover = null; pointer = null; $('coordinates').textContent = 'X —   Y —'; render() } })
function removeSelected() { if (selected == null || drag) return; record(); paths = paths.filter(p => p.id !== selected); selected = null; hover = null; render() }
document.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => switchTool(b.dataset.tool))
$('start').onclick = () => switchTool('line'); $('grid').onchange = render; $('labels').onchange = render
$('delete').onclick = removeSelected; $('undo').onclick = () => travel(undo, redo); $('redo').onclick = () => travel(redo, undo)
$('clear').onclick = () => { record(); paths = []; selected = null; pending = []; hover = null; render(); $('status').textContent = '画布已清空 · 可撤销恢复' }
$('example').onclick = () => {
  record()
  for (const points of [[{ x: 180, y: 200 }, { x: 500, y: 200 }], [{ x: 180, y: 450 }, { x: 320, y: 160 }, { x: 560, y: 650 }, { x: 800, y: 360 }]]) { const id = ++sequence; paths.push({ id, name: `${points.length === 2 ? '直线' : '曲线'} ${String(id).padStart(2, '0')}`, points }) }
  selected = sequence; switchTool('select'); $('status').textContent = '已添加示例 · 拖动控制点，观察长度变化'
}
$('export').onclick = () => {
  const content = `<svg xmlns="${ns}" viewBox="0 0 1000 700" width="1000" height="700">${paths.map(p => `<path d="${pathData(p.points)}" fill="none" stroke="#354b42" stroke-width="2"/>`).join('')}</svg>`
  const url = URL.createObjectURL(new Blob([content], { type: 'image/svg+xml' })); const a = document.createElement('a'); a.href = url; a.download = '线迹.svg'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
document.addEventListener('keydown', e => {
  if (e.target.matches('input, textarea, select') || drag) return
  const key = e.key.toLowerCase()
  if ((e.metaKey || e.ctrlKey) && key === 'z') { e.preventDefault(); e.shiftKey ? travel(redo, undo) : travel(undo, redo); return }
  if (e.metaKey || e.ctrlKey || e.altKey) return
  if (key === 'escape') { pending = []; selected = null; hover = null; $('status').textContent = '已取消'; render() }
  if (key === 'delete' || key === 'backspace') { e.preventDefault(); removeSelected() }
  const shortcuts = { v: 'select', l: 'line', b: 'curve', d: 'detect' }; if (shortcuts[key]) { e.preventDefault(); switchTool(shortcuts[key]) }
})
render()
