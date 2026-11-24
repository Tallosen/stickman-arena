// Eight independent dry precision-rifle takes. Equations/seeded noise only;
// no input audio, reference fragments, convolution, distortion or reverb.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {wav,metrics,RATE}=require('./design-original-weapons.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const TAKES=[
 {name:'tight-crack',crack:1.30,edge:6200,mid:2100,body:.036,weight:1.65,bolt:.182,close:.268,metal:1420},
 {name:'broad-report',crack:.96,edge:5400,mid:1500,body:.052,weight:2.05,bolt:.205,close:.296,metal:1070},
 {name:'sharp-action',crack:1.18,edge:5800,mid:2350,body:.031,weight:1.50,bolt:.169,close:.246,metal:1650},
 {name:'firm-pressure',crack:1.03,edge:4900,mid:1750,body:.057,weight:2.20,bolt:.217,close:.303,metal:1180},
 {name:'crisp-lock',crack:1.37,edge:6100,mid:1850,body:.040,weight:1.72,bolt:.190,close:.257,metal:1510},
 {name:'compact-report',crack:1.08,edge:5200,mid:2200,body:.033,weight:1.80,bolt:.176,close:.280,metal:1280},
 {name:'warm-action',crack:.93,edge:4700,mid:1450,body:.048,weight:2.12,bolt:.199,close:.288,metal:980},
 {name:'split-mechanism',crack:1.24,edge:5600,mid:1950,body:.043,weight:1.88,bolt:.185,close:.312,metal:1370}
];
function render(name,take=0){
 if(name!=='sniper'||!Number.isInteger(take)||!TAKES[take])throw Error('Invalid sniper variety take');
 const p=TAKES[take],sr=RATE*2,duration=.40,n=Math.round(sr*duration),seed=0x182ad71+take*19001;
 let state=seed>>>0;const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296*2-1;};
 const noise=Float64Array.from({length:n},random);
 function lp(a,hz){const out=new Float64Array(n),k=1-Math.exp(-2*Math.PI*hz/sr);let v=0;for(let i=0;i<n;i++){v+=k*(a[i]-v);out[i]=v;}return out;}
 const bass=lp(noise,125),low=lp(noise,550),mid=lp(noise,p.mid),high=lp(noise,p.edge),x=new Float64Array(n);
 for(let i=0;i<n;i++){
  const t=i/sr,attack=1-Math.exp(-t/.0008),end=Math.max(0,Math.min(1,(.19-t)/.045));
  const crack=(high[i]-mid[i])*p.crack*Math.exp(-t/(.0045+(take%3)*.0007));
  const report=(mid[i]-low[i])*2.2*Math.exp(-t/(.019+(take%4)*.003));
  const body=(low[i]-bass[i])*p.weight*Math.exp(-t/p.body);
  // Short projectile edge, far below the attack; no sustained tonal bass tail.
  const edge=.08*Math.sin(2*Math.PI*(370*t+300*.009*(1-Math.exp(-t/.009))))*Math.exp(-t/.008);
  x[i]=attack*(crack+report+body+edge)*end*end;
 }
 function contact(at,gain,hz,len){for(let i=Math.ceil(at*sr);i<Math.min(n,Math.ceil((at+len)*sr));i++){
  const t=i/sr-at,env=(1-Math.exp(-t/.0012))*Math.exp(-t/.006)*Math.min(1,(len-t)/.008);
  x[i]+=gain*((mid[i]-low[i])+.045*Math.sin(2*Math.PI*hz*t))*env;
 }}
 contact(p.bolt,.26,p.metal,.028);contact(p.bolt+.025+(take%3)*.006,.13,p.metal*1.29,.024);
 contact(p.close,.36,p.metal*.83,.038);
 const dc=lp(x,90);for(let i=0;i<n;i++)x[i]-=dc[i];
 const radius=48,kernel=[];let sum=0;
 for(let j=-radius;j<=radius;j++){const z=2*10500/sr*j,v=(z?Math.sin(Math.PI*z)/(Math.PI*z):1)*(.42+.5*Math.cos(Math.PI*j/radius)+.08*Math.cos(2*Math.PI*j/radius));kernel.push(v);sum+=v;}
 const out=new Float64Array(Math.round(duration*RATE));let peak=0,energy=0;
 for(let i=0;i<out.length;i++){
  let v=0;for(let j=-radius;j<=radius;j++){const at=i*2+j;if(at>=0&&at<n)v+=x[at]*kernel[j+radius]/sum;}
  v*=Math.sin(Math.max(0,Math.min(1,i/(RATE*.0007),(out.length-1-i)/(RATE*.026)))*Math.PI/2)**2;
  out[i]=v;peak=Math.max(peak,Math.abs(v));energy+=v*v;
 }
 const gain=Math.min(.44/peak,.048/Math.sqrt(energy/out.length)),pcm=Buffer.alloc(out.length*2);
 for(let i=0;i<out.length;i++)pcm.writeInt16LE(Math.round(out[i]*gain*32767),i*2);
 return {pcm,seed,gain,parameters:{...p,duration,oversample:2,lowCut:90,antiAlias:10500,referenceAudioUsed:false}};
}
function main(){
 const root=path.join(__dirname,'..'),dir=path.join(root,'assets/audio'),file=path.join(dir,'manifest.json'),m=JSON.parse(fs.readFileSync(file));
 if(!m.previousSniperVarietyVersion){m.previousWeapons.sniper=m.groups.sniper;m.previousSniperVarietyVersion='0.181';}
 const generatorSha256=hash(fs.readFileSync(__filename)),report=[];
 m.groups.sniper=TAKES.map((_,take)=>{
  const {pcm,seed,gain,parameters}=render('sniper',take),file='sniper-'+take+'-v0182.wav',data=wav(pcm),stats=metrics(pcm);
  fs.writeFileSync(path.join(dir,file),data);report.push({name:'sniper',take,...stats});
  return {file,sha256:hash(data),sampleRate:RATE,...stats,source:'project-original-sniper',design:'dry-precision-variety-v0182',generator:'tools/design-sniper-variety.cjs',generatorSha256,seed,take,parameters,gain,components:[],provenance:'Original equations and seeded noise; no input recordings.'};
 });
 m.version=10;fs.writeFileSync(file,JSON.stringify(m,null,2)+'\n');fs.writeFileSync(path.join(root,'audit/audio-v0182.json'),JSON.stringify(report,null,2)+'\n');
 console.log('Generated eight distinct precision-rifle takes; only sniper PCM changed.');
}
module.exports={render,TAKES};if(require.main===module)main();
