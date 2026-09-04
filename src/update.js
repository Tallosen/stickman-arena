"use strict";
/* update.js — главный цикл и вся физика кадра */

/* ── цикл ─────────────────────────────────────────────────── */
let last = 0;
requestAnimationFrame(function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(34, now - last); last = now;
  try {
    if (hitStop > 0) { hitStop -= dt; draw(); return; }
    if (running && !paused) update(dt);
    draw();
  } catch (err) {
    running = false;
    fatal("Сбой в кадре: " + err.message);
    throw err;
  }
});

function update(dt) {
  updateUlt(dt);                       // ульта живёт в реальном времени
  if (ult.on) dt *= .30;               // всё остальное — в замедлении
  t += dt; const k = dt / 16.67;
  updateAbilities(dt, k);
  if (P.stagePulse > 0) P.stagePulse = Math.max(0, P.stagePulse - dt);
  if (shake > 0) shake = Math.max(0, shake - dt * .045);
  if (xpBoost > 0) xpBoost -= dt;
  if (P.muzzle > 0) P.muzzle -= dt;
  if (P.hasteT > 0) P.hasteT -= dt;
  P.spin = (P.spin || 0) + (P.spinV || 0) * k;
  P.spinV = (P.spinV || 0) * .93;
  if (P.invT > 0) P.invT -= dt;

  if (pointer.active && !ult.on) {
    const dx = pointer.x - P.x, dy = pointer.y - P.y, d = Math.hypot(dx, dy);
    if (d > 5) {
      const hs = P.hasteT > 0 ? 1.6 : 1;
      const v = Math.min(P.speed * hs * k, d);
      P.x += dx / d * v; P.y += dy / d * v; P.phase += .27 * hs * k;
      P.run += (1 - P.run) * .06 * k;          // плавно набирает
      P.stepT = (P.stepT || 0) - dt;
      if (P.stepT <= 0) {                         // пыль из-под ног при беге
        P.stepT = 190 / hs;
        puffs.push({ x: P.x + rnd(-7, 7), y: P.y + 15, vx: rnd(-.5, .5),
                     vy: rnd(-.5, -.1), life: .55, r: rnd(2, 4) });
      }
      if (P.hasteT > 0) {                         // след при ускорении
        P.ghostT = (P.ghostT || 0) - dt;
        if (P.ghostT <= 0) {
          P.ghostT = 58;
          P.ghosts = P.ghosts || [];
          P.ghosts.push({ x: P.x, y: P.y, ph: P.phase, face: P.face, life: 1 });
          if (P.ghosts.length > 4) P.ghosts.shift();
        }
      }
      if (Math.abs(dx) > 1) P.face = dx > 0 ? 1 : -1;
    }
  }
  else P.run += (0 - P.run) * .05 * k;       // и плавно гаснет
  if (P.ghosts) { for (const g2 of P.ghosts) g2.life -= dt / 210;
                  P.ghosts = P.ghosts.filter(g2 => g2.life > 0); }
  if (P.recoilT > 0) P.recoilT -= dt;
  pushOut(P);
  if (P.hurt > 0) P.hurt -= dt;
  P.orbA += .055 * k;
  cam.x = Math.max(0, Math.min(WORLD - W, P.x - W / 2));
  cam.y = Math.max(0, Math.min(WORLD - H, P.y - H / 2));

  spawnT -= dt;
  if (spawnT <= 0 && enemies.length < 140) {
    const stage = Math.max(1, P.lvl || 1);
    spawnT = Math.max(155, 820 - (stage - 1) * 72 - Math.min(230, t / 500));
    const r = Math.random();
    const tankChance = Math.min(.24, Math.max(0, (stage - 2) * .045));
    const runnerChance = Math.min(.48, .10 + (stage - 1) * .055);
    spawn(r < tankChance ? "tank" : r < tankChance + runnerChance ? "runner" : "basic");
  }
  eliteT -= dt; if (eliteT <= 0) {
    eliteT = Math.max(17000, 44000 - (P.lvl - 1) * 3500); spawn("elite"); shake = 10;
  }
  chestT -= dt; if (chestT <= 0) { chestT = 13000 - meta.luck * 2200; spawnChest(); }
  healT -= dt; if (healT <= 0) { healT = 15000; spawnHeart(); }

  for (const h of pickups) {
    h.a += .05 * k;
    if (dist(h, P) >= 34) continue;
    h.dead = true;
    if (h.kind === "heart") {
      if (P.hp < P.hpMax) { P.hp++; pops.push({ x: P.x, y: P.y - 52, txt: "+1", life: 1.2, col: "#c8402c" }); }
      else { gainXP(150); pops.push({ x:P.x, y:P.y-52, txt:"XP +150", life:1.2, col:"#c79018" }); }
      SFX.heal();
    } else if (h.kind === "haste") {
      P.hasteT = 7000;
      pops.push({ x: P.x, y: P.y - 52, txt: "УСКОРЕНИЕ", life: 1.4, col: "#a8761a" });
      chain([700, 900, 1200], "square", .05);
    } else {
      P.invT = 6000; P.seen = { x: P.x, y: P.y };
      pops.push({ x: P.x, y: P.y - 52, txt: "НЕУЯЗВИМОСТЬ", life: 1.4, col: "#2f7d9c" });
      chain([500, 700, 990], "sine", .055);
    }
  }
  pickups = pickups.filter(h => !h.dead);

  for (const ic of ices) ic.life -= dt;
  ices = ices.filter(i => i.life > 0);

  for (const e of enemies) {
    let tankTarget = null, tankDistance = 1e9;
    for (const q of allyTanks) {
      if (q.dead || q.hp <= 0) continue;
      const d = Math.hypot(q.x-e.x,q.y-e.y);
      if (d < tankDistance && d < 430) { tankDistance=d; tankTarget=q; }
    }
    let slow = 1;
    for (const ic of ices) if (Math.hypot(e.x - ic.x, e.y - ic.y) < ic.r) {
      slow = .34; e.slip = 1; e.hp -= dt / 1000 * 1.4;
    }
    if (e.hp <= 0) { popEnemy(e); continue; }
    if (e.kb > 0) { e.x += e.kbx * e.kb * k; e.y += e.kby * e.kb * k; e.kb *= .82; }
    else {
      const tx = tankTarget ? tankTarget.x : P.invT > 0 ? P.seen.x : P.x;
      const ty = tankTarget ? tankTarget.y : P.invT > 0 ? P.seen.y : P.y;
      const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy) || 1;
      let vx = dx / d, vy = dy / d;
      if (P.invT > 0) { vx += Math.cos(t / 300 + e.bob) * .5; vy += Math.sin(t / 300 + e.bob) * .5; }

      // если застрял — на секунду уходим вбок, пока не выберемся
      e.stuckT += dt;
      if (e.stuckT > 380) {
        const moved = Math.hypot(e.x - e.lx, e.y - e.ly);
        if (moved < 6) {
          e.stuckMs = (e.stuckMs || 0) + e.stuckT;
          if (e.wanderT <= 0) {                     // первая мера — обойти вбок
            e.wanderT = 850;
            e.wander = Math.atan2(dy, dx) + (Math.random() < .5 ? 1.6 : -1.6);
          }
        } else e.stuckMs = 0;
        e.lx = e.x; e.ly = e.y; e.stuckT = 0;
      }
      // не выбрался за две с половиной секунды — переносим к игроку заново
      if ((e.stuckMs || 0) > 2500) {
        const ang = Math.random() * 6.283, rr = Math.max(W, H) * .58 + 70;
        e.x = Math.max(40, Math.min(WORLD - 40, P.x + Math.cos(ang) * rr));
        e.y = Math.max(40, Math.min(WORLD - 40, P.y + Math.sin(ang) * rr));
        e.stuckMs = 0; e.wanderT = 0; e.kb = 0;
      }
      if (e.wanderT > 0) {
        e.wanderT -= dt;
        vx = Math.cos(e.wander) + (P.x - e.x) / d * .25;
        vy = Math.sin(e.wander) + (P.y - e.y) / d * .25;
      } else {
        // обход препятствий: смотрим дальше вперёд и отворачиваем сильнее
        for (const o of props) {
          const ox = o.x - e.x, oy = o.y - e.y, od = Math.hypot(ox, oy);
          const reach = o.r * .72 + e.r + 46;
          if (od > reach || od < .01) continue;
          if (ox / od * vx + oy / od * vy < -.05) continue;
          const side = (ox * vy - oy * vx) > 0 ? -1 : 1;
          const w = (1 - od / reach) * 3.0;
          vx += -oy / od * side * w; vy += ox / od * side * w;
        }
      }
      const j = e.slip > 0 ? rnd(-.6, .6) : 0;
      const vl = Math.hypot(vx, vy) || 1;
      e.x += (vx / vl + j) * e.speed * slow * k;
      e.y += (vy / vl + j) * e.speed * slow * k;
      e.face = dx > 0 ? 1 : -1;
    }
    const anim = e.kind === 'runner' ? .30 : e.kind === 'tank' ? .13 : e.kind === 'elite' ? .17 : .23;
    e.phase += (anim * slow + (e.slip > 0 ? .3 : 0)) * k;
    if (e.slip > 0) e.slip -= dt / 500;
    if (e.flash > 0) e.flash -= dt;
    if (e.poison > 0) e.poison -= dt;
    if (e.flinch > 0) e.flinch -= dt / 170;
    if (e.orbCd > 0) e.orbCd -= dt;
    pushOut(e);
    if (tankTarget && Math.hypot(e.x-tankTarget.x,e.y-tankTarget.y) < e.r+tankTarget.r+3) {
      if (tankTarget.hurt <= 0) {
        const base = e.kind === "elite" ? 5 : e.kind === "tank" ? 2.4 : e.kind === "runner" ? 1.15 : .8;
        const dmg = base * (1 + (P.lvl - 1) * .10);
        tankTarget.hp = Math.max(0, tankTarget.hp - dmg); tankTarget.hurt = 300;
        pops.push({x:tankTarget.x,y:tankTarget.y-38,txt:"-"+Math.round(dmg),life:.75,col:FOE});
        shake=Math.max(shake,e.kind==="elite"?9:3);
      }
      const a=Math.atan2(e.y-tankTarget.y,e.x-tankTarget.x);
      e.kb=2.8;e.kbx=Math.cos(a);e.kby=Math.sin(a);
      continue;
    }
    if (dist(e, P) < P.r + e.r && P.hurt <= 0 && P.invT <= 0) {
      // мелкие снимают половину сердца, крупные — больше
      const base = e.kind === "elite" ? 1.5 : e.kind === "tank" ? 1 : .5;
      const dmg = Math.min(2.5, base + Math.floor((P.lvl - 1) / 3) * .5);
      P.hp = Math.round((P.hp - dmg) * 2) / 2;
      P.hurt = P.iframe; shake = dmg >= 1 ? 14 : 9; SFX.hurt();
      pops.push({ x: P.x, y: P.y - 40, txt: dmg === .5 ? "-½" : "-" + dmg, life: 1, col: FOE });
      if (P.hp <= 0) return gameOver();
    }
  }
  // мягкое расталкивание через сетку, иначе толпа слипается и стоит
  const cell = 48, grid = new Map();
  for (const e of enemies) {
    const key = ((e.x / cell) | 0) + "," + ((e.y / cell) | 0);
    (grid.get(key) || grid.set(key, []).get(key)).push(e);
  }
  for (const e of enemies) {
    const cx2 = (e.x / cell) | 0, cy2 = (e.y / cell) | 0;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const list = grid.get((cx2 + a) + "," + (cy2 + b)); if (!list) continue;
      for (const o of list) {
        if (o === e) continue;
        const dx = e.x - o.x, dy = e.y - o.y, d = Math.hypot(dx, dy), m = e.r + o.r;
        if (d < m && d > .01) {
          const push = (m - d) * .35;
          e.x += dx / d * push; e.y += dy / d * push;
        }
      }
    }
  }
  enemies = enemies.filter(e => e.hp > 0);

  updatePet(dt, k);
  updateFarm(dt, k);

  for (const m of mines) {
    if (m.arm > 0) { m.arm -= dt; continue; }
    for (const e of enemies) if (Math.hypot(e.x - m.x, e.y - m.y) < e.r + (m.mini ? 18 : 26)) { m.dead = true; explode(m.x, m.y, m.mini ? 72 : 130, m.mini ? m.dmg : 9); break; }
  }
  mines = mines.filter(m => !m.dead);
  for (const g of nades) {
    g.x += g.vx * k; g.y += g.vy * k; g.vx *= .965; g.vy *= .965; g.fuse -= dt;
    if (g.fuse <= 0) { g.dead = true; explode(g.x, g.y, 155, 7); }
  }
  nades = nades.filter(g => !g.dead);

  // прицеливание и выстрел из ствола
  const near = enemies.map(e => ({ e, d: dist(e, P) })).filter(o => o.d < P.range)
    .sort((a, b) => a.d - b.d).slice(0, P.nShots);
  if (near.length) {
    const tg = near[0].e;
    P.aim = Math.atan2(tg.y - (P.y - 11), tg.x - P.x);
    P.face = Math.cos(P.aim) > 0 ? 1 : -1;
  }
  shotT -= dt;
  if (shotT <= 0 && near.length) {
    shotT = P.fireRate * (P.hasteT > 0 ? .55 : 1); SFX.shot();
    P.muzzle = P.wtype === "minigun" ? 60 : 100;
    P.recoilT = P.wtype === "sniper" ? 170 : P.wtype === "shotgun" ? 140 : 80;
    puffs.push({ x: P.x + Math.cos(P.aim) * 34, y: P.y - 11 + Math.sin(P.aim) * 34,
                 vx: Math.cos(P.aim) * 1.2, vy: Math.sin(P.aim) * 1.2 - .3,
                 life: .5, r: rnd(2, 4) });
    const mk = (a, dmg, kind) => {
      const mx = P.x + Math.cos(a) * 34, my = P.y - 11 + Math.sin(a) * 34;
      const sp = kind === "sniper" ? 13 : kind === "pellet" ? 7.4 : 7.2;
      shots.push({ x: mx, y: my, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                   a, life: kind === "sniper" ? 1400 : 850, dmg, kind,
                   pierce: kind === "sniper", hit: [],
                   crit: kind === "sniper" && Math.random() < .22 + .05 * P.gear.gun });
    };
    const ang = e => Math.atan2(e.y - (P.y - 11), e.x - P.x);
    if (P.wtype === "shotgun") {
      const a0 = ang(near[0].e);
      for (let i = 0; i < P.pellets; i++)
        mk(a0 + (i / (P.pellets - 1) - .5) * P.spread + rnd(-.05, .05), P.damage, "pellet");
      P.recoil = 1;
    } else if (P.wtype === "minigun") {
      mk(ang(near[0].e) + rnd(-P.spread, P.spread) / 2, P.damage, "mini");
      P.spinV = .42;
    } else if (P.wtype === "sniper") {
      for (const { e } of near) mk(ang(e), P.damage, "sniper");
      shake = Math.max(shake, 7); P.recoil = 1;
    } else {
      for (const { e } of near) mk(ang(e), P.damage, "basic");
    }
  }
  for (const s of shots) {
    s.x += s.vx * k; s.y += s.vy * k; s.life -= dt;
    for (const e of enemies) {
      if (e.hp <= 0 || Math.hypot(e.x - s.x, e.y - s.y) > e.r + 4) continue;
      if (s.pierce) {
        if (s.hit.includes(e)) continue;
        s.hit.push(e);
        const big = e.kind === "tank" || e.kind === "elite";
        if (s.crit && big) {                       // крит только по крупным
          hit(e, (s.dmg || P.damage) * 3, s.x, s.y);
          pops.push({ x: e.x, y: e.y - e.r - 26, txt: "КРИТ!", life: 1.4, col: "#8a53c4" });
          shake = Math.max(shake, 15);
          chain([1200, 900], "square", .05); noise(.16, .05, 3000, -2200);
        } else hit(e, s.dmg || P.damage, s.x, s.y);
      } else { hit(e, s.dmg || P.damage, s.x, s.y); s.life = 0; break; }
    }
  }
  shots = shots.filter(s => s.life > 0);
  enemies = enemies.filter(e => e.hp > 0);

  for (const c of chests) {
    c.a += .04 * k;
    if (dist(c, P) < 42) {
      c.dead = true; SFX.chest();
      if (c.rare) grantRandomAbility(c.x, c.y);
      else {
        P.item = c.item;
        pops.push({ x: P.x, y: P.y - 48, txt: ITEMS[c.item].name, life: 1.4, col: ITEMS[c.item].col });
      }
    }
  }
  chests = chests.filter(c => !c.dead);

  for (const c of corpses) {
    if (c.mode === "launch") {                            // бросок с дугой
      c.t += dt;
      if (c.style === "scopefall") {                      // замедленное падение внутри оптики
        c.x += c.vx * k; c.y += (.16 + c.vy) * k;
        c.z = Math.max(0, 10 - c.t / 210); c.tilt += c.spin * k;
        c.life -= dt / 1000;
        c.trail.push({ x:c.x, y:c.y, z:c.z, tilt:c.tilt });
        if(c.trail.length>7)c.trail.shift();
        continue;
      }
      c.x += c.vx * k; c.y += c.vy * k;
      c.z += c.vz * k; c.vz -= .40 * k;
      c.tilt += c.spin * k;
      if (c.style === "camera") {
        c.vz *= .995;                                     // летит на зрителя, не падает
      } else if (c.z <= 0 && c.vz < 0) {
        c.z = 0;
        if (c.landed < 2) {                               // отскок от земли
          c.landed++;
          c.vz = -c.vz * (c.landed === 1 ? .34 : .12);
          c.vx *= .45; c.vy *= .45; c.spin *= .3;
          for (let i = 0; i < 7; i++) {
            const an = Math.random() * 6.28, sp2 = rnd(.6, 2.2);
            puffs.push({ x: c.x, y: c.y, vx: Math.cos(an) * sp2, vy: Math.sin(an) * sp2,
                         life: .8, r: rnd(2, 4) });
          }
        } else { c.vz = 0; c.vx *= .80; c.vy *= .80; }    // скользит и замирает
      }
      c.trail.push({ x: c.x, y: c.y, z: c.z, tilt: c.tilt });
      if (c.trail.length > 5) c.trail.shift();
      c.life -= dt / 1000;
      continue;
    }
    c.life -= dt / 1000;
    c.x += c.vx * k; c.y += c.vy * k;
    c.vx *= .90; c.vy *= .90;
    if (c.mode === "tumble") { c.rot += c.rotV * k; c.vy += .14 * k; }
    if (c.mode === "fall") c.rot += (1.5 - c.rot) * .09 * k;
    if (c.mode === "blast") c.rot += .06 * k;
  }
  corpses = corpses.filter(c => c.life > 0);

  for (const p of puffs) { p.x += p.vx * k; p.y += p.vy * k; p.vx *= .92; p.vy *= .92; p.life -= dt / 430; }
  puffs = puffs.filter(p => p.life > 0);
  for (const p of pops) { p.y -= .55 * k; p.life -= dt / 750; }
  pops = pops.filter(p => p.life > 0);
  for (const b of booms) { b.r += (b.max - b.r) * .22 * k; b.life -= dt / 380; }
  booms = booms.filter(b => b.life > 0);
  for (const f of flashes) { f.r += (f.max - f.r) * .34 * k; f.life -= dt / 320; }
  flashes = flashes.filter(f => f.life > 0);
  if (queuedLevels > 0 && !paused && !ult.on) { SFX.level(); offerCards(); }
}
function gainXP(amount) {
  amount = Math.max(1, Math.floor(amount || 1));
  const awarded = Math.max(1, Math.round(amount * (xpBoost > 0 ? 2 : 1) * (P.xpMult || 1)));
  P.xp += awarded;
  // Порог всегда один и тот же: крупная награда может открыть несколько стадий сразу.
  while (P.xp >= STAGE_XP) {
    P.xp -= STAGE_XP;
    P.lvl++;
    P.xpNext = STAGE_XP;
    queuedLevels++;
    applyGear();
    P.hp = Math.min(P.hpMax, P.hp + 1);
    P.stagePulse = 1600;
  }
  if (P.xp < 0) P.xp = 0;                       // страховка от отрицательной полоски
}
