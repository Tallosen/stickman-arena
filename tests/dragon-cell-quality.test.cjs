const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
function canvas(width=328,height=224,css=360){return {width,height,css,isConnected:true,getBoundingClientRect(){return {width:this.css};},getContext:()=>({drawImage(){},fillRect(){}}),classList:{remove(){}}};}
const observers=[];let open=true,renders=0;
class Observer{constructor(fn){this.fn=fn;this.targets=[];observers.push(this);}observe(c){this.targets.push(c);}disconnect(){this.targets=[];}}
const box={console,Math,assert,dragonHome:{},document:{createElement:()=>canvas()},IntersectionObserver:Observer,ResizeObserver:Observer,homeReduced:false,HOME_IDLE_FRAMES:1,devicePixelRatio:2,homeTab:'warehouse',homeThumbSlots:[],homeThumbJobs:[],homeThumbCache:new Map(),dragonHomeOpen:()=>open,wakeDragonHome(){},drawHomeModel(){renders++;}};vm.createContext(box);
for(const f of ['dragon-cell-camera.js','dragon-cell-quality.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f),'utf8'),box);
const run=s=>vm.runInContext(s,box);
for(let id=0;id<8;id++){const low=canvas(220,150),frames=[low];frames.width=220;const slot={id,c:canvas(),frames,visible:true,hasImage:true,view:{yaw:.85,pitch:.35,distance:1},dirty:false};box.homeThumbSlots.push(slot);box.homeThumbCache.set(id,frames);box.slot=slot;run('observeCellQuality(slot)');}
const show=n=>observers[0].fn(box.homeThumbSlots.map((s,i)=>({target:s.c,isIntersecting:i<n})));
show(2);assert.equal(box.homeThumbJobs.length,2);assert.equal(box.homeThumbSlots[0].c.width,544);assert.equal(box.homeThumbSlots[7].c.width,220);assert.equal(box.homeThumbSlots[7].frames.length,1);
assert.equal(renders,0,'Existing previews must be downsampled without a 3D redraw');
const oldFrames=box.homeThumbSlots[0].frames;box.homeThumbSlots[0].frames.push(canvas(544,491));
show(0);assert.equal(box.homeThumbJobs.length,0);assert(box.homeThumbSlots.every(s=>s.c.width===220&&s.frames.length===1));assert.notEqual(box.homeThumbSlots[0].frames,oldFrames,'HD allocation must be released');
show(8);assert.equal(box.homeThumbJobs.length,8);let pixels=box.homeThumbJobs.reduce((n,j)=>n+j.width*j.height*3,0);assert(pixels<=6000000,pixels);
const queues=box.homeThumbJobs.length;observers[1].fn([]);assert.equal(box.homeThumbJobs.length,queues,'Resize callback duplicates work');
show(1);assert.equal(box.homeThumbJobs.length,1);const first=box.homeThumbSlots[0];first.c.css=440;observers[1].fn([]);assert.equal(first.c.width,576);assert.equal(box.homeThumbJobs[0].width,576);
first.view.yaw=2;box.slot=first;run('invalidateCellFrames(slot);queueCellFrames(slot)');assert.equal(box.homeThumbJobs[0].width,576);assert.equal(box.homeThumbJobs[0].view.yaw,2);
box.homeReduced=true;observers[1].fn([]);assert.equal(box.homeThumbJobs.length,1);
open=false;const count=box.homeThumbJobs.length;observers[1].fn([]);assert.equal(box.homeThumbJobs.length,count);
run('disconnectCellQuality()');assert(observers.every(o=>o.targets.length===0));assert.equal(box.homeThumbJobs.length,0);assert(box.homeThumbSlots.every(s=>s.c.width===220));
console.log('PASS: per-cell visibility, DPR-aware 544px detail, 576px cap, hidden HD release, return/resize reload, 6M-pixel budget, deduplicated jobs, rotated HD frames, cleanup');
