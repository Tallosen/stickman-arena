const fs=require('fs'),vm=require('vm'),path=require('path');
const {createCanvas}=require('@napi-rs/canvas');
const box={console,Math,dragonProfile:{personalities:{}}};vm.createContext(box);
for(const file of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),box);
const out=createCanvas(1320,680),g=out.getContext('2d');g.fillStyle='#f5ecdd';g.fillRect(0,0,1320,680);
[[0,.3,'Потянулся к угощению'],[0,1.5,'Ест прямо из миски'],[0,3.7,'Миска опустела'],[0,4.8,'Довольная реакция'],[75,4.8,'Благодарность водного питомца'],[66,4.8,'У каждого свой характер']].forEach(([id,t,label],i)=>{
 const c=createCanvas(420,300);box.c=c;vm.runInContext(`drawCollectionDragon(c,${id},{yaw:.9,pitch:.35,distance:1},${t},{id:${id},kind:'feed',t:${t},duration:5.6})`,box);
 const x=10+i%3*440,y=10+Math.floor(i/3)*340;g.drawImage(c,x,y);g.fillStyle='#604d36';g.font='bold 15px Arial';g.fillText(label,x+10,y+323);
});
const dest=path.resolve(__dirname,'../../../preview-meal-v0118.png');fs.writeFileSync(dest,out.toBuffer('image/png'));console.log(dest);
