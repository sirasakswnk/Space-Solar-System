window.__s09eFallback = { status: 'running' };
(async () => {
  const read = () => document.querySelector('canvas')?.journeySnapshot
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
  const assert = (value, label) => { if (!value) throw Error(label) }
  const wait = async fn => {
    const end = performance.now() + 9000
    while (!fn() && performance.now() < end) await pause(25)
    assert(fn(), 'Timeout')
  }
  await wait(() => read()?.mars?.texture === 'fallback')
  const url = performance.getEntriesByType('resource').find(e => e.name.includes('@react-three_fiber.js?v=')).name
  const fiber = await import(url), scene = [...fiber._roots.values()][0].store.getState().scene
  const surface = scene.getObjectByName('mars-surface')
  assert(surface.material.map === null, 'Fallback plain color surface')
  assert(document.querySelectorAll('canvas').length === 1 && !document.querySelector('vite-error-overlay'), 'Fallback canvas')
  scrollTo(0, 9475)
  await wait(() => read().current === 9475 / 24000 && read().current === read().target)
  await pause(50)
  const saved = read(), savedY = scrollY, opener = document.querySelector('#explore-planet')
  opener.focus(); opener.click()
  await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  document.querySelector('[data-info=mars-terrain]').click()
  await wait(() => read().terrainHighlight && !read().explore.focusing)
  document.querySelector('[data-info=mars-polar]').click()
  await wait(() => read().polarHighlight && !read().explore.focusing)
  assert(surface.material.opacity === 1 && !read().terrainHighlight, 'Fallback exclusive selection and opaque surface')
  assert(read().mars.texture === 'fallback' && read().current === saved.current, 'Fallback exploration usable')
  document.querySelector('.return-button').click()
  await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
  await pause(220)
  assert(['camera', 'cameraQuaternion'].every(key => saved[key].every((v, i) => Math.abs(v - read()[key][i]) < 1e-6)), 'Fallback restores pose')
  assert(scrollY === savedY && document.activeElement === opener && !read().terrainHighlight && !read().polarHighlight, 'Fallback restores scroll/focus/selection')
  return { passed: true, checks: ['aborted-map-plain-color-sphere', 'fallback-both-hotspots-and-exclusive-outlines', 'fallback-return-restores-pose-scroll-focus'], mars: read().mars }
})().then(result => { window.__s09eFallback = result })
  .catch(error => { window.__s09eFallback = { passed: false, error: String(error), snapshot: document.querySelector('canvas')?.journeySnapshot } });
'started'
