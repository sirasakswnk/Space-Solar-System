import { useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Quaternion, Vector3 } from 'three'
import type { Planet } from '../data/planets'
import { mercuryCraterOutline } from '../data/mercurySurface'
import { venusCloudOutline } from '../data/venusAppearance'
import { marsOutlines } from '../data/marsAppearance'
import { jupiterMapRegions, jupiterOutlines, jupiterSelectionBand } from '../data/jupiterAppearance'
import { saturnBodyOutline } from '../data/saturnAppearance'
import { uranusAtmosphereOutline } from '../data/uranusAppearance'
import { neptuneAtmosphereOutline } from '../data/neptuneAppearance'
import { planetVisibility } from '../journey/planetVisibility'
import type { ExploreState } from '../journey/explore'
import { orbitPosition } from '../journey/explore'
import SaturnRings from './SaturnRings'
import { worldSpin } from '../journey/spin'

export type HotspotButtons = RefObject<Record<string, HTMLButtonElement | null>>

export default function PlanetHotspots({ planet, model, buttons, progress }: {
  planet: Planet; model: ExploreState; buttons: HotspotButtons; progress: RefObject<{ current: number }>
}) {
  const features = useRef<Group>(null)
  const spinning = useRef<Group>(null)
  const points = useMemo(() => planet.hotspots.map(hotspot => {
    const normal = orbitPosition({ ...hotspot.anchor, distance: 1 }, new Vector3(), new Vector3())
    return { hotspot, normal,
      position: normal.clone().multiplyScalar(planet.scene.radius + hotspot.anchor.height).add(new Vector3(...planet.scene.center)),
      orientation: new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), normal),
      capOrientation: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), normal),
      featurePosition: normal.clone().multiplyScalar(planet.scene.radius + 0.015) }
  }), [planet])
  const scratch = useMemo(() => ({ projected: new Vector3(), toCamera: new Vector3(),
    towardPoint: new Vector3(), closest: new Vector3(), center: new Vector3(...planet.scene.center),
    spin: new Quaternion(), normal: new Vector3(), position: new Vector3(), origin: new Vector3() }), [planet])
  const jupiterBands = useMemo(() => planet.id === 'jupiter' ? (['clouds', 'storm'] as const).map(kind => ({
    kind, ...jupiterSelectionBand(jupiterMapRegions[kind], planet.scene.radius + jupiterOutlines.radiusOffset, jupiterOutlines[kind]),
  })) : [], [planet])
  useFrame(({ camera, size }) => {
    const active = model.phase === 'exploring' && model.planet.id === planet.id
    const opacity = planetVisibility(planet.id, progress.current.current, model.phase === 'travel' ? null : model.planet.id)
    if (features.current) features.current.visible = opacity > 0
    // Outlines and markers turn with the planet's spin so they stay on the image.
    worldSpin(planet, model.spin.time, scratch.spin)
    if (spinning.current) spinning.current.quaternion.copy(scratch.spin)
    camera.updateMatrixWorld()
    for (const { hotspot } of points) {
      const button = buttons.current[hotspot.id]
      if (!button) continue
      const normal = orbitPosition({ ...hotspot.anchor, distance: 1 }, scratch.origin, scratch.normal).applyQuaternion(scratch.spin)
      const position = scratch.position.copy(normal).multiplyScalar(planet.scene.radius + hotspot.anchor.height).add(scratch.center)
      scratch.toCamera.copy(camera.position).sub(position)
      scratch.projected.copy(position).project(camera)
      let unoccluded = normal.dot(scratch.toCamera) > 0
      if (hotspot.kind === 'rings') {
        // A ring marker is outside the sphere; test the camera-to-marker segment.
        scratch.towardPoint.copy(position).sub(camera.position)
        scratch.closest.copy(scratch.center).sub(camera.position)
        const t = Math.max(0, Math.min(1, scratch.closest.dot(scratch.towardPoint) / scratch.towardPoint.lengthSq()))
        scratch.closest.copy(camera.position).addScaledVector(scratch.towardPoint, t)
        unoccluded = scratch.closest.distanceToSquared(scratch.center) > planet.scene.radius ** 2
      }
      const visible = active && unoccluded
        && Math.abs(scratch.projected.x) < 0.95 && Math.abs(scratch.projected.y) < 0.95
        && scratch.projected.z > -1 && scratch.projected.z < 1
      button.hidden = !visible
      button.style.transform = `translate(-50%, -50%) translate(${(scratch.projected.x + 1) * size.width / 2}px, ${(1 - scratch.projected.y) * size.height / 2}px)`
    }
  }, -1)
  return (
    <group ref={features} position={planet.scene.center} visible={false}>
      {planet.axisTilt !== undefined && <group name="uranus-axis" visible={model.axisVisible}>
        <mesh>
          <cylinderGeometry args={[0.022, 0.022, planet.scene.radius * 3, 8]} />
          <meshBasicMaterial color="#778a9b" transparent opacity={0.6} />
        </mesh>
        <group rotation={[0, 0, planet.axisTilt]}>
          <mesh>
            <cylinderGeometry args={[0.045, 0.045, planet.scene.radius * 3, 8]} />
            <meshBasicMaterial color="#9de9ff" />
          </mesh>
          {[-1, 1].map(direction => <mesh key={direction}
            position={[0, direction * planet.scene.radius * 1.5, 0]} rotation={[direction < 0 ? Math.PI : 0, 0, 0]}>
            <coneGeometry args={[0.16, 0.5, 12]} />
            <meshBasicMaterial color="#9de9ff" />
          </mesh>)}
        </group>
      </group>}
      <group ref={spinning}>
      {points.filter(point => point.hotspot.kind === 'crater').map(({ hotspot, capOrientation }) => (
        <mesh key={hotspot.id} name="mercury-crater-highlight" quaternion={capOrientation}
          visible={model.selectedHotspot === hotspot.id}>
          <sphereGeometry args={[planet.scene.radius + mercuryCraterOutline.radiusOffset, 64, 2,
            0, Math.PI * 2, mercuryCraterOutline.startAngle, mercuryCraterOutline.widthAngle]} />
          <meshBasicMaterial color="#9de9ff" />
        </mesh>
      ))}
      {planet.id === 'mars' && points.filter(point => point.hotspot.kind === 'terrain' || point.hotspot.kind === 'polar')
        .map(({ hotspot, capOrientation }) => {
          const outline = hotspot.kind === 'polar' ? marsOutlines.polar : marsOutlines.terrain
          return <mesh key={hotspot.id} name={`${hotspot.id}-highlight`} quaternion={capOrientation}
            visible={model.selectedHotspot === hotspot.id}>
            <sphereGeometry args={[planet.scene.radius + marsOutlines.radiusOffset, 64, 2,
              0, Math.PI * 2, outline.startAngle, outline.widthAngle]} />
            <meshBasicMaterial color="#9de9ff" />
          </mesh>
        })}
      {planet.id === 'venus' && points.filter(point => point.hotspot.kind === 'clouds').map(({ hotspot, capOrientation }) => (
        <mesh key={hotspot.id} name="venus-cloud-highlight" quaternion={capOrientation}
          visible={model.selectedHotspot === hotspot.id}>
          <sphereGeometry args={[planet.scene.radius + venusCloudOutline.radiusOffset, 64, 2,
            0, Math.PI * 2, venusCloudOutline.startAngle, venusCloudOutline.widthAngle]} />
          <meshBasicMaterial color="#9de9ff" />
        </mesh>
      ))}
      {jupiterBands.map(({ kind, positions, indices }) => <mesh key={kind} name={`jupiter-${kind}-highlight`}
        visible={model.selectedHotspot === `jupiter-${kind}`}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="index" args={[indices, 1]} />
        </bufferGeometry>
        <meshBasicMaterial color="#9de9ff" />
      </mesh>)}
      {planet.rings && <SaturnRings tilt={planet.rings.tilt} model={model} progress={progress} />}
      {planet.id === 'saturn' && points.filter(point => point.hotspot.kind === 'body').map(({ hotspot, capOrientation }) => (
        <mesh key={hotspot.id} name="saturn-body-highlight" quaternion={capOrientation}
          visible={model.selectedHotspot === hotspot.id}>
          <sphereGeometry args={[planet.scene.radius + saturnBodyOutline.radiusOffset, 64, 2,
            0, Math.PI * 2, saturnBodyOutline.startAngle, saturnBodyOutline.widthAngle]} />
          <meshBasicMaterial color="#9de9ff" />
        </mesh>
      ))}
      {planet.id === 'uranus' && points.filter(point => point.hotspot.kind === 'clouds').map(({ hotspot, capOrientation }) => (
        <mesh key={hotspot.id} name="uranus-atmosphere-highlight" quaternion={capOrientation}
          visible={model.selectedHotspot === hotspot.id}>
          <sphereGeometry args={[planet.scene.radius + uranusAtmosphereOutline.radiusOffset, 64, 2,
            0, Math.PI * 2, uranusAtmosphereOutline.startAngle, uranusAtmosphereOutline.widthAngle]} />
          <meshBasicMaterial color="#9de9ff" />
        </mesh>
      ))}
      {planet.id === 'neptune' && points.filter(point => point.hotspot.kind === 'clouds').map(({ hotspot, capOrientation }) => (
        <mesh key={hotspot.id} name="neptune-atmosphere-highlight" quaternion={capOrientation}
          visible={model.selectedHotspot === hotspot.id}>
          <sphereGeometry args={[planet.scene.radius + neptuneAtmosphereOutline.radiusOffset, 64, 2,
            0, Math.PI * 2, neptuneAtmosphereOutline.startAngle, neptuneAtmosphereOutline.widthAngle]} />
          <meshBasicMaterial color="#9de9ff" />
        </mesh>
      ))}
      </group>
    </group>
  )
}
