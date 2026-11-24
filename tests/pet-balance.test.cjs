const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const noop=()=>{},ctx=new Proxy({}, {get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
const element=()=>({style:{},classList:{add:noop,remove:noop,contains:()=>true},addEventListener:noop,getContext:()=>ctx,appendChild:noop});
const box={console,assert,document:{body:element(),getElementById:()=>element(),createElement:element,addEventListener:noop},innerWidth:390,innerHeight:844,devicePixelRatio:1,addEventListener:noop,requestAnimationFrame:noop,setTimeout:noop,localStorage:{getItem:()=>null,setItem:noop},hud:noop};box.window=box;vm.createContext(box);
for(const f of ['core','config','map-art','arena-secrets','pets','draw-pets','ult','state','progression','world','enemy-hazards','combat','abilities','dragon-economy','dragons','bosses','boss-loot','update','draw-hero','draw-foe','render'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f+'.js'),'utf8'),box,{filename:f});
vm.runInContext(`
function offerCards(){queuedLevels=0;paused=false;}
for(const key of Object.keys(SFX))SFX[key]=()=>{};
function fixture(type){reset();running=true;paused=false;props=[];enemies=[];P.x=1100;P.y=1000;P.pet=makePet(type);return P.pet;}
function foe(x,y,kind='tank'){return {x,y,kind,r:18,hp:10000,maxhp:10000,phase:0,face:1,speed:0,kb:0,flash:0};}
// Stable obstacle detours, no tunnelling or teleporting at different frame rates.
for(const dt of [16,33,66])for(const layout of [
 [{x:1040,y:1000,r:62}],
 [{x:1020,y:970,r:50},{x:1100,y:1030,r:50}],
 [{x:1030,y:980,r:68},{x:1090,y:1040,r:55},{x:1160,y:1010,r:34}]
]){
 const p=fixture('boar');p.x=900;p.y=1000;props=layout;const e=foe(1250,1000);enemies=[e];
 let elapsed=0;
 while(!p.dead&&elapsed<9000){
   const x=p.x,y=p.y;updatePet(dt,dt/16.67);elapsed+=dt;
   assert(Math.hypot(p.x-x,p.y-y)<=5.4*dt/16.67+.001,'Charge teleported');
   for(const o of props)assert(Math.hypot(p.x-o.x,p.y-o.y)>=o.r*.78+p.r-.02,'Pet clipped through rock');
 }
 assert(p.dead>0,'Boar stuck on obstacle layout');assert(e.hp<10000,'No impact damage');
 assert.equal(booms.filter(b=>b.style==='boar').length,1,'One impact must produce one explosion');
 assert.equal(p.dead,8500);
}
console.log('PASS: boar routes around 3 obstacle layouts at 15/30/60 FPS, one impact, no clipping/teleport');
let p=fixture('boar');const far=foe(2600,2600),near=foe(p.x+65,p.y,'basic');enemies=[far,near];updatePet(16,1);assert.equal(p.chargeTarget,near);
near.hp=0;updatePet(16,1);assert.equal(p.chargeTarget,null);assert.equal(p.fuse,0);
assert(!petEnemyAlive({...far,stormCaught:{}}));assert(!petEnemyAlive({...far,rewarded:true}));
console.log('PASS: distant heavy does not block nearby target; dead/captured targets ignored');
p=fixture('dog');enemies=[foe(p.x+28,p.y,'basic')];p.cd=300;const start=p.x;updatePet(16,1);assert.equal(p.x,start,'Dog runs home between bites');
p=fixture('mole');turrets=[{x:p.x,y:p.y,cd:0,life:1000,a:0}];enemies=[foe(p.x+70,p.y)];p.dead=5000;updatePet(100,6);assert.equal(turrets[0].life,900);assert.equal(shots.length,1);updatePet(1000,60);assert.equal(turrets.length,0);assert.equal(shots.length,1,'Expired turret fired');
console.log('PASS: dog holds melee target; turrets keep fighting and expire while mole revives');
p=fixture('chicken');p.lvl=5;
for(let i=0;i<8;i++){p.drop=0;updatePet(16,1);}
assert.equal(eggs.length,8);assert.equal(eggs.filter(e=>e.kind==='green').length,1);assert(eggs.some(e=>e.kind==='red'));assert(eggs.some(e=>e.kind==='yellow'));
eggs=[];P.hp=1;chicks=[{x:P.x+400,y:P.y,r:7,hp:4,hurt:0,life:20000,cd:0,phase:0,kind:'green',healCd:0}];updateFarm(16,1);assert.equal(P.hp,1,'Remote healer healed');
chicks[0].x=P.x;chicks[0].y=P.y;updateFarm(16,1);assert.equal(P.hp,1.5);chicks.push({...chicks[0],healCd:0});updateFarm(16,1);assert.equal(P.hp,1.5,'Stacked healer bypassed shared cooldown');
chicks=[{...chicks[0],life:1,healCd:0}];p.healLock=0;updateFarm(16,1);assert.equal(P.hp,1.5);assert.equal(chicks.length,0);
console.log('PASS: chicken mixed squad, one healer, local healing and shared cooldown, expired chicks inactive');
p=fixture('parrot');const stale={x:100,y:100,mini:true,arm:0,ttl:1,dmg:5};mines=[stale];update(16);assert(!mines.includes(stale),'Unused mini mine blocked cap forever');
for(const type of Object.keys(PETS)){
 p=fixture(type);
 for(let lvl=1;lvl<=5;lvl++){p.lvl=lvl;const s=petStats(p);assert(Object.values(s).every(Number.isFinite));assert(s.hp>=5);assert(s.catCd>=300);assert(s.dogCd>=450);}
 P.lvl=1;const early=petStats(p);P.lvl=99;const late=petStats(p);assert(Math.abs(late.power-2.44)<.0001);assert(late.dogDmg>early.dogDmg);
 P.lvl=1;p.lvl=1;p.hpMax=petStats(p).hp;p.hp=p.hpMax;
 for(let f=0;f<1800;f++){P.hurt=1000;update(16.67);if(f%60===0)draw();assert(Number.isFinite(p.x+p.y+p.hp));assert(chicks.length+eggs.length<=petStats(p).eggCap);assert(mines.filter(m=>m.mini).length<=petStats(p).mineCap);}
 console.log('PASS: 30s actual game loop and draw:',type);
}
console.log('PASS: all pet stats finite, capped late growth, mine expiry, bounded squads');
`,box);
