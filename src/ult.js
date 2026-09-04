"use strict";
/* ult.js — ультимейт: накопление, жест, кинематографичные добивания */

const ULT_FULL = 42000;        // за сколько миллисекунд копится с нуля
const ULT_PER_KILL = 420;      // сколько добавляет один убитый
// Только самые читаемые постановки. Слабые и визуально шумные варианты
// оставлены в коде для экспериментов, но больше не попадают в игровой пул.
const ULT_MODES = ["kick", "upper", "dash", "rain", "meteor", "cross", "dance", "spiral"];

const ult = { charge: 0, on: false, mode: "flip", t: 0, dur: 0, zoom: 1, done: [],
              impacts: [], flash: 0, punch: 0, bag: [], focus: null, orbit: [] };

function ultReady() { return ult.charge >= ULT_FULL && !ult.on; }

function startUlt() {
  if (!ultReady() || !running || paused) return;
  ult.charge = 0; ult.on = true; ult.t = 0; ult.done = [];
  // Мешок приёмов гарантирует, что игрок увидит все варианты до повторов.
  if (!ult.bag || !ult.bag.length) {
    ult.bag = ULT_MODES.slice();
    for (let i = ult.bag.length - 1; i > 0; i--) {
      const j = Math.random() * (i + 1) | 0;
      [ult.bag[i], ult.bag[j]] = [ult.bag[j], ult.bag[i]];
    }
    if (ult.lastMode && ult.bag.length > 1 && ult.bag[ult.bag.length - 1] === ult.lastMode)
      [ult.bag[0], ult.bag[ult.bag.length - 1]] = [ult.bag[ult.bag.length - 1], ult.bag[0]];
  }
  ult.mode = ult.bag.pop();
  ult.lastMode = ult.mode;
  ult.dur = { dash: 2000, rain: 2400, kick: 1500, upper: 1600, dance: 2700,
              meteor: 1950, spiral: 2300, cross: 1750 }[ult.mode] || 1700;
  ult.marks = []; ult.blinks = []; ult.hop = 0; ult.spinAim = 0;
  ult.swoosh = null; ult.shards = []; ult.trail = [];
  ult.impacts = []; ult.flash = .32; ult.punch = .5; ult.focus = null; ult.orbit = [];
  ult.stageX = 0; ult.stageY = 0; ult.beat = -1;
  ult.fired = 0; ult.landed = 0; ult.rot = 0; ult.lift = 0;
  if (ult.mode === "kick" || ult.mode === "upper" || ult.mode === "cross") {
    let b2 = null, bd = 1e9;
    for (const e of enemies) { const d = Math.hypot(e.x - P.x, e.y - P.y); if (d < bd) { bd = d; b2 = e; } }
    ult.victim = b2; ult.focus = b2;
    if (b2) { P.aim = Math.atan2(b2.y - P.y, b2.x - P.x); P.face = Math.cos(P.aim) > 0 ? 1 : -1; }
  }
  if (ult.mode === "dash") {
    ult.queue = enemies.map(e => ({ e, d: Math.hypot(e.x - P.x, e.y - P.y) }))
      .filter(o => o.d < 520).sort((a2, b3) => a2.d - b3.d).slice(0, 7).map(o => o.e);
    ult.step = 0; ult.next = 0; ult.home = { x: P.x, y: P.y };
  }
  if (ult.mode === "combo") {
    ult.queue = enemies.map(e => ({ e, d: Math.hypot(e.x - P.x, e.y - P.y) }))
      .filter(o => o.d < 560).sort((a2, b3) => a2.d - b3.d).slice(0, 6).map(o => o.e);
    ult.step = 0; ult.next = 180; ult.home = { x: P.x, y: P.y };
  }
  addUltImpact(P.x, P.y - 18, P.aim, .65, "aura");
  shake = 12;
  chain([392, 523, 659, 880, 1175], "square", .06);
  noise(.5, .07, 2600, -2200);
}

function updateUlt(dt) {
  if (!ult.on) {
    if (running && !paused) ult.charge = Math.min(ULT_FULL, ult.charge + dt);
    ult.zoom += (1 - ult.zoom) * .12;
    return;
  }
  updateUltLegacy(dt);
}

