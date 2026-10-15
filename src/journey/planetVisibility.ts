import { planetStops, launchProgress } from './path.ts'
import { smoothRange, spaceBlend } from './launch.ts'

// Keep the destination fully visible throughout its exploration window. Between
// windows, leave a short stretch of open space rather than show distant planets
// behind the HUD. The same progress always produces the same fade on return.
const windows = planetStops.map(({ planet, start, end }, index) => ({
  id: planet.id, start, end,
  appear: index === 0 ? start * 0.5 : (planetStops[index - 1].end + start) / 2,
  disappear: planetStops[index + 1] ? (end + planetStops[index + 1].start) / 2 : null,
}))

export function planetVisibility(id: string, progress: number, exploredPlanet: string | null = null) {
  if (exploredPlanet !== null) return exploredPlanet === id ? 1 : 0
  const window = windows.find(window => window.id === id)
  if (!window) return 0
  const approach = smoothRange(progress, window.appear, window.start)
  const departure = window.disappear === null ? 1 : 1 - smoothRange(progress, window.end, window.disappear)
  // Restore every destination once the overview camera has pulled back, before
  // its labels appear at 99%. Earth retains its existing launch presentation.
  const overview = smoothRange(progress, 0.97, 0.99)
  return Math.max(approach * departure, overview) * spaceBlend(launchProgress(progress))
}
