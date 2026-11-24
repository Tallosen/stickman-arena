// Native Canvas contact sheet, not a browser or mobile screenshot.
const fs=require('fs'),vm=require('vm'),path=require('path');
const {createCanvas}=require('@napi-rs/canvas');
const box={console,Math,dragonProfile:{personalities:{}}};vm.createContext(box);
for(const f of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f),'utf8'),box);
const run=s=>vm.runInContext(s,box),out=createCanvas(1200,930),g=out.getContext('2d');
g.fillStyle='#f5ecdd';g.fillRect(0,0,out.width,out.height);
const ids=[18,54,51,36,15,27];
for(let i=0;i<ids.length;i++){
 const id=ids[i];if(id===36){let seed=1;while(run('personalityFromSeed('+seed+').habitat')!==1)seed++;box.dragonProfile.personalities[id]=seed;}
 const c=createCanvas(580,270);box.c=c;run('drawCollectionDragon(c,'+id+',{yaw:.85,pitch:.35,distance:1.08},0)');
 const x=10+i%2*600,y=10+Math.floor(i/2)*310;g.drawImage(c,x,y);
 g.strokeStyle='#aa9474';g.strokeRect(x,y,580,295);g.fillStyle='#604d36';g.font='bold 16px Arial';
 g.fillText(run('COLLECTION_BIOMES[collectionHabitat(homeDragonDisplayMesh('+id+').d,dragonPersonality('+id+'))].name'),x+15,y+288);
}
const dest=path.resolve(__dirname,'../../../preview-habitats-v0110.png');fs.writeFileSync(dest,out.toBuffer('image/png'));console.log(dest);
