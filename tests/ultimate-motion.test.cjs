const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),harness=require('./arena-harness.cjs');
const h=harness();h.box.assert=assert;
h.run(`
for(const [weapon,pool] of Object.entries(EMPOWERED_ULTS))for(const profile of pool)for(const face of [-1,1]){
 reset();running=true;paused=false;enemies=[];P.x=900;P.y=800;P.gear.gun=4;P.wtype=weapon;P.aim=face>0?0:Math.PI;
 ult.forceSignature=profile.id;ult.charge=ULT_FULL;startUlt();let travelled=0,previous=0,maxLift=0,maxRotation=0;const poses=new Set();
 for(let i=0;i<120;i++){
  updateUlt(20);travelled+=Math.abs(ult.stageX-previous);previous=ult.stageX;maxLift=Math.max(maxLift,ult.lift);maxRotation=Math.max(maxRotation,Math.abs(ult.rot));
  assert(ult.trail.length<=4);assert(Number.isFinite(P.aim));
  if(ult.signature){const q=ultPose(),m=empoweredUltMuzzle();assert(Number.isFinite(m.x)&&Number.isFinite(m.y));poses.add(JSON.stringify(q));
   assert(q.squash>=.65&&q.squash<=1.2);assert(Math.abs(ult.stageX)<=145);assert(ult.lift>=0&&ult.lift<150);}
 }
 assert(travelled>110,profile.id+' must have actual body travel');assert(poses.size>25,'Not a static pose');
 if(['salvo','fan','quake','helix','constellation'].includes(profile.id))assert(maxLift>65,'Visible airborne arc');
 if(['rail','quake','helix'].includes(profile.id))assert(maxRotation>6,'Full tumble/roll');
 assert.equal(ult.stageX,0);assert.equal(ult.stageY,0);assert.equal(ult.rot,0);assert.equal(ult.lift,0);assert.equal(ult.trail.length,0);
}
// Motion near map boundaries cannot put the visible root outside the playable map.
for(const x of [24,WORLD-24]){reset();running=true;paused=false;P.x=x;P.y=24;P.wtype='basic';P.gear.gun=4;enemies=[];ult.forceSignature='lance';ult.charge=ULT_FULL;startUlt();
 for(let i=0;i<120;i++){updateUlt(20);assert(P.x+ult.stageX>=24&&P.x+ult.stageX<=WORLD-24);}}
`);
if(process.argv.includes('--frames')){
 const {createCanvas}=require('@napi-rs/canvas');
 const pairs=h.run('Object.entries(EMPOWERED_ULTS).flatMap(([w,p])=>p.map(s=>[w,s.id,s.name]))');
 const demos=pairs.map(([weapon,id])=>{
  const v=harness({native:true,width:400,height:340});v.box.weapon=weapon;v.box.variant=id;
  for(const method of ['translate','rotate','scale','moveTo','lineTo','arc','ellipse','quadraticCurveTo','bezierCurveTo','fillRect','createLinearGradient','createRadialGradient']){
   const original=v.ctx[method].bind(v.ctx);v.ctx[method]=(...args)=>{assert(args.every(a=>typeof a!=='number'||Number.isFinite(a)),id+': non-finite '+method+' '+args);return original(...args);};
  }
  v.run(`reset();running=true;paused=false;props=[];enemies=[];chests=[];pickups=[];P.x=900;P.y=900;P.wtype=weapon;P.gear.gun=4;P.gear.jacket=3;P.gear.helm=4;P.gear.gloves=4;P.gear.boots=4;P.gear.cape=3;
   const visualSettings={shake:false,lowFX:false,reduceFlash:true};
   for(let i=0;i<6;i++){spawn('basic');Object.assign(enemies.at(-1),{x:P.x+120+i%2*60,y:P.y-65+Math.floor(i/2)*65,hp:100000,maxhp:100000});}
   applyGear();spawnT=eliteT=chestT=healT=1e8;P.invT=1e8;ult.forceSignature=variant;ult.charge=ULT_FULL;startUlt();`);return v;
 });
 const dir=path.join(__dirname,'../audit/ultimate-motion-v0180');fs.mkdirSync(dir,{recursive:true});
 for(let frame=0;frame<60;frame++){
  const sheet=createCanvas(1600,680),g=sheet.getContext('2d');
  demos.forEach((v,i)=>{
   v.run('update(40);shake=0;draw();');
   v.ctx.fillStyle='#fff4df';v.ctx.fillRect(0,0,400,23);v.ctx.fillStyle='#554430';v.ctx.font='bold 12px sans-serif';v.ctx.fillText(pairs[i][2],9,16);
   g.drawImage(v.canvas,i%4*400,Math.floor(i/4)*340);
  });
  fs.writeFileSync(path.join(dir,String(frame).padStart(3,'0')+'.png'),sheet.toBuffer('image/png'));
 }
 const crypto=require('crypto'),files=Array.from({length:60},(_,i)=>String(i).padStart(3,'0')+'.png');
 fs.writeFileSync(path.join(dir,'complete.json'),JSON.stringify(files.map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,file))).digest('hex')}))));
}
console.log('PASS: moving roots, expressive poses, airborne arcs, full rolls, mirrored finite transforms, map bounds and clean return');
