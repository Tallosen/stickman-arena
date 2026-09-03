"use strict";
/* draw-hero.js — модели оружия и послойная одежда героя */

/* ── пять моделей оружия ──────────────────────────────────── */
function drawGunModel(g, lv, muzzle, type) {
  if (type && type !== "basic") return drawRareGun(g, lv, muzzle, type);
  return drawBasicGun(g, lv, muzzle);
}

function drawRareGun(g, lv, muzzle, type) {
  g.strokeStyle = INK; g.lineWidth = 2.2; g.lineCap = "round"; g.lineJoin = "round";
  let tip = 26;
  if (type === "shotgun") {
    const L = 24 + lv * 2.5;
    spoly(g, [[2, -6], [L, -6], [L, -2.6], [2, -2.6]], "#6f7a82");     // верхний ствол
    spoly(g, [[2, -2.4], [L, -2.4], [L, 1], [2, 1]], "#6f7a82");       // нижний
    spoly(g, [[-1, -2], [11, -2], [9, 12], [-4, 9]], "#7a5330");       // приклад
    spoly(g, [[12, 1], [21, 1], [21, 4.6], [12, 4.6]], "#8a6238");     // цевьё
    g.lineWidth = 1.4; sline(g, 14, 2.8, 19, 2.8); g.lineWidth = 2.2;
    tip = L;
  } else if (type === "sniper") {
    const L = 40 + lv * 3.5;
    spoly(g, [[2, -4], [L, -3], [L, -.6], [2, .6]], "#5b636a");
    spoly(g, [[-2, -2], [12, -2], [10, 13], [-5, 10]], "#3f3a34");     // приклад
    spoly(g, [[10, -12], [26, -12], [26, -5.4], [10, -5.4]], "#2f2c28");// прицел
    scircle(g, 26, -8.7, 3.4, "#9fd6e8");
    g.lineWidth = 1.4; sline(g, 12, -8.7, 22, -8.7); g.lineWidth = 2.2;
    spoly(g, [[L - 12, 1], [L - 9, 1], [L - 4, 11], [L - 7, 11]], "#4a4a52");  // сошки
    spoly(g, [[L - 12, 1], [L - 9, 1], [L - 16, 11], [L - 19, 11]], "#4a4a52");
    tip = L;
  } else {
    const L = 26 + lv * 2;
    spoly(g, [[-2, -3], [10, -3], [9, 12], [-5, 9]], "#3f3a34");       // корпус
    spoly(g, [[8, 2], [19, 2], [19, 12], [8, 12]], "#5d666d");         // короб
    // блок стволов: сами стволы всегда горизонтальны, по кругу ходит
    // только их смещение и «глубина» — иначе выглядит как крутящееся солнце
    const sp = P.spin || 0, bars = [];
    for (let i = 0; i < 4; i++) {
      const a = sp + i * Math.PI / 2;
      const depth = (Math.cos(a) + 1) / 2;                // 0 — дальний, 1 — ближний
      bars.push({ oy: Math.sin(a) * 3.8, depth });
    }
    bars.sort((a, b) => a.depth - b.depth);               // дальние рисуем первыми
    for (const b of bars) {
      const th = 1.15 + b.depth * 1.15;
      const shade = b.depth > .55 ? "#a3acb3" : b.depth > .25 ? "#7b848b" : "#5f686e";
      g.save(); g.translate(12, -3);
      spoly(g, [[0, b.oy - th], [L, b.oy - th], [L, b.oy + th], [0, b.oy + th]], shade);
      g.restore();
    }
    scircle(g, 12, -3, 5.2, "#5d666d");
    tip = L + 12;
  }
  if (muzzle > 0) {
    g.strokeStyle = "#e08a2a"; g.lineWidth = 2.6;
    const n = type === "shotgun" ? 5 : 3;
    for (let i = 0; i < n; i++)
      sline(g, tip, -2, tip + 11 + lv * 2, -2 + (i - (n - 1) / 2) * (5 + lv));
    g.strokeStyle = INK; g.lineWidth = 2.2;
  }
}

