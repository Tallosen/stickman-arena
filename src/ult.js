"use strict";
/* ult.js — ультимейт: накопление, жест, кинематографичные добивания */

const ULT_FULL = 42000;        // за сколько миллисекунд копится с нуля
const ULT_PER_KILL = 420;      // сколько добавляет один убитый
const ULT_MODES = ["flip", "whirl", "volley", "slam"];

const ult = { charge: 0, on: false, mode: "flip", t: 0, dur: 0, zoom: 1, done: [] };

function ultReady() { return ult.charge >= ULT_FULL && !ult.on; }

function startUlt() {
  if (!ultReady() || !running || paused) return;
  ult.charge = 0; ult.on = true; ult.t = 0; ult.done = [];
  ult.mode = ULT_MODES[Math.random() * ULT_MODES.length | 0];
  ult.dur = ult.mode === "volley" ? 2200 : ult.mode === "whirl" ? 1900 : 1700;
  shake = 10;
  chain([392, 523, 659, 880, 1175], "square", .06);
  noise(.5, .07, 2600, -2200);
}

/* Каждая ульта — свой сценарий по времени. p — прогресс 0..1 */
function updateUlt(dt) {
  if (!ult.on) {
    if (running && !paused) ult.charge = Math.min(ULT_FULL, ult.charge + dt);
    ult.zoom += (1 - ult.zoom) * .12;
    return;
  }
  ult.t += dt;
  const p = ult.t / ult.dur;

  // камера: быстро наезжает, в конце плавно отъезжает
  const target = p < .82 ? 1.85 : 1;
  ult.zoom += (target - ult.zoom) * (p < .82 ? .16 : .07);

  const boom = (r, dmg, sh) => {
    shake = Math.max(shake, sh);
    for (const e of enemies) {
      if (ult.done.includes(e)) continue;
      if (Math.hypot(e.x - P.x, e.y - P.y) > r) continue;
      ult.done.push(e); hit(e, dmg, P.x, P.y);
    }
  };
  const DMG = 26 + P.damage * 4;

  if (ult.mode === "flip") {
    ult.rot = p < .18 ? 0 : Math.min(1, (p - .18) / .55) * Math.PI * 4;
    ult.lift = Math.sin(Math.max(0, Math.min(1, (p - .18) / .62)) * Math.PI) * 78;
    if (p > .45 && !ult.fired) {                     // залп в воздухе
      ult.fired = 1;
      for (let i = 0; i < 14; i++) {
        const a = i / 14 * 6.283;
        shots.push({ x: P.x, y: P.y - 24, vx: Math.cos(a) * 11, vy: Math.sin(a) * 11,
                     a, life: 700, dmg: DMG, kind: "sniper", pierce: 1, hit: [] });
      }
      SFX.shot(); boom(230, DMG, 16);
    }
    if (p > .78 && !ult.landed) { ult.landed = 1; boom(300, DMG, 22); SFX.boom();
      booms.push({ x: P.x, y: P.y, r: 20, max: 300, life: 1 }); }

  } else if (ult.mode === "whirl") {
    ult.rot = p * Math.PI * 8;
    ult.lift = 0;
    ult.ring = p * 330;
    boom(ult.ring, DMG, 8);
    if (Math.floor(ult.t / 90) !== Math.floor((ult.t - dt) / 90)) SFX.shot();

  } else if (ult.mode === "volley") {
    ult.rot = 0; ult.lift = 0;
    if (Math.floor(ult.t / 130) !== Math.floor((ult.t - dt) / 130)) {
      let best = null, bd = 420;
      for (const e of enemies) {
        if (ult.done.includes(e)) continue;
        const d = Math.hypot(e.x - P.x, e.y - P.y);
        if (d < bd) { bd = d; best = e; }
      }
      if (best) {
        ult.done.push(best);
        ult.tracer = { x1: P.x, y1: P.y - 24, x2: best.x, y2: best.y, life: 1 };
        P.aim = Math.atan2(best.y - P.y + 24, best.x - P.x);
        hit(best, DMG, P.x, P.y); P.muzzle = 120; shake = Math.max(shake, 6);
        SFX.shot();
      }
    }

  } else {                                            // slam
    ult.rot = 0;
    ult.lift = p < .55 ? Math.sin(p / .55 * Math.PI * .5) * 120 : Math.cos((p - .55) / .2 * Math.PI * .5) * 120;
    if (p > .75 && !ult.landed) {
      ult.landed = 1; boom(360, DMG * 1.4, 26); SFX.boom();
      booms.push({ x: P.x, y: P.y, r: 24, max: 360, life: 1 });
      booms.push({ x: P.x, y: P.y, r: 12, max: 220, life: .8 });
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * 6.28, s2 = rnd(2, 6);
        puffs.push({ x: P.x, y: P.y, vx: Math.cos(a) * s2, vy: Math.sin(a) * s2, life: 1, r: rnd(3, 7) });
      }
    }
  }

  if (ult.tracer) { ult.tracer.life -= dt / 260; if (ult.tracer.life <= 0) ult.tracer = null; }
  if (ult.t >= ult.dur) { ult.on = false; ult.fired = 0; ult.landed = 0; ult.rot = 0; ult.lift = 0; }
}

/* ── жест «раздвинуть пальцы» ── */
const touches = new Map();
function ultPointerDown(e) { touches.set(e.pointerId, { x: e.clientX, y: e.clientY, d0: null }); }
function ultPointerMove(e) {
  const p = touches.get(e.pointerId); if (!p) return;
  p.x = e.clientX; p.y = e.clientY;
  if (touches.size !== 2) return;
  const [a, b] = [...touches.values()];
  const d = Math.hypot(a.x - b.x, a.y - b.y);
  if (a.d0 == null) { a.d0 = d; b.d0 = d; return; }
  if (d - a.d0 > 70 && ultReady()) { startUlt(); touches.clear(); }
}
function ultPointerUp(e) { touches.delete(e.pointerId); }
