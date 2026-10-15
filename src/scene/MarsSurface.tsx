import { useEffect } from 'react'
import type { RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import { RepeatWrapping, SRGBColorSpace, TextureLoader } from 'three'
import type { MeshStandardMaterial } from 'three'

export default function MarsSurface({ material }: { material: RefObject<MeshStandardMaterial | null> }) {
  const { gl, scene } = useThree()
  useEffect(() => {
    let active = true
    const surface = material.current
    if (!surface) return
    const status = { texture: 'loading', width: 0, height: 0 }
    if (import.meta.env.DEV) scene.userData.marsAppearance = status
    const map = new TextureLoader().load('/assets/mars/surface.jpg', texture => {
      if (!active) { texture.dispose(); return }
      texture.colorSpace = SRGBColorSpace
      texture.wrapS = RepeatWrapping
      texture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy())
      surface.map = texture
      surface.color.set('#ddd8d2')
      surface.needsUpdate = true
      status.texture = 'loaded'
      status.width = texture.image.width; status.height = texture.image.height
    }, undefined, () => { if (active) status.texture = 'fallback' })
    return () => {
      active = false
      map.dispose(); surface.map = null
      surface.color.set('#b86642'); surface.needsUpdate = true
      if (scene.userData.marsAppearance === status) delete scene.userData.marsAppearance
    }
  }, [gl, scene, material])
  return <meshStandardMaterial ref={material} color="#b86642" emissive="#4786a8"
    emissiveIntensity={0} roughness={1} transparent opacity={0} />
}
