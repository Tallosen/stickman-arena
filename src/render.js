"use strict";
/* render.js — отрисовка кадра */

/* ── кинематографичные эффекты ульты ─────────────────────── */
function drawUltImpact(g, f) {
  const a = Math.max(0, Math.min(1, f.life));
  const grow = 1 - a, power = f.power || 1;
  const accent = f.style === "spiral" || f.style === "bolt" ? "#8a53c4"
               : f.style === "cross" ? "#c8402c" : "#e08a2a";
  g.save(); g.translate(f.x, f.y); g.rotate(f.dir || 0);
  g.lineCap = "round"; g.lineJoin = "round";

  if (f.style === "aura") {
    g.globalAlpha = a * .75; g.strokeStyle = accent; g.lineWidth = 3.2;
    g.beginPath(); g.arc(0, 0, 20 + grow * 48, 0, 7); g.stroke();
    g.globalAlpha = a * .22; g.lineWidth = 12;
    g.beginPath(); g.arc(0, 0, 15 + grow * 62, 0, 7); g.stroke();
    for (let i = 0; i < 10; i++) {
      const an = i / 10 * 6.283 + f.seed, r = 24 + grow * 38;
      g.globalAlpha = a * (.35 + (i % 3) * .12); g.lineWidth = 2;
      g.beginPath(); g.moveTo(Math.cos(an) * r, Math.sin(an) * r);
      g.lineTo(Math.cos(an) * (r + 8 + power * 5), Math.sin(an) * (r + 8 + power * 5)); g.stroke();
    }
    g.restore(); return;
  }

  // Звезда появляется только на финальных ударах. Мелкие попадания остаются
  // чистыми и не превращают сцену в облако пересекающихся фигур.
  if (power >= 1.2) {
    const spikes = f.style === "ground" || f.style === "meteor" ? 12 : 8;
    const outer = (26 + power * 24) * (1 + grow * .32);
    g.globalAlpha = a * .14; g.fillStyle = accent; g.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const an = i / (spikes * 2) * 6.283 + f.seed;
      const rr = i % 2 ? 10 + power * 4 : outer * (.82 + hash(i, f.seed) * .18);
      const x = Math.cos(an) * rr, y = Math.sin(an) * rr;
      if (i) g.lineTo(x, y); else g.moveTo(x, y);
    }
    g.closePath(); g.fill();
  }

  g.strokeStyle = "#fff8e8"; g.globalAlpha = a * .95;
  g.save();
  if (f.style === "cross") {
    for (const s of [-1, 1]) {
      g.save(); g.rotate(s * .72); g.lineWidth = 8;
      g.beginPath(); g.moveTo(-58 * power, 18); g.quadraticCurveTo(0, -20, 62 * power, -8); g.stroke();
      g.strokeStyle = accent; g.globalAlpha = a * .62; g.lineWidth = 2.8;
      g.beginPath(); g.moveTo(-70 * power, 25); g.quadraticCurveTo(0, -30, 76 * power, -14); g.stroke(); g.restore();
    }
  } else if (f.style === "meteor") {
    g.rotate(-(f.dir || 0));
    g.globalAlpha = a * .26; g.fillStyle = accent;
    g.beginPath(); g.moveTo(-30, 10); g.lineTo(-13, -185 * power); g.lineTo(13, -185 * power); g.lineTo(30, 10); g.closePath(); g.fill();
    g.globalAlpha = a * .9; g.strokeStyle = "#fff8e8"; g.lineWidth = 6;
    g.beginPath(); g.moveTo(0, -155 * power); g.lineTo(0, 12); g.stroke();
    g.strokeStyle = accent; g.globalAlpha = a * .72; g.lineWidth = 4;
    g.beginPath(); g.ellipse(0, 11, 34 + grow * 125 * power, 10 + grow * 34 * power, 0, 0, 7); g.stroke();
  } else if (f.style === "spiral") {
    g.rotate(-(f.dir || 0));
    for (let i = 0; i < 4; i++) {
      g.globalAlpha = a * (.72 - i * .11); g.strokeStyle = i % 2 ? "#fff8e8" : accent;
      g.lineWidth = 5 - i * .7; g.beginPath();
      g.arc(0, 0, 18 + i * 13 + grow * 42, f.seed + i * .6 + grow * 3,
            f.seed + i * .6 + grow * 3 + 4.7); g.stroke();
    }
  } else if (f.style === "dance") {
    g.rotate(-(f.dir || 0));
    for (let i = 0; i < 3; i++) {
      const r = 24 + i * 18 + grow * 72;
      g.globalAlpha = a * (.82 - i * .18); g.strokeStyle = i === 1 ? "#fff8e8" : accent;
      g.lineWidth = 5 - i; g.beginPath(); g.arc(0, 0, r, f.seed + i * .7, f.seed + i * .7 + 5.15); g.stroke();
    }
  } else if (f.style === "slash" || f.style === "shot") {
    g.lineWidth = 7 + power * 2;
    g.beginPath(); g.moveTo(-42 * power, 18); g.quadraticCurveTo(0, -18, 54 * power, -8); g.stroke();
    g.strokeStyle = accent; g.globalAlpha = a * .55; g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(-54 * power, 25); g.quadraticCurveTo(3, -27, 68 * power, -13); g.stroke();
  } else if (f.style === "upper" || f.style === "bolt") {
    g.rotate(-(f.dir || 0));
    const h = f.style === "upper" ? 145 * power : 210 * power;
    g.globalAlpha = a * .18; g.fillStyle = accent;
    g.beginPath(); g.moveTo(-22, 14); g.lineTo(-8, -h); g.lineTo(8, -h); g.lineTo(22, 14); g.closePath(); g.fill();
    g.globalAlpha = a * .95; g.strokeStyle = "#fff8e8"; g.lineWidth = 5;
    g.beginPath(); g.moveTo(0, 12); g.lineTo(0, -h); g.stroke();
  } else if (f.style === "ground") {
    g.rotate(-(f.dir || 0));
    g.globalAlpha = a * .85; g.strokeStyle = "#fff8e8"; g.lineWidth = 5;
    g.beginPath(); g.ellipse(0, 8, 24 + grow * 95 * power, 7 + grow * 30 * power, 0, 0, 7); g.stroke();
    g.strokeStyle = "#8a53c4"; g.globalAlpha = a * .48; g.lineWidth = 2.5;
    for (let i = 0; i < 9; i++) {
      const an = Math.PI * (.08 + i / 10 * .84), r = 20 + grow * 45;
      g.beginPath(); g.moveTo(Math.cos(an) * r, 9 + Math.sin(an) * r * .24);
      g.lineTo(Math.cos(an) * (r + 32 * power), 9 + Math.sin(an) * (r + 32 * power) * .24); g.stroke();
    }
  } else {
    g.globalAlpha = a * .85; g.strokeStyle = "#fff8e8"; g.lineWidth = 4.5;
    g.beginPath(); g.arc(0, 0, 12 + grow * 54 * power, 0, 7); g.stroke();
  }

  g.restore();
  // Тонкие расходящиеся штрихи сохраняют рисованный стиль игры.
  g.rotate(-(f.dir || 0)); g.strokeStyle = accent; g.lineWidth = 2.2;
  for (let i = 0; i < 8; i++) {
    const an = i / 8 * 6.283 + f.seed, r1 = 26 + grow * 24, r2 = r1 + 18 + power * 13;
    g.globalAlpha = a * (.25 + (i % 4) * .10);
    g.beginPath(); g.moveTo(Math.cos(an) * r1, Math.sin(an) * r1);
    g.lineTo(Math.cos(an) * r2, Math.sin(an) * r2); g.stroke();
  }
  g.restore();
}

