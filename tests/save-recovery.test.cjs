const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),make=require('./arena-harness.cjs');
const h=make(),db=new Map();let reject=false;h.box.assert=assert;
h.box.localStorage={getItem:key=>db.get(key)||null,setItem:(key,value)=>{if(reject)throw Error('Transient storage failure');db.set(key,value);}};
h.run(fs.readFileSync(path.join(__dirname,'../src/ranking.js'),'utf8'));
h.run('reset();P.runMs=10000;P.redKills=42;');reject=true;
h.run(`assert(!recordRunScore());assert(P.rankingQueued);assert(!P.rankingRecorded);assert.equal(rankingDraft.runs.length,1);assert.equal(rankingProfile.best,0);
assert(!recordRunScore());assert.equal(rankingDraft.runs.length,1,'Retry cannot duplicate a finished run');
reset();assert(!P.rankingQueued);P.runMs=10000;P.redKills=9;assert(!recordRunScore());assert.equal(rankingDraft.runs.length,2);assert.equal(rankingDraft.best,42);`);
reject=false;h.run(`assert(retryRankingSave());assert(P.rankingRecorded);assert.equal(rankingProfile.best,42);assert.equal(rankingProfile.runs.length,2);assert.equal(rankingDraft,null);assert(!recordRunScore());assert.equal(loadRanking().best,42);`);
// A failed end score is retryable even after a new, still-active run has begun.
reject=true;h.run(`reset();P.runMs=20000;P.redKills=77;assert(!recordRunScore());reset();running=true;P.runMs=1000;P.redKills=3;`);
reject=false;h.run(`assert(retryRankingSave());assert.equal(rankingProfile.best,77);assert(!P.rankingRecorded,'Previous save must not mark the active run completed');assert(!P.rankingQueued);assert.equal(rankingProfile.runs.length,3);
P.runMs=20000;P.redKills=77;assert(recordRunScore());assert.equal(rankingProfile.runs.filter(r=>r.kills===77&&r.ms===20000).length,2,'Identical results from two different runs both count');`);
// A failed write cannot grant a free cast or spend the in-memory inventory.
h.run(`reset();running=true;paused=false;inventory.airstrike=inventory.gas=inventory.tank=1;assert(saveInventory());`);reject=true;
h.run(`for(const kind of ABILITY_KEYS){assert(!useAbility(kind));assert.equal(inventory[kind],1);}
assert.equal(airstrike,null);assert.equal(gasCloud,null);assert.equal(allyTanks.length,0);assert.equal(abilityBursts.length,0);assert.equal(pops.filter(p=>p.inventoryError).length,1,'One readable warning, not one per repeated tap');`);
reject=false;h.run(`assert(useAbility('airstrike'));assert.equal(inventory.airstrike,0);assert(airstrike);assert.equal(abilityBursts.length,1);loadInventory();assert.equal(inventory.airstrike,0);`);
// QA and challenge scores never enter either the durable table or retry draft.
reject=true;h.run(`reset();P.runMs=10000;P.redKills=999;P.testRun=true;assert(!recordRunScore());assert.equal(rankingDraft,null);assert(!P.rankingQueued);
P.testRun=false;P.trial='rush';assert(!recordRunScore());assert.equal(rankingDraft,null);assert.equal(rankingProfile.best,77);`);
console.log('PASS: failed finished scores survive in-page restart without duplication; retry does not finish an active run; QA exclusions; ability save failure rolls back before any effect');

// Unreadable inventory must not be replaced by an apparently empty inventory.
reject=false;
for(const raw of ['{broken','null','[]','{"airstrike":-1}','{"tank":1.5}']){
 db.set('vacky_stickman_inventory_v1',raw);
 h.run(`assert(!loadInventory());assert(inventoryReadOnly);assert(!saveInventory({airstrike:1,gas:0,tank:0}));
  reset();running=true;paused=false;{const c={x:P.x,y:P.y,rewardKind:'gas'};assert(!grantEliteChestReward(c));assert(!c.rewardGranted);}`);
 assert.equal(db.get('vacky_stickman_inventory_v1'),raw);
}
db.set('vacky_stickman_inventory_v1','{"vacuum":4,"gas":2,"tank":1}');
h.run(`assert(loadInventory());assert(!inventoryReadOnly);assert.equal(inventory.airstrike,4);assert.equal(inventory.gas,2);`);
// Actual rare-map chest loop keeps both the chest and its original roll on failure.
reject=true;h.run(`reset();running=true;paused=false;props=[];enemies=[];spawnT=eliteT=chestT=healT=1e8;
 chests=[{x:P.x,y:P.y,a:0,rare:true}];update(16);assert.equal(chests.length,1);const rolled=chests[0].rewardKind;
 const oldInventory=JSON.stringify(inventory);update(16);assert.equal(chests[0].rewardKind,rolled);assert.equal(JSON.stringify(inventory),oldInventory);`);
reject=false;h.run(`chests[0].retryT=0;update(16);assert.equal(chests.length,0);assert.equal(inventory[rolled],JSON.parse(oldInventory)[rolled]+1);`);

// A delayed leaderboard acknowledgement cannot discard a newer local best.
(async()=>{
 const fresh=make(),store=new Map();let fail=false,ack,sent=[];fresh.box.assert=assert;
 fresh.box.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>{if(fail)throw Error('quota');store.set(k,v);}};
 fresh.run(fs.readFileSync(path.join(__dirname,'../src/ranking.js'),'utf8'));
 fresh.box.Playables={storage:fresh.box.localStorage,leaderboardType:'in_game',testStorage:false,hostPaused:false,savePending:false,
  submitLeaderboard:n=>{sent.push(n);return new Promise(resolve=>ack=resolve);}};
 fresh.run('reset();P.runMs=2000;P.redKills=50;assert(recordRunScore());');assert.deepEqual(sent,[50]);
 fail=true;fresh.run('reset();P.runMs=3000;P.redKills=80;assert(!recordRunScore());');
 ack();for(let i=0;i<10;i++)await Promise.resolve();
 fresh.run('assert.equal(rankingDraft.best,80);assert.equal(rankingDraft.pending,80);assert.equal(rankingDraft.runs.length,2);');
 fail=false;fresh.run('assert(retryRankingSave());');assert.deepEqual(sent,[50,80]);
 // A second failed, lower-score draft includes the 80 pending acknowledgement.
 fail=true;fresh.run('reset();P.runMs=4000;P.redKills=20;assert(!recordRunScore());');ack();
 for(let i=0;i<10;i++)await Promise.resolve();
 fresh.run('assert.equal(rankingDraft.pending,0);assert.equal(rankingDraft.runs.length,3);');
 fail=false;fresh.run('assert(retryRankingSave());assert.equal(rankingProfile.best,80);assert.equal(rankingProfile.runs.length,3);');assert.deepEqual(sent,[50,80]);
 fresh.box.Playables.savePending=true;fresh.run('refreshRunScoreReceipt();assert(document.getElementById("overScoreStatus").textContent.includes("ожидает сохранения"));');
 fresh.box.Playables.savePending=false;fresh.run('refreshRunScoreReceipt();assert(document.getElementById("overScoreStatus").textContent.includes("Счёт сохранён"));');
 console.log('PASS: corrupted inventory is preserved, rare chest retry does not reroll, delayed leaderboard acknowledgement retains newer drafts, queued cloud receipt is truthful');
})().catch(error=>{console.error(error);process.exitCode=1;});
