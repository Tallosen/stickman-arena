const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const hero=fs.readFileSync(path.join(__dirname,'../src/draw-hero.js'),'utf8'),scene=fs.readFileSync(path.join(__dirname,'../src/menu-scene.js'),'utf8');
const box={assert};vm.createContext(box);
vm.runInContext(scene,box);
vm.runInContext(hero.slice(hero.indexOf('function menuBootGeometry('),hero.indexOf('function drawHeroBoot(')),box);
vm.runInContext(`
const near=(a,b)=>assert(Math.abs(a-b)<1e-8);
let count=0;
for(let seed=0;seed<4;seed++)for(let t=0;t<160;t+=.04){
 const pose=menuHeroPose(t,seed),next=menuHeroPose(t+.001,seed);
 for(const [foot,knee] of [['lf','kf'],['lb','kb']]){
  for(let level=1;level<=4;level++){
   const b=menuBootGeometry(pose[foot],pose[knee],level,pose.yaw);
   const n=menuBootGeometry(next[foot],next[knee],level,next.yaw);
   const dx=pose[knee][0]-pose[foot][0],dy=pose[knee][1]-pose[foot][1],f=heroBootStyle(level).h/20;
   near((b.cuff[0][0]+b.cuff[1][0])/2,dx*f);
   near((b.cuff[0][1]+b.cuff[1][1])/2,dy*f);
   near((b.cuff[1][0]-b.cuff[0][0])*dx+(b.cuff[1][1]-b.cuff[0][1])*dy,0);
   b.sole.forEach(p=>near(p[1],0));
   b.hull.forEach((p,i)=>p.forEach((v,j)=>{
    assert(Number.isFinite(v));assert(Math.abs(v-n.hull[i][j])<.2,'Boot geometry jumps');
    if(j===1)assert(v<=.001,'Boot below floor');
   }));
   count++;
  }
 }
}
const left=menuBootGeometry([0,0],[0,-20],4,-Math.PI/2),right=menuBootGeometry([0,0],[0,-20],4,Math.PI/2);
near(left.sole[0][0],-right.sole[1][0]);
near(left.sole[1][0],-right.sole[0][0]);
const front=menuBootGeometry([0,0],[0,-20],4,0);
assert(front.sole[1][0]-front.sole[0][0]<11,'Frontal boots are too wide');
assert.deepStrictEqual([1,2,3,4].map(l=>heroBootStyle(l).h),[7,10,13,16],'Keep arena boot heights');
assert.equal(front.plate.length,4,'Arena diamond cuff missing');
near((front.plate[0][0]+front.plate[2][0])/2,(front.plate[1][0]+front.plate[3][0])/2);
near((front.plate[0][1]+front.plate[2][1])/2,(front.plate[1][1]+front.plate[3][1])/2);
`,box);
const {createCanvas}=require('@napi-rs/canvas');
const canvas=createCanvas(200,200),g=canvas.getContext('2d');
box.INK='#2b2620';
box.spoly=(ctx,points,color)=>{ctx.beginPath();ctx.moveTo(...points[0]);points.slice(1).forEach(p=>ctx.lineTo(...p));ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.stroke();};
box.sline=(ctx,x1,y1,x2,y2)=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();};
g.translate(100,160);g.scale(5,5);const before=g.getTransform();
box.drawMenuHeroBoot(g,[0,0],[-8,-18],4,'#e9bc43',2.2,1.4,-Math.PI/2);
assert.deepStrictEqual(g.getTransform(),before);assert.equal(g.globalAlpha,1);
console.log('PASS: four boot tiers across all menu poses, cuffs aligned to shins, flat soles, bounded widths, continuous geometry and canvas state restored');
