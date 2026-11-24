// Offline PCM comparison, not a listening test or an emulation of hardware volume.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),oldPath=process.argv[2];
if(!oldPath)throw Error('Pass the previous src/sound-design.js for the comparison');
function load(file){const box={};vm.createContext(box);vm.runInContext(fs.readFileSync(file,'utf8'),box);return name=>{box.name=name;return vm.runInContext('renderSoundSpec(SOUND_LIBRARY[name],44100,101)',box);};}
const old=load(oldPath),next=load(path.join(root,'src/sound-design.js'));
function metrics(pcm){let e=0,hi=0,lp=0,peak=0,delta=0,last=0;const a=1-Math.exp(-2*Math.PI*3000/44100);
 for(const x of pcm){lp+=a*(x-lp);hi+=(x-lp)**2;e+=x*x;peak=Math.max(peak,Math.abs(x));delta=Math.max(delta,Math.abs(x-last));last=x;}
 return {peak,rms:Math.sqrt(e/pcm.length),highBandRms:Math.sqrt(hi/pcm.length),maxSampleStep:delta};
}
const names=['rifle','shotgun','sniper','minigun','hit','pop','hurt','boom','ice','level','chest','heal','victory','ultimate','dragon','breath','airstrike','gas','chirp'];
const report=names.map(name=>{const a=metrics(old(name)),b=metrics(next(name));
 assert(b.rms<a.rms,name+' should be quieter at source');assert(b.highBandRms<a.highBandRms*.65,name+' should have less sharp high-frequency energy');
 return {name,previous:a,current:b,rmsChangeDb:+(20*Math.log10(b.rms/a.rms)).toFixed(2),highBandChangeDb:+(20*Math.log10(b.highBandRms/a.highBandRms)).toFixed(2)};
});
fs.mkdirSync(path.join(root,'audit'),{recursive:true});
fs.writeFileSync(path.join(root,'audit/sound-v0166-comparison.json'),JSON.stringify({note:'PCM only, same seed, 44.1 kHz. Excludes voice gain, category budgets, compressor and output trim. High band uses a first-order 3 kHz residual, not a spectral brick-wall.',sounds:report},null,2));
console.table(report.map(({name,rmsChangeDb,highBandChangeDb})=>({name,rmsChangeDb,highBandChangeDb})));
