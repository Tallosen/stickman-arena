// Reproducible bot audit, not a claim of human/mobile play-testing.
const fs=require('fs'),path=require('path'),make=require('./arena-harness.cjs'),results=[];
const weapons=['basic','shotgun','sniper','minigun'],pets=['dog','parrot','boar','cat'];
function trial(weapon,pet,stage,id){
 console.log('start',weapon,stage||'campaign',id||'');
 const h=make();h.run(`let seed=417;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);reset();running=true;P.wtype='${weapon}';P.pet=makePet('${pet}');
 function offerCards(){
  while(queuedLevels>0){const pool=GK.filter(k=>P.gear[k]<GEAR[k].max).sort((a,b)=>P.gear[a]/GEAR[a].max-P.gear[b]/GEAR[b].max);if(pool.length)P.gear[pool[0]]++;else if(P.pet.lvl<PET_MAX)P.pet.lvl++;queuedLevels--;applyGear();P.hp=Math.min(P.hpMax,P.hp+1);}
  paused=false;
 }
 applyGear();inventory.airstrike=1;inventory.gas=1;inventory.tank=1;
 ${stage?`P.lvl=34;P.gear=Object.fromEntries(GK.map(k=>[k,GEAR[k].max]));P.pet.lvl=PET_MAX;applyGear();P.hp=P.hpMax;enterRunStage(${stage});stageBoss.enemy.bossSpec={...stageBoss.enemy.bossSpec,...BOSS_ARCHETYPES.find(a=>a.id==='${id}')};stageBoss.spec=stageBoss.enemy.bossSpec;`:''}
 let steps=0;const limit=${stage?90000:1800000},maxSteps=Math.ceil(limit/33)+100;
 while(running&&P.runMs<limit&&steps<maxSteps){
  if(paused&&!bossRewardPending)throw new Error('Unexpected bot pause at stage '+P.stage);
  if(bossRewardPending){if(${!!stage})break;const options=bossRewardPending.options;claimBossReward((options.find(o=>o.kind==='heal'&&P.hp<P.hpMax*.7)||options[0]).id);continue;}
  const boss=stageBoss?.enemy,a=P.runMs/2100,r=boss?190:300;
  pointer.active=true;pointer.x=Math.max(80,Math.min(WORLD-80,(boss?boss.x:WORLD/2)+Math.cos(a)*r));pointer.y=Math.max(80,Math.min(WORLD-80,(boss?boss.y:WORLD/2)+Math.sin(a)*r));
  if(boss&&steps%900===0){for(const key of ABILITY_KEYS)if(inventory[key]){useAbility(key);break;}}
  if(boss&&ultReady())startUlt();
  update(33,33);steps++;
 }
 `);
 return h.run(`({weapon:P.wtype,pet:P.pet.type,stage:P.stage,boss:'${id||'campaign'}',seconds:Math.round(P.runMs/1000),hp:Math.round(P.hp*10)/10,level:P.lvl,kills:score,bosses:bossRunLog.length,result:P.runWon?'won':bossRewardPending?'boss defeated':P.hp<=0?'died':'time limit'})`);
}
for(let i=0;i<4;i++){
 if(!process.argv.includes('--checkpoints')){results.push(trial(weapons[i],pets[i]));console.log('campaign',JSON.stringify(results.at(-1)));}
 if(!process.argv.includes('--campaigns'))for(const stage of [15,20])for(const id of ['bruiser','gunner','hunter','shaman']){results.push(trial(weapons[i],pets[i],stage,id));console.log('checkpoint',JSON.stringify(results.at(-1)));}
}
const root=path.resolve(__dirname,'../audit'),version=fs.readFileSync(path.join(__dirname,'../src/config.js'),'utf8').match(/VERSION = "([^"]+)"/)[1].replace('.',''),suffix=process.argv.includes('--campaigns')?'-campaigns':process.argv.includes('--checkpoints')?'-checkpoints':'';fs.writeFileSync(path.join(root,'balance-audit-v'+version+suffix+'.json'),JSON.stringify({method:'Fixed seed, real simulation, simple circular bot, automatic normal upgrades, one initial charge of each ability, no invulnerability or extra health. Late checkpoints start with level 34/max gear/max pet. Not human play-testing.',results},null,2));
const late=results.filter(r=>r.boss!=='campaign');console.log('late checkpoint results',JSON.stringify(late));
