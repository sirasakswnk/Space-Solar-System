import { CatmullRomCurve3, CubicBezierCurve3, CurvePath, Vector3 } from 'three'
import { mercury, venus, mars, jupiter, saturn, uranus, neptune } from '../data/planets.ts'
import { sampleCamera, smoothRange, travelParameter } from './launch.ts'

export const earthCenter = new Vector3(0, -4, 0)
export const earthRadius = 4
export const mercuryCenter = new Vector3(...mercury.scene.center)
export const mercuryRadius = mercury.scene.radius

export const journeyScrollLength = 24000
export const flightEnd = 0.94
export const mercuryStop = 0.189 * flightEnd
export const venusStop = 0.3066 * flightEnd
export const marsStop = 0.42 * flightEnd
export const jupiterStop = 0.56 * flightEnd
export const saturnStop = 0.7 * flightEnd
export const uranusStop = 0.85 * flightEnd
export const overviewPosition = new Vector3(260, 350, -260)
export const overviewTarget = new Vector3(0, 10, -260)
export function overviewBlend(progress: number) { return smoothRange(progress, flightEnd, 1) }
export const planetStops = [
  { planet: mercury, start: 0.1617 * flightEnd, end: 0.2016 * flightEnd, stop: mercuryStop },
  { planet: venus, start: 0.2856 * flightEnd, end: 0.3192 * flightEnd, stop: venusStop },
  { planet: mars, start: 0.3948 * flightEnd, end: 0.434 * flightEnd, stop: marsStop },
  { planet: jupiter, start: 0.5355 * flightEnd, end: 0.574 * flightEnd, stop: jupiterStop },
  { planet: saturn, start: 0.6755 * flightEnd, end: 0.715 * flightEnd, stop: saturnStop },
  { planet: uranus, start: 0.82 * flightEnd, end: 0.865 * flightEnd, stop: uranusStop },
  { planet: neptune, start: 0.965 * flightEnd, end: flightEnd, stop: 0.93 },
] as const
export function getExplorePlanet(progress: number) {
  return planetStops.find(({ start, end }) => progress >= start && progress <= end)?.planet ?? null
}
// Reuse the original launch timing within the Earth-to-Mercury leg.
export function launchProgress(progress: number) { return clampProgress(progress / mercuryStop) }

// A compact story path, not a physical orbit or a real scale model.
export const shipPath = new CatmullRomCurve3([
  new Vector3(0, 0.65, 0),
  new Vector3(0, 3, 0),
  new Vector3(3, 7, -10),
  new Vector3(6, 8, -24),
  new Vector3(3, 9, -43),
], false, 'centripetal')

