"use strict";
/* draw-foe.js — враги и анимации смерти */

function drawFoe(g, x, y, face, phase, sc, col, kind, rot) {
  const sw = Math.sin(phase) * .6;
  g.save(); g.translate(x, y);
  if (rot) g.rotate(rot);
  g.scale(sc, sc);
  g.strokeStyle = col; g.lineWidth = 2.4; g.lineCap = "round"; g.lineJoin = "round";

  if (kind === "runner") {
    // бегун: наклон вперёд, руки назад, частый шаг
    g.save(); g.scale(face, 1); g.rotate(-.20);
    const f = Math.sin(phase * 1.55) * .85;
    sline(g, 0, -11, f * 11, 2); sline(g, 0, -11, -f * 11, 2);
    sline(g, 0, -11, 0, -24);
    sline(g, 0, -21, -10, -14 + f * 4);
    sline(g, 0, -21, -8, -25 - f * 3);
    g.fillStyle = PAPER; scircle(g, 2, -29, 5.2, PAPER);
    g.fillStyle = col; g.beginPath(); g.arc(4, -30, .9, 0, 7); g.fill();
    g.restore();

  } else if (kind === "tank") {
    // танк: тяжёлый шаг, приседает на опорной ноге, широкие плечи
    const squash = Math.abs(Math.sin(phase)) * 2.2;
    g.translate(0, squash);
    g.lineWidth = 3.4;
    g.save(); g.scale(face, 1);
    sline(g, 0, -10, sw * 7, 2); sline(g, 0, -10, -sw * 7, 2);
    sline(g, 0, -10, 0, -24);
    sline(g, -9, -22, 9, -22);                       // плечи
    sline(g, 9, -22, 12, -13 + sw * 4);
    sline(g, -9, -22, -12, -13 - sw * 4);
    g.fillStyle = PAPER; scircle(g, 0, -30, 6.4, PAPER);
    g.fillStyle = col; g.beginPath(); g.arc(2, -31, 1, 0, 7); g.fill();
    g.lineWidth = 2.4;
    sline(g, -5, -35, 5, -35);                       // насупленная бровь
    g.restore();

  } else if (kind === "elite") {
    // элита: покачивается, руки подняты, рожки
    const sway = Math.sin(phase * .7) * .10;
    g.rotate(sway);
    g.lineWidth = 3;
    g.save(); g.scale(face, 1);
    sline(g, 0, -12, sw * 9, 2); sline(g, 0, -12, -sw * 9, 2);
    sline(g, 0, -12, 0, -26);
    const arm = Math.sin(phase * 1.3) * 4;
    sline(g, 0, -24, 11, -32 + arm); sline(g, 0, -24, -11, -32 - arm);
    g.fillStyle = PAPER; scircle(g, 0, -33, 6.6, PAPER);
    g.fillStyle = col;
    g.beginPath(); g.arc(2.4, -34, 1.1, 0, 7); g.fill();
    g.beginPath(); g.arc(-2.4, -34, 1.1, 0, 7); g.fill();
    spoly(g, [[-6, -38], [-4, -45], [-2, -38]], col);   // рожки
    spoly(g, [[6, -38], [4, -45], [2, -38]], col);
    g.restore();

  } else {
    // обычный: бег с покачиванием корпуса
    const bob = Math.sin(phase * 2) * 1.3;
    g.translate(0, bob);
    g.save(); g.scale(face, 1);
    sline(g, 0, -11, sw * 8, 2); sline(g, 0, -11, -sw * 8, 2);
    sline(g, 0, -11, 0, -25);
    sline(g, 0, -22, 8, -17 + sw * 3); sline(g, 0, -22, -8, -17 - sw * 3);
    g.fillStyle = PAPER; scircle(g, 0, -30, 5.6, PAPER);
    g.fillStyle = col; g.beginPath(); g.arc(1.8, -31, .9, 0, 7); g.fill();
    g.restore();
  }
  g.restore();
}

function drawCorpse(g, c) {
  const a = Math.max(0, Math.min(1, c.life / c.max));
  g.globalAlpha = a;
  if (c.mode === "pop") {                      // лопается облачком
    const k = 1 - a;
    g.strokeStyle = FOE; g.lineWidth = 2.6;
    scircle(g, c.x, c.y - 12 * c.sc, (6 + k * 18) * c.sc, null);
    for (let i = 0; i < 5; i++) {
      const an = i * 1.256 + c.phase;
      sline(g, c.x + Math.cos(an) * 10 * c.sc, c.y - 12 * c.sc + Math.sin(an) * 10 * c.sc,
               c.x + Math.cos(an) * (16 + k * 14) * c.sc, c.y - 12 * c.sc + Math.sin(an) * (16 + k * 14) * c.sc);
    }
  } else {
    drawFoe(g, c.x, c.y, c.face, c.phase, c.sc, FOE, c.kind, c.rot * c.face);
    if (c.mode === "blast") {                  // элиту рвёт на части
      const k = 1 - a;
      g.strokeStyle = FOE; g.lineWidth = 2.4;
      for (let i = 0; i < 7; i++) {
        const an = i * .9 + c.phase, r0 = 12 + k * 46;
        sline(g, c.x + Math.cos(an) * r0, c.y - 20 + Math.sin(an) * r0,
                 c.x + Math.cos(an) * (r0 + 11), c.y - 20 + Math.sin(an) * (r0 + 11));
      }
    }
  }
  g.globalAlpha = 1;
}
