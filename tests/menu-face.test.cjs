const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const {createCanvas}=require('@napi-rs/canvas');
const core=fs.readFileSync(path.join(__dirname,'../src/core.js'),'utf8'),hero=fs.readFileSync(path.join(__dirname,'../src/draw-hero.js'),'utf8');
const c=createCanvas(180,180),g=c.getContext('2d');
const box={g,INK:'#2b2620',PAPER:'#f5ecdd',TIER:['#aaa','#6fa66a','#5f91c9','#9879ba','#e9bc43']};vm.createContext(box);
vm.runInContext(core.slice(core.indexOf('function hash('),core.indexOf('let AC =')),box);
vm.runInContext(hero.slice(hero.indexOf('function drawMenuHeroHead('),hero.indexOf('function drawHero(g,')),box);
function render(yaw,helm,blink=0){
 g.resetTransform();g.clearRect(0,0,180,180);g.translate(90,98);g.scale(6,6);g.vackyStableSketch=true;
 vm.runInContext(`drawMenuHeroHead(g,{head:[0,0],yaw:${yaw},blink:${blink}},{helm:${helm}},3,2.2,1.4)`,box);
 const transform=g.getTransform();assert.equal(transform.a,6);assert.equal(transform.e,90);assert.equal(g.globalAlpha,1);
 return c.toBuffer('image/png');
}
for(let i=0;i<=72;i++){
 const yaw=-Math.PI+i*Math.PI/36;
 assert(render(yaw,4).equals(render(yaw,0)),'Helmet disappears with missing run equipment');
 assert(render(yaw,4,0).equals(render(yaw,4,1)),'Facial animation still visible through closed helmet');
}
assert(render(0,4,0).equals(render(0,4,1)),'Face must be completely hidden');
assert(render(Math.PI,1,0).equals(render(Math.PI,1,1)),'Eyes visible on back of head');
assert(!render(-Math.PI/2,1).equals(render(Math.PI/2,1)),'Profiles identical');
console.log('PASS: closed helmet at 73 angles, no-equipment fallback, no visible facial animation, canvas state restored');
