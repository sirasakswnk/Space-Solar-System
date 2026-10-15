import { chromium } from 'playwright-core'
import { Quaternion, Vector3 } from '/home/user/Space-Solar-System/node_modules/three/build/three.module.js'
import { sampleBank } from '/home/user/Space-Solar-System/src/journey/bank.ts'
import { sampleJourney, mercuryStop, flightEnd } from '/home/user/Space-Solar-System/src/journey/path.ts'
const out = process.argv[2]
const expected = (p, bank = true) => {
  const pos = new Vector3(), t = new Vector3()
  sampleJourney(p, pos, t)
  const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), t)
  if (bank) q.premultiply(new Quaternion().setFromAxisAngle(t, sampleBank(p)))
  return { pos: pos.toArray(), q: q.toArray() }
}
// Strongest bank on each leg, rounded to a whole scroll pixel.
const peaks = []
for (let leg = 0; leg < 6; leg++) {
  let best = 0, bestPx = 0
  const from = [mercuryStop, 0.3066, 0.42, 0.56, 0.7, 0.85][leg] * (leg ? flightEnd : 1)
  const to = [0.3066, 0.42, 0.56, 0.7, 0.85, 1][leg] * flightEnd
  for (let px = Math.ceil(from * 24000); px < to * 24000; px += 5) {
    const b = Math.abs(sampleBank(px / 24000)); if (b > best) { best = b; bestPx = px }
  }
  peaks.push(bestPx)
}
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('pageerror', e => errors.push(String(e)))
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
await page.goto('http://127.0.0.1:5173/')
const snap = () => page.evaluate(() => structuredClone(document.querySelector('canvas').journeySnapshot))
await page.waitForFunction(() => document.querySelector('canvas')?.journeySnapshot?.explore?.phase === 'travel', null, { timeout: 30000 })
await page.waitForTimeout(1000)
const go = async px => { await page.evaluate(px => scrollTo(0, px), px); await page.waitForFunction(p => { const s = document.querySelector('canvas').journeySnapshot; return Math.abs(s.current - p) < 1e-4 && s.current === s.target }, px / 24000, { timeout: 30000 }); await page.waitForTimeout(100); return snap() }
const close = (a, b, e = 1e-5) => a.every((v, i) => Math.abs(v - b[i]) < e)
const sameQ = (a, b) => Math.abs(new Quaternion(...a).dot(new Quaternion(...b))) > 1 - 1e-9
const samePose = (a, b) => ['camera', 'cameraQuaternion', 'ship', 'shipQuaternion'].every(k => close(a[k], b[k], 1e-6))
const r = { peaks: peaks.map(px => ({ px, bank: +sampleBank(px / 24000).toFixed(3) })) }
// Launch unchanged: exactly the unbanked orientation.
r.launchUnbanked = true
for (const px of [0, 600, 1200, 1800]) { const s = await go(px), e = expected(px / 24000, false); r.launchUnbanked &&= sameQ(s.shipQuaternion, e.q) && close(s.ship, e.pos) }
const forward = []
r.matchesBank = true
for (const [i, px] of peaks.entries()) {
  const s = await go(px), e = expected(s.current)
  r.matchesBank &&= sameQ(s.shipQuaternion, e.q) && close(s.ship, e.pos)
  forward.push(s)
  await page.screenshot({ path: `${out}/s09n-leg${i + 1}.png` })
}
const reverse = []
for (const px of [...peaks].reverse()) reverse.push(await go(px))
reverse.reverse()
r.reverseSamePose = forward.every((f, i) => samePose(f, reverse[i]))
// Explore Mars and return.
const marsPx = Math.round(0.42 * 0.94 * 24000)
const before = await go(marsPx)
await page.focus('#explore-planet'); await page.keyboard.press('Enter')
await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'exploring', null, { timeout: 15000 })
await page.keyboard.press('Escape')
await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'travel', null, { timeout: 15000 })
await page.waitForTimeout(300)
r.exploreRestore = samePose(before, await snap())
r.focus = await page.evaluate(() => document.activeElement?.id)
r.padAgain = samePose(await go(0), await go(0))
r.errors = errors
console.log(JSON.stringify(r))
await browser.close()
