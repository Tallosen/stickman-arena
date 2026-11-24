"use strict";
function campaignComplete(){return !!P.runWon;}
function campaignRemaining(){return Math.max(0,(RUN_STAGES-P.stage)*STAGE_MS+stageRemaining());}
function stageRemaining(){return isBossStage(P.stage)?0:Math.max(0,STAGE_MS-(P.stageMs||0));}
function formatRunTime(ms){const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function enterRunStage(stage){
 if(typeof requestRunCheckpoint==='function')requestRunCheckpoint();
 P.stage=stage;P.stageMs=0;P.stagePulse=1600;
 spawnT=Math.min(spawnT,stageWave(stage).interval);eliteT=Math.min(eliteT,stageWave(stage).eliteInterval);
 if(isBossStage(stage))startStageBoss();
 if(typeof checkpointCamp==='function')checkpointCamp();
}
function updateRunProgress(dt){
 if(typeof runSaveAction==='function'&&!runSaveDepth)return runSaveAction(()=>updateRunProgress(dt));
 if(!running||paused||P.runWon)return;
 if(typeof bossLootLocked==='function'&&bossLootLocked())return;
 if(typeof dragonHomeOpen==='function'&&dragonHomeOpen())return;
 if(typeof dragonBookOpen==='function'&&dragonBookOpen())return;
 const elapsed=Math.max(0,Number(dt)||0);P.runMs=(P.runMs||0)+elapsed;
 if(isBossStage(P.stage)){
  if(!stageBoss)startStageBoss();
  if(stageBoss?.enemy.hp<=0&&stageBoss.enemy.rewarded){
   const stage=P.stage,e=stageBoss.enemy;defeatedBossStages.add(stage);bossMarks=[];bossProjectiles=[];dragonAssist=null;stageBoss=null;
   bossRunLog.push({stage,id:e.bossSpec.id,ms:Math.max(0,(P.runMs||0)-e.enteredAt),clean:(P.damageHits||0)===(e.campEntryHits||0)});
   if(typeof checkpointCamp==='function')checkpointCamp();
   dropBossLoot(stage,e);
   if(typeof requestRunCheckpoint==='function')requestRunCheckpoint();
   if(stage<20)enterRunStage(stage+1);
  }
  return;
 }
 P.stageMs=(P.stageMs||0)+elapsed;
 // Fractional frame steps can land a few nanoseconds below the boundary.
 while(P.stageMs+1e-6>=STAGE_MS&&P.stage<RUN_STAGES){
  const remainder=Math.max(0,P.stageMs-STAGE_MS);enterRunStage(P.stage+1);
  if(isBossStage(P.stage))break;
  P.stageMs=remainder;
 }
}
