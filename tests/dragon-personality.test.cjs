const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const key='vacky_dragon_home_v2',db=new Map();let fail=false;
db.set(key,JSON.stringify({version:2,revision:1,counts:{diamond:5},rescues:5,exclusives:{0:2,1:1},care:{0:12},egg:null}));
function context(){const box={console,assert,localStorage:{getItem:k=>db.get(k)??null,setItem:(k,v)=>{if(fail)throw Error('quota');db.set(k,v);}},addEventListener(){},beep(){}};vm.createContext(box);
 for(const f of ['dragon-economy.js','dragon-personality.js','dragon-care.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f),'utf8'),box);return box;}
let box=context();const run=s=>vm.runInContext(s,box),before=db.get(key);fail=true;run('assert(!ensureDragonPersonalities().ok)');assert.equal(db.get(key),before);fail=false;
run('assert(ensureDragonPersonalities().ok);assert.equal(Object.keys(dragonProfile.personalities).length,2);assert.equal(dragonProfile.care[0],12);assert.equal(dragonProfile.exclusives[0],2);assert.equal(dragonProfile.counts.diamond,5);');
const assigned=db.get(key);run('assert(ensureDragonPersonalities().ok)');assert.equal(db.get(key),assigned,'Reopening rerolls or writes unnecessarily');const p=run('JSON.stringify(dragonPersonality(0))');
box=context();assert.equal(run('JSON.stringify(dragonPersonality(0))'),p);run('assert(feedDragonEgg().ok);assert.equal(JSON.stringify(dragonPersonality(0)),'+JSON.stringify(p)+')');
run(`const music=new Set(),dances=new Set(),habitats=new Set(),signatures=new Set();
for(let seed=1;seed<=2000;seed++){const p=personalityFromSeed(seed);music.add(p.music);dances.add(p.dance);habitats.add(p.habitat);const tune=dragonTune(p);assert(tune.step>0&&tune.step<1);}
assert.equal(music.size,24);assert.equal(dances.size,12);assert.equal(habitats.size,12);
for(let i=0;i<24;i++){const p={music:i,tempo:2};const tune=dragonTune(p);signatures.add(JSON.stringify([tune.root,tune.notes]));}assert.equal(signatures.size,24);
for(let dance=0;dance<12;dance++)for(let music=0;music<24;music++)for(const t of [0,.2,1,3,6]){
const p={seed:1,dance,music,tempo:2,flair:50};const result=dragonDanceMotion({nod:0,tail:0,wing:0,look:0},{t,duration:10},p,1);assert(Object.values(result).every(Number.isFinite));assert(result.hop>=0);}
`);
run(`dragonTransaction(p=>{p.egg={shell:0,fed:5,reward:0};return true;});assert(hatchDragonEgg().ok);assert.equal(JSON.stringify(dragonPersonality(0)),${JSON.stringify(p)});dragonTransaction(p=>{p.egg={shell:0,fed:5,reward:9};return true;});assert(hatchDragonEgg().ok);assert(dragonProfile.personalities[9]);`);
console.log('PASS: one-time random assignment, reload/duplicate stability, save rollback, new hatch, preserved economy/care, 24 songs, 12 dances, 12 habitats, finite choreography');
