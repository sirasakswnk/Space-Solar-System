// A representative bright atmospheric band in the image, not a named/live storm.
export const neptuneMapSize = { width: 2048, height: 1024 }
export const neptuneAtmosphereRegion = { x: 500, y: 345 }
export const neptuneAtmosphereAnchor = {
  yaw: Math.PI * 2 * neptuneAtmosphereRegion.x / neptuneMapSize.width - Math.PI / 2,
  pitch: Math.PI / 2 - Math.PI * neptuneAtmosphereRegion.y / neptuneMapSize.height,
  height: 0.08,
}
export const neptuneAtmosphereOutline = { startAngle: 0.18, widthAngle: 0.004, radiusOffset: 0.025 }
