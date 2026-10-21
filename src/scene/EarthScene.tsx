import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, BackSide, Color, Group, Mesh, MeshStandardMaterial,
  RepeatWrapping, ShaderMaterial, SphereGeometry, SRGBColorSpace, TextureLoader } from 'three'
import { earthCenter, earthRadius } from '../journey/path'
import type { AssetStatus } from '../journey/assetStatus'
import { useAssetAttempt } from '../journey/useAssetStatus'
import { earthCloudDrift } from '../journey/spin'

export default function EarthScene({ progress, assets, spin }: {
  progress: RefObject<{ current: number }>; assets: AssetStatus; spin: { time: number }
}) {
  const surfaceAttempt = useAssetAttempt(assets, 'earth-surface')
  const cloudAttempt = useAssetAttempt(assets, 'earth-clouds')
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
  // One effect per file, so retrying one does not request the other again.
  useEffect(() => {
    let active = true
    resources.status.surface = 'loading'
    assets.mark('earth-surface', 'loading')
    const surface = new TextureLoader().load('/assets/earth/daymap.jpg', texture => {
      if (!active) { texture.dispose(); return }
      texture.colorSpace = SRGBColorSpace
      texture.wrapS = RepeatWrapping
      texture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy())
      resources.surface.map = texture
      resources.surface.color.set('#ffffff')
      resources.surface.needsUpdate = true
      resources.status.surface = 'loaded'
      assets.mark('earth-surface', 'loaded')
    }, undefined, () => { if (active) { resources.status.surface = 'fallback'; assets.mark('earth-surface', 'failed') } })
    return () => {
      active = false
      surface.dispose(); resources.surface.map = null
      resources.surface.color.set('#236490'); resources.surface.needsUpdate = true
    }
  }, [resources, gl, assets, surfaceAttempt])
  useEffect(() => {
    let active = true
    resources.status.clouds = 'loading'
    assets.mark('earth-clouds', 'loading')
    const cloudMap = new TextureLoader().load('/assets/earth/clouds.jpg', texture => {
      if (!active) { texture.dispose(); return }
      // Grayscale mask is non-color data; MeshStandardMaterial samples green.
      texture.wrapS = RepeatWrapping
      texture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy())
      resources.clouds.alphaMap = texture
      resources.clouds.needsUpdate = true
      resources.status.clouds = 'loaded'
      assets.mark('earth-clouds', 'loaded')
    }, undefined, () => { if (active) { resources.status.clouds = 'fallback'; assets.mark('earth-clouds', 'failed') } })
    return () => {
      active = false
      cloudMap.dispose(); resources.clouds.alphaMap = null; resources.clouds.needsUpdate = true
    }
  }, [resources, gl, assets, cloudAttempt])
  useEffect(() => () => {
    resources.geometry.dispose(); resources.surface.dispose()
    resources.clouds.dispose(); resources.atmosphere.dispose()
  }, [resources])
  useFrame(() => {
    const p = progress.current.current
    // Presentation rotation follows scroll, including pause, reverse and replay.
    if (world.current) world.current.rotation.set(0.65, 0.9 + p * 0.22, 0.35)
    if (clouds.current) {
      clouds.current.rotation.y = 0.07 + p * 0.08 + spin.time * earthCloudDrift
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
