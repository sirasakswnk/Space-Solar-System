import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { detectWebGL } from '../src/journey/webgl.ts'
import { planetImages } from '../src/data/planetImages.ts'
import { journeyPlanets } from '../src/data/planets.ts'

test('WebGL detection accepts WebGL 2 or 1 and rejects missing or throwing contexts', () => {
  const canvas = available => ({ getContext: type => available.includes(type) ? {} : null })
  assert.equal(detectWebGL(() => canvas(['webgl2'])), true)
  assert.equal(detectWebGL(() => canvas(['webgl'])), true)
  assert.equal(detectWebGL(() => canvas([])), false)
  assert.equal(detectWebGL(() => ({ getContext() { throw new Error('blocked') } })), false)
  assert.equal(detectWebGL(() => { throw new Error('no canvas') }), false)
})

test('the fallback page has a local image and alt text for Earth and all seven planets', () => {
  for (const id of ['earth', ...journeyPlanets.map(planet => planet.id)]) {
    const image = planetImages[id]
    assert.ok(image, id)
    assert.ok(image.alt.length > 0)
    assert.ok(existsSync(new URL(`../public${image.src}`, import.meta.url)), image.src)
  }
})