function drawUltMotionFX(g) {
  const p = Math.max(0, Math.min(1, ult.t / ult.dur));
  const hy = P.y + 17 - (ult.lift || 0);
  g.save(); g.lineCap = "round";

  if (ult.mode === "flip" && ult.lift > 12) {
    g.strokeStyle = "#e08a2a";
    for (let i = 0; i < 4; i++) {
      g.globalAlpha = .34 - i * .055; g.lineWidth = 5 - i * .7;
      g.beginPath(); g.ellipse(P.x, hy - 18, 35 + i * 9, 19 + i * 4,
                               ult.rot * .18 + i * .5, -.5, 4.1); g.stroke();
    }
  }
  if (ult.mode === "upper" && p > .27 && p < .74) {
    g.strokeStyle = "#fff8e8";
    for (let i = -2; i <= 2; i++) {
      g.globalAlpha = .50 - Math.abs(i) * .08; g.lineWidth = 4 - Math.abs(i) * .5;
      g.beginPath(); g.moveTo(P.x + i * 11, P.y + 18);
      g.lineTo(P.x + i * 6, hy - 72 - Math.abs(i) * 12); g.stroke();
    }
  }
  if (ult.mode === "rain" && ult.lift > 80) {
    g.strokeStyle = "#8a53c4";
    for (let i = 0; i < 7; i++) {
      const x = P.x - 62 + i * 21 + Math.sin(i * 2.7) * 5;
      g.globalAlpha = .12 + (i % 3) * .05; g.lineWidth = 2 + i % 2;
      g.beginPath(); g.moveTo(x, hy - 85 - (i % 2) * 24); g.lineTo(x - 7, P.y + 28); g.stroke();
    }
  }
  if (ult.mode === "slam" && ult.lift > 12) {
    g.strokeStyle = "#e08a2a";
    for (let i = 0; i < 8; i++) {
      const x = P.x - 76 + i * 22;
      g.globalAlpha = .12 + (i % 3) * .055; g.lineWidth = 2.2;
      g.beginPath(); g.moveTo(x, hy - 80); g.lineTo(x + 13, hy + 34); g.stroke();
    }
  }
  if (ult.mode === "meteor" && ult.lift > 16) {
    const tail = 55 + ult.lift * .55;
    g.globalAlpha = .20; g.fillStyle = "#e08a2a";
    g.beginPath(); g.moveTo(P.x - 24, hy + 6); g.lineTo(P.x - 8, hy - tail);
    g.lineTo(P.x + 8, hy - tail * 1.15); g.lineTo(P.x + 25, hy + 6); g.closePath(); g.fill();
    g.strokeStyle = "#fff8e8"; g.lineWidth = 4;
    for (let i = -2; i <= 2; i++) {
      g.globalAlpha = .42 - Math.abs(i) * .07;
      g.beginPath(); g.moveTo(P.x + i * 8, hy - 18); g.lineTo(P.x + i * 4, hy - tail); g.stroke();
    }
  }
  if (ult.mode === "spiral") {
    const r = 34 + Math.sin(p * Math.PI) * 30;
    for (let i = 0; i < 3; i++) {
      g.globalAlpha = .42 - i * .09; g.strokeStyle = i === 1 ? "#fff8e8" : "#8a53c4";
      g.lineWidth = 4.4 - i * .7; g.beginPath();
      g.arc(P.x, hy - 18, r + i * 13, ult.spinAim + i * 1.1,
            ult.spinAim + i * 1.1 + Math.PI * 1.42); g.stroke();
    }
    for (let i = 0; i < 8; i++) {
      const an = ult.spinAim + i / 8 * 6.283, rr = r + (i % 3) * 8;
      g.globalAlpha = .85; g.fillStyle = i % 2 ? "#8a53c4" : "#e08a2a";
      g.beginPath(); g.arc(P.x + Math.cos(an) * rr, hy - 18 + Math.sin(an) * rr * .62, 2.8, 0, 7); g.fill();
    }
  }
  if (ult.mode === "dance") {
    const pulse = Math.max(0, ult.dancePulse || 0);
    g.globalAlpha = .10 + pulse * .12; g.fillStyle = "#e08a2a";
    g.beginPath(); g.ellipse(P.x + (ult.stageX || 0), P.y + 19, 58 + pulse * 16, 15 + pulse * 4, 0, 0, 7); g.fill();
    g.globalAlpha = .72; g.strokeStyle = "#fff8e8"; g.lineWidth = 2.8;
    const a0 = ult.spinAim || P.aim;
    for (let i = 0; i < 3; i++) {
      const an = a0 + (i - 1) * .23;
      g.beginPath(); g.moveTo(P.x + (ult.stageX || 0) + Math.cos(an) * 24, hy - 18 + Math.sin(an) * 18);
      g.lineTo(P.x + (ult.stageX || 0) + Math.cos(an) * (54 + pulse * 35), hy - 18 + Math.sin(an) * (42 + pulse * 18)); g.stroke();
    }
  }
  if (ult.mode === "cross") {
    const pulse = .5 + .5 * Math.sin(ult.t / 48);
    g.globalAlpha = .10 + pulse * .10; g.strokeStyle = ult.mode === "cross" ? "#c8402c" : "#8a53c4";
    g.lineWidth = 10; g.beginPath(); g.arc(P.x, hy - 18, 30 + pulse * 18, 0, 7); g.stroke();
  }
  g.restore();
}

