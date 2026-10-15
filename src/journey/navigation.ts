import { mercury } from '../data/planets.ts'
import { planetStops } from './path.ts'
import { resetOrbit } from './explore.ts'
import type { ExploreState } from './explore.ts'

export type NavigationRequest = NonNullable<ExploreState['navigation']>
export function createNavigationRequest(id: string | null, maxScroll: number, focus: HTMLElement | null): NavigationRequest | null {
  const stop = id === null ? null : planetStops.find(stop => stop.planet.id === id)
  if ((id !== null && !stop) || !Number.isFinite(maxScroll) || maxScroll <= 0) return null
  const pixel = Math.round((stop?.stop ?? 0) * maxScroll)
  return { planet: stop?.planet ?? mercury, pixel, progress: pixel / maxScroll, replay: id === null, focus }
}
export function applyNavigation(model: ExploreState, progress: { current: number; target: number }, request: NavigationRequest) {
  model.planet = request.planet
  model.phase = 'travel'
  model.selectedHotspot = null
  model.axisVisible = false
  model.focus = null
  model.saved = null
  model.elapsed = 0
  model.cooldownUntil = 0
  model.navigation = null
  model.returnFocus = request.focus
  resetOrbit(model.orbit, request.planet)
  progress.target = request.progress
  // A destination settles through the single travel rig; replay resets to pad.
  if (request.replay) {
    progress.current = 0
    model.replayCount++
    model.fromPosition.set(0, 0, 0)
    model.fromQuaternion.identity()
  }
}
