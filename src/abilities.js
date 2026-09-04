"use strict";
/* abilities.js — постоянный инвентарь и эксклюзивные способности */

let abilityBursts = [], rewardDrops = [], gasCloud = null, allyTanks = [], tankXpTrails = [], abilitySerial = 0;

function resetAbilities() {
  abilityBursts = [];
  rewardDrops = [];
  gasCloud = null;
  allyTanks = [];
  tankXpTrails = [];
  abilitySerial = 0;
  P.chemT = 0;
}

function useAbility(kind) {
  if (!running || paused || !ABILITIES[kind] || inventory[kind] <= 0) return;
  inventory[kind]--;
  saveInventory();
  abilityBursts.push({ kind, t: 0, dur: kind === "tank" ? 1250 : 1050, seed: ++abilitySerial });
  if (abilityBursts.length > 3) abilityBursts.shift();
  pointer.active = false;

  if (kind === "vacuum") {
    for (const o of orbs) o.superPull = true;
    shake = Math.max(shake, 8);
    chain([420, 630, 880, 1260], "sine", .06);
  } else if (kind === "gas") {
    P.chemT = 6800;
    gasCloud = { life: 6800, max: 6800, pulse: 80, phase: Math.random() * 6.283 };
    P.invT = Math.max(P.invT || 0, 6800); // герметичный костюм защищает хозяина
    P.seen = { x: P.x, y: P.y };
    shake = Math.max(shake, 11);
    chain([180, 145, 112], "sawtooth", .075);
    noise(.18, .16, 800, -460);
  } else {
    // Каждый заряд создаёт новую самостоятельную машину. Золотой угол
    // разводит точки въезда, поэтому пять танков не появляются одной стопкой.
    const a = allyTanks.length * 2.399 + (P.face > 0 ? Math.PI : 0);
    const d = Math.min(W * .72, 520);
    const q = {
      x: Math.max(34, Math.min(WORLD - 34, P.x + Math.cos(a) * d)),
      y: Math.max(34, Math.min(WORLD - 34, P.y + Math.sin(a) * d * .55)),
      r: 25, face: Math.cos(a) < 0 ? 1 : -1, aim: a + Math.PI, life: 120000, max: 120000,
      cd: 180, phase: 0, arrive: 1150, muzzle: 0,
    };
    allyTanks.push(q);
    shake = Math.max(shake, 14);
    chain([110, 92, 76], "square", .07);
  }
  pops.push({ x: P.x, y: P.y - 66, txt: ABILITIES[kind].name, life: 1.5, col: ABILITIES[kind].col });
}

