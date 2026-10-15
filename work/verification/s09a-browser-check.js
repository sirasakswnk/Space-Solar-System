window.__s09aResult = { status: 'running' };
(async () => {
  const read=()=>document.querySelector('canvas')?.journeySnapshot
  const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms))
  const assert=(value,label)=>{if(!value) throw Error(label+': '+JSON.stringify(read()))}
  const wait=async predicate=>{
    const end=performance.now()+9000
    while(!predicate()&&performance.now()<end) await pause(25)
    assert(predicate(),'Timeout')
  }
  await wait(()=>!!read()?.shipAppearance)
  const checks=[], samples=[]
  const go=async p=>{
    const expected=Math.round(p*24000)/24000
    scrollTo(0,Math.round(p*24000))
    await wait(()=>read().current===expected&&read().target===expected)
    await pause(50)
    return read()
  }
  const same=(a,b)=>['camera','cameraQuaternion','ship','shipQuaternion'].every(k=>a[k].every((v,i)=>Math.abs(v-b[k][i])<1e-6))
  await go(0)
  const initial=read()
  assert(document.querySelectorAll('canvas').length===1&&!document.querySelector('vite-error-overlay'),'Canvas / overlay')
  assert(initial.shipAppearance.radius<=.7&&initial.shipAppearance.parts===18,'Rigid hull exceeds safe envelope')
  assert(initial.launch.armExtension===1&&initial.engine.engine===0&&!initial.engine.exhaustVisible,'Initial arm/engine')
  checks.push('actual-hull-envelope-and-start')
  const p=[0,.08,.10,.18,.28,.46,1].map(local=>local*.17766)
  for(const progress of p) samples.push(await go(progress))
  assert(samples[1].ship[1]===.65&&samples[1].launch.armExtension<1&&samples[1].launch.armExtension>.25&&samples[1].engine.engine>0,'Ignition')
  assert(samples[3].ship[1]>.65&&samples[3].launch.armExtension===.25&&samples[3].engine.plume>0,'Lift-off')
  assert(samples[5].launch.cloudOpacity===0&&samples[5].launch.sky==='080e1b','Atmosphere transition')
  assert(samples[6].launch.armExtension===.25&&samples[6].engine.plume===0&&!samples[6].engine.exhaustVisible,'Space engine state')
  checks.push('ignition-liftoff-atmosphere-space')
  for(let i=p.length-1;i>=0;i--) {
    const current=await go(p[i])
    assert(same(samples[i],current),'Reverse pose '+i)
    assert(JSON.stringify(samples[i].launch)===JSON.stringify(current.launch),'Reverse launch '+i)
    assert(JSON.stringify(samples[i].engine)===JSON.stringify(current.engine),'Reverse engine '+i)
  }
  checks.push('reverse-same-pose-arm-and-effects')
  await go(.17766)
  const saved=read(), savedScroll=scrollY
  document.querySelector('#explore-planet').focus()
  document.querySelector('#explore-planet').click()
  await wait(()=>read().explore.phase==='exploring'&&!document.querySelector('[data-info]').disabled)
  assert(read().explore.planet==='mercury','Explore regression')
  document.querySelector('.return-button').click()
  await wait(()=>read().explore.phase==='travel'&&!document.querySelector('dialog').open)
  await pause(220)
  assert(same(saved,read())&&scrollY===savedScroll&&document.activeElement.id==='explore-planet','Restore regression')
  checks.push('mercury-enter-exit-restoration')
  await go(.93);await go(1)
  assert(read().overview.visible,'Overview regression')
  document.querySelector('[data-navigation=overview] [data-replay]').click()
  await wait(()=>read().current===0&&read().target===0&&scrollY===0)
  await pause(60)
  assert(same(initial,read())&&read().launch.armExtension===1&&read().engine.engine===0&&!read().engine.exhaustVisible,'Replay regression')
  assert(document.activeElement.id==='site-title'&&!read().overview.visible,'Replay UI')
  checks.push('outer-destination-overview-replay')
  const title=document.querySelector('.intro').getBoundingClientRect(), nav=document.querySelector('.travel-navigation').getBoundingClientRect()
  assert(title.bottom<nav.top&&nav.bottom<250,'Intro/nav overlap')
  checks.push('controls-remain-readable')
  return {passed:true,checks,hull:read().shipAppearance,samples:samples.map(s=>({p:s.current,launch:s.launch,engine:s.engine,ship:s.ship})),final:read()}
})().then(result=>{window.__s09aResult=result}).catch(error=>{window.__s09aResult={passed:false,error:String(error),snapshot:document.querySelector('canvas')?.journeySnapshot}});
'started'
