const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),design=require('../tools/design-comfort-audio.cjs'),{wav,metrics}=require('../tools/design-original-weapons.cjs');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/audio/manifest.json')));
for(const name of [...Object.keys(design.GUNS),...Object.keys(design.CUES)]){
 const shipped=[...manifest.groups[name],...(manifest.previousWeapons[name]||[])];
 for(let take=0;take<(design.GUNS[name]?8:3);take++){
  const clip=shipped.find(c=>c.design==='varied-dry-comfort-v0175'&&c.take===take);
  const {pcm}=design.render(name,take);if(clip)assert.deepEqual(wav(pcm),fs.readFileSync(path.join(root,'assets/audio',clip.file)));
  const m=metrics(pcm);assert(m.peak<=.461&&m.rms<=.081);assert(Math.abs(m.mean)<.001);
  assert.equal(pcm.readInt16LE(0),0);assert.equal(pcm.readInt16LE(pcm.length-2),0);
  if(['mineBlast','mineMini','petBlast','boom','pickup','chest'].includes(name)){
   assert(m.duration<=.38&&m.rms<=.035);assert(m.tailEnergyRatio<.015,'Short tails instead of sustained hiss');
  }
 }
}
function audioHarness(){
 const sources=[],contexts=[];
 const node=()=>({connect(n){this.output=n;},disconnect(){}});
 class AudioContext{
  constructor(){this.currentTime=0;this.sampleRate=44100;this.state='running';this.destination={};contexts.push(this);}
  createGain(){return {...node(),gain:{value:1}};}
  createBuffer(ch,n,sr){const data=new Float32Array(n);return {sampleRate:sr,duration:n/sr,getChannelData:()=>data};}
  createBufferSource(){const ctx=this,s={...node(),playbackRate:{value:1},
   start(){this.at=ctx.currentTime;},stop(at){this.end=at===undefined?ctx.currentTime:at;if(at===undefined){this.finished=true;this.onended?.();}}};sources.push(s);return s;}
  resume(){return Promise.resolve();}suspend(){return Promise.resolve();}
 }
 const box={AudioContext,userAudioMuted:false,Playables:{audioAllowed:true},atob:s=>Buffer.from(s,'base64').toString('binary'),P:{x:0,wtype:'basic'}};
 box.window=box;vm.createContext(box);const run=s=>vm.runInContext(s,box);
 const core=fs.readFileSync(path.join(root,'src/core.js'),'utf8');run(core.slice(core.indexOf('let AC = null;')));
 for(const file of ['sound-samples','sound-sample-player','sound-design'])run(fs.readFileSync(path.join(root,'src/'+file+'.js'),'utf8'));
 run('Math.random=()=>{throw Error("Audio must not consume gameplay RNG");}');
 function at(time){if(contexts[0])contexts[0].currentTime=time;for(const s of sources)if(!s.finished&&s.end<=time){s.finished=true;s.onended?.();}}
 return {run,at,box,sources,contexts};
}
// Independent shuffled bags: every available take, no adjacent repeats including boundaries.
const a=audioHarness();
for(const name of ['rifle','shotgun','sniper','minigun','turret']){
 const buffers=[];
 for(let i=0;i<32;i++){a.run('stopGameSounds()');a.run("playSound('"+name+"')");buffers.push(a.sources.at(-1).buffer);}
 for(let i=1;i<buffers.length;i++)assert.notEqual(buffers[i],buffers[i-1]);
 for(let i=0;i<32;i+=8)assert.equal(new Set(buffers.slice(i,i+8)).size,8,'All eight variations, not only three via modulo');
}
// Global pet chorus gate, separate species intervals. No reset between real events.
const pets=audioHarness(),heard=[];
for(let t=0;t<60;t+=.5){
 pets.at(t);
 for(const call of ["SFX.petVoice('chicken',0)","SFX.chirp(0)","SFX.petVoice('dog',0)"]){
  if(pets.run(call))heard.push({t,call});
 }
}
assert(heard.length<=12&&heard.length>=4);
for(let i=1;i<heard.length;i++)assert(heard[i].t-heard[i-1].t>=5);
const chicken=heard.filter(x=>x.call.includes('chicken'));for(let i=1;i<chicken.length;i++)assert(chicken[i].t-chicken[i-1].t>=9);
const before=pets.sources.length;pets.box.userAudioMuted=true;pets.at(100);assert.equal(pets.run("SFX.petVoice('cat',0)"),false);assert.equal(pets.sources.length,before);
// The mine swarm gate limits SOUND ONLY: no gameplay damage is suppressed here.
const cascade=audioHarness();assert(cascade.run('SFX.mineBlast(0)'));
assert.equal(cascade.run('SFX.mineMini(0)'),false);assert.equal(cascade.run('SFX.petBlast(0)'),false);
cascade.at(.121);assert(cascade.run('SFX.mineMini(0)'));
assert(cascade.run('[...audioVoices].reduce((sum,v)=>sum+v.peakBudget,0)')<=.900001);
// Real game routing: all ground pickups are quiet, mini/full mines are separate, damage still applies.
const h=require('./arena-harness.cjs')();h.box.assert=assert;
h.run(`
let heard=[];for(const key of Object.keys(SFX))SFX[key]=(...args)=>heard.push([key,...args]);
function scene(){reset();running=true;paused=false;props=[];chests=[];pickups=[];enemies=[];spawnT=eliteT=chestT=healT=1e8;heard=[];}
for(const kind of ['heart','haste','inv']){
 scene();P.hp=3;P.hpMax=5;pickups=[{x:P.x,y:P.y,a:0,kind}];update(16);
 assert.equal(heard.filter(x=>x[0]==='pickup').length,1);assert(!heard.some(x=>['heal','level','revive'].includes(x[0])));
}
for(const mini of [false,true]){
 scene();spawn('basic');const e=enemies.at(-1);Object.assign(e,{x:P.x+80,y:P.y,hp:1000});
 mines=[{x:e.x,y:e.y,arm:0,mini,dmg:4,ttl:10000}];update(16);
 assert.equal(mines.length,0);assert(e.hp<1000);assert.equal(heard.filter(x=>x[0]===(mini?'mineMini':'mineBlast')).length,1);
 assert(!heard.some(x=>x[0]==='boom'));
}
scene();P.pet=makePet('chicken');P.pet.drop=0;updatePet(16,1);
assert(heard.some(x=>x[0]==='petVoice'&&x[1]==='chicken'));assert(!heard.some(x=>x[0]==='chirp'));
heard=[];eggs=[{x:P.x,y:P.y,t:1,wob:0,kind:'yellow'}];updateFarm(16,1);assert.equal(heard.filter(x=>x[0]==='chirp').length,1);
scene();P.pet=makePet('cat');spawn('basic');Object.assign(enemies.at(-1),{x:P.x+100,y:P.y,hp:1000});updatePet(16,1);
assert(heard.some(x=>x[0]==='petShot'));assert(!heard.some(x=>x[0]==='slash'));
`);
// Offline dense mix through the production scheduler/gain logic, strongest mono sum.
const mix=audioHarness();
for(let i=0;i<800;i++){
 mix.at(i/100);
 if(i%8===0)mix.run("SFX.shot('minigun',0)");
 if(i%7===0)mix.run('SFX.hit(0)');if(i%13===0)mix.run('SFX.pop(0)');
 if(i%20===0){mix.run('SFX.mineBlast(0)');mix.run('SFX.mineMini(0)');mix.run('SFX.petBlast(0)');}
 if(i%9===0)mix.run('SFX.turret(0)');if(i%21===0)mix.run('SFX.slash(0)');
 if(i%70===0)mix.run('SFX.pickup(0)');if(i%85===0)mix.run('SFX.chest()');
 if(i%17===0)mix.run("SFX.petVoice('chicken',0)");if(i%29===0)mix.run('SFX.chirp(0)');
 assert(mix.run('[...audioVoices].reduce((sum,v)=>sum+v.peakBudget,0)')<=.900001);
}
function mixPCM(sources,seconds){
 const result=new Float64Array(Math.round(seconds*44100));
 for(const s of sources){if(s.at===undefined)continue;
  const pcm=s.buffer.getChannelData(0),speed=s.playbackRate.value,gain=s.output.gain.value*.72;
  const start=Math.round(s.at*44100),end=Math.min(result.length,Math.ceil(s.end*44100));
  for(let i=start;i<end;i++){
   const t=(i-start)*speed*s.buffer.sampleRate/44100,j=Math.floor(t);if(j+1>=pcm.length)break;
   result[i]+=(pcm[j]*(1-(t-j))+pcm[j+1]*(t-j))*gain;
  }
 }
 return result;
}
const dense=mixPCM(mix.sources,8.5);let peak=0,energy=0,maxStep=0;
for(let i=0;i<dense.length;i++){peak=Math.max(peak,Math.abs(dense[i]));energy+=dense[i]**2;if(i)maxStep=Math.max(maxStep,Math.abs(dense[i]-dense[i-1]));}
assert(peak<.65&&peak>.03,'Offline dense battle fits reserved headroom');assert(maxStep<.18);
const report={voices:mix.sources.filter(s=>s.at!==undefined).length,peak,rms:Math.sqrt(energy/dense.length),maxStep,
 nominalPeakCeiling:.9*.72,petCallsPerMinute:heard.length,claim:'Offline linear PCM diagnostic, not subjective listening or captured browser audio'};
