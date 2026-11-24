// Controlled stationary-target DPS, not campaign win rate. Both versions run real update/projectiles.
const fs=require('fs'),path=require('path'),make=require('./arena-harness.cjs');
const baseline=process.argv[2]?path.resolve(process.argv[2]):path.resolve(__dirname,'../../full_source_v0.149');
const results=[];
for(const version of ['0.149','0.150']){
 const h=make(version==='0.149'?{sourceRoot:baseline}:{});
 for(const level of [1,34])for(const distance of [120,260])for(const clip of [0,3])for(const weapon of ['basic','shotgun','sniper','minigun']){
  if(level===1&&(distance===260||clip))continue;
  const samples=[];
  for(const seed of [417,831,1207]){
   const result=h.run(`{
    let seed=${seed};Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    reset();running=true;props=[];arenaSecrets=[];P.wtype='${weapon}';P.lvl=${level};
    if(P.lvl>1)P.gear=Object.fromEntries(GK.map(k=>[k,GEAR[k].max]));P.gear.clip=${clip};applyGear();
    P.pet=null;P.invT=1e9;P.hp=P.hpMax;P.x=1400;P.y=1400;spawnT=eliteT=chestT=healT=1e9;
    spawn('elite');const dummy=enemies[0];Object.assign(dummy,{x:P.x+${distance},y:P.y,r:30,speed:0,hp:1e9,maxhp:1e9,boss:true,bossSpec:{stage:20,id:'bruiser',attacks:['slam']},attackCd:1e9});
    for(let i=0;i<900;i++)update(33,33);
    ({dps:(1e9-dummy.hp)/29.7,hp:P.hp,shots:shots.length})
   }`);samples.push(result.dps);
  }
  const row={version,weapon,level,distance,clip,dps:Math.round(samples.reduce((a,b)=>a+b,0)/samples.length*10)/10};results.push(row);
 }
 console.log(version,JSON.stringify(results.filter(r=>r.version===version)));
}
const pacing=[];
for(const version of ['0.149','0.150']){
 const h=make(version==='0.149'?{sourceRoot:baseline}:{});
 for(const stage of [1,8,14,19]){
  pacing.push(h.run(`{reset();running=true;P.stage=${stage};props=[];arenaSecrets=[];chestT=healT=1e9;
   let regular=0,elites=0,segments=[0,0,0];spawn=kind=>{if(kind==='elite')elites++;else{regular++;segments[P.stageMs<12000?0:P.stageMs<48000?1:2]++;}};
   for(let i=0;i<1818;i++)update(33,33);
   ({version:'${version}',stage:P.stage,regular,elites,segments})}`));
 }
}
console.log('pacing',JSON.stringify(pacing));
const report={method:'Three seeds 417/831/1207, 29.7 seconds, real 33ms update loop. Stationary radius-30 elite target, no pets/abilities/mobs/obstacles. Player invulnerability isolates damage output; these are NOT survival or campaign tests. Level 1/no gear or level 34/max gear except specified clip. Baseline reads preserved v0.149 source.',results,pacingMethod:'59.994s per normal stage, 33ms update. Count spawn requests without creating enemies (no population cap interference). Segments: 0-12s, 12-48s, 48-60s. Initial elite timer is the normal reset value, 44s.',pacing};
fs.writeFileSync(path.resolve(__dirname,'../audit/weapon-comparison-v0150.json'),JSON.stringify(report,null,2));
