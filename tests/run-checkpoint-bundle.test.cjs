// Reload the actual deliverable in a fresh JavaScript realm. All storage here is
// synthetic; this test never reads the player's browser or platform account.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),RUN_KEY='vacky_arena_run_v1';
const noop=()=>{},paint=new Proxy({createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),measureText:s=>({width:String(s).length*7})},{get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.dataset={};this.style={};this.attrs={};this.events={};this.value='all';this.isConnected=true;this.classes=new Set();this.width=720;this.height=480;this.scrollTop=0;this.classList={add:(...s)=>s.forEach(x=>this.classes.add(x)),remove:(...s)=>s.forEach(x=>this.classes.delete(x)),contains:s=>this.classes.has(s),toggle:(s,on)=>{on=on??!this.classes.has(s);on?this.classes.add(s):this.classes.delete(s);return on;}};}
 appendChild(e){this.children.push(e);return e;}replaceChildren(){this.children=[];}setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k];}contains(e){return this===e||this.children.some(c=>c.contains(e));}
 set innerHTML(v){this.children=[];for(const m of v.matchAll(/<(canvas|div|button|b|span)\b/g))this.children.push(new Element(m[1]));}get innerHTML(){return '';}
 addEventListener(k,fn){(this.events[k]??=[]).push(fn);}querySelector(s){return this.children.find(e=>e.tag===s)||new Element(s);}
 querySelectorAll(selector){const all=this.children.flatMap(e=>[e,...e.querySelectorAll('*')]);return selector==='*'?all:all.filter(e=>e.tag==='button'&&(!selector?.includes(':disabled')||!e.disabled));}focus(){this.focused=true;}scrollIntoView(){}setPointerCapture(){}click(){this.onclick?.();}
 getBoundingClientRect(){return {left:0,top:0,width:600,height:410};}getClientRects(){return this.classes.has('hidden')?[]:[{}];}getContext(kind){return kind==='webgl'||kind==='webgl2'?null:paint;}
}
const tick=async()=>{for(let i=0;i<40;i++)await Promise.resolve();};
const copy=value=>JSON.parse(JSON.stringify(value));
const exposed=`window.resumeTest={
 P,inventory,meta,start,gameOver,pauseGame,returnToMainMenu,requestRunRestart,confirmRunRestart,claimBossReward,
 active:()=>({running,paused,userPaused,menuHasRun}),pending:()=>bossRewardPending,
 bags:()=>allBossLoot().map(q=>({stage:q.stage,reward:q.reward})),camp:()=>campProfile,ranking:()=>rankingProfile,
 delivery:()=>weaponDelivery,ultimate:()=>ult.charge,blocked:()=>Playables.blocked,
 checkpoint:()=>validateRunCheckpoint(captureRunCheckpoint()),
 ready:()=>{finishTutorial(true);paused=false;userPaused=false;},
 crossStage:()=>{P.stageMs=STAGE_MS-1;updateRunProgress(2);},
 chooseLevel:()=>runSaveAction(()=>{P.lvl=4;applyGear();queuedLevels=1;offerCards();}),
 levelOffer:()=>activeLevelOffer,
 pendingDeadBoss:()=>runSaveAction(()=>{stageBoss.enemy.hp=0;stageBoss.enemy.rewarded=true;queuedLevels=1;offerCards();},true),
 record:()=>Playables.storage.getItem('vacky_arena_run_v1'),store:Playables.storage,
 seed:()=>runSaveAction(()=>{
  P.runMs=301000;P.stageMs=12000;P.lvl=17;P.xp=127;P.redKills=122;score=123;
  Object.assign(P.gear,{gun:2,helm:2,jacket:1,gloves:2,boots:2,scope:1,clip:1,cape:1});
  P.wtype='minigun';P.dropWeapon='minigun';P.storedGunLevel=3;P.dropWeaponMs=153000;
  P.pet=makePet('boar');P.pet.lvl=3;P.pet.hpMax=petStats(P.pet).hp;P.pet.hp=P.pet.hpMax-2;P.pet.dead=1200;
  P.item='nade';P.damageHits=7;P.campStyle='tide';P.campRun.shotgunOnly=false;
  applyGear();P.hp=7;ult.charge=ULT_FULL*.37;
  weaponDelivery={rolled:true,eligible:true,stage:6,state:'collected',age:6500,weapon:'minigun',x:P.x+120,y:P.y};
  defeatedBossStages.add(5);bossRunLog=[{stage:5,id:'bruiser',ms:11000,clean:false}];P.stage=6;
  dropBossLoot(5,{x:P.x+60,y:P.y,bossSpec:{color:'#886699'}});
  bossLoot.reward={id:'supply:airstrike',kind:'supply',key:'airstrike',title:'AIRSTRIKE +1',desc:'Saved supply'};
  checkpointCamp();
 },true),
 collect:()=>runSaveAction(()=>{
  const q=bossLoot;if(!q)return false;paused=false;userPaused=false;P.x=q.x;P.y=q.y;q.age=1400;
  if(!pickupBossLoot(q))return false;return finishBossLootOpening();
 },true),
 die:()=>runSaveAction(()=>{P.hp=0;gameOver();},true),
 finale:()=>runSaveAction(()=>{
  P.stage=20;P.runMs=1201000;P.stageMs=0;P.redKills=396;score=400;P.hp=7;
  stageBoss=null;enemies=[];resetBossLoot();defeatedBossStages.clear();
  bossRunLog=[5,10,15,20].map((stage,i)=>({stage,id:CAMP_BOSSES[i],ms:14000+i*1000,clean:false}));
  for(const stage of [5,10,15,20])defeatedBossStages.add(stage);
  for(const stage of [5,10,15])bossLootCollected.add(stage);
  dropBossLoot(20,{x:P.x+70,y:P.y,bossSpec:{color:'#cfac50'}});checkpointCamp();
 },true),
 spend:kind=>runSaveAction(()=>useAbility(kind),true),
 rare:()=>runSaveAction(()=>{
  const c={x:P.x,y:P.y,a:0,rare:true,elite:true,rewardKind:'tank'};chests.push(c);
  if(!grantEliteChestReward(c))return false;chests.splice(chests.indexOf(c),1);return true;
 },true),
 markTest:()=>runSaveAction(()=>{P.testRun=true;},true),
 save:()=>runSaveAction(()=>{},true),
 withoutDrop:()=>runSaveAction(()=>{P.wtype='basic';P.dropWeapon=null;P.storedGunLevel=0;P.dropWeaponMs=0;weaponDelivery={rolled:true,eligible:false,stage:0,state:'waiting',age:0,weapon:null};applyGear();},true),
 updateDelivery:()=>updateWeaponDelivery(16),
 bossSnapshot:()=>stageBoss?{id:stageBoss.spec.id,hp:stageBoss.enemy.hp,maxhp:stageBoss.enemy.maxhp}:null,
 liveBoss:()=>runSaveAction(()=>{resetBossLoot();defeatedBossStages.clear();bossRunLog=[];P.stage=10;P.runMs=550000;stageBoss=null;enemies=[];startStageBoss();stageBoss.enemy.hp=Math.floor(stageBoss.enemy.maxhp*.41);},true)
};return platformGameHooks();`;

