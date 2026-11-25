const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const {createCanvas}=require('@napi-rs/canvas');
const root=path.join(__dirname,'..'),source=fs.readFileSync(path.join(root,'src/map-art.js'),'utf8');
const core=fs.readFileSync(path.join(root,'src/core.js'),'utf8');
const primitives=core.slice(core.indexOf('const PAPER ='),core.indexOf('/* ── звук'));
const vectorMethods=new Set(['beginPath','moveTo','lineTo','quadraticCurveTo','bezierCurveTo','ellipse','arc','rect','closePath','fill','stroke','clip']);
let allocations=0,offscreenVectors=0;
function context(offscreen=false){
 let depth=0;
 return new Proxy({vectors:0,blits:0,vackyStableSketch:false,save(){depth++},restore(){assert(--depth>=0)},get depth(){return depth}},
  {get(o,k){return k in o?o[k]:(...args)=>{
   for(const a of args)if(typeof a==='number')assert(Number.isFinite(a),k+' has nonfinite coordinate');
   if(vectorMethods.has(k)){o.vectors++;if(offscreen)offscreenVectors++;}
   if(k==='drawImage'){o.blits++;o.lastBlit=args;}
  };},set(o,k,v){o[k]=v;return true}});
}
const g=context(),box={assert,g,document:{createElement(tag){assert.equal(tag,'canvas');allocations++;const ctx=context(true);return {getContext:()=>ctx};}}};
vm.createContext(box);
vm.runInContext('const WORLD=2800;let DPR=1;'+primitives+source,box);
const run=code=>vm.runInContext(code,box);

// A stationary phone viewport and a zoomed-out world both settle after one paint.
for(const bounds of [[1000,1390,1000,1844],[0,2300,0,2300],[0,2800,0,2800],[-700,3400,-500,3700]]){
 box.bounds=bounds;run('drawMapGround(g,...bounds)');
 const firstAllocations=allocations,firstVectors=offscreenVectors;
 for(let frame=0;frame<30;frame++)run('drawMapGround(g,...bounds);assert.equal(g.depth,0)');
 assert.equal(allocations,firstAllocations,'Stationary viewport allocated new terrain canvases');
 assert.equal(offscreenVectors,firstVectors,'Stationary viewport repainted cached terrain');
 run('assert(mapTiles.size<=Math.max(MAP_TILE_LIMIT,Math.ceil(WORLD/MAP_TILE_SIZE)**2))');
}
run('assert.equal(mapTiles.size,121)');
run('drawMapGround(g,1000,1390,1000,1844);assert(mapTiles.size<=64)');
run(`
for(let y=0;y<2800;y+=256)for(let x=0;x<2800;x+=256){drawMapGround(g,x,x+390,y,y+844);assert(mapTiles.size<=64);}
for(const bounds of [[-700,200,-500,150],[2750,3400,2750,3700],[-700,-200,-500,-100],[3000,3500,3000,3700]]){
 drawMapGround(g,...bounds);assert.equal(g.depth,0);assert(mapTiles.size<=64);
}
`);

run(`
const samples=[];
for(const kind of ['rock','bush','tree'])for(const r of [22,34,50]){
 const o={x:1400,y:1300,r,kind,seed:.4,pts:Array.from({length:7},(_,i)=>[Math.cos(i*6.283/7)*r*.9,Math.sin(i*6.283/7)*r*.9])};
 samples.push(o);
 const before=JSON.stringify(o);drawMapProp(g,o);assert.equal(JSON.stringify(o),before);assert.equal(g.depth,0);
}
assert(mapPropArt instanceof WeakMap,'Old maps must not stay strongly retained');
`);
let beforeAllocations=allocations,beforeVectors=offscreenVectors,beforeBlits=g.blits;
g.vectors=0;
run('for(let frame=0;frame<120;frame++)for(const o of samples)drawMapProp(g,o)');
assert.equal(allocations,beforeAllocations,'Warm prop rendering allocated canvases');
assert.equal(offscreenVectors,beforeVectors,'Warm props were repainted');
assert.equal(g.vectors,0,'Warm props issued vector drawing operations');
assert.equal(g.blits-beforeBlits,120*9,'Every visible prop should need exactly one image draw');
run('samples[0].x+=17.25;samples[0].y-=8.5;drawMapProp(g,samples[0])');
assert.equal(allocations,beforeAllocations,'Position changes should reuse local prop art');
run(`{
 const o=samples[0],art=mapPropArt.get(o);
 assert.equal(g.lastBlit[1],o.x-art.offset);assert.equal(g.lastBlit[2],o.y-art.offset);
}`);

