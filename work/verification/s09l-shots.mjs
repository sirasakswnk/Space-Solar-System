import { chromium } from 'playwright-core'
const [out, tag] = process.argv.slice(2)
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('pageerror', e => errors.push(String(e)))
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
await page.goto('http://127.0.0.1:5173/')
await page.waitForFunction(() => document.querySelector('canvas')?.journeySnapshot?.explore?.phase === 'travel', null, { timeout: 30000 })
await page.waitForTimeout(2500)
const f = 0.94
const poses = { pad: 0, launch: 0.06, mercury: 0.189*f, legVenus: 0.25*f, venus: 0.3066*f, mars: 0.42*f, legJupiter: 0.49*f,
  jupiter: 0.56*f, saturn: 0.7*f, uranus: 0.85*f, legNeptune: 0.9*f, neptune: 0.93, overview: 1 }
const only = process.argv[4]?.split(',')
for (const [name, value] of Object.entries(poses)) {
  if (only && !only.includes(name)) continue
  const px = Math.round(value * 24000)
  await page.evaluate(px => scrollTo(0, px), px)
  await page.waitForFunction(p => { const s = document.querySelector('canvas').journeySnapshot; return Math.abs(s.current - p) < 1e-4 && s.current === s.target }, px / 24000, { timeout: 30000 })
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${out}/${tag}-${name}.png` })
}
console.log(JSON.stringify({ errors }))
await browser.close()
