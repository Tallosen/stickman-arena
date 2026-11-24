const fs=require('fs'),vm=require('vm'),path=require('path');
const {createCanvas}=require('@napi-rs/canvas');
const box={console,Math,dragonProfile:{personalities:{}}};vm.createContext(box);
for(const file of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),box);
const out=createCanvas(1320,680),g=out.getContext('2d');g.fillStyle='#f5ecdd';g.fillRect(0,0,1320,680);
for(const [i,id,activity] of [[0,66,'sleep'],[1,51,'play'],[2,75,'splash'],[3,51,'sniff'],[4,21,'sniff'],[5,0,'greet']]){
 const c=createCanvas(420,300);box.c=c;const care=activity==='greet'?{id,kind:'greet',bond:30,t:1.5,duration:2.8}:{id,kind:'activity',activity,t:1.5,duration:6};
 vm.runInContext(`drawCollectionDragon(c,${id},{yaw:.85,pitch:.45,distance:1},1.5,${JSON.stringify(care)})`,box);
 const x=10+i%3*440,y=10+Math.floor(i/3)*340;g.drawImage(c,x,y);g.fillStyle='#604d36';g.font='bold 15px Arial';g.fillText({sleep:'Тихий отдых',play:'Любимый мяч',splash:'Игры с водой',sniff:id===21?'Искристый чих':'Любопытный исследователь',greet:'Приветствие лучшего друга'}[activity],x+10,y+323);
}
const dest=path.resolve(__dirname,'../../../preview-life-v0113.png');fs.writeFileSync(dest,out.toBuffer('image/png'));console.log(dest);
