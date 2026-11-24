// Original heavy sniper design. Reference informed only broad timing/timbre goals.
// No reference samples, spectral envelopes, impulse responses or waveforms are used.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {wav,metrics,RATE}=require('./design-original-weapons.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function render(name,take=0){
 if(name!=='sniper'||!Number.isInteger(take)||take<0||take>=8)throw Error('Invalid projectile design');
 const sr=RATE*2,duration=.68,n=Math.round(duration*sr),seed=0x178dc31+take*7919;
 let state=seed>>>0;const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296*2-1;};
 const raw=Float64Array.from({length:n},random);
 function lp(input,hz){let v=0;const k=1-Math.exp(-2*Math.PI*hz/sr),out=new Float64Array(n);for(let i=0;i<n;i++){v+=k*(input[i]-v);out[i]=v;}return out;}
 const sub=lp(raw,48),low=lp(raw,340),mid=lp(raw,1550),high=lp(raw,7000),x=new Float64Array(n);
 const tint=1+(take-3.5)*.011,decay=.086+(take%4)*.003;
 for(let i=0;i<n;i++){
  const t=i/sr,attack=1-Math.exp(-t/.0008);
  // Audible muzzle attack followed by turbulent pressure, not a sub-bass sine drum.
  const crack=(high[i]-mid[i])*1.18*Math.exp(-t/.007);
  const report=(mid[i]-low[i])*1.9*Math.exp(-t/.040);
  const weight=(low[i]-sub[i])*8.5*(.62+.38*(1-Math.exp(-t/.018)))*Math.exp(-t/decay);
  // Brief falling projectile edge; ends before the pressure tail and bolt.
  const phase=2*Math.PI*(175*t+360*.019*(1-Math.exp(-t/.019)))*tint;
  const projectile=.14*Math.sin(phase)*Math.exp(-t/.021);
  x[i]=attack*(crack+report+weight+projectile);
 }
 function contact(at,gain,decay){for(let i=Math.ceil(at*sr);i<n;i++){const t=i/sr-at;if(t>.065)break;
  x[i]+=gain*(mid[i]-low[i])*(1-Math.exp(-t/.001))*Math.exp(-t/decay)*Math.min(1,(.065-t)/.010);
 }}
 // Quiet mechanism below the shot, not a second delayed report.
 contact(.278+take*.001,.25,.006);contact(.324+take*.001,.12,.006);contact(.393+take*.001,.31,.008);
 const dc=lp(x,48);for(let i=0;i<n;i++)x[i]-=dc[i];
 const radius=64,kernel=[];let sum=0;
 for(let j=-radius;j<=radius;j++){const z=2*12500/sr*j,v=(z?Math.sin(Math.PI*z)/(Math.PI*z):1)*(.42+.5*Math.cos(Math.PI*j/radius)+.08*Math.cos(2*Math.PI*j/radius));kernel.push(v);sum+=v;}
 const output=new Float64Array(Math.round(duration*RATE));let peak=0,energy=0;
 for(let i=0;i<output.length;i++){
  let v=0;for(let j=-radius;j<=radius;j++){const at=i*2+j;if(at>=0&&at<n)v+=x[at]*kernel[j+radius]/sum;}
  v*=Math.sin(Math.max(0,Math.min(1,i/(RATE*.0007),(output.length-1-i)/(RATE*.060)))*Math.PI/2)**2;
  output[i]=v;peak=Math.max(peak,Math.abs(v));energy+=v*v;
 }
 const gain=Math.min(.46/peak,.064/Math.sqrt(energy/output.length)),pcm=Buffer.alloc(output.length*2);
 for(let i=0;i<output.length;i++)pcm.writeInt16LE(Math.round(output[i]*gain*32767),i*2);
 return {pcm,seed,gain,parameters:{duration,oversample:2,pressureDecay:decay,lowCut:48,antiAlias:12500,tint,referenceAudioUsed:false}};
}
function main(){
 const root=path.join(__dirname,'..'),dir=path.join(root,'assets/audio'),file=path.join(dir,'manifest.json'),m=JSON.parse(fs.readFileSync(file));
 if(!m.previousProjectileVersion){m.previousWeapons.sniper=m.groups.sniper;m.previousProjectileVersion='0.177';}
 const generatorSha256=hash(fs.readFileSync(__filename)),report=[];
 m.groups.sniper=Array.from({length:8},(_,take)=>{
  const {pcm,seed,gain,parameters}=render('sniper',take),file='sniper-'+take+'-v0178.wav',data=wav(pcm),stats=metrics(pcm);
  fs.writeFileSync(path.join(dir,file),data);report.push({name:'sniper',take,...stats});
  return {file,sha256:hash(data),sampleRate:RATE,...stats,source:'project-original-projectile',design:'heavy-projectile-v0178',generator:'tools/design-projectile-audio.cjs',generatorSha256,seed,take,parameters,gain,components:[],provenance:'Original equations and seeded noise; no input recordings or extracted reference data.'};
 });
 m.version=9;fs.writeFileSync(file,JSON.stringify(m,null,2)+'\n');fs.writeFileSync(path.join(root,'audit/audio-v0178.json'),JSON.stringify(report,null,2)+'\n');
 console.log('Generated eight heavy sniper variations; all other active cues preserved.');
}
module.exports={render};if(require.main===module)main();
