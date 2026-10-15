(async () => {
  const read = () => document.querySelector('canvas')?.journeySnapshot
  const pause = ms => new Promise(resolve => setTimeout(resolve,ms))
  const assert = (value,label) => { if(!value) throw new Error(label+': '+JSON.stringify(read())) }
  const wait = async predicate => {
    const until=performance.now()+9000
    while(!predicate()&&performance.now()<until) await pause(25)
    assert(predicate(),'Timeout')
  }
  await wait(()=>!!read())
  const checks=[]
  const go = async p => { scrollTo(0,p*10000); await wait(()=>Math.abs(read().current-p)<1e-8&&read().current===read().target); await pause(50) }
  const samePose=(a,b)=>['camera','cameraQuaternion','ship','shipQuaternion'].every(k=>a[k].every((v,i)=>Math.abs(v-b[k][i])<1e-6))
  const open=async()=>{
    const button=document.querySelector('#explore-planet')
    assert(!button.hidden&&!button.disabled,'Explore unavailable')
    button.focus();button.click()
    await wait(()=>read().explore.phase==='exploring'&&!document.querySelector('[data-info]').disabled)
    await pause(40)
  }
  const close=async()=>{
    document.querySelector('.return-button').click()
    await wait(()=>read().explore.phase==='travel'&&!document.querySelector('dialog').open)
    await pause(220)
  }
  if(read().explore.phase!=='travel') await close()
  const stops=[
    {id:'mercury',name:'Mercury',p:.45,radius:2.6,center:[0,9,-50],source:'https://science.nasa.gov/mercury/facts/'},
    {id:'venus',name:'Venus',p:.73,radius:3.6,center:[-18,10,-85],source:'https://science.nasa.gov/venus/venus-facts/'},
    {id:'mars',name:'Mars',p:1,radius:3,center:[18,11,-126],source:'https://science.nasa.gov/mars/facts/'},
  ]
  await go(.08*.45)
  assert(read().ship[1]===.65&&read().engine.engine>0,'Ignition/pad regression')
  await go(.45*.45)
  assert(read().launch.cloudOpacity===0&&read().launch.sky==='080e1b','Atmosphere regression')
  checks.push('mapped-ignition-atmosphere')
  const saved=[]
  for(const stop of stops) {
    await go(stop.p)
    const before=read(), scroll=scrollY
    saved.push(before)
    assert(read().explore.phase==='travel'&&!document.querySelector('dialog').open,'Stop auto-opened')
    assert(document.querySelector('#explore-planet').textContent===`สำรวจ ${stop.name}`,'Wrong explore button')
    assert(document.querySelector('.caption>p').textContent.includes(stop.name),'Wrong travel name')
    await open()
    assert(read().explore.planet===stop.id,'Wrong planet model')
    assert(read().planets.filter(p=>p.visible).map(p=>p.id).join()===stop.id,'Other planet visible in exploration')
    assert(document.querySelector('#explore-title').textContent.includes(stop.name),'Stale panel')
    assert(document.querySelector('.source-link').href===stop.source,'Stale source')
    const infos=[...document.querySelectorAll('[data-info]')]
    assert(infos.length===2&&document.querySelectorAll('[data-hotspot]').length===2,'Missing two points')
    for(const info of infos) {
      info.click()
      await wait(()=>!read().explore.focusing&&read().explore.selectedHotspot===info.dataset.info)
      assert(document.querySelector('#hotspot-detail h3')?.textContent===info.textContent.slice(3),'Wrong hotspot content')
      assert(document.querySelector('#hotspot-detail li')&&document.querySelector('.illustration-note'),'Missing details/note')
      const cam=read().camera
      assert(Math.hypot(...cam.map((v,i)=>v-stop.center[i]))>stop.radius,'Focus inside planet')
      assert(read().current===stop.p&&scrollY===scroll,'Focus moved journey')
    }
    // Rotate to the far side and zoom all the way in before restoring travel.
    const buttons=[...document.querySelector('dialog').querySelectorAll('button')]
    for(let i=0;i<17;i++) buttons.find(b=>b.textContent==='หมุนขวา').click()
    for(let i=0;i<10;i++) buttons.find(b=>b.textContent==='ซูมเข้า').click()
    await pause(50)
    await close()
    assert(samePose(before,read())&&scrollY===scroll&&document.activeElement.id==='explore-planet','Exit restoration failed')
    assert(read().explore.selectedHotspot===null,'Selection leaked')
    checks.push(`${stop.id}-two-points-source-focus-restore`)
  }
  for(let i=stops.length-1;i>=0;i--) {
    await go(stops[i].p)
    assert(samePose(saved[i],read()),'Reverse changed pose')
    await open()
    assert(read().explore.planet===stops[i].id&&read().explore.selectedHotspot===null,'Reverse planet data stale')
    await close()
    checks.push(`${stops[i].id}-reverse-reopen`)
  }
  await go(.6)
  assert(document.querySelector('#explore-planet').hidden&&read().explore.phase==='travel','Explore available in transit')
  await go(0)
  assert(read().ship[1]===.65&&read().engine.engine===0&&read().engine.plume===0,'Return to pad failed')
  assert(document.querySelectorAll('canvas').length===1&&!document.querySelector('vite-error-overlay'),'Canvas/overlay error')
  checks.push('transit-no-explore','return-pad-one-canvas')
  // Leave Venus open for native input and screenshots.
  await go(.73); await open()
  window.__s05bSaved={pose:saved[1],scroll:7300}
  return {passed:true,checks,viewport:[innerWidth,innerHeight],browser:navigator.userAgent,stops:saved,exploring:read()}
})()
