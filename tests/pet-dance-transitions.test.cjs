const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const {createCanvas}=require('@napi-rs/canvas');
const box={console,Math,assert,createCanvas,dragonProfile:{personalities:{}}};vm.createContext(box);
for(const file of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),box);
vm.runInContext(`
const saved=JSON.stringify(dragonProfile),base={nod:.035,look:.02,wing:-.06,tail:.08,blink:.1,breath:0,stretch:0};
for(let music=0;music<24;music++)for(let dance=0;dance<12;dance++){
 const p={music,dance,flair:50},song=dragonTune(p),duration=song.step*song.length;
 for(const t of [0,duration]){const m=dragonDanceMotion({...base},{t,duration},p,1);for(const key of Object.keys(m))assert(Math.abs(m[key]-(base[key]||0))<1e-9,'Endpoint pop '+dance+':'+key);}
 let previousSpin=0;
 for(let i=0;i<200;i++){
  const t=duration*i/200,m=dragonDanceMotion({...base},{t,duration},p,1);assert(Object.values(m).every(Number.isFinite));assert(m.hop>=0);
  if(dance===8){assert(m.turn>=previousSpin-1e-9,'Turn reversed at outro');previousSpin=m.turn;}
 }
 const intro=dragonDanceTiming(0,duration,song).intro;assert(Math.abs(intro/song.step-2)<1e-9);
 const outro=dragonDanceTiming(0,duration,song).outro;assert(Math.abs(outro/song.step-4)<1e-9);
}
for(let id=0;id<100;id++){
 const mesh=homeDragonDisplayMesh(id),d=mesh.d,rest=prepareRestingDragon(mesh),p=dragonPersonality(id),song=dragonTune(p),duration=song.step*song.length;
 for(const t of [0,song.step*.5,song.step*2,duration*.5,duration-song.step*2,duration-.001,duration]){
  const m=applyCollectionCare(collectionMotion(d,t),{id,kind:'music',t,duration});assert(Object.values(m).every(Number.isFinite));
  for(let i=0;i<rest.faces.length;i+=79)for(const point of rest.faces[i].p){const v=collectionAnimatedPoint(point,rest.faces[i],d,m);assert(v.every(Number.isFinite)&&v[1]>=0);}
  for(const [j,leg] of collectionRig(d).legs.entries()){
   const a=collectionAnimatedPoint(leg.hip,{part:10+j},d,m),b=collectionAnimatedPoint(leg.hip,{part:0},d,m);assert(Math.hypot(...a.map((v,k)=>v-b[k]))<1e-9,'Dance detached leg '+id);
  }
 }
}
// The mesh (without the deliberately separate music-note overlay) has no first/last-frame pop.
for(const id of [0,21,66,75]){
 const mesh=homeDragonDisplayMesh(id),p=dragonPersonality(id),song=dragonTune(p),duration=song.step*song.length,c=createCanvas(180,130),view={yaw:.85,pitch:.4,distance:1};
 for(const t of [0,duration]){
  const normal=drawCollectionDragon(c,id,view,t,null,false,true),dance=drawCollectionDragon(c,id,view,t,{id,kind:'music',t,duration},false,true);
  assert.equal(normal.queue.length,dance.queue.length);for(let i=0;i<normal.queue.length;i++)for(let j=0;j<normal.queue[i].points.length;j++)for(let k=0;k<2;k++)assert(Math.abs(normal.queue[i].points[j][k]-dance.queue[i].points[j][k])<1e-7,'Projected dance endpoint jumps');
 }
}
assert.equal(JSON.stringify(dragonProfile),saved);
`,box);
console.log('PASS: 24 songs x 12 dance transitions, beat-length intro/outro, forward full spin, 100 grounded rigs, projected endpoints and unchanged profiles');
