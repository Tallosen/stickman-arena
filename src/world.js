"use strict";
let flashes = [], hitStop = 0;
/* world.js — враги, взрывы, сундуки, бусты, коллизии */

/* ── враги ────────────────────────────────────────────────── */
const KINDS = {
  basic:  { r: 11, hp: 1,  spd: .76, xp: 55 },
  runner: { r: 9,  hp: 1,  spd: 1.5, xp: 70 },
  tank:   { r: 17, hp: 6,  spd: .46, xp: 150 },
  elite:  { r: 25, hp: 26, spd: .54, xp: 500 },
};
function spawn(kind) {
  const K = KINDS[kind], a = Math.random() * 6.283, d = Math.max(W, H) * .62 + 60;
  const x = Math.max(30, Math.min(WORLD - 30, P.x + Math.cos(a) * d));
  const y = Math.max(30, Math.min(WORLD - 30, P.y + Math.sin(a) * d));
  const stage = Math.max(1, P.lvl || 1);
  const hpScale = (1 + (stage - 1) * .32) * (1 + Math.min(.55, t / 260000));
  const speedScale = 1 + Math.min(.32, (stage - 1) * .045) + Math.min(.14, t / 360000);
  const hp = Math.ceil(K.hp * hpScale);
  enemies.push({ kind, x, y, r: K.r, xp: K.xp, hp, maxhp: hp,
    speed: K.spd * speedScale, phase: rnd(0, 6),
    face: 1, flash: 0, kb: 0, kbx: 0, kby: 0, orbCd: 0, slip: 0,
    lx: x, ly: y, stuckT: 0, wander: 0, wanderT: 0, bob: rnd(0, 6) });
}
function popEnemy(e) {
  if (e.rewarded) return;
  e.rewarded = true;
  gainXP(e.xp);
  if (e.xp >= 150)
    pops.push({ x:e.x, y:e.y-e.r-24, txt:"XP +"+e.xp, life:1.15, col:"#c79018" });
  // у каждого типа своя смерть
  if (ult.on) {                                   // кинематографичная гибель
    const a = Math.atan2(e.y - P.y, e.x - P.x) + rnd(-.28, .28);
    const pow = 7 + Math.random() * 5;
    // каждый десятый летит «в камеру» — эффектный крупный план
    const scopeFall = !!e.scopeFall, toCam = !scopeFall && Math.random() < .12;
    corpses.push({
      kind: e.kind, x: e.x, y: e.y, sc: e.r / 11, mode: "launch",
      style: scopeFall ? "scopefall" : toCam ? "camera" : "throw",
      vx: scopeFall ? Math.cos(a) * .18 : e.launchUp ? Math.cos(a) * 2 : Math.cos(a) * pow,
      vy: scopeFall ? Math.sin(a) * .12 : e.launchUp ? Math.sin(a) * 2 : Math.sin(a) * pow,
      ang: a, spin: scopeFall ? P.face * .004 : e.launchUp ? rnd(-.12, .12) : rnd(-.05, .05), tilt: 0,
      bold: 5.2, z: scopeFall ? 10 : 0, vz: scopeFall ? 0 : e.launchUp ? 15 : (toCam ? 9 : rnd(3.4, 6.2)),
      t: 0, life: scopeFall ? 3.2 : toCam ? 1.0 : 2.1, max: scopeFall ? 3.2 : toCam ? 1.0 : 2.1,
      landed: 0, trail: [],
    });
    flashes.push({ x: e.x, y: e.y - 14 * (e.r / 11), r: 8, max: 52 + e.r * 2.2,
                   life: 1, rot: Math.random() * 6.28 });
    hitStop = Math.max(hitStop, 55);
    for (let i = 0; i < 14; i++) {
      const an = Math.random() * 6.28, sp = rnd(1.5, 5);
      puffs.push({ x: e.x, y: e.y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, life: 1, r: rnd(2, 5) });
    }
    score++; SFX.pop();
    return;
  }
  const c = { kind: e.kind, x: e.x, y: e.y, face: e.face, sc: e.r / 11,
              rot: 0, rotV: 0, vx: e.kbx * 2.4, vy: e.kby * 2.4,
              life: 1, max: 1, mode: "puff", phase: e.phase };
  if (e.kind === "runner") {                       // кувыркается и тает
    c.mode = "tumble"; c.rotV = (Math.random() < .5 ? -1 : 1) * .14;
    c.vx = e.kbx * 4.2 + rnd(-.6, .6); c.vy = e.kby * 4.2 - 1.9; c.max = 1.25; c.life = 1.25;
  } else if (e.kind === "tank") {                  // тяжело заваливается набок
    c.mode = "fall"; c.max = 1.6; c.life = 1.6;
  } else if (e.kind === "elite") {                 // разлетается с ударной волной
    c.mode = "blast"; c.max = 1.2; c.life = 1.2;
    booms.push({ x: e.x, y: e.y, r: 14, max: 150, life: 1 });
    booms.push({ x: e.x, y: e.y, r: 8, max: 96, life: .8 });
    shake = Math.max(shake, 20);
  } else {                                         // обычный просто лопается
    c.mode = "pop"; c.max = .34; c.life = .34;
  }
  corpses.push(c);
  if (corpses.length > 40) corpses.shift();

  for (let i = 0; i < (e.kind === "elite" ? 24 : 8); i++) {
    const a = Math.random() * 6.28, s = rnd(.6, 3);
    puffs.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, r: rnd(2, 5) });
  }
  score++; shake = Math.max(shake, e.kind === "elite" ? 16 : 3); SFX.pop();
  if (!ult.on) ult.charge = Math.min(ULT_FULL, ult.charge + ULT_PER_KILL);
}
function hit(e, dmg, hx, hy) {
  if (e.hp <= 0 || e.rewarded) return;
  e.hp -= dmg; e.flash = 110; e.flinch = 1;
  if (hx !== undefined) { const a = Math.atan2(e.y - hy, e.x - hx); e.kb = 3.4; e.kbx = Math.cos(a); e.kby = Math.sin(a); }
  pops.push({ x: e.x, y: e.y - e.r - 10, txt: Math.round(dmg * 10) / 10, life: 1, col: INK });
  if (e.hp <= 0) popEnemy(e);
}

