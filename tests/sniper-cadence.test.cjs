const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
function fixture(){
 const sources=[],contexts=[];const node=()=>({connect(n){this.output=n;},disconnect(){}});
 class AC{
  constructor(){this.currentTime=0;this.sampleRate=44100;this.state='running';this.destination={};contexts.push(this);}
  createGain(){return {...node(),gain:{value:1}};}
  createBuffer(c,n,sr){const data=new Float32Array(n);return {duration:n/sr,sampleRate:sr,getChannelData:()=>data};}
  createBufferSource(){const ctx=this,s={...node(),playbackRate:{value:1},start(){this.at=ctx.currentTime;this.initialGain=this.output.gain.value;},stop(at){this.end=at??ctx.currentTime;if(at===undefined){this.finished=true;this.onended?.();}}};sources.push(s);return s;}
  resume(){return Promise.resolve();}suspend(){return Promise.resolve();}
 }
 const box={AudioContext:AC,userAudioMuted:false,Playables:{audioAllowed:true},P:{x:0,wtype:'sniper'},atob:s=>Buffer.from(s,'base64').toString('binary')};box.window=box;vm.createContext(box);
 const run=s=>vm.runInContext(s,box),core=fs.readFileSync(path.join(root,'src/core.js'),'utf8');run(core.slice(core.indexOf('let AC = null;')));
 for(const f of ['sound-samples','sound-sample-player','sound-design'])run(fs.readFileSync(path.join(root,'src/'+f+'.js'),'utf8'));
 function at(t){if(contexts[0])contexts[0].currentTime=t;for(const s of sources)if(!s.finished&&s.end<=t){s.finished=true;s.onended?.();}}
 return {sources,contexts,box,run,at};
}
// Record the actual late-game, hasted hand-weapon cadence, including frame rounding.
const game=require('./arena-harness.cjs')();
const times=game.run(`reset();running=true;paused=false;P.wtype='sniper';P.stage=20;P.gear.gun=GEAR.gun.max;P.gear.gloves=GEAR.gloves.max;P.gear.clip=0;applyGear();P.hasteT=100000;
enemies=[];spawn('basic');enemies[0].x=P.x+100;enemies[0].y=P.y;let time=0,shotTimes=[];SFX.shot=()=>shotTimes.push(time/1000);
for(;time<8000;time+=16)updateHeroFire(16);shotTimes;`);
const rapid=fixture();
for(const t of times){rapid.at(t);assert(rapid.run('SFX.shot()'),'Missing audible sniper at '+t+'s (actual max-upgrade/haste cadence)');assert(rapid.sources.at(-1).initialGain>.02);}
const busy=fixture();
for(const n of ['rifle','shotgun','turret'])assert(busy.run("playSound('"+n+"')"));
assert(busy.run('SFX.shot()'),'Player sniper survives three occupied background weapon slots');
busy.run('stopGameSounds()');assert(busy.run("SFX.shot('sniper',80)"));assert(busy.run('SFX.shot()'),'Boss and player sniper do not share cooldown');
assert.equal(busy.run('SFX.shot()'),false,'Duplicate same-frame player event stays blocked');
if(process.argv.includes('--repro'))process.exit(0);
const cinematic=fixture();
for(let i=0;i<24;i++){cinematic.at(i*.09);assert(cinematic.run('SFX.shot()'),'Rapid cinematic attack '+i);assert(cinematic.sources.at(-1).initialGain>.02);}
const quiet=fixture();quiet.box.userAudioMuted=true;assert.equal(quiet.run('SFX.shot()'),false);assert.equal(quiet.sources.length,0);
const takes=fixture();for(let i=0;i<24;i++){takes.at(i*.7);assert(takes.run('SFX.shot()'));}
for(let i=0;i<24;i+=8)assert.equal(new Set(takes.sources.slice(i,i+8).map(s=>s.buffer)).size,8);
for(let i=1;i<24;i++)assert.notEqual(takes.sources[i].buffer,takes.sources[i-1].buffer);
assert(rapid.run('[...audioVoices].reduce((n,v)=>n+v.peakBudget,0)')<=.900001);
if(process.argv.includes('--write-preview')){
 const out=new Float64Array(44100*6.3);
 for(const s of takes.sources.slice(0,8)){const pcm=s.buffer.getChannelData(0),start=Math.round(s.at*44100),gain=s.initialGain*.72;
  for(let i=start;i<Math.min(out.length,Math.ceil(s.end*44100));i++){const at=(i-start)*s.playbackRate.value,j=Math.floor(at);if(j+1>=pcm.length)break;out[i]+=(pcm[j]*(1-at+j)+pcm[j+1]*(at-j))*gain;}}
 const pcm=Buffer.alloc(out.length*2);let peak=0;for(let i=0;i<out.length;i++){peak=Math.max(peak,Math.abs(out[i]));assert(Math.abs(out[i])<.65);pcm.writeInt16LE(Math.round(out[i]*32767),i*2);}
 fs.writeFileSync(path.join(root,'audit/sniper-preview-v0182.wav'),require('../tools/design-original-weapons.cjs').wav(pcm));
 fs.writeFileSync(path.join(root,'audit/sniper-cadence-v0182.json'),JSON.stringify({shots:times.length,minimumInterval:Math.min(...times.slice(1).map((t,i)=>t-times[i])),rapidCinematicShots:24,variations:8,previewPeak:peak,claim:'Offline PCM at runtime gain; not browser capture or subjective listening'},null,2));
}
console.log('PASS: all '+times.length+' hasted sniper shots, busy weapon bus, boss overlap, rapid cinematic, mute, non-repeating eight-take bags');
