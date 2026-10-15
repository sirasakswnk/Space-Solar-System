import test from 'node:test'
import assert from 'node:assert/strict'
import { PerspectiveCamera, Vector3 } from 'three'
import { journeyPlanets } from '../src/data/planets.ts'
import { earthCenter, earthRadius, planetStops, sampleJourney, sampleJourneyCamera,
  getExplorePlanet, launchProgress, shipPath, mercuryStop, venusStop, marsStop, jupiterStop, saturnStop, uranusStop, flightEnd } from '../src/journey/path.ts'
import { travelParameter, engineStrength } from '../src/journey/launch.ts'
import { orbitPosition, resetOrbit, transitionPosition, hotspotOrbit, sampleFocusOrbit } from '../src/journey/explore.ts'

test('route stays outside every planet and ring envelope with continuous camera and heading at joins', () => {
  const position = new Vector3(), tangent = new Vector3(), camera = new Vector3(), lookAt = new Vector3()
  for (let i=0; i<=2000; i++) {
    const p=i/2000
    sampleJourney(p,position,tangent)
    sampleJourneyCamera(p,position,tangent,camera,lookAt)
    assert.ok(tangent.length() > 0.99)
    for (const point of [position,camera]) {
      assert.ok(point.toArray().every(Number.isFinite))
      assert.ok(point.distanceTo(earthCenter)>earthRadius)
      // The ship's current geometry fits inside a radius of 0.7 scene units.
      const clearance = point === position ? 0.7 : 0.1
      for (const planet of journeyPlanets) assert.ok(point.distanceTo(new Vector3(...planet.scene.center))>(planet.rings?.outer ?? planet.scene.radius)+clearance, `${planet.id} collision at ${p}`)
    }
  }
  for (const p of [mercuryStop,venusStop,marsStop,jupiterStop,saturnStop,uranusStop]) {
    const before=new Vector3(), after=new Vector3(), beforeT=new Vector3(), afterT=new Vector3()
    sampleJourney(p-1e-6,before,beforeT); sampleJourney(p+1e-6,after,afterT)
    assert.ok(before.distanceTo(after)<0.001)
    assert.ok(beforeT.angleTo(afterT)<0.001)
    const beforeCam=new Vector3(), afterCam=new Vector3(), beforeLook=new Vector3(), afterLook=new Vector3()
    sampleJourneyCamera(p-1e-6,before,beforeT,beforeCam,beforeLook)
    sampleJourneyCamera(p+1e-6,after,afterT,afterCam,afterLook)
    assert.ok(beforeCam.distanceTo(afterCam)<0.001 && beforeLook.distanceTo(afterLook)<0.001)
  }
  assert.deepEqual(position.toArray(),[21,15,-370])
})

test('launch geometry and ignition timing are preserved through the progress mapping', () => {
  const position=new Vector3(), tangent=new Vector3()
  for(let i=0;i<=100;i++) {
    const local=i/100, p=local*mercuryStop
    sampleJourney(p,position,tangent)
    assert.ok(position.distanceTo(shipPath.getPoint(travelParameter(local)))<1e-9)
    assert.ok(Math.abs(launchProgress(p)-local)<1e-9)
  }
  sampleJourney(0.08*mercuryStop,position,tangent)
  assert.deepEqual(position.toArray(),[0,0.65,0])
  assert.ok(engineStrength(launchProgress(0.08*mercuryStop))>0)
  assert.equal(launchProgress(1),1)
})

test('Saturn approach reveals ring depth and keeps ship and planet center framed', () => {
  const ship = new Vector3(), tangent = new Vector3(), lookAt = new Vector3()
  const camera = new PerspectiveCamera(50, 1280 / 720, 0.1, 200)
  const saturn = journeyPlanets.find(planet => planet.id === 'saturn')
  const center = new Vector3(...saturn.scene.center)
  for (let i=0; i<=100; i++) {
    const p=(0.63 + i/100*0.07) * flightEnd
    sampleJourney(p,ship,tangent)
    sampleJourneyCamera(p,ship,tangent,camera.position,lookAt)
    camera.lookAt(lookAt); camera.updateMatrixWorld()
    const projectedShip = ship.clone().project(camera)
    assert.ok(Math.abs(projectedShip.x)<0.75 && Math.abs(projectedShip.y)<0.65)
    if (p>=0.6755 * flightEnd) {
      const projectedPlanet = center.clone().project(camera)
      assert.ok(Math.abs(projectedPlanet.x)<0.75 && Math.abs(projectedPlanet.y)<0.65)
    }
  }
  const normal = new Vector3(-Math.sin(saturn.rings.tilt), Math.cos(saturn.rings.tilt), 0)
  const direction = camera.position.clone().sub(center).normalize()
  assert.ok(normal.dot(direction)>0.3, 'Ring view is nearly edge-on')
})

test('exploration availability follows all seven stops in both directions without opening in transit', () => {
  const sequence=[]
  for (let i=0;i<=1000;i++) {
    const id=getExplorePlanet(i/1000)?.id
    if(id && sequence.at(-1)!==id) sequence.push(id)
  }
  assert.deepEqual(sequence,['mercury','venus','mars','jupiter','saturn','uranus','neptune'])
  const reverse=[]
  for(let i=1000;i>=0;i--) {
    const id=getExplorePlanet(i/1000)?.id
    if(id && reverse.at(-1)!==id) reverse.push(id)
  }
  assert.deepEqual(reverse,['neptune','uranus','saturn','jupiter','mars','venus','mercury'])
  for(const p of [0,0.1,0.25,0.35,0.5,0.62,0.75,0.97]) assert.equal(getExplorePlanet(p),null)
})

test('all reachable entry and far-side exit poses keep safe planet-specific distances', () => {
  for(const { planet,start,end } of planetStops) {
    const center=new Vector3(...planet.scene.center), orbit={yaw:0,pitch:0,distance:0}
    resetOrbit(orbit,planet)
    const destination=orbitPosition(orbit,center,new Vector3())
    for(let i=0;i<=20;i++) {
      const p=start+(end-start)*i/20
      const ship=new Vector3(), tangent=new Vector3(), from=new Vector3()
      sampleJourney(p,ship,tangent); sampleJourneyCamera(p,ship,tangent,from,new Vector3())
      const farSide=orbitPosition({yaw:Math.PI,pitch:-1.1,distance:planet.orbit.min},center,new Vector3())
      for(let j=0;j<=100;j++) {
        const entering=transitionPosition(from,destination,center,j/100,new Vector3())
        const exiting=transitionPosition(farSide,from,center,j/100,new Vector3())
        const envelope = planet.rings?.outer ?? planet.scene.radius
        assert.ok(entering.distanceTo(center)>envelope+0.1 && exiting.distanceTo(center)>envelope+0.1)
      }
    }
    let from={yaw:Math.PI,pitch:-1.1,distance:planet.orbit.min}
    for(const point of planet.hotspots) {
      const to=hotspotOrbit(planet,point), out={...from}
      for(let j=0;j<=100;j++) {
        sampleFocusOrbit(from,to,j/100,out)
        assert.ok(orbitPosition(out,center,new Vector3()).distanceTo(center)>(planet.rings?.outer ?? planet.scene.radius)+0.1)
      }
      from=to
    }
  }
})
