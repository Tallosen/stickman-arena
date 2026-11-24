const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const root=path.join(__dirname,'..'),design=require('../tools/design-original-weapons.cjs'),{validate}=require('../tools/audio-provenance.cjs');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/audio/manifest.json')));
assert.equal(validate(manifest),true);
for(const bank of ['groups','previousWeapons']){
 const bad=JSON.parse(JSON.stringify(manifest));bad[bank].rifle[0].source='user-reference';
 assert.throws(()=>validate(bad),/Reference audio/,'Reject reference audio even in QA comparisons');
}
const bad=JSON.parse(JSON.stringify(manifest));bad.groups.hit[0].components[0].source='unknown-license';assert.throws(()=>validate(bad),/Unregistered/);
const designs=new Set();
for(const name of Object.keys(design.DESIGNS)){
 const takes=new Set();
 for(let take=0;take<3;take++){
  const clip=[...manifest.groups[name],...(manifest.previousWeapons[name]||[])].find(c=>c.design==='original-dry-weapons-v0173'&&c.take===take),a=design.render(name,take),b=design.render(name,take);
  assert.deepEqual(a.pcm,b.pcm,'Seeded, independently reproducible without reading audio');
  const wav=design.wav(a.pcm);if(clip)assert.deepEqual(wav,fs.readFileSync(path.join(root,'assets/audio',clip.file)));
  const hash=crypto.createHash('sha256').update(wav).digest('hex');takes.add(hash);designs.add(hash);
  const m=design.metrics(a.pcm);assert(m.peak<=.461&&m.peak>.1);assert(m.rms>.015&&m.rms<=.081);
  assert(m.tailEnergyRatio<.002,'No sustained noisy/reverberant tail');assert(Math.abs(m.mean)<.001,'No material DC offset');
 }
 assert.equal(takes.size,3);
}
assert.equal(designs.size,15,'All weapons/takes have distinct PCM');
// Audition includes rapid fire; it is deliberately not upward-normalized.
const preview=fs.readFileSync(path.join(root,'audit/weapon-preview-v0173.wav'));
assert.equal(preview.readUInt32LE(24),44100);let peak=0;
for(let i=44;i<preview.length;i+=2)peak=Math.max(peak,Math.abs(preview.readInt16LE(i)/32768));
assert(peak>.05&&peak<.3);
console.log('PASS: 15 original deterministic weapons, no borrowed samples, provenance gates, peaks/DC/tails and rapid-fire audition');
