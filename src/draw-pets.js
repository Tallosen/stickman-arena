"use strict";
/* draw-pets.js — рисование питомцев, предметов, яиц, турелей */

/* ── рисование питомцев ───────────────────────────────────── */
function drawPet(g, x, y, type, lvl, face, phase, p) {
  g.save(); g.translate(x, y); g.lineCap = "round"; g.lineJoin = "round";
  g.strokeStyle = INK; g.lineWidth = 2.2;
  const sw = Math.sin(phase) * .5;
  const col = TIER[Math.min(4, lvl - 1)];

  if (type === "dog") {
    g.save(); g.scale(face, 1);
    const wag = Math.sin(phase * 2) * 5;
    sline(g, -13, -15, -21, -23 + wag);                    // хвост
    sline(g, -9, -6, -10 + sw * 5, 2);                     // задние лапы
    sline(g, -6, -6, -7 - sw * 5, 2);
    spoly(g, [[-14, -17], [9, -18], [11, -7], [-13, -6]], "#c99a5f");   // корпус
    sline(g, 7, -6, 8 - sw * 5, 2);                        // передние лапы
    sline(g, 4, -6, 5 + sw * 5, 2);
    sline(g, 9, -16, 14, -21);                             // шея
    scircle(g, 17, -24, 5.6, "#dcae72");                   // голова
    spoly(g, [[20, -26], [28, -23], [20, -20]], "#c99a5f");// морда
    spoly(g, [[13, -27], [15, -34], [19, -28]], "#a8783f");// ухо
    g.fillStyle = INK;
    g.beginPath(); g.arc(19, -26, .9, 0, 7); g.fill();     // глаз
    g.beginPath(); g.arc(27.5, -23, 1.3, 0, 7); g.fill();  // нос
    g.strokeStyle = col; g.lineWidth = 3;                  // ошейник, цвет по уровню
    sline(g, 11, -19, 14, -14);
    if (lvl >= 3) { g.lineWidth = 1.8; for (let i = 0; i < 3; i++) sline(g, 11.5 + i * 1.1, -18 + i * 1.6, 14.5 + i * 1.1, -19 + i * 1.6); }
    g.strokeStyle = INK; g.lineWidth = 2.2;
    if (p && p.bite > 0) {                                 // укус
      const k2 = p.bite / 220;
      g.strokeStyle = "#c8402c"; g.lineWidth = 2.6;
      g.beginPath(); g.arc(30, -23, 9 + (1 - k2) * 7, -1.1, 1.1); g.stroke();
      g.beginPath(); g.arc(30, -23, 14 + (1 - k2) * 8, -.8, .8); g.stroke();
      g.lineWidth = 2; g.strokeStyle = INK;
      for (let i = -1; i <= 1; i++) sline(g, 28, -23 + i * 6, 34, -23 + i * 8);
    }
    g.restore();

  } else if (type === "cat") {
    g.save(); g.scale(face, 1);
    spoly(g, [[-10, -12], [8, -12], [9, -4], [-10, -4]], "#9aa3ab");
    sline(g, -7, -4, -8 + sw * 4, 3); sline(g, 4, -4, 5 - sw * 4, 3);
    sline(g, -10, -11, -18, -17);
    scircle(g, 12, -16, 5, "#aab3ba");
    spoly(g, [[9, -20], [10, -25], [13, -20]], "#8c959d");
    spoly(g, [[13, -20], [16, -25], [16, -19]], "#8c959d");
    g.restore();
    g.save(); g.translate(0, -14); g.rotate(face > 0 ? (p ? p.aim : 0) : Math.PI - (p ? p.aim : 0)); g.scale(face, 1);
    spoly(g, [[-4, -4], [6, -4], [6, 1], [-4, 1]], col);
    spoly(g, [[6, -3], [16 + lvl, -3], [16 + lvl, -.6], [6, -.6]], col);
    g.restore();

  } else if (type === "parrot") {
    g.save(); g.scale(face, 1);
    const fl = Math.sin(phase * 2.4) * 7;
    spoly(g, [[-8, -14], [6, -16], [7, -7], [-7, -6]], col);
    sline(g, -8, -14, -18, -20 - fl);
    sline(g, -8, -12, -17, -12 + fl);
    scircle(g, 9, -19, 4.6, "#f0d98a");
    spoly(g, [[12, -20], [17, -18], [12, -16]], "#e08a2a");
    sline(g, -7, -9, -15, -4);
    g.restore();
    g.globalAlpha = .18; g.fillStyle = INK;
    g.beginPath(); g.ellipse(0, 12, 9, 3, 0, 0, 7); g.fill(); g.globalAlpha = 1;

  } else if (type === "boar") {
    g.save(); g.scale(face, 1);
    spoly(g, [[-15, -18], [8, -20], [12, -6], [-14, -5]], "#6f5b4a");     // туша
    sline(g, -9, -5, -10 + sw * 4, 3); sline(g, -5, -5, -6 - sw * 4, 3);
    sline(g, 5, -6, 6 - sw * 4, 3); sline(g, 9, -6, 10 + sw * 4, 3);
    scircle(g, 15, -20, 6, "#7d6754");                                     // голова
    spoly(g, [[19, -22], [27, -19], [19, -15]], "#5a4839");                // рыло
    spoly(g, [[20, -18], [25, -25], [21, -16]], "#efe6d2");                // клык
    spoly(g, [[11, -25], [13, -31], [17, -25]], "#5a4839");                // ухо
    g.fillStyle = INK; g.beginPath(); g.arc(17, -22, .9, 0, 7); g.fill();
    spoly(g, [[-10, -24], [0, -26], [1, -18], [-9, -16]], "#c8402c");      // динамит
    for (let i = 0; i < 2; i++) sline(g, -8 + i * 4, -25, -8 + i * 4, -17);
    g.strokeStyle = "#8a7355"; sline(g, -5, -26, -9, -33);                 // фитиль
    const spark = 2 + Math.abs(Math.sin(phase * 3)) * (1.6 + lvl * .5);
    g.fillStyle = "#e08a2a";
    g.beginPath(); g.arc(-9, -33, spark, 0, 7); g.fill();
    g.strokeStyle = INK;
    g.restore();

  } else if (type === "chicken") {
    g.save(); g.scale(face, 1);
    g.translate(0, Math.sin(phase * 2) * 1.3);
    for (let i = 0; i < 3; i++) {                                  // хвост из перьев
      const a2 = -.5 - i * .38;
      spoly(g, [[-11, -13], [-11 + Math.cos(a2) * 15, -13 + Math.sin(a2) * 15],
                [-9 + Math.cos(a2) * 13, -9 + Math.sin(a2) * 13]], i % 2 ? "#e9e0cc" : "#f6f1e4");
    }
    g.beginPath(); g.ellipse(-1, -13, 12, 10.5, -.12, 0, 7);       // тело
    g.fillStyle = "#f8f3e6"; g.fill(); g.stroke();
    g.beginPath(); g.ellipse(-2, -12, 7, 5, .25, 0, 7);            // крыло
    g.fillStyle = "#ece3d0"; g.fill(); g.stroke();
    g.lineWidth = 1.5; sline(g, -6, -11, 1, -13); sline(g, -6, -9, 1, -11);
    g.strokeStyle = "#e08a2a"; g.lineWidth = 2.2;                  // лапы
    const st = Math.sin(phase * 2) * 3;
    sline(g, -3, -4, -4 + st, 4); sline(g, 3, -4, 4 - st, 4);
    sline(g, -4 + st, 4, -8 + st, 5); sline(g, -4 + st, 4, -6 + st, 6.5);
    sline(g, 4 - st, 4, 8 - st, 5); sline(g, 4 - st, 4, 6 - st, 6.5);
    g.strokeStyle = INK;
    sline(g, 7, -18, 9, -23);                                      // шея
    g.beginPath(); g.ellipse(10, -26, 5.4, 5, .1, 0, 7);           // голова
    g.fillStyle = "#fbf7ec"; g.fill(); g.stroke();
    spoly(g, [[5, -30], [6.5, -35], [8.5, -30.5], [10.5, -36], [12.5, -30.5],
              [14, -34], [14.5, -29]], "#d2412c");                 // гребень
    spoly(g, [[13, -24], [15.5, -30], [16, -23]], "#e08a2a");      // клюв
    spoly(g, [[9, -21], [11.5, -16], [7.5, -19]], "#d2412c");      // бородка
    g.fillStyle = INK; g.beginPath(); g.arc(11.6, -27, 1, 0, 7); g.fill();
    g.restore();

  } else if (type === "mole") {
    if (p && p.state === "down") {
      spoly(g, [[-17, 3], [-9, -9], [9, -9], [17, 3]], "#a98055");     // холмик земли
      g.lineWidth = 1.6;
      sline(g, -8, 1, -4, -4); sline(g, 2, 1, 6, -4); sline(g, -1, 2, 0, -6);
      g.lineWidth = 2.2;
    } else {
      g.save(); g.scale(face, 1);
      g.beginPath(); g.ellipse(-2, -12, 13, 10, -.08, 0, 7);           // тело
      g.fillStyle = "#8d6b4e"; g.fill(); g.stroke();
      g.lineWidth = 2; sline(g, -8, -3, -10, 2); sline(g, -2, -3, -3, 2);
      g.lineWidth = 2.2;
      g.beginPath(); g.ellipse(10, -14, 7, 6.5, .05, 0, 7);            // морда
      g.fillStyle = "#9b7857"; g.fill(); g.stroke();
      spoly(g, [[15, -17], [23, -14], [15, -11]], "#e0a0a0");          // нос-лопатка
      g.fillStyle = INK; g.beginPath(); g.arc(21, -14, 1.1, 0, 7); g.fill();
      g.lineWidth = 1.5;                                               // усы и прищур
      sline(g, 17, -12, 23, -9); sline(g, 17, -11, 23, -7); sline(g, 17, -16, 23, -18);
      g.lineWidth = 1.8; sline(g, 8, -18, 12, -18);
      g.lineWidth = 2.2;
      spoly(g, [[6, -8], [13, -6], [12, 0], [5, -2]], "#7a5b41");      // лапа-копалка
      g.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) sline(g, 12, -5 + i * 2.4, 17, -6 + i * 2.4);
      g.lineWidth = 2.2;
      g.fillStyle = col;                                               // каска по уровню
      g.beginPath(); g.arc(4, -20, 8, Math.PI, 0); g.fill(); g.stroke();
      sline(g, -4, -20, 13, -20);
      if (lvl >= 3) { g.fillStyle = "#f7e08a"; g.beginPath(); g.arc(9, -23, 2.6, 0, 7); g.fill(); g.stroke(); }
      g.restore();
    }
  }
  g.restore();
}

