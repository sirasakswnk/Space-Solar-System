import { chromium } from 'playwright-core'
const out = process.argv[2]
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('pageerror', e => errors.push(String(e)))
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
await page.goto('http://127.0.0.1:5173/')
const snap = () => page.evaluate(() => document.querySelector('canvas').journeySnapshot)
await page.waitForFunction(() => document.querySelector('canvas')?.journeySnapshot?.explore?.phase === 'travel', null, { timeout: 30000 })
await page.waitForTimeout(1500)
const go = async px => {
  await page.evaluate(px => scrollTo(0, px), px)
  await page.waitForFunction(p => { const s = document.querySelector('canvas').journeySnapshot; return Math.abs(s.current - p) < 1e-4 && s.current === s.target }, px / 24000, { timeout: 30000 })
  await page.waitForTimeout(200)
  return structuredClone(await snap())
}
// Star field must follow the camera; read it through the R3F store like earlier checks.
const stars = () => page.evaluate(async () => {
  const url = performance.getEntriesByType('resource').find(e => e.name.includes('@react-three_fiber.js?v=')).name
  const fiber = await import(url), state = [...fiber._roots.values()][0].store.getState()
  const field = state.scene.getObjectByName('star-field')
  return { position: field.position.toArray(), camera: state.camera.position.toArray(), opacity: field.material.opacity,
    count: field.geometry.attributes.position.count, uuid: field.geometry.uuid }
})
const close = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-6)
const samePose = (a, b) => ['camera', 'cameraQuaternion', 'ship', 'shipQuaternion'].every(k => close(a[k], b[k]))
const result = {}
const pad = await go(0); result.padStars = await stars()
const stops = [0.42 * 0.94, 0.56 * 0.94, 0.7 * 0.94, 0.85 * 0.94, 0.93].map(v => Math.round(v * 24000))
const forward = []
for (const px of stops) { forward.push(await go(px)); const s = await stars(); result['follow' + px] = close(s.position, s.camera) && s.opacity === 1 }
await go(24000); const ov = await stars(); result.overviewFollow = close(ov.position, ov.camera) && ov.opacity === 1
const reverse = []
for (const px of [...stops].reverse()) reverse.push(await go(px))
reverse.reverse()
result.reversePoses = forward.every((f, i) => samePose(f, reverse[i]))
const back = await go(0); result.padPose = samePose(pad, back); result.padOpacityAfter = (await stars()).opacity
// Explore Neptune and exit.
const nep = await go(stops.at(-1))
await page.focus('#explore-planet'); await page.keyboard.press('Enter')
await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'exploring', null, { timeout: 15000 })
await page.waitForTimeout(300)
const ex = await stars(); result.exploreFollow = close(ex.position, ex.camera) && ex.opacity === 1
await page.screenshot({ path: `${out}/after-explore-neptune.png` })
await page.keyboard.press('Escape')
await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'travel', null, { timeout: 15000 })
await page.waitForTimeout(400)
const after = structuredClone(await snap())
result.exitRestore = samePose(nep, after) && after.explore.savedScrollY === stops.at(-1)
result.focus = await page.evaluate(() => document.activeElement?.id)
result.sameGeometry = (await stars()).uuid === result.padStars.uuid
result.errors = errors
console.log(JSON.stringify(result, null, 1))
await browser.close()
