import { useEffect } from 'react'
import type { RefObject } from 'react'
import { useThree } from '@react-three/fiber'
import { RepeatWrapping, SRGBColorSpace, TextureLoader } from 'three'
import type { MeshStandardMaterial } from 'three'
import type { AssetId, AssetStatus } from '../journey/assetStatus'
import { useAssetAttempt } from '../journey/useAssetStatus'

const asset: AssetId = 'saturn'

export default function SaturnClouds({ material, assets }: {
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
    if (import.meta.env.DEV) scene.userData.saturnAppearance = status
    const map = new TextureLoader().load('/assets/saturn/atmosphere.jpg', texture => {
      if (!active) { texture.dispose(); return }
      texture.colorSpace = SRGBColorSpace
      texture.wrapS = RepeatWrapping
      texture.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy())
      clouds.map = texture
      clouds.color.set('#eee8dc'); clouds.needsUpdate = true
      status.texture = 'loaded'
      assets.mark(asset, 'loaded')
      status.width = texture.image.width; status.height = texture.image.height
    }, undefined, () => { if (active) { status.texture = 'fallback'; assets.mark(asset, 'failed') } })
    return () => {
      active = false
      map.dispose(); clouds.map = null
      clouds.color.set('#d9c395'); clouds.needsUpdate = true
      if (scene.userData.saturnAppearance === status) delete scene.userData.saturnAppearance
    }
  }, [gl, scene, material, assets, attempt])
  return <meshStandardMaterial ref={material} color="#d9c395" emissive="#4786a8"
    emissiveIntensity={0} roughness={1} transparent opacity={0} />
}