function drawItemIcon(g, key, x, y, sc) {
  g.save(); g.translate(x, y); g.scale(sc, sc);
  g.strokeStyle = INK; g.lineWidth = 2.2; g.lineJoin = "round"; g.lineCap = "round";
  if (key === "nade") {                                   // граната-лимонка
    g.beginPath(); g.ellipse(0, 1, 8, 9, 0, 0, 7);
    g.fillStyle = "#4e8f4a"; g.fill(); g.stroke();
    g.lineWidth = 1.3;
    for (let i = -1; i <= 1; i++) { sline(g, -7, i * 4.5, 7, i * 4.5); sline(g, i * 4.5, -7, i * 4.5, 8); }
    g.lineWidth = 2.2;
    spoly(g, [[-4, -8], [4, -8], [3, -12], [-3, -12]], "#6f6a5a");   // горловина
    sline(g, 3, -12, 8, -6);                                          // рычаг
    g.beginPath(); g.arc(-5, -13, 3, 0, 7); g.stroke();               // кольцо
  } else if (key === "mine") {                            // мина с усиками
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI + i * Math.PI / 5;
      sline(g, Math.cos(a) * 6, Math.sin(a) * 6 - 1, Math.cos(a) * 11, Math.sin(a) * 11 - 2);
    }
    g.beginPath(); g.arc(0, 0, 7.5, 0, 7);
    g.fillStyle = "#c8402c"; g.fill(); g.stroke();
    g.fillStyle = "#ffe0b0"; g.beginPath(); g.arc(0, 0, 2.6, 0, 7); g.fill();
  } else if (key === "ice") {                             // снежинка
    g.strokeStyle = "#3f97bd"; g.lineWidth = 2.4;
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI / 3;
      sline(g, -Math.cos(a) * 10, -Math.sin(a) * 10, Math.cos(a) * 10, Math.sin(a) * 10);
      sline(g, Math.cos(a) * 6, Math.sin(a) * 6, Math.cos(a) * 6 + Math.cos(a + 1) * 4.5, Math.sin(a) * 6 + Math.sin(a + 1) * 4.5);
      sline(g, -Math.cos(a) * 6, -Math.sin(a) * 6, -Math.cos(a) * 6 - Math.cos(a + 1) * 4.5, -Math.sin(a) * 6 - Math.sin(a + 1) * 4.5);
    }
    g.strokeStyle = INK;
  } else {                                                // кристалл опыта
    spoly(g, [[0, -11], [7, -2], [4, 9], [-4, 9], [-7, -2]], "#e8c247");
    g.lineWidth = 1.4;
    sline(g, 0, -11, 0, 9); sline(g, -7, -2, 7, -2);
    g.lineWidth = 2.2;
  }
  g.restore();
}

