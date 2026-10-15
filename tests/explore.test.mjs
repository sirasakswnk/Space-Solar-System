import test from 'node:test'
import assert from 'node:assert/strict'
import { Vector3 } from 'three'
import { resetOrbit, rotateOrbit, zoomOrbit, orbitPosition, transitionPosition, hotspotOrbit, sampleFocusOrbit } from '../src/journey/explore.ts'
import { mercury } from '../src/data/planets.ts'
import { mercuryCenter, mercuryRadius, shipPath } from '../src/journey/path.ts'
import { sampleCamera, travelParameter } from '../src/journey/launch.ts'

test('repeated zoom and rotation keep exploration outside planet and away from poles', () => {
  const orbit = { yaw: 0, pitch: 0, distance: 8 }
  for (let i = 0; i < 500; i++) {
    rotateOrbit(orbit, 0.7, i < 250 ? 0.1 : -0.1)
    zoomOrbit(orbit, i < 250 ? -600 : 600)
    const point = orbitPosition(orbit, mercuryCenter, new Vector3())
    assert.ok(point.toArray().every(Number.isFinite))
    assert.ok(Math.abs(orbit.pitch) <= 1.1)
    assert.ok(orbit.distance >= 3.6 && orbit.distance <= 12)
    assert.ok(point.distanceTo(mercuryCenter) > mercuryRadius)
  }
  assert.equal(orbit.distance, 12)
})

test('reset orbit restores initial view after rotation and zoom', () => {
  const orbit = { yaw: -4, pitch: -1.1, distance: 3.6 }
  resetOrbit(orbit)
  assert.deepEqual(orbit, { yaw: 0.55, pitch: 0.2, distance: 8 })
})

test('hotspot focus uses the shorter orbit and keeps a safe radius through repeated selections', () => {
  for (const yaw of [-Math.PI, -0.1, Math.PI * 2 - 0.05]) {
    for (const pitch of [-1.1, 1.1]) {
      let from = { yaw, pitch, distance: mercury.orbit.min }
      for (const hotspot of mercury.hotspots) {
        const to = hotspotOrbit(mercury, hotspot)
        const out = { ...from }
        for (let i = 0; i <= 100; i++) {
          sampleFocusOrbit(from, to, i / 100, out)
          assert.ok(Math.abs(out.yaw - from.yaw) <= Math.PI || i === 100)
          assert.ok(Math.abs(out.pitch) <= 1.1)
          assert.ok(out.distance >= mercury.orbit.min && out.distance <= mercury.orbit.max)
          assert.ok(orbitPosition(out, mercuryCenter, new Vector3()).distanceTo(mercuryCenter) > mercuryRadius)
        }
        assert.deepEqual(out, to)
        // Selecting the next point mid-animation must start at the applied orbit.
        sampleFocusOrbit(from, to, 0.4, out)
        from = { ...out }
      }
    }
  }
})

test('orbit helpers respect planet-specific bounds and clamp invalid hotspot focus distances', () => {
  const planet = { ...mercury, orbit: { yaw: 1, pitch: 0.3, distance: 14, min: 10, max: 20 } }
  const orbit = { yaw: 0, pitch: 0, distance: 1 }
  resetOrbit(orbit, planet)
  assert.deepEqual(orbit, { yaw: 1, pitch: 0.3, distance: 14 })
  zoomOrbit(orbit, -10000, planet)
  assert.equal(orbit.distance, 10)
  zoomOrbit(orbit, 10000, planet)
  assert.equal(orbit.distance, 20)
  assert.equal(hotspotOrbit(planet, { ...mercury.hotspots[0], focusDistance: 2 }).distance, 10)
  assert.equal(hotspotOrbit(planet, { ...mercury.hotspots[0], focusDistance: 100 }).distance, 20)
})

test('entry transition from reachable Mercury travel poses never cuts through planet', () => {
  const orbit = { yaw: 0.55, pitch: 0.2, distance: 8 }
  const destination = orbitPosition(orbit, mercuryCenter, new Vector3())
  for (let i = 85; i <= 100; i++) {
    const progress = i / 100
    const parameter = travelParameter(progress)
    const from = new Vector3()
    sampleCamera(progress, shipPath.getPoint(parameter), shipPath.getTangent(parameter), from, new Vector3())
    for (let j = 0; j <= 100; j++) {
      const camera = transitionPosition(from, destination, mercuryCenter, j / 100, new Vector3())
      assert.ok(camera.distanceTo(mercuryCenter) > mercuryRadius)
    }
  }
})

test('exit transition from opposite orbit views stays outside planet and reaches exact endpoint', () => {
  const destination = new Vector3(6, 12, -36)
  const out = new Vector3()
  for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2, 3.75]) {
    for (const pitch of [-1.1, 0, 1.1]) {
      const from = orbitPosition({yaw,pitch,distance:3.6}, mercuryCenter, new Vector3())
      for (let i = 0; i <= 100; i++) {
        transitionPosition(from, destination, mercuryCenter, i / 100, out)
        assert.ok(out.toArray().every(Number.isFinite))
        assert.ok(out.distanceTo(mercuryCenter) > mercuryRadius)
      }
      assert.deepEqual(out.toArray(), destination.toArray())
    }
  }
  const opposite = new Vector3(0, 9, -58)
  for (let i = 0; i <= 100; i++) {
    transitionPosition(opposite, new Vector3(0, 9, -42), mercuryCenter, i / 100, out)
    assert.ok(out.distanceTo(mercuryCenter) > mercuryRadius)
  }
})
