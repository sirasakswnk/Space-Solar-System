import test from 'node:test'
import assert from 'node:assert/strict'
import { Vector3 } from 'three'
import { jupiter, saturn } from '../src/data/planets.ts'
import { hotspotOrbit, orbitPosition, rotateOrbit, zoomOrbit } from '../src/journey/explore.ts'

test('giant exploration stays outside bodies and Saturn rings through extreme zoom and rotation', () => {
  for (const planet of [jupiter, saturn]) {
    const center = new Vector3(...planet.scene.center)
    const orbit = { ...planet.orbit }
    for (let i = 0; i < 500; i++) {
      rotateOrbit(orbit, 0.3, i % 2 ? -0.1 : 0.1)
      zoomOrbit(orbit, i < 250 ? -600 : 600, planet)
      assert.ok(orbit.distance >= planet.orbit.min && orbit.distance <= planet.orbit.max)
      assert.ok(orbitPosition(orbit, center, new Vector3()).distanceTo(center)
        > (planet.rings?.outer ?? planet.scene.radius) + 0.1)
    }
  }
})

test('Saturn ring marker lies on its ring plane while ring and body views remain distinct', () => {
  const ring = saturn.hotspots.find(point => point.kind === 'rings')
  const body = saturn.hotspots.find(point => point.kind === 'body')
  const marker = orbitPosition({ ...ring.anchor, distance: saturn.scene.radius + ring.anchor.height }, new Vector3(), new Vector3())
  const normal = new Vector3(-Math.sin(saturn.rings.tilt), Math.cos(saturn.rings.tilt), 0)
  assert.ok(Math.abs(marker.dot(normal)) < 1e-9)
  assert.ok(marker.length() > saturn.rings.inner && marker.length() < saturn.rings.outer)
  const wide = hotspotOrbit(saturn, ring), close = hotspotOrbit(saturn, body)
  assert.ok(wide.distance > close.distance && wide.pitch > close.pitch)
})
