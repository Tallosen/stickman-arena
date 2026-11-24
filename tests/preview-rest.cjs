const fs=require('fs'),vm=require('vm'),path=require('path');
const {createCanvas}=require('@napi-rs/canvas');
const box={console,Math,dragonProfile:{personalities:{}}};vm.createContext(box);
for(const file of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),box);
const out=createCanvas(1320,680),g=out.getContext('2d');g.fillStyle='#f5ecdd';g.fillRect(0,0,1320,680);
[[0,.65,false,'Зевает перед отдыхом'],[0,2.5,false,'Спокойный сон'],[0,.5,true,'Сонно просыпается'],[0,1.5,true,'Потягивается'],[75,2.5,false,'Отдых водного питомца'],[66,2.5,false,'Устроился на лежанке']].forEach(([id,t,wake,label],i)=>{
 const c=createCanvas(420,300);box.c=c;
 vm.runInContext(`{
 const d=homeDragonDisplayMesh(${id}).d,fromPose=applyCollectionCare(collectionMotion(d,10),{id:${id},kind:'activity',activity:'sleep',t:2.5,duration:6});
 const care=${wake}?{id:${id},kind:'wake',fromPose,t:${t},duration:3.2}:{id:${id},kind:'activity',activity:'sleep',t:${t},duration:6};
 drawCollectionDragon(c,${id},{yaw:.9,pitch:.35,distance:1},${wake?10+t:7.5+t},care);
 }`,box);
 const x=10+i%3*440,y=10+Math.floor(i/3)*340;g.drawImage(c,x,y);g.fillStyle='#604d36';g.font='bold 15px Arial';g.fillText(label,x+10,y+323);
});
const dest=path.resolve(__dirname,'../../../preview-rest-v0117.png');fs.writeFileSync(dest,out.toBuffer('image/png'));console.log(dest);
