import test from 'node:test'
import assert from 'node:assert/strict'
import { Mesh, MeshBasicMaterial, Raycaster, SphereGeometry, Vector3 } from 'three'
import { jupiter } from '../src/data/planets.ts'
import { jupiterMapRegions, jupiterMapSize, jupiterOutlines, jupiterSelectionBand } from '../src/data/jupiterAppearance.ts'
import { orbitPosition, hotspotOrbit } from '../src/journey/explore.ts'

for (const [index, kind] of ['clouds', 'storm'].entries()) {
  test(`Jupiter ${kind} marker ray hits its inspected image region and stays visible after focus`, () => {
    const geometry = new SphereGeometry(jupiter.scene.radius, 64, 48), material = new MeshBasicMaterial()
    const normal = orbitPosition({ ...jupiter.hotspots[index].anchor, distance: 1 }, new Vector3(), new Vector3())
    const hit = new Raycaster(normal.clone().multiplyScalar(18), normal.clone().negate())
      .intersectObject(new Mesh(geometry, material))[0]
    assert.ok(hit?.uv)
    assert.ok(Math.abs(hit.uv.x - jupiterMapRegions[kind].x / jupiterMapSize.width) < 0.002)
    assert.ok(Math.abs(1 - hit.uv.y - jupiterMapRegions[kind].y / jupiterMapSize.height) < 0.002)
    const camera = orbitPosition(hotspotOrbit(jupiter, jupiter.hotspots[index]), new Vector3(), new Vector3())
    assert.ok(normal.dot(camera.sub(normal.clone().multiplyScalar(jupiter.scene.radius))) > 0)
    geometry.dispose(); material.dispose()
  })
}

test('Jupiter selection ellipses follow east–west bands, face outward, and never cut into the cloud shell', () => {
  for (const [index, kind] of ['clouds', 'storm'].entries()) {
    const band = jupiterSelectionBand(jupiterMapRegions[kind], jupiter.scene.radius + jupiterOutlines.radiusOffset, jupiterOutlines[kind])
    const a = new Vector3(), b = new Vector3(), c = new Vector3()
    const normal = orbitPosition({ ...jupiter.hotspots[index].anchor, distance: 1 }, new Vector3(), new Vector3())
    const east = new Vector3(Math.cos(jupiter.hotspots[index].anchor.yaw), 0, -Math.sin(jupiter.hotspots[index].anchor.yaw))
    assert.ok(a.fromArray(band.positions, 0).dot(east) > 0, 'Long axis starts east of the marker')
    for (let i = 0; i < band.positions.length; i += 3) {
      a.fromArray(band.positions, i)
      assert.ok(a.length() > jupiter.scene.radius && a.dot(normal) > 0)
    }
    for (let i = 0; i < band.indices.length; i += 3) {
      a.fromArray(band.positions, band.indices[i] * 3)
      b.fromArray(band.positions, band.indices[i + 1] * 3)
      c.fromArray(band.positions, band.indices[i + 2] * 3)
      const center = a.clone().add(b).add(c).multiplyScalar(1 / 3)
      assert.ok(center.length() > jupiter.scene.radius, 'Triangle is above cloud shell')
      assert.ok(b.sub(a).cross(c.sub(a)).dot(center) > 0, 'Triangle faces outward')
    }
  }
})
