const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const noop=()=>{},ctx=new Proxy({}, {get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
const element=()=>({style:{},classList:{add:noop,remove:noop,contains:()=>true},addEventListener:noop,getContext:()=>ctx,appendChild:noop});
const box={console,assert,document:{body:element(),getElementById:()=>element(),createElement:element,addEventListener:noop},innerWidth:390,innerHeight:844,devicePixelRatio:1,addEventListener:noop,requestAnimationFrame:noop,setTimeout:noop,localStorage:{getItem:()=>null,setItem:noop},hud:noop};box.window=box;vm.createContext(box);
for(const f of ['core','config','map-art','arena-secrets','pets','draw-pets','ult','state','progression','world','enemy-hazards','combat','abilities','dragon-economy','dragons','bosses','boss-loot','update'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f+'.js'),'utf8'),box,{filename:f});
vm.runInContext(`
function offerCards(){queuedLevels=0;paused=false;}
for(const key of Object.keys(SFX))SFX[key]=()=>{};
function fixture(){reset();running=true;paused=false;props=[];enemies=[];P.x=1300;P.y=1000;P.range=0;P.pet=null;spawnT=eliteT=chestT=healT=shotT=1e9;}
function free(e){assert(petPathClear(e.x,e.y,e.x,e.y,e.r),'Enemy inside rock: '+e.kind);}
for(const dt of [8.335,16.67,33.34])for(const kind of Object.keys(KINDS)){
 fixture();props=[{x:1040,y:975,r:65},{x:1090,y:1040,r:48}];spawn(kind);const e=enemies[0];
 Object.assign(e,{x:850,y:1000,hp:1e6,maxhp:1e6,speed:1,attackCd:1e9});
 let closest=1e9;
 for(let t=0;t<22000;t+=dt){const x=e.x,y=e.y;P.hurt=1000;update(dt);free(e);
  assert(Math.hypot(e.x-x,e.y-y)<3*dt/16.67+.01,'Unexpected teleport');closest=Math.min(closest,dist(e,P));
 }
 assert(closest<150,'Failed to pass rock cluster: '+kind+' dt='+dt+' closest='+closest);
}
console.log('PASS: all 9 enemy types pass rock cluster at 30/60/120 FPS, no clipping or teleport');
fixture();props=[{x:1000,y:1000,r:75},{x:1060,y:1000,r:70}];
for(const kind of Object.keys(KINDS)){
 const e={x:1000,y:1000,r:KINDS[kind].r,kind};enemyResolveRocks(e);free(e);assert(Math.hypot(e.x-1000,e.y-1000)<180);
}
props=[{x:20,y:20,r:60}];const corner={x:20,y:20,r:25,kind:'elite'};enemyResolveRocks(corner);free(corner);
console.log('PASS: exact-centre, overlapping rocks and map-edge depenetration stays local');
fixture();props=[{x:1030,y:1000,r:68}];
for(let i=0;i<60;i++){spawn('basic');Object.assign(enemies.at(-1),{x:910+(i%6)*6,y:890+Math.floor(i/6)*22,hp:1e6,maxhp:1e6});}
const start=enemies.reduce((s,e)=>s+e.x,0)/enemies.length;
for(let frame=0;frame<600;frame++){P.hurt=1000;update(16.67);enemies.forEach(free);assert(enemyRouteBudget>=0);}
const end=enemies.reduce((s,e)=>s+e.x,0)/enemies.length;assert(end-start>100,'Crowd stalled at rock');
console.log('PASS: 60-enemy crowd advances without pushing each other into rock; bounded route budget');
fixture();props=[{x:1000,y:1000,r:60}];spawn('dasher');const dash=enemies[0];
Object.assign(dash,{x:925,y:1000,speed:2,attackState:'dash',attackT:430,dashAngle:0,hp:100});
for(let i=0;i<10;i++){P.hurt=1000;update(16.67);free(dash);}
assert.notEqual(dash.attackState,'dash');
const x=dash.x;enemyDisplace(dash,200,0);free(dash);assert(dash.x<1000,'Recoil tunneled through rock');
console.log('PASS: locked dash stops at stone; swept recoil cannot tunnel through it');
fixture();const random=Math.random;let count=0;
for(let i=0;i<1000;i++){chests=[];Math.random=()=>i/1000;spawnChest();assert.equal(chests.length,1);if(chests[0].rare)count++;}
Math.random=random;assert.equal(count,15);assert.equal(MAP_RARE_CHEST_CHANCE,.015);
chests=[];arenaSecretComplete=true;arenaSecretDropIssued=false;assert(queueCompassDrop());assert(chests[0].elite&&chests[0].rare);
assert.equal(queueCompassDrop(),false);
console.log('PASS: 1.5% rare threshold (15/1000 stratified rolls); guaranteed event chest unchanged');
`,box);
