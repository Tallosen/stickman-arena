// Short original action cues. No input recordings, IRs or external libraries.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {wav,metrics,RATE}=require('./design-original-weapons.cjs');
const DESIGNS={pickup:{duration:.19,peak:.16},chest:{duration:.34,peak:.23},crateLand:{duration:.20,peak:.19},
 grenadeThrow:{duration:.23,peak:.19},grenadeBlast:{duration:.40,peak:.38},ultimate:{duration:.48,peak:.28},ultImpact:{duration:.29,peak:.32}};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function render(name,take=0){
 const d=DESIGNS[name];if(!d||!Number.isInteger(take)||take<0||take>2)throw Error('Invalid action design');
 const seed=0x174ab391+Object.keys(DESIGNS).indexOf(name)*1499+take*7919;let state=seed>>>0;
 const rnd=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296*2-1;};
 const n=Math.round(d.duration*RATE),x=new Float64Array(n),noise=new Float64Array(n);let lo=0,sub=0;
 for(let i=0;i<n;i++){lo+=.39*(rnd()-lo);sub+=.023*(lo-sub);noise[i]=lo-sub;}
 const pitch=1+(take-1)*.018;
 function pluck(at,hz,decay,amp){
  for(let i=Math.round(at*RATE);i<n;i++){const t=i/RATE-at;if(t<0)continue;
   const e=(1-Math.exp(-t/.0025))*Math.exp(-t/decay),p=2*Math.PI*hz*pitch*t;
   x[i]+=amp*e*(Math.sin(p)+.14*Math.sin(p*2.003)*Math.exp(-t/.015));
  }
 }
 function tap(at,decay,amp){for(let i=Math.round(at*RATE);i<n;i++){
  const t=i/RATE-at;if(t>=0)x[i]+=amp*noise[i]*(1-Math.exp(-t/.001))*Math.exp(-t/decay);
 }}
 function air(at,dur,amp){for(let i=Math.round(at*RATE);i<Math.min(n,(at+dur)*RATE);i++){
  const t=(i/RATE-at)/dur;if(t>=0)x[i]+=noise[i]*Math.sin(Math.PI*t)**3*amp;
 }}
 if(name==='pickup'||name==='chest'){
  // A latch and one compact confirmation, not a coin cascade / full reward jingle.
  tap(0,.007,.6);pluck(.008,720,.016,.2);pluck(.044,590,.032,.32);
  if(name==='chest'){tap(.036,.009,.20);pluck(.10,885,.045,.25);}
 }else if(name==='crateLand'){
  tap(.004,.021,.85);tap(.039,.012,.22);pluck(.005,310,.010,.13);
 }else if(name==='grenadeThrow'){
  // Pin/lever then a brief movement swish. No explosion or pitched reward cue at release.
  tap(0,.006,.45);pluck(.003,1450,.005,.20);tap(.030,.006,.24);air(.048,.12,.21);
 }else if(name==='grenadeBlast'||name==='ultImpact'){
  const impact=name==='ultImpact';tap(0,.008,.90);tap(.009,impact?.031:.048,1.15);
  // Aperiodic pressure body. No oscillating sub-bass, growl or delayed room tail.
  let body=0;for(let i=0;i<n;i++){
   const t=i/RATE;body+=.05*(noise[i]-body);
   x[i]+=body*Math.exp(-t/(impact?.034:.058))*(1-Math.exp(-t/.0015))*3;
  }
  tap(impact?.052:.082,.012,.16);
  if(impact)pluck(.019,740,.022,.10);
 }else if(name==='ultimate'){
  // Short intake -> restrained harmonic release, no siren, growl or long fanfare.
  air(0,.13,.20);pluck(.080,370,.075,.30);pluck(.104,555,.067,.18);
  pluck(.125,740,.058,.12);tap(.086,.013,.14);
 }
 // Remove DC, round edges, then attenuate only. No compressor or reverb.
 let dc=0,peak=0,energy=0;
 for(let i=0;i<n;i++){
  dc+=.0038*(x[i]-dc);x[i]-=dc;
  const edge=Math.max(0,Math.min(1,i/(RATE*.0015),(n-1-i)/(RATE*.020)));
  x[i]*=Math.sin(edge*Math.PI/2)**2;peak=Math.max(peak,Math.abs(x[i]));energy+=x[i]*x[i];
 }
 const gain=Math.min(d.peak/peak,.06/Math.sqrt(energy/n)),pcm=Buffer.alloc(n*2);
 for(let i=0;i<n;i++)pcm.writeInt16LE(Math.round(x[i]*gain*32767),i*2);
 pcm.writeInt16LE(0,0);pcm.writeInt16LE(0,pcm.length-2);
 return {pcm,seed,parameters:{...d},gain};
}
function main(){
 const root=path.join(__dirname,'..'),dir=path.join(root,'assets/audio'),file=path.join(dir,'manifest.json');
 const m=JSON.parse(fs.readFileSync(file,'utf8')),report=[];
 if(!m.previousEffectsVersion){for(const name of ['chest','ultimate'])m.previousWeapons[name]=m.groups[name];m.previousEffectsVersion='0.173';}
 const generatorSha256=hash(fs.readFileSync(__filename));
 for(const name of Object.keys(DESIGNS))m.groups[name]=[0,1,2].map(take=>{
  const {pcm,seed,parameters,gain}=render(name,take),file=`${name.toLowerCase()}-${take}-v0174.wav`,data=wav(pcm),stats=metrics(pcm);
  fs.writeFileSync(path.join(dir,file),data);report.push({name,take,...stats});
  return {file,sha256:hash(data),sampleRate:RATE,...stats,source:'project-original-effects',design:'short-action-cues-v0174',
   generator:'tools/design-action-audio.cjs',generatorSha256,seed,take,parameters,gain,components:[],provenance:'Generated from equations and seeded noise; no input recordings.'};
 });
 m.version=5;m.license='original-generated-cues-and-credited-CC0';m.eventCount=Object.keys(m.groups).length;
 fs.writeFileSync(file,JSON.stringify(m,null,2)+'\n');fs.writeFileSync(path.join(root,'audit/audio-v0174.json'),JSON.stringify(report,null,2)+'\n');
 const preview=new Float64Array(RATE*10.5);
 for(const [section,name] of Object.keys(DESIGNS).entries()){
  const {pcm}=render(name,0),gain=name==='pickup'?.75:name==='ultimate'?.85:name==='ultImpact'?.75:1;
  const group=['grenadeBlast','ultImpact'].includes(name)?.78:['chest','ultimate'].includes(name)?.88:.72;
  const at=Math.round((section*1.5+.15)*RATE);
  for(let i=0;i<pcm.length/2;i++)preview[at+i]+=pcm.readInt16LE(i*2)/32768*.40*group*.72*gain;
 }
 const out=Buffer.alloc(preview.length*2);for(let i=0;i<preview.length;i++)out.writeInt16LE(Math.round(preview[i]*32767),i*2);
 fs.writeFileSync(path.join(root,'audit/action-preview-v0174.wav'),wav(out));
 console.log('Generated 21 original action cues; 7 groups; existing weapons unchanged.');
}
module.exports={render,DESIGNS};if(require.main===module)main();
