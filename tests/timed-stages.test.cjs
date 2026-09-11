const fs=require("fs"),vm=require("vm"),path=require("path"),assert=require("assert");
const root=path.join(__dirname,"..");
const box={console,assert,Math:Object.create(Math)};
vm.createContext(box);
vm.runInContext(`
const noop=()=>{};
const context=new Proxy({}, {get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
const elements=new Map();
function el(){return {style:{},classList:{add:noop,remove:noop,toggle:noop,contains:()=>true},
  children:[],appendChild(x){this.children.push(x)},querySelector:()=>({getContext:()=>context}),
  addEventListener:noop,getContext:()=>context};}
const document={body:el(),getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id)},createElement:el,addEventListener:noop};
const saved=new Map(),cv=el(),localStorage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)};
let frameCallback;
const addEventListener=noop,requestAnimationFrame=fn=>{frameCallback=fn;},setTimeout=fn=>fn();
function draw(){}
const WORLD=2800,W=390,H=844,cam={x:0,y:0},INK="#222";
const SFX={chest:noop,level:noop,pop:noop},chain=noop,noise=noop;
const drawHero=noop,drawPet=noop,hash=()=>.5;
const ult={on:false},ULT_FULL=100;
const resetAbilities=noop,ultPointerUp=noop;
let flashes=[],hitStop=0;
let homeOpen=false;
function dragonHomeOpen(){return homeOpen;}
function spawn(kind){enemies.push({kind,x:P.x+350,y:P.y+350,hp:10,speed:1});}
function hit(e){e.hp=0;e.rewarded=true;}
`,box);
for(const file of ["config.js","state.js","progression.js","enemy-hazards.js","dragon-economy.js","dragons.js","update.js","cards.js"])
  vm.runInContext(fs.readFileSync(path.join(root,"src",file),"utf8"),box,{filename:file});
