// Real loading state for the texture files. Counts come from finished requests,
// never an invented percentage; a failed file keeps its fallback colour.
export const textureAssets = [
  { id: 'earth-surface', name: 'Earth' },
  { id: 'earth-clouds', name: 'เมฆ Earth' },
  { id: 'mercury', name: 'Mercury' },
  { id: 'venus', name: 'Venus' },
  { id: 'mars', name: 'Mars' },
  { id: 'jupiter', name: 'Jupiter' },
  { id: 'saturn', name: 'Saturn' },
  { id: 'uranus', name: 'Uranus' },
  { id: 'neptune', name: 'Neptune' },
] as const
export type AssetId = typeof textureAssets[number]['id']
export type AssetState = 'loading' | 'loaded' | 'failed'

export function createAssetStatus() {
  const states = Object.fromEntries(textureAssets.map(({ id }) => [id, 'loading'])) as Record<AssetId, AssetState>
  const attempts = Object.fromEntries(textureAssets.map(({ id }) => [id, 0])) as Record<AssetId, number>
  const listeners = new Set<() => void>()
  let version = 0
  const notify = () => { version++; listeners.forEach(listener => listener()) }
  return {
    states, attempts,
    version: () => version,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    mark(id: AssetId, state: AssetState) {
      if (states[id] === state) return
      states[id] = state
      notify()
    },
    // Only failed files are requested again; loaded textures stay in place.
    retryFailed() {
      const failed = textureAssets.filter(({ id }) => states[id] === 'failed')
      for (const { id } of failed) { states[id] = 'loading'; attempts[id]++ }
      if (failed.length) notify()
      return failed.length
    },
  }
}
export type AssetStatus = ReturnType<typeof createAssetStatus>

export function assetMessage(states: Record<AssetId, AssetState>) {
  const total = textureAssets.length
  const loaded = textureAssets.filter(({ id }) => states[id] === 'loaded').length
  const loading = textureAssets.filter(({ id }) => states[id] === 'loading').length
  const failed = [...new Set(textureAssets.filter(({ id }) => states[id] === 'failed').map(({ name }) => name))]
  if (loading) return { text: `กำลังโหลดภาพดาว ${loaded}/${total} ไฟล์`, retry: false }
  if (failed.length) return { text: `โหลดภาพไม่สำเร็จ: ${failed.join(', ')} — แสดงสีสำรองแทน`, retry: true }
  return null
}
