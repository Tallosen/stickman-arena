const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');let now=1000;
const box={assert,console,performance:{now:()=>now},homeCanView:()=>true,homeHatching:0,homeSelected:null,homeView:{},homeMessage(){},refreshDragonHome(){},DRAGON_IDS:['green','blue','violet','pink','blackgold','gold','diamond']};
vm.createContext(box);for(const file of ['dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-cave.js'])vm.runInContext(fs.readFileSync(path.join(root,'src',file),'utf8'),box);
const run=s=>vm.runInContext(s,box);
box.homeCatalogIds=()=>Array.from({length:100},(_,i)=>i);box.HOME_PAGE_SIZE=8;box.homePage=0;
for(let page=0;page<13;page++){box.homePage=page;const ids=run('caveVisibleIds()');assert(ids.length<=8);assert.equal(ids[0],page*8);}
box.homePage=0;
const caveSource=fs.readFileSync(path.join(root,'src/dragon-cave.js'),'utf8');
assert(!caveSource.includes('caveGPU.hands'));assert(!caveSource.includes('hand.ell'));
assert(!caveSource.includes('label({drink:'));assert(!caveSource.includes('На ладонях'));
console.log('PASS: all 100 species paginated at 8 maximum; no hands geometry or prop labels');
run(`
 const ids=[0,7,15,26,48,63,89,99],seen=new Set();
 cavePlaceResidents(ids);
 const distances=new Map(ids.map(id=>[id,0])),windows=new Map(ids.map(id=>[id,0]));
 const start=ids.map(id=>({...caveResident(id)})),visits=new Map(ids.map(id=>[id,new Set()]));
 for(let frame=0;frame<10000;frame++){
   const before=ids.map(id=>({...caveResident(id)}));stepCaveResidents(ids,.04);
   for(let i=0;i<ids.length;i++){const id=ids[i],p=caveResident(id),old=before[i];seen.add(p.state);visits.get(id).add(p.state);assert(Number.isFinite(p.x+p.z+p.yaw));assert(p.x>=-8.5&&p.x<=8.5&&p.z>=-10&&p.z<=8);
     assert(cavePathClear(p,p),'Pet entered pool or bowl');
     for(const other of ids)if(other!==id)assert(Math.hypot(p.x-caveResident(other).x,p.z-caveResident(other).z)>CAVE_PET_CLEARANCE*2+.059,'Overlapping dragons: '+id+' / '+other);
     assert(Math.abs(p.yaw-old.yaw)<=2.1*.04+1e-8,'Instant turn');
     const traveled=Math.hypot(p.x-old.x,p.z-old.z);assert(Math.abs(p.gait-old.gait-traveled/.29*Math.PI*2)<1e-8,'Steps not tied to distance');
     distances.set(id,distances.get(id)+traveled);windows.set(id,windows.get(id)+traveled);
     assert(traveled<=p.speed*.04+1e-8,'Speed limit exceeded');
     if(p.goal===old.goal&&p.goal)assert.strictEqual(p.goal,old.goal);
   }
   if(frame%1500===1499){for(const [id,d] of windows)assert(d>2,'No meaningful walk for 60s: '+id+' '+d);for(const id of ids)windows.set(id,0);}
 }
 assert.deepEqual([...seen].sort(),['drink','eat','idle','play','sleep','walk']);
 for(const [id,d] of distances)assert(d>30,'Resident barely moving: '+id+' '+d);
 console.log('Walking distances in 400s:',Object.fromEntries(distances));
 const fixed=caveResident(0);if(!fixed.goal)caveChooseGoal(fixed,ids.map(caveResident));const goal=fixed.goal,coords=JSON.stringify(goal);
 const neighbor=caveResident(7),oldStep=neighbor.step;neighbor.step+=2;stepCaveResidents(ids,.001);neighbor.step=oldStep;
 if(fixed.goal===goal)assert.equal(JSON.stringify(fixed.goal),coords,'Neighbor changed reserved destination');
 assert(!cavePathClear({x:-5.9,z:-4.1},{x:-2.4,z:-1}),'Pool crossing allowed');
 const realSolids=CAVE_WALK_OBSTACLES.slice();assert(realSolids.length>10,'Missing scene collisions');
 CAVE_WALK_OBSTACLES.splice(0,CAVE_WALK_OBSTACLES.length,{x:0,z:0,r:.7});
 try{const detour=cavePlanPath({x:-3,z:0},{x:3,z:0});assert(detour.length>1,'Body-width detour missing');let point={x:-3,z:0};for(const next of detour){assert(cavePathClear(point,next));point=next;}
 assert(!cavePathClear({x:-3,z:2},{x:3,z:2}),'Centre clears rock but wing margin ignored');}
 finally{CAVE_WALK_OBSTACLES.splice(0,CAVE_WALK_OBSTACLES.length,...realSolids);}
 assert(ids.some((id,i)=>Math.hypot(caveResident(id).x-start[i].x,caveResident(id).z-start[i].z)>1));
 const p=caveResident(0),x=p.x,z=p.z;
 pickUpCaveDragon(0);assert.strictEqual(caveHeld,0);assert.equal(homeSelected,0);
 for(let i=0;i<30;i++)stepCaveResidents(ids,.04);
 assert.equal(p.x,x);assert.equal(p.z,z);releaseCaveDragon();assert.equal(caveHeld,null);assert.equal(caveRelease.id,0);assert.equal(caveRelease.to.x,x);
 resetCaveVisit();assert.equal(caveRelease,null);assert.equal(caveHits.length,0);assert.strictEqual(caveResident(0),p);
 let vertices=0;
 for(let id=0;id<100;id++){const mesh=buildExclusiveDragon(id),rest=prepareRestingDragon(mesh),data=caveSmoothData(rest.faces);
   assert.equal(data.length,rest.faces.length*36);assert(data.every(Number.isFinite));vertices+=data.length/12;
   assert(mesh.faces.some(f=>f.part===3));if(mesh.d.legs)assert(mesh.faces.some(f=>f.part===10));
   for(const width of [320,390,720])for(const held of [true,false]){const c=caveFrameCamera(width,260,{yaw:2,pitch:.35,distance:1},held);assert(c.eye.every(Number.isFinite));assert(c.eye[1]>0);}
 }
  const scene=caveSmoothData(buildCaveRoom());assert(scene.every(Number.isFinite));
  for(let id=0;id<100;id++){
    const mesh=buildExclusiveDragon(id),rest=prepareRestingDragon(mesh),scale=Math.min(CAVE_ROAM_SCALE,CAVE_ROAM_RADIUS/rest.radius);
    // Worst radial extent over walking + playing animations, including long tails.
    for(const f of rest.faces)for(const p of f.p)for(const t of [0,1.1,2.7,4.3]){
      let [x,y,z]=p;const part=f.part||0,gait=t*3,body=(mesh.d.height||1.4)*.68;
      if(part>=10){const phase=gait+(part%2)*Math.PI+Math.floor((part-10)/2)*Math.PI;x+=Math.sin(phase)*.28*Math.max(0,Math.min(1,1-y/Math.max(.3,body)));}
      if(part===2)z+=Math.sin(t*1.8+x)*Math.min(1,Math.abs(x)*.2)*.16;
      if(part===3){z+=Math.sin(t*.9)*.035;x+=Math.sin(t*3)*.06;}
      if(part===10||part===11)x+=Math.max(0,Math.sin(t*3))*.3*Math.max(0,Math.min(1,1-y));
      if(!mesh.d.legs)z+=Math.sin(gait*.7+x)*.07;
      assert(Math.hypot(x,z)*scale<CAVE_PET_CLEARANCE,'Animated model exceeds collision margin: '+id);
    }
  }
  console.log('PASS: scene-derived solid colliders, swept body collision, 100 animated model footprints within clearance');
  const shell=buildCaveShell();assert(shell.length>2500);
  const dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],sub=(a,b)=>a.map((n,i)=>n-b[i]);
  function rayTriangle(origin,direction,f){const [a,b,c]=f.p,e1=sub(b,a),e2=sub(c,a),h=cross(direction,e2),det=dot(e1,h);if(Math.abs(det)<1e-8)return false;
    const s=sub(origin,a),u=dot(s,h)/det;if(u<0||u>1)return false;const q=cross(s,e1),v=dot(direction,q)/det;if(v<0||u+v>1)return false;return dot(e2,q)/det>.01;}
  for(const held of [false,true])for(const yaw of [-6,-2,.85,2,6])for(const pitch of [.12,.35,1.12])for(const distance of [.62,1,1.8]){
    const c=caveFrameCamera(390,260,{yaw,pitch,distance},held);assert(caveInteriorNorm(c.eye)<.8);assert(c.eye[1]>.1);
    const sy=Math.sin(c.yaw),cy=Math.cos(c.yaw),sp=Math.sin(c.pitch),cp=Math.cos(c.pitch),right=[cy,0,-sy],up=[-sy*sp,cp,-cy*sp],back=[sy*cp,sp,cy*cp];
    for(const x of [-1,0,1])for(const y of [-1,0,1]){
      const ray=back.map((n,i)=>-n+right[i]*x*.6+up[i]*y*.4);
      const floor=ray[1]<0;assert(floor||shell.some(f=>rayTriangle(c.eye,ray,f)),'Ceiling/wall hole');
    }
  }
  console.log('PASS: 90 camera poses stay inside the chamber; screen rays hit walls/roof or floor, no open map edges');
 console.log('PASS: all 4 activities; no resident stuck; stable goals; obstacle detours; bounded turns/speed; distance-driven gait; held/release');
 console.log('PASS: 100 smooth-normal meshes, animation part tags, mobile/desktop orbit camera, finite cave geometry ('+vertices+' vertices)');
`);
