const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const box={assert,console};vm.createContext(box);
const source=fs.readFileSync(path.join(__dirname,'../src/menu-scene.js'),'utf8');
vm.runInContext(source,box);
assert(!source.includes('g.scale(hero.turn'),'Turning must not flatten the hero');
vm.runInContext(`
const activities=new Set();
for(let seed=0;seed<10;seed++){
 for(let t=0;t<160;t+=.02){
  const a=menuHeroPose(t,seed),b=menuHeroPose(t+.001,seed);
  assert.deepStrictEqual(a,menuHeroPose(t,seed),'Pose depends on previous frames');
  activities.add(a.activity);
  const length=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
  for(const [foot,knee,root] of [['lf','kf','hf'],['lb','kb','hb']]){
   assert(length(a[root],a[knee])<=18+1e-8,'Projected thigh stretched');
   assert(length(a[knee],a[foot])<=20+1e-8,'Projected shin stretched');
   assert(a.y+a[foot][1]*3<=440.001,'Foot below ground');
   if(a.activity!=='walk')assert(Math.abs(a.y+a[foot][1]*3-440)<1e-7,'Foot slides vertically during sitting transition');
  }
  for(const [hand,elbow,shoulder] of [['af','ef','sf'],['ab','eb','sb']]){
   assert(Math.abs(length(a[shoulder],a[elbow])-12)<1e-8,'Upper arm stretched');
   assert(Math.abs(length(a[elbow],a[hand])-13)<1e-8,'Forearm stretched');
  }
  assert(a.af[0]>12&&a.ab[0]<-12,'Hands cross the body');
  assert.equal(a.sf[0]-a.sb[0],16,'Shoulders joined at one point');
  assert(a.neck-a.head[1]>12,'No visible neck');
  for(const key of Object.keys(a)){
   if(typeof a[key]==='string')continue;
   const aa=Array.isArray(a[key])?a[key]:[a[key]],bb=Array.isArray(b[key])?b[key]:[b[key]];
   aa.forEach((v,i)=>{assert(Number.isFinite(v));assert(Math.abs(v-bb[i])<.3,'Discontinuous '+key+' at '+t);});
  }
 }
}
for(const name of ['sit','stand','turn','walk','wave','stretch','look','gear','knock','watchPet','sitDown','noticeCat','crouch','sitWithCat','rise','stepBack'])assert(activities.has(name),name);
for(let i=0;i<=360;i++){
 const yaw=i*Math.PI/180,q={hip:-36,lf:[9,-2],lb:[-8,0],turn:1},legs=menuLegRig(q,yaw,true);
 const length=(a,b)=>Math.hypot(...a.map((x,j)=>x-b[j]));
 for(const leg of legs){
  assert(Math.abs(length(leg.hip,leg.knee)-18)<1e-8);
  assert(Math.abs(length(leg.knee,leg.foot)-20)<1e-8);
 }
}
const frontLegs=menuLegRig({hip:-36,lf:[6,0],lb:[-6,0],turn:1},0);
assert(frontLegs[0].root[0]>5&&frontLegs[1].root[0]<-5,'Separate hips required');
frontLegs.forEach(leg=>assert(Math.abs(leg.joint[0]-leg.root[0])<1e-8,'Frontal knees must not bend sideways'));
const sideLegs=menuLegRig({hip:-36,lf:[6,0],lb:[-6,0],turn:1},Math.PI/2);
assert(sideLegs[0].joint[0]>sideLegs[0].root[0]+4,'Profile knees must bend forward');
let peak=0;
for(let t=120;t<160;t+=.01){const p=menuHeroPose(t,1);peak=Math.max(peak,p.tap);assert(p.depth>=0&&p.depth<=1);if(p.tap>0)assert.equal(p.depth,1,'Knock before approaching');}
assert(peak>.98,'No visible tap');
`,box);
// Test the actual drawing helpers without booting the entire game.
const core=fs.readFileSync(path.join(__dirname,'../src/core.js'),'utf8');
const start=core.indexOf('function sline('),end=core.indexOf('\nfunction ',core.indexOf('function scircle(')+10);
assert(start>=0&&end>start);
vm.runInContext('const hypot=Math.hypot;const hash=(x,y)=>Math.sin(x*12.9898+y*78.233)*43758.5453%1;'+core.slice(start,end),box);
vm.runInContext(`
const operations=[];
const g={vackyStableSketch:true,beginPath(){},moveTo(...v){operations.push(v)},quadraticCurveTo(...v){operations.push(v)},lineTo(...v){operations.push(v)},stroke(){},ellipse(...v){operations.push(v)}};
scircle(g,1,2,10);const a=operations.pop();scircle(g,1.001,2.001,10);const b=operations.pop();
assert.deepStrictEqual(a.slice(2),b.slice(2),'Head contour changes while breathing');
operations.length=0;sline(g,1,2,10,20);const line=operations.map(v=>v.slice());
operations.length=0;sline(g,1.001,2.001,10.001,20.001);
operations.forEach((v,i)=>v.forEach((n,j)=>assert(Math.abs(n-line[i][j]-.001)<1e-8)));
operations.length=0;sline(g,0,0,0,0);assert.equal(operations.length,0);
`,box);
console.log('PASS: all activities, continuous poses over 10 seeds x 160 seconds, rigid limbs, stable moving contours');
