import { describe, expect, it } from 'vitest'
import { isOver, move, spawn } from '../src/games/2048/engine'
import type { Tile } from '../src/games/2048/engine'
const row = (values: number[]): Tile[] => values.map((value, col) => ({ id: col, value, col, row: 0 }))
describe('2048 rules', () => {
  it('merges once per turn and sums score', () => {
    const turn = move(row([2, 2, 4, 4]), 'left')
    expect(turn.tiles.map(t => t.value)).toEqual([4, 8]); expect(turn.gain).toBe(12)
    expect(move(row([2, 2, 2, 2]), 'left').tiles.map(t => t.value)).toEqual([4, 4])
  })
  it('moves in all directions', () => {
    expect(move(row([2]), 'right').tiles[0].col).toBe(3)
    expect(move(row([2]), 'down').tiles[0].row).toBe(3)
    expect(move([{ id: 1, value: 2, row: 3, col: 3 }], 'up').tiles[0].row).toBe(0)
    expect(move(row([2]), 'left').changed).toBe(false)
  })
  it('spawns in empty cells with the correct probability boundary', () => {
    expect(spawn([], 1, () => 0)[0].value).toBe(2)
    expect(spawn([], 1, () => 0.9)[0].value).toBe(4)
    expect(spawn(row([2, 4, 8, 16]), 9, () => 0)[4].row).toBe(1)
  })
  it('detects blocked boards and allows full boards with a merge', () => {
    const board = Array.from({ length: 16 }, (_, id) => ({ id, row: Math.floor(id / 4), col: id % 4, value: (Math.floor(id / 4) + id % 4) % 2 ? 4 : 2 }))
    expect(isOver(board)).toBe(true)
    board[0].value = 4
    expect(isOver(board)).toBe(false)
  })
  it('can keep merging after reaching 2048', () => {
    expect(move(row([1024, 1024]), 'left').tiles[0].value).toBe(2048)
    expect(move(row([2048, 2048]), 'left').tiles[0].value).toBe(4096)
  })
})
