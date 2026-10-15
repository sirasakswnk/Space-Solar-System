window.__s08Result = { status: 'running' };
(async () => {
  const read = () => document.querySelector('canvas')?.journeySnapshot
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
  const checks = []
  const assert = (value, label) => { if (!value) throw new Error(label + ': ' + JSON.stringify(read())) }
  const wait = async predicate => {
    const end = performance.now() + 10000
    while (!predicate() && performance.now() < end) await pause(25)
    assert(predicate(), 'Timeout')
  }
  await wait(() => !!read())
  const samePose = (a, b) => ['camera','cameraQuaternion','ship','shipQuaternion'].every(k => a[k].every((v,i) => Math.abs(v-b[k][i])<1e-6))
  const settled = async () => { await wait(() => read().current === read().target && read().explore.phase === 'travel' && !document.querySelector('dialog').open); await pause(50) }
  const menu = context => document.querySelector(`[data-navigation=${context}]`)
  const jump = async (id, context='travel') => {
    menu(context).closest('details')?.setAttribute('open','')
    menu(context).querySelector(`[data-destination=${id}]`).click()
    await settled()
  }
  const go = async p => { scrollTo(0,Math.round(p*24000)); await wait(() => read().current === read().target && Math.abs(read().target-Math.round(p*24000)/24000)<1e-8); await pause(50) }
  const open = async () => {
    const button=document.querySelector('#explore-planet')
    assert(!button.hidden && !button.disabled, 'Unavailable explore')
    button.focus(); button.click()
    await wait(() => read().explore.phase==='exploring' && !document.querySelector('[data-info]').disabled)
  }
  const replay = async context => {
    menu(context).closest('details')?.setAttribute('open','')
    menu(context).querySelector('[data-replay]').click()
    await settled()
    assert(read().current===0 && read().target===0 && scrollY===0, 'Replay progress')
    assert(read().ship.join() === '0,0.65,0' && read().engine.engine===0 && read().engine.plume===0, 'Replay launch')
    assert(!read().axisVisible && !read().routeComparisonVisible && !read().stormHighlight, 'Replay extras')
    assert(read().explore.selectedHotspot===null && !read().explore.focusing && read().explore.pendingDestination===null && !read().overview.visible, 'Replay state')
    assert(document.activeElement.id === 'site-title' && document.body.style.overflow!== 'hidden', 'Replay focus/scroll lock')
  }
  assert(document.querySelectorAll('canvas').length===1 && !document.querySelector('vite-error-overlay'), 'Canvas / overlay')
  const start=read()
  checks.push('one-canvas-and-page')
  const stops=[['mercury',.17766],['venus',.288204],['mars',.3948],['jupiter',.5264],['saturn',.658],['uranus',.799],['neptune',.93]]
  const poses={}
  for (const [id,p] of stops) {
    await jump(id)
    assert(scrollY===Math.round(p*24000) && read().target===scrollY/24000, 'Destination '+id)
    assert(document.querySelector('#explore-planet').textContent===`สำรวจ ${id[0].toUpperCase()+id.slice(1)}` && !document.querySelector('#explore-planet').disabled, 'Explore button '+id)
    assert(!read().overview.visible && document.querySelector('.overview-panel').hidden, 'Early overview')
    poses[id]=read()
  }
  checks.push('seven-forward-destinations')
  for (const [id] of [...stops].reverse()) { await jump(id); assert(samePose(poses[id],read()), 'Reverse pose '+id) }
  checks.push('seven-reverse-destinations')
  menu('travel').closest('details').open=true
  for (const id of ['mars','mercury','venus','neptune']) menu('travel').querySelector(`[data-destination=${id}]`).click()
  await settled(); assert(read().target===.93, 'Latest travel destination')
  checks.push('latest-travel-request')
  await go(1)
  assert(read().overview.visible && read().overview.blend===1 && !document.querySelector('.overview-panel').hidden && !document.querySelector('.overview-labels').hidden, 'Final overview')
  const labels=[...document.querySelector('.overview-labels').children].map(el=>({name:el.textContent,rect:el.getBoundingClientRect().toJSON()}))
  const panel=document.querySelector('.overview-panel').getBoundingClientRect()
  for (const {rect} of labels) assert(rect.left>0 && rect.right<panel.left-8 && rect.top>240 && rect.bottom<550, 'Overview framing')
  for (let i=0;i<labels.length;i++) for(let j=i+1;j<labels.length;j++) {
    const a=labels[i].rect,b=labels[j].rect
    assert(a.right<=b.left || b.right<=a.left || a.bottom<=b.top || b.bottom<=a.top, 'Labels overlap')
  }
  checks.push('overview-eight-labels-framing')
  await go(.97); assert(!read().overview.visible && read().overview.blend>0 && read().overview.blend<1, 'Overview reverse transition')
  await go(.93); assert(samePose(poses.neptune,read()), 'Overview reverse exact pose')
  checks.push('reverse-overview-to-neptune')
  await go(1)
  document.querySelector('[data-map-destination=mars]').click(); await settled()
  assert(samePose(poses.mars,read()), 'Map destination')
  checks.push('map-label-destination')
  await go(1); await replay('overview'); assert(samePose(start,read()), 'Overview replay initial pose')
  checks.push('overview-replay')
  await jump('uranus'); await open()
  document.querySelector('[data-info=uranus-axis]').click()
  await wait(() => read().axisVisible && !read().explore.focusing)
  menu('explore').closest('details').open=true
  menu('explore').querySelector('[data-destination=mars]').click()
  menu('explore').querySelector('[data-destination=saturn]').click()
  await settled()
  assert(read().target===.658 && !read().axisVisible && read().explore.selectedHotspot===null && document.activeElement.closest('.travel-navigation'), 'Latest exit destination / clean focus')
  await open()
  assert(read().explore.planet==='saturn', 'Queued Saturn destination')
  document.querySelector('[data-info=saturn-rings]').click()
  await wait(() => !read().explore.focusing)
  await replay('explore'); assert(samePose(start,read()), 'Modal replay pose')
  checks.push('latest-exit-destination-and-modal-replay')
  await jump('neptune'); await open()
  document.querySelector('[data-info=neptune-route]').click()
  await wait(() => read().routeComparisonVisible && !read().explore.focusing)
  await replay('explore'); assert(samePose(start,read()), 'Route replay pose')
  checks.push('neptune-comparison-replay')
  await jump('mercury')
  document.querySelector('#explore-planet').click()
  await wait(() => read().explore.phase==='entering' && document.querySelector('dialog').open)
  await replay('explore')
  checks.push('replay-during-entry')
  await go(.08*.17766); assert(read().ship[1]===.65 && read().engine.engine>0, 'Mapped ignition')
  await replay('travel'); assert(samePose(start,read()), 'Travel replay pose')
  checks.push('mapped-ignition-and-travel-replay')
  return { passed:true, checks, labels, final:read() }
})().then(result => { window.__s08Result=result }).catch(error => { window.__s08Result={passed:false,error:String(error),snapshot:document.querySelector('canvas')?.journeySnapshot} });
'started'
