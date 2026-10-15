(async () => {
  const read = () => document.querySelector('canvas').journeySnapshot
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
  const assert = (value, label) => { if (!value) throw new Error(label + ': ' + JSON.stringify(read())) }
  const checks = []
  const wait = async predicate => {
    const deadline = performance.now() + 8000
    while (!predicate() && performance.now() < deadline) await pause(20)
    assert(predicate(), 'Timed out')
  }
  const samePose = (a,b) => ['camera','cameraQuaternion','ship'].every(key => a[key].every((v,i) => Math.abs(v-b[key][i]) < 1e-6))
  const go = async p => { scrollTo(0, p*4800); await wait(() => read().current === p && read().target === p) }
  if (read().explore.phase !== 'travel') {
    document.querySelector('.return-button').click()
    await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
    await pause(220)
  }
  await go(0.9)
  const saved = read()
  const savedScroll = scrollY
  const opener = document.querySelector('#explore-mercury')
  opener.focus(); opener.click()
  await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  const dialog = document.querySelector('dialog')
  const panel = document.querySelector('.explore-panel')
  const button = label => [...dialog.querySelectorAll('button')].find(element => element.textContent === label)
  const choose = id => document.querySelector(`[data-info="${id}"]`).click()
  assert(dialog.open && dialog.contains(document.activeElement), 'Modal or focus missing')
  assert(document.querySelectorAll('[data-hotspot]').length === 2 && [...document.querySelectorAll('[data-hotspot]')].every(element => !element.hidden), 'Initial markers missing')
  checks.push('enter-two-markers')
  const source = panel.querySelector('.source-link')
  assert(source.href === 'https://science.nasa.gov/mercury/facts/' && source.target === '_blank' && source.rel.includes('noopener'), 'Source missing')
  checks.push('nasa-source')
  choose('impact-craters')
  await wait(() => !read().explore.focusing && read().explore.selectedHotspot === 'impact-craters')
  assert(read().explore.orbit.distance === 5.6 && read().explore.orbit.yaw === -0.1, 'Crater focus failed')
  assert(panel.querySelector('h3')?.textContent === 'พื้นผิวและหลุมอุกกาบาต' && panel.innerText.includes('ไม่ได้แทนหลุมที่มีชื่อ'), 'Crater information missing')
  checks.push('crater-focus-content')
  choose('environment')
  await pause(80)
  choose('impact-craters')
  await pause(70)
  choose('environment')
  let minimumRadius = Infinity
  while(read().explore.focusing) {
    const camera = read().camera
    const radius = Math.hypot(camera[0],camera[1]-9,camera[2]+50)
    minimumRadius = Math.min(minimumRadius,radius)
    assert(radius > 2.6, 'Focus crossed surface')
    await pause(15)
  }
  assert(read().explore.orbit.distance === 6.4 && read().explore.orbit.yaw === 1.1, 'Latest selection did not win')
  assert(panel.querySelector('h3')?.textContent === 'สภาพแวดล้อม' && panel.innerText.includes('430°C') && panel.innerText.includes('−180°C'), 'Environment information missing')
  assert(read().current === saved.current && read().target === saved.target && scrollY === savedScroll, 'Focus moved travel')
  checks.push('latest-selection-safe-focus', 'environment-content-frozen-travel')
  choose('impact-craters'); await pause(60)
  button('หมุนขวา').click()
  assert(!read().explore.focusing, 'Manual control did not cancel focus')
  button('คืนมุมเริ่มต้น').click()
  await pause(50)
  assert(read().explore.selectedHotspot === null && read().explore.orbit.distance === 8 && read().explore.orbit.yaw === 0.55, 'Reset selection failed')
  checks.push('manual-cancel-reset')
  // The front-side marker must also work as an HTML point on the rendered planet.
  document.querySelector('[data-hotspot="impact-craters"]').click()
  await wait(() => !read().explore.focusing)
  assert(read().explore.selectedHotspot === 'impact-craters', 'Marker click failed')
  checks.push('marker-click')
  for(let i=0;i<16;i++) button('หมุนขวา').click()
  await pause(50)
  assert(document.querySelector('[data-hotspot="impact-craters"]').hidden, 'Occluded marker still interactive')
  choose('environment'); await pause(40)
  button('กลับสู่การเดินทาง').click()
  await wait(() => read().explore.phase === 'travel' && !dialog.open)
  await pause(220)
  assert(samePose(saved,read()) && scrollY === savedScroll && document.activeElement === opener, 'Exit while focusing failed restoration')
  assert(read().explore.selectedHotspot === null, 'Selection leaked after exit')
  checks.push('occluded-marker-hidden', 'exit-during-focus-restoration')
  await go(0.5); await go(0.9)
  assert(samePose(saved,read()), 'Reverse/forward pose changed')
  checks.push('reverse-forward-travel')
  opener.click(); await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  assert(read().explore.selectedHotspot === null && !read().explore.focusing, 'Reopen retained selection')
  panel.scrollTop = 0
  window.__s05aSaved = { pose: saved, scroll: savedScroll }
  checks.push('reopen-clean')
  return { passed:true, checks, minimumRadius, viewport:[innerWidth,innerHeight], browser:navigator.userAgent, source:source.href, exploring:read() }
})()
