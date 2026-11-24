const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const {createCanvas}=require('@napi-rs/canvas');
const box={console,Math,assert,dragonProfile:{personalities:{},care:{0:30}},homeAnimTime:0,homeReduced:false,homeTab:'warehouse',caveHeld:0,homeThumbSlots:[],dragonHomeOpen:()=>true,homeCanView:()=>true,wakeDragonHome(){}};vm.createContext(box);
for(const file of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),box);
vm.runInContext(`
const saved=JSON.stringify(dragonProfile);beginHomeLife(0);assert.equal(homeLifeFor(0).kind,'greet');assert.equal(homeLifeFor(0).bond,30);
homeAnimTime=3;assert.equal(homeLifeFor(0),null);homeAnimTime=12;assert.equal(homeLifeFor(0).kind,'activity');
const habit=homeLifeFor(0).activity;assert.equal(habit,dragonLifeHabit(0));assert.equal(homeLifeFor(1),null);
assert(beginHomeObjectAction('toy'));assert.equal(homeCareFor(0).activity,'play');assert.equal(homeLifeFor(0),null,'Habit interrupted manual action');
stopDragonCare();assert.equal(homeLifeFor(0),null,'Habit instantly restarted');assert(!beginHomeObjectAction('unknown'));assert(!beginHomeObjectAction('water'));
endHomeLife();assert.equal(homeLifeFor(0),null);homeReduced=true;beginHomeLife(0);assert.equal(homeLifeFor(0),null);homeReduced=false;
for(let id=0;id<100;id++){
 const d=homeDragonDisplayMesh(id).d,rest=prepareRestingDragon(homeDragonDisplayMesh(id)),scene=buildCollectionHabitat(rest,dragonPersonality(id));
 assert(scene.objects.includes('toy')&&scene.objects.includes('nest'));assert(scene.faces.some(f=>f.object==='toy'));assert(scene.faces.some(f=>f.object==='nest'));
 if(scene.biome==='water')assert(scene.objects.includes('water'));
 for(const activity of ['sleep','play','sniff','splash'])for(const t of [0,.4,1.5,3.5,4.49]){
  const m=applyCollectionCare(collectionMotion(d,t),{id,kind:'activity',activity,t,duration:4.5});assert(Object.values(m).every(Number.isFinite));
  for(let i=0;i<rest.faces.length;i+=31)for(const p of rest.faces[i].p){const v=collectionAnimatedPoint(p,rest.faces[i],d,m);assert(v.every(Number.isFinite)&&v[1]>=0);}
 }
 for(const bond of [0,6,18,30]){const m=applyCollectionCare(collectionMotion(d,1),{id,kind:'greet',bond,t:1,duration:2.8});assert(Object.values(m).every(Number.isFinite));}
}
assert.equal(JSON.stringify(dragonProfile),saved,'Cosmetic activities mutated save');
const c={width:40,height:40},face=(zone,z)=>({zone,points:[[1,1],[38,1],[1,38]],depths:[z,z,z]});
collectionObjectShapes.set(c,[face('object:nest',.3)]);collectionPickShapes.set(c,[face('belly',.4)]);assert.equal(collectionIslandObjectAt(c,5,5),null);
collectionPickShapes.set(c,[face('belly',.2)]);assert.equal(collectionIslandObjectAt(c,5,5),'nest');
collectionPickShapes.set(c,[face('object:toy',.5)]);assert.equal(collectionDragonTouchZone(c,5,5),null);assert.equal(collectionIslandObjectAt(c,5,5),'toy');
`,box);
// Actual renderer must make each exposed universal object reachable.
box.nativeCanvas=createCanvas(520,330);
vm.runInContext(`
drawCollectionDragon(nativeCanvas,51,{yaw:.85,pitch:.55,distance:1},0);
const found=new Set();for(const f of collectionObjectShapes.get(nativeCanvas)){
 if(!f.zone||found.has(f.zone.slice(7)))continue;
 const x=f.points.reduce((s,p)=>s+p[0],0)/f.points.length,y=f.points.reduce((s,p)=>s+p[1],0)/f.points.length;
 const hit=collectionIslandObjectAt(nativeCanvas,x,y);if(hit)found.add(hit);
}
assert(found.has('toy'),'Toy is not visibly reachable');assert(found.has('nest'),'Nest is not visibly reachable');assert(found.has('tree'));
`,box);
console.log('PASS: 100 activity rigs, friendship greeting tiers, stable habits, manual override, reduced motion, no save mutation, depth-aware real object picking');
