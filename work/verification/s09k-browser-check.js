window.__s09kResult = { status: 'running' };
(async () => {
  const read = () => document.querySelector('canvas').journeySnapshot
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
  const assert = (value, label) => { if (!value) throw Error(label) }
  const wait = async fn => {
    const end = performance.now() + 9000
    while (!fn() && performance.now() < end) await pause(25)
    assert(fn(), 'Timeout')
  }
  await wait(() => read()?.explore.phase === 'travel')
  const url = performance.getEntriesByType('resource').find(e => e.name.includes('@react-three_fiber.js?v=')).name
  const fiber = await import(url), state = [...fiber._roots.values()][0].store.getState(), scene = state.scene
  const rings = scene.getObjectByName('saturn-rings'), meshes = rings.children
  const shell = scene.getObjectByName('saturn-cloud-shell'), bases = [.45, .86, .7]
  const resourceIds = meshes.map(mesh => [mesh.geometry.uuid, mesh.material.map.uuid])
  const sameResources = () => JSON.stringify(resourceIds) === JSON.stringify(meshes.map(mesh => [mesh.geometry.uuid, mesh.material.map.uuid]))
  const opacities = () => meshes.map(mesh => mesh.material.opacity)
  const go = async value => {
    const p = Math.round(value * 24000) / 24000
    scrollTo(0, Math.round(value * 24000)); await wait(() => read().current === p && read().target === p)
    await pause(60); return structuredClone({ ...read(), ringOpacities: opacities() })
  }
  const samePose = (a, b) => ['camera', 'cameraQuaternion', 'ship', 'shipQuaternion']
    .every(key => a[key].every((value, index) => Math.abs(value - b[key][index]) < 1e-6))
  const checks = []
  assert(meshes.length === 3 && rings.rotation.z === .35, 'Original three bands and tilt')
  meshes.forEach((mesh, i) => {
    const map = mesh.material.map, expected = [[6.5, 7.3], [7.3, 9.35], [9.75, 11.5]][i]
    assert(map.isDataTexture && map.image.width === 1024 && map.image.height === 1 && map.colorSpace === 'srgb', 'Local 1D map ' + i)
    assert(map.generateMipmaps && mesh.material.side === 2 && !mesh.material.depthWrite && mesh.material.roughness === 1, 'Filtered double-sided material ' + i)
    assert(mesh.geometry.parameters.innerRadius === expected[0] && mesh.geometry.parameters.outerRadius === expected[1]
      && mesh.geometry.parameters.thetaSegments === 96, 'Original envelope ' + i)
    const colors = new Set(), alphas = new Set(), pixels = map.image.data
    for (let j = 32; j < 992; j++) { colors.add(pixels[j * 4]); alphas.add(pixels[j * 4 + 3]) }
    assert(colors.size > 40 && alphas.size > 40 && pixels[3] === 0 && pixels.at(-1) === 0, 'Grain and soft alpha edges ' + i)
  })
  assert(document.querySelectorAll('canvas').length === 1 && !document.querySelector('vite-error-overlay'), 'Canvas / overlay')
  checks.push('three-local-mipped-radial-rgba-maps-preserve-band-envelope-gap-tilt-and-double-sided-materials')

  const values = [.5264, .59, .61, .635, .658, .685, .7, .799, .98, 1], samples = []
  for (const value of values) {
    const sample = await go(value); samples.push(sample)
    assert(meshes.every((mesh, i) => Math.abs(mesh.material.opacity - bases[i] * shell.material.opacity) < 1e-9), 'Body/rings synchronized ' + value)
  }
  const stopped = read(); await pause(450); assert(samePose(stopped, read()), 'Pause moved')
  for (let i = values.length - 1; i >= 0; i--) {
    const sample = await go(values[i])
    assert(samePose(samples[i], sample) && JSON.stringify(sample.ringOpacities) === JSON.stringify(samples[i].ringOpacities), 'Reverse ' + i)
  }
  assert(sameResources(), 'Resources regenerated during travel')
  checks.push('ten-forward-reverse-poses-pause-and-identical-body-ring-fades-with-stable-resources')

  const saved = await go(.658), savedY = scrollY, opener = document.querySelector('#explore-planet')
  opener.focus(); opener.click()
  await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  const choose = id => document.querySelector(`[data-info=${id}]`).click()
  const button = label => [...document.querySelectorAll('.explore-panel button')].find(element => element.textContent.trim() === label)
  choose('saturn-rings'); await wait(() => read().explore.selectedHotspot === 'saturn-rings' && !read().explore.focusing)
  assert(meshes.every((mesh, i) => mesh.material.opacity === bases[i] && mesh.material.emissiveIntensity === .3), 'Selected rings')
  assert(!document.querySelector('[data-hotspot=saturn-rings]').hidden, 'Ring marker visible')
  choose('saturn-body'); await wait(() => read().saturnBodyHighlight && !read().explore.focusing)
  assert(meshes.every(mesh => mesh.material.emissiveIntensity === 0), 'Body view clears ring highlight')
  choose('saturn-rings'); choose('saturn-body'); choose('saturn-rings')
  await wait(() => read().explore.selectedHotspot === 'saturn-rings' && !read().explore.focusing)
  for (let i = 0; i < 14; i++) button('มองลง').click()
  for (let i = 0; i < 30; i++) button('ซูมเข้า').click()
  await pause(80)
  const normal = state.camera.position.clone().set(0, 1, 0).applyQuaternion(rings.getWorldQuaternion(rings.quaternion.clone()))
  const center = rings.getWorldPosition(state.camera.position.clone().set(0, 0, 0))
  const underside = normal.dot(state.camera.position.clone().sub(center))
  assert(underside < 0 && read().explore.orbit.distance === 14 && meshes.every(mesh => mesh.material.side === 2), 'Safe underside view outside ring envelope')
  button('คืนมุมเริ่มต้น').click(); await pause(80)
  assert(read().explore.selectedHotspot === null && read().explore.orbit.distance === 26 && !read().saturnBodyHighlight, 'Reset')
  assert(sameResources(), 'Resources regenerated during selection/rotation/zoom/reset')
  document.querySelector('.return-button').click()
  await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
  await pause(220)
  assert(samePose(saved, read()) && scrollY === savedY && document.activeElement === opener, 'Exact exit pose/scroll/focus')
  assert(JSON.stringify(saved.ringOpacities) === JSON.stringify(opacities()) && read().explore.selectedHotspot === null, 'Exact exit opacity/reset')
  checks.push('rings-body-rapid-selection-safe-underside-min-zoom-reset-and-exact-exit-restoration')

  await go(1)
  assert(read().overview.visible && read().planets.every(planet => planet.visible)
    && document.querySelector('.overview-labels').children.length === 8, 'Overview all eight stops')
  assert(meshes.every((mesh, i) => mesh.material.opacity === bases[i]) && sameResources(), 'Overview preserves ring maps')
  document.querySelector('.overview-panel [data-destination=saturn]').click()
  await wait(() => read().current === .658 && read().target === .658)
  await pause(60)
  assert(read().planets.filter(planet => planet.visible).map(planet => planet.id).join() === 'saturn', 'Saturn jump')
  await go(1); document.querySelector('.overview-panel [data-replay]').click()
  await wait(() => read().current === 0 && read().target === 0 && !read().overview.visible
    && meshes.every(mesh => mesh.material.opacity === 0) && read().planets.every(planet => !planet.visible))
  assert(scrollY === 0 && sameResources(), 'Replay retains resource objects and hides rings')
  checks.push('overview-eight-stops-ring-maps-return-to-saturn-and-rendered-replay-reset')
  await go(.658)
  return { passed: true, checks, viewport: [innerWidth, innerHeight], underside,
    ringMaps: meshes.map(mesh => ({ size: [mesh.material.map.image.width, mesh.material.map.image.height],
      bytes: mesh.material.map.image.data.length, mips: mesh.material.map.generateMipmaps, colorSpace: mesh.material.map.colorSpace })),
    poseSamples: samples.map(sample => ({ p: sample.current, camera: sample.camera, ringOpacities: sample.ringOpacities })) }
})().then(result => { window.__s09kResult = result })
  .catch(error => { window.__s09kResult = { passed: false, error: String(error), snapshot: document.querySelector('canvas')?.journeySnapshot } });
'started'
