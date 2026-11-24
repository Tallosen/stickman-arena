const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),make=require('./arena-harness.cjs');
const h=make();h.box.assert=assert;
h.run(`
function liveBag(stage){reset();running=true;paused=false;props=[];P.x=1000;P.y=1000;P.hp=P.hpMax=1000;P.stage=stage+1;P.run=.8;
 dropBossLoot(stage,{x:P.x,y:P.y,bossSpec:{}});P.x=bossLoot.x;P.y=bossLoot.y;bossLoot.age=1500;
 pointer.active=true;pointer.x=P.x+500;pointer.y=P.y;inventory.tank=3;bossLoot.reward=bossRewardOptions(20).find(o=>o.key==='tank');}
for(const stage of [5,10,15]){
 liveBag(stage);let sounds=0;SFX.chest=()=>sounds++;
 assert(pickupBossLoot());assert(pointer.active);assert.equal(P.run,.8);assert(!bossLootLocked());assert(!pickupBossLoot());
 const start=P.runMs,shot=makeHeroShot({x:P.x,y:P.y-150},0,1,'sniper',{crit:false});
 for(let i=0;i<22;i++){const x=P.x,clock=t,phase=P.phase,sx=shot.x;update(34);assert(P.x>x,'Movement must continue on every opening frame');assert(shot.x>sx,'Projectiles must keep moving');assert(t>clock);assert(P.phase>phase);assert(pointer.active);assert(!paused);}
 assert(P.runMs>start);assert(!bossLootOpening&&!bossLoot);assert.equal(inventory.tank,4);assert.equal(bossLootNotices.length,1);assert.equal(sounds,1,'One pickup cue, not two overlapping chest sounds');
}
liveBag(5);pickupBossLoot();paused=true;const age=bossLootOpening.age,x=P.x;update(34);assert.equal(bossLootOpening.age,age);assert.equal(P.x,x);paused=false;
ult.charge=ULT_FULL;startUlt();assert(ult.on,'Opening an ordinary trophy must not block an ultimate');for(let i=0;i<22;i++)update(34);assert.equal(inventory.tank,4);assert(!bossLootOpening);
reset();running=true;paused=false;props=[];dropBossLoot(20,{x:P.x,y:P.y,bossSpec:{}});P.x=bossLoot.x;P.y=bossLoot.y;bossLoot.age=1500;pointer.active=true;
assert(pickupBossLoot());assert(bossLootLocked());assert(!pointer.active);for(let i=0;i<22;i++)update(34);assert(paused&&bossRewardPending?.stage===20&&!P.runWon);
`);
// Native render checks the closed chin plate at both tiers and facings.
const v=make({native:true,width:640,height:440});
v.run(`ctx.fillStyle=PAPER;ctx.fillRect(0,0,W,H);ctx.vackyStableSketch=true;
for(let i=0;i<4;i++){const face=i%2?-1:1,helm=i<2?3:4;drawHero(ctx,80+i*160,365,face,0,{helm,_noShadow:true},4,0,0);}`);
for(let i=0;i<4;i++){
 const pixels=v.ctx.getImageData(80+i*160-18,365-52*4+15,36,7).data;
 let pale=0;for(let j=0;j<pixels.length;j+=4)if(pixels[j]===239&&pixels[j+1]===230&&pixels[j+2]===210)pale++;
 assert.equal(pale,0,'No pale nasal outline on lower face');
}
if(process.argv.includes('--frames'))fs.writeFileSync(path.join(__dirname,'../audit/helmet-v0194.png'),v.canvas.toBuffer('image/png'));
console.log('PASS: continuous pickup movement/clock, retained input, no double cue, pause/ultimate/final guards and closed helmet chin');
