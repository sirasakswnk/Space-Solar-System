import { useEffect } from 'react'
import type { RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import { RepeatWrapping, SRGBColorSpace, TextureLoader } from 'three'
import type { MeshStandardMaterial } from 'three'

export default function NeptuneClouds({ material }: { material: RefObject<MeshStandardMaterial | null> }) {
  const { gl, scene } = useThree()
  useEffect(() => {
    let active = true
    const clouds = material.current
    if (!clouds) return
    const status = { texture: 'loading', width: 0, height: 0 }
    if (import.meta.env.DEV) scene.userData.neptuneAppearance = status
    const map = new TextureLoader().load('/assets/neptune/atmosphere.jpg', texture => {
      if (!active) { texture.dispose(); return }
      texture.colorSpace = SRGBColorSpace
      texture.wrapS = RepeatWrapping
      texture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy())
      clouds.map = texture
      clouds.color.set('#e2eaf1'); clouds.needsUpdate = true
      status.texture = 'loaded'
      status.width = texture.image.width; status.height = texture.image.height
    }, undefined, () => { if (active) status.texture = 'fallback' })
    return () => {
      active = false
      map.dispose(); clouds.map = null
      clouds.color.set('#5f92c4'); clouds.needsUpdate = true
      if (scene.userData.neptuneAppearance === status) delete scene.userData.neptuneAppearance
    }
  }, [gl, scene, material])
  return <meshStandardMaterial ref={material} color="#5f92c4" emissive="#4786a8"
    emissiveIntensity={0} roughness={1} transparent opacity={0} />
}


