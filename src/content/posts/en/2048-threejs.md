---
title: Rebuilding My First 2048 Game with AI
description: Revisiting my 2019 version of 2048 with AI, rebuilding it in Three.js, and adding merge effects and endgame animations.
date: 2026-11-02T08:00:00.000+00:00
lang: en
duration: 6min
---

I built a version of 2048 in 2019. It was my first little game, and it is still listed on my projects page.

Looking back at the code, each tile was a `div`, movement used `translate3d`, and each of the four directions had its own large block of logic. The best score was stored in localStorage. It is an early attempt, but it still works.

This time, I wanted to rebuild it with AI. Keep the rules, switch to Three.js, and add merge effects and endgame animations. I went with light-colored building blocks and a fixed camera: no need to rotate around, just make the numbers easy to read.

[Here is the new version](/games/2048-three), and [the original is still available](/2048/index.html).

![The initial board in the new version](/images/2048-three/initial.png)

## Separating the Game Logic First

Originally, a tile object held its number, position, and DOM node. With Three.js, these needed to be separated: the rules handle how numbers move and merge, while the scene draws the process.

Each tile has a stable `id`, along with `value`, `row`, and `col`. A move returns the next board, movement paths, merged tiles, and points gained:

```ts
export interface Turn {
  tiles: Tile[]
  motions: Motion[]
  merged: number[]
  gain: number
  changed: boolean
}
```

First, order a row or column in the direction of movement, then process the numbers in sequence. When two adjacent numbers match, merge them and skip the second number. This turns `[2, 2, 4, 4]` into `[4, 8]` on a left move, without merging the newly created 4 again in the same turn.

Invalid moves do not spawn a new tile. After a valid move, a random empty cell receives a 2 with 90% probability or a 4 with 10% probability.

The extra movement paths matter for animation. When two 2s merge into a 4, the animation needs to know where both 2s came from; the final 4 alone is not enough.

## Rebuilding the Board in Three.js

The base and tiles use rounded boxes. Hemisphere lighting, directional lighting, and shadows give them the feel of building blocks. Higher numbers shift toward warm gold.

The light-colored tiles looked too bright in the preview, so I reduced the light intensity and added tone mapping. This is something you need to see on the page; it is hard to judge from code alone.

Numbers are drawn on a Canvas, converted into textures, and placed on small planes on top of the tiles. They move and scale with the tiles, without a separate set of coordinates for numbers overlaid on the canvas.

```ts
const texture = new THREE.CanvasTexture(canvas)
texture.colorSpace = THREE.SRGBColorSpace
const textMaterial = new THREE.MeshBasicMaterial({
  map: texture,
  transparent: true,
  depthWrite: false,
})
```

Scores, buttons, and endgame panels still use Vue. There is no need to put everything into the 3D scene.

## Slide, Then Merge

Each turn has three stages: slide the tiles, commit the merged board and score, then pop the merged and newly spawned tiles into place.

Sliding takes 150ms. Keeping it quick avoids a sluggish feel during repeated moves. The easing is cubic ease-out:

```ts
mesh?.position.lerpVectors(
  position(m.tile.row, m.tile.col),
  position(m.row, m.col),
  1 - (1 - t) ** 3,
)
```

Merges also produce a ring of particles and floating score text. The particles are short page animations, while Three.js handles the 3D movement on the board.

When arrow keys are pressed rapidly, the next input may arrive before the animation finishes. The game now queues at most one direction and executes it after the current turn.

Restarting creates another issue: an asynchronous animation from the previous game may still be running. Each restart updates a task identifier. When an old animation resumes, it checks the identifier and exits if stale, so it cannot restore the previous game state.

![An example board after a merge](/images/2048-three/merge.png)

## Animations for Both Winning and Losing

The first time you make 2048, the tile lifts, a ring of gold particles appears, and the victory panel opens. You can keep playing toward 4096 and 8192; the celebration does not repeat in the same game.

Checking for game over requires looking for remaining merges. A full board is only the starting condition; if adjacent tiles still have matching numbers, the game can continue.

On a loss, the base shakes slightly and the board fades. The result card shows the score, highest tile, valid moves, and whether you set a record. The best score uses its own local storage key; if the browser denies storage access, the current game still works.

![Victory panel](/images/2048-three/won.png)

![Game-over panel](/images/2048-three/over.png)

The merge and endgame screenshots use preset boards from the development environment to make the effects easier to inspect. They are not from a complete playthrough.

## Connecting It Back to the Blog

Swipe handling is limited to the board, so scrolling still works outside it. Arrow keys, WASD, and on-screen direction buttons all use the same input function.

Three.js loads on demand after the page mounts, avoiding browser API access during static generation. The canvas resizes with its container, and pixel density is capped at 2 to reduce rendering costs on high-resolution screens. If initialization fails, the page offers a retry and a link to the classic version.

Rendering pauses when the page is hidden. Leaving the page cleans up animation loops, event listeners, geometries, materials, and textures. Three.js GPU resources must be released explicitly; the official [cleanup guide](https://threejs.org/manual/pages/cleanup.html) explains why.

When the system requests reduced motion, particles and shaking are disabled and board animations are shortened.

## Final Checks

I added 5 tests for the rules, covering all four directions, consecutive merges, tile spawning, full-board checks, and continuing after reaching 2048. Tests, type checking, and the static build all passed.

In the browser, I checked mobile widths and the desktop layout, along with direction buttons, merge scoring, continuing after a win, and restarting after a loss. I found that the preset board loaded again on restart and changed it to apply only on the initial visit.

The automated keyboard check hit a tool timeout. Real touch input, reduced motion, and WebGL startup failures have not all been tested yet; I am noting that here.

Installing dependencies took some work too. The project uses an older pnpm version that does not get along well with the default local Node version. Some old dependencies were updated along the way, so I restored the original lockfile and added only the packages needed for Three.js.

From a handful of divs in 2019 to this 3D board, with the original version still around: side by side, they make a nice keepsake.

[Play a round →](/games/2048-three)
