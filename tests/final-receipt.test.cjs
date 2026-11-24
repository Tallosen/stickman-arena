const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),make=require('./arena-harness.cjs');
const h=make();h.box.assert=assert;
h.run(`
function winWithLoot(full=false){reset();running=true;paused=false;props=[];for(const n of [5,10,15])defeatedBossStages.add(n);for(const key of ABILITY_KEYS)inventory[key]=full?999:7;enterRunStage(20);stageBoss.enemy.hp=0;stageBoss.enemy.rewarded=true;updateRunProgress(0);P.x=bossLoot.x;P.y=bossLoot.y;bossLoot.age=1500;pickupBossLoot();for(let i=0;i<7;i++)updateBossLoot(100);assert(bossRewardPending&&paused&&!P.runWon);claimBossReward(bossRewardPending.options[0].id);}
winWithLoot();assert(P.runWon);assert(arenaEnding.reward);assert.equal(arenaEnding.reward.key,'airstrike');assert.equal(arenaEnding.reward.total,8);assert.equal(inventory.airstrike,8);assert.equal(arenaEnding.rewardDuration,3400);
assert(document.getElementById('endingTitle').textContent.includes('+1'));assert(document.getElementById('endingSubtitle').textContent.includes('8'));assert(document.getElementById('btnEndingSkip').disabled);assert(!completeArenaEnding());
const saved=JSON.stringify({inventory,meta,gear:P.gear,runMs:P.runMs});let sounded=0;SFX.victory=()=>sounded++;
paused=true;updateArenaEnding(100);assert.equal(arenaEnding.age,0);paused=false;
globalThis.Playables={blocked:true};updateArenaEnding(100);assert.equal(arenaEnding.age,0);Playables.blocked=false;
for(let i=0;i<30;i++)updateArenaEnding(100);assert.equal(arenaEnding.chapter,-1);assert.equal(sounded,0);assert(!completeArenaEnding());
for(let i=0;i<4;i++)updateArenaEnding(100);assert.equal(arenaEnding.chapter,0);assert.equal(sounded,0);
for(let i=0;i<10;i++)updateArenaEnding(100);assert.equal(sounded,1);
for(let i=0;i<90&&arenaEnding;i++)updateArenaEnding(100);assert(!arenaEnding);assert.equal(JSON.stringify({inventory,meta,gear:P.gear,runMs:P.runMs}),saved);
delete globalThis.Playables;winWithLoot(true);assert.equal(arenaEnding.reward.kind,'continue');assert(document.getElementById('endingTitle').textContent.includes('заполнены'));assert.equal(inventory.airstrike,999);
reset();assert(!arenaEnding);globalThis.matchMedia=()=>({matches:true});winWithLoot();assert(arenaEnding.reduced);assert.equal(arenaEnding.rewardDuration,3400);assert.equal(arenaEnding.duration,3200);reset();
`);
if(process.argv.includes('--frames')){
 const {createCanvas}=require('@napi-rs/canvas');
 for(const [width,height,key] of [[390,844,'airstrike'],[844,390,'tank'],[700,570,'gas']]){
  const v=make({native:true,width,height});v.box.key=key;v.box.resultCanvas=createCanvas(420,245);
  v.run(`Object.assign(document.getElementById('victoryDragonCanvas'),{width:420,height:245,getContext:()=>resultCanvas.getContext('2d')});reset();running=true;props=[];P.x=1000;P.y=1000;P.stage=20;for(const k of GK)P.gear[k]=GEAR[k].max;applyGear();P.pet=makePet('dog');cam.x=P.x-W/2;cam.y=P.y-H/2;nightFade=.65;for(const n of [5,10,15,20])defeatedBossStages.add(n);draw();inventory[key]=7;const option=bossRewardOptions(20).find(o=>o.key===key);bossRewardPending={stage:20,options:[option]};claimBossReward(option.id);arenaEnding.age=1200;updateArenaEnding(0);drawArenaEnding(ctx);`);
  // Native Canvas composition of the actual HTML copy, not a browser screenshot.
  const g=v.ctx;g.textAlign='center';g.fillStyle='#efca85';g.font='bold 11px system-ui';g.fillText(v.run("document.getElementById('endingEyebrow').textContent"),width/2,height<480?27:85,width-28);
  g.fillStyle='#fff3d5';g.font='bold 25px system-ui';g.fillText(v.run("document.getElementById('endingTitle').textContent"),width/2,height<480?59:128,width-28);
  g.font='12px system-ui';g.fillText(v.run("document.getElementById('endingSubtitle').textContent"),width/2,height<480?85:160,width-24);
  fs.writeFileSync(path.join(__dirname,'../audit/final-receipt-v0186-'+width+'.png'),v.canvas.toBuffer('image/png'));
 }
}
console.log('PASS: exact saved reward, 3.4s receipt before epilogue, pause/host pause, no early skip, no duplicate grant, full inventory, reset and reduced motion');
