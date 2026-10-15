import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { ExtrudeGeometry, Mesh, MeshStandardMaterial, Shape, Vector3 } from 'three'
import type { Group } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { engineStrength, exhaustStrength } from '../journey/launch'
import { launchStyle } from './launchStyle'

export default function Ship({ shipRef, progress }: {
  shipRef: RefObject<Group | null>; progress: RefObject<{ current: number }>
}) {
  const scene = useThree(state => state.scene)
  const nozzle = useRef<MeshStandardMaterial>(null)
  const engineRing = useRef<MeshStandardMaterial>(null)
  const exhaust = useRef<Group>(null)
  const body = useRef<Group>(null)
  const model = useMemo(() => {
    const shape = new Shape()
    shape.moveTo(0.31, -0.64); shape.lineTo(0.86, -0.61)
    shape.lineTo(0.86, -0.42); shape.lineTo(0.36, 0.12); shape.closePath()
    return {
      fin: new ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false }),
      hull: new MeshStandardMaterial(launchStyle.hull),
      frame: new MeshStandardMaterial(launchStyle.frame),
      trim: new MeshStandardMaterial(launchStyle.trim),
    }
  }, [])
  useEffect(() => () => {
    model.fin.dispose(); model.hull.dispose(); model.frame.dispose(); model.trim.dispose()
  }, [model])
  useLayoutEffect(() => {
    // Measure actual rigid geometry once; exhaust is a visual effect, not the hull.
    if (!import.meta.env.DEV || !shipRef.current || !body.current) return
    shipRef.current.updateWorldMatrix(true, true)
    const origin = shipRef.current.getWorldPosition(new Vector3()), point = new Vector3()
    let radius = 0, parts = 0
    body.current.traverse(object => {
      if (!(object instanceof Mesh)) return
      parts++
      const vertices = object.geometry.attributes.position
      for (let i = 0; i < vertices.count; i++) {
        point.fromBufferAttribute(vertices, i).applyMatrix4(object.matrixWorld).sub(origin)
        radius = Math.max(radius, point.length())
      }
    })
    scene.userData.shipAppearance = { radius, parts }
  }, [scene, shipRef, model])
  useFrame(() => {
    const engine = engineStrength(progress.current.current)
    const plume = exhaustStrength(progress.current.current)
    if (nozzle.current) nozzle.current.emissiveIntensity = engine * 3
    if (engineRing.current) engineRing.current.emissiveIntensity = engine * 4
    if (exhaust.current) {
      exhaust.current.visible = plume > 0
      exhaust.current.scale.set(1, 0.3 + plume * 1.1, 1)
    }
    if (import.meta.env.DEV) scene.userData.engineEffects = {
      engine, plume, exhaustVisible: exhaust.current?.visible,
    }
  }, -1)
  return <group ref={shipRef} name="ship" scale={0.55}>
    <group ref={body} name="ship-body">
      <mesh material={model.hull} name="ship-hull">
        <cylinderGeometry args={[0.32, 0.42, 1.5, 24]} />
      </mesh>
      <mesh position={[0, 0.995, 0]} material={model.hull}>
        <cylinderGeometry args={[0.045, 0.32, 0.49, 24]} />
      </mesh>
      <mesh position={[0, 0.44, 0.30]} scale={[0.21, 0.23, 0.085]} name="ship-canopy">
        <sphereGeometry args={[1, 20, 12]} />
        <meshStandardMaterial color="#102c43" metalness={0.55} roughness={0.18}
          emissive="#175675" emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[0, 0.30, 0]} rotation={[Math.PI / 2, 0, 0]} material={model.trim}>
        <torusGeometry args={[0.35, 0.018, 6, 32]} />
      </mesh>
      <mesh position={[0, -0.6, 0]} rotation={[Math.PI / 2, 0, 0]} material={model.frame}>
        <torusGeometry args={[0.41, 0.025, 6, 32]} />
      </mesh>
      {[-1, 1].map(side => <group key={side}>
        <mesh geometry={model.fin} material={model.trim} position={[0, 0, -0.05]} scale={[side, 1, 1]} />
        <mesh position={[side * 0.66, -0.18, 0]} material={model.hull}>
          <cylinderGeometry args={[0.12, 0.14, 0.78, 16]} />
        </mesh>
        <mesh position={[side * 0.66, 0.30, 0]} material={model.trim}>
          <coneGeometry args={[0.12, 0.18, 16]} />
        </mesh>
        <mesh position={[side * 0.66, -0.62, 0]} material={model.frame}>
          <cylinderGeometry args={[0.13, 0.10, 0.10, 16]} />
        </mesh>
        <mesh position={[side * 0.66, -0.18, 0.135]}>
          <boxGeometry args={[0.045, 0.36, 0.018]} />
          <meshStandardMaterial color={launchStyle.accent} emissive={launchStyle.accent} emissiveIntensity={0.4} />
        </mesh>
      </group>)}
      <mesh position={[0, -0.84, 0]} material={model.frame}>
        <cylinderGeometry args={[0.29, 0.25, 0.18, 24]} />
      </mesh>
      <mesh position={[0, -0.925, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.20, 0.025, 8, 24]} />
        <meshStandardMaterial ref={engineRing} color="#509bb8" emissive={launchStyle.accent} emissiveIntensity={0} />
      </mesh>
      <mesh position={[0, -0.92, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.025, 24]} />
        <meshStandardMaterial ref={nozzle} color="#15384b" emissive="#269bff" emissiveIntensity={0} />
      </mesh>
    </group>
    <group ref={exhaust} position={[0, -0.95, 0]} visible={false} name="engine-exhaust">
      <mesh position={[0, -0.65, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.24, 1.3, 16]} />
        <meshBasicMaterial color="#52b9ee" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.42, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.12, 0.84, 12]} />
        <meshBasicMaterial color="#d1f5ff" transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </group>
  </group>
}
