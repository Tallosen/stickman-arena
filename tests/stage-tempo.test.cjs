const assert=require('assert'),h=require('./arena-harness.cjs')();h.box.assert=assert;
h.run(`
for(let stage=1;stage<=20;stage++){
 let density=0;
 for(let ms=0;ms<60000;ms+=100){const tempo=stageTempo(stage,ms);assert(tempo.density>=.65&&tempo.density<=1.35);assert(Number.isFinite(stageSpawnInterval(stage,ms)));density+=tempo.density/600;}
 if(isBossStage(stage)){assert.equal(stageSpawnInterval(stage,42000),stageWave(stage).interval*3);assert.equal(stageTempo(stage,0).phase,'boss');}
 else{assert(density>.95&&density<1);assert.equal(stageTempo(stage,0).phase,'breather');assert.equal(stageTempo(stage,20000).phase,'steady');assert.equal(stageTempo(stage,42000).phase,'surge');assert.equal(stageTempo(stage,59000).phase,'breather');}
 for(const boundary of [6000,12000,36000,40000,48000,54000])assert(Math.abs(stageTempo(stage,boundary-1).density-stageTempo(stage,boundary+1).density)<.001);
}
reset();running=true;props=[];P.stage=6;P.stageMs=0;spawnT=1e9;eliteT=0;chestT=healT=1e9;
update(16);assert(!enemies.some(e=>e.kind==='elite'),'no elite during initial breather');
P.stageMs=12000;update(16);assert.equal(enemies.filter(e=>e.kind==='elite').length,1);
const elite=enemies.find(e=>e.kind==='elite');P.stageMs=55000;eliteT=0;update(16);assert(enemies.includes(elite),'breather cannot erase survivors');assert.equal(enemies.filter(e=>e.kind==='elite').length,1);
paused=true;const before=P.stageMs,spawnBefore=spawnT;update(1000);assert.equal(P.stageMs,before);assert.equal(spawnT,spawnBefore);
paused=false;P.stageMs=59999;updateRunProgress(1);assert.equal(P.stage,7);assert.equal(stageTempo(P.stage,P.stageMs).phase,'breather');
reset();assert.equal(P.stageMs,0);
console.log('PASS: all stages, unchanged boss cadence, 97% mean reinforcement density, smooth boundaries, deferred elites, preserved survivors, paused timers and stage/reset transitions');
`);
