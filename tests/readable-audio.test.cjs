const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),{render,NAMES}=require('../tools/design-readable-audio.cjs'),{wav,metrics}=require('../tools/design-original-weapons.cjs');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/audio/manifest.json')));
for(const name of NAMES){
 const clips=[...manifest.groups[name],...manifest.previousWeapons[name]].filter(c=>c.design==='readable-event-signatures-v0177');
 // Historical generator still regenerates all takes; only shipped takes require files.
 const signatures=new Set();
 for(let take=0;take<(name==='sniper'?8:3);take++){
  const {pcm}=render(name,take),c=clips.find(c=>c.take===take);signatures.add(pcm.toString('base64'));
  if(c)assert.deepEqual(wav(pcm),fs.readFileSync(path.join(root,'assets/audio',c.file)));
  const m=metrics(pcm);assert(m.peak<=.441&&m.rms<=.061);assert(Math.abs(m.mean)<.001);
  assert.equal(pcm.readInt16LE(0),0);assert.equal(pcm.readInt16LE(pcm.length-2),0);
  let tail=0,total=0;for(let i=0;i<pcm.length/2;i++){const x=pcm.readInt16LE(i*2)/32768;total+=x*x;if(i>pcm.length/2-44100*.025)tail+=x*x;}
  assert(tail/total<.001,'No long tail or hiss: '+name);
 }
 assert.equal(signatures.size,name==='sniper'?8:3);
}
const h=require('./arena-harness.cjs')();h.box.assert=assert;
h.run(`reset();running=true;paused=false;let calls=[];SFX.ability=k=>calls.push(k);
 for(const kind of ['airstrike','gas','tank']){
  inventory[kind]=1;paused=true;assert.equal(useAbility(kind),false);assert.equal(inventory[kind],1);
  paused=false;assert.equal(useAbility(kind),true);assert.equal(inventory[kind],0);
  assert.equal(useAbility(kind),false);assert.equal(calls.filter(k=>k===kind).length,1);
 }
 assert(airstrike&&gasCloud&&allyTanks.length===1);
`);
console.log('PASS: seven original cue families, 26 deterministic takes, bounded PCM/tails, once-only ability activation and unchanged inventory guards');
