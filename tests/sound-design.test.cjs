const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),created=[],sources=[],panners=[],gains=[],compressors=[];
const node=()=>({connect(){},disconnect(){this.disconnected=true;}});
class AudioContext{
 constructor(){created.push(this);this.currentTime=0;this.sampleRate=22050;this.state='suspended';this.destination={};}
 createGain(){const g={...node(),gain:{value:1}};gains.push(g);return g;}
 createDynamicsCompressor(){const c={...node(),threshold:{},knee:{},ratio:{},attack:{},release:{}};compressors.push(c);return c;}
 createBuffer(ch,n,sr){const data=new Float32Array(n);return {duration:n/sr,getChannelData:()=>data};}
 createBufferSource(){const s={...node(),playbackRate:{},start(){this.started=true;},stop(at){if(at===undefined){this.stopped=true;this.onended?.();}}};sources.push(s);return s;}
 createStereoPanner(){const p={...node(),pan:{value:0}};panners.push(p);return p;}
 resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}
}
const box={AudioContext,console,Playables:{audioAllowed:true},P:{x:0,wtype:'basic'},userAudioMuted:false,setTimeout(){throw Error('Audio must not queue timer melodies');}};box.window=box;
vm.createContext(box);const run=s=>vm.runInContext(s,box);
const core=fs.readFileSync(path.join(root,'src/core.js'),'utf8');run(core.slice(core.indexOf('let AC = null;')));
run(fs.readFileSync(path.join(root,'src/sound-design.js'),'utf8'));
assert.equal(created.length,0,'Module load must not autoplay or allocate an audio device');
run('Math.random=()=>{throw Error("Sound changed gameplay RNG");}');
for(const sr of [22050,44100,48000]){
 box.sr=sr;
 for(const name of run('Object.keys(SOUND_LIBRARY)')){
  box.name=name;const pcm=run('renderSoundSpec(SOUND_LIBRARY[name],sr,101)');
  assert(pcm.length<sr*2.5&&pcm.length>sr*.02,name+' duration');
  let peak=0,energy=0;for(const n of pcm){assert(Number.isFinite(n),name+' finite');peak=Math.max(peak,Math.abs(n));energy+=n*n;}
  assert(peak<=.480001&&peak>.003,name+' headroom');assert(energy/pcm.length>.0000001,name+' audible energy');
  assert.equal(Math.abs(pcm[0]),0,name+' smooth onset');assert.equal(Math.abs(pcm.at(-1)),0,name+' silent tail');
 }
}
assert.deepEqual(run('renderSoundSpec(SOUND_LIBRARY.rifle,22050,9)'),run('renderSoundSpec(SOUND_LIBRARY.rifle,22050,9)'));
assert.notDeepEqual(run('renderSoundSpec(SOUND_LIBRARY.rifle,22050,9)'),run('renderSoundSpec(SOUND_LIBRARY.rifle,22050,10)'));
const signatures=['rifle','shotgun','sniper','minigun'].map(name=>{box.name=name;return Buffer.from(run('renderSoundSpec(SOUND_LIBRARY[name],22050,9)').buffer).toString('base64');});
assert.equal(new Set(signatures).size,4,'Weapons must have distinct recipes');
const energy=pcm=>pcm.reduce((sum,x)=>sum+x*x,0)/pcm.length;
const warm=energy(run('renderSoundSpec({layers:[soundTone(600,600,.3,.3)]},44100,1)'));
const sharp=energy(run('renderSoundSpec({layers:[soundTone(6000,6000,.3,.3)]},44100,1)'));
assert(sharp<warm*.08,'Harsh high tones are attenuated by the source filters');
const attack=run('renderSoundSpec({layers:[soundTone(600,600,.3,.3)]},44100,1)');
assert(energy(attack.slice(0,88))<energy(attack.slice(441,882))*.02,'First 2ms are a soft onset, not an impulse');
box.userAudioMuted=true;assert.equal(run("playSound('rifle')"),false);assert.equal(created.length,0);
box.userAudioMuted=false;box.Playables.audioAllowed=false;assert.equal(run("playSound('rifle')"),false);assert.equal(created.length,0);
box.Playables.audioAllowed=true;assert.equal(run('SFX.shot()'),true);assert.equal(created.length,1);
assert.equal(gains[1].gain.value,.72,'Linear output trim');assert.equal(compressors.length,0,'No compressor make-up gain or pumping');
assert.equal(run('SFX.shot()'),false,'Rate limit rapid repeated gunfire');
created[0].currentTime+=1;assert.equal(run("SFX.shot('sniper',900)"),true);assert.equal(panners.at(-1).pan.value,.65);
created[0].currentTime+=1;run("SFX.shot('shotgun',-900)");assert.equal(panners.at(-1).pan.value,-.65);
run('stopGameSounds()');assert.equal(run('audioVoices.size'),0);assert(sources.every(s=>s.stopped&&s.disconnected));
for(let i=0;i<3;i++){created[0].currentTime+=1;assert.equal(run("playSound('rifle')"),true);}
created[0].currentTime+=1;assert.equal(run("playSound('rifle')"),false,'Gunfire category budget');
assert.equal(run("playSound('chest')"),true);assert.equal(run("playSound('boss')"),true);
assert.equal(run("playSound('hurt')"),true,'Important cue replaces a lower-priority cue');
created[0].currentTime+=1;assert.equal(run("playSound('boss')"),false,'Fanfares cannot stack indefinitely');
for(const [name,n] of [['hit',3],['boom',2],['click',3]]){
 box.name=name;for(let i=0;i<n;i++){created[0].currentTime+=1;assert.equal(run('playSound(name)'),true);}
 created[0].currentTime+=1;assert.equal(run('playSound(name)'),false,name+' category budget');
}
assert.equal(run('audioVoices.size'),14,'Category budgets plus the independent pickup feedback');
assert(run('[...audioVoices].reduce((sum,v)=>sum+v.peakBudget,0)')<=1.050001,'Aligned peaks fit the bus reservation');
assert(run('[...audioVoices].reduce((sum,v)=>sum+v.peakBudget,0)')*.72<.76,'Headroom even without crowd attenuation assumptions');
assert(gains.at(-1).gain.value<.40*.72,'Busy mixes lower the gain of additional effects');
// Exercise peak reservation independent of ordinary category/crowd order.
run('stopGameSounds(); audioVoices.add({group:"test",priority:0,peakBudget:1,stop(){audioVoices.delete(this);}})');
created[0].currentTime+=1;assert.equal(run("playSound('rifle')"),true);
assert(gains.at(-1).gain.value<=.05/.48+1e-9,'New source cannot overbook remaining peak headroom');
assert(run('[...audioVoices].reduce((sum,v)=>sum+v.peakBudget,0)')<=1.050001);
run('platformAudio(false)');assert.equal(run('audioVoices.size'),0);assert.equal(run('audioMaster.gain.value'),0);assert.equal(run('soundCooldowns.size'),0);
assert(sources.every(s=>s.stopped),'Muted contexts must not retain scheduled sound');
run('platformAudio(true)');created[0].currentTime+=1;
assert.equal(run("playSound('hit')"),true);
assert.equal(run("playSound('pop')"),false,'Alternating hit/death cannot bypass contact throttling');
created[0].currentTime+=.086;assert.equal(run("playSound('pop')"),true);
run('stopGameSounds()');assert.equal(run("playSound('hit')"),true,'Preview/reset clears shared contact window');
run('stopGameSounds()');
run('platformAudio(true)');assert.equal(run('audioVoices.size'),0,'Unmute does not replay old sounds');
run("chain([440,660,880],'square',.05)");assert.equal(run('audioVoices.size'),1,'Melody is one baked voice, no timers');
sources.at(-1).onended();assert.equal(run('audioVoices.size'),0,'Completed voices are disconnected');
for(let i=0;i<150;i++){created[0].currentTime+=1;box.freq=400+i;run("beep(freq,.06,'square',.04,30)");run('stopGameSounds()');}
assert(run('soundCache.size')<=72,'PCM cache bounded');
for(let i=0;i<150;i++){created[0].currentTime+=1;box.freq=900+i;run("beep(freq,.04,'sine',.04,10)");sources.at(-1).onended();}
assert(run('soundCooldowns.size')<=128,'Cooldown map bounded');
assert(run('soundVariations.size')<=128,'Variant history bounded');
run('stopGameSounds();for(let i=0;i<128;i++)soundCooldowns.set("fixture"+i,0)');created[0].currentTime+=1;
assert.equal(run("playSound('hit')"),true);assert(run('soundCooldowns.size')<=128,'Event plus shared cooldown both respect the map limit');
for(const file of ['dist/index.html','dist/youtube/index.html','dist/playgama/index.html']){
 const text=fs.readFileSync(path.join(root,file),'utf8');assert(text.includes('const SOUND_LIBRARY='));assert(text.indexOf('const SOUND_LIBRARY=')<text.indexOf('function startUlt('));
}
console.log('PASS: sound recipes at 3 sample rates, soft attacks/high-frequency attenuation, independent RNG, distinct guns, lazy audio, mute, category budgets, priority, panning, output trim, bounded cache, timer-free melodies and all bundles');
