// Native Canvas artwork preview; not a browser/mobile performance check.
const fs=require('fs'),vm=require('vm'),path=require('path');
const {createCanvas}=require('@napi-rs/canvas');
const box={console,Math,dragonProfile:{personalities:{}}};vm.createContext(box);
for(const file of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),box);
if(process.argv.includes('--all')){
 for(let page=0;page<4;page++){
  const sheet=createCanvas(1600,1150),ctx=sheet.getContext('2d');ctx.fillStyle='#f5ecdd';ctx.fillRect(0,0,1600,1150);
  for(let slot=0;slot<25;slot++){
   const id=page*25+slot,c=createCanvas(320,205);box.c=c;const kind=id%2?'feed':'touch';
   vm.runInContext(`drawCollectionDragon(c,${id},{yaw:${id%3===0?-.85:.85},pitch:.38,distance:1.04},1.5,{id:${id},kind:'${kind}',t:1.5,reaction:${id%8},duration:4})`,box);
   const x=slot%5*320,y=Math.floor(slot/5)*230;ctx.drawImage(c,x,y);ctx.fillStyle='#604d36';ctx.font='13px Arial';ctx.fillText('#'+id+' '+vm.runInContext(`exclusiveDragonSpec(${id}).name`,box),x+8,y+222);
  }
  const dest=path.resolve(__dirname,'../../../preview-rig-all-v0111-'+page+'.png');fs.writeFileSync(dest,sheet.toBuffer('image/png'));console.log(dest);
 }
 process.exit(0);
}
const out=createCanvas(1200,1140),g=out.getContext('2d');g.fillStyle='#f5ecdd';g.fillRect(0,0,1200,1140);
const samples=[[82,'touch',1.6,3],[82,'feed',1.5,0],[51,'touch',1.4,6],[51,'feed',1.5,0],[12,'feed',1.5,0],[60,'touch',1.4,5]];
for(let i=0;i<samples.length;i++){
 const [id,kind,t,reaction]=samples[i],c=createCanvas(580,340);box.c=c;
 vm.runInContext(`drawCollectionDragon(c,${id},{yaw:.85,pitch:.38,distance:1.06},${t},{id:${id},kind:'${kind}',t:${t},reaction:${reaction},duration:3.6})`,box);
 const x=10+i%2*600,y=10+Math.floor(i/2)*380;g.drawImage(c,x,y);g.fillStyle='#604d36';g.font='bold 16px Arial';g.fillText(vm.runInContext(`exclusiveDragonSpec(${id}).name`,box)+' · '+kind,x+12,y+362);
}
const dest=path.resolve(__dirname,'../../../preview-rig-v0111.png');fs.writeFileSync(dest,out.toBuffer('image/png'));console.log(dest);
