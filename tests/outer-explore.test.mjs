import test from 'node:test'
import assert from 'node:assert/strict'
import { PerspectiveCamera, Vector3 } from 'three'
import { neptune, uranus } from '../src/data/planets.ts'
import { hotspotOrbit, orbitPosition, rotateOrbit, zoomOrbit } from '../src/journey/explore.ts'
import { comparisonPoint, createRouteComparison } from '../src/journey/routeComparison.ts'

test('outer planets retain safe zoom distances and Uranus axis is nearly sideways', () => {
  for (const planet of [uranus,neptune]) {
    const center=new Vector3(...planet.scene.center), orbit={...planet.orbit}
    for (let i=0;i<500;i++) {
      rotateOrbit(orbit,0.3,i%2 ? -.1 : .1)
      zoomOrbit(orbit,i<250 ? -600 : 600,planet)
      assert.ok(orbit.distance>=planet.orbit.min && orbit.distance<=planet.orbit.max)
      assert.ok(orbitPosition(orbit,center,new Vector3()).distanceTo(center)>planet.scene.radius+0.1)
    }
  }
  assert.ok(Math.abs(Math.cos(uranus.axisTilt))<0.15)
})

test('Neptune comparison contains the traversed route and all eight ordered points outside the planet', () => {
  const route=createRouteComparison()
  assert.deepEqual(route.stops.map(stop=>stop.id),['earth','mercury','venus','mars','jupiter','saturn','uranus','neptune'])
  assert.ok([...route.positions].every(Number.isFinite))
  assert.ok(route.stops.every((stop,i)=>i===0 || stop.position.y<route.stops[i-1].position.y))
  const wide=hotspotOrbit(neptune,neptune.hotspots.find(point=>point.kind==='route'))
  const close=hotspotOrbit(neptune,neptune.hotspots.find(point=>point.kind==='clouds'))
  assert.ok(wide.distance>close.distance)
  const camera=new PerspectiveCamera(50,1280/720,.1,200)
  orbitPosition(wide,new Vector3(),camera.position); camera.lookAt(0,0,0); camera.updateMatrixWorld()
  for(let i=0;i<route.positions.length;i+=3) {
    const point=new Vector3().fromArray(route.positions,i)
    assert.ok(point.length()>neptune.scene.radius+0.1)
    const projected=point.project(camera)
    assert.ok(Math.abs(projected.x)<.85 && Math.abs(projected.y)<.85 && projected.z>-1 && projected.z<1)
  }
  const endpoint=comparisonPoint(new Vector3(21,15,-370),new Vector3())
  assert.ok(endpoint.distanceTo(new Vector3().fromArray(route.positions,route.positions.length-3))<1e-6)
})
