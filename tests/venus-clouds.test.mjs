import test from 'node:test'
import assert from 'node:assert/strict'
import { Mesh, MeshBasicMaterial, Quaternion, Raycaster, SphereGeometry, Vector3 } from 'three'
import { venus } from '../src/data/planets.ts'
import { venusCloudImage, venusCloudOutline } from '../src/data/venusAppearance.ts'
import { orbitPosition } from '../src/journey/explore.ts'

test('Venus cloud marker ray reaches its image region using the actual globe UVs', () => {
  const geometry = new SphereGeometry(venus.scene.radius, 48, 32), material = new MeshBasicMaterial()
  const normal = orbitPosition({ ...venus.hotspots[0].anchor, distance: 1 }, new Vector3(), new Vector3())
  const hit = new Raycaster(normal.clone().multiplyScalar(11), normal.clone().negate())
    .intersectObject(new Mesh(geometry, material))[0]
  assert.ok(hit?.uv)
  assert.ok(Math.abs(hit.uv.x - venusCloudImage.x / venusCloudImage.width) < 0.002)
  assert.ok(Math.abs((1 - hit.uv.y) - venusCloudImage.y / venusCloudImage.height) < 0.002)
  geometry.dispose(); material.dispose()
})

test('cloud selection outline stays outside Venus and aligns around the cloud marker', () => {
  const { radiusOffset, startAngle, widthAngle } = venusCloudOutline
  const geometry = new SphereGeometry(venus.scene.radius + radiusOffset, 64, 2,
    0, Math.PI * 2, startAngle, widthAngle)
  const normal = orbitPosition({ ...venus.hotspots[0].anchor, distance: 1 }, new Vector3(), new Vector3())
  const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), normal)
  const position = geometry.getAttribute('position'), point = new Vector3(), center = new Vector3()
  for (let i = 0; i < position.count; i++) {
    point.fromBufferAttribute(position, i).applyQuaternion(rotation)
    assert.ok(point.length() > venus.scene.radius)
    assert.ok(Math.abs(point.angleTo(normal) - startAngle - widthAngle / 2) <= widthAngle / 2 + 1e-6)
  }
  for (let i = 0; i < geometry.index.count; i += 3) {
    center.set(0, 0, 0)
    for (let j = 0; j < 3; j++) center.add(point.fromBufferAttribute(position, geometry.index.getX(i + j)))
    assert.ok(center.multiplyScalar(1 / 3).length() > venus.scene.radius)
  }
  assert.ok(venus.scene.radius * 1.025 < venus.orbit.min, 'Exploration stays outside the rim')
  geometry.dispose()
})
