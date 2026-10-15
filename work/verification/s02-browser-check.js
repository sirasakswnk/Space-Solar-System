async function verifyJourney() {
  const canvas = document.querySelector('canvas')
  const read = () => canvas.journeySnapshot
  const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms))
  const assert = (condition, message) => { if (!condition) throw new Error(message) }
  const range = () => document.documentElement.scrollHeight - innerHeight
  const settled = async (expected) => {
    const deadline = performance.now() + 8000
    while (performance.now() < deadline) {
      const pose = read()
      if (pose && Math.abs(pose.current - expected) < 0.00001 && Math.abs(pose.target - expected) < 0.00001) return pose
      await pause(50)
    }
    throw new Error(`Travel did not settle at ${expected}: ${JSON.stringify(read())}`)
  }
  const go = async (fraction) => {
    scrollTo({ top: fraction * range(), behavior: 'instant' })
    return settled(fraction)
  }
  const samePose = (a, b) => ['ship', 'camera', 'cameraQuaternion'].every(key =>
    a[key].every((value, index) => Math.abs(value - b[key][index]) < 0.0001))

  assert(document.querySelectorAll('canvas').length === 1, 'Expected one Canvas')
  assert(!!canvas.getContext('webgl2'), 'WebGL2 missing')
  assert(!document.querySelector('vite-error-overlay'), 'Vite error overlay')
  const wheel = await settled(0.25)
  assert(wheel.ship[1] > 0.5 && wheel.ship[2] < 0, 'Real wheel input did not move ship')
  const start = await go(0)
  const middle = await go(0.5)
  const beforeStop = read()
  await pause(600)
  const afterStop = read()
  assert(samePose(beforeStop, afterStop), 'Ship/camera drifted after scroll stopped')
  assert(afterStop.current === beforeStop.current, 'Progress drifted after scroll stopped')
  const end = await go(1)
  assert(end.ship[2] < middle.ship[2] && middle.ship[2] < start.ship[2], 'Forward travel did not reach Mercury')
  assert(document.querySelector('.caption > p').textContent === 'Mercury — ดาวพุธ', 'Mercury label missing')
  const reverseMiddle = await go(0.5)
  assert(samePose(middle, reverseMiddle), 'Reverse did not restore the middle pose')
  const reverseStart = await go(0)
  assert(samePose(start, reverseStart), 'Reverse did not restore the launch pose')
  // Latest native scroll destination wins even if the previous easing is unfinished.
  scrollTo(0, range())
  await pause(60)
  scrollTo(0, 0)
  const rapidReverse = await settled(0)
  assert(samePose(start, rapidReverse), 'Rapid reverse left stale movement')
  await go(0.5)
  return { passed: true, browser: navigator.userAgent, viewport: [innerWidth, innerHeight],
    range: range(), checks: ['native-wheel', 'forward', 'stop-no-drift', 'Mercury-endpoint',
      'reverse-midpoint-pose', 'reverse-start-pose', 'rapid-reverse'], wheel, start, middle, end }
}
verifyJourney()
