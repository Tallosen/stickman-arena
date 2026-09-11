"use strict";
/* Active play time is independent of XP, simulation slow motion and upgrade choices. */
function campaignComplete(){return (P.runMs||0)>=RUN_MAIN_MS;}
function campaignRemaining(){return Math.max(0,RUN_LIMIT_MS-(P.runMs||0));}
function stageRemaining(){return campaignComplete()?campaignRemaining():STAGE_MS-(P.runMs||0)%STAGE_MS;}
function formatRunTime(ms){const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function updateRunProgress(dt){
  if(!running||paused||dragonFinale)return;
  if(typeof dragonHomeOpen==='function'&&dragonHomeOpen())return;
  if(typeof dragonBookOpen==='function'&&dragonBookOpen())return;
  P.runMs=Math.min(RUN_LIMIT_MS,(P.runMs||0)+Math.max(0,Number(dt)||0));
  const stage=Math.min(RUN_STAGES,1+Math.floor(P.runMs/STAGE_MS));
  if(stage!==P.stage){
    P.stage=stage;P.stagePulse=1600;
    spawnT=Math.min(spawnT,stageWave(stage).interval);
    eliteT=Math.min(eliteT,stageWave(stage).eliteInterval);
  }
  if(campaignComplete()){
    unlockDragonAltar();
    if(campaignRemaining()<=0)startDragonFinale(false,true);
  }
}
