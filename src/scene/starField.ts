// Deterministic background stars on a sphere around the camera, so every part of
// the route and the overview has stars in every viewing direction.
export const starFieldRadius = 800

export function createStarField(count = 1200, radius = starFieldRadius) {
  const positions = new Float32Array(count * 3)
  const fraction = (i: number) => {
    const random = Math.sin(i * 127.1 + 17) * 43758.5453
    return random - Math.floor(random)
  }
  for (let i = 0; i < count; i++) {
    // Uniform direction: z from [-1, 1] and an angle around it.
    const z = fraction(i * 2) * 2 - 1
    const angle = fraction(i * 2 + 1) * Math.PI * 2
    const ring = Math.sqrt(1 - z * z)
    positions[i * 3] = Math.cos(angle) * ring * radius
    positions[i * 3 + 1] = Math.sin(angle) * ring * radius
    positions[i * 3 + 2] = z * radius
  }
  return positions
}
