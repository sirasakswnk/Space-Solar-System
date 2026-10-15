window.__s09cFallback = { status: 'running' };
(async () => {
  const read = () => document.querySelector('canvas')?.journeySnapshot
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
  const assert = (condition, label) => { if (!condition) throw Error(label) }
  const wait = async fn => {
    const end = performance.now() + 9000
    while (!fn() && performance.now() < end) await pause(25)
    assert(fn(), 'Timeout')
  }
  await wait(() => read()?.mercury?.texture === 'fallback')
  assert(document.querySelectorAll('canvas').length === 1 && !document.querySelector('vite-error-overlay'), 'Fallback canvas')
  scrollTo(0, 4264)
  await wait(() => read().current === 4264 / 24000 && read().current === read().target)
  await pause(50)
  const saved = read(), savedY = scrollY, opener = document.querySelector('#explore-planet')
  opener.focus(); opener.click()
  await wait(() => read().explore.phase === 'exploring' && !document.querySelector('[data-info]').disabled)
  document.querySelector('[data-info=impact-craters]').click()
  await wait(() => read().explore.selectedHotspot === 'impact-craters' && !read().explore.focusing && read().craterHighlight)
  assert(read().mercury.texture === 'fallback' && read().current === saved.current, 'Fallback still usable')
  document.querySelector('.return-button').click()
  await wait(() => read().explore.phase === 'travel' && !document.querySelector('dialog').open)
  await pause(220)
  assert(['camera', 'cameraQuaternion'].every(key => saved[key].every((v, i) => Math.abs(v - read()[key][i]) < 1e-6)), 'Fallback pose restored')
  assert(scrollY === savedY && document.activeElement === opener, 'Fallback scroll and focus restored')
  return { passed: true, checks: ['aborted-map-plain-sphere-no-overlay', 'fallback-explore-select-and-return'], mercury: read().mercury, final: read() }
})().then(result => { window.__s09cFallback = result })
  .catch(error => { window.__s09cFallback = { passed: false, error: String(error), snapshot: document.querySelector('canvas')?.journeySnapshot } });
'started'
