const fs=require('fs'),path=require('path'),assert=require('assert');
const h=require('./arena-harness.cjs')({native:true,width:1260,height:900});h.box.assert=assert;
h.run('reset();running=true;paused=false;');
// Audio follows simulation, not render frames, and does not catch up in a burst.
h.run(`{
 let flaps=0;SFX.wings=()=>flaps++;
 startUltDragonAssist(DRAGON_TYPES[1],100);updateBossEncounter(479);assert.equal(flaps,0);
 updateBossEncounter(1);assert.equal(flaps,1);paused=true;updateBossEncounter(1280);assert.equal(flaps,1);
 paused=false;updateBossEncounter(1280);assert.equal(flaps,2,'At most one flap after a large step');
 reset();running=true;paused=false;updateBossEncounter(640);assert.equal(flaps,2,'Reset stops wing cues');
 SFX.wings=()=>{};
}`);
// Mouth origin uses precisely the same transform as both dragon models.
h.run(`
for(const d of DRAGON_TYPES)for(const face of [-1,-.25,.25,1])for(const bank of [-.2,0,.2]){
 const p={x:310,y:220,scale:.72,face,bank},flap=2.37;
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(face,1);ctx.translate(0,dragonFlightMotion(flap).bob);ctx.rotate(bank);ctx.scale(p.scale,p.scale);
 const m=ctx.getTransform(),x=d.id==='diamond'?94:85,y=d.id==='diamond'?-30:-26;
 const mouth=dragonMouthPoint(p,d,flap);assert(Math.abs(mouth.x-(m.a*x+m.c*y+m.e))<.001);assert(Math.abs(mouth.y-(m.b*x+m.d*y+m.f))<.001);ctx.restore();
}
startUltDragonAssist(DRAGON_TYPES[1],100);dragonAssist.x=P.x-400;dragonAssist.y=P.y;
updateBossEncounter(16);assert(dragonAssist.turn>0&&dragonAssist.turn<Math.PI,'Turn must interpolate, not snap');
const saved=JSON.stringify(dragonAssist);paused=true;updateBossEncounter(200);assert.equal(JSON.stringify(dragonAssist),saved);paused=false;
P.x+=200;const oldX=dragonAssist.flyX;updateBossEncounter(16);assert(dragonAssist.flyX>oldX&&dragonAssist.flyX<P.x,'Follow must be damped');
`);
const before=h.run('JSON.stringify({P,dragonAssist,score})');
const paint=age=>h.run(`
ctx.fillStyle='#f3ead5';ctx.fillRect(0,0,1260,900);
for(let i=0;i<7;i++){
 const x=165+(i%3)*420,y=180+Math.floor(i/3)*295;
 const a={type:DRAGON_TYPES[i],age:${age},x:x+170,y:y+90};
 ctx.fillStyle='#695c46';ctx.font='16px system-ui';ctx.fillText(a.type.id,x-100,y-115);
 drawAssistingDragon(ctx,a,{x,y,scale:.7,face:1,bank:.08},${age}-1600);
}
`);
const dir=path.join(__dirname,'..','audit');fs.mkdirSync(dir,{recursive:true});
paint(1820);const first=h.canvas.toBuffer('image/png');fs.writeFileSync(path.join(dir,'dragons-v0163-fire.png'),first);
paint(2120);const second=h.canvas.toBuffer('image/png');fs.writeFileSync(path.join(dir,'dragons-v0163-flight.png'),second);
assert(!first.equals(second),'Animation frames must differ');assert.equal(h.run('JSON.stringify({P,dragonAssist,score})'),before,'Rendering mutated combat');
// No persistent particles, no damage or state changes from drawing, including invalid/expired phases.
h.run(`for(const phase of [-10,0,780,900])drawDragonBreath(ctx,{x:0,y:0},{x:0,y:0},DRAGON_TYPES[0],2000,phase);`);
assert.equal(h.run('JSON.stringify({P,dragonAssist,score})'),before);
console.log('PASS dragon animation: seven models, mouth transforms, smooth following/turn, paused animation, native frames and pure bounded effects');
