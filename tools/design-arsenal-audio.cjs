// Original short string releases and energy pulses. No external audio inputs.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {wav}=require('./design-original-weapons.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function render(name,take=0){
 if(!['arrow','laser'].includes(name)||take<0||take>2)throw Error('Unknown arsenal cue');
 const rate=44100,duration=name==='arrow'?.16:.12,n=Math.round(rate*duration),pcm=Buffer.alloc(n*2);
 let seed=(19517+take*7919)>>>0,phase=0,low=0;
 for(let i=0;i<n;i++){
  const t=i/rate,u=i/(n-1),env=Math.sin(Math.min(1,t/.003)*Math.PI/2)**2*(1-u)**2;
  const f=name==='arrow'?(330+take*17)*Math.exp(-t*8):(890+take*31)*Math.exp(-t*12);
  phase+=2*Math.PI*f/rate;seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  low+=.13*((seed/4294967296*2-1)-low);
  const value=name==='arrow'?(Math.sin(phase)*.14+Math.sin(phase*2.01)*.045+low*.08)*Math.exp(-t*21):(.19*Math.sin(phase)+.045*Math.sin(phase*1.5))*Math.exp(-t*13);
  pcm.writeInt16LE(Math.round(value*env*32767),i*2);
 }
 return {pcm};
}
function main(){
 const root=path.join(__dirname,'..'),dir=path.join(root,'assets/audio'),file=path.join(dir,'manifest.json'),m=JSON.parse(fs.readFileSync(file));
 const generator='tools/design-arsenal-audio.cjs',generatorSha256=hash(fs.readFileSync(__filename));
 for(const name of ['arrow','laser'])m.groups[name]=Array.from({length:3},(_,take)=>{
  const data=wav(render(name,take).pcm),file=name+'-'+take+'-v0195.wav';fs.writeFileSync(path.join(dir,file),data);
  return {file,source:'project-original-arsenal',design:'arsenal-evolution-v0195',generator,generatorSha256,take,sampleRate:44100,duration:(data.length-44)/88200,sha256:hash(data),components:[]};
 });
 fs.writeFileSync(file,JSON.stringify(m,null,2)+'\n');console.log('Generated six original arsenal cues');
}
if(require.main===module)main();module.exports={render};
