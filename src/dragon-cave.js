"use strict";
/* A small self-contained, GPU-lit habitat. No libraries, downloads or save writes.
   Persistent rewards stay in dragon-economy; these inhabitants are presentation only. */
const CAVE_SPOTS=[
  {x:-4.4,z:-2.5,kind:"drink",label:"Пьёт у водоёма"},
  {x:4.2,z:-2.3,kind:"eat",label:"Хрустит ягодами"},
  {x:-3.8,z:2.9,kind:"sleep",label:"Дремлет в гнезде"},
  {x:3.7,z:2.8,kind:"play",label:"Играет с мячом"}
];
const caveResidents=new Map();
let caveLastTime=0,caveHits=[],caveHeld=null,cavePickup=null,caveRelease=null,caveGPU=null,caveGPUFailed=false;
let caveRoamView={yaw:.85,pitch:.35,distance:1};
const caveClamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const caveEase=t=>{t=caveClamp(t,0,1);return t*t*(3-2*t);};
// Roaming scale is smaller than inspection; includes animated wings and tails.
const CAVE_PET_CLEARANCE=1.3;
const CAVE_ROAM_SCALE=.32,CAVE_ROAM_RADIUS=.84;
const CAVE_WALK_BOUNDS={left:-8.5,right:8.5,back:-10,front:8};
let caveRosterKey="";
const CAVE_WALK_OBSTACLES=[];
let caveRoomCache=null;
function caveObstacles(){if(!caveRoomCache)buildCaveRoom();return CAVE_WALK_OBSTACLES;}
function cavePathClear(a,b,neighbors=[]){
  if(b.x<CAVE_WALK_BOUNDS.left||b.x>CAVE_WALK_BOUNDS.right||b.z<CAVE_WALK_BOUNDS.back||b.z>CAVE_WALK_BOUNDS.front)return false;
  const dx=b.x-a.x,dz=b.z-a.z,len=dx*dx+dz*dz;
  const clear=(o,r)=>{const t=len?caveClamp(((o.x-a.x)*dx+(o.z-a.z)*dz)/len,0,1):0;return Math.hypot(a.x+dx*t-o.x,a.z+dz*t-o.z)>r;};
  return caveObstacles().every(o=>clear(o,o.r+CAVE_PET_CLEARANCE))&&neighbors.every(o=>clear(o,CAVE_PET_CLEARANCE*2+.06));
}
function cavePlanPath(start,goal,neighbors=[]){
  const clear=(a,b)=>cavePathClear(a,b,neighbors);
  if(clear(start,goal))return [{x:goal.x,z:goal.z}];
  if(!clear(goal,goal))return [];
  // A bounded navigation grid also routes around resting/held neighbours.
  const nodes=[{x:start.x,z:start.z},{x:goal.x,z:goal.z}];
  const grid=new Map(),spacing=.65;
  for(let iz=0;iz<=27;iz++)for(let ix=0;ix<=26;ix++){
    const p={x:-8.5+ix*spacing,z:-10+iz*spacing,ix,iz};
    if(clear(p,p)){grid.set(ix+","+iz,nodes.length);nodes.push(p);}
  }
  const edges=nodes.map(()=>[]);
  for(let i=2;i<nodes.length;i++){
    const p=nodes[i];
    for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++){
      const j=grid.get((p.ix+x)+","+(p.iz+z));if(j>i&&clear(p,nodes[j])){edges[i].push(j);edges[j].push(i);}
    }
    for(let j=0;j<2;j++)if(Math.hypot(p.x-nodes[j].x,p.z-nodes[j].z)<1.5&&clear(nodes[j],p)){edges[i].push(j);edges[j].push(i);}
  }
  const heuristic=p=>Math.hypot(p.x-goal.x,p.z-goal.z);
  const dist=nodes.map(()=>Infinity),prev=nodes.map(()=>-1),done=new Set();dist[0]=0;
  for(let k=0;k<nodes.length;k++){
    let best=-1;for(let i=0;i<nodes.length;i++)if(!done.has(i)&&(best<0||dist[i]+heuristic(nodes[i])<dist[best]+heuristic(nodes[best])))best=i;
    if(best<0||!Number.isFinite(dist[best]))break;if(best===1)break;done.add(best);
    for(const j of edges[best])if(!done.has(j)){
      const d=dist[best]+Math.hypot(nodes[best].x-nodes[j].x,nodes[best].z-nodes[j].z);
      if(d<dist[j]){dist[j]=d;prev[j]=best;}
    }
  }
  if(prev[1]<0)return [];
  const route=[];for(let i=1;i!==0;i=prev[i])route.unshift(nodes[i]);return route;
}
function caveChooseGoal(p,pets){
  const neighbors=pets.filter(q=>q!==p),spot=CAVE_SPOTS[Math.floor(p.step/3)%4],slots=16;
  const candidates=[];
  const free=goal=>cavePathClear(goal,goal,neighbors)&&neighbors.every(q=>!q.goal||Math.hypot(q.goal.x-goal.x,q.goal.z-goal.z)>CAVE_PET_CLEARANCE*2+.4);
  if(p.step%3===2)for(let i=0;i<slots;i++){
    const a=i/slots*Math.PI*2,rr={drink:2.98,eat:2.3,sleep:3.0,play:2.4}[spot.kind];
    const goal={x:spot.x+Math.cos(a)*rr,z:spot.z+Math.sin(a)*rr,kind:spot.kind};
    if(free(goal))candidates.push(goal);
  }
  // Most destinations are open floor, not a shared feeding spot in the centre.
  const wander=[];
  for(let i=0;i<80;i++){
    const n=i+p.seed*19+p.step*31,goal={x:-8.2+((n*0.61803398875)%1)*16.4,z:-9.7+((n*.41421356237)%1)*17.4,kind:"idle"};
    const d=Math.hypot(goal.x-p.x,goal.z-p.z);
    if(d>1.2&&d<10&&free(goal))wander.push(goal);
  }
  for(const goal of [...candidates,...wander].slice(0,14)){
    const path=cavePlanPath(p,goal,neighbors);if(path.length){p.goal=goal;p.path=path;p.stuck=0;return true;}
  }
  return false;
}
function caveResident(id){
  if(caveResidents.has(id))return caveResidents.get(id);
  const seed=typeof id==="number"?id+7:DRAGON_IDS.indexOf(id)+107;
  const a=seed*2.39996,r=1.3+(seed%4)*.68;
  const pet={id,seed,x:Math.cos(a)*r,z:Math.sin(a)*r,yaw:a,phase:seed*1.7,step:seed%4,state:"walk",timer:0,speed:.44+(seed%5)*.04,walk:0,speedNow:0,gait:seed,activity:0,rest:0,goal:null,path:[],stuck:0};
  caveResidents.set(id,pet);return pet;
}
function cavePlaceResidents(ids){
  const key=JSON.stringify(ids),pets=ids.map(caveResident);if(key===caveRosterKey)return pets;
  // Only the visible roster occupies the room; thumbnail previews reserve no space.
  caveRosterKey=key;const placed=[];
  for(const p of pets){
    let best=null,score=-Infinity;
    for(let z=-9.5;z<=5.5;z+=.5)for(let x=-7;x<=7;x+=.5){
      const v={x,z};if(!cavePathClear(v,v,placed))continue;
      const separation=placed.length?Math.min(...placed.map(q=>Math.hypot(x-q.x,z-q.z))):5;
      const rank=Math.min(6,separation)-Math.hypot(x,z+2)*.055+Math.sin(x*2.7+z+p.seed)*.06;
      if(rank>score){score=rank;best=v;}
    }
    if(best){Object.assign(p,best,{goal:null,path:[],state:"walk",speedNow:0,walk:0,rest:0,activity:0,stuck:0,retry:0});}
    placed.push(p);
  }
  return pets;
}
function stepCaveResidents(ids,dt){
  dt=caveClamp(dt,0,.08);
  const pets=cavePlaceResidents(ids);
  for(const p of pets){
    p.phase+=dt;
    if(p.id===caveHeld||p.id===caveRelease?.id){p.walk*=Math.exp(-dt*9);continue;}
    const spot=CAVE_SPOTS[Math.floor(p.step/3)%4],neighbors=pets.filter(q=>q!==p);
    let traveled=0;
    if(p.state!=="walk"){
      p.timer-=dt;p.speedNow=0;
      if(p.state!=="idle"){const angle=Math.atan2(spot.z-p.z,spot.x-p.x),delta=Math.atan2(Math.sin(angle-p.yaw),Math.cos(angle-p.yaw));p.yaw+=caveClamp(delta,-1.8*dt,1.8*dt);}
      if(p.timer<=0){p.step++;p.state="walk";p.goal=null;p.path=[];}
    }else{
      p.retry=Math.max(0,(p.retry||0)-dt);
      if(!p.goal&&!p.retry&&!caveChooseGoal(p,pets)){p.step++;p.speedNow=0;p.retry=.8+(p.seed%4)*.15;}
      if(p.goal){
        const distance=Math.hypot(p.goal.x-p.x,p.goal.z-p.z);
        if(distance<.14){p.state=p.goal.kind;p.timer=p.state==="sleep"?6:p.state==="idle"?.7+(p.seed%3)*.2:3+(p.seed%3);p.speedNow=0;}
        else{
          // Skip only visible waypoints, never the shore/bowl. Destination stays reserved.
          while(p.path.length>1&&cavePathClear(p,p.path[1],neighbors))p.path.shift();
          const target=p.path[0]||p.goal,dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz)||1;
          let vx=dx/d,vz=dz/d,pace=1;
          const angle=Math.atan2(vz,vx),delta=Math.atan2(Math.sin(angle-p.yaw),Math.cos(angle-p.yaw));
          p.yaw+=caveClamp(delta,-2.1*dt,2.1*dt);
          const desired=Math.min(p.speed*pace,Math.sqrt(Math.max(0,distance-.1)*.8))*Math.max(0,Math.cos(delta));
          p.speedNow+=caveClamp(desired-p.speedNow,-.9*dt,.65*dt);
          const move=Math.min(distance,p.speedNow*dt),next={x:p.x+Math.cos(p.yaw)*move,z:p.z+Math.sin(p.yaw)*move};
          if(cavePathClear(p,next,neighbors)){traveled=Math.hypot(next.x-p.x,next.z-p.z);p.x=next.x;p.z=next.z;}else p.speedNow=0;
          p.stuck=traveled<.002?p.stuck+dt:0;
          if(p.stuck>.65+(p.seed%3)*.15){p.step++;p.goal=null;p.path=[];p.stuck=0;p.retry=.12;}
        }
      }
    }
    p.gait+=traveled/.29*Math.PI*2;
    if(p.state!=='walk')p.poseMood=p.state;
    p.walk+=(caveClamp(traveled/(Math.max(dt,.001)*p.speed),0,1)-p.walk)*(1-Math.exp(-dt*9));
    p.activity+=((p.state==='walk'?0:1)-p.activity)*(1-Math.exp(-dt*3));
    p.rest+=((p.state==='sleep'?1:0)-p.rest)*(1-Math.exp(-dt*2.5));
  }
}
function caveVisibleIds(){return homeCatalogIds().slice(homePage*HOME_PAGE_SIZE,(homePage+1)*HOME_PAGE_SIZE);}
function pickUpCaveDragon(id){
  if(!homeCanView(id)||homeHatching)return;
  const alreadyHeld=caveHeld!==null;
  if(!alreadyHeld&&!caveRelease)caveRoamView={...homeView};
  caveHeld=id;caveRelease=null;cavePickup={id,start:performance.now()-(alreadyHeld?720:0),from:{...caveResident(id)},view:{...caveRoamView}};
  homeSelected=id;Object.assign(homeView,{yaw:.85,pitch:.35,distance:1.16});
  homeMessage("");refreshDragonHome();
}
function releaseCaveDragon(){
  if(caveHeld===null)return;
  caveRelease={id:caveHeld,start:performance.now(),to:{...caveResident(caveHeld)},view:{...caveRoamView}};
  caveHeld=null;cavePickup=null;homeMessage("");refreshDragonHome();
}
function resetCaveVisit(){caveHeld=null;cavePickup=null;caveRelease=null;caveLastTime=0;caveHits=[];}

