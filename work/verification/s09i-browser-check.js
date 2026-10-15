window.__s09iResult = { status: 'running' };
(async () => {
  const read = () => document.querySelector('canvas')?.journeySnapshot
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
  const assert = (value, label) => { if (!value) throw Error(label) }
  const wait = async fn => {
    const end = performance.now() + 9000
    while (!fn() && performance.now() < end) await pause(25)
    assert(fn(), 'Timeout')
  }
  await wait(() => read()?.neptune?.texture === 'loaded' && read().explore.phase === 'travel')
  const url = performance.getEntriesByType('resource').find(e => e.name.includes('@react-three_fiber.js?v=')).name
  const fiber = await import(url), scene = [...fiber._roots.values()][0].store.getState().scene
  const shell = scene.getObjectByName('neptune-cloud-shell'), route = scene.getObjectByName('neptune-route-comparison')
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
  assert(read().neptune.width === 2048 && read().neptune.height === 1024, '2K map')
  assert(shell.material.map.image.width === 2048 && shell.material.map.colorSpace === 'srgb' && shell.material.roughness === 1, 'Applied matte sRGB map')
  assert(document.querySelectorAll('canvas').length === 1 && !document.querySelector('vite-error-overlay'), 'Canvas / overlay')
  assert(!performance.getEntriesByType('resource').some(e => /solarsystemscope|wikimedia/.test(e.name)), 'External asset requests')
  checks.push('local-2k-srgb-matte-cloud-map-no-external-assets')

  const values = [.799, .85, .89, .93, .945, 1], samples = []
  for (const value of values) samples.push(await go(value))
  assert(read().overview.visible && read().overview.blend > 0, 'Final overview reached')
  const stopped = read(); await pause(450)
  assert(samePose(stopped, read()), 'Travel moved while paused')
  for (let i = values.length - 1; i >= 0; i--) assert(samePose(samples[i], await go(values[i])), 'Reverse pose ' + i)
  checks.push('six-forward-reverse-poses-through-overview-and-pause')

  const saved = await go(.93), savedY = scrollY, opener = document.querySelector('#explore-planet')
  opener.focus(); opener.click()
  await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  const choose = id => document.querySelector(`[data-info=${id}]`).click()
  document.querySelector('[data-hotspot=neptune-atmosphere]').click()
  await wait(() => read().explore.selectedHotspot === 'neptune-atmosphere' && !read().explore.focusing && read().neptuneAtmosphereHighlight)
  assert(read().explore.orbit.distance === 10 && closedClouds() && !read().routeComparisonVisible, 'Atmosphere focus without route')
  assert(!document.querySelector('[data-hotspot=neptune-atmosphere]').hidden && document.querySelector('[data-hotspot=neptune-atmosphere]').getAttribute('aria-pressed') === 'true', 'Marker semantics')
  assert(document.querySelector('#hotspot-detail').textContent.includes('บรรยากาศทั้งดาว'), 'Whole-planet information note')
  choose('neptune-route')
  await wait(() => !read().explore.focusing && read().explore.selectedHotspot === 'neptune-route' && read().routeComparisonVisible)
  assert(!read().neptuneAtmosphereHighlight && read().explore.orbit.distance === 26 && read().explore.orbit.pitch === .25 && closedClouds(), 'Route wide view')
  const ids = ['earth', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']
  assert(route.children.length === 9 && route.children[0].geometry.getAttribute('position').count === 480, 'Original route geometry')
  assert(ids.every(id => scene.getObjectByName('route-stop-' + id)?.position.length() > 4), 'Eight miniature stops outside globe')
  const legend = [...document.querySelectorAll('.route-comparison-legend li')].map(e => e.textContent.toLowerCase())
  assert(legend.length === 8 && legend.every((text, i) => text.includes(ids[i])), 'Eight ordered legend entries')
  assert(document.querySelector('#hotspot-detail').textContent.includes('ไม่ใช่วงโคจร'), 'Miniature route caveat')
  choose('neptune-atmosphere'); await wait(() => !read().explore.focusing && read().neptuneAtmosphereHighlight && !read().routeComparisonVisible)
  checks.push('atmosphere-focus-original-eight-stop-route-and-close-view-restoration')

  for (const id of ['neptune-atmosphere', 'neptune-route', 'neptune-atmosphere', 'neptune-route']) { choose(id); await pause(60) }
  await wait(() => !read().explore.focusing && read().explore.selectedHotspot === 'neptune-route')
  assert(read().routeComparisonVisible && !read().neptuneAtmosphereHighlight && read().current === saved.current && scrollY === savedY, 'Latest selection and frozen progress')
  const credits = [...document.querySelectorAll('.explore-panel .asset-credit a')].map(a => a.href)
  assert(credits[0] === 'https://ssi.solarsystemscope.com/textures/' && credits[1] === 'https://creativecommons.org/licenses/by/4.0/', 'Credits')
  assert(document.querySelector('.source-link').href === 'https://science.nasa.gov/neptune/neptune-facts/', 'NASA source')
  const button = text => [...document.querySelectorAll('.explore-panel button')].find(b => b.textContent === text)
  button('คืนมุมเริ่มต้น').click(); await pause(100)
  assert(read().explore.selectedHotspot === null && !read().routeComparisonVisible && !read().neptuneAtmosphereHighlight, 'Reset clears route and outline')
  choose('neptune-atmosphere'); await wait(() => !read().explore.focusing && read().neptuneAtmosphereHighlight)
  for (let i = 0; i < 40; i++) button('ซูมเข้า').click()
  await pause(50); assert(read().explore.orbit.distance === 5.4 && closedClouds(), 'Safe zoom outside body')
  for (let i = 0; i < 16; i++) button('หมุนขวา').click()
  await pause(50); assert(document.querySelector('[data-hotspot=neptune-atmosphere]').hidden, 'Far-side marker occlusion')
  document.querySelector('.return-button').click()
  await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
  await pause(220)
  assert(samePose(saved, read()) && scrollY === savedY && document.activeElement === opener, 'Exit restores pose/scroll/focus')
  assert(!read().neptuneAtmosphereHighlight && !read().routeComparisonVisible && read().explore.selectedHotspot === null, 'Exit clears state')
  checks.push('latest-selection-reset-safe-zoom-occlusion-exact-exit-restoration-and-credits')

  await go(.799); opener.click()
  await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  choose('uranus-atmosphere'); await wait(() => read().uranusAtmosphereHighlight && !read().explore.focusing)
  choose('uranus-axis'); await wait(() => read().axisVisible && !read().explore.focusing)
  assert(read().uranus.texture === 'loaded' && scene.getObjectByName('uranus-cloud-shell').rotation.z === 97.77 * Math.PI / 180, 'Shared Uranus regression')
  document.querySelector('.return-button').click()
  await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
  await pause(220); await go(.93)
  checks.push('shared-uranus-atmosphere-and-axis-regression')
  return { passed: true, checks, neptune: read().neptune, closedClouds: closedClouds(), poseSamples: samples.map(s => ({ p: s.current, camera: s.camera })) }
})().then(result => { window.__s09iResult = result })
  .catch(error => { window.__s09iResult = { passed: false, error: String(error), snapshot: document.querySelector('canvas')?.journeySnapshot } });
'started'
