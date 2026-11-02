import { FireworkSound } from './sound.js'

const canvas = document.querySelector('#sky')
const ctx = canvas.getContext('2d', { alpha: false })
const $ = selector => document.querySelector(selector)
const random = (min, max) => min + Math.random() * (max - min)
const pick = list => list[Math.floor(Math.random() * list.length)]
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
const sound = new FireworkSound(message => { $('#soundStatus').textContent = message })
document.addEventListener('pointerdown', () => { sound.unlock() }, { passive: true })
document.addEventListener('keydown', () => { sound.unlock() })
$('#sound').addEventListener('change', (event) => {
  sound.setEnabled(event.target.checked)
  if (event.target.checked) sound.unlock()
})
$('#volume').addEventListener('input', (event) => {
  const value = Number(event.target.value)
  sound.setVolume(value / 100)
  $('#volumeValue').textContent = `${value}%`
  event.target.setAttribute('aria-valuetext', `${value}%`)
})
const defaults = { shape: 'willow', palette: 'gold', customColor: '#a5bbff', count: 150, radius: 150, life: 2.8, frequency: 1.1, gravity: 38, wind: 0, trail: 72, size: 1.5, speed: 1, auto: !reducedMotion, sparkle: true }
const config = { ...defaults }
const presets = {
  gold: { ...defaults },
  neon: { ...defaults, shape: 'peony', palette: 'neon', count: 190, radius: 180, life: 1.8, frequency: 2, gravity: 25, trail: 50, size: 1.8 },
  dream: { ...defaults, shape: 'ring', palette: 'ice', count: 110, radius: 170, life: 3.2, frequency: 0.7, gravity: 12, trail: 84, size: 1.3 },
}
const controls = [
  ['count', '星光数量', 40, 300, 10, value => `${value} 粒`],
  ['radius', '绽放范围', 60, 250, 10, value => `${value}`],
  ['frequency', '发射频率', 0.3, 3, 0.1, value => `${Number(value).toFixed(1)} 束 / 秒`],
  ['life', '余烬寿命', 1, 5, 0.1, value => `${Number(value).toFixed(1)} 秒`],
  ['size', '星光大小', 0.6, 3, 0.1, value => `${Number(value).toFixed(1)}`],
  ['trail', '拖尾长度', 0, 95, 1, value => `${value}%`],
  ['gravity', '下坠重力', 0, 90, 1, value => `${value}`],
  ['wind', '风的方向', -50, 50, 1, value => value === 0 ? '无风' : `${value < 0 ? '←' : '→'} ${Math.abs(value)}`],
  ['speed', '时间流速', 0.3, 1.8, 0.1, value => `${Number(value).toFixed(1)}×`],
]
for (const [key, label, min, max, step] of controls) {
  const field = document.createElement('div')
  field.className = 'slider-field'
  field.innerHTML = `<div class="slider-title"><label for="${key}">${label}</label><output for="${key}" id="${key}Value"></output></div><input id="${key}" type="range" min="${min}" max="${max}" step="${step}">`
  $('#sliders').append(field)
  $(`#${key}`).addEventListener('input', (event) => {
    config[key] = Number(event.target.value)
    updateOutput(key)
    clearPreset()
  })
}
function updateOutput(key) {
  const format = controls.find(control => control[0] === key)[5]
  $(`#${key}Value`).textContent = format(config[key])
  $(`#${key}`).setAttribute('aria-valuetext', format(config[key]))
}
function clearPreset() {
  document.querySelectorAll('[data-preset]').forEach(button => button.setAttribute('aria-pressed', 'false'))
}
function syncControls() {
  for (const [key] of controls) {
    $(`#${key}`).value = config[key]
    updateOutput(key)
  }
  for (const key of ['shape', 'palette', 'customColor']) $(`#${key}`).value = config[key]
  for (const key of ['auto', 'sparkle']) $(`#${key}`).checked = config[key]
  $('#customRow').hidden = config.palette !== 'custom'
  updateStatus()
}
for (const key of ['shape', 'palette', 'customColor', 'auto', 'sparkle']) {
  $(`#${key}`).addEventListener('input', (event) => {
    config[key] = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    $('#customRow').hidden = config.palette !== 'custom'
    clearPreset()
    updateStatus()
  })
}
const palettes = { gold: ['#ffd490', '#f1b85c', '#fff0cb'], neon: ['#ff568e', '#7a9fff', '#b979ff', '#43e8d8'], ice: ['#88b9ff', '#b8daff', '#9f92ed'], rose: ['#ff8fae', '#eab1ff', '#c484ef'] }
let width = 0, height = 0, dpr = 1
let rockets = [], particles = [], flashes = [], stars = []
let paused = false, lastTime = 0, autoElapsed = 0, statsElapsed = 0
let autoResumeAt = 0
const MANUAL_AUTO_DELAY = 6000
const MAX_PARTICLES = 6500
const sprites = new Map()
function sprite(color) {
  if (sprites.has(color)) return sprites.get(color)
  const image = document.createElement('canvas')
  image.width = image.height = 32
  const pen = image.getContext('2d')
  const glow = pen.createRadialGradient(16, 16, 0, 16, 16, 16)
  glow.addColorStop(0, '#ffffff')
  glow.addColorStop(0.12, color)
  glow.addColorStop(0.35, `${color}80`)
  glow.addColorStop(1, `${color}00`)
  pen.fillStyle = glow
  pen.fillRect(0, 0, 32, 32)
  if (sprites.size > 40) sprites.clear()
  sprites.set(color, image)
  return image
}
function resize() {
  width = innerWidth
  height = innerHeight
  dpr = Math.min(devicePixelRatio || 1, 2)
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = '#070b17'
  ctx.fillRect(0, 0, width, height)
  stars = Array.from({ length: Math.round(width * height / 8500) }, () => ({ x: Math.random() * width, y: Math.random() * height * 0.85, size: random(0.4, 1.2), alpha: random(0.12, 0.5) }))
  rockets = []
  particles = []
  flashes = []
}
function fire(x, y) {
  if (rockets.length >= 16 || particles.length >= MAX_PARTICLES - 300) return
  const availableWidth = width > 850 && !document.body.classList.contains('panel-hidden') && !document.body.classList.contains('ui-hidden') ? width - 340 : width
  x ??= random(availableWidth * 0.18, availableWidth * 0.86)
  y ??= random(height * 0.18, height * 0.5)
  const settings = { ...config }
  const shape = settings.shape === 'random' ? pick(['willow', 'peony', 'ring', 'heart', 'palm']) : settings.shape
  const color = settings.palette === 'custom' ? settings.customColor : pick(palettes[settings.palette])
  const duration = random(0.85, 1.3)
  sound.launch(x / width)
  rockets.push({ startX: x + random(-60, 60), x, y: height + 5, targetX: x, targetY: clamp(y, 60, height * 0.82), elapsed: 0, duration, settings, shape, color })
}
function addParticle(particle) {
  if (particles.length < MAX_PARTICLES) particles.push(particle)
}
function burst(rocket) {
  const { settings, shape, color, targetX: x, targetY: y } = rocket
  sound.burst(x / width, settings.radius / 150, { sparkle: settings.sparkle, shape })
  const scale = Math.min(1, width / 750)
  const power = settings.radius * scale * (shape === 'willow' ? 0.9 : 1.25)
  for (let i = 0; i < settings.count; i++) {
    const angle = (i / settings.count) * Math.PI * 2
    let vx, vy
    const velocity = power * Math.sqrt(Math.random())
    if (shape === 'heart') {
      vx = 16 * Math.sin(angle) ** 3 * power / 18
      vy = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle)) * power / 18
    }
    else if (shape === 'ring') {
      vx = Math.cos(angle) * power
      vy = Math.sin(angle) * power * 0.8
    }
    else if (shape === 'palm') {
      const branch = (i % 9) / 9 * Math.PI * 2
      const strength = power * random(0.35, 1)
      vx = Math.cos(branch) * strength + random(-4, 4)
      vy = Math.sin(branch) * strength + random(-4, 4)
    }
    else {
      vx = Math.cos(angle) * velocity
      vy = Math.sin(angle) * velocity
    }
    const life = settings.life * random(0.75, 1.2) * (shape === 'willow' ? 1.25 : 1)
    addParticle({ x, y, vx, vy, color, image: sprite(color), life, maxLife: life, size: settings.size * random(0.65, 1.2), gravity: settings.gravity, wind: settings.wind, drag: shape === 'willow' ? 0.55 : 0.9, sparkle: settings.sparkle, phase: random(0, 7), age: 0 })
  }
  flashes.push({ x, y, life: 0.25, color, radius: power * 0.65 })
}
function updateStatus() {
  $('#status').textContent = paused ? '时间已暂停' : config.auto ? '夜空正在上演' : '手动模式 · 点击发射'
  $('#pause').textContent = paused ? '▶ 继续' : 'Ⅱ 暂停'
  $('#pause').setAttribute('aria-pressed', String(paused))
  document.body.classList.toggle('paused', paused)
}
function setPaused(value) {
  paused = value
  sound.setActive(!paused && !document.hidden)
  lastTime = 0
  updateStatus()
}
function launchManual(salvo = false, x, y) {
  // Use real time so animation speed does not shorten the manual-only window.
  autoResumeAt = performance.now() + MANUAL_AUTO_DELAY
  autoElapsed = 0
  setPaused(false)
  if (salvo) for (let i = 0; i < 5; i++) fire(width * (0.16 + i * 0.16), height * random(0.2, 0.45))
  else fire(x, y)
}
function clear() {
  sound.stop()
  rockets = []; particles = []; flashes = []; autoElapsed = 0
  ctx.fillStyle = '#070b17'; ctx.fillRect(0, 0, width, height)
  drawStars()
  $('#particleCount').textContent = '0 粒星光'
}
function drawStars() {
  ctx.globalCompositeOperation = 'source-over'
  for (const star of stars) {
    ctx.fillStyle = `rgba(174,194,226,${star.alpha})`
    ctx.fillRect(star.x, star.y, star.size, star.size)
  }
}
function frame(now) {
  requestAnimationFrame(frame)
  if (document.hidden || paused) { lastTime = 0; return }
  const elapsed = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 1 / 60
  lastTime = now
  const dt = elapsed * config.speed
  const fade = 1 - Math.pow(config.trail / 100 * 0.88, elapsed * 60)
  ctx.globalCompositeOperation = 'source-over'
  ctx.fillStyle = `rgba(7,11,23,${fade})`
  ctx.fillRect(0, 0, width, height)
  drawStars()
  autoElapsed += dt
  if (config.auto && now >= autoResumeAt && autoElapsed >= 1 / config.frequency) { fire(); autoElapsed = 0 }
  ctx.globalCompositeOperation = 'lighter'
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i]
    const previousX = r.x, previousY = r.y
    r.elapsed += dt
    const progress = Math.min(r.elapsed / r.duration, 1)
    const ease = 1 - (1 - progress) ** 1.7
    r.x = r.startX + (r.targetX - r.startX) * ease
    r.y = height + 5 + (r.targetY - height - 5) * ease
    ctx.strokeStyle = `${r.color}a0`; ctx.lineWidth = 1.4
    ctx.beginPath(); ctx.moveTo(previousX, previousY); ctx.lineTo(r.x, r.y + 5); ctx.stroke()
    ctx.drawImage(sprite(r.color), r.x - 7, r.y - 7, 14, 14)
    if (progress === 1) { burst(r); rockets.splice(i, 1) }
  }
  // Compact in place instead of allocating and filtering thousands of particles every frame.
  let alive = 0
  for (const p of particles) {
    p.life -= dt
    if (p.life <= 0 || p.y > height + 40) continue
    const oldX = p.x, oldY = p.y
    const damping = Math.exp(-p.drag * dt)
    p.vx = p.vx * damping + p.wind * dt * 0.25
    p.vy = p.vy * damping + p.gravity * dt
    p.x += p.vx * dt; p.y += p.vy * dt; p.age += dt
    const opacity = Math.min(1, p.life / p.maxLife * 1.8) * (p.sparkle && p.life < p.maxLife * 0.55 ? 0.4 + 0.6 * Math.abs(Math.sin(p.age * 23 + p.phase)) : 1)
    ctx.globalAlpha = opacity
    ctx.strokeStyle = p.color; ctx.lineWidth = Math.max(0.5, p.size * 0.65)
    ctx.beginPath(); ctx.moveTo(oldX, oldY); ctx.lineTo(p.x, p.y); ctx.stroke()
    const size = p.size * 5
    ctx.drawImage(p.image, p.x - size / 2, p.y - size / 2, size, size)
    particles[alive++] = p
  }
  particles.length = alive
  ctx.globalAlpha = 1
  for (let i = flashes.length - 1; i >= 0; i--) {
    const flash = flashes[i]
    flash.life -= dt
    if (flash.life <= 0) { flashes.splice(i, 1); continue }
    ctx.globalAlpha = flash.life * 0.45
    ctx.drawImage(sprite(flash.color), flash.x - flash.radius, flash.y - flash.radius, flash.radius * 2, flash.radius * 2)
  }
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
  statsElapsed += elapsed
  if (statsElapsed > 0.4) { $('#particleCount').textContent = `${particles.length.toLocaleString()} 粒星光`; statsElapsed = 0 }
}
$('#pause').addEventListener('click', () => setPaused(!paused))
$('#launch').addEventListener('click', () => launchManual())
$('#salvo').addEventListener('click', () => launchManual(true))
$('#clear').addEventListener('click', clear)
canvas.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return
  launchManual(false, event.clientX, event.clientY)
})
function togglePanel() {
  const hidden = document.body.classList.toggle('panel-hidden')
  $('#settings').hidden = hidden
  $('#togglePanel').textContent = hidden ? '调节烟花' : '隐藏面板'
  $('#togglePanel').setAttribute('aria-expanded', String(!hidden))
}
$('#togglePanel').addEventListener('click', togglePanel)
let uiHidden = false
function setUIHidden(hidden) {
  uiHidden = hidden
  document.body.classList.toggle('ui-hidden', hidden)
  $('#restoreUI').hidden = !hidden
  if (hidden) document.activeElement?.blur()
  else $('#hideUI').focus({ preventScroll: true })
}
$('#hideUI').addEventListener('click', () => setUIHidden(true))
$('#restoreUI').addEventListener('click', () => setUIHidden(false))
async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen()
    else throw new Error('Fullscreen unavailable')
  }
  catch {
    $('#status').textContent = '浏览器不支持或未允许全屏，可使用隐藏界面模式'
  }
}
$('#fullscreen').addEventListener('click', toggleFullscreen)
document.addEventListener('fullscreenchange', () => {
  const active = Boolean(document.fullscreenElement)
  $('#fullscreen').textContent = active ? '退出全屏' : '全屏'
  $('#fullscreen').setAttribute('aria-pressed', String(active))
  if (!active && uiHidden) setUIHidden(false)
})

function applyPreset(name) {
  Object.assign(config, presets[name])
  clearPreset()
  $(`[data-preset="${name}"]`).setAttribute('aria-pressed', 'true')
  syncControls()
  autoElapsed = 0
  clear()
  launchManual(true)
}
document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => applyPreset(button.dataset.preset)))
$('#reset').addEventListener('click', () => applyPreset('gold'))
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && uiHidden) { setUIHidden(false); return }
  if (uiHidden && event.key.toLowerCase() === 'u') { setUIHidden(false); return }
  if (event.target.closest('input, select, button, a, textarea') || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return
  if (event.code === 'Space') { event.preventDefault(); setPaused(!paused) }
  if (event.key.toLowerCase() === 'h') togglePanel()
  if (event.key.toLowerCase() === 'u') setUIHidden(!uiHidden)
  if (event.key.toLowerCase() === 'f') toggleFullscreen()
})
window.addEventListener('resize', resize)
document.addEventListener('visibilitychange', () => { lastTime = 0; sound.setActive(!document.hidden && !paused) })
resize()
syncControls()
if (width <= 650) togglePanel()
if (!reducedMotion) { fire(width * 0.4, height * 0.32); fire(width * 0.62, height * 0.4) }
requestAnimationFrame(frame)
