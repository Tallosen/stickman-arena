// Curated export, not a recursive copy of historical audio/reference folders.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),project=path.resolve(root,'../..');
const target=path.join(project,'work/full_source_v0.176');
if(fs.existsSync(target))throw Error('Snapshot already exists; preserve it instead of overwriting.');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/audio/manifest.json'),'utf8'));
require('./audio-provenance.cjs').validate(manifest);
if(!fs.readFileSync(path.join(root,'src/config.js'),'utf8').includes('VERSION = "0.176"'))throw Error('Wrong version');
const audio=new Set(['manifest.json']),sourceHashes=new Map();
for(const groups of [manifest.groups,manifest.previousWeapons])for(const clips of Object.values(groups))for(const clip of clips){
 audio.add(clip.file);sourceHashes.set(clip.file,clip.sha256);
 for(const c of [clip,...(clip.components||[])])if(c.original){
  const rel='originals/'+c.original;audio.add(rel);sourceHashes.set(rel,c.originalSha256);
 }
}
for(const f of fs.readdirSync(path.join(root,'assets/audio')))if(/LICENSE\.txt$/.test(f))audio.add(f);
for(const f of audio){
 if(f.includes('..')||path.isAbsolute(f)||/reference|bullet-time|\.mp3$/i.test(f))throw Error('Invalid export asset: '+f);
 const b=fs.readFileSync(path.join(root,'assets/audio',f));
 if(sourceHashes.has(f)&&crypto.createHash('sha256').update(b).digest('hex')!==sourceHashes.get(f))throw Error('Source hash mismatch: '+f);
}
function copy(rel){const out=path.join(target,rel);fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(path.join(root,rel),out);}
for(const dir of ['src','tests'])fs.cpSync(path.join(root,dir),path.join(target,dir),{recursive:true,errorOnExist:true});
for(const rel of ['index.html','build.js','README.md','RELEASE_READINESS.md','AUDIO_CREDITS.md','PLATFORMS.md','YOUTUBE_PLAYABLES.md','playgama-bridge-config.json',
 'BALANCE_v0.148.md','BALANCE_v0.150.md','BALANCE_v0.162.md',
 'tools/build-sound-bank.cjs','tools/audio-provenance.cjs','tools/design-original-weapons.cjs','tools/design-action-audio.cjs','tools/design-comfort-audio.cjs','tools/design-precision-audio.cjs','tools/export-source-v0176.cjs',
 'audit/audio-v0176.json','audit/precision-preview-v0176.wav','audit/comfort-preview-v0176.wav','audit/dense-mix-v0176.wav','audit/dense-mix-v0176.json','audit/audio-v0174.json','audit/action-preview-v0174.wav','audit/audio-v0173.json','audit/weapon-preview-v0173.wav',
 'dist/StickmanArena_v0.176_QA.html'])copy(rel);
for(const f of audio)copy('assets/audio/'+f);
const concept=path.join(project,'concepts/dragon-game/CONCEPT.md');if(fs.existsSync(concept))fs.copyFileSync(concept,path.join(target,'DRAGON_CONCEPT.md'));
fs.writeFileSync(path.join(target,'audit/export-v0176.json'),JSON.stringify({version:'0.176',audioFiles:[...audio].sort(),
 noUserReferenceAudio:true,comparisonVersion:manifest.previousCombatVersion,comparisonEffectsVersion:manifest.previousEffectsVersion,comparisonComfortVersion:manifest.previousComfortVersion,comparisonPrecisionVersion:manifest.previousPrecisionVersion,activeClips:Object.values(manifest.groups).flat().length},null,2)+'\n');
console.log('Exported '+target+'; '+audio.size+' manifest-linked audio/credit files; reference folders excluded.');
