const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.dataset={};this.style={};this.attrs={};this.events={};this.value='all';this.isConnected=true;this.classes=new Set();this.classList={add:(...s)=>s.forEach(x=>this.classes.add(x)),remove:(...s)=>s.forEach(x=>this.classes.delete(x)),contains:s=>this.classes.has(s),toggle:(s,on)=>{on=on??!this.classes.has(s);on?this.classes.add(s):this.classes.delete(s);return on;}};}
 appendChild(el){this.children.push(el);return el;}replaceChildren(){this.children=[];}setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k];}
 addEventListener(k,fn){(this.events[k]??=[]).push(fn);}dispatch(k,ev){for(const fn of this.events[k]||[])fn(ev);}
 querySelectorAll(){return this.children.filter(e=>e.tag==='button');}querySelector(){return this.querySelectorAll()[0]||null;}
 focus(){doc.activeElement=this;}scrollIntoView(){}setPointerCapture(){}getBoundingClientRect(){return {left:0,top:0,width:600,height:410};}getClientRects(){return this.classes.has('hidden')?[]:[{}];}
 getContext(){return {drawImage(){}};}
}
const elements=new Map();for(const m of html.matchAll(/<([a-z][a-z0-9]*)\b[^>]*\bid="([^"]+)"[^>]*>/g)){assert(!elements.has(m[2]),'Duplicate ID '+m[2]);const e=new Element(m[1]);if(/class="[^"]*\bhidden\b/.test(m[0]))e.classList.add('hidden');elements.set(m[2],e);}
const el=id=>elements.get(id)||null;
el('dragonEggBtn').dataset.openHome='incubator';el('dragonHomeBtn').dataset.openHome='warehouse';
const doc={getElementById:el,createElement:t=>new Element(t),querySelectorAll:()=>[el('dragonEggBtn'),el('dragonHomeBtn')],addEventListener(){},activeElement:new Element('button'),hidden:false};
const box={console,document:doc,matchMedia:()=>({matches:false}),DRAGON_BREEDS:[],DRAGON_IDS:[],DRAGON_ADMIN_ENABLED:true,dragonFinale:null,dragonStorageError:null,
 dragonProfile:{counts:{diamond:1},exclusives:{0:1,1:2},egg:null},pointer:{},running:false,paused:false,userPaused:false,devicePixelRatio:1,
 exclusiveDragonSpec:id=>({id,name:'Dragon '+id}),ResizeObserver:class{observe(){}},IntersectionObserver:class{observe(){}},requestAnimationFrame:()=>1,cancelAnimationFrame(){},clock:1000};
box.performance={now:()=>box.clock};vm.createContext(box);
for(const file of ['dragon-cave.js','dragon-home.js'])vm.runInContext(fs.readFileSync(path.join(root,'src',file),'utf8'),box,{filename:file});
const run=s=>vm.runInContext(s,box);run('paintDragonHome=()=>{}');
const saved=JSON.stringify(box.dragonProfile);
el('dragonEggBtn').onclick();
assert.equal(el('homeSections'),null);
assert.equal(el('tabIncubator'),null);
assert(!el('homeContent').classList.contains('hidden'));
assert.equal(el('homeTitle').textContent,'Яйцо в гнезде');
el('btnCloseHome').onclick();assert(el('dragonHome').classList.contains('hidden'),'Close must exit directly');
el('dragonEggBtn').onclick();
for(const count of [11,10,0,12345])for(const fed of [0,1,4,5]){
 box.dragonProfile.counts.diamond=count;box.dragonProfile.egg={fed};run('refreshDragonHome()');
 assert.equal(el('homeDiamondCount').textContent,String(count));
 assert.equal(el('homeAvailable').getAttribute('aria-label'),'Бриллиантовые драконы в наличии: '+count);
 assert.equal(el('eggProgressText').textContent,fed+' / 5');
 assert.equal(el('eggProgressBar').getAttribute('aria-valuenow'),String(fed));
 assert.equal(el('btnFeedEgg').textContent,fed===5?'Вылупить':'Вложить · 1');
 assert.equal(el('btnFeedEgg').disabled,fed<5&&count===0);
}
box.dragonProfile=JSON.parse(saved);
assert(html.includes('class="diamond-stock-icon"'));
assert(!html.includes('ЖУРНАЛ СМОТРИТЕЛЯ'));assert(!html.includes('После вылупления в гнезде появится новое яйцо.'));
console.log('PASS: compact diamond icon/count, 16 inventory/egg states, empty stock, hatch without extra cost, accessible labels');
el('btnCloseHome').onclick();el('dragonHomeBtn').onclick();
assert.equal(el('homeTitle').textContent,'Моя коллекция');
assert(el('dragonHome').classList.contains('view-warehouse'));assert(!el('warehousePanel').classList.contains('hidden'));assert(el('incubatorPanel').classList.contains('hidden'));
assert.equal(el('caveCollectionCount').textContent,'2');assert(el('homePager').classList.contains('hidden'));
assert(el('btnCaveCollection').classList.contains('hidden'));
run('renderLivingCave=()=>{throw Error("Cave renderer must not run")};stepCaveResidents=()=>{throw Error("No roaming in collection")};');
el('exclusiveGrid').children.find(e=>e.tag==='button').onclick();assert.equal(run('caveHeld'),0);assert(el('warehousePanel').classList.contains('hidden'));assert(el('dragonHome').classList.contains('inspecting'));
const canvas=el('homeCanvas'),event=(id=1,x=100,y=100)=>({button:0,pointerId:id,clientX:x,clientY:y,preventDefault(){}});
canvas.dispatch('pointerdown',event());canvas.dispatch('pointermove',event(1,125));canvas.dispatch('pointerup',event(1,125));assert.equal(run('caveHeld'),0,'Drag released pet');
canvas.dispatch('pointerdown',event());canvas.dispatch('pointerdown',event(2,150));canvas.dispatch('pointerup',event());canvas.dispatch('pointerup',event(2,150));assert.equal(run('caveHeld'),0,'Pinch released pet');
canvas.dispatch('pointerdown',event());box.clock+=800;canvas.dispatch('pointerup',event());assert.equal(run('caveHeld'),0,'Long press released pet');
el('btnCaveCollection').onclick();assert.equal(run('caveHeld'),null);assert(!el('warehousePanel').classList.contains('hidden'));run('inspectHomeDragon(0)');
canvas.dispatch('pointerdown',event());canvas.dispatch('pointerup',event());assert.equal(run('caveHeld'),null);assert(!el('dragonHome').classList.contains('inspecting'));
run('inspectHomeDragon(1)');el('dragonHome').dispatch('keydown',{key:'Escape',target:canvas,preventDefault(){},stopPropagation(){}});assert.equal(run('caveHeld'),null);
assert.equal(JSON.stringify(box.dragonProfile),saved,'Presentation changed collection');
box.dragonProfile.exclusives=Object.fromEntries(Array.from({length:25},(_,i)=>[i,100]));run('refreshDragonHome()');assert(!el('homePager').classList.contains('hidden'));
el('homeNext').onclick();assert.equal(el('homePageLabel').textContent,'2 / 4');assert.equal(el('exclusiveGrid').querySelectorAll().length,8);assert(!run('homeDrawerOpen'));
assert(html.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));
run('inspectHomeDragon(8)');el('btnCaveCollection').onclick();assert.equal(el('homePageLabel').textContent,'2 / 4');
for(const id of ['btnReleaseDragon','btnZoomIn','btnZoomOut','btnTurntable','btnResetView','viewerControls'])assert.equal(el(id),null,'Obsolete control remains');
assert(html.indexOf('id="warehousePanel"')<html.indexOf('id="incubatorPanel"'),'Collection placement changed');
console.log('PASS: direct nest grid, one view at a time, preserved page on return, mobile grid, no profile mutation');
console.log('PASS: drag/pinch/long press inspect; tap, back and Escape return to cells');
