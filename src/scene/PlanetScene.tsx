import { useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import type { Planet } from '../data/planets'
import type { ExploreState } from '../journey/explore'
import { getExplorePlanet } from '../journey/path'
import { planetVisibility } from '../journey/planetVisibility'
import PlanetHotspots from './PlanetHotspots'
import { meshSpin } from '../journey/spin'
import MercurySurface from './MercurySurface'
import VenusClouds from './VenusClouds'
import MarsSurface from './MarsSurface'
import JupiterClouds from './JupiterClouds'
import SaturnClouds from './SaturnClouds'
import UranusClouds from './UranusClouds'
import NeptuneClouds from './NeptuneClouds'
import type { HotspotButtons } from './PlanetHotspots'
import type { AssetStatus } from '../journey/assetStatus'

export default function PlanetScene({ planet, model, progress, buttons, hoverRef, open, assets }: {
  assets: AssetStatus; planet: Planet; model: ExploreState; progress: RefObject<{ current: number; target: number }>
  buttons: HotspotButtons; hoverRef: RefObject<HTMLSpanElement | null>; open: (planet: Planet) => void
}) {
  const group = useRef<Group>(null)
  const material = useRef<MeshStandardMaterial>(null)
  const body = useRef<Mesh>(null)
  const available = () => model.phase === 'travel' && getExplorePlanet(progress.current.current)?.id === planet.id
  const hover = (event: ThreeEvent<PointerEvent>) => {
    if (!available()) return
    event.stopPropagation()
    if (hoverRef.current) {
      hoverRef.current.textContent = `${planet.name} — ${planet.thaiName}`
      hoverRef.current.hidden = false
    }
    if (material.current) material.current.emissiveIntensity = 0.2
    document.body.style.cursor = 'pointer'
  }
  useFrame(() => {
    if (body.current) meshSpin(planet, model.spin.time, body.current.quaternion)
    const opacity = planetVisibility(planet.id, progress.current.current, model.phase === 'travel' ? null : model.planet.id)
    if (group.current) group.current.visible = opacity > 0
    if (material.current) {
      material.current.opacity = opacity
      material.current.depthWrite = opacity === 1
      if (!available()) material.current.emissiveIntensity = 0
    }
  }, -1)
  return <group ref={group} name={`planet-${planet.id}`}
      onClick={event => { event.stopPropagation(); if (available()) open(planet) }}
      onPointerOver={hover} onPointerMove={hover} onPointerOut={() => {
        if (hoverRef.current) hoverRef.current.hidden = true
        if (material.current) material.current.emissiveIntensity = 0
        document.body.style.cursor = ''
      }}>
    {planet.id === 'venus' ? <VenusClouds planet={planet} material={material} model={model} progress={progress} assets={assets} />
      : <mesh ref={body} position={planet.scene.center}
        name={['jupiter', 'saturn', 'uranus', 'neptune'].includes(planet.id) ? `${planet.id}-cloud-shell`
        : ['mercury', 'mars'].includes(planet.id) ? `${planet.id}-surface` : undefined}>
      <sphereGeometry args={[planet.scene.radius, ['mars', 'jupiter', 'saturn', 'uranus', 'neptune'].includes(planet.id) ? 64 : 40,
        ['mars', 'jupiter', 'saturn', 'uranus', 'neptune'].includes(planet.id) ? 48 : 32]} />
      {planet.id === 'mercury' ? <MercurySurface material={material} assets={assets} />
        : planet.id === 'mars' ? <MarsSurface material={material} assets={assets} />
        : planet.id === 'jupiter' ? <JupiterClouds material={material} assets={assets} />
        : planet.id === 'saturn' ? <SaturnClouds material={material} assets={assets} />
        : planet.id === 'uranus' ? <UranusClouds material={material} assets={assets} />
        : planet.id === 'neptune' ? <NeptuneClouds material={material} assets={assets} />
        : <meshStandardMaterial ref={material} color={planet.scene.color} emissive="#4786a8"
          emissiveIntensity={0} roughness={1} transparent opacity={0} />}
    </mesh>}
    <PlanetHotspots planet={planet} model={model} buttons={buttons} progress={progress} />
  </group>
}
