<script setup lang="ts">
import { isOver, move, spawn } from '~/games/2048/engine'
import type { Direction, Tile } from '~/games/2048/engine'
import type { createScene } from '~/games/2048/scene'

useHead({ title: '2048 · Three.js 积木实验室' })
const route = useRoute()
const host = ref<HTMLElement>()
const tiles = ref<Tile[]>([])
const score = ref(0)
const best = ref(0)
const steps = ref(0)
const gain = ref(0)
const status = ref<'loading' | 'playing' | 'won' | 'over' | 'error'>('loading')
const busy = ref(false)
const reduced = ref(false)
const particles = ref(0)
let scene: ReturnType<typeof createScene> | undefined
let nextId = 1
let generation = 0
let celebrated = false
let demoUsed = false
let queued: Direction | undefined
let startingBest = 0
let alive = true
let media: MediaQueryList | undefined
const highest = computed(() => Math.max(2, ...tiles.value.map(t => t.value)))
function restart() {
  generation++; scene?.cancel(); queued = undefined; busy.value = false
  score.value = 0; steps.value = 0; celebrated = false; particles.value = 0; gain.value = 0
  startingBest = best.value
  tiles.value = spawn(spawn([], nextId++), nextId++)
  status.value = 'playing'
  if (import.meta.env.DEV && route.query.demo && !demoUsed) {
    demoUsed = true
    const demo = route.query.demo
    const values = demo === 'over' ? [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2] : demo === 'won' ? [2048, 4, 8, 16, 2, 8, 32, 64] : [2, 2, 4, 8, 16, 32, 64, 128]
    tiles.value = values.map((value, i) => ({ id: nextId++, value, row: Math.floor(i / 4), col: i % 4 }))
    if (demo === 'over' || demo === 'won') { status.value = demo; celebrated = demo === 'won'; score.value = 2048; best.value = Math.max(best.value, 2048); steps.value = 168 }
  }
  void scene?.pop(tiles.value, tiles.value.map(t => t.id))
}
async function initialize() {
  status.value = 'loading'
  try {
    const { createScene } = await import('~/games/2048/scene')
    if (!alive) return
    scene?.dispose()
    scene = createScene(host.value!, () => reduced.value)
    restart()
  }
  catch { status.value = 'error' }
}
async function input(direction: Direction) {
  if (status.value !== 'playing' || !scene) return
  if (busy.value) { queued = direction; return }
  const turn = move(tiles.value, direction)
  if (!turn.changed) return
  busy.value = true
  const token = generation
  await scene.turn(turn)
  if (token !== generation) return
  score.value += turn.gain; steps.value++
  gain.value = turn.gain
  if (score.value > best.value) {
    best.value = score.value
    try { localStorage.setItem('2048-three-best', String(best.value)) } catch {}
  }
  tiles.value = spawn(turn.tiles, nextId++)
  if (turn.merged.length && !reduced.value) particles.value++
  await scene.pop(tiles.value, [...turn.merged, nextId - 1])
  if (token !== generation) return
  gain.value = 0
  const won = !celebrated && highest.value >= 2048
  if (won || isOver(tiles.value)) {
    queued = undefined
    status.value = won ? 'won' : 'over'
    if (won) { celebrated = true; if (!reduced.value) particles.value++ }
    await scene.finish(won)
    if (token !== generation) return
  }
  busy.value = false
  if (queued) { const next = queued; queued = undefined; void input(next) }
}
function continueGame() { status.value = isOver(tiles.value) ? 'over' : 'playing' }
function keydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement
  if (e.altKey || e.ctrlKey || e.metaKey || target.closest('input,textarea,select,button,[contenteditable="true"]')) return
  const keys: Record<string, Direction> = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down' }
  const direction = keys[e.key]
  if (direction && status.value === 'playing') { e.preventDefault(); void input(direction) }
}
let touch: { x: number; y: number } | undefined
function pointerDown(e: PointerEvent) { if ((e.target as HTMLElement).closest('button,a')) return; touch = { x: e.clientX, y: e.clientY }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) }
function pointerUp(e: PointerEvent) {
  if (!touch) return
  const dx = e.clientX - touch.x; const dy = e.clientY - touch.y
  touch = undefined
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return
  void input(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up')
}
function motionChange() { reduced.value = !!media?.matches }
onMounted(() => {
  try { const saved = Number(localStorage.getItem('2048-three-best')); best.value = Number.isFinite(saved) && saved > 0 ? saved : 0 } catch {}
  media = matchMedia('(prefers-reduced-motion: reduce)'); motionChange(); media.addEventListener('change', motionChange)
  window.addEventListener('keydown', keydown)
  void initialize()
})
onBeforeUnmount(() => { alive = false; generation++; scene?.dispose(); window.removeEventListener('keydown', keydown); media?.removeEventListener('change', motionChange) })
</script>

<template>
  <section class="lab" aria-label="Three.js 2048 游戏">
    <header class="intro"><span class="eyebrow">THE LITTLE BLOCK LAB · 001</span><h1>小小方块，<br>再玩一局。</h1><p>滑动、碰撞、合而为一。让数字在积木里长大。</p></header>
    <div class="game-top"><div class="wordmark">2048<span>THREE DIMENSIONS</span></div><div class="scores"><div><small>本局得分</small><strong aria-live="polite">{{ score }}</strong></div><div><small>最高纪录</small><strong>{{ best }}</strong></div></div></div>
    <div class="toolbar"><span>目标 <b>2048</b> · {{ steps }} 步</span><button :disabled="status === 'loading' || status === 'error'" @click="restart">↻ 重新开始</button></div>
    <div class="stage" :class="{ settled: status === 'over' }" @pointerdown="pointerDown" @pointerup="pointerUp" @pointercancel="touch = undefined">
      <div ref="host" class="canvas-host" aria-hidden="true" />
      <span v-if="gain" :key="steps" class="score-gain">+{{ gain }}</span>
      <div v-if="particles" :key="particles" class="particles" aria-hidden="true"><i v-for="n in 24" :key="n" :style="{ '--angle': `${n * 137.5}deg`, '--distance': `${70 + n % 5 * 22}px`, '--delay': `${n % 4 * 20}ms` }" /></div>
      <div v-if="status === 'loading' || status === 'error'" class="overlay"><p>{{ status === 'loading' ? '正在搭建积木世界…' : '立体棋盘暂时无法启动' }}</p><template v-if="status === 'error'"><button @click="initialize">重新尝试</button><a href="/2048/index.html">玩经典版 →</a></template></div>
      <div v-if="status === 'won' || status === 'over'" class="overlay result" role="dialog" aria-modal="false" aria-label="游戏结算">
        <span class="eyebrow">{{ status === 'won' ? 'A LITTLE BIG MOMENT' : 'EVERY END IS A NEW START' }}</span><h2>{{ status === 'won' ? '2048，做到了！' : '这局，值得纪念。' }}</h2><p>{{ score > startingBest ? '新的最高纪录 ✦' : '下一次，让数字再大一点。' }}</p><strong class="final-score">{{ score }}</strong><p>最高方块 {{ highest }} · 有效步数 {{ steps }}</p><button v-if="status === 'won'" @click="continueGame">继续挑战</button><button @click="restart">再来一局</button>
      </div>
    </div>
    <div class="bottom"><p>方向键 / WASD 移动<br><span>手机上，在棋盘内轻扫即可</span></p><div class="directions"><button v-for="(label, direction) in { up: '↑', left: '←', down: '↓', right: '→' }" :key="direction" :aria-label="`向${{ up: '上', left: '左', down: '下', right: '右' }[direction]}移动`" :disabled="status !== 'playing'" @click="input(direction)">{{ label }}</button></div></div>
    <div class="board-reader" aria-live="polite">棋盘：{{ tiles.map(t => `第${t.row + 1}行第${t.col + 1}列 ${t.value}`).join('；') }}</div>
    <footer><RouterLink to="/posts/2048-threejs">阅读这次 AI 重做的制作手记 ↗</RouterLink><a href="/2048/index.html">2019 · 经典原版 ↗</a></footer>
  </section>
</template>

<style scoped>
.lab{max-width:760px;margin:auto;background:#faf7f0;color:#645a4c;padding:48px 48px 28px;border-radius:28px;font-family:system-ui,sans-serif}.eyebrow{font-size:10px;letter-spacing:2px;color:#968675}.intro h1{font-size:48px;line-height:1.2;font-weight:750;letter-spacing:-2px;margin:20px 0 14px}.intro p{font-size:14px;color:#938678}.game-top{display:flex;justify-content:space-between;align-items:center;margin-top:38px}.wordmark{font-size:48px;font-weight:800;letter-spacing:-3px}.wordmark span{display:block;font-size:8px;letter-spacing:2px;font-weight:500}.scores{display:flex;gap:24px;text-align:right}.scores small{display:block;font-size:10px;color:#968675}.scores strong{font-size:25px}.toolbar{display:flex;justify-content:space-between;align-items:center;margin-top:24px;font-size:12px}.lab button{border:1px solid #d7cbbb;border-radius:10px;padding:9px 15px;background:#eee7da;color:#645a4c;cursor:pointer}.lab button:hover{background:#e6dac7}.lab button:focus-visible,.lab a:focus-visible{outline:3px solid #b68a40;outline-offset:3px}.lab button:disabled{opacity:.45;cursor:default}.stage{height:480px;position:relative;touch-action:none}.canvas-host{position:absolute;inset:0;animation:appear .6s ease}.canvas-host :deep(canvas){display:block;width:100%;height:100%}.settled .canvas-host{opacity:.45}.overlay{position:absolute;inset:30px 0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;border-radius:24px;background:#faf7f0e8;text-align:center;padding:20px}.result{animation:appear .4s ease}.result h2{font-size:28px;font-weight:750}.result p{font-size:13px}.final-score{font-size:56px;line-height:1.1}.bottom{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:12px}.bottom p span{color:#a09180;font-size:10px}.directions{display:flex;gap:5px}.directions button{padding:7px 11px}.lab footer{margin-top:32px;border-top:1px solid #e7dfd2;padding-top:20px;display:flex;justify-content:space-between;gap:12px;font-size:10px;color:#968675}.score-gain{position:absolute;left:48%;top:30%;font-size:28px;font-weight:800;color:#b38435;animation:gain .5s both}.particles{position:absolute;left:50%;top:50%;pointer-events:none}.particles i{position:absolute;width:7px;height:7px;border-radius:2px;background:#dbab52;animation:spark .65s var(--delay) both;transform:rotate(var(--angle))}.board-reader{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}@keyframes spark{from{opacity:1;transform:rotate(var(--angle)) translateX(10px)}to{opacity:0;transform:rotate(var(--angle)) translateX(var(--distance)) rotate(90deg)}}@keyframes gain{to{transform:translateY(-45px);opacity:0}}@keyframes appear{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}@media(max-width:600px){.lab{padding:25px 16px;border-radius:18px;margin:0 -18px}.intro h1{font-size:38px}.stage{height:350px}.scores{gap:14px}.lab footer{flex-direction:column}.directions button{padding:7px 10px}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important}.particles{display:none}}
</style>
