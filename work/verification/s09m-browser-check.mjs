import { chromium } from 'playwright-core'
import { Quaternion } from "three" // resolved from the project node_modules when run
const out = process.argv[2]
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('pageerror', e => errors.push(String(e)))
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
await page.goto('http://127.0.0.1:5173/')
const snap = () => page.evaluate(() => structuredClone(document.querySelector('canvas').journeySnapshot))
await page.waitForFunction(() => document.querySelector('canvas')?.journeySnapshot?.explore?.phase === 'travel', null, { timeout: 30000 })
await page.waitForTimeout(1000)
const settled = () => page.waitForFunction(() => { const s = document.querySelector('canvas').journeySnapshot, p = s.pointerLook
  return s.current === s.target && p.current.x === p.target.x && p.current.y === p.target.y }, null, { timeout: 30000 })
const go = async px => { await page.evaluate(px => scrollTo(0, px), px); await page.waitForFunction(p => { const s = document.querySelector('canvas').journeySnapshot; return Math.abs(s.current - p) < 1e-4 }, px / 24000); await settled(); await page.waitForTimeout(100); return snap() }
const close = (a, b, e = 1e-6) => a.every((v, i) => Math.abs(v - b[i]) < e)
const angle = (a, b) => new Quaternion(...a).angleTo(new Quaternion(...b))
const samePose = (a, b) => ['camera', 'cameraQuaternion', 'ship', 'shipQuaternion'].every(k => close(a[k], b[k]))
const r = {}
const jupiter = Math.round(0.56 * 0.94 * 24000)
const base = await go(jupiter)
r.initialCentered = base.pointerLook.target.x === 0 && base.pointerLook.target.y === 0
await page.screenshot({ path: `${out}/s09m-center.png` })
await page.mouse.move(1279, 0); await settled(); await page.waitForTimeout(100)
const leaned = await snap()
await page.screenshot({ path: `${out}/s09m-top-right.png` })
r.leanTarget = leaned.pointerLook.target
r.positionUnchanged = close(base.camera, leaned.camera) && close(base.ship, leaned.ship) && close(base.shipQuaternion, leaned.shipQuaternion)
r.leanAngle = angle(base.cameraQuaternion, leaned.cameraQuaternion)
r.leanWithinLimit = r.leanAngle > 0.02 && r.leanAngle <= Math.hypot(0.03, 0.02) + 1e-6
await page.waitForTimeout(500)
r.noDriftWhenStopped = samePose(leaned, await snap())
// Reverse with the pointer held: same pose at the same progress.
const mars = Math.round(0.42 * 0.94 * 24000), neptune = Math.round(0.93 * 24000)
const forwardMars = await go(mars); const forwardNeptune = await go(neptune)
const backMars = await go(mars)
r.reverseSamePose = samePose(forwardMars, backMars)
// Pointer leaving the window recentres the lean.
await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointerout', { relatedTarget: null })))
await settled(); await page.waitForTimeout(100)
r.leaveRecentres = samePose(await snap(), await go(mars)) && (await snap()).pointerLook.target.x === 0
const centeredMars = await snap()
await page.mouse.move(200, 600); await settled()
const preOpen = await go(neptune)
// Explore with keyboard (no pointer move), then drag inside exploration.
await page.focus('#explore-planet'); await page.keyboard.press('Enter')
await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'exploring', null, { timeout: 15000 })
const frozen = (await snap()).pointerLook.current
await page.mouse.move(640, 360); await page.mouse.down(); await page.mouse.move(900, 300, { steps: 8 }); await page.mouse.up()
await page.waitForTimeout(300)
const during = await snap()
r.frozenDuringExplore = close([frozen.x, frozen.y], [during.pointerLook.current.x, during.pointerLook.current.y], 1e-12) && during.pointerLook.target.x !== frozen.x
await page.keyboard.press('Escape')
await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'travel', null, { timeout: 15000 })
const first = await snap()
r.returnContinuity = angle(first.cameraQuaternion, preOpen.cameraQuaternion)
r.returnPositionExact = close(first.camera, preOpen.camera) && first.explore.savedScrollY === neptune
r.focusAfterExit = await page.evaluate(() => document.activeElement?.id)
await page.mouse.move(200, 600); await settled(); await page.waitForTimeout(100)
r.restoresPreOpenPose = samePose(await snap(), preOpen)
await go(24000); await page.mouse.move(900, 200); await settled(); await page.waitForTimeout(200)
await page.screenshot({ path: `${out}/s09m-overview.png` })
const ov = await snap(); r.overviewLabels = ov.overview.visible
await go(0); const pad = await snap()
r.padAfterReplayScroll = close(pad.ship, [0, 0.65, 0])
r.errors = errors
console.log(JSON.stringify(r, null, 1))
await browser.close()
