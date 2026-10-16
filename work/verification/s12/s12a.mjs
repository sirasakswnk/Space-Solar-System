import { browser, errors, failedRequests, open, ready, snap, settled, go, close, samePose, px, centre } from './s12-common.mjs'
const out = process.argv[2]
const r = {}
const page = await open(); await ready(page)
await page.waitForFunction(() => document.querySelector('.asset-status').hidden, null, { timeout: 30000 })
await page.waitForTimeout(500)
// 1. Ship and pad visible with every asset loaded.
const start = await snap(page)
await page.screenshot({ path: `${out}/a-pad.png` })
r.item1 = { assets: Object.values(start.assets).every(s => s === 'loaded'), ship: start.ship, shipParts: start.shipAppearance?.parts,
  padLabel: await page.evaluate(() => document.querySelector('.caption p').textContent) }
// 2. Launch driven by scroll.
const launch = {}
for (const [name, p] of Object.entries({ pad: 0, ignition: 0.012, liftoff: 0.03, clouds: 0.06, space: 0.1 })) {
  const s = await go(page, Math.round(p * 24000))
  launch[name] = { label: await page.evaluate(() => document.querySelector('.caption p').textContent.split(' — ')[0]), engine: +s.engine.engine.toFixed(2),
    shipY: +s.ship[1].toFixed(2), sky: s.launch.sky, clouds: +s.launch.cloudOpacity.toFixed(2), smoke: +s.launch.smokeOpacity.toFixed(2), arm: +s.launch.armExtension.toFixed(2) }
  await page.screenshot({ path: `${out}/a-launch-${name}.png` })
}
r.item2 = launch
// 3. Stop scrolling: progress settles quickly and then stays put.
await go(page, px('mercury') - 1500)
await page.mouse.move(640, 700)
await page.mouse.wheel(0, 900); await page.waitForTimeout(100); await page.mouse.wheel(0, 600)
const t0 = Date.now()
// Progress only (the mouse lean eases separately and does not move the ship).
await page.waitForFunction(() => { const s = document.querySelector('canvas').journeySnapshot; return s.current === s.target }, null, { timeout: 30000 })
const settleMs = Date.now() - t0
await centre(page)
const a = await snap(page); await page.waitForTimeout(1500); const b = await snap(page)
r.item3 = { settleMs, stillAfter1500ms: a.current === b.current && samePose(a, b), progress: +a.current.toFixed(4) }
// 5. Planet order while travelling forward.
const seen = []
for (let p = 0; p <= 24000; p += 300) {
  const s = await go(page, p)
  const label = await page.evaluate(() => document.querySelector('.caption p').textContent.split(' — ')[0])
  if (seen.at(-1) !== label) seen.push(label)
}
r.item5 = { labels: seen, planets: seen.filter(l => ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'].includes(l)) }
// 4. Reverse from Neptune to the pad: no lingering state.
await go(page, px('neptune'))
for (let p = px('neptune'); p >= 0; p -= 1200) await go(page, p)
await centre(page)
const back = await go(page, 0)
r.item4 = { samePose: samePose(start, back), engine: back.engine, launch: back.launch, sameLaunch: JSON.stringify(back.launch) === JSON.stringify(start.launch),
  planetsHidden: back.planets.every(p => !p.visible), label: await page.evaluate(() => document.querySelector('.caption p').textContent) }
// 13. Rapid destination changes: latest wins, same pose as going there directly.
const direct = await go(page, px('venus'))
await go(page, px('mars'))
await page.click('.travel-navigation summary')
for (const id of ['saturn', 'neptune', 'jupiter']) { await page.evaluate(id => document.querySelector(`.travel-navigation [data-destination=${id}]`).click(), id) }
await page.evaluate(() => document.querySelector('.travel-navigation [data-destination=venus]').click())
await centre(page); await page.waitForTimeout(200)
const rapid = await snap(page)
// Fast scrolling back and forth ending at Venus.
for (const p of [20000, 3000, 15000, 500, 12000]) await page.evaluate(p => scrollTo(0, p), p)
const fast = await go(page, px('venus'))
// Destination chosen during the explore entry transition.
await page.focus('#explore-planet'); await page.keyboard.press('Enter')
await page.evaluate(() => { const b = document.querySelector('.explore-panel [data-destination=saturn]'); b?.click() })
await page.evaluate(() => { const b = document.querySelector('.explore-panel [data-destination=uranus]'); b?.click() })
await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase !== 'travel', null, { timeout: 5000 }).catch(() => {})
await settled(page); await page.waitForTimeout(300)
const pending = await snap(page)
const uranusDirect = await go(page, px('uranus'))
r.item13 = { rapidMatchesDirect: samePose(rapid, direct), fastMatchesDirect: samePose(fast, direct),
  duringExploreLatestWins: Math.abs(pending.current - px('uranus') / 24000) < 1e-4 && samePose(pending, uranusDirect) }
// 15. Overview: route visible, choose a planet from it, explore, start over.
const ov = await go(page, 24000); await page.waitForTimeout(400)
await page.screenshot({ path: `${out}/a-overview.png` })
const labels = await page.evaluate(() => [...document.querySelectorAll('.overview-labels > *')].map(e => e.textContent))
await page.click('[data-map-destination="saturn"]'); await settled(page); await page.waitForTimeout(200)
const fromMap = await snap(page)
await page.focus('#explore-planet'); await page.keyboard.press('Enter')
await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'exploring', null, { timeout: 15000 })
const exploringSaturn = (await snap(page)).explore.planet
await page.keyboard.press('Escape'); await settled(page)
await go(page, 24000); await page.waitForTimeout(400)
await page.click('.overview-panel [data-replay]'); await centre(page); await page.waitForTimeout(300)
const replay = await snap(page)
r.item15 = { overviewVisible: ov.overview.visible, labels, mapToSaturn: Math.abs(fromMap.current - px('saturn') / 24000) < 1e-4, exploringSaturn,
  replayAtPad: replay.current === 0 && samePose(replay, start), replayFocus: await page.evaluate(() => document.activeElement.id) }
r.errors = errors; r.failedRequests = failedRequests
console.log(JSON.stringify(r, null, 1))
await browser.close()
