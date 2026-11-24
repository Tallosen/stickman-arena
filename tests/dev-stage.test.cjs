const fs=require('fs'),path=require('path'),assert=require('assert'),h=require('./arena-harness.cjs')();h.box.assert=assert;
const ui=fs.readFileSync(path.join(__dirname,'../src/ui.js'),'utf8');
h.run(ui.slice(ui.indexOf('function devNextStage()'),ui.indexOf("devStage.addEventListener('pointerenter'")));
h.run(`
reset();running=true;props=[];const hp=P.hp,xp=P.xp,lvl=P.lvl;
for(let stage=2;stage<=20;stage++){
 if(isBossStage(P.stage)){bossMark(P.x,P.y,40,stageBoss.enemy,1000);startDragonAssist();}
 assert(devNextStage());assert.equal(P.stage,stage);assert.equal(P.stageMs,0);assert.equal(P.runMs,0);
 assert.equal(P.hp,hp);assert.equal(P.xp,xp);assert.equal(P.lvl,lvl);assert.equal(score,0);
 assert.equal(bossMarks.length,0);assert.equal(dragonAssist,null);
 assert.equal(enemies.filter(e=>e.boss).length,isBossStage(stage)?1:0);
 assert.equal(!!stageBoss,isBossStage(stage));
}
assert(!devNextStage());assert(!P.runWon);assert(!defeatedBossStages.has(20));
stageBoss.enemy.hp=0;stageBoss.enemy.rewarded=true;updateRunProgress(0);assert(bossLoot);assert(!devNextStage());P.x=bossLoot.x;P.y=bossLoot.y;updateBossLoot(34,1000);updateBossLoot(34,300);for(let i=0;i<7;i++)updateBossLoot(100,100);assert(bossRewardPending&&!P.runWon);assert(!devNextStage());assert(claimBossReward(bossRewardPending.options[0].id));assert(P.runWon);assert(P.testRun);assert.equal(meta.bestClearMs,0);
reset();running=true;paused=true;assert(!devNextStage());paused=false;ult.on=true;assert(!devNextStage());ult.on=false;
globalThis.Playables={blocked:true};assert(!devNextStage());Playables.blocked=false;assert(devNextStage());
running=false;assert(!devNextStage());assert.equal(P.stage,2);reset();assert.equal(defeatedBossStages.size,0);
`);
// Guard is checked in the handler, not only by hiding the cloud UI.
h.run('running=true;paused=false;');
h.run(ui.slice(ui.indexOf('function devNextStage()'),ui.indexOf("devStage.addEventListener('pointerenter'")).replace('!DRAGON_ADMIN_ENABLED','!false'));
assert.equal(h.run('devNextStage()'),false);
console.log('PASS: stage shortcut 1–20, single boss/night entry, no XP/heal/time/reward, cleanup, final boss required, reset and cloud/pause/SDK guards');
