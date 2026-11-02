// Audio assets and playback ranges from NianBroken/Firework_Simulator.
// Copyright © 2022 NianBroken. Apache-2.0; see ./audio/simulator/LICENSE.
// Local integration: loading, panning, mute, voice limits and lifecycle controls.
const SOURCES = {
  lift: { files: ['simulator/lift1.mp3', 'simulator/lift2.mp3', 'simulator/lift3.mp3'], volume: 1, rate: [0.85, 0.95] },
  burst: { files: ['simulator/burst1.mp3', 'simulator/burst2.mp3'], volume: 1, rate: [0.8, 0.9] },
  burstSmall: { files: ['simulator/burst-sm-1.mp3', 'simulator/burst-sm-2.mp3'], volume: 0.25, rate: [0.8, 1] },
  crackle: { files: ['simulator/crackle1.mp3'], volume: 0.2, rate: [1, 1] },
  crackleSmall: { files: ['simulator/crackle-sm-1.mp3'], volume: 0.3, rate: [1, 1] },
}
const SAMPLE_FILES = Object.values(SOURCES).flatMap(source => source.files)

export class FireworkSound {
  constructor(onState = () => {}) {
    this.context = null
    this.master = null
    this.buffers = []
    this.loading = null
    this.loadFailed = false
    this.lastAttempt = 0
    this.enabled = true
    this.active = true
    this.volume = 0.35
    this.voices = new Set()
    this.lastSamples = new Map()
    this.onState = onState
  }

  async loadSamples() {
    if (this.buffers.length) return
    if (this.loading) return this.loading
    // Repeated pointer events should not repeatedly fetch missing files.
    if (this.loadFailed && Date.now() - this.lastAttempt < 5000) return
    this.lastAttempt = Date.now()
    this.loadFailed = false
    this.loading = Promise.all(SAMPLE_FILES.map(async (name) => {
      const response = await fetch(new URL(`./audio/${name}`, import.meta.url), { signal: AbortSignal.timeout(15000) })
      if (!response.ok) throw new Error('Audio unavailable')
      return this.context.decodeAudioData(await response.arrayBuffer())
    })).then((buffers) => { this.buffers = buffers }).catch(() => {
      this.loadFailed = true
    }).finally(() => {
      this.loading = null
      this.report()
    })
    this.report()
    return this.loading
  }

  async unlock() {
    if (!this.enabled) return
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) { this.onState('当前浏览器不支持音效'); return }
    try {
      if (!this.context) {
        this.context = new AudioContext()
        this.master = this.context.createGain()
        const limiter = this.context.createDynamicsCompressor()
        limiter.threshold.value = -12
        limiter.knee.value = 18
        limiter.ratio.value = 6
        limiter.attack.value = 0.003
        limiter.release.value = 0.2
        this.master.connect(limiter).connect(this.context.destination)
        this.context.onstatechange = () => this.report()
        this.updateGain()
      }
      // Invoke resume directly in the user gesture, before waiting for downloads.
      const resumed = this.context.state === 'suspended' ? this.context.resume() : Promise.resolve()
      await Promise.all([resumed, this.loadSamples()])
      this.report()
    }
    catch { this.onState('声音未能启用，请再次点击声音开关') }
  }

  report() {
    let message = '点击页面后开启声音'
    if (!this.enabled) message = '声音已关闭'
    else if (this.loading) message = '正在加载真实烟花录音…'
    else if (this.loadFailed) message = '录音加载失败，稍后点击页面重试'
    else if (this.buffers.length && this.context?.state === 'running') message = '真实烟花音效 · 随机余响'
    this.onState(message)
  }

  updateGain() {
    if (!this.master) return
    this.master.gain.setTargetAtTime(this.enabled && this.active ? this.volume : 0, this.context.currentTime, 0.02)
  }

  setEnabled(enabled) {
    this.enabled = enabled
    if (!enabled) this.stop()
    this.updateGain()
    this.report()
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
    this.updateGain()
  }

  setActive(active) {
    this.active = active
    if (!active) this.stop()
    this.updateGain()
  }

  stop() {
    for (const voice of this.voices) {
      try { voice.stop() }
      catch {}
    }
  }

  canPlay() {
    return this.enabled && this.active && this.volume > 0 && this.buffers.length === SAMPLE_FILES.length && this.context?.state === 'running' && this.voices.size < 16
  }

  play(buffer, x, gain, rate = 1, delay = 0) {
    if (!this.canPlay()) return
    const context = this.context, now = context.currentTime + delay
    const duration = buffer.duration / rate
    const source = context.createBufferSource()
    source.buffer = buffer
    source.playbackRate.value = rate
    const envelope = context.createGain()
    envelope.gain.setValueAtTime(0, now)
    envelope.gain.linearRampToValueAtTime(gain, now + 0.004)
    envelope.gain.setValueAtTime(gain, now + Math.max(0.005, duration - 0.08))
    envelope.gain.linearRampToValueAtTime(0, now + duration)
    source.connect(envelope)
    const pan = context.createStereoPanner?.()
    if (pan) {
      pan.pan.value = Math.max(-0.75, Math.min(0.75, x * 2 - 1))
      envelope.connect(pan).connect(this.master)
    }
    else envelope.connect(this.master)
    this.voices.add(source)
    source.onended = () => {
      this.voices.delete(source)
      source.disconnect(); envelope.disconnect(); pan?.disconnect()
    }
    source.start(now)
    source.stop(now + duration)
  }

  playGroup(type, x, scale = 1, delay = 0) {
    if (!this.canPlay()) return
    const group = SOURCES[type]
    const options = group.files.filter(file => group.files.length === 1 || file !== this.lastSamples.get(type))
    const file = options[Math.floor(Math.random() * options.length)]
    this.lastSamples.set(type, file)
    const normalized = Math.max(0, Math.min(1, scale))
    const rate = (group.rate[0] + Math.random() * (group.rate[1] - group.rate[0])) * (2 - normalized)
    this.play(this.buffers[SAMPLE_FILES.indexOf(file)], x, group.volume * normalized, rate, delay)
  }

  launch(x) {
    // Preserve the complete lift recording and the reference site's playback speed.
    this.playGroup('lift', x)
  }

  burst(x, strength = 1, { sparkle = true } = {}) {
    const small = strength < 0.8
    const type = small ? 'burstSmall' : 'burst'
    this.playGroup(type, x, strength)
    // Crackle is an occasional accent, not a layer on every explosion.
    if (sparkle && Math.random() < 0.35)
      this.playGroup(Math.random() < 0.5 ? 'crackle' : 'crackleSmall', x, strength, 0.15)
  }
}
