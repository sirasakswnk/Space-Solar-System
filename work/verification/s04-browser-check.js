(async () => {
  const read = () => document.querySelector('canvas').journeySnapshot
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
  const assert = (condition, message) => { if (!condition) throw new Error(message) }
  const wait = async predicate => {
    const deadline = performance.now() + 8000
    while (!predicate() && performance.now() < deadline) await pause(40)
    assert(predicate(), 'Timeout: ' + JSON.stringify(read()))
  }
  const samePose = (a,b) => ['camera','cameraQuaternion','ship'].every(key =>
    a[key].every((v,i) => Math.abs(v-b[key][i]) < 0.000001))
  const go = async p => {
    scrollTo(0,p*4800)
    await wait(() => read().current === p && read().target === p)
  }
  await go(0.9)
  const opener = document.querySelector('#explore-mercury')
  assert(!opener.hidden && !opener.disabled, 'Explore button unavailable')
  const saved = read()
  const savedScroll = scrollY
  opener.focus()
  opener.click()
  await wait(() => read().explore.phase === 'exploring')
  const dialog = document.querySelector('dialog')
  assert(dialog.open && dialog.contains(document.activeElement), 'Dialog/focus missing')
  const initialOrbit = read()
  const buttons = [...dialog.querySelectorAll('button')]
  const click = label => buttons.find(button => button.textContent === label).click()
  click('หมุนขวา')
  click('มองขึ้น')
  await pause(80)
  assert(read().explore.orbit.yaw !== initialOrbit.explore.orbit.yaw, 'Rotate button failed')
  assert(read().explore.orbit.pitch !== initialOrbit.explore.orbit.pitch, 'Pitch button failed')
  click('ซูมเข้า')
  await pause(80)
  assert(read().explore.orbit.distance < initialOrbit.explore.orbit.distance, 'Zoom button failed')
  click('คืนมุมเริ่มต้น')
  await pause(80)
  assert(samePose(initialOrbit, read()), 'Reset view failed')
  assert(read().current === saved.current && read().target === saved.target && scrollY === savedScroll, 'Travel moved in exploration')
  // Scroll attempts must not change the saved journey position.
  scrollTo(0,0)
  await pause(80)
  assert(scrollY === savedScroll && read().current === saved.current, 'Scroll lock failed')
  click('กลับสู่การเดินทาง')
  await wait(() => read().explore.phase === 'travel' && !dialog.open)
  await pause(250)
  assert(samePose(saved, read()) && scrollY === savedScroll, 'Exit did not restore travel pose/scroll')
  assert(document.activeElement === opener, 'Focus did not return to opener')
  // Rotate to the far side and zoom close: returning must go around the planet.
  opener.click()
  await wait(() => read().explore.phase === 'exploring')
  for(let i=0;i<16;i++) click('หมุนขวา')
  for(let i=0;i<8;i++) click('ซูมเข้า')
  await pause(80)
  click('กลับสู่การเดินทาง')
  let minimumExitDistance = Infinity
  const exitDeadline = performance.now()+8000
  while(read().explore.phase !== 'travel' && performance.now()<exitDeadline) {
    const camera = read().camera
    const distance = Math.hypot(camera[0],camera[1]-9,camera[2]+50)
    minimumExitDistance = Math.min(minimumExitDistance,distance)
    assert(distance>2.6,'Exit camera crossed planet surface')
    await pause(20)
  }
  await wait(() => read().explore.phase === 'travel' && !dialog.open)
  await pause(200)
  assert(samePose(saved,read()),'Far-side exit did not restore pose')
  // Exit while entering: the latest exit request must cancel the entry transition.
  opener.click()
  await pause(40)
  dialog.querySelector('.return-button').click()
  await wait(() => read().explore.phase === 'travel' && !dialog.open)
  await pause(200)
  assert(samePose(saved, read()) && document.activeElement === opener, 'Interrupted entry restoration failed')
  // Leave open for trusted mouse/keyboard checks through the CLI.
  opener.click()
  await wait(() => read().explore.phase === 'exploring')
  window.__s04Saved = { pose: saved, scroll: savedScroll }
  window.__s04OrbitBefore = read()
  return { passed: true, browser:navigator.userAgent, viewport:[innerWidth,innerHeight],
    checks:['enter','focus-dialog','rotate-buttons','zoom-buttons','reset','freeze-travel','scroll-lock',
      'exit-pose-scroll','focus-restoration','far-side-exit-safety','exit-during-entry','reopen'], minimumExitDistance, saved, exploring:read() }
})()
