// Original, deterministic weapon design. No input audio, reference decoding,
// convolution IRs, waveform matching, or third-party synthesis libraries.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const RATE=44100,SR=RATE*2;
const DESIGNS={
 rifle:  {duration:.19,peak:.40,weight:.64,decay:.023,crack:1.0,bolt:.032,body:1850},
 shotgun:{duration:.34,peak:.44,weight:1.0,decay:.046,crack:.82,bolt:.087,body:1380},
 sniper: {duration:.29,peak:.46,weight:.82,decay:.036,crack:1.15,bolt:.071,body:2280},
 minigun:{duration:.12,peak:.30,weight:.48,decay:.016,crack:.90,bolt:.026,body:2070},
 turret: {duration:.15,peak:.25,weight:.50,decay:.019,crack:.80,bolt:.029,body:1750}
};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function random(seed){let s=seed>>>0;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296*2-1;};}
function lowpass(x,hz){
 const y=new Float64Array(x.length),a=1-Math.exp(-2*Math.PI*hz/SR);let s=0;
 for(let i=0;i<x.length;i++){s+=a*(x[i]-s);y[i]=s;}return y;
}
function render(name,take=0){
 const d=DESIGNS[name];if(!d||!Number.isInteger(take)||take<0||take>2)throw Error('Invalid design');
 const seed=0x731bc031+Object.keys(DESIGNS).indexOf(name)*1009+take*7919,rng=random(seed);
 const n=Math.round(d.duration*SR),noise=Float64Array.from({length:n},()=>rng());
 const high=lowpass(noise,10500),mid=lowpass(noise,d.body),low=lowpass(noise,280),sub=lowpass(noise,85);
 const x=new Float64Array(n),variation=1+(take-1)*.032;
 const modes=[1540,2383,3917].map(f=>({f:f*variation,phase:(rng()+1)*Math.PI}));
 for(let i=0;i<n;i++){
  const t=i/SR,attack=1-Math.exp(-t/.00035);
  // A short pressure discontinuity, not a descending sine / bass drum.
  const pressure=(Math.exp(-t/.0018)-.3*Math.exp(-t/.006))*d.weight;
  const crack=(high[i]-mid[i])*Math.exp(-t/.0048)*d.crack;
  // Broad stochastic body; no resonant room, comb echo or sustained hiss.
  const body=(mid[i]-low[i])*Math.exp(-t/(d.decay*variation))*2.1*d.weight;
  const weight=(low[i]-sub[i])*Math.exp(-t/.017)*1.5*d.weight;
  let mechanism=0;
  for(const [at,amp] of [[d.bolt,.037],[d.bolt+.029,.017]]){
   const u=t-at;if(u<0)continue;
   const env=(1-Math.exp(-u/.0006))*Math.exp(-u/.0038);
   for(const m of modes)mechanism+=amp*Math.sin(2*Math.PI*m.f*u+m.phase)*env;
  }
  x[i]=attack*(pressure+crack+body+weight)+mechanism;
 }
 // Remove subsonic/DC content before a 129-tap anti-alias FIR and 2x decimation.
 const dc=lowpass(x,55);for(let i=0;i<n;i++)x[i]-=dc[i];
 const radius=64,kernel=[];let total=0;
 for(let j=-radius;j<=radius;j++){
  const z=2*15500/SR*j,sinc=z===0?1:Math.sin(Math.PI*z)/(Math.PI*z);
  const win=.42+.5*Math.cos(Math.PI*j/radius)+.08*Math.cos(2*Math.PI*j/radius);
  const v=sinc*win;kernel.push(v);total+=v;
 }
 const y=new Float64Array(Math.round(d.duration*RATE));
 for(let i=0;i<y.length;i++){
  let v=0;for(let j=-radius;j<=radius;j++){const at=i*2+j;if(at>=0&&at<n)v+=x[at]*kernel[j+radius]/total;}
  const t=i/RATE,edge=Math.min(1,t/.0003,(d.duration-t)/.012);
  y[i]=v*Math.sin(Math.max(0,edge)*Math.PI/2)**2;
 }
 let peak=0,energy=0;for(const v of y){peak=Math.max(peak,Math.abs(v));energy+=v*v;}
 const gain=Math.min(d.peak/peak,.08/Math.sqrt(energy/y.length));
 const pcm=Buffer.alloc(y.length*2);for(let i=0;i<y.length;i++)pcm.writeInt16LE(Math.round(y[i]*gain*32767),i*2);
 pcm.writeInt16LE(0,0);pcm.writeInt16LE(0,pcm.length-2);
 return {pcm,seed,parameters:{...d},gain};
}
function wav(pcm){
 const b=Buffer.alloc(44+pcm.length);b.write('RIFF');b.writeUInt32LE(36+pcm.length,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);
 b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(RATE,24);b.writeUInt32LE(RATE*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(pcm.length,40);pcm.copy(b,44);return b;
}
function metrics(pcm){
 let peak=0,energy=0,tail=0,mean=0;const count=pcm.length/2;
 for(let i=0;i<count;i++){const v=pcm.readInt16LE(i*2)/32768;peak=Math.max(peak,Math.abs(v));energy+=v*v;mean+=v;if(i>count*.75)tail+=v*v;}
 return {duration:count/RATE,peak,rms:Math.sqrt(energy/count),mean:mean/count,tailEnergyRatio:tail/energy};
}
function main(){
 const root=path.join(__dirname,'..'),dir=path.join(root,'assets/audio'),file=path.join(dir,'manifest.json');
 const m=JSON.parse(fs.readFileSync(file,'utf8')),report=[];
 const generatorSha256=hash(fs.readFileSync(__filename));
 for(const name of Object.keys(DESIGNS))m.groups[name]=[0,1,2].map(take=>{
  const {pcm,seed,parameters,gain}=render(name,take),file=`${name}-${take}-v0173.wav`,data=wav(pcm),stats=metrics(pcm);
  fs.writeFileSync(path.join(dir,file),data);report.push({name,take,...stats});
  return {file,sha256:hash(data),sampleRate:RATE,...stats,source:'project-original-synthesis',design:'original-dry-weapons-v0173',
   generator:'tools/design-original-weapons.cjs',generatorSha256,seed,take,parameters,gain,components:[],
   provenance:'Generated from equations and seeded noise; no source audio or reference fragments.'};
 });
 // Intentionally retain 0.171 as the comparison baseline, NEVER the MP3-based 0.172 weapons.
 if(m.previousCombatVersion!=='0.171')throw Error('Unexpected comparison baseline');
 m.version=4;m.releaseStatus='no-user-reference-audio';m.license='original-generated-weapons-and-credited-CC0';
 m.eventCount=Object.keys(m.groups).length;
 fs.writeFileSync(file,JSON.stringify(m,null,2)+'\n');
 fs.mkdirSync(path.join(root,'audit'),{recursive:true});
 fs.writeFileSync(path.join(root,'audit/audio-v0173.json'),JSON.stringify(report,null,2)+'\n');
 // Offline audition, not a browser capture. Nominal production gains, no loudness boost.
 const preview=new Float64Array(RATE*12);
 for(const [section,name,gap,count] of [[0,'rifle',.32,5],[1,'shotgun',.78,3],[2,'sniper',.78,3],[3,'minigun',.09,18],[4,'turret',.20,6]]){
  for(let i=0;i<count;i++){
   const {pcm}=render(name,i%3),at=Math.round((section*2.4+.10+i*gap)*RATE);
   for(let j=0;j<pcm.length/2&&at+j<preview.length;j++)preview[at+j]+=pcm.readInt16LE(j*2)/32768*.40*.82*.72;
  }
 }
 const bytes=Buffer.alloc(preview.length*2);for(let i=0;i<preview.length;i++){if(Math.abs(preview[i])>.8)throw Error('Preview overload');bytes.writeInt16LE(Math.round(preview[i]*32767),i*2);}
 fs.writeFileSync(path.join(root,'audit/weapon-preview-v0173.wav'),wav(bytes));
 console.log('Generated 15 original weapon clips across 5 families. No source audio read.');
}
module.exports={render,wav,metrics,DESIGNS,RATE};if(require.main===module)main();
