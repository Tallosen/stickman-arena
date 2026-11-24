const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const noop=()=>{},ctx=new Proxy({}, {get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
const element=()=>({style:{},classList:{add:noop,remove:noop,contains:()=>true},addEventListener:noop,getContext:()=>ctx,appendChild:noop});
const box={console,assert,document:{body:element(),getElementById:()=>element(),createElement:element,addEventListener:noop},
 innerWidth:390,innerHeight:844,devicePixelRatio:1,addEventListener:noop,requestAnimationFrame:noop,setTimeout:noop,
 localStorage:{getItem:()=>null,setItem:noop},hud:noop};box.window=box;vm.createContext(box);
for(const f of ['core.js','config.js','map-art.js','arena-secrets.js','pets.js','draw-pets.js','ult.js','state.js','progression.js','world.js','enemy-hazards.js','combat.js','abilities.js','dragon-economy.js','dragons.js','bosses.js','boss-loot.js','update.js'])
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f),'utf8'),box,{filename:f});
vm.runInContext(`
function offerCards(){paused=false;}
for(const key of Object.keys(SFX))SFX[key]=()=>{};
function prepare(kinds){
 reset();running=true;paused=false;props=[];enemies=[];P.pet=null;P.range=0;P.hp=1000;
 spawnT=eliteT=chestT=healT=shotT=1e9;
 kinds.forEach((kind,i)=>{spawn(kind);Object.assign(enemies[enemies.length-1],{x:P.x+700+i*28,y:P.y,speed:0,attackCd:1e9});});
 inventory.gas=1;return enemies.slice();
}
function simulate(ms,step=16.67){for(let elapsed=0;elapsed<ms;elapsed+=step){P.hurt=1000;update(step);}}
function earned(){let total=P.xp;for(let level=1;level<P.lvl;level++)total+=heroXPRequired(level);return total;}
const kinds=['basic','runner','tank','elite','shield','flanker','dasher','pyro','drummer'];
for(const step of [16.67,33.33]){
 const victims=prepare(kinds),expected=victims.reduce((sum,e)=>sum+e.xp,0);
 useAbility('gas');simulate(7000,step);
 assert(victims.every(e=>e.hp<=0),'Gas did not kill all initial targets');
 assert.equal(earned(),expected,'Missing or duplicated gas XP');assert.equal(score,kinds.length);
 assert(victims.every(e=>e.rewarded));assert.equal(enemies.length,0);
 const before=earned();victims.forEach(popEnemy);simulate(1000,step);assert.equal(earned(),before);assert.equal(score,kinds.length);
}
console.log('PASS: gas kills all 9 enemy types, awards exact XP once at 30/60 FPS, repeats cannot duplicate rewards');
let victims=prepare(Array(10).fill('basic'));useAbility('gas');simulate(7000);
assert.equal(earned(),550);assert.equal(score,10);
console.log('PASS: original reproduction now awards 550 XP for 10 gas kills');
victims=prepare(Array(15).fill('elite'));xpBoost=20000;P.gear.cape=3;applyGear();P.xp=P.xpNext-5;
const before=earned(),expected=victims.reduce((sum,e)=>sum+Math.round(e.xp*2*P.xpMult),0);
useAbility('gas');simulate(7000);
assert.equal(earned()-before,expected);assert(P.lvl>=3,'Bulk XP must grant multiple levels');assert.equal(queuedLevels,P.lvl-1);
console.log('PASS: XP boosts, threshold crossing, multi-level overflow and queued upgrades');
victims=prepare(['basic','tank']);victims.forEach(e=>{e.hp=e.maxhp=100;});useAbility('gas');simulate(100);
assert(victims.every(e=>e.hp>0));assert.equal(earned(),0,'Damage alone must not grant XP');
hit(victims[0],1e6,P.x,P.y);const first=victims[0].xp;assert.equal(earned(),first);
simulate(7000);assert.equal(earned(),first+victims[1].xp);assert.equal(score,2);
victims=prepare(['tank']);useAbility('gas');simulate(80);gasCloud.life=1;simulate(20);
assert(victims[0].hp>0);assert.equal(earned(),0);assert.equal(score,0);
console.log('PASS: weapon/gas mixed kills counted once; surviving targets grant no premature XP');
`,box);
