"use strict";
// Original procedural sound library. Baked layers share one voice and require no downloads.
const soundTone=(f,end,d,g=.3,at=0,wave='sine')=>({f,end,d,g,at,wave});
const soundNoise=(cut,end,d,g=.3,at=0)=>({cut,end,d,g,at,noise:true});
// Rounded marimba-like notes, with a quiet delayed reflection instead of piercing bells.
const soundMelody=(notes,step=.13)=>notes.flatMap((f,i)=>[soundTone(f,f,.40,.15,i*step,'bell'),soundTone(f/2,f/2,.32,.08,i*step),soundTone(f,f,.28,.025,i*step+.075)]);
const SOUND_LIBRARY={
 arrow:{gap:.05,layers:[soundTone(370,155,.09,.19,0,'triangle'),soundTone(740,260,.06,.06),soundNoise(1800,900,.045,.045)]},
 laser:{gap:.035,layers:[soundTone(820,240,.105,.19),soundTone(410,150,.09,.09,0,'triangle'),soundTone(1250,700,.035,.025)]},
 rifle:{gap:.075,layers:[soundNoise(2400,750,.095,.38),soundTone(145,90,.16,.36),soundNoise(1300,800,.07,.10,.055)]},
 shotgun:{gap:.16,layers:[soundNoise(1900,350,.26,.46),soundTone(98,52,.32,.44),soundNoise(1000,300,.19,.16,.12)]},
 sniper:{gap:.22,layers:[soundNoise(2900,800,.12,.38),soundTone(155,65,.28,.42),soundNoise(1700,600,.18,.13,.10),soundNoise(1000,400,.20,.07,.25)]},
 minigun:{gap:.075,layers:[soundNoise(1800,700,.08,.27),soundTone(126,104,.10,.25),soundNoise(1100,650,.04,.07,.035)]},
 hit:{gap:.12,layers:[soundNoise(1200,450,.075,.18),soundTone(155,105,.09,.13)]},
 pop:{gap:.14,layers:[soundNoise(1000,250,.15,.23),soundTone(110,65,.18,.19)]},
 hurt:{gap:.32,priority:2,layers:[soundNoise(1000,350,.22,.25),soundTone(165,105,.30,.24),soundTone(115,75,.24,.13,.09)]},
 boom:{gap:.24,priority:1,layers:[soundNoise(1600,180,.70,.49),soundTone(85,38,.7,.40),soundNoise(600,120,.65,.16,.15)]},
 ice:{gap:.28,layers:[soundNoise(2300,1000,.30,.11),...soundMelody([659,880,1047],.095)]},
 bite:{gap:.10,layers:[soundNoise(2300,350,.07,.28),soundTone(170,62,.09,.22)]},
 build:{gap:.12,layers:[soundNoise(900,300,.07,.23),soundTone(350,180,.055,.14),soundNoise(2000,700,.07,.16,.09)]},
 click:{gap:.045,layers:[soundNoise(1400,600,.035,.10),soundTone(650,410,.045,.07)]},
 level:{gap:.35,priority:2,layers:soundMelody([523,659,784,1047])},
 chest:{gap:.4,priority:1,layers:[soundNoise(1300,650,.09,.12),...soundMelody([523,659,880],.13)]},
 heal:{gap:.4,layers:soundMelody([440,587,880],.13)},
 dead:{gap:.8,priority:2,layers:soundMelody([392,330,262,196],.16)},
 revive:{gap:.4,layers:soundMelody([392,587,784],.12)},
 victory:{gap:1,priority:2,layers:soundMelody([523,659,784,1047,1319],.14)},
 boss:{gap:.7,priority:2,layers:[soundTone(110,62,.85,.3,0,'growl'),soundTone(164,82,.65,.16,.12,'bell'),soundNoise(1200,280,.8,.28)]},
 ultimate:{gap:.7,priority:2,layers:[soundTone(100,280,.75,.16,0,'growl'),soundNoise(450,1700,.7,.20),...soundMelody([294,440,587],.16)]},
 dragon:{gap:1.1,priority:2,layers:[soundTone(100,58,1.05,.32,0,'growl'),soundTone(145,85,.9,.14,.06,'growl'),soundNoise(950,350,1.10,.28)]},
 breath:{gap:.60,priority:1,layers:[soundNoise(1400,550,.75,.35),soundNoise(550,170,.7,.23),soundNoise(2200,1000,.18,.09,.18),soundNoise(1900,900,.16,.07,.39)]},
 airstrike:{gap:.6,priority:1,layers:[soundNoise(700,1900,.8,.30),soundTone(190,90,.7,.15,0,'growl')]},
 gas:{gap:.6,layers:[soundNoise(2100,1000,.75,.24),soundNoise(850,350,.25,.17),soundTone(420,320,.1,.07)]},
 tank:{gap:.5,priority:1,layers:[soundTone(65,120,.55,.34,0,'growl'),soundNoise(1500,500,.3,.3),soundNoise(2200,400,.15,.17,.25)]},
 turret:{gap:.1,layers:[soundNoise(3200,900,.05,.26),soundTone(240,110,.07,.15)]},
 slash:{gap:.12,layers:[soundNoise(4200,1500,.11,.32),soundNoise(1800,450,.045,.18,.05)]},
 chirp:{gap:12,layers:[soundTone(720,580,.10,.07)]},
 petDown:{gap:6,layers:[soundTone(320,215,.15,.08)]},
 wings:{gap:.48,layers:[soundNoise(1000,250,.32,.16)]},
 pickup:{gap:.10,layers:[soundNoise(1600,900,.05,.12),soundTone(590,590,.12,.10,.03)]},
 crateLand:{gap:.18,layers:[soundNoise(1200,400,.16,.19)]},
 grenadeThrow:{gap:.18,layers:[soundNoise(1800,1000,.045,.12),soundNoise(1600,600,.10,.08,.05)]},
 grenadeBlast:{gap:.20,priority:1,layers:[soundNoise(2200,450,.33,.32)]},
 ultImpact:{gap:.20,priority:1,layers:[soundNoise(2100,600,.22,.27)]},
 petChicken:{gap:9,layers:[soundTone(330,210,.08,.08),soundTone(390,270,.08,.05,.10)]},
 petDog:{gap:8,layers:[soundTone(180,125,.12,.08)]},
 petCat:{gap:9,layers:[soundTone(460,315,.19,.07)]},
 petParrot:{gap:10,layers:[soundTone(710,520,.07,.06)]},
 petBoar:{gap:9,layers:[soundTone(150,125,.12,.08)]},
 petMole:{gap:10,layers:[soundTone(300,210,.09,.07)]},
 mineBlast:{gap:.22,priority:1,layers:[soundNoise(1500,400,.25,.22)]},
 mineMini:{gap:.16,priority:1,layers:[soundNoise(1400,400,.17,.14)]},
 petBlast:{gap:.20,priority:1,layers:[soundNoise(1500,400,.21,.18)]},
};
function renderSoundSpec(spec,sampleRate=44100,seed=1){
 const duration=Math.min(2.5,Math.max(...spec.layers.map(l=>(Number(l.at)||0)+l.d))+.02);
 const result=new Float32Array(Math.ceil(duration*sampleRate));let state=seed||1;
 const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296*2-1;};
 for(const l of spec.layers){
  const start=Math.round((Number(l.at)||0)*sampleRate),n=Math.floor(l.d*sampleRate);let phase=0,low=0,base=0;
  for(let i=0;i<n&&start+i<result.length;i++){
   const t=i/sampleRate,u=i/n,attack=l.wave==='growl'?.045:l.wave==='bell'?.018:.01;
   const fade=Math.min(1,t/attack),release=Math.min(1,(l.d-t)/.025);
   const env=(.5-.5*Math.cos(Math.PI*fade))*Math.exp(-u*(l.wave==='growl'?3:5))*release*release;
   let value;
   if(l.noise){const cut=l.cut*Math.pow(Math.max(60,l.end)/l.cut,u),v=random();low+=(v-low)*(1-Math.exp(-6.283*cut/sampleRate));base+=(low-base)*(1-Math.exp(-6.283*65/sampleRate));value=(low-base)*2.4;}
   else{const f=l.f*Math.pow(Math.max(25,l.end)/l.f,u);phase+=6.283*f/sampleRate*(l.wave==='growl'?1+.09*Math.sin(t*73):1);
    value=l.wave==='bell'?Math.sin(phase)+.12*Math.sin(phase*2)*Math.exp(-u*5)+.035*Math.sin(phase*3)*Math.exp(-u*8):
      l.wave==='growl'?Math.sin(phase)+.24*Math.sin(phase*1.49)+.10*Math.sin(phase*2.01):Math.sin(phase);}
   result[start+i]+=value*env*l.g;
  }
 }
 // Two gentle low-pass stages, DC/sub-bass removal and a silent tail. No saturation:
 // nonlinear clipping generated extra harmonics exactly where the old mix was tiring.
 const a=1-Math.exp(-2*Math.PI*2400/sampleRate),dcA=1-Math.exp(-2*Math.PI*32/sampleRate);
 let lo1=0,lo2=0,dc=0,peak=0;
 for(let i=0;i<result.length;i++){
  lo1+=a*(result[i]-lo1);lo2+=a*(lo1-lo2);dc+=dcA*(lo2-dc);
  const tail=Math.min(1,(result.length-1-i)/(sampleRate*.018));
  result[i]=(lo2-dc)*tail*tail*.72;peak=Math.max(peak,Math.abs(result[i]));
 }
 // Only attenuate peaks; never normalize quiet UI/foley up to a gunshot.
 if(peak>.48)for(let i=0;i<result.length;i++)result[i]*=.48/peak;
 return result;
}
const SOUND_MIX={weapon:{limit:3,gain:.82},precision:{limit:5,gain:.82},impact:{limit:3,gain:.60},blast:{limit:2,gain:.65},cue:{limit:2,gain:.88},foley:{limit:3,gain:.72},pet:{limit:1,gain:.52},feedback:{limit:2,gain:1.10},action:{limit:3,gain:1.10}};
function soundGroup(name,spec){
 if(name==='pickup'||name==='chest')return 'feedback';
 if(['grenadeBlast','ultImpact','ultimate','airstrike','gas','tank'].includes(name))return 'action';
 if(['petChicken','petDog','petCat','petParrot','petBoar','petMole','chirp','petDown'].includes(name))return 'pet';
 if(['rifle','shotgun','sniper','minigun','turret','arrow','laser'].includes(name))return 'weapon';
 if(['hit','pop','bite','slash'].includes(name))return 'impact';
 if(['boom','breath','airstrike','gas','tank','grenadeBlast','ultImpact','mineBlast','mineMini','petBlast'].includes(name)||name.startsWith('noise:'))return 'blast';
 if(spec.priority||['heal','revive','ice'].includes(name)||name.startsWith('melody:'))return 'cue';
 return 'foley';
}
const soundCache=new Map(),soundCooldowns=new Map(),soundVariations=new Map();
const soundBufferPeaks=new WeakMap();
function soundBufferPeak(buffer){
 if(soundBufferPeaks.has(buffer))return soundBufferPeaks.get(buffer);
 let peak=.001;for(const x of buffer.getChannelData(0))peak=Math.max(peak,Math.abs(x));
 soundBufferPeaks.set(buffer,peak);return peak;
}
function refreshSoundFocus(now){
 const foreground=[...audioVoices].some(v=>v.group==='feedback'||v.group==='action');
 for(const voice of audioVoices)voice.focus?.(foreground,now);
}
function nextSoundVariant(name,count){
 let state=soundVariations.get(name);
 if(!state||state.count!==count){
  let seed=0x175b31;for(const c of name)seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;
  state={count,seed:seed||1,bag:[],last:-1};
  if(!soundVariations.has(name)&&soundVariations.size>=128)soundVariations.delete(soundVariations.keys().next().value);
  soundVariations.set(name,state);
 }
 if(!state.bag.length){
  state.bag=Array.from({length:count},(_,i)=>i);
  for(let i=count-1;i>0;i--){let s=state.seed;s^=s<<13;s^=s>>>17;s^=s<<5;state.seed=s>>>0;const j=state.seed%(i+1);[state.bag[i],state.bag[j]]=[state.bag[j],state.bag[i]];}
  if(count>1&&state.bag.at(-1)===state.last)[state.bag[0],state.bag[count-1]]=[state.bag[count-1],state.bag[0]];
 }
 state.last=state.bag.pop();return state.last;
}
function setSoundCooldown(name,until){
 if(!soundCooldowns.has(name)&&soundCooldowns.size>=128)soundCooldowns.delete(soundCooldowns.keys().next().value);
 soundCooldowns.set(name,until);
}
function playSound(name,x=null,custom=null,gain=1,useRecording=true,role=null){
 if(!gameAudioAllowed())return false;
 const spec=custom||SOUND_LIBRARY[name];if(!spec)return false;
 try{
  const a=audio(),now=a.currentTime;
  const precision=role==='precision'&&name==='sniper',cooldown=precision?'player:sniper':name;
  if(now<(soundCooldowns.get(cooldown)||-1))return false;
  // A crowd's hits and deaths share a short window; alternating names must not
  // turn individually limited contacts into an uninterrupted noise layer.
  const contact=name==='hit'||name==='pop';
  if(contact&&now<(soundCooldowns.get('enemy-contact')??-1))return false;
  // Separate budgets stop volleys, impacts and fanfares building into a wall of sound.
  const group=precision?'precision':role==='action'?'action':soundGroup(name,spec),mix=SOUND_MIX[group],weaponVoice=group==='weapon'||precision;
  const blastHit=['boom','mineBlast','mineMini','petBlast'].includes(name);
  if(group==='pet'&&now<(soundCooldowns.get('pet-voice')??-1))return false;
  if(blastHit&&now<(soundCooldowns.get('blast-transient')??-1))return false;
  const peers=[...audioVoices].filter(v=>v.group===group);
  if(peers.length>=mix.limit){const lower=peers.find(v=>v.priority<(spec.priority||0));if(!lower)return false;lower.stop();}
  // Absolute backstop, in addition to the tighter category budgets.
  if(audioVoices.size>=24){const quiet=[...audioVoices].find(v=>v.priority<(spec.priority||0));if(!quiet)return false;quiet.stop();}
  // Only de-duplicate player events; gameplay/ultimate timings own the fire cadence.
  setSoundCooldown(cooldown,now+(precision?.035:(spec.gap||.06)));
  if(contact)setSoundCooldown('enemy-contact',now+.085);
  if(group==='pet')setSoundCooldown('pet-voice',now+5);
  if(blastHit)setSoundCooldown('blast-transient',now+.12);
  // Independent audio RNG; shuffle every available take, no repeat at bag boundaries.
  const count=useRecording&&!custom&&typeof recordedSoundVariantCount==='function'?(recordedSoundVariantCount(name,useRecording==='previous')||3):3;
  const variant=nextSoundVariant((precision?'player:':'')+(useRecording==='previous'?'previous:':'')+name,count);
  const key=(useRecording==='previous'?'previous:':useRecording&&!custom?'recorded:':'synth:')+name+':'+variant+':'+a.sampleRate;
  let buffer=soundCache.get(key);
  if(!buffer){
   if(useRecording&&!custom&&typeof recordedSoundBuffer==='function')buffer=recordedSoundBuffer(a,name,variant,useRecording==='previous');
   if(!buffer){const pcm=renderSoundSpec(spec,a.sampleRate,17+variant*7919);buffer=a.createBuffer(1,pcm.length,a.sampleRate);buffer.getChannelData(0).set(pcm);}
   if(soundCache.size>=72)soundCache.delete(soundCache.keys().next().value);soundCache.set(key,buffer);}
  const source=a.createBufferSource(),level=a.createGain();source.buffer=buffer;
  source.playbackRate.value=weaponVoice?[1,.991,1.006,.997,1.010,.995,1.003,.989][variant%8]:.985+(variant%3)*.015;
  const crowd=precision||group==='feedback'||group==='action'?1:1/Math.sqrt(1+audioVoices.size*.16);
  // Explicit peak reservation replaces the compressor. Quiet effects are not boosted.
  // Include all live voices: priorities and source order cannot overbook the bus.
  const reserved=[...audioVoices].reduce((sum,v)=>sum+(v.peakBudget||0),0);
  const takeGain=weaponVoice?[1,.975,.988,.960,.993,.970,.982,.966][variant%8]:1;
  const requested=Math.max(0,Math.min(1,gain))*.40*mix.gain*crowd*takeGain*(name==='sniper'?.55:1);
  // Leave .18 of the shared peak budget available for immediate pickup feedback.
  // Foley/cue saturation must not silently swallow a successful collection.
  const ceiling=precision||group==='feedback'?.90:group==='action'?.72:.52,peak=soundBufferPeak(buffer);
  const nominalGain=Math.min(requested,Math.max(0,ceiling-reserved)/peak);
  level.gain.value=nominalGain;source.connect(level);
  let pan=null;if(a.createStereoPanner&&Number.isFinite(x)&&typeof P!=='undefined'){
   pan=a.createStereoPanner();pan.pan.value=Math.max(-.65,Math.min(.65,(x-P.x)/450));level.connect(pan);pan.connect(audioMaster);
  }else level.connect(audioMaster);
  let focusTarget=nominalGain,started=false,cleaned=false;
  const voice={priority:spec.priority||0,group,peakBudget:nominalGain*peak,
   focus(active,time){
    const duck=active?(weaponVoice?.42:['impact','foley','blast','pet'].includes(group)?.72:1):1,target=nominalGain*duck;
    if(target===focusTarget)return;const falling=target<focusTarget;focusTarget=target;
    if(started&&level.gain.setTargetAtTime){level.gain.cancelScheduledValues?.(time);level.gain.setTargetAtTime(target,time,falling?.008:.090);}
    else level.gain.value=target;
   },stop(){try{source.stop();}catch(_){}clean();}};
  const clean=()=>{if(cleaned)return;cleaned=true;audioVoices.delete(voice);source.disconnect();level.disconnect();pan?.disconnect();refreshSoundFocus(a.currentTime);};
  source.onended=clean;audioVoices.add(voice);refreshSoundFocus(now);source.start();started=true;source.stop(now+buffer.duration/source.playbackRate.value+.02);return true;
 }catch(_){return false;}
}
function playDesignedTone(f,d,ty,v,slide){
 // Compatibility routes for older callers: regular gameplay uses the new bank,
 // not the old oscillator/noise recipes retained solely for QA comparison.
 return playSound(f>=800?'chirp':'click',null,null,Math.min(1,v/.065));
}
function playDesignedNoise(d,v,cut,sweep){
 return playSound(cut<900?'boom':'slash',null,null,Math.min(1,v/.1));
}
function playDesignedChain(notes,ty,v){
 return playSound('level',null,null,Math.min(1,v/.065));
}