function drawUltScreenFX(g) {
  const p = Math.max(0, Math.min(1, ult.t / ult.dur));
  const rush = (["dash", "meteor", "cross"].includes(ult.mode))
    ? Math.sin(Math.min(1, p * 1.35) * Math.PI) : 0;
  const intro = Math.max(0, 1 - p * 7);
  const energy = Math.max(intro * .55, rush * .10, (ult.punch || 0) * .52);

  if (energy > .035) {
    g.save(); g.translate(W / 2, H / 2); g.strokeStyle = "#2b2620"; g.lineCap = "round";
    for (let i = 0; i < 14; i++) {
      const an = i / 14 * 6.283 + .07 * Math.sin(i * 4.1);
      const wob = hash(i, Math.floor(ult.t / 90));
      const r1 = Math.min(W, H) * (.28 + wob * .12);
      const r2 = r1 + (42 + wob * 105) * energy;
      g.globalAlpha = energy * (.07 + (i % 4) * .018); g.lineWidth = 1.1 + (i % 3) * .55;
      g.beginPath(); g.moveTo(Math.cos(an) * r1, Math.sin(an) * r1);
      g.lineTo(Math.cos(an) * r2, Math.sin(an) * r2); g.stroke();
    }
    g.restore();
  }

  if ((ult.flash || 0) > .01) {
    g.fillStyle = "rgba(255,248,232," + Math.min(.55, ult.flash).toFixed(3) + ")";
    g.fillRect(0, 0, W, H);
  }

  const bar = 42 + Math.sin(Math.min(1, p * 5) * Math.PI / 2) * 20;
  const a = Math.min(.62, Math.min(p, 1 - p) * 4) * .68;
  g.fillStyle = "rgba(43,38,32," + a.toFixed(3) + ")";
  g.fillRect(0, 0, W, bar); g.fillRect(0, H - bar, W, bar);
  const edge = ult.mode === "spiral" || ult.mode === "dash" ? "#8a53c4"
             : ult.mode === "cross" ? "#c8402c" : "#e08a2a";
  g.globalAlpha = a * .58; g.fillStyle = edge;
  g.fillRect(0, bar - 2, W, 2); g.fillRect(0, H - bar, W, 2);
  g.globalAlpha = 1;
}