function caveGeometry(captureSolids=false){
  const faces=[],solids=[];
  function capture(start,c){
    if(!captureSolids)return;
    let radius=0,minY=Infinity,maxY=-Infinity;
    for(let i=start;i<faces.length;i++)for(const p of faces[i].p){radius=Math.max(radius,Math.hypot(p[0]-c[0],p[2]-c[2]));minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);}
    // Moss/flat floor paint is walkable; all solid low props block the whole dragon.
    if(minY<1&&maxY>.12&&Math.abs(c[0])-radius<10&&c[2]+radius>-11.5&&c[2]-radius<9.5)
      solids.push({x:c[0],z:c[2],r:radius+.025});
  }
  function tri(a,b,c,col){faces.push({p:[a,b,c],col});}
  function ell(c,r,col,rings=8,sides=16){
    const start=faces.length;
    const p=(i,j)=>{const a=i/rings*Math.PI,b=j/sides*Math.PI*2;return [c[0]+Math.sin(a)*Math.cos(b)*r[0],c[1]+Math.cos(a)*r[1],c[2]+Math.sin(a)*Math.sin(b)*r[2]];};
    for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){if(i)tri(p(i,j),p(i+1,j),p(i,j+1),col);if(i<rings-1)tri(p(i,j+1),p(i+1,j),p(i+1,j+1),col);}
    capture(start,c);
  }
  function ring(c,rx,rz,tube,col){
    const start=faces.length;
    const p=(i,j)=>{const a=i/40*Math.PI*2,b=j/8*Math.PI*2;return [c[0]+Math.cos(a)*(rx+Math.cos(b)*tube),c[1]+Math.sin(b)*tube,c[2]+Math.sin(a)*(rz+Math.cos(b)*tube)];};
    for(let i=0;i<40;i++)for(let j=0;j<8;j++){tri(p(i,j),p(i+1,j),p(i,j+1),col);tri(p(i,j+1),p(i+1,j),p(i+1,j+1),col);}
    capture(start,c);
  }
  function rock(c,r,col,seed=0){
    const start=faces.length;
    // Broad, chipped limestone blocks: no repeated oval/pill silhouettes.
    const sides=10,levels=[[-1,.74],[-.7,1],[.65,.96],[1,.69]];
    const p=(i,j)=>{const a=j/sides*Math.PI*2,cs=Math.cos(a),sn=Math.sin(a),rough=1+.09*Math.sin(j*3.7+seed);
      return [c[0]+Math.sign(cs)*Math.pow(Math.abs(cs),.55)*r[0]*levels[i][1]*rough,
        c[1]+r[1]*(levels[i][0]+.07*Math.sin(j*2.1+seed)),
        c[2]+Math.sign(sn)*Math.pow(Math.abs(sn),.55)*r[2]*levels[i][1]*rough];};
    for(let i=0;i<3;i++)for(let j=0;j<sides;j++){tri(p(i,j),p(i+1,j),p(i,j+1),col);tri(p(i,j+1),p(i+1,j),p(i+1,j+1),col);}
    for(let j=0;j<sides;j++){tri([c[0],c[1]+r[1],c[2]],p(3,j),p(3,j+1),col);tri([c[0],c[1]-r[1],c[2]],p(0,j+1),p(0,j),col);}
    capture(start,c);
  }
  return {faces,tri,ell,ring,rock,solids};
}
const CAVE_CHAMBER={rx:12,rz:21,height:9};
const CAVE_LAMPS=[[-7,2.1,-5.7],[7,2.1,-5.7]];
function caveInteriorNorm(p){return (p[0]/12)**2+(p[2]/21)**2+(p[1]/9)**2;}
function buildCaveShell(){
  const m=caveGeometry(),sides=72,rings=22,col=[121,115,102];
  // One connected interior surface, from the floor all the way to the vaulted roof.
  const p=(i,j)=>{const a=j/sides*Math.PI*2,b=i/rings*Math.PI/2;
    const rough=1+Math.cos(b)*.025*Math.sin(a*7+Math.sin(b*4))+.015*Math.sin(a*11)*Math.cos(b);
    return [12*Math.cos(a)*Math.cos(b)*rough,9*Math.sin(b)-.06,21*Math.sin(a)*Math.cos(b)*rough];};
  for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){
    m.tri(p(i,j),p(i+1,j),p(i,j+1),col);
    if(i<rings-1)m.tri(p(i,j+1),p(i+1,j),p(i+1,j+1),col);
  }
  return m.faces;
}
function buildCaveRoom(){
  if(caveRoomCache)return caveRoomCache;
  const m=caveGeometry(true),sand=[185,166,133],stone=[134,124,104],moss=[86,110,74];
  m.faces.push(...buildCaveShell());
  m.tri([-40,-.035,-40],[40,-.035,40],[40,-.035,-40],sand);m.tri([-40,-.035,-40],[-40,-.035,40],[40,-.035,40],sand);
  // A deep, unlit passage replaces the miniature outdoor entrance.
  m.ell([0,2.05,-18.5],[3,2.5,.26],[37,44,43]);
  for(let i=0;i<13;i++){const a=i/12*Math.PI;
    m.rock([Math.cos(a)*3.12,Math.sin(a)*4.1,-17.1],[.72,.67,1.05],stone,i*3);
  }
  // Offset side recesses, naturally eroded ledges and irregular rubble, not a fence.
  for(const side of [-1,1]){
    m.ell([side*8.1,1.3,-11.5],[1.4,1.7,.55],[52,59,54]);
    m.rock([side*8.7,.7,-7.8],[1.7,.82,2.2],stone,side+7);
    m.rock([side*9.7,2.1,-3.7],[1.45,1.1,2.4],[114,109,97],side+13);
    m.rock([side*8.4,.08,-6.8],[1.3,.09,1.8],moss,side+3);
  }
  // Stalactites grow from the actual ceiling; the middle of the habitat stays clear.
  for(let i=0;i<17;i++){
    const x=Math.sin(i*2.4)*7.5,z=-7-(i%5)*2,roof=9*Math.sqrt(Math.max(.05,1-(x/12)**2-(z/21)**2))-.02;
    const r=.18+(i%3)*.09,tip=[x+.1,roof-.8-(i%4)*.35,z+.12];
    for(let j=0;j<9;j++){const a=j/9*Math.PI*2,b=(j+1)/9*Math.PI*2;
      m.tri([x+Math.cos(a)*r,roof+.15,z+Math.sin(a)*r],tip,[x+Math.cos(b)*r,roof+.15,z+Math.sin(b)*r],[133,125,108]);}
  }
  for(let i=0;i<15;i++){
    const a=i*2.4,x=Math.cos(a)*(7.5+i%2),z=-4+Math.sin(a)*6;
    m.rock([x,.04,z],[.45,.055,.33],moss,i);
    if(i%3===0)m.rock([x+.3,.16,z-.2],[.36,.2,.24],[184,175,149],i+50);
    if(i%2===0){m.ell([x,.22,z],[.07,.24,.07],[216,194,153],5,8);m.ell([x,.45,z],[.25,.14,.24],i%4?[193,117,69]:[214,163,86],6,12);}
  }
  // Two warm braziers anchor the lighting and make this a lived-in shelter.
  for(const [x,y,z] of CAVE_LAMPS){
    m.rock([x,.48,z],[.52,.5,.52],[96,89,74],x+11);
    m.rock([x,1.25,z],[.3,.42,.3],[115,101,76],x+12);
    m.ell([x,1.74,z],[.56,.2,.48],[112,76,45]);
    m.ell([x,1.9,z],[.4,.1,.34],[227,143,62]);
  }
  // Pool, berry bowl, woven bed, ball stand. All are in the same world as the pets.
  m.ell([-4.4,.02,-2.5],[1.45,.13,1.12],[155,180,154]);m.ring([-4.4,.09,-2.5],1.37,1.02,.14,[172,169,136]);
  m.ell([-4.4,.08,-2.5],[1.17,.06,.83],[106,173,170]);
  m.ell([4.2,.17,-2.3],[.84,.24,.68],[166,117,75]);m.ell([4.2,.33,-2.3],[.7,.09,.54],[99,73,51]);
  for(let i=0;i<12;i++)m.ell([4.2+Math.cos(i*2.4)*.48,.38+(i%2)*.08,-2.3+Math.sin(i*2.4)*.34],[.12,.13,.12],i%2?[178,75,65]:[204,151,71],5,8);
  m.ell([-3.8,.025,2.9],[1.5,.09,1.15],[153,159,103]);m.ring([-3.8,.13,2.9],1.4,1.07,.16,[190,155,96]);
  m.ell([-3.8,.09,2.9],[1.2,.1,.87],[212,185,129]);
  // Small habitat details stay beside props, outside the walking lanes.
  for(const [x,z] of [[-5.65,-3.4],[-5.5,-1.55],[5.2,-3.1],[5.45,-1.75]]){
    m.solids.push({x,z,r:.44});
    m.rock([x,.035,z],[.37,.04,.31],[83,107,72],x*3);
    for(let j=0;j<7;j++){
      const a=j*2.4,tip=[x+Math.cos(a)*.38,.22+(j%3)*.12,z+Math.sin(a)*.38],root=[x,.06,z];
      m.tri(root,[x+Math.cos(a+.4)*.18,.24,z+Math.sin(a+.4)*.18],tip,[100,126,78]);
      m.tri(root,tip,[x+Math.cos(a-.4)*.18,.21,z+Math.sin(a-.4)*.18],[80,110,71]);
    }
  }
  for(let j=0;j<18;j++){
    const a=j*2.4,x=-3.8+Math.cos(a)*1.15,z=2.9+Math.sin(a)*.82;
    m.tri([x-.16,.195,z-.025],[x+.19,.2,z+.09],[x+.18,.2,z+.065],[188,153,96]);
  }
  // The toy rolls, so reserve its entire swept area, not just its initial centre.
  m.solids.push({x:3.7,z:2.8,r:.91});
  m.solids.sort((a,b)=>b.r-a.r);
  for(const solid of m.solids)if(!CAVE_WALK_OBSTACLES.some(o=>Math.hypot(o.x-solid.x,o.z-solid.z)+solid.r<=o.r))CAVE_WALK_OBSTACLES.push(solid);
  return caveRoomCache=m.faces;
}

