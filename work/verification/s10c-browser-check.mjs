import { chromium } from 'playwright-core'
const out = process.argv[2]
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const errors = []
const statusText = page => page.evaluate(() => { const s = document.querySelector('.asset-status'); return s.hidden ? null : s.textContent })
const snap = page => page.evaluate(() => structuredClone(document.querySelector('canvas').journeySnapshot))
const newPage = async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  page.on('pageerror', e => errors.push(String(e)))
  // Blocked asset requests log a resource error by design; record everything else.
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()) })
  return page
}
const r = {}
// A. Normal load, each file delayed so the real count can be observed.
let page = await newPage()
let order = 0
await page.route('**/assets/**/*.jpg', async route => { const delay = 300 + 250 * order++; await new Promise(res => setTimeout(res, delay)); await route.continue() })
await page.goto('http://127.0.0.1:5173/')
const seen = new Set()
for (let i = 0; i < 80; i++) { const t = await statusText(page); if (t) seen.add(t); else if (seen.size) break; await page.waitForTimeout(100) }
r.normal = { seen: [...seen], finalHidden: (await statusText(page)) === null,
  states: Object.values((await snap(page)).assets).every(s => s === 'loaded') }
await page.close()
// B. Mars and Earth clouds fail.
page = await newPage()
const requests = {}
let block = true
await page.route('**/assets/**/*.jpg', route => {
  const name = new URL(route.request().url()).pathname
  requests[name] = (requests[name] ?? 0) + 1
  if (block && (name.includes('/mars/') || name.includes('/earth/clouds'))) return route.abort()
  return route.continue()
})
await page.goto('http://127.0.0.1:5173/')
await page.waitForFunction(() => document.querySelector('.asset-status button'), null, { timeout: 30000 })
r.failure = { text: await statusText(page), retryButton: await page.evaluate(() => document.querySelector('.asset-status button')?.textContent),
  states: (await snap(page)).assets }
await page.screenshot({ path: `${out}/s10c-failed.png` })
// Travel and exploration still work with the fallback colour.
const marsPx = Math.round(0.42 * 0.94 * 24000)
await page.evaluate(px => scrollTo(0, px), marsPx)
await page.waitForFunction(p => { const s = document.querySelector('canvas').journeySnapshot; return Math.abs(s.current - p) < 1e-4 && s.current === s.target }, marsPx / 24000, { timeout: 30000 })
const marsBefore = await snap(page)
r.failure.marsFallback = marsBefore.mars.texture
await page.screenshot({ path: `${out}/s10c-mars-fallback.png` })
await page.focus('#explore-planet'); await page.keyboard.press('Enter')
await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'exploring', null, { timeout: 15000 })
await page.keyboard.press('Escape')
await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'travel', null, { timeout: 15000 })
await page.waitForTimeout(300)
const close = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-6)
r.failure.exploreWorks = close((await snap(page)).camera, marsBefore.camera)
// C. Allow the files again and retry with the keyboard.
const before = { ...requests }
block = false
await page.focus('.asset-status button'); await page.keyboard.press('Enter')
r.retry = { focusAfterClick: await page.evaluate(() => document.activeElement?.className) }
await page.waitForFunction(() => document.querySelector('.asset-status').hidden, null, { timeout: 30000 })
await page.waitForTimeout(300)
const after = await snap(page)
const delta = Object.fromEntries(Object.keys(requests).map(k => [k, requests[k] - (before[k] ?? 0)]).filter(([, v]) => v))
r.retry = { ...r.retry, requestDelta: delta, states: Object.values(after.assets).every(s => s === 'loaded'),
  marsTexture: after.mars.texture, earthClouds: after.earth.textures.clouds, earthCloudsVisible: after.earth.cloudsVisible }
await page.screenshot({ path: `${out}/s10c-mars-retried.png` })
r.errors = errors
console.log(JSON.stringify(r, null, 1))
await browser.close()
