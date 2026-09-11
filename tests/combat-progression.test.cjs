const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..'),box={console,assert};vm.createContext(box);
vm.runInContext(`
const noop=()=>{},cv={addEventListener:noop},addEventListener=noop,requestAnimationFrame=noop;
const localStorage={getItem:()=>null,setItem:noop},document={addEventListener:noop,body:{classList:{remove:noop}}};
const SFX={shot:noop},ult={on:false},WORLD=2800,hash=()=>.5;
const resetAbilities=noop,resetDragonFinale=noop,ultPointerUp=noop;
let dragonFinale=null;function unlockDragonAltar(){}
`,box);
for(const file of ['config.js','state.js','combat.js','update.js'])vm.runInContext(fs.readFileSync(path.join(root,'src',file),'utf8'),box,{filename:file});
vm.runInContext(`
function init(w='basic',clip=0){
 Object.assign(P,{x:1400,y:1400,face:1,phase:0,run:0,lvl:1,hp:5,xp:0,gear:Object.fromEntries(GK.map(k=>[k,0])),wtype:w,pet:null,
 aim:0,hasteT:0,recoilT:0,backpackQueue:[],backpackFlash:[0,0,0],backpackCooldown:0});
 P.gear.clip=clip;applyGear();shots=[];enemies=[];puffs=[];shotT=0;shake=0;queuedLevels=0;xpBoost=0;ult.on=false;dragonFinale=null;
}
for(const weapon of Object.keys(WEAPONS))for(let clip=0;clip<=3;clip++)for(const face of [-1,1]){
 init(weapon,clip);enemies=Array.from({length:4},(_,i)=>({x:P.x+face*(95+i*13),y:P.y+i*20,hp:1000}));
 updateHeroFire(0);
 const hand=shots.filter(s=>s.source==='hand');assert.equal(hand.length,weapon==='shotgun'?P.pellets:1);
 const muzzle=heroGunTip();assert(hand.every(s=>Math.hypot(s.x-muzzle.x,s.y-muzzle.y)<1e-8));
 assert.equal(P.backpackQueue.length,clip);
 shotT=1e5;updateHeroFire(200);
 const extras=shots.filter(s=>s.source==='backpack');assert.equal(extras.length,clip);
 extras.forEach((s,i)=>{const port=backpackPort(i,P.face),origin=heroCombatPoint(port.mx,port.my);
   assert(Math.hypot(s.x-origin.x,s.y-origin.y)<1e-8);assert.equal(P.backpackFlash[i],110);
   assert(s.vx*P.face<0,'Does not leave pack backwards');assert(s.target===enemies[i+1]);
 });
 assert.equal(P.backpackQueue.length,0);
}
console.log('PASS: 4 weapons × 4 backpack tiers × 2 directions, single hand muzzle, correct pod origins/counts and staggered fire');
// Guided bullets must actually reach enemies, not orbit forever after the arc.
for(const weapon of ['basic','sniper','shotgun','minigun'])for(const side of [-1,1])for(const targetY of [-110,0,110]){
 init(weapon,3);enemies=[{x:P.x+side*130,y:P.y+targetY,hp:1000}];updateHeroFire(0);shotT=1e5;updateHeroFire(200);
 for(const s of shots.filter(s=>s.source==='backpack')){
   let reached=false;
   for(let ms=0;ms<s.life;ms+=8){steerBackpackShot(s,8,8/16.67);s.x+=s.vx*8/16.67;s.y+=s.vy*8/16.67;
     assert(Number.isFinite(s.x+s.y));if(Math.hypot(s.x-s.target.x,s.y-s.target.y)<15){reached=true;break;}}
   assert(reached,'Guided shot missed stationary target: '+weapon+'/'+side+'/'+targetY+'/'+s.slot);
 }
}
init('basic',3);enemies=[{x:1500,y:1400,hp:10}];updateHeroFire(0);enemies[0].hp=0;shotT=1e5;updateHeroFire(200);
assert.equal(shots.filter(s=>s.source==='backpack').length,0);
init('basic',3);enemies=[{x:1500,y:1400,hp:10}];updateHeroFire(0);ult.on=true;updateHeroFire(200);assert.equal(P.backpackQueue.length,0);
console.log('PASS: all 72 guided shots reach their targets; dead targets and cinematic cancellation are safe');
for(const w of Object.keys(WEAPONS))for(const fast of [false,true]){
 init(w,3);P.gear.gun=4;P.gear.gloves=3;P.lvl=34;applyGear();P.hasteT=fast?10000:0;
 enemies=[{x:P.x+140,y:P.y,hp:1e9}];
 for(let ms=0;ms<12000;ms+=10)updateHeroFire(10);
 const pack=shots.filter(s=>s.source==='backpack').length,hand=shots.filter(s=>s.source==='hand').length;
 assert(pack<=42,'Auxiliary fire exceeded 14 salvos in 12s');
 assert(pack<=hand*3*.65,'Backpack still follows every main shot');
 assert(P.backpackQueue.length<=3);
}
init('sniper',3);P.gear.scope=3;applyGear();assert(P.range>BACKPACK_RANGE_MAX);
enemies=[{x:P.x+421,y:P.y,hp:100}];updateHeroFire(0);assert.equal(P.backpackQueue.length,0);assert(shots.some(s=>s.source==='hand'));
init('basic',3);enemies=[{x:P.x+P.range-1,y:P.y,hp:100}];updateHeroFire(0);enemies[0].x=P.x+P.range+1;updateHeroFire(200);
assert.equal(shots.filter(s=>s.source==='backpack').length,0,'Queued target escaped range but was fired on');
init('sniper',1);enemies=[{x:P.x+200,y:P.y,hp:100}];updateHeroFire(0);updateHeroFire(200);
const ranged=shots.find(s=>s.source==='backpack');const anchor={...ranged.anchor};
enemies[0].x=anchor.x+421;ranged.age=200;steerBackpackShot(ranged,16,1);assert(!ranged.target);
enemies.push({x:anchor.x+419,y:anchor.y,hp:100});steerBackpackShot(ranged,16,1);assert.equal(ranged.target,enemies[1]);
P.x+=1000;assert.equal(ranged.anchor.x,anchor.x);assert(backpackTargetInRange(ranged,enemies[1]));
assert(!backpackTargetInRange(ranged,enemies[0]));
console.log('PASS: separate salvo cadence across all weapons/haste; bounded queue, 420 cap, launch recheck, no out-of-range retargeting, fixed flight anchor');
init();const sum=heroXPRequired(1)+heroXPRequired(2)+heroXPRequired(3)+123;
gainXP(sum);assert.equal(P.lvl,4);assert.equal(P.xp,123);assert.equal(queuedLevels,3);assert.equal(P.xpNext,heroXPRequired(4));
for(const stage of [1,5,15,34]){
 init();P.lvl=stage;applyGear();gainXP(P.xpNext-1);assert.equal(P.lvl,stage);gainXP(1);assert.equal(P.lvl,stage+1);assert.equal(P.xp,0);
}
init();P.gear.cape=3;applyGear();gainXP(100);assert.equal(P.xp,130);xpBoost=1000;gainXP(100);assert.equal(P.xp,390);
init();P.lvl=34;P.pet={lvl:5};GK.forEach(k=>P.gear[k]=GEAR[k].max);applyGear();gainXP(1e7);
assert.equal(P.lvl,34);assert.equal(P.xp,P.xpNext);assert.equal(queuedLevels,0);
console.log('PASS: growing thresholds, exact boundaries, multi-level overflow, XP bonuses, full-build cap');
for(let level=1;level<=50;level++)assert(heroXPRequired(level)>=heroXPRequired(Math.max(1,level-1)));
const table=[];
for(const efficiency of [.65,.8,1]){
 let level=1,xp=0,fullAt=null;
 for(let sec=0;sec<1500;sec++){
  const stage=Math.min(20,1+Math.floor(sec/60));
  xp+=stageXPIncome(stage)*efficiency;
  while(xp>=heroXPRequired(level)){xp-=heroXPRequired(level++);}
  // 33 build choices plus two optional weapon swaps.
  if(level>=36){fullAt=sec+1;break;}
 }
 table.push({efficiency,fullSeconds:fullAt,level});
 assert(fullAt&&fullAt<=1500,'Typical build cannot finish by overtime end');
}
console.table(table);
console.log('PASS: separate hero XP curve; analytical supply model only, not a player playtest');
`,box);
