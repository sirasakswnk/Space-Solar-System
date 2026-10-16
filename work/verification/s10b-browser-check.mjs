import { chromium } from 'playwright-core'
const out = process.argv[2]
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const errors = []
const open = async system => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  page.on('pageerror', e => errors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  await page.emulateMedia({ reducedMotion: system })
  await page.goto('http://127.0.0.1:5173/')
  await page.waitForFunction(() => document.querySelector('canvas')?.journeySnapshot?.explore?.phase === 'travel', null, { timeout: 30000 })
  await page.waitForTimeout(800)
  return page
}
const snap = page => page.evaluate(() => structuredClone(document.querySelector('canvas').journeySnapshot))
const ui = page => page.evaluate(() => ({ reduced: document.querySelector('.settings-controls input[type=checkbox]').checked,
  quality: document.querySelector('.quality-options input:checked').value, canvasWidth: document.querySelector('canvas').width,
  summary: document.querySelector('.travel-navigation summary').textContent, settingsSummary: document.querySelector('.settings-panel summary').textContent }))
const settle = page => page.waitForFunction(() => { const s = document.querySelector('canvas').journeySnapshot; return s.current === s.target && s.motion.fade === 0 && s.explore.phase === 'travel' }, null, { timeout: 30000 })
const go = async (page, px) => { await page.evaluate(px => scrollTo(0, px), px)
  await page.waitForFunction(p => Math.abs(document.querySelector('canvas').journeySnapshot.target - p) < 1e-4, px / 24000, { timeout: 30000 }); await settle(page) }
const fps = page => page.evaluate(() => new Promise(resolve => { let n = 0; const start = performance.now()
  const tick = () => { n++; if (performance.now() - start < 3000) requestAnimationFrame(tick); else resolve(+(n / ((performance.now() - start) / 1000)).toFixed(1)) }; requestAnimationFrame(tick) }))
const close = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-6)
const r = {}
const menu = openState => pageRef.evaluate(o => { document.querySelector('.settings-panel').open = o }, openState)
// System reduce: checkbox starts checked.
let page = await open('reduce')
const pageRef = { evaluate: (...a) => page.evaluate(...a) }
r.systemReduceDefault = { ui: await ui(page), motion: (await snap(page)).motion.reduced }
await page.close()
page = await open('no-preference')
r.systemNormalDefault = { ui: await ui(page), motion: (await snap(page)).motion.reduced, pixelRatio: (await snap(page)).pixelRatio }
// Keyboard only: Tab to the menu, open it, reach the checkbox and toggle with Space.
const jupiter = Math.round(0.56 * 0.94 * 24000)
await go(page, jupiter)
const beforePose = await snap(page)
// Layout at 1280x720: each open menu stays above the caption; one menu at a time.
const rect = sel => page.evaluate(s => { const b = document.querySelector(s).getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right } }, sel)
const captionTop = (await page.evaluate(() => Math.min(...[...document.querySelectorAll('.caption > *')].filter(e => !e.hidden).map(e => e.getBoundingClientRect().top))))
await page.click('.travel-navigation summary'); await page.click('.settings-panel summary')
const navOpen = await rect('.travel-navigation'), settingsOpen = await rect('.settings-panel')
const overlaps = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
r.layout = { captionTop, navBottom: navOpen.bottom, settingsBottom: settingsOpen.bottom, settingsRight: settingsOpen.right,
  clearOfCaption: navOpen.bottom < captionTop && settingsOpen.bottom < captionTop, panelsSeparate: !overlaps(navOpen, settingsOpen) }
await page.screenshot({ path: `${out}/s10b-both-open.png` })
await page.evaluate(() => { document.querySelector('.settings-panel').open = false })
await page.evaluate(() => { document.querySelector('.travel-navigation').open = false })
await page.focus('.settings-panel summary'); await page.keyboard.press('Enter')
let tabs = 0
while (tabs < 20 && !(await page.evaluate(() => document.activeElement?.matches('.settings-controls input[type=checkbox]')))) { await page.keyboard.press('Tab'); tabs++ }
r.tabsToCheckbox = tabs
await page.keyboard.press('Space')
r.afterSpace = { ui: (await ui(page)).reduced, motion: (await snap(page)).motion.reduced }
// The user's choice stays when the system setting changes.
await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForTimeout(200)
r.choiceSurvivesSystemChange = (await snap(page)).motion.reduced === true
// Quality via keyboard: Tab into the radio group, ArrowRight selects light.
await page.keyboard.press('Tab'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(300)
const light = await snap(page)
r.lightMode = { ui: await ui(page), pixelRatio: light.pixelRatio }
r.lightKeepsProgressAndPose = light.current === beforePose.current && close(light.camera, beforePose.camera) && close(light.ship, beforePose.ship)
await page.screenshot({ path: `${out}/s10b-settings-light.png` })
// Frame rate comparison (software renderer, indicative only).
await page.screenshot({ path: `${out}/s10b-settings-light.png` }); await menu(false); await page.mouse.move(640, 700)
r.fpsLight = await fps(page)
await menu(true); await page.check('.quality-options input[value=standard]'); await menu(false); await page.waitForTimeout(300)
r.standardPixelRatio = (await snap(page)).pixelRatio
r.fpsStandard = await fps(page)
await menu(true); await page.check('.quality-options input[value=light]'); await menu(false); await page.waitForTimeout(300)
// Explore still works in light mode; hotspot markers stay on screen.
const marsPx = Math.round(0.42 * 0.94 * 24000)
await go(page, marsPx)
const beforeExplore = await snap(page)
await page.focus('#explore-planet'); await page.keyboard.press('Enter')
await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'exploring', null, { timeout: 15000 })
await page.waitForTimeout(300)
r.markersVisible = await page.evaluate(() => [...document.querySelectorAll('.hotspot-marker')].filter(b => !b.hidden).length)
await page.screenshot({ path: `${out}/s10b-light-explore.png` })
await page.keyboard.press('Escape')
await settle(page); await page.waitForTimeout(200)
const afterExplore = await snap(page)
r.exploreRestoreLight = close(afterExplore.camera, beforeExplore.camera) && close(afterExplore.cameraQuaternion, beforeExplore.cameraQuaternion)
r.focusAfterExit = await page.evaluate(() => document.activeElement?.id)
// Overview: the closed settings toggle does not overlap the overview panel or labels.
await go(page, 24000); await page.waitForTimeout(300)
const toggle = await rect('.settings-panel'), panel = await rect('.overview-panel')
const labels = await page.evaluate(() => [...document.querySelectorAll('.overview-labels > *')].map(e => e.getBoundingClientRect()).map(b => ({ top: b.top, bottom: b.bottom, left: b.left, right: b.right })))
r.overviewClear = !overlaps(toggle, panel) && labels.every(l => !overlaps(toggle, l))
await page.screenshot({ path: `${out}/s10b-overview.png` })
// Start over keeps both settings.
await page.click('.travel-navigation summary'); await page.click('.travel-navigation [data-replay]'); await settle(page)
const replay = await snap(page)
r.afterReplay = { progress: replay.current, ui: await ui(page), motion: replay.motion.reduced, pixelRatio: replay.pixelRatio }
r.errors = errors
console.log(JSON.stringify(r, null, 1))
await browser.close()
