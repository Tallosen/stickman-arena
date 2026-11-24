const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),sources=[],contexts=[];
const node=()=>({connect(n){this.output=n;},disconnect(){}});
class AudioContext{
 constructor(){this.currentTime=0;this.sampleRate=44100;this.state='running';this.destination={};contexts.push(this);}
 createGain(){return {...node(),gain:{value:1}};}
 createBuffer(ch,n,sr){const data=new Float32Array(n);return {sampleRate:sr,duration:n/sr,getChannelData:()=>data};}
 createBufferSource(){const ctx=this,s={...node(),playbackRate:{value:1},start(){this.at=ctx.currentTime;},stop(at){this.end=at===undefined?ctx.currentTime:at;if(at===undefined)this.onended?.();}};sources.push(s);return s;}
 resume(){return Promise.resolve();}suspend(){return Promise.resolve();}
}
const box={AudioContext,userAudioMuted:false,Playables:{audioAllowed:true},P:{x:0,wtype:'sniper'},atob:s=>Buffer.from(s,'base64').toString('binary')};box.window=box;vm.createContext(box);
const run=s=>vm.runInContext(s,box),core=fs.readFileSync(path.join(root,'src/core.js'),'utf8');run(core.slice(core.indexOf('let AC = null;')));
for(const file of ['sound-samples','sound-sample-player','sound-design'])run(fs.readFileSync(path.join(root,'src/'+file+'.js'),'utf8'));
for(const name of ['build','wings','click'])assert(run("playSound('"+name+"')"));
assert.equal(run('SFX.pickup(0)'),true,'Pickup must not disappear when all ordinary foley slots are occupied');
run('stopGameSounds()');assert(run("playSound('boss')"));assert(run("playSound('hurt')"));
assert.equal(run('SFX.chest()'),true,'Rare/elite chest must not be blocked by boss/player cue slots');
if(process.argv.includes('--repro'))process.exit(0);
// Reserve a feedback lane even when the non-feedback headroom is saturated.
run('stopGameSounds();audioVoices.add({group:"test",priority:9,peakBudget:.72,stop(){audioVoices.delete(this);}})');
assert(run('SFX.pickup(0)'));const stressed=sources.at(-1).output.gain.value;
assert(stressed>.30,'Pickup retains useful gain, not a successful-but-silent voice');
assert(run('[...audioVoices].reduce((sum,v)=>sum+v.peakBudget,0)')<=.900001);
run('stopGameSounds()');assert(run('SFX.pickup(0)'));const quiet=sources.at(-1).output.gain.value;
assert(stressed>=quiet*.94,'Combat crowd attenuation does not bury feedback');
box.userAudioMuted=true;const mutedCount=sources.length;assert.equal(run('SFX.pickup(0)'),false);assert.equal(sources.length,mutedCount);box.userAudioMuted=false;
run('stopGameSounds()');assert(run('SFX.pickup(0)'));assert.equal(run('SFX.pickup(0)'),false,'Same-frame duplicate is still throttled');
const precision=require('../tools/design-precision-audio.cjs'),{wav,metrics}=require('../tools/design-original-weapons.cjs');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/audio/manifest.json'))),signatures=new Set();
for(const name of ['sniper','pickup','chest'])for(let take=0;take<(name==='sniper'?8:3);take++){
 const clip=[...manifest.groups[name],...manifest.previousWeapons[name]].find(c=>c.design==='precision-feedback-v0176'&&c.take===take);
 const {pcm}=precision.render(name,take);if(clip)assert.deepEqual(wav(pcm),fs.readFileSync(path.join(root,'assets/audio',clip.file)));
 const m=metrics(pcm);assert(m.peak<=.461&&m.rms<=.081);assert(Math.abs(m.mean)<.001);
 assert.equal(pcm.readInt16LE(0),0);assert.equal(pcm.readInt16LE(pcm.length-2),0);
 if(name==='sniper'){
  assert(m.duration>=.4&&m.duration<=.47);signatures.add(pcm.toString('base64'));
  let bolt=0,late=0;for(let i=0;i<pcm.length/2;i++){const x=pcm.readInt16LE(i*2)/32768;if(i>44100*.17&&i<44100*.34)bolt+=x*x;if(i>44100*.39)late+=x*x;}
  assert(bolt>.01,'Distinct audible bolt/ejection phase');assert(late<bolt*.015,'No prolonged hiss after the mechanism');
 }else assert(m.rms>=.025,'Pickup material cue has adequate body, not only a tiny transient');
}
assert.equal(signatures.size,8);
run('soundVariations.clear()');const takes=[];
for(let i=0;i<8;i++){run('stopGameSounds()');assert(run('SFX.shot()'));takes.push(sources.at(-1).buffer);}
assert.equal(new Set(takes).size,8);
// All sources obey the same fixed master trim and reservation; no normalization after mixing.
if(process.argv.includes('--write-preview')){
 run('stopGameSounds()');const offset=sources.length;contexts[0].currentTime=1;
 const audition=['SFX.shot()','SFX.shot()','SFX.shot()','SFX.shot()'];
 audition.forEach((call,i)=>{contexts[0].currentTime=.5+i*1.1;run('stopGameSounds()');run(call);});
 const data=new Float64Array(44100*5);
 for(const s of sources.slice(offset)){
  const pcm=s.buffer.getChannelData(0),speed=s.playbackRate.value,start=Math.round(s.at*44100),end=Math.min(data.length,Math.ceil(s.end*44100)),gain=s.output.gain.value*.72;
  for(let i=start;i<end;i++){const t=(i-start)*speed,j=Math.floor(t);if(j+1>=pcm.length)break;data[i]+=(pcm[j]*(1-(t-j))+pcm[j+1]*(t-j))*gain;}
 }
 const out=Buffer.alloc(data.length*2);for(let i=0;i<data.length;i++){assert(Math.abs(data[i])<.65);out.writeInt16LE(Math.round(data[i]*32767),i*2);}
 fs.writeFileSync(path.join(root,'audit/sniper-preview-v0178.wav'),wav(out));
}
console.log('PASS: pickups survive foley/cue saturation and reserved headroom; mute/duplicate gates; 8 unique sniper shots with a bolt phase; bounded feedback PCM');
