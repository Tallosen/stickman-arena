"use strict";
// Platform boundary. Cloud saves never read/write browser storage in YouTube.
const Playables = (() => {
  // Capture the build flag once. QA never reads, migrates or overwrites live saves.
  const qaBuild=window.VACKY_DEV===true,qaPrefix='vacky_qa_v1:';
  const nativeFrame=window.requestAnimationFrame.bind(window),nativeCancel=window.cancelAnimationFrame.bind(window);
  const nativeTimer=window.setTimeout.bind(window),nativeClear=window.clearTimeout.bind(window);
  const PROFILE='vacky_dragon_home_v2',LEGACY='vacky_stickman_dragons_v1',INVENTORY='vacky_stickman_inventory_v1',META='vacky_meta_v1';
  const ATOMIC='vacky_atomic_v1';
  let adapter=null,provider='YouTube',language='ru';
  let sdk=null,cloud=false,loaded=false,started=false,hostPaused=false,adPending=false,audioEnabled=true,first=false,ready=false;
  let adContinuation=null,adRequesting=false;
  let records=Object.create(null),revision=0,savedRevision=0,inflight=null,saveError='',hooks={},launch=null,booting=false;
  let localRecords=Object.create(null),localLoaded=false,transaction=null,pendingCommit=null;
  let serial=0,installed=false,launchAttempted=false;const frames=new Map(),timers=new Map(),resumeWaiters=[];
  function startupDeadline(promise,message){
    // Native timer must keep running while gameplay timers/input are gated.
    // Expiration rejects this attempt only; a late load can never replace records.
    return new Promise((resolve,reject)=>{
      const timer=nativeTimer(()=>reject(Error(message)),15000);
      Promise.resolve(promise).then(value=>{nativeClear(timer);resolve(value);},error=>{nativeClear(timer);reject(error);});
    });
  }
  const blocked=()=>!started||hostPaused||adPending||revision>savedRevision||!!saveError||!!pendingCommit;
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
    finishAdContinuation();if(blocked())return;
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
  const localKey=key=>(qaBuild?qaPrefix:'')+key;
  function localPayload(data){
    const text=JSON.stringify({format:'vacky-atomic',version:1,records:data});
    if(text.length*3>60000)throw Error('Сохранение слишком велико. Изменение не принято.');return text;
  }
  function loadLocalRecords(){
    if(localLoaded)return;
    // Read only this namespace's transaction envelope; never enumerate/migrate
    // unrelated localStorage. Defer loading to boot so a damaged save gets a retry UI.
    const raw=window.localStorage.getItem(localKey(ATOMIC)),next=Object.create(null);
    if(raw!==null){
      const p=JSON.parse(raw);
      if(p?.format!=='vacky-atomic'||p.version!==1||!p.records||typeof p.records!=='object'||Array.isArray(p.records))throw Error('Неизвестное сохранение забега. Оно не будет перезаписано.');
      for(const [key,value] of Object.entries(p.records)){
        if(key===ATOMIC||typeof value!=='string')throw Error('Повреждено сохранение забега. Данные не перезаписаны.');
        next[key]=value;
      }
      localPayload(next);
    }
    localRecords=next;localLoaded=true;
  }
  function recordKey(key){key=String(key);if(key===ATOMIC)throw Error('Зарезервированный ключ сохранения.');return key;}
  function readRecord(key){
    if(cloud){if(!loaded)throw Error('Облачный прогресс ещё не загружен');return (pendingCommit?.next||records)[key]??null;}
    loadLocalRecords();const data=pendingCommit?.next||localRecords;
    return Object.hasOwn(data,key)?data[key]:window.localStorage.getItem(localKey(key));
  }
  function mirrorLocal(changes){
    // The envelope above is the commit point. A crash or failed legacy mirror
    // cannot expose a half-applied reward: subsequent reads prefer the envelope.
    for(const [key,value] of Object.entries(changes))try{window.localStorage.setItem(localKey(key),value);}catch(_){}
  }
  function commitRecords(changes,next){
    if(cloud){
      if(!loaded)throw Error('Запись до загрузки запрещена');payload(next);
      records=next;revision++;freeze();status('Сохраняем прогресс: '+provider+'…');
      // End-of-turn coalescing keeps multiple synchronous batches serialized.
      Promise.resolve().then(()=>flush());
    }else{
      window.localStorage.setItem(localKey(ATOMIC),localPayload(next));
      localRecords=next;mirrorLocal(changes);
    }
  }
  function pendingSaveMessage(error){return 'Не удалось сохранить забег. Не закрывай игру; нажми «Повторить». '+(error?.message||'');}
  function retryPendingCommit(){
    if(!pendingCommit)return true;
    const pending=pendingCommit;
    try{commitRecords(pending.changes,pending.next);pendingCommit=null;saveError='';if(!cloud)wake();return true;}
    catch(error){saveError=pendingSaveMessage(error);freeze();status(saveError,true);return false;}
  }
  function flush(atPause=false){
    if(pendingCommit&&!retryPendingCommit())return Promise.resolve();
    if(!cloud||!loaded||revision===savedRevision||inflight||(hostPaused&&!atPause))return inflight||Promise.resolve();
    const sent=revision,text=payload(records);saveError='';
    status('Сохраняем прогресс: '+provider+'…');
    inflight=Promise.resolve().then(()=>sdk.game.saveData(text)).then(()=>{
      savedRevision=sent;if(!pendingCommit)saveError='';
    },()=>{saveError=provider+' не подтвердил сохранение. Не закрывай игру; повтори отправку.';}).finally(()=>{
      inflight=null;
      if(saveError){status(saveError,true);return;}
      if(revision>savedRevision){if(!hostPaused)flush();return;}wake();
    });return inflight;
  }
  const storage={
    getItem(key){key=recordKey(key);return transaction&&Object.hasOwn(transaction.changes,key)?transaction.changes[key]:readRecord(key);},
    setItem(key,value){
      key=recordKey(key);value=String(value);
      if(transaction){if(value===readRecord(key))delete transaction.changes[key];else transaction.changes[key]=value;return;}
      if(pendingCommit)throw Error('Предыдущее сохранение ожидает повтора.');
      if(!cloud){
        loadLocalRecords();
        // Preserve old single-record behavior until a key joins an atomic batch.
        if(!Object.hasOwn(localRecords,key)){window.localStorage.setItem(localKey(key),value);return;}
      }
      const changes=Object.assign(Object.create(null),{[key]:value});
      commitRecords(changes,Object.assign(Object.create(null),cloud?records:localRecords,changes));
    },
    transaction(action,finalizer){
      if(typeof action!=='function')throw TypeError('A storage transaction needs a synchronous action.');
      if(transaction){
        const owner=transaction,before=Object.assign(Object.create(null),owner.changes);
        try{const result=action();if(result&&typeof result.then==='function')throw TypeError('Storage transactions must be synchronous.');return result;}
        catch(error){owner.changes=before;throw error;}
      }
      if(pendingCommit)throw Error('Предыдущее сохранение ожидает повтора.');
      if(cloud&&!loaded)throw Error('Запись до загрузки запрещена');
      if(!cloud)loadLocalRecords();
      const owner={changes:Object.create(null)};transaction=owner;let result;
      try{
        result=action();if(result&&typeof result.then==='function')throw TypeError('Storage transactions must be synchronous.');
        // Only the outer scope captures the completed gameplay action. A nested
        // reward handler cannot capture a checkpoint before its caller finishes.
        const extra=typeof finalizer==='function'?finalizer(Object.assign(Object.create(null),owner.changes)):null;
        if(extra!==null&&extra!==undefined){
          if(typeof extra!=='object'||Array.isArray(extra))throw TypeError('Checkpoint records must be an object.');
          for(const [key,value] of Object.entries(extra))storage.setItem(key,value);
        }
      }finally{transaction=null;}
      const changes=owner.changes;if(!Object.keys(changes).length)return result;
      const next=Object.assign(Object.create(null),cloud?records:localRecords,changes);
      try{commitRecords(changes,next);}
      catch(error){
        // Gameplay has already changed. Keep the entire batch in memory and
        // freeze until one atomic retry succeeds; do not claim a partial rollback.
        pendingCommit={changes,next};saveError=pendingSaveMessage(error);freeze();status(saveError,true);
      }
      return result;
    },
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
    if(provider==='Playgama'&&adapter?.advertisement){
      adapter.advertisement.onState?.(updateAdState);
      updateAdState(adapter.advertisement.state);
    }
    installed=true;
  }
  function updateAdState(state){
    const wasPending=adPending;adPending=state==='loading'||state==='opened';
    if(adPending)freeze();
    else if(wasPending){
      if(saveError)status(saveError,true);
      else if(revision>savedRevision)flush();
      else wake();
    }
  }
  function finishAdContinuation(){
    if(adRequesting||blocked()||!adContinuation)return;
    const next=adContinuation;adContinuation=null;next();
  }
  async function boot(startGame){
    if(startGame)launch=startGame;if(booting||started)return;booting=true;
    try{
      if(window.VACKY_REQUIRE_PLAYGAMA&&!adapter){adapter=await startupDeadline(createPlaygamaAdapter(),'Playgama is taking too long to connect. Retry; your progress has not been changed.');provider=adapter.provider;language=adapter.language;}
      if(!installed)install();status(cloud?'Загружаем прогресс: '+provider+'…':'Загружаем игру…');
      if(cloud&&!first){await new Promise(resolve=>nativeFrame(resolve));if(hostPaused)await new Promise(resolve=>resumeWaiters.push(resolve));sdk.game.firstFrameReady();first=true;}
      if(cloud){
        const pendingLoad=sdk.game.loadData();
        records=parseCloud(await (provider==='Playgama'?startupDeadline(pendingLoad,'Progress could not be loaded in time. Retry; your existing save has not been changed.'):pendingLoad));
      }else loadLocalRecords();
      loaded=true;
      if(hostPaused)await new Promise(resolve=>resumeWaiters.push(resolve));
      launchAttempted=true;hooks=await launch();
      if(hostPaused)await new Promise(resolve=>resumeWaiters.push(resolve));
      started=true;status('');hooks.initial?.();wake();
    }catch(error){started=false;freeze();status('Не удалось запустить игру. '+(error?.message||'Повтори загрузку.'),true);}
    finally{booting=false;}
  }
  function inputGuard(event){if(blocked()){event.preventDefault();event.stopImmediatePropagation();}}
  // Window capture precedes modal capture listeners on both Window and Document.
  // Do not preventDefault: the browser must still be able to leave fullscreen.
  for(const type of ['keydown','keyup'])window.addEventListener?.(type,event=>{
    if(window.VACKY_REQUIRE_PLAYGAMA&&(event.key==='Escape'||event.code==='Escape'))event.stopImmediatePropagation();
  },true);
  // Retry remains usable; all game inputs are stopped while cloud work is unresolved.
  for(const type of ['pointerdown','pointerup','pointermove','click','dblclick','keydown','keyup','wheel','touchstart','touchmove'])
    document.addEventListener(type,event=>{
      // Escape belongs to browser fullscreen on Playgama, including during load/retry.
      // Stop later game listeners without cancelling the browser's default action.
      if(window.VACKY_REQUIRE_PLAYGAMA&&(type==='keydown'||type==='keyup')&&(event.key==='Escape'||event.code==='Escape')){event.stopImmediatePropagation();return;}
      if(event.target===el('platformRetry')&&!hostPaused)return;inputGuard(event);
    },{capture:true,passive:false});
  const retry=el('platformRetry');if(retry)retry.onclick=()=>{if(saveError||pendingCommit){saveError='';flush();}else if(launchAttempted){window.location.reload();}else boot();};
  return {
    get testStorage(){return qaBuild&&!cloud;},
    get savePending(){return !!pendingCommit||cloud&&revision>savedRevision;},
    get interstitialSupported(){return !qaBuild&&provider==='Playgama'&&adapter?.advertisement?.isSupported===true;},
    requestInterstitial(placement,onComplete){
      // UI calls this once at a result exit. A callback continues only after the
      // ad, host pause and outstanding save have all ended. A skipped ad is immediate.
      if(blocked()||adContinuation)return false;
      if(qaBuild||provider!=='Playgama'||!adapter?.advertisement?.isSupported){onComplete?.();return false;}
      adContinuation=typeof onComplete==='function'?onComplete:null;adRequesting=true;
      let requested;
      try{requested=adapter.advertisement.request(placement);updateAdState(adapter.advertisement.state);}
      finally{adRequesting=false;finishAdContinuation();}
      return requested;
    },
    get leaderboardType(){return !qaBuild&&provider==='Playgama'?adapter?.leaderboards?.type||'not_available':'not_available';},
    async submitLeaderboard(score){if(qaBuild||provider!=='Playgama'||!started||hostPaused||!adapter?.leaderboards)throw Error('Leaderboard unavailable');return adapter.leaderboards.submit(score);},
    async leaderboardEntries(){if(qaBuild||provider!=='Playgama'||!started||hostPaused)throw Error('Leaderboard unavailable');return adapter.leaderboards.entries();},
    async showLeaderboard(){if(qaBuild||provider!=='Playgama'||!started||hostPaused)throw Error('Leaderboard unavailable');return adapter.leaderboards.show();},
    boot,storage,flush,get language(){return language;},get provider(){return provider;},get cloud(){return cloud;},get blocked(){return blocked();},get hostPaused(){return hostPaused;},
    get audioAllowed(){return !blocked()&&audioEnabled;},
    requestFrame(fn){const id=++serial,f={fn,native:null};frames.set(id,f);scheduleFrame(id,f);return id;},
    cancelFrame(id){const f=frames.get(id);if(f?.native!==null&&f)nativeCancel(f.native);frames.delete(id);},
    delay(fn,ms=0){const id=++serial,t={fn,left:ms,due:0,native:null};timers.set(id,t);scheduleTimer(id,t);return id;},
    // Used by the standalone catalogue entry without depending on bundle-local globals.
    catalogue(){if(!blocked())hooks.catalogue?.();},
  };
})();