/* ── предметы ─────────────────────────────────────────────── */
function useItem() {
  if (!running || paused || !P.item) return;
  const it = P.item; P.item = null;
  if (it === "mine") mines.push({ x: P.x, y: P.y, arm: 700 });
  else if (it === "nade") {
    let tg = null, bd = 1e9;
    for (const e of enemies) { const d = dist(e, P); if (d < bd) { bd = d; tg = e; } }
    const a = tg ? Math.atan2(tg.y - P.y, tg.x - P.x) : P.aim;
    nades.push({ x: P.x, y: P.y, vx: Math.cos(a) * 5.5, vy: Math.sin(a) * 5.5, fuse: 700 });
  } else if (it === "ice") { ices.push({ x: P.x, y: P.y, r: 150, life: 11000 }); SFX.ice(); }
  else if (it === "xp") { xpBoost = 20000; SFX.chest(); }
}
function explode(x, y, r, dmg) {
  booms.push({ x, y, r: 10, max: r, life: 1 });
  shake = Math.max(shake, 14); SFX.boom();
  for (const e of enemies) if (Math.hypot(e.x - x, e.y - y) < r + e.r) hit(e, dmg, x, y);
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * 6.28, s = rnd(1, 4);
    puffs.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, r: rnd(3, 7) });
  }
}
function spawnChest() {
  if (chests.length >= 3) return;
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * 6.283, d = rnd(260, 620);
    const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    if (x < 60 || y < 60 || x > WORLD - 60 || y > WORLD - 60) continue;
    if (props.some(o => Math.hypot(o.x - x, o.y - y) < o.r + 40)) continue;
    const rare = !chests.some(c => c.rare) && Math.random() < .035;
    const r = Math.random();
    chests.push({ x, y, a: 0, rare, item: rare ? null : r < .10 ? "xp" : r < .40 ? "mine" : r < .72 ? "nade" : "ice" });
    return;
  }
}

