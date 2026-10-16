import { useEffect } from 'react'
import type { RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import { RepeatWrapping, SRGBColorSpace, TextureLoader } from 'three'
import type { MeshStandardMaterial } from 'three'
import type { AssetId, AssetStatus } from '../journey/assetStatus'
import { useAssetAttempt } from '../journey/useAssetStatus'

const asset: AssetId = 'neptune'

export default function NeptuneClouds({ material, assets }: {
  material: RefObject<MeshStandardMaterial | null>; assets: AssetStatus
}) {
  const { gl, scene } = useThree()
  const attempt = useAssetAttempt(assets, asset)
  useEffect(() => {
    let active = true
    const clouds = material.current
    if (!clouds) return
    const status = { texture: 'loading', width: 0, height: 0 }
    assets.mark(asset, 'loading')
    if (import.meta.env.DEV) scene.userData.neptuneAppearance = status
    const map = new TextureLoader().load('/assets/neptune/atmosphere.jpg', texture => {
      if (!active) { texture.dispose(); return }
      texture.colorSpace = SRGBColorSpace
      texture.wrapS = RepeatWrapping
      texture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy())
      clouds.map = texture
      clouds.color.set('#e2eaf1'); clouds.needsUpdate = true
      status.texture = 'loaded'
      assets.mark(asset, 'loaded')
      status.width = texture.image.width; status.height = texture.image.height
    }, undefined, () => { if (active) { status.texture = 'fallback'; assets.mark(asset, 'failed') } })
    return () => {
      active = false
      map.dispose(); clouds.map = null
      clouds.color.set('#5f92c4'); clouds.needsUpdate = true
      if (scene.userData.neptuneAppearance === status) delete scene.userData.neptuneAppearance
    }
  }, [gl, scene, material, assets, attempt])
  return <meshStandardMaterial ref={material} color="#5f92c4" emissive="#4786a8"
    emissiveIntensity={0} roughness={1} transparent opacity={0} />
}


