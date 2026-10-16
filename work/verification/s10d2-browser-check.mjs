import { chromium } from 'playwright-core'
const out = process.argv[2]
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const errors = []
const newPage = async (size = { width: 1280, height: 720 }) => {
  const page = await browser.newPage({ viewport: size })
  page.on('pageerror', e => errors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()) })
  return page
}
const ready = page => page.waitForFunction(() => document.querySelector('canvas')?.journeySnapshot?.explore?.phase === 'travel', null, { timeout: 30000 })
const snap = page => page.evaluate(() => structuredClone(document.querySelector('canvas').journeySnapshot))
const focusInfo = page => page.evaluate(() => { const el = document.activeElement, b = el.getClientRects()[0] ?? el.getBoundingClientRect()
  const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2), style = getComputedStyle(el)
  return { id: el.id, text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30), visible: style.outlineStyle !== 'none', covered: !(hit === el || el.contains(hit)) } })
const tabTo = async (page, predicate, max = 40) => {
  for (let i = 0; i < max; i++) { await page.keyboard.press('Tab'); if (await page.evaluate(predicate)) return focusInfo(page) }
  throw Error('not reached: ' + predicate)
}
const settled = page => page.waitForFunction(() => { const s = document.querySelector('canvas').journeySnapshot; return s.current === s.target && s.explore.phase === 'travel' }, null, { timeout: 30000 })
const r = {}
// 1. Overview panel position without failures at the three target sizes.
r.overviewTop = {}
for (const size of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }]) {
  const page = await newPage(size); await page.goto('http://127.0.0.1:5173/'); await ready(page)
  await page.waitForFunction(() => document.querySelector('.asset-status').hidden, null, { timeout: 30000 })
  await page.evaluate(() => scrollTo(0, 1e6)); await page.waitForTimeout(2500)
  r.overviewTop[`${size.width}x${size.height}`] = await page.evaluate(() => Math.round(document.querySelector('.overview-panel').getBoundingClientRect().top))
  await page.close()
}
// 2. Overview with a failed texture: retry and replay reachable and uncovered.
{
  const page = await newPage(); await page.route('**/assets/mars/*.jpg', route => route.abort())
  await page.goto('http://127.0.0.1:5173/'); await ready(page)
  await page.waitForFunction(() => document.querySelector('.asset-status button'), null, { timeout: 30000 })
  await page.evaluate(() => scrollTo(0, 24000)); await page.waitForTimeout(2500)
  await page.focus('.asset-status button')
  const retry = await focusInfo(page)
  const geometry = await page.evaluate(() => ({ statusBottom: Math.round(document.querySelector('.asset-status').getBoundingClientRect().bottom),
    panelTop: Math.round(document.querySelector('.overview-panel').getBoundingClientRect().top) }))
  await page.focus('.overview-panel [data-replay]')
  const replay = await focusInfo(page)
  r.failureOverview = { retry, replay, ...geometry }
  await page.screenshot({ path: `${out}/s10d2-failure-overview.png` })
  await page.close()
}
// 3. One keyboard-only journey.
{
  const page = await newPage(); await page.goto('http://127.0.0.1:5173/'); await ready(page)
  const steps = []
  steps.push(['menu', await tabTo(page, () => document.activeElement.matches('.travel-navigation summary'))])
  await page.keyboard.press('Enter')
  steps.push(['Mars button', await tabTo(page, () => document.activeElement.matches('.travel-navigation [data-destination=mars]'))])
  await page.keyboard.press('Enter'); await settled(page)
  const mars = await snap(page)
  steps.push(['after jump', { progress: +mars.current.toFixed(4), ...(await focusInfo(page)) }])
  steps.push(['explore button', await tabTo(page, () => document.activeElement.id === 'explore-planet')])
  await page.keyboard.press('Enter')
  await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'exploring', null, { timeout: 15000 })
  steps.push(['dialog opened', await focusInfo(page)])
  steps.push(['hotspot 2', await tabTo(page, () => document.activeElement.matches('[data-info="mars-polar"]'))])
  await page.keyboard.press('Enter'); await page.waitForTimeout(700)
  const selected = (await snap(page)).explore.selectedHotspot
  steps.push(['rotate', await tabTo(page, () => document.activeElement.textContent === 'หมุนขวา')])
  const yawBefore = (await snap(page)).explore.orbit.yaw
  await page.keyboard.press('Enter'); await page.waitForTimeout(100)
  const rotated = (await snap(page)).explore.orbit.yaw !== yawBefore
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'travel', null, { timeout: 15000 })
  await page.waitForTimeout(300)
  steps.push(['after Escape', await focusInfo(page)])
  await page.keyboard.press('End'); await page.waitForTimeout(500); await settled(page); await page.waitForTimeout(600)
  const end = await snap(page)
  steps.push(['End key', { progress: end.current, overview: end.overview.visible }])
  steps.push(['overview replay', await tabTo(page, () => document.activeElement.matches('.overview-panel [data-replay]'))])
  await page.keyboard.press('Enter'); await settled(page)
  steps.push(['after replay', { progress: (await snap(page)).current, ...(await focusInfo(page)) }])
  r.keyboardJourney = { steps, selected, rotated }
  await page.close()
}
r.errors = errors
console.log(JSON.stringify(r, null, 1))
await browser.close()
