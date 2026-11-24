const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const harness=require('./arena-harness.cjs'),h=harness();h.box.assert=assert;
h.run(`
function fixture(weapon,id){reset();running=true;paused=false;props=[];P.wtype=weapon;P.gear.gun=4;P.lvl=30;P.stage=20;
 enemies=[];for(let i=0;i<12;i++){spawn('basic');Object.assign(enemies.at(-1),{x:P.x+60+i*10,y:P.y+(i%3-1)*35,hp:100000,maxhp:100000});}
 ult.forceSignature=id;ult.charge=ULT_FULL;startUlt();}
for(const [weapon,pool] of Object.entries(EMPOWERED_ULTS))for(const s of pool){
 fixture(weapon,s.id);assert.equal(ult.signature.id,s.id);assert.equal(ult.mode,'dragonburst');
 const expected=ult.baseDamage*2.4,targets=ult.signatureTargets.slice(),other=enemies.filter(e=>!targets.includes(e));
 const before=JSON.stringify({t:ult.t,P});paused=true;updateUlt(900);assert.equal(JSON.stringify({t:ult.t,P}),before);paused=false;
 for(let i=0;i<121;i++){updateUlt(20);assert((ult.signatureFX||[]).length<=8);for(const n of [P.aim,ult.rot,ult.lift,ult.stageX])assert(Number.isFinite(n));}
 assert(!ult.on);assert(dragonAssist?.ultimate);assert.equal(ult.signature,null);assert.equal(ult.signatureFX.length,0);
 for(const e of targets)assert(Math.abs(100000-e.hp-expected)<1e-6,s.id+' must damage each target once');for(const e of other)assert.equal(e.hp,100000);
 fixture(weapon,s.id);updateUlt(2400);assert(!ult.on&&dragonAssist?.ultimate,'Large frame must not skip pulses/ally');
 fixture(weapon,s.id);enemies.forEach(e=>e.hp=0);updateUlt(2400);assert(!ult.on,'Removed targets must not block completion');
 reset();running=true;paused=false;P.gear.gun=4;P.wtype=weapon;enemies=[];ult.forceSignature=s.id;ult.charge=ULT_FULL;startUlt();updateUlt(2400);assert(!ult.on);
}
for(const weapon of Object.keys(EMPOWERED_ULTS)){
 reset();running=true;paused=false;P.wtype=weapon;P.gear.gun=4;enemies=[];const seen=[];
 for(let i=0;i<6;i++){ult.charge=ULT_FULL;startUlt();seen.push(ult.signature.id);updateUlt(2400);}
 assert.equal(new Set(seen).size,2);for(let i=1;i<seen.length;i++)assert.notEqual(seen[i],seen[i-1],'No consecutive duplicate');
}
reset();assert.equal(ult.signature,null);assert.equal(ult.forceSignature,null);
`);
// Native canvas contact sheets, not screenshots of a running browser. Render functions must stay pure.
const {createCanvas}=require('@napi-rs/canvas');
const v=harness({native:true,width:500,height:350});v.box.assert=assert;
v.run('const visualSettings={shake:false,reduceFlash:false,lowFX:false};');
const pairs=v.run('Object.entries(EMPOWERED_ULTS).flatMap(([w,p])=>p.map(s=>[w,s.id,s.name,s.beats[0]]))');
const out=path.join(__dirname,'../audit');fs.mkdirSync(out,{recursive:true});
for(const phase of ['charge','fire']){
 const sheet=createCanvas(2000,700),g=sheet.getContext('2d');
 for(let index=0;index<pairs.length;index++){
  const [weapon,id,name,beat]=pairs[index];v.box.weapon=weapon;v.box.variant=id;
  v.run(`reset();running=true;paused=false;props=[];enemies=[];P.x=175;P.y=230;P.wtype=weapon;P.gear.gun=4;P.gear.helm=3;P.gear.armor=3;P.aim=0;
   for(let i=0;i<6;i++){spawn('basic');Object.assign(enemies.at(-1),{x:320+i%2*65,y:150+Math.floor(i/2)*65,hp:10000,maxhp:10000});}
   ult.charge=ULT_FULL;ult.forceSignature=variant;startUlt();`);
  const end=(phase==='charge'?beat*.7:beat+.07)*2400;for(let t=0;t<end;t+=20)v.run('updateUlt(20)');
  const before=v.run('JSON.stringify({P,enemies,ult})');
  v.run(`ctx.fillStyle='#f4ead3';ctx.fillRect(0,0,500,350);ctx.fillStyle='#e2d6b4';ctx.beginPath();ctx.ellipse(P.x,P.y+18,56,16,0,0,7);ctx.fill();
   for(const e of enemies)drawFoe(ctx,e.x,e.y+13,1,0,1,'basic',0);
   ctx.save();ctx.translate(P.x+(ult.stageX||0)-Math.cos(P.aim)*(ult.kick||0)*5,P.y+17+(ult.stageY||0)-(ult.lift||0)-Math.sin(P.aim)*(ult.kick||0)*5);ctx.rotate(ult.rot||0);
   drawHero(ctx,0,0,P.face,0,{...P.gear,_w:P.wtype,_holdWeapon:true},1.42,P.aim,P.muzzle,ultPose(),1.55);ctx.restore();
   drawUltMotionFX(ctx);`);
  assert.equal(v.run('JSON.stringify({P,enemies,ult})'),before,'Draw must not mutate combat');
  v.ctx.fillStyle='#514332';v.ctx.font='bold 17px sans-serif';v.ctx.fillText(weapon+' / '+name,18,28);
  g.drawImage(v.canvas,index%4*500,Math.floor(index/4)*350);
  // Both comfort settings must render without changing damage or state.
  v.run('visualSettings.lowFX=true;visualSettings.reduceFlash=true;drawUltMotionFX(ctx);drawUltScreenFX(ctx);visualSettings.lowFX=false;visualSettings.reduceFlash=false;');
  assert.equal(v.run('JSON.stringify({P,enemies,ult})'),before);
  v.run('P.aim=Math.PI;P.face=-1;drawUltMotionFX(ctx);assert(Number.isFinite(empoweredUltMuzzle().x));assert(Number.isFinite(empoweredUltMuzzle().y));');
 }
 const version=fs.readFileSync(path.join(__dirname,'../src/config.js'),'utf8').match(/VERSION = "([^"]+)"/)[1].replace('.','');
 fs.writeFileSync(path.join(out,'ultimate-v'+version+'-'+phase+'.png'),sheet.toBuffer('image/png'));
}
console.log('PASS: eight empowered choreographies, once-only damage, no-repeat variants, pause/empty/large-frame handling, bounded state and pure native rendering');
