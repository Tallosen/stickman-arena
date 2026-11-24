// Original, dry event signatures. No recordings, reverb, clipping or distortion.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {wav,metrics,RATE}=require('./design-original-weapons.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const NAMES=['level','sniper','pickup','chest','airstrike','gas','tank'];
function render(name,take=0){
 if(!NAMES.includes(name)||!Number.isInteger(take)||take<0||take>=(name==='sniper'?8:3))throw Error('Invalid readable cue');
 const duration={level:.52,sniper:.46,pickup:.16,chest:.28,airstrike:.42,gas:.27,tank:.48}[name];
 const sr=RATE*2,n=Math.round(duration*sr),x=new Float64Array(n),seed=0x177c201+NAMES.indexOf(name)*19001+take*7919;
 let state=seed>>>0;const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296*2-1;};
 const noise=Float64Array.from({length:n},random);
 function lp(a,hz){const out=new Float64Array(n),k=1-Math.exp(-2*Math.PI*hz/sr);let v=0;for(let i=0;i<n;i++){v+=k*(a[i]-v);out[i]=v;}return out;}
 const low=lp(noise,350),mid=lp(noise,2600),high=lp(noise,6500),tint=1+(take-1)*.006;
 function layer(at,len,fn){for(let i=Math.ceil(at*sr);i<Math.min(n,Math.ceil((at+len)*sr));i++){const t=i/sr-at;const edge=Math.min(1,t/.0015,(len-t)/.014);x[i]+=fn(t,i)*Math.sin(Math.max(0,edge)*Math.PI/2)**2;}}
 function tone(at,hz,len,decay,gain){layer(at,len,t=>gain*Math.sin(2*Math.PI*hz*tint*t)*(1-Math.exp(-t/.004))*Math.exp(-t/decay));}
 function tap(at,gain,decay=.009){layer(at,.065,(t,i)=>gain*((mid[i]-low[i])+.12*Math.sin(2*Math.PI*1460*t))*Math.exp(-t/decay));}
 if(name==='level'){
  // One compact consonant resolution, not a long fanfare or piercing arpeggio.
  tone(0,523.25,.39,.095,.25);tone(.035,659.25,.37,.100,.16);tone(.075,783.99,.40,.110,.19);
 }else if(name==='pickup'){
  // Cloth/object contact and a small wooden catch; no electronic reward jingle.
  tap(.002,.65,.006);tone(.009,720,.075,.012,.21);tap(.040,.28,.007);
 }else if(name==='chest'){
  tap(.002,.70,.008);tone(.008,560,.080,.017,.22);tap(.072,.40,.012);
  tone(.114,1046.5,.15,.036,.08);tone(.127,1318.5,.15,.032,.055);
 }else if(name==='sniper'){
  // Single broad crack; no pitched bass drum or ringing low-frequency tail.
  layer(0,.105,(t,i)=>((high[i]-mid[i])*2.3*Math.exp(-t/.0019)+(mid[i]-low[i])*3.4*Math.exp(-t/(.012+take*.0004))));
  layer(0,.021,t=>.45*(Math.exp(-t/.0011)-.22*Math.exp(-t/.004)));
  tap(.174+take*.001,.25,.006);tap(.216+take*.001,.13,.006);tap(.294+take*.001,.30,.008);
  tone(.298+take*.001,1120,.065,.006,.05);
 }else if(name==='airstrike'){
  tap(0,.3,.005);tone(.034,740,.082,.050,.18);tone(.150,988,.105,.062,.19);
  layer(.260,.13,(t,i)=>(high[i]-mid[i])*.19*Math.sin(Math.PI*t/.13)**2);
 }else if(name==='gas'){
  tap(0,.60,.006);tone(.012,930,.045,.006,.09);
  // A brief valve release, not sustained sizzling throughout the gas effect.
  layer(.048,.15,(t,i)=>(mid[i]-low[i])*.38*Math.sin(Math.PI*t/.15)**2);
 }else{
  tap(.004,.55,.008);tap(.057,.36,.007);
  layer(.065,.34,t=>{
   const phase=2*Math.PI*(112*t+45*t*t),env=Math.sin(Math.PI*t/.34)**2;
   return .11*env*(Math.sin(phase)+.32*Math.sin(phase*2)+.12*Math.sin(phase*3));
  });tap(.365,.32,.008);
 }
 const dc=lp(x,65);for(let i=0;i<n;i++)x[i]-=dc[i];
 const radius=48,kernel=[];let sum=0;
 for(let j=-radius;j<=radius;j++){const z=2*11500/sr*j;const v=(z?Math.sin(Math.PI*z)/(Math.PI*z):1)*(.42+.5*Math.cos(Math.PI*j/radius)+.08*Math.cos(2*Math.PI*j/radius));kernel.push(v);sum+=v;}
 const out=new Float64Array(Math.round(duration*RATE));let peak=0,energy=0;
 for(let i=0;i<out.length;i++){let v=0;for(let j=-radius;j<=radius;j++){const at=2*i+j;if(at>=0&&at<n)v+=x[at]*kernel[j+radius]/sum;}
  v*=Math.max(0,Math.min(1,i/(RATE*.001),(out.length-1-i)/(RATE*.015)));out[i]=v;peak=Math.max(peak,Math.abs(v));energy+=v*v;}
 const ceiling=name==='sniper'?.44:name==='level'?.24:.29;
 const gain=Math.min(ceiling/peak,(name==='sniper'?.060:.052)/Math.sqrt(energy/out.length));
 const pcm=Buffer.alloc(out.length*2);for(let i=0;i<out.length;i++)pcm.writeInt16LE(Math.round(out[i]*gain*32767),2*i);
 return {pcm,seed,gain,parameters:{duration,oversample:2,lowCut:65,antiAlias:11500,design:name}};
}
function main(){
 const root=path.join(__dirname,'..'),dir=path.join(root,'assets/audio'),file=path.join(dir,'manifest.json'),m=JSON.parse(fs.readFileSync(file));
 if(!m.previousReadableVersion){for(const name of NAMES)m.previousWeapons[name]=m.groups[name];m.previousReadableVersion='0.176';}
 const generatorSha256=hash(fs.readFileSync(__filename)),report=[];
 for(const name of NAMES)m.groups[name]=Array.from({length:name==='sniper'?8:3},(_,take)=>{
  const {pcm,seed,gain,parameters}=render(name,take),file=name+'-'+take+'-v0177.wav',data=wav(pcm),stats=metrics(pcm);
  fs.writeFileSync(path.join(dir,file),data);report.push({name,take,...stats});
  return {file,sha256:hash(data),sampleRate:RATE,...stats,source:'project-original-readable',design:'readable-event-signatures-v0177',generator:'tools/design-readable-audio.cjs',generatorSha256,seed,take,parameters,gain,components:[],provenance:'Original equations and seeded noise; no recordings.'};
 });
 m.version=8;fs.writeFileSync(file,JSON.stringify(m,null,2)+'\n');fs.writeFileSync(path.join(root,'audit/audio-v0177.json'),JSON.stringify(report,null,2)+'\n');
 console.log('Generated 26 clips for seven distinct event signatures.');
}
module.exports={render,NAMES};if(require.main===module)main();
