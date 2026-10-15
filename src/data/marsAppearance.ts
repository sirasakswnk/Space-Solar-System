// Representative regions in the inspected map; these are image coordinates, not live locations.
export const marsMapRegions = {
  terrain: { x: 620, y: 554 },
  polar: { x: 700, y: 20 },
}
export const marsMapSize = { width: 2048, height: 1024 }
export const marsMapAnchor = (region: { x: number; y: number }) => ({
  yaw: Math.PI * 2 * region.x / marsMapSize.width - Math.PI / 2,
  pitch: Math.PI / 2 - Math.PI * region.y / marsMapSize.height,
  height: 0.08,
})
export const marsOutlines = {
  terrain: { startAngle: 0.17, widthAngle: 0.004 },
  polar: { startAngle: 0.11, widthAngle: 0.004 },
  radiusOffset: 0.02,
}
