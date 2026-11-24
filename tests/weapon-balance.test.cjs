const assert=require('assert'),h=require('./arena-harness.cjs')();h.box.assert=assert;
h.run(`
reset();running=true;props=[];
// All weapons use the same pod, including damage and no inherited sniper crit/pierce.
let podDamage=null;
for(const weapon of Object.keys(WEAPONS)){
 P.wtype=weapon;P.lvl=34;P.gear=Object.fromEntries(GK.map(k=>[k,GEAR[k].max]));applyGear();
 const stats=weaponStats(weapon);assert.equal(P.damage,stats.damage);assert.equal(P.rate,stats.rate);assert(Number.isFinite(weaponCombatRating(weapon)));
 if(podDamage===null)podDamage=P.backpackDamage;assert.equal(P.backpackDamage,podDamage);
 shots=[];enemies=[{x:P.x+180,y:P.y,r:12,hp:1000}];P.backpackQueue=[];P.backpackCooldown=0;shotT=0;
 updateHeroFire(0);shotT=1e6;updateHeroFire(200);
 const pods=shots.filter(s=>s.source==='backpack');assert.equal(pods.length,3);
 assert(pods.every(s=>s.dmg===podDamage&&!s.pierce&&!s.crit&&s.kind==='basic'));
}
// Cadence stays within one shot across 16/33ms steps; an idle gun cannot bank a burst.
for(const weapon of ['basic','sniper','minigun']){
 const counts=[];
 for(const dt of [16,33]){
  reset();P.wtype=weapon;P.lvl=34;P.gear.gun=4;P.gear.gloves=4;applyGear();enemies=[{x:P.x+130,y:P.y,r:12,hp:1e9}];
  for(let elapsed=0;elapsed<12000;elapsed+=dt)updateHeroFire(Math.min(dt,12000-elapsed));
  counts.push(shots.length);assert(Math.abs(shots.length-12000/P.fireRate)<2);
 }
 assert(Math.abs(counts[0]-counts[1])<=1,weapon+' cadence changed with frame size');
 enemies=[];updateHeroFire(100000);assert.equal(shotT,0);
}
// Segment collisions: nearest foe intercepts; sniper pierces each foe exactly once.
reset();props=[];const realHit=hit;let impacts=[];hit=(e,d)=>{impacts.push({id:e.id,d});};
enemies=[{id:'far',x:95,y:0,r:8,hp:100},{id:'near',x:45,y:0,r:8,hp:100}];
shots=[{x:0,y:0,vx:130,vy:0,life:100,dmg:10,hit:[]}];updateHeroProjectiles(16,1);
assert.deepEqual(impacts.map(i=>i.id),['near']);assert.equal(shots.length,0);
impacts=[];shots=[{x:0,y:0,vx:130,vy:0,life:100,dmg:10,hit:[],pierce:true}];updateHeroProjectiles(16,1);
assert.deepEqual(impacts.map(i=>i.id),['near','far']);shots[0].vx=-130;updateHeroProjectiles(16,1);assert.equal(impacts.length,2);
impacts=[];shots=[{x:0,y:30,vx:130,vy:0,life:100,dmg:10,hit:[]}];updateHeroProjectiles(16,1);assert.equal(impacts.length,0);
impacts=[];shots=[{x:45,y:0,vx:0,vy:0,life:100,dmg:10,hit:[]}];updateHeroProjectiles(16,1);assert.equal(impacts[0].id,'near');
// Falloff is launch-relative, independent of later movement or weapon swaps.
const values=[];
for(const distance of [80,180,300]){
 impacts=[];enemies=[{id:'target',x:distance,y:0,r:8,hp:100}];
 shots=[{x:0,y:0,vx:400,vy:0,life:100,dmg:10,hit:[],falloff:{x:0,y:0,start:120,end:294}}];P.x=900;
 updateHeroProjectiles(16,1);values.push(impacts[0].d);
}
assert.equal(values[0],10);assert(values[1]<10&&values[1]>values[2]);assert(values[2]>=4.5);
hit=realHit;
console.log('PASS: shared weapon stats, identical pods, stable cadence, no banked shots, swept nearest-hit ordering, one-hit piercing, misses/zero-length segments and launch-relative shotgun falloff');
`);
