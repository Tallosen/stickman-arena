const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');let allocations=0,calls=0;
function context(){let depth=0;return new Proxy({save(){depth++},restore(){assert(--depth>=0)},get depth(){return depth}},
 {get(o,k){return k in o?o[k]:(...args)=>{calls++;for(const a of args)if(typeof a==='number')assert(Number.isFinite(a),k+' has nonfinite coordinate');}},set(o,k,v){o[k]=v;return true}});}
const g=context(),box={assert,g,document:{createElement(){allocations++;const ctx=context();return {getContext:()=>ctx};}}};
vm.createContext(box);
const core=fs.readFileSync(path.join(root,'src/core.js'),'utf8');
vm.runInContext('const WORLD=2800;'+core.slice(core.indexOf('const PAPER ='),core.indexOf('/* ── звук')),box);
vm.runInContext(fs.readFileSync(path.join(root,'src/map-art.js'),'utf8'),box);
vm.runInContext(`
drawMapGround(g,1000,1390,1000,1844);assert.equal(g.depth,0);
`,box);
const first=allocations;vm.runInContext('drawMapGround(g,1000,1390,1000,1844)',box);assert.equal(allocations,first,'Static viewport repaint allocated new tiles');
vm.runInContext(`
for(let y=0;y<2800;y+=256)for(let x=0;x<2800;x+=256){drawMapGround(g,x,x+390,y,y+844);assert(mapTiles.size<=64);}
for(const bounds of [[-700,200,-500,150],[2750,3400,2750,3700],[0,2800,0,2800]])drawMapGround(g,...bounds);
for(const kind of ['rock','bush','tree'])for(const r of [22,34,50]){
 const o={x:1400,y:1300,r,kind,seed:.4,pts:Array.from({length:7},(_,i)=>[Math.cos(i*6.283/7)*r*.9,Math.sin(i*6.283/7)*r*.9])};
 const before=JSON.stringify(o);drawMapProp(g,o);assert.equal(JSON.stringify(o),before);assert.equal(g.depth,0);
}
assert.equal(g.depth,0);assert(mapTiles.size<=64);
`,box);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),build=fs.readFileSync(path.join(root,'build.js'),'utf8');
assert(html.includes('src/map-art.js'));assert(/["']map-art\.js["']/.test(build));
console.log('PASS: finite drawing, balanced context, unchanged collision objects, cached viewport, 64-tile LRU bound, map edges and module wiring');
