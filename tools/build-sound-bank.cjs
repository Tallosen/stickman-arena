// Embed prepared PCM, avoiding fetch, codec differences and late async playback on file://.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.join(__dirname,'..'),dir=path.join(root,'assets/audio');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
require('./audio-provenance.cjs').validate(manifest);
const originalWeapons=require('./design-original-weapons.cjs');
function embed(groups){const bank={},rates={};
for(const [name,clips] of Object.entries(groups)){
 rates[name]=clips[0].sampleRate||manifest.sampleRate;
 bank[name]=clips.map(clip=>{
  if(!/^[a-z0-9_-]+\.wav$/.test(clip.file))throw Error('Invalid audio path');
  const data=fs.readFileSync(path.join(dir,clip.file));
  if(['project-original-synthesis','project-original-effects','project-original-comfort','project-original-precision','project-original-readable','project-original-projectile','project-original-sniper','project-original-arsenal'].includes(clip.source)){
   const generatorPath=clip.source==='project-original-arsenal'?'tools/design-arsenal-audio.cjs':clip.source==='project-original-sniper'?'tools/design-sniper-variety.cjs':clip.source==='project-original-projectile'?'tools/design-projectile-audio.cjs':clip.source==='project-original-readable'?'tools/design-readable-audio.cjs':clip.source==='project-original-precision'?'tools/design-precision-audio.cjs':clip.source==='project-original-comfort'?'tools/design-comfort-audio.cjs':clip.source==='project-original-effects'?'tools/design-action-audio.cjs':'tools/design-original-weapons.cjs';
   const designer=require(path.join(root,generatorPath));
   const generator=fs.readFileSync(path.join(root,generatorPath));
   if(crypto.createHash('sha256').update(generator).digest('hex')!==clip.generatorSha256||
      !data.equals(originalWeapons.wav(designer.render(name,clip.take).pcm)))throw Error('Original synthesis provenance mismatch: '+clip.file);
  }
  const rate=clip.sampleRate||manifest.sampleRate;
  if(![22050,44100].includes(rate)||rate!==rates[name]||data.toString('ascii',0,4)!=='RIFF'||data.toString('ascii',8,12)!=='WAVE'||data.toString('ascii',36,40)!=='data'||data.readUInt16LE(20)!==1||data.readUInt16LE(22)!==1||data.readUInt16LE(34)!==16||data.readUInt32LE(24)!==rate)throw Error('Expected canonical mono PCM16 WAV: '+clip.file);
  if(crypto.createHash('sha256').update(data).digest('hex')!==clip.sha256)throw Error('Audio hash mismatch: '+clip.file);
  const pcm=data.subarray(44);if(pcm.length!==data.readUInt32LE(40)||pcm.length>rate*2*2.5)throw Error('Invalid sound length');
  return pcm.toString('base64');
 });
}
return {bank,rates};}
const current=embed(manifest.groups),previous=embed(manifest.previousWeapons||{});
const credits=fs.readFileSync(path.join(root,'AUDIO_CREDITS.md'),'utf8').replace(/\*\//g,'* /');
fs.writeFileSync(path.join(root,'src/sound-samples.js'),'"use strict";\n/* Generated PCM bank. Full source credits:\n'+credits+'\n*/\nconst RECORDED_SOUND_RATE=22050;\nconst RECORDED_SOUND_RATES='+JSON.stringify(current.rates)+';\nconst PREVIOUS_SOUND_RATES='+JSON.stringify(previous.rates)+';\nconst PREVIOUS_WEAPON_SOUNDS='+JSON.stringify(previous.bank)+';\nconst RECORDED_SOUNDS='+JSON.stringify(current.bank)+';\n');
console.log('Embedded recorded audio: '+Object.keys(current.bank).join(', '));
