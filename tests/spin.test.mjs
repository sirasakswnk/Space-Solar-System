import test from 'node:test'
import assert from 'node:assert/strict'
import { Quaternion, Vector3 } from 'three'
import { meshSpin, spinSpeeds, worldSpin } from '../src/journey/spin.ts'
import { hotspotOrbit, orbitPosition } from '../src/journey/explore.ts'
import { journeyPlanets, uranus } from '../src/data/planets.ts'

test('no spin at time zero: mesh keeps its tilt and hotspots their positions', () => {
  for (const planet of journeyPlanets) {
    const tilt = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), planet.axisTilt ?? 0)
    assert.ok(meshSpin(planet, 0, new Quaternion()).angleTo(tilt) < 1e-9)
    assert.ok(worldSpin(planet, 0, new Quaternion()).angleTo(new Quaternion()) < 1e-9)
  }
})

test('texture points and hotspot outlines stay together at any spin time', () => {
  const local = [new Vector3(1, 0, 0), new Vector3(0.3, 0.8, -0.5).normalize(), new Vector3(-0.6, -0.2, 0.77).normalize()]
  for (const planet of journeyPlanets) for (const time of [7, 123.4, 1000]) {
    for (const point of local) {
      const surface = point.clone().applyQuaternion(meshSpin(planet, time, new Quaternion()))
      const hotspot = point.clone().applyQuaternion(meshSpin(planet, 0, new Quaternion())).applyQuaternion(worldSpin(planet, time, new Quaternion()))
      assert.ok(surface.distanceTo(hotspot) < 1e-9, `${planet.id} t=${time}`)
    }
  }
})

test('Uranus spins about its tilted axis; Venus turns backwards and Jupiter fastest', () => {
  const axis = new Vector3(0, 1, 0).applyAxisAngle(new Vector3(0, 0, 1), uranus.axisTilt)
  assert.ok(axis.clone().applyQuaternion(worldSpin(uranus, 50, new Quaternion())).distanceTo(axis) < 1e-9)
  assert.ok(spinSpeeds.venus < 0)
  assert.equal(Math.max(...Object.values(spinSpeeds)), spinSpeeds.jupiter)
})

test('hotspot focus faces the spun hotspot and is unchanged without spin', () => {
  for (const planet of journeyPlanets) for (const hotspot of planet.hotspots) {
    assert.deepEqual(hotspotOrbit(planet, hotspot, 0), hotspotOrbit(planet, hotspot))
    if (hotspot.view || Math.abs(hotspot.anchor.pitch) > 1.05) continue
    const time = 37
    const target = orbitPosition({ ...hotspot.anchor, distance: 1 }, new Vector3(), new Vector3())
      .applyQuaternion(worldSpin(planet, time, new Quaternion()))
    const camera = orbitPosition({ ...hotspotOrbit(planet, hotspot, time), distance: 1 }, new Vector3(), new Vector3())
    // Pitch is clamped to ±1.1 rad, so allow a small difference near the poles.
    assert.ok(camera.dot(target) > 0.99, `${planet.id}/${hotspot.id}`)
  }
})
