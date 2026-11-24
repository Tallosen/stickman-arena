const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync(path.join(__dirname,'../src/camp-progress.js'),'utf8');
function setup(saved,cloud=false,legacy={}){
 const db=new Map(saved===undefined?[]:[['vacky_arena_camp_v1',saved]]),writes=[];
 const box={assert,meta:legacy,WEAPONS:{basic:{},shotgun:{},sniper:{},minigun:{}},P:{runMs:0,stage:1,testRun:false},score:0,bossRunLog:[],fail:false};
 const storage={getItem:k=>db.get(k)??null,setItem:(k,v)=>{if(box.fail)throw Error('Denied');writes.push(k);db.set(k,v);}};
 box.localStorage=cloud?{getItem(){throw Error('Cloud read browser');},setItem(){throw Error('Cloud wrote browser');}}:storage;
 if(cloud)box.Playables={storage,blocked:false};vm.createContext(box);vm.runInContext(code,box);
 return {box,db,writes,run:s=>vm.runInContext(s,box)};
}
for(const cloud of [false,true]){
 const h=setup(undefined,cloud);h.run(`
 assert.equal(campReadOnly,false);assert(campWeaponOpen('basic'));assert(!campChoose('weapon','sniper'));assert(!campChoose('trial','rush'));assert(!campChoose('__proto__','x'));
 beginCampRun();assert.equal(P.wtype,'basic');assert.equal(checkpointCamp(),false);
 P.runMs=1000;P.stage=5;score=100;bossRunLog=[{stage:5,id:'hunter',clean:true}];assert(checkpointCamp());
 assert.equal(campProfile.kills,100);assert.equal(campProfile.bosses,1);assert(campUnlocked('first'));assert(campUnlocked('clean'));assert.equal(P.campRun.unlocks.length,2);
 checkpointCamp();checkpointCamp();assert.equal(campProfile.kills,100);assert.equal(campProfile.bosses,1);assert.equal(P.campRun.unlocks.length,2);
 assert(campChoose('weapon','shotgun'));assert.equal(P.wtype,'basic','loadout must not alter active run');
 P.runMs=0;P.stage=1;score=0;bossRunLog=[];beginCampRun();assert.equal(P.wtype,'shotgun');
 P.runMs=2000;P.stage=10;score=400;checkpointCamp();assert.equal(campProfile.kills,500);assert(campUnlocked('ten'));assert(campUnlocked('crowd'));assert(campStyleOpen('tide'));
 assert(campChoose('style','tide'));assert.equal(P.campStyle,'classic');
 const before=JSON.stringify(campProfile);P.testRun=true;score=10000;P.runWon=true;checkpointCamp();assert.equal(JSON.stringify(campProfile),before);
 P.testRun=false;P.runWon=false;score=450;fail=true;assert(!checkpointCamp());assert(campSaveError);assert.equal(campProfile.kills,500);
 assert(!campChoose('weapon','sniper'));assert.equal(campProfile.weapon,'shotgun');fail=false;checkpointCamp();assert.equal(campProfile.kills,550);assert(!campSaveError);checkpointCamp();assert.equal(campProfile.kills,550);
 P.stage=20;P.runWon=true;P.runMs=1200000;P.trial='normal';bossRunLog=[{stage:10,id:'bruiser'},{stage:15,id:'gunner'},{stage:20,id:'shaman'}];checkpointCamp();
 assert(campUnlocked('clear'));assert(campUnlocked('collection'));assert.equal(campProfile.wins,1);checkpointCamp();assert.equal(campProfile.wins,1);assert.equal(campProfile.best.normal,1200000);
 assert(campChoose('trial','rush'));P.runWon=false;P.runMs=0;score=0;bossRunLog=[];beginCampRun();assert.equal(P.trial,'rush');assert.equal(P.campStyle,'tide');assert.equal(campModifier('speed'),1.15);assert.equal(campModifier('bossHP'),1);
 P.runMs=1500000;P.runWon=true;checkpointCamp();assert(campUnlocked('trial'));assert.equal(campProfile.best.rush,1500000);assert.equal(campProfile.best.normal,1200000);assert(campStyleOpen('ember'));
 P.trial='bosses';assert.equal(campModifier('bossHP'),1.25);assert.equal(campModifier('speed'),1);P.trial='elites';assert.equal(campModifier('eliteInterval'),1/1.3);
 `);
 assert(h.writes.every(k=>k==='vacky_arena_camp_v1'),'Other save keys modified');
 const reload=setup(h.db.get('vacky_arena_camp_v1'),cloud);reload.run(`assert(campUnlocked('first'));assert(campUnlocked('trial'));assert.equal(campProfile.kills,550);assert.equal(campProfile.weapon,'shotgun');assert.equal(campProfile.style,'tide');`);
 if(cloud){h.run(`Playables.blocked=true;assert(!campChoose('weapon','sniper'));`);}
}
for(const raw of ['{','null','[]','{"version":99}','{"version":1}']){
 const h=setup(raw);h.run(`assert(campReadOnly);assert(!campChoose('weapon','basic'));beginCampRun();P.runMs=500;score=1000;assert(!checkpointCamp());`);assert.equal(h.db.get('vacky_arena_camp_v1'),raw);assert.equal(h.writes.length,0);
}
const veteran=setup(undefined,false,{bestClearMs:999000,hp:4});veteran.run(`assert(campUnlocked('clear'));assert(campWeaponOpen('sniper'));assert.equal(campProfile.best.normal,999000);assert.equal(meta.hp,4);`);assert.equal(veteran.writes.length,0);
// A late parse failure must not return the partially populated working profile.
const partial={version:1,kills:500,bosses:4,stage:20,wins:'broken',shotgunStage:10,clean:1,bossTypes:[],trialWins:{},best:{}};
const broken=setup(JSON.stringify(partial));broken.run(`assert(campReadOnly);assert.equal(campProfile.kills,0);assert(!campUnlocked('first'));assert(!campWeaponOpen('minigun'));assert(!retryCampSave());`);assert.equal(broken.writes.length,0);
for(const bad of [[],true,'broken']){
 const sample={...partial,wins:1,trialWins:bad};setup(JSON.stringify(sample)).run(`assert(campReadOnly);assert.equal(campProfile.wins,0);`);
}
const locked={version:1,kills:0,bosses:0,stage:0,wins:0,shotgunStage:0,clean:0,bossTypes:[],trialWins:{},best:{},weapon:'sniper',style:'ember',trial:'bosses'};
const normalized=setup(JSON.stringify(locked));normalized.run(`assert(!campReadOnly);assert.equal(campProfile.weapon,'basic');assert.equal(campProfile.style,'classic');assert.equal(campProfile.trial,'normal');`);assert.equal(normalized.writes.length,0);
setup().run(`beginCampRun();P.runMs=100;score=500;fail=true;checkpointCamp();assert(campSaveError);assert(!retryCampSave());assert.equal(campProfile.kills,0);fail=false;assert(retryCampSave());assert.equal(campProfile.kills,500);assert.equal(P.campRun.unlocks.filter(id=>id==='crowd').length,1);retryCampSave();checkpointCamp();assert.equal(campProfile.kills,500);assert.equal(P.campRun.unlocks.filter(id=>id==='crowd').length,1);`);
setup(undefined,false,{bestClearMs:999000}).run(`fail=true;assert(!campChoose('weapon','sniper'));fail=false;assert(retryCampSave());assert(!campSaveError);assert.equal(campProfile.weapon,'basic');`);
setup(undefined,false,{bestStage:20}).run(`assert(!campUnlocked('clear'));assert(!campWeaponOpen('sniper'));`);
const qa=setup(undefined,true);qa.run(`Playables.testStorage=true;Playables.cloud=false;beginCampRun();P.testRun=true;P.runMs=1000;score=500;bossRunLog=[{stage:5,id:'hunter',clean:true}];assert(checkpointCamp());assert(campUnlocked('first'));assert(campUnlocked('crowd'));assert(campUnlocked('clean'));checkpointCamp();assert.equal(campProfile.bosses,1);Playables.cloud=true;score=600;assert(!checkpointCamp());assert.equal(campProfile.kills,500);`);
setup().run(`beginCampRun();P.runMs=100;score=40;fail=true;checkpointCamp();checkpointCamp();assert.equal(campProfile.kills,0);P.runMs=0;score=0;beginCampRun();P.runMs=100;score=30;checkpointCamp();fail=false;checkpointCamp();assert.equal(campProfile.kills,70);checkpointCamp();assert.equal(campProfile.kills,70);`);
// Real gameplay hooks, including no-hit boss detection and trial enemy HP/speed.
const h=require('./arena-harness.cjs')();h.box.assert=assert;h.run(code);
h.run(`
reset();running=true;P.runMs=1000;enterRunStage(5);assert.equal(stageBoss.enemy.campEntryHits,0);hurtHero(.5,{x:P.x+10,y:P.y});assert.equal(P.damageHits,1);
stageBoss.enemy.hp=0;stageBoss.enemy.rewarded=true;updateRunProgress(0);assert.equal(bossRunLog[0].clean,false);assert(!campUnlocked('clean'));assert.equal(campProfile.bosses,1);
P.x=bossLoot.x;P.y=bossLoot.y;updateBossLoot(34,1000);updateBossLoot(34,300);for(let i=0;i<7;i++)updateBossLoot(100,100);assert(!bossRewardPending);P.hurt=0;enterRunStage(10);stageBoss.enemy.hp=0;stageBoss.enemy.rewarded=true;updateRunProgress(0);assert(campUnlocked('clean'));
reset();P.trial='normal';props=[];spawn('basic');const baseSpeed=enemies[0].speed;P.trial='rush';spawn('basic');assert.equal(enemies[1].speed,baseSpeed*1.15);
P.trial='bosses';assert.equal(chooseBossSpec(20).hp,22500);P.trial='normal';assert.equal(chooseBossSpec(20).hp,18000);
`);
console.log('PASS: all 8 unlocks, no duplicate grants, loadout isolation, no-hit hook, test exclusion, local/cloud reload, retry/rollback, corrupt/future save preservation, separate trial records and live modifiers.');
h.run(fs.readFileSync(path.join(__dirname,'../src/camp-ui.js'),'utf8'));
h.run(`
reset();running=true;P.stage=20;P.runMs=1000;P.trial='bosses';P.testRun=true;for(const s of [5,10,15,20])defeatedBossStages.add(s);
assert(finishArenaVictory());assert(document.getElementById('victoryRecord').textContent.includes('Тестовый'));
reset();campProfile=blankCamp();campReadOnly=true;running=true;P.stage=20;P.runMs=1500;P.trial='bosses';for(const s of [5,10,15,20])defeatedBossStages.add(s);
assert(finishArenaVictory());assert.equal(document.getElementById('victoryRecord').textContent,campText('noRecord'));
`);
console.log('PASS: test-trial result stays marked as test; an unsaved trial time is not presented as a saved record.');