function updateUltLegacy(dt) {
  ult.t += dt;
  const p = ult.t / ult.dur;
  // шлейф: запоминаем прошлые положения, чтобы нарисовать призрачные копии
  if (Math.floor(ult.t / 70) !== Math.floor((ult.t - dt) / 70) && (ult.lift || 0) < 30) {
    for (let i = 0; i < 2; i++) {                    // пыль из-под ног
      const a = Math.random() * 6.28;
      puffs.push({ x: P.x + rnd(-10, 10), y: P.y + 16, vx: Math.cos(a) * 1.6,
                   vy: Math.sin(a) * .7 - .4, life: .8, r: rnd(3, 6) });
    }
  }
  ult.trail = ult.trail || [];
  if (ult.mode === "meteor") {
    ult.trail.push({ x: P.x, y: P.y - (ult.lift || 0), rot: ult.rot || 0, pose: ultPose() });
    if (ult.trail.length > 4) ult.trail.shift();
  }

  // У каждой постановки свой масштаб. Вход и выход плавные, импакт даёт
  // лишь короткий дополнительный толчок — без постоянной тряски кадра.
  const peak = ({ kick: 1.62, upper: 1.58, dash: 1.44, rain: 1.34,
                  meteor: 1.48, cross: 1.60, dance: 1.42, spiral: 1.38 })[ult.mode] || 1.42;
  const enter = Math.min(1, p / .12), leave = p > .82 ? Math.max(0, (1 - p) / .18) : 1;
  const target = 1 + (peak - 1) * enter * leave + (ult.punch || 0) * .10;
  ult.zoom += (target - ult.zoom) * (p < .82 ? .12 : .08);

  const boom = (r, dmg, sh) => {
    shake = Math.max(shake, sh);
    for (const e of enemies) {
      if (ult.done.includes(e)) continue;
      if (Math.hypot(e.x - P.x, e.y - P.y) > r) continue;
      ult.done.push(e);
      const aa = Math.atan2(e.y - P.y, e.x - P.x);
      e.kb = 5.5; e.kbx = Math.cos(aa); e.kby = Math.sin(aa);
      hit(e, dmg, P.x, P.y);
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
      addUltImpact(P.x, P.y - 42, 0, 1.05, "radial");
      SFX.shot(); boom(230, DMG, 16);
    }
    if (p > .78 && !ult.landed) { ult.landed = 1; boom(300, DMG, 22); SFX.boom();
      addUltImpact(P.x, P.y + 2, -Math.PI / 2, 1.45, "ground");
      booms.push({ x: P.x, y: P.y, r: 20, max: 300, life: 1 }); }

  } else if (ult.mode === "whirl") {
    ult.rot = 0;                                   // фигуру не крутим — только разворот
    ult.spinAim = p * Math.PI * 10;
    P.aim = ult.spinAim;
    P.face = Math.cos(ult.spinAim) > 0 ? 1 : -1;
    ult.lift = Math.sin(p * Math.PI) * 10;
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
        addUltImpact(best.x, best.y - 12, P.aim, .72, "shot");
        hit(best, DMG, P.x, P.y); P.muzzle = 120; shake = Math.max(shake, 6); ult.kick = 1;
        SFX.shot();
      }
    }

  } else if (ult.mode === "kick") {                   // вертушка с ноги
    ult.rot = 0; ult.lift = p < .5 ? Math.sin(p / .5 * Math.PI) * 26 : 0;
    const v = ult.victim;
    if (v && p > .42 && !ult.landed) {
      ult.landed = 1;
      const a = P.aim;
      ult.swoosh = { x: P.x, y: P.y - 22, r: 62, a0: a - 2.2, a1: a + .5, life: 1, w: 16 };
      flashes.push({ x: P.x + Math.cos(a) * 52, y: P.y - 22 + Math.sin(a) * 52,
                     r: 12, max: 78, life: 1, rot: Math.random() * 6.28, style: "star" });
      spawnShards(P.x + Math.cos(a) * 52, P.y - 22 + Math.sin(a) * 52, a, 14);
      addUltImpact(P.x + Math.cos(a) * 52, P.y - 22 + Math.sin(a) * 52, a, 1.55, "slash");
      hitStop = Math.max(hitStop, 90); shake = Math.max(shake, 20); SFX.boom();
      boom(150, DMG * 1.8, 20);
    }

  } else if (ult.mode === "upper") {                  // апперкот в небо
    ult.rot = 0;
    ult.lift = p < .30 ? 0 : p < .68 ? (p - .30) / .38 * 58 : 58 * (1 - (p - .68) / .32);
    const v = ult.victim;
    if (p > .34 && !ult.landed) {
      ult.landed = 1;
      const a = P.aim;
      ult.swoosh = { x: P.x + Math.cos(a) * 16, y: P.y - 10, r: 70, a0: 1.9, a1: -1.5, life: 1, w: 18 };
      flashes.push({ x: P.x + Math.cos(a) * 34, y: P.y - 52,
                     r: 12, max: 88, life: 1, rot: Math.random() * 6.28, style: "star" });
      spawnShards(P.x + Math.cos(a) * 34, P.y - 46, -1.57, 16);
      addUltImpact(P.x + Math.cos(a) * 34, P.y - 48, -Math.PI / 2, 1.65, "upper");
      hitStop = Math.max(hitStop, 100); shake = Math.max(shake, 22); SFX.boom();
      if (v && v.hp > 0) { v.launchUp = 1; }
      boom(130, DMG * 2.0, 22);
    }

  } else if (ult.mode === "dash") {                   // рывки с добиванием
    ult.rot = 0; ult.lift = 0;
    ult.next -= dt;
    if (ult.next <= 0) {
      ult.next = 230;
      const tg = ult.queue[ult.step++];
      if (tg && tg.hp > 0) {
        const a = Math.atan2(tg.y - P.y, tg.x - P.x);
        ult.blinks.push({ x1: P.x, y1: P.y, x2: tg.x - Math.cos(a) * 26,
                          y2: tg.y - Math.sin(a) * 26, life: 1 });
        P.x = tg.x - Math.cos(a) * 26; P.y = tg.y - Math.sin(a) * 26;
        P.aim = a; P.face = Math.cos(a) > 0 ? 1 : -1;
        ult.slash = 1;
        addUltImpact(tg.x, tg.y - 14, a, .95, "slash");
        if (!ult.done.includes(tg)) { ult.done.push(tg); hit(tg, DMG * 1.4, P.x, P.y); }
        SFX.shot(); shake = Math.max(shake, 9);
      } else if (ult.step > ult.queue.length) {
        const h = ult.home; P.x += (h.x - P.x) * .25; P.y += (h.y - P.y) * .25;
      }
    }
    if (ult.slash > 0) ult.slash -= dt / 200;

  } else if (ult.mode === "combo") {                  // цепочка телепорт-ударов
    ult.rot = 0; ult.lift = 0; ult.next -= dt;
    if (ult.next <= 0 && ult.step < ult.queue.length) {
      const tg = ult.queue[ult.step++];
      ult.next = 205;
      if (tg && tg.hp > 0) {
        const x0 = P.x, y0 = P.y;
        const a = Math.atan2(tg.y - P.y, tg.x - P.x);
        const side = ult.step % 2 ? 1 : -1;
        P.x = Math.max(24, Math.min(WORLD - 24, tg.x - Math.cos(a) * 28 - Math.sin(a) * side * 15));
        P.y = Math.max(24, Math.min(WORLD - 24, tg.y - Math.sin(a) * 28 + Math.cos(a) * side * 15));
        P.aim = a; P.face = Math.cos(a) > 0 ? 1 : -1; ult.focus = tg;
        ult.blinks.push({ x1: x0, y1: y0, x2: P.x, y2: P.y, life: 1 });
        ult.slash = 1.2;
        addUltImpact(tg.x, tg.y - 14, a + side * .38, .92 + ult.step * .05, "slash");
        hit(tg, DMG * .92, P.x, P.y); hitStop = Math.max(hitStop, 45);
        SFX.shot(); shake = Math.max(shake, 10 + ult.step);
      }
    }
    if (p > .76) {
      const h = ult.home;
      P.x += (h.x - P.x) * .16; P.y += (h.y - P.y) * .16;
    }
    if (p > .84 && !ult.landed) {
      ult.landed = 1; addUltImpact(P.x, P.y, P.aim, 1.45, "cross");
      boom(245, DMG * 1.15, 20); SFX.boom();
    }
    if (ult.slash > 0) ult.slash -= dt / 170;

  } else if (ult.mode === "meteor") {                 // взлёт, вращение и падение метеором
    const rise = Math.min(1, p / .28), fall = Math.max(0, Math.min(1, (p - .54) / .24));
    ult.lift = p < .54 ? Math.sin(rise * Math.PI / 2) * 190 : 190 * (1 - fall);
    ult.rot = p < .76 ? p * Math.PI * 7 : 0;
    if (p > .76 && !ult.landed) {
      ult.landed = 1; ult.lift = 0; ult.rot = 0;
      addUltImpact(P.x, P.y + 3, -Math.PI / 2, 2.15, "meteor");
      boom(410, DMG * 1.65, 30); SFX.boom(); hitStop = Math.max(hitStop, 115);
      for (let i = 0; i < 18; i++) {
        const a = i / 18 * 6.283;
        shots.push({ x: P.x, y: P.y - 5, vx: Math.cos(a) * 9.5, vy: Math.sin(a) * 9.5,
                     a, life: 650, dmg: DMG * .55, kind: "sniper", pierce: 1, hit: [] });
      }
      spawnShards(P.x, P.y, -Math.PI / 2, 26);
    }

  } else if (ult.mode === "spiral") {                 // вращающийся веер пуль
    ult.rot = 0; ult.lift = Math.sin(p * Math.PI) * 14;
    ult.spinAim = ult.t / 145;
    P.aim = ult.spinAim; P.face = Math.cos(P.aim) > 0 ? 1 : -1;
    if (p > .12 && p < .78 && Math.floor(ult.t / 135) !== Math.floor((ult.t - dt) / 135)) {
      for (const off of [0, Math.PI]) {
        const a = ult.spinAim + off;
        shots.push({ x: P.x + Math.cos(a) * 34, y: P.y - 18 + Math.sin(a) * 22,
                     vx: Math.cos(a) * 10.5, vy: Math.sin(a) * 10.5, a, life: 820,
                     dmg: DMG * .72, kind: "sniper", pierce: 1, hit: [] });
      }
      P.muzzle = 85; SFX.shot(); shake = Math.max(shake, 5);
    }
    if (p > .78 && !ult.landed) {
      ult.landed = 1; addUltImpact(P.x, P.y - 18, 0, 1.35, "spiral");
      boom(280, DMG, 18); SFX.boom();
    }

  } else if (ult.mode === "dance") {                  // постановочный ган-фу танец
    ult.rot = 0; ult.lift = 0;
    const envelope = Math.sin(p * Math.PI);
    ult.stageX = Math.sin(p * Math.PI * 4) * 22 * envelope;
    ult.stageY = -Math.abs(Math.sin(p * Math.PI * 4)) * 5 * envelope;
    const beat = Math.floor(p * 9);
    if (beat !== ult.beat && p > .08 && p < .78) {
      ult.beat = beat;
      const dirs = [-.20, -1.05, .82, -2.35, .28, 2.38, -.78];
      const base = dirs[beat % dirs.length] + (beat % 2 ? Math.PI : 0);
      P.aim = base; P.face = Math.cos(base) > 0 ? 1 : -1;
      const sx = P.x + ult.stageX, sy = P.y - 20 + ult.stageY;
      for (let i = -2; i <= 2; i++) {
        const a = base + i * .105;
        shots.push({ x: sx + Math.cos(a) * 18, y: sy + Math.sin(a) * 18,
                     vx: Math.cos(a) * 10.8, vy: Math.sin(a) * 10.8, a, life: 760,
                     dmg: DMG * .48, kind: "sniper", pierce: 1, hit: [] });
      }
      P.muzzle = 100; ult.dancePulse = 1; SFX.shot(); shake = Math.max(shake, 4.5);
    }
    if (ult.dancePulse > 0) ult.dancePulse -= dt / 150;
    if (p > .80 && !ult.landed) {
      ult.landed = 1; ult.stageX = 0; ult.stageY = 0;
      for (let i = 0; i < 20; i++) {
        const a = i / 20 * 6.283 + .16;
        shots.push({ x: P.x + Math.cos(a) * 22, y: P.y - 18 + Math.sin(a) * 14,
                     vx: Math.cos(a) * 11.5, vy: Math.sin(a) * 11.5, a, life: 820,
                     dmg: DMG * .62, kind: "sniper", pierce: 1, hit: [] });
      }
      addUltImpact(P.x, P.y - 18, 0, 1.50, "dance");
      boom(320, DMG * 1.15, 21); hitStop = Math.max(hitStop, 85); SFX.boom();
    }

  } else if (ult.mode === "cross") {                  // два росчерка складываются в крест
    ult.rot = 0; ult.lift = Math.sin(p * Math.PI) * 12;
    const v = ult.victim, a = P.aim;
    const ix = v ? v.x : P.x + Math.cos(a) * 62;
    const iy = v ? v.y - 14 : P.y - 14 + Math.sin(a) * 62;
    if (p > .27 && !ult.fired) {
      ult.fired = 1; addUltImpact(ix, iy, a - .72, .88, "slash");
      ult.swoosh = { x: ix, y: iy, r: 72, a0: a - 2.1, a1: a + .25, life: 1, w: 12 };
      SFX.shot(); hitStop = Math.max(hitStop, 45);
    }
    if (p > .47 && !ult.landed) {
      ult.landed = 1; addUltImpact(ix, iy, a, 1.82, "cross");
      spawnShards(ix, iy, a, 22); hitStop = Math.max(hitStop, 110); shake = Math.max(shake, 25);
      if (v && v.hp > 0) { ult.done.push(v); v.launchUp = 1; hit(v, DMG * 2.25, P.x, P.y); }
      boom(185, DMG * 1.45, 24); SFX.boom();
    }

  } else if (ult.mode === "rain") {                   // прыжок и ливень сверху
    ult.rot = 0;
    ult.lift = p < .22 ? (p / .22) * 165 : p < .84 ? 165 + Math.sin(t / 220) * 6
                                                  : 165 * (1 - (p - .84) / .16);
    if (p > .24 && p < .84 && Math.floor(ult.t / 110) !== Math.floor((ult.t - dt) / 110)) {
      const live = enemies.filter(e => !ult.done.includes(e) &&
                                       Math.hypot(e.x - P.x, e.y - P.y) < 420);
      const tg = live[Math.random() * live.length | 0];
      if (tg) {
        ult.done.push(tg);
        ult.marks.push({ x: tg.x, y: tg.y, life: 1, e: tg });
        SFX.shot();
      }
    }
    for (const m of ult.marks) {
      m.life -= dt / 380;
      if (m.life <= .45 && !m.done) {
        m.done = 1;
        if (m.e && m.e.hp > 0) hit(m.e, DMG, m.x, m.y - 40);
        addUltImpact(m.x, m.y - 4, Math.PI / 2, .90, "bolt");
        booms.push({ x: m.x, y: m.y, r: 8, max: 74, life: .7 });
        shake = Math.max(shake, 7);
      }
    }
    ult.marks = ult.marks.filter(m => m.life > 0);
    if (p > .86 && !ult.landed) { ult.landed = 1; boom(300, DMG, 20); SFX.boom();
      addUltImpact(P.x, P.y + 2, -Math.PI / 2, 1.35, "ground");
      booms.push({ x: P.x, y: P.y, r: 20, max: 300, life: 1 }); }

  } else {                                            // slam
    ult.rot = 0;
    ult.lift = p < .55 ? Math.sin(p / .55 * Math.PI * .5) * 120
                       : p < .75 ? Math.cos((p - .55) / .2 * Math.PI * .5) * 120 : 0;
    if (p > .75 && !ult.landed) {
      ult.landed = 1; boom(360, DMG * 1.4, 26); SFX.boom();
      addUltImpact(P.x, P.y + 4, -Math.PI / 2, 1.85, "ground");
      booms.push({ x: P.x, y: P.y, r: 24, max: 360, life: 1 });
      booms.push({ x: P.x, y: P.y, r: 12, max: 220, life: .8 });
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * 6.28, s2 = rnd(2, 6);
        puffs.push({ x: P.x, y: P.y, vx: Math.cos(a) * s2, vy: Math.sin(a) * s2, life: 1, r: rnd(3, 7) });
      }
    }
  }

  if (ult.kick > 0) ult.kick -= dt / 190;
  if (ult.swoosh) { ult.swoosh.life -= dt / 260; if (ult.swoosh.life <= 0) ult.swoosh = null; }
  for (const sh of ult.shards) {
    sh.x += sh.vx * dt / 16.67; sh.y += sh.vy * dt / 16.67;
    sh.vy += .18 * dt / 16.67; sh.rot += sh.rv * dt / 16.67; sh.life -= dt / 720;
  }
  ult.shards = ult.shards.filter(sh => sh.life > 0);
  for (const b of ult.blinks) b.life -= dt / 340;
  ult.blinks = ult.blinks.filter(b => b.life > 0);
  for (const f of ult.impacts) f.life -= dt / (260 + f.power * 70);
  ult.impacts = ult.impacts.filter(f => f.life > 0);
  ult.flash = Math.max(0, (ult.flash || 0) - dt / 145);
  ult.punch = Math.max(0, (ult.punch || 0) - dt / 240);
  if (ult.tracer) { ult.tracer.life -= dt / 260; if (ult.tracer.life <= 0) ult.tracer = null; }
  if (ult.t >= ult.dur) {
    ult.on = false; ult.trail = []; ult.fired = 0; ult.landed = 0;
    ult.rot = 0; ult.lift = 0; ult.stageX = 0; ult.stageY = 0; ult.focus = null;
  }
}