function drawBasicGun(g, lv, muzzle) {
  g.strokeStyle = INK; g.lineWidth = 2.2; g.lineCap = "round"; g.lineJoin = "round";
  let tip = 20;
  if (lv === 0) {                                   // пистолет
    spoly(g, [[2, -4], [16, -4], [16, -.5], [2, 0]], "#9a8f82");
    spoly(g, [[3, 0], [8, 0], [7, 8], [2, 7]], "#6b4a2a");
    tip = 16;
  } else if (lv === 1) {                            // обрез, два ствола
    spoly(g, [[2, -5], [22, -5], [22, -2.6], [2, -2]], "#7f8a92");
    spoly(g, [[2, -2], [22, -1.6], [22, .8], [2, 1.4]], "#7f8a92");
    spoly(g, [[1, 1], [9, 1.4], [7, 10], [0, 8]], "#7a5330");
    tip = 22;
  } else if (lv === 2) {                            // винтовка с прицелом
    spoly(g, [[2, -4], [30, -3.4], [30, -1], [2, 1]], "#6f7a82");
    spoly(g, [[0, -2], [10, -2], [9, 9], [-2, 7]], "#7a5330");
    spoly(g, [[12, -8], [22, -8], [22, -4], [12, -4]], "#3d3a36");
    sline(g, 24, -2, 30, -2);
    tip = 30;
  } else if (lv === 3) {                            // тяжёлый автомат
    spoly(g, [[2, -5], [34, -4], [34, -1], [2, 1.5]], "#5d666d");
    spoly(g, [[0, -3], [12, -3], [11, 10], [-3, 8]], "#3f3a34");
    spoly(g, [[9, 1], [16, 1], [15, 13], [8, 12]], "#3f3a34");   // магазин
    spoly(g, [[14, -9], [24, -9], [24, -4.5], [14, -4.5]], "#2f2c28");
    sline(g, 26, -5, 33, -5);
    tip = 34;
  } else {                                          // плазменная пушка
    spoly(g, [[2, -7], [26, -6], [26, 1], [2, 3]], "#4a5a66");
    spoly(g, [[26, -9], [38, -12], [38, 6], [26, 4]], "#7fc7e0");   // раструб
    spoly(g, [[0, -4], [13, -4], [12, 12], [-4, 9]], "#3f3a34");
    for (let i = 0; i < 3; i++) { g.strokeStyle = "#e08a2a"; sline(g, 8 + i * 6, -8, 8 + i * 6, 4); }
    g.strokeStyle = INK;
    tip = 38;
  }
  if (muzzle > 0) {
    g.strokeStyle = "#e08a2a"; g.lineWidth = 2.4;
    for (let i = -1; i <= 1; i++) sline(g, tip, -2, tip + 10 + lv * 2, -2 + i * (6 + lv));
    g.strokeStyle = INK; g.lineWidth = 2.2;
  }
}

/* ── человечек: линии + одежда + ружьё ────────────────────── */
/* Пропорции героя (локальные единицы, ступни на y = 0):
   бедро -18 · плечи -40 · шея -44 · голова -52, r 8.5
   Толщина линий задаёт иерархию: скелет 3.0, одежда 2.2, мелочи 1.4 —
   иначе всё сливается в кашу.                                        */
