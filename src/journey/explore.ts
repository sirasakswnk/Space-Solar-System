import { Quaternion, Vector3 } from 'three'
import { mercury } from '../data/planets.ts'
import type { Hotspot, Planet } from '../data/planets.ts'

export type ExplorePhase = 'travel' | 'entering' | 'exploring' | 'exiting'
export type Orbit = { yaw: number; pitch: number; distance: number }
export function resetOrbit(orbit: Orbit, planet: Planet = mercury) {
  const { yaw, pitch, distance } = planet.orbit
  Object.assign(orbit, { yaw, pitch, distance })
}
export function rotateOrbit(orbit: Orbit, yaw: number, pitch: number) {
  orbit.yaw = (orbit.yaw + yaw) % (Math.PI * 2)
  orbit.pitch = Math.max(-1.1, Math.min(1.1, orbit.pitch + pitch))
}
export function zoomOrbit(orbit: Orbit, delta: number, planet: Planet = mercury) {
  orbit.distance = Math.max(planet.orbit.min, Math.min(planet.orbit.max, orbit.distance * Math.exp(delta * 0.0015)))
}
export function hotspotOrbit(planet: Planet, hotspot: Hotspot): Orbit {
  const view = hotspot.view ?? hotspot.anchor
  return { yaw: view.yaw, pitch: Math.max(-1.1, Math.min(1.1, view.pitch)),
    distance: Math.max(planet.orbit.min, Math.min(planet.orbit.max, hotspot.focusDistance)) }
}
export function sampleFocusOrbit(from: Orbit, to: Orbit, t: number, out: Orbit) {
  const ease = t * t * (3 - 2 * t)
  const angle = Math.atan2(Math.sin(to.yaw - from.yaw), Math.cos(to.yaw - from.yaw))
  out.yaw = from.yaw + angle * ease
  out.pitch = from.pitch + (to.pitch - from.pitch) * ease
  out.distance = from.distance + (to.distance - from.distance) * ease
  if (t >= 1) Object.assign(out, to)
}
export function orbitPosition(orbit: Orbit, center: Vector3, out: Vector3) {
  return out.set(
    Math.sin(orbit.yaw) * Math.cos(orbit.pitch), Math.sin(orbit.pitch),
    Math.cos(orbit.yaw) * Math.cos(orbit.pitch),
  ).multiplyScalar(orbit.distance).add(center)
}
const transitionFrom = new Vector3()
const transitionTo = new Vector3()
const transitionRotation = new Quaternion()
const partialRotation = new Quaternion()
// Travel around the planet, rather than cutting through it from the far side.
export function transitionPosition(from: Vector3, to: Vector3, center: Vector3, t: number, out: Vector3) {
  if (t <= 0) return out.copy(from)
  if (t >= 1) return out.copy(to)
  transitionFrom.copy(from).sub(center)
  transitionTo.copy(to).sub(center)
  const fromRadius = transitionFrom.length()
  const toRadius = transitionTo.length()
  transitionFrom.normalize()
  transitionTo.normalize()
  transitionRotation.setFromUnitVectors(transitionFrom, transitionTo)
  partialRotation.identity().slerp(transitionRotation, t)
  return out.copy(transitionFrom).applyQuaternion(partialRotation)
    .multiplyScalar(fromRadius + (toRadius - fromRadius) * t).add(center)
}
export function createExploreState() {
  return {
    planet: mercury,
    phase: 'travel' as ExplorePhase,
    orbit: { yaw: 0.55, pitch: 0.2, distance: 8 },
    elapsed: 0, cooldownUntil: 0,
    selectedHotspot: null as string | null,
    axisVisible: false,
    replayCount: 0,
    returnFocus: null as HTMLElement | null,
    navigation: null as null | {
      planet: Planet; pixel: number; progress: number; replay: boolean; focus: HTMLElement | null;
    },
    focus: null as null | { from: Orbit; to: Orbit; elapsed: number },
    latestPosition: new Vector3(), latestQuaternion: new Quaternion(),
    fromPosition: new Vector3(), fromQuaternion: new Quaternion(),
    saved: null as null | {
      current: number; target: number; scrollY: number; opener: HTMLElement | null;
      position: Vector3; quaternion: Quaternion;
    },
  }
}
export type ExploreState = ReturnType<typeof createExploreState>
