// Export only source and assets referenced by the two validated sound banks.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),project=path.resolve(root,'../..');
const target=path.join(project,'work/full_source_v0.191');
if(fs.existsSync(target))throw Error('Snapshot already exists; preserve it instead of overwriting.');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/audio/manifest.json'),'utf8'));
require('./audio-provenance.cjs').validate(manifest);
if(!fs.readFileSync(path.join(root,'src/config.js'),'utf8').includes('VERSION = "0.191"'))throw Error('Wrong version');
const audio=new Set(['manifest.json']),hashes=new Map();
for(const groups of [manifest.groups,manifest.previousWeapons])for(const clips of Object.values(groups))for(const clip of clips){
 audio.add(clip.file);hashes.set(clip.file,clip.sha256);
 for(const c of [clip,...(clip.components||[])])if(c.original){const rel='originals/'+c.original;audio.add(rel);hashes.set(rel,c.originalSha256);}
}
for(const f of fs.readdirSync(path.join(root,'assets/audio')))if(/LICENSE\.txt$/.test(f))audio.add(f);
for(const f of audio){
 if(f.includes('..')||path.isAbsolute(f)||/reference|bullet-time|jutkiy-zvuk|\.mp3$/i.test(f))throw Error('Invalid export asset: '+f);
 const b=fs.readFileSync(path.join(root,'assets/audio',f));
 if(hashes.has(f)&&crypto.createHash('sha256').update(b).digest('hex')!==hashes.get(f))throw Error('Hash mismatch: '+f);
}
function copy(rel){const out=path.join(target,rel);fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(path.join(root,rel),out);}
for(const dir of ['src','tests'])fs.cpSync(path.join(root,dir),path.join(target,dir),{recursive:true,errorOnExist:true});
for(const rel of ['index.html','build.js','README.md','RELEASE_READINESS.md','AUDIO_CREDITS.md','PLAYGAMA_RANKING.md','PLATFORMS.md','YOUTUBE_PLAYABLES.md','playgama-bridge-config.json',
 'BALANCE_v0.148.md','BALANCE_v0.150.md','BALANCE_v0.162.md',
 'tools/encode-ult-preview.py','tools/build-sound-bank.cjs','tools/audio-provenance.cjs','tools/design-original-weapons.cjs','tools/design-action-audio.cjs','tools/design-comfort-audio.cjs','tools/design-precision-audio.cjs','tools/design-readable-audio.cjs','tools/design-projectile-audio.cjs','tools/design-sniper-variety.cjs','tools/export-source-v0191.cjs',
 'audit/ending-v0183-390x844-4200.png','audit/ending-v0183-844x390-7000.png','audit/ending-v0183-1000x700-7000.png','audit/boss-body-v0188.png','audit/camp-v0191-fresh.png','audit/camp-v0191-partial.png','audit/camp-v0191-complete.png','audit/radar-full-v0189.png','audit/radar-near-v0189.png','audit/final-receipt-v0186-390.png','audit/final-receipt-v0186-844.png','audit/final-receipt-v0186-700.png','audit/boss-loot-v0185-opening.png','audit/boss-loot-v0185-5.png','audit/boss-loot-v0185-10.png','audit/boss-loot-v0185-15.png','audit/boss-loot-v0185-20.png','audit/boss-loot-v0185-20-390.png','audit/boss-loot-v0185-20-844.png','audit/ultimate-motion-v0180.gif','audit/ultimate-v0191-charge.png','audit/ultimate-v0191-fire.png',
 'audit/action-mix-v0181.wav','audit/action-mix-v0181.json','audit/comfort-preview-v0182.wav','audit/dense-mix-v0182.wav','audit/dense-mix-v0182.json',
 'audit/audio-v0182.json','audit/sniper-preview-v0182.wav','audit/sniper-cadence-v0182.json','audit/audio-v0178.json','audit/sniper-preview-v0178.wav','audit/audio-v0174.json','audit/action-preview-v0174.wav','audit/audio-v0173.json','audit/weapon-preview-v0173.wav',
 'dist/playgama/index.html','dist/playgama/playgama-bridge-config.json','dist/StickmanArena_v0.191_QA.html'])copy(rel);
for(const f of audio)copy('assets/audio/'+f);
const concept=path.join(project,'concepts/dragon-game/CONCEPT.md');if(fs.existsSync(concept))fs.copyFileSync(concept,path.join(target,'DRAGON_CONCEPT.md'));
fs.writeFileSync(path.join(target,'audit/export-v0191.json'),JSON.stringify({version:'0.191',audioFiles:[...audio].sort(),noUserReferenceAudio:true,comparisonReadableVersion:manifest.previousReadableVersion,comparisonProjectileVersion:manifest.previousProjectileVersion,comparisonSniperVarietyVersion:manifest.previousSniperVarietyVersion,activeClips:Object.values(manifest.groups).flat().length},null,2)+'\n');
console.log('Exported '+target+'; '+audio.size+' manifest-linked audio/credit files.');
