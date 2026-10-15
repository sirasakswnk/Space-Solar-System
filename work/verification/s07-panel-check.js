window.__s07PanelResult={status:'running'};
(async()=>{
  const read=()=>document.querySelector('canvas').journeySnapshot
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
  const assert=(value,label)=>{if(!value)throw new Error(label)}
  const wait=async predicate=>{const until=performance.now()+9000;while(!predicate()&&performance.now()<until)await pause(25);assert(predicate(),'Timeout')}
  const go=async p=>{scrollTo(0,p*22000);await wait(()=>read().current===p&&read().target===p)}
  const open=async()=>{document.querySelector('#explore-planet').focus();document.querySelector('#explore-planet').click();await wait(()=>read().explore.phase==='exploring'&&!document.querySelector('[data-info]').disabled)}
  const close=async()=>{document.querySelector('.return-button').click();await wait(()=>read().explore.phase==='travel'&&!document.querySelector('dialog').open);await pause(220)}
  if(read().explore.phase!=='travel')await close()
  await go(.85);await open()
  const panel=document.querySelector('.explore-panel')
  assert(panel.scrollTop===0,'Uranus panel not at top')
  document.querySelector('[data-info=uranus-axis]').click()
  await wait(()=>!read().explore.focusing&&read().axisVisible)
  panel.scrollTop=panel.scrollHeight
  assert(panel.scrollTop>0,'Fixture did not scroll panel')
  await close();await go(1)
  const before=read()
  await open()
  const heading=document.querySelector('#explore-title').getBoundingClientRect(),bounds=panel.getBoundingClientRect()
  assert(panel.scrollTop===0&&heading.top>=bounds.top&&heading.bottom<bounds.bottom,'Neptune inherited scroll')
  assert(bounds.top>document.querySelector('.journey-meter').getBoundingClientRect().bottom,'Panel overlaps meter')
  document.querySelector('[data-info=neptune-atmosphere]').click()
  await wait(()=>!read().explore.focusing)
  assert(read().explore.orbit.distance===10&&!read().routeComparisonVisible,'Close view not restored')
  document.querySelector('[data-info=neptune-route]').click()
  await wait(()=>!read().explore.focusing&&read().routeComparisonVisible)
  assert(read().explore.orbit.distance===26&&document.querySelectorAll('.route-comparison-legend li').length===8,'Comparison failed')
  await close()
  const restored=['camera','cameraQuaternion','ship','shipQuaternion'].every(k=>before[k].every((v,i)=>Math.abs(v-read()[k][i])<1e-6))
  assert(restored&&scrollY===22000&&document.activeElement.id==='explore-planet'&&!read().routeComparisonVisible&&!read().axisVisible,'Wide exit restoration failed')
  await open();document.querySelector('[data-info=neptune-route]').click();await wait(()=>!read().explore.focusing&&read().routeComparisonVisible)
  window.__s07FinalSaved=before
  return {passed:true,checks:['panel-scroll-reset-between-planets','heading-and-meter-no-overlap','close-and-comparison-views','wide-exit-pose-scroll-focus'],viewport:[innerWidth,innerHeight],panelScroll:panel.scrollTop}
})().then(result=>{window.__s07PanelResult=result}).catch(error=>{window.__s07PanelResult={passed:false,error:String(error)}});
'started'
