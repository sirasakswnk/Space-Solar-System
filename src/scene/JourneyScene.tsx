import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Matrix4, Quaternion, Vector3 } from 'three'
import type { Points, PointsMaterial } from 'three'
import {
  launchProgress, getExplorePlanet,
  sampleJourney, sampleJourneyCamera, settleProgress, journeyLabel,
} from '../journey/path'
import Ship from './Ship'
import LaunchScene from './LaunchScene'
import EarthScene from './EarthScene'
import { spaceBlend } from '../journey/launch'
import { orbitPosition, sampleFocusOrbit, transitionPosition } from '../journey/explore'
import type { ExplorePhase, ExploreState } from '../journey/explore'
import PlanetScene from './PlanetScene'
import NeptuneRoute from './NeptuneRoute'
import OverviewScene from './OverviewScene'
import { journeyPlanets } from '../data/planets'
import type { Planet } from '../data/planets'
import type { HotspotButtons } from './PlanetHotspots'
import { createStarField } from './starField'
import { applyPointerLook, pointerTarget, settlePointerLook } from '../journey/pointerLook'
import { sampleBank } from '../journey/bank'

type JourneyProps = {
  progress: RefObject<{ target: number; current: number }>
  meterRef: RefObject<HTMLProgressElement | null>
  percentRef: RefObject<HTMLSpanElement | null>
  labelRef: RefObject<HTMLParagraphElement | null>
  exploreButtonRef: RefObject<HTMLButtonElement | null>
  hoverRef: RefObject<HTMLSpanElement | null>
  explore: ExploreState
  changePhase: (phase: ExplorePhase) => void
  openExplore: (planet: Planet) => void
  hotspotButtons: HotspotButtons
  overviewRef: RefObject<HTMLElement | null>
  mapRef: RefObject<HTMLDivElement | null>
  mapLabels: RefObject<Record<string, HTMLElement | null>>
}

