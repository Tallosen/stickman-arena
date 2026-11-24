const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const box={console,Math,assert,dragonProfile:{personalities:{},care:{0:18}},homeAnimTime:0,homeTab:'warehouse',caveHeld:0,homeCanvasVisible:true,homeThumbSlots:[]};vm.createContext(box);
for(const file of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),box);
vm.runInContext(`
const saved=JSON.stringify(dragonProfile),duration=DRAGON_CARE_ACTIONS.feed.duration;
assert.equal(duration,5.6);assert.equal(collectionMealState(0).portions,5);
for(let i=0;i<5;i++){
 const t=.925+i*.55;
 assert.equal(collectionMealState(t-.0001).portions,5-i);assert.equal(collectionMealState(t+.0001).portions,4-i);
 assert(collectionMealState(t+.0001).chew<.001,'Food disappeared while mouth opens');
}
assert.equal(collectionMealState(3.4).portions,0);assert.equal(collectionMealState(4).reach,0);assert.equal(collectionMealState(4).stage,'react');
let previous=0;for(let i=0;i<=560;i++){const state=collectionMealState(i/100);assert(Object.values(state).filter(v=>typeof v==='number').every(Number.isFinite));assert(state.biteCount>=previous&&state.biteCount<=5);previous=state.biteCount;}
const replies=new Set();
for(let id=0;id<100;id++){
 const mesh=homeDragonDisplayMesh(id),d=mesh.d,rest=prepareRestingDragon(mesh),rig=collectionRig(d);replies.add(dragonPersonality(id).idle);
 for(const t of [0,.8,1.5,3.125,3.5,4,4.4,4.8,5.2,5.6]){
  const base=collectionMotion(d,t),m=applyCollectionCare(base,{id,kind:'feed',t,duration});assert(Object.values(m).every(Number.isFinite));
  if(t===0||t===duration)for(const k of new Set([...Object.keys(base),...Object.keys(m)]))assert(Math.abs((base[k]||0)-(m[k]||0))<1e-9,'Feeding endpoint jumps '+id+':'+k);
  if(t===.8||t===1.5||t===3.125){const mouth=collectionAnimatedPoint(rig.heads[rig.food.head].mouth,{part:3,head:rig.food.head},d,m);assert(Math.hypot(mouth[0]-rig.food.x,mouth[1]-rig.food.mouthY,mouth[2]-rig.food.z)<1e-9,'Mouth misses bowl');}
  for(const [j,leg] of rig.legs.entries()){const a=collectionAnimatedPoint(leg.hip,{part:10+j},d,m),b=collectionAnimatedPoint(leg.hip,{part:0},d,m);assert(Math.hypot(...a.map((v,k)=>v-b[k]))<1e-9,'Leg root detached');}
  for(let i=0;i<rest.faces.length;i+=83)for(const p of rest.faces[i].p){const v=collectionAnimatedPoint(p,rest.faces[i],d,m);assert(v.every(Number.isFinite)&&v[1]>=0);}
 }
}
assert.equal(replies.size,8);
const rest=prepareRestingDragon(homeDragonDisplayMesh(0)),camera=collectionCamera(rest,{yaw:.85,pitch:.35,distance:1},400,300),full=[],empty=[];
collectionFoodBowl(full,camera,rest,{kind:'feed',t:0,duration});collectionFoodBowl(empty,camera,rest,{kind:'feed',t:4.5,duration});assert.equal(full.length-empty.length,5*18,'Bowl did not lose exactly five portions');
let refreshes=0;refreshCareControls=()=>refreshes++;homeCareActive={id:0,kind:'feed',start:0,duration};homeAnimTime=4.4;updateDragonCare();assert.equal(homeCareActive.phase,'react');const before=refreshes;
for(let i=0;i<20;i++)updateDragonCare();assert.equal(refreshes,before,'Caption rebuilt every frame');homeAnimTime=5.61;updateDragonCare();assert.equal(homeCareActive,null);
assert.equal(JSON.stringify(dragonProfile),saved);
`,box);
console.log('PASS: five synchronized bites, empty bowl, eight stable endings, 100 grounded feeding rigs, continuous endpoints, phase-only captions and no save mutation');
