"use strict";
/* state.js — состояние игры, ввод, пауза, applyGear */

/* ── состояние ────────────────────────────────────────────── */
const P = {};
let enemies, shots, orbs, puffs, pops, props, chests, mines, nades, ices, booms, pickups, corpses;
let running, paused, t, spawnT, shotT, eliteT, chestT, healT, score, shake, pointer, xpBoost;
const rnd = (a, b) => a + Math.random() * (b - a);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function buildProps() {
  props = [];
  for (let i = 0; i < 70; i++) {
    const kind = Math.random() < .5 ? "rock" : Math.random() < .7 ? "bush" : "tree";
    const r = kind === "rock" ? rnd(24, 50) : kind === "bush" ? rnd(22, 38) : rnd(26, 34);
    const x = rnd(r, WORLD - r), y = rnd(r, WORLD - r);
    if (Math.hypot(x - WORLD / 2, y - WORLD / 2) < 280) continue;
    // форма запоминается один раз, чтобы не дёргалась каждый кадр
    const pts = [];
    const n = kind === "rock" ? 7 : 6;
    for (let j = 0; j < n; j++) {
      const a = j / n * 6.283, rr = r * (.78 + hash(x + j, y) * .34);
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    props.push({ x, y, r, kind, pts, seed: hash(x, y) });
  }
}

function reset() {
  if(typeof activeLevelOffer!=='undefined'){activeLevelOffer=null;runResumeChoice=null;}
  if(typeof resetArenaEnding==='function')resetArenaEnding();
  if(typeof stopGameSounds==='function')stopGameSounds();
  Object.assign(P, {
    x: WORLD / 2, y: WORLD / 2, r: 14, phase: 0, face: 1, hurt: 0, orbA: 0,
    aim: 0, muzzle: 0, hp: 5 + meta.hp, lvl: 1, xp: 0, xpNext: heroXPRequired(1), stagePulse: 0,
    stage:1,runMs:0,stageMs:0,runWon:false,testRun:false,redKills:0,rankingRecorded:false,rankingQueued:false,damageFeedback:null,abilityMenuOpen:false,
    gear: Object.fromEntries(GK.map(k => [k, 0])), item: null, pet: null, wtype: "basic",
    dropWeapon:null,dropWeaponMs:0,storedGunLevel:0,laserBeam:null,laserTick:0,beamSoundT:0,
  });
  if(typeof freshRunEconomy==='function')P.economy=freshRunEconomy();
  P.stageParts=0;
  turrets = []; eggs = []; chicks = []; pendingPet = null; lastPetRoll = null; queuedLevels = 0;
  enemies = []; shots = []; orbs = []; puffs = []; pops = [];
  chests = []; mines = []; nades = []; ices = []; booms = []; pickups = []; corpses = [];
  buildProps();
  flashes = []; hitStop = 0;
  t = 0; spawnT = 0; shotT = 0; eliteT = 45000; chestT = 6000; healT = 9000;
  score = 0; shake = 0; xpBoost = 0; paused = false;
  // временные эффекты и состояние ульты — иначе тянутся из прошлого забега
  P.hasteT = 0; P.invT = 0; P.seen = { x: P.x, y: P.y };
  P.run = 0; P.recoilT = 0; P.stepT = 0; P.ghostT = 0; P.ghosts = [];
  P.backpackQueue=[];P.backpackFlash=[0,0,0];P.backpackCooldown=0;
  ult.charge = 0; ult.on = false; ult.zoom = 1; ult.rot = 0; ult.lift = 0;
  ult.cast=null;ult.baseDamage=0;ult.dragonType=null;
  ult.signature=null;ult.signatureFX=[];ult.signatureTargets=[];ult.signatureBeat=0;ult.signatureBags={};ult.signatureLast={};ult.forceSignature=null;
  ult.signatureTrailAt=0;ult.signatureLanding=false;ult.signatureMove=false;ult.signatureFace=1;ult.kick=0;
  ult.trail = []; ult.shards = []; ult.blinks = []; ult.marks = []; ult.swoosh = null;
  ult.impacts = []; ult.flash = 0; ult.punch = 0;
  ult.scopeLock = 0; ult.fpKick = 0; ult.bolt = 0; ult.screenFall = 0; ult.pendingNext = 0; ult.weaponBag = null;
  ult.goldSegments = []; ult.coinSpin = 0; ult.forceMode = null;
  ult.camX = P.x; ult.camY = P.y; ult.current = null; ult.queue = []; ult.step = 0;
  ult.bag = []; ult.focus = null; ult.orbit = []; ult.stageX = 0; ult.stageY = 0;
  if (typeof document !== "undefined" && document.body) document.body.classList.remove("sniper-cinematic");
  // Активная техника и эффекты заканчиваются вместе с забегом,
  // но накопленные заряды inventory намеренно не сбрасываются.
  resetAbilities();
  resetEnemyHazards();
  resetArenaSecrets();
  if (typeof resetDragonFinale === "function") resetDragonFinale();
  pointer = { x: P.x, y: P.y, active: false };
  if(typeof beginCampRun==='function')beginCampRun();
  applyGear();
}
function weaponStats(w,g=P.gear,level=P.lvl){
  const L=g.gun,dm=(1+.15*meta.dmg)*(1+(Math.max(1,level||1)-1)*.14);
  const packTier=P.dropWeapon===w?Math.max(L,P.storedGunLevel||0):L;
  const common={pellets:1,spread:0,pierce:0,nShots:1+g.clip,backpackDamage:(1+packTier)*dm};
  if(w==='shotgun')return {...common,rate:[1000,920,880,840,820][L],damage:[1.3,1.4,1.78,2.28,2.78][L]*dm,range:180+38*g.scope,pellets:[3,5,7,9,10][L],spread:[.20,.40,.38,.44,.48][L],nShots:1};
  if(w==='sniper')return {...common,rate:[1050,1080,1020,970,920][L],damage:[2.6,4.8,7.8,9.2,10.8][L]*dm,range:[320,380,460,500,540][L]+110*g.scope,pierce:L>=2?1:0};
  if(w==='laser')return {...common,rate:[720,620,480,420,380][L],damage:[1.2,2.1,2.8,3.5,4.2][L]*dm,range:300+25*L+65*g.scope,pierce:L>=3?1:0};
  if(w==='minigun')return {...common,rate:180-12*L,damage:(2.6+.30*L)*dm,range:300+45*g.scope,spread:.12-L*.01};
  if(w==='dropShotgun')return {...common,rate:800-35*L,damage:(4.0+.4*L)*dm,range:260+45*g.scope,pellets:8+L,spread:.32,nShots:1};
  if(w==='goldSniper')return {...common,rate:1050-45*L,damage:(16+2.0*L)*dm,range:620+110*g.scope,pierce:1};
  return {...common,rate:[620,540,380,310,260][L],damage:[1,1.8,2.2,2.7,3.1][L]*dm,range:215+55*g.scope};
}
function heroGearStats(g=P.gear,level=P.lvl,w=P.wtype){
  const stage=Math.max(1,level||1),weapon=weaponStats(w,g,stage);
  return {...weapon,
    fireRate:Math.max(60,weapon.rate*Math.pow(.86,g.gloves)*Math.pow(.985,stage-1)),
    speed:(2.15+.42*g.boots)*(1+.08*meta.spd)*(1+Math.min(.22,(stage-1)*.025)),
    hpMax:5+meta.hp+g.helm+Math.floor((stage-1)/4),xpMult:1+.10*g.cape,iframe:950+320*g.jacket};
}
function applyGear() {
  Object.assign(P,heroGearStats());
  P.xpNext = heroXPRequired(P.lvl);
  P.hp = Math.min(P.hp, P.hpMax);
}

/* Сравниваем не название редкости, а реальную боевую ценность на текущей
   прокачке: урон в секунду, дальность, пробивание и полезность разброса. */
function weaponCombatRating(w) {
  const g=P.gear,L=g.gun,stage=Math.max(1,P.lvl||1);
  const glove=Math.pow(.86,g.gloves)*Math.pow(.985,stage-1);
  const {rate,damage,range,pierce,backpackDamage,pellets}=weaponStats(w,g,stage);
  const projectiles=pellets>1?pellets*.62:1,accuracy=pellets>1?.82:['sniper','goldSniper'].includes(w)?1.16:w==='minigun'?.92:1;
  const fireRate=Math.max(60,rate*glove);
  const dps=damage*projectiles/(fireRate/1000),pods=backpackDamage*g.clip/(backpackSalvoCooldown(fireRate)/1000);
  const reach=.82+Math.min(.34,range/1800);
  const podReach=.82+Math.min(.34,Math.min(range,BACKPACK_RANGE_MAX)/1800);
  return dps*reach*accuracy*(1+pierce*.24)+pods*podReach;
}

/* ── ввод ─────────────────────────────────────────────────── */
let touchMode = false;
const LIFT = 78;
function toWorld(e) {
  const r = cv.getBoundingClientRect();
  const sx = e.clientX - r.left, sy = e.clientY - r.top;
  const lift = e.pointerType === "mouse" ? 0 : LIFT;
  return { sx, sy, x: sx + cam.x, y: sy - lift + cam.y };
}
cv.addEventListener("pointerdown", e => {
  if(typeof radarPointerDown==='function'&&radarPointerDown(e))return;
  ultPointerDown(e);
  if (ultDblClick(e)) { pointer.active = false; return; }
  audio(); const p = toWorld(e);
  touchMode = e.pointerType !== "mouse";
  pointer.x = p.x; pointer.y = p.y; pointer.active = true;
  cv.setPointerCapture(e.pointerId);
});
cv.addEventListener("pointermove", e => {
  if(typeof radarConsumesPointer==='function'&&radarConsumesPointer(e)){pointer.active=false;return;}
  ultPointerMove(e);
  const p = toWorld(e); pointer.x = p.x; pointer.y = p.y;
  if (e.pointerType === "mouse") pointer.active = true;
});
function releaseArenaPointer(e,cancelled=false){
  ultPointerUp(e);
  // Cancellation must stop a stale destination. A normal mouse release keeps
  // hover-to-move, including the capture loss emitted after pointerup.
  if(cancelled||e.pointerType!=="mouse")pointer.active=false;
}
cv.addEventListener("pointerup", e => releaseArenaPointer(e));
cv.addEventListener("pointercancel", e => releaseArenaPointer(e,true));
cv.addEventListener("lostpointercapture", e => releaseArenaPointer(e));
addEventListener("keydown", e => {
  if(typeof rankingOpen==='function'&&rankingOpen())return;
  if(typeof settingsOpen==='function'&&settingsOpen())return;
  if(typeof runConfirmOpen==='function'&&runConfirmOpen())return;
  if(typeof campDialogOpen==='function'&&campDialogOpen())return;
  if(e.code==='Escape'&&P.abilityMenuOpen&&typeof setAbilityMenuOpen==='function'){e.preventDefault();setAbilityMenuOpen(false,true);return;}
  if(typeof dragonHomeOpen==="function"&&dragonHomeOpen()){if(e.code==="Escape")closeDragonHome();return;}
  if (e.code === "Space" || e.code === "KeyE") { e.preventDefault(); useItem(); }
  if (e.code === "Escape" && typeof dragonBookOpen === "function" && dragonBookOpen()) { closeDragonBook(); return; }
  if(typeof menuHasRun!=="undefined"&&menuHasRun)return;
  if (e.code === "Escape" || e.code === "KeyP") { if (e.code === "KeyP") e.preventDefault(); userPaused ? resumeGame() : pauseGame(); }
});
let userPaused = false;
const levelOpen = () => !document.getElementById("levelup").classList.contains("hidden");

function refreshPauseStats(){
 if(typeof uiLabel==="function"){
  document.getElementById("pauseStats").textContent=`${uiLabel("stage")} ${P.stage}/${RUN_STAGES} · ${uiLabel("level")} ${P.lvl} · ${formatRunTime(P.runMs)} · ${uiLabel("defeated")}: ${score}`;
  if(typeof campText==='function')document.getElementById('pauseStats').textContent+='\n'+campText(P.trial||'normal');
  if(typeof economyWallet==='function')document.getElementById('pauseStats').textContent+=bossText(' · Детали в рюкзаке: ',' · Parts carried: ')+economyWallet();
  return;
 }
 const english=typeof uiLanguage!=="undefined"&&uiLanguage==="en";
 document.getElementById("pauseStats").textContent=english?`STAGE ${P.stage}/${RUN_STAGES} · LV ${P.lvl} · ${formatRunTime(P.runMs)} · ${score} defeated`:`СТАДИЯ ${P.stage}/${RUN_STAGES} · УР. ${P.lvl} · ${formatRunTime(P.runMs)} · лопнул ${score}`;
}
function pauseGame() {
  if(typeof runSaveAction==='function'&&!runSaveDepth)return runSaveAction(()=>pauseGame(),true);
  if(typeof settingsOpen==='function'&&settingsOpen())return;
  if(typeof adminPanelOpen==='function'&&adminPanelOpen())return;
  if(typeof bossRewardPending!=='undefined'&&bossRewardPending)return;
  if(typeof dragonHomeOpen==="function"&&dragonHomeOpen())return;
  if (!running || levelOpen() || userPaused || (typeof dragonBookOpen === "function" && dragonBookOpen())) return;
  userPaused = true; paused = true;
  if(typeof setAbilityMenuOpen==='function')setAbilityMenuOpen(false);
  refreshPauseStats();
  document.getElementById("pause").classList.remove("hidden");
  document.getElementById("btnResume")?.focus?.({preventScroll:true});
}
function resumeGame() {
  if(typeof settingsOpen==='function'&&settingsOpen())return;
  if(typeof adminPanelOpen==='function'&&adminPanelOpen())return;
  if(typeof runConfirmOpen==='function'&&runConfirmOpen())return;
  if(typeof bossRewardPending!=='undefined'&&bossRewardPending)return;
  if (!userPaused) return;
  userPaused = false;
  document.getElementById("pause").classList.add("hidden");
  if (!levelOpen()&&!dragonBookOpen()&&!dragonHomeOpen()) paused = false;
  pointer.active = false;                 // чтобы герой не рванул к старой точке
}
// вкладку свернули — ставим паузу и показываем окно, иначе игра зависала навсегда
if(typeof Playables==='undefined'||!Playables.cloud)document.addEventListener("visibilitychange", () => { if (document.hidden) pauseGame(); });
