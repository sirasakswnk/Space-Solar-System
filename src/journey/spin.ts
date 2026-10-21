import { Quaternion, Vector3 } from 'three'
import type { Planet } from '../data/planets.ts'

// Slow presentation spin while travelling (radians per second). Relative
// speeds follow the real order (Jupiter fastest, Venus slowest and retrograde);
// Uranus's tilt above 90 degrees already makes its spin retrograde.
export const spinSpeeds: Record<string, number> = {
  mercury: 0.03, venus: -0.015, mars: 0.05, jupiter: 0.1, saturn: 0.09, uranus: 0.07, neptune: 0.065,
}
// Earth's cloud layer drifts slowly instead; the surface stays fixed under the pad.
export const earthCloudDrift = 0.004

const tilt = new Quaternion()
const turn = new Quaternion()
const zAxis = new Vector3(0, 0, 1)
const yAxis = new Vector3(0, 1, 0)

// Orientation of the planet mesh: axial tilt, then spin about the tilted axis.
export function meshSpin(planet: Planet, time: number, out: Quaternion) {
  tilt.setFromAxisAngle(zAxis, planet.axisTilt ?? 0)
  return out.copy(tilt).multiply(turn.setFromAxisAngle(yAxis, (spinSpeeds[planet.id] ?? 0) * time))
}

// The same spin applied to world-frame hotspot directions (defined at time 0).
export function worldSpin(planet: Planet, time: number, out: Quaternion) {
  tilt.setFromAxisAngle(zAxis, planet.axisTilt ?? 0)
  return out.copy(tilt).multiply(turn.setFromAxisAngle(yAxis, (spinSpeeds[planet.id] ?? 0) * time))
    .multiply(tilt.invert())
}
