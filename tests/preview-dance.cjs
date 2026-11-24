const fs=require('fs'),vm=require('vm'),path=require('path');
const {createCanvas}=require('@napi-rs/canvas');
const box={console,Math,dragonProfile:{personalities:{}}};vm.createContext(box);
for(const file of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),box);
const out=createCanvas(1320,680),g=out.getContext('2d');g.fillStyle='#f5ecdd';g.fillRect(0,0,1320,680);
[[0,'intro','Слушает первые ноты'],[0,'dance','Входит в танец'],[0,'outro','Поклон в завершение'],[75,'dance','Свой танец у водного'],[66,'dance','Танец бронированного'],[21,'outro','Спокойное завершение']].forEach(([id,stage,label],i)=>{
 const c=createCanvas(420,300);box.c=c;vm.runInContext(`{const song=dragonTune(dragonPersonality(${id})),duration=song.step*song.length,t=${JSON.stringify(stage)}==='intro'?song.step:${JSON.stringify(stage)}==='outro'?duration-song.step*2:duration*.42;drawCollectionDragon(c,${id},{yaw:.9,pitch:.35,distance:1},t,{id:${id},kind:'music',t,duration});}`,box);
 const x=10+i%3*440,y=10+Math.floor(i/3)*340;g.drawImage(c,x,y);g.fillStyle='#604d36';g.font='bold 15px Arial';g.fillText(label,x+10,y+323);
});
const dest=path.resolve(__dirname,'../../../preview-dance-v0119.png');fs.writeFileSync(dest,out.toBuffer('image/png'));console.log(dest);
