import { browser, errors, open, ready, snap, settled, go, px } from './s12-common.mjs'
const page = await open(); await ready(page)
await go(page, px('venus'))
await page.focus('#explore-planet'); await page.keyboard.press('Enter')
const phase0 = (await snap(page)).explore.phase
await page.evaluate(() => document.querySelector('.explore-panel [data-destination=saturn]').click())
const phase1 = (await snap(page)).explore
await page.evaluate(() => document.querySelector('.explore-panel [data-destination=uranus]').click())
const phase2 = (await snap(page)).explore
await page.waitForTimeout(2500)
const s = await snap(page)
console.log(JSON.stringify({ phase0, phase1: [phase1.phase, phase1.pendingDestination], phase2: [phase2.phase, phase2.pendingDestination],
  after: { phase: s.explore.phase, current: s.current, target: s.target, scrollY: await page.evaluate(() => scrollY), uranusPx: px('uranus'), overflow: await page.evaluate(() => document.body.style.overflow) }, errors }))
const t = Date.now()
await page.evaluate(p => scrollTo(0, p), px('uranus'))
for (let i = 0; i < 6; i++) { await page.waitForTimeout(500); const q = await snap(page); console.log(Date.now() - t, q.target, q.current, q.motion, q.explore.phase) }
await browser.close()