function caveSmoothData(faces){
  const sums=new Map(),keys=[];
  for(const f of faces){
    const [p,a,b]=f.p,u=a.map((v,i)=>v-p[i]),v=b.map((n,i)=>n-p[i]);
    const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const ks=f.p.map(p=>p.map(n=>n.toFixed(4)).join(",")+"/"+f.col.join(",")+"/"+(f.part||0)+"/"+(f.tag||0));keys.push(ks);
    for(const k of ks){const s=sums.get(k)||[0,0,0];s.forEach((v,i)=>s[i]+=n[i]);sums.set(k,s);}
  }
  const data=[];
  faces.forEach((f,j)=>f.p.forEach((p,i)=>{const n=sums.get(keys[j][i]),len=Math.hypot(...n)||1;data.push(...p,...n.map(v=>v/len),...f.col.map(v=>v/255),f.part||0,f.tag||0,f.glow?1:0);}));
  return new Float32Array(data);
}
function createCaveGPU(){
  const canvas=document.createElement("canvas"),gl=canvas.getContext("webgl",{alpha:false,antialias:true,powerPreference:"low-power"});
  if(!gl)throw Error("WebGL недоступен");
  const vs=`precision highp float;
attribute vec3 aPos,aNormal,aColor;attribute float aPart,aTag,aGlow;
uniform vec3 uOffset,uEye,uRight,uUp,uBack,uTarget;uniform float uYaw,uScale,uDistance,uAspect,uTime,uWalk,uMood,uBody,uHeld,uGait,uActivity,uRest;
varying vec3 vColor,vNormal,vWorld;varying float vGlow;
void main(){
 vec3 p=aPos;float gait=uGait;
 if(aPart>=10.0){float phase=gait+mod(aPart,2.0)*3.14159+floor((aPart-10.0)/2.0)*3.14159;float low=clamp(1.0-p.y/max(.3,uBody),0.0,1.0);
 p.x+=sin(phase)*.28*low*uWalk;p.y+=max(0.0,cos(phase))*.19*low*uWalk;}
 if(aPart==2.0)p.z+=sin(uTime*1.8+p.x)*min(1.0,abs(p.x)*.2)*.16;
 if(aPart==3.0){float dip=(uMood==1.0||uMood==2.0)?(.22+.1*sin(uTime*3.0)):uMood==3.0?.22:0.0;p.y-=dip*uActivity*max(0.0,p.x);p.z+=sin(uTime*.9)*.035;}
 if(uMood==4.0){if(aPart==10.0||aPart==11.0)p.x+=max(0.0,sin(uTime*3.0))*.3*uActivity*clamp(1.0-p.y,0.0,1.0);if(aPart==3.0)p.x+=sin(uTime*3.0)*.06*uActivity;}
 if(uBody<0.0)p.z+=sin(gait*.7+p.x)*.07*uWalk;
 if(aTag!=0.0){p.y+=sin(uTime*1.3+abs(aTag))*.05*abs(p.z);p.z*=1.0-.035*(.5+.5*sin(uTime*1.3));}
 p.y*=(1.0+sin(uTime*1.7)*.008)*(1.0-uRest*.18);
 float c=cos(uYaw),s=sin(uYaw);vec3 world=vec3(p.x*c-p.z*s,p.y,p.x*s+p.z*c)*uScale+uOffset;
 vec3 n=vec3(aNormal.x*c-aNormal.z*s,aNormal.y,aNormal.x*s+aNormal.z*c);
 vec3 q=world-uTarget;float depth=uDistance-dot(q,uBack);float focal=2.504;
 gl_Position=vec4(dot(q,uRight)*focal/uAspect,dot(q,uUp)*focal-.08*depth,depth*1.002-.2002,depth);
 vNormal=n;vColor=aColor;vWorld=world;vGlow=aGlow;
}`;
  const fs=`precision mediump float;varying vec3 vColor,vNormal,vWorld;varying float vGlow;uniform float uFlat,uOpacity,uStone;uniform highp vec3 uEye;
float grain(vec3 p){return fract(sin(dot(p,vec3(12.3,34.7,17.1)))*147.3);}
void main(){vec3 n=normalize(vNormal);float light=.75+.25*abs(dot(n,normalize(vec3(-.4,.85,.35))));
 vec3 col=vColor*mix(light,1.0,uFlat);col+=vec3(.06,.036,.012)*max(0.0,1.0-length(vWorld.xz-vec2(0.0,-5.0))/12.0);col+=vGlow*.075;
 if(uStone>.5){float strata=sin(vWorld.y*16.0+sin(vWorld.x*.7)*1.3+sin(vWorld.z*.6));
 float fleck=grain(floor(vWorld*42.0));float seam=smoothstep(.84,.98,strata);
 col*=.98+fleck*.055-seam*.065;col+=vec3(.015,.008,-.005)*sin(vWorld.x*1.8+vWorld.z*.9);
 float l1=1.0/(1.0+dot(vWorld-vec3(-7.0,2.1,-5.7),vWorld-vec3(-7.0,2.1,-5.7))*.055);
 float l2=1.0/(1.0+dot(vWorld-vec3(7.0,2.1,-5.7),vWorld-vec3(7.0,2.1,-5.7))*.055);
 float hearth=l1+l2;col*=.47+.29*abs(n.y)+hearth*.36;
 col+=vec3(.17,.075,.012)*hearth;
 float fog=smoothstep(13.0,35.0,length(vWorld-uEye))*.42;col=mix(col,vec3(.16,.21,.21),fog);
 }
 if(vGlow>.5)col=vColor*1.08;
 gl_FragColor=vec4(col,uOpacity);}`;
  function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  const attributes=["aPos","aNormal","aColor","aPart","aTag","aGlow"].map(k=>gl.getAttribLocation(program,k));
  const uniforms={};for(const n of ["Offset","Yaw","Scale","Distance","Aspect","Time","Walk","Mood","Body","Held","Eye","Right","Up","Back","Target","Flat","Opacity","Stone","Gait","Activity","Rest"])uniforms[n]=gl.getUniformLocation(program,"u"+n);
  function upload(faces){const data=caveSmoothData(faces),buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);return {buffer,count:data.length/12};}
  const meshes=new Map(),room=upload(buildCaveRoom());
  const ball=caveGeometry();ball.ell([0,.33,0],[.34,.34,.34],[199,117,79]);ball.ring([0,.33,0],.31,.31,.035,[233,206,145]);
  const toy=upload(ball.faces),disc=caveGeometry();disc.ell([0,.012,0],[1,.015,.65],[171,156,119],4,24);const shadow=upload(disc.faces);
  const fire=caveGeometry();fire.ell([0,.18,0],[.22,.42,.19],[240,149,60],6,10);fire.ell([0,.05,.13],[.11,.23,.07],[255,225,140],6,10);fire.faces.forEach(f=>f.glow=true);const flame=upload(fire.faces);
  const water=caveGeometry();water.ring([0,0,0],1,.7,.012,[201,228,210]);const ripple=upload(water.faces);
  function mesh(id){if(meshes.has(id))return meshes.get(id);const source=homeDragonDisplayMesh(id),rest=prepareRestingDragon(source),m={...upload(rest.faces),rest,d:source.d};meshes.set(id,m);if(meshes.size>20){const key=meshes.keys().next().value;gl.deleteBuffer(meshes.get(key).buffer);meshes.delete(key);}return m;}
  function draw(m,offset=[0,0,0],yaw=0,scale=1,time=0,walk=0,mood=0,body=1,flat=0,opacity=1,stone=0,gait=0,activity=0,rest=0){
    gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);let off=0;
    [3,3,3,1,1,1].forEach((size,i)=>{if(attributes[i]>=0){gl.enableVertexAttribArray(attributes[i]);gl.vertexAttribPointer(attributes[i],size,gl.FLOAT,false,48,off*4);}off+=size;});
    gl.uniform3fv(uniforms.Offset,offset);for(const [k,v] of Object.entries({Yaw:yaw,Scale:scale,Time:time,Walk:walk,Mood:mood,Body:body,Flat:flat,Opacity:opacity,Stone:stone,Gait:gait,Activity:activity,Rest:rest}))gl.uniform1f(uniforms[k],v);
    gl.drawArrays(gl.TRIANGLES,0,m.count);
  }
  canvas.addEventListener("webglcontextlost",e=>{e.preventDefault();caveGPUFailed=true;homeNeedsPaint=true;});
  canvas.addEventListener("webglcontextrestored",()=>{caveGPU=null;caveGPUFailed=false;homeNeedsPaint=true;});
  return {canvas,gl,uniforms,room,toy,shadow,flame,ripple,mesh,draw};
}
function caveFrameCamera(w,h,view,held){
  const target=held?[0,2.55,0]:[0,1.2,-1.5];
  const yaw=held?(view.yaw??.85):caveClamp(((view.yaw??.85)-.85)*.38,-.48,.48);
  const pitch=held?caveClamp(view.pitch??.35,.12,.7):caveClamp(.16+((view.pitch??.35)-.35)*.2,.12,.28);
  const fit=1.07/Math.sin(Math.min(.76,2*Math.atan(w/h*Math.tan(.38)))/2);
  let distance=held?caveClamp(2.05*fit*(view.distance??1),3.8,8):caveClamp(15*(view.distance??1),10.5,17);
  let camera;
  for(let i=0;i<25;i++){
    camera=dragonOrbitCamera({radius:distance/fit,target},{yaw,pitch,distance:1},w,h);
    if(caveInteriorNorm(camera.eye)<.79)break;distance*=.96;
  }
  return camera;
}
function renderLivingCave(canvas,ids,view,now,reduced=false,previewId=null){
  if(previewId===null)cavePlaceResidents(ids);
  if(!caveGPU&&!caveGPUFailed){try{caveGPU=createCaveGPU();}catch(e){console.warn("Пещера: резервный просмотр",e);caveGPUFailed=true;}}
  if(!caveGPU||caveGPUFailed){
    const id=previewId??caveHeld??ids[0];if(id!==undefined&&id!==null)renderRestingDragon(canvas,homeDragonDisplayMesh(id),view);else drawDragonHangar(canvas.getContext("2d"),canvas.width,canvas.height);return;
  }
  const {gl,uniforms,draw}=caveGPU,w=canvas.width,h=canvas.height,time=reduced?0:now/1000;
  const preview=previewId!==null,heldId=preview?previewId:caveHeld;
  const held=heldId!==null,transition=preview?null:(cavePickup||caveRelease),age=transition?(now-transition.start)/720:1;
  const blend=preview?1:held?(reduced?1:caveEase(age)):caveRelease?(reduced?0:1-caveEase(age)):0;
  const wide=caveFrameCamera(w,h,transition?.view||view,false),close=caveFrameCamera(w,h,view,true);
  // Camera and pet interpolate together, without a teleport at pickup/release.
  let cam=blend===0?wide:blend===1?close:(()=>{
    const target=wide.target.map((v,i)=>v+(close.target[i]-v)*blend),distance=wide.distance+(close.distance-wide.distance)*blend;
    const fit=1.07/Math.sin(Math.min(.76,2*Math.atan(w/h*Math.tan(.38)))/2);
    const yawDelta=Math.atan2(Math.sin(close.yaw-wide.yaw),Math.cos(close.yaw-wide.yaw));
    return dragonOrbitCamera({radius:distance/fit,target},{distance:1,yaw:wide.yaw+yawDelta*blend,pitch:wide.pitch+(close.pitch-wide.pitch)*blend},w,h);
  })();
  // Keep the whole transition inside too, including release after a full orbit.
  for(let i=0;i<25&&caveInteriorNorm(cam.eye)>=.79;i++){
    const fit=1.07/Math.sin(Math.min(.76,2*Math.atan(w/h*Math.tan(.38)))/2);
    cam=dragonOrbitCamera({radius:cam.distance*.96/fit,target:cam.target},{yaw:cam.yaw,pitch:cam.pitch,distance:1},w,h);
  }
  if(caveGPU.canvas.width!==w||caveGPU.canvas.height!==h){caveGPU.canvas.width=w;caveGPU.canvas.height=h;}
  gl.viewport(0,0,w,h);gl.clearColor(.15,.18,.17,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  const sy=Math.sin(cam.yaw),cy=Math.cos(cam.yaw),sp=Math.sin(cam.pitch),cp=Math.cos(cam.pitch);
  gl.uniform3fv(uniforms.Right,[cy,0,-sy]);gl.uniform3fv(uniforms.Up,[-sy*sp,cp,-cy*sp]);gl.uniform3fv(uniforms.Back,[sy*cp,sp,cy*cp]);gl.uniform3fv(uniforms.Target,cam.target);
  gl.uniform3fv(uniforms.Eye,cam.eye);
  gl.uniform1f(uniforms.Distance,cam.distance);gl.uniform1f(uniforms.Aspect,w/h);
  draw(caveGPU.room,[0,0,0],0,1,0,0,0,1,0,1,1);
  for(const [x,y,z] of CAVE_LAMPS)draw(caveGPU.flame,[x,y+Math.sin(time*6+x)*.035,z],Math.sin(time*2+x)*.1,1+Math.sin(time*7+x)*.06);
  gl.depthMask(false);
  for(let i=0;i<2;i++){const t=(time*.23+i*.5)%1;draw(caveGPU.ripple,[-4.4,.155,-2.5],0,.22+t*.88,0,0,0,1,1,Math.sin(t*Math.PI)*.35);}
  gl.depthMask(true);
  const playing=ids.map(caveResident).find(p=>p.state==="play"&&p.id!==caveHeld);
  const ballPhase=playing?time*2:0;
  draw(caveGPU.toy,[3.7+Math.sin(ballPhase)*.5,playing?Math.abs(Math.sin(ballPhase))*.14:0,2.8],ballPhase);
  const hits=[];
  const focusId=heldId??caveRelease?.id;
  const list=preview?[previewId]:[...new Set([...ids,...(focusId!==undefined&&focusId!==null?[focusId]:[])])];
  for(const id of list){
    const p=caveResident(id),m=caveGPU.mesh(id),focus=id===focusId;
    if(!focus&&blend>.99)continue;
    const baseScale=Math.min(CAVE_ROAM_SCALE,CAVE_ROAM_RADIUS/m.rest.radius),s=focus?baseScale+(1.48/m.rest.radius-baseScale)*blend:baseScale;
    const b=focus?blend:0,offset=[p.x*(1-b)-m.rest.target[0]*s*b,(2.12+Math.sin(time*1.8+p.seed)*.065)*b,p.z*(1-b)-m.rest.target[2]*s*b];
    const yaw=p.yaw*(1-b),mood={drink:1,eat:2,sleep:3,play:4}[p.poseMood]||0;
    gl.depthMask(false);
    draw(caveGPU.shadow,[offset[0],.005,offset[2]],yaw,s*m.d.body[0]*1.5,0,0,0,1,1,(1-blend)*.17);
    draw(caveGPU.shadow,[offset[0],.007,offset[2]],yaw,s*m.d.body[0]*1.06,0,0,0,1,1,(1-blend)*.35);
    gl.depthMask(true);
    draw(m,offset,yaw,s,p.phase,p.walk*(1-b),b>.5?0:mood,m.d.legs?(m.d.height||1.4)*.68:-1,0,focus?1:1-blend,0,p.gait,p.activity*(1-b),p.rest*(1-b));
    const center=cam.toCamera([offset[0],offset[1]+.5,offset[2]]),xy=cam.project(center);
    hits.push({id,x:xy[0],y:xy[1],r:Math.max(18,cam.focal*s*m.rest.radius/Math.max(.2,center[2])),depth:center[2]});
  }
  const g=canvas.getContext("2d");g.drawImage(caveGPU.canvas,0,0);
  // Warm vignette without mesh outlines or triangular floor seams.
  const vignette=g.createRadialGradient(w*.5,h*.57,w*.16,w*.5,h*.48,w*.7);vignette.addColorStop(0,"#111b1c00");vignette.addColorStop(1,"#1018198c");g.fillStyle=vignette;g.fillRect(0,0,w,h);
  // Subtle airborne dust adds depth; no captions or screen-filling effect particles.
  if(!reduced)for(let i=0;i<15;i++){
    const p=[Math.sin(i*2.4)*6,.8+((i*.71+time*.07)%3.8),-9+(i%7)*1.5],q=cam.toCamera(p);if(q[2]<.2)continue;
    const xy=cam.project(q);g.fillStyle="#f4d89f45";g.beginPath();g.arc(xy[0],xy[1],Math.min(1.5,cam.focal*.018/q[2]),0,Math.PI*2);g.fill();
  }
  function label(text,x,y,col="#faf1d9"){
    g.font=`600 ${Math.max(10,Math.min(13,w/48))}px system-ui`;g.textAlign="center";const tw=g.measureText(text).width+16;g.fillStyle="#51462dc9";g.beginPath();g.roundRect(x-tw/2,y-15,tw,22,9);g.fill();g.fillStyle=col;g.fillText(text,x,y);
  }
  if(!held&&!caveRelease){
    if(!ids.length)label("Здесь поселятся твои драконы",w/2,h*.48);
    // Water rings and sleep puffs respond to the actual resident state.
    for(const p of ids.map(caveResident))if(p.state==="sleep"||p.state==="drink"){
      const xy=cam.project(cam.toCamera([p.x,1.5,p.z]));g.fillStyle=p.state==="sleep"?"#fff3d4":"#e8ffff";g.font="bold 15px system-ui";g.fillText(p.state==="sleep"?"z Z":"· ◦",xy[0],xy[1]-Math.sin(time)*3);
    }
  }
  if(!preview){caveHits=hits;if(caveRelease&&(age>=1||reduced)){Object.assign(homeView,caveRelease.view);caveRelease=null;homeNeedsPaint=true;}}
}
