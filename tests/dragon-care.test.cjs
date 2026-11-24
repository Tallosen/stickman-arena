const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const key='vacky_dragon_home_v2',db=new Map();let fail=false;
db.set(key,JSON.stringify({version:2,revision:1,counts:{diamond:5},rescues:5,exclusives:{0:2,1:1},egg:null}));
function context(){const box={console,assert,localStorage:{getItem:k=>db.get(k)??null,setItem:(k,v)=>{if(fail)throw Error('quota');db.set(k,v);}},addEventListener(){}};vm.createContext(box);
for(const f of ['dragon-economy.js','dragon-personality.js','dragon-care.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f),'utf8'),box);return box;}
let box=context();const run=s=>vm.runInContext(s,box);
run(`assert.equal(dragonBond(0),0);assert(earnDragonAffection(0,'feed').ok);assert.equal(dragonBond(0),2);assert(earnDragonAffection(0,'pet').ok);assert.equal(dragonBond(0),3);assert(!earnDragonAffection(99,'feed').ok);assert(!earnDragonAffection(0,'invalid').ok);`);
box=context();run(`assert.equal(dragonBond(0),3);assert.equal(dragonProfile.exclusives[0],2);assert.equal(dragonProfile.counts.diamond,5);assert.equal(dragonProfile.rescues,5);`);
const before=db.get(key);fail=true;run(`assert(!earnDragonAffection(0,'music').ok);assert.equal(dragonBond(0),3);`);assert.equal(db.get(key),before);fail=false;
run(`for(let i=0;i<40;i++)assert(earnDragonAffection(0,'feed').ok);assert.equal(dragonBond(0),30);assert.equal(dragonBond(1),0);assert(earnDragonAffection(1,'pet').ok);assert.equal(dragonBond(1),2);`);
box=context();run(`assert.equal(dragonBond(0),30);assert.equal(dragonBond(1),2);assert(feedDragonEgg().ok);assert.equal(dragonBond(0),30);assert.equal(dragonProfile.counts.diamond,4);`);
run(`
for(let id=0;id<100;id++){
 const mesh=buildExclusiveDragon(id),rest=prepareRestingDragon(mesh),saved=JSON.stringify(rest.faces);
 for(const kind of ['feed','pet','music'])for(const t of [.1,1,2.8]){
  const motion=applyCollectionCare(collectionMotion(mesh.d,t),{id,kind,t,duration:3.2});
  for(const face of rest.faces)for(const p of face.p){const v=collectionAnimatedPoint(p,face,mesh.d,motion);assert(v.every(Number.isFinite));assert(v[1]>=0);if(kind!=='music'&&p[1]===0&&face.part>=10)assert.deepEqual(v,p);}
 }
 assert.equal(JSON.stringify(rest.faces),saved);
}
`);
console.log('PASS: care migration/reload, individual favorites, capped affection, missing ownership, failed-save rollback, unchanged economy/egg, 100 meshes × 3 grounded reactions');
