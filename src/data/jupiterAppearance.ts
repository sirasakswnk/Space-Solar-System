// Regions in the inspected 2K image, not current atmospheric coordinates.
export const jupiterMapSize = { width: 2048, height: 1024 }
export const jupiterMapRegions = { clouds: { x: 720, y: 430 }, storm: { x: 752, y: 627 } }
export const jupiterMapAnchor = (region: { x: number; y: number }) => ({
  yaw: Math.PI * 2 * region.x / jupiterMapSize.width - Math.PI / 2,
  pitch: Math.PI / 2 - Math.PI * region.y / jupiterMapSize.height,
  height: 0.1,
})
export const jupiterOutlines = {
  clouds: { horizontal: 0.24, vertical: 0.075 },
  storm: { horizontal: 0.17, vertical: 0.09 },
  widthAngle: 0.003, radiusOffset: 0.04, segments: 96,
}

// Thin ellipses projected onto the sphere; longitude/latitude tangent axes keep
// the long side aligned with the image's east–west cloud patterns.
export function jupiterSelectionBand(region: { x: number; y: number }, radius: number,
  shape: { horizontal: number; vertical: number }) {
  const { yaw, pitch } = jupiterMapAnchor(region)
  const normal = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)]
  const east = [Math.cos(yaw), 0, -Math.sin(yaw)]
  const north = [-Math.sin(yaw) * Math.sin(pitch), Math.cos(pitch), -Math.cos(yaw) * Math.sin(pitch)]
  const positions: number[] = [], indices: number[] = []
  for (let i = 0; i <= jupiterOutlines.segments; i++) {
    const theta = i * Math.PI * 2 / jupiterOutlines.segments
    for (const edge of [0, jupiterOutlines.widthAngle]) {
      const x = Math.sin(shape.horizontal + edge) * Math.cos(theta)
      const z = Math.sin(shape.vertical + edge) * Math.sin(theta)
      const y = Math.sqrt(1 - x * x - z * z)
      for (let axis = 0; axis < 3; axis++) positions.push(radius * (normal[axis] * y + east[axis] * x + north[axis] * z))
    }
    if (i < jupiterOutlines.segments) {
      const a = i * 2
      indices.push(a, a + 1, a + 3, a, a + 3, a + 2)
    }
  }
  return { positions: new Float32Array(positions), indices: new Uint16Array(indices) }
}
