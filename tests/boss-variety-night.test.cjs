const assert=require('assert'),h=require('./arena-harness.cjs')();h.box.assert=assert;
h.run(`
reset();running=true;props=[];
assert.equal(nightAmount(),0);enterRunStage(5);updateNightLighting(2250);assert.equal(nightAmount(),.5);
paused=true;updateNightLighting(5000);assert.equal(nightAmount(),.5);paused=false;updateNightLighting(2250);assert.equal(nightAmount(),1);
P.stage=6;updateNightLighting(2250);assert.equal(nightAmount(),.5);updateNightLighting(2250);assert.equal(nightAmount(),0);
reset();assert(nightTorches.length<=64);assert(nightTorches.every(q=>props.every(p=>Math.hypot(p.x-q.x,p.y-q.y)>p.r+40)));
running=true;const random=Math.random;const types=new Set();
for(const roll of [.01,.26,.51,.99]){Math.random=()=>roll;lastBossArchetype=null;types.add(chooseBossSpec(5).id);}
assert.equal(types.size,4);Math.random=random;
let previousArchetype=null;for(let i=0;i<50;i++){lastBossArchetype=previousArchetype;const spec=chooseBossSpec(20);assert.notEqual(spec.id,previousArchetype);previousArchetype=spec.id;assert(spec.hp>=18000);}
for(const stage of [5,10,15,20])for(const archetype of BOSS_ARCHETYPES){
 reset();running=true;props=[];enterRunStage(stage);const e=stageBoss.enemy;e.bossSpec={...e.bossSpec,...archetype};e.x=P.x-180;e.y=P.y;
 for(const kind of [...new Set(archetype.attacks)].filter(k=>['fan','aimed','ring'].includes(k))){
  e.bossSpec.attacks=[kind];e.bossCycle=0;e.attackState='chase';e.attackCd=0;bossProjectiles=[];
  bossMovementIntent(e,P.x,P.y,16);assert.equal(e.attackState,'shootwindup');assert.equal(bossProjectiles.length,0);
  const angle=e.bossShotAngle,delay=e.attackT;bossMovementIntent(e,P.x,P.y+200,delay-1);assert.equal(bossProjectiles.length,0);assert.equal(e.bossShotAngle,angle);
  bossMovementIntent(e,P.x,P.y+200,1);assert(bossProjectiles.length>0);assert(bossProjectiles.every(b=>Number.isFinite(b.x+b.y+b.vx+b.vy)));
  for(let i=0;i<50;i++)fireBossVolley(e);assert(bossProjectiles.length<=64);
 }
}
reset();running=true;props=[];enterRunStage(20);let e=stageBoss.enemy;
bossProjectiles=[{x:P.x-35,y:P.y,vx:40,vy:0,r:6,life:1000,owner:e}];P.hp=5;P.hurt=0;P.invT=0;
updateBossEncounter(33);assert.equal(P.hp,2.5);assert.equal(bossProjectiles.length,0);
// Rocks block bullets before they reach the hero.
props=[{x:P.x-35,y:P.y,r:20}];bossProjectiles=[{x:P.x-80,y:P.y,vx:80,vy:0,r:6,life:1000,owner:e}];P.hurt=0;updateBossEncounter(16.67);assert.equal(P.hp,2.5);
// Winning portrait uses actual gear and weapon, finite aim, separated boots, no mutation.
for(const weapon of Object.keys(WEAPONS))for(let level=0;level<=3;level++){
 P.wtype=weapon;P.gear.clip=level;const before=JSON.stringify(P.gear),p= victoryHeroPresentation();
 assert.equal(p.gear._w,weapon);assert.equal(p.gear.clip,level);assert.equal(p.aim,0);assert(p.pose.lf[0]>p.pose.lb[0]);assert.equal(JSON.stringify(P.gear),before);
}
reset();assert.equal(bossProjectiles.length,0);assert.equal(nightFade,0);
console.log('PASS: smooth day/night and pause/reset, bounded obstacle-free torches, random non-repeating archetypes, all stage volleys, warnings, caps, swept hits, rock cover, accurate victory gear');
`);