/* ── позы ульты ──────────────────────────────────────────────
   Каждый режим — набор ключевых кадров. Между ними интерполируем,
   поэтому движение читается как живое, а не как поворот картинки.  */
const lerp = (a, b, u) => a + (b - a) * u;
function mixPose(A, B, u) {
  const o = {};
  for (const key in A) {
    if (Array.isArray(A[key])) o[key] = [lerp(A[key][0], B[key][0], u), lerp(A[key][1], B[key][1], u)];
    else o[key] = lerp(A[key], B[key], u);
  }
  return o;
}
function keyframes(list, p) {
  for (let i = 0; i < list.length - 1; i++) {
    const [t0, A] = list[i], [t1, B] = list[i + 1];
    if (p <= t1 || i === list.length - 2) {
      const u = Math.max(0, Math.min(1, (p - t0) / (t1 - t0)));
      return mixPose(A, B, u * u * (3 - 2 * u));      // сглаживание
    }
  }
  return list[0][1];
}

const BASE = { lf: [7, -2], lb: [-7, -2], af: [11, -27], ab: [-10, -26],
               hip: -18, neck: -40, head: [0, -52], gunAt: [2, -27], lean: 0, squash: 1 };
const K = o => Object.assign({}, BASE, o);

const POSES = {
  // приседание → группировка в воздухе → раскрытие звездой → мягкая посадка
  flip: [
    [0,   K({ lf: [9, -2], lb: [-9, -2], af: [7, -20], ab: [-8, -20], hip: -13, neck: -33, head: [0, -45], squash: .80, lean: .12 })],
    [.20, K({ lf: [5, -14], lb: [-4, -16], af: [4, -34], ab: [-5, -34], hip: -20, neck: -40, head: [0, -51], squash: 1.06 })],
    [.42, K({ lf: [3, -22], lb: [-3, -24], af: [2, -36], ab: [-3, -36], hip: -22, neck: -38, head: [0, -48], squash: .94 })],
    [.62, K({ lf: [16, -6], lb: [-16, -6], af: [20, -40], ab: [-20, -40], hip: -20, neck: -42, head: [0, -55], squash: 1.10 })],
    [.80, K({ lf: [10, -2], lb: [-8, -6], af: [14, -30], ab: [-12, -34], hip: -18, neck: -40, head: [0, -52] })],
    [1,   K({ lf: [13, -2], lb: [-11, -2], af: [16, -22], ab: [-14, -18], hip: -12, neck: -32, head: [-2, -44], squash: .78, lean: .18 })],
  ],
  // раскрутка: руки в стороны, одна нога подобрана, корпус отклонён
  whirl: [
    [0,   K({ lf: [8, -2], lb: [-8, -2], af: [12, -28], ab: [-11, -26], lean: 0 })],
    [.14, K({ lf: [34, -20], lb: [-9, -2], af: [-14, -34], ab: [16, -40], hip: -20, neck: -42, head: [-5, -54], lean: -.30, squash: 1.08 })],
    [.86, K({ lf: [36, -22], lb: [-10, -2], af: [-16, -36], ab: [18, -42], hip: -21, neck: -43, head: [-6, -55], lean: -.32, squash: 1.09 })],
    [1,   K({ lf: [10, -2], lb: [-10, -2], af: [13, -28], ab: [-12, -26], lean: 0 })],
  ],
  // стойка стрелка: широкая база, отдача корпусом
  volley: [
    [0,   K({ lf: [10, -2], lb: [-10, -2], af: [13, -28], ab: [-9, -26], lean: 0 })],
    [.12, K({ lf: [17, -2], lb: [-15, -2], af: [17, -29], ab: [-6, -32], hip: -15, neck: -37, head: [-2, -49], lean: -.10, squash: .93 })],
    [.90, K({ lf: [18, -2], lb: [-16, -2], af: [18, -29], ab: [-5, -33], hip: -15, neck: -37, head: [-2, -49], lean: -.12, squash: .93 })],
    [1,   K({ lf: [10, -2], lb: [-10, -2], af: [13, -28], ab: [-9, -26], lean: 0 })],
  ],
  // прыжок с ударом: замах вверх → падение → удар кулаком в землю
  // вертушка: опорная нога согнута, бьющая вытянута в линию с корпусом
  kick: [
    [0,   K({ lf: [10, -2], lb: [-10, -2], af: [12, -28], ab: [-10, -26], lean: .06 })],
    [.30, K({ lf: [-4, -10], lb: [-14, -2], af: [-6, -34], ab: [-18, -22], hip: -20, neck: -42, head: [-4, -54], lean: .30, squash: 1.04 })],
    [.46, K({ lf: [34, -26], lb: [-12, -2], af: [-16, -30], ab: [6, -40], hip: -22, neck: -44, head: [-6, -56], lean: -.34, squash: 1.10 })],
    [.68, K({ lf: [30, -22], lb: [-11, -2], af: [-14, -28], ab: [4, -38], hip: -21, neck: -43, head: [-5, -55], lean: -.30, squash: 1.06 })],
    [1,   K({ lf: [12, -2], lb: [-12, -2], af: [12, -28], ab: [-10, -26], lean: 0 })],
  ],
  // апперкот: подсед, затем взлёт с рукой вверх
  upper: [
    [0,   K({ lf: [9, -2], lb: [-9, -2], af: [10, -24], ab: [-9, -24], hip: -13, neck: -33, head: [0, -45], squash: .80, lean: .14 })],
    [.34, K({ lf: [14, -2], lb: [-12, -4], af: [14, -58], ab: [-12, -30], hip: -20, neck: -42, head: [2, -54], squash: 1.12, lean: -.22 })],
    [.62, K({ lf: [10, -12], lb: [-9, -14], af: [12, -64], ab: [-11, -34], hip: -22, neck: -44, head: [2, -56], squash: 1.14, lean: -.26 })],
    [1,   K({ lf: [11, -2], lb: [-11, -2], af: [12, -28], ab: [-10, -26], lean: 0 })],
  ],
  // рывок: глубокий выпад вперёд, рука с оружием вытянута
  dash: [
    [0,   K({ lf: [16, -2], lb: [-14, -6], af: [22, -30], ab: [-12, -22], hip: -15, neck: -37, head: [3, -49], lean: -.16, squash: .94 })],
    [.5,  K({ lf: [20, -2], lb: [-16, -8], af: [26, -31], ab: [-14, -20], hip: -14, neck: -36, head: [4, -48], lean: -.20, squash: .92 })],
    [1,   K({ lf: [16, -2], lb: [-14, -6], af: [22, -30], ab: [-12, -22], hip: -15, neck: -37, head: [3, -49], lean: -.16, squash: .94 })],
  ],
  // телепорт-комбо: низкие выпады чередуются с резкой сменой плеча
  combo: [
    [0,   K({ lf: [17, -2], lb: [-15, -7], af: [23, -31], ab: [-14, -20], hip: -14, neck: -36, head: [4, -48], lean: -.20, squash: .91 })],
    [.28, K({ lf: [-15, -5], lb: [18, -2], af: [-20, -20], ab: [24, -33], hip: -14, neck: -36, head: [-4, -48], lean: .21, squash: .91 })],
    [.56, K({ lf: [20, -2], lb: [-16, -8], af: [27, -32], ab: [-16, -18], hip: -13, neck: -35, head: [5, -47], lean: -.24, squash: .89 })],
    [.82, K({ lf: [-17, -3], lb: [18, -2], af: [-23, -19], ab: [25, -34], hip: -14, neck: -36, head: [-5, -48], lean: .22, squash: .91 })],
    [1,   K({ lf: [12, -2], lb: [-12, -2], af: [13, -28], ab: [-11, -26], lean: 0 })],
  ],
  // метеор: группировка на высоте и тяжёлый удар двумя руками вниз
  meteor: [
    [0,   K({ lf: [12, -2], lb: [-12, -2], af: [8, -20], ab: [-8, -20], hip: -12, neck: -32, head: [0, -44], squash: .76 })],
    [.25, K({ lf: [6, -18], lb: [-6, -18], af: [4, -38], ab: [-4, -38], hip: -23, neck: -43, head: [0, -54], squash: 1.08 })],
    [.55, K({ lf: [3, -23], lb: [-3, -23], af: [2, -44], ab: [-2, -44], hip: -25, neck: -44, head: [0, -55], squash: 1.04 })],
    [.76, K({ lf: [8, -6], lb: [-8, -6], af: [5, -4], ab: [-5, -4], hip: -12, neck: -30, head: [0, -42], lean: .08, squash: .74 })],
    [1,   K({ lf: [18, -2], lb: [-16, -2], af: [7, -5], ab: [-14, -20], hip: -10, neck: -28, head: [3, -40], lean: .14, squash: .70 })],
  ],
  // спиральный залп: широкая стойка и оружие ведёт круг вокруг корпуса
  spiral: [
    [0,   K({ lf: [13, -2], lb: [-13, -2], af: [16, -28], ab: [-14, -27], hip: -17, neck: -39, head: [0, -51], squash: .96 })],
    [.22, K({ lf: [18, -2], lb: [-18, -2], af: [24, -34], ab: [-22, -34], hip: -17, neck: -40, head: [0, -52], squash: 1.03 })],
    [.78, K({ lf: [19, -2], lb: [-19, -2], af: [26, -31], ab: [-24, -36], hip: -17, neck: -40, head: [0, -52], squash: 1.04 })],
    [1,   K({ lf: [14, -2], lb: [-14, -2], af: [16, -27], ab: [-14, -27], hip: -16, neck: -38, head: [0, -50], squash: .94 })],
  ],
  // ган-фу: шаг, поворот, выпад, присед и чистая финальная поза
  dance: [
    [0,   K({ lf: [10, -2], lb: [-10, -2], af: [14, -28], ab: [-12, -26], lean: 0 })],
    [.10, K({ lf: [19, -2], lb: [-7, -8], af: [24, -32], ab: [-18, -20], hip: -16, neck: -39, head: [3, -51], lean: -.18, squash: .97 })],
    [.22, K({ lf: [5, -10], lb: [-18, -2], af: [-20, -34], ab: [18, -20], hip: -18, neck: -40, head: [-3, -52], lean: .20, squash: 1.02 })],
    [.34, K({ lf: [22, -2], lb: [-15, -7], af: [27, -29], ab: [-21, -23], hip: -14, neck: -36, head: [5, -48], lean: -.23, squash: .90 })],
    [.46, K({ lf: [-8, -5], lb: [17, -2], af: [-24, -31], ab: [20, -22], hip: -16, neck: -38, head: [-4, -50], lean: .21, squash: .94 })],
    [.58, K({ lf: [18, -2], lb: [-18, -2], af: [23, -39], ab: [-22, -37], hip: -18, neck: -42, head: [0, -54], lean: -.08, squash: 1.05 })],
    [.70, K({ lf: [25, -2], lb: [-13, -10], af: [29, -25], ab: [-22, -18], hip: -12, neck: -33, head: [5, -45], lean: -.26, squash: .82 })],
    [.82, K({ lf: [20, -2], lb: [-20, -2], af: [28, -34], ab: [-27, -34], hip: -17, neck: -40, head: [0, -52], squash: 1.02 })],
    [1,   K({ lf: [15, -2], lb: [-15, -2], af: [18, -30], ab: [-16, -28], hip: -16, neck: -38, head: [1, -50], lean: -.05, squash: .94 })],
  ],
  // крестовый удар: глубокий замах, два пересекающихся росчерка и финальная стойка
  cross: [
    [0,   K({ lf: [12, -2], lb: [-12, -2], af: [-15, -36], ab: [14, -18], hip: -15, neck: -36, head: [-3, -48], lean: .16, squash: .91 })],
    [.27, K({ lf: [17, -2], lb: [-14, -7], af: [28, -37], ab: [-20, -18], hip: -14, neck: -36, head: [4, -48], lean: -.24, squash: .91 })],
    [.47, K({ lf: [-15, -6], lb: [18, -2], af: [-28, -36], ab: [23, -18], hip: -14, neck: -36, head: [-4, -48], lean: .25, squash: .90 })],
    [.70, K({ lf: [20, -2], lb: [-17, -8], af: [30, -30], ab: [-22, -24], hip: -13, neck: -35, head: [5, -47], lean: -.24, squash: .88 })],
    [1,   K({ lf: [13, -2], lb: [-13, -2], af: [14, -28], ab: [-12, -26], lean: 0 })],
  ],
  // ливень: подобрал ноги, обе руки вниз, стреляет с высоты
  rain: [
    [0,   K({ lf: [8, -2], lb: [-8, -2], af: [10, -24], ab: [-9, -24], hip: -12, neck: -32, head: [0, -44], squash: .80 })],
    [.24, K({ lf: [7, -14], lb: [-7, -14], af: [14, -18], ab: [-13, -18], hip: -20, neck: -42, head: [0, -54], squash: 1.10 })],
    [.84, K({ lf: [8, -16], lb: [-8, -16], af: [16, -16], ab: [-15, -16], hip: -20, neck: -42, head: [0, -54], squash: 1.08 })],
    [1,   K({ lf: [11, -2], lb: [-11, -2], af: [12, -26], ab: [-11, -26], hip: -14, neck: -34, head: [0, -46], squash: .86 })],
  ],
  slam: [
    [0,   K({ lf: [8, -2], lb: [-8, -2], af: [10, -22], ab: [-9, -22], hip: -12, neck: -32, head: [0, -44], squash: .78 })],
    [.30, K({ lf: [4, -14], lb: [-4, -14], af: [6, -46], ab: [-6, -46], hip: -22, neck: -44, head: [0, -57], squash: 1.14 })],
    [.55, K({ lf: [3, -18], lb: [-3, -18], af: [4, -50], ab: [-4, -50], hip: -24, neck: -46, head: [0, -59], squash: 1.16 })],
    [.74, K({ lf: [6, -4], lb: [-6, -4], af: [8, -34], ab: [-8, -34], hip: -18, neck: -40, head: [0, -52], squash: .96 })],
    [.82, K({ lf: [18, -2], lb: [-16, -2], af: [6, -4], ab: [-16, -24], hip: -10, neck: -28, head: [4, -40], squash: .72, lean: .16 })],
    [1,   K({ lf: [15, -2], lb: [-13, -2], af: [9, -14], ab: [-14, -22], hip: -13, neck: -33, head: [2, -45], squash: .84, lean: .10 })],
  ],
};

