import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { Tile, Turn } from './engine'

export function createScene(host: HTMLElement, reduced: () => boolean) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  host.appendChild(renderer.domElement)
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100)
  camera.position.set(0, 8.8, 5.4)
  camera.lookAt(0, 0, 0)
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb2a28d, 1.8))
  const light = new THREE.DirectionalLight(0xffffff, 2.2)
  light.position.set(-3, 7, 4)
  light.castShadow = true
  light.shadow.mapSize.set(1024, 1024)
  scene.add(light)
  const geometry = new RoundedBoxGeometry(0.91, 0.34, 0.91, 3, 0.08)
  const baseGeometry = new RoundedBoxGeometry(4.55, 0.25, 4.55, 3, 0.12)
  const baseMaterial = new THREE.MeshStandardMaterial({ color: '#c4b7a5', roughness: 0.8 })
  const base = new THREE.Mesh(baseGeometry, baseMaterial)
  base.position.y = -0.32
  base.receiveShadow = true
  scene.add(base)
  const slotMaterial = new THREE.MeshStandardMaterial({ color: '#ded5c8' })
  const position = (row: number, col: number) => new THREE.Vector3(col - 1.5, 0, row - 1.5)
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const mesh = new THREE.Mesh(geometry, slotMaterial)
    mesh.position.copy(position(r, c)); mesh.position.y = -0.22
    mesh.receiveShadow = true
    scene.add(mesh)
  }
  const meshes = new Map<number, THREE.Group>()
  const resources: { dispose: () => void }[] = [geometry, baseGeometry, baseMaterial, slotMaterial]
  const palette = ['#f4eadc', '#efdfc0', '#eeb57b', '#ef986a', '#e97b65', '#da675c', '#edc86c', '#e4ba54', '#dbaa45', '#cf9c35', '#c08b24']
  function tileMesh(tile: Tile) {
    const group = new THREE.Group()
    const color = palette[Math.min(Math.log2(tile.value) - 1, palette.length - 1)]
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.5 })
    const block = new THREE.Mesh(geometry, material)
    block.castShadow = true; block.receiveShadow = true
    group.add(block)
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 256
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = tile.value <= 4 ? '#665b4e' : '#fffaf0'
    ctx.font = `bold ${tile.value >= 10000 ? 64 : tile.value >= 1000 ? 78 : 100}px sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(tile.value), 128, 138)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    const textMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })
    const textGeometry = new THREE.PlaneGeometry(0.84, 0.84)
    const label = new THREE.Mesh(textGeometry, textMaterial)
    label.rotation.x = -Math.PI / 2; label.position.y = 0.176
    group.add(label)
    resources.push(material, texture, textMaterial, textGeometry)
    group.position.copy(position(tile.row, tile.col))
    meshes.set(tile.id, group); scene.add(group)
    return group
  }
  function clearTiles() {
    meshes.forEach(m => scene.remove(m)); meshes.clear()
    resources.splice(4).forEach(r => r.dispose())
  }
  function sync(tiles: Tile[]) { clearTiles(); tiles.forEach(tileMesh) }
  let active: { start: number; duration: number; update: (t: number) => void; done: () => void } | undefined
  let disposed = false
  let frame = 0
  function animate(duration: number, update: (t: number) => void) {
    cancel()
    return new Promise<void>(resolve => { active = { start: performance.now(), duration: reduced() ? 45 : duration, update, done: resolve } })
  }
  function cancel() { const old = active; active = undefined; old?.done() }
  const observer = new ResizeObserver(() => {
    const width = host.clientWidth; const height = host.clientHeight
    renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix()
  })
  observer.observe(host)
  let hiddenAt = 0
  function visibility() {
    if (document.hidden) { hiddenAt = performance.now(); cancelAnimationFrame(frame) }
    else { if (active) active.start += performance.now() - hiddenAt; loop() }
  }
  function loop() {
    if (disposed || document.hidden) return
    if (active) {
      const current = active
      const t = Math.min(1, (performance.now() - current.start) / current.duration)
      current.update(t)
      if (t === 1 && active === current) { active = undefined; current.done() }
    }
    renderer.render(scene, camera)
    frame = requestAnimationFrame(loop)
  }
  document.addEventListener('visibilitychange', visibility)
  loop()
  return {
    sync, cancel,
    async turn(turn: Turn) {
      await animate(150, t => turn.motions.forEach(m => {
        const mesh = meshes.get(m.tile.id)
        mesh?.position.lerpVectors(position(m.tile.row, m.tile.col), position(m.row, m.col), 1 - (1 - t) ** 3)
      }))
    },
    pop(tiles: Tile[], ids: number[]) {
      sync(tiles)
      return animate(230, t => ids.forEach(id => meshes.get(id)?.scale.setScalar(0.6 + 0.4 * t + Math.sin(t * Math.PI) * 0.3)))
    },
    finish(won: boolean) {
      return animate(won ? 650 : 300, t => {
        base.position.x = !won && !reduced() ? Math.sin(t * 40) * 0.045 * (1 - t) : 0
        if (won) meshes.forEach(m => { m.position.y = reduced() ? 0 : Math.sin(t * Math.PI) * 0.22 })
      })
    },
    dispose() { disposed = true; cancel(); cancelAnimationFrame(frame); observer.disconnect(); document.removeEventListener('visibilitychange', visibility); clearTiles(); resources.forEach(r => r.dispose()); renderer.dispose(); renderer.domElement.remove() },
  }
}
