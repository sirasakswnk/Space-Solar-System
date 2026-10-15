window.__s09gResult = { status: 'running' };
(async () => {
  const read = () => document.querySelector('canvas')?.journeySnapshot
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
  const assert = (value, label) => { if (!value) throw Error(label) }
  const wait = async fn => {
    const end = performance.now() + 9000
    while (!fn() && performance.now() < end) await pause(25)
    assert(fn(), 'Timeout')
  }
  await wait(() => read()?.saturn?.texture === 'loaded' && read().explore.phase === 'travel')
  const url = performance.getEntriesByType('resource').find(e => e.name.includes('@react-three_fiber.js?v=')).name
  const fiber = await import(url), scene = [...fiber._roots.values()][0].store.getState().scene
  const shell = scene.getObjectByName('saturn-cloud-shell'), rings = scene.getObjectByName('saturn-rings')
  const closedClouds = () => shell.material.opacity === 1 && shell.material.alphaMap === null
    && shell.geometry.parameters.phiLength === Math.PI * 2 && shell.geometry.parameters.thetaLength === Math.PI && shell.children.length === 0
  const ringShape = () => ({ rotation: rings.rotation.toArray(), bands: rings.children.map(m => ({
    inner: m.geometry.parameters.innerRadius, outer: m.geometry.parameters.outerRadius,
    color: m.material.color.getHexString(), opacity: m.material.opacity, side: m.material.side, depthWrite: m.material.depthWrite,
  })) })
  const ringBaseline = JSON.stringify(ringShape())
  assert(rings.rotation.z === .35 && rings.children.length === 3 && rings.children[0].geometry.parameters.innerRadius === 6.5
    && rings.children[1].geometry.parameters.outerRadius === 9.35 && rings.children[2].geometry.parameters.innerRadius === 9.75
    && rings.children[2].geometry.parameters.outerRadius === 11.5, 'Original ring shape and Cassini gap')
  const go = async value => {
    const y = Math.round(value * 24000), p = y / 24000
    scrollTo(0, y); await wait(() => read().current === p && read().target === p)
    await pause(50); return read()
  }
  const samePose = (a, b) => ['camera', 'cameraQuaternion', 'ship', 'shipQuaternion']
    .every(key => a[key].every((v, i) => Math.abs(v - b[key][i]) < 1e-6))
  const checks = []
  assert(read().saturn.width === 2048 && read().saturn.height === 1024, '2K map')
  assert(shell.material.map.image.width === 2048 && shell.material.map.colorSpace === 'srgb' && shell.material.roughness === 1, 'Applied matte sRGB map')
  assert(document.querySelectorAll('canvas').length === 1 && !document.querySelector('vite-error-overlay'), 'Canvas / overlay')
  assert(!performance.getEntriesByType('resource').some(e => /solarsystemscope|wikimedia/.test(e.name)), 'External asset requests')
  checks.push('local-2k-srgb-cloud-map-with-original-ring-shape-and-gap')

  const values = [.5264, .59, .63, .658, .71, .799], samples = []
  for (const value of values) samples.push(await go(value))
  const stopped = read(); await pause(450)
  assert(samePose(stopped, read()), 'Travel moved while paused')
  for (let i = values.length - 1; i >= 0; i--) assert(samePose(samples[i], await go(values[i])), 'Reverse pose ' + i)
  checks.push('six-forward-reverse-poses-through-ring-approach-and-pause')

  const saved = await go(.658), savedY = scrollY, opener = document.querySelector('#explore-planet')
  opener.focus(); opener.click()
  await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  const choose = id => document.querySelector(`[data-info=${id}]`).click()
  document.querySelector('[data-hotspot=saturn-body]').click()
  await wait(() => read().explore.selectedHotspot === 'saturn-body' && !read().explore.focusing && read().saturnBodyHighlight)
  assert(read().explore.orbit.distance === 16 && closedClouds(), 'Body focus outside rings with closed shell')
  assert(!document.querySelector('[data-hotspot=saturn-body]').hidden && document.querySelector('[data-hotspot=saturn-body]').getAttribute('aria-pressed') === 'true', 'Focused body marker semantics')
  assert(document.querySelector('#hotspot-detail').textContent.includes('อธิบายทั้งดาว'), 'Whole-planet information note')
  assert(rings.children.every(m => m.material.emissiveIntensity === 0), 'Body focus clears ring highlight')
  choose('saturn-rings')
  await wait(() => !read().explore.focusing && read().explore.selectedHotspot === 'saturn-rings')
  assert(!read().saturnBodyHighlight && read().explore.orbit.distance === 26 && read().explore.orbit.pitch === .85, 'Ring view remains wide')
  assert(rings.children.every(m => m.material.emissiveIntensity === .3) && closedClouds(), 'Original ring highlight')
  assert(JSON.stringify(ringShape()) === ringBaseline, 'Ring shape/material unchanged during selection')
  checks.push('body-marker-outline-and-ring-view-restore-exclusive-highlights')

  for (const id of ['saturn-body', 'saturn-rings', 'saturn-body', 'saturn-rings']) { choose(id); await pause(60) }
  await wait(() => !read().explore.focusing && read().explore.selectedHotspot === 'saturn-rings')
  assert(!read().saturnBodyHighlight && read().current === saved.current && scrollY === savedY, 'Latest selection and frozen progress')
  const credits = [...document.querySelectorAll('.explore-panel .asset-credit a')].map(a => a.href)
  assert(credits[0] === 'https://ssi.solarsystemscope.com/textures/' && credits[1] === 'https://creativecommons.org/licenses/by/4.0/', 'Credits')
  assert(document.querySelector('.source-link').href === 'https://science.nasa.gov/saturn/facts/', 'NASA source')
  const button = text => [...document.querySelectorAll('.explore-panel button')].find(b => b.textContent === text)
  button('คืนมุมเริ่มต้น').click(); await pause(100)
  assert(read().explore.selectedHotspot === null && !read().saturnBodyHighlight && rings.children.every(m => m.material.emissiveIntensity === 0), 'Reset clears highlights')
  choose('saturn-body'); await wait(() => !read().explore.focusing && read().saturnBodyHighlight)
  for (let i = 0; i < 40; i++) button('ซูมเข้า').click()
  await pause(50); assert(read().explore.orbit.distance === 14 && closedClouds(), 'Safe zoom outside whole ring envelope')
  for (let i = 0; i < 16; i++) button('หมุนขวา').click()
  await pause(50); assert(document.querySelector('[data-hotspot=saturn-body]').hidden, 'Far-side body marker occlusion')
  document.querySelector('.return-button').click()
  await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
  await pause(220)
  assert(samePose(saved, read()) && scrollY === savedY && document.activeElement === opener, 'Exit restores pose/scroll/focus')
  assert(!read().saturnBodyHighlight && read().explore.selectedHotspot === null && JSON.stringify(ringShape()) === ringBaseline, 'Exit clears selection and preserves rings')
  checks.push('latest-selection-reset-safe-zoom-occlusion-exact-exit-restoration-and-credits')

  await go(.5264); opener.click()
  await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  choose('jupiter-storm'); await wait(() => read().stormHighlight && !read().explore.focusing)
  assert(read().jupiter.texture === 'loaded' && !read().jupiterCloudHighlight, 'Shared Jupiter regression')
  document.querySelector('.return-button').click()
  await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
  await pause(220); await go(.658)
  checks.push('shared-jupiter-cloud-shell-and-storm-highlight-regression')
  return { passed: true, checks, saturn: read().saturn, rings: ringShape(), closedClouds: closedClouds(), poseSamples: samples.map(s => ({ p: s.current, camera: s.camera })) }
})().then(result => { window.__s09gResult = result })
  .catch(error => { window.__s09gResult = { passed: false, error: String(error), snapshot: document.querySelector('canvas')?.journeySnapshot } });
'started'
