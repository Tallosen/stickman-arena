const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const box={assert,console};vm.createContext(box);
vm.runInContext(`
const noop=()=>{},localStorage={getItem:()=>null},WORLD=2800,W=390,H=844,FOE='#c8402c';
const P={x:1400,y:1400,r:14,stage:6,hp:20,hurt:0,invT:0,iframe:950};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),rnd=(a,b)=>(a+b)/2;
let enemies=[],props=[],ices=[],pops=[],allyTanks=[],shake=0,t=0,dragonFinale=null,over=0;
const SFX={hurt:noop};function gameOver(){over++;}
`,box);
for(const file of ['config.js','pets.js','world.js','enemy-hazards.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),box);
vm.runInContext(`
for(let stage=1;stage<=20;stage++){
 let pyros=0,drummers=0;
 for(let i=0;i<100;i++)for(let j=0;j<100;j++){
  const k=stageEnemyKind(stage,(i+.5)/100,(j+.5)/100);
  assert.equal(KINDS[k].xp,KINDS[enemyBaseKind(k)].xp);
  if(k==='pyro')pyros++;if(k==='drummer')drummers++;
 }
 if(stage<6)assert.equal(pyros,0);else assert(pyros>0);
 if(stage<12)assert.equal(drummers,0);else assert(drummers>0);
}
P.stage=20;for(let i=0;i<30;i++)spawn('pyro');assert.equal(enemies.filter(e=>e.kind==='pyro').length,4);
for(let i=0;i<30;i++)spawn('drummer');assert.equal(enemies.filter(e=>e.kind==='drummer').length,2);
enemies=[];P.stage=6;spawn('pyro');const e=enemies[0];Object.assign(e,{x:1200,y:1400,attackCd:0});
pyroMovementIntent(e,P.x,P.y,0);assert.equal(e.attackState,'windup');assert.equal(enemyFireballs.length,0);
const aim={...e.fireAim};P.x+=80;
pyroMovementIntent(e,P.x,P.y,949);assert.equal(enemyFireballs.length,0);assert.deepEqual(e.fireAim,aim);
pyroMovementIntent(e,P.x,P.y,1);assert.equal(enemyFireballs.length,1);assert.equal(e.attackCd,5200);
updateEnemyHazards(649);assert.equal(enemyFires.length,0);updateEnemyHazards(1);assert.equal(enemyFires.length,1);
assert.equal(enemyFires[0].x,aim.x);assert.equal(enemyFires[0].r,40);
// Existing flames, edge overlaps and newly landing fire all extinguish before damage.
P.x=aim.x;P.hp=20;P.hurt=0;ices=[{x:aim.x+185,y:aim.y,r:150,life:11000}];
updateEnemyHazards(16);assert.equal(enemyFires.length,0);assert.equal(P.hp,20);assert.equal(enemySteam.length,1);
enemyFireballs=[{from:{x:1000,y:1000},x:P.x,y:P.y,age:640,duration:650,r:40,damage:1}];
updateEnemyHazards(16);assert.equal(enemyFires.length,0);assert.equal(enemyFireballs.length,0);assert.equal(P.hp,20);
ices=[{x:e.x,y:e.y,r:150,life:1000}];e.attackCd=0;e.attackState='chase';pyroMovementIntent(e,P.x,P.y,16);assert.notEqual(e.attackState,'windup');
ices=[];resetEnemyHazards();P.hurt=0;
enemyFires=Array.from({length:8},()=>({x:P.x,y:P.y,r:40,damage:1.5,life:3600}));
updateEnemyHazards(16);assert.equal(P.hp,18.5,'Overlapping fires stacked instant damage');
updateEnemyHazards(16);assert.equal(P.hp,18.5);P.hurt=0;P.invT=1000;updateEnemyHazards(16);assert.equal(P.hp,18.5);
P.invT=0;P.hurt=0;ices=[{x:P.x,y:P.y,r:150,life:0}];updateEnemyHazards(16);assert.equal(P.hp,17,'Expired ice still extinguishes');
P.hurt=0;P.hp=.5;assert(updateEnemyHazards(16));assert.equal(over,1);
dragonFinale={};updateEnemyHazards(16);assert.equal(enemyFires.length,0);assert.equal(enemySteam.length,0);
dragonFinale=null;resetEnemyHazards();assert.equal(enemyFireballs.length,0);
console.log('PASS: stage 6/12 unlocks and XP, live caps, fixed 950ms warning + 650ms flight, cooldown, ice extinguishing/cast suppression, nonstacking damage, immunity, death, finale/reset');
`,box);
