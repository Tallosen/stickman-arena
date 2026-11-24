"use strict";
// Separate, versioned profile: no dragon data, inventory or legacy perks are rewritten.
const CAMP_KEY='vacky_arena_camp_v1';
const CAMP_BOSSES=['bruiser','gunner','shaman','hunter'];
const CAMP_TRIALS=['normal','rush','elites','bosses'];
const CAMP_STYLES=['classic','tide','ember','ranger','royal','astral'];
const CAMP_GOALS=[
 {id:'first',target:1,value:p=>p.bosses,reward:'shotgun'},
 {id:'ten',target:10,value:p=>p.stage,reward:'sniper'},
 {id:'crowd',target:500,value:p=>p.kills,reward:'laser'},
 {id:'clear',target:1,value:p=>p.wins,reward:'banner'},
 {id:'collection',target:4,value:p=>p.bossTypes.length,reward:'trophies'},
 {id:'shotgun',target:10,value:p=>p.shotgunStage,reward:'tide'},
 {id:'clean',target:1,value:p=>p.clean,reward:'lantern'},
 {id:'trial',target:1,value:p=>Object.keys(p.trialWins).length,reward:'ember'}
];
function blankCamp(){return {version:1,kills:0,bosses:0,stage:0,wins:0,shotgunStage:0,clean:0,bossTypes:[],trialWins:{},best:{},weapon:'basic',style:'classic',trial:'normal'};}
let campReadOnly=false,campSaveError=false;
const campStore=()=>typeof Playables==='undefined'?localStorage:Playables.storage;
function loadCamp(){
 const p=blankCamp();
 try{
  const raw=campStore().getItem(CAMP_KEY);
  if(!raw){
   // Only a validated old clear-time record proves a real completed campaign.
   // bestStage alone may come from an old debug shortcut; never migrate it.
   if(typeof meta!=='undefined'&&Number.isSafeInteger(meta.bestClearMs)&&meta.bestClearMs>0&&meta.bestClearMs<86400000){p.wins=1;p.bosses=4;p.stage=20;p.best.normal=meta.bestClearMs;}
   return p;
  }
  const s=JSON.parse(raw);if(!s||s.version!==1||Array.isArray(s))throw Error('Unknown camp profile');
  for(const k of ['kills','bosses','stage','wins','shotgunStage','clean']){
   if(!Number.isSafeInteger(s[k])||s[k]<0)throw Error('Invalid camp count');p[k]=Math.min(1e9,s[k]);
  }
  p.stage=Math.min(20,p.stage);p.shotgunStage=Math.min(20,p.shotgunStage);
  const record=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
  if(!Array.isArray(s.bossTypes)||!record(s.trialWins)||!record(s.best))throw Error('Invalid camp records');
  p.bossTypes=CAMP_BOSSES.filter(id=>s.bossTypes.includes(id));
  for(const k of CAMP_TRIALS){
   if(k!=='normal'&&s.trialWins[k]===true)p.trialWins[k]=true;
   if(Number.isSafeInteger(s.best[k])&&s.best[k]>0&&s.best[k]<86400000)p.best[k]=s.best[k];
  }
  if(Object.hasOwn(WEAPONS,s.weapon))p.weapon=s.weapon;
  if(p.weapon==='minigun'&&Object.hasOwn(WEAPONS,'laser'))p.weapon='laser';
  if(CAMP_STYLES.includes(s.style))p.style=s.style;
  if(CAMP_TRIALS.includes(s.trial))p.trial=s.trial;
  // Preferences are not proof of an unlock. Normalize before the menu can show them.
  if(!campWeaponOpen(p.weapon,p))p.weapon='basic';
  if(!campStyleOpen(p.style,p))p.style='classic';
  if(!campUnlocked('clear',p))p.trial='normal';
  return p;
 }catch(_){campReadOnly=true;return blankCamp();}
}
let campProfile=loadCamp();
// Pending progress is kept in memory across new runs if local storage rejects a write.
// Preferences are not committed optimistically; a failed selection stays unselected.
let campDraft=null;
function retryCampSave(){
 if(campReadOnly||(typeof Playables!=='undefined'&&Playables.blocked))return false;
 // No run reset is necessary, and acknowledged deltas must not be counted again.
 const draft=campDraft||campProfile,unlocked=CAMP_GOALS.filter(g=>!campUnlocked(g.id)&&campUnlocked(g.id,draft)).map(g=>g.id);
 if(!saveCamp(draft))return false;
 if(typeof P!=='undefined'&&P.campRun&&(!P.testRun||campTestProgressAllowed()))for(const id of unlocked)if(!P.campRun.unlocks.includes(id))P.campRun.unlocks.push(id);
 return true;
}
function campUnlocked(id,p=campProfile){const goal=CAMP_GOALS.find(g=>g.id===id);return !!goal&&goal.value(p)>=goal.target;}
function campWeaponOpen(w,p=campProfile){const goal={shotgun:'first',sniper:'ten',minigun:'crowd',laser:'crowd'}[w];return w==='basic'||!!goal&&campUnlocked(goal,p);}
function campStyleOpen(s,p=campProfile){const goal={tide:'shotgun',ember:'trial',ranger:'first',royal:'clear',astral:'collection'}[s];return s==='classic'||!!goal&&campUnlocked(goal,p);}
function campNextGoal(){return CAMP_GOALS.find(g=>!campUnlocked(g.id))||null;}
function saveCamp(next){
 if(campReadOnly)return false;
 try{campStore().setItem(CAMP_KEY,JSON.stringify(next));campProfile=next;campDraft=null;campSaveError=false;return true;}
 catch(_){campSaveError=true;return false;}
}
function campChoose(key,value){
 if(campReadOnly||(typeof Playables!=='undefined'&&Playables.blocked))return false;
 if(key==='weapon'&&!campWeaponOpen(value)||key==='style'&&!campStyleOpen(value)||key==='trial'&&(!CAMP_TRIALS.includes(value)||value!=='normal'&&!campUnlocked('clear')))return false;
 if(!['weapon','style','trial'].includes(key))return false;
 if(campProfile[key]===value)return true;
 return saveCamp({... (campDraft||campProfile),[key]:value});
}
function beginCampRun(){
 P.wtype=campWeaponOpen(campProfile.weapon)?campProfile.weapon:'basic';
 P.campStyle=campStyleOpen(campProfile.style)?campProfile.style:'classic';
 P.trial=campUnlocked('clear')&&CAMP_TRIALS.includes(campProfile.trial)?campProfile.trial:'normal';
 P.campRun={kills:0,bosses:[],won:false,unlocks:[],weapon:P.wtype,shotgunOnly:P.wtype==='shotgun'};
 P.damageHits=0;
}
// Idempotent checkpoints. A failed write keeps its delta available for the next attempt.
// Cheats never unlock live progress. Only the isolated, local QA profile may earn it.
function campTestProgressAllowed(){return typeof Playables!=='undefined'&&Playables.testStorage===true&&!Playables.cloud;}
function checkpointCamp(){
 const run=P.campRun;if(!run||(P.testRun&&!campTestProgressAllowed())||!(P.runMs>0)||campReadOnly)return false;
 const next=JSON.parse(JSON.stringify(campDraft||campProfile));
 const kills=Math.max(0,Math.floor(Number(score)||0));next.kills=Math.min(1e9,next.kills+Math.max(0,kills-run.kills));
 next.stage=Math.max(next.stage,Math.min(20,P.stage));
 if(run.shotgunOnly&&P.wtype==='shotgun')next.shotgunStage=Math.max(next.shotgunStage,Math.min(20,P.stage));
 const logs=typeof bossRunLog==='undefined'?[]:bossRunLog;
 const fresh=logs.filter(log=>!run.bosses.includes(log.stage));
 for(const log of fresh){
  next.bosses++;if(CAMP_BOSSES.includes(log.id)&&!next.bossTypes.includes(log.id))next.bossTypes.push(log.id);
  if(log.clean)next.clean++;
 }
 if(P.runWon&&!run.won){
  next.wins++;if(P.trial!=='normal'&&CAMP_TRIALS.includes(P.trial))next.trialWins[P.trial]=true;
  const ms=Math.max(1,Math.round(P.runMs)),mode=P.trial||'normal';
  if(!next.best[mode]||ms<next.best[mode])next.best[mode]=ms;
 }
 const unlocked=CAMP_GOALS.filter(g=>!campUnlocked(g.id)&&campUnlocked(g.id,next)).map(g=>g.id);
 run.kills=kills;run.bosses=logs.map(log=>log.stage);run.won=!!P.runWon;
 if(JSON.stringify(next)!==JSON.stringify(campProfile)&&!saveCamp(next)){campDraft=next;return false;}
 run.unlocks.push(...unlocked);
 if(typeof refreshCampMenu==='function')refreshCampMenu();return true;
}
function campModifier(kind){
 const mode=typeof P==='undefined'?'normal':P.trial;
 return kind==='speed'&&mode==='rush'?1.15:kind==='eliteInterval'&&mode==='elites'?1/1.3:kind==='bossHP'&&mode==='bosses'?1.25:1;
}
function campCapeColor(style){return ({tide:'#3d9fa6',ember:'#c56b43',ranger:'#687a49',royal:'#7d3f66',astral:'#3d537e'})[style]||null;}
function drawCampMilestones(g,time){
 g.save();g.strokeStyle='#6a5338';g.lineWidth=3;g.lineCap='round';
 // The first-boss cup is drawn on the shared record pedestal in menu-scene.
 if(campUnlocked('clear')){
  sline(g,843,187,843,361);g.fillStyle='#9463ab';
  g.beginPath();g.moveTo(843,193);g.quadraticCurveTo(866,197+Math.sin(time)*2,887,192);g.lineTo(887,255);g.lineTo(866,246);g.lineTo(843,252);g.closePath();g.fill();g.stroke();
  g.fillStyle='#f7d582';g.font='bold 20px system-ui';g.textAlign='center';g.fillText('20',864,227);
 }
 if(campUnlocked('collection'))for(let i=0;i<4;i++){
  const x=670+i*27;sline(g,x-3,284,x,293);sline(g,x+3,284,x,293);g.fillStyle=['#b7764d','#507f91','#9963b5','#7b8957'][i];g.beginPath();g.arc(x,301,8,0,7);g.fill();g.stroke();
  g.strokeStyle='#ffe2a1';sline(g,x-3,301,x+3,301);g.strokeStyle='#6a5338';
 }
 if(campUnlocked('clean')){
  sline(g,305,280,305,364);g.beginPath();g.arc(315,282,10,Math.PI,Math.PI*2);g.stroke();
  const glow=g.createRadialGradient(322,304,2,322,304,30);glow.addColorStop(0,'#f5c46f66');glow.addColorStop(1,'#f5c46f00');g.fillStyle=glow;g.beginPath();g.arc(322,304,30,0,7);g.fill();
  g.fillStyle='#ffe0a0';g.beginPath();g.roundRect(313,293,18,22,3);g.fill();g.stroke();
  g.fillStyle='#856140';g.beginPath();g.moveTo(311,293);g.lineTo(317,287);g.lineTo(328,287);g.lineTo(334,293);g.closePath();g.fill();g.stroke();
  g.fillStyle='#ee9c43';g.beginPath();g.moveTo(318,311);g.quadraticCurveTo(315,306,323,299);g.quadraticCurveTo(330,311,318,311);g.fill();
 }
 if(campUnlocked('trial'))for(let i=0;i<3;i++){
  const x=843+i*15;g.fillStyle='#e4b855';g.beginPath();g.moveTo(x,269);g.lineTo(x+4,277);g.lineTo(x,285);g.lineTo(x-4,277);g.closePath();g.fill();g.stroke();
 }
 g.restore();
}
