"use strict";
// Compact checkpoints, not a replay of projectiles or animation frames. Profile
// writes and the matching run state share one durable storage transaction.
const RUN_KEY='vacky_arena_run_v1';
let runSaveDepth=0,runSaveRequested=false,runSaveReadOnly=false,runSaveNotice='',runResumeChoice=null;
let activeLevelOffer=null;
const runCopy=x=>JSON.parse(JSON.stringify(x));
const RUN_NUMBERS={x:[0,WORLD],y:[0,WORLD],hp:[0,200],lvl:[1,200],xp:[0,1e8],stage:[1,20],runMs:[0,86400000],stageMs:[0,STAGE_MS],redKills:[0,1e6],damageHits:[0,1e6],dropWeaponMs:[0,86400000],storedGunLevel:[0,4],hasteT:[0,1e6],invT:[0,1e6]};
const RUN_CLOCKS={t:[0,86400000],spawnT:[-1e5,1e6],shotT:[-1e5,1e6],eliteT:[-1e5,1e6],chestT:[-1e5,1e6],healT:[-1e5,1e6],score:[0,1e6],xpBoost:[0,1e6],charge:[0,ULT_FULL],queuedLevels:[0,200]};
function requestRunCheckpoint(){runSaveRequested=true;}
function runSaveAction(action,force=false){
 if(runSaveDepth){if(force)requestRunCheckpoint();return action();}
 if(typeof Playables==='undefined'||!Playables.storage.transaction)return action();
 const wasRunning=!!running;
 runSaveDepth++;runSaveRequested=force;
 try{return Playables.storage.transaction(action,changed=>{
  const meaningful=Object.keys(changed).some(k=>[CAMP_KEY,INVENTORY_KEY,META_KEY,RANKING_KEY].includes(k));
  if(!running&&!wasRunning&&!meaningful)return null;
  if(runSaveReadOnly||!runSaveRequested&&!meaningful)return null;
  // Include any retained camp delta before persisting its dedupe markers.
  if(P.campRun&&P.runMs>0)checkpointCamp();
  const record=captureRunCheckpoint();
  if(!record)return null;
  const extra={[RUN_KEY]:JSON.stringify(record)};
  if(campDraft)extra[CAMP_KEY]=JSON.stringify(campDraft);
  return extra;
 });}finally{runSaveDepth--;runSaveRequested=false;}
}
function captureRunCheckpoint(){
 if(!P.campRun)return {version:1,active:false};
 if(!running||P.runWon||P.hp<=0)return {version:1,active:false};
 const player={};for(const key of Object.keys(RUN_NUMBERS))player[key]=P[key]||0;
 Object.assign(player,{gear:{...P.gear},wtype:P.wtype,dropWeapon:P.dropWeapon,campStyle:P.campStyle,trial:P.trial,testRun:!!P.testRun,item:P.item});
 const pet=P.pet?Object.fromEntries(['type','lvl','hp','dead','cd','drop','recall'].map(k=>[k,P.pet[k]??0])):null;
 if(pet)pet.hp=Math.max(0,pet.hp);
 const e=stageBoss?.enemy;
 const boss=e?{id:e.bossSpec.id,hp:Math.max(0,e.hp),rewarded:!!e.rewarded,maxhp:e.maxhp,x:e.x,y:e.y,enteredAt:e.enteredAt,campEntryHits:e.campEntryHits}:null;
 const bag=q=>({stage:q.stage,x:q.x,y:q.y,fromX:q.x,fromY:q.y,age:Math.max(1250,q.age),landed:true,color:q.color,reward:q.reward?{...q.reward}:null,error:false});
 const fields=(x,keys)=>Object.fromEntries(keys.filter(k=>x[k]!==undefined).map(k=>[k,x[k]]));
 const record={version:1,active:true,player,pet,camp:runCopy(P.campRun),
  clocks:{t,spawnT,shotT,eliteT,chestT,healT,score,xpBoost,charge:ult.on?0:ult.charge,queuedLevels},
  offer:activeLevelOffer?runCopy(activeLevelOffer):null,lastPetRoll,
  // Quantised prop geometry keeps a full map comfortably inside the SDK limit.
  props:props.map(p=>[p.kind,Math.round(p.x*10)/10,Math.round(p.y*10)/10,Math.round(p.r*10)/10]),
  secrets:arenaSecrets.map(s=>fields(s,['kind','x','y','r','lit','age'])),secretComplete:arenaSecretComplete,secretIssued:arenaSecretDropIssued,
  economy:P.economy?runCopy(P.economy):undefined,delivery:runCopy(weaponDelivery),
  chests:chests.filter(c=>!c.dead&&!c.rewardGranted).slice(0,80).map(c=>fields(c,['x','y','a','rare','elite','compassReward','dropT','dropDuration','landT','item','rewardKind'])),
  pickups:pickups.slice(0,80).map(c=>fields(c,['x','y','a','kind'])),
  defeated:[...defeatedBossStages],logs:runCopy(bossRunLog),lastBoss:lastBossArchetype,boss,
  bags:allBossLoot().map(bag),collected:[...bossLootCollected],finalChoice:!!bossRewardPending||runResumeChoice==='boss'};
 return record;
}
function validateRunCheckpoint(q){
 const bad=()=>{throw Error('Invalid run checkpoint');};
 const obj=v=>v&&typeof v==='object'&&!Array.isArray(v);
 const n=(v,a,b)=>{if(!Number.isFinite(v)||v<a||v>b)bad();};
 const one=(v,values)=>{if(!values.includes(v))bad();};
 const list=(v,max)=>{if(!Array.isArray(v)||v.length>max)bad();return v;};
 const point=v=>{if(!obj(v))bad();n(v.x,0,WORLD);n(v.y,0,WORLD);};
 const stages=v=>{list(v,4).forEach(s=>one(s,[5,10,15,20]));if(new Set(v).size!==v.length)bad();};
 if(!obj(q)||q.version!==1||typeof q.active!=='boolean')bad();
 if(!q.active)return q;
 if(Object.hasOwn(q,'economy'))validateRunEconomy(q.economy);
 const p=q.player;if(!obj(p)||!obj(p.gear)||!obj(q.clocks)||!obj(q.camp))bad();
 for(const [key,range] of Object.entries(RUN_NUMBERS))n(p[key],...range);
 for(const key of ['stage','lvl','redKills','damageHits','storedGunLevel'])if(!Number.isInteger(p[key]))bad();
 if(p.hp<=0)bad();
 for(const key of GK){n(p.gear[key],0,GEAR[key].max);if(!Number.isInteger(p.gear[key]))bad();}
 one(p.wtype,[...ARSENAL_BRANCHES,...DROP_WEAPONS]);one(p.dropWeapon,[null,...DROP_WEAPONS]);
 if(isDropWeapon(p.wtype)!==!!p.dropWeapon||p.dropWeapon&&p.dropWeapon!==p.wtype)bad();
 one(p.trial,CAMP_TRIALS);one(p.campStyle,CAMP_STYLES);one(p.item,[null,...Object.keys(ITEMS)]);
 if(typeof p.testRun!=='boolean')bad();
 for(const [key,range] of Object.entries(RUN_CLOCKS))n(q.clocks[key],...range);
 if(!Number.isInteger(q.clocks.queuedLevels)||!Number.isInteger(q.clocks.score)||p.redKills>q.clocks.score)bad();
 n(q.camp.kills,0,q.clocks.score);stages(q.camp.bosses);if(q.camp.won!==false||typeof q.camp.shotgunOnly!=='boolean')bad();
 one(q.camp.weapon,ARSENAL_BRANCHES);list(q.camp.unlocks,8).forEach(id=>one(id,CAMP_GOALS.map(g=>g.id)));
 if(q.pet!==null){const pet=q.pet;if(!obj(pet))bad();one(pet.type,Object.keys(PETS));n(pet.lvl,1,PET_MAX);if(!Number.isInteger(pet.lvl))bad();for(const k of ['hp','dead','cd','drop','recall'])n(pet[k],k==='hp'?0:-1e5,1e6);}
 one(q.lastPetRoll,[null,...Object.keys(PETS)]);
 if(q.offer!==null){if(!obj(q.offer))bad();list(q.offer.pick,4).forEach(k=>one(k,[...GK,'@pet']));one(q.offer.pet,[null,...Object.keys(PETS)]);if(!q.clocks.queuedLevels)bad();}
 list(q.props,70).forEach(a=>{if(!Array.isArray(a)||a.length!==4)bad();one(a[0],['rock','bush','tree']);n(a[1],0,WORLD);n(a[2],0,WORLD);n(a[3],20,60);});
 list(q.secrets,3).forEach(s=>{point(s);one(s.kind,['mine','nade','ice']);n(s.r,0,150);n(s.age,0,86400000);if(typeof s.lit!=='boolean')bad();});
 if(typeof q.secretComplete!=='boolean'||typeof q.secretIssued!=='boolean')bad();
 const d=q.delivery;if(!obj(d)||typeof d.rolled!=='boolean'||typeof d.eligible!=='boolean')bad();
 one(d.state,['waiting','flying','ground','collected']);one(d.weapon,[null,...DROP_WEAPONS]);n(d.stage,0,9);n(d.age,0,86400000);
 if(d.state!=='waiting')point(d);if(d.eligible&&(!d.rolled||d.weapon===null))bad();
 list(q.chests,80).forEach(c=>{point(c);if(c.item!==undefined&&c.item!==null)one(c.item,Object.keys(ITEMS));if(c.rewardKind!==undefined)one(c.rewardKind,ABILITY_KEYS);for(const k of ['a','dropT','dropDuration','landT'])if(c[k]!==undefined)n(c[k],0,1e8);});
 list(q.pickups,80).forEach(c=>{point(c);one(c.kind,Object.keys(BOOSTS));n(c.a,0,1e8);});
 stages(q.defeated);stages(q.collected);list(q.logs,4).forEach(l=>{one(l.stage,q.defeated);one(l.id,CAMP_BOSSES);n(l.ms,0,86400000);if(typeof l.clean!=='boolean')bad();});
 if(q.logs.length!==q.defeated.length||new Set(q.logs.map(l=>l.stage)).size!==q.logs.length)bad();
 one(q.lastBoss,[null,...CAMP_BOSSES]);
 if(q.boss!==null){point(q.boss);one(q.boss.id,CAMP_BOSSES);n(q.boss.hp,0,1e7);n(q.boss.maxhp,Math.max(1,q.boss.hp),1e7);n(q.boss.enteredAt,0,p.runMs);n(q.boss.campEntryHits,0,p.damageHits);if(!isBossStage(p.stage)||q.defeated.includes(p.stage)||typeof q.boss.rewarded!=='boolean'||!q.boss.hp&&!q.boss.rewarded)bad();}
 list(q.bags,4).forEach(b=>{point(b);one(b.stage,q.defeated);if(q.collected.includes(b.stage))bad();n(b.age,0,86400000);if(typeof b.color!=='string'||!/^#[0-9a-f]{3,8}$/i.test(b.color))bad();
  if(b.reward!==null){const r=b.reward;if(!obj(r))bad();one(r.kind,['gear','supply','heal','ult','continue']);if(r.kind==='gear')one(r.key,GK);if(r.kind==='supply')one(r.key,ABILITY_KEYS);if(typeof r.title!=='string'||r.title.length>150)bad();}});
 if(new Set(q.bags.map(b=>b.stage)).size!==q.bags.length)bad();
 if(typeof q.finalChoice!=='boolean'||q.finalChoice&&(p.stage!==20||!q.collected.includes(20)))bad();
 if(q.defeated.some(s=>s>p.stage)||q.collected.some(s=>!q.defeated.includes(s)))bad();
 if(q.defeated.some(s=>!q.collected.includes(s)&&!q.bags.some(b=>b.stage===s)))bad();
 if(p.stage===20&&q.defeated.includes(20)&&!q.finalChoice&&!q.bags.some(b=>b.stage===20))bad();
 return q;
}
function loadRunCheckpoint(){
 let q;
 try{const raw=Playables.storage.getItem(RUN_KEY);if(!raw)return false;if(raw.length>18000)throw Error('Run too large');q=validateRunCheckpoint(JSON.parse(raw));}
 catch(_){runSaveReadOnly=true;runSaveNotice='unreadable';return false;}
 if(!q.active)return false;
 // An admin-modified run must never become a ranked public continuation.
 if(q.player.testRun&&!Playables.testStorage){runSaveReadOnly=true;runSaveNotice='unreadable';return false;}
 Object.assign(P,q.player,{gear:{...q.player.gear},campRun:runCopy(q.camp),runWon:false,rankingRecorded:false,rankingQueued:false});
 if(q.economy)P.economy=runCopy(q.economy);
 applyGear();P.hurt=1500;P.seen={x:P.x,y:P.y};pointer={x:P.x,y:P.y,active:false};
 ({t,spawnT,shotT,eliteT,chestT,healT,score,xpBoost,queuedLevels}=q.clocks);ult.charge=q.clocks.charge;
 if(q.pet){P.pet=Object.assign(makePet(q.pet.type),q.pet);P.pet.hpMax=petStats(P.pet).hp;P.pet.hp=Math.min(P.pet.hp,P.pet.hpMax);}
 props=q.props.map(([kind,x,y,r])=>{const pts=[],count=kind==='rock'?7:6;for(let j=0;j<count;j++){const a=j/count*6.283,rr=r*(.78+hash(x+j,y)*.34);pts.push([Math.cos(a)*rr,Math.sin(a)*rr]);}return {kind,x,y,r,pts,seed:hash(x,y)};});
 arenaSecrets=runCopy(q.secrets);arenaSecretComplete=q.secretComplete;arenaSecretDropIssued=q.secretIssued;weaponDelivery=runCopy(q.delivery);
 chests=runCopy(q.chests);pickups=runCopy(q.pickups);buildNightScenery();nightFade=isBossStage(P.stage)?1:0;
 for(const s of q.defeated)defeatedBossStages.add(s);bossRunLog=runCopy(q.logs);lastBossArchetype=q.lastBoss;
 for(const s of q.collected)bossLootCollected.add(s);bossLoot=q.bags[0]?runCopy(q.bags[0]):null;bossLootWaiting.push(...runCopy(q.bags.slice(1)));
 if(q.boss){
  const s=q.boss,spec={...BOSS_SPECS.find(v=>v.stage===P.stage),...BOSS_ARCHETYPES.find(v=>v.id===s.id),hp:s.maxhp};
  startStageBoss(spec);Object.assign(stageBoss.enemy,{hp:s.hp,rewarded:s.rewarded,maxhp:s.maxhp,x:s.x,y:s.y,enteredAt:s.enteredAt,campEntryHits:s.campEntryHits});
 }
 lastPetRoll=q.lastPetRoll;activeLevelOffer=q.offer;runResumeChoice=q.finalChoice?'boss':queuedLevels?'level':null;
 running=true;paused=true;userPaused=true;menuHasRun=true;runSaveNotice='restored';
 cam.x=Math.max(0,Math.min(WORLD-W,P.x-W/2));cam.y=Math.max(0,Math.min(WORLD-H,P.y-H/2));
 return true;
}
function continueRunCheckpoint(){
 const choice=runResumeChoice;runResumeChoice=null;
 if(choice==='boss')offerBossReward(20);
 else if(choice==='level')offerCards(activeLevelOffer);
 runSaveNotice='';refreshRunCheckpointLabel();
}
function refreshRunCheckpointLabel(){
 const node=document.getElementById('runCheckpointNote');if(!node)return;
 const ru=typeof uiLanguage==='undefined'||uiLanguage==='ru';
 const text=runSaveReadOnly?(ru?'Сохранённый забег не удалось прочитать. Исходные данные сохранены.':'Saved run could not be read. Original data was preserved.'):
  menuHasRun?(ru?'Продолжить · стадия ':'Continue · stage ')+P.stage+'/20 · '+formatRunTime(P.runMs):'';
 node.textContent=text;node.classList.toggle('hidden',!text);
}
