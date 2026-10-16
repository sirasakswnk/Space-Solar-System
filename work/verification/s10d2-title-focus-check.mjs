import { chromium } from 'playwright-core'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
await page.goto('http://127.0.0.1:5173/')
await page.waitForFunction(() => document.querySelector('canvas')?.journeySnapshot?.explore?.phase === 'travel', null, { timeout: 30000 })
await page.evaluate(() => scrollTo(0, 24000)); await page.waitForTimeout(2500)
await page.focus('.overview-panel [data-replay]'); await page.keyboard.press('Enter'); await page.waitForTimeout(1500)
console.log(JSON.stringify(await page.evaluate(() => {
  const h1 = document.activeElement, b = h1.getBoundingClientRect()
  const others = [...document.querySelectorAll('body *')].filter(e => { if (e === h1 || e.contains(h1) || h1.contains(e)) return false
    const s = getComputedStyle(e); if (s.visibility === 'hidden' || s.display === 'none' || e.closest('[hidden]')) return false
    const r = e.getBoundingClientRect(); return r.width && r.height && r.left < b.right && b.left < r.right && r.top < b.bottom && b.top < r.bottom && ['fixed', 'absolute'].includes(s.position) && !e.closest('.intro') && !e.closest('.scene') })
  return { focused: h1.id, introPointerEvents: getComputedStyle(document.querySelector('.intro')).pointerEvents, overlappingPositioned: others.map(e => e.className || e.tagName) }
})))
await page.screenshot({ path: process.argv[2], clip: { x: 0, y: 0, width: 640, height: 240 } })
await browser.close()
