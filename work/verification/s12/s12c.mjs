import { browser, errors, failedRequests, open, ready, snap, settled, go, close, px, centre } from './s12-common.mjs'
const out = process.argv[2]
const r = {}
const sizes = [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]
const phase = (page, p) => page.waitForFunction(p => document.querySelector('canvas').journeySnapshot.explore.phase === p, p, { timeout: 15000 })
// 14. Resize while travelling and while exploring.
{
  const page = await open(); await ready(page)
  const before = await go(page, px('saturn'))
  const travel = []
  for (const size of [sizes[2], sizes[1], sizes[0]]) {
    await page.setViewportSize(size); await page.waitForTimeout(600); await settled(page)
    const s = await snap(page)
    travel.push({ size: `${size.width}x${size.height}`, progress: s.current, scrollY: await page.evaluate(() => scrollY),
      maxScroll: await page.evaluate(() => document.documentElement.scrollHeight - innerHeight), shipSame: close(s.ship, before.ship), cameraSame: close(s.camera, before.camera) })
  }
  await page.focus('#explore-planet'); await page.keyboard.press('Enter'); await phase(page, 'exploring')
  await page.click('[data-info="saturn-rings"]'); await page.waitForFunction(() => !document.querySelector('canvas').journeySnapshot.explore.focusing)
  const exploring = await snap(page)
  await page.setViewportSize(sizes[2]); await page.waitForTimeout(600)
  const resized = await snap(page)
  await page.setViewportSize(sizes[0]); await page.waitForTimeout(600)
  await page.keyboard.press('Escape'); await phase(page, 'travel'); await centre(page)
  const after = await snap(page)
  r.item14 = { travel, exploreKeptState: resized.explore.phase === 'exploring' && resized.explore.planet === 'saturn' && resized.explore.selectedHotspot === 'saturn-rings'
      && JSON.stringify(resized.explore.orbit) === JSON.stringify(exploring.explore.orbit),
    exitRestores: after.current === before.current && close(after.camera, before.camera) && (await page.evaluate(() => scrollY)) === px('saturn'),
    focus: await page.evaluate(() => document.activeElement.id) }
  await page.close()
}
// 17. Thai and English text at every target size: no overlapping panels, no clipped text.
r.item17 = {}
for (const size of sizes) {
  const page = await open(size); await ready(page)
  await page.waitForFunction(() => document.querySelector('.asset-status').hidden, null, { timeout: 30000 })
  const tag = `${size.width}x${size.height}`
  const views = { pad: 0, mars: px('mars'), overview: 24000 }
  r.item17[tag] = {}
  for (const [name, p] of Object.entries(views)) {
    await go(page, p); await page.waitForTimeout(name === 'overview' ? 600 : 200)
    if (name === 'mars') await page.evaluate(() => { document.querySelector('.travel-navigation').open = true; document.querySelector('.settings-panel').open = true })
    await page.screenshot({ path: `${out}/c-${tag}-${name}.png` })
    r.item17[tag][name] = await page.evaluate(() => {
      const visible = e => e && !e.hidden && !e.closest('[hidden]') && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 0
      const blocks = { intro: '.intro', menu: '.travel-navigation', settings: '.settings-panel', meter: '.journey-meter', overview: '.overview-panel' }
      const rects = Object.fromEntries(Object.entries(blocks).map(([k, sel]) => [k, document.querySelector(sel)]).filter(([, e]) => visible(e)).map(([k, e]) => [k, e.getBoundingClientRect()]))
      // Caption: union of its visible children only (the footer box itself spans the page).
      const captionKids = [...document.querySelectorAll('.caption > *')].filter(visible).map(e => e.getBoundingClientRect())
      if (captionKids.length) rects.caption = { left: Math.min(...captionKids.map(b => b.left)), right: Math.max(...captionKids.map(b => b.right)), top: Math.min(...captionKids.map(b => b.top)), bottom: Math.max(...captionKids.map(b => b.bottom)) }
      const overlaps = []
      const keys = Object.keys(rects)
      for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
        const a = rects[keys[i]], b = rects[keys[j]]
        if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) overlaps.push(`${keys[i]}/${keys[j]}`)
      }
      const labels = [...document.querySelectorAll('.overview-labels > *')].filter(visible).map(e => e.getBoundingClientRect())
      const labelHitsPanel = rects.overview ? labels.some(b => b.left < rects.overview.right && rects.overview.left < b.right && b.top < rects.overview.bottom && rects.overview.top < b.bottom) : false
      const clipped = [...document.querySelectorAll('button, summary, p, label, h1, h2, span')].filter(visible).filter(e => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible').map(e => e.textContent.slice(0, 20))
      const offscreen = [...document.querySelectorAll('button, summary, a')].filter(visible).filter(e => { const b = e.getBoundingClientRect(); return b.right > innerWidth || b.bottom > innerHeight || b.left < 0 }).map(e => e.textContent.slice(0, 20))
      return { overlaps, labelHitsPanel, clipped, offscreen, font: getComputedStyle(document.body).fontFamily }
    })
    if (name === 'mars') await page.evaluate(() => { document.querySelector('.travel-navigation').open = false; document.querySelector('.settings-panel').open = false })
  }
  await page.close()
}
r.errors = errors; r.failedRequests = failedRequests
console.log(JSON.stringify(r, null, 1))
await browser.close()
