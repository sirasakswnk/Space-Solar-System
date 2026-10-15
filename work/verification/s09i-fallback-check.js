window.__s09iFallback = { status: 'running' };
(async () => {
  const read = () => document.querySelector('canvas')?.journeySnapshot
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
  const assert = (value, label) => { if (!value) throw Error(label) }
  const wait = async fn => {
    const end = performance.now() + 9000
    while (!fn() && performance.now() < end) await pause(25)
    assert(fn(), 'Timeout')
  }
  await wait(() => read()?.neptune?.texture === 'fallback')
  const url = performance.getEntriesByType('resource').find(e => e.name.includes('@react-three_fiber.js?v=')).name
  const fiber = await import(url), scene = [...fiber._roots.values()][0].store.getState().scene
  const shell = scene.getObjectByName('neptune-cloud-shell'), route = scene.getObjectByName('neptune-route-comparison')
  assert(shell.material.map === null && document.querySelectorAll('canvas').length === 1 && !document.querySelector('vite-error-overlay'), 'Fallback canvas and plain sphere')
  scrollTo(0, 22320)
  await wait(() => read().current === .93 && read().current === read().target)
  await pause(50)
  const saved = read(), savedY = scrollY, opener = document.querySelector('#explore-planet')
  opener.focus(); opener.click()
  await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  document.querySelector('[data-info=neptune-route]').click()
  await wait(() => read().routeComparisonVisible && !read().explore.focusing)
  assert(route.children.length === 9 && document.querySelectorAll('.route-comparison-legend li').length === 8, 'Fallback eight-stop route')
  document.querySelector('[data-info=neptune-atmosphere]').click()
  await wait(() => read().neptuneAtmosphereHighlight && !read().explore.focusing)
  assert(!read().routeComparisonVisible && shell.material.opacity === 1, 'Fallback close view')
  assert(read().neptune.texture === 'fallback' && read().current === saved.current, 'Fallback exploration usable')
  document.querySelector('.return-button').click()
  await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
  await pause(220)
  assert(['camera', 'cameraQuaternion'].every(key => saved[key].every((v, i) => Math.abs(v - read()[key][i]) < 1e-6)), 'Fallback restores pose')
  assert(scrollY === savedY && document.activeElement === opener && !read().routeComparisonVisible && !read().neptuneAtmosphereHighlight, 'Fallback restores scroll/focus/selection')
  return { passed: true, checks: ['aborted-map-plain-blue-sphere', 'fallback-eight-stop-route-and-close-view', 'fallback-return-restores-pose-scroll-focus'], neptune: read().neptune }
})().then(result => { window.__s09iFallback = result })
  .catch(error => { window.__s09iFallback = { passed: false, error: String(error), snapshot: document.querySelector('canvas')?.journeySnapshot } });
'started'
