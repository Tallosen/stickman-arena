const assert=require('assert'),h=require('./arena-harness.cjs')({native:true,width:390,height:844});h.box.assert=assert;
h.run(`
document.getElementById('victoryDragonCanvas').width=420;document.getElementById('victoryDragonCanvas').height=245;
reset();running=true;P.runMs=1000;enterRunStage(5);const arriving=stageBoss.enemy;assert.equal(arriving.entryAge,0);pointer.active=true;
updateBossEncounter(500);assert.equal(arriving.entryAge,500);assert(pointer.active);paused=true;updateBossEncounter(900);assert.equal(arriving.entryAge,500);paused=false;
drawBossArrival(ctx);
// All phases latch once and produce different movement/attack states.
for(const id of ['bruiser','gunner','hunter','shaman']){
 reset();running=true;props=[];enterRunStage(20);const e=stageBoss.enemy;e.bossSpec={...e.bossSpec,...BOSS_ARCHETYPES.find(a=>a.id===id)};
 e.hp=e.maxhp*.5;e.attackCd=0;e.bossCycle=0;bossMovementIntent(e,P.x,P.y,16);assert(e.phase2);assert(e.phaseBanner>0);
 e.hp=e.maxhp;assert(bossPhase2(e),'phase must not oscillate');
 if(id==='gunner'||id==='hunter'){e.attackState='recover';e.attackT=1;bossMovementIntent(e,P.x,P.y,16);assert.equal(e.attackState,'reposition');const p={x:e.x,y:e.y};const intent=bossMovementIntent(e,P.x,P.y,16);assert(intent.locked&&intent.pace>1);assert.equal(e.x,p.x);}
 if(id==='bruiser'){bossMarks=[];e.attackState='dash';e.attackT=1;e.dashAngle=0;bossMovementIntent(e,P.x,P.y,16);assert.equal(bossMarks.length,1);assert(bossMarks[0].delay>=800);}
 if(id==='shaman'){bossMarks=[];e.attackState='chase';e.attackCd=0;e.bossCycle=0;bossMovementIntent(e,P.x,P.y,16);assert.equal(bossMarks.length,6);assert(bossMarks.every(m=>Math.abs(Math.hypot(m.x-P.x,m.y-P.y)-145)<.01));}
 drawBossArrival(ctx);
}
reset();running=true;P.hp=1;ult.charge=0;queuedLevels=2;offerBossReward(5);assert(paused);const stage=P.stage,clock=P.runMs;
updateRunProgress(1000);assert.equal(P.runMs,clock);assert.equal(P.stage,stage);
const offer=bossRewardPending;assert.equal(offer.options.length,3);assert(offer.options.some(o=>o.kind==='gear'));assert(offer.options.some(o=>o.kind==='heal'));
assert(!claimBossReward('invalid'));assert.strictEqual(bossRewardPending,offer);
assert(claimBossReward('heal'));assert.equal(P.hp,5);assert.equal(queuedLevels,2);assert.equal(P.stage,6);assert(!paused);assert(!claimBossReward('heal'));
P.gear=Object.fromEntries(GK.map(k=>[k,GEAR[k].max]));applyGear();P.hp=P.hpMax;ult.charge=ULT_FULL;
offerBossReward(10);assert(bossRewardPending.options.every(o=>o.kind==='supply'));const supply=bossRewardPending.options[0],old=inventory[supply.key];claimBossReward(supply.id);assert.equal(inventory[supply.key],old+1);
offerBossReward(15);reset();assert.equal(bossRewardPending,null);assert.equal(bossRunLog.length,0);
// Four genuine defeated stages, one reward each, one final record; reset preserves record.
running=true;P.runMs=1000;meta.bestClearMs=0;
for(const s of [5,10,15,20]){enterRunStage(s);P.runMs+=1000;stageBoss.enemy.hp=0;stageBoss.enemy.rewarded=true;updateRunProgress(0);assert(bossLoot&&!paused);assert.equal(bossRunLog.length,s/5);P.x=bossLoot.x;P.y=bossLoot.y;updateBossLoot(34,1000);updateBossLoot(34,300);for(let i=0;i<7;i++)updateBossLoot(100,100);if(s===20)claimBossReward(bossRewardPending.options[0].id);}
assert(P.runWon);assert.equal(meta.bestClearMs,5000);assert.equal(bossRunLog.length,4);assert(!finishArenaVictory());reset();assert.equal(meta.bestClearMs,5000);
running=true;P.testRun=true;P.stage=20;P.runMs=100;for(const s of [5,10,15,20])defeatedBossStages.add(s);finishArenaVictory();assert.equal(meta.bestClearMs,5000);
console.log('PASS: arrival and pause, four phase-two tactics, explicit escape corridor, rewards/duplicate guards, max-build supplies, preserved queued levels, reset, four-stage results and record protection');
`);
