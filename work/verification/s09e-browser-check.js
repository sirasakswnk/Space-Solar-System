window.__s09eResult = { status: 'running' };
(async () => {
  const read = () => document.querySelector('canvas')?.journeySnapshot
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
  const assert = (value, label) => { if (!value) throw Error(label) }
  const wait = async fn => {
    const end = performance.now() + 9000
    while (!fn() && performance.now() < end) await pause(25)
    assert(fn(), 'Timeout')
  }
  await wait(() => read()?.mars?.texture === 'loaded' && read().explore.phase === 'travel')
  const url = performance.getEntriesByType('resource').find(e => e.name.includes('@react-three_fiber.js?v=')).name
  const fiber = await import(url), scene = [...fiber._roots.values()][0].store.getState().scene
  const surface = scene.getObjectByName('mars-surface')
  const go = async value => {
    const y = Math.round(value * 24000), p = y / 24000
    scrollTo(0, y); await wait(() => read().current === p && read().target === p)
    await pause(50); return read()
  }
  const samePose = (a, b) => ['camera', 'cameraQuaternion', 'ship', 'shipQuaternion']
    .every(key => a[key].every((v, i) => Math.abs(v - b[key][i]) < 1e-6))
  const checks = []
  assert(read().mars.width === 2048 && read().mars.height === 1024, '2K map')
  assert(surface.material.map.image.width === 2048 && surface.material.map.colorSpace === 'srgb', 'Applied sRGB texture')
  assert(surface.material.roughness === 1 && surface.geometry.parameters.widthSegments === 64, 'Matte sphere')
  assert(document.querySelectorAll('canvas').length === 1 && !document.querySelector('vite-error-overlay'), 'Canvas / overlay')
  assert(!performance.getEntriesByType('resource').some(e => /solarsystemscope|wikimedia/.test(e.name)), 'External asset requests')
  checks.push('local-2k-srgb-map-on-matte-sphere-without-external-assets')

  const values = [.288204, .34, .37, .3948, .43, .5264], samples = []
  for (const value of values) samples.push(await go(value))
  const stopped = read(); await pause(450)
  assert(samePose(stopped, read()), 'Travel moved while paused')
  for (let i = values.length - 1; i >= 0; i--) assert(samePose(samples[i], await go(values[i])), 'Reverse pose ' + i)
  checks.push('six-forward-reverse-poses-and-pause')

  const saved = await go(.3948), savedY = scrollY, opener = document.querySelector('#explore-planet')
  opener.focus(); opener.click()
  await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  assert(surface.material.opacity === 1, 'Exploration body opaque')
  const choose = id => document.querySelector(`[data-info=${id}]`).click()
  document.querySelector('[data-hotspot=mars-terrain]').click()
  await wait(() => read().explore.selectedHotspot === 'mars-terrain' && !read().explore.focusing && read().terrainHighlight)
  assert(!read().polarHighlight && read().explore.orbit.distance === 6.8, 'Terrain focus/selection')
  assert(document.querySelector('[data-hotspot=mars-terrain]').getAttribute('aria-pressed') === 'true', 'Marker semantics')
  choose('mars-polar')
  await wait(() => read().explore.selectedHotspot === 'mars-polar' && !read().explore.focusing && read().polarHighlight)
  assert(!read().terrainHighlight && read().explore.orbit.pitch === 1.1 && read().explore.orbit.distance === 7, 'Polar safe focus')
  assert(!document.querySelector('[data-hotspot=mars-polar]').hidden, 'Focused polar marker visible')
  checks.push('terrain-and-polar-focus-exclusive-thin-outlines-with-visible-polar-marker')

  for (const id of ['mars-terrain', 'mars-polar', 'mars-terrain', 'mars-polar']) { choose(id); await pause(60) }
  await wait(() => !read().explore.focusing && read().explore.selectedHotspot === 'mars-polar')
  assert(read().polarHighlight && !read().terrainHighlight, 'Latest selection wins')
  assert(read().current === saved.current && scrollY === savedY, 'Travel progress frozen')
  const credits = [...document.querySelectorAll('.explore-panel .asset-credit a')].map(a => a.href)
  assert(credits[0] === 'https://ssi.solarsystemscope.com/textures/' && credits[1] === 'https://creativecommons.org/licenses/by/4.0/', 'Credits')
  assert(document.querySelector('.source-link').href === 'https://science.nasa.gov/mars/facts/', 'NASA source')
  const button = text => [...document.querySelectorAll('.explore-panel button')].find(b => b.textContent === text)
  button('คืนมุมเริ่มต้น').click(); await pause(100)
  assert(read().explore.selectedHotspot === null && !read().terrainHighlight && !read().polarHighlight, 'Reset clears outlines')
  choose('mars-terrain'); await wait(() => !read().explore.focusing && read().terrainHighlight)
  for (let i = 0; i < 40; i++) button('ซูมเข้า').click()
  await pause(50); assert(read().explore.orbit.distance === 4.1, 'Zoom remains outside body')
  for (let i = 0; i < 16; i++) button('หมุนขวา').click()
  await pause(50); assert(document.querySelector('[data-hotspot=mars-terrain]').hidden, 'Far-side marker occlusion')
  document.querySelector('.return-button').click()
  await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
  await pause(220)
  assert(samePose(saved, read()) && scrollY === savedY && document.activeElement === opener, 'Exit restores pose/scroll/focus')
  assert(!read().terrainHighlight && !read().polarHighlight && read().explore.selectedHotspot === null, 'Exit clears selection')
  checks.push('latest-selection-reset-safe-zoom-occlusion-and-exact-exit-restoration')

  await go(.288204); opener.click()
  await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  choose('venus-clouds'); await wait(() => read().cloudHighlight && !read().explore.focusing)
  assert(read().venus.texture === 'loaded' && scene.getObjectByName('venus-cloud-shell').material.opacity === 1, 'Shared Venus regression')
  document.querySelector('.return-button').click()
  await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
  await pause(220); await go(.3948)
  checks.push('shared-venus-cloud-highlight-regression')
  return { passed: true, checks, mars: read().mars, poseSamples: samples.map(s => ({ p: s.current, camera: s.camera })) }
})().then(result => { window.__s09eResult = result })
  .catch(error => { window.__s09eResult = { passed: false, error: String(error), snapshot: document.querySelector('canvas')?.journeySnapshot } });
'started'
