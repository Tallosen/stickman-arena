const assert=require('assert'),h=require('./arena-harness.cjs')();h.box.assert=assert;
h.run(`
for(let run=0;run<80;run++){
 reset();
 const terrain=JSON.stringify(props),events=JSON.stringify(arenaSecrets),layout=JSON.stringify(nightTorches);
 assert(nightTorches.length>=4&&nightTorches.length<=40,'bounded mixed scenery');
 assert.equal(new Set(nightTorches.map(q=>q.kind)).size,4);
 for(const [i,q] of nightTorches.entries()){
  assert(Number.isFinite(q.x+q.y+q.seed+q.radius));
  assert(q.x>85&&q.y>85&&q.x<WORLD-85&&q.y<WORLD-85);
  assert(Math.hypot(q.x-WORLD/2,q.y-WORLD/2)>240,'starting compass remains clear');
  for(const s of arenaSecrets)assert(Math.hypot(q.x-s.x,q.y-s.y)>Math.max(170,s.r+100),'event exclusion includes art footprint');
  for(const p of props)assert(Math.hypot(q.x-p.x,q.y-p.y)>p.r+65,'no trees or rocks inside fire');
  for(const other of nightTorches.slice(i+1))assert(Math.hypot(q.x-other.x,q.y-other.y)>235,'no clutter');
 }
 buildNightScenery();assert.equal(JSON.stringify(nightTorches),layout,'stable within the same map');
 assert.equal(JSON.stringify(props),terrain);assert.equal(JSON.stringify(arenaSecrets),events);
}
// Validate every style in day/dusk/night, with a strict context including gradients.
let depth=0,drawCalls=0;
const check=args=>{for(const a of args)if(typeof a==='number')assert(Number.isFinite(a));};
const g=new Proxy({save(){depth++},restore(){assert(--depth>=0)},createRadialGradient(...a){check(a);return {addColorStop(...stops){check(stops)}};}},
 {get(o,k){return k in o?o[k]:(...a)=>{drawCalls++;check(a)}},set(o,k,v){if(typeof v==='number')assert(Number.isFinite(v));o[k]=v;return true}});
for(const kind of NIGHT_SCENERY_TYPES)for(const amount of [0,.5,1])for(const time of [0,300,10000]){
 t=time;drawNightScenery(g,{kind,x:100,y:100,seed:.33,radius:170},amount);assert.equal(depth,0);
}
nightFade=1;const before=JSON.stringify(nightTorches);drawNightTorches(g,0,WORLD,0,WORLD);drawBossGround(g,0,WORLD,0,WORLD);assert.equal(depth,0);assert.equal(JSON.stringify(nightTorches),before);
drawCalls=0;drawNightTorches(g,-1000,-500,-1000,-500);assert.equal(drawCalls,0,'offscreen props are culled');
console.log('PASS: 80 maps, protected compass and all secrets, terrain clearance, spacing, deterministic placement, four styles, finite balanced rendering and culling');
`);
