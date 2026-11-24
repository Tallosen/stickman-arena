const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
const root=path.join(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/audio/manifest.json')));
const expected=['rifle','shotgun','sniper','minigun','hit','pop','hurt','boom','dragon','breath','wings','click','chest','level','heal','victory','dead','ultimate','ice','gas','tank','slash','build','bite','revive','boss','airstrike','turret','chirp','petDown','pickup','crateLand','grenadeThrow','grenadeBlast','ultImpact','petChicken','petDog','petCat','petParrot','petBoar','petMole','mineBlast','mineMini','petBlast'];expected.push('arrow','laser');assert.deepEqual(Object.keys(manifest.groups).sort(),expected.sort());
let devices=0,decodes=0;const sources=[];
const node=()=>({connect(){},disconnect(){}});
class AudioContext{
 constructor(){devices++;this.currentTime=0;this.sampleRate=48000;this.state='running';this.destination={};}
 createGain(){return {...node(),gain:{value:1}};}
 createBuffer(ch,n,sr){const pcm=new Float32Array(n);return {sampleRate:sr,duration:n/sr,getChannelData:()=>pcm};}
 createBufferSource(){const s={...node(),playbackRate:{},start(){},stop(at){if(at===undefined)this.onended?.();}};sources.push(s);return s;}
 resume(){return Promise.resolve();}suspend(){return Promise.resolve();}
}
const box={AudioContext,userAudioMuted:false,Playables:{audioAllowed:true},atob:s=>{decodes++;return Buffer.from(s,'base64').toString('binary');},P:{x:0,wtype:'basic'}};box.window=box;vm.createContext(box);
const run=s=>vm.runInContext(s,box),core=fs.readFileSync(path.join(root,'src/core.js'),'utf8');run(core.slice(core.indexOf('let AC = null;')));
for(const f of ['sound-samples.js','sound-sample-player.js','sound-design.js'])run(fs.readFileSync(path.join(root,'src',f),'utf8'));
assert.equal(devices,0);assert.equal(decodes,0,'No eager audio allocation');
const bank=run('RECORDED_SOUNDS');
assert.deepEqual(Object.keys(bank).sort(),Array.from(run('Object.keys(SOUND_LIBRARY)')).sort(),'Every live named sound has a new prepared asset');
assert.equal(manifest.releaseStatus,'no-user-reference-audio');
assert(!/bullet-time|user-reference|permission unverified/i.test(JSON.stringify([manifest.groups,manifest.previousWeapons])),'Neither active nor comparison bank depends on user recordings');
for(const name of expected){
 assert(bank[name].length>=1);if(['rifle','shotgun','sniper','minigun','hit'].includes(name))assert(bank[name].length>=3,'Three actual recording variants: '+name);
 const unique=new Set();
 for(let i=0;i<bank[name].length;i++){
  const data=Buffer.from(bank[name][i],'base64'),clip=manifest.groups[name][i],wav=fs.readFileSync(path.join(root,'assets/audio',clip.file));
  assert.equal(crypto.createHash('sha256').update(wav).digest('hex'),clip.sha256);assert.deepEqual(data,wav.subarray(44));
  unique.add(clip.sha256);let energy=0,peak=0;for(let j=0;j<data.length;j+=2){const x=data.readInt16LE(j)/32768;energy+=x*x;peak=Math.max(peak,Math.abs(x));}
  assert(peak<=.481&&peak>.05,name+' bounded peak');assert(energy/(data.length/2)>.00001,name+' non-silent');
  const rate=clip.sampleRate||manifest.sampleRate;
  if(['hit','pop','hurt'].includes(name)){
   assert.equal(clip.design,'full-rebuild-source-led-v0172');assert.equal(rate,44100);
   assert(clip.duration<=.25);assert.equal(bank[name].length,3);
   assert(clip.components.some(c=>c.source==='independent-hits'),'New contact library, not old belt-friction');
  }
  assert.equal(wav.readUInt32LE(24),rate);assert.equal(run('RECORDED_SOUND_RATES')[name],rate);
  assert.equal(data.readInt16LE(0),0);assert.equal(data.readInt16LE(data.length-2),0);assert(data.length<rate*2*2.5);
  if(['project-original-comfort','project-original-precision','project-original-readable','project-original-projectile','project-original-sniper'].includes(clip.source)){
   assert.equal(rate,44100);
   assert.equal(bank[name].length,['rifle','shotgun','sniper','minigun','turret'].includes(name)?8:3);
   assert.equal(clip.design,clip.source==='project-original-sniper'?'dry-precision-variety-v0182':clip.source==='project-original-projectile'?'heavy-projectile-v0178':clip.source==='project-original-readable'?'readable-event-signatures-v0177':clip.source==='project-original-precision'?'precision-feedback-v0176':'varied-dry-comfort-v0175');assert.deepEqual(clip.components,[]);
   assert(!clip.original&&!clip.downloadFile,'Generated, not an edited recording');
   const generator=fs.readFileSync(path.join(root,clip.generator));
   assert.equal(crypto.createHash('sha256').update(generator).digest('hex'),clip.generatorSha256);
  }else if(clip.source==='project-original-arsenal'){
   assert.equal(rate,44100);assert.equal(bank[name].length,3);assert.equal(clip.design,'arsenal-evolution-v0195');assert.deepEqual(clip.components,[]);
   assert(!clip.original&&!clip.downloadFile);assert(clip.duration<=.2);
   assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,clip.generator))).digest('hex'),clip.generatorSha256);
  }else if(clip.source==='project-original-effects'){
   assert.equal(rate,44100);assert.equal(bank[name].length,3);
   assert.equal(clip.design,'short-action-cues-v0174');assert.deepEqual(clip.components,[]);
   assert(!clip.original&&!clip.downloadFile);assert(clip.duration<=.5);
   assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,clip.generator))).digest('hex'),clip.generatorSha256);
  }else{
   const original=fs.readFileSync(path.join(root,'assets/audio/originals',clip.original));
   assert.equal(crypto.createHash('sha256').update(original).digest('hex'),clip.originalSha256,'Original provenance');
  }
  for(const layer of clip.components||[]){const raw=fs.readFileSync(path.join(root,'assets/audio/originals',layer.original));assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),layer.originalSha256,'Layer provenance');assert(layer.source&&layer.downloadSha256&&layer.frameCount>0);}
 }
 assert.equal(unique.size,bank[name].length,'Distinct takes: '+name);
}
box.userAudioMuted=true;assert.equal(run("playSound('rifle')"),false);assert.equal(decodes,0);assert.equal(devices,0);
box.userAudioMuted=false;box.Playables.audioAllowed=false;assert.equal(run("playSound('rifle')"),false);assert.equal(devices,0);
box.Playables.audioAllowed=true;assert.equal(run("playSound('rifle')"),true);assert.equal(sources.at(-1).buffer.sampleRate,44100);assert.equal(decodes,1);
run('stopGameSounds()');assert.equal(run("playSound('rifle',null,null,1,false)"),true);assert.equal(sources.at(-1).buffer.sampleRate,48000,'A/B uses old synthesis, not a cached recording');assert.equal(decodes,1);
run('stopGameSounds()');assert.equal(run("playSound('chirp')"),true);assert.equal(sources.at(-1).buffer.sampleRate,44100,'Formerly synthesized events now use the bank');
for(const call of ["beep(880,.1,'sine',.03)","noise(.1,.04,400,-100)","chain([400,600,800],'sine',.04)"]){
 run('stopGameSounds()');assert.equal(run(call),true);assert.equal(sources.at(-1).buffer.sampleRate,44100,'Legacy callers route to the new bank');
}
for(const name of expected){run('stopGameSounds()');box.name=name;assert.equal(run('playSound(name)'),true);assert.equal(sources.at(-1).buffer.sampleRate,manifest.groups[name][0].sampleRate||manifest.sampleRate);}
for(const name of Object.keys(manifest.previousWeapons)){
 const previous=run('PREVIOUS_WEAPON_SOUNDS')[name];
 for(let i=0;i<previous.length;i++){
  const clip=manifest.previousWeapons[name][i],wav=fs.readFileSync(path.join(root,'assets/audio',clip.file));
  assert.equal(crypto.createHash('sha256').update(wav).digest('hex'),clip.sha256);
  assert.deepEqual(Buffer.from(previous[i],'base64'),wav.subarray(44),'A/B uses real 0.171 PCM');
  assert.notDeepEqual(previous[i],bank[name][i],'Current processing differs from the prior version');
 }
 run('stopGameSounds()');box.name=name;assert.equal(run("playSound(name,null,null,1,'previous')"),true);
 assert.equal(sources.at(-1).buffer.sampleRate,manifest.previousWeapons[name][0].sampleRate||22050,'Previous bank has its original rate');
 run('stopGameSounds()');assert.equal(run('playSound(name)'),true);assert.equal(sources.at(-1).buffer.sampleRate,44100,'Old bank cannot poison the current cache');
}
const takes=[];run('soundVariations.clear()');
for(let i=0;i<8;i++){
 run('stopGameSounds()');run("playSound('rifle')");takes.push(sources.at(-1).buffer);
 run('stopGameSounds()');run("playSound('hit')");run("playSound('pop')");
}
assert.equal(new Set(takes).size,8,'Every shuffled gun take is played even with hit/pop interleaved');
run('platformAudio(false)');assert.equal(run('audioVoices.size'),0,'Sample playback respects the existing mute cleanup');
for(const name of ['dist/index.html','dist/youtube/index.html','dist/playgama/index.html']){
 const html=fs.readFileSync(path.join(root,name),'utf8');assert(html.includes('const RECORDED_SOUNDS='));assert(!html.includes('fetch("assets/audio'));
}
console.log('PASS: original weapons/action cues, 44 prepared events, no reference fragments, provenance, PCM bounds, eight gun takes, lazy decoding and mute');
