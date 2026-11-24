const fs=require('fs'),vm=require('vm'),path=require('path');
const {createCanvas}=require('@napi-rs/canvas');
const box={console,Math,dragonProfile:{personalities:{}}};vm.createContext(box);
for(const file of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),box);
const out=createCanvas(1200,860),g=out.getContext('2d');g.fillStyle='#f5ecdd';g.fillRect(0,0,1200,860);
for(const [i,id,yaw,kind] of [[0,12,.85,'idle'],[1,12,-.85,'touch'],[2,42,.85,'idle'],[3,60,.85,'sleep']]){
 const c=createCanvas(580,390);box.c=c;const care=kind==='touch'?{id,kind:'touch',reaction:6,t:1.6,duration:3.2}:kind==='sleep'?{id,kind:'activity',activity:'sleep',t:2,duration:6}:null;
 vm.runInContext(`drawCollectionDragon(c,${id},{yaw:${yaw},pitch:.32,distance:.82},1.6,${JSON.stringify(care)})`,box);
 const x=10+i%2*600,y=10+Math.floor(i/2)*430;g.drawImage(c,x,y);g.fillStyle='#604d36';g.font='bold 16px Arial';g.fillText(vm.runInContext(`exclusiveDragonSpec(${id}).name`,box)+' · '+kind,x+12,y+414);
}
const dest=path.resolve(__dirname,'../../../preview-legs-v0114.png');fs.writeFileSync(dest,out.toBuffer('image/png'));console.log(dest);
