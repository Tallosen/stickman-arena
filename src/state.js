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
  Object.assign(P, {
    x: WORLD / 2, y: WORLD / 2, r: 14, phase: 0, face: 1, hurt: 0, orbA: 0,
    aim: 0, muzzle: 0, hp: 5 + meta.hp, lvl: 1, xp: 0, xpNext: STAGE_XP, stagePulse: 0,
    gear: Object.fromEntries(GK.map(k => [k, 0])), item: null, pet: null, wtype: "basic",
  });
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
  ult.charge = 0; ult.on = false; ult.zoom = 1; ult.rot = 0; ult.lift = 0;
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
  if (typeof resetDragonFinale === "function") resetDragonFinale();
  pointer = { x: P.x, y: P.y, active: false };
  applyGear();
}
function applyGear() {
  const g = P.gear, L = g.gun, w = P.wtype;
  const stage = Math.max(1, P.lvl || 1);
  const dm = (1 + .15 * meta.dmg) * (1 + (stage - 1) * .14);

  if (w === "shotgun") {
    P.rate = 820; P.damage = (.78 + .90 * L) * dm;
    P.range = 180 + 38 * g.scope; P.pellets = 6 + L + g.clip;
    P.spread = .48; P.pierce = 0; P.nShots = 1;
  } else if (w === "sniper") {
    P.rate = 1420 - 125 * L; P.damage = (3.2 + 2.3 * L) * dm;
    P.range = 520 + 110 * g.scope; P.pellets = 1;
    P.spread = 0; P.pierce = 1; P.nShots = 1 + g.clip;
  } else if (w === "minigun") {
    P.rate = 205 - 22 * L; P.damage = (.58 + .38 * L) * dm;
    P.range = 225 + 45 * g.scope; P.pellets = 1;
    P.spread = .15; P.pierce = 0; P.nShots = 1 + Math.floor((g.clip + 1) / 2);
  } else {
    P.rate = 620; P.damage = (1 + L) * dm;
    P.range = 215 + 55 * g.scope; P.pellets = 1;
    P.spread = 0; P.pierce = 0; P.nShots = 1 + g.clip;
  }
  P.fireRate = Math.max(60, P.rate * Math.pow(.86, g.gloves) * Math.pow(.985, stage - 1));

  P.speed = (2.15 + .42 * g.boots) * (1 + .08 * meta.spd) * (1 + Math.min(.22, (stage - 1) * .025));
  P.hpMax = 5 + meta.hp + g.helm + Math.floor((stage - 1) / 2);
  P.xpMult = 1 + .10 * g.cape;
  P.iframe = 950 + 320 * g.jacket;
  P.hp = Math.min(P.hp, P.hpMax);
}

/* Сравниваем не название редкости, а реальную боевую ценность на текущей
   прокачке: урон в секунду, дальность, пробивание и полезность разброса. */
function weaponCombatRating(w) {
  const g=P.gear,L=g.gun,stage=Math.max(1,P.lvl||1);
  const dm=(1+.15*meta.dmg)*(1+(stage-1)*.14);
  const glove=Math.pow(.86,g.gloves)*Math.pow(.985,stage-1);
  let rate,damage,projectiles,range,pierce=0,accuracy=1;
  if(w==="shotgun"){
    rate=820;damage=(.78+.90*L)*dm;projectiles=(6+L+g.clip)*.62;
    range=180+38*g.scope;accuracy=.82;
  }else if(w==="sniper"){
    rate=1420-125*L;damage=(3.2+2.3*L)*dm;projectiles=1+g.clip;
    range=520+110*g.scope;pierce=1;accuracy=1.16;
  }else if(w==="minigun"){
    rate=205-22*L;damage=(.58+.38*L)*dm;projectiles=1+Math.floor((g.clip+1)/2);
    range=225+45*g.scope;accuracy=.92;
  }else{
    rate=620;damage=(1+L)*dm;projectiles=1+g.clip;
    range=215+55*g.scope;
  }
  const dps=damage*projectiles/(Math.max(60,rate*glove)/1000);
  const reach=.82+Math.min(.34,range/1800);
  return dps*reach*accuracy*(1+pierce*.24);
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
  ultPointerDown(e);
  if (ultDblClick(e)) { pointer.active = false; return; }
  audio(); const p = toWorld(e);
  touchMode = e.pointerType !== "mouse";
  pointer.x = p.x; pointer.y = p.y; pointer.active = true;
  cv.setPointerCapture(e.pointerId);
});
cv.addEventListener("pointermove", e => {
  ultPointerMove(e);
  const p = toWorld(e); pointer.x = p.x; pointer.y = p.y;
  if (e.pointerType === "mouse") pointer.active = true;
});
cv.addEventListener("pointerup", e => { ultPointerUp(e); if (e.pointerType !== "mouse") pointer.active = false; });
cv.addEventListener("pointercancel", ultPointerUp);
addEventListener("keydown", e => {
  if(typeof dragonHomeOpen==="function"&&dragonHomeOpen()){if(e.code==="Escape")closeDragonHome();return;}
  if (e.code === "Space" || e.code === "KeyE") { e.preventDefault(); useItem(); }
  if (e.code === "Escape" && typeof dragonBookOpen === "function" && dragonBookOpen()) { closeDragonBook(); return; }
  if (e.code === "Escape" || e.code === "KeyP") { if (e.code === "KeyP") e.preventDefault(); userPaused ? resumeGame() : pauseGame(); }
});
let userPaused = false;
const levelOpen = () => !document.getElementById("levelup").classList.contains("hidden");

function pauseGame() {
  if(typeof dragonHomeOpen==="function"&&dragonHomeOpen())return;
  if (!running || levelOpen() || userPaused || (typeof dragonBookOpen === "function" && dragonBookOpen())) return;
  userPaused = true; paused = true;
  document.getElementById("pauseStats").textContent =
    `СТАДИЯ ${P.lvl} · ${(t / 1000).toFixed(0)} с · лопнул ${score}`;
  document.getElementById("pause").classList.remove("hidden");
}
function resumeGame() {
  if (!userPaused) return;
  userPaused = false;
  document.getElementById("pause").classList.add("hidden");
  if (!levelOpen()&&!dragonBookOpen()&&!dragonHomeOpen()) paused = false;
  pointer.active = false;                 // чтобы герой не рванул к старой точке
}
// вкладку свернули — ставим паузу и показываем окно, иначе игра зависала навсегда
document.addEventListener("visibilitychange", () => { if (document.hidden) pauseGame(); });
