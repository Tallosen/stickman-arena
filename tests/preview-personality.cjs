// Native Canvas visual QA, not a browser screenshot.
const fs=require('fs'),vm=require('vm'),path=require('path');
const {createCanvas}=require('@napi-rs/canvas');
const box={console,Math,dragonProfile:{personalities:{}}};vm.createContext(box);
for(const file of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),box);
const out=createCanvas(1320,660),g=out.getContext('2d');g.fillStyle='#f5ecdd';g.fillRect(0,0,1320,660);
const samples=[[0,'head',6],[0,'belly',5],[0,'tail',1],[66,null,0],[75,null,0],[51,null,0]];
for(let i=0;i<samples.length;i++){
 const [id,zone,reaction]=samples[i],c=createCanvas(420,290);box.c=c;
 const care=zone?JSON.stringify({id,kind:'touch',zone,reaction,t:1.4,duration:3.2}):'null';
 vm.runInContext(`drawCollectionDragon(c,${id},{yaw:.85,pitch:.38,distance:.92,gaze:{x:.7,y:-.3,eyeStrength:1,headStrength:.8}},1.4,${care})`,box);
 const x=10+i%3*440,y=10+Math.floor(i/3)*330;g.drawImage(c,x,y);g.fillStyle='#604d36';g.font='bold 15px Arial';
 g.fillText(zone?{head:'Ласка по голове',belly:'Щекотка',tail:'Касание хвоста'}[zone]:vm.runInContext(`exclusiveDragonSpec(${id}).name`,box),x+10,y+313);
}
const dest=path.resolve(__dirname,'../../../preview-personality-v0112.png');fs.writeFileSync(dest,out.toBuffer('image/png'));console.log(dest);
