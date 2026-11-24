const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const root=path.join(__dirname,'..'),design=require('../tools/design-action-audio.cjs'),{wav,metrics}=require('../tools/design-original-weapons.cjs');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/audio/manifest.json')));
const signatures=new Set();
for(const name of Object.keys(design.DESIGNS))for(let take=0;take<3;take++){
 // Older generators remain deterministic even when a newer A/B baseline replaces their files.
 const clip=[...manifest.groups[name],...(manifest.previousWeapons[name]||[])].find(c=>c.design==='short-action-cues-v0174'&&c.take===take),a=design.render(name,take),b=design.render(name,take);
 assert.deepEqual(a.pcm,b.pcm);
 if(clip){assert.deepEqual(wav(a.pcm),fs.readFileSync(path.join(root,'assets/audio',clip.file)));assert.equal(clip.source,'project-original-effects');assert.deepEqual(clip.components,[]);}
 signatures.add(crypto.createHash('sha256').update(a.pcm).digest('hex'));
 const m=metrics(a.pcm);assert(m.duration<=.5);assert(m.peak<=.381);assert(m.rms>.005&&m.rms<=.061);
 assert(Math.abs(m.mean)<.001);assert(m.tailEnergyRatio<.035,'No long ringing/noisy tail');
 assert.equal(a.pcm.readInt16LE(0),0);assert.equal(a.pcm.readInt16LE(a.pcm.length-2),0);
}
assert.equal(signatures.size,21);assert.equal(manifest.previousEffectsVersion,'0.173');
const h=require('./arena-harness.cjs')();h.box.assert=assert;
h.run(`
let actionEvents=[];
for(const key of Object.keys(SFX))SFX[key]=(...args)=>actionEvents.push([key,...args]);
function quietScene(){reset();running=true;paused=false;props=[];chests=[];pickups=[];enemies=[];spawnT=eliteT=chestT=healT=1e8;actionEvents=[];}
quietScene();chests=[{x:P.x,y:P.y,a:0,item:'nade'}];update(16);
assert.equal(P.item,'nade');assert.equal(actionEvents.filter(x=>x[0]==='pickup').length,1);
assert(!actionEvents.some(x=>x[0]==='chest'));actionEvents=[];update(16);assert(!actionEvents.some(x=>x[0]==='pickup'));
quietScene();chests=[{x:P.x,y:P.y,a:0,rare:true}];update(16);
assert.equal(actionEvents.filter(x=>x[0]==='chest').length,1,'Rare reward has one owner, not two sound calls');
quietScene();inventory.airstrike=0;chests=[{x:P.x,y:P.y,a:0,elite:true,dropT:5,landT:0,rewardKind:'airstrike'}];
update(16);assert.equal(actionEvents.filter(x=>x[0]==='crateLand').length,1);assert(!actionEvents.some(x=>x[0]==='chest'));
actionEvents=[];update(16);assert.equal(actionEvents.filter(x=>x[0]==='chest').length,1);assert.equal(chests.length,0);
quietScene();inventory.airstrike=0;let waiting={x:P.x,y:P.y,a:0,elite:true,dropT:0,landT:0,rewardKind:'airstrike'};chests=[waiting];
const save=localStorage.setItem;localStorage.setItem=()=>{throw Error('fixture');};update(16);localStorage.setItem=save;
assert.equal(chests.length,1);assert(!actionEvents.some(x=>x[0]==='chest'),'No reward sound on failed save');
quietScene();P.item='nade';paused=true;useItem();assert.equal(actionEvents.length,0);assert.equal(P.item,'nade');
paused=false;useItem();assert.equal(nades.length,1);assert.equal(actionEvents.filter(x=>x[0]==='grenadeThrow').length,1);
useItem();assert.equal(actionEvents.filter(x=>x[0]==='grenadeThrow').length,1,'Empty input must not play another throw');
assert(!actionEvents.some(x=>x[0]==='grenadeBlast'||x[0]==='boom'));
update(650);assert(!actionEvents.some(x=>x[0]==='grenadeBlast'));update(60);
assert.equal(nades.length,0);assert.equal(actionEvents.filter(x=>x[0]==='grenadeBlast').length,1);assert(!actionEvents.some(x=>x[0]==='boom'));
actionEvents=[];update(16);assert(!actionEvents.some(x=>x[0]==='grenadeBlast'));
explode(P.x,P.y,100,3);assert.equal(actionEvents.filter(x=>x[0]==='boom').length,1,'Other explosions keep their own sound');
quietScene();inventory.airstrike=1;assert(useAbility('airstrike'));
assert.equal(actionEvents.filter(x=>x[0]==='ability'&&x[1]==='airstrike').length,1);
for(let i=0;i<520;i++)updateAbilities(16,16/16.667);
assert.equal(actionEvents.filter(x=>x[0]==='airstrikeImpact').length,11,'Each actual missile detonation has a dedicated cue');
assert(!actionEvents.some(x=>x[0]==='boom'),'Airstrike must not fall back to the quiet mine explosion');
for(const [weapon,pool] of Object.entries(EMPOWERED_ULTS))for(const profile of pool){
 quietScene();P.wtype=weapon;P.gear.gun=4;applyGear();ult.forceSignature=profile.id;ult.charge=ULT_FULL;startUlt();
 paused=true;updateUlt(500);assert(!actionEvents.some(x=>x[0]==='ultMove'));paused=false;
 for(let i=0;i<160;i++)updateUlt(20);
 assert.equal(actionEvents.filter(x=>x[0]==='ultimate').length,1,profile.id+' starts once');
 assert.equal(actionEvents.filter(x=>x[0]==='ultMove').length,1,profile.id+' has one movement cue');
 assert.equal(actionEvents.filter(x=>x[0]==='ultLand').length,1,profile.id+' has one landing cue');
 assert.equal(actionEvents.filter(x=>x[0]==='shot').length,profile.beats.length,profile.id+' shots match animation beats');
}
for(const mode of [...ULT_MODES,...SNIPER_ULT_MODES,'dragonburst']){
 quietScene();spawn('basic');Object.assign(enemies.at(-1),{x:P.x+60,y:P.y,hp:10000});ult.charge=ULT_FULL;ult.forceMode=mode;startUlt();startUlt();
 assert.equal(actionEvents.filter(x=>x[0]==='ultimate').length,1,'One start per cast');
 for(let i=0;i<150;i++)updateUlt(34);
 assert(!actionEvents.some(x=>x[0]==='boom'),mode+' must not reuse generic explosion');
 if(['cross','kick','meteor','dragonburst'].includes(mode))assert(actionEvents.some(x=>x[0]==='ultImpact'),mode+' missing impact cue');
}
`);
console.log('PASS: 21 action clips; pickups/rewards exactly once; grenade release/fuse separation; failed save, pause, empty input; ultimate cues and existing blast routing');
