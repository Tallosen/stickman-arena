const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const box={assert,console,DRAGON_IDS:['green','blue','violet','pink','blackgold','gold','diamond']};
vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/dragon-cave.js'),'utf8'),box);
vm.runInContext(`
const all=[...DRAGON_IDS,...Array.from({length:100},(_,i)=>i)];
// Thumbnail construction must never consume the live room's capacity.
all.forEach(caveResident);
let smallest=Infinity;
function check(pets){
  for(const p of pets){
    assert(cavePathClear(p,p),'Scenery collision: '+p.id);
    for(const q of pets)if(q!==p){
      const d=Math.hypot(p.x-q.x,p.z-q.z);smallest=Math.min(smallest,d);
      assert(d>CAVE_PET_CLEARANCE*2+.059,'Pet collision: '+p.id+'/'+q.id);
    }
  }
}
for(let page=0;page<Math.ceil(all.length/8);page++){
  const ids=all.slice(page*8,page*8+8),pets=cavePlaceResidents(ids);
  check(pets);
  const travel=ids.map(()=>0);
  for(let i=0;i<900;i++){
    const before=pets.map(p=>({x:p.x,z:p.z}));stepCaveResidents(ids,.08);check(pets);
    pets.forEach((p,j)=>travel[j]+=Math.hypot(p.x-before[j].x,p.z-before[j].z));
  }
  travel.forEach((d,i)=>assert(d>8,'Inactive pet on page '+page+': '+ids[i]+' walked '+d));
  console.log('PASS: group',page+1,'separate spawns, no overlaps, every pet walks >8 units in 72s');
}
// Reproduce the old pile; changing/reopening the roster repairs all positions.
const ids=all.slice(0,8);ids.forEach(id=>Object.assign(caveResident(id),{x:0,z:0}));
caveRosterKey='';const pets=cavePlaceResidents(ids);check(pets);
// A lifted dragon still reserves its landing position.
caveHeld=ids[0];const home={x:pets[0].x,z:pets[0].z};
for(let i=0;i<400;i++){stepCaveResidents(ids,.08);check(pets);}
assert.equal(pets[0].x,home.x);assert.equal(pets[0].z,home.z);
caveRelease={id:caveHeld};caveHeld=null;
for(let i=0;i<20;i++){stepCaveResidents(ids,.08);check(pets);}
assert.equal(pets[0].x,home.x);assert.equal(pets[0].z,home.z);
console.log('PASS: preview isolation, pile recovery, reserved pickup/release spot; minimum body-centre separation:',smallest);
`,box);
