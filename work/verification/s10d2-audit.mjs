import { chromium } from 'playwright-core'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
await page.goto('http://127.0.0.1:5173/')
await page.waitForFunction(() => document.querySelector('canvas')?.journeySnapshot?.explore?.phase === 'travel', null, { timeout: 30000 })
await page.waitForTimeout(800)
const describe = () => page.evaluate(() => {
  const el = document.activeElement
  if (!el || el === document.body) return { name: 'BODY' }
  const box = el.getClientRects()[0] ?? el.getBoundingClientRect(), style = getComputedStyle(el)
  const x = box.left + box.width / 2, y = box.top + box.height / 2
  const hit = document.elementFromPoint(Math.min(Math.max(x, 0), innerWidth - 1), Math.min(Math.max(y, 0), innerHeight - 1))
  return { name: (el.getAttribute('aria-label') || el.closest('label')?.textContent || el.textContent || el.tagName).trim().slice(0, 32) + (el.tagName === 'INPUT' ? ` [${el.type}]` : ''), tag: el.tagName,
    outline: style.outlineStyle !== 'none' && style.outlineWidth !== '0px', inView: box.bottom > 0 && box.top < innerHeight && box.width > 0,
    covered: !(hit === el || el.contains(hit)), coveredBy: hit && !(hit === el || el.contains(hit)) ? (hit.className || hit.tagName).toString().slice(0, 30) : null }
})
const tabCycle = async (label, max = 40) => {
  await page.evaluate(() => { document.activeElement?.blur(); window.getSelection()?.removeAllRanges() })
  const stops = []
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab')
    const d = await describe()
    if (stops.length && d.name === stops[0].name) break
    stops.push(d)
  }
  console.log(`\n== ${label} (${stops.length} stops)`)
  for (const s of stops) console.log(`${s.outline ? ' ' : '!'}${s.covered ? 'C' : ' '}${s.inView ? ' ' : 'V'} ${s.tag} ${s.name}${s.coveredBy ? '  <- ' + s.coveredBy : ''}`)
}
const go = async px => { await page.evaluate(px => scrollTo(0, px), px); await page.waitForFunction(p => { const s = document.querySelector('canvas').journeySnapshot; return Math.abs(s.current - p) < 1e-4 && s.current === s.target }, px / 24000, { timeout: 30000 }); await page.waitForTimeout(200) }
await tabCycle('pad')
await go(Math.round(0.42 * 0.94 * 24000)); await tabCycle('mars stop')
await page.evaluate(() => { document.querySelector('.travel-navigation').open = true; document.querySelector('.settings-panel').open = true })
await tabCycle('mars stop, both menus open')
await page.evaluate(() => { document.querySelector('.travel-navigation').open = false; document.querySelector('.settings-panel').open = false })
// Inside the exploration dialog at Mars.
await go(Math.round(0.42 * 0.94 * 24000))
await page.focus('#explore-planet'); await page.keyboard.press('Enter')
await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'exploring', null, { timeout: 15000 })
await page.waitForTimeout(300)
await tabCycle('explore dialog (Mars)')
await page.keyboard.press('Escape')
await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'travel', null, { timeout: 15000 })
await page.waitForTimeout(400)
await go(24000); await tabCycle('overview')
await browser.close()
// Overview with a failed texture (known issue).
const failing = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const p2 = await failing.newPage({ viewport: { width: 1280, height: 720 } })
await p2.route('**/assets/mars/*.jpg', r => r.abort())
await p2.goto('http://127.0.0.1:5173/')
await p2.waitForFunction(() => document.querySelector('.asset-status button'), null, { timeout: 30000 })
await p2.evaluate(() => scrollTo(0, 24000)); await p2.waitForTimeout(2500)
await p2.focus('.asset-status button')
console.log('\n== overview with failed texture: retry button', JSON.stringify(await p2.evaluate(() => {
  const el = document.activeElement, b = el.getBoundingClientRect(), hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)
  return { covered: !(hit === el || el.contains(hit)), coveredBy: hit?.className, buttonBottom: Math.round(b.bottom), statusBottom: Math.round(document.querySelector('.asset-status').getBoundingClientRect().bottom), overviewTop: Math.round(document.querySelector('.overview-panel').getBoundingClientRect().top) }
})))
await failing.close()
await browser.close()
