"use strict";
/* pets.js — логика питомцев, яиц и цыплят */

function updatePet(dt, k) {
  const p = P.pet; if (!p) return;
  if (p.dead > 0) {                       // ждём воскрешения
    p.dead -= dt;
    if (p.dead <= 0) {
      p.hpMax = 4 + p.lvl; p.hp = p.hpMax;
      p.x = P.x + rnd(-30, 30); p.y = P.y + rnd(-30, 30);
      p.state = "up"; p.timer = 1200; SFX.revive();
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * 6.28;
        puffs.push({ x: p.x, y: p.y, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2, life: 1, r: rnd(2, 5) });
      }
    }
    return;
  }
  if (p.hurt > 0) p.hurt -= dt;
  const S = petStats(p);
  p.saw += .5 * k; p.phase += .3 * k;
  if (p.bite > 0) p.bite -= dt;
  if (p.cd > 0) p.cd -= dt;

  const nearest = (x, y, rng) => {
    let b = null, bd = rng;
    for (const e of enemies) { const d = Math.hypot(e.x - x, e.y - y); if (d < bd) { bd = d; b = e; } }
    return b;
  };
  const flying = p.type === "parrot";
  if (p.recall > 0) {                     // позвали к себе — бросает всё и бежит
    p.recall -= dt;
    const dx = P.x - p.x, dy = P.y - p.y, d = Math.hypot(dx, dy);
    if (d > 40) {
      p.x += dx / d * 4.6 * k; p.y += dy / d * 4.6 * k;
      p.face = dx > 0 ? 1 : -1; p.phase += .4 * k;
      if (!flying) pushOut(p);
      return;
    }
    p.recall = 0;
  }
  const goto = (tx, ty, sp) => {
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
    if (d <= 4) return d;
    let vx = dx / d, vy = dy / d;
    if (!flying) for (const o of props) {          // облетаем камень стороной
      const ox = o.x - p.x, oy = o.y - p.y, od = Math.hypot(ox, oy);
      const reach = o.r * .78 + p.r + 30;
      if (od > reach || od < .01) continue;
      if (ox / od * vx + oy / od * vy < .1) continue;
      const side = (ox * vy - oy * vx) > 0 ? -1 : 1, w = (1 - od / reach) * 2.1;
      vx += -oy / od * side * w; vy += ox / od * side * w;
    }
    const vl = Math.hypot(vx, vy) || 1;
    p.x += vx / vl * sp * k; p.y += vy / vl * sp * k;
    if (Math.abs(dx) > 1) p.face = dx > 0 ? 1 : -1;
    return d;
  };

  if (p.type === "dog") {
    // собака держится рядом с хозяином: дальше поводка не уходит
    const LEASH = 165;
    const homeX = P.x - P.face * 36, homeY = P.y + 20;
    const fromOwner = Math.hypot(p.x - P.x, p.y - P.y);

    let tg = null;
    if (fromOwner < LEASH && p.cd <= 0) {
      let bd = 130;
      for (const e of enemies) {
        if (Math.hypot(e.x - P.x, e.y - P.y) > LEASH) continue;   // цель тоже должна быть рядом
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d < bd) { bd = d; tg = e; }
      }
    }

    if (fromOwner > LEASH) {
      goto(P.x, P.y, 3.1);                                        // отбежала — возвращается
    } else if (tg) {
      goto(tg.x, tg.y, 2.9);
      if (Math.hypot(tg.x - p.x, tg.y - p.y) < tg.r + 16) {
        hit(tg, S.dogDmg, p.x, p.y); p.cd = S.dogCd; p.bite = 220; SFX.bite();
      }
    } else if (Math.hypot(homeX - p.x, homeY - p.y) > 28) {
      goto(homeX, homeY, 2.5);                                    // трусит у ноги
    }

  } else if (p.type === "cat") {
    const bx = P.x - P.face * 44, by = P.y + 16;
    if (Math.hypot(bx - p.x, by - p.y) > 16) goto(bx, by, 3.0);
    const tg = nearest(p.x, p.y, 250);
    if (tg) {
      p.aim = Math.atan2(tg.y - p.y - 8, tg.x - p.x);
      if (p.cd <= 0) {
        p.cd = S.catCd; beep(900, .035, "square", .015, -300);
        shots.push({ x: p.x + Math.cos(p.aim) * 16, y: p.y - 8 + Math.sin(p.aim) * 16,
                     vx: Math.cos(p.aim) * 7.6, vy: Math.sin(p.aim) * 7.6,
                     a: p.aim, life: 800, dmg: S.catDmg });
      }
    }

  } else if (p.type === "parrot") {
    p.a += .028 * k;
    goto(P.x + Math.cos(p.a) * 96, P.y - 30 + Math.sin(p.a) * 62, 4.2);
    p.drop -= dt;
    const mine = mines.filter(m => m.mini).length;
    if (p.drop <= 0 && mine < S.mineCap) {
      p.drop = S.dropCd;
      mines.push({ x: p.x, y: p.y + 26, arm: 500, mini: true, dmg: S.mineDmg });
    }

  } else if (p.type === "boar") {
    // ищем крупную цель, ради неё и живёт
    let tg = null, bd = 1e9;
    for (const e of enemies) {
      if (e.kind !== "tank" && e.kind !== "elite") continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < bd) { bd = d; tg = e; }
    }
    if (!tg) {                                   // крупных нет — берём любого рядом
      for (const e of enemies) {
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d < 280 && d < bd) { bd = d; tg = e; }
      }
    }
    if (tg && bd < 950) {
      goto(tg.x, tg.y, 3.5);
      p.fuse = (p.fuse || 0) + dt;
      if (bd < tg.r + 20) {
        explode(p.x, p.y, S.boarR, S.boarDmg);
        p.hp = 0; p.dead = p.reviveMs; p.fuse = 0; SFX.dead();
        return;
      }
    } else if (Math.hypot(P.x - p.x, P.y - p.y) > 90) goto(P.x, P.y, 3.0);

  } else if (p.type === "chicken") {
    const hx = P.x - P.face * 42, hy = P.y + 24;
    if (Math.hypot(hx - p.x, hy - p.y) > 26) goto(hx, hy, 2.6);
    p.drop -= dt;
    if (p.drop <= 0 && eggs.length + chicks.length < S.eggCap) {
      p.drop = S.eggCd;
      const r = Math.random();
      const kind = r < .30 ? "red" : r < .55 ? "green" : "yellow";
      eggs.push({ x: p.x - p.face * 12, y: p.y + 5, t: 2600, wob: 0, kind });
      beep(880, .06, "sine", .035, 180);
    }

  } else if (p.type === "mole") {
    p.timer -= dt;
    if (p.state === "up") {
      if (p.timer <= 0) {
        if (turrets.length < S.turCap)
          turrets.push({ x: p.x, y: p.y, life: 13000, cd: 0, a: 0 });
        p.state = "down"; p.timer = 850; SFX.build();
      }
    } else if (p.timer <= 0) {
      for (let i = 0; i < 20; i++) {
        const a = Math.random() * 6.283, d = rnd(90, 230);
        const nx = P.x + Math.cos(a) * d, ny = P.y + Math.sin(a) * d;
        if (nx < 40 || ny < 40 || nx > WORLD - 40 || ny > WORLD - 40) continue;
        if (props.some(o => Math.hypot(o.x - nx, o.y - ny) < o.r)) continue;
        p.x = nx; p.y = ny; break;
      }
      p.state = "up"; p.timer = 1500;
      for (let i = 0; i < 7; i++) {
        const a = Math.random() * 6.28;
        puffs.push({ x: p.x, y: p.y, vx: Math.cos(a) * 1.6, vy: Math.sin(a) * 1.6, life: .8, r: rnd(2, 4) });
      }
    }
  }

  if (p.dead > 0) return;
  pushOut(p);                             // питомец больше не ходит сквозь камни

  // урон питомцу
  for (const e of enemies) {
    if (Math.hypot(e.x - p.x, e.y - p.y) < e.r + p.r && p.hurt <= 0) {
      p.hp--; p.hurt = 900;
      pops.push({ x: p.x, y: p.y - 28, txt: "-1", life: .9, col: "#c8402c" });
      if (p.hp <= 0) {
        p.dead = p.reviveMs; SFX.dead();
        for (let i = 0; i < 14; i++) {
          const a = Math.random() * 6.28, sp = rnd(.8, 2.6);
          puffs.push({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, r: rnd(2, 5) });
        }
      }
      break;
    }
  }

  // турели крота
  for (const tu of turrets) {
    tu.life -= dt; if (tu.cd > 0) tu.cd -= dt;
    let b = null, bd = 240;
    for (const e of enemies) { const d = Math.hypot(e.x - tu.x, e.y - tu.y); if (d < bd) { bd = d; b = e; } }
    if (b) {
      tu.a = Math.atan2(b.y - tu.y, b.x - tu.x);
      if (tu.cd <= 0) {
        tu.cd = S.turCd; beep(660, .04, "square", .014, -220);
        shots.push({ x: tu.x + Math.cos(tu.a) * 14, y: tu.y - 6 + Math.sin(tu.a) * 14,
                     vx: Math.cos(tu.a) * 7, vy: Math.sin(tu.a) * 7, a: tu.a, life: 800, dmg: S.turDmg });
      }
    }
  }
  turrets = turrets.filter(tu => tu.life > 0);
}

