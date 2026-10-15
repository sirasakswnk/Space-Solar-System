// Representative cloud band in the inspected image, not current weather.
export const saturnMapSize = { width: 2048, height: 1024 }
export const saturnBodyRegion = { x: 700, y: 350 }
export const saturnBodyAnchor = {
  yaw: Math.PI * 2 * saturnBodyRegion.x / saturnMapSize.width - Math.PI / 2,
  pitch: Math.PI / 2 - Math.PI * saturnBodyRegion.y / saturnMapSize.height,
  height: 0.1,
}
export const saturnBodyOutline = { startAngle: 0.18, widthAngle: 0.004, radiusOffset: 0.025 }
