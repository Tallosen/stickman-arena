const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const noop=()=>{},ctx=new Proxy({measureText:s=>({width:String(s).length*7}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop})}, {get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
const element=()=>({style:{},classList:{add:noop,remove:noop,contains:()=>true},addEventListener:noop,getContext:()=>ctx,appendChild:noop});
const box={console,assert,document:{body:element(),getElementById:()=>element(),createElement:element,addEventListener:noop},
 innerWidth:390,innerHeight:844,devicePixelRatio:1,addEventListener:noop,requestAnimationFrame:noop,setTimeout:noop,
 localStorage:{getItem:()=>null,setItem:noop},hud:noop};box.window=box;vm.createContext(box);
const modules=['core.js','config.js','map-art.js','arena-secrets.js','pets.js','draw-pets.js','ult.js','state.js','progression.js','world.js','enemy-hazards.js','combat.js','abilities.js','dragon-economy.js','dragons.js','bosses.js','boss-loot.js','update.js','draw-hero.js','draw-foe.js','render.js'];
for(const f of modules)vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f),'utf8'),box,{filename:f});
vm.runInContext(`
function offerCards(){queuedLevels=0;paused=false;}
for(const key of Object.keys(SFX))SFX[key]=()=>{};
for(const weapon of Object.keys(WEAPONS)){
 reset();running=true;paused=false;P.wtype=weapon;P.gear.gun=2;P.gear.clip=3;P.gear.scope=3;P.gear.gloves=2;P.lvl=15;applyGear();
 P.stage=15;P.runMs=14*STAGE_MS;P.hp=1000;props=[];
 for(let frame=0;frame<3600;frame++){
   P.hurt=1000;update(16.67);
   if(frame%30===0)draw();
   assert(Number.isFinite(P.x+P.y+P.xp+P.hp));assert(P.backpackQueue.length<=6,'Unbounded backpack queue');
   assert(shots.every(s=>Number.isFinite(s.x+s.y+s.vx+s.vy)));
 }
 assert(score>5,'No working kills with '+weapon);
 console.log('PASS: 60s real arena loop + drawing:',weapon,'kills:',score,'XP:',P.xp,'stage:',P.lvl);
 reset();assert.equal(P.backpackQueue.length,0);assert(P.backpackFlash.every(v=>v===0));
}
// New variants preserve their replaced enemy's XP: the v0.73 stage pacing is intact.
for(let stage=1;stage<=40;stage++)for(let i=0;i<100;i++)for(const variant of [0,.3,.8]){
 const kind=stageEnemyKind(stage,(i+.5)/100,variant);
 assert(KINDS[kind]);assert.equal(KINDS[kind].xp,KINDS[enemyBaseKind(kind)].xp);
 if(stage<5)assert.notEqual(kind,'dasher');if(stage<10)assert.notEqual(kind,'shield');if(stage<15)assert.notEqual(kind,'flanker');
}
assert.equal(stageEnemyKind(5,.2,0),'dasher');assert.equal(stageEnemyKind(10,.1,0),'shield');assert.equal(stageEnemyKind(15,.9,0),'flanker');
reset();running=true;paused=false;props=[];
spawn('dasher');let e=enemies[0];Object.assign(e,{x:1000,y:1000,speed:1,attackCd:0});
assert.equal(enemyMovementIntent(e,1200,1000,16).pace,0);assert.equal(e.attackState,'windup');
const angle=e.dashAngle;for(let i=0;i<40;i++){assert.equal(enemyMovementIntent(e,1000,1200,16).pace,0);assert.equal(e.dashAngle,angle);}
while(e.attackState==='windup')enemyMovementIntent(e,1000,1200,16);
assert.equal(e.attackState,'dash');let intent=enemyMovementIntent(e,1000,1200,16);assert(intent.vx>.99&&intent.pace>3);
hit(e,.01,950,1000);assert.equal(e.attackState,'recover');
spawn('shield');e=enemies[enemies.length-1];Object.assign(e,{x:1000,y:1000,hp:100,guardAngle:0});
hit(e,10,1020,1000);assert.equal(e.hp,94);assert(e.shieldFlash>0);
hit(e,10,980,1000);assert.equal(e.hp,84);
spawn('flanker');e=enemies[enemies.length-1];Object.assign(e,{x:1000,y:1000,flankSide:1});
intent=enemyMovementIntent(e,1200,1000,16);assert(intent.vy>.5);assert(intent.vx>0);
console.log('PASS: stage unlocks, unchanged XP by family, warning before locked dash, hit interruption, front shield/rear vulnerability, flanking');
// Track the actual underground position and reserved exit; owner movement/recall cannot teleport it.
reset();props=[];enemies=[];P.pet=makePet('mole');const mole=P.pet;mole.timer=0;
updatePet(16,16/16.67);assert.equal(mole.state,'down');assert(mole.burrow);assert(turrets.length>0);
const exit={...mole.burrow.to},initialHP=mole.hp;let steps=0;
P.x+=75;mole.recall=3000;
while(mole.state==='down'&&steps++<3000){
 const before={x:mole.x,y:mole.y};updatePet(16,16/16.67);
 assert(Math.hypot(mole.x-before.x,mole.y-before.y)<=3.21,'Mole teleported');
 if(mole.burrow){assert.equal(mole.burrow.to.x,exit.x);assert.equal(mole.burrow.to.y,exit.y);}
 drawMoleBurrow(ctx,mole);drawPet(ctx,mole.x,mole.y,'mole',mole.lvl,mole.face,mole.phase,mole);
}
assert.equal(mole.state,'up');assert.equal(mole.x,exit.x);assert.equal(mole.y,exit.y);assert(mole.emergeT>0);assert.equal(mole.hp,initialHP);
for(let trial=0;trial<50;trial++){
 P.x=trial%2?60:2740;P.y=trial%3?60:2740;Object.assign(mole,{x:P.x,y:P.y,state:'up',timer:0,recall:0});
 props=[{x:P.x+80,y:P.y,r:45}];updatePet(16,16/16.67);
 if(mole.burrow){const q=mole.burrow.to;assert(q.x>=40&&q.y>=40&&q.x<=WORLD-40&&q.y<=WORLD-40);assert(props.every(o=>Math.hypot(o.x-q.x,o.y-q.y)>=o.r+mole.r+12));}
 mole.burrow=null;
}
console.log('PASS: continuous mole tunnel, fixed marked exit, safe edge/rock destinations, emergence hop, turrets continue');
// A single hit used to leave kb > 0 forever, permanently bypassing pursuit.
function chaseFixture(kind){
 reset();running=true;paused=false;props=[];P.pet=null;P.lvl=11;applyGear();P.range=0;
 spawnT=eliteT=chestT=healT=shotT=1e9;spawn(kind);
 const foe=enemies[0];Object.assign(foe,{x:P.x+600,y:P.y,hp:1e6,maxhp:1e6,attackCd:1e9,lx:P.x+600,ly:P.y});
 return foe;
}
let foe=chaseFixture('elite'),startDistance=dist(foe,P);hit(foe,.001,P.x,P.y);
for(let i=0;i<180;i++){P.hurt=1000;update(16.67);}
assert(startDistance-dist(foe,P)>60,'A single bullet permanently stopped an elite');
assert.equal(foe.kb,0,'Residual knockback never cleared');
for(const kind of ['basic','runner','tank','elite','shield','flanker','dasher','pyro','drummer'])for(const frozen of [false,true]){
 foe=chaseFixture(kind);startDistance=dist(foe,P);
 if(frozen)ices=[{x:foe.x-100,y:foe.y,r:1000,life:10000}];
 for(let i=0;i<180;i++){
   if(i%4===0)hit(foe,.001,P.x,P.y);
   P.hurt=1000;update(16.67);
   assert(Number.isFinite(foe.x+foe.y+foe.kb));
 }
 assert(startDistance-dist(foe,P)>5,'No progress under sustained fire: '+kind+' ice='+frozen);
}
const progress=[];
for(const dt of [8.335,16.67,33.34]){
 foe=chaseFixture('elite');startDistance=dist(foe,P);hit(foe,.001,P.x,P.y);
 for(let i=0;i<Math.round(3000/dt);i++){P.hurt=1000;update(dt);}
 progress.push(startDistance-dist(foe,P));
}
assert(Math.max(...progress)-Math.min(...progress)<3,'Knockback depends excessively on frame rate');
console.log('PASS: single-hit recovery, all 7 types advance under sustained fire + ice; bounded frame-rate variation');
for(const [distance,life] of [[430,1000],[500,1000],[180,1]]){
 const target=chaseFixture('basic');target.x=P.x+distance;target.y=P.y;target.speed=0;target.hp=100;
 const shot=makeHeroShot({x:target.x,y:target.y},0,10,'basic',
   {source:'backpack',anchor:{x:P.x,y:P.y},range:420,target,age:0,life,vx:0,vy:0});
 update(16);assert.equal(target.hp,100,'Backpack hits outside launch range or after expiry');
 if(distance>468||life===1)assert(!shots.includes(shot));
}
console.log('PASS: actual collision loop rejects out-of-range/expired backpack hits and removes escaped projectiles');
const auraProgress=[];
for(const count of [0,1,2]){
 const target=chaseFixture('basic');target.kb=0;const x=target.x;
 for(let i=0;i<count;i++){spawn('drummer');Object.assign(enemies.at(-1),{x:target.x+80+i*35,y:target.y+40,speed:0});}
 update(16.67);auraProgress.push(x-target.x);
 assert.equal(!!target.rallied,count>0);
}
assert(Math.abs(auraProgress[1]/auraProgress[0]-1.16)<.001);
assert(Math.abs(auraProgress[2]-auraProgress[1])<.001);
reset();assert.equal(enemyFires.length,0);assert.equal(enemyFireballs.length,0);
console.log('PASS: drummer aura gives exactly 16% movement, never stacks, all new enemies pursue, reset clears hazards');
`,box);
