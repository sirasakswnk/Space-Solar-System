import { CanvasTexture } from 'three'

// One small, original soft particle mask shared by launch clouds and exhaust mist.
export function createCloudTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const context = canvas.getContext('2d')!
  for (const [x, y, radius] of [[40, 70, 37], [66, 48, 40], [88, 69, 35]]) {
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, 'rgba(255,255,255,0.65)')
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.45)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    context.fillStyle = gradient
    context.fillRect(0, 0, 128, 128)
  }
  return new CanvasTexture(canvas)
}