/* Один короткий импакт хранит направление и характер удара. Рисуется он в
   render.js, а здесь остаётся только лёгкое состояние без картинок/ассетов. */
function addUltImpact(x, y, dir, power, style) {
  ult.impacts = ult.impacts || [];
  ult.impacts.push({ x, y, dir, power, style, life: 1, seed: rnd(0, 6.283) });
  if (ult.impacts.length > 18) ult.impacts.shift();
  ult.flash = Math.max(ult.flash || 0, .16 + power * .24);
  ult.punch = Math.max(ult.punch || 0, .22 + power * .38);
}

function spawnShards(x, y, dir, n) {
  for (let i = 0; i < n; i++) {
    const a = dir + rnd(-1.1, 1.1), sp = rnd(2.5, 8);
    ult.shards.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rnd(0, 3),
                      rot: rnd(0, 6.28), rv: rnd(-.3, .3), s: rnd(2.5, 6), life: 1 });
  }
}

function ultPose() {
  const p = Math.max(0, Math.min(1, ult.t / ult.dur));
  return keyframes(POSES[ult.mode] || POSES.flip, p);
}

/* ── двойной клик мышью ── */
let lastClick = 0;
function ultDblClick(e) {
  if (e.pointerType !== "mouse" || e.button !== 0) return false;
  const now = performance.now();
  const isSecond = now - lastClick < 340;
  lastClick = now;
  if (isSecond && ultReady()) { lastClick = 0; startUlt(); return true; }
  return false;
}

/* ── жест «раздвинуть пальцы» на телефоне ── */
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
