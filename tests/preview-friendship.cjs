const fs=require('fs'),vm=require('vm'),path=require('path');
const {createCanvas}=require('@napi-rs/canvas');
const box={console,Math,dragonProfile:{personalities:{}}};vm.createContext(box);
for(const file of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),box);
const out=createCanvas(1320,680),g=out.getContext('2d');g.fillStyle='#f5ecdd';g.fillRect(0,0,1320,680);
const panels=[[0,-1,'Подставляет голову'],[51,0,'Благодарный поклон'],[21,1,'Радостный подскок'],[66,4,'Танец доверия'],[0,6,'Обнимает крыльями'],[75,5,'Счастливый хвост']];
panels.forEach(([id,reply,label],i)=>{
 const c=createCanvas(420,300);box.c=c;const t=reply===1?1.55:1.2,care=reply<0?{id,kind:'activity',activity:'ask',t,duration:5.5}:{id,kind:'bond',reply,t,duration:3.4};
 vm.runInContext(`drawCollectionDragon(c,${id},{yaw:.85,pitch:.45,distance:1},${t},${JSON.stringify(care)})`,box);
 const x=10+i%3*440,y=10+Math.floor(i/3)*340;g.drawImage(c,x,y);g.fillStyle='#604d36';g.font='bold 15px Arial';g.fillText(label,x+10,y+323);
});
const dest=path.resolve(__dirname,'../../../preview-friendship-v0115.png');fs.writeFileSync(dest,out.toBuffer('image/png'));console.log(dest);
