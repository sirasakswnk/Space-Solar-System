import { useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Vector3 } from 'three'
import type { LineBasicMaterial } from 'three'
import { earthCenter, flightEnd, overviewBlend, sampleJourney } from '../journey/path'
import { journeyPlanets } from '../data/planets'
import type { ExploreState } from '../journey/explore'

export default function OverviewScene({ progress, model, panel, labels, elements }: {
  progress: RefObject<{ current: number; target: number }>
  model: ExploreState
  panel: RefObject<HTMLElement | null>
  labels: RefObject<HTMLDivElement | null>
  elements: RefObject<Record<string, HTMLElement | null>>
}) {
  const group = useRef<Group>(null)
  const material = useRef<LineBasicMaterial>(null)
  const route = useMemo(() => {
    const points = new Float32Array(241 * 3), position = new Vector3(), tangent = new Vector3()
    for (let i = 0; i <= 240; i++) {
      sampleJourney(i / 240 * flightEnd, position, tangent)
      position.toArray(points, i * 3)
    }
    return points
  }, [])
  const stops = useMemo(() => [
    { id: 'earth', center: earthCenter.clone() },
    ...journeyPlanets.map(planet => ({ id: planet.id, center: new Vector3(...planet.scene.center) })),
  ], [])
  const projection = useMemo(() => new Vector3(), [])
  useFrame(({ camera, size, scene }) => {
    const blend = overviewBlend(progress.current.current)
    const visible = model.phase === 'travel' && progress.current.current >= 0.99
    if (group.current) group.current.visible = model.phase === 'travel' && blend > 0
    if (material.current) material.current.opacity = blend
    if (panel.current) panel.current.hidden = !visible
    if (labels.current) labels.current.hidden = !visible
    if (visible) {
      camera.updateMatrixWorld()
      stops.forEach(({ id, center }, index) => {
        const element = elements.current[id]
        if (!element) return
        projection.copy(center).project(camera)
        element.style.left = `${(projection.x * 0.5 + 0.5) * size.width}px`
        element.style.top = `${(-projection.y * 0.5 + 0.5) * size.height + (index % 2 ? 35 : -35)}px`
      })
    }
    if (import.meta.env.DEV) scene.userData.overview = { blend, visible }
  }, -1)
  return <group ref={group} name="journey-overview" visible={false}>
    <line>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[route, 3]} /></bufferGeometry>
      <lineBasicMaterial ref={material} color="#9de4ef" transparent opacity={0} depthWrite={false} />
    </line>
  </group>
}
