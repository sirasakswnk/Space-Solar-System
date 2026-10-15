import { Vector3 } from 'three'

export function smoothRange(progress: number, start: number, end: number) {
  const t = Math.max(0, Math.min(1, (progress - start) / (end - start)))
  return t * t * (3 - 2 * t)
}

export function travelParameter(progress: number) {
  return progress <= 0.45
    ? smoothRange(progress, 0.1, 0.45) * 0.5
    : 0.5 + smoothRange(progress, 0.45, 1) * 0.5
}

export function engineStrength(progress: number) {
  return smoothRange(progress, 0.04, 0.1) * (1 - 0.75 * smoothRange(progress, 0.45, 0.6))
}

export function exhaustStrength(progress: number) {
  return smoothRange(progress, 0.04, 0.1) * (1 - smoothRange(progress, 0.45, 0.6))
}

export function smokeStrength(progress: number) {
  return smoothRange(progress, 0.04, 0.12) * (1 - smoothRange(progress, 0.16, 0.32))
}

export function spaceBlend(progress: number) {
  return smoothRange(progress, 0.2, 0.45)
}

// The service arm retracts before lift-off and extends again on reverse.
export function umbilicalExtension(progress: number) {
  return 1 - 0.75 * smoothRange(progress, 0.04, 0.1)
}

const sideOffset = new Vector3(5, 2.4, 3)
const followOffset = new Vector3(3, 3, 7)
const wideOffset = new Vector3(9, 6, -7)
const earthLookAt = new Vector3(0, -1, 0)

// Pure progress sampling: a single rig applies this pose in either direction.
export function sampleCamera(progress: number, ship: Vector3, tangent: Vector3,
  position: Vector3, lookAt: Vector3) {
  const following = smoothRange(progress, 0.1, 0.27)
  const wide = smoothRange(progress, 0.27, 0.45) * (1 - smoothRange(progress, 0.45, 0.65))
  position.copy(sideOffset).lerp(followOffset, following).lerp(wideOffset, wide).add(ship)
  const lead = 0.7 + following * 2.3 * (1 - Math.abs(tangent.y))
  lookAt.copy(ship).addScaledVector(tangent, lead).lerp(earthLookAt, wide * 0.45)
}
