const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.dataset={};this.style={};this.attrs={};this.events={};this.value='all';this.isConnected=true;this.classes=new Set();this.classList={add:(...s)=>s.forEach(x=>this.classes.add(x)),remove:(...s)=>s.forEach(x=>this.classes.delete(x)),contains:s=>this.classes.has(s),toggle:(s,on)=>{on=on??!this.classes.has(s);on?this.classes.add(s):this.classes.delete(s);return on;}};}
 appendChild(el){this.children.push(el);return el;}replaceChildren(){this.children=[];}setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k];}
 addEventListener(k,fn){(this.events[k]??=[]).push(fn);}dispatch(k,ev){for(const fn of this.events[k]||[])fn(ev);}
 querySelectorAll(selector='button[data-dragon]'){const all=this.children.flatMap(e=>[e,...e.querySelectorAll('*')]);return selector==='*'?all:all.filter(e=>e.tag==='button'&&(!selector.includes('[data-dragon]')||e.dataset.dragon!==undefined));}querySelector(){return this.querySelectorAll()[0]||null;}
 focus(){doc.activeElement=this;}scrollIntoView(){}setPointerCapture(){}getBoundingClientRect(){return {left:0,top:0,width:600,height:410};}getClientRects(){return this.classes.has('hidden')?[]:[{}];}
 getContext(){return {drawImage(){},fillRect(){}};}
}
const elements=new Map();for(const m of html.matchAll(/<([a-z][a-z0-9]*)\b[^>]*\bid="([^"]+)"[^>]*>/g)){assert(!elements.has(m[2]),'Duplicate ID '+m[2]);const e=new Element(m[1]);if(/class="[^"]*\bhidden\b/.test(m[0]))e.classList.add('hidden');elements.set(m[2],e);}
const el=id=>elements.get(id)||null;
el('dragonEggBtn').dataset.openHome='incubator';el('dragonHomeBtn').dataset.openHome='warehouse';
const doc={getElementById:el,createElement:t=>new Element(t),querySelectorAll:()=>[el('dragonEggBtn'),el('dragonHomeBtn')],addEventListener(){},activeElement:new Element('button'),hidden:false};
const box={console,document:doc,matchMedia:()=>({matches:false}),DRAGON_BREEDS:[],DRAGON_IDS:[],DRAGON_ADMIN_ENABLED:true,dragonFinale:null,dragonStorageError:null,
 dragonProfile:{counts:{diamond:1},exclusives:{0:1,1:2},egg:null},pointer:{},running:false,paused:false,userPaused:false,devicePixelRatio:1,
 exclusiveDragonSpec:id=>({id,name:'Dragon '+id}),ResizeObserver:class{observe(){}disconnect(){}},IntersectionObserver:class{observe(){}disconnect(){}},requestAnimationFrame:()=>1,cancelAnimationFrame(){},clock:1000};
box.performance={now:()=>box.clock};vm.createContext(box);
for(const file of ['dragon-cave.js','dragon-personality.js','dragon-care.js','dragon-cell-camera.js','dragon-home.js','dragon-cell-quality.js'])vm.runInContext(fs.readFileSync(path.join(root,'src',file),'utf8'),box,{filename:file});
const run=s=>vm.runInContext(s,box);run('paintDragonHome=()=>{};drawHomeModel=()=>{};ensureDragonPersonalities=()=>({ok:true})');
const saved=JSON.stringify(box.dragonProfile);
el('dragonEggBtn').onclick();
assert.equal(el('homeSections'),null);
assert.equal(el('tabIncubator'),null);
assert(!el('homeContent').classList.contains('hidden'));
assert.equal(el('homeTitle').textContent,'Вылупить питомца');
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
assert.equal(el('homeTitle').textContent,'Мои питомцы');
assert(el('dragonHome').classList.contains('view-warehouse'));assert(!el('warehousePanel').classList.contains('hidden'));assert(el('incubatorPanel').classList.contains('hidden'));

assert.equal(el('btnCaveCollection'),null,'Nested view must be removed');
const cells=el('exclusiveGrid').children,canvas=cells[0].children[0].children[0];
assert.equal(cells[0].children[0].tag,'div');assert.equal(cells[0].children[0].onclick,undefined);
const event=(type='mouse',id=1,x=100,y=100)=>({button:0,pointerType:type,pointerId:id,clientX:x,clientY:y,preventDefault(){},stopPropagation(){}});
const original=run('homeThumbSlots[0].view.yaw'),peer=run('homeThumbSlots[1].view.yaw');
canvas.dispatch('pointerdown',event());canvas.dispatch('pointerup',event());assert.equal(run('caveHeld'),0);assert(el('dragonHome').classList.contains('inspecting'));assert(el('warehousePanel').classList.contains('hidden'));
run('collectionHitDragon=()=>false;handleHomeCanvasTap(0,0)');assert.equal(run('homeCareActive'),null);
run('collectionHitDragon=()=>true;handleHomeCanvasTap(100,100)');assert.equal(run('homeCareActive.kind'),'touch');assert.equal(JSON.stringify(box.dragonProfile),saved);
el('btnBackToCollection').onclick();assert.equal(run('caveHeld'),null);assert(!el('dragonHome').classList.contains('inspecting'));
canvas.dispatch('pointerdown',event());canvas.dispatch('pointermove',event('mouse',1,150,120));canvas.dispatch('pointerup',event('mouse',1,150,120));
assert(run('homeThumbSlots[0].view.yaw')<original);assert.equal(run('homeThumbSlots[1].view.yaw'),peer);assert.equal(run('caveHeld'),null);
assert(!el('warehousePanel').classList.contains('hidden'));
const yaw=run('homeThumbSlots[0].view.yaw'),pitch=run('homeThumbSlots[0].view.pitch');
canvas.dispatch('pointerdown',event('touch'));canvas.dispatch('pointermove',event('touch',1,102,160));assert.equal(run('homeThumbSlots[0].view.yaw'),yaw,'Vertical swipe must scroll');
canvas.dispatch('pointerdown',event('touch'));canvas.dispatch('pointermove',event('touch',1,160,103));canvas.dispatch('pointercancel',event('touch'));assert(run('homeThumbSlots[0].view.yaw')<yaw);assert.equal(run('homeThumbSlots[0].view.pitch'),pitch);
canvas.dispatch('pointerdown',event('touch'));canvas.dispatch('pointerdown',event('touch',2,140,100));assert.equal(run('homeThumbSlots[0].gesture'),null);
canvas.dispatch('pointerdown',event());canvas.dispatch('pointermove',event('mouse',1,155));run('cancelCellGestures()');assert.equal(run('homeThumbSlots[0].gesture'),null);
const key=k=>({key:k,preventDefault(){},stopPropagation(){}});
canvas.dispatch('keydown',key('ArrowRight'));for(let i=0;i<40;i++)canvas.dispatch('keydown',key('+'));assert.equal(run('homeThumbSlots[0].view.distance'),.62);
for(let i=0;i<40;i++)canvas.dispatch('keydown',key('-'));assert.equal(run('homeThumbSlots[0].view.distance'),2.5);
assert.equal(run('homeThumbJobs.filter(j=>j.id===0).length'),1);
assert.equal(JSON.stringify(box.dragonProfile),saved);
const remembered=run('homeThumbSlots[0].view.yaw');
box.dragonProfile.exclusives=Object.fromEntries(Array.from({length:25},(_,i)=>[i,100]));run('refreshDragonHome()');
el('homeNext').onclick();assert.equal(el('homePageLabel').textContent,'2 / 4');assert.equal(el('exclusiveGrid').children.length,8);
el('homePrev').onclick();assert.equal(run('homeThumbSlots[0].view.yaw'),remembered);
const current=el('exclusiveGrid').children;
for(const cell of current){const buttons=cell.querySelectorAll('button');assert.equal(buttons.length,3);for(const b of buttons)assert.equal(b.querySelectorAll('button').length,0);}
box.beep=()=>{};box.audio=()=>{};run('earnDragonAffection=()=>({ok:true})');
const buttons=current[0].querySelectorAll('button');buttons[0].onclick({stopPropagation(){}});assert.equal(run('caveHeld'),null);assert.equal(run('homeCareActive.kind'),'feed');
assert.equal(run('homeThumbSlots[0].view.yaw'),remembered);
buttons[2].onclick({stopPropagation(){}});assert.equal(run('homeCareActive.kind'),'music');buttons[2].onclick({stopPropagation(){}});assert.equal(run('homeCareActive'),null);
box.clock+=5000;buttons[2].onclick({stopPropagation(){}});run('homeAnimTime+=20;updateDragonCare()');assert.equal(run('homeCareActive'),null);
el('dragonHome').dispatch('keydown',{...key('Escape'),target:canvas});assert(el('dragonHome').classList.contains('hidden'));
assert.equal(run('beginDragonCare(0,"feed")'),false);
const lastYaw=run('cellView(0).yaw');canvas.dispatch('pointerdown',event());canvas.dispatch('pointermove',event('mouse',1,190));assert.equal(run('cellView(0).yaw'),lastYaw);
assert(html.includes('touch-action:pan-y pinch-zoom'));assert(html.includes('min-height:44px'));
console.log('PASS: individual inspection, hit-only touch without save mutation, back to grid, independent orbit, vertical scroll, pinch/cancel, keyboard bounds, bounded cache, preserved page/care, Escape and stale input');
el('dragonHomeBtn').onclick();run('inspectHomeDragon(0);stopDragonCare();homeAnimTime+=1');
const main=el('homeCanvas');main.dispatch('pointermove',event('mouse',1,420,160));run('homeAnimTime+=.05;homeAttentionView(homeView)');
assert(run('homeGaze.eyeStrength>homeGaze.headStrength&&homeGaze.headStrength>0'),'Eyes must lead the head');
run('collectionDragonTouchZone=()=>"tail"');main.dispatch('pointerdown',event());main.dispatch('pointerup',event());assert.equal(run('homeCareActive.zone'),'tail');
run('stopDragonCare();homeAnimTime+=1');main.dispatch('pointerdown',event());main.dispatch('pointermove',event('mouse',1,150,130));main.dispatch('pointerup',event('mouse',1,150,130));assert.equal(run('homeCareActive'),null,'Orbit started touch reaction');assert.equal(run('homeGaze.headStrength'),0,'Orbit retained gaze');
main.dispatch('pointerdown',event('touch'));main.dispatch('pointerdown',event('touch',2,160,100));main.dispatch('pointerup',event('touch'));main.dispatch('pointerup',event('touch',2,160,100));assert.equal(run('homeCareActive'),null,'Pinch started touch reaction');
run('returnHomeCollection()');assert.equal(run('homeGaze.eyeStrength'),0);
console.log('PASS: inspection-only gaze, eyes lead head, zone tap, orbit/pinch never pet, gaze reset on exit');
