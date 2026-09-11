// Offline renderer preview only; not a browser layout test.
const fs=require('fs'),vm=require('vm'),path=require('path');
const {createCanvas}=require('C:/Users/Fla/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const box={console,Math};vm.createContext(box);
for(const f of ['dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f),'utf8'),box);
const canvas=createCanvas(740,640),g=canvas.getContext('2d');g.fillStyle='#f5ecdd';g.fillRect(0,0,740,640);g.fillStyle='#493b28';g.font='bold 28px Arial';g.fillText('Моя коллекция',24,40);
for(let i=0;i<8;i++){
 const c=createCanvas(164,112);box.c=c;vm.runInContext('drawCollectionDragon(c,'+[0,18,36,15,24,60,88,99][i]+',{yaw:.85,pitch:.35,distance:1},0)',box);
 const x=24+(i%4)*176,y=64+Math.floor(i/4)*165;g.drawImage(c,x,y);g.strokeStyle='#776347';g.lineWidth=2;g.strokeRect(x,y,164,145);g.fillStyle='#493b28';g.font='bold 12px Arial';g.fillText('Дракон · ×'+(i+1),x+10,y+132);
}
const c=createCanvas(320,220);box.c=c;vm.runInContext('drawCollectionDragon(c,15,{yaw:.85,pitch:.35,distance:1},1)',box);g.drawImage(c,210,405);
fs.writeFileSync(path.resolve(__dirname,'../../../preview-collection-v094.png'),canvas.toBuffer('image/png'));
