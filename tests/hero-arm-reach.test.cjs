const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),make=require('./arena-harness.cjs');
const root=path.join(__dirname,'..'),h=make();h.box.assert=assert;
h.run(`
reset();
const gap=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
let samples=0,maxStep=0;
for(const w of Object.keys(WEAPONS))for(let level=0;level<5;level++)for(const face of [-1,1])for(const jacket of [0,4]){
 let previous=null;
 for(let step=0;step<=3600;step++){
  const aim=step*Math.PI/1800,gear={_w:w,gun:level,jacket};
  const q=heroWeaponHoldPose(gear,aim,{neck:-40,gunAt:heroRestWeaponAnchor(w,level,jacket,aim,face)},face);
  const label=w+'/'+level+'/'+face+'/'+jacket+'/'+step;
  assert(gap(q.sf,q.af)<=24.000001,'Trigger arm reach: '+label);
  if(w!=='sniper'||level!==0)assert(gap(q.sb,q.ab)<=30.000001,'Support arm reach: '+label);
  for(const p of [q.af,q.ab,q.ef,q.eb])assert(p.every(Number.isFinite),label);
  if(previous)for(const key of ['af','ab','ef','eb']){
   const delta=gap(q[key],previous[key]);maxStep=Math.max(maxStep,delta);
   assert(delta<.5,'Abrupt arm jump: '+label+'/'+key+'/'+delta);
  }
  previous=q;samples++;
 }
}
// A wrist exactly crossing its shoulder cannot swing the elbow around it.
for(const dx of [-.00001,0,.00001]){
 const gear={_w:'basic',gun:4,jacket:0},q=heroWeaponHoldPose(gear,0,{neck:-40,gunAt:[-4+dx,-44.8]},1);
 assert(gap(q.sf,q.ef)<.0001);
}
console.log('Reach and continuous bends:',samples,'poses; largest 0.1-degree step',maxStep.toFixed(4));
`);
const v=make({native:true,width:1280,height:1120});v.box.assert=assert;
v.run(`
reset();ctx.vackyStableSketch=true;
const originalGun=drawGunModel,originalHold=heroWeaponHoldPose;
let matrix=null,held=null;
drawGunModel=(g,...args)=>{matrix=g.getTransform();return originalGun(g,...args);};
heroWeaponHoldPose=(...args)=>{held=originalHold(...args);return held;};
for(const w of Object.keys(WEAPONS))for(let level=0;level<5;level++)for(const face of [-1,1])for(const jacket of [0,4])for(const aim of [0,.6,1.548107,Math.PI/2,2.310816,Math.PI,4.71,5.4]){
 P.x=350;P.y=400;P.wtype=w;P.face=face;P.aim=aim;P.phase=.7;P.run=.8;P.recoilT=85;P.gear={gun:level,jacket,gloves:0,helm:0,boots:2};
 const rc=P.recoilT/170*4,pose={lean:-face*P.run*.055,squash:1+Math.sin(P.phase*2)*.018*P.run};
 drawHero(ctx,P.x-Math.cos(aim)*rc,P.y+17-Math.sin(aim)*rc,face,P.phase,{...P.gear,_w:w,_holdWeapon:true},1.02,aim,0,pose);
 const tip=gunMuzzlePoint(w,level),actual=heroGunTip();
 const x=matrix.a*tip.x+matrix.c*tip.y+matrix.e,y=matrix.b*tip.x+matrix.d*tip.y+matrix.f;
 assert(Math.hypot(x-actual.x,y-actual.y)<.001,'Rendered muzzle and firing origin differ: '+w+'/'+level+'/'+aim);
 // Scripted anchors must bypass rest correction even at steep angles.
 const anchor=[11,-47];drawHero(ctx,350,400,face,0,{...P.gear,_w:w,_holdWeapon:true},1,aim,0,{gunAt:anchor});
 assert.deepEqual(held.gunAt,anchor);
}
drawGunModel=originalGun;heroWeaponHoldPose=originalHold;
ctx.fillStyle=PAPER;ctx.fillRect(0,0,W,H);ctx.fillStyle=INK;ctx.font='bold 23px system-ui';ctx.fillText('Хват оружия — проверка поворотов',30,36);
const cases=[
 ['basic',3,-1,2.31,0],['basic',3,-1,2.31,2],['sniper',0,-1,2.31,0],['sniper',0,1,-1.5,0],
 ['laser',4,1,1.55,0],['laser',4,1,-1.5,2],['sniper',4,1,0,0],['sniper',4,-1,2.5,2],
 ['basic',0,1,1.55,0],['shotgun',4,-1,3.4,2],['minigun',4,-1,2.1,2],['goldSniper',4,1,.7,2]
];
for(const [i,[w,level,face,aim,gloves]]of cases.entries()){
 const x=160+i%4*320,y=240+Math.floor(i/4)*360;
 drawHero(ctx,x,y,face,.7,{gun:level,helm:1,jacket:1,gloves,boots:1,clip:1,_w:w,_holdWeapon:true},2.2,aim,0,{lean:0,squash:1});
 ctx.fillStyle=INK;ctx.font='14px system-ui';ctx.textAlign='center';ctx.fillText(weaponFormName(w,level),x,y+100);
}
`);
if(process.argv.includes('--frames'))fs.writeFileSync(path.join(root,'audit/hero-hands-v0203.png'),v.canvas.toBuffer('image/png'));
console.log('PASS: bounded arm reach, full-circle continuous elbows, native drawn/fired muzzle alignment with run/recoil, explicit pose anchors preserved');
