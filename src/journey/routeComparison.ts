import { Vector3 } from 'three'
import { journeyPlanets } from '../data/planets.ts'
import { earthCenter, flightEnd, sampleJourney } from './path.ts'

// A miniature of this site's story route beside Neptune, not a physical orbit.
export function comparisonPoint(world: Vector3, out: Vector3) {
  return out.set(-8 + world.x * 0.05, 6 + world.z * 0.03, (world.y - 10) * 0.05)
}
export function createRouteComparison() {
  const positions = new Float32Array(240 * 6)
  const ship = new Vector3(), tangent = new Vector3(), point = new Vector3()
  for (let i = 0; i < 240; i++) {
    for (let end = 0; end < 2; end++) {
      sampleJourney((i + end) / 240 * flightEnd, ship, tangent)
      comparisonPoint(ship, point).toArray(positions, i * 6 + end * 3)
    }
  }
  const stops = [{ id: 'earth', name: 'Earth', center: earthCenter, color: '#4a9fd7' },
    ...journeyPlanets.map(planet => ({ id: planet.id, name: planet.name,
      center: new Vector3(...planet.scene.center), color: planet.scene.color }))]
  return { positions, stops: stops.map(stop => ({ ...stop,
    position: comparisonPoint(stop.center, new Vector3()) })) }
}
