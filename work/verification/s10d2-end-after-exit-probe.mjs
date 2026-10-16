import { chromium } from 'playwright-core'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
await page.goto('http://127.0.0.1:5173/')
await page.waitForFunction(() => document.querySelector('canvas')?.journeySnapshot?.explore?.phase === 'travel', null, { timeout: 30000 })
const marsPx = Math.round(0.42 * 0.94 * 24000)
await page.evaluate(px => scrollTo(0, px), marsPx)
await page.waitForFunction(p => { const s = document.querySelector('canvas').journeySnapshot; return Math.abs(s.current - p) < 1e-4 && s.current === s.target }, marsPx / 24000)
// 3. Press End immediately after leaving exploration.
for (const wait of [50, 100, 400]) {
await page.evaluate(px => scrollTo(0, px), marsPx)
await page.waitForFunction(p => { const s = document.querySelector('canvas').journeySnapshot; return Math.abs(s.current - p) < 1e-4 && s.current === s.target }, marsPx / 24000)
await page.focus('#explore-planet'); await page.keyboard.press('Enter')
await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'exploring')
await page.keyboard.press('Escape')
await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'travel')
await page.waitForTimeout(wait)
await page.keyboard.press('End')
await page.waitForTimeout(2000)
console.log('wait', wait, JSON.stringify(await page.evaluate(() => { const s = document.querySelector('canvas').journeySnapshot
  return { scrollY, maxScroll: document.documentElement.scrollHeight - innerHeight, target: s.target, current: s.current, activeElement: document.activeElement?.id } })))
}
await browser.close()
