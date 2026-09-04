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
    aim: 0, muzzle: 0, hp: 5 + meta.hp, lvl: 1, xp: 0, xpNext: 5,
    gear: Object.fromEntries(GK.map(k => [k, 0])), item: null, pet: null, wtype: "basic",
  });
  turrets = []; eggs = []; chicks = []; pendingPet = null; lastPetRoll = null; queuedLevels = 0;
  enemies = []; shots = []; orbs = []; puffs = []; pops = [];
  chests = []; mines = []; nades = []; ices = []; booms = []; pickups = []; corpses = [];
  buildProps();
  t = 0; spawnT = 0; shotT = 0; eliteT = 45000; chestT = 6000; healT = 14000;
  score = 0; shake = 0; xpBoost = 0; paused = false;
  pointer = { x: P.x, y: P.y, active: false };
  applyGear();
}
function applyGear() {
  const g = P.gear, L = g.gun, w = P.wtype;
  const dm = 1 + .15 * meta.dmg;

  if (w === "shotgun") {
    P.rate = 880; P.damage = (.42 + .11 * L) * dm;
    P.range = 168 + 34 * g.scope; P.pellets = 5 + L + g.clip;
    P.spread = .52; P.pierce = 0; P.nShots = 1;
  } else if (w === "sniper") {
    P.rate = 1550 - 140 * L; P.damage = (3.2 + 2.3 * L) * dm;
    P.range = 520 + 110 * g.scope; P.pellets = 1;
    P.spread = 0; P.pierce = 1; P.nShots = 1 + g.clip;
  } else if (w === "minigun") {
    P.rate = 205 - 21 * L; P.damage = (.46 + .23 * L) * dm;
    P.range = 205 + 42 * g.scope; P.pellets = 1;
    P.spread = .17; P.pierce = 0; P.nShots = 1;
  } else {
    P.rate = 620; P.damage = (1 + L) * dm;
    P.range = 215 + 55 * g.scope; P.pellets = 1;
    P.spread = 0; P.pierce = 0; P.nShots = 1 + g.clip;
  }
  P.fireRate = Math.max(60, P.rate * Math.pow(.86, g.gloves));

  P.speed = (2.15 + .42 * g.boots) * (1 + .08 * meta.spd);
  P.hpMax = 5 + meta.hp + g.helm;
  P.magnet = 120 + 75 * g.cape;
  P.iframe = 950 + 320 * g.jacket;
  P.hp = Math.min(P.hp, P.hpMax);
}

/* ── ввод ─────────────────────────────────────────────────── */
const LIFT = 78;
function toWorld(e) {
  const r = cv.getBoundingClientRect();
  const sx = e.clientX - r.left, sy = e.clientY - r.top;
  const lift = e.pointerType === "mouse" ? 0 : LIFT;
  return { sx, sy, x: sx + cam.x, y: sy - lift + cam.y };
}
cv.addEventListener("pointerdown", e => {
  ultPointerDown(e);
  audio(); const p = toWorld(e);
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
  if (e.code === "Space" || e.code === "KeyE") { e.preventDefault(); useItem(); }
  if (e.code === "KeyQ") { e.preventDefault(); startUlt(); }
  if (e.code === "Escape" || e.code === "KeyP") { e.preventDefault(); userPaused ? resumeGame() : pauseGame(); }
});
let userPaused = false;
const levelOpen = () => !document.getElementById("levelup").classList.contains("hidden");

function pauseGame() {
  if (!running || levelOpen() || userPaused) return;
  userPaused = true; paused = true;
  document.getElementById("pauseStats").textContent =
    `LV ${P.lvl} · ${(t / 1000).toFixed(0)} с · лопнул ${score}`;
  document.getElementById("pause").classList.remove("hidden");
}
function resumeGame() {
  if (!userPaused) return;
  userPaused = false;
  document.getElementById("pause").classList.add("hidden");
  if (!levelOpen()) paused = false;
  pointer.active = false;                 // чтобы герой не рванул к старой точке
}
// вкладку свернули — ставим паузу и показываем окно, иначе игра зависала навсегда
document.addEventListener("visibilitychange", () => { if (document.hidden) pauseGame(); });