/* Эксклюзивный сундук: фиолетовый корпус, золото, кристалл и редкий замок. */
function drawRareChest(g, x, y, sc, phase) {
  const bob = Math.sin(phase * 2) * 2;
  g.save(); g.translate(x, y + bob); g.scale(sc, sc);
  g.lineCap = "round"; g.lineJoin = "round";
  g.globalAlpha = .12 + Math.abs(Math.sin(phase)) * .06; g.fillStyle = "#8a53c4";
  g.beginPath(); g.ellipse(0, 10, 34, 15, 0, 0, 7); g.fill(); g.globalAlpha = 1;
  g.strokeStyle = INK; g.lineWidth = 2.7;
  spoly(g, [[-23,-2],[23,-2],[20,17],[-20,17]], "#694397");
  g.beginPath(); g.moveTo(-23,-2); g.quadraticCurveTo(-19,-24,0,-27);
  g.quadraticCurveTo(19,-24,23,-2); g.closePath(); g.fillStyle="#9661cb"; g.fill(); g.stroke();
  g.strokeStyle="#efc95e"; g.lineWidth=3.6;
  sline(g,-23,-2,23,-2); sline(g,-10,-20,-10,17); sline(g,10,-20,10,17);
  spoly(g,[[-7,-6],[7,-6],[8,8],[0,13],[-8,8]],"#efc95e");
  scircle(g,0,0,2.3,"#fff2a8"); g.strokeStyle=INK; g.lineWidth=1.6; sline(g,0,2,0,6);
  g.strokeStyle="#e7c85e"; g.lineWidth=2;
  for(let i=0;i<6;i++){
    const a=phase+i*1.047, r=31+(i%2)*8; sline(g,Math.cos(a)*r,Math.sin(a)*r*.65-6,Math.cos(a)*(r+6),Math.sin(a)*(r+6)*.65-6);
  }
  g.fillStyle="#d8b4ff"; g.strokeStyle=INK; g.lineWidth=2;
  spoly(g,[[0,-39],[7,-31],[3,-22],[-3,-22],[-7,-31]],"#d8b4ff");
  g.restore();
}