function updateAbilities(dt, k) {
  for (const fx of abilityBursts) fx.t += dt;
  abilityBursts = abilityBursts.filter(fx => fx.t < fx.dur);
  for (const r of rewardDrops) { r.t += dt; r.life -= dt / 1350; }
  rewardDrops = rewardDrops.filter(r => r.life > 0);
  for (const s of tankXpTrails) {
    const q=s.target && allyTanks.includes(s.target) ? s.target : null;
    const tx=q ? q.x : P.x, ty=q ? q.y-8 : P.y;
    const pull=Math.min(.32,.12*k); s.x+=(tx-s.x)*pull; s.y+=(ty-s.y)*pull; s.life-=dt/520;
  }
  tankXpTrails=tankXpTrails.filter(s=>s.life>0);

  if (P.chemT > 0) P.chemT = Math.max(0, P.chemT - dt);
  if (gasCloud) {
    gasCloud.life -= dt; gasCloud.phase += .0018 * dt; gasCloud.pulse -= dt;
    if (gasCloud.pulse <= 0) {
      gasCloud.pulse += 520;
      for (const e of enemies) {
        if (e.hp <= 0) continue;
        e.hp -= Math.max(1, e.maxhp * .105);
        e.flash = Math.max(e.flash || 0, 70); e.poison = 300;
        if (Math.random() < .34)
          puffs.push({ x: e.x + rnd(-8, 8), y: e.y - rnd(4, 20), vx: rnd(-.15, .15), vy: -.35,
                       life: .65, r: rnd(3, 7), gas: true });
      }
    }
    if (gasCloud.life <= 0) gasCloud = null;
  }

  for (const q of allyTanks) {
    q.life -= dt; q.phase += .16 * k; q.cd -= dt; q.arrive = Math.max(0, q.arrive - dt);
    q.muzzle = Math.max(0, q.muzzle - dt);
    if (q.life <= 0) continue;

    let target = null, best = 1e9;
    for (const e of enemies) {
      if (e.hp <= 0) continue;
      const d = Math.hypot(e.x - q.x, e.y - q.y);
      if (d < best) { best = d; target = e; }
    }
    const follow = target && best < 620 ? target : P;
    const dx = follow.x - q.x, dy = follow.y - q.y, d = Math.hypot(dx, dy) || 1;
    q.aim = Math.atan2(dy, dx); q.face = dx >= 0 ? 1 : -1;
    const stop = target ? 175 : 90;
    if (d > stop) { q.x += dx / d * 2.35 * k; q.y += dy / d * 2.35 * k; }
    q.x = Math.max(q.r, Math.min(WORLD - q.r, q.x));
    q.y = Math.max(q.r, Math.min(WORLD - q.r, q.y));

    if (target && best < 560 && q.cd <= 0) {
      q.cd = 390; q.muzzle = 95;
      const a = Math.atan2(target.y - q.y, target.x - q.x);
      shots.push({ x: q.x + Math.cos(a) * 34, y: q.y - 8 + Math.sin(a) * 34,
        vx: Math.cos(a) * 10.5, vy: Math.sin(a) * 10.5, a, life: 900,
        dmg: Math.max(4, target.maxhp * .24), kind: "tank", pierce: false, hit: [] });
      puffs.push({ x: q.x + Math.cos(a) * 35, y: q.y - 8 + Math.sin(a) * 35,
        vx: Math.cos(a), vy: Math.sin(a), life: .7, r: 5 });
      noise(.10, .035, 420, -180); shake = Math.max(shake, 4);
    }
  }
  allyTanks = allyTanks.filter(q => q.life > 0);
}

function grantRandomAbility(x, y) {
  const kind = ABILITY_KEYS[(Math.random() * ABILITY_KEYS.length) | 0];
  inventory[kind]++; saveInventory();
  rewardDrops.push({ kind, x, y, t:0, life:1 });
  pops.push({ x, y:y-52, txt:ABILITIES[kind].name+" +1", life:1.8, col:ABILITIES[kind].col });
  chain([520,780,1040], "sine", .065); shake=Math.max(shake,7);
  return kind;
}

function drawAbilityIcon(g, kind, x, y, sc) {
  g.save(); g.translate(x, y); g.scale(sc, sc);
  g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = INK; g.lineWidth = 2.1;
  if (kind === "vacuum") {
    g.globalAlpha = .20; scircle(g, 0, 0, 13, "#dfa128"); g.globalAlpha = 1;
    spoly(g, [[0,-10],[7,-3],[5,8],[0,12],[-5,8],[-7,-3]], "#f3d15d");
    g.lineWidth = 1.8;
    for (let i = 0; i < 3; i++) {
      const a = i * 2.094; sline(g, Math.cos(a) * 15, Math.sin(a) * 15, Math.cos(a) * 9, Math.sin(a) * 9);
    }
  } else if (kind === "gas") {
    g.fillStyle = "#b7d873"; g.beginPath(); g.arc(0, -2, 9, 0, 7); g.fill(); g.stroke();
    scircle(g, -4, -3, 2.4, "#334632"); scircle(g, 4, -3, 2.4, "#334632");
    spoly(g, [[-5,2],[0,0],[5,2],[4,8],[-4,8]], "#668f4d");
    g.lineWidth = 1.4; g.strokeStyle = "#edf3b5"; sline(g, -2, 3, 2, 6); sline(g, 2, 3, -2, 6);
  } else {
    spoly(g, [[-12,2],[-8,-6],[7,-6],[12,2],[9,8],[-10,8]], "#628fc1");
    g.fillStyle = "#354e67"; g.fillRect(-12, 5, 23, 5);
    g.strokeStyle = INK; g.strokeRect(-12, 5, 23, 5);
    scircle(g, -6, 8, 2.8, "#d6c9ae"); scircle(g, 5, 8, 2.8, "#d6c9ae");
    g.save(); g.rotate(-.12); spoly(g, [[-1,-7],[14,-7],[14,-3],[-1,-3]], "#435f79"); g.restore();
  }
  g.restore();
}

