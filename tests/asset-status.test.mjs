import test from 'node:test'
import assert from 'node:assert/strict'
import { assetMessage, createAssetStatus, textureAssets } from '../src/journey/assetStatus.ts'

test('every texture starts loading and progress counts finished files only', () => {
  const assets = createAssetStatus()
  assert.equal(textureAssets.length, 9)
  assert.deepEqual(assetMessage(assets.states), { text: 'กำลังโหลดภาพดาว 0/9 ไฟล์', retry: false })
  assets.mark('mars', 'loaded'); assets.mark('earth-surface', 'loaded')
  assert.equal(assetMessage(assets.states).text, 'กำลังโหลดภาพดาว 2/9 ไฟล์')
  assert.doesNotMatch(assetMessage(assets.states).text, /%/)
})

test('failures are named once loading ends, and nothing shows when all load', () => {
  const assets = createAssetStatus()
  for (const { id } of textureAssets) assets.mark(id, 'loaded')
  assert.equal(assetMessage(assets.states), null)
  assets.mark('jupiter', 'failed'); assets.mark('earth-clouds', 'failed')
  assert.deepEqual(assetMessage(assets.states), { text: 'โหลดภาพไม่สำเร็จ: เมฆ Earth, Jupiter — แสดงสีสำรองแทน', retry: true })
})

test('retry requests only failed files and notifies subscribers once', () => {
  const assets = createAssetStatus()
  for (const { id } of textureAssets) assets.mark(id, id === 'mars' || id === 'venus' ? 'failed' : 'loaded')
  let calls = 0
  const stop = assets.subscribe(() => calls++)
  const versionBefore = assets.version()
  assert.equal(assets.retryFailed(), 2)
  assert.equal(calls, 1)
  assert.ok(assets.version() > versionBefore)
  assert.equal(assets.attempts.mars, 1); assert.equal(assets.attempts.venus, 1); assert.equal(assets.attempts.jupiter, 0)
  assert.equal(assets.states.mars, 'loading'); assert.equal(assets.states.jupiter, 'loaded')
  assert.equal(assets.retryFailed(), 0)
  assert.equal(calls, 1)
  stop()
  assets.mark('mars', 'loaded')
  assert.equal(calls, 1)
})