/* ── кадр ─────────────────────────────────────────────────── */
function draw() {
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.save();
  if (shake > .2) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
  // во время ульты камера наезжает на героя
  const Z = ult.zoom, focus = ult.on && ult.focus ? ult.focus : null;
  const fm = focus ? .30 : 0;
  const fx = ult.on ? (focus ? P.x + (focus.x - P.x) * fm : P.x) : cam.x + W / 2;
  const fy = ult.on ? (focus ? P.y + (focus.y - P.y) * fm : P.y) : cam.y + H / 2;
  const up = ult.on ? Math.max(0, Math.min(1, ult.t / ult.dur)) : 0;
  const cant = !ult.on ? 0 : (ult.mode === "dash" || ult.mode === "combo")
    ? Math.sin((ult.step || 0) * 2.4) * .012
    : (ult.mode === "kick" || ult.mode === "cross") ? Math.sin(up * Math.PI) * P.face * .010 : 0;
  ctx.translate(W / 2, H / 2); ctx.rotate(cant); ctx.scale(Z, Z); ctx.translate(-fx, -fy);
  const hw = W / 2 / Z + 70, hh = H / 2 / Z + 70;
  const L = fx - hw, R = fx + hw, T = fy - hh, B = fy + hh;
  const vis = o => o.x > L && o.x < R && o.y > T && o.y < B;

  // тетрадная сетка
  ctx.strokeStyle = "rgba(120,100,70,.11)"; ctx.lineWidth = 1;
  for (let x = Math.floor(L / 58) * 58; x < R; x += 58) { ctx.beginPath(); ctx.moveTo(x, T); ctx.lineTo(x, B); ctx.stroke(); }
  for (let y = Math.floor(T / 58) * 58; y < B; y += 58) { ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(R, y); ctx.stroke(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.strokeRect(0, 0, WORLD, WORLD);

  ctx.lineCap = "round"; ctx.lineJoin = "round";

  for (const ic of ices) {                       // каток
    const a = Math.min(1, ic.life / 1500);
    ctx.globalAlpha = .35 * a; ctx.fillStyle = "#a9dcf0";
    ctx.beginPath(); ctx.arc(ic.x, ic.y, ic.r, 0, 7); ctx.fill();
    ctx.globalAlpha = .75 * a; ctx.strokeStyle = "#4aa8cf"; ctx.lineWidth = 2.5;
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const an = i * 1.05 + ic.x;
      sline(ctx, ic.x + Math.cos(an) * ic.r * .3, ic.y + Math.sin(an) * ic.r * .3,
                 ic.x + Math.cos(an) * ic.r * .8, ic.y + Math.sin(an) * ic.r * .8);
    }
    ctx.globalAlpha = 1;
  }

  drawGasCloud(ctx, L, R, T, B);

  for (const o of props) {                       // камни, кусты, деревья
    if (!vis(o)) continue;
    ctx.save(); ctx.translate(o.x, o.y);
    ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
    if (o.kind === "rock") {
      spoly(ctx, o.pts, "#ded2be");
      ctx.lineWidth = 1.6;
      sline(ctx, -o.r * .3, -o.r * .1, o.r * .1, o.r * .35);
      sline(ctx, o.r * .05, -o.r * .35, o.r * .35, 0);
    } else if (o.kind === "bush") {
      spoly(ctx, o.pts, "#bcd3a8");
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const a = i * 1.5 + o.seed * 6;
        sline(ctx, Math.cos(a) * o.r * .2, Math.sin(a) * o.r * .2,
                   Math.cos(a) * o.r * .55, Math.sin(a) * o.r * .55);
      }
    } else {
      ctx.lineWidth = 3; ctx.strokeStyle = "#7a5a35";
      sline(ctx, 0, o.r * .7, 0, -o.r * .2);
      ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
      scircle(ctx, 0, -o.r * .55, o.r * .8, "#9dc48a");
      scircle(ctx, -o.r * .45, -o.r * .15, o.r * .5, "#b0d39c");
    }
    ctx.restore();
  }

  for (const h of pickups) {                     // бусты на карте
    if (!vis(h)) continue;
    drawPickup(ctx, h);
  }
  for (const c of chests) {                      // сундук
    if (!vis(c)) continue;
    if (c.rare) { drawRareChest(ctx, c.x, c.y, 1.1, c.a); continue; }
    ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
    ctx.save(); ctx.translate(c.x, c.y);
    spoly(ctx, [[-19, -2], [19, -2], [17, 13], [-17, 13]], "#c98f4e");   // короб
    ctx.beginPath(); ctx.moveTo(-19, -2);                                 // крышка дугой
    ctx.quadraticCurveTo(0, -22, 19, -2); ctx.closePath();
    ctx.fillStyle = "#dda964"; ctx.fill(); ctx.stroke();
    ctx.lineWidth = 2.2;
    sline(ctx, -19, -2, 19, -2);
    sline(ctx, -8, -16, -8, 13); sline(ctx, 8, -16, 8, 13);               // окантовка
    spoly(ctx, [[-4, -4], [4, -4], [4, 5], [-4, 5]], "#e8c66a");          // замок
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, 7); ctx.fill();
    ctx.strokeStyle = "#e8c66a"; ctx.lineWidth = 1.8;                     // искры
    for (let i = 0; i < 3; i++) {
      const a2 = c.a + i * 2.1, rr = 26 + Math.sin(c.a * 2 + i) * 4;
      sline(ctx, Math.cos(a2) * rr, -6 + Math.sin(a2) * rr * .5,
                 Math.cos(a2) * (rr + 5), -6 + Math.sin(a2) * (rr + 5) * .5);
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
    ctx.restore();
    const oy = c.y - 36 + Math.sin(c.a * 2) * 5;
    drawItemIcon(ctx, c.item, c.x, oy, 1.05);
  }

  ctx.strokeStyle = INK; ctx.lineWidth = 2;
  for (const o of orbs) {
    if (!vis(o)) continue;
    if (o.superPull) {
      const a = Math.atan2(P.y-o.y, P.x-o.x);
      ctx.globalAlpha=.32; ctx.strokeStyle="#f4c84b"; ctx.lineWidth=3;
      sline(ctx,o.x-Math.cos(a)*18,o.y-Math.sin(a)*18,o.x,o.y); ctx.globalAlpha=1;
    }
    scircle(ctx, o.x, o.y, o.superPull ? 5.3 : 4.5, "#dfa128");
  }
  for (const m of mines) {
    ctx.globalAlpha = m.arm > 0 ? .5 : 1;
    if (m.mini) { ctx.lineWidth = 2; scircle(ctx, m.x, m.y, 6, "#4e8f4a");
      ctx.fillStyle = "#ffe0b0"; ctx.beginPath(); ctx.arc(m.x, m.y, 2, 0, 7); ctx.fill(); }
    else drawItemIcon(ctx, "mine", m.x, m.y, .95);
    ctx.globalAlpha = 1;
    if (m.arm <= 0 && !m.mini) { ctx.fillStyle = "#ffe0b0";
      ctx.beginPath(); ctx.arc(m.x, m.y, 1.6 + Math.sin(t / 120) * 1.4, 0, 7); ctx.fill(); }
  }
  for (const g of nades) { ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(t / 90); drawItemIcon(ctx, "nade", 0, 0, .85); ctx.restore(); }
  for (const p of puffs) {
    ctx.globalAlpha = Math.max(0, p.life); ctx.lineWidth = 1.8;
    scircle(ctx, p.x, p.y, p.r, p.gas ? "#9fbd72" : "#e0d3bd"); ctx.globalAlpha = 1;
  }
  for (const c of corpses) drawCorpse(ctx, c);
  for (const e of enemies) {
    if (!vis(e)) continue;
    drawFoe(ctx, e.x, e.y + 13 * (e.r / 11), e.face, e.phase, e.r / 11,
            e.poison > 0 ? "#86aa65" : e.flash > 0 ? "#f0907c" : FOE, e.kind, 0, e.flinch);
    if (e.kind === "elite" || e.kind === "tank") {
      const w = e.r * 2.2;
      ctx.fillStyle = "rgba(0,0,0,.12)"; ctx.fillRect(e.x - w / 2, e.y - e.r - 18, w, 4);
      ctx.fillStyle = FOE; ctx.fillRect(e.x - w / 2, e.y - e.r - 18, w * Math.max(0, e.hp / e.maxhp), 4);
    }
  }
  for (const f of flashes) drawFlash(ctx, f);
  for (const b of booms) {                            // волна стелется по земле
    const a2 = Math.max(0, b.life);
    ctx.globalAlpha = a2 * .85; ctx.strokeStyle = "#e08a2a"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(b.x, b.y + 8, b.r, b.r * .44, 0, 0, 7); ctx.stroke();
    ctx.globalAlpha = a2 * .25; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.ellipse(b.x, b.y + 8, b.r * .86, b.r * .38, 0, 0, 7); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  for (const s of shots) {
    if (s.kind === "sniper") {
      ctx.strokeStyle = "#8a53c4"; ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - Math.cos(s.a) * 34, s.y - Math.sin(s.a) * 34); ctx.stroke();
      ctx.globalAlpha = .3; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - Math.cos(s.a) * 26, s.y - Math.sin(s.a) * 26); ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (s.kind === "pellet") {
      ctx.fillStyle = "#7a5330";
      ctx.beginPath(); ctx.arc(s.x, s.y, 2.4, 0, 7); ctx.fill();
    } else if (s.kind === "tank") {
      ctx.strokeStyle = "#3d78bd"; ctx.lineWidth = 4.2;
      ctx.beginPath(); ctx.moveTo(s.x,s.y); ctx.lineTo(s.x-Math.cos(s.a)*20,s.y-Math.sin(s.a)*20); ctx.stroke();
      ctx.globalAlpha=.65; ctx.fillStyle="#ffd36a"; ctx.beginPath(); ctx.arc(s.x,s.y,3.4,0,7); ctx.fill(); ctx.globalAlpha=1;
    } else if (s.kind === "mini") {
      ctx.strokeStyle = "#e08a2a"; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - Math.cos(s.a) * 8, s.y - Math.sin(s.a) * 8); ctx.stroke();
    } else {
      ctx.strokeStyle = INK; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - Math.cos(s.a) * 11, s.y - Math.sin(s.a) * 11); ctx.stroke();
    }
  }
  for (const eg of eggs) drawEgg(ctx, eg);
  for (const ch of chicks) drawChick(ctx, ch);
  for (const tu of turrets) drawTurret(ctx, tu);
  for (const q of allyTanks) drawAllyTank(ctx, q);
  if (running) {
    if (P.pet && P.pet.dead <= 0 && !(P.pet.hurt > 0 && Math.floor(t / 80) % 2 === 0)) {
      drawPet(ctx, P.pet.x, P.pet.y, P.pet.type, P.pet.lvl, P.pet.face, P.pet.phase, P.pet);
      const w = 22;
      ctx.fillStyle = "rgba(43,38,32,.18)"; ctx.fillRect(P.pet.x - w / 2, P.pet.y - 40, w, 3.5);
      ctx.fillStyle = "#4e8f4a"; ctx.fillRect(P.pet.x - w / 2, P.pet.y - 40, w * (P.pet.hp / P.pet.hpMax), 3.5);
    }
    if (P.invT > 0) {
      ctx.globalAlpha = .45;
      ctx.strokeStyle = "#4aa8cf"; ctx.lineWidth = 2.4; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.arc(P.x, P.y - 8, 34, 0, 7); ctx.stroke();
      ctx.setLineDash([]);
    }
    if (!(P.hurt > 0 && Math.floor(t / 85) % 2 === 0))
      if (ult.on) {
        const gear2 = { ...P.gear, _w: P.wtype, _noShadow: true, _chem: P.chemT > 0 };
        const SCU = 1.42, BOLD = 1.55;                 // выше и стройнее, как на референсе
        const pz = ultPose();
        for (let i = 0; i < (ult.trail || []).length; i++) {
          const tr = ult.trail[i];
          ctx.globalAlpha = .05 + i * .022;
          ctx.save(); ctx.translate(tr.x, tr.y + 17); ctx.rotate(tr.rot);
          drawHero(ctx, 0, 0, P.face, 0, gear2, SCU, P.aim, 0, tr.pose, BOLD);
          ctx.restore();
        }
        ctx.globalAlpha = 1;
        const kick = (ult.kick || 0) * 5;
        const hx = P.x + (ult.stageX || 0) - Math.cos(P.aim) * kick;
        const hy = P.y + 17 + (ult.stageY || 0) - (ult.lift || 0) - Math.sin(P.aim) * kick;
        // тень на земле
        ctx.globalAlpha = .13; ctx.fillStyle = INK;
        ctx.beginPath(); ctx.ellipse(P.x, P.y + 17, 17, 5, 0, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
        // объём: тёмная копия со сдвигом, затем сама фигура
        ctx.save(); ctx.translate(hx + 2.5, hy + 3.5); ctx.rotate(ult.rot || 0);
        ctx.globalAlpha = .30;
        drawHero(ctx, 0, 0, P.face, 0, gear2, SCU, P.aim, 0, pz, BOLD);
        ctx.globalAlpha = 1; ctx.restore();
        ctx.save(); ctx.translate(hx, hy); ctx.rotate(ult.rot || 0);
        drawHero(ctx, 0, 0, P.face, 0, gear2, SCU, P.aim, P.muzzle, pz, BOLD);
        ctx.restore();
      } else
      {
        const run = P.run || 0;
        const rc = (P.recoilT || 0) > 0 ? (P.recoilT / 170) * 4 : 0;
        const hp2 = { lean: -P.face * run * .055, squash: 1 + Math.sin(P.phase * 2) * .018 * run };
        for (const g2 of (P.ghosts || [])) {           // след при ускорении
          ctx.globalAlpha = Math.max(0, g2.life) * .14;
          drawHero(ctx, g2.x, g2.y + 17, g2.face, g2.ph,
                   { ...P.gear, _w: P.wtype, _noShadow: true, _chem: P.chemT > 0 }, .99, P.aim, 0, hp2);
        }
        ctx.globalAlpha = 1;
        drawHero(ctx, P.x - Math.cos(P.aim) * rc, P.y + 17 - Math.sin(P.aim) * rc,
                 P.face, P.phase, { ...P.gear, _w: P.wtype, _chem: P.chemT > 0 }, 1.02, P.aim, P.muzzle, hp2);
      }
    ctx.globalAlpha = 1;
  }
  ctx.font = "700 14px system-ui"; ctx.textAlign = "center";
  for (const p of pops) {
    ctx.globalAlpha = Math.min(1, p.life * 1.6); ctx.fillStyle = p.col;
    ctx.fillText(p.txt, p.x, p.y); ctx.globalAlpha = 1;
  }
  if (ult.on) {
    drawUltMotionFX(ctx);
    if (ult.mode === "whirl" && ult.ring) {           // росчерк по дуге
      const a0 = ult.spinAim;
      for (let i = 0; i < 6; i++) {
        ctx.globalAlpha = .40 - i * .06;
        ctx.strokeStyle = "#fff8e8"; ctx.lineWidth = 14 - i * 2;
        ctx.beginPath();
        ctx.arc(P.x, P.y - 16, 66, a0 - 1.5 - i * .16, a0 - .1 - i * .16);
        ctx.stroke();
      }
      ctx.globalAlpha = .9; ctx.strokeStyle = "#fff"; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(P.x, P.y - 16, 66, a0 - .30, a0); ctx.stroke();
      ctx.globalAlpha = .16; ctx.strokeStyle = "#c9b9a2"; ctx.lineWidth = 26;
      ctx.beginPath(); ctx.arc(P.x, P.y + 14, ult.ring * .55, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    for (const b of ult.blinks || []) {                // росчерки рывка
      ctx.globalAlpha = Math.max(0, b.life) * .85;
      ctx.strokeStyle = "#8a53c4"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(b.x1, b.y1 - 14); ctx.lineTo(b.x2, b.y2 - 14); ctx.stroke();
      ctx.globalAlpha = Math.max(0, b.life) * .3; ctx.lineWidth = 16;
      ctx.beginPath(); ctx.moveTo(b.x1, b.y1 - 14); ctx.lineTo(b.x2, b.y2 - 14); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (ult.slash > 0) {                               // дуга удара после рывка
      ctx.globalAlpha = ult.slash; ctx.strokeStyle = "#fff3d8"; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(P.x + Math.cos(P.aim) * 30, P.y - 14 + Math.sin(P.aim) * 30, 26,
              P.aim - 1.1, P.aim + 1.1);
      ctx.stroke(); ctx.globalAlpha = 1;
    }
    for (const m of ult.marks || []) {                 // прицелы ливня и падающие лучи
      const u = 1 - m.life;
      ctx.globalAlpha = Math.min(1, m.life * 2);
      ctx.strokeStyle = "#8a53c4"; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.arc(m.x, m.y, 10 + (1 - m.life) * 16, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(m.x, m.y, 26 * m.life + 6, 0, 7); ctx.stroke();
      if (m.life < .62) {
        ctx.strokeStyle = "#fff3d8"; ctx.lineWidth = 4;
        const drop = Math.min(1, (0.62 - m.life) / .17);
        ctx.beginPath();
        ctx.moveTo(m.x, m.y - 460 * (1 - drop) - 40);
        ctx.lineTo(m.x, m.y - 460 * (1 - drop) * .55);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (ult.tracer) {                                  // трассер расстрела
      const tr = ult.tracer;
      ctx.globalAlpha = Math.max(0, tr.life);
      ctx.strokeStyle = "#8a53c4"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(tr.x1, tr.y1); ctx.lineTo(tr.x2, tr.y2); ctx.stroke();
      ctx.globalAlpha = Math.max(0, tr.life) * .3; ctx.lineWidth = 12;
      ctx.beginPath(); ctx.moveTo(tr.x1, tr.y1); ctx.lineTo(tr.x2, tr.y2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (ult.lift > 4) {                                // тень внизу, пока в воздухе
      ctx.globalAlpha = .10; ctx.fillStyle = INK;
      ctx.beginPath(); ctx.ellipse(P.x, P.y + 18, 16, 4.5, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
    for (const f of (ult.impacts || [])) drawUltImpact(ctx, f);
    ctx.globalAlpha = 1;
  }
  drawAbilityWorldFX(ctx);
  ctx.textAlign = "left"; ctx.restore();

  if (ult.on) drawUltScreenFX(ctx);                    // лучи, вспышка и кино-полосы
  drawAbilityScreenFX(ctx);
  hud();
}
