const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const box={console,Math,assert,dragonProfile:{personalities:{}}};vm.createContext(box);
for(const file of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),box);
vm.runInContext(`
const canvas={width:30,height:30},triangle=(zone,z)=>({zone,points:[[1,1],[28,1],[1,28]],depths:[z,z,z]});
const faces=[triangle('tail',.1),triangle('head',.4),triangle('belly',.2)];collectionPickShapes.set(canvas,faces);
assert.equal(collectionDragonTouchZone(canvas,5,5),'head');faces.reverse();assert.equal(collectionDragonTouchZone(canvas,5,5),'head','Order-dependent hit');
faces.push(triangle(null,.5));assert.equal(collectionDragonTouchZone(canvas,5,5),null,'Touched through bowl');faces.pop();
faces.environment=new Float32Array(900).fill(.6);assert.equal(collectionDragonTouchZone(canvas,5,5),null,'Touched through scenery');
faces.environment.fill(0);assert.equal(collectionDragonTouchZone(canvas,-1,5),null);assert.equal(collectionDragonTouchZone(canvas,29,29),null);
// Perspective depth, not face-average sorting, resolves crossing anatomy.
const crossing=[triangle('tail',.3),triangle('head',.2)];crossing[1].depths=[.1,.8,.1];collectionPickShapes.set(canvas,crossing);
assert.equal(collectionDragonTouchZone(canvas,3,3),'tail');assert.equal(collectionDragonTouchZone(canvas,23,3),'head');
for(let id=0;id<100;id++){
 const mesh=buildExclusiveDragon(id),topology=collectionTopology(prepareRestingDragon(mesh));
 assert(topology.faces.some(f=>f.zone==='head'));assert(topology.faces.some(f=>f.zone==='tail'));assert(topology.faces.some(f=>f.zone==='belly'));
 assert(topology.vertices.some(v=>v.part===5&&v.eyeLayer===1));
 for(const zone of ['head','belly','tail'])for(const t of [.1,.8,1.6,2.9]){
  const motion=applyCollectionCare(collectionMotion(mesh.d,t),{id,kind:'touch',zone,reaction:3,t,duration:3.2});assert(Object.values(motion).every(Number.isFinite));
 }
 const camera=collectionCamera(prepareRestingDragon(mesh),{yaw:.85,pitch:.35},400,300),idle=collectionMotion(mesh.d,1);
 for(const x of [-1,0,1]){const m=applyCollectionAttention(idle,camera,{x,y:x,eyeStrength:1,headStrength:.4});assert(Object.values(m).every(Number.isFinite));assert(Math.abs(m.eyeLook)<=1);}
 assert.strictEqual(applyCollectionAttention(idle,camera,null),idle);
}
`,box);
Object.assign(box,{dragonHomeOpen:()=>true,homeTab:'warehouse',caveHeld:0,homeCanView:()=>true,homeAnimTime:0,homeThumbSlots:[],wakeDragonHome(){}});
vm.runInContext(`
const original=JSON.stringify(dragonProfile);
for(const [zone,allowed] of Object.entries({head:[2,6,7],belly:[0,5,3],tail:[1,3,4]}))for(let i=0;i<3;i++){
 homeAnimTime++;assert(touchHomeDragon(zone));assert.equal(homeCareFor(0).zone,zone);assert(allowed.includes(homeCareFor(0).reaction));assert(!touchHomeDragon(zone));
}
assert.equal(JSON.stringify(dragonProfile),original);
`,box);
console.log('PASS: visible depth-aware head/belly/tail picking, object occlusion, 100 zone rigs and gaze poses, zone reactions and cooldown, no save mutation');
