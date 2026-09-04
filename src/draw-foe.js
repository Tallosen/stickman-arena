"use strict";
/* Вспышка в момент кинематографичной гибели: кольцо и лучи */
function drawStar(g, f) {
  const a = Math.max(0, f.life), R = f.r;
  g.save(); g.translate(f.x, f.y); g.rotate(f.rot);
  g.globalAlpha = a;
  g.fillStyle = "#fff8e8";
  for (let i = 0; i < 12; i++) {                    // длинные лучи разной длины
    const an = i * .5236, L = R * (i % 2 ? .55 : 1.35) * (.8 + (i % 3) * .18);
    g.beginPath();
    g.moveTo(Math.cos(an) * L, Math.sin(an) * L);
    g.lineTo(Math.cos(an + .16) * R * .22, Math.sin(an + .16) * R * .22);
    g.lineTo(Math.cos(an - .16) * R * .22, Math.sin(an - .16) * R * .22);
    g.closePath(); g.fill();
  }
  g.globalAlpha = a * .95;
  g.beginPath(); g.arc(0, 0, R * .34, 0, 7); g.fill();
  g.restore(); g.globalAlpha = 1;
}

function drawFlash(g, f) {
  if (f.style === "star") return drawStar(g, f);
  const a = Math.max(0, f.life);
  g.save();
  g.globalAlpha = a * .9;
  g.strokeStyle = "#fff3d8"; g.lineWidth = 3.2;
  g.beginPath(); g.arc(f.x, f.y, f.r, 0, 7); g.stroke();
  g.globalAlpha = a * .55;
  g.strokeStyle = "#e0a52f"; g.lineWidth = 2.2;
  for (let i = 0; i < 10; i++) {                   // лучи начинаются от кольца
    const an = f.rot + i * .628, L = f.r * (i % 2 ? .18 : .32);
    sline(g, f.x + Math.cos(an) * f.r, f.y + Math.sin(an) * f.r,
             f.x + Math.cos(an) * (f.r + L), f.y + Math.sin(an) * (f.r + L));
  }
  g.restore(); g.globalAlpha = 1;
}

/* draw-foe.js — враги и анимации смерти */

function drawFoe(g, x, y, face, phase, sc, col, kind, rot, flinch) {
  const sw = Math.sin(phase) * .6;
  g.save(); g.translate(x, y);
  if (rot) g.rotate(rot);
  const f = Math.max(0, flinch || 0);                // сжимается от попадания
  g.scale(sc * (1 + f * .22), sc * (1 - f * .16));
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

/* Тряпичная кукла: тело вытянуто по вектору полёта,
   руки и ноги волочатся следом и покачиваются — как в кино,
   а не как равномерно крутящийся спрайт.                        */
function drawRagdoll(g, c, alpha, tone) {
  const sp = Math.hypot(c.vx, c.vy);
  const ang = Math.atan2(c.vy, c.vx);
  const limp = Math.min(1, sp / 7);                 // насколько сильно тянет конечности
  const w = c.t / 90;
  const S2 = c.sc * (1 + c.z / 90) * (c.style === "camera" ? 1 + c.t / 420 : 1);

  g.save();
  g.translate(c.x, c.y - c.z * 1.5);
  g.rotate(ang + Math.PI / 2 + c.tilt);             // «лежит» поперёк движения
  g.scale(S2, S2);
  g.globalAlpha = alpha;
  g.strokeStyle = tone; g.lineWidth = (c.bold || 4.4); g.lineCap = "round"; g.lineJoin = "round";

  const drag = (base, amp, ph) => [base[0] + Math.sin(w + ph) * amp * limp,
                                   base[1] + 6 * limp + Math.cos(w + ph) * amp * .6 * limp];
  const hip = [0, 8], neck = [0, -12];
  sline(g, hip[0], hip[1], neck[0], neck[1]);       // корпус
  const lf = drag([-9, 24], 6, 0), lb = drag([9, 24], 6, 2.1);
  sline(g, hip[0], hip[1], lf[0], lf[1]);           // ноги волочатся
  sline(g, hip[0], hip[1], lb[0], lb[1]);
  const af = drag([-14, 2], 7, 1.1), ab = drag([14, 2], 7, 3.4);
  sline(g, neck[0], neck[1] + 2, af[0], af[1]);     // руки болтаются
  sline(g, neck[0], neck[1] + 2, ab[0], ab[1]);
  g.fillStyle = tone;
  g.beginPath(); g.arc(0, -19, 5.6, 0, 7); g.fill();
  g.restore();
  g.globalAlpha = 1;
}

function drawCorpse(g, c) {
  const a = Math.max(0, Math.min(1, c.life / c.max));
  if (c.mode === "launch") {
    const a2 = c.style === "camera" ? Math.min(1, c.life / .45) : Math.min(1, c.life / .5);
    if (c.z > 2) {                                  // тень на земле, пока в воздухе
      g.globalAlpha = a2 * .12; g.fillStyle = INK;
      g.beginPath(); g.ellipse(c.x, c.y, 11 * c.sc, 3.4 * c.sc, 0, 0, 7); g.fill();
      g.globalAlpha = 1;
    }
    for (let i = 0; i < c.trail.length; i++) {      // смазанный след
      const tr = c.trail[i];
      drawRagdoll(g, { ...c, x: tr.x, y: tr.y, z: tr.z, tilt: tr.tilt },
                  a2 * (.035 + i * .022), "#a8331f");
    }
    // первый миг — силуэт вспышки
    drawRagdoll(g, c, a2, c.t < 100 ? "#ffd9c8" : "#a8331f");
    return;
  }
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
