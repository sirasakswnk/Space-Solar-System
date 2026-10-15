import test from 'node:test'
import assert from 'node:assert/strict'
import { PerspectiveCamera, Vector3 } from 'three'
import {
  clampProgress, settleProgress, shipPath,
  earthCenter, earthRadius, mercuryCenter, mercuryRadius,
} from '../src/journey/path.ts'
import { travelParameter, sampleCamera, engineStrength, exhaustStrength, smokeStrength, spaceBlend, umbilicalExtension } from '../src/journey/launch.ts'

test('progress stays bounded for overscroll and invalid input', () => {
  assert.equal(clampProgress(-0.1), 0)
  assert.equal(clampProgress(1.1), 1)
  assert.equal(clampProgress(NaN), 0)
})

test('service arm retracts before lift-off and reverses continuously to the starting extension', () => {
  assert.equal(umbilicalExtension(0), 1)
  assert.equal(umbilicalExtension(0.04), 1)
  assert.equal(umbilicalExtension(0.1), 0.25)
  assert.equal(umbilicalExtension(1), 0.25)
  let previous = 1
  for (let i = 0; i <= 100; i++) {
    const p = i / 100, next = umbilicalExtension(p)
    assert.ok(next >= 0.25 && next <= previous)
    if (travelParameter(p) > 0) assert.equal(next, 0.25)
    previous = next
  }
  for (const p of [0.04, 0.1]) assert.ok(Math.abs(umbilicalExtension(p-1e-6)-umbilicalExtension(p+1e-6))<1e-6)
})

test('travel settles exactly after scroll stops, in either direction', () => {
  for (const fps of [30, 60, 144]) {
    for (const [start, target] of [[0, 1], [1, 0], [0.8, 0.4]]) {
      let current = start
      for (let i = 0; i < fps * 2; i++) {
        const next = settleProgress(current, target, 1 / fps)
        assert.ok(next >= Math.min(start, target) && next <= Math.max(start, target))
        current = next
      }
      assert.equal(current, target)
      assert.equal(settleProgress(current, target, 10), target)
    }
  }
})

test('path and follow camera remain outside planets, including curved segments', () => {
  const position = new Vector3()
  const camera = new Vector3()
  const tangent = new Vector3()
  const lookAt = new Vector3()
  for (let i = 0; i <= 1000; i++) {
    const progress = i / 1000
    const parameter = travelParameter(progress)
    shipPath.getPoint(parameter, position)
    shipPath.getTangent(parameter, tangent)
    sampleCamera(progress, position, tangent, camera, lookAt)
    for (const point of [position, camera]) {
      assert.ok(point.toArray().every(Number.isFinite))
      assert.ok(point.distanceTo(earthCenter) > earthRadius)
      assert.ok(point.distanceTo(mercuryCenter) > mercuryRadius)
    }
  }
  assert.deepEqual(shipPath.getPoint(0).toArray(), [0, 0.65, 0])
  assert.deepEqual(shipPath.getPoint(1).toArray(), [3, 9, -43])
})

test('ignition holds ship on pad; launch mapping and effects have no boundary jumps', () => {
  assert.equal(travelParameter(0.04), 0)
  assert.equal(travelParameter(0.1), 0)
  assert.ok(engineStrength(0.08) > 0)
  assert.equal(engineStrength(0), 0)
  assert.equal(exhaustStrength(0), 0)
  assert.equal(smokeStrength(0), 0)
  assert.equal(exhaustStrength(1), 0)
  assert.equal(smokeStrength(1), 0)
  assert.equal(spaceBlend(0), 0)
  assert.equal(spaceBlend(0.45), 1)
  for (const boundary of [0.04, 0.1, 0.12, 0.16, 0.2, 0.27, 0.32, 0.45, 0.6, 0.65]) {
    for (const sample of [travelParameter, engineStrength, exhaustStrength, smokeStrength, spaceBlend]) {
      assert.ok(Math.abs(sample(boundary + 0.000001) - sample(boundary - 0.000001)) < 0.0001)
    }
  }
  let previous = 0
  for (let i = 0; i <= 1000; i++) {
    const next = travelParameter(i / 1000)
    assert.ok(next >= previous && next <= 1)
    previous = next
  }
})

test('launch camera is continuous at transitions to follow and wide views', () => {
  const sample = (progress) => {
    const parameter = travelParameter(progress)
    const position = new Vector3()
    const lookAt = new Vector3()
    sampleCamera(progress, shipPath.getPoint(parameter), shipPath.getTangent(parameter), position, lookAt)
    return { position, lookAt }
  }
  for (const boundary of [0.1, 0.27, 0.45, 0.65]) {
    const before = sample(boundary - 0.000001)
    const after = sample(boundary + 0.000001)
    assert.ok(before.position.distanceTo(after.position) < 0.001)
    assert.ok(before.lookAt.distanceTo(after.lookAt) < 0.001)
  }
})

test('follow camera keeps ship away from screen edges during launch', () => {
  const camera = new PerspectiveCamera(50, 1280 / 720, 0.1, 200)
  const lookAt = new Vector3()
  for (let i = 0; i <= 1000; i++) {
    const progress = i / 1000
    const parameter = travelParameter(progress)
    const ship = shipPath.getPoint(parameter)
    sampleCamera(progress, ship, shipPath.getTangent(parameter), camera.position, lookAt)
    camera.lookAt(lookAt)
    camera.updateMatrixWorld()
    const projected = ship.clone().project(camera)
    assert.ok(Math.abs(projected.x) < 0.75 && Math.abs(projected.y) < 0.65, `Ship clipped at ${progress}`)
    assert.ok(projected.z > -1 && projected.z < 1)
  }
})
