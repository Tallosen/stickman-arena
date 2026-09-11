"use strict";
// Platform boundary. Cloud saves never read/write browser storage in YouTube.
const Playables = (() => {
  const nativeFrame=window.requestAnimationFrame.bind(window),nativeCancel=window.cancelAnimationFrame.bind(window);
  const nativeTimer=window.setTimeout.bind(window),nativeClear=window.clearTimeout.bind(window);
  const PROFILE='vacky_dragon_home_v2',LEGACY='vacky_stickman_dragons_v1',INVENTORY='vacky_stickman_inventory_v1',META='vacky_meta_v1';
  let adapter=null,provider='YouTube',language='ru';
  let sdk=null,cloud=false,loaded=false,started=false,hostPaused=false,audioEnabled=true,first=false,ready=false;
  let records=Object.create(null),revision=0,savedRevision=0,inflight=null,saveError='',hooks={},launch=null,booting=false;
  let serial=0,installed=false,launchAttempted=false;const frames=new Map(),timers=new Map(),resumeWaiters=[];
  const blocked=()=>!started||hostPaused||revision>savedRevision||!!saveError;
  const el=id=>document.getElementById(id);
  function status(text,canRetry=false){
    if(hostPaused)return;
    const gate=el('platformGate'),message=el('platformMessage'),retry=el('platformRetry');
    if(message)message.textContent=text;if(retry)retry.hidden=!canRetry;
    if(gate)gate.hidden=!text;
    const note=el('homeSaveNote');if(note)note.textContent=cloud?'Коллекция и инвентарь сохраняются через '+provider+'.':'Прогресс сохраняется в этом браузере.';
  }
  function freeze(){
    for(const f of frames.values())if(f.native!==null){nativeCancel(f.native);f.native=null;}
    const now=performance.now();
    for(const t of timers.values())if(t.native!==null){nativeClear(t.native);t.native=null;t.left=Math.max(0,t.due-now);}
    hooks.suspend?.();hooks.audio?.(false);
  }
  function scheduleFrame(id,f){
    if(blocked()||f.native!==null)return;
    f.native=nativeFrame(now=>{f.native=null;if(blocked())return;frames.delete(id);f.fn(now);});
  }
  function scheduleTimer(id,t){
    if(blocked()||t.native!==null)return;t.due=performance.now()+t.left;
    t.native=nativeTimer(()=>{t.native=null;if(blocked()){t.left=0;return;}timers.delete(id);t.fn();},t.left);
  }
  function wake(){
    if(blocked())return;
    hooks.resume?.();hooks.audio?.(audioEnabled);status('');
    for(const [id,f] of frames)scheduleFrame(id,f);for(const [id,t] of timers)scheduleTimer(id,t);
    if(cloud&&!ready){ready=true;Promise.resolve(sdk.game.gameReady()).catch(()=>{started=false;freeze();status('Платформа не подтвердила запуск. Перезагрузи игру.',true);});}
  }
  function parseCloud(raw){
    if(raw==null||raw==='')return Object.create(null);
    const p=JSON.parse(raw);let data;
    if(p?.format==='vacky-playables'&&p.version===1&&p.records&&typeof p.records==='object'&&!Array.isArray(p.records))data=p.records;
    else if(p?.version===2&&p.counts&&p.exclusives)data={[PROFILE]:JSON.stringify(p)}; // earlier standalone dragon profile
    else throw Error('Неизвестный формат сохранения. Оно не будет перезаписано.');
    const out=Object.create(null);
    for(const [key,value] of Object.entries(data)){
      if(typeof value!=='string')throw Error('Некорректное сохранение.');out[key]=value;
    }
    if(Object.hasOwn(out,PROFILE)){
      const q=JSON.parse(out[PROFILE]);
      if(q?.version!==2||!q.counts||!q.exclusives||typeof q.counts!=='object'||typeof q.exclusives!=='object'||Array.isArray(q.counts)||Array.isArray(q.exclusives))throw Error('Не удалось прочитать коллекцию.');
      for(const key of ['rescues','revision'])if(q[key]!==undefined&&(!Number.isSafeInteger(q[key])||q[key]<0))throw Error('Повреждена история коллекции.');
      for(const n of [...Object.values(q.counts),...Object.values(q.exclusives)])if(!Number.isSafeInteger(n)||n<0)throw Error('Повреждён счётчик драконов.');
      if(q.egg&&(![0,1,2].includes(q.egg.shell)||!Number.isInteger(q.egg.fed)||q.egg.fed<0||q.egg.fed>5||(q.egg.fed===5&&(!Number.isInteger(q.egg.reward)||q.egg.reward<0||q.egg.reward>=100))))throw Error('Не удалось прочитать яйцо.');
    }
    for(const key of [INVENTORY,META,LEGACY])if(Object.hasOwn(out,key)){const value=JSON.parse(out[key]);if(!value||typeof value!=='object'||Array.isArray(value)||Object.values(value).some(n=>!Number.isSafeInteger(n)||n<0))throw Error('Повреждён прогресс.');}
    return out;
  }
  function payload(data){
    const text=JSON.stringify({format:'vacky-playables',version:1,records:data});
    // Current saves are a few KiB; conservative bound also fits the exit flush budget.
    if(text.length*3>60000)throw Error('Сохранение слишком велико. Изменение не принято.');return text;
  }
  function flush(atPause=false){
    if(!cloud||!loaded||revision===savedRevision||inflight||(hostPaused&&!atPause))return inflight||Promise.resolve();
    const sent=revision,text=payload(records);saveError='';
    status('Сохраняем прогресс: '+provider+'…');
    inflight=Promise.resolve().then(()=>sdk.game.saveData(text)).then(()=>{
      savedRevision=sent;saveError='';
    },()=>{saveError=provider+' не подтвердил сохранение. Не закрывай игру; повтори отправку.';}).finally(()=>{
      inflight=null;
      if(saveError){status(saveError,true);return;}
      if(revision>savedRevision){if(!hostPaused)flush();return;}wake();
    });return inflight;
  }
  const storage={
    getItem(key){if(cloud){if(!loaded)throw Error('Облачный прогресс ещё не загружен');return records[key]??null;}return window.localStorage.getItem(key);},
    setItem(key,value){
      if(!cloud){window.localStorage.setItem(key,value);return;}
      if(!loaded)throw Error('Запись до загрузки запрещена');
      const next=Object.assign(Object.create(null),records,{[key]:String(value)});payload(next);
      records=next;revision++;freeze();status('Сохраняем прогресс: '+provider+'…');
      // End-of-turn coalescing: wallet/profile/meta writes become a serialized snapshot.
      Promise.resolve().then(()=>flush());
    }
  };
  function install(){
    sdk=adapter||(typeof ytgame!=='undefined'?ytgame:null);cloud=!!sdk?.IN_PLAYABLES_ENV;
    if(window.VACKY_REQUIRE_PLAYABLES&&!cloud)throw Error('Эта сборка запускается через YouTube Playables или его Test Suite.');
    if(!cloud){installed=true;return;}
    audioEnabled=sdk.system.isAudioEnabled();
    sdk.system.onAudioEnabledChange(value=>{audioEnabled=!!value;if(started&&!hostPaused)hooks.audio?.(!blocked()&&audioEnabled);});
    sdk.system.onPause(()=>{hostPaused=true;freeze();flush(true);});
    sdk.system.onResume(()=>{
      hostPaused=false;for(const fn of resumeWaiters.splice(0))fn();
      if(saveError)status(saveError,true);else if(revision>savedRevision)flush();else wake();
    });
    installed=true;
  }
  async function boot(startGame){
    if(startGame)launch=startGame;if(booting||started)return;booting=true;
    try{
      if(window.VACKY_REQUIRE_PLAYGAMA&&!adapter){adapter=await createPlaygamaAdapter();provider=adapter.provider;language=adapter.language;}
      if(!installed)install();status(cloud?'Загружаем прогресс: '+provider+'…':'Загружаем игру…');
      if(cloud&&!first){await new Promise(resolve=>nativeFrame(resolve));if(hostPaused)await new Promise(resolve=>resumeWaiters.push(resolve));sdk.game.firstFrameReady();first=true;}
      if(cloud)records=parseCloud(await sdk.game.loadData());loaded=true;
      if(hostPaused)await new Promise(resolve=>resumeWaiters.push(resolve));
      launchAttempted=true;hooks=await launch();
      if(hostPaused)await new Promise(resolve=>resumeWaiters.push(resolve));
      started=true;status('');hooks.initial?.();wake();
    }catch(error){started=false;freeze();status('Не удалось запустить игру. '+(error?.message||'Повтори загрузку.'),true);}
    finally{booting=false;}
  }
  function inputGuard(event){if(blocked()){event.preventDefault();event.stopImmediatePropagation();}}
  // Retry remains usable; all game inputs are stopped while cloud work is unresolved.
  for(const type of ['pointerdown','pointerup','pointermove','click','dblclick','keydown','keyup','wheel','touchstart','touchmove'])
    document.addEventListener(type,event=>{if(event.target===el('platformRetry')&&!hostPaused)return;inputGuard(event);},{capture:true,passive:false});
  const retry=el('platformRetry');if(retry)retry.onclick=()=>{if(saveError){saveError='';flush();}else if(launchAttempted){window.location.reload();}else boot();};
  return {
    boot,storage,flush,get language(){return language;},get provider(){return provider;},get cloud(){return cloud;},get blocked(){return blocked();},get hostPaused(){return hostPaused;},
    get audioAllowed(){return !blocked()&&audioEnabled;},
    requestFrame(fn){const id=++serial,f={fn,native:null};frames.set(id,f);scheduleFrame(id,f);return id;},
    cancelFrame(id){const f=frames.get(id);if(f?.native!==null&&f)nativeCancel(f.native);frames.delete(id);},
    delay(fn,ms=0){const id=++serial,t={fn,left:ms,due:0,native:null};timers.set(id,t);scheduleTimer(id,t);return id;},
    // Used by the standalone catalogue entry without depending on bundle-local globals.
    catalogue(){if(!blocked())hooks.catalogue?.();},
  };
})();
