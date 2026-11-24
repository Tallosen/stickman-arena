"use strict";
/* Fixed world-space rest pose and an orbiting perspective camera. */
function restingDragonPoint(p,d,tag=0){
  let [x,y,z]=p;
  if(tag)z=Math.sign(tag)*.32+(z-Math.sign(tag)*.32)*.76;
  const support=d.legs?.14:(d.height||1.4)-d.body[1];
  // Crouched legs; limbless dragons rest on their belly. Low tails lie on the floor.
  y=Math.max(0,(y-support)*(d.legs?.68:.86));
  return [x,y,z];
}
function prepareRestingDragon(mesh){
  if(mesh.resting)return mesh.resting;
  const faces=mesh.faces.map(f=>({...f,p:f.p.map(p=>restingDragonPoint(p,mesh.d,f.tag))}));
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(const f of faces)for(const p of f.p)for(let i=0;i<3;i++){min[i]=Math.min(min[i],p[i]);max[i]=Math.max(max[i],p[i]);}
  const target=[(min[0]+max[0])/2,max[1]*.45,(min[2]+max[2])/2];
  let radius=0;for(const f of faces)for(const p of f.p)radius=Math.max(radius,Math.hypot(...p.map((v,i)=>v-target[i])));
  return mesh.resting={faces,min,max,target,radius,spec:mesh.d};
}
function dragonOrbitCamera(rest,view,w,h){
  const yaw=view.yaw??-.65,pitch=Math.max(.12,Math.min(1.12,view.pitch??.38));
  const aspect=w/h,fov=.76,focal=h/(2*Math.tan(fov/2));
  const fit=rest.radius/Math.sin(Math.min(fov,2*Math.atan(aspect*Math.tan(fov/2)))/2)*1.07;
  const factor=Math.max(.62,Math.min(2.5,view.distance??1/(view.zoom||1)));
  const distance=fit*factor,sy=Math.sin(yaw),cy=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch);
  const right=[cy,0,-sy],up=[-sy*sp,cp,-cy*sp],back=[sy*cp,sp,cy*cp];
  const target=rest.target,eye=target.map((v,i)=>v+back[i]*distance);
  const toCamera=p=>{const x=p[0]-target[0],y=p[1]-target[1],z=p[2]-target[2];return [x*right[0]+z*right[2],x*up[0]+y*up[1]+z*up[2],distance-(x*back[0]+y*back[1]+z*back[2])];};
  const project=p=>[w*.5+p[0]*focal/p[2],h*.54-p[1]*focal/p[2]];
  return {eye,target,distance,yaw,pitch,focal,toCamera,project};
}
let dragonGroundScene=null;
const homeRescueMeshes=new Map();
function homeDragonDisplayMesh(id){
  if(typeof id==="number")return buildExclusiveDragon(id);
  if(homeRescueMeshes.has(id))return homeRescueMeshes.get(id);
  const map={green:0,blue:18,violet:9,pink:36,blackgold:24,gold:99,diamond:15};
  const base=buildExclusiveDragon(map[id]??0),type=DRAGON_TYPES.find(d=>d.id===id);
  const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  const body=rgb(type.col),wing=rgb(type.wing),accent=rgb(type.accent);
  const faces=base.faces.map(f=>({...f,col:f.col===base.d.color?body:f.col===base.d.wing?wing:f.col===base.d.accent?accent:f.col}));
  const mesh={d:{...base.d,name:type.name},faces};homeRescueMeshes.set(id,mesh);return mesh;
}
function getDragonGroundScene(){
  if(dragonGroundScene)return dragonGroundScene;
  const faces=[];
  const tri=(a,b,c,col)=>faces.push({p:[a,b,c],col});
  // Subdivided ground keeps near-plane clipping stable when dollying in.
  for(let x=-24;x<24;x+=4)for(let z=-24;z<24;z+=4){
    const col="#e7dac0";
    tri([x,0,z],[x+4,0,z],[x+4,0,z+4],col);tri([x,0,z],[x+4,0,z+4],[x,0,z+4],col);
  }
  for(let i=0;i<24;i++){
    const a=i*2.399,r=4.8+(i%5)*1.1,x=Math.cos(a)*r,z=Math.sin(a)*r,s=.18+(i%4)*.12;
    const top=[x,.35+(i%3)*.18,z],c=i%2?"#a8a38c":"#c0b89d";
    for(let j=0;j<5;j++){const aa=j/5*6.283,bb=(j+1)/5*6.283;tri([x+Math.cos(aa)*s,0,z+Math.sin(aa)*s],top,[x+Math.cos(bb)*s,0,z+Math.sin(bb)*s],c);}
  }
  return dragonGroundScene=faces;
}
function clipDragonNear(points){
  const out=[],near=.15;
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length],ia=a[2]>=near,ib=b[2]>=near;
    if(ia)out.push(a);
    if(ia!==ib){const t=(near-a[2])/(b[2]-a[2]);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,near]);}
  }
  return out;
}
function renderRestingDragon(canvas,mesh,view){
  const g=canvas.getContext("2d"),w=canvas.width,h=canvas.height,rest=prepareRestingDragon(mesh),camera=dragonOrbitCamera(rest,view,w,h);
  g.fillStyle="#beb6a0";g.fillRect(0,0,w,h);
  const queue=[];
  function polygon(points,col,ink=false){
    const p=clipDragonNear(points.map(camera.toCamera));if(p.length<3)return;
    queue.push({p:p.map(camera.project),depth:p.reduce((n,v)=>n+v[2],0)/p.length,col,ink});
  }
  function flush(){
    queue.sort((a,b)=>b.depth-a.depth);g.lineJoin="round";
    for(const f of queue){g.beginPath();f.p.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fillStyle=f.col;g.fill();
      if(f.ink){g.lineWidth=.55;g.strokeStyle="#2b26204d";g.stroke();}}
    queue.length=0;
  }
  const environment=getDragonGroundScene();
  for(const f of environment)if(f.col==="#e7dac0"||f.col==="#e4d6b9")polygon(f.p,f.col);
  flush(); // The ground is behind every resting vertex, including coplanar claws.
  const solids=[];
  for(const f of environment)if(f.col!=="#e7dac0"&&f.col!=="#e4d6b9")solids.push(f);
  // Far cave walls are a cutaway: the near wall is hidden so it cannot block the view.
  for(let i=0;i<20;i++){
    const a=i/20*6.283,b=(i+1)/20*6.283,mid=(a+b)/2;
    if(Math.sin(mid)*Math.sin(camera.yaw)+Math.cos(mid)*Math.cos(camera.yaw)>.18)continue;
    const r=12,base1=[Math.sin(a)*r,0,Math.cos(a)*r],base2=[Math.sin(b)*r,0,Math.cos(b)*r];
    const top1=[base1[0]*.86,4.5+(i%3)*.5,base1[2]*.86],top2=[base2[0]*.86,4.5+((i+1)%3)*.5,base2[2]*.86];
    solids.push({p:[base1,base2,top2,top1],col:i%2?"#a39e87":"#b0a992"});
    solids.push({p:[top1,top2,[(top1[0]+top2[0])*.49,top1[1]-1.2,(top1[2]+top2[2])*.49]],col:"#bdb69e"});
  }
  // A ground-projected body shadow and denser contact patches move with the camera.
  function shadow(x,z,rx,rz,col){const p=[];for(let i=0;i<24;i++){const a=i/24*6.283;p.push([x+Math.cos(a)*rx,.015,z+Math.sin(a)*rz]);}polygon(p,col);}
  shadow(0,0,mesh.d.body[0]*1.12,mesh.d.body[2]*1.1,"#86795645");
  if(mesh.d.legs){const rows=mesh.d.legs/2;for(let j=0;j<mesh.d.legs;j++){const x=(rows===1?.35:.75-(Math.floor(j/2)/(rows-1))*mesh.d.body[0]*1.45)+.24;shadow(x,(j%2?1:-1)*(mesh.d.body[2]+.27),.3,.23,"#665a3f66");}}
  else shadow(.15,0,mesh.d.body[0]*.82,mesh.d.body[2]*.65,"#665a3f66");
  flush();
  for(const f of solids)polygon(f.p,f.col);
  for(const f of rest.faces){
    const [p,a,b]=f.p,ax=a[0]-p[0],ay=a[1]-p[1],az=a[2]-p[2],bx=b[0]-p[0],by=b[1]-p[1],bz=b[2]-p[2];
    const nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx;
    const light=Math.abs((nx*-.35+ny*.8+nz*.4)/(Math.hypot(nx,ny,nz)||1));
    polygon(f.p,dragonRgb(f.col,f.glow?1.1:.88+light*.08));
  }
  flush();
}
