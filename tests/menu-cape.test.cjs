const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'../src/draw-hero.js'),'utf8');
const box={INK:'#2b2620',TIER:['none','#6fa66a','#5f91c9','#9879ba']};vm.createContext(box);
vm.runInContext(source.slice(source.indexOf('function menuCapeGeometry('),source.indexOf('function menuBackpackFrame(')),box);
const pose={neck:-60,hip:-36,yaw:0};
const cape=(yaw,phase=1,extra={},level=3)=>box.menuCapeGeometry(level,{...pose,yaw,...extra},phase);
const near=(a,b)=>assert(Math.abs(a-b)<1e-8);
for(let level=1;level<=3;level++)for(let i=0;i<=720;i++){
 const yaw=-Math.PI+i*Math.PI/360,a=cape(yaw,1,{},level),n=cape(yaw+1e-5,1,{},level),moved=cape(yaw,1,{neck:pose.neck+4,hip:pose.hip+4},level);
 assert.deepStrictEqual(a,cape(yaw,1,{headYaw:yaw+.8},level),'Head independently twisting cape');
 for(const key of ['outline','trim']){
  const paths=key==='outline'?[a[key]]:a[key],next=key==='outline'?[n[key]]:n[key],shifted=key==='outline'?[moved[key]]:moved[key];
  paths.forEach((p,j)=>p.forEach((cmd,k)=>cmd.slice(1).forEach((v,h)=>{
   assert(Number.isFinite(v));assert(Math.abs(v-next[j][k][h+1])<.001,'Cape snaps through profile');
   near(shifted[j][k][h+1],v+(h%2?4:0));
  })));
 }
}
assert(cape(-Math.PI/2).outline[1][3]>25,'Leftward hero needs cape on right');
assert(cape(Math.PI/2).outline[1][3]<-25,'Rightward hero needs cape on left');
assert(Math.abs(cape(Math.PI/2).outline[3][1]-cape(Math.PI/2).outline[1][3])>8,'Cloth collapses into a flat edge in profile');
assert.equal(cape(0).foreground,false);assert.equal(cape(Math.PI).foreground,true);
assert.deepStrictEqual(cape(.5,1).outline[0],cape(.5,9).outline[0],'Shoulder attachment flaps away');
assert.notDeepStrictEqual(cape(.5,1).outline[1],cape(.5,9).outline[1],'No cloth movement');
const {createCanvas}=require('@napi-rs/canvas');
const canvas=createCanvas(240,300),g=canvas.getContext('2d');
function render(yaw){
 g.resetTransform();g.clearRect(0,0,240,300);g.translate(120,270);g.scale(3,3);
 box.drawMenuCape(g,3,{...pose,yaw},1,2.2,1.4);
 near(g.getTransform().a,3);near(g.getTransform().e,120);near(g.globalAlpha,1);
 return canvas.toBuffer('image/png');
}
assert(!render(-Math.PI/2).equals(render(Math.PI/2)));
assert(render(.5).equals(render(.5)),'Unstable cape rendering');
console.log('PASS: three cape tiers x 721 headings, attachment, independent head, wind, projection continuity, front/back layer and deterministic native rendering');
