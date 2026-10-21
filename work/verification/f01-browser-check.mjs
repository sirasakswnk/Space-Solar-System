import { browser, errors, failedRequests, open, ready, snap, settled, go, close, px, centre } from './s12-common.mjs'
import { Quaternion, Vector3 } from '/home/user/Space-Solar-System/node_modules/three/build/three.module.js'
import { worldSpin } from '/home/user/Space-Solar-System/src/journey/spin.ts'
import { jupiter, uranus } from '/home/user/Space-Solar-System/src/data/planets.ts'
const out = process.argv[2]
const r = {}
const page = await open(); await ready(page)
await page.waitForFunction(() => document.querySelector('.asset-status').hidden, null, { timeout: 30000 })
// Read spin state and mesh orientation through the R3F store (dev only).
const scene = () => page.evaluate(async () => {
  const url = performance.getEntriesByType('resource').find(e => e.name.includes('@react-three_fiber.js?v=')).name
  const fiber = await import(url), s = [...fiber._roots.values()][0].store.getState().scene
  const q = name => s.getObjectByName(name)?.quaternion.toArray()
  return { spin: s.userData.exploreState.spin.time, jupiter: q('jupiter-cloud-shell'), uranus: q('uranus-cloud-shell'),
    earthClouds: s.userData.earthAppearance.cloudRotation, uranusGuide: s.getObjectByName('uranus-axis')?.children[0].getWorldQuaternion(new s.quaternion.constructor()).toArray() }
})
const angle = (a, b) => new Quaternion(...a).angleTo(new Quaternion(...b))
// Earth clouds drift at the pad.
const pad0 = await scene(); await page.waitForTimeout(3000); const pad1 = await scene()
r.earthCloudsDrift = +(pad1.earthClouds - pad0.earthClouds).toFixed(4)
// Jupiter spins while paused; ship and camera do not move.
await go(page, px('jupiter')); await centre(page)
const a = await snap(page), sa = await scene()
await page.screenshot({ path: `${out}/jupiter-t0.png` })
await page.waitForTimeout(20000)
const b = await snap(page), sb = await scene()
await page.screenshot({ path: `${out}/jupiter-t20.png` })
r.jupiterSpin = { seconds: +(sb.spin - sa.spin).toFixed(2), meshTurned: +angle(sa.jupiter, sb.jupiter).toFixed(3),
  expected: +(0.1 * (sb.spin - sa.spin)).toFixed(3), shipCameraStill: close(a.ship, b.ship) && close(a.camera, b.camera) && close(a.cameraQuaternion, b.cameraQuaternion) }
// Explore: spin frozen; storm outline and marker on the spun Great Red Spot; camera aims at it.
await page.focus('#explore-planet'); await page.keyboard.press('Enter')
await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'exploring', null, { timeout: 15000 })
const e0 = await scene()
await page.click('[data-info="jupiter-storm"]')
await page.waitForFunction(() => !document.querySelector('canvas').journeySnapshot.explore.focusing, null, { timeout: 15000 })
await page.waitForTimeout(2000)
const e1 = await scene(), es = await snap(page)
const storm = jupiter.hotspots.find(h => h.id === 'jupiter-storm')
const target = new Vector3(Math.sin(storm.anchor.yaw) * Math.cos(storm.anchor.pitch), Math.sin(storm.anchor.pitch), Math.cos(storm.anchor.yaw) * Math.cos(storm.anchor.pitch))
  .applyQuaternion(worldSpin(jupiter, e1.spin, new Quaternion()))
const cameraDir = new Vector3(...es.camera).sub(new Vector3(...jupiter.scene.center)).normalize()
r.explore = { spinFrozen: e1.spin === e0.spin, cameraFacesSpot: +cameraDir.dot(target).toFixed(4), outlineVisible: es.stormHighlight,
  marker: await page.evaluate(() => { const b = document.querySelector('[data-hotspot="jupiter-storm"]'); return !b.hidden }) }
await page.screenshot({ path: `${out}/jupiter-storm-after-spin.png` })
await page.keyboard.press('Escape')
await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'travel', null, { timeout: 15000 })
await settled(page)
// Uranus: upright guide stays upright while the planet turns about its tilted axis.
await go(page, px('uranus')); await page.waitForTimeout(8000)
await page.focus('#explore-planet'); await page.keyboard.press('Enter')
await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'exploring', null, { timeout: 15000 })
await page.click('[data-info="uranus-axis"]'); await page.waitForTimeout(1500)
const u = await scene()
const tiltAxis = new Vector3(0, 1, 0).applyAxisAngle(new Vector3(0, 0, 1), uranus.axisTilt)
r.uranus = { spin: +u.spin.toFixed(2), guideUpright: angle(u.uranusGuide, [0, 0, 0, 1]) < 1e-9,
  meshAxisIsTilted: new Vector3(0, 1, 0).applyQuaternion(new Quaternion(...u.uranus)).distanceTo(tiltAxis) < 1e-6 }
await page.screenshot({ path: `${out}/uranus-axis-after-spin.png` })
await page.keyboard.press('Escape')
await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'travel', null, { timeout: 15000 })
// Reduced motion stops the spin.
await page.click('.settings-panel summary'); await page.check('.settings-controls input[type=checkbox]')
const m0 = await scene(); await page.waitForTimeout(3000); const m1 = await scene()
r.reducedMotionStops = m1.spin === m0.spin && m1.earthClouds === m0.earthClouds
r.errors = errors; r.failedRequests = failedRequests
console.log(JSON.stringify(r, null, 1))
await browser.close()
