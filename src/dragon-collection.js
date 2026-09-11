"use strict";
// Paper display: existing collectible meshes, no cave, WebGL, residents or collisions.
function drawCollectionNest(g,w,h){
  g.fillStyle="#f5ecdd";g.fillRect(0,0,w,h);
  g.strokeStyle="#c6b99a26";g.lineWidth=1;
  const step=Math.max(24,Math.round(w/12));
  for(let x=0;x<w;x+=step){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}
  for(let y=0;y<h;y+=step){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}
  g.fillStyle="#e6d7b7";g.strokeStyle="#b8a17a";g.lineWidth=Math.max(1,w/400);
  g.beginPath();g.ellipse(w*.5,h*.79,w*.33,h*.09,0,0,Math.PI*2);g.fill();g.stroke();
  g.strokeStyle="#a68e64";
  for(let i=0;i<18;i++){const a=i*2.399,x=w*.5+Math.cos(a)*w*.29,y=h*.79+Math.sin(a)*h*.067;
    g.beginPath();g.moveTo(x-w*.027,y-h*.012);g.lineTo(x+w*.027,y+h*.008);g.stroke();}
  g.strokeStyle="#8d9c71";g.lineWidth=Math.max(1,w/270);
  for(const [x,y] of [[.13,.78],[.86,.81],[.79,.69]]){g.beginPath();g.moveTo(w*x,h*y);g.lineTo(w*(x-.012),h*(y-.03));g.moveTo(w*x,h*y);g.lineTo(w*(x+.015),h*(y-.04));g.stroke();}
}
const COLLECTION_IDLE_PERIOD=4.8;
function collectionMotion(d,time){
  const id=d.id||0,style=(d.family??Math.floor(id/3))%6,p=time/COLLECTION_IDLE_PERIOD*Math.PI*2+id*1.37;
  return {style,breath:Math.sin(p)*.018,tail:Math.sin(p)*(style===2?.28:.14),
    nod:Math.sin(p)*(style===0?.15:style===3?.1:.045),
    look:Math.sin(p)*(style===1?.2:.045),wing:Math.sin(p*2)*(style===4?.23:.085),
    stretch:(1-Math.cos(p))*.5*(style===5?.11:0)};
}
function collectionAnimatedPoint(p,f,d,m){
  let [x,y,z]=p;const body=d.body,by=restingDragonPoint([0,d.height||1.4,0],d)[1];
  // Weight at the floor stays zero: claws keep their world-space contact.
  const support=Math.min(1,Math.max(0,y/.55));
  y+=(m.breath*by+m.stretch*.12)*support;
  if(f.part===2){
    const weight=Math.min(1,Math.max(0,(-x-body[0]*.65)/Math.max(.2,d.tail)));
    z+=Math.sin(weight*2)*m.tail*weight;
  }
  if(f.part===3){
    const px=body[0]*.45,py=by,weight=Math.min(1,Math.max(0,(x-px)/.65));
    const a=m.nod*weight,dx=x-px,dy=y-py;
    x=px+dx*Math.cos(a)-dy*Math.sin(a);y=py+dx*Math.sin(a)+dy*Math.cos(a);
    const yaw=m.look*weight,xx=x-px;x=px+xx*Math.cos(yaw)+z*Math.sin(yaw);z=z*Math.cos(yaw)-xx*Math.sin(yaw);
  }
  if(f.part===1&&f.tag){
    const side=Math.sign(f.tag),layer=Math.abs(f.tag)-1;
    const hinge=restingDragonPoint([.05-layer*.42,(d.height||1.4)+.28-layer*.1,side*.32],d,f.tag);
    const a=(m.wing+m.stretch)*side,dy=y-hinge[1],dz=z-hinge[2];
    y=hinge[1]+dy*Math.cos(a)-dz*Math.sin(a);z=hinge[2]+dy*Math.sin(a)+dz*Math.cos(a);
  }
  return [x,Math.max(0,y),z];
}
function collectionCamera(rest,view,w,h){
  // Lens and world geometry are fixed. Only the camera's eye moves when dollying.
  return dragonOrbitCamera(rest,{yaw:view.yaw,pitch:view.pitch,distance:Math.max(.62,Math.min(2.5,view.distance??1))},w,h);
}
function drawCollectionWorld(g,w,h,rest,camera){
  g.fillStyle="#f5ecdd";g.fillRect(0,0,w,h);
  function line(a,b,col,width=1){
    a=camera.toCamera(a);b=camera.toCamera(b);const near=.15;
    if(a[2]<near&&b[2]<near)return;
    if(a[2]<near||b[2]<near){const t=(near-a[2])/(b[2]-a[2]),p=a.map((n,i)=>n+(b[i]-n)*t);if(a[2]<near)a=p;else b=p;}
    a=camera.project(a);b=camera.project(b);g.beginPath();g.moveTo(...a);g.lineTo(...b);g.strokeStyle=col;g.lineWidth=width;g.stroke();
  }
  function polygon(points,fill,stroke){
    const p=clipDragonNear(points.map(camera.toCamera)).map(camera.project);if(p.length<3)return;
    g.beginPath();p.forEach((v,i)=>i?g.lineTo(...v):g.moveTo(...v));g.closePath();g.fillStyle=fill;g.fill();
    if(stroke){g.strokeStyle=stroke;g.lineWidth=Math.max(1,w/500);g.stroke();}
  }
  const radius=Math.max(2,rest.radius*.9),cx=rest.target[0],rz=radius*.68;
  // Floor marks and props share the dragon's world coordinates, giving visible parallax.
  for(let i=-8;i<=8;i++){
    line([cx+i*radius*.5,0,-radius*4],[cx+i*radius*.5,0,radius*4],"#c6b99a25");
    line([cx-radius*4,0,i*radius*.5],[cx+radius*4,0,i*radius*.5],"#c6b99a25");
  }
  const ring=(rx,ry,y)=>Array.from({length:48},(_,i)=>{const a=i/48*Math.PI*2;return [cx+Math.cos(a)*rx,y,Math.sin(a)*ry];});
  polygon(ring(radius,rz,.005),"#e7d8b7","#ac9469");
  polygon(ring(radius*.91,rz*.8,.007),"#eddfc0","#c4af85");
  for(let i=0;i<28;i++){const a=i*2.399,x=cx+Math.cos(a)*radius*.94,z=Math.sin(a)*rz*.9;
    line([x-radius*.07,.01,z-radius*.026],[x+radius*.05,.01,z+radius*.032],"#ae9468",Math.max(1,w/650));}
  polygon(ring(radius*.48,rz*.4,.012),"#74644724");
  for(const [a,r] of [[.3,1.3],[2.4,1.45],[4.3,1.15]]){
    const x=cx+Math.cos(a)*radius*r,z=Math.sin(a)*radius*r;
    for(let j=-1;j<=1;j++)line([x,0,z],[x+j*.16,.26-Math.abs(j)*.07,z+j*.06],"#8c9a6d",Math.max(1,w/400));
  }
  for(const [x,z] of [[cx-radius*1.18,rz*.4],[cx+radius*.7,-rz*1.5]]){
    polygon([[x-.19,0,z],[x-.12,.22,z-.12],[x+.18,.17,z-.05],[x+.25,0,z+.1]],"#bebda0","#897e63");
  }
}
function drawCollectionDragon(canvas,id,view={yaw:.85,pitch:.35,distance:1},time=0){
  const g=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  const mesh=homeDragonDisplayMesh(id),rest=prepareRestingDragon(mesh),camera=collectionCamera(rest,view,w,h);
  drawCollectionWorld(g,w,h,rest,camera);
  const queue=[],motion=collectionMotion(mesh.d,time);
  for(const f of rest.faces){
    const points=f.p.map(p=>collectionAnimatedPoint(p,f,mesh.d,motion));
    const clipped=clipDragonNear(points.map(camera.toCamera));if(clipped.length<3)continue;
    const [p,a,b]=points,ny=(a[2]-p[2])*(b[0]-p[0])-(a[0]-p[0])*(b[2]-p[2]);
    const light=f.glow?1.04:ny>0?1:.91;
    queue.push({points:clipped.map(camera.project),z:clipped.reduce((s,p)=>s+p[2],0)/clipped.length,col:dragonRgb(f.col,light)});
  }
  queue.sort((a,b)=>b.z-a.z);
  for(const f of queue){g.beginPath();f.points.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fillStyle=f.col;g.fill();}
}
