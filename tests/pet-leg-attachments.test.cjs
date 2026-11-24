const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const box={console,Math,assert};vm.createContext(box);
for(const file of ['dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),box);
vm.runInContext(`
let legs=0,models=0,oldOutside=0,maximumRadius=0;
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
for(let id=0;id<100;id++){
 const mesh=buildExclusiveDragon(id),d=mesh.d;if(!d.legs)continue;models++;
 const by=d.height||1.4,rx=d.body[0]*(1+d.variant*.055),rest=prepareRestingDragon(mesh),center=restingDragonPoint([0,by,0],d);
 const neutral={breath:0,stretch:0,nod:0,look:0,tail:0,wing:0};
 const poses=[neutral,{...neutral,step:.3,breath:.025,sway:.22,turn:.3,hop:.2},{...neutral,step:-.3,breath:-.025,sway:-.2,turn:-.4},{...neutral,squash:-.55,step:.25},{...neutral,stretch:.12,step:-.25,hop:.5}];
 const torso=rest.faces.filter(f=>f.surface===1);
 const planes=poses.map(m=>{const c=collectionAnimatedPoint(center,{part:0},d,m);return torso.map(f=>{
  const p=f.p.map(v=>collectionAnimatedPoint(v,f,d,m)),n=cross(sub(p[1],p[0]),sub(p[2],p[0]));return {a:p[0],n,sign:Math.sign(dot(n,sub(c,p[0])))};
 });});
 for(let j=0;j<d.legs;j++){
  legs++;const layout=dragonLegLayout(d,j),hip=layout.hip,rows=d.legs/2,oldX=rows===1?.35:.75-Math.floor(j/2)/(rows-1)*d.body[0]*1.45;
  if((oldX/rx)**2+(.18/d.body[1])**2+.63**2>1)oldOutside++;
  const caps=mesh.faces.filter(f=>f.part===10+j&&f.p.some(p=>p.every((v,k)=>v===hip[k])));assert.equal(caps.length,6,'Missing closed root cap '+id+':'+j);
  const roots=[...new Map(caps.flatMap(f=>f.p).map(p=>[p.join(','),p])).values()];
  for(const p of roots){
   const q=(p[0]/rx)**2+((p[1]-by)/d.body[1])**2+(p[2]/d.body[2])**2;maximumRadius=Math.max(maximumRadius,q);assert(q<.8,'Socket outside torso envelope');
   const rp=restingDragonPoint(p,d);
   for(let k=0;k<poses.length;k++){
    const actual=collectionAnimatedPoint(rp,{part:10+j},d,poses[k]);
    for(const plane of planes[k])assert(dot(plane.n,sub(actual,plane.a))*plane.sign>=-1e-8,'Exposed root cap '+id+':'+j+' pose '+k);
   }
  }
  const root=restingDragonPoint(hip,d);
  for(const m of poses){const a=collectionAnimatedPoint(root,{part:10+j},d,m),b=collectionAnimatedPoint(root,{part:0},d,m);assert(Math.hypot(...sub(a,b))<1e-10,'Root moved independently of body');}
 }
}
assert(oldOutside>0,'Regression did not reproduce old bad socket placement');assert(models>50&&legs>200);
console.log('PASS: '+legs+' closed leg roots across '+models+' models remain inside the actual torso mesh in 5 poses; roots share body motion. Old outside centers: '+oldOutside+'; max normalized cap radius squared: '+maximumRadius.toFixed(3));
`,box);
