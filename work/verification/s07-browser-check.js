window.__s07Result = { status: 'running' };
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
  const go = async p => {
    const pixel=Math.round(p*22000), expected=pixel/22000
    scrollTo(0,pixel)
    await wait(()=>Math.abs(read().current-expected)<1e-8&&read().current===read().target)
    await pause(50)
  }
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
    {id:'mercury',name:'Mercury',p:.189,envelope:2.6,center:[0,9,-50],source:'https://science.nasa.gov/mercury/facts/'},
    {id:'venus',name:'Venus',p:.3066,envelope:3.6,center:[-18,10,-85],source:'https://science.nasa.gov/venus/venus-facts/'},
    {id:'mars',name:'Mars',p:.42,envelope:3,center:[18,11,-126],source:'https://science.nasa.gov/mars/facts/'},
    {id:'jupiter',name:'Jupiter',p:.56,envelope:6,center:[-18,12,-183],source:'https://science.nasa.gov/jupiter/jupiter-facts/'},
    {id:'saturn',name:'Saturn',p:.7,envelope:11.5,center:[22,12,-247],source:'https://science.nasa.gov/saturn/facts/'},
    {id:'uranus',name:'Uranus',p:.85,envelope:4.2,center:[-18,14,-310],source:'https://science.nasa.gov/uranus/facts/'},
    {id:'neptune',name:'Neptune',p:1,envelope:4,center:[18,15,-380],source:'https://science.nasa.gov/neptune/neptune-facts/'},
  ]
  await go(.08*.189)
  assert(read().ship[1]===.65&&read().engine.engine>0,'Ignition regression')
  await go(.46*.189)
  assert(read().launch.cloudOpacity===0&&read().launch.sky==='080e1b','Atmosphere regression')
  checks.push('mapped-launch')
  const saved=[]
  for(const stop of stops) {
    await go(stop.p)
    const before=read(), scroll=scrollY
    saved.push(before)
    assert(read().explore.phase==='travel'&&!document.querySelector('dialog').open,'Auto-opened')
    assert(document.querySelector('#explore-planet').textContent===`สำรวจ ${stop.name}`,'Wrong name')
    await open()
    assert(read().explore.planet===stop.id,'Wrong planet')
    assert(read().planets.filter(p=>p.visible).map(p=>p.id).join()===stop.id,'Other planet visible')
    assert(document.querySelector('#explore-title').textContent.includes(stop.name),'Stale panel')
    assert(document.querySelector('.explore-panel').scrollTop===0,'Panel scroll not reset')
    assert(document.querySelector('.source-link').href===stop.source,'Stale source')
    assert(!read().axisVisible&&!read().routeComparisonVisible,'Extra scene leaked')
    const infos=[...document.querySelectorAll('[data-info]')]
    assert(infos.length===2&&document.querySelectorAll('[data-hotspot]').length===2,'Missing two points')
    const focused=[]
    for(const info of infos) {
      info.click()
      await wait(()=>!read().explore.focusing&&read().explore.selectedHotspot===info.dataset.info)
      assert(document.querySelector('#hotspot-detail h3')?.textContent===info.textContent.slice(3),'Wrong hotspot content')
      assert(document.querySelector('#hotspot-detail li')&&document.querySelector('.illustration-note'),'Missing details/note')
      assert(Math.hypot(...read().camera.map((v,i)=>v-stop.center[i]))>stop.envelope+.1,'Focus inside body/rings')
      assert(read().current===before.current&&scrollY===scroll,'Focus moved journey')
      if(stop.id==='jupiter') assert(read().stormHighlight===(info.dataset.info==='jupiter-storm'),'Storm highlight failed')
      if(info.dataset.info==='uranus-axis') {
        assert(read().axisVisible,'Axis not shown by point')
        const toggle=document.querySelector('[data-axis-toggle]'), pose=read()
        toggle.click(); await pause(60)
        assert(!read().axisVisible&&toggle.getAttribute('aria-pressed')==='false'&&samePose(pose,read()),'Axis toggle off failed')
        toggle.click(); await pause(60)
        assert(read().axisVisible&&toggle.getAttribute('aria-pressed')==='true','Axis toggle on failed')
      }
      if(stop.id==='neptune') {
        assert(read().routeComparisonVisible===(info.dataset.info==='neptune-route'),'Comparison visibility failed')
        if(info.dataset.info==='neptune-route') assert(document.querySelectorAll('.route-comparison-legend li').length===8,'Missing comparison stops')
      }
      focused.push(read().explore.orbit)
    }
    if(stop.id==='saturn') assert(focused[0].distance>focused[1].distance&&focused[0].pitch>focused[1].pitch,'Ring/body view failed')
    if(stop.id==='neptune') assert(focused[1].distance>focused[0].distance,'Close/wide view failed')
    infos[0].click();await pause(80);infos[1].click()
    await wait(()=>!read().explore.focusing&&read().explore.selectedHotspot===infos[1].dataset.info)
    assert(read().explore.orbit.distance===focused[1].distance,'Rapid selection lost final view')
    const buttons=[...document.querySelector('dialog').querySelectorAll('button')]
    if(['uranus','neptune'].includes(stop.id)) {
      buttons.find(b=>b.textContent==='คืนมุมเริ่มต้น').click();await pause(60)
      assert(read().explore.selectedHotspot===null&&!read().axisVisible&&!read().routeComparisonVisible&&read().explore.orbit.distance===13,'Reset leaked extra scene')
    }
    for(let i=0;i<17;i++) buttons.find(b=>b.textContent==='หมุนขวา').click()
    for(let i=0;i<10;i++) buttons.find(b=>b.textContent==='ซูมเข้า').click()
    await pause(50)
    assert(Math.hypot(...read().camera.map((v,i)=>v-stop.center[i]))>stop.envelope+.1,'Manual orbit inside body/rings')
    await close()
    assert(samePose(before,read())&&scrollY===scroll&&document.activeElement.id==='explore-planet','Exit restoration failed')
    assert(read().explore.selectedHotspot===null&&!read().axisVisible&&!read().routeComparisonVisible,'Selection leaked')
    checks.push(`${stop.id}-points-source-safe-orbit-rapid-selection-restore`)
  }
  for(let i=stops.length-1;i>=0;i--) {
    await go(stops[i].p)
    assert(samePose(saved[i],read()),'Reverse changed pose')
    await open()
    assert(read().explore.planet===stops[i].id&&read().explore.selectedHotspot===null&&!read().axisVisible&&!read().routeComparisonVisible,'Reverse scene stale')
    await close()
    checks.push(`${stops[i].id}-reverse-reopen`)
  }
  await go(.92)
  assert(document.querySelector('#explore-planet').hidden,'Explore available in transit')
  await go(0)
  assert(read().ship[1]===.65&&read().engine.engine===0&&read().engine.plume===0,'Return pad failed')
  assert(document.querySelectorAll('canvas').length===1&&!document.querySelector('vite-error-overlay'),'Canvas/overlay error')
  checks.push('transit-no-explore','return-pad-one-canvas')
  await go(.85);await open()
  window.__s07Saved={pose:saved[5],scroll:18700,neptune:saved[6]}
  return {passed:true,checks,viewport:[innerWidth,innerHeight],browser:navigator.userAgent,stops:saved,exploring:read()}
})().then(result=>{window.__s07Result=result}).catch(error=>{window.__s07Result={passed:false,error:String(error)}});
'started'
