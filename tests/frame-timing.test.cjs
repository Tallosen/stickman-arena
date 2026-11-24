const assert=require('node:assert/strict'),make=require('./arena-harness.cjs');
const near=(actual,expected,message)=>assert(Math.abs(actual-expected)<1e-6,`${message}: ${actual} != ${expected}`);
function harness(){
 const h=make();
 h.run(`reset();running=true;paused=false;last=0;props=[];enemies=[];draw=()=>{};
  spawnT=eliteT=chestT=healT=1e6;P.hp=10000;P.invT=1e6;
  const realFrameUpdate=update;let frameSteps=[];
  update=(dt,elapsed)=>{frameSteps.push([dt,elapsed]);realFrameUpdate(dt,elapsed);};`);
 return h;
}
// Exercise the real requestAnimationFrame callback and real combat update.
for(const fps of [60,30,20,10]){
 const h=harness();
 for(let frame=1;frame<=fps*30;frame++)h.frame(frame*1000/fps);
 const s=h.run('({world:t,run:P.runMs,stage:P.stageMs,inv:P.invT,spawn:spawnT,steps:frameSteps})');
 near(s.world,30000,`${fps} FPS combat time`);near(s.run,30000,`${fps} FPS run time`);
 near(s.stage,30000,`${fps} FPS stage time`);near(s.inv,970000,`${fps} FPS immunity timer`);
 near(s.spawn,1e6-30000,`${fps} FPS spawn timer`);
 assert(s.steps.every(([dt,elapsed])=>dt>0&&dt<=1000/60+1e-7&&dt===elapsed),'Combat and campaign share bounded steps');
 for(let frame=fps*30+1;frame<=fps*60;frame++)h.frame(frame*1000/fps);
 near(h.run('P.runMs'),60000,`${fps} FPS first stage clock`);
 assert.equal(h.run('P.stage'),2,`${fps} FPS first stage advances on time`);
}
{
 const h=harness();h.frame(1000);
 near(h.run('t'),100,'A one-second stall advances combat by only the shared 100 ms cap');
 near(h.run('P.runMs'),100,'A stall cannot fast-forward the stage alone');
 assert.equal(h.run('frameSteps.length'),6,'Stalls have a bounded work budget');
 h.frame(1100);near(h.run('t'),200,'No old frame debt carries into the next frame');
 h.run('paused=true;hitStop=40;');h.frame(11100);
 near(h.run('P.runMs'),200,'Pause freezes the run');near(h.run('hitStop'),40,'Pause freezes impact hold');
 h.run('paused=false;');h.frame(11200);
 near(h.run('P.runMs'),300,'Resume accounts for only the new frame');
 near(h.run('t'),260,'Impact hold consumes exactly its own elapsed time');near(h.run('hitStop'),0,'Impact hold ends');
}
{
 const h=harness();h.run('ult.on=true;let ultElapsed=0;updateUlt=dt=>{ultElapsed+=dt;};');h.frame(100);
 near(h.run('ultElapsed'),100,'Ultimate choreography retains real time');
 near(h.run('P.runMs'),100,'Stage clock retains real time during an ultimate');
 near(h.run('t'),30,'Deliberate ultimate world slowdown remains 30 percent');
}
{
 const h=harness();h.run('queuedLevels=1;offerCards=()=>{queuedLevels=0;paused=true;};');h.frame(100);
 assert(h.run('paused'),'Actual level-choice path pauses inside the first substep');
 assert.equal(h.run('frameSteps.length'),1,'No later combat substeps run behind the modal');
 near(h.run('P.runMs'),1000/60,'Unused modal frame time is dropped');
 h.frame(10100);h.run('paused=false;');h.frame(10200);
 near(h.run('P.runMs'),100+1000/60,'Closing a modal does not replay discarded frame time');
}
for(const stop of ['running=false','Playables.blocked=true']){
 const h=harness();h.run(`Playables={requestFrame:requestAnimationFrame,blocked:false};
  update=(dt,elapsed)=>{frameSteps.push([dt,elapsed]);realFrameUpdate(dt,elapsed);${stop};};`);
 h.frame(100);assert.equal(h.run('frameSteps.length'),1,`${stop} cancels remaining substeps`);
 near(h.run('P.runMs'),1000/60,`${stop} does not advance hidden combat`);
}
console.log('PASS: actual loop at 60/30/20/10 FPS; shared combat/stage timers; bounded 100 ms stalls; no pause/modal catch-up; hitstop and ultimate slowdown; midframe death/save stop');
