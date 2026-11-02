export type Direction = 'left' | 'right' | 'up' | 'down'
export interface Tile { id: number; value: number; row: number; col: number }
export interface Motion { tile: Tile; row: number; col: number }
export interface Turn { tiles: Tile[]; motions: Motion[]; merged: number[]; gain: number; changed: boolean }
export function move(tiles: Tile[], direction: Direction): Turn {
  const result: Tile[] = []
  const motions: Motion[] = []
  const merged: number[] = []
  let gain = 0
  for (let line = 0; line < 4; line++) {
    const vertical = direction === 'up' || direction === 'down'
    const reverse = direction === 'right' || direction === 'down'
    const source = tiles.filter(t => (vertical ? t.col : t.row) === line)
      .sort((a, b) => ((vertical ? a.row - b.row : a.col - b.col) * (reverse ? -1 : 1)))
    let slot = 0
    for (let i = 0; i < source.length; i++) {
      const tile = source[i]
      const position = reverse ? 3 - slot : slot
      const row = vertical ? position : line
      const col = vertical ? line : position
      const next = source[i + 1]
      motions.push({ tile, row, col })
      if (next && next.value === tile.value) {
        motions.push({ tile: next, row, col })
        result.push({ ...tile, row, col, value: tile.value * 2 })
        merged.push(tile.id)
        gain += tile.value * 2
        i++
      }
      else { result.push({ ...tile, row, col }) }
      slot++
    }
  }
  return { tiles: result, motions, merged, gain, changed: gain > 0 || motions.some(m => m.tile.row !== m.row || m.tile.col !== m.col) }
}
export function spawn(tiles: Tile[], id: number, random = Math.random): Tile[] {
  const empty = Array.from({ length: 16 }, (_, i) => i).filter(i => !tiles.some(t => t.row === Math.floor(i / 4) && t.col === i % 4))
  if (!empty.length) return tiles
  const cell = empty[Math.floor(random() * empty.length)]
  return [...tiles, { id, row: Math.floor(cell / 4), col: cell % 4, value: random() < 0.9 ? 2 : 4 }]
}
export function isOver(tiles: Tile[]) {
  return tiles.length === 16 && !(['left', 'right', 'up', 'down'] as Direction[]).some(d => move(tiles, d).changed)
}
