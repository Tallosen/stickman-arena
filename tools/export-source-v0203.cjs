const fs=require('node:fs'),path=require('node:path');
const {root,sha256}=require('./release-fingerprint.cjs');
const project=path.resolve(root,'../..'),target=path.join(project,'work/full_source_v0.203');
if(fs.existsSync(target))throw Error('Preserve the existing snapshot; do not overwrite it.');
if(!fs.readFileSync(path.join(root,'src/config.js'),'utf8').includes('VERSION = "0.203"'))throw Error('Wrong version');
const preflight=JSON.parse(fs.readFileSync(path.join(root,'audit/release-preflight.json'),'utf8'));
if(!preflight.artifactChecksPassed||preflight.version!=='0.203')throw Error('Run the current preflight first');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/audio/manifest.json'),'utf8'));
require('./audio-provenance.cjs').validate(manifest);
const audio=new Set(['manifest.json']),hashes=new Map();
for(const groups of [manifest.groups,manifest.previousWeapons])for(const clips of Object.values(groups))for(const clip of clips){
 audio.add(clip.file);hashes.set(clip.file,clip.sha256);
 for(const part of [clip,...(clip.components||[])])if(part.original){const file='originals/'+part.original;audio.add(file);hashes.set(file,part.originalSha256);}
}
for(const file of fs.readdirSync(path.join(root,'assets/audio')))if(/LICENSE\.txt$/.test(file))audio.add(file);
for(const file of audio){
 if(file.includes('..')||path.isAbsolute(file)||/reference|bullet-time|jutkiy-zvuk|\.mp3$/i.test(file))throw Error('Unapproved audio export: '+file);
 if(hashes.has(file)&&sha256(fs.readFileSync(path.join(root,'assets/audio',file)))!==hashes.get(file))throw Error('Audio hash mismatch: '+file);
}
function copy(file){const out=path.join(target,file);fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(path.join(root,file),out);}
for(const dir of ['src','tests'])fs.cpSync(path.join(root,dir),path.join(target,dir),{recursive:true,errorOnExist:true});
for(const file of fs.readdirSync(path.join(root,'tools')))if(/\.(cjs|py)$/.test(file))copy('tools/'+file);
for(const file of fs.readdirSync(root))if(/\.md$/.test(file))copy(file);
for(const file of ['index.html','build.js','playgama-bridge-config.json','release-gates.json',
 'dist/playgama/index.html','dist/playgama/playgama-bridge-config.json','dist/StickmanArena_v0.203_QA.html',
 'audit/regression-current.json','audit/regression-v0203.log','audit/release-preflight.json',
 'audit/hero-hands-v0203.png','audit/combat-grip-v0200.png','audit/camp-v0203-fresh.png','audit/camp-v0203-partial.png','audit/camp-v0203-complete.png',
 'audit/ultimate-v0203-charge.png','audit/ultimate-v0203-fire.png','audit/weapon-preview-v0173.wav','audit/boar-animation-v0202.png','audit/boar-motion-v0202.gif'])copy(file);
for(const file of audio)copy('assets/audio/'+file);
fs.writeFileSync(path.join(target,'audit/export-v0203.json'),JSON.stringify({version:'0.203',publishReady:false,audioFiles:[...audio].sort(),noUserReferenceAudio:true,activeClips:Object.values(manifest.groups).flat().length},null,2)+'\n');
console.log('Exported preserved source snapshot: '+target);

