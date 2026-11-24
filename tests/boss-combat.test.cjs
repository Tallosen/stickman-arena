const assert=require('assert'),h=require('./arena-harness.cjs')();h.box.assert=assert;
h.run(`
function initBoss(stage){reset();running=true;paused=false;props=[];enterRunStage(stage);return stageBoss.enemy;}
// A real ability pulse helps, but does not erase a boss in the old ten pulses.
let e=initBoss(20);const hp=e.hp;gasCloud={life:10000,phase:0,pulse:0};
for(let i=0;i<10;i++)updateAbilities(520,520/16.67);
assert(e.hp>hp*.93&&e.hp<hp);assert(!e.rewarded);
// Pause preserves warnings and flights; protection prevents damage, not the attack.
e=initBoss(15);bossMark(P.x,P.y,45,e,1000);startDragonAssist();
paused=true;updateBossEncounter(5000);assert.equal(bossMarks[0].age,0);assert.equal(dragonAssist.age,0);
paused=false;P.invT=1000;const before=P.hp;updateBossEncounter(1000);assert.equal(P.hp,before);
bossMarks=[];dragonAssist=null;P.invT=0;P.hurt=0;P.hp=.5;bossMark(P.x,P.y,45,e,900);
assert(updateBossEncounter(900));assert(!running);assert(!P.runWon);
// Normal attacks leave each boss killable; kill is credited only once.
for(const stage of [5,10,15,20]){
 e=initBoss(stage);let n=0;while(e.hp>0&&n++<1000)hit(e,30,P.x,P.y);
 assert(e.rewarded&&n<1000);const kills=score;popEnemy(e);assert.equal(score,kills);
}
// Repeated pattern updates stay bounded and the final boss has an enrage phase.
for(const stage of [5,10,15,20]){
 e=initBoss(stage);P.invT=1e9;e.x=P.x-160;e.y=P.y;e.attackCd=0;
 for(let i=0;i<4000;i++){
  const intent=bossMovementIntent(e,P.x,P.y,16);updateBossEncounter(16);
  assert(Number.isFinite(intent.vx+intent.vy+intent.pace));assert(bossMarks.length<=8);
 }
 assert(e.bossCycle>=8);assert(running);
 if(stage===20){e.hp=e.maxhp*.4;e.bossSpec={...e.bossSpec,attacks:['aimed']};e.attackState='chase';e.attackCd=0;e.bossCycle=0;bossMovementIntent(e,P.x,P.y,16);assert.equal(e.attackT,800);}
}
// Random assistance has a cooldown and cannot be spammed or award a win.
e=initBoss(10);const random=Math.random;
Math.random=()=>.99;dragonAssistWait=0;updateBossEncounter(16);assert.equal(dragonAssist,null);assert(dragonAssistWait>=25000);
Math.random=()=>.1;dragonAssistWait=0;updateBossEncounter(16);assert(dragonAssist);assert(!startDragonAssist());
Math.random=random;const time=P.runMs;updateBossEncounter(4400);assert.equal(P.runMs,time);assert(!P.runWon);
console.log('PASS: boss gas balance, pause/protection/death, credit once, killability, bounded patterns, enrage and random assist cooldown');
`);
