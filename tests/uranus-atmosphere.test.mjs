import test from 'node:test'
import assert from 'node:assert/strict'
import { Mesh, MeshBasicMaterial, Quaternion, Raycaster, SphereGeometry, Vector3 } from 'three'
import { uranus } from '../src/data/planets.ts'
import { uranusAxisTilt, uranusAtmosphereRegion, uranusMapSize, uranusAtmosphereOutline } from '../src/data/uranusAppearance.ts'
import { orbitPosition, hotspotOrbit } from '../src/journey/explore.ts'

test('Uranus atmospheric marker reaches its image region after the globe is tilted with the axis', () => {
  const hotspot = uranus.hotspots.find(h => h.id === 'uranus-atmosphere')
  const geometry = new SphereGeometry(uranus.scene.radius, 64, 48), material = new MeshBasicMaterial()
  const globe = new Mesh(geometry, material)
  globe.rotation.z = uranusAxisTilt; globe.updateMatrixWorld(true)
  const north = new Vector3(0, 1, 0).applyQuaternion(globe.quaternion)
  assert.ok(north.distanceTo(new Vector3(-Math.sin(uranus.axisTilt), Math.cos(uranus.axisTilt), 0)) < 1e-9)
  const normal = orbitPosition({ ...hotspot.anchor, distance: 1 }, new Vector3(), new Vector3())
  const hit = new Raycaster(normal.clone().multiplyScalar(13), normal.clone().negate()).intersectObject(globe)[0]
  assert.ok(hit?.uv)
  assert.ok(Math.abs(hit.uv.x - uranusAtmosphereRegion.x / uranusMapSize.width) < 0.002)
  assert.ok(Math.abs(1 - hit.uv.y - uranusAtmosphereRegion.y / uranusMapSize.height) < 0.002)
  const focus = hotspotOrbit(uranus, hotspot)
  assert.ok(focus.distance >= uranus.orbit.min && Math.abs(focus.pitch) <= 1.1)
  const camera = orbitPosition(focus, new Vector3(), new Vector3())
  assert.ok(normal.dot(camera.sub(normal.clone().multiplyScalar(uranus.scene.radius))) > 0)
  geometry.dispose(); material.dispose()
})

test('Uranus selection surrounds the tilted atmospheric marker without entering the globe', () => {
  const { startAngle, widthAngle, radiusOffset } = uranusAtmosphereOutline
  const geometry = new SphereGeometry(uranus.scene.radius + radiusOffset, 64, 2, 0, Math.PI * 2, startAngle, widthAngle)
  const normal = orbitPosition({ ...uranus.hotspots[1].anchor, distance: 1 }, new Vector3(), new Vector3())
  const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), normal)
  const positions = geometry.getAttribute('position'), point = new Vector3(), center = new Vector3()
  for (let i = 0; i < positions.count; i++) {
    point.fromBufferAttribute(positions, i).applyQuaternion(rotation)
    assert.ok(point.length() > uranus.scene.radius)
    assert.ok(Math.abs(point.angleTo(normal) - startAngle - widthAngle / 2) <= widthAngle / 2 + 1e-6)
  }
  for (let i = 0; i < geometry.index.count; i += 3) {
    center.set(0, 0, 0)
    for (let j = 0; j < 3; j++) center.add(point.fromBufferAttribute(positions, geometry.index.getX(i + j)))
    assert.ok(center.multiplyScalar(1 / 3).length() > uranus.scene.radius)
  }
  geometry.dispose()
})
