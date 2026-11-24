const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),make=require('./arena-harness.cjs');
const h=make({native:true,width:1050,height:510});h.box.assert=assert;
h.run(`reset();running=true;props=[];enterRunStage(5);const e=stageBoss.enemy;
e.bossSpec={...e.bossSpec,...BOSS_ARCHETYPES[0]};e.moveBlend=1;
for(const face of [-1,1])for(let i=0;i<80;i++){
 Object.assign(e,{face,phase:i*.1,attackState:'chase'});bossMarks=[];
 const p=bossHammerPose(e),headY=p.grip[1]-21*Math.cos(p.angle);
 assert(headY<p.grip[1]-18,'Carried hammer head must be above the gripping hand');
 assert(p.grip[0]-(-21)*Math.sin(p.angle)<-18,'Head stays beside the helmet, not across the face');
 assert(Math.hypot(p.grip[0]+4,p.grip[1]+24)<18.4,'Hand can reach the haft without stretching');
}
for(const delay of [800,1000,1250]){
 const mark={owner:e,age:0,delay,life:delay+350};bossMarks=[mark];
 const initial=bossHammerPose(e);mark.age=delay*.72;const raised=bossHammerPose(e);
 assert(raised.grip[1]<initial.grip[1]-10);
 mark.age=delay;const impact=bossHammerPose(e);
 assert(impact.angle<raised.angle-1.5,'Hammer swings down at the real damage time');
 for(let age=0;age<=delay+350;age+=5){
  mark.age=age;const a=bossHammerPose(e);mark.age=age+.01;const b=bossHammerPose(e);
  assert([...a.grip,a.angle].every(Number.isFinite));
  assert(Math.hypot(a.grip[0]+4,a.grip[1]+24)<18.4);
  assert(Math.hypot(a.grip[0]-b.grip[0],a.grip[1]-b.grip[1])<.01,'No snapping between windup/impact/recovery');
 }
 mark.age=delay+350;const restored=bossHammerPose(e);assert(Math.abs(restored.angle+.4)<1e-9);assert.equal(restored.grip[1],-25);
 const before=JSON.stringify({P,bossMarks,e});bossHammerPose(e);assert.equal(JSON.stringify({P,bossMarks,e}),before,'Drawing never advances combat timers');
}
bossMarks=[];e.windupDuration=1000;e.attackState='windup';e.attackT=0;const ready=bossHammerPose(e);
e.attackState='dash';e.attackT=600;assert.deepEqual(bossHammerPose(e),ready,'Dash starts in the prepared grip');
`);
if(process.argv.includes('--frames')){
 h.run(`ctx.fillStyle='#f3e8d0';ctx.fillRect(0,0,W,H);
 for(let row=0;row<2;row++)for(let i=0;i<5;i++){
  Object.assign(e,{face:row?-1:1,phase:0,moveBlend:0,attackState:'recover',attackT:600,recoveryDuration:1000,windupDuration:1000,castT:0,entryAge:0});
  bossMarks=i===0?[]:[{owner:e,age:[0,720,900,1000,1350][i],delay:1000,life:1350}];
  const x=105+i*210,y=203+row*228;
  drawFoe(ctx,x,y,e.face,0,2.9,e.bossSpec.color,'elite',0,0,e);
  ctx.fillStyle='#6a5340';ctx.font='13px system-ui';ctx.textAlign='center';ctx.fillText(['Carry','Windup','Swing','Impact','Recovered'][i],x,y+25);
 }`);
 fs.writeFileSync(path.join(__dirname,'../audit/boss-hammer-v0192.png'),h.canvas.toBuffer('image/png'));
}
console.log('PASS: upright carry, reachable grip, both facings, real impact timing, continuous windup/recovery and read-only pose');