if(process.argv.includes('--write-preview')){
 const demo=audioHarness();let time=0;
 // 6s: four weapon families; 6s: six pets; then pickups and mines. Previews reset gates intentionally.
 for(const weapon of ['basic','shotgun','sniper','minigun']){
  for(let i=0;i<(weapon==='minigun'?10:3);i++){demo.at(time+i*(weapon==='minigun'?.10:.32));demo.run('stopGameSounds()');demo.run("SFX.shot('"+weapon+"',0)");}
  time+=1.6;
 }
 for(const pet of ['chicken','dog','cat','parrot','boar','mole']){demo.at(time);demo.run('stopGameSounds()');demo.run("SFX.petVoice('"+pet+"',0)");time+=.8;}
 for(const call of ['SFX.pickup(0)','SFX.chest()','SFX.mineMini(0)','SFX.mineBlast(0)']){demo.at(time);demo.run('stopGameSounds()');demo.run(call);time+=.8;}
 const encode=x=>{const b=Buffer.alloc(x.length*2);for(let i=0;i<x.length;i++)b.writeInt16LE(Math.round(x[i]*32767),i*2);return wav(b);};
 const version=fs.readFileSync(path.join(root,'src/config.js'),'utf8').match(/VERSION = "([^"]+)"/)[1].replace('.','');
 fs.writeFileSync(path.join(root,'audit/comfort-preview-v'+version+'.wav'),encode(mixPCM(demo.sources,time+.3)));
 fs.writeFileSync(path.join(root,'audit/dense-mix-v'+version+'.wav'),encode(dense));
 fs.writeFileSync(path.join(root,'audit/dense-mix-v'+version+'.json'),JSON.stringify(report,null,2)+'\n');
}
console.log('PASS: new PCM, 8-take bags, pet intervals, mine gates/routing, pickup routing, no RNG pollution; dense mix',JSON.stringify(report));
