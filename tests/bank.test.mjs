import test from 'node:test'
import assert from 'node:assert/strict'
import { Quaternion, Vector3 } from 'three'
import { maxBank, sampleBank } from '../src/journey/bank.ts'
import { flightEnd, mercuryStop, planetStops, sampleJourney } from '../src/journey/path.ts'

test('launch stays upright and every stop is nearly level', () => {
  for (let i = 0; i <= 100; i++) assert.equal(sampleBank(i / 100 * mercuryStop * 0.45), 0)
  for (const { stop } of planetStops) assert.ok(Math.abs(sampleBank(stop)) < 0.05, `stop ${stop}`) // under 3 degrees
  assert.ok(Math.abs(sampleBank(1)) < 1e-9)
})

test('bank stays small and changes smoothly along the whole route', () => {
  let previous = sampleBank(0), largest = 0, biggestStep = 0
  for (let i = 1; i <= 20000; i++) {
    const bank = sampleBank(i / 20000)
    assert.ok(Number.isFinite(bank) && Math.abs(bank) <= maxBank)
    largest = Math.max(largest, Math.abs(bank))
    biggestStep = Math.max(biggestStep, Math.abs(bank - previous))
    previous = bank
  }
  assert.ok(largest > 0.1, 'curves visibly bank')
  // 20,000 samples is about one per 1.2px of scrolling: no sudden roll.
  assert.ok(biggestStep < 0.01, `largest step ${biggestStep}`)
})

test('the top of the ship rolls toward the inside of each turn', () => {
  const point = new Vector3(), a = new Vector3(), b = new Vector3(), tangent = new Vector3()
  let checked = 0
  for (let i = 1; i < 1000; i++) {
    const progress = mercuryStop + (flightEnd - mercuryStop) * i / 1000
    const bank = sampleBank(progress)
    if (Math.abs(bank) < 0.05) continue
    sampleJourney(progress - 0.002, point, a)
    sampleJourney(progress + 0.002, point, b)
    sampleJourney(progress, point, tangent)
    // Inside of the turn: the direction the heading is changing toward.
    const inside = b.clone().sub(a).setY(0).normalize()
    const top = new Vector3(0, 1, 0).projectOnPlane(tangent).normalize()
    const rolled = top.clone().applyQuaternion(new Quaternion().setFromAxisAngle(tangent, bank))
    assert.ok(rolled.sub(top).dot(inside) > 0, `progress ${progress}`)
    checked++
  }
  assert.ok(checked > 100)
})
