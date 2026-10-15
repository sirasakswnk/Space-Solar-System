window.__s09cResult = { status: 'running' };
(async () => {
  const read = () => document.querySelector('canvas')?.journeySnapshot
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
  const assert = (condition, label) => { if (!condition) throw Error(label) }
  const wait = async fn => {
    const end = performance.now() + 9000
    while (!fn() && performance.now() < end) await pause(25)
    assert(fn(), 'Timeout')
  }
  const go = async value => {
    const y = Math.round(value * 24000), p = y / 24000
    scrollTo(0, y)
    await wait(() => read()?.current === p && read().target === p)
    await pause(50)
    return read()
  }
  const samePose = (a, b) => ['camera', 'cameraQuaternion', 'ship', 'shipQuaternion']
    .every(key => a[key].every((v, i) => Math.abs(v - b[key][i]) < 1e-6))
  const checks = []
  await wait(() => read()?.mercury?.texture === 'loaded')
  assert(read().mercury.width === 2048 && read().mercury.height === 1024, '2K texture dimensions')
  assert(document.querySelectorAll('canvas').length === 1 && !document.querySelector('vite-error-overlay'), 'Canvas / overlay')
  assert(!performance.getEntriesByType('resource').some(e => /solarsystemscope|wikimedia/.test(e.name)), 'External asset requests')
  checks.push('local-2k-mercury-loaded-without-external-assets')

  const values = [.13, .16, .17766, .20, .25, .288204], samples = []
  for (const value of values) samples.push(await go(value))
  const paused = read(); await pause(450)
  assert(samePose(paused, read()), 'Pose moved while paused')
  for (let i = values.length - 1; i >= 0; i--) {
    const current = await go(values[i])
    assert(samePose(samples[i], current), 'Reverse pose sample ' + i)
    assert(current.mercury.texture === 'loaded', 'Reverse unloaded Mercury')
  }
  checks.push('six-forward-reverse-poses-and-paused-travel')

  const saved = await go(.17766), savedY = scrollY
  const opener = document.querySelector('#explore-planet')
  opener.focus(); opener.click()
  await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  assert(!document.querySelector('[data-hotspot=impact-craters]').hidden, 'Initial crater marker')
  document.querySelector('[data-hotspot=impact-craters]').click()
  await wait(() => read().explore.selectedHotspot === 'impact-craters' && !read().explore.focusing && read().craterHighlight)
  assert(Math.abs(read().explore.orbit.yaw - 1.0246991663076082) < 1e-6 && read().explore.orbit.distance === 5.6, 'Image-aligned crater focus')
  assert(read().current === saved.current && scrollY === savedY, 'Exploration changed travel progress')
  assert(document.querySelector('[data-hotspot=impact-craters]').getAttribute('aria-pressed') === 'true', 'Marker selection semantics')
  checks.push('image-aligned-crater-marker-focus-and-selected-outline')

  const choose = id => document.querySelector(`[data-info=${id}]`).click()
  choose('environment')
  await wait(() => read().explore.selectedHotspot === 'environment' && !read().explore.focusing && !read().craterHighlight)
  assert(document.querySelector('#hotspot-detail').textContent.includes('ทั้งดาว'), 'Whole-planet environment note')
  for (const id of ['impact-craters', 'environment', 'impact-craters', 'environment']) { choose(id); await pause(60) }
  await wait(() => read().explore.selectedHotspot === 'environment' && !read().explore.focusing && !read().craterHighlight)
  const credits = [...document.querySelectorAll('.explore-panel .asset-credit a')].map(a => a.href)
  assert(credits[0] === 'https://ssi.solarsystemscope.com/textures/' && credits[1] === 'https://creativecommons.org/licenses/by/4.0/', 'Creator/license credit')
  assert(document.querySelector('.source-link').href === 'https://science.nasa.gov/mercury/facts/', 'NASA information source')
  checks.push('whole-planet-information-latest-selection-and-source-license-links')

  const right = [...document.querySelectorAll('.orbit-buttons button')].find(b => b.textContent === 'หมุนขวา')
  for (let i = 0; i < 24; i++) right.click()
  await pause(60)
  assert(!read().explore.focusing && read().explore.orbit.yaw > 5.8, 'Far-side rotation')
  assert(document.querySelector('[data-hotspot=impact-craters]').hidden, 'Far-side marker occlusion')
  document.querySelector('.return-button').click()
  await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
  await pause(220)
  assert(samePose(saved, read()) && scrollY === savedY && document.activeElement === opener, 'Far-side exit camera/scroll/focus restoration')
  assert(!read().craterHighlight && read().explore.selectedHotspot === null, 'Exit clears selected outline')
  checks.push('far-side-exit-restores-camera-scroll-focus-and-clears-selection')

  await go(.288204); opener.click()
  await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  document.querySelector('[data-info=venus-clouds]').click()
  await wait(() => read().explore.selectedHotspot === 'venus-clouds' && !read().explore.focusing)
  assert(document.querySelector('#hotspot-detail').textContent.includes('เมฆ'), 'Shared hotspot Venus smoke check')
  document.querySelector('.return-button').click()
  await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
  await pause(220); await go(.17766)
  checks.push('shared-hotspot-venus-selection-still-works')
  return { passed: true, checks, poseSamples: samples.map(s => ({ p: s.current, camera: s.camera })), mercury: read().mercury, final: read() }
})().then(result => { window.__s09cResult = result })
  .catch(error => { window.__s09cResult = { passed: false, error: String(error), snapshot: document.querySelector('canvas')?.journeySnapshot } });
'started'
