window.__s09jResult = { status: 'running' };
(async () => {
  const read = () => document.querySelector('canvas').journeySnapshot
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
  const assert = (value, label) => { if (!value) throw Error(label) }
  const wait = async fn => {
    const end = performance.now() + 9000
    while (!fn() && performance.now() < end) await pause(25)
    assert(fn(), 'Timeout')
  }
  const url = performance.getEntriesByType('resource').find(e => e.name.includes('@react-three_fiber.js?v=')).name
  const fiber = await import(url), scene = [...fiber._roots.values()][0].store.getState().scene
  const ids = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']
  const stops = [.17766, .288204, .3948, .5264, .658, .799, .93]
  const shell = id => scene.getObjectByName(`${id}-${['mercury', 'mars'].includes(id) ? 'surface' : 'cloud-shell'}`)
  const visibility = () => ids.map(id => ({ id, visible: scene.getObjectByName(`planet-${id}`).visible, opacity: shell(id).material.opacity }))
  const go = async value => {
    const p = Math.round(value * 24000) / 24000
    scrollTo(0, Math.round(value * 24000)); await wait(() => read().current === p && read().target === p)
    await pause(60); return structuredClone({ ...read(), visibility: visibility() })
  }
  const samePose = (a, b) => ['camera', 'cameraQuaternion', 'ship', 'shipQuaternion']
    .every(key => a[key].every((value, index) => Math.abs(value - b[key][index]) < 1e-6))
  const checks = [], samples = []
  assert(document.querySelectorAll('canvas').length === 1 && !document.querySelector('vite-error-overlay'), 'Canvas / overlay')
  for (let i = 0; i < ids.length; i++) {
    const sample = await go(stops[i]); samples.push(sample)
    assert(sample.visibility.every(planet => planet.visible === (planet.id === ids[i])
      && planet.opacity === (planet.id === ids[i] ? 1 : 0)), 'Destination isolation ' + ids[i])
    const opener = document.querySelector('#explore-planet')
    assert(!opener.hidden && !opener.disabled && opener.textContent.includes(ids[i][0].toUpperCase() + ids[i].slice(1)), 'Destination opener ' + ids[i])
    assert(shell(ids[i]).material.depthWrite, 'Opaque destination depth ' + ids[i])
  }
  const stopped = read(); await pause(450); assert(samePose(stopped, read()), 'Travel moved while stopped')
  for (let i = ids.length - 1; i >= 0; i--) {
    const reversed = await go(stops[i])
    assert(samePose(samples[i], reversed) && JSON.stringify(samples[i].visibility) === JSON.stringify(reversed.visibility), 'Reverse restoration ' + ids[i])
  }
  checks.push('all-seven-stops-isolate-destination-full-opacity-and-exact-reverse-pose-pause')

  const fades = []
  for (const p of [.25, .315, .61, .685]) {
    await go(p)
    const id = p < .4 ? 'venus' : 'saturn', opacity = shell(id).material.opacity
    assert(opacity > 0 && opacity < 1 && !shell(id).material.depthWrite, 'Partial travel fade ' + p)
    if (id === 'venus') {
      assert(Math.abs(scene.getObjectByName('venus-atmosphere-rim').material.uniforms.visibility.value - opacity) < 1e-9, 'Rim fades with clouds')
    } else {
      const rings = scene.getObjectByName('saturn-rings').children
      assert(rings.every((mesh, index) => Math.abs(mesh.material.opacity - [.45, .86, .7][index] * opacity) < 1e-9), 'Rings fade with body')
    }
    fades.push({ p: read().current, id, opacity, camera: read().camera })
  }
  for (let i = fades.length - 1; i >= 0; i--) {
    await go(fades[i].p)
    assert(Math.abs(shell(fades[i].id).material.opacity - fades[i].opacity) < 1e-9
      && read().camera.every((value, index) => Math.abs(value - fades[i].camera[index]) < 1e-6), 'Fade reverse ' + i)
  }
  checks.push('venus-cloud-rim-and-saturn-body-three-ring-bands-share-partial-fade-in-both-directions')

  for (const [index, hotspot] of [[1, 'venus-atmosphere'], [4, 'saturn-rings']]) {
    const saved = await go(stops[index]), savedY = scrollY, opener = document.querySelector('#explore-planet')
    opener.focus(); opener.click()
    await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
    assert(visibility().every(planet => planet.visible === (planet.id === ids[index]) && planet.opacity === (planet.id === ids[index] ? 1 : 0)), 'Explore isolation')
    document.querySelector(`[data-info=${hotspot}]`).click()
    await wait(() => read().explore.selectedHotspot === hotspot && !read().explore.focusing)
    if (index === 1) assert(read().venus.rimStrength === .34 && read().venus.rimVisibility === 1, 'Venus selected rim')
    else assert(scene.getObjectByName('saturn-rings').children.every((mesh, i) => mesh.material.opacity === [.45, .86, .7][i]), 'Explore rings full opacity')
    document.querySelector('.return-button').click()
    await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
    await pause(220)
    assert(samePose(saved, read()) && scrollY === savedY && document.activeElement === opener, 'Explore exact restoration')
    assert(JSON.stringify(saved.visibility) === JSON.stringify(visibility()) && read().explore.selectedHotspot === null, 'Exit visibility and selection reset')
  }
  checks.push('venus-atmosphere-saturn-rings-exploration-full-visibility-and-exact-pose-scroll-focus-restoration')

  await go(.98)
  assert(visibility().every(planet => planet.visible && (planet.id === 'neptune' || planet.opacity > 0 && planet.opacity < 1)), 'Overview fade')
  await go(1)
  assert(read().overview.visible && visibility().every(planet => planet.visible && planet.opacity === 1), 'Complete overview')
  assert(!document.querySelector('.overview-labels').hidden && document.querySelector('.overview-labels').children.length === 8, 'Eight overview labels')
  assert(scene.getObjectByName('earth').visible && scene.getObjectByName('journey-overview').visible, 'Earth and route present')
  document.querySelector('.overview-panel [data-destination=jupiter]').click()
  await wait(() => read().current === Math.round(stops[3] * 24000) / 24000 && read().target === read().current)
  assert(visibility().filter(planet => planet.visible).map(planet => planet.id).join() === 'jupiter', 'Overview jump isolation')
  await go(1)
  document.querySelector('.overview-panel [data-replay]').click()
  // Replay resets the progress ref synchronously; wait for the next rendered
  // frame as well before inspecting scene visibility and the overview panel.
  await wait(() => read().current === 0 && read().target === 0 && read().explore.phase === 'travel'
    && visibility().every(planet => !planet.visible && planet.opacity === 0) && !read().overview.visible)
  assert(visibility().every(planet => !planet.visible && planet.opacity === 0) && scrollY === 0 && !read().overview.visible, 'Replay launch visibility')
  checks.push('overview-fade-all-eight-destinations-jump-and-replay-reset')
  await go(.658)
  return { passed: true, checks, viewport: [innerWidth, innerHeight], fades,
    stopSamples: samples.map(sample => ({ p: sample.current, visibility: sample.visibility, camera: sample.camera })) }
})().then(result => { window.__s09jResult = result })
  .catch(error => { window.__s09jResult = { passed: false, error: String(error), snapshot: document.querySelector('canvas')?.journeySnapshot } });
'started'
