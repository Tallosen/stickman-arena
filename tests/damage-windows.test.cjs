const assert=require('assert'),h=require('./arena-harness.cjs')();h.box.assert=assert;h.box.pauseFrame=()=>h.frame(100);
h.run(`
reset();running=true;P.hp=5;P.hpMax=5;
assert(!hurtHero(1,{x:P.x-80,y:P.y}));assert.equal(P.hp,4);assert.equal(P.damageFeedback.amount,1);
assert.equal(Math.abs(P.damageFeedback.angle),Math.PI);assert(!P.damageFeedback.area);assert(shake<=6);
const event=P.damageFeedback;hurtHero(4,{x:P.x+80,y:P.y});assert.equal(P.hp,4);assert.strictEqual(P.damageFeedback,event);
paused=true;pauseFrame();assert.equal(event.life,1000);paused=false;updateDamageFeedback(400);assert.equal(event.life,600);
P.hurt=0;P.invT=1000;hurtHero(2);assert.strictEqual(P.damageFeedback,event);P.invT=0;
P.hurt=0;hurtHero(.5,{area:true},true);assert.equal(P.hp,3.5);assert(P.damageFeedback.area);assert.equal(pops.at(-1).txt,'-½');
updateDamageFeedback(1000);assert.equal(P.damageFeedback,null);
P.hurt=0;P.hp=.5;assert(hurtHero(3,{area:true}));assert.equal(P.hp,0);assert.equal(P.damageFeedback.amount,.5);assert(!running);
reset();assert.equal(P.damageFeedback,null);
// Real damage call sites: contact, burning ground, swept incoming sniper shot.
running=true;props=[];spawn('basic');const mob=enemies[0];Object.assign(mob,{x:P.x,y:P.y,speed:0});P.hp=5;update(16);
assert(P.hp<5);assert(P.damageFeedback);enemies=[];
P.hurt=0;enemyFires=[{x:P.x,y:P.y,r:40,damage:1,life:2000}];updateEnemyHazards(16);assert(P.damageFeedback.area);enemyFires=[];
P.hurt=0;enterRunStage(5);const owner=stageBoss.enemy;
bossProjectiles=[{x:P.x-20,y:P.y,vx:8,vy:0,r:3,life:2000,owner}];updateBossEncounter(34);
assert(!P.damageFeedback.area);assert.equal(Math.abs(P.damageFeedback.angle),Math.PI);
// Every tier and archetype gets an earned, bounded window, never during a warning.
for(const stage of [5,10,15,20])for(const id of ['bruiser','gunner','hunter','shaman']){
 reset();running=true;props=[];enterRunStage(stage);const e=stageBoss.enemy;
 e.bossSpec={...e.bossSpec,...BOSS_ARCHETYPES.find(a=>a.id===id)};stageBoss.spec=e.bossSpec;
 e.x=P.x+150;e.y=P.y;e.attackCd=0;e.bossCycle=id==='bruiser'?1:0;e.entryAge=3000;P.invT=100000;
 bossMovementIntent(e,P.x,P.y,16);assert(!(e.vulnerableT>0));
 let found=false;
 for(let i=0;i<200;i++){
  updateBossEncounter(16);bossMovementIntent(e,P.x,P.y,16);
  if(e.vulnerableT>0){assert(!bossMarks.some(m=>m.owner===e&&!m.fired));found=true;break;}
 }
 assert(found,stage+' '+id+' must expose a recovery window');assert.equal(e.attackState,'recover');
 const hp=e.hp;hit(e,10,e.x-10,e.y);assert(Math.abs(hp-e.hp-14)<1e-8);
 const duration=e.vulnerableT;hit(e,1);assert.equal(e.vulnerableT,duration,'hits cannot extend the window');
 paused=true;pauseFrame();assert.equal(e.vulnerableT,duration);paused=false;
 bossMovementIntent(e,P.x,P.y,duration);assert.equal(e.vulnerableT,0);
 const after=e.hp;hit(e,10);assert.equal(after-e.hp,10);
 openBossWindow(e,1200,'stagger');const cap=e.maxhp*(stage>=15?.025:.055),before=e.hp;hit(e,1e9);assert(Math.abs(before-e.hp-cap)<1e-8);
 e.hp=1;dragonAssist={age:2100,struck:false,type:0,x:e.x,y:e.y};updateBossEncounter(0);assert.equal(e.hp,1,'dragon cannot deliver a killing blow during vulnerability');
}
// Swept dash collision opens the long stagger window on an actual map obstacle.
reset();running=true;props=[];enterRunStage(5);const ram=stageBoss.enemy;
ram.bossSpec={...ram.bossSpec,...BOSS_ARCHETYPES[0]};Object.assign(ram,{x:P.x+100,y:P.y,entryAge:3000,attackState:'dash',attackT:600,dashAngle:0});
props=[{x:ram.x+ram.r+31,y:ram.y,r:40,kind:'rock'}];P.invT=10000;update(16);
assert.equal(ram.vulnerableReason,'stagger');assert.equal(ram.vulnerableT,1200);
reset();assert.equal(P.damageFeedback,null);assert.equal(stageBoss,null);
console.log('PASS: actual damage sources, direction/area, HP loss, i-frames, pause/reset, 16 boss windows, last-impact gating, damage caps, non-refreshing windows, obstacle stagger and non-lethal dragon assistance');
`);
