import { browser, errors, failedRequests, open, ready, snap, settled, go, close, samePose, px, centre } from './s12-common.mjs'
const out = process.argv[2]
const r = {}
const page = await open(); await ready(page)
await page.waitForFunction(() => document.querySelector('.asset-status').hidden, null, { timeout: 30000 })
const phase = p => page.waitForFunction(p => document.querySelector('canvas').journeySnapshot.explore.phase === p, p, { timeout: 15000 })
const radius = { mercury: 2.6, venus: 3.6, mars: 3, jupiter: 6, saturn: 5, uranus: 4.2, neptune: 4 }
const centres = { mercury: [0, 9, -50], venus: [-18, 10, -85], mars: [18, 11, -126], jupiter: [-18, 12, -183], saturn: [22, 12, -247], uranus: [-18, 14, -310], neptune: [18, 15, -380] }
// 6. Mouse lean only rotates the camera.
await go(page, px('jupiter'))
const plain = await snap(page)
await page.mouse.move(1200, 80); await settled(page)
const leaned = await snap(page)
r.item6 = { shipSame: close(plain.ship, leaned.ship) && close(plain.shipQuaternion, leaned.shipQuaternion), cameraPositionSame: close(plain.camera, leaned.camera),
  rotated: !close(plain.cameraQuaternion, leaned.cameraQuaternion) }
await centre(page)
// 7. Hover over the planet shows its name; the HTML button opens exploration.
const planetScreen = await page.evaluate(() => { const b = document.querySelector('canvas').getBoundingClientRect(); return { x: b.width * 0.5, y: b.height * 0.35 } })
let hoverName = null
for (const [dx, dy] of [[0, 0], [-60, 0], [60, 0], [0, 40], [-100, -40], [100, 40]]) {
  await page.mouse.move(planetScreen.x + dx, planetScreen.y + dy); await page.waitForTimeout(250)
  hoverName = await page.evaluate(() => { const h = document.querySelector('.hover-name'); return h.hidden ? null : h.textContent })
  if (hoverName) break
}
r.item7 = { hoverName, cursor: await page.evaluate(() => document.body.style.cursor) }
await page.mouse.move(640, 700); await centre(page)
const beforeExplore = await snap(page)
await page.click('#explore-planet'); await phase('exploring')
r.item7.buttonOpens = true
// 8. Wheel over the scene zooms without moving the journey.
const scrollBefore = await page.evaluate(() => scrollY)
const d0 = (await snap(page)).explore.orbit.distance
await page.mouse.move(300, 400); await page.mouse.wheel(0, -400); await page.waitForTimeout(300)
const afterSceneWheel = await snap(page)
r.item8 = { distanceBefore: +d0.toFixed(2), distanceAfter: +afterSceneWheel.explore.orbit.distance.toFixed(2),
  scrollUnchanged: (await page.evaluate(() => scrollY)) === scrollBefore, progressUnchanged: afterSceneWheel.current === beforeExplore.current }
// 9. Wheel over the panel scrolls the panel, not the scene.
await page.click('[data-info="jupiter-storm"]')
await page.waitForFunction(() => !document.querySelector('canvas').journeySnapshot.explore.focusing, null, { timeout: 15000 })
const panelBox = await page.evaluate(() => { const p = document.querySelector('.explore-panel'), b = p.getBoundingClientRect()
  return { x: b.left + b.width / 2, y: b.top + b.height / 2, scrollable: p.scrollHeight > p.clientHeight, top: p.scrollTop } })
const d1 = (await snap(page)).explore.orbit.distance
await page.mouse.move(panelBox.x, panelBox.y); await page.mouse.wheel(0, 300); await page.waitForTimeout(400)
r.item9 = { panelScrollable: panelBox.scrollable, panelScrolledBy: await page.evaluate(t => document.querySelector('.explore-panel').scrollTop - t, panelBox.top),
  sceneDistanceUnchanged: (await snap(page)).explore.orbit.distance === d1, pageScrollUnchanged: (await page.evaluate(() => scrollY)) === scrollBefore }
// 10. Drag rotates; zoom stops outside the surface; blur ends a drag.
const yaw0 = (await snap(page)).explore.orbit.yaw
await page.mouse.move(400, 400); await page.mouse.down(); await page.mouse.move(520, 380, { steps: 6 })
const yawDragged = (await snap(page)).explore.orbit.yaw
await page.evaluate(() => window.dispatchEvent(new Event('blur')))
await page.mouse.move(700, 300, { steps: 6 })
const yawAfterBlur = (await snap(page)).explore.orbit.yaw
await page.mouse.up()
for (let i = 0; i < 12; i++) { await page.mouse.move(300, 400); await page.mouse.wheel(0, -600); await page.waitForTimeout(60) }
await page.waitForTimeout(300)
const zoomed = await snap(page)
const dist = Math.hypot(...zoomed.camera.map((v, i) => v - centres.jupiter[i]))
r.item10 = { rotated: yawDragged !== yaw0, stoppedAfterBlur: yawAfterBlur === yawDragged, minDistance: +zoomed.explore.orbit.distance.toFixed(2),
  cameraToCentre: +dist.toFixed(2), outsideSurface: dist > radius.jupiter }
await page.screenshot({ path: `${out}/b-jupiter-zoomed.png` })
// 11. Close with the button, then with Escape: position and focus restored.
await page.click('.return-button'); await phase('travel'); await centre(page); await page.waitForTimeout(200)
const afterButton = await snap(page)
const focusButton = await page.evaluate(() => document.activeElement.id)
await page.focus('#explore-planet'); await page.keyboard.press('Enter'); await phase('exploring')
await page.keyboard.press('Escape'); await phase('travel'); await centre(page); await page.waitForTimeout(200)
const afterEscape = await snap(page)
r.item11 = { buttonRestores: samePose(afterButton, beforeExplore) && (await page.evaluate(() => scrollY)) === scrollBefore, focusAfterButton: focusButton,
  escapeRestores: samePose(afterEscape, beforeExplore), focusAfterEscape: await page.evaluate(() => document.activeElement.id) }
// 12. Every planet: both hotspots open content; highlight shown; screenshots for the image check.
r.item12 = {}
for (const id of Object.keys(radius)) {
  await go(page, px(id))
  await page.focus('#explore-planet'); await page.keyboard.press('Enter'); await phase('exploring'); await page.waitForTimeout(300)
  const results = []
  for (const button of await page.$$('.hotspot-list button')) {
    const info = await button.getAttribute('data-info')
    await button.click(); await page.waitForTimeout(800)
    const s = await snap(page)
    const detail = await page.evaluate(() => ({ title: document.querySelector('#hotspot-detail h3, #hotspot-detail h2, #hotspot-detail strong')?.textContent ?? '',
      text: document.querySelector('#hotspot-detail').textContent.trim().length, items: document.querySelectorAll('#hotspot-detail li').length }))
    results.push({ info, selected: s.explore.selectedHotspot === info, ...detail })
    await page.screenshot({ path: `${out}/b-${info}.png` })
  }
  r.item12[id] = results
  await page.keyboard.press('Escape'); await phase('travel'); await settled(page)
}
r.errors = errors; r.failedRequests = failedRequests
console.log(JSON.stringify(r, null, 1))
await browser.close()
