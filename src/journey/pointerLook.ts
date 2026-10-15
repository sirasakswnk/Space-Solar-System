import type { Object3D } from 'three'

// A small lean of the travel camera toward the mouse. It only rotates the
// camera, so the ship path and camera position stay driven by progress alone.
export const pointerLookLimit = { yaw: 0.03, pitch: 0.02 }
export type PointerLook = { x: number; y: number }

export function pointerTarget(clientX: number, clientY: number, width: number, height: number, out: PointerLook) {
  if (!(width > 0 && height > 0)) return out
  out.x = Math.max(-1, Math.min(1, clientX / width * 2 - 1))
  out.y = Math.max(-1, Math.min(1, 1 - clientY / height * 2))
  return out
}

export function settlePointerLook(current: PointerLook, target: PointerLook, delta: number) {
  const blend = 1 - Math.exp(-Math.min(delta, 0.05) * 4)
  current.x += (target.x - current.x) * blend
  current.y += (target.y - current.y) * blend
  if (Math.abs(target.x - current.x) < 0.0001) current.x = target.x
  if (Math.abs(target.y - current.y) < 0.0001) current.y = target.y
  return current
}

// Apply after the rig's lookAt: right turns toward a pointer on the right, up looks up.
export function applyPointerLook(camera: Object3D, look: PointerLook) {
  camera.rotateY(-look.x * pointerLookLimit.yaw)
  camera.rotateX(look.y * pointerLookLimit.pitch)
}