export default function JourneyScene({ progress, meterRef, percentRef, labelRef,
  exploreButtonRef, hoverRef, explore, changePhase, openExplore, hotspotButtons, overviewRef, mapRef, mapLabels }: JourneyProps) {
  const ship = useRef<Group>(null)
  const starField = useRef<Points>(null)
  const starMaterial = useRef<PointsMaterial>(null)
  const launch = useRef({ current: 0 })
  const pointerLook = useMemo(() => ({ current: { x: 0, y: 0 }, target: { x: 0, y: 0 } }), [])
  useEffect(() => {
    const move = (event: PointerEvent) =>
      pointerTarget(event.clientX, event.clientY, window.innerWidth, window.innerHeight, pointerLook.target)
    const center = () => Object.assign(pointerLook.target, { x: 0, y: 0 })
    const leave = (event: PointerEvent) => { if (!event.relatedTarget) center() }
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerout', leave)
    window.addEventListener('blur', center)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerout', leave)
      window.removeEventListener('blur', center)
    }
  }, [pointerLook])
  const scratch = useMemo(() => ({
    position: new Vector3(), tangent: new Vector3(), up: new Vector3(0, 1, 0),
    cameraPosition: new Vector3(), lookAt: new Vector3(),
    rotationMatrix: new Matrix4(), orbitQuaternion: new Quaternion(), bankQuaternion: new Quaternion(),
    planetCenter: new Vector3(),
  }), [])
  const stars = useMemo(() => createStarField(), [])

  useFrame(({ camera, scene }, delta) => {
    const state = progress.current
    if (explore.phase === 'travel') state.current = settleProgress(state.current, state.target, delta)
    const availablePlanet = getExplorePlanet(state.current)
    launch.current.current = launchProgress(state.current)
    sampleJourney(state.current, scratch.position, scratch.tangent)
    if (ship.current) {
      ship.current.visible = explore.phase === 'travel'
      ship.current.position.copy(scratch.position)
      ship.current.quaternion.setFromUnitVectors(scratch.up, scratch.tangent)
        .premultiply(scratch.bankQuaternion.setFromAxisAngle(scratch.tangent, sampleBank(state.current)))
    }
    // Only this rig writes to the camera. Reverse uses the same sampled pose.
    if (explore.phase === 'travel') {
      sampleJourneyCamera(state.current, scratch.position, scratch.tangent, scratch.cameraPosition, scratch.lookAt)
      camera.position.copy(scratch.cameraPosition)
      camera.lookAt(scratch.lookAt)
      // The lean eases only while travelling, so exploration returns to the
      // exact saved pose and then follows the pointer again.
      settlePointerLook(pointerLook.current, pointerLook.target, delta)
      applyPointerLook(camera, pointerLook.current)
    } else {
      if (explore.phase === 'exploring' && explore.focus) {
        const focus = explore.focus
        focus.elapsed += Math.min(delta, 0.05)
        const t = Math.min(1, focus.elapsed / 0.45)
        sampleFocusOrbit(focus.from, focus.to, t, explore.orbit)
        if (t === 1) explore.focus = null
      }
      scratch.planetCenter.set(...explore.planet.scene.center)
      orbitPosition(explore.orbit, scratch.planetCenter, scratch.cameraPosition)
      scratch.rotationMatrix.lookAt(scratch.cameraPosition, scratch.planetCenter, camera.up)
      scratch.orbitQuaternion.setFromRotationMatrix(scratch.rotationMatrix)
      if (explore.phase === 'exploring') {
        camera.position.copy(scratch.cameraPosition)
        camera.quaternion.copy(scratch.orbitQuaternion)
      } else {
        explore.elapsed += Math.min(delta, 0.05)
        const t = Math.min(1, explore.elapsed / 0.45)
        const ease = t * t * (3 - 2 * t)
        const returning = explore.phase === 'exiting'
        const destination = returning ? explore.saved!.position : scratch.cameraPosition
        const rotation = returning ? explore.saved!.quaternion : scratch.orbitQuaternion
        transitionPosition(explore.fromPosition, destination, scratch.planetCenter, ease, camera.position)
        camera.quaternion.copy(explore.fromQuaternion).slerp(rotation, ease)
        if (t === 1) changePhase(returning ? 'travel' : 'exploring')
      }
    }
    explore.latestPosition.copy(camera.position)
    explore.latestQuaternion.copy(camera.quaternion)
    // Stars stay centred on the camera, as if infinitely far, along the whole route.
    if (starField.current) starField.current.position.copy(camera.position)
    if (starMaterial.current) starMaterial.current.opacity = spaceBlend(launch.current.current)
    if (hoverRef.current && (explore.phase !== 'travel' || !availablePlanet
      || hoverRef.current.textContent !== `${availablePlanet.name} — ${availablePlanet.thaiName}`)) {
      hoverRef.current.hidden = true
      document.body.style.cursor = ''
    }
    if (exploreButtonRef.current) {
      const planet = availablePlanet
      exploreButtonRef.current.hidden = !planet
      exploreButtonRef.current.disabled = state.current !== state.target || explore.phase !== 'travel'
      if (planet) exploreButtonRef.current.textContent = `สำรวจ ${planet.name}`
    }

    // DOM text/progress updates avoid React state updates in the frame loop.
    const percent = Math.round(state.current * 100)
    if (meterRef.current) meterRef.current.value = state.current * 100
    if (percentRef.current && percentRef.current.textContent !== `${percent}%`) {
      percentRef.current.textContent = `${percent}%`
    }
    if (labelRef.current) {
      const label = journeyLabel(state.current)
      const planet = availablePlanet
      const text = planet ? `${label} — ${planet.summary}` : label
      if (labelRef.current.textContent !== text) labelRef.current.textContent = text
    }
    if (import.meta.env.DEV) {
      scene.userData.journeyProgress = state
      scene.userData.exploreState = explore
      scene.userData.pointerLook = pointerLook
    }
  }, -2)

  return (
    <>
      <color attach="background" args={['#080e1b']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[8, 15, 6]} intensity={2.5} color="#ecf5ff" />
      <directionalLight position={[-10, 4, -30]} intensity={1.4} color="#6b9adf" />
      <Ship shipRef={ship} progress={launch} />
      <LaunchScene progress={launch} />
      <EarthScene progress={launch} />
      {journeyPlanets.map(planet => <PlanetScene key={planet.id} planet={planet} model={explore}
        progress={progress} buttons={hotspotButtons} hoverRef={hoverRef} open={openExplore} />)}
      <NeptuneRoute model={explore} />
      <OverviewScene progress={progress} model={explore} panel={overviewRef} labels={mapRef} elements={mapLabels} />
      <points ref={starField} name="star-field">
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[stars, 3]} />
        </bufferGeometry>
        <pointsMaterial ref={starMaterial} color="#becfe4" size={2} sizeAttenuation={false}
          transparent opacity={0} depthWrite={false} fog={false} />
      </points>
    </>
  )
}
