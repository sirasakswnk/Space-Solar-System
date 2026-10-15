window.__s09dResult = { status: 'running' };
(async () => {
  const read = () => document.querySelector('canvas')?.journeySnapshot
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
  const assert = (value, label) => { if (!value) throw Error(label) }
  const wait = async fn => {
    const end = performance.now() + 9000
    while (!fn() && performance.now() < end) await pause(25)
    assert(fn(), 'Timeout')
  }
  await wait(() => read()?.venus?.texture === 'loaded')
  const url = performance.getEntriesByType('resource').find(e => e.name.includes('@react-three_fiber.js?v=')).name
  const fiber = await import(url), scene = [...fiber._roots.values()][0].store.getState().scene
  const shell = scene.getObjectByName('venus-cloud-shell'), rim = scene.getObjectByName('venus-atmosphere-rim')
  const closedClouds = () => shell.material.opacity === 1 && shell.material.alphaMap === null
    && shell.geometry.parameters.phiLength === Math.PI * 2 && shell.geometry.parameters.thetaLength === Math.PI
    && shell.children.length === 0 && !scene.getObjectByName('venus-surface')
  const actualRim = strength => rim.material.uniforms.strength.value === strength && rim.material.uniforms.visibility.value === 1
  const go = async value => {
    const y = Math.round(value * 24000), p = y / 24000
    scrollTo(0, y); await wait(() => read().current === p && read().target === p)
    await pause(50); return read()
  }
  const samePose = (a, b) => ['camera', 'cameraQuaternion', 'ship', 'shipQuaternion']
    .every(key => a[key].every((v, i) => Math.abs(v - b[key][i]) < 1e-6))
  const checks = []
  assert(read().venus.width === 2048 && read().venus.height === 1024, '2K map')
  assert(shell.material.map.image.width === 2048 && shell.material.map.colorSpace === 'srgb', 'Applied sRGB texture')
  assert(document.querySelectorAll('canvas').length === 1 && !document.querySelector('vite-error-overlay'), 'Canvas / overlay')
  assert(!performance.getEntriesByType('resource').some(e => /solarsystemscope|wikimedia/.test(e.name)), 'External asset requests')
  checks.push('local-2k-srgb-map-applied-without-external-assets')

  const values = [.17766, .22, .26, .288204, .315, .3948], samples = []
  for (const value of values) samples.push(await go(value))
  const stopped = read(); await pause(450)
  assert(samePose(stopped, read()), 'Travel moved while paused')
  for (let i = values.length - 1; i >= 0; i--) {
    const current = await go(values[i])
    assert(samePose(samples[i], current) && actualRim(.18), 'Reverse pose/rim sample ' + i)
  }
  checks.push('six-forward-reverse-poses-and-pause-with-applied-rim')

  const saved = await go(.288204), savedY = scrollY, opener = document.querySelector('#explore-planet')
  opener.focus(); opener.click()
  await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  assert(closedClouds() && actualRim(.18), 'Closed cloud shell/default rim')
  document.querySelector('[data-hotspot=venus-clouds]').click()
  await wait(() => read().explore.selectedHotspot === 'venus-clouds' && !read().explore.focusing && read().cloudHighlight)
  assert(read().explore.orbit.distance === 8 && closedClouds(), 'Cloud focus keeps closed shell')
  assert(document.querySelector('#hotspot-detail').textContent.includes('ไม่เปิดมอง'), 'No surface-view claim')
  assert(document.querySelector('[data-hotspot=venus-clouds]').getAttribute('aria-pressed') === 'true', 'Marker pressed semantics')
  checks.push('cloud-marker-focus-and-outline-preserve-closed-clouds')

  const choose = id => document.querySelector(`[data-info=${id}]`).click()
  choose('venus-atmosphere')
  await wait(() => !read().explore.focusing && read().explore.selectedHotspot === 'venus-atmosphere' && !read().cloudHighlight)
  assert(actualRim(.34) && closedClouds(), 'Atmosphere changes real rendered uniforms without exposing terrain')
  assert(document.querySelector('#hotspot-detail').textContent.includes('ทั้งดาว'), 'Whole-planet atmosphere note')
  for (const id of ['venus-clouds', 'venus-atmosphere', 'venus-clouds', 'venus-atmosphere']) { choose(id); await pause(60) }
  await wait(() => !read().explore.focusing && read().explore.selectedHotspot === 'venus-atmosphere')
  assert(actualRim(.34) && closedClouds() && !read().cloudHighlight, 'Latest selection wins')
  assert(read().current === saved.current && scrollY === savedY, 'Travel progress frozen')
  const credits = [...document.querySelectorAll('.explore-panel .asset-credit a')].map(a => a.href)
  assert(credits[0] === 'https://ssi.solarsystemscope.com/textures/' && credits[1] === 'https://creativecommons.org/licenses/by/4.0/', 'Credits')
  assert(document.querySelector('.source-link').href === 'https://science.nasa.gov/venus/venus-facts/', 'NASA source')
  checks.push('real-material-atmosphere-highlight-latest-selection-and-credits')

  const button = text => [...document.querySelectorAll('.orbit-buttons button')].find(b => b.textContent === text)
  for (let i = 0; i < 40; i++) button('ซูมเข้า').click()
  await pause(50)
  assert(read().explore.orbit.distance === 4.8 && closedClouds(), 'Zoom remains outside the closed shell')
  for (let i = 0; i < 24; i++) button('หมุนขวา').click()
  await pause(50)
  assert(document.querySelector('[data-hotspot=venus-clouds]').hidden, 'Far-side cloud marker occlusion')
  document.querySelector('.return-button').click()
  await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
  await pause(220)
  assert(samePose(saved, read()) && scrollY === savedY && document.activeElement === opener, 'Exit restores pose/scroll/focus')
  assert(!read().cloudHighlight && actualRim(.18) && read().explore.selectedHotspot === null, 'Exit resets visual selection')
  checks.push('safe-close-zoom-far-side-exit-and-exact-state-restoration')

  await go(.17766); opener.click()
  await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  document.querySelector('[data-info=impact-craters]').click()
  await wait(() => read().craterHighlight && !read().explore.focusing)
  assert(read().mercury.texture === 'loaded', 'Mercury material regression')
  document.querySelector('.return-button').click()
  await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
  await pause(220); await go(.288204)
  checks.push('shared-mercury-material-and-crater-highlight-regression')
  return { passed: true, checks, venus: read().venus, appliedRim: { strength: rim.material.uniforms.strength.value, visibility: rim.material.uniforms.visibility.value }, closedClouds: closedClouds(), poseSamples: samples.map(s => ({ p: s.current, camera: s.camera })) }
})().then(result => { window.__s09dResult = result })
  .catch(error => { window.__s09dResult = { passed: false, error: String(error), snapshot: document.querySelector('canvas')?.journeySnapshot } });
'started'
