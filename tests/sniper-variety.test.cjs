const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),{render,TAKES}=require('../tools/design-sniper-variety.cjs'),{wav,metrics}=require('../tools/design-original-weapons.cjs');
const m=JSON.parse(fs.readFileSync(path.join(root,'assets/audio/manifest.json'))),ratios=[],levels=[];
assert.equal(m.groups.sniper.length,8);assert.equal(new Set(m.groups.sniper.map(c=>c.sha256)).size,8);
assert.equal(new Set(TAKES.map(p=>p.body)).size,8);assert.equal(new Set(TAKES.map(p=>p.close)).size,8);
for(const clip of m.groups.sniper){
 const {pcm}=render('sniper',clip.take);assert.deepEqual(wav(pcm),fs.readFileSync(path.join(root,'assets/audio',clip.file)));
 assert.deepEqual(pcm,render('sniper',clip.take).pcm);assert.equal(clip.source,'project-original-sniper');
 assert.equal(clip.parameters.referenceAudioUsed,false);assert.deepEqual(clip.components,[]);
 const s=metrics(pcm);assert.equal(s.duration,.4);assert(s.peak<=.441);assert(s.rms>.02&&s.rms<.05);assert(Math.abs(s.mean)<.0001);
 assert.equal(pcm.readInt16LE(0),0);assert.equal(pcm.readInt16LE(pcm.length-2),0);levels.push(s.rms);
 let total=0,body=0,tail=0,bolt=0,step=0;
 for(let i=0;i<pcm.length/2;i++){const x=pcm.readInt16LE(i*2)/32768,t=i/44100;total+=x*x;if(t>.028&&t<.15)body+=x*x;if(t>.35)tail+=x*x;if(t>.16&&t<.35)bolt+=x*x;if(i)step=Math.max(step,Math.abs(x-pcm.readInt16LE((i-1)*2)/32768));}
 assert(tail/total<.001,'No long rumble/hiss');assert(bolt>.003,'Audible mechanism phase');assert(step<.4);ratios.push(body/total);
}
assert(Math.max(...levels)/Math.min(...levels)<1.8,'Variants stay within a consistent loudness range');
assert(Math.max(...ratios)/Math.min(...ratios)>1.3,'Different shot envelopes, not pitch-only copies');
assert.equal(m.previousSniperVarietyVersion,'0.181');assert(m.previousWeapons.sniper.every(c=>c.design==='heavy-projectile-v0178'));
assert.throws(()=>render('rifle',0));assert.throws(()=>render('sniper',8));
console.log('PASS: eight reproducible dry sniper takes, distinct envelopes/bolts, bounded PCM and tails; real previous-bank comparison');
