import { useEffect } from 'react'
import type { RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import { RepeatWrapping, SRGBColorSpace, TextureLoader } from 'three'
import type { MeshStandardMaterial } from 'three'
import type { AssetId, AssetStatus } from '../journey/assetStatus'
import { useAssetAttempt } from '../journey/useAssetStatus'

const asset: AssetId = 'mercury'

export default function MercurySurface({ material, assets }: {
  material: RefObject<MeshStandardMaterial | null>; assets: AssetStatus
}) {
  const { gl, scene } = useThree()
  const attempt = useAssetAttempt(assets, asset)
  useEffect(() => {
    let active = true
    const surface = material.current
    if (!surface) return
    const status = { texture: 'loading', width: 0, height: 0 }
    assets.mark(asset, 'loading')
    if (import.meta.env.DEV) scene.userData.mercuryAppearance = status
    const map = new TextureLoader().load('/assets/mercury/surface.jpg', texture => {
      if (!active) { texture.dispose(); return }
      texture.colorSpace = SRGBColorSpace
      texture.wrapS = RepeatWrapping
      texture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy())
      surface.map = texture
      // Matte gray retains crater contrast under the existing journey lights.
      surface.color.set('#c6c9ce')
      surface.needsUpdate = true
      status.texture = 'loaded'
      assets.mark(asset, 'loaded')
      status.width = texture.image.width; status.height = texture.image.height
    }, undefined, () => { if (active) { status.texture = 'fallback'; assets.mark(asset, 'failed') } })
    return () => {
      active = false
      map.dispose()
      surface.map = null
      surface.color.set('#938981')
      surface.needsUpdate = true
      if (scene.userData.mercuryAppearance === status) delete scene.userData.mercuryAppearance
    }
  }, [gl, scene, material, assets, attempt])
  return <meshStandardMaterial ref={material} color="#938981" emissive="#4786a8"
    emissiveIntensity={0} roughness={1} transparent opacity={0} />
}