async function boot(db=new Map(),mode='local'){
 const qa=mode==='qa',cloud=mode==='playgama',version=fs.readFileSync(path.join(root,'src/config.js'),'utf8').match(/VERSION = "([^"]+)"/)[1];
 const file=qa?'dist/StickmanArena_v'+version+'_QA.html':cloud?'dist/playgama/index.html':'dist/index.html';
 const html=fs.readFileSync(path.join(root,file),'utf8'),elements=new Map(),events={},raf=new Map(),timers=new Map();let id=0,time=1000,fail=false,writeCount=0;
 const prefix=qa?'vacky_qa_v1:':'';
 if(!db.has(prefix+'vacky_tutorial_v1'))db.set(prefix+'vacky_tutorial_v1',JSON.stringify({version:1,disabled:true,seen:{}}));
 for(const m of html.matchAll(/<([a-z][a-z0-9]*)\b[^>]*\bid="([^"]+)"[^>]*>/g)){const e=new Element(m[1]);if(/class="[^"]*\bhidden\b/.test(m[0]))e.classList.add('hidden');elements.set(m[2],e);}
 const ability=['airstrike','gas','tank'].map(kind=>{const e=new Element('button');e.dataset.ability=kind;e.appendChild(new Element('canvas'));e.appendChild(new Element('b'));return e;});
 elements.get('abilityDock').appendChild(elements.get('abilityToggle'));elements.get('abilityDock').appendChild(elements.get('abilityPanel'));ability.forEach(e=>elements.get('abilityPanel').appendChild(e));
 elements.get('campDialog').appendChild(elements.get('campTitle'));elements.get('campDialog').appendChild(elements.get('btnCloseCamp'));elements.get('campDialog').appendChild(elements.get('campContent'));
 const languages=[elements.get('menuLanguagestart'),elements.get('menuLanguagepause')],sounds=[elements.get('menuSoundstart'),elements.get('menuSoundpause')];
 const choices=[elements.get('chooseLanguageEn'),elements.get('chooseLanguageRu')];choices[0].dataset.chooseLanguage='en';choices[1].dataset.chooseLanguage='ru';
 const el=id=>elements.get(id)||elements.get('campContent')?.querySelectorAll('*').find(e=>e.id===id)||document.body.querySelectorAll('*').find(e=>e.id===id);
 const document={body:new Element(),activeElement:new Element(),hidden:false,getElementById:el,createElement:t=>new Element(t),addEventListener:(k,f)=>{(events[k]??=[]).push(f);},querySelectorAll:s=>s==='[data-language]'?languages:s==='[data-sound]'?sounds:s==='[data-choose-language]'?choices:s==='.ability-slot'?ability:[]};
 const box={console,document,innerWidth:390,innerHeight:844,devicePixelRatio:1,performance:{now:()=>time},matchMedia:()=>({matches:true}),ResizeObserver:class{observe(){}disconnect(){}},IntersectionObserver:class{observe(){}disconnect(){}},
  addEventListener:(k,f)=>{(events[k]??=[]).push(f);},requestAnimationFrame:f=>{raf.set(++id,f);return id;},cancelAnimationFrame:id=>raf.delete(id),setTimeout:f=>{timers.set(++id,f);return id;},clearTimeout:id=>timers.delete(id),
  localStorage:{getItem:k=>db.get(k)??null,setItem:(k,v)=>{if(fail&&k.endsWith('vacky_atomic_v1'))throw Error('Test disk full');writeCount++;db.set(k,v);}},location:{reload:noop}};
 if(cloud)box.bridge={initialize:async()=>{},EVENT_NAME:{PAUSE_STATE_CHANGED:'pause',AUDIO_STATE_CHANGED:'audio'},platform:{id:'playgama',language:'ru',isAudioEnabled:false,isPaused:false,sendMessage:async()=>{},on:noop},
  storage:{get:async keys=>{assert.deepEqual([...keys],['vacky_profile_v1']);return [JSON.stringify({format:'vacky-playables',version:1,records:Object.fromEntries(db)})];},set:async(keys,values)=>{assert.deepEqual([...keys],['vacky_profile_v1']);if(fail)throw Error('Test cloud unavailable');const records=JSON.parse(values[0]).records;db.clear();for(const pair of Object.entries(records))db.set(...pair);writeCount++;}}};
 box.window=box;vm.createContext(box);
 for(const s of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(s[1].replace('return platformGameHooks();',exposed),box);
 const frame=async(ms=16)=>{time+=ms;const jobs=[...raf.values()];raf.clear();jobs.forEach(f=>f(time));await tick();};
 await tick();await frame();await tick();
 assert(box.resumeTest,'Bundle failed to start: '+el('platformMessage').textContent);assert(el('platformGate').hidden,'Startup gate: '+el('platformMessage').textContent);
 return {api:box.resumeTest,db,mode,el,frame,fail:value=>{fail=value;},writes:()=>writeCount,continue:async()=>{el('btnStart').onclick();await tick();},retry:async()=>{el('platformRetry').onclick();await tick();}};
}

function heroReceipt(a){return copy({stage:a.P.stage,stageMs:a.P.stageMs,runMs:a.P.runMs,lvl:a.P.lvl,xp:a.P.xp,hp:a.P.hp,gear:a.P.gear,wtype:a.P.wtype,dropWeapon:a.P.dropWeapon,storedGunLevel:a.P.storedGunLevel,dropWeaponMs:a.P.dropWeaponMs,item:a.P.item,redKills:a.P.redKills,damageHits:a.P.damageHits,campStyle:a.P.campStyle,campRun:a.P.campRun,pet:a.P.pet&&{type:a.P.pet.type,lvl:a.P.pet.lvl,hp:a.P.pet.hp,dead:a.P.pet.dead},ult:a.ultimate()});}

async function exercise(mode){
 let h=await boot(new Map(),mode),a=h.api;
 assert.equal(a.active().menuHasRun,false);a.start();await tick();a.seed();await tick();
 const expected=heroReceipt(a),beforeInventory=copy(a.inventory),beforeCamp=copy(a.camp()),beforeDelivery=copy(a.delivery()),beforeDb=new Map(h.db);
 assert(a.record(),'A stage checkpoint should exist');assert(a.record().length<18000,'Checkpoint must fit the platform payload with profiles');
 h=await boot(h.db,mode);a=h.api;
 assert.deepEqual(copy(a.active()),{running:true,paused:true,userPaused:true,menuHasRun:true},'Reload must land in paused Continue menu');
 assert.deepEqual(heroReceipt(a),expected,'Progress must survive a fresh realm');assert.deepEqual(copy(a.delivery()),beforeDelivery,'Airdrop roll, weapon and timer must not change');
 assert.equal(a.bags().length,1);assert.equal(a.bags()[0].stage,5);assert.equal(a.bags()[0].reward.id,'supply:airstrike');
 assert.equal(a.camp().kills,beforeCamp.kills);assert.equal(a.camp().bosses,beforeCamp.bosses);
 await h.continue();assert.equal(a.active().menuHasRun,false);assert.equal(a.active().paused,false);assert(a.collect());await tick();
 assert.equal(a.inventory.airstrike,beforeInventory.airstrike+1);assert.equal(a.bags().length,0);
 h=await boot(h.db,mode);a=h.api;assert.equal(a.inventory.airstrike,beforeInventory.airstrike+1);assert.equal(a.bags().length,0,'Collected boss bag must not return');
 assert.equal(a.camp().kills,beforeCamp.kills);assert.equal(a.camp().bosses,beforeCamp.bosses,'Reload cannot credit the same boss again');await h.continue();assert.equal(a.collect(),false);
 assert(a.spend('airstrike'));await tick();h=await boot(h.db,mode);a=h.api;assert.equal(a.inventory.airstrike,beforeInventory.airstrike,'Reload must not refund a spent charge');
 await h.continue();assert(a.rare());await tick();const tanks=a.inventory.tank;h=await boot(h.db,mode);a=h.api;assert.equal(a.inventory.tank,tanks,'Rare chest grant must persist with its removal');
 await h.continue();a.die();await tick();assert.equal(a.ranking().runs.length,1);const ranked=copy(a.ranking());
 h=await boot(h.db,mode);a=h.api;assert.equal(a.active().menuHasRun,false,'Death closes the run');assert.equal(a.active().running,false);assert.deepEqual(copy(a.ranking()),ranked,'Death score is retained exactly once');
 // Final bag and final selection are different resumable boundaries.
 a.start();await tick();a.finale();await tick();h=await boot(h.db,mode);a=h.api;assert.equal(a.bags()[0].stage,20);await h.continue();assert(a.collect());await tick();assert.equal(a.pending().stage,20);
 h=await boot(h.db,mode);a=h.api;await h.continue();assert.equal(a.pending().stage,20,'Reload must reopen the unclaimed final choice');
 const reward=a.pending().options.find(o=>o.kind==='supply'),total=a.inventory[reward.key];assert(a.claimBossReward(reward.id));assert.equal(a.claimBossReward(reward.id),false);await tick();assert.equal(a.inventory[reward.key],total+1);
 const wins=a.camp().wins;h=await boot(h.db,mode);a=h.api;assert.equal(a.active().menuHasRun,false,'Victory closes the run');assert.equal(a.inventory[reward.key],total+1);assert.equal(a.camp().wins,wins);assert.equal(a.pending(),null);
 // Confirmed restart replaces the previous checkpoint, without resetting stock.
 a.start();await tick();a.seed();await tick();a.returnToMainMenu();await tick();assert(a.requestRunRestart('menu'));assert(a.confirmRunRestart());await tick();const supply=copy(a.inventory);
 h=await boot(h.db,mode);a=h.api;assert(a.active().menuHasRun);assert.equal(a.P.stage,1);assert.equal(a.P.redKills,0);assert.equal(a.bags().length,0);assert.deepEqual(copy(a.inventory),supply);
 await h.continue();a.withoutDrop();await tick();h=await boot(h.db,mode);a=h.api;await h.continue();a.updateDelivery();assert.equal(a.delivery().eligible,false,'A failed 33% roll cannot be retried on reload');
 // A partial live boss keeps its identity and remaining HP.
 a.liveBoss();await tick();const boss=copy(a.bossSnapshot());h=await boot(h.db,mode);a=h.api;assert.deepEqual(copy(a.bossSnapshot()),boss,'A live boss must not heal or change archetype');
 // Quota/cloud failure blocks the mutated in-memory world; durable storage is
 // still the complete previous transaction until the explicit retry succeeds.
 h=await boot(new Map(beforeDb),mode);a=h.api;await h.continue();h.fail(true);assert(a.collect());await tick();assert(a.blocked(),'Uncommitted reward must gate further gameplay');
 const failedDb=new Map(h.db),old=await boot(failedDb,mode);assert.equal(old.api.inventory.airstrike,beforeInventory.airstrike);assert.equal(old.api.bags()[0].stage,5,'Failed transaction cannot leave a granted reward with an old checkpoint');
 h.fail(false);await h.retry();assert(!a.blocked());const recovered=await boot(h.db,mode);assert.equal(recovered.api.inventory.airstrike,beforeInventory.airstrike+1);assert.equal(recovered.api.bags().length,0);
 if(mode==='qa'){
  h=await boot(new Map(beforeDb),mode);a=h.api;await h.continue();a.markTest();await tick();h=await boot(h.db,mode);a=h.api;assert.equal(a.P.testRun,true);await h.continue();a.die();await tick();assert.equal(a.ranking().runs.length,0,'Admin-modified resumed runs remain unranked');
  assert([...h.db.keys()].every(k=>k.startsWith('vacky_qa_v1:')),'QA checkpoints must stay in the QA namespace');
 }
 console.log('PASS checkpoint bundle '+mode+': fresh-realm resume, boss/rare rewards, spending, finale, death, restart, airdrop, live boss and save failure');
}

(async()=>{
 for(const mode of ['local','qa','playgama'])await exercise(mode);
 // Real transition hooks, not just test-forced checkpoints. Saving must be
 // event-driven: walking for many frames must not rewrite the cloud record.
 for(const mode of ['local','qa','playgama']){
  let h=await boot(new Map(),mode),a=h.api;a.start();await tick();a.ready();await tick();await h.frame();await tick();
  const rolled=copy(a.delivery());assert(rolled.rolled);a.checkpoint();
  const writes=h.writes();for(let i=0;i<35;i++)await h.frame();assert.equal(h.writes(),writes,'Ordinary frames must not save repeatedly');
  h=await boot(h.db,mode);a=h.api;assert.deepEqual(copy(a.delivery()),rolled,'The first airdrop roll is durable before stage 2');
  await h.continue();a.crossStage();await tick();h=await boot(h.db,mode);a=h.api;assert.equal(a.P.stage,2,'Stage boundary automatically checkpoints');
  await h.continue();a.chooseLevel();await tick();const offer=copy(a.levelOffer());a.checkpoint();
  h=await boot(h.db,mode);a=h.api;await h.continue();assert.deepEqual(copy(a.levelOffer()),offer,'Pending upgrade choices must not reroll');
  assert(!h.el('levelup').classList.contains('hidden'));h.el('cards').children[0].onclick({detail:0});await tick();
  const gear=copy(a.P.gear);h=await boot(h.db,mode);a=h.api;await h.continue();assert.deepEqual(copy(a.P.gear),gear);assert.equal(a.levelOffer(),null,'Chosen card cannot be spent again');
  a.liveBoss();await tick();a.pendingDeadBoss();await tick();h=await boot(h.db,mode);a=h.api;assert.equal(a.bossSnapshot().hp,0,'A defeated boss waiting for an upgrade must not respawn alive');
  console.log('PASS checkpoint automatic '+mode+': first roll, stage transition, no frame writes, upgrade latch and defeated boss');
 }
 const valid=await boot();valid.api.start();await tick();valid.api.seed();await tick();
 const baseline=JSON.parse(valid.api.record());
 for(const mutate of [q=>q.player.gear.gun=99,q=>q.player.hp=null,q=>q.pet.type='unknown',q=>q.delivery.weapon='invalid',q=>q.collected=[5],q=>q.clocks.queuedLevels=-1]){
  const q=copy(baseline);mutate(q);const raw=JSON.stringify(q),h=await boot(new Map([[RUN_KEY,raw]]));assert.equal(h.api.active().menuHasRun,false);assert.equal(h.api.record(),raw);
 }
 for(const raw of ['{invalid',JSON.stringify({version:999,active:true})]){
  const db=new Map([[RUN_KEY,raw]]),h=await boot(db);assert.equal(h.api.active().menuHasRun,false);assert.equal(h.api.record(),raw,'Unreadable checkpoint must be preserved');h.api.start();await tick();assert.equal(h.api.record(),raw,'New play must not overwrite unknown checkpoint data');
 }
 console.log('PASS checkpoint bundle: corrupt and future run records preserved');
})().catch(error=>{console.error(error);process.exitCode=1;});
