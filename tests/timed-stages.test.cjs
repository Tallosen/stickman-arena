const assert=require('assert'),h=require('./arena-harness.cjs')();
h.box.assert=assert;
h.run(`
reset();running=true;paused=false;props=[];
updateRunProgress(59999);assert.equal(P.stage,1);assert.equal(stageRemaining(),1);
updateRunProgress(1);assert.equal(P.stage,2);assert.equal(stageRemaining(),60000);
const level=P.lvl;updateRunProgress(180000);assert.equal(P.stage,5);assert(stageBoss);assert.equal(P.lvl,level);
const first=stageBoss.enemy;updateRunProgress(9000000);assert.equal(P.stage,5);assert.strictEqual(stageBoss.enemy,first);
assert(!campaignComplete());assert.equal(dragonAltar,null);
paused=true;const time=P.runMs;updateRunProgress(60000);updateBossEncounter(10000);assert.equal(P.runMs,time);paused=false;
for(const stage of [5,10,15,20]){
 assert.equal(P.stage,stage);const e=stageBoss.enemy;
 const old=e.hp;hit(e,e.hp+99999,P.x,P.y);assert(e.hp>0);assert(old-e.hp<=e.maxhp*.056);
 // Compasses cannot carry bosses away or insta-kill them.
 compassStorm={age:0,duration:6000};updateCompassStorm(6001);assert(!e.stormCaught);assert(e.hp>0);
 // Every flight stays assistance, with movement and vulnerability intact.
 e.hp=1;P.hp=3;pointer.active=true;assert(startDragonAssist());updateBossEncounter(2200);
 assert.equal(e.hp,1);assert.equal(P.hp,3);assert(pointer.active);assert(running);assert.equal(dragonFinale,null);
 updateBossEncounter(2500);assert.equal(dragonAssist,null);
 hit(e,2,P.x,P.y);assert(e.rewarded);updateRunProgress(0);
 assert(bossLoot);assert(!bossRewardPending);assert(!paused);P.x=bossLoot.x;P.y=bossLoot.y;updateBossLoot(34,1000);updateBossLoot(34,300);for(let i=0;i<7;i++)updateBossLoot(100,100);
 if(stage===20){assert(bossRewardPending);assert(paused);claimBossReward(bossRewardPending.options[0].id);}else assert(!bossRewardPending&&!paused);
 if(stage<20){assert.equal(P.stage,stage+1);assert(!isBossStage(P.stage));updateRunProgress(240000);}
}
assert(P.runWon);assert(!running);assert(campaignComplete());assert.equal(defeatedBossStages.size,4);
const finished=P.runMs;updateRunProgress(60000);assert.equal(P.runMs,finished);
reset();assert(!P.runWon);assert.equal(P.stage,1);assert.equal(P.stageMs,0);assert.equal(stageBoss,null);assert.equal(defeatedBossStages.size,0);
running=true;P.lvl=34;P.gear.helm=4;applyGear();assert.equal(P.hpMax,17+meta.hp);
for(let lv=1;lv<=40;lv++){P.lvl=lv;applyGear();assert.equal(P.hpMax,9+meta.hp+Math.floor((lv-1)/4));}
assert(!finishArenaVictory());assert(!startDragonFinale());assert(!finishDragonVictory());
for(const stage of [5,10,15,20]){
 reset();running=true;props=[];enterRunStage(stage);const e=stageBoss.enemy;
 Object.assign(e,{x:P.x-120,y:P.y,attackCd:0});const before=P.hp;
 bossMovementIntent(e,P.x,P.y,16);
 assert(['recover','windup','shootwindup'].includes(e.attackState));assert.equal(P.hp,before);
 if(bossMarks.length){const mark=bossMarks[0];P.x=mark.x;P.y=mark.y;P.hurt=0;updateBossEncounter(mark.delay-1);assert.equal(P.hp,before);updateBossEncounter(1);assert(P.hp<before);}
 else{const angle=e.dashAngle;bossMovementIntent(e,P.x,P.y+1000,100);assert.equal(e.dashAngle,angle);}
}
`);
for(const fps of [15,30,60]){
 h.run('reset();running=true;paused=false;last=0;hitStop=0;update=(dt,activeMs)=>{assert(dt<=34);updateRunProgress(activeMs);};');
 for(let f=1;f<=60*fps;f++)h.frame(f*1000/fps);
 h.run('assert(Math.abs(P.runMs-60000)<.001);assert.equal(P.stage,2);paused=true;');
 const pausedAt=h.run('P.runMs');h.frame(61000);assert.equal(h.run('P.runMs'),pausedAt,'Pause preserves the exact pre-pause clock, including fractional milliseconds');
}
console.log('PASS: boss-gated stages, all four kills to win, no timeout/dragon/compass bypass, health growth, telegraphs, pause/reset, 15/30/60 FPS clocks');
