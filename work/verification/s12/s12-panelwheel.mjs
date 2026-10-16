import { browser, errors, open, ready, snap, go, px } from './s12-common.mjs'
const page = await open(); await ready(page)
await go(page, px('jupiter'))
await page.click('#explore-planet')
await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'exploring')
await page.click('[data-info="jupiter-storm"]')
const series = []
for (let i = 0; i < 8; i++) { await page.waitForTimeout(250); const s = await snap(page); series.push([+s.explore.orbit.distance.toFixed(3), s.explore.focusing]) }
const box = await page.evaluate(() => { const b = document.querySelector('.explore-panel').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 } })
const d1 = (await snap(page)).explore.orbit.distance
await page.mouse.move(box.x, box.y); await page.mouse.wheel(0, 300); await page.waitForTimeout(400)
const d2 = (await snap(page)).explore.orbit.distance
const target = await page.evaluate(({ x, y }) => { const e = document.elementFromPoint(x, y); return { el: e.className, inSurface: !!e.closest('.explore-surface'), inPanel: !!e.closest('.explore-panel') } }, box)
console.log(JSON.stringify({ seriesAfterHotspotClick: series, before: d1, afterPanelWheel: d2, wheelTarget: target, errors }))
await browser.close()
