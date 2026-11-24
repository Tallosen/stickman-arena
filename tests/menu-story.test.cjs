const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path');
const handlers={},start={classList:{contains:()=>false}},canvas={addEventListener:(k,f)=>handlers[k]=f,getBoundingClientRect:()=>({left:0,top:0,width:900,height:620})};
const box={assert,console,document:{getElementById:id=>id==='start'?start:canvas},Playables:{blocked:false}};vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/menu-scene.js'),'utf8'),box);
vm.runInContext(`
for(let seed=0;seed<12;seed++){
 let together=0;
 for(let t=0;t<80;t+=.02){
  const cat=menuCatPose(t,seed),next=menuCatPose(t+.001,seed),hero=menuHeroPose(t,seed);
  assert(Math.abs(cat.x-next.x)<.4&&Math.abs(cat.y-next.y)<.4,'Cat teleports');
  if(hero.activity==='sitWithCat'&&menuSchedule(t,seed).u<21){together++;assert.equal(cat.y,363);assert(hero.x-cat.x>=75,'Hero overlaps cat on crate');}
  if(cat.y===363)assert.notEqual(hero.activity,'sit','Hero sits through perched cat');
 }
 assert(together>200);
 assert.equal(menuSchedule(0,seed).kind,6);assert.notEqual(menuSchedule(40,seed).kind,4);assert.equal(menuSchedule(120,seed).kind,4);
}
const normal=menuHeroPose(1,3),waving=menuHeroPose(1,3,{kind:'hero',start:0});
assert(waving.af[1]<normal.af[1]-10);assert.deepStrictEqual(normal.lf,waving.lf);assert.equal(normal.x,waving.x);
assert.deepStrictEqual(normal,menuHeroPose(1,3,{kind:'hero',start:-4}));
for(const [key,max] of Object.entries({helm:4,scope:3,gun:4,cape:3,clip:3,jacket:3,gloves:4,boots:4}))assert.equal(MENU_HERO_GEAR[key],max);
const point=menuPoint({clientX:300,clientY:200},{left:0,top:0,width:600,height:400});
assert(Math.abs(point.x-450)<1e-8&&Math.abs(point.y-310)<1e-8,'Object-fit mapping');
assert(menuReact('hero'));assert(!menuReact('dog'),'Repeated tap restarts animation');
menuSceneTime=3;Playables.blocked=true;assert(!menuReact('dog'));Playables.blocked=false;
assert(menuReact('dog'));menuSceneTime=6;
`,box);
let prevented=0;const event=(x,y)=>({clientX:x,clientY:y,pointerId:1,button:0,preventDefault(){prevented++},stopPropagation(){}});
const dog=vm.runInContext('menuCompanionPose(MENU_COMPANIONS[2],menuSceneTime)',box);
handlers.pointerdown(event(dog.x,dog.y-20));handlers.pointerup(event(dog.x+25,dog.y-20));assert.equal(prevented,0,'Scroll interpreted as tap');
handlers.pointerdown(event(dog.x,dog.y-20));handlers.pointerup(event(dog.x,dog.y-20));assert.equal(prevented,1);
assert.equal(vm.runInContext('menuReaction.kind',box),'dog');
start.classList.contains=()=>true;assert.equal(vm.runInContext('menuReact("hero")',box),false);
console.log('PASS: coordinated cat story, no shared seat, rare knock, lighter silhouette, letterboxing, taps, scroll and platform guards');
