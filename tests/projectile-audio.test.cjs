const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),{render}=require('../tools/design-projectile-audio.cjs'),{wav,metrics}=require('../tools/design-original-weapons.cjs');
const m=JSON.parse(fs.readFileSync(path.join(root,'assets/audio/manifest.json'))),clips=m.previousWeapons.sniper;
assert.equal(clips.length,8);assert.equal(new Set(clips.map(c=>c.sha256)).size,8);
for(const c of clips){
 const {pcm}=render('sniper',c.take);assert.deepEqual(wav(pcm),fs.readFileSync(path.join(root,'assets/audio',c.file)));
 const stats=metrics(pcm);assert(stats.peak<=.461&&stats.rms<=.065);assert(Math.abs(stats.mean)<.001);
 assert.equal(stats.duration,.68);assert.equal(pcm.readInt16LE(0),0);assert.equal(pcm.readInt16LE(pcm.length-2),0);
 let total=0,body=0,tail=0,step=0;
 for(let i=0;i<pcm.length/2;i++){const x=pcm.readInt16LE(i*2)/32768,t=i/44100;total+=x*x;if(t>.04&&t<.20)body+=x*x;if(t>.56)tail+=x*x;if(i)step=Math.max(step,Math.abs(x-pcm.readInt16LE((i-1)*2)/32768));}
 assert(body/total>.20,'Substantial pressure body rather than only a click');assert(tail/total<.001,'No extended rumble');assert(step<.4);
 assert.equal(c.parameters.referenceAudioUsed,false);assert.deepEqual(c.components,[]);
}
assert.equal(m.previousSniperVarietyVersion,'0.181');assert(clips.every(c=>c.design==='heavy-projectile-v0178'));
assert.throws(()=>render('rifle',0));assert.throws(()=>render('sniper',8));
console.log('PASS: 8 original heavy sniper reports, body/tail bounds, exact regeneration, reference-free assets and previous sniper comparison');
