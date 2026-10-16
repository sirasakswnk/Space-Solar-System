// Standard keeps the original pixel ratio range; light renders about 56% of
// those pixels. The scene has no post-processing, so resolution is the main cost.
export type Quality = 'standard' | 'light'
export const lightScale = 0.75

export function qualityDpr(quality: Quality, deviceRatio: number) {
  const ratio = Number.isFinite(deviceRatio) && deviceRatio > 0 ? deviceRatio : 1
  const standard = Math.min(Math.max(ratio, 1), 1.5)
  return quality === 'light' ? standard * lightScale : standard
}
