const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const {createCanvas}=require('@napi-rs/canvas');
const root=path.join(__dirname,'..'),box={console,assert,Math,dragonProfile:{personalities:{}}};vm.createContext(box);
for(const f of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(root,'src',f),'utf8'),box);
const run=s=>vm.runInContext(s,box);
// Crossing faces must use per-pixel depth, independent of submission order.
box.c=createCanvas(40,40);
run(`const g=c.getContext('2d');
const a={points:[[2,2],[37,2],[2,37]],depths:[.2,.8,.2],lights:[1,1,1],rgb:[255,0,0]};
const b={points:[[2,2],[37,2],[2,37]],depths:[.5,.5,.5],lights:[1,1,1],rgb:[0,0,255]};
g.clearRect(0,0,40,40);let r=collectionRaster(g,40,40);paintCollectionFace(g,a,r);paintCollectionFace(g,b,r);
const first=Array.from(r.image.data);g.clearRect(0,0,40,40);r=collectionRaster(g,40,40);paintCollectionFace(g,b,r);paintCollectionFace(g,a,r);
assert.deepEqual(Array.from(r.image.data),first);
assert.equal(r.image.data[(5*40+5)*4+2],255);assert.equal(r.image.data[(4*40+30)*4],255);
// Two triangles cover the shared diagonal with fully opaque pixels, no white seams.
g.clearRect(0,0,40,40);r=collectionRaster(g,40,40);
for(const points of [[[2,2],[37,2],[2,37]],[[37,2],[37,37],[2,37]]])paintCollectionFace(g,{points,z:2,rgb:[70,140,100]},r);
for(let y=3;y<36;y++)for(let x=3;x<36;x++)assert.equal(r.image.data[(y*40+x)*4+3],255);
const rest=prepareRestingDragon(buildExclusiveDragon(0)),topology=collectionTopology(rest);
assert(topology.vertices.some(v=>v.light>.95));assert(topology.vertices.some(v=>v.light<.85));
for(let reaction=0;reaction<8;reaction++)for(let t=0;t<=3.2;t+=.04){
const m=applyCollectionCare(collectionMotion(buildExclusiveDragon(0).d,t),{id:0,kind:'touch',reaction,t,duration:3.2});
assert(Object.values(m).every(Number.isFinite),'Invalid pose '+reaction);
assert((m.hop||0)>=0&&(m.hop||0)<1);assert((m.squash||0)>-.3);
}
assert(applyCollectionCare(collectionMotion(buildExclusiveDragon(0).d,.5),{id:0,kind:'touch',reaction:0,t:.5,duration:3.2}).hop>.6);
`);
const source=fs.readFileSync(path.join(root,'src/dragon-collection.js'),'utf8');assert(!source.includes('#c6b99a25'));assert(!source.includes('#c6b99a26'));
Object.assign(box,{dragonHomeOpen:()=>true,homeTab:'warehouse',caveHeld:0,homeCanView:()=>true,homeAnimTime:0,homeThumbSlots:[],wakeDragonHome(){}});
run(`const reactions=new Set();for(let i=0;i<8;i++){homeAnimTime=i;assert(touchHomeDragon());reactions.add(homeCareFor(0).reaction);assert(!touchHomeDragon(),'Rapid taps restart reaction');}assert.equal(reactions.size,8);`);
console.log('PASS: depth-correct crossing surfaces, opaque shared edges, smooth lighting, eight finite staged reactions, visible jump and no floor grid');
