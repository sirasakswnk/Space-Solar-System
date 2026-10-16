import { useRef } from 'react'
import { assetMessage } from './journey/assetStatus'
import type { AssetStatus } from './journey/assetStatus'
import { useAssetVersion } from './journey/useAssetStatus'

export default function AssetStatusLine({ assets }: { assets: AssetStatus }) {
  useAssetVersion(assets)
  const region = useRef<HTMLDivElement>(null)
  const message = assetMessage(assets.states)
  return <div ref={region} className="asset-status" role="status" tabIndex={-1} hidden={!message}>
    {message && <span>{message.text}</span>}
    {message?.retry && <button type="button" onClick={() => {
      // The button disappears while loading; keep focus on the status message.
      region.current?.focus({ preventScroll: true })
      assets.retryFailed()
    }}>ลองโหลดใหม่</button>}
  </div>
}