function updateFarm(dt, k) {
  const S = P.pet ? petStats(P.pet) : null;
  for (const eg of eggs) {
    eg.t -= dt; eg.wob += dt / 110;
    if (eg.t <= 0) {
      eg.dead = true;
      chicks.push({ x: eg.x, y: eg.y, hp: 2, hurt: 0, life: 21000, cd: 0,
                    phase: rnd(0, 6), face: 1, kind: eg.kind, healCd: 5000 });
      beep(1150, .07, "triangle", .04, 260);
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * 6.28;
        puffs.push({ x: eg.x, y: eg.y, vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 1.2, life: .7, r: rnd(2, 3.5) });
      }
    }
  }
  eggs = eggs.filter(e => !e.dead);

  for (const ch of chicks) {
    ch.life -= dt; ch.phase += .34 * k;
    if (ch.cd > 0) ch.cd -= dt;
    if (ch.hurt > 0) ch.hurt -= dt;
    let tg = null, bd = 210;
    for (const e of enemies) {
      const d = Math.hypot(e.x - ch.x, e.y - ch.y);
      if (d < bd) { bd = d; tg = e; }
    }
    const go = (tx, ty, sp) => {
      const dx = tx - ch.x, dy = ty - ch.y, d = Math.hypot(dx, dy) || 1;
      if (d > 6) { ch.x += dx / d * sp * k; ch.y += dy / d * sp * k; ch.face = dx > 0 ? 1 : -1; }
      return d;
    };
    if (ch.kind === "red") {                      // подрывник
      if (tg) {
        go(tg.x, tg.y, 3.1);
        if (bd < tg.r + 12) {
          const lv = P.pet ? P.pet.lvl : 1;
          explode(ch.x, ch.y, 58 + 7 * lv, 3.4 + 1.3 * lv);
          ch.hp = 0;
        }
      } else if (Math.hypot(P.x - ch.x, P.y - ch.y) > 90) go(P.x, P.y, 2.5);

    } else if (ch.kind === "green") {             // лекарь
      const hx2 = P.x - 34, hy2 = P.y + 26;
      if (Math.hypot(hx2 - ch.x, hy2 - ch.y) > 20) go(hx2, hy2, 2.5);
      ch.healCd -= dt;
      if (ch.healCd <= 0) {
        ch.healCd = 9000;
        if (P.hp < P.hpMax) {
          P.hp = Math.min(P.hpMax, P.hp + .5);
          pops.push({ x: P.x, y: P.y - 52, txt: "+½", life: 1.2, col: "#4e8f4a" });
          chain([700, 950], "sine", .05);
          for (let i = 0; i < 6; i++) {
            const a = Math.random() * 6.28;
            puffs.push({ x: ch.x, y: ch.y - 8, vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 1.2 - .6, life: .9, r: rnd(2, 3.4) });
          }
        }
      }

    } else if (tg) {                              // жёлтый с ножиком
      go(tg.x, tg.y, 2.7);
      if (bd < tg.r + 13 && ch.cd <= 0) {
        hit(tg, (S ? S.chickDmg : .8) * 1.35, ch.x, ch.y);
        ch.cd = 560; ch.slash = 200;
        beep(1300, .04, "square", .02, -300);
      }
    } else if (Math.hypot(P.x - ch.x, P.y - ch.y) > 90) {
      go(P.x, P.y, 2.4);
    }
    if (ch.slash > 0) ch.slash -= dt;

    for (const e of enemies) {
      if (ch.hurt <= 0 && Math.hypot(e.x - ch.x, e.y - ch.y) < e.r + 8) {
        ch.hp--; ch.hurt = 700; break;
      }
    }
  }
  chicks = chicks.filter(c => c.hp > 0 && c.life > 0);
}
