import { chromium } from 'playwright-core'
export const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
export const errors = [], failedRequests = []
export async function open(size = { width: 1280, height: 720 }, url = 'http://127.0.0.1:5173/') {
  const page = await browser.newPage({ viewport: size })
  page.on('pageerror', e => errors.push(String(e)))
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('requestfailed', r => failedRequests.push(r.url()))
  page.on('response', r => { if (r.status() >= 400) failedRequests.push(`${r.status()} ${r.url()}`) })
  await page.goto(url)
  return page
}
export const ready = page => page.waitForFunction(() => document.querySelector('canvas')?.journeySnapshot?.explore?.phase === 'travel', null, { timeout: 30000 })
export const snap = page => page.evaluate(() => structuredClone(document.querySelector('canvas').journeySnapshot))
export const settled = page => page.waitForFunction(() => { const s = document.querySelector('canvas').journeySnapshot, l = s.pointerLook
  return s.current === s.target && s.explore.phase === 'travel' && (!s.motion || s.motion.fade === 0) && (!l || (l.current.x === l.target.x && l.current.y === l.target.y)) }, null, { timeout: 30000 })
// The mouse lean (S09m) rotates the camera; recentre it before comparing poses.
export async function centre(page) {
  await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointerout', { relatedTarget: null })))
  await settled(page)
}
export async function go(page, px) {
  await page.evaluate(px => scrollTo(0, px), px)
  await page.waitForFunction(p => Math.abs(document.querySelector('canvas').journeySnapshot.target - p) < 1e-4, px / 24000, { timeout: 30000 })
  await settled(page); await page.waitForTimeout(150)
  return snap(page)
}
export const close = (a, b, e = 1e-6) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < e)
const sameLean = (a, b) => JSON.stringify(a.pointerLook?.current) === JSON.stringify(b.pointerLook?.current)
export const samePose = (a, b) => sameLean(a, b) && ['camera', 'cameraQuaternion', 'ship', 'shipQuaternion'].every(k => close(a[k], b[k]))
export const stops = { mercury: 0.189 * 0.94, venus: 0.3066 * 0.94, mars: 0.42 * 0.94, jupiter: 0.56 * 0.94, saturn: 0.7 * 0.94, uranus: 0.85 * 0.94, neptune: 0.93 }
export const px = id => Math.round(stops[id] * 24000)
