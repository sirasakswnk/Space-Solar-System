window.__s09hResult = { status: 'running' };
(async () => {
  const read = () => document.querySelector('canvas')?.journeySnapshot
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
  const assert = (value, label) => { if (!value) throw Error(label) }
  const wait = async fn => {
    const end = performance.now() + 9000
    while (!fn() && performance.now() < end) await pause(25)
    assert(fn(), 'Timeout')
  }
  await wait(() => read()?.uranus?.texture === 'loaded' && read().explore.phase === 'travel')
  const url = performance.getEntriesByType('resource').find(e => e.name.includes('@react-three_fiber.js?v=')).name
  const fiber = await import(url), scene = [...fiber._roots.values()][0].store.getState().scene
  const shell = scene.getObjectByName('uranus-cloud-shell'), axis = scene.getObjectByName('uranus-axis')
  const tilt = 97.77 * Math.PI / 180
  const aligned = () => shell.rotation.z === tilt && axis.children[1].rotation.z === tilt && axis.children[0].rotation.z === 0
  const closedClouds = () => shell.material.opacity === 1 && shell.material.alphaMap === null
    && shell.geometry.parameters.phiLength === Math.PI * 2 && shell.geometry.parameters.thetaLength === Math.PI && shell.children.length === 0
  const go = async value => {
    const y = Math.round(value * 24000), p = y / 24000
    scrollTo(0, y); await wait(() => read().current === p && read().target === p)
    await pause(50); return read()
  }
  const samePose = (a, b) => ['camera', 'cameraQuaternion', 'ship', 'shipQuaternion']
    .every(key => a[key].every((v, i) => Math.abs(v - b[key][i]) < 1e-6))
  const checks = []
  assert(read().uranus.width === 2048 && read().uranus.height === 1024, '2K map')
  assert(shell.material.map.image.width === 2048 && shell.material.map.colorSpace === 'srgb' && shell.material.roughness === 1 && aligned(), 'Applied map aligned with axis')
  assert(document.querySelectorAll('canvas').length === 1 && !document.querySelector('vite-error-overlay'), 'Canvas / overlay')
  assert(!performance.getEntriesByType('resource').some(e => /solarsystemscope|wikimedia/.test(e.name)), 'External asset requests')
  checks.push('local-2k-srgb-matte-cloud-map-aligned-with-original-axis')

  const values = [.658, .71, .765, .799, .85, .93], samples = []
  for (const value of values) samples.push(await go(value))
  const stopped = read(); await pause(450)
  assert(samePose(stopped, read()), 'Travel moved while paused')
  for (let i = values.length - 1; i >= 0; i--) assert(samePose(samples[i], await go(values[i])) && aligned(), 'Reverse pose/tilt ' + i)
  checks.push('six-forward-reverse-poses-and-pause-with-stable-tilt')

  const saved = await go(.799), savedY = scrollY, opener = document.querySelector('#explore-planet')
  opener.focus(); opener.click()
  await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  const choose = id => document.querySelector(`[data-info=${id}]`).click()
  document.querySelector('[data-hotspot=uranus-atmosphere]').click()
  await wait(() => read().explore.selectedHotspot === 'uranus-atmosphere' && !read().explore.focusing && read().uranusAtmosphereHighlight)
  assert(read().explore.orbit.distance === 10 && closedClouds() && !read().axisVisible, 'Atmosphere focus and outline without axis')
  assert(!document.querySelector('[data-hotspot=uranus-atmosphere]').hidden && document.querySelector('[data-hotspot=uranus-atmosphere]').getAttribute('aria-pressed') === 'true', 'Marker semantics')
  assert(document.querySelector('#hotspot-detail').textContent.includes('บรรยากาศทั้งดาว'), 'Whole-planet information note')
  choose('uranus-axis')
  await wait(() => !read().explore.focusing && read().explore.selectedHotspot === 'uranus-axis' && read().axisVisible)
  assert(!read().uranusAtmosphereHighlight && read().explore.orbit.distance === 14 && aligned(), 'Axis view and explanatory alignment')
  const toggle = () => document.querySelector('[data-axis-toggle]').click()
  const axisPose = read()
  toggle(); await pause(50)
  assert(!read().axisVisible && document.querySelector('[data-axis-toggle]').getAttribute('aria-pressed') === 'false' && samePose(axisPose, read()), 'Hide axis without camera change')
  toggle(); await pause(50)
  assert(read().axisVisible && document.querySelector('[data-axis-toggle]').getAttribute('aria-pressed') === 'true', 'Show axis')
  choose('uranus-atmosphere'); await wait(() => !read().explore.focusing && read().uranusAtmosphereHighlight)
  assert(read().axisVisible, 'Axis visibility remains independent of atmosphere selection')
  checks.push('atmosphere-focus-axis-focus-independent-toggle-and-marker-semantics')

  for (const id of ['uranus-atmosphere', 'uranus-axis', 'uranus-atmosphere', 'uranus-axis']) { choose(id); await pause(60) }
  await wait(() => !read().explore.focusing && read().explore.selectedHotspot === 'uranus-axis')
  assert(read().axisVisible && !read().uranusAtmosphereHighlight && read().current === saved.current && scrollY === savedY, 'Latest selection and frozen progress')
  const credits = [...document.querySelectorAll('.explore-panel .asset-credit a')].map(a => a.href)
  assert(credits[0] === 'https://ssi.solarsystemscope.com/textures/' && credits[1] === 'https://creativecommons.org/licenses/by/4.0/', 'Credits')
  assert(document.querySelector('.source-link').href === 'https://science.nasa.gov/uranus/facts/', 'NASA source')
  const button = text => [...document.querySelectorAll('.explore-panel button')].find(b => b.textContent === text)
  button('คืนมุมเริ่มต้น').click(); await pause(100)
  assert(read().explore.selectedHotspot === null && !read().axisVisible && !read().uranusAtmosphereHighlight, 'Reset clears axis and outline')
  choose('uranus-atmosphere'); await wait(() => !read().explore.focusing && read().uranusAtmosphereHighlight)
  for (let i = 0; i < 40; i++) button('ซูมเข้า').click()
  await pause(50); assert(read().explore.orbit.distance === 5.6 && closedClouds(), 'Safe zoom outside body')
  for (let i = 0; i < 16; i++) button('หมุนขวา').click()
  await pause(50); assert(document.querySelector('[data-hotspot=uranus-atmosphere]').hidden, 'Far-side marker occlusion')
  document.querySelector('.return-button').click()
  await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
  await pause(220)
  assert(samePose(saved, read()) && scrollY === savedY && document.activeElement === opener, 'Exit restores pose/scroll/focus')
  assert(!read().uranusAtmosphereHighlight && !read().axisVisible && read().explore.selectedHotspot === null && aligned(), 'Exit clears state and preserves alignment')
  checks.push('latest-selection-reset-safe-zoom-occlusion-exact-exit-restoration-and-credits')

  await go(.658); opener.click()
  await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  choose('saturn-body'); await wait(() => read().saturnBodyHighlight && !read().explore.focusing)
  assert(read().saturn.texture === 'loaded' && scene.getObjectByName('saturn-cloud-shell').rotation.z === 0, 'Shared Saturn body regression')
  choose('saturn-rings'); await wait(() => !read().explore.focusing && read().explore.selectedHotspot === 'saturn-rings')
  assert(scene.getObjectByName('saturn-rings').children.every(m => m.material.emissiveIntensity === .3), 'Saturn rings still work')
  document.querySelector('.return-button').click()
  await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
  await pause(220); await go(.799)
  checks.push('shared-saturn-body-and-ring-regression')
  return { passed: true, checks, uranus: read().uranus, tilt: shell.rotation.z, closedClouds: closedClouds(), poseSamples: samples.map(s => ({ p: s.current, camera: s.camera })) }
})().then(result => { window.__s09hResult = result })
  .catch(error => { window.__s09hResult = { passed: false, error: String(error), snapshot: document.querySelector('canvas')?.journeySnapshot } });
'started'
