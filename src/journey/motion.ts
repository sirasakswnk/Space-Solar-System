// Reduced motion replaces long camera flights with a cut that fades in.
// Ordinary scrolling still eases, because the user directly drives it.
export const largeJump = 0.05
export const fadeDuration = 0.4

export type MotionPreference = { reduced: boolean; fade: number }
export function createMotionPreference(): MotionPreference {
  return { reduced: false, fade: 0 }
}

export function shouldCut(reduced: boolean, current: number, target: number) {
  return reduced && Math.abs(target - current) >= largeJump
}

export function fadeAfter(fade: number, delta: number) {
  return Math.max(0, fade - Math.min(delta, 0.05) / fadeDuration)
}
