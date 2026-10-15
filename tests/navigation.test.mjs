import test from 'node:test'
import assert from 'node:assert/strict'
import { PerspectiveCamera, Vector3 } from 'three'
import { journeyPlanets } from '../src/data/planets.ts'
import { createExploreState } from '../src/journey/explore.ts'
import { applyNavigation, createNavigationRequest } from '../src/journey/navigation.ts'
import { earthCenter, flightEnd, getExplorePlanet, overviewBlend, sampleJourney, sampleJourneyCamera } from '../src/journey/path.ts'

test('destination pixels land inside each stop, retaining one settling progress controller', () => {
  const model = createExploreState(), progress = { current: 1, target: 1 }
  for (const planet of journeyPlanets) {
    const request = createNavigationRequest(planet.id, 24000, null)
    assert.equal(getExplorePlanet(request.progress)?.id, planet.id)
    assert.equal(request.pixel / 24000, request.progress)
    applyNavigation(model, progress, request)
    assert.equal(progress.current, 1)
    assert.equal(progress.target, request.progress)
    assert.equal(model.planet.id, planet.id)
  }
  for (const [id, max] of [['earth', 24000], ['mars', 0], ['mars', NaN]]) assert.equal(createNavigationRequest(id, max, null), null)
})

test('replay clears exploration, transition and pending navigation state and resets progress', () => {
  const model = createExploreState(), progress = { current: 0.8, target: 0.8 }
  Object.assign(model, { phase: 'exiting', saved: {}, selectedHotspot: 'uranus-axis', axisVisible: true,
    focus: {}, elapsed: 0.3, cooldownUntil: 999, navigation: createNavigationRequest('mars', 24000, null) })
  applyNavigation(model, progress, createNavigationRequest(null, 24000, null))
  assert.deepEqual(progress, { current: 0, target: 0 })
  assert.equal(model.phase, 'travel'); assert.equal(model.planet.id, 'mercury')
  for (const key of ['saved', 'selectedHotspot', 'focus', 'navigation']) assert.equal(model[key], null)
  assert.equal(model.axisVisible, false); assert.equal(model.cooldownUntil, 0); assert.equal(model.elapsed, 0)
  assert.equal(model.replayCount, 1)
  assert.equal(model.orbit.distance, model.planet.orbit.distance)
})

test('overview pullback is reversible, continuous at the flight end and frames all eight destinations', () => {
  const ship = new Vector3(), tangent = new Vector3(), look = new Vector3()
  const positions = [earthCenter, ...journeyPlanets.map(planet => new Vector3(...planet.scene.center))]
  const camera = new PerspectiveCamera(50, 1280 / 720, 0.1, 1000)
  for (const p of [flightEnd - 1e-7, flightEnd, flightEnd + 1e-7, 0.97, 1, 0.97, flightEnd]) {
    sampleJourney(p, ship, tangent); sampleJourneyCamera(p, ship, tangent, camera.position, look)
    assert.ok(camera.position.toArray().every(Number.isFinite))
  }
  assert.equal(overviewBlend(flightEnd), 0); assert.equal(overviewBlend(1), 1)
  for (const aspect of [1280 / 720, 1440 / 900]) {
    camera.aspect = aspect; camera.updateProjectionMatrix()
    sampleJourney(1, ship, tangent); sampleJourneyCamera(1, ship, tangent, camera.position, look)
    camera.lookAt(look); camera.updateMatrixWorld()
    for (const position of positions) {
      const projected = position.clone().project(camera)
      assert.ok(Math.abs(projected.x) < 0.8 && Math.abs(projected.y) < 0.6 && projected.z < 1)
    }
  }
  const before = new Vector3(), after = new Vector3()
  sampleJourney(flightEnd - 1e-7, ship, tangent); sampleJourneyCamera(flightEnd - 1e-7, ship, tangent, before, look)
  sampleJourney(flightEnd + 1e-7, ship, tangent); sampleJourneyCamera(flightEnd + 1e-7, ship, tangent, after, look)
  assert.ok(before.distanceTo(after) < 0.001)
})
