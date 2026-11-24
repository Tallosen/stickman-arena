// 0.176: recognisable precision rifle and readable material pickup cues.
// Original equations/seeded noise only; no audio recordings or convolution IRs.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {wav,metrics,RATE}=require('./design-original-weapons.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function render(name,take=0){
 const sniper=name==='sniper',count=sniper?8:3;
 if(!['sniper','pickup','chest'].includes(name)||!Number.isInteger(take)||take<0||take>=count)throw Error('Invalid precision design');
 const sr=RATE*2,duration=sniper?.44+take*.002:name==='chest'?.25:.19,n=Math.round(duration*sr);
 const seed=0x176b183+(sniper?0:name==='pickup'?9001:18001)+take*7919;let state=seed>>>0;
 const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296*2-1;};
 const noise=Float64Array.from({length:n},()=>random());
 function lowpass(input,hz){const y=new Float64Array(n),a=1-Math.exp(-2*Math.PI*hz/sr);let low=0;for(let i=0;i<n;i++){low+=a*(input[i]-low);y[i]=low;}return y;}
 const air=lowpass(noise,7600),body=lowpass(noise,1900),bass=lowpass(noise,220),sub=lowpass(noise,70),x=new Float64Array(n);
 const tint=1+(take-(count-1)/2)*.016;
 function contact(at,decay,amp){for(let i=Math.round(at*sr);i<n;i++){const t=i/sr-at;if(t<0)continue;x[i]+=(body[i]-bass[i])*amp*(1-Math.exp(-t/.0008))*Math.exp(-t/decay);}}
 function latch(at,hz,decay,amp){for(let i=Math.round(at*sr);i<n;i++){const t=i/sr-at;if(t<0)continue;
  const p=2*Math.PI*hz*tint*t,e=(1-Math.exp(-t/.001))*Math.exp(-t/decay);
  x[i]+=amp*e*(Math.sin(p)+.32*Math.sin(p*1.731)+.12*Math.sin(p*2.417));
 }}
 if(sniper){
  // Compact ballistic crack and pressure body, distinct from the rapid-fire family.
  for(let i=0;i<n;i++){
   const t=i/sr,attack=1-Math.exp(-t/.00028);
   const pressure=(Math.exp(-t/.0014)-.19*Math.exp(-t/.007))*1.08;
   const crack=(air[i]-body[i])*Math.exp(-t/.0034)*1.12;
   const report=(body[i]-bass[i])*Math.exp(-t/(.030*tint))*2.55;
   const weight=(bass[i]-sub[i])*Math.exp(-t/.025)*1.8;
   x[i]=attack*(pressure+crack+report+weight);
  }
  // Bolt lift/eject/close is a separate dry mechanism, not a delayed gunshot/echo.
  const lift=.172+take*.0012,close=.286+take*.001;
  contact(lift,.009,.34);latch(lift,1370,.0046,.085);
  contact(lift+.035,.015,.14);latch(close,860,.006,.09);contact(close,.009,.30);
 }else{
  // Firm latch + short object/cloth body: audible identification without a melody.
  contact(.002,.021,1.15);latch(.005,970,.007,.19);
  contact(.038+take*.001,.021,.70);latch(.041,640,.008,.10);
  if(name==='chest'){contact(.108,.019,.58);latch(.112,790,.006,.12);}
 }
 const dc=lowpass(x,55);for(let i=0;i<n;i++)x[i]-=dc[i];
 const kernel=[],radius=64;let sum=0;
 for(let j=-radius;j<=radius;j++){const z=2*15000/sr*j,sinc=z?Math.sin(Math.PI*z)/(Math.PI*z):1;
  const w=.42+.5*Math.cos(Math.PI*j/radius)+.08*Math.cos(2*Math.PI*j/radius),v=sinc*w;kernel.push(v);sum+=v;}
 const result=new Float64Array(Math.round(duration*RATE));let peak=0,energy=0;
 for(let i=0;i<result.length;i++){
  let v=0;for(let j=-radius;j<=radius;j++){const at=i*2+j;if(at>=0&&at<n)v+=x[at]*kernel[j+radius]/sum;}
  const edge=Math.max(0,Math.min(1,i/(RATE*.0007),(result.length-1-i)/(RATE*.020)));v*=Math.sin(edge*Math.PI/2)**2;
  result[i]=v;peak=Math.max(peak,Math.abs(v));energy+=v*v;
 }
 const ceiling=sniper?.46:name==='chest'?.30:.28,gain=Math.min(ceiling/peak,(sniper?.075:.058)/Math.sqrt(energy/result.length));
 const pcm=Buffer.alloc(result.length*2);for(let i=0;i<result.length;i++)pcm.writeInt16LE(Math.round(result[i]*gain*32767),i*2);
 pcm.writeInt16LE(0,0);pcm.writeInt16LE(0,pcm.length-2);
 return {pcm,seed,gain,parameters:{duration,peak:ceiling,oversample:2,mechanism:sniper?'lift-eject-close':'latch-contact'}};
}
function main(){
 const root=path.join(__dirname,'..'),dir=path.join(root,'assets/audio'),file=path.join(dir,'manifest.json'),m=JSON.parse(fs.readFileSync(file,'utf8'));
 if(!m.previousPrecisionVersion){for(const name of ['sniper','pickup','chest'])m.previousWeapons[name]=m.groups[name];m.previousPrecisionVersion='0.175';}
 const generatorSha256=hash(fs.readFileSync(__filename)),report=[];
 for(const name of ['sniper','pickup','chest'])m.groups[name]=Array.from({length:name==='sniper'?8:3},(_,take)=>{
  const {pcm,seed,gain,parameters}=render(name,take),file=name+'-'+take+'-v0176.wav',data=wav(pcm),stats=metrics(pcm);
  fs.writeFileSync(path.join(dir,file),data);report.push({name,take,...stats});
  return {file,sha256:hash(data),sampleRate:RATE,...stats,source:'project-original-precision',design:'precision-feedback-v0176',
   generator:'tools/design-precision-audio.cjs',generatorSha256,seed,take,parameters,gain,components:[],provenance:'Original equations and seeded noise; no recordings.'};
 });
 m.version=7;fs.writeFileSync(file,JSON.stringify(m,null,2)+'\n');fs.writeFileSync(path.join(root,'audit/audio-v0176.json'),JSON.stringify(report,null,2)+'\n');
 console.log('Generated 8 unique sniper takes and 6 clear pickup/reward cues.');
}
module.exports={render};if(require.main===module)main();
