import test from 'node:test'
import assert from 'node:assert/strict'
import { Mesh, MeshBasicMaterial, Quaternion, Raycaster, SphereGeometry, Vector3 } from 'three'
import { saturn } from '../src/data/planets.ts'
import { saturnBodyRegion, saturnMapSize, saturnBodyOutline } from '../src/data/saturnAppearance.ts'
import { orbitPosition, hotspotOrbit } from '../src/journey/explore.ts'

test('Saturn body marker reaches its inspected cloud band with a focus outside the whole ring envelope', () => {
  const hotspot = saturn.hotspots.find(h => h.id === 'saturn-body')
  const geometry = new SphereGeometry(saturn.scene.radius, 64, 48), material = new MeshBasicMaterial()
  const normal = orbitPosition({ ...hotspot.anchor, distance: 1 }, new Vector3(), new Vector3())
  const hit = new Raycaster(normal.clone().multiplyScalar(20), normal.clone().negate()).intersectObject(new Mesh(geometry, material))[0]
  assert.ok(hit?.uv)
  assert.ok(Math.abs(hit.uv.x - saturnBodyRegion.x / saturnMapSize.width) < 0.002)
  assert.ok(Math.abs(1 - hit.uv.y - saturnBodyRegion.y / saturnMapSize.height) < 0.002)
  const focus = hotspotOrbit(saturn, hotspot)
  assert.ok(focus.distance >= saturn.orbit.min && focus.distance > saturn.rings.outer)
  const camera = orbitPosition(focus, new Vector3(), new Vector3())
  assert.ok(normal.dot(camera.sub(normal.clone().multiplyScalar(saturn.scene.radius))) > 0)
  geometry.dispose(); material.dispose()
})

test('Saturn body selection follows its image anchor and stays outside the cloud shell', () => {
  const { startAngle, widthAngle, radiusOffset } = saturnBodyOutline
  const geometry = new SphereGeometry(saturn.scene.radius + radiusOffset, 64, 2, 0, Math.PI * 2, startAngle, widthAngle)
  const normal = orbitPosition({ ...saturn.hotspots[1].anchor, distance: 1 }, new Vector3(), new Vector3())
  const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), normal)
  const positions = geometry.getAttribute('position'), point = new Vector3(), center = new Vector3()
  for (let i = 0; i < positions.count; i++) {
    point.fromBufferAttribute(positions, i).applyQuaternion(rotation)
    assert.ok(point.length() > saturn.scene.radius)
    assert.ok(Math.abs(point.angleTo(normal) - startAngle - widthAngle / 2) <= widthAngle / 2 + 1e-6)
  }
  for (let i = 0; i < geometry.index.count; i += 3) {
    center.set(0, 0, 0)
    for (let j = 0; j < 3; j++) center.add(point.fromBufferAttribute(positions, geometry.index.getX(i + j)))
    assert.ok(center.multiplyScalar(1 / 3).length() > saturn.scene.radius)
  }
  geometry.dispose()
})
