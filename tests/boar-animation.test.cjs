const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),make=require('./arena-harness.cjs');
const root=path.join(__dirname,'..'),h=make({native:true,width:1050,height:640});h.box.assert=assert;
h.run(`reset();ctx.vackyStableSketch=true;
 const target={x:200,y:100,r:18,hp:1000},pet={type:'boar',x:20,y:100,chargeTarget:target,fuse:250,boarRun:0,boarStride:0,face:1,lvl:3};
 const before=JSON.stringify(pet),wind=boarAttackPose(pet,0);
 assert(wind.windup&&wind.sy<.9&&wind.y>2);assert.equal(wind.run,0);
 const sprint=boarAttackPose({...pet,fuse:650,boarRun:1,boarStride:2},0);assert(sprint.charge&&sprint.run===1);
 const dive=boarAttackPose({...pet,x:155,fuse:1000,boarRun:1,boarStride:4},0);assert(dive.approach>.8&&dive.headTilt>sprint.headTilt);
 const blocked=boarAttackPose({...pet,fuse:1000,boarRun:0,boarAnim:'brake'},0);assert.equal(blocked.run,0);assert.equal(blocked.approach,0);
 for(const p of [undefined,{menuScene:true,...pet}, {...pet,dead:500},{...pet,recall:100},{}]){
   const rig=boarAttackPose(p,1);assert(!rig.attacking);assert(!rig.windup);assert(Object.values(rig).every(v=>typeof v==='boolean'||Number.isFinite(v)));
 }
 const matrix=JSON.stringify(ctx.getTransform());
 for(const soft of [false,true])for(const low of [false,true])for(const face of [-1,1])for(const fuse of [0,80,240,320,500,800,1500]){
   visualFX=key=>key==='reduceFlash'?soft:key==='lowFX'?low:true;
   drawPet(ctx,150,140,'boar',3,face,1,{...pet,fuse,boarRun:fuse>320?1:0,boarStride:fuse/150});
   drawBoarBlast(ctx,{x:150,y:140,max:130,life:.65,seed:1,boarFace:face,boarHeading:face<0?Math.PI:0});
   assert.equal(JSON.stringify(ctx.getTransform()),matrix,'Rendering restores caller transforms');
 }
 assert.equal(JSON.stringify(pet),before,'Drawing and pose calculation never mutate gameplay');
`);
// Native pixels must change across the windup/gallop/impact, with no white flash in comfort mode.
const hashes=[];
for(const fuse of [40,250,600,930]){
 h.run(`ctx.clearRect(0,0,W,H);ctx.save();ctx.translate(160,170);ctx.scale(4,4);drawPet(ctx,0,0,'boar',3,1,0,{...pet,x:${fuse===930?155:20},fuse:${fuse},boarRun:${fuse>320?1:0},boarStride:${fuse/110}});ctx.restore();`);
 hashes.push(crypto.createHash('sha256').update(h.canvas.toBuffer('image/png')).digest('hex'));
}
assert.equal(new Set(hashes).size,4);
h.run(fs.readFileSync(path.join(root,'src/cards.js'),'utf8'));
h.run(`const icon=document.createElement('canvas');icon.width=40;icon.height=52;
 petIcon('boar',1)(icon.getContext('2d'));
 const rgba=icon.getContext('2d').getImageData(0,0,40,52).data;
 let inkPixels=0;for(let y=0;y<52;y++)for(let x=0;x<40;x++){
   const alpha=rgba[(y*40+x)*4+3];if(alpha>0)inkPixels++;
   if(x===0||x===39||y===0||y===51)assert.equal(alpha,0,'Choice icon must not crop the new silhouette');
 }assert(inkPixels>200);
 const fill=ctx.fill.bind(ctx);let white=0;
 ctx.fill=function(...args){if(this.fillStyle.toLowerCase()==='#fff2c1')white++;return fill(...args);};
 visualFX=()=>false;drawBoarBlast(ctx,{x:150,y:140,max:106,life:.9,seed:1});assert(white>0);
 white=0;visualFX=key=>key==='reduceFlash';drawBoarBlast(ctx,{x:150,y:140,max:106,life:.9,seed:1});assert.equal(white,0);
 ctx.fill=fill;
`);
if(process.argv.includes('--frames')){
 h.run(`ctx.fillStyle=PAPER;ctx.fillRect(0,0,W,H);visualFX=()=>false;
 const panels=[['ЗАМЕТИЛ ЦЕЛЬ',40,0,20,0],['КОПЫТОМ ПО ЗЕМЛЕ',250,0,20,0],['РАЗГОН',620,1,20,2],['БРОСОК ВПЕРЁД',960,1,155,4.8]];
 for(const [i,[label,fuse,run,x,stride]] of panels.entries()){
   const px=130+(i%3)*350,py=205+Math.floor(i/3)*300;
   ctx.save();ctx.translate(px,py);ctx.scale(3.8,3.8);drawPet(ctx,0,0,'boar',3,1,0,{...pet,x,fuse,boarRun:run,boarStride:stride});ctx.restore();
   ctx.font='600 16px system-ui';ctx.fillStyle=INK;ctx.textAlign='center';ctx.fillText(label,px+20,py+68);
 }
 for(let i=0;i<2;i++){
   const px=480+i*350,py=495;ctx.save();ctx.translate(px,py);ctx.scale(1.3,1.3);
   drawBoarBlast(ctx,{x:0,y:0,max:106,life:i===0?.91:.60,seed:1,boarFace:1,boarHeading:0});ctx.restore();
   ctx.font='600 16px system-ui';ctx.fillStyle=INK;ctx.fillText(i===0?'УДАР':'ОБЛАКО ПЫЛИ',px+10,py+78);
 }
 `);
 fs.mkdirSync(path.join(root,'audit'),{recursive:true});fs.writeFileSync(path.join(root,'audit/boar-animation-v0202.png'),h.canvas.toBuffer('image/png'));
}
console.log('PASS: boar windup/charge/dive, stationary obstruction, quiet menu/recall/dead fallback; immutable gameplay; mirrored and comfort rendering; distinct native frames');
