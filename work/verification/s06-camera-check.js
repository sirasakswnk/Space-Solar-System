window.__s06CameraResult = { status: 'running' };
(async () => {
  const read = () => document.querySelector('canvas')?.journeySnapshot
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
  const assert = (value, label) => { if (!value) throw new Error(label) }
  const wait = async predicate => {
    const until = performance.now() + 9000
    while (!predicate() && performance.now() < until) await pause(25)
    assert(predicate(), 'Timeout: ' + JSON.stringify(read()))
  }
  const go = async p => { scrollTo(0, p*16000); await wait(() => read()?.current===p && read().target===p); await pause(50) }
  const same = (a,b) => ['camera','cameraQuaternion','ship','shipQuaternion'].every(k => a[k].every((v,i) => Math.abs(v-b[k][i])<1e-6))
  await go(0)
  await go(.8)
  const jupiter = read()
  await go(1)
  const saturn = read()
  assert(saturn.camera.join()==='32,30,-212', 'Wide camera not applied')
  document.querySelector('#explore-planet').focus()
  document.querySelector('#explore-planet').click()
  await wait(() => read().explore.phase==='exploring' && !document.querySelector('[data-info]').disabled)
  const focused = []
  for (const id of ['saturn-rings','saturn-body']) {
    document.querySelector(`[data-info=${id}]`).click()
    await wait(() => !read().explore.focusing && read().explore.selectedHotspot===id)
    focused.push({...read().explore.orbit})
    assert(read().current===1 && scrollY===16000, 'Focus changed scroll')
  }
  assert(focused[0].pitch>focused[1].pitch && focused[0].distance>focused[1].distance, 'Ring/body views failed')
  const buttons=[...document.querySelector('dialog').querySelectorAll('button')]
  for (let i=0;i<17;i++) buttons.find(b=>b.textContent==='หมุนขวา').click()
  for (let i=0;i<10;i++) buttons.find(b=>b.textContent==='ซูมเข้า').click()
  await pause(50)
  assert(read().explore.orbit.distance===14, 'Unsafe zoom bound')
  document.querySelector('.return-button').click()
  await wait(() => read().explore.phase==='travel' && !document.querySelector('dialog').open)
  assert(same(saturn,read()) && scrollY===16000 && document.activeElement.id==='explore-planet', 'Wide camera restoration failed')
  // Match the existing 180 ms post-modal wheel/scroll cooldown.
  await pause(220)
  await go(.8)
  assert(same(jupiter,read()), 'Reverse changed Jupiter view')
  await go(1)
  assert(same(saturn,read()), 'Reverse changed Saturn view')
  return {passed:true,checks:['wide-saturn-camera','ring-body-focus-safe-zoom','far-side-exit-pose-scroll-focus','reverse-and-forward-same-views'],viewport:[innerWidth,innerHeight],saturn:read()}
})().then(result => { window.__s06CameraResult=result }).catch(error => { window.__s06CameraResult={passed:false,error:String(error)} });
'started'
