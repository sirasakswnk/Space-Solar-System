window.__s09fResult = { status: 'running' };
(async () => {
  const read = () => document.querySelector('canvas')?.journeySnapshot
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
  const assert = (value, label) => { if (!value) throw Error(label) }
  const wait = async fn => {
    const end = performance.now() + 9000
    while (!fn() && performance.now() < end) await pause(25)
    assert(fn(), 'Timeout')
  }
  await wait(() => read()?.jupiter?.texture === 'loaded' && read().explore.phase === 'travel')
  const url = performance.getEntriesByType('resource').find(e => e.name.includes('@react-three_fiber.js?v=')).name
  const fiber = await import(url), scene = [...fiber._roots.values()][0].store.getState().scene
  const shell = scene.getObjectByName('jupiter-cloud-shell')
  const closedClouds = () => shell.material.opacity === 1 && shell.material.alphaMap === null
    && shell.geometry.parameters.phiLength === Math.PI * 2 && shell.geometry.parameters.thetaLength === Math.PI
    && shell.children.length === 0
  const go = async value => {
    const y = Math.round(value * 24000), p = y / 24000
    scrollTo(0, y); await wait(() => read().current === p && read().target === p)
    await pause(50); return read()
  }
  const samePose = (a, b) => ['camera', 'cameraQuaternion', 'ship', 'shipQuaternion']
    .every(key => a[key].every((v, i) => Math.abs(v - b[key][i]) < 1e-6))
  const checks = []
  assert(read().jupiter.width === 2048 && read().jupiter.height === 1024, '2K map')
  assert(shell.material.map.image.width === 2048 && shell.material.map.colorSpace === 'srgb', 'Applied sRGB texture')
  assert(shell.material.roughness === 1, 'Matte cloud shell')
  assert(document.querySelectorAll('canvas').length === 1 && !document.querySelector('vite-error-overlay'), 'Canvas / overlay')
  assert(!performance.getEntriesByType('resource').some(e => /solarsystemscope|wikimedia/.test(e.name)), 'External asset requests')
  checks.push('local-2k-srgb-map-on-matte-cloud-shell-no-external-assets')

  const values = [.3948, .43, .49, .5264, .57, .658], samples = []
  for (const value of values) samples.push(await go(value))
  const stopped = read(); await pause(450)
  assert(samePose(stopped, read()), 'Travel moved while paused')
  for (let i = values.length - 1; i >= 0; i--) assert(samePose(samples[i], await go(values[i])), 'Reverse pose ' + i)
  checks.push('six-forward-reverse-poses-and-pause')

  const saved = await go(.5264), savedY = scrollY, opener = document.querySelector('#explore-planet')
  opener.focus(); opener.click()
  await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  const choose = id => document.querySelector(`[data-info=${id}]`).click()
  document.querySelector('[data-hotspot=jupiter-storm]').click()
  await wait(() => read().explore.selectedHotspot === 'jupiter-storm' && !read().explore.focusing && read().stormHighlight)
  assert(!read().jupiterCloudHighlight && read().explore.orbit.distance === 13 && closedClouds(), 'Storm exclusive selection and focus')
  assert(!document.querySelector('[data-hotspot=jupiter-storm]').hidden, 'Focused storm visible')
  assert(document.querySelector('[data-hotspot=jupiter-storm]').getAttribute('aria-pressed') === 'true', 'Marker semantics')
  choose('jupiter-clouds')
  await wait(() => !read().explore.focusing && read().jupiterCloudHighlight)
  assert(!read().stormHighlight && read().explore.orbit.distance === 15 && closedClouds(), 'Cloud exclusive selection and focus')
  checks.push('storm-cloud-marker-focus-exclusive-ellipses-closed-shell')

  for (const id of ['jupiter-clouds', 'jupiter-storm', 'jupiter-clouds', 'jupiter-storm']) { choose(id); await pause(60) }
  await wait(() => !read().explore.focusing && read().explore.selectedHotspot === 'jupiter-storm')
  assert(read().stormHighlight && !read().jupiterCloudHighlight && read().current === saved.current && scrollY === savedY, 'Latest selection and frozen progress')
  const credits = [...document.querySelectorAll('.explore-panel .asset-credit a')].map(a => a.href)
  assert(credits[0] === 'https://ssi.solarsystemscope.com/textures/' && credits[1] === 'https://creativecommons.org/licenses/by/4.0/', 'Credits')
  assert(document.querySelector('.source-link').href === 'https://science.nasa.gov/jupiter/jupiter-facts/', 'NASA source')
  const button = text => [...document.querySelectorAll('.explore-panel button')].find(b => b.textContent === text)
  button('คืนมุมเริ่มต้น').click(); await pause(100)
  assert(read().explore.selectedHotspot === null && !read().stormHighlight && !read().jupiterCloudHighlight, 'Reset clears outlines')
  choose('jupiter-storm'); await wait(() => !read().explore.focusing && read().stormHighlight)
  for (let i = 0; i < 40; i++) button('ซูมเข้า').click()
  await pause(50); assert(read().explore.orbit.distance === 8 && closedClouds(), 'Safe zoom outside shell')
  for (let i = 0; i < 16; i++) button('หมุนขวา').click()
  await pause(50); assert(document.querySelector('[data-hotspot=jupiter-storm]').hidden, 'Far-side marker occlusion')
  document.querySelector('.return-button').click()
  await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
  await pause(220)
  assert(samePose(saved, read()) && scrollY === savedY && document.activeElement === opener, 'Exit restores pose/scroll/focus')
  assert(!read().stormHighlight && !read().jupiterCloudHighlight && read().explore.selectedHotspot === null, 'Exit clears selection')
  checks.push('latest-selection-reset-safe-zoom-occlusion-exact-exit-restoration-and-credits')

  await go(.658); opener.click()
  await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  choose('saturn-rings'); await wait(() => !read().explore.focusing && read().explore.selectedHotspot === 'saturn-rings')
  const rings = scene.getObjectByName('saturn-rings')
  assert(rings.children.length === 3 && rings.children.every(m => m.material.emissiveIntensity === .3), 'Shared Saturn ring selection')
  const features = rings.parent
  assert(features.children.filter(m => m.geometry?.parameters.radius === 5.01).length === 3, 'Saturn retains three cloud bands')
  document.querySelector('.return-button').click()
  await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
  await pause(220); await go(.5264)
  checks.push('shared-saturn-rings-and-cloud-band-regression')
  return { passed: true, checks, jupiter: read().jupiter, closedClouds: closedClouds(), poseSamples: samples.map(s => ({ p: s.current, camera: s.camera })) }
})().then(result => { window.__s09fResult = result })
  .catch(error => { window.__s09fResult = { passed: false, error: String(error), snapshot: document.querySelector('canvas')?.journeySnapshot } });
'started'
