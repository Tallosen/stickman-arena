const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const noop=()=>{},ctx=new Proxy({},{get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
const element=()=>({style:{},classList:{add:noop,remove:noop,contains:()=>true},addEventListener:noop,getContext:()=>ctx,appendChild:noop});
const storage=new Map();
const box={assert,console,failSave:false,document:{body:element(),getElementById:()=>element(),createElement:element,addEventListener:noop},
 innerWidth:390,innerHeight:844,devicePixelRatio:1,addEventListener:noop,requestAnimationFrame:noop,setTimeout:noop,
 localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>{if(box.failSave)throw Error('Storage denied');storage.set(k,v);}},hud:noop};box.window=box;vm.createContext(box);
for(const f of ['core.js','config.js','map-art.js','arena-secrets.js','pets.js','draw-pets.js','ult.js','state.js','progression.js','world.js','enemy-hazards.js','combat.js','abilities.js','dragon-economy.js','dragons.js','update.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f),'utf8'),box,{filename:f});
vm.runInContext(`
for(const key of Object.keys(SFX))SFX[key]=()=>{};
for(let i=0;i<100;i++){
 reset();assert.equal(arenaSecrets.length,3);
 for(const s of arenaSecrets.slice(1)){
  assert(s.x>120&&s.x<WORLD-120&&s.y>120&&s.y<WORLD-120);
  assert(props.every(o=>dist(s,o)>o.r+90));assert(arenaSecrets.every(q=>q===s||dist(q,s)>650));
 }
}
// A fully obstructed synthetic map must degrade safely, never move collisions.
props=[{x:1400,y:1400,r:5000}];resetArenaSecrets();assert.equal(arenaSecrets.length,1);
reset();running=true;paused=false;props=[];P.hurt=100000;spawnT=eliteT=chestT=healT=shotT=1e9;
const mineSite=arenaSecrets[0],rock=arenaSecrets.find(s=>s.kind==='nade'),well=arenaSecrets.find(s=>s.kind==='ice');
const saved=[P.xp,P.lvl,P.runMs,dragonTotal(),JSON.stringify(inventory)];
P.x=mineSite.x+106;P.y=mineSite.y;P.item='mine';useItem();assert(!mineSite.lit);
P.x=mineSite.x+104;P.item='mine';useItem();assert(mineSite.lit);assert.equal(mines.length,2);assert.equal(P.item,null);
const notices=pops.length;assert(!triggerArenaSecret('mine',mineSite.x,mineSite.y));assert.equal(pops.length,notices);
P.x=rock.x;P.y=rock.y;P.item='nade';useItem();assert(!rock.lit,'Throwing alone reveals secret');
assert.equal(nades.length,1);Object.assign(nades[0],{x:rock.x+150,y:rock.y,vx:0,vy:0,fuse:1});
update(16);assert(rock.lit,'Actual grenade explosion does not reveal rock');assert.equal(nades.length,0);
assert(booms.length>0,'Normal grenade explosion was removed');
P.x=well.x+187;P.y=well.y;P.item='ice';useItem();assert(well.lit);assert.equal(ices.length,1);
assert(arenaSecretComplete);assert.equal(dragonFinale,null);
assert.equal(P.xp,saved[0]);assert.equal(P.lvl,saved[1]);assert.equal(P.runMs,16);assert.equal(dragonTotal(),saved[3]);assert.equal(JSON.stringify(inventory),saved[4]);
updateArenaSecrets(500);const age=well.age;paused=true;updateArenaSecrets(500);assert.equal(well.age,age);
reset();assert(!arenaSecretComplete);assert(arenaSecrets.every(s=>!s.lit));
running=true;paused=true;assert(!triggerArenaSecret('mine',1400,1400));paused=false;
dragonFinale={};assert(!triggerArenaSecret('mine',1400,1400));dragonFinale=null;
const second=arenaSecrets.find(s=>s.kind==='nade');explode(second.x,second.y,155,7);assert(!second.lit,'Unrelated explosion revealed grenade secret');
for(const s of arenaSecrets){s.lit=true;for(const age of [0,300,1400,5000,60000]){s.age=age;drawArenaSecrets(ctx,0,WORLD,0,WORLD);}}
console.log('PASS: 100 safe random placements, obstructed fallback, real mine/ice use and grenade detonation, exact boundaries, no duplicate triggers, no economy/progression changes, pause/finale/reset, finite render smoke');
reset();running=true;paused=false;props=[];spawnT=eliteT=chestT=healT=shotT=1e9;
const rewardBefore={...inventory},levelBefore=P.lvl;
assert(devTestCompass());assert(arenaSecretComplete);assert.equal(chests.length,1);
const delivery=chests[0];assert(delivery.elite);assert.equal(delivery.x,WORLD/2);assert.equal(delivery.y,WORLD/2);
for(let i=0;i<10;i++)devTestCompass();assert.equal(chests.length,1);assert.equal(P.lvl,levelBefore);assert.equal(P.runMs,0);
assert.equal(dist(P,delivery),165);assert.equal(pointer.active,false);
P.x=delivery.x;P.y=delivery.y;P.hurt=100000;
for(let i=0;i<225;i++)update(16);
assert.equal(delivery.dropT,0);assert(chests.includes(delivery));assert.deepEqual({...inventory},rewardBefore);
paused=true;const still=delivery.landT; // update is not called by RAF while paused.
assert(!devTestCompass());assert.equal(delivery.landT,still);paused=false;
globalThis.failSave=true;
for(let i=0;i<42;i++)update(16);
assert(chests.includes(delivery));assert(!delivery.rewardGranted);assert.deepEqual({...inventory},rewardBefore);
const rolledKind=delivery.rewardKind;assert(ABILITY_KEYS.includes(rolledKind));
globalThis.failSave=false;delivery.retryT=0;update(16);
assert(delivery.rewardGranted);assert(!chests.includes(delivery));
assert.equal(delivery.rewardKind,rolledKind);
for(const k of ABILITY_KEYS)assert.equal(inventory[k],rewardBefore[k]+(k===rolledKind?1:0));
const after=JSON.stringify(inventory);assert(!grantEliteChestReward(delivery));assert.equal(JSON.stringify(inventory),after);
assert(!queueCompassDrop());devTestCompass();assert.equal(chests.length,0,'Test button duplicates claimed reward');
for(const k of ABILITY_KEYS)inventory[k]=0;loadInventory();assert.equal(JSON.stringify(inventory),after,'Reward did not reload');
reset();assert(!arenaSecretDropIssued);assert.equal(chests.length,0);assert.equal(JSON.stringify(inventory),after);
running=true;paused=false;devTestCompass();for(let i=0;i<8;i++)spawnChest();
assert.equal(chests.filter(c=>c.elite).length,1);assert.equal(chests.filter(c=>!c.elite).length,3,'Quest reward consumed a normal chest slot');
console.log('PASS: test button, one delivery per run, no pickup in flight/landing, exactly one random charge, fixed roll across save retry, persistence, duplicate guards and reset');
reset();running=true;paused=false;props=[];spawnT=eliteT=chestT=healT=shotT=1e9;P.range=0;P.hurt=100000;
for(const kind of Object.keys(KINDS)){spawn(kind);const e=enemies.at(-1);e.hp=e.maxhp=1e6;}
const victims=[...enemies],expectedXP=victims.reduce((n,e)=>n+e.xp,0),count=victims.length;
devTestCompass();const initial=compassStorm;
update(16);assert(victims.every(e=>e.stormCaught));assert.equal(score,0);
paused=true;updateCompassStorm(1000);assert.equal(compassStorm.age,16);paused=false;
for(let i=0;i<185;i++)update(16);
assert(victims.every(e=>e.rewarded));assert.equal(score,count);assert.equal(P.xp,expectedXP);
// A late-arriving enemy is also removed when the short effect ends.
spawn('basic');const late=enemies.at(-1);late.hp=1e6;
while(compassStorm)update(16);
assert(late.rewarded);assert.equal(score,count+1);assert(initial.age>=6000&&initial.age<6020);
const finalScore=score;update(16);assert.equal(score,finalScore);assert.equal(dragonFinale,null);
reset();assert.equal(compassStorm,null);
running=true;paused=false;devTestCompass();spawn('basic');updateCompassStorm(20);
dragonFinale={};updateCompassStorm(20);assert.equal(compassStorm,null);assert(enemies.every(e=>!e.stormCaught));
console.log('PASS: six-second storm, all enemy types regardless of HP/shield, gradual lift, late arrivals, exact-once XP, pause/reset/finale safety');
`,box);
