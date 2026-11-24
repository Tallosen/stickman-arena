const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),make=require('./arena-harness.cjs');
const h=make();h.box.assert=assert;
h.run(`
function defeated(stage,clean=true){if(clean){reset();running=true;paused=false;props=[];P.runMs=1000;}for(const n of [5,10,15,20])if(n<stage)defeatedBossStages.add(n);enterRunStage(stage);const e=stageBoss.enemy;e.x=P.x+170;e.y=P.y;e.hp=0;e.rewarded=true;updateRunProgress(0);return e;}
function collect(q=bossLoot){P.x=q.x;P.y=q.y;q.age=1500;assert(pickupBossLoot(q));for(let i=0;i<7;i++)updateBossLoot(100);}
function chooseFinal(){assert(bossRewardPending?.stage===20&&paused);assert(!P.runWon);assert(!finishArenaVictory());const id=bossRewardPending.options[0].id;assert(claimBossReward(id));assert(!claimBossReward(id));}
let e=defeated(5),bag=bossLoot;assert(bag);assert(!paused&&!bossRewardPending);assert.equal(P.stage,6);assert(!pickupBossLoot());assert(!dropBossLoot(5,e));
const time=P.runMs,x=bag.x,y=bag.y;P.hp=P.hpMax=10000;
for(let i=0;i<90;i++)update(34);assert(P.runMs>time);assert(enemies.length>0);assert.strictEqual(bossLoot,bag);
for(let i=0;i<40;i++)updateBossLoot(34,1000);assert.equal(bag.x,x);assert.equal(bag.y,y);assert(!bossRewardPending);assert(!bossLootLocked());
paused=true;const age=bag.age;updateBossLoot(1000);assert.equal(bag.age,age);paused=false;
globalThis.Playables={blocked:true,storage:localStorage};updateBossLoot(1000);assert.equal(bag.age,age);assert(!pickupBossLoot());Playables.blocked=false;
inventory.airstrike=3;P.item='nade';useItem();assert.equal(P.item,null);assert(useAbility('airstrike'));assert.equal(inventory.airstrike,2);
defeated(10,false);assert.equal(allBossLoot().length,2);assert.equal(P.stage,11);
collect(bossLootWaiting[0]);assert(!bossRewardPending&&!paused);assert.equal(bossLoot.stage,5);assert.equal(bossLootNotices[0].stage,10);
collect();assert(!bossRewardPending&&!paused);assert.equal(P.stage,11);assert(!bossLoot);assert.equal(bossLootCollected.size,2);assert.equal(bossLootNotices.length,2);
const notice=bossLootNotices[0];assert(notice.title&&notice.impact&&notice.category);
paused=true;updateBossLootNotice(1000);assert.equal(notice.age,0);paused=false;ult.on=true;updateBossLootNotice(1000);assert.equal(notice.age,0);ult.on=false;
for(let i=0;i<5;i++)updateBossLootNotice(1000);assert.equal(bossLootNotices[0].stage,5);
defeated(15);P.x=bossLoot.x;P.y=bossLoot.y;bossLoot.age=1500;assert(pickupBossLoot());assert(bossLootOpening);assert(!pickupBossLoot());
const opening=bossLootOpening.age;paused=true;updateBossLoot(100);assert.equal(bossLootOpening.age,opening);paused=false;
for(let i=0;i<7;i++)updateBossLoot(100);assert(!bossRewardPending&&!paused);assert.equal(P.stage,16);assert.equal(bossLootNotices.length,1);
defeated(20);for(const k of ABILITY_KEYS)inventory[k]=7;const finalTime=P.runMs,heroStart=P.x,finalX=bossLoot.x;
assert(!finishArenaVictory());for(let i=0;i<40;i++)update(34);assert(P.x>heroStart);assert.equal(bossLoot.x,finalX);assert(!P.runWon);
for(let i=0;i<220&&bossLoot;i++)update(34);
assert(!P.runWon&&!arenaEnding);assert.equal(bossRewardPending.options.length,3);assert.equal(inventory.airstrike,7);
assert(!claimBossReward('invalid'));const frozen=P.runMs;update(1000);assert.equal(P.runMs,frozen);
const gas=bossRewardPending.options.find(o=>o.key==='gas');assert(gas);assert(claimBossReward(gas.id));assert(!claimBossReward(gas.id));
assert(P.runWon&&arenaEnding&&!running);assert.equal(inventory.gas,8);assert.equal(inventory.airstrike,7);assert.equal(arenaEnding.reward.key,'gas');assert.equal(P.runMs,finalTime);
defeated(20);resetBossLoot();props=[{x:P.x+80,y:P.y,r:50}];dropBossLoot(20,{x:P.x+800,y:P.y,bossSpec:{}});
assert(petPathClear(P.x,P.y,bossLoot.x,bossLoot.y,P.r));assert(Math.hypot(P.x-bossLoot.x,P.y-bossLoot.y)<=240);
for(let i=0;i<250&&bossLoot;i++)update(34);chooseFinal();assert(P.runWon);
// Ordinary save error keeps the same random result and does not announce a grant.
delete globalThis.Playables;defeated(5);inventory.airstrike=7;bossLoot.reward=bossRewardOptions(20)[0];const retryBag=bossLoot;
const save=localStorage.setItem;let writes=0;localStorage.setItem=()=>{writes++;throw Error('quota');};collect();
assert(retryBag.error);assert.equal(inventory.airstrike,7);assert(!bossRewardPending);assert.equal(bossLootNotices.length,0);
for(let i=0;i<20;i++)updateBossLoot(34);assert.equal(writes,1);assert.equal(retryBag.reward.key,'airstrike');
localStorage.setItem=save;retryBag.age=retryBag.retryAt;assert(pickupBossLoot());for(let i=0;i<7;i++)updateBossLoot(100);assert.equal(inventory.airstrike,8);assert.equal(bossLootNotices.length,1);
// Final failure leaves the choice open; retry grants once, then runs the receipt.
defeated(20);inventory.airstrike=7;collect();const finalOffer=bossRewardPending;
localStorage.setItem=()=>{throw Error('quota');};assert(!claimBossReward('supply:airstrike'));assert.strictEqual(bossRewardPending,finalOffer);assert(paused&&!P.runWon);assert.equal(inventory.airstrike,7);
localStorage.setItem=save;assert(claimBossReward('supply:airstrike'));assert.equal(inventory.airstrike,8);assert(P.runWon);
defeated(20);for(const k of ABILITY_KEYS)inventory[k]=999;for(let i=0;i<250&&bossLoot;i++)update(34);assert.equal(bossRewardPending.options[0].kind,'continue');chooseFinal();for(const k of ABILITY_KEYS)assert.equal(inventory[k],999);
defeated(5);defeated(20,false);P.pet=makePet('dog');const petStart=P.pet.x;assert.equal(bossLootWaiting[0].stage,5);
for(let i=0;i<250&&bossLoot;i++)update(34);chooseFinal();assert.notEqual(P.pet.x,petStart);assert(!bossLootCollected.has(5),'Old bags are not silently granted');
reset();assert.equal(bossLoot,null);assert.equal(bossLootOpening,null);assert.equal(bossLootWaiting.length,0);assert.equal(bossLootCollected.size,0);assert.equal(bossLootNotices.length,0);
`);
if(process.argv.includes('--frames')){
 const root=path.join(__dirname,'..');
 for(const [stage,width,height] of [[5,700,570],[10,700,570],[15,700,570],[20,700,570],[20,390,844],[20,844,390]]){
  const v=make({native:true,width,height});v.box.stage=stage;
  v.run(`reset();running=true;props=[];P.x=1000;P.y=1000;for(const key of Object.keys(P.gear))P.gear[key]=4;applyGear();P.pet=makePet('dog');enterRunStage(stage);stageBoss.enemy.x=P.x+150;stageBoss.enemy.y=P.y-50;stageBoss.enemy.hp=0;stageBoss.enemy.rewarded=true;updateRunProgress(0);for(let i=0;i<40;i++)updateBossLoot(34);cam.x=P.x-W/2;cam.y=P.y-H/2;nightFade=.65;draw();`);
  fs.writeFileSync(path.join(root,'audit/boss-loot-v0193-'+stage+(width===700?'':'-'+width)+'.png'),v.canvas.toBuffer('image/png'));
  if(stage===20&&width===700){v.run(`P.x=bossLoot.x-25;P.y=bossLoot.y;bossLoot.age=1500;pickupBossLoot();updateBossLoot(100);updateBossLoot(100);updateBossLoot(100);cam.x=P.x-W/2;cam.y=P.y-H/2;draw();`);fs.writeFileSync(path.join(root,'audit/boss-loot-v0193-opening.png'),v.canvas.toBuffer('image/png'));}
 }
}
console.log('PASS: live combat, multiple trophies, no homing, out-of-order rewards, opening, pause, final walk, obstacles, save retry and reset');
