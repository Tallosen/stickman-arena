const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),harness=require('./arena-harness.cjs');
const h=harness();h.box.assert=assert;h.box.Playables={blocked:false};
h.run(`
reset();running=true;P.stage=19;assert.equal(finishArenaVictory(),false);assert.equal(arenaEnding,null);
P.stage=20;assert.equal(finishArenaVictory(),false);
for(const s of [5,10,15,20])defeatedBossStages.add(s);P.runMs=870123;P.wtype='sniper';P.gear.gun=4;
let victorySounds=0;SFX.victory=()=>victorySounds++;
assert(finishArenaVictory());assert(P.runWon&&!running);assert(arenaEnding);assert.equal(arenaEnding.gear._w,'sniper');
const saved=JSON.stringify({gear:P.gear,hp:P.hp,time:P.runMs,meta,inventory,score});
assert.equal(finishArenaVictory(),false);assert.equal(startArenaEnding(),false);
Playables.blocked=true;updateArenaEnding(5000);assert.equal(arenaEnding.age,0);assert.equal(completeArenaEnding(),false);Playables.blocked=false;
paused=true;updateArenaEnding(100);assert.equal(arenaEnding.age,0);paused=false;
for(let i=0;i<83;i++)updateArenaEnding(100);
assert.equal(arenaEnding,null);assert.equal(victorySounds,1);assert.equal(completeArenaEnding(),false);
assert.equal(JSON.stringify({gear:P.gear,hp:P.hp,time:P.runMs,meta,inventory,score}),saved,'Presentation must not grant twice or change the winning loadout/time');
assert(startArenaEnding());updateArenaEnding(100);assert(completeArenaEnding());reset();assert.equal(arenaEnding,null);assert.equal(arenaEndingBackdrop,null);
globalThis.matchMedia=()=>({matches:true});running=true;P.stage=20;for(const s of [5,10,15,20])defeatedBossStages.add(s);finishArenaVictory();assert.equal(arenaEnding.duration,3200);assert(arenaEnding.reduced);reset();
`);
if(process.argv.includes('--frames')){
 const root=path.join(__dirname,'..'),{createCanvas}=require('@napi-rs/canvas');
 for(const [width,height] of [[390,844],[844,390],[1000,700]]){
  const v=harness({native:true,width,height});
  v.box.resultCanvas=createCanvas(420,245);
  v.run("Object.assign(document.getElementById('victoryDragonCanvas'),{width:420,height:245,getContext:()=>resultCanvas.getContext('2d')});");
  v.run(`reset();running=true;P.stage=20;P.wtype='sniper';for(const k of GK)P.gear[k]=GEAR[k].max;applyGear();P.pet={type:'dog',lvl:3};for(const s of [5,10,15,20])defeatedBossStages.add(s);draw();finishArenaVictory();`);
  for(const age of [1600,4200,7000]){
   v.run('arenaEnding.age='+age+';updateArenaEnding(0);drawArenaEnding(ctx);');
   // Compose HTML copy for a native-render preview; this is not a browser screenshot.
   const g=v.ctx,day=age/8200>=.34;g.textAlign='center';g.fillStyle=day?'#62462d':'#fff3d5';g.font='bold '+(height<480?23:28)+'px system-ui';
   g.fillText(v.run("document.getElementById('endingTitle').textContent"),width/2,height<480?57:height*.16,width-30);
   g.font='12px system-ui';g.fillText(v.run("document.getElementById('endingSubtitle').textContent"),width/2,height<480?86:height*.21,width-30);
   const file='ending-v0183-'+width+'x'+height+'-'+age+'.png';fs.writeFileSync(path.join(root,'audit',file),v.canvas.toBuffer('image/png'));
  }
 }
}
console.log('PASS: final boss gate, victory saved before epilogue, once-only result/sound, blocked/pause/skip/reset, unchanged winning state and reduced motion');
