import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, BackSide, Color, Group, Mesh, MeshStandardMaterial,
  RepeatWrapping, ShaderMaterial, SphereGeometry, SRGBColorSpace, TextureLoader } from 'three'
import { earthCenter, earthRadius } from '../journey/path'

export default function EarthScene({ progress }: { progress: RefObject<{ current: number }> }) {
  const world = useRef<Group>(null)
  const clouds = useRef<Mesh>(null)
  const { scene, gl } = useThree()
  const resources = useMemo(() => ({
    geometry: new SphereGeometry(earthRadius, 64, 40),
    surface: new MeshStandardMaterial({ color: '#236490', roughness: 0.86 }),
    clouds: new MeshStandardMaterial({ color: '#eff7ff', transparent: true,
      opacity: 0.48, depthWrite: false, roughness: 1 }),
    atmosphere: new ShaderMaterial({
      transparent: true, depthWrite: false, side: BackSide, blending: AdditiveBlending,
      uniforms: { tint: { value: new Color('#5baaff') } },
      vertexShader: `varying vec3 worldNormal;
        varying vec3 worldPosition;
        void main() {
          worldNormal = normalize(mat3(modelMatrix) * normal);
          vec4 world = modelMatrix * vec4(position, 1.0);
          worldPosition = world.xyz;
          gl_Position = projectionMatrix * viewMatrix * world;
        }`,
      fragmentShader: `uniform vec3 tint;
        varying vec3 worldNormal;
        varying vec3 worldPosition;
        void main() {
          vec3 view = normalize(cameraPosition - worldPosition);
          float rim = pow(1.0 - abs(dot(normalize(worldNormal), view)), 3.0);
          gl_FragColor = vec4(tint, rim * 0.55);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }),
    status: { surface: 'loading', clouds: 'loading' },
  }), [])
  useEffect(() => {
    let active = true
    resources.status.surface = resources.status.clouds = 'loading'
    const loader = new TextureLoader()
    const surface = loader.load('/assets/earth/daymap.jpg', texture => {
      if (!active) { texture.dispose(); return }
      texture.colorSpace = SRGBColorSpace
      texture.wrapS = RepeatWrapping
      texture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy())
      resources.surface.map = texture
      resources.surface.color.set('#ffffff')
      resources.surface.needsUpdate = true
      resources.status.surface = 'loaded'
    }, undefined, () => { if (active) resources.status.surface = 'fallback' })
    const cloudMap = loader.load('/assets/earth/clouds.jpg', texture => {
      if (!active) { texture.dispose(); return }
      // Grayscale mask is non-color data; MeshStandardMaterial samples green.
      texture.wrapS = RepeatWrapping
      texture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy())
      resources.clouds.alphaMap = texture
      resources.clouds.needsUpdate = true
      resources.status.clouds = 'loaded'
    }, undefined, () => { if (active) resources.status.clouds = 'fallback' })
    return () => {
      active = false
      surface.dispose(); cloudMap.dispose()
      resources.surface.map = null; resources.clouds.alphaMap = null
      resources.surface.color.set('#236490')
      resources.surface.needsUpdate = true; resources.clouds.needsUpdate = true
    }
  }, [resources, scene, gl])
  useEffect(() => () => {
    resources.geometry.dispose(); resources.surface.dispose()
    resources.clouds.dispose(); resources.atmosphere.dispose()
  }, [resources])
  useFrame(() => {
    const p = progress.current.current
    // Presentation rotation follows scroll, including pause, reverse and replay.
    if (world.current) world.current.rotation.set(0.65, 0.9 + p * 0.22, 0.35)
    if (clouds.current) {
      clouds.current.rotation.y = 0.07 + p * 0.08
      clouds.current.visible = resources.status.clouds === 'loaded'
    }
    if (import.meta.env.DEV) scene.userData.earthAppearance = {
      rotation: world.current?.rotation.toArray().slice(0, 3),
      cloudRotation: clouds.current?.rotation.y,
      cloudsVisible: clouds.current?.visible,
      textures: { ...resources.status },
    }
  }, -1)
  return <group ref={world} position={earthCenter} name="earth">
    <mesh geometry={resources.geometry} material={resources.surface} name="earth-surface" />
    <mesh ref={clouds} geometry={resources.geometry} material={resources.clouds}
      scale={1.015} visible={false} name="earth-cloud-layer" />
    <mesh geometry={resources.geometry} material={resources.atmosphere} scale={1.055} name="earth-atmosphere" />
  </group>
}