function drawAllyTank(g, q) {
  if (!q) return;
  g.save(); g.translate(q.x, q.y);
  const bob = Math.sin(q.phase * 2) * 1.2;
  g.globalAlpha = Math.min(1, (q.max - q.life + 220) / 500, q.life / 500);
  g.fillStyle = "rgba(43,38,32,.14)"; g.beginPath(); g.ellipse(0, 13, 30, 8, 0, 0, 7); g.fill();
  g.strokeStyle = INK; g.lineWidth = 2.8;
  spoly(g, [[-29,-6],[-22,-15],[20,-15],[29,-5],[25,12],[-25,12]], "#466d73");
  g.fillStyle = "#2f4143"; g.fillRect(-27, 5, 53, 9); g.strokeRect(-27, 5, 53, 9);
  for (let i = -2; i <= 2; i++) scircle(g, i * 10, 9, 4, "#b6b29e");
  scircle(g, 0, -8 + bob, 13, "#6e9290");
  g.save(); g.translate(0, -8 + bob); g.rotate(q.aim);
  spoly(g, [[1,-4],[36,-3],[38,1],[1,3]], "#435f5f");
  if (q.muzzle > 0) {
    g.fillStyle = "#ffd36a"; g.beginPath(); g.moveTo(38,0); g.lineTo(51,-8); g.lineTo(47,0); g.lineTo(51,8); g.closePath(); g.fill();
  }
  g.restore();
  g.fillStyle = "#b9e3ef"; g.beginPath(); g.arc(-4, -11 + bob, 2.3, 0, 7); g.fill();
  if (q.arrive > 0) {
    const a = q.arrive / 1150; g.globalAlpha = a * .35; g.strokeStyle = "#3d78bd"; g.lineWidth = 5;
    g.beginPath(); g.ellipse(0, 9, 38 + (1-a) * 45, 12 + (1-a) * 12, 0, 0, 7); g.stroke();
  }
  g.restore();
}

function drawGasCloud(g, L, R, T, B) {
  if (!gasCloud) return;
  const fade = Math.min(1, (gasCloud.max - gasCloud.life) / 700, gasCloud.life / 900);
  g.save();
  g.fillStyle = "rgba(108,145,78," + (.055 * fade).toFixed(3) + ")"; g.fillRect(L, T, R-L, B-T);
  const step = 170;
  for (let x = Math.floor(L / step) * step; x < R + step; x += step)
    for (let y = Math.floor(T / step) * step; y < B + step; y += step) {
      const n = hash(x * .013, y * .017), ph = gasCloud.phase + n * 6.283;
      const px = x + n * 90 + Math.sin(ph) * 24, py = y + hash(y, x) * 70 + Math.cos(ph * .8) * 13;
      g.globalAlpha = fade * (.07 + n * .07); g.fillStyle = n > .5 ? "#7da969" : "#b3c77a";
      for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(px + i * 13 - 13, py + Math.sin(ph+i)*7, 22 + i*4, 0, 7); g.fill(); }
    }
  g.restore();
}

