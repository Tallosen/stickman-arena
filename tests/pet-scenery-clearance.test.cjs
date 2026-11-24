const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const box={console,Math,assert,dragonProfile:{personalities:{}}};vm.createContext(box);
for(const f of ['dragon-personality','dragon-breeds','dragon-camera','dragon-3d','dragon-collection','dragon-care'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f+'.js'),'utf8'),box);
vm.runInContext(`
const saved=JSON.stringify(dragonProfile);let groups=0,groundcovers=0,vertices=0;
for(let id=0;id<100;id++){
 const mesh=homeDragonDisplayMesh(id),d=mesh.d,rest=prepareRestingDragon(mesh),scene=buildCollectionHabitat(rest,dragonPersonality(id));
 assert.strictEqual(buildCollectionHabitat(rest,dragonPersonality(id)),scene,'Scenery cache rebuilt');
 for(const group of scene.solidGroups){
  groups++;
  if(group.groundcover){
   groundcovers++;assert(group.prop.groundcover);assert(group.prop.top<=.029,'Replacement has an obstructing trunk/canopy');
  }else assert(Math.hypot(group.x,group.z)-group.footprint-scene.clearance>.099,'Tree/cactus disk overlaps pet sweep');
  for(let i=group.start;i<group.end;i++)for(const p of scene.faces[i].p){assert(Math.hypot(p[0]-group.x,p[2]-group.z)<=group.footprint+1e-9,'Stretched shared prop vertex');assert(p.every(Number.isFinite));}
  const onGround=scene.faces.slice(0,96).some(f=>{
   if(f.p.length!==3)return false;const [a,b,c]=f.p,sign=(u,v)=>(v[0]-u[0])*(group.z-u[2])-(v[2]-u[2])*(group.x-u[0]),s=[sign(a,b),sign(b,c),sign(c,a)];return s.every(v=>v>=-1e-8)||s.every(v=>v<=1e-8);
  });assert(onGround,'Relocated scenery is floating outside island');
 }
 const food=collectionRig(d).food,expectedRadius=Math.max(2,rest.radius*.92,Math.hypot(food.x-rest.target[0],food.z/.72)+food.r*1.3);
 assert.equal(scene.radius,expectedRadius,'Scenery enlarged the island');assert.equal(scene.rz,expectedRadius*.72);
 for(let i=0;i<48;i++){
  const p=scene.faces[i*2].p[1],a=i/48*Math.PI*2,k=1+Math.sin(a*5)*.025+Math.cos(a*7)*.016;
  assert(Math.abs(p[0]-(scene.cx+Math.cos(a)*expectedRadius*k))<1e-9,'Stretched ground X');
  assert(Math.abs(p[2]-Math.sin(a)*expectedRadius*.72*k)<1e-9,'Stretched ground Z');
 }
 for(let i=0;i<132;i++)for(const p of scene.faces[i].p)assert(Math.hypot((p[0]-scene.cx)/scene.radius,p[2]/scene.rz)<1.05,'Shared ground vertex scaled more than once');
 const poses=[];
 for(const kind of ['feed','pet','music','touch','bond'])for(const t of [.1,.65,1.25,2.1,2.9])for(const variant of [0,3,6,7])poses.push(applyCollectionCare(collectionMotion(d,t),{id,kind,t,duration:6,reaction:variant,reply:variant}));
 for(const activity of ['play','sleep','splash','sniff','ask'])for(const t of [.2,1.3,3,5.5])poses.push(applyCollectionCare(collectionMotion(d,t),{id,kind:'activity',activity,t,duration:6}));
 for(const m of poses)for(let i=0;i<rest.faces.length;i+=41)for(const p of rest.faces[i].p){const v=collectionAnimatedPoint(p,rest.faces[i],d,m);vertices++;assert(Math.hypot(v[0],v[2])<scene.clearance,'Animated pet left safety disk: '+id);}
 // Exhaustive vertices under broad conservative motion limits, including a full turn.
 for(const turn of [0,Math.PI*.5,Math.PI,Math.PI*1.5]){
  const m={...collectionMotion(d,1),tail:2,nod:.8,look:1,wing:1.4,stretch:.2,sway:.3,squash:-.55,turn};
  for(const f of rest.faces)for(const p of f.p){const v=collectionAnimatedPoint(p,f,d,m);assert(Math.hypot(v[0],v[2])<scene.clearance,'Extreme sweep escaped: '+id);}
 }
}
assert(groups>90);assert(groundcovers>0);
// Small declared sweep: exercise retained trees too, with the same fixed oval and no overlap.
const source=prepareRestingDragon(homeDragonDisplayMesh(51));
const roomy={...source,habitatScene:null,petClearance:.2,radius:4,target:[0,source.target[1],0]};
const garden=buildCollectionHabitat(roomy,{habitat:2,flair:0});
assert(garden.solidGroups.every(g=>!g.groundcover));
for(const g of garden.solidGroups){
 assert(Math.hypot(g.x,g.z)-g.footprint>=garden.clearance+.099);
 assert(Math.hypot((g.x-garden.cx)/garden.radius,g.z/garden.rz)+g.footprint/garden.rz<=.921);
 for(const other of garden.solidGroups)if(other!==g)assert(Math.hypot(g.x-other.x,g.z-other.z)>=g.footprint+other.footprint+.099);
}
assert.equal(JSON.stringify(dragonProfile),saved);console.log('Clearance groups: '+groups+'; groundcover replacements: '+groundcovers+'; sampled animated vertices: '+vertices);
`,box);
console.log('PASS: all 100 species, fixed compact outlines, safe tall scenery or low groundcover, complete turn envelope, shared geometry intact and cached layout');
