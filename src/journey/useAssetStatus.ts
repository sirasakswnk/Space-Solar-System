import { useSyncExternalStore } from 'react'
import type { AssetId, AssetStatus } from './assetStatus'

// Re-runs a loader only when its own file is retried.
export function useAssetAttempt(assets: AssetStatus, id: AssetId) {
  return useSyncExternalStore(assets.subscribe, () => assets.attempts[id])
}

export function useAssetVersion(assets: AssetStatus) {
  return useSyncExternalStore(assets.subscribe, assets.version)
}