function drawAbilityWorldFX(g) {
  for (const r of rewardDrops) {
    const p=Math.min(1,r.t/900), a=Math.min(1,r.life*2.2);
    g.save(); g.translate(r.x,r.y-36-p*25); g.globalAlpha=a;
    g.fillStyle=ABILITIES[r.kind].col; g.globalAlpha=a*.13; g.beginPath(); g.arc(0,0,25+p*28,0,7); g.fill();
    g.globalAlpha=a; drawAbilityIcon(g,r.kind,0,0,1.65);
    g.strokeStyle=ABILITIES[r.kind].col; g.lineWidth=2.5; g.globalAlpha=a*.55;
    g.beginPath(); g.arc(0,0,22+p*25,0,7); g.stroke(); g.restore();
  }
  for (const s of tankXpTrails) {
    g.globalAlpha=Math.max(0,s.life)*.75; g.strokeStyle="#f3cd58"; g.lineWidth=2.8;
    const q=s.target && allyTanks.includes(s.target) ? s.target : null;
    const tx=q ? q.x : P.x, ty=q ? q.y-8 : P.y;
    const a=Math.atan2(ty-s.y,tx-s.x); sline(g,s.x-Math.cos(a)*15,s.y-Math.sin(a)*15,s.x,s.y);
    scircle(g,s.x,s.y,3.6,"#f3cd58");
  }
  g.globalAlpha=1;
  for (const fx of abilityBursts) {
    const p = Math.min(1, fx.t / fx.dur), a = Math.sin(p * Math.PI);
    g.save(); g.translate(P.x, P.y - 10); g.lineCap = "round";
    if (fx.kind === "vacuum") {
      for (let i = 0; i < 4; i++) {
        const r = 210 - ((p * 250 + i * 58) % 230);
        g.globalAlpha = a * (.18 + i * .06); g.strokeStyle = i % 2 ? "#fff2aa" : "#dfa128"; g.lineWidth = 4;
        g.beginPath(); g.arc(0, 0, Math.max(12, r), 0, 7); g.stroke();
      }
    } else if (fx.kind === "gas") {
      for (let i = 0; i < 9; i++) {
        const an = i / 9 * 6.283 + fx.seed, r = 18 + p * (90 + i * 7);
        g.globalAlpha = a * .20; g.fillStyle = i % 2 ? "#8dad62" : "#c8db82";
        g.beginPath(); g.arc(Math.cos(an)*r, Math.sin(an)*r*.55, 13 + p*20, 0, 7); g.fill();
      }
    } else {
      g.globalAlpha = a * .45; g.strokeStyle = "#3d78bd"; g.lineWidth = 5;
      for (let i = -3; i <= 3; i++) sline(g, -240, i*15 + p*24, 170 - i*18, i*15 - p*20);
      g.globalAlpha = a * .25; g.fillStyle = "#dfa128";
      for (let i = 0; i < 12; i++) { const an=i/12*6.283; g.beginPath(); g.arc(Math.cos(an)*(35+p*100), Math.sin(an)*(16+p*42), 4, 0, 7); g.fill(); }
    }
    g.restore();
  }
}

function drawAbilityScreenFX(g) {
  const fx = abilityBursts[abilityBursts.length - 1];
  if (!fx) return;
  const p = Math.min(1, fx.t / fx.dur), a = Math.min(1, p * 7, (1-p) * 5);
  const A = ABILITIES[fx.kind];
  g.save();
  if (p < .22) { g.globalAlpha = (1-p/.22) * .18; g.fillStyle = A.col; g.fillRect(0,0,W,H); }
  const y = 82 - (1-a) * 18, bw = Math.min(286, W - 32);
  g.globalAlpha = a * .94; g.fillStyle = "#fdf6e8"; g.strokeStyle = INK; g.lineWidth = 2.5;
  g.beginPath(); g.roundRect(W/2-bw/2, y-25, bw, 50, 13); g.fill(); g.stroke();
  g.fillStyle = A.col; g.fillRect(W/2-bw/2+3, y+19, bw-6, 3);
  drawAbilityIcon(g, fx.kind, W/2-bw/2+31, y, 1.05);
  g.fillStyle = INK; g.textAlign = "left"; g.font = "900 14px system-ui"; g.fillText(A.name, W/2-bw/2+55, y-2);
  g.globalAlpha = a*.62; g.font = "700 10px system-ui"; g.fillText(A.desc, W/2-bw/2+55, y+13);
  g.restore();
}
