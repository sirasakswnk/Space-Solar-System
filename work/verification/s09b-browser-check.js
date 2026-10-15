window.__s09bResult={status:'running'};
(async()=>{
  const read=()=>document.querySelector('canvas')?.journeySnapshot
  const pause=ms=>new Promise(r=>setTimeout(r,ms))
  const assert=(v,label)=>{if(!v)throw Error(label+': '+JSON.stringify(read()))}
  const wait=async fn=>{const end=performance.now()+9000;while(!fn()&&performance.now()<end)await pause(25);assert(fn(),'Timeout')}
  await wait(()=>read()?.earth?.textures.surface==='loaded'&&read().earth.textures.clouds==='loaded')
  const checks=[]
  const go=async local=>{
    const pixel=Math.round(local*.17766*24000),p=pixel/24000
    scrollTo(0,pixel);await wait(()=>read().current===p&&read().target===p);await pause(50);return read()
  }
  const same=(a,b)=>['camera','cameraQuaternion','ship','shipQuaternion'].every(k=>a[k].every((v,i)=>Math.abs(v-b[k][i])<1e-6))
  const imageSizes=[]
  for(const file of ['daymap','clouds']){
    const image=new Image();image.src=`/assets/earth/${file}.jpg`;await image.decode()
    assert(image.naturalWidth===2048&&image.naturalHeight===1024,'Texture dimensions')
    imageSizes.push({file,width:image.naturalWidth,height:image.naturalHeight})
  }
  assert(!performance.getEntriesByType('resource').some(e=>/solarsystemscope|wikimedia/.test(e.name)),'External runtime asset')
  assert(document.querySelectorAll('canvas').length===1&&!document.querySelector('vite-error-overlay'),'Canvas / overlay')
  checks.push('local-2k-textures-loaded-and-one-canvas')
  await go(0);const initial=read()
  const values=[0,.08,.18,.28,.38,.46,.70,1],samples=[]
  for(const local of values) samples.push(await go(local))
  assert(samples[1].ship[1]===.65&&samples[1].engine.engine>0,'Ignition')
  assert(samples[2].ship[1]>.65&&samples[2].launch.armExtension===.25,'Lift-off')
  assert(samples[3].launch.cloudOpacity>0&&samples[3].launch.cloudOpacity<.38,'Cloud fade')
  assert(samples[5].launch.cloudOpacity===0&&samples[5].launch.sky==='080e1b','Cloud-to-space')
  checks.push('soft-clouds-launch-to-space-effects')
  const paused=JSON.stringify(read().earth);await pause(500)
  assert(paused===JSON.stringify(read().earth),'Earth moves while paused')
  for(let i=values.length-1;i>=0;i--){
    const s=await go(values[i]);assert(same(samples[i],s),'Reverse pose '+i)
    assert(JSON.stringify(s.earth)===JSON.stringify(samples[i].earth),'Reverse Earth / cloud pose '+i)
    assert(JSON.stringify(s.launch)===JSON.stringify(samples[i].launch),'Reverse launch effect '+i)
  }
  checks.push('pause-and-eight-reverse-earth-cloud-poses')
  await go(1);const saved=read(),savedY=scrollY
  document.querySelector('#explore-planet').focus();document.querySelector('#explore-planet').click()
  await wait(()=>read().explore.phase==='exploring'&&!document.querySelector('[data-info]').disabled)
  document.querySelector('.return-button').click()
  await wait(()=>read().explore.phase==='travel'&&!document.querySelector('dialog').open);await pause(220)
  assert(same(saved,read())&&savedY===scrollY&&document.activeElement.id==='explore-planet','Explore restoration')
  assert(JSON.stringify(saved.earth)===JSON.stringify(read().earth),'Explore changed Earth')
  checks.push('mercury-explore-restores-camera-and-earth')
  scrollTo(0,24000);await wait(()=>read().current===1&&read().target===1)
  assert(read().overview.visible,'Overview')
  document.querySelector('[data-navigation=overview] [data-replay]').click()
  await wait(()=>read().current===0&&read().target===0&&scrollY===0);await pause(50)
  assert(same(initial,read())&&JSON.stringify(initial.earth)===JSON.stringify(read().earth),'Replay exact Earth / camera')
  assert(read().launch.armExtension===1&&read().engine.engine===0&&!read().engine.exhaustVisible,'Replay launch')
  checks.push('overview-replay-restores-initial-earth-clouds')
  const intro=document.querySelector('.intro').getBoundingClientRect(),nav=document.querySelector('.travel-navigation').getBoundingClientRect(),caption=document.querySelector('.caption').getBoundingClientRect()
  const credit=[...document.querySelectorAll('.asset-credit a')]
  assert(intro.bottom<nav.top&&caption.bottom<innerHeight&&caption.top>540,'UI bounds')
  assert(credit.length===2&&credit[0].href==='https://ssi.solarsystemscope.com/textures/'&&credit[1].href==='https://creativecommons.org/licenses/by/4.0/','Credits')
  checks.push('readable-ui-and-source-license-links')
  return {passed:true,checks,imageSizes,samples:samples.map(s=>({p:s.current,earth:s.earth,launch:s.launch})),final:read()}
})().then(result=>{window.__s09bResult=result}).catch(e=>{window.__s09bResult={passed:false,error:String(e),snapshot:document.querySelector('canvas')?.journeySnapshot}});
'started'