const venusLeg = new CurvePath<Vector3>()
venusLeg.add(new CubicBezierCurve3(
  new Vector3(3, 9, -43), new Vector3(1.2, 9.6, -54.4),
  new Vector3(10, 11, -50), new Vector3(10, 11, -60),
))
venusLeg.add(new CubicBezierCurve3(
  new Vector3(10, 11, -60), new Vector3(10, 11, -72),
  new Vector3(-15, 10, -66), new Vector3(-15, 10, -78),
))
const marsLeg = new CurvePath<Vector3>()
marsLeg.add(new CubicBezierCurve3(
  new Vector3(-15, 10, -78), new Vector3(-15, 10, -81),
  new Vector3(-9, 12, -83), new Vector3(-9, 12, -94),
))
const tangentBehind = new Vector3()
marsLeg.add(new CubicBezierCurve3(
  new Vector3(-9, 12, -94), new Vector3(-9, 12, -105),
  new Vector3(21, 11, -107), new Vector3(21, 11, -119),
))
const jupiterLeg = new CurvePath<Vector3>()
jupiterLeg.add(new CubicBezierCurve3(
  new Vector3(21, 11, -119), new Vector3(21, 11, -122),
  new Vector3(28, 13, -126), new Vector3(28, 13, -141),
))
jupiterLeg.add(new CubicBezierCurve3(
  new Vector3(28, 13, -141), new Vector3(28, 13, -156),
  new Vector3(-15, 12, -154), new Vector3(-15, 12, -170),
))
const saturnLeg = new CurvePath<Vector3>()
saturnLeg.add(new CubicBezierCurve3(
  new Vector3(-15, 12, -170), new Vector3(-15, 12, -174),
  new Vector3(1, 14, -176), new Vector3(1, 14, -201),
))
saturnLeg.add(new CubicBezierCurve3(
  new Vector3(1, 14, -201), new Vector3(1, 14, -213),
  new Vector3(25, 12, -214), new Vector3(25, 12, -230),
))
const uranusLeg = new CurvePath<Vector3>()
uranusLeg.add(new CubicBezierCurve3(
  new Vector3(25, 12, -230), new Vector3(25, 12, -234),
  new Vector3(40, 16, -241), new Vector3(40, 16, -260),
))
uranusLeg.add(new CubicBezierCurve3(
  new Vector3(40, 16, -260), new Vector3(40, 16, -276),
  new Vector3(-15, 14, -280), new Vector3(-15, 14, -298),
))
const neptuneLeg = new CurvePath<Vector3>()
neptuneLeg.add(new CubicBezierCurve3(
  new Vector3(-15, 14, -298), new Vector3(-15, 14, -302),
  new Vector3(-7, 16, -308), new Vector3(-7, 16, -330),
))
neptuneLeg.add(new CubicBezierCurve3(
  new Vector3(-7, 16, -330), new Vector3(-7, 16, -346),
  new Vector3(21, 15, -351), new Vector3(21, 15, -370),
))
const legs = [
  { curve: venusLeg, start: mercuryStop, end: venusStop },
  { curve: marsLeg, start: venusStop, end: marsStop },
  { curve: jupiterLeg, start: marsStop, end: jupiterStop },
  { curve: saturnLeg, start: jupiterStop, end: saturnStop },
  { curve: uranusLeg, start: saturnStop, end: uranusStop },
  { curve: neptuneLeg, start: uranusStop, end: flightEnd },
]
const saturnCenter = new Vector3(...saturn.scene.center)
const ringViewOffset = new Vector3(4, 15, 11)
export function sampleJourney(progress: number, position: Vector3, tangent: Vector3) {
  const p = Math.min(flightEnd, clampProgress(progress))
  if (p <= mercuryStop) {
    const t = travelParameter(launchProgress(p))
    shipPath.getPoint(t, position)
    shipPath.getTangent(t, tangent)
  } else {
    const { curve: leg, start, end } = legs.find(leg => p <= leg.end)!
    const t = smoothRange(p, start, end)
    leg.getPoint(t, position)
    // A small shared sampling interval avoids endpoint heading bias from Curve's
    // default interval, and reuses vectors instead of allocating each frame.
    leg.getPoint(Math.min(1, t + 0.000001), tangent)
    leg.getPoint(Math.max(0, t - 0.000001), tangentBehind)
    tangent.sub(tangentBehind).normalize()
  }
}
export function sampleJourneyCamera(progress: number, ship: Vector3, tangent: Vector3,
  position: Vector3, lookAt: Vector3) {
  sampleCamera(launchProgress(progress), ship, tangent, position, lookAt)
  // Raise and widen the approach to reveal ring depth while keeping the ship
  // and Saturn together. This uses progress, so reverse retraces the same view.
  const ringView = smoothRange(progress, 0.63 * flightEnd, 0.6755 * flightEnd)
    * (1 - smoothRange(progress, 0.715 * flightEnd, 0.77 * flightEnd))
  position.addScaledVector(ringViewOffset, ringView)
  lookAt.lerp(saturnCenter, ringView * 0.4)
  const overview = overviewBlend(progress)
  position.lerp(overviewPosition, overview)
  lookAt.lerp(overviewTarget, overview)
}

export function clampProgress(value: number) {
  return Number.isNaN(value) ? 0 : Math.max(0, Math.min(1, value))
}

export function settleProgress(current: number, target: number, delta: number) {
  const next = current + (target - current) * (1 - Math.exp(-Math.min(delta, 0.05) * 14))
  return Math.abs(target - next) < 0.00001 ? target : next
}

export function journeyLabel(progress: number) {
  if (progress > flightEnd) return 'ภาพรวมการเดินทาง — Earth ถึง Neptune'
  const local = launchProgress(progress)
  if (local < 0.04) return 'Earth — ฐานปล่อย'
  if (local < 0.1) return 'จุดเครื่องยนต์'
  if (local < 0.27) return 'ยกตัวจาก Earth'
  if (local < 0.45) return 'ผ่านชั้นบรรยากาศ'
  const planet = getExplorePlanet(progress)
  if (planet) return `${planet.name} — ${planet.thaiName}`
  if (progress < mercuryStop) return 'เดินทางสู่ Mercury'
  if (progress < venusStop) return 'เดินทางสู่ Venus'
  if (progress < marsStop) return 'เดินทางสู่ Mars'
  if (progress < jupiterStop) return 'เดินทางสู่ Jupiter'
  if (progress < saturnStop) return 'เดินทางสู่ Saturn'
  if (progress < uranusStop) return 'เดินทางสู่ Uranus'
  return 'เดินทางสู่ Neptune'
}
