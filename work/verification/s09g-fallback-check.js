window.__s09gFallback = { status: 'running' };
(async () => {
  const read = () => document.querySelector('canvas')?.journeySnapshot
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
  const assert = (value, label) => { if (!value) throw Error(label) }
  const wait = async fn => {
    const end = performance.now() + 9000
    while (!fn() && performance.now() < end) await pause(25)
    assert(fn(), 'Timeout')
  }
  await wait(() => read()?.saturn?.texture === 'fallback')
  const url = performance.getEntriesByType('resource').find(e => e.name.includes('@react-three_fiber.js?v=')).name
  const fiber = await import(url), scene = [...fiber._roots.values()][0].store.getState().scene
  const shell = scene.getObjectByName('saturn-cloud-shell'), rings = scene.getObjectByName('saturn-rings')
  assert(shell.material.map === null && document.querySelectorAll('canvas').length === 1 && !document.querySelector('vite-error-overlay'), 'Fallback canvas and plain sphere')
  scrollTo(0, 15792)
  await wait(() => read().current === .658 && read().current === read().target)
  await pause(50)
  const saved = read(), savedY = scrollY, opener = document.querySelector('#explore-planet')
  opener.focus(); opener.click()
  await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  document.querySelector('[data-info=saturn-body]').click()
  await wait(() => read().saturnBodyHighlight && !read().explore.focusing)
  document.querySelector('[data-info=saturn-rings]').click()
  await wait(() => read().explore.selectedHotspot === 'saturn-rings' && !read().explore.focusing)
  assert(!read().saturnBodyHighlight && rings.children.every(m => m.material.emissiveIntensity === .3) && shell.material.opacity === 1, 'Fallback both views')
  assert(read().saturn.texture === 'fallback' && read().current === saved.current, 'Fallback exploration usable')
  document.querySelector('.return-button').click()
  await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
  await pause(220)
  assert(['camera', 'cameraQuaternion'].every(key => saved[key].every((v, i) => Math.abs(v - read()[key][i]) < 1e-6)), 'Fallback restores pose')
  assert(scrollY === savedY && document.activeElement === opener && !read().saturnBodyHighlight && rings.children.every(m => m.material.emissiveIntensity === 0), 'Fallback restores scroll/focus/selection')
  return { passed: true, checks: ['aborted-map-plain-tan-sphere-with-rings', 'fallback-body-and-ring-views', 'fallback-return-restores-pose-scroll-focus'], saturn: read().saturn }
})().then(result => { window.__s09gFallback = result })
  .catch(error => { window.__s09gFallback = { passed: false, error: String(error), snapshot: document.querySelector('canvas')?.journeySnapshot } });
'started'
