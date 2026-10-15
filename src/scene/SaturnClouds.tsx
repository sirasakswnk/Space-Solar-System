import { useEffect } from 'react'
import type { RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import { RepeatWrapping, SRGBColorSpace, TextureLoader } from 'three'
import type { MeshStandardMaterial } from 'three'

export default function SaturnClouds({ material }: { material: RefObject<MeshStandardMaterial | null> }) {
  const { gl, scene } = useThree()
  useEffect(() => {
    let active = true
    const clouds = material.current
    if (!clouds) return
    const status = { texture: 'loading', width: 0, height: 0 }
    if (import.meta.env.DEV) scene.userData.saturnAppearance = status
    const map = new TextureLoader().load('/assets/saturn/atmosphere.jpg', texture => {
      if (!active) { texture.dispose(); return }
      texture.colorSpace = SRGBColorSpace
      texture.wrapS = RepeatWrapping
      texture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy())
      clouds.map = texture
      clouds.color.set('#eee8dc'); clouds.needsUpdate = true
      status.texture = 'loaded'
      status.width = texture.image.width; status.height = texture.image.height
    }, undefined, () => { if (active) status.texture = 'fallback' })
    return () => {
      active = false
      map.dispose(); clouds.map = null
      clouds.color.set('#d9c395'); clouds.needsUpdate = true
      if (scene.userData.saturnAppearance === status) delete scene.userData.saturnAppearance
    }
  }, [gl, scene, material])
  return <meshStandardMaterial ref={material} color="#d9c395" emissive="#4786a8"
    emissiveIntensity={0} roughness={1} transparent opacity={0} />
}

