(async () => {
  const canvas = document.querySelector('canvas')
  const read = () => canvas.journeySnapshot
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
  const assert = (condition, message) => { if (!condition) throw new Error(message) }
  const go = async progress => {
    scrollTo({ top: progress * (document.documentElement.scrollHeight - innerHeight), behavior: 'instant' })
    const deadline = performance.now() + 8000
    while (performance.now() < deadline) {
      const pose = read()
      if (pose && pose.current === progress && Math.abs(pose.target - progress) < 0.00001) return pose
      await pause(50)
    }
    throw new Error(`Did not settle: ${JSON.stringify(read())}`)
  }
  const samePose = (a, b) => ['ship', 'camera', 'cameraQuaternion'].every(key =>
    a[key].every((value, index) => Math.abs(value - b[key][index]) < 0.0001))
  const start = await go(0)
  assert(start.ship[1] === 0.65 && start.engine.engine === 0 && !start.engine.exhaustVisible && !start.launch.smokeVisible, 'Start was not resting on pad')
  const ignition = await go(0.08)
  assert(ignition.ship[1] === start.ship[1] && ignition.engine.engine > 0 && ignition.engine.exhaustVisible, 'Ignition must happen before lift-off')
  const lift = await go(0.16)
  assert(lift.ship[1] > ignition.ship[1] && lift.launch.smokeVisible, 'Lift-off/smoke missing')
  const clouds = await go(0.29)
  assert(clouds.ship[1] > 3.6 && clouds.launch.cloudOpacity > 0, 'Ship did not pass cloud layer')
  const space = await go(0.45)
  assert(space.launch.sky === '080e1b' && space.launch.cloudOpacity === 0 && !space.launch.smokeVisible, 'Atmosphere did not clear')
  const beforeStop = read()
  await pause(600)
  assert(samePose(beforeStop, read()), 'Travel drifted after scroll stopped')
  const end = await go(1)
  assert(end.ship[2] === -43 && !end.engine.exhaustVisible, 'Mercury endpoint regression')
  const reverseClouds = await go(0.29)
  assert(samePose(clouds, reverseClouds), 'Reverse cloud camera pose differs')
  assert(JSON.stringify(clouds.launch) === JSON.stringify(reverseClouds.launch), 'Reverse cloud effects differ')
  const reverseIgnition = await go(0.08)
  assert(samePose(ignition, reverseIgnition), 'Reverse ignition pose differs')
  assert(JSON.stringify(ignition.engine) === JSON.stringify(reverseIgnition.engine), 'Reverse engine differs')
  const returned = await go(0)
  assert(samePose(start, returned), 'Did not return to pad pose')
  assert(JSON.stringify(start.engine) === JSON.stringify(returned.engine) && JSON.stringify(start.launch) === JSON.stringify(returned.launch), 'Effects stuck after return')
  scrollTo(0, 2160)
  await pause(60)
  scrollTo(0, 0)
  const rapidReturn = await go(0)
  assert(samePose(start, rapidReturn) && rapidReturn.engine.engine === 0 && !rapidReturn.launch.smokeVisible, 'Rapid return left effects active')
  assert(document.querySelectorAll('canvas').length === 1 && !!canvas.getContext('webgl2'), 'Canvas regression')
  assert(!document.querySelector('vite-error-overlay'), 'Runtime overlay')
  return { passed: true, browser: navigator.userAgent, viewport: [innerWidth, innerHeight],
    checks: ['pad', 'ignition-before-lift', 'lift-smoke', 'cloud-crossing', 'clear-atmosphere', 'stop',
      'Mercury', 'reverse-cloud-pose-effects', 'reverse-ignition', 'return-pad-effects-off', 'rapid-return'],
    start, ignition, lift, clouds, space, end, returned }
})()
