// Original 0.175 comfort/variation pass. No input recordings or external DSP.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {wav,metrics,RATE,DESIGNS:GUNS}=require('./design-original-weapons.cjs'),SR=RATE*2;
const CUES={
 petChicken:{duration:.23,peak:.12},petDog:{duration:.18,peak:.13},petCat:{duration:.25,peak:.11},
 petParrot:{duration:.22,peak:.10},petBoar:{duration:.20,peak:.12},petMole:{duration:.17,peak:.10},
 chirp:{duration:.16,peak:.085},petDown:{duration:.19,peak:.12},
 pickup:{duration:.13,peak:.13},chest:{duration:.23,peak:.19},
 mineBlast:{duration:.27,peak:.28},mineMini:{duration:.18,peak:.18},petBlast:{duration:.22,peak:.22},
 boom:{duration:.37,peak:.34},bite:{duration:.08,peak:.12},build:{duration:.14,peak:.13},slash:{duration:.11,peak:.11}
};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function random(seed){let s=seed>>>0;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296*2-1;};}
function lowpass(x,hz){
 const y=new Float64Array(x.length),a=1-Math.exp(-2*Math.PI*hz/SR);let s=0;
 for(let i=0;i<x.length;i++){s+=a*(x[i]-s);y[i]=s;}return y;
}
function renderGun(name,take=0){
 const base=GUNS[name];if(!base||!Number.isInteger(take)||take<0||take>7)throw Error('Invalid design');
 const seed=0x175bc031+Object.keys(GUNS).indexOf(name)*1009+take*7919,rng=random(seed);
 const v=(take-3.5)/3.5,d={...base,duration:base.duration*(.965+take*.004),
  body:base.body*(1+v*.11),decay:base.decay*(1+v*.10),crack:base.crack*(1-v*.12),bolt:base.bolt*(1+v*.17)};
 const n=Math.round(d.duration*SR),noise=Float64Array.from({length:n},()=>rng());
 const high=lowpass(noise,7200+take*170),mid=lowpass(noise,d.body),low=lowpass(noise,280),sub=lowpass(noise,85);
 const x=new Float64Array(n),variation=1+(take-3.5)*.013;
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
  for(const [at,amp] of [[d.bolt,.027+take*.0017],[d.bolt+.026+take*.001,.014]]){
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

function renderCue(name,take=0){
 const d=CUES[name];if(!d||!Number.isInteger(take)||take<0||take>2)throw Error('Invalid cue');
 const seed=0x175ac331+Object.keys(CUES).indexOf(name)*1013+take*7919,rng=random(seed);
 const n=Math.round(d.duration*RATE),x=new Float64Array(n),noise=new Float64Array(n);let lo=0,base=0;
 for(let i=0;i<n;i++){lo+=.24*(rng()-lo);base+=.035*(lo-base);noise[i]=lo-base;}
 function tap(at,decay,gain){for(let i=Math.round(at*RATE);i<n;i++){const t=i/RATE-at;
  if(t>=0)x[i]+=noise[i]*gain*(1-Math.exp(-t/.0018))*Math.exp(-t/decay);
 }}
 function syllable(at,duration,f,end,gain){
  let phase=0;
  for(let i=Math.round(at*RATE);i<Math.min(n,(at+duration)*RATE);i++){
   const t=i/RATE-at;if(t<0)continue;const u=t/duration;
   const hz=(f+(end-f)*u)*(1+(take-1)*.025);phase+=2*Math.PI*hz/RATE;
   const env=Math.sin(Math.PI*u)**2;
   x[i]+=gain*env*(Math.sin(phase)+.25*Math.sin(phase*2.01)+.10*Math.sin(phase*3.02)+noise[i]*.07);
  }
 }
 if(name==='petChicken'){syllable(0,.073,330,210,.7);syllable(.10,.075,390,270,.5);}
 else if(name==='chirp'){syllable(0,.07,720,580,.5);syllable(.085,.045,650,530,.25);}
 else if(name==='petDog'){syllable(0,.11,180,125,.65);tap(.015,.028,.18);}
 else if(name==='petCat'){syllable(.008,.19,460,315,.5);}
 else if(name==='petParrot'){syllable(0,.068,710,520,.45);syllable(.10,.07,570,680,.30);}
 else if(name==='petBoar'){syllable(0,.11,150,125,.45);tap(.014,.03,.45);}
 else if(name==='petMole'){syllable(.012,.09,300,210,.45);}
 else if(name==='petDown'){syllable(0,.115,320,215,.4);}
 else if(name==='pickup'||name==='chest'){
  // Material contact: cloth grip, latch and a settling tap. No musical notes or coin cascade.
  tap(0,.008,.70);tap(.024+take*.002,.014,.27);if(name==='chest')tap(.082,.018,.40);
 }else if(['mineBlast','mineMini','petBlast','boom'].includes(name)){
  const mini=name==='mineMini',decay=mini?.022:name==='boom'?.05:.035;
  tap(0,.005,.40);tap(.005,decay,.85);let body=0;
  for(let i=0;i<n;i++){const t=i/RATE;body+=.065*(noise[i]-body);x[i]+=body*2.6*Math.exp(-t/decay)*(1-Math.exp(-t/.002));}
  tap(mini?.041:.062,.009,.12);
 }else if(name==='slash'){
  for(let i=0;i<n;i++)x[i]=noise[i]*Math.sin(Math.PI*i/n)**3*.32;
 }else {tap(0,.009,.70);if(name==='build')tap(.046,.011,.20);}
 let dc=0,peak=0,energy=0;
 for(let i=0;i<n;i++){
  dc+=.005*(x[i]-dc);x[i]-=dc;
  const edge=Math.max(0,Math.min(1,i/(RATE*.0015),(n-1-i)/(RATE*.016)));
  x[i]*=Math.sin(edge*Math.PI/2)**2;peak=Math.max(peak,Math.abs(x[i]));energy+=x[i]*x[i];
 }
 const gain=Math.min(d.peak/peak,.034/Math.sqrt(energy/n)),pcm=Buffer.alloc(n*2);
 for(let i=0;i<n;i++)pcm.writeInt16LE(Math.round(x[i]*gain*32767),i*2);
 pcm.writeInt16LE(0,0);pcm.writeInt16LE(0,pcm.length-2);
 return {pcm,seed,parameters:{...d},gain};
}
function render(name,take){return Object.hasOwn(GUNS,name)?renderGun(name,take):renderCue(name,take);}
function main(){
 const root=path.join(__dirname,'..'),dir=path.join(root,'assets/audio'),file=path.join(dir,'manifest.json');
 const m=JSON.parse(fs.readFileSync(file,'utf8')),names=[...Object.keys(GUNS),...Object.keys(CUES)],report=[];
 if(!m.previousComfortVersion){for(const name of names)if(m.groups[name])m.previousWeapons[name]=m.groups[name];m.previousComfortVersion='0.174';}
 const generatorSha256=hash(fs.readFileSync(__filename));
 for(const name of names)m.groups[name]=Array.from({length:Object.hasOwn(GUNS,name)?8:3},(_,take)=>{
  const {pcm,seed,parameters,gain}=render(name,take),file=name.toLowerCase()+'-'+take+'-v0175.wav',data=wav(pcm),stats=metrics(pcm);
  fs.writeFileSync(path.join(dir,file),data);report.push({name,take,...stats});
  return {file,sha256:hash(data),sampleRate:RATE,...stats,source:'project-original-comfort',design:'varied-dry-comfort-v0175',
   generator:'tools/design-comfort-audio.cjs',generatorSha256,seed,take,parameters,gain,components:[],provenance:'Equations and seeded noise only; no audio samples.'};
 });
 m.version=6;m.eventCount=Object.keys(m.groups).length;
 fs.writeFileSync(file,JSON.stringify(m,null,2)+'\n');
 fs.writeFileSync(path.join(root,'audit/audio-v0175.json'),JSON.stringify(report,null,2)+'\n');
 console.log('Generated '+report.length+' clips; '+m.eventCount+' active sound categories; no reference audio.');
}
module.exports={render,GUNS,CUES};if(require.main===module)main();
