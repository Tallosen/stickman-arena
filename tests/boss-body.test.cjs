const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),make=require('./arena-harness.cjs');
const h=make({native:true,width:1000,height:840});h.box.assert=assert;
// Check the actual Canvas transform, not only the solver's returned points.
for(const method of ['moveTo','lineTo']){
 const original=h.ctx[method].bind(h.ctx);
 h.ctx[method]=(x,y)=>{
  const m=h.ctx.getTransform();
  if(h.box.painted)h.box.painted.push([m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f]);
  return original(x,y);
 };
}
h.run(`reset();running=true;props=[];enterRunStage(20);const e=stageBoss.enemy;
for(const archetype of BOSS_ARCHETYPES)for(const state of ['chase','windup','dash','shootwindup','recover'])for(const face of [-1,1])for(const attackT of [0,450,1000])for(let frame=0;frame<128;frame++){
 const phase=frame*Math.PI/32;
 e.bossSpec={...e.bossSpec,...archetype};Object.assign(e,{phase,face,attackState:state,attackT,windupDuration:1000,recoveryDuration:1000,castT:state==='recover'?600:0,moveBlend:1});
 const pose=bossActPose(e);assert(Object.values(pose).every(v=>typeof v==='boolean'||Number.isFinite(v)));
 const legs=[-1,1].map(side=>{
  const p=bossLegPose(e,phase,side);
  assert(Math.abs(Math.hypot(p.joint[0]-p.hip[0],p.joint[1]-p.hip[1],p.kneeDepth)-BOSS_LEG_BONE)<1e-8);
  assert(Math.abs(Math.hypot(p.end[0]-p.joint[0],p.end[1]-p.joint[1],p.kneeDepth)-BOSS_LEG_BONE)<1e-8);
  assert(Math.abs(p.joint[0]-(p.hip[0]+p.end[0])/2)<1.3,'no exaggerated sideways knee bend');
  assert(side*(p.joint[0]-p.pelvisX)>1,'knees keep separate lanes');
  assert(side*(p.end[0]-p.pelvisX)>2,'feet never cross');
  assert(p.hip[1]<p.joint[1]&&p.joint[1]<p.end[1],'knees stay between hip and ankle');
  assert(p.end[1]<=2+1e-8,'sole never penetrates ground');
  if(p.plant)assert(Math.abs(p.end[1]-2)<1e-8,'support foot stays grounded during sway');
  const sway=Math.sin(phase*.7)*.1+pose.lean;
  assert(Math.abs(p.hip[0]*face-(side*2.7*face*Math.cos(sway)+12*Math.sin(sway)))<1e-8,'hip attached to torso');
  return p;
 });
 assert(legs.some(p=>p.plant),'at least one supporting foot');
 assert(legs[1].end[0]-legs[0].end[0]>5,'no overlapping soles');
 if(frame===0){
  window.painted=[];drawFoe(ctx,150,210,face,phase,3,e.bossSpec.color,'elite',0,.1,e);
  for(let i=0;i<2;i++){
   const p=legs[i],points=window.painted.slice(i*5,i*5+5),sx=3*(1+.1*.22),sy=3*(1-.1*.16);
   assert(Math.abs(points[2][0]-(150+p.end[0]*face*sx))<1e-5,'painted ankle matches grounded rig');
   assert(Math.abs(points[2][1]-(210+p.end[1]*sy))<1e-5,'torso sway does not rotate painted ankle');
   assert(Math.abs(points[3][1]-points[4][1])<1e-5,'painted sole stays horizontal');
  }
  window.painted=null;
 }
}
e.moveBlend=0;e.attackState='chase';
for(const side of [-1,1])assert(bossLegPose(e,1.8,side).plant,'idle never lifts a foot');
`);
if(process.argv.includes('--frames')){
 h.run(`ctx.fillStyle='#f3e8d0';ctx.fillRect(0,0,W,H);for(let i=0;i<4;i++)for(let j=0;j<5;j++){
 const e=stageBoss.enemy;e.bossSpec={...e.bossSpec,...BOSS_ARCHETYPES[i]};Object.assign(e,{x:120+i*250,y:123+j*166-39,phase:j*1.2+.5,moveBlend:j===0?0:1,face:j%2?-1:1,attackState:['chase','chase','windup','dash','recover'][j],attackT:200,windupDuration:1000,recoveryDuration:1000,castT:j===4?750:0});
 ctx.strokeStyle='#d5c8ad';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(e.x-55,e.y+39+4.6);ctx.lineTo(e.x+55,e.y+39+4.6);ctx.stroke();
 drawFoe(ctx,e.x,e.y+39,e.face,e.phase,2.3,e.bossSpec.color,'elite',0,0,e);ctx.fillStyle='#6a5340';ctx.textAlign='center';ctx.font='12px system-ui';ctx.fillText(e.bossSpec.id+' · '+(j===0?'idle':e.attackState),e.x,e.y+66);}`);
 fs.writeFileSync(path.join(__dirname,'../audit/boss-body-v0188.png'),h.canvas.toBuffer('image/png'));
}
console.log('PASS: four archetypes, five actions, both facings, 128 phases, fixed bones, attached hips, non-crossing knees/feet, grounded soles');
