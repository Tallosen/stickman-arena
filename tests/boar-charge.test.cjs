const assert=require('node:assert/strict'),make=require('./arena-harness.cjs');
const h=make();h.box.assert=assert;
h.run(`
function boarFixture(x=1000,y=1000){
 reset();running=true;paused=false;props=[];enemies=[];P.x=1100;P.y=1000;
 P.pet=makePet('boar');Object.assign(P.pet,{x,y,hurt:10000});return P.pet;
}
function target(x,y){return {x,y,kind:'tank',r:18,hp:10000,maxhp:10000,phase:0,face:1,speed:0,kb:0,flash:0};}
let p=boarFixture(),e=target(1200,1000);enemies=[e];p.face=-1;
for(let n=0;n<20;n++)updatePet(16,16/16.67);
assert.equal(p.fuse,320);assert.equal(p.boarAnim,'windup');assert.equal(p.x,1000);assert.equal(p.y,1000);
assert.equal(p.face,1,'Anticipation turns toward the target before starting motion');
assert.equal(p.boarRun,0);assert.equal(booms.length,0,'No early explosion during anticipation');
updatePet(16,16/16.67);assert.equal(p.boarAnim,'charge');assert(p.boarRun>0);assert(p.boarStride>0);
const stride=p.boarStride;updatePet(16,16/16.67);assert(p.boarStride>stride);
e.hp=0;updatePet(16,16/16.67);assert.equal(p.chargeTarget,null);assert.equal(p.fuse,0);assert.equal(p.boarAnim,'idle');
assert.equal(booms.length,0,'A defeated target does not trigger an explosion');

// A vertical target must not flip an otherwise stable left/right silhouette.
p=boarFixture();e=target(p.x,p.y+130);enemies=[e];p.face=-1;updatePet(16,16/16.67);
assert.equal(p.face,-1);assert(Math.abs(p.boarHeading-Math.PI/2)<1e-9);

// Recall suppresses attacking visuals while preserving the existing gameplay timers.
p=boarFixture();e=target(1200,1000);enemies=[e];updatePet(340,340/16.67);
const recalledFuse=p.fuse;p.recall=1000;P.x=800;const oldStride=p.boarStride;
updatePet(16,16/16.67);assert.equal(p.boarAnim,'idle');assert.equal(p.fuse,recalledFuse);
assert(p.boarRun>0);assert(p.boarStride>oldStride);assert.equal(booms.length,0);

// Fully enclosed route: actual displacement is zero, so gallop/dust cues stop.
p=boarFixture();e=target(1200,1000);enemies=[e];
props=[{x:p.x+40,y:p.y,r:35},{x:p.x-40,y:p.y,r:35},{x:p.x,y:p.y+40,r:35},{x:p.x,y:p.y-40,r:35}];
for(let n=0;n<24;n++)updatePet(16,16/16.67);
assert.equal(p.boarAnim,'brake');assert.equal(p.boarRun,0);assert.equal(p.x,1000);assert.equal(p.y,1000);
assert.equal(booms.length,0);

// At all tested rates the cosmetic state leaves radius, damage and cooldown intact.
for(const dt of [16,33,66]){
 p=boarFixture();e=target(1200,1000);enemies=[e];const stats=petStats(p);
 let elapsed=0;while(p.dead<=0&&elapsed<3000){
  const x=p.x,y=p.y;updatePet(dt,dt/16.67);elapsed+=dt;
  assert(Math.hypot(p.x-x,p.y-y)<=5.4*dt/16.67+.0001,'Animation cannot teleport the actual pet');
 }
 assert(p.dead>0);assert.equal(p.dead,8500);assert.equal(booms.length,1);assert.equal(booms[0].style,'boar');
 assert.equal(booms[0].max,stats.boarR);assert.equal(e.hp,10000-stats.boarDmg);
 assert.equal(booms[0].boarFace,1);assert(Number.isFinite(booms[0].boarHeading));
 assert.equal(p.boarAnim,'idle');assert.equal(p.boarRun,0);assert.equal(p.boarStride,0);
 assert.equal(p.chargeTarget,null);assert.equal(p.fuse,0);updatePet(16,16/16.67);assert.equal(booms.length,1);
 enemies=[];updatePet(8500,8500/16.67);assert(p.hp>0);assert.equal(p.boarAnim,'idle');assert.equal(p.boarRun,0);
}
// Contact death cannot leave a running pose to be reused after revival.
p=boarFixture();e=target(p.x,p.y);enemies=[e];p.hurt=0;p.hp=1;updatePet(16,16/16.67);
assert(p.dead>0);assert.equal(p.boarAnim,'idle');assert.equal(p.boarRun,0);assert.equal(booms.length,0);
`);
console.log('PASS: boar windup orientation, distance-driven motion, blocked/recall/target-loss presentation, unchanged impact damage/radius/revival and one explosion at 15/30/60 FPS');
