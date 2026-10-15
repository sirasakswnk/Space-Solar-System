window.__s09hFallback = { status: 'running' };
(async () => {
  const read = () => document.querySelector('canvas')?.journeySnapshot
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
  const assert = (value, label) => { if (!value) throw Error(label) }
  const wait = async fn => {
    const end = performance.now() + 9000
    while (!fn() && performance.now() < end) await pause(25)
    assert(fn(), 'Timeout')
  }
  await wait(() => read()?.uranus?.texture === 'fallback')
  const url = performance.getEntriesByType('resource').find(e => e.name.includes('@react-three_fiber.js?v=')).name
  const fiber = await import(url), scene = [...fiber._roots.values()][0].store.getState().scene
  const shell = scene.getObjectByName('uranus-cloud-shell')
  assert(shell.material.map === null && document.querySelectorAll('canvas').length === 1 && !document.querySelector('vite-error-overlay'), 'Fallback canvas and plain sphere')
  scrollTo(0, 19176)
  await wait(() => read().current === .799 && read().current === read().target)
  await pause(50)
  const saved = read(), savedY = scrollY, opener = document.querySelector('#explore-planet')
  opener.focus(); opener.click()
  await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  document.querySelector('[data-info=uranus-axis]').click()
  await wait(() => read().axisVisible && !read().explore.focusing)
  document.querySelector('[data-info=uranus-atmosphere]').click()
  await wait(() => read().uranusAtmosphereHighlight && !read().explore.focusing)
  assert(read().axisVisible && shell.material.opacity === 1 && shell.rotation.z === 97.77 * Math.PI / 180, 'Fallback both views and aligned shell')
  document.querySelector('[data-axis-toggle]').click(); await pause(50)
  assert(!read().axisVisible && read().uranusAtmosphereHighlight, 'Fallback axis toggle independent of selection')
  assert(read().uranus.texture === 'fallback' && read().current === saved.current, 'Fallback exploration usable')
  document.querySelector('.return-button').click()
  await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
  await pause(220)
  assert(['camera', 'cameraQuaternion'].every(key => saved[key].every((v, i) => Math.abs(v - read()[key][i]) < 1e-6)), 'Fallback restores pose')
  assert(scrollY === savedY && document.activeElement === opener && !read().axisVisible && !read().uranusAtmosphereHighlight, 'Fallback restores scroll/focus/selection')
  return { passed: true, checks: ['aborted-map-plain-blue-green-sphere', 'fallback-axis-atmosphere-and-independent-toggle', 'fallback-return-restores-pose-scroll-focus'], uranus: read().uranus }
})().then(result => { window.__s09hFallback = result })
  .catch(error => { window.__s09hFallback = { passed: false, error: String(error), snapshot: document.querySelector('canvas')?.journeySnapshot } });
'started'
