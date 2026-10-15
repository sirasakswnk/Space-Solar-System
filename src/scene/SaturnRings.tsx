import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { DoubleSide } from 'three'
import type { MeshStandardMaterial } from 'three'
import { createSaturnRingResources, saturnRingBands } from '../data/saturnRings'
import type { ExploreState } from '../journey/explore'
import { planetVisibility } from '../journey/planetVisibility'

export default function SaturnRings({ tilt, model, progress }: {
  tilt: number; model: ExploreState; progress: RefObject<{ current: number }>
}) {
  const materials = useRef<(MeshStandardMaterial | null)[]>([])
  const resources = useMemo(() => saturnRingBands.map(band => createSaturnRingResources(band.inner, band.outer)), [])
  useEffect(() => () => resources.forEach(({ geometry, texture }) => {
    geometry.dispose(); texture.dispose()
  }), [resources])
  useFrame(() => {
    const opacity = planetVisibility('saturn', progress.current.current, model.phase === 'travel' ? null : model.planet.id)
    materials.current.forEach((material, index) => {
      if (material) material.opacity = saturnRingBands[index].opacity * opacity
    })
  }, -1)
  return <group rotation={[0, 0, tilt]} name="saturn-rings">
    {saturnRingBands.map((band, index) => <mesh key={band.inner} rotation={[-Math.PI / 2, 0, 0]}
      geometry={resources[index].geometry}>
      <meshStandardMaterial ref={material => { materials.current[index] = material }}
        map={resources[index].texture} color={band.color} side={DoubleSide} roughness={1}
        transparent opacity={band.opacity} depthWrite={false} emissive="#4c839b"
        emissiveIntensity={model.selectedHotspot === 'saturn-rings' ? 0.3 : 0} />
    </mesh>)}
  </group>
}
