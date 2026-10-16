import { browser, errors, failedRequests, open } from './s12-common.mjs'
const out = process.argv[2]
const url = 'http://127.0.0.1:4173/'
const r = {}
const page = await open({ width: 1280, height: 720 }, url)
const assetResponses = []
page.on('response', res => { if (res.url().includes('/assets/')) assetResponses.push(res.status()) })
await page.waitForSelector('canvas', { timeout: 30000 })
await page.waitForFunction(() => document.querySelector('.asset-status')?.hidden, null, { timeout: 60000 })
const caption = () => page.evaluate(() => document.querySelector('.caption p').textContent.split(' — ')[0])
r.load = { canvas: true, devSnapshot: await page.evaluate(() => document.querySelector('canvas').journeySnapshot === undefined ? 'absent' : 'present'), padLabel: await caption() }
await page.screenshot({ path: `${out}/e-prod-pad.png` })
await page.evaluate(() => scrollTo(0, Math.round(0.93 * 24000))); await page.waitForTimeout(3000)
r.neptune = { label: await caption(), exploreButton: await page.evaluate(() => { const b = document.querySelector('#explore-planet'); return !b.hidden && !b.disabled && b.textContent }) }
await page.focus('#explore-planet'); await page.keyboard.press('Enter'); await page.waitForTimeout(1500)
r.explore = await page.evaluate(() => ({ dialogOpen: document.querySelector('dialog').open, title: document.querySelector('#explore-title')?.textContent }))
await page.screenshot({ path: `${out}/e-prod-explore.png` })
await page.keyboard.press('Escape'); await page.waitForTimeout(1500)
r.exit = await page.evaluate(() => ({ dialogOpen: document.querySelector('dialog').open, focus: document.activeElement.id, scrollY }))
await page.evaluate(() => scrollTo(0, 24000)); await page.waitForTimeout(3500)
r.overview = await page.evaluate(() => ({ panel: !document.querySelector('.overview-panel').hidden, labels: !document.querySelector('.overview-labels').hidden }))
await page.screenshot({ path: `${out}/e-prod-overview.png` })
await page.click('.overview-panel [data-replay]'); await page.waitForTimeout(2500)
r.replay = { scrollY: await page.evaluate(() => scrollY), label: await caption(), focus: await page.evaluate(() => document.activeElement.id) }
r.assetStatuses = [...new Set(assetResponses)]
await page.close()
// Production fallback without WebGL.
const nowebgl = await browser.newPage({ viewport: { width: 1280, height: 720 } })
nowebgl.on('pageerror', e => errors.push(String(e)))
await nowebgl.addInitScript(() => { const o = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/i.test(t) ? null : o.call(this, t, ...a) } })
await nowebgl.goto(url); await nowebgl.waitForTimeout(2000)
r.fallback = await nowebgl.evaluate(() => ({ shown: !!document.querySelector('.fallback-page'), planets: document.querySelectorAll('.fallback-planet').length }))
r.errors = errors; r.failedRequests = failedRequests
console.log(JSON.stringify(r, null, 1))
await browser.close()
