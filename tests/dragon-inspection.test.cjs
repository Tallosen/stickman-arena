const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const {createCanvas}=require('@napi-rs/canvas');
const box={console,assert,Math,dragonProfile:{personalities:{}}};vm.createContext(box);
for(const f of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f),'utf8'),box);
const run=s=>vm.runInContext(s,box);box.c=createCanvas(640,420);
run(`
const signatures=new Set(),rhythms=new Set();
for(let music=0;music<24;music++){
 const song=dragonTune({music}),score=Array.from({length:song.length},(_,step)=>dragonScoreStep(song,step));
 signatures.add(JSON.stringify(score));rhythms.add([song.meter,song.lead,song.kick,song.snare,song.hat].join(':'));
 for(const events of score)for(const e of events){assert(e.frequency>20&&e.frequency<20000);assert(e.duration>0&&e.duration<4);assert(e.volume>0&&e.volume<.06);}
}assert.equal(signatures.size,24);assert.equal(rhythms.size,8);
const touchSignatures=new Set();
for(let idle=0;idle<8;idle++){
 let seed=1;while(personalityFromSeed(seed).idle!==idle)seed++;dragonProfile.personalities[0]=seed;
 const m=applyCollectionCare(collectionMotion(homeDragonDisplayMesh(0).d,1),{id:0,kind:'touch',t:1,duration:2.8});assert(Object.values(m).every(Number.isFinite));touchSignatures.add(JSON.stringify(m));
}assert.equal(touchSignatures.size,8);
for(const yaw of [0,.85,2.3,4.5]){
 drawCollectionDragon(c,0,{yaw,pitch:.35,distance:1},1,{id:0,kind:'feed',t:1,duration:3.6});
 assert(!collectionHitDragon(c,0,0));assert(!collectionHitDragon(c,c.width-1,c.height-1));
 const shapes=collectionPickShapes.get(c);assert(shapes.length>100);
 const f=shapes.find(f=>f.points.every(p=>p[0]>0&&p[0]<640&&p[1]>0&&p[1]<420));
 const x=f.points.reduce((s,p)=>s+p[0],0)/f.points.length,y=f.points.reduce((s,p)=>s+p[1],0)/f.points.length;assert(collectionHitDragon(c,x,y));
}
`);
let stops=0,starts=0;const param=()=>({setValueAtTime(){},exponentialRampToValueAtTime(){}});
const voice=()=>({frequency:param(),connect(){},disconnect(){},start(){starts++;},stop(){stops++;}});
box.AC={currentTime:0,sampleRate:8000,createGain:()=>({gain:param(),connect(){},disconnect(){}}),createBiquadFilter:()=>({frequency:{},connect(){},disconnect(){}}),createOscillator:voice,createBufferSource:voice,createBuffer:(channels,len)=>({getChannelData:()=>new Float32Array(len)})};box.audioMaster={};box.audio=()=>{};box.Playables={audioAllowed:true};
run(`for(let i=0;i<100;i++)playDragonTuneStep({music:i%24},i);assert(dragonMusicVoices.size<=24);stopDragonMusic();assert.equal(dragonMusicVoices.size,0);`);assert(starts>0&&stops>=starts);
const before=starts;box.Playables.audioAllowed=false;run('playDragonTuneStep({music:0},0)');assert.equal(starts,before);
const out=createCanvas(1280,420),g=out.getContext('2d');run('drawCollectionDragon(c,0,{yaw:.85,pitch:.35,distance:1},1,{id:0,kind:"feed",t:1,duration:3.6})');g.drawImage(box.c,0,0);run('drawCollectionDragon(c,0,{yaw:.85,pitch:.35,distance:1},1,{id:0,kind:"touch",t:1,duration:2.8})');g.drawImage(box.c,640,0);
fs.writeFileSync(path.resolve(__dirname,'../../../preview-inspection-v0100.png'),out.toBuffer('image/png'));
console.log('PASS: 24 different scores, 8 rhythms/arrangements, 8 touch styles, actual polygon picking at four angles, finite grounded bowl, audio voice cap/stop/mute');
