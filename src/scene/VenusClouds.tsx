import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, BackSide, Color, RepeatWrapping, SphereGeometry, SRGBColorSpace, TextureLoader } from 'three'
import type { MeshStandardMaterial, ShaderMaterial } from 'three'
import type { Planet } from '../data/planets'
import type { ExploreState } from '../journey/explore'
import { planetVisibility } from '../journey/planetVisibility'

const noRaycast = () => {}
const vertexShader = `varying vec3 worldNormal;
  varying vec3 worldPosition;
  void main() {
    worldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    worldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }`
const fragmentShader = `uniform vec3 tint;
  uniform float visibility;
  uniform float strength;
  varying vec3 worldNormal;
  varying vec3 worldPosition;
  void main() {
    vec3 view = normalize(cameraPosition - worldPosition);
    float facing = abs(dot(normalize(worldNormal), view));
    float rim = pow(1.0 - facing, 3.0) * smoothstep(0.0, 0.12, facing);
    gl_FragColor = vec4(tint, rim * strength * visibility);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`

export default function VenusClouds({ planet, material, model, progress }: {
  planet: Planet; material: RefObject<MeshStandardMaterial | null>; model: ExploreState;
  progress: RefObject<{ current: number }>
}) {
  const { gl, scene } = useThree()
  const rim = useRef<ShaderMaterial>(null)
  const geometry = useMemo(() => new SphereGeometry(planet.scene.radius, 48, 32), [planet.scene.radius])
  const status = useMemo(() => ({ texture: 'loading', width: 0, height: 0, cloudOpacity: 0, rimStrength: 0.18, rimVisibility: 0 }), [])
  const uniforms = useMemo(() => ({ tint: { value: new Color('#efd3a2') },
    visibility: { value: 0 }, strength: { value: 0.18 } }), [])
  useEffect(() => {
    let active = true
    const clouds = material.current
    if (!clouds) return
    status.texture = 'loading'; status.width = status.height = 0
    if (import.meta.env.DEV) scene.userData.venusAppearance = status
    const map = new TextureLoader().load('/assets/venus/atmosphere.jpg', texture => {
      if (!active) { texture.dispose(); return }
      texture.colorSpace = SRGBColorSpace
      texture.wrapS = RepeatWrapping
      texture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy())
      clouds.map = texture
      clouds.color.set('#eee8db')
      clouds.needsUpdate = true
      status.texture = 'loaded'
      status.width = texture.image.width; status.height = texture.image.height
    }, undefined, () => { if (active) status.texture = 'fallback' })
    return () => {
      active = false
      map.dispose(); clouds.map = null
      clouds.color.set(planet.scene.color); clouds.needsUpdate = true
      if (scene.userData.venusAppearance === status) delete scene.userData.venusAppearance
    }
  }, [gl, scene, material, planet.scene.color, status])
  useEffect(() => () => geometry.dispose(), [geometry])
  useFrame(() => {
    const appliedUniforms = rim.current?.uniforms
    if (!appliedUniforms) return
    // Write to the rendered material: the reconciler may copy the initial uniforms.
    appliedUniforms.visibility.value = planetVisibility(planet.id, progress.current.current,
      model.phase === 'travel' ? null : model.planet.id)
    // Selection changes only the illustrative rim; the cloud shell stays closed.
    appliedUniforms.strength.value = model.phase !== 'travel' && model.planet.id === 'venus'
      && model.selectedHotspot === 'venus-atmosphere' ? 0.34 : 0.18
    status.cloudOpacity = material.current?.opacity ?? 0
    status.rimStrength = appliedUniforms.strength.value
    status.rimVisibility = appliedUniforms.visibility.value
  }, -1)
  return <group position={planet.scene.center}>
    <mesh geometry={geometry} name="venus-cloud-shell">
      <meshStandardMaterial ref={material} color={planet.scene.color} emissive="#4786a8"
        emissiveIntensity={0} roughness={1} transparent opacity={0} />
    </mesh>
    <mesh geometry={geometry} scale={1.025} name="venus-atmosphere-rim" raycast={noRaycast}>
      <shaderMaterial ref={rim} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader}
        transparent depthWrite={false} side={BackSide} blending={AdditiveBlending} />
    </mesh>
  </group>
}
