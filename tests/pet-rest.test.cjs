const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const {createCanvas}=require('@napi-rs/canvas');
const box={console,Math,assert,createCanvas,dragonProfile:{personalities:{},care:{0:18}},homeAnimTime:0,homeReduced:false,homeTab:'warehouse',caveHeld:0,homeThumbSlots:[],dragonHomeOpen:()=>true,homeCanView:()=>true,wakeDragonHome(){},Playables:{blocked:false}};
vm.createContext(box);
for(const file of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),box);
vm.runInContext(`
const saved=JSON.stringify(dragonProfile),near=(a,b,label)=>{for(const k of new Set([...Object.keys(a),...Object.keys(b)]))assert(Math.abs((a[k]||0)-(b[k]||0))<1e-9,label+' '+k);};
for(let id=0;id<100;id++){
 const mesh=homeDragonDisplayMesh(id),d=mesh.d,rest=prepareRestingDragon(mesh),rig=collectionRig(d);
 for(const t of [0,.3,.8,1.3,2.5,4.4,5.5,5.99,6]){
  const base=collectionMotion(d,10+t),sleep=applyCollectionCare(base,{id,kind:'activity',activity:'sleep',t,duration:6});
  assert(Object.values(sleep).every(Number.isFinite));if(t===0||t===6)near(sleep,base,'Sleep boundary');
  const wake0=applyCollectionCare(base,{id,kind:'wake',fromPose:sleep,t:0,duration:3.2});near(wake0,sleep,'Wake jumped at start');
  const wakeEnd=applyCollectionCare(base,{id,kind:'wake',fromPose:sleep,t:3.2,duration:3.2});near(wakeEnd,base,'Wake end');
  for(const pose of [sleep,...[.1,.7,1.4,2.5].map(t=>applyCollectionCare(base,{id,kind:'wake',fromPose:sleep,t,duration:3.2}))]){
   assert(Object.values(pose).every(Number.isFinite));
   for(let j=0;j<rig.legs.length;j++){
    const hip=rig.legs[j].hip,a=collectionAnimatedPoint(hip,{part:10+j},d,pose),b=collectionAnimatedPoint(hip,{part:0},d,pose);assert(Math.hypot(...a.map((v,k)=>v-b[k]))<1e-9,'Leg detached '+id);
   }
   for(let i=0;i<rest.faces.length;i+=113)for(const p of rest.faces[i].p){const v=collectionAnimatedPoint(p,rest.faces[i],d,pose);assert(v.every(Number.isFinite)&&v[1]>=0);}
  }
 }
}
for(const automatic of [false,true])for(const zone of ['head','belly','tail',null]){
 stopDragonCare();endHomeLife();homeAnimTime=10;
 if(automatic){beginHomeLife(0);homeLife.action={activity:'sleep',start:8,duration:6};}else homeCareActive={id:0,kind:'activity',activity:'sleep',start:8,duration:6};
 const sleeping=homeSleepingCare(0);assert(sleeping);const d=homeDragonDisplayMesh(0).d,expected=applyCollectionCare(collectionMotion(d,10),sleeping);
 assert(touchHomeDragon(zone));assert.equal(homeCareFor(0).kind,'wake');near(homeCareFor(0).fromPose,expected,'Captured wrong sleep pose');assert(!touchHomeDragon(zone));assert(!homeSleepingCare(0));
 homeAnimTime+=3.21;assert.equal(homeCareFor(0),null);
}
stopDragonCare();endHomeLife();homeAnimTime=0;assert(beginHomeObjectAction('nest'));assert(homeSleepingCare(0));homeAnimTime=6;assert(!homeSleepingCare(0),'Expired sleep still wakes');
homeReduced=true;homeCareActive={id:0,kind:'activity',activity:'sleep',start:5,duration:6};assert(touchHomeDragon());assert.equal(homeCareFor(0).kind,'wake');
const reducedExpected=applyCollectionCare(collectionMotion(homeDragonDisplayMesh(0).d,0),{id:0,kind:'activity',activity:'sleep',t:.8,duration:6});near(homeCareFor(0).fromPose,reducedExpected,'Reduced motion source');
stopDragonCare();homeReduced=false;Playables.blocked=true;assert(!touchHomeDragon());Playables.blocked=false;caveHeld=null;assert(!touchHomeDragon());
assert.equal(JSON.stringify(dragonProfile),saved);
for(const id of [0,36,66,75,99]){
 const c=createCanvas(240,160),g=c.getContext('2d'),view={yaw:.85,pitch:.35,distance:1},sleep={id,kind:'activity',activity:'sleep',t:2.5,duration:6};
 const fromPose=applyCollectionCare(collectionMotion(homeDragonDisplayMesh(id).d,10),sleep);
 drawCollectionDragon(c,id,view,10,sleep);const before=Array.from(g.getImageData(0,0,240,160).data);
 drawCollectionDragon(c,id,view,10,{id,kind:'wake',fromPose,t:0,duration:3.2});assert.deepEqual(Array.from(g.getImageData(0,0,240,160).data),before,'Visible pop at wake start '+id);
}
`,box);
console.log('PASS: 100 sleep/wake rigs, continuous pose handoff, leg anchors, natural completion, manual/automatic rest, all touch zones, reduced motion, pause guards and no save mutation');
