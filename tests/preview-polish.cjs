// Offline native canvas artwork review; not a browser or phone capture.
const fs=require('fs'),vm=require('vm'),path=require('path'),{performance}=require('perf_hooks');
const {createCanvas}=require('@napi-rs/canvas');
const box={console,Math,dragonProfile:{personalities:{}}};vm.createContext(box);
for(const f of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f),'utf8'),box);
const out=createCanvas(1200,870),g=out.getContext('2d');g.fillStyle='#f5ecdd';g.fillRect(0,0,1200,870);
let elapsed=0;
for(let i=0;i<6;i++){
 const id=[6,0,24,36,15,99][i],c=createCanvas(580,270);box.c=c;
 const t=performance.now();vm.runInContext('drawCollectionDragon(c,'+id+',{yaw:.85,pitch:.35,distance:1.03},.5,{id:'+id+',kind:"touch",reaction:'+i+',t:.5,duration:3.2})',box);elapsed+=performance.now()-t;
 const x=10+(i%2)*600,y=10+Math.floor(i/2)*285;g.drawImage(c,x,y);g.strokeStyle='#927d59';g.strokeRect(x,y,580,270);
}
const dest=path.resolve(__dirname,'../../../preview-pet-polish-v0109.png');fs.writeFileSync(dest,out.toBuffer('image/png'));
console.log(dest);console.log('Native cold draw average ms:',Math.round(elapsed/6));
let started=performance.now();for(let n=0;n<20;n++)vm.runInContext('drawCollectionDragon(c,99,{yaw:.85,pitch:.35,distance:1.03},.5,{id:99,kind:"touch",reaction:0,t:.5,duration:3.2})',box);
console.log('Native warm active average ms:',Math.round((performance.now()-started)/20));
