import test from 'node:test'
import assert from 'node:assert/strict'
import { Mesh, MeshBasicMaterial, Quaternion, Raycaster, SphereGeometry, Vector3 } from 'three'
import { mars } from '../src/data/planets.ts'
import { marsMapRegions, marsMapSize, marsOutlines } from '../src/data/marsAppearance.ts'
import { orbitPosition, hotspotOrbit } from '../src/journey/explore.ts'

for (const [index, name] of ['terrain', 'polar'].entries()) {
  test(`Mars ${name} marker ray hits its inspected image region, including the polar UV seam`, () => {
    const geometry = new SphereGeometry(mars.scene.radius, 64, 48), material = new MeshBasicMaterial()
    const normal = orbitPosition({ ...mars.hotspots[index].anchor, distance: 1 }, new Vector3(), new Vector3())
    const hit = new Raycaster(normal.clone().multiplyScalar(9), normal.clone().negate())
      .intersectObject(new Mesh(geometry, material))[0]
    assert.ok(hit?.uv)
    assert.ok(Math.abs(hit.uv.x - marsMapRegions[name].x / marsMapSize.width) < 0.002)
    assert.ok(Math.abs((1 - hit.uv.y) - marsMapRegions[name].y / marsMapSize.height) < 0.002)
    const focus = hotspotOrbit(mars, mars.hotspots[index])
    assert.ok(Math.abs(focus.pitch) <= 1.1 && focus.distance >= mars.orbit.min)
    const camera = orbitPosition(focus, new Vector3(), new Vector3())
    assert.ok(normal.dot(camera.clone().sub(normal.clone().multiplyScalar(mars.scene.radius))) > 0, 'Selected image region is on the visible hemisphere')
    geometry.dispose(); material.dispose()
  })
}

test('Mars terrain and polar selection bands stay above the body and surround their marker normals', () => {
  for (const [index, name] of ['terrain', 'polar'].entries()) {
    const { startAngle, widthAngle } = marsOutlines[name]
    const geometry = new SphereGeometry(mars.scene.radius + marsOutlines.radiusOffset, 64, 2,
      0, Math.PI * 2, startAngle, widthAngle)
    const normal = orbitPosition({ ...mars.hotspots[index].anchor, distance: 1 }, new Vector3(), new Vector3())
    const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), normal)
    const position = geometry.getAttribute('position'), point = new Vector3(), center = new Vector3()
    for (let i = 0; i < position.count; i++) {
      point.fromBufferAttribute(position, i).applyQuaternion(rotation)
      assert.ok(point.length() > mars.scene.radius)
      assert.ok(Math.abs(point.angleTo(normal) - startAngle - widthAngle / 2) <= widthAngle / 2 + 1e-6)
    }
    for (let i = 0; i < geometry.index.count; i += 3) {
      center.set(0, 0, 0)
      for (let j = 0; j < 3; j++) center.add(point.fromBufferAttribute(position, geometry.index.getX(i + j)))
      assert.ok(center.multiplyScalar(1 / 3).length() > mars.scene.radius)
    }
    geometry.dispose()
  }
})
