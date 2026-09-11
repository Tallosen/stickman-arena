const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const box={console,Math,assert};vm.createContext(box);
for(const f of ['dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f),'utf8'),box);
vm.runInContext(`
let moving=0,contacts=0;const styles=new Set();
for(let id=0;id<100;id++){
 const mesh=buildExclusiveDragon(id),rest=prepareRestingDragon(mesh),before=JSON.stringify(rest.faces);
 const a=collectionMotion(mesh.d,.2),b=collectionMotion(mesh.d,1.4),end=collectionMotion(mesh.d,.2+COLLECTION_IDLE_PERIOD);styles.add(a.style);
 for(const f of rest.faces)for(const p of f.p){
  const v=collectionAnimatedPoint(p,f,mesh.d,a),u=collectionAnimatedPoint(p,f,mesh.d,b),seam=collectionAnimatedPoint(p,f,mesh.d,end);
  assert(v.every(Number.isFinite)&&u.every(Number.isFinite));assert(v[1]>=0&&u[1]>=0);
  assert(Math.hypot(...v.map((x,i)=>x-seam[i]))<1e-10,'Loop seam');
  if(Math.hypot(...v.map((x,i)=>x-u[i]))>1e-5)moving++;
  if(p[1]===0&&f.part>=10){assert.deepEqual(v,p);contacts++;}
 }
 assert.equal(JSON.stringify(rest.faces),before,'Animation must not mutate rest mesh');
 const view={yaw:.85,pitch:.35},near=collectionCamera(rest,{...view,distance:.62},400,300),mid=collectionCamera(rest,{...view,distance:.8},400,300),far=collectionCamera(rest,{...view,distance:2.5},400,300);
 assert.equal(near.focal,far.focal,'Zoom is dolly, not lens or model scaling');assert(near.distance<mid.distance&&mid.distance<far.distance,'No zoom dead zone');
 assert(Math.hypot(...near.eye.map((x,i)=>x-far.eye[i]))>1);assert.deepEqual(near.target,far.target);
 const p=[rest.target[0]+1,0,0],q=[rest.target[0]+1,0,-1];
 const ratio=point=>{const n=near.project(near.toCamera(point)),f=far.project(far.toCamera(point));return (n[0]-200)/(f[0]-200);};
 assert(Math.abs(ratio(p)-ratio(q))>1e-4,'Depth-dependent perspective/parallax');
}
assert(styles.size===6);assert(moving>1000);assert(contacts>100);
`,box);
console.log('PASS: all 100 animated meshes, 6 idle styles, seamless loops, planted feet, immutable geometry, real camera dolly/parallax');
