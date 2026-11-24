// Offline Canvas artwork preview; not a browser/CSS screenshot.
const fs=require('fs'),path=require('path'),vm=require('vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const box={console,Math};vm.createContext(box);
for(const f of ['dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-personality.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f),'utf8'),box);
(async()=>{
const out=createCanvas(960,380),g=out.getContext('2d');g.fillStyle='#f5ecdd';g.fillRect(0,0,960,380);g.font='bold 22px Arial';g.fillStyle='#493b28';g.fillText('Уход за драконами',18,30);
for(let i=0;i<3;i++){
 const x=18+i*315,c=createCanvas(300,205);box.c=c;const kind=['feed','pet','music'][i];
 vm.runInContext('drawCollectionDragon(c,'+[15,24,36][i]+',{yaw:.85,pitch:.35,distance:1},1.4,{kind:"'+kind+'",t:1.4,duration:8})',box);
 g.fillStyle='#fff5df';g.fillRect(x,45,300,315);g.drawImage(c,x,45);g.strokeStyle='#776347';g.lineWidth=2;g.strokeRect(x,45,300,315);
 for(let j=0;j<3;j++){const k=['feed','pet','music'][j],bx=x+58+j*64;g.fillStyle=i===j?'#e6eccb':'#f2e4c6';g.fillRect(bx,281,54,44);g.strokeStyle='#a48b67';g.strokeRect(bx,281,54,44);
 const svg=vm.runInContext('careIcon("'+k+'")',box).replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" ');
 const icon=await loadImage(Buffer.from(svg));g.drawImage(icon,bx+12,287,30,30);}
 g.fillStyle='#c5776d';g.textAlign='center';g.font='16px Arial';g.fillText('♥ ♥ ♥ ♡ ♡',x+150,269);g.fillStyle='#806749';g.font='13px Arial';g.fillText(['Хрум-хрум!','Доволен ♥','Танцуем!'][i],x+150,347);g.textAlign='left';
}
fs.writeFileSync(path.resolve(__dirname,'../../../preview-care-v095.png'),out.toBuffer('image/png'));
})();
