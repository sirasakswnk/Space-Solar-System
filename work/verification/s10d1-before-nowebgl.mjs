import { chromium } from 'playwright-core'
const [out, tag] = process.argv.slice(2)
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const errors = []
page.on('pageerror', e => errors.push(String(e).slice(0, 160)))
page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)) })
// Simulate a browser without WebGL: every WebGL context request fails.
await page.addInitScript(() => {
  const original = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    return /webgl/i.test(type) ? null : original.call(this, type, ...rest)
  }
})
await page.goto('http://127.0.0.1:5173/')
await page.waitForTimeout(3000)
const info = await page.evaluate(() => ({ bodyText: document.body.innerText.slice(0, 300), rootChildren: document.getElementById('root').children.length,
  scrollHeight: document.documentElement.scrollHeight }))
await page.screenshot({ path: `${out}/${tag}.png` })
console.log(JSON.stringify({ info, errors: errors.slice(0, 4) }, null, 1))
await browser.close()