const CHICK = {
  red:    { body: "#e8907c", shell: "#f0b5a4", accent: "#c8402c" },
  green:  { body: "#a8d69c", shell: "#c2e3b8", accent: "#4e8f4a" },
  yellow: { body: "#f2d472", shell: "#f7e3a0", accent: "#e08a2a" },
};
function drawEgg(g, e) {
  const w = Math.sin(e.wob) * (e.t < 900 ? .16 : .05);
  g.save(); g.translate(e.x, e.y); g.rotate(w);
  const C2 = CHICK[e.kind] || CHICK.yellow;
  g.strokeStyle = INK; g.lineWidth = 2.2; g.fillStyle = C2.shell;
  g.beginPath(); g.ellipse(0, -7, 6, 8, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = C2.accent; g.globalAlpha = .55;             // крапинки
  g.beginPath(); g.arc(-2, -9, 1.2, 0, 7); g.fill();
  g.beginPath(); g.arc(2.4, -6, 1, 0, 7); g.fill();
  g.beginPath(); g.arc(0, -12, .9, 0, 7); g.fill();
  g.globalAlpha = 1;
  if (e.t < 900) { g.lineWidth = 1.6; sline(g, -5, -8, -1, -5); sline(g, -1, -5, 3, -9); }
  g.restore();
}
function drawChick(g, c) {
  const C2 = CHICK[c.kind] || CHICK.yellow;
  const bob = Math.sin(c.phase * 2) * 1.2;
  g.save(); g.translate(c.x, c.y + bob); g.scale(c.face, 1);
  g.strokeStyle = INK; g.lineWidth = 2;
  scircle(g, 0, -8, 6, C2.body);
  scircle(g, 5, -15, 4.2, C2.body);
  spoly(g, [[8, -15], [13, -14], [8, -12.5]], "#e08a2a");
  g.strokeStyle = "#e08a2a"; g.lineWidth = 1.8;
  const sw = Math.sin(c.phase * 2.4) * 2.4;
  sline(g, -2, -2, -2 + sw, 3); sline(g, 2, -2, 2 - sw, 3);
  g.fillStyle = INK; g.beginPath(); g.arc(6.4, -16, .8, 0, 7); g.fill();
  g.strokeStyle = INK; g.lineWidth = 1.8;

  if (c.kind === "red") {                       // фитиль и искра
    sline(g, -3, -13, -6, -19);
    const sp = 1.4 + Math.abs(Math.sin(c.phase * 4)) * 1.6;
    g.fillStyle = "#e08a2a"; g.beginPath(); g.arc(-6, -19, sp, 0, 7); g.fill();
  } else if (c.kind === "green") {              // крестик лекаря
    g.strokeStyle = "#4e8f4a"; g.lineWidth = 2.4;
    sline(g, -2, -8, 2, -8); sline(g, 0, -10, 0, -6);
    g.strokeStyle = INK; g.lineWidth = 1.8;
  } else {                                      // ножик
    const sw2 = c.slash > 0 ? -.9 : 0;
    g.save(); g.translate(7, -8); g.rotate(-.5 + sw2);
    g.fillStyle = "#6b4a2a"; g.fillRect(-1, -1.4, 3.4, 2.8);
    spoly(g, [[2.4, -1.6], [10, -1], [2.4, 1.6]], "#d8dde3");
    g.restore();
    if (c.slash > 0) {
      g.strokeStyle = "#c8402c"; g.lineWidth = 2;
      g.beginPath(); g.arc(11, -9, 7, -.9, .9); g.stroke();
      g.strokeStyle = INK;
    }
  }
  g.restore();
}

function drawTurret(g, tu) {
  g.save(); g.translate(tu.x, tu.y); g.strokeStyle = INK; g.lineWidth = 2.2;
  sline(g, -7, 6, 0, -4); sline(g, 7, 6, 0, -4); sline(g, 0, 8, 0, -4);
  scircle(g, 0, -7, 6, "#c9b48f");
  g.save(); g.rotate(tu.a);
  spoly(g, [[3, -9], [17, -8.6], [17, -5.6], [3, -5]], "#7b6a52");
  g.restore(); g.restore();
}
