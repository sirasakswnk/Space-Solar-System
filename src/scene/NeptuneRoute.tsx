import { useMemo } from 'react'
import { neptune } from '../data/planets'
import type { ExploreState } from '../journey/explore'
import { createRouteComparison } from '../journey/routeComparison'

export default function NeptuneRoute({ model }: { model: ExploreState }) {
  const route = useMemo(createRouteComparison, [])
  const visible = model.phase === 'exploring' && model.planet.id === neptune.id && model.selectedHotspot === 'neptune-route'
  return <group name="neptune-route-comparison" position={neptune.scene.center} visible={visible}>
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[route.positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#91c9dd" />
    </lineSegments>
    {route.stops.map(stop => <mesh key={stop.id} position={stop.position} name={`route-stop-${stop.id}`}>
      <sphereGeometry args={[stop.id === 'neptune' ? 0.28 : 0.2, 12, 8]} />
      <meshBasicMaterial color={stop.color} />
    </mesh>)}
  </group>
}