// Отдельный вызов нужен тестовой кнопке и будущим серверным событиям.
function spawnRareChestNearPlayer() {
  if (!running || paused || chests.some(c => c.rare)) return;
  const a = P.face > 0 ? 0 : Math.PI;
  chests.push({
    // Тестовый сундук сразу попадает в радиус подбора, чтобы быстро проверить награду.
    x: Math.max(54, Math.min(WORLD - 54, P.x + Math.cos(a) * 34)),
    y: Math.max(54, Math.min(WORLD - 54, P.y + 10)),
    a: 0, rare: true, item: null,
  });
}
const BOOSTS = {
  heart: { w: 5, col: "#c8402c" },
  haste: { w: 3, col: "#e0a52f" },
  ghost: { w: 3, col: "#4aa8cf" },
};
function rollBoost() {
  const keys = Object.keys(BOOSTS);
  let total = keys.reduce((a, k) => a + BOOSTS[k].w, 0), r = Math.random() * total;
  for (const k of keys) { r -= BOOSTS[k].w; if (r <= 0) return k; }
  return "heart";
}
function spawnHeart() {
  if (pickups.length >= 4) return;
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * 6.283, d = rnd(230, 640);
    const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    if (x < 60 || y < 60 || x > WORLD - 60 || y > WORLD - 60) continue;
    if (props.some(o => Math.hypot(o.x - x, o.y - y) < o.r + 34)) continue;
    pickups.push({ x, y, a: Math.random() * 6, kind: rollBoost() });
    return;
  }
}
function drawPickup(g, p) {
  const y = p.y - 4 + Math.sin(p.a) * 5;
  if (p.kind === "heart") { drawHeart(g, p.x, y, 1.4); return; }
  g.save(); g.translate(p.x, y);
  g.lineWidth = 2.4; g.lineJoin = "round";
  if (p.kind === "haste") {
    g.strokeStyle = "#a8761a";
    spoly(g, [[-3, -12], [6, -12], [1, -2], [7, -2], [-5, 12], [-1, 0], [-6, 0]], "#f0c443");
  } else {
    g.strokeStyle = "#2f7d9c";
    spoly(g, [[0, -13], [10, -8], [10, 2], [0, 13], [-10, 2], [-10, -8]], "#a9dcf0");
    g.lineWidth = 1.6; g.strokeStyle = "#2f7d9c";
    sline(g, 0, -9, 0, 8); sline(g, -6, -1, 6, -1);
  }
  g.restore();
}
function drawHeart(g, x, y, s2) {
  g.save(); g.translate(x, y); g.scale(s2, s2);
  g.strokeStyle = "#c8402c"; g.lineWidth = 2.4; g.fillStyle = "#f0a79a";
  g.beginPath();
  g.moveTo(0, 7); g.bezierCurveTo(-11, -1, -7, -11, 0, -5);
  g.bezierCurveTo(7, -11, 11, -1, 0, 7);
  g.closePath(); g.fill(); g.stroke();
  g.restore();
}
function pushOut(o) {
  for (const r of props) {
    const dx = o.x - r.x, dy = o.y - r.y, d = Math.hypot(dx, dy), m = r.r * .78 + o.r;
    if (d < m && d > .01) { o.x = r.x + dx / d * m; o.y = r.y + dy / d * m; }
  }
  o.x = Math.max(o.r, Math.min(WORLD - o.r, o.x));
  o.y = Math.max(o.r, Math.min(WORLD - o.r, o.y));
}
