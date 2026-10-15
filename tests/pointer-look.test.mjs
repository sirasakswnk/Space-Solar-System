import test from 'node:test'
import assert from 'node:assert/strict'
import { Object3D, Vector3 } from 'three'
import { applyPointerLook, pointerLookLimit, pointerTarget, settlePointerLook } from '../src/journey/pointerLook.ts'

test('pointer target maps the window to [-1, 1] and ignores an empty viewport', () => {
  const out = { x: 0, y: 0 }
  assert.deepEqual(pointerTarget(640, 360, 1280, 720, out), { x: 0, y: 0 })
  assert.deepEqual(pointerTarget(1280, 0, 1280, 720, out), { x: 1, y: 1 })
  assert.deepEqual(pointerTarget(-50, 900, 1280, 720, out), { x: -1, y: -1 })
  assert.deepEqual(pointerTarget(10, 10, 0, 720, out), { x: -1, y: -1 })
})

test('lean eases toward the target, caps long frames and settles exactly', () => {
  const current = { x: 0, y: 0 }, target = { x: 1, y: -1 }
  settlePointerLook(current, target, 10)
  assert.ok(current.x > 0 && current.x < 0.2 && current.y < 0 && current.y > -0.2)
  for (let i = 0; i < 400; i++) settlePointerLook(current, target, 1 / 60)
  assert.deepEqual(current, target)
})

test('lean only rotates the camera within a small angle', () => {
  const base = new Object3D(), leaned = new Object3D()
  for (const camera of [base, leaned]) { camera.position.set(3, 4, 5); camera.lookAt(0, 0, -10) }
  applyPointerLook(base, { x: 0, y: 0 })
  assert.ok(base.quaternion.angleTo(leaned.quaternion) < 1e-12)
  applyPointerLook(leaned, { x: 1, y: 1 })
  assert.deepEqual(leaned.position.toArray(), [3, 4, 5])
  const angle = base.quaternion.angleTo(leaned.quaternion)
  assert.ok(angle > 0 && angle <= Math.hypot(pointerLookLimit.yaw, pointerLookLimit.pitch) + 1e-9)
  // Pointer right and up turns the view right and up.
  const forward = new Vector3(0, 0, -1)
  const before = forward.clone().applyQuaternion(base.quaternion)
  const after = forward.clone().applyQuaternion(leaned.quaternion)
  const right = new Vector3(1, 0, 0).applyQuaternion(base.quaternion)
  const up = new Vector3(0, 1, 0).applyQuaternion(base.quaternion)
  assert.ok(after.clone().sub(before).dot(right) > 0)
  assert.ok(after.clone().sub(before).dot(up) > 0)
})
