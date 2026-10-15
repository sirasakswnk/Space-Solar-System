import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, FogExp2, Group, MeshStandardMaterial, SpriteMaterial } from 'three'
import { smokeStrength, spaceBlend, umbilicalExtension } from '../journey/launch'
import { launchStyle } from './launchStyle'
import { createCloudTexture } from './cloudTexture'

export default function LaunchScene({ progress }: { progress: RefObject<{ current: number }> }) {
  const clouds = useRef<Group>(null)
  const smoke = useRef<Group>(null)
  const arm = useRef<Group>(null)
  const environment = useMemo(() => {
    const mask = createCloudTexture()
    return {
    sky: new Color('#528bb4'), space: new Color('#080e1b'),
    fog: new FogExp2('#528bb4', 0.018),
    mask,
    cloudMaterial: new SpriteMaterial({ map: mask, color: '#ecf4fa', transparent: true, opacity: 0.38, depthWrite: false }),
    smokeMaterial: new SpriteMaterial({ map: mask, color: '#d4dfeb', transparent: true, opacity: 0, depthWrite: false }),
    frame: new MeshStandardMaterial(launchStyle.frame),
    hull: new MeshStandardMaterial(launchStyle.hull),
    trim: new MeshStandardMaterial(launchStyle.trim),
    }
  }, [])
  useEffect(() => () => {
    environment.cloudMaterial.dispose()
    environment.smokeMaterial.dispose()
    environment.mask.dispose()
    environment.frame.dispose(); environment.hull.dispose(); environment.trim.dispose()
  }, [environment])

  useFrame(({ scene }) => {
    const p = progress.current.current
    const blend = spaceBlend(p)
    if (arm.current) arm.current.scale.x = umbilicalExtension(p)
    if (scene.background instanceof Color) scene.background.copy(environment.sky).lerp(environment.space, blend)
    environment.fog.color.copy(environment.sky).lerp(environment.space, blend)
    environment.fog.density = 0.018 * (1 - blend)
    if (clouds.current) {
      clouds.current.visible = blend < 1
      environment.cloudMaterial.opacity = 0.38 * (1 - blend)
    }
    if (smoke.current) {
      const strength = smokeStrength(p)
      smoke.current.visible = strength > 0
      smoke.current.scale.setScalar(1 + p * 5)
      smoke.current.position.y = p * 1.5
      environment.smokeMaterial.opacity = strength * 0.35
    }
    if (import.meta.env.DEV) scene.userData.launchEffects = {
      sky: scene.background instanceof Color ? scene.background.getHexString() : '',
      cloudOpacity: environment.cloudMaterial.opacity,
      smokeOpacity: environment.smokeMaterial.opacity,
      smokeVisible: smoke.current?.visible,
      armExtension: arm.current?.scale.x,
    }
  }, -1)

  return (
    <>
      <primitive object={environment.fog} attach="fog" />
      <group name="launch-pad">
        <mesh position={[0, -0.075, 0]}>
          <cylinderGeometry args={[1.25, 1.5, 0.4, 48]} />
          <meshStandardMaterial color="#425766" metalness={0.6} roughness={0.5} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.126, 0]} material={environment.frame}>
          <ringGeometry args={[0.48, 1.13, 64]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.137, 0]}>
          <torusGeometry args={[1.04, 0.018, 6, 64]} />
          <meshStandardMaterial color={launchStyle.accent} emissive={launchStyle.accent} emissiveIntensity={1.2} />
        </mesh>
        {Array.from({ length: 8 }, (_, i) => {
          const angle = i * Math.PI / 4
          return <mesh key={i} position={[Math.sin(angle) * 1.17, 0.132, Math.cos(angle) * 1.17]}
            rotation={[0, angle, 0]} material={environment.hull}>
            <boxGeometry args={[0.075, 0.012, 0.12]} />
          </mesh>
        })}
        <mesh position={[-1.32, 0.02, -0.30]} material={environment.frame}>
          <boxGeometry args={[0.72, 0.22, 0.52]} />
        </mesh>
        <group position={[-1.35, 0.13, -0.30]} name="service-tower">
          {[-0.20, 0.20].map(x => <mesh key={x} position={[x, 0.86, 0]} material={environment.trim}>
            <boxGeometry args={[0.065, 1.72, 0.12]} />
          </mesh>)}
          {[0.12, 0.58, 1.04, 1.5].map(y => <mesh key={y} position={[0, y, 0]} material={environment.frame}>
            <boxGeometry args={[0.46, 0.065, 0.16]} />
          </mesh>)}
          {[0.35, 0.81, 1.27].map((y, i) => <mesh key={y} position={[0, y, 0]}
            rotation={[0, 0, (i % 2 ? -1 : 1) * 0.72]} material={environment.trim}>
            <boxGeometry args={[0.035, 0.60, 0.065]} />
          </mesh>)}
          <mesh position={[0, 1.75, 0]} material={environment.hull}>
            <boxGeometry args={[0.5, 0.10, 0.20]} />
          </mesh>
          <group ref={arm} position={[0, 0.90, 0]} name="service-arm">
            <mesh position={[0.57, 0, 0]} material={environment.trim}>
              <boxGeometry args={[1.14, 0.085, 0.10]} />
            </mesh>
            <mesh position={[1.11, 0, 0]} material={environment.frame}>
              <boxGeometry args={[0.06, 0.15, 0.17]} />
            </mesh>
          </group>
        </group>
      </group>
      <group ref={clouds} name="launch-clouds">
        {Array.from({ length: 10 }, (_, i) => (
          <sprite key={i} material={environment.cloudMaterial} position={[(i % 5 - 2) * 1.5, 3.6 + (i % 3) * 0.25, Math.floor(i / 5) * 2 - 1]}
            scale={[2.8, 1.35, 1]} />
        ))}
      </group>
      <group ref={smoke} name="launch-smoke" visible={false}>
        {Array.from({ length: 8 }, (_, i) => (
          <sprite key={i} material={environment.smokeMaterial} position={[Math.cos(i * Math.PI / 4) * 0.6, 0.15, Math.sin(i * Math.PI / 4) * 0.6]}
            scale={[1.0, 0.6, 1]} />
        ))}
      </group>
    </>
  )
}
