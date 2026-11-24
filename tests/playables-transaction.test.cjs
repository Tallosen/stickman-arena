const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('node:assert/strict');
const code=fs.readFileSync(path.join(__dirname,'../src/playables.js'),'utf8');
const KEY='vacky_atomic_v1',PREFIX='vacky_qa_v1:';
const tick=async()=>{for(let i=0;i<16;i++)await Promise.resolve();};
function deferred(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};}
function harness({db=new Map(),qa=false,cloud=false,raw='',writeFail=()=>false}={}){
 const nodes=new Map(),handlers={},frames=new Map(),timers=new Map(),writes=[],reads=[],saves=[],events=[];let serial=0,fail=writeFail;
 const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,textContent:''});return nodes.get(id);};
 const box={console,performance:{now:()=>0},VACKY_DEV:qa,location:{reload(){events.push('reload');}},
  document:{getElementById:node,addEventListener:(name,fn)=>{handlers[name]=fn;}},
  localStorage:{getItem(key){reads.push(key);return db.get(key)??null;},setItem(key,value){writes.push([key,String(value)]);if(fail(key,value))throw Error('Storage unavailable');db.set(key,String(value));}},
  requestAnimationFrame(fn){frames.set(++serial,fn);return serial;},cancelAnimationFrame(id){frames.delete(id);},
  setTimeout(fn,ms){timers.set(++serial,{fn,ms});return serial;},clearTimeout(id){timers.delete(id);},
 };
 if(cloud)box.ytgame={IN_PLAYABLES_ENV:true,game:{firstFrameReady(){events.push('first');},gameReady(){events.push('ready');},loadData:async()=>raw,
  saveData(text){const p=deferred();saves.push({text,...p});return p.promise;}},
  system:{isAudioEnabled:()=>true,onAudioEnabledChange:fn=>handlers.audio=fn,onPause:fn=>handlers.pause=fn,onResume:fn=>handlers.resume=fn}};
 box.window=box;vm.createContext(box);vm.runInContext(code,box);const api=vm.runInContext('Playables',box);
 async function boot(){const p=api.boot(()=>{events.push('launch');return {suspend(){events.push('freeze');},resume(){events.push('resume');},audio(value){events.push('audio:'+value);},initial(){events.push('initial');}};});
  if(cloud){for(const [id,fn] of [...frames]){frames.delete(id);fn(0);}}await p;return api;}
 return {api,boot,db,writes,reads,saves,events,nodes,handlers,frames,timers,node,setFail(fn){fail=fn;}};
}
const object=value=>JSON.parse(JSON.stringify(value));
const envelope=db=>JSON.parse(db.get(KEY)).records;
(async()=>{
 // One durable write groups inventory, quest bookkeeping and recovered run.
 const db=new Map([['inventory','1'],['camp','old'],['unrelated','KEEP']]);
 const h=harness({db});await h.boot();const api=h.api,returned={accepted:true};let captured,nestedFinalized=false;
 const result=api.storage.transaction(()=>{
  assert.equal(api.storage.getItem('inventory'),'1');api.storage.setItem('inventory','2');
  assert.equal(api.storage.getItem('inventory'),'2');
  api.storage.transaction(()=>{api.storage.setItem('camp','new');assert.equal(api.storage.getItem('inventory'),'2');return 17;},()=>{nestedFinalized=true;return {run:'premature'};});
  assert.equal(db.get('inventory'),'1','No partial write inside the action');assert.equal(db.has(KEY),false);
  return returned;
 },changed=>{captured=object(changed);return {run:JSON.stringify({version:1,stage:6,collected:[5]})};});
 assert.equal(result,returned);assert.equal(nestedFinalized,false);assert.deepEqual(captured,{inventory:'2',camp:'new'});
 assert.deepEqual(envelope(db),{inventory:'2',camp:'new',run:'{"version":1,"stage":6,"collected":[5]}'});
 assert.equal(h.writes.filter(([key])=>key===KEY).length,1);assert.equal(db.get('unrelated'),'KEEP');assert(!api.blocked);
 assert.deepEqual([...new Set(h.reads)].sort(),['camp','inventory','run',KEY].sort(),'No enumeration or unrelated profile migration');
 const restarted=harness({db});await restarted.boot();assert.equal(restarted.api.storage.getItem('inventory'),'2');
 assert.deepEqual(JSON.parse(restarted.api.storage.getItem('run')).collected,[5]);

 // The durable envelope is authoritative even if the process never mirrors its
 // commit to old per-key records. A stale legacy write also cannot resurrect loot.
 h.setFail(key=>key!==KEY);
 api.storage.transaction(()=>api.storage.setItem('inventory','3'),()=>({run:'claimed'}));
 assert.equal(db.get('inventory'),'2');assert.equal(db.get('run'),'{"version":1,"stage":6,"collected":[5]}');
 const afterCrash=harness({db});await afterCrash.boot();assert.equal(afterCrash.api.storage.getItem('inventory'),'3');assert.equal(afterCrash.api.storage.getItem('run'),'claimed');
 db.set('inventory','999');assert.equal(afterCrash.api.storage.getItem('inventory'),'3');
 afterCrash.api.storage.setItem('inventory','4');assert.equal(envelope(db).inventory,'4','Future single-record writes update their authoritative envelope');
 afterCrash.api.storage.setItem('ordinary','legacy');assert.equal(db.get('ordinary'),'legacy');assert.equal(envelope(db).ordinary,undefined);

 // No-op frames do not hit storage. Writing a value and reverting it is also empty.
 const before=h.writes.length;let empty;
 api.storage.transaction(()=>99,changed=>{empty=object(changed);return null;});assert.deepEqual(empty,{});assert.equal(h.writes.length,before);
 api.storage.transaction(()=>{api.storage.setItem('inventory','temp');api.storage.setItem('inventory','3');});assert.equal(h.writes.length,before);
 assert.throws(()=>api.storage.transaction(()=>{api.storage.setItem('inventory','bad');throw Error('Action failed');}),/Action failed/);
 assert.throws(()=>api.storage.transaction(()=>api.storage.setItem('inventory','bad'),()=>{throw Error('Capture failed');}),/Capture failed/);
 assert.equal(api.storage.getItem('inventory'),'3');assert.equal(h.writes.length,before);
 api.storage.transaction(()=>{
  api.storage.setItem('camp','outer');
  assert.throws(()=>api.storage.transaction(()=>{api.storage.setItem('camp','nested');api.storage.setItem('discarded','x');throw Error('Nested failed');}),/Nested failed/);
  assert.equal(api.storage.getItem('camp'),'outer');assert.equal(api.storage.getItem('discarded'),null);
 });assert.equal(envelope(db).camp,'outer');assert.equal(envelope(db).discarded,undefined);
 console.log('PASS: atomic multi-record local commit, crash before legacy mirrors, authoritative reload, outer-only finalizer, no-op frames and exception discard');

 // A failed commit does not pretend to roll back already-mutated gameplay.
 // It blocks subsequent actions and retries the exact batch, without regranting.
 const failedDb=new Map([['inventory','7'],['run','old']]),f=harness({db:failedDb});await f.boot();f.setFail(key=>key===KEY);
 let grants=0;assert.equal(f.api.storage.transaction(()=>{grants++;f.api.storage.setItem('inventory','8');return 'granted';},()=>({run:'closed'})),'granted');
 assert.equal(grants,1);assert.equal(failedDb.get('inventory'),'7');assert.equal(failedDb.get('run'),'old');assert.equal(failedDb.has(KEY),false);
 assert.equal(f.api.storage.getItem('inventory'),'8');assert.equal(f.api.storage.getItem('run'),'closed');assert(f.api.blocked);assert(f.api.savePending);assert(!f.node('platformRetry').hidden);
 let entered=false;assert.throws(()=>f.api.storage.transaction(()=>{entered=true;}),/ожидает/);assert(!entered);
 assert.throws(()=>f.api.storage.setItem('inventory','9'),/ожидает/);
 // Reload before retry sees the previous durable pair, never new wallet/old bag.
 const beforeRetry=harness({db:failedDb});await beforeRetry.boot();assert.equal(beforeRetry.api.storage.getItem('inventory'),'7');assert.equal(beforeRetry.api.storage.getItem('run'),'old');
 f.node('platformRetry').onclick();assert.equal(grants,1);assert(f.api.blocked);assert.equal(failedDb.has(KEY),false);
 f.setFail(()=>false);f.node('platformRetry').onclick();assert.equal(grants,1);assert(!f.api.blocked);assert(!f.api.savePending);assert(f.node('platformGate').hidden);
 const afterRetry=harness({db:failedDb});await afterRetry.boot();assert.equal(afterRetry.api.storage.getItem('inventory'),'8');assert.equal(afterRetry.api.storage.getItem('run'),'closed');
 // Existing single-record failure contracts remain synchronous and rollback-safe.
 afterRetry.setFail(()=>true);assert.throws(()=>afterRetry.api.storage.setItem('inventory','9'),/Storage unavailable/);assert.equal(afterRetry.api.storage.getItem('inventory'),'8');assert(!afterRetry.api.blocked);
 assert.throws(()=>afterRetry.api.storage.setItem('new-key','new'),/Storage unavailable/);assert.equal(afterRetry.api.storage.getItem('new-key'),null);
 console.log('PASS: local commit failure preserves exact batch in memory, gates input, retries once without replay, and outside-transaction writes still throw');

 // QA must neither inspect nor overwrite the production envelope or its mirrors.
 const live=JSON.stringify({format:'vacky-atomic',version:1,records:{inventory:'LIVE',run:'LIVE RUN'}});
 const qaDb=new Map([[KEY,live],['inventory','LIVE'],['run','LIVE RUN']]);
 const q=harness({db:qaDb,qa:true});await q.boot();assert.equal(q.api.storage.getItem('inventory'),null);
 q.api.storage.transaction(()=>q.api.storage.setItem('inventory','QA'),()=>({run:'QA RUN'}));
 assert.equal(qaDb.get(KEY),live);assert.equal(qaDb.get('inventory'),'LIVE');assert.equal(qaDb.get('run'),'LIVE RUN');
 assert.equal(JSON.parse(qaDb.get(PREFIX+KEY)).records.run,'QA RUN');assert.equal(qaDb.get(PREFIX+'inventory'),'QA');
 assert(q.reads.every(key=>key.startsWith(PREFIX)));assert(q.writes.every(([key])=>key.startsWith(PREFIX)));
 console.log('PASS: QA atomic namespace never reads or touches production saves');

 // No launch or writes occur for corrupt/newer envelopes. Repair permits the
 // existing boot retry to load again, rather than overwriting the unknown data.
 for(const raw of ['{broken','null','[]','',JSON.stringify({format:'vacky-atomic',version:2,records:{}}),JSON.stringify({format:'vacky-atomic',version:1,records:{run:7}})]){
  const corruptDb=new Map([[KEY,raw],['inventory','SAFE']]),c=harness({db:corruptDb});
  await c.boot();assert(c.api.blocked);assert(!c.events.includes('launch'));assert.equal(c.writes.length,0);assert.equal(corruptDb.get(KEY),raw);assert(!c.node('platformRetry').hidden);
  assert.throws(()=>c.api.storage.setItem('inventory','LOSS'));assert.equal(corruptDb.get('inventory'),'SAFE');
  corruptDb.set(KEY,JSON.stringify({format:'vacky-atomic',version:1,records:{inventory:'RECOVERED'}}));
  c.node('platformRetry').onclick();await tick();assert(!c.api.blocked);assert.equal(c.api.storage.getItem('inventory'),'RECOVERED');assert.equal(c.writes.length,0);
 }
 console.log('PASS: malformed/future atomic envelopes fail closed before launch, remain untouched and can retry after repair');

 // Cloud transactions stay within the existing serialized snapshot protocol,
 // have zero browser-storage access, and preserve failed/pending snapshots.
 const c=harness({cloud:true});await c.boot();
 c.api.storage.transaction(()=>{c.api.storage.setItem('inventory','2');c.api.storage.setItem('camp','new');},()=>({run:'saved'}));
 assert(c.api.blocked);await tick();assert.equal(c.saves.length,1);
 assert.deepEqual(JSON.parse(c.saves[0].text).records,{inventory:'2',camp:'new',run:'saved'});assert.equal(c.reads.length+c.writes.length,0);
 c.saves[0].reject(Error('offline'));await tick();assert(c.api.blocked);assert(!c.node('platformRetry').hidden);
 c.node('platformRetry').onclick();await tick();assert.equal(c.saves.length,2);assert.equal(c.saves[1].text,c.saves[0].text);
 c.saves[1].resolve();await tick();assert(!c.api.blocked);
 c.api.storage.transaction(()=>c.api.storage.setItem('inventory','3'),()=>({run:'new'}));await tick();
 c.api.storage.transaction(()=>c.api.storage.setItem('inventory','4'),()=>({run:'newer'}));await tick();assert.equal(c.saves.length,3,'One in-flight cloud write');
 c.saves[2].resolve();await tick();assert.equal(c.saves.length,4);assert.deepEqual(JSON.parse(c.saves[3].text).records,{inventory:'4',camp:'new',run:'newer'});
 c.saves[3].resolve();await tick();assert(!c.api.blocked);assert.equal(c.reads.length+c.writes.length,0);
 // A late acknowledgement for an older snapshot must not clear the retry owner
 // of a newer rejected transaction (for example a checkpoint exceeding the cap).
 c.api.storage.setItem('camp','latest');await tick();assert.equal(c.saves.length,5);
 c.api.storage.transaction(()=>c.api.storage.setItem('inventory','5'),()=>({run:'x'.repeat(21000)}));
 assert(c.api.blocked);assert(c.api.savePending);assert(!c.node('platformRetry').hidden);
 c.saves[4].resolve();await tick();assert(c.api.blocked);assert(!c.node('platformRetry').hidden);
 c.node('platformRetry').onclick();await tick();assert(!c.events.includes('reload'));assert(c.api.blocked);assert.equal(c.saves.length,5,'Oversized batch never replaces the durable snapshot');
 console.log('PASS: one cloud payload per transaction, no local storage, retry retains complete records and concurrent revisions remain serialized');
})().catch(error=>{console.error(error);process.exitCode=1;});
