import test from 'node:test'
import assert from 'node:assert/strict'
import { Mesh, MeshBasicMaterial, Quaternion, Raycaster, SphereGeometry, Vector3 } from 'three'
import { mercury } from '../src/data/planets.ts'
import { mercuryCraterImage, mercuryCraterOutline } from '../src/data/mercurySurface.ts'
import { orbitPosition } from '../src/journey/explore.ts'

test('Mercury hotspot ray hits the inspected image feature with Three UV and flipped image Y', () => {
  const geometry = new SphereGeometry(mercury.scene.radius, 40, 32)
  const material = new MeshBasicMaterial()
  const normal = orbitPosition({ ...mercury.hotspots[0].anchor, distance: 1 }, new Vector3(), new Vector3())
  const hit = new Raycaster(normal.clone().multiplyScalar(8), normal.clone().negate())
    .intersectObject(new Mesh(geometry, material))[0]
  assert.ok(hit?.uv)
  assert.ok(Math.abs(hit.uv.x - mercuryCraterImage.x / mercuryCraterImage.width) < 0.002)
  assert.ok(Math.abs((1 - hit.uv.y) - mercuryCraterImage.y / mercuryCraterImage.height) < 0.002)
  geometry.dispose(); material.dispose()
})

test('selected crater outline follows the sphere without its vertices or triangle centers entering the body', () => {
  const { radiusOffset, startAngle, widthAngle } = mercuryCraterOutline
  const geometry = new SphereGeometry(mercury.scene.radius + radiusOffset, 64, 2,
    0, Math.PI * 2, startAngle, widthAngle)
  const normal = orbitPosition({ ...mercury.hotspots[0].anchor, distance: 1 }, new Vector3(), new Vector3())
  const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), normal)
  const position = geometry.getAttribute('position'), point = new Vector3()
  for (let i = 0; i < position.count; i++) {
    point.fromBufferAttribute(position, i).applyQuaternion(rotation)
    assert.ok(point.length() > mercury.scene.radius)
    const angle = point.angleTo(normal)
    assert.ok(angle >= startAngle - 1e-6 && angle <= startAngle + widthAngle + 1e-6)
  }
  const center = new Vector3(), index = geometry.index
  for (let i = 0; i < index.count; i += 3) {
    center.set(0, 0, 0)
    for (let j = 0; j < 3; j++) center.add(point.fromBufferAttribute(position, index.getX(i + j)))
    assert.ok(center.multiplyScalar(1 / 3).length() > mercury.scene.radius)
  }
  geometry.dispose()
})
