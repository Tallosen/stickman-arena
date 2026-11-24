const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
function fixture(){
 const sources=[],gains=[],contexts=[];const node=()=>({connect(n){this.output=n;},disconnect(){}});
 class AC{
  constructor(){this.currentTime=0;this.sampleRate=44100;this.state='running';this.destination={};contexts.push(this);}
  createGain(){const events=[],gain={value:1,events,cancelScheduledValues(){},setTargetAtTime(value,time,tau){events.push({value,time,tau});this.value=value;},setValueAtTime(value,time){events.push({value,time,tau:0});this.value=value;}};const g={...node(),gain};gains.push(g);return g;}
  createBuffer(c,n,sr){const data=new Float32Array(n);return {duration:n/sr,sampleRate:sr,getChannelData:()=>data};}
  createBufferSource(){const ctx=this,s={...node(),playbackRate:{value:1},start(){this.at=ctx.currentTime;this.initialGain=this.output.gain.value;},stop(at){this.end=at??ctx.currentTime;if(at===undefined){this.finished=true;this.onended?.();}}};sources.push(s);return s;}
  resume(){return Promise.resolve();}suspend(){return Promise.resolve();}
 }
 const box={AudioContext:AC,userAudioMuted:false,Playables:{audioAllowed:true},P:{x:0,wtype:'sniper'},atob:s=>Buffer.from(s,'base64').toString('binary')};box.window=box;vm.createContext(box);
 const run=s=>vm.runInContext(s,box),core=fs.readFileSync(path.join(root,'src/core.js'),'utf8');run(core.slice(core.indexOf('let AC = null;')));
 for(const f of ['sound-samples','sound-sample-player','sound-design'])run(fs.readFileSync(path.join(root,'src/'+f+'.js'),'utf8'));
 function at(t){if(contexts[0])contexts[0].currentTime=t;for(const s of sources)if(!s.finished&&s.end<=t){s.finished=true;s.onended?.();}}
 return {run,sources,gains,contexts,at,box};
}
const h=fixture();assert(h.run('SFX.mineBlast(0)'));
assert(h.run('SFX.grenadeBlast(0)'),'Grenade must not be silenced by a mine in the same frame');
if(process.argv.includes('--repro'))process.exit(0);
assert(h.run('SFX.ultImpact(0)'),'Ultimate impact has its own cue, not the mine gate');
h.run('stopGameSounds()');assert(h.run('SFX.shot()'));const gun=h.sources.at(-1),before=gun.output.gain.value;
assert(h.run('SFX.pickup(0)'));assert(gun.output.gain.value<before*.6,'Pickup ducks an already-playing sniper');
const pickup=h.sources.at(-1);h.at(.22);assert(gun.output.gain.value>=before*.99,'Gun recovers after the pickup ends');
h.run('stopGameSounds()');assert(h.run("SFX.ability('airstrike')"));assert(h.run('SFX.airstrikeImpact(0)'));
assert(h.run('SFX.pickup(0)'));assert(h.run('SFX.chest()'));
assert(h.run('[...audioVoices].reduce((n,v)=>n+v.peakBudget,0)')<=.900001);
h.run('stopGameSounds()');h.box.userAudioMuted=true;assert.equal(h.run('SFX.grenadeBlast(0)'),false);assert.equal(h.run('SFX.ultMove(0)'),false);h.box.userAudioMuted=false;
const q=fixture();assert(q.run('SFX.shot()'));const sniper=q.sources.at(-1).output.gain.value;q.run('stopGameSounds()');assert(q.run("playSound('rifle')"));assert(sniper<q.sources.at(-1).output.gain.value*.6,'Sniper attenuated relative to other hand weapons');
// Listen to the mix, not only solo effects. Model the production gain targets offline.
if(process.argv.includes('--write-preview')){
 const d=fixture();d.run('audio()');
 const events=[[0,'SFX.shot()'],[.10,'SFX.pickup(0)'],[.8,'SFX.shot()'],[.9,'SFX.chest()'],[1.6,'SFX.shot()'],[1.63,'SFX.mineBlast(0)'],[1.64,'SFX.grenadeBlast(0)'],
 [2.6,"SFX.ability('airstrike')"],[3.1,'SFX.airstrikeImpact(0)'],[3.3,'SFX.shot()'],[3.66,'SFX.airstrikeImpact(0)'],
 [4.7,'SFX.ultimate()'],[4.9,'SFX.ultMove(0)'],[5.2,'SFX.shot()'],[5.45,'SFX.ultLand(0)'],[6.1,'SFX.shot()'],[6.15,'SFX.pickup(0)']];
 let cursor=0;for(let step=0;step<=700;step++){const t=step/100;d.at(t);while(cursor<events.length&&events[cursor][0]<=t+1e-8){assert(d.run(events[cursor][1]),events[cursor][1]+' dropped');cursor++;}}
 const out=new Float64Array(44100*7.2);
 for(const s of d.sources){const pcm=s.buffer.getChannelData(0),ev=s.output.gain.events.filter(e=>e.time>=s.at),speed=s.playbackRate.value;
  let current=s.initialGain,target=current,tau=0,next=0;
  for(let i=Math.round(s.at*44100);i<Math.min(out.length,Math.ceil(s.end*44100));i++){
   const time=i/44100;while(next<ev.length&&ev[next].time<=time){target=ev[next].value;tau=ev[next].tau;if(!tau)current=target;next++;}
   current+=(target-current)*(tau?1-Math.exp(-1/(44100*tau)):1);
   const at=(time-s.at)*speed*44100,j=Math.floor(at);if(j<0||j+1>=pcm.length)continue;
   out[i]+=(pcm[j]*(1-(at-j))+pcm[j+1]*(at-j))*current*.72;
  }
 }
 let peak=0,sum=0;const pcm=Buffer.alloc(out.length*2);for(let i=0;i<out.length;i++){peak=Math.max(peak,Math.abs(out[i]));sum+=out[i]**2;assert(Math.abs(out[i])<.65);pcm.writeInt16LE(Math.round(out[i]*32767),i*2);}
 fs.writeFileSync(path.join(root,'audit/action-mix-v0181.wav'),require('../tools/design-original-weapons.cjs').wav(pcm));
 fs.writeFileSync(path.join(root,'audit/action-mix-v0181.json'),JSON.stringify({events:events.length,voices:d.sources.length,peak,rms:Math.sqrt(sum/out.length),claim:'Offline scheduling/ducking model; not a browser capture or subjective quality rating'},null,2));
}
console.log('PASS: grenade/ultimate survive mines, audible priority lanes, live sniper duck/recovery, lower sniper gain, peak budget and mute');
