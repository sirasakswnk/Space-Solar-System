import { chromium } from 'playwright-core'
const out = process.argv[2]
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const errors = []
const run = async reduced => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  page.on('pageerror', e => errors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' })
  await page.goto('http://127.0.0.1:5173/')
  const snap = () => page.evaluate(() => structuredClone(document.querySelector('canvas').journeySnapshot))
  await page.waitForFunction(() => document.querySelector('canvas')?.journeySnapshot?.explore?.phase === 'travel', null, { timeout: 30000 })
  await page.waitForTimeout(800)
  // Record progress, phase, fade and overlay opacity on every animation frame.
  const record = () => page.evaluate(() => { window.__frames = []; const tick = () => { const s = document.querySelector('canvas').journeySnapshot
    window.__frames.push({ current: s.current, phase: s.explore.phase, fade: s.motion.fade, overlay: document.querySelector('.motion-fade').style.opacity, orbit: s.explore.orbit })
    if (window.__frames.length < 600) requestAnimationFrame(tick) }; requestAnimationFrame(tick) })
  const frames = () => page.evaluate(() => window.__frames)
  const settle = () => page.waitForFunction(() => { const s = document.querySelector('canvas').journeySnapshot; return s.current === s.target && s.explore.phase !== 'entering' && s.explore.phase !== 'exiting' && s.motion.fade === 0 }, null, { timeout: 30000 })
  // Wait until the scroll has registered as the new target, then until it settles.
  const go = async px => { await page.evaluate(px => scrollTo(0, px), px)
    await page.waitForFunction(p => Math.abs(document.querySelector('canvas').journeySnapshot.target - p) < 1e-4, px / 24000, { timeout: 30000 }); await settle() }
  const r = { reducedFlag: (await snap()).motion.reduced }
  // 1. Pointer lean.
  const mercuryPx = Math.round(0.189 * 0.94 * 24000)
  await go(mercuryPx)
  await page.mouse.move(1279, 0); await page.waitForTimeout(1500)
  r.leanCurrent = (await snap()).pointerLook.current
  // 2. Destination menu Mercury -> Neptune.
  await record()
  await page.click('.travel-navigation summary'); await page.click('.travel-navigation [data-destination="neptune"]')
  await settle(); await page.waitForTimeout(100)
  let f = await frames()
  const target = 0.93
  const between = f.filter(x => x.current > 0.2 && x.current < target - 0.001)
  r.menuIntermediateFrames = between.length
  r.menuMaxFade = Math.max(...f.map(x => x.fade))
  r.menuOverlayPeak = Math.max(...f.map(x => +x.overlay || 0))
  r.menuFadeFrames = f.filter(x => x.fade > 0).length
  await page.mouse.move(640, 700)
  await page.screenshot({ path: `${out}/s10a-${reduced ? 'reduced' : 'normal'}-neptune.png` })
  // 3. PageDown-sized scroll still eases.
  await go(12000)
  await record(); await go(12650); await page.waitForTimeout(100)
  f = await frames()
  r.smallScrollEases = f.filter(x => x.current > 0.5 + 1e-4 && x.current < 0.5 + 650 / 24000 - 1e-4).length > 2
  r.smallScrollNoFade = f.every(x => x.fade === 0)
  // 4. Explore enter / hotspot / exit at Mars.
  const marsPx = Math.round(0.42 * 0.94 * 24000)
  await go(marsPx)
  const before = await snap()
  await record(); await page.focus('#explore-planet'); await page.keyboard.press('Enter')
  await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'exploring', null, { timeout: 15000 })
  await page.waitForTimeout(100)
  f = await frames()
  r.enterTransitionFrames = f.filter(x => x.phase === 'entering').length
  r.enterFade = Math.max(...f.map(x => x.fade))
  await record(); await page.click('[data-info="mars-polar"]'); await page.waitForTimeout(700)
  f = await frames()
  const finalOrbit = f.at(-1).orbit
  r.hotspotMovingFrames = f.filter(x => Math.abs(x.orbit.yaw - finalOrbit.yaw) > 1e-9 && Math.abs(x.orbit.yaw - f[0].orbit.yaw) > 1e-9).length
  await record(); await page.keyboard.press('Escape')
  await page.waitForFunction(() => document.querySelector('canvas').journeySnapshot.explore.phase === 'travel', null, { timeout: 15000 })
  await settle(); await page.waitForTimeout(100)
  f = await frames()
  r.exitTransitionFrames = f.filter(x => x.phase === 'exiting').length
  const after = await snap()
  const close = (a, b) => a.every((v, i) => Math.abs(v - b[i]) < 1e-6)
  // With the lean active (normal mode) rotation may follow the mouse; position must match.
  r.exitRestore = (reduced ? ['camera', 'cameraQuaternion', 'ship'] : ['camera', 'ship']).every(k => close(before[k], after[k]))
  r.focus = await page.evaluate(() => document.activeElement?.id)
  // 5. Replay keeps working; overlay never blocks clicks.
  r.overlayPointerEvents = await page.evaluate(() => getComputedStyle(document.querySelector('.motion-fade')).pointerEvents)
  await page.click('.travel-navigation summary'); await page.click('.travel-navigation [data-replay]'); await settle()
  r.replayProgress = (await snap()).current
  // 6. Live change of the system setting.
  await page.emulateMedia({ reducedMotion: reduced ? 'no-preference' : 'reduce' }); await page.waitForTimeout(200)
  r.liveToggle = (await snap()).motion.reduced === !reduced
  await page.close()
  return r
}
const result = { reduced: await run(true), normal: await run(false), errors }
console.log(JSON.stringify(result, null, 1))
await browser.close()
