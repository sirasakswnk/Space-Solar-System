import { chromium } from 'playwright-core'
const out = process.argv[2]
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const run = async (mode) => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  const errors = []
  page.on('pageerror', e => errors.push(String(e).slice(0, 140)))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)) })
  if (mode !== 'webgl') await page.addInitScript(onlyAttached => {
    const original = HTMLCanvasElement.prototype.getContext
    // 'none': no WebGL anywhere. 'late': detection succeeds, the scene's own canvas fails.
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      if (/webgl/i.test(type) && (!onlyAttached || this.isConnected)) return null
      return original.call(this, type, ...rest)
    }
  }, mode === 'late')
  await page.goto('http://127.0.0.1:5173/')
  await page.waitForTimeout(2500)
  const info = await page.evaluate(() => {
    const fallback = document.querySelector('.fallback-page')
    const images = [...document.querySelectorAll('.fallback-page img')]
    return { fallback: !!fallback, canvas: !!document.querySelector('.scene canvas'),
      planets: [...document.querySelectorAll('.fallback-planet h2')].map(h => h.textContent),
      hotspots: document.querySelectorAll('.fallback-hotspot h3').length,
      sources: document.querySelectorAll('.fallback-planet a[href^="https://science.nasa.gov"]').length,
      images: images.length, imageAlts: images.every(i => i.alt), assetStatus: !!document.querySelector('.asset-status'),
      notice: document.querySelector('.fallback-notice')?.textContent.slice(0, 40) }
  })
  if (info.fallback) {
    // Load all lazy images, then confirm each decoded.
    await page.evaluate(() => document.querySelectorAll('.fallback-page img').forEach(i => { i.loading = 'eager' }))
    await page.waitForFunction(() => [...document.querySelectorAll('.fallback-page img')].every(i => i.complete), null, { timeout: 30000 })
    info.imagesDecoded = await page.evaluate(() => [...document.querySelectorAll('.fallback-page img')].every(i => i.naturalWidth > 0))
    // Keyboard: Tab to the Mars link and follow it.
    let tabs = 0
    while (tabs < 30 && !(await page.evaluate(() => document.activeElement?.getAttribute('href') === '#planet-mars'))) { await page.keyboard.press('Tab'); tabs++ }
    info.tabsToMarsLink = tabs
    info.focusVisible = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle !== 'none')
    await page.keyboard.press('Enter'); await page.waitForTimeout(300)
    info.marsSectionTop = await page.evaluate(() => Math.round(document.getElementById('planet-mars').getBoundingClientRect().top))
    info.hash = await page.evaluate(() => location.hash)
    await page.evaluate(() => scrollTo(0, 0)); await page.screenshot({ path: `${out}/s10d1-${mode}-top.png` })
    await page.evaluate(() => document.getElementById('planet-saturn').scrollIntoView()); await page.screenshot({ path: `${out}/s10d1-${mode}-saturn.png` })
  } else {
    await page.waitForFunction(() => document.querySelector('canvas')?.journeySnapshot?.explore?.phase === 'travel', null, { timeout: 30000 })
    info.journeyRunning = true
    await page.screenshot({ path: `${out}/s10d1-${mode}.png` })
  }
  info.errors = errors
  await page.close()
  return info
}
const result = { none: await run('none'), late: await run('late'), webgl: await run('webgl') }
console.log(JSON.stringify(result, null, 1))
await browser.close()
