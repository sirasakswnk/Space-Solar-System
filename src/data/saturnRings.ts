import { DataTexture, LinearFilter, LinearMipmapLinearFilter, RGBAFormat, RingGeometry, SRGBColorSpace } from 'three'

export const saturnRingBands = [
  { inner: 6.5, outer: 7.3, color: '#aa9d85', opacity: 0.45 },
  { inner: 7.3, outer: 9.35, color: '#dfceb0', opacity: 0.86 },
  { inner: 9.75, outer: 11.5, color: '#c7b793', opacity: 0.7 },
] as const

const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}

// Illustrative radial grain, not measured density or a photograph of the rings.
// A small 1D RGBA map gives fine bands without adding meshes or image requests.
export function createSaturnRingResources(inner: number, outer: number) {
  const width = 1024, pixels = new Uint8Array(width * 4)
  for (let i = 0; i < width; i++) {
    const radius = inner + (outer - inner) * i / (width - 1)
    const grain = (Math.sin(radius * 38) + 0.55 * Math.sin(radius * 61 + 0.4)
      + 0.25 * Math.sin(radius * 109 + 0.8)) / 1.8
    const broad = Math.sin(radius * 12 + 0.5)
    const light = 0.82 + grain * 0.13 + broad * 0.05
    const edge = smooth((radius - inner) / 0.025) * smooth((outer - radius) / 0.025)
    const alpha = (0.81 + grain * 0.12 + broad * 0.04) * edge
    pixels.set([Math.round(light * 255), Math.round(light * 255), Math.round(light * 255), Math.round(alpha * 255)], i * 4)
  }
  const texture = new DataTexture(pixels, width, 1, RGBAFormat)
  texture.name = `saturn-ring-grain-${inner}`
  texture.colorSpace = SRGBColorSpace
  texture.minFilter = LinearMipmapLinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  const geometry = new RingGeometry(inner, outer, 96)
  const positions = geometry.getAttribute('position'), uv = geometry.getAttribute('uv')
  for (let i = 0; i < positions.count; i++) {
    const radius = Math.hypot(positions.getX(i), positions.getY(i))
    // RingGeometry's default planar UVs would make a straight strip, not circles.
    uv.setXY(i, Math.max(0, Math.min(1, (radius - inner) / (outer - inner))), 0.5)
  }
  return { texture, geometry }
}
