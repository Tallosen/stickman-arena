// Actual updatePet + the game renderer, enlarged for inspection. Not a browser capture.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),make=require('./arena-harness.cjs');
const h=make({native:true,width:900,height:380}),root=path.join(__dirname,'..'),dir=path.join(root,'audit/boar-motion-v0202');
fs.mkdirSync(dir,{recursive:true});const manifest=[];
h.run(`reset();running=true;paused=false;props=[];P.x=1000;P.y=1000;P.pet=makePet('boar');
 P.pet.x=850;P.pet.y=1000;P.pet.lvl=3;ctx.vackyStableSketch=true;
 enemies=[{x:1120,y:1000,r:18,kind:'tank',hp:10000,maxhp:10000,phase:0,face:-1,speed:0,kb:0,flash:0}];
 let impact=false;visualFX=()=>false;`);
for(let f=0;f<78;f++){
 h.run(`const delta=1000/30;
  if(!P.pet.dead)updatePet(delta,delta/16.67);
  else for(const b of booms)b.life=Math.max(0,b.life-delta/(b.duration||380));
  ctx.fillStyle=PAPER;ctx.fillRect(0,0,W,H);ctx.save();ctx.translate(100,245);ctx.scale(2.35,2.35);ctx.translate(-850,-1000);
  ctx.strokeStyle='#d9c7a4';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(820,1006);ctx.lineTo(1175,1006);ctx.stroke();
  ctx.save();ctx.translate(1120,1000);ctx.strokeStyle=INK;ctx.lineWidth=2.2;ctx.fillStyle='#c8402c';ctx.beginPath();ctx.ellipse(0,-21,15,22,0,0,7);ctx.fill();ctx.stroke();
  sline(ctx,-7,-1,-10,5);sline(ctx,7,-1,10,5);scircle(ctx,0,-51,9,'#c8402c');ctx.restore();
  for(const b of booms)if(b.life>0)drawBoarBlast(ctx,b);
  if(!P.pet.dead)drawPet(ctx,P.pet.x,P.pet.y,'boar',P.pet.lvl,P.pet.face,P.pet.phase,P.pet);
  ctx.restore();ctx.textAlign='center';ctx.fillStyle=INK;ctx.font='700 24px system-ui';ctx.fillText('КАБАН · АТАКА С РАЗБЕГА',450,55);
  ctx.font='15px system-ui';ctx.fillStyle='#8d7555';ctx.fillText('Подготовка → разгон → бросок → взрыв',450,88);
  ` .replace('const delta=','var delta='));
 const file=String(f).padStart(3,'0')+'.png',buffer=h.canvas.toBuffer('image/png');fs.writeFileSync(path.join(dir,file),buffer);
 manifest.push({file,sha256:crypto.createHash('sha256').update(buffer).digest('hex')});
}
fs.writeFileSync(path.join(dir,'complete.json'),JSON.stringify(manifest,null,2));console.log('Rendered 78 frames of actual boar attack.');
