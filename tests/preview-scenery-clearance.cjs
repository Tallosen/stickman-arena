const fs=require('fs'),vm=require('vm'),path=require('path');
const {createCanvas}=require('@napi-rs/canvas');
const box={console,Math,dragonProfile:{personalities:{}}};vm.createContext(box);
for(const f of ['dragon-personality','dragon-breeds','dragon-camera','dragon-3d','dragon-collection','dragon-care'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f+'.js'),'utf8'),box);
const out=createCanvas(1320,680),g=out.getContext('2d');g.fillStyle='#f5ecdd';g.fillRect(0,0,1320,680);
for(const [i,id] of [0,51,36,15,27,54].entries()){
 const c=createCanvas(420,300);box.c=c;
 vm.runInContext(`drawCollectionDragon(c,${id},{yaw:.85,pitch:.4,distance:1.08},1.5)`,box);
 const x=10+i%3*440,y=10+Math.floor(i/3)*340;g.drawImage(c,x,y);g.font='bold 15px Arial';g.fillStyle='#604d36';g.fillText('Питомец '+id+' · свободное место для движений',x+8,y+323);
}
const dest=path.resolve(__dirname,'../../../preview-scenery-v0123.png');fs.writeFileSync(dest,out.toBuffer('image/png'));console.log(dest);
