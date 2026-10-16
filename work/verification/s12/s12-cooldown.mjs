import { browser, errors, open, ready, snap, settled, go, px } from './s12-common.mjs'
const page = await open(); await ready(page)
const r = {}
const enterExit = async () => {
  await go(page, px('mars'))
  await page.focus('#explore-planet'); await page.keyboard.press('Enter')
  await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'exploring', null, { timeout: 15000 })
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'travel', null, { timeout: 15000 })
}
// Instant scroll inside the cooldown: target follows once it ends.
await enterExit()
await page.evaluate(() => scrollTo(0, 24000))
await page.waitForTimeout(1500)
let s = await snap(page)
r.instantScrollSynced = { scrollY: await page.evaluate(() => scrollY), target: s.target, current: +s.current.toFixed(4) }
// Wheel inside the cooldown is still blocked; record when the exit finished and when the wheel arrived.
await go(page, px('mars'))
await page.mouse.move(640, 600)
await page.evaluate(() => { window.__wheelAt = null; window.__travelAt = null
  addEventListener('wheel', () => { window.__wheelAt ??= performance.now() }, { capture: true, passive: true })
  let last = document.querySelector('canvas').journeySnapshot.explore.phase
  const watch = () => { const phase = document.querySelector('canvas').journeySnapshot.explore.phase
    if (phase === 'travel' && last !== 'travel') window.__travelAt = performance.now()
    last = phase; if (!window.__travelAt) requestAnimationFrame(watch) }
  requestAnimationFrame(watch) })
await page.focus('#explore-planet'); await page.keyboard.press('Enter')
await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'exploring', null, { timeout: 15000 })
const y0 = await page.evaluate(() => scrollY)
await page.keyboard.press('Escape')
await page.mouse.wheel(0, 800); await page.mouse.wheel(0, 800); await page.mouse.wheel(0, 800)
await page.waitForTimeout(1200)
s = await snap(page)
r.wheelBlocked = { msFromExitToWheel: await page.evaluate(() => window.__wheelAt && window.__travelAt ? Math.round(window.__wheelAt - window.__travelAt) : null), scrollBefore: y0, scrollAfter: await page.evaluate(() => scrollY), target: +s.target.toFixed(4), marsStop: +(px('mars') / 24000).toFixed(4) }
r.errors = errors
console.log(JSON.stringify(r))
await browser.close()
