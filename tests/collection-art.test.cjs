const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const noop=()=>{};let count=0;
const g=new Proxy({},{get:(o,k)=>o[k]||((...args)=>{count++;for(const n of args)if(typeof n==='number')assert(Number.isFinite(n),k);}),set:(o,k,v)=>(o[k]=v,true)});
const box={console,Math,document:{createElement:()=>({width:0,height:0,getContext:()=>g})}};vm.createContext(box);
for(const f of ['dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f),'utf8'),box);
for(const [w,h] of [[164,112],[280,270],[720,480]])for(let id=0;id<100;id++){
 box.canvas={width:w,height:h,getContext:()=>g};
 vm.runInContext('drawCollectionDragon(canvas,'+id+',{yaw:.85,pitch:.35,distance:1},0)',box);
}
assert(count>10000);
console.log('PASS: 100 collectible meshes on paper nests at 3 sizes, finite coordinates, no WebGL or cave runtime');