function drawHero(g, x, y, face, phase, gear, sc, aim, muzzle) {
  const sw = Math.sin(phase) * .6;
  g.save(); g.translate(x, y); g.scale(sc, sc);
  g.lineCap = "round"; g.lineJoin = "round";
  const C = l => TIER[Math.min(4, l)];
  const SK = 3.0, CL = 2.2, DT = 1.4;

  // тень под ногами — привязывает фигуру к земле
  g.globalAlpha = .13; g.fillStyle = INK;
  g.beginPath(); g.ellipse(0, 1, 13, 3.6, 0, 0, 7); g.fill();
  g.globalAlpha = 1;

  /* ── ПЛАЩ ── */
  if (gear.cape) {
    const L = gear.cape;
    g.save(); g.scale(face, 1); g.strokeStyle = INK; g.lineWidth = CL;
    if (L === 1) spoly(g, [[-3, -42], [-17, -12], [4, -15]], C(L));
    else if (L === 2) {
      spoly(g, [[-3, -43], [-22, -3], [5, -12]], C(L));
      g.lineWidth = DT; sline(g, -9, -30, -14, -10);
    } else {
      spoly(g, [[-3, -44], [-26, 3], [-18, -2], [-22, 4], [-12, -4], [-15, 3], [5, -12]], C(L));
      g.lineWidth = DT; sline(g, -9, -32, -16, -8); sline(g, -15, -26, -21, -4);
    }
    g.restore();
  }

  /* ── НОГИ ── */
  g.strokeStyle = INK; g.lineWidth = SK;
  sline(g, 0, -18, sw * 11, -2); sline(g, 0, -18, -sw * 11, -2);

  /* ── ОБУВЬ ── */
  if (gear.boots) {
    const L = gear.boots;
    g.save(); g.scale(face, 1); g.lineWidth = CL;
    for (const d of [1, -1]) {
      g.save(); g.translate(d * sw * 11, -2);
      if (L === 1) spoly(g, [[-4, -5], [4, -5], [5.5, 1], [-4, 1]], C(L));
      else if (L === 2) {
        spoly(g, [[-4, -12], [4, -12], [5.5, 1], [-4, 1]], C(L));
        g.lineWidth = DT; sline(g, -4, -8, 4, -8); g.lineWidth = CL;
      } else if (L === 3) {
        spoly(g, [[-4.5, -15], [5, -15], [6, 1], [-4.5, 1]], C(L));
        g.lineWidth = DT; sline(g, -4.5, -11, 5, -11); sline(g, -4.5, -6, 5.5, -6); g.lineWidth = CL;
      } else {
        spoly(g, [[-5, -18], [5.5, -18], [6.5, 1], [-5, 1]], C(L));
        g.lineWidth = DT; sline(g, -5, -13, 5.5, -13); sline(g, -5, -7, 6, -7); g.lineWidth = CL;
        spoly(g, [[6.5, -3], [11, -1], [6.5, 1]], C(L));
      }
      g.restore();
    }
    g.restore();
  }

  /* ── ТОРС ── */
  g.strokeStyle = INK; g.lineWidth = SK;
  sline(g, 0, -18, 0, -40);

  /* ── КУРТКА ── */
  if (gear.jacket) {
    const L = gear.jacket;
    g.save(); g.scale(face, 1); g.lineWidth = CL;
    if (L === 1) {
      spoly(g, [[-8, -39], [8, -39], [7, -19], [-7, -19]], C(L));
      spoly(g, [[-4, -39], [0, -31], [4, -39]], PAPER);
    } else if (L === 2) {
      spoly(g, [[-9, -39], [9, -39], [7.5, -18], [-7.5, -18]], C(L));
      spoly(g, [[-9, -39], [-2.5, -39], [-5, -31]], "#efe6d2");
      spoly(g, [[9, -39], [2.5, -39], [5, -31]], "#efe6d2");
      g.fillStyle = "#efe6d2";
      for (let i = 0; i < 2; i++) { g.beginPath(); g.arc(0, -30 + i * 6, 1.5, 0, 7); g.fill(); }
    } else {
      spoly(g, [[-9.5, -39], [9.5, -39], [8, -18], [-8, -18]], C(L));
      g.lineWidth = DT; sline(g, -8, -30, 8, -30); sline(g, 0, -39, 0, -18); g.lineWidth = CL;
      scircle(g, -11, -37, 5.4, C(L)); scircle(g, 11, -37, 5.4, C(L));
    }
    g.restore();
  }

  /* ── ПОЯС ── */
  if (gear.clip) {
    const L = gear.clip;
    g.save(); g.scale(face, 1);
    g.strokeStyle = "#6b4a2a"; g.lineWidth = 3; sline(g, -8, -19, 8, -19);
    g.strokeStyle = INK; g.lineWidth = CL;
    for (let i = 0; i < L; i++)
      spoly(g, [[-8 + i * 6, -18.5], [-3.4 + i * 6, -18.5], [-3.4 + i * 6, -11.5], [-8 + i * 6, -11.5]], C(L));
    g.restore();
  }

  /* ── ЗАДНЯЯ РУКА ── */
  g.save(); g.scale(face, 1);
  g.strokeStyle = INK; g.lineWidth = SK;
  sline(g, 0, -38, -10, -26 + sw * 4);
  if (gear.gloves) {
    g.lineWidth = gear.gloves >= 3 ? 7 : 5.6; g.strokeStyle = C(gear.gloves);
    sline(g, -8, -28 + sw * 4, -10.5, -25.5 + sw * 4);
  }
  g.restore();

  /* ── РУЖЬЁ ── */
  g.save(); g.translate(2, -27); g.rotate(face > 0 ? aim : Math.PI - aim);
  g.scale(face * 1.3, 1.3);
  drawGunModel(g, gear.gun || 0, muzzle, gear._w);
  g.restore();

  /* ── ПЕРЕДНЯЯ РУКА ── */
  g.save(); g.scale(face, 1);
  g.strokeStyle = INK; g.lineWidth = SK;
  sline(g, 0, -38, 11, -27);
  if (gear.gloves) {
    const L = gear.gloves;
    g.lineWidth = L >= 3 ? 7 : 5.6; g.strokeStyle = C(L);
    sline(g, 8.5, -29, 12, -26.5);
    if (L >= 3) {
      g.lineWidth = DT; g.strokeStyle = INK;
      sline(g, 7, -31.5, 9.5, -34); sline(g, 9.5, -34, 12, -31.5);
    }
    if (L >= 4) { g.fillStyle = "#efe6d2"; g.beginPath(); g.arc(11, -29, 1.5, 0, 7); g.fill(); }
  }
  g.restore();

  /* ── ШЕЯ и ГОЛОВА ── */
  g.strokeStyle = INK; g.lineWidth = SK;
  sline(g, 0, -40, 0, -44);
  g.fillStyle = PAPER; scircle(g, 0, -52, 8.5, PAPER);
  g.fillStyle = INK;
  g.beginPath(); g.arc(face * 3, -53.5, 1.25, 0, 7); g.fill();

  const fullHelm = gear.helm >= 3;

  /* ── ОЧКИ ── */
  if (gear.scope && !fullHelm) {
    const L = gear.scope;
    g.save(); g.scale(face, 1); g.strokeStyle = INK;
    if (L === 1) {
      g.lineWidth = DT + .3;
      scircle(g, -3.6, -53.5, 3.2, "#dfeaf0"); scircle(g, 4.2, -53.5, 3.2, "#dfeaf0");
      sline(g, -.4, -54, 1, -54); sline(g, 7.4, -54.4, 10, -55.6);
    } else {
      g.lineWidth = CL;
      spoly(g, [[-9, -56.5], [9, -55.5], [8.4, -50], [-8.4, -51]], C(L));
      g.lineWidth = DT; g.strokeStyle = "#efe6d2"; sline(g, -6, -54.6, 2, -53.6); g.strokeStyle = INK;
      if (L >= 3) { sline(g, -9, -54, -13, -53.4); sline(g, 9, -53, 13, -52.4); }
    }
    g.restore();
  }

  /* ── ГОЛОВНОЙ УБОР ── */
  if (gear.helm) {
    const L = gear.helm;
    g.save(); g.scale(face, 1); g.strokeStyle = INK; g.lineWidth = CL;
    if (L === 1) {
      g.beginPath(); g.arc(0, -56, 8.7, Math.PI, 0); g.fillStyle = C(L); g.fill(); g.stroke();
      spoly(g, [[1, -57], [15, -55], [1, -53]], C(L));
    } else if (L === 2) {
      g.beginPath(); g.arc(0, -56, 9.4, Math.PI, 0); g.fillStyle = C(L); g.fill(); g.stroke();
      spoly(g, [[-11.5, -56], [11.5, -56], [10.6, -52.4], [-10.6, -52.4]], C(L));
    } else {
      g.beginPath(); g.arc(0, -55.5, 9.8, Math.PI, .18); g.fillStyle = C(L); g.fill(); g.stroke();
      spoly(g, [[-12, -55.5], [12, -55.5], [11, -51.6], [-11, -51.6]], C(L));
      spoly(g, [[2, -55], [6, -55], [5.4, -44], [2.6, -44]], C(L));      // наносник
      if (L >= 4) {
        g.fillStyle = "#c8402c";                                          // плюмаж
        g.beginPath(); g.moveTo(-1, -65);
        g.bezierCurveTo(-13, -70, -17, -56, -11, -51);
        g.bezierCurveTo(-11, -60, -6, -63, -1, -65);
        g.closePath(); g.fill(); g.stroke();
        g.fillStyle = "#efe6d2"; scircle(g, 0, -64, 2.6, "#efe6d2");
      }
    }
    g.restore();
  }
  g.restore();
}
