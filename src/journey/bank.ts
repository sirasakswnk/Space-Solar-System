import { Vector3 } from 'three'
import { launchProgress, sampleJourney } from './path.ts'
import { smoothRange } from './launch.ts'

// A small roll into turns, derived only from progress so reverse retraces it.
// The heading rate eases down near each stop, so the ship is nearly level there.
export const maxBank = 0.2
const sampleStep = 0.002
const rateScale = 60
const point = new Vector3()
const before = new Vector3()
const after = new Vector3()

export function sampleBank(progress: number) {
  // Keep the finished launch sequence upright; banking begins after the climb.
  const enabled = smoothRange(launchProgress(progress), 0.45, 0.6)
  if (enabled === 0) return 0
  sampleJourney(progress - sampleStep, point, before)
  sampleJourney(progress + sampleStep, point, after)
  // Horizontal heading change; steep climbs carry little heading and fade out.
  const turn = before.x * after.z - before.z * after.x
  const level = before.x * after.x + before.z * after.z
  const weight = Math.hypot(before.x, before.z) * Math.hypot(after.x, after.z)
  if (weight < 1e-6) return 0
  const rate = Math.atan2(-turn, level) / (2 * sampleStep)
  // A left turn (heading toward -x from -z) rolls the top of the ship left.
  return -maxBank * Math.tanh(rate / rateScale) * Math.min(1, weight) * enabled
}
