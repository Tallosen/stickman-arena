const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const box={console,Math,assert,performance:{now:()=>100000},dragonProfile:{personalities:{},care:{0:30},exclusives:{0:1}},homeAnimTime:10,homeReduced:false,homeTab:'warehouse',caveHeld:0,homeThumbSlots:[],homeCanvasVisible:true,dragonHomeOpen:()=>true,homeCanView:()=>true,wakeDragonHome(){},homeMessage(){},audio(){},beep(){},Playables:{blocked:false}};vm.createContext(box);
for(const file of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),box);
vm.runInContext(`
const saved=JSON.stringify(dragonProfile),states=[{kind:'feed'},{kind:'music'},{kind:'pet'},{kind:'touch',reaction:0},{kind:'activity',activity:'sleep'},{kind:'activity',activity:'play'}];
const equal=(a,b,label)=>{for(const k of new Set([...Object.keys(a),...Object.keys(b)]))assert(Math.abs((a[k]||0)-(b[k]||0))<1e-9,label+':'+k);};
for(let id=0;id<100;id++){
 const mesh=homeDragonDisplayMesh(id),d=mesh.d,rest=prepareRestingDragon(mesh),base=collectionMotion(d,10);
 for(const state of states){
  const from=applyCollectionCare(base,{id,...state,t:1.25,duration:6});
  for(const next of states){
   for(const t of [0,.16,.32]){
    const care={id,...next,t,duration:6,transitionPose:from},target=collectionCarePose(base,care),m=applyCollectionCare(base,care);
    assert(Object.values(m).every(Number.isFinite));if(t===0)equal(m,from,'First frame');if(t===.32)equal(m,target,'Last blend frame');
    for(const [j,leg] of collectionRig(d).legs.entries()){
     const a=collectionAnimatedPoint(leg.hip,{part:10+j},d,m),b=collectionAnimatedPoint(leg.hip,{part:0},d,m);assert(Math.hypot(...a.map((v,k)=>v-b[k]))<1e-9,'Leg attachment '+id);
    }
    for(let i=0;i<rest.faces.length;i+=307)for(const p of rest.faces[i].p){const v=collectionAnimatedPoint(p,rest.faces[i],d,m);assert(v.every(Number.isFinite)&&v[1]>=0);}
   }
  }
 }
}
const half=blendCollectionCarePose({turn:Math.PI*2-.2},{turn:0},.5);assert(half.turn>6,'Full turn reversed instead of taking short path');
homeCareActive={id:0,kind:'feed',start:8.5,duration:5.6};const before=captureHomeCarePose(0);assert(beginDragonCare(0,'music'));equal(homeCareFor(0).transitionPose,before,'Feed to music');
homeAnimTime+=.1;const intermediate=captureHomeCarePose(0);assert(touchHomeDragon('head'));equal(homeCareFor(0).transitionPose,intermediate,'Rapid retarget');assert(Object.values(homeCareFor(0).transitionPose).every(v=>typeof v==='number'),'Nested pose snapshots');
homeCareActive={id:0,kind:'music',start:homeAnimTime-1.5,duration:9};let stopped=0;dragonMusicVoices.add({stop(){stopped++;}});const dance=captureHomeCarePose(0);
assert(beginDragonCare(0,'music'));assert.equal(stopped,1);assert.equal(dragonMusicVoices.size,0);assert.equal(homeCareFor(0).kind,'settle');equal(homeCareFor(0).transitionPose,dance,'Stop music');
const base=collectionMotion(homeDragonDisplayMesh(0).d,homeAnimTime);equal(applyCollectionCare(base,homeCareFor(0)),dance,'Stop first frame');
homeAnimTime+=.46;updateDragonCare();assert.equal(homeCareActive,null,'Settling persisted');
homeCareActive={id:0,kind:'music',start:homeAnimTime-1,duration:9};homeReduced=true;assert(beginDragonCare(0,'music'));assert.equal(homeCareActive,null,'Reduced motion should stop instantly');homeReduced=false;
homeCareActive={id:0,kind:'feed',start:homeAnimTime-1,duration:5.6};assert.equal(captureHomeCarePose(1),null,'Copied another pet pose');
Playables.blocked=true;assert(!beginDragonCare(0,'music'));assert.equal(homeCareActive.kind,'feed');Playables.blocked=false;
homeCareCooldown.clear();dragonProfile.care[0]=18;earnDragonAffection=()=>({ok:false,message:'Save error'});const old=homeCareActive;assert(!beginDragonCare(0,'pet'));assert.strictEqual(homeCareActive,old,'Failed action interrupted existing pose');dragonProfile.care[0]=30;
stopDragonCare();assert.equal(homeCareActive,null);assert.equal(JSON.stringify(dragonProfile),saved);
`,box);
console.log('PASS: 100 models x 36 transitions, exact start/end poses, grounded limbs, short-angle blending, rapid retargeting, immediate audio stop, reduced motion, save failure and scope guards');
