const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const {createCanvas}=require('@napi-rs/canvas');
const box={console,Math,assert,dragonProfile:{personalities:{}},document:{createElement:()=>createCanvas(1,1)}};vm.createContext(box);
for(const f of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f),'utf8'),box);
const run=s=>vm.runInContext(s,box);
run(`
for(const feature of ['flippers','gills','manta','seahorse'])assert.equal(collectionHabitat({feature}),'water');
for(const feature of ['cobra','scorpion','sail'])assert.equal(collectionHabitat({feature}),'sand');
assert.equal(collectionHabitat({feature:'antlers'}),'forest');
assert.equal(collectionHabitat({feature:'crystal'}),'snow');
assert.equal(collectionHabitat({feature:'phoenix'}),'ember');
let maximum=0;
for(let id=0;id<100;id++){
 const mesh=homeDragonDisplayMesh(id),rest=prepareRestingDragon(mesh),personality=dragonPersonality(id),before=JSON.stringify(dragonProfile);
 const scene=buildCollectionHabitat(rest,personality);
 assert.strictEqual(scene,buildCollectionHabitat(rest,personality),'Scene cache missed');
 assert.equal(JSON.stringify(dragonProfile),before,'Environment changed saved personality');
 assert(scene.faces.length>100);maximum=Math.max(maximum,scene.faces.length);
 for(const f of scene.faces){assert(f.p.length>=3);assert(f.p.flat().every(Number.isFinite));assert(f.rgb.every(Number.isFinite));}
 assert(scene.faces.some(f=>f.p.some(p=>p[1]>.1)),'Flat environment');
 for(const prop of scene.props)assert(Math.hypot(prop.x,prop.z)+prop.r<1.12,'Prop outside island: '+prop.kind);
}
assert(maximum<2400,'Habitat geometry budget exceeded: '+maximum);
console.log('Habitat maximum faces: '+maximum);
`);
box.c=createCanvas(240,160);
run(`
const rest=prepareRestingDragon(homeDragonDisplayMesh(18)),view={yaw:.85,pitch:.35,distance:1.08};
const env=drawCollectionWorld(c.getContext('2d'),240,160,rest,collectionCamera(rest,view,240,160),dragonPersonality(18));
assert(env.depth.some(d=>d>0),'Environment has no depth');
const rendering=drawCollectionDragon(c,18,view,0,null,true,true,env.depth);
assert.deepEqual(Array.from(rendering.raster.depth),Array.from(env.depth),'Pet did not inherit environment occlusion');
`);
console.log('PASS: anatomy-based habitats, 100 finite bounded scenes, cache reuse, saves unchanged, solid props and shared environment/pet depth');
