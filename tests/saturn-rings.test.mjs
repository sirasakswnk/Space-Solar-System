import test from 'node:test'
import assert from 'node:assert/strict'
import { RingGeometry } from 'three'
import { saturn } from '../src/data/planets.ts'
import { createSaturnRingResources, saturnRingBands } from '../src/data/saturnRings.ts'

test('radial ring UVs preserve the original vertices, envelope and open gap', () => {
  assert.equal(saturnRingBands[0].inner, saturn.rings.inner)
  assert.equal(saturnRingBands.at(-1).outer, saturn.rings.outer)
  assert.ok(Math.abs(saturnRingBands[2].inner - saturnRingBands[1].outer - 0.4) < 1e-9)
  for (const { inner, outer } of saturnRingBands) {
    const { geometry, texture } = createSaturnRingResources(inner, outer)
    const original = new RingGeometry(inner, outer, 96)
    assert.deepEqual(geometry.getAttribute('position').array, original.getAttribute('position').array)
    assert.deepEqual(geometry.index.array, original.index.array)
    const positions = geometry.getAttribute('position'), uv = geometry.getAttribute('uv')
    for (let i = 0; i < positions.count; i++) {
      const radius = Math.hypot(positions.getX(i), positions.getY(i))
      assert.ok(Math.abs(inner + uv.getX(i) * (outer - inner) - radius) < 1e-6)
      assert.equal(uv.getY(i), 0.5)
    }
    original.dispose(); geometry.dispose(); texture.dispose()
  }
})

test('local ring maps contain radial detail, translucent grain and soft edges without animation', () => {
  for (const { inner, outer } of saturnRingBands) {
    const a = createSaturnRingResources(inner, outer), b = createSaturnRingResources(inner, outer)
    const pixels = a.texture.image.data
    assert.equal(a.texture.image.width, 1024)
    assert.equal(a.texture.image.height, 1)
    assert.equal(a.texture.colorSpace, 'srgb')
    assert.deepEqual(pixels, b.texture.image.data)
    assert.equal(pixels[3], 0)
    assert.equal(pixels.at(-1), 0)
    const colors = new Set(), alphas = new Set()
    for (let i = 32; i < 992; i++) {
      colors.add(pixels[i * 4]); alphas.add(pixels[i * 4 + 3])
      assert.ok(pixels[i * 4 + 3] > 0 && pixels[i * 4 + 3] < 255)
    }
    assert.ok(colors.size > 40 && alphas.size > 40, 'Ring would look like a flat strip')
    a.geometry.dispose(); a.texture.dispose(); b.geometry.dispose(); b.texture.dispose()
  }
})
