const fs=require('fs'),vm=require('vm'),path=require('path');
const {createCanvas}=require('@napi-rs/canvas');
const box={console,Math,dragonProfile:{personalities:{}}};vm.createContext(box);
for(const file of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),box);
const out=createCanvas(1320,680),g=out.getContext('2d');g.fillStyle='#f5ecdd';g.fillRect(0,0,1320,680);
[[0,0,'Смена кормления на музыку'],[0,.16,'Плавный подъём головы'],[0,.32,'Входит в новое движение'],[66,0,'Музыка выключена'],[66,.225,'Мягко завершает движение'],[66,.45,'Вернулся в обычную позу']].forEach(([id,t,label],i)=>{
 const c=createCanvas(420,300);box.c=c;vm.runInContext(`{const d=homeDragonDisplayMesh(${id}).d,base=collectionMotion(d,10),transitionPose=applyCollectionCare(base,{id:${id},kind:'${i<3?'feed':'music'}',t:1.5,duration:8});drawCollectionDragon(c,${id},{yaw:.9,pitch:.35,distance:1},10,{id:${id},kind:'${i<3?'music':'settle'}',t:${t},duration:${i<3?8:.45},transitionPose});}`,box);
 const x=10+i%3*440,y=10+Math.floor(i/3)*340;g.drawImage(c,x,y);g.fillStyle='#604d36';g.font='bold 15px Arial';g.fillText(label,x+10,y+323);
});
const dest=path.resolve(__dirname,'../../../preview-transitions-v0120.png');fs.writeFileSync(dest,out.toBuffer('image/png'));console.log(dest);
