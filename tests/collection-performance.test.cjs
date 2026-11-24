// Native Canvas QA/benchmark. Not a measurement of a phone/browser frame rate.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert'),{performance}=require('perf_hooks');
const {createCanvas}=require('@napi-rs/canvas');
const box={console,Math,document:{createElement:()=>createCanvas(1,1)}};vm.createContext(box);
for(const f of ['dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f),'utf8'),box);
const slots=[];let started=performance.now();
box.partial=createCanvas(400,273);const pending=vm.runInContext('beginCellRestFrame(partial,15,{yaw:.85,pitch:.35,distance:1.06})',box);box.pending=pending;
while(pending.render.index<pending.render.queue.length){const before=pending.render.index;vm.runInContext('stepCellRestFrame(pending,256)',box);assert(pending.render.index-before<=256,'Cache rasterization exceeded per-tick budget');}
for(const id of [0,15,18,24,36,60,88,99]){
 const frame=createCanvas(400,273);box.frame=frame;const layers=vm.runInContext('buildCellRestFrame(frame,'+id+',{yaw:.85,pitch:.35,distance:1.06})',box);
 const frames=[frame];frames.layers=layers;slots.push({id,c:createCanvas(400,273),frames});
}
const buildMs=performance.now()-started;
// Once cached, no geometry, projections, sorting or rasterized mesh are permitted.
vm.runInContext('drawCollectionDragon=()=>{throw Error("Idle redrew geometry")};collectionAnimatedPoint=()=>{throw Error("Idle transformed mesh")}',box);
box.slots=slots;started=performance.now();vm.runInContext('for(let tick=0;tick<100;tick++)for(const s of slots)paintCellRest(s,tick/20,false)',box);
const idleMs=performance.now()-started;
box.slot=slots[0];const g=slots[0].c.getContext('2d');
const snap=()=>Buffer.from(g.getImageData(0,0,400,273).data);
vm.runInContext('paintCellRest(slot,0,false)',box);const first=snap();
vm.runInContext('paintCellRest(slot,1,false)',box);assert(!first.equals(snap()),'Breathing did not animate');
vm.runInContext('paintCellRest(slot,0,false)',box);assert(first.equals(snap()),'Previous poses left a trail');assert.equal(g.globalAlpha,1);
vm.runInContext('paintCellRest(slot,1,true)',box);const reduced=snap();vm.runInContext('paintCellRest(slot,2,true)',box);assert(reduced.equals(snap()));
const code=fs.readFileSync(path.join(__dirname,'../src/dragon-home.js'),'utf8');assert(!code.includes('globalAlpha=blend'));assert(!code.includes('slot.dirty&&!slot.frames.length'));
console.log('PASS: 256-face cache batches; 8 crisp layer caches; 100 idle ticks with zero mesh work; exact pixel restoration/no trails; reduced motion static. Native-only build '+buildMs.toFixed(0)+' ms; composite '+(idleMs/100).toFixed(2)+' ms per 8-cell tick.');
