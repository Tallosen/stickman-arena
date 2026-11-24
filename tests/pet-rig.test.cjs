const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const box={console,Math,assert,dragonProfile:{personalities:{}}};vm.createContext(box);
for(const file of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js']){
 let text=fs.readFileSync(path.join(__dirname,'../src',file),'utf8');
 // Record signature-anatomy boundaries in this isolated diagnostic context only.
 if(file==='dragon-3d.js')text=text.replace('switch(d.feature){','const signatureStart=faces.length;switch(d.feature){').replace('const mesh={d,faces};','const mesh={d,faces,signatureStart};');
 vm.runInContext(text,box);
}
vm.runInContext(`
const same=(a,b,label)=>assert(Math.hypot(...a.map((v,i)=>v-b[i]))<1e-9,label);
const onlyHead=['serpent','hydra','hammer','manta','ram','antlers','cobra','batEars','gills','frill','dragonfly'];
let maximum=0;
for(let id=0;id<100;id++){
 const mesh=buildExclusiveDragon(id),d=mesh.d,rig=collectionRig(d),rest=prepareRestingDragon(mesh),details=mesh.faces.slice(mesh.signatureStart);
 maximum=Math.max(maximum,mesh.faces.length);
 assert(mesh.faces.every(f=>f.p.flat().every(Number.isFinite)));
 for(const part of [3,4,5,6])assert(mesh.faces.some(f=>f.part===part),'Missing rig layer '+part);
 if(onlyHead.includes(d.feature))assert(details.every(f=>f.part===3||f.part===5),'Signature detached from head: '+id);
 if(d.feature==='sword')assert(details.slice(-12).every(f=>f.part===3));
 if(d.feature==='scorpion')assert(details.slice(0,12).every(f=>f.part===2));
 if(d.feature==='club')assert(details.slice(0,42).every(f=>f.part===2));
 if(['phoenix','twins','peacock'].includes(d.feature))assert(details.every(f=>f.part===2));
 if(d.feature==='hydra')assert.equal(new Set(details.map(f=>f.head)).size,3);
 assert.strictEqual(rig,collectionRig(d));
 for(let reaction=0;reaction<8;reaction++)for(const t of [.12,.5,1,1.6,2.2,3.15]){
  const m=applyCollectionCare(collectionMotion(d,t),{id,kind:'touch',reaction,t,duration:3.2});
  assert(Object.values(m).every(Number.isFinite));
  const point=(p,part,head=0)=>collectionAnimatedPoint(p,{part,head},d,m);
  for(let h=0;h<rig.heads.length;h++){
   const f=rig.heads[h];same(point(f.root,6,h),point(f.root,0,h),'Neck root split '+id);
   same(point(f.neck,6,h),point(f.neck,3,h),'Neck tip split '+id);
   same(point(f.jaw,4,h),point(f.jaw,3,h),'Jaw hinge split '+id);
   const eye=[f.neck[0]+.55,f.eyeY,f.neck[2]+.2];same(point(eye,5,h),point(eye,3,h),'Eye attachment split '+id);
  }
  const tail=restingDragonPoint([-d.body[0]*.65,d.height||1.4,0],d);same(point(tail,2),point(tail,0),'Tail root split '+id);
 }
 for(const t of [.8,1.5,2.5]){
  const m=applyCollectionCare(collectionMotion(d,t),{id,kind:'feed',t,duration:3.6});
  const mouth=collectionAnimatedPoint(rig.heads[rig.food.head].mouth,{part:3,head:rig.food.head},d,m);
  same(mouth,[rig.food.x,rig.food.mouthY,rig.food.z],'Mouth misses bowl '+id);
 }
 if(d.feature==='sword'){
  const m=applyCollectionCare(collectionMotion(d,1.5),{id,kind:'feed',t:1.5,duration:3.6});
  const tip=restingDragonPoint([d.body[0]*.7+2.1,(d.height||1.4)+(d.neck??.65)+.13,0],d);
  assert(collectionAnimatedPoint(tip,{part:3},d,m)[1]>.025,'Sword entered floor');
 }
 const topology=collectionTopology(rest);assert(topology.vertices.every(v=>Number.isInteger(v.head)));
}
assert(maximum<3500,'Existing geometry budget exceeded');
console.log('PASS: 100 rigs, eight reactions, shared neck/jaw/eye/tail anchors, signature ownership, bowl reach, sword clearance, topology metadata. Largest mesh: '+maximum);
`,box);