// Resize and sketch mode changes repaint once, without changing collision data.
for(const ratio of [2,1.5,1]){
 box.ratio=ratio;beforeAllocations=allocations;
 run(`DPR=ratio;for(const o of samples){
  const before=JSON.stringify(o);drawMapProp(g,o);const art=mapPropArt.get(o);
  assert.equal(art.scale,DPR);assert.equal(art.canvas.width,Math.ceil((o.r*1.4+10)*DPR)*2);
  assert.equal(art.canvas.width/art.size,DPR);assert.equal(JSON.stringify(o),before);
 }`);
 assert.equal(allocations,beforeAllocations+9,'Each prop should rebuild once at the new density');
 beforeAllocations=allocations;beforeVectors=offscreenVectors;
 run('for(let frame=0;frame<10;frame++)for(const o of samples)drawMapProp(g,o)');
 assert.equal(allocations,beforeAllocations);assert.equal(offscreenVectors,beforeVectors);
}
beforeAllocations=allocations;
run('g.vackyStableSketch=true;drawMapProp(g,samples[0]);assert(mapPropArt.get(samples[0]).canvas.getContext("2d").vackyStableSketch);drawMapProp(g,samples[0]);assert(g.vackyStableSketch)');
assert.equal(allocations,beforeAllocations+1,'Sketch mode should repaint once');
beforeAllocations=allocations;
run('samples[0].r+=2;drawMapProp(g,samples[0]);samples[0].seed=.7;drawMapProp(g,samples[0]);samples[0].pts=samples[0].pts.map(p=>p.slice());drawMapProp(g,samples[0])');
assert.equal(allocations,beforeAllocations+3,'Changed prop artwork must not use a stale image');

// Compare actual pixels from cached images against the unchanged vector painter.
// Opaque paper matches battle compositing; transparent pixels check the crop.
const visual={document:{createElement:()=>createCanvas(1,1)}};vm.createContext(visual);
vm.runInContext('const WORLD=2800;let DPR=1;'+primitives+source,visual);
let worstMeanError=0;
for(const ratio of [1,1.5,2])for(const stable of [false,true])for(const kind of ['rock','bush','tree'])for(const radius of [22,34,50]){
 const side=240,reference=createCanvas(side*ratio,side*ratio),cached=createCanvas(side*ratio,side*ratio);
 const direct=reference.getContext('2d'),sprite=cached.getContext('2d');
 for(const ctx of [direct,sprite]){ctx.scale(ratio,ratio);ctx.vackyStableSketch=stable;}
 visual.direct=direct;visual.sprite=sprite;visual.ratio=ratio;
 visual.prop={x:120,y:120,r:radius,kind,seed:.4,pts:Array.from({length:7},(_,i)=>[Math.cos(i*6.283/7)*radius*(i%2?.8:1.12),Math.sin(i*6.283/7)*radius*(i%2?.8:1.12)])};
 vm.runInContext('DPR=ratio;direct.save();direct.translate(prop.x,prop.y);paintMapProp(direct,prop);direct.restore();drawMapProp(sprite,prop)',visual);
 let a=direct.getImageData(0,0,reference.width,reference.height).data,b=sprite.getImageData(0,0,cached.width,cached.height).data;
 for(let i=3;i<a.length;i+=4)if(a[i]>8)assert(b[i]>0,kind+' sprite crop removed visible artwork');
 for(const ctx of [direct,sprite]){ctx.globalCompositeOperation='destination-over';ctx.fillStyle='#f0e6d3';ctx.fillRect(0,0,side,side);}
 a=direct.getImageData(0,0,reference.width,reference.height).data;b=sprite.getImageData(0,0,cached.width,cached.height).data;
 let error=0,largeDifferences=0;
 for(let i=0;i<a.length;i+=4){const difference=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);error+=difference;if(difference>36)largeDifferences++;}
 const pixels=a.length/4,meanError=error/(pixels*3);worstMeanError=Math.max(worstMeanError,meanError);
 assert(meanError<.25,`${kind} DPR ${ratio} changed colors (mean error ${meanError})`);
 assert(largeDifferences<pixels*.003,`${kind} DPR ${ratio} changed the silhouette`);
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),build=fs.readFileSync(path.join(root,'build.js'),'utf8');
assert(html.includes('src/map-art.js'));assert(/["']map-art\.js["']/.test(build));
console.log('PASS: finite balanced map drawing; unchanged collision data; 30 warm ground frames without allocation/repainting, bounded 64–121 tile cache; 120 warm prop frames with zero allocations/vector operations and one blit per prop; DPR/sketch invalidation; 54 native pixel comparisons (worst mean RGB error '+worstMeanError.toFixed(4)+')');
