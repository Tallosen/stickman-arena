const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),make=require('./arena-harness.cjs');
const h=make({native:true,width:280,height:320});
h.run(`reset();ctx.vackyStableSketch=true;
const shoulderTestGun=drawGunModel,shoulderTestHold=heroWeaponHoldPose;
let shoulderTestPose=null;
drawGunModel=()=>{}; // A weapon must not conceal a detached arm by joining the hands.
heroWeaponHoldPose=(...args)=>{shoulderTestPose=shoulderTestHold(...args);return shoulderTestPose;};
`);
function connectedShoulders(args){
 h.box.shoulderCase=args;
 const points=h.run(`(()=>{
  const {w,level,face,aim,jacket=0,pose=null}=shoulderCase;
  const gear={gun:level,helm:0,jacket,gloves:0,boots:0,cape:0,clip:0,_w:w,_holdWeapon:!pose,_noShadow:true};
  const q={lean:.08,squash:.97,...pose};shoulderTestPose=null;ctx.clearRect(0,0,W,H);
  drawHero(ctx,140,270,face,.5,gear,3,aim,0,q);
  const drawn=shoulderTestPose||q,neck=drawn.neck??-40;
  const project=([x,y])=>[140+3*(Math.cos(q.lean)*x*face-Math.sin(q.lean)*y*q.squash),270+3*(Math.sin(q.lean)*x*face+Math.cos(q.lean)*y*q.squash)];
  return [[0,neck+2],drawn.sf,drawn.sb].filter(Boolean).map(project);
 })()`);
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 const x=Math.floor(Math.min(...xs))-4,y=Math.floor(Math.min(...ys))-4;
 const width=Math.ceil(Math.max(...xs))-x+5,height=Math.ceil(Math.max(...ys))-y+5;
 // Restrict the path to the shoulder area: hands crossing the torso lower down
 // are not a substitute for an attached shoulder.
 const data=h.ctx.getImageData(x,y,width,height).data,mask=new Uint8Array(width*height),queue=[];
 const pointIndex=p=>Math.round(p[1]-y)*width+Math.round(p[0]-x);
 const seed=pointIndex(points[0]);assert(data[seed*4+3]>128,'Torso seed must be drawn');mask[seed]=1;queue.push(seed);
 for(let next=0;next<queue.length;next++){
  const i=queue[next],ix=i%width,iy=Math.floor(i/width);
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
   const nx=ix+dx,ny=iy+dy,j=ny*width+nx;
   if(nx>=0&&nx<width&&ny>=0&&ny<height&&!mask[j]&&data[j*4+3]>128){mask[j]=1;queue.push(j);}
  }
 }
 for(let i=1;i<points.length;i++)assert(mask[pointIndex(points[i])],`Detached ${i===1?'front':'rear'} shoulder: ${JSON.stringify(args)}`);
}
let count=0;
for(const w of ['basic','shotgun','sniper','laser','minigun','dropShotgun','goldSniper'])for(let level=0;level<5;level++)for(const face of [-1,1])for(const aim of [0,.55,1.55,2.31,3.14,3.7,4.71,5.6]){
 connectedShoulders({w,level,face,aim});count++;
}
for(const face of [-1,1])for(const jacket of [1,2,3,4]){
 connectedShoulders({w:'laser',level:0,face,aim:1.3,jacket});
}
for(const face of [-1,1]){
 connectedShoulders({w:'basic',level:0,face,aim:0,pose:{neck:-60,hip:-35,head:[0,-74],sf:[8,-57],ef:[17,-48],af:[18,-36],sb:[-8,-57],eb:[-17,-48],ab:[-18,-36]}});
 connectedShoulders({w:'basic',level:0,face,aim:.48,pose:{neck:-60,hip:-35,head:[0,-74],sb:[-7,-57],eb:[-16,-46],ab:[-14,-34]}});
}
h.run('drawGunModel=shoulderTestGun;heroWeaponHoldPose=shoulderTestHold;');
if(process.argv.includes('--frames')){
 const p=make({native:true,width:1050,height:560});
 p.run(`reset();ctx.vackyStableSketch=true;ctx.fillStyle=PAPER;ctx.fillRect(0,0,W,H);
 ctx.fillStyle=INK;ctx.font='bold 22px system-ui';ctx.fillText('Герой без брони — соединение рук с телом',28,35);
 const cases=[['laser',0,1,1.35],['basic',0,-1,2.31],['sniper',0,1,-.6],['laser',4,1,.9]];
 for(const [i,[w,level,face,aim]]of cases.entries()){
  const gear={gun:level,helm:0,jacket:0,gloves:0,boots:0,cape:0,clip:0,_w:w,_holdWeapon:true};
  const x=130+i*260;
  drawHero(ctx,x,295,face,.5,gear,3.2,aim,0,{lean:0,squash:1});
  drawHero(ctx,x,470,face,.5,gear,1.02,aim,0,{lean:0,squash:1});
  ctx.fillStyle=INK;ctx.font='14px system-ui';ctx.textAlign='center';ctx.fillText(weaponFormName(w,level),x,515);
 }
 `);
 fs.writeFileSync(path.join(__dirname,'../audit/hero-shoulders-v0204.png'),p.canvas.toBuffer('image/png'));
}
console.log('PASS: native pixel paths connect both arms to the torso in '+count+' bare battle poses, clothed heroes and explicit poses');
