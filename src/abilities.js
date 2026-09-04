"use strict";
/* abilities.js — постоянный инвентарь и эксклюзивные способности */

let abilityBursts = [], rewardDrops = [], gasCloud = null, allyTanks = [], airstrike = null, airstrikeMarks = [], abilitySerial = 0;

function resetAbilities() {
  abilityBursts = [];
  rewardDrops = [];
  gasCloud = null;
  allyTanks = [];
  airstrike = null;
  airstrikeMarks = [];
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

  if (kind === "airstrike") {
    airstrike = { life: 7200, max: 7200, next: 80, shots: 0 };
    airstrikeMarks = [];
    shake = Math.max(shake, 10);
    chain([160, 240, 360, 520], "sawtooth", .055);
    noise(.12, .09, 1200, -700);
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
      r: 25, face: Math.cos(a) < 0 ? 1 : -1, aim: a + Math.PI,
      hpMax: 240 + (P.lvl - 1) * 35, hp: 240 + (P.lvl - 1) * 35,
      cd: 180, phase: 0, arrive: 1150, muzzle: 0, hurt: 0, dead: false,
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

  if (airstrike) {
    airstrike.life -= dt; airstrike.next -= dt;
    if (airstrike.next <= 0 && airstrike.shots < 11) {
      airstrike.next += 560; airstrike.shots++;
      const live = enemies.filter(e => e.hp > 0 && !e.rewarded);
      let tx = P.x + rnd(-260, 260), ty = P.y + rnd(-210, 210);
      if (live.length) {
        // Сначала целимся в самых опасных и плотных врагов, но сохраняем вариативность.
        const ranked = live.slice().sort((a,b) => (b.maxhp + rnd(0,8)) - (a.maxhp + rnd(0,8)));
        const e = ranked[(Math.random() * Math.min(6, ranked.length)) | 0];
        tx = e.x + rnd(-24,24); ty = e.y + rnd(-24,24);
      }
      tx = Math.max(45, Math.min(WORLD-45, tx)); ty = Math.max(45, Math.min(WORLD-45, ty));
      airstrikeMarks.push({ x:tx, y:ty, t:0, delay:620, done:false, seed:Math.random()*6.28 });
    }
    if (airstrike.life <= 0 && !airstrikeMarks.some(m => !m.done)) airstrike = null;
  }
  for (const m of airstrikeMarks) {
    m.t += dt;
    if (!m.done && m.t >= m.delay) {
      m.done = true; m.blast = 1;
      explode(m.x, m.y, 122, 10 + P.lvl * 1.8);
      flashes.push({ x:m.x, y:m.y, r:12, max:105, life:1, rot:m.seed });
      hitStop = Math.max(hitStop, 42);
    }
    if (m.done) m.blast -= dt / 520;
  }
  airstrikeMarks = airstrikeMarks.filter(m => !m.done || m.blast > 0);

  for (const q of allyTanks) {
    q.phase += .16 * k; q.cd -= dt; q.arrive = Math.max(0, q.arrive - dt);
    q.muzzle = Math.max(0, q.muzzle - dt); q.hurt = Math.max(0, q.hurt - dt);
    if (q.hp <= 0) {
      if (!q.dead) {
        q.dead = true; explode(q.x, q.y, 145, 9 + P.lvl * 1.5);
        pops.push({x:q.x,y:q.y-42,txt:"ТАНК УНИЧТОЖЕН",life:1.5,col:"#3d78bd"});
      }
      continue;
    }

    let target = null, best = 1e9;
    for (const e of enemies) {
      if (e.hp <= 0) continue;
      const d = Math.hypot(e.x - q.x, e.y - q.y);
      if (d < best) { best = d; target = e; }
    }
    const follow = target && best < 620 ? target : P;
    const dx = follow.x - q.x, dy = follow.y - q.y, d = Math.hypot(dx, dy) || 1;
    q.aim = Math.atan2(dy, dx); q.face = dx >= 0 ? 1 : -1;
    const stop = target ? 72 : 90;
    if (d > stop) { q.x += dx / d * 2.35 * k; q.y += dy / d * 2.35 * k; }
    q.x = Math.max(q.r, Math.min(WORLD - q.r, q.x));
    q.y = Math.max(q.r, Math.min(WORLD - q.r, q.y));

    if (target && best < 560 && q.cd <= 0) {
      q.cd = 390; q.muzzle = 95;
      const a = Math.atan2(target.y - q.y, target.x - q.x);
      shots.push({ x: q.x + Math.cos(a) * 34, y: q.y - 8 + Math.sin(a) * 34,
        vx: Math.cos(a) * 10.5, vy: Math.sin(a) * 10.5, a, life: 900,
        dmg: 4 + P.lvl * .7, kind: "tank", pierce: false, hit: [] });
      puffs.push({ x: q.x + Math.cos(a) * 35, y: q.y - 8 + Math.sin(a) * 35,
        vx: Math.cos(a), vy: Math.sin(a), life: .7, r: 5 });
      noise(.10, .035, 420, -180); shake = Math.max(shake, 4);
    }
  }
  allyTanks = allyTanks.filter(q => !q.dead);
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
  if (kind === "airstrike") {
    g.globalAlpha = .18; scircle(g, 0, 0, 14, "#d2691e"); g.globalAlpha = 1;
    g.save(); g.rotate(-.42);
    spoly(g, [[-14,1],[10,-6],[14,-3],[4,2],[11,7],[7,9],[-2,4],[-10,8],[-7,3]], "#e7a33e");
    g.restore();
    g.strokeStyle="#c8402c"; g.lineWidth=1.5; g.beginPath(); g.arc(0,0,10,0,7); g.stroke();
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
  g.globalAlpha = Math.min(1, (1150 - q.arrive + 220) / 500);
  if (q.hurt > 0 && Math.floor(q.hurt / 55) % 2) g.globalAlpha *= .48;
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
  const wear = 1 - Math.max(0, q.hp / q.hpMax);
  if (wear > .24) {
    g.strokeStyle="#202528"; g.lineWidth=1.6; g.globalAlpha*=Math.min(1,wear*1.7);
    sline(g,-17,-8,-7,0); sline(g,-10,-1,-16,6);
    if (wear > .58) { sline(g,12,-10,4,-2); sline(g,4,-2,13,5); }
  }
  if (q.arrive > 0) {
    const a = q.arrive / 1150; g.globalAlpha = a * .35; g.strokeStyle = "#3d78bd"; g.lineWidth = 5;
    g.beginPath(); g.ellipse(0, 9, 38 + (1-a) * 45, 12 + (1-a) * 12, 0, 0, 7); g.stroke();
  }
  g.globalAlpha=1;
  const hp=Math.max(0,q.hp/q.hpMax), w=50;
  g.fillStyle="rgba(43,38,32,.22)"; g.fillRect(-w/2,-31,w,5);
  g.fillStyle=hp>.45?"#4e8f4a":hp>.2?"#dfa128":"#c8402c"; g.fillRect(-w/2,-31,w*hp,5);
  g.strokeStyle=INK; g.lineWidth=1.2; g.strokeRect(-w/2,-31,w,5);
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
  for (const m of airstrikeMarks) {
    const p=Math.min(1,m.t/m.delay), pulse=.55+.45*Math.sin(m.t/55);
    g.save(); g.translate(m.x,m.y);
    if (!m.done) {
      g.globalAlpha=.34+.34*pulse; g.strokeStyle="#c8402c"; g.lineWidth=2.5;
      g.beginPath(); g.arc(0,0,31-p*12,0,7); g.stroke();
      sline(g,-27,0,-10,0); sline(g,10,0,27,0); sline(g,0,-27,0,-10); sline(g,0,10,0,27);
      const dropY=-150+p*150;
      g.globalAlpha=.9; g.fillStyle="#2b2620"; g.beginPath(); g.ellipse(0,dropY,4,12,0,0,7); g.fill();
      g.globalAlpha=.35; g.strokeStyle="#e08a2a"; g.lineWidth=3; sline(g,0,dropY-8,0,dropY-42);
    }
    g.restore();
  }
  g.globalAlpha=1;
  for (const fx of abilityBursts) {
    const p = Math.min(1, fx.t / fx.dur), a = Math.sin(p * Math.PI);
    g.save(); g.translate(P.x, P.y - 10); g.lineCap = "round";
    if (fx.kind === "airstrike") {
      g.globalAlpha=a*.5; g.strokeStyle="#d2691e"; g.lineWidth=4;
      for(let i=-3;i<=3;i++) sline(g,-W*.7,i*18-130+p*170,W*.7,i*18+20+p*70);
      g.globalAlpha=a*.25; g.fillStyle="#ffd36a";
      for(let i=0;i<10;i++){const an=i/10*6.283+fx.seed;g.beginPath();g.arc(Math.cos(an)*(30+p*115),Math.sin(an)*(16+p*48),3.5,0,7);g.fill();}
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
