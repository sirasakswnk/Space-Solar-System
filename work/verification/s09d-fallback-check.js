window.__s09dFallback = { status: 'running' };
(async () => {
  const read = () => document.querySelector('canvas')?.journeySnapshot
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
  const assert = (value, label) => { if (!value) throw Error(label) }
  const wait = async fn => {
    const end = performance.now() + 9000
    while (!fn() && performance.now() < end) await pause(25)
    assert(fn(), 'Timeout')
  }
  await wait(() => read()?.venus?.texture === 'fallback')
  const url = performance.getEntriesByType('resource').find(e => e.name.includes('@react-three_fiber.js?v=')).name
  const fiber = await import(url), scene = [...fiber._roots.values()][0].store.getState().scene
  const shell = scene.getObjectByName('venus-cloud-shell'), rim = scene.getObjectByName('venus-atmosphere-rim')
  assert(shell.material.map === null && shell.material.alphaMap === null, 'Fallback uses closed color shell')
  assert(document.querySelectorAll('canvas').length === 1 && !document.querySelector('vite-error-overlay'), 'Fallback canvas')
  scrollTo(0, 6917)
  await wait(() => read().current === 6917 / 24000 && read().current === read().target)
  await pause(50)
  const saved = read(), savedY = scrollY, opener = document.querySelector('#explore-planet')
  opener.focus(); opener.click()
  await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  document.querySelector('[data-info=venus-clouds]').click()
  await wait(() => read().cloudHighlight && !read().explore.focusing)
  document.querySelector('[data-info=venus-atmosphere]').click()
  await wait(() => read().explore.selectedHotspot === 'venus-atmosphere' && !read().explore.focusing)
  assert(rim.material.uniforms.strength.value === .34 && shell.material.opacity === 1 && shell.children.length === 0, 'Fallback atmosphere selection keeps closed shell')
  assert(read().venus.texture === 'fallback' && read().current === saved.current, 'Fallback exploration is usable')
  document.querySelector('.return-button').click()
  await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
  await pause(220)
  assert(['camera', 'cameraQuaternion'].every(key => saved[key].every((v, i) => Math.abs(v - read()[key][i]) < 1e-6)), 'Fallback restores pose')
  assert(scrollY === savedY && document.activeElement === opener && !read().cloudHighlight && rim.material.uniforms.strength.value === .18, 'Fallback restores scroll/focus/visual selection')
  return { passed: true, checks: ['aborted-map-closed-tan-shell', 'fallback-both-hotspots-and-applied-rim', 'fallback-return-restores-pose-scroll-focus'], venus: read().venus }
})().then(result => { window.__s09dFallback = result })
  .catch(error => { window.__s09dFallback = { passed: false, error: String(error), snapshot: document.querySelector('canvas')?.journeySnapshot } });
'started'