vm.runInContext(`
function init(){
 resetDragonFinale();
 Object.assign(P,{x:1400,y:1400,lvl:34,stage:20,runMs:RUN_MAIN_MS,hp:20,gear:Object.fromEntries(GK.map(k=>[k,GEAR[k].max])),
 pet:{type:"dog",lvl:5},wtype:"basic",xp:0,xpMult:1});
 running=true;paused=false;userPaused=false;queuedLevels=0;pointer={active:false};
 props=[];enemies=[];pops=[];score=0;t=0;shake=0;xpBoost=0;applyGear();
}
init();P.runMs=0;P.stage=1;P.gear.gun=3;unlockDragonAltar();assert.equal(dragonAltar,null);
// Actually choose the final upgrade through the real card callback.
Math.random=()=>.99;queuedLevels=1;offerCards();
document.getElementById("cards").children[0].onclick();
assert(heroBuildComplete());assert.equal(dragonAltar,null);assert.equal(dragonFinale,null);assert.equal(paused,false);
updateRunProgress(0);assert.equal(dragonAltar,null);
updateRunProgress(RUN_MAIN_MS);assert(dragonAltar);assert.equal(P.stage,20);
Math.random=Object.getPrototypeOf(Math).random;
const first=dragonAltar;unlockDragonAltar();assert.strictEqual(dragonAltar,first);
gainXP(500000);assert.equal(dragonFinale,null);assert.equal(queuedLevels,0);assert.equal(P.lvl,34);assert.equal(P.xp,P.xpNext);
startDragonFinale();assert.equal(dragonFinale,null);
for(let i=0;i<300;i++)updateDragonAltar(16);
assert.equal(dragonFinale,null);
// Running inside the enlarged circle accumulates the full ritual time.
P.x=dragonAltar.x;P.y=dragonAltar.y;updateDragonAltar(16);
assert.equal(dragonAltar.hold,16);
assert.equal(dragonAltar.r,80);
for(let i=0;i<60;i++){
  P.x=dragonAltar.x+70*Math.cos(i/7);P.y=dragonAltar.y+70*Math.sin(i/7);
  updateDragonAltar(16);
}
assert.equal(dragonAltar.hold,976);
assert(dragonAltar.hold>0);assert.equal(dragonFinale,null);
P.x=dragonAltar.x+81;P.y=dragonAltar.y;updateDragonAltar(16);assert.equal(dragonAltar.hold,0);
P.x=dragonAltar.x;P.y=dragonAltar.y;updateDragonAltar(16);
paused=true;for(let i=0;i<200;i++)updateDragonAltar(16);assert.equal(dragonAltar.hold,16);
paused=false;ult.on=true;
for(let i=0;i<123;i++){
  P.x=dragonAltar.x+70*Math.cos(i/7);P.y=dragonAltar.y+70*Math.sin(i/7);
  updateDragonAltar(16);
}
assert.equal(dragonFinale,null);assert.equal(dragonAltar.hold,1984);
updateDragonAltar(16);assert(dragonFinale);assert.equal(enemies.length,72);
const rewardBefore=dragonTotal();updateDragonFinale(7100);assert.equal(dragonTotal(),rewardBefore+1);
updateDragonFinale(200);assert.equal(dragonTotal(),rewardBefore+1);
init();assert.equal(dragonAltar,null);assert.equal(dragonFinale,null);
// Test entry placements near every edge with real generated obstacles.
for(let i=0;i<200;i++){
 init();P.x=i%2?40:2760;P.y=i%3?40:2760;
 props=Array.from({length:70},()=>({x:Math.random()*2800,y:Math.random()*2800,r:25+Math.random()*25}));
 unlockDragonAltar();assert(dragonAltar);
 assert(Math.hypot(dragonAltar.x-P.x,dragonAltar.y-P.y)>380);
 assert(props.every(o=>Math.hypot(dragonAltar.x-o.x,dragonAltar.y-o.y)>o.r+130));
}
init();forceNextDragon("diamond");startDragonFinale(true);
assert.equal(dragonFinale.type.id,"diamond");
console.log("PASS: full build cannot skip campaign; altar uniqueness, 200 edge placements, ritual movement/cancel/pause, single reward, preview");
// Timed progression is completely independent from character level / gear.
init();P.runMs=0;P.stage=1;P.lvl=1;GK.forEach(k=>P.gear[k]=0);P.pet=null;applyGear();
gainXP(heroXPRequired(1)+heroXPRequired(2));assert.equal(P.lvl,3);assert.equal(P.stage,1);assert.equal(P.runMs,0);
assert.equal(dragonAltar,null);queuedLevels=0;
updateRunProgress(59999);assert.equal(P.stage,1);assert.equal(stageRemaining(),1);
updateRunProgress(1);assert.equal(P.stage,2);assert.equal(P.lvl,3);assert.equal(stageRemaining(),60000);
for(let stage=3;stage<=20;stage++){updateRunProgress(60000);assert.equal(P.stage,stage);assert.equal(dragonAltar,null);}
updateRunProgress(59999);assert.equal(dragonAltar,null);assert.equal(P.runMs,1199999);
P.xp=321;queuedLevels=2;updateRunProgress(1);assert(dragonAltar);assert.equal(campaignRemaining(),300000);
assert.equal(P.xp,321);assert.equal(queuedLevels,2);assert.equal(dragonFinale,null);
assert.equal(P.lvl,3);assert(!heroBuildComplete());
gainXP(P.xpNext);assert.equal(P.lvl,4,'Underlevelled hero can still earn levels in overtime');
for(const mode of ['pause','home','book','stopped']){
 const before=P.runMs;
 paused=mode==='pause';homeOpen=mode==='home';running=mode!=='stopped';
 const book=document.getElementById('dragonBook');const old=book.classList.contains;
 if(mode==='book')book.classList.contains=()=>false;
 updateRunProgress(60000);assert.equal(P.runMs,before,'Clock leaked through '+mode);
 book.classList.contains=old;paused=false;homeOpen=false;running=true;
}
ult.on=true;updateRunProgress(10000);assert.equal(campaignRemaining(),290000);ult.on=false;
updateRunProgress(289999);assert.equal(dragonFinale,null);assert.equal(campaignRemaining(),1);
// Even a failed altar placement must not prevent the automatic ending.
dragonAltar=null;props=[{x:1400,y:1400,r:5000}];
const beforeAuto=dragonTotal();updateRunProgress(1);assert(dragonFinale);assert.equal(P.runMs,1500000);
assert.equal(queuedLevels,0);assert.equal(campaignRemaining(),0);
const automatic=dragonFinale;updateRunProgress(60000);assert.strictEqual(dragonFinale,automatic);
updateDragonFinale(7100);assert.equal(dragonTotal(),beforeAuto+1);updateDragonFinale(200);assert.equal(dragonTotal(),beforeAuto+1);
drawDragon=()=>{};updateDragonFinale(2000);assert.equal(running,false);assert(dragonFinale.finished);assert.equal(meta.best,1500);
init();P.runMs=RUN_MAIN_MS-500;updateRunProgress(1000);assert.equal(campaignRemaining(),299500);
assert.equal(formatRunTime(300000),'5:00');assert.equal(formatRunTime(1),'0:01');assert.equal(formatRunTime(0),'0:00');
console.log('PASS: 20 one-minute stages, XP independence, exact boundaries, overtime XP, all pauses, real-time ult clock, automatic finale without altar, one reward');
// Exercise the actual RAF adapter: physics is capped, campaign time is not.
update=(dt,activeMs)=>{assert(dt<=34);updateRunProgress(activeMs);};
for(const fps of [15,30,60]){
 init();P.runMs=0;P.stage=1;last=0;hitStop=0;
 for(let f=1;f<=60*fps;f++)frameCallback(f*1000/fps);
 assert(Math.abs(P.runMs-60000)<.0001);assert.equal(P.stage,2);
 paused=true;frameCallback(61000);assert.equal(P.runMs,60000);
}
console.log('PASS: real frame adapter keeps minute stages at 15 / 30 / 60 FPS; paused frames add no time');
`,box);
