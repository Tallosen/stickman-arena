const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const box={assert,console};vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/menu-scene.js'),'utf8'),box);
vm.runInContext(`
assert.equal(MENU_COMPANIONS.length,6);
for(const p of MENU_COMPANIONS){
 let min=Infinity,max=-Infinity,stops=0,moves=0;
 for(let t=0;t<60;t+=.025){
  const q=menuCompanionPose(p,t),next=menuCompanionPose(p,t+.025);
  assert(Object.values(q).filter(v=>typeof v==='number').every(Number.isFinite));
  assert(q.x>=p.a-1e-7&&q.x<=p.b+1e-7);assert(q.y>=p.y-p.arc-1e-7&&q.y<=p.y+1e-7);
  assert(Math.abs(q.x-next.x)<3,'Teleport at loop/turn');assert(Math.abs(q.y-next.y)<1);
  if(q.moving)moves++;else stops++;
  if(!q.moving)assert.equal(q.bob,0,'Pet hops while resting');
  if(q.type!=='parrot')assert(Math.hypot((q.x-450)/372,(q.y-465)/109)<.94,'Pet feet outside camp');
  min=Math.min(min,q.x);max=Math.max(max,q.x);
 }
 assert(moves>0&&stops>0);assert(max-min>p.b-p.a-1,'Pet never traverses route');
}
assert(!/setInterval|requestAnimationFrame|setTimeout/.test(${JSON.stringify(fs.readFileSync(path.join(__dirname,'../src/menu-scene.js'),'utf8'))}));
`,box);
console.log('PASS: six bounded routes, visible travel, pauses, continuous turns, feet stay on camp, no extra animation loop');
