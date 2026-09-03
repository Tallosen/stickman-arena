"use strict";
/* render.js — отрисовка кадра */

/* ── кадр ─────────────────────────────────────────────────── */
function draw() {
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.save();
  if (shake > .2) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
  ctx.translate(-cam.x, -cam.y);
  const L = cam.x - 70, R = cam.x + W + 70, T = cam.y - 70, B = cam.y + H + 70;
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
  for (const o of orbs) { if (!vis(o)) continue; scircle(ctx, o.x, o.y, 4.5, "#dfa128"); }
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
    scircle(ctx, p.x, p.y, p.r, "#e0d3bd"); ctx.globalAlpha = 1;
  }
  for (const c of corpses) drawCorpse(ctx, c);
  for (const e of enemies) {
    if (!vis(e)) continue;
    drawFoe(ctx, e.x, e.y + 13 * (e.r / 11), e.face, e.phase, e.r / 11, e.flash > 0 ? "#f0907c" : FOE, e.kind, 0);
    if (e.kind === "elite" || e.kind === "tank") {
      const w = e.r * 2.2;
      ctx.fillStyle = "rgba(0,0,0,.12)"; ctx.fillRect(e.x - w / 2, e.y - e.r - 18, w, 4);
      ctx.fillStyle = FOE; ctx.fillRect(e.x - w / 2, e.y - e.r - 18, w * Math.max(0, e.hp / e.maxhp), 4);
    }
  }
  for (const b of booms) {
    ctx.globalAlpha = Math.max(0, b.life); ctx.strokeStyle = "#e08a2a"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
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
      drawHero(ctx, P.x, P.y + 17, P.face, P.phase, { ...P.gear, _w: P.wtype }, 1.02, P.aim, P.muzzle);
    ctx.globalAlpha = 1;
  }
  ctx.font = "700 14px system-ui"; ctx.textAlign = "center";
  for (const p of pops) {
    ctx.globalAlpha = Math.min(1, p.life * 1.6); ctx.fillStyle = p.col;
    ctx.fillText(p.txt, p.x, p.y); ctx.globalAlpha = 1;
  }
  ctx.textAlign = "left"; ctx.restore();
  hud();
}
