const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const box={console,Math,assert,dragonProfile:{personalities:{}}};vm.createContext(box);
for(const file of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),box);
vm.runInContext(`
const saved=JSON.stringify(dragonProfile);
for(const t of [0,4.5]){const play=collectionToyPlay(t);assert.equal(play.travel,0);assert.equal(play.reach,0);assert(Math.abs(play.celebrate)<1e-12);}
for(let i=1;i<=450;i++){
 const a=collectionToyPlay((i-1)/100),b=collectionToyPlay(i/100);assert(Math.abs(a.travel-b.travel)<.009);assert(Math.abs(a.reach-b.reach)<.03);
 assert(b.travel>=0&&b.travel<=.34);assert(b.reach>=0&&b.reach<=1);
}
let maxContact=0;
for(let id=0;id<100;id++){
 const mesh=homeDragonDisplayMesh(id),d=mesh.d,rest=prepareRestingDragon(mesh),scene=buildCollectionHabitat(rest,dragonPersonality(id)),rig=collectionRig(d);
 assert.deepEqual(scene.faces.filter(f=>f.object==='toy').map(f=>f.p),collectionToyGeometry(scene.toy).map(f=>f.p),'Static and active toy differ');
 for(const t of [0,.4,.99,1.25,1.62,2.2,2.8,3.5,4.49,4.5]){
  const play=collectionToyPlay(t),m=applyCollectionCare(collectionMotion(d,t),{id,kind:'activity',activity:'play',t,duration:4.5});
  assert(Object.values(m).every(Number.isFinite));
  const c=[scene.toy[0]+play.travel,.13,scene.toy[2]];
  assert(Math.hypot((c[0]-scene.cx)/scene.radius,c[2]/scene.rz)+.13/scene.rz<1.12,'Ball leaves island '+id);
  for(const f of collectionToyGeometry(c,play.spin))for(const p of f.p){assert(p.every(Number.isFinite));assert(p[1]>=-1e-10,'Toy below ground');}
  if(play.contact){const mouth=collectionAnimatedPoint(rig.heads[rig.food.head].mouth,{part:3,head:rig.food.head},d,m),distance=Math.hypot(...mouth.map((v,i)=>v-c[i]));maxContact=Math.max(maxContact,distance);assert(Math.abs(distance-Math.hypot(.1,.09))<1e-8,'Nose misses ball '+id);}
  for(let i=0;i<rest.faces.length;i+=53)for(const p of rest.faces[i].p){const v=collectionAnimatedPoint(p,rest.faces[i],d,m);assert(v.every(Number.isFinite)&&v[1]>=0);}
 }
}
assert.equal(JSON.stringify(dragonProfile),saved);console.log('Nose-to-ball maximum contact distance: '+maxContact.toFixed(4));
`,box);
console.log('PASS: continuous shared toy/nose timing, contact on 100 models, grounded bounded rolling ball, identical idle geometry, no save changes');
