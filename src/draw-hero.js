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
    spoly(g, [[2, -4], [L, -3], [L, -.6], [2, .6]], "#c99a27");
    spoly(g, [[-2, -2], [12, -2], [10, 13], [-5, 10]], "#6b4a20");     // золотой приклад
    spoly(g, [[10, -12], [26, -12], [26, -5.4], [10, -5.4]], "#aa7616");// прицел
    scircle(g, 26, -8.7, 3.4, "#9fd6e8");
    g.strokeStyle="#fff0a4"; g.lineWidth = 1.4; sline(g, 12, -8.7, 22, -8.7); g.strokeStyle=INK; g.lineWidth = 2.2;
    spoly(g, [[L - 12, 1], [L - 9, 1], [L - 4, 11], [L - 7, 11]], "#9b741f");  // сошки
    spoly(g, [[L - 12, 1], [L - 9, 1], [L - 16, 11], [L - 19, 11]], "#9b741f");
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

/* Рисует предмет в системе координат конечности: локальный верх направлен
   от кисти/ступни к плечу/бедру. Благодаря этому экипировка не съезжает в
   сложных позах и действительно ощущается надетой на персонажа. */
function onLimb(g, end, root, draw) {
  const a = Math.atan2(root[1] - end[1], root[0] - end[0]) + Math.PI / 2;
  g.save(); g.translate(end[0], end[1]); g.rotate(a); draw(); g.restore();
}

function drawHeroBoot(g, foot, hip, face, level, color, line, detail) {
  onLimb(g, foot, hip, () => {
    g.save(); g.scale(face, 1); g.strokeStyle = INK; g.lineWidth = line;
    const h = [0, 7, 10, 13, 16][level];
    const w = 4.2 + level * .55;
    spoly(g, [[-w, -h], [w, -h + 1], [w + 1, -1], [w + 5 + level, 1],
              [-w - 1, 1]], color);
    g.lineWidth = detail;
    if (level >= 2) { g.strokeStyle = "#efe6d2"; sline(g, -w + 1, -h + 4, w - 1, -h + 4); }
    if (level >= 3) {
      g.strokeStyle = INK; sline(g, -w, -4, w + 2, -3);
      spoly(g, [[-w - 1, -h], [0, -h - 4], [w + 1, -h + 1], [0, -h + 4]], "#efe6d2");
    }
    if (level >= 4) {
      g.fillStyle = "#f2c45e"; g.strokeStyle = INK;
      spoly(g, [[-w, -9], [-w - 7, -12], [-w - 3, -6]], "#f2c45e");
      g.fillStyle = "#fff4c2"; g.beginPath(); g.arc(w + 2, -6, 1.7, 0, 7); g.fill();
    }
    g.restore();
  });
}

function drawHeroGlove(g, hand, shoulder, level, color, line, detail) {
  onLimb(g, hand, shoulder, () => {
    g.strokeStyle = INK; g.lineWidth = line;
    const w = 3.8 + level * .65, h = 5 + level * 1.25;
    spoly(g, [[-w, -h], [w, -h], [w + 1.5, 2], [1.5, 4], [-w - 1, 2]], color);
    if (level >= 2) {
      g.lineWidth = detail; g.strokeStyle = "#efe6d2";
      sline(g, -w + 1, -h + 3, w - 1, -h + 3);
    }
    if (level >= 3) {
      g.strokeStyle = INK; g.lineWidth = detail;
      for (let i = -1; i <= 1; i++) sline(g, i * 2.2, -1, i * 2.5, 2.5);
    }
    if (level >= 4) {
      g.fillStyle = "#fff4c2"; g.beginPath(); g.arc(0, -h + 3.2, 2, 0, 7); g.fill();
      g.strokeStyle = "#e08a2a"; g.lineWidth = detail; g.stroke();
    }
  });
}

/* ── человечек: линии + одежда + ружьё ────────────────────── */
/* Пропорции героя (локальные единицы, ступни на y = 0):
   бедро -18 · плечи -40 · шея -44 · голова -52, r 8.5
   Толщина линий задаёт иерархию: скелет 3.0, одежда 2.2, мелочи 1.4 —
   иначе всё сливается в кашу.                                        */
/* pose — необязательный набор точек, которым можно полностью
   переопределить позу. Нужен для ульты: там свои ключевые кадры. */
function drawHero(g, x, y, face, phase, gear, sc, aim, muzzle, pose, bold) {
  const sw = Math.sin(phase) * .6;
  const D = {
    lf: [sw * 11, -2], lb: [-sw * 11, -2],      // ступни
    af: [11, -27], ab: [-10, -26 + sw * 4],     // кисти
    hip: -18, neck: -40, head: [0, -52],
    gunAt: [2, -27], lean: 0, squash: 1,
  };
  const Q = pose ? Object.assign({}, D, pose) : D;
  g.save();
  g.translate(x, y);
  g.scale(sc, sc);
  if (Q.lean || Q.squash !== 1) {
    // Вращаем и сжимаем уже в локальных координатах героя, вокруг ступней.
    // Если сделать это до translate(x, y), наклон поворачивает координаты всего
    // мира и визуально уносит персонажа от его настоящей позиции.
    g.rotate(Q.lean); g.scale(1, Q.squash);
  }
  g.lineCap = "round"; g.lineJoin = "round";
  const C = l => TIER[Math.min(4, l)];
  const B = bold || 1;
  const SK = 3.0 * B, CL = 2.2 * Math.min(B, 1.7), DT = 1.4 * Math.min(B, 1.4);

  // Тень под ногами — привязывает фигуру к земле.
  if (!gear._noShadow) {
    g.globalAlpha = .13; g.fillStyle = INK;
    g.beginPath(); g.ellipse(0, 1, 13, 3.6, 0, 0, 7); g.fill(); g.globalAlpha = 1;
  }

  /* ── ПЛАЩ / ШАРФ: крепится к плечам и реагирует на движение ── */
  if (gear.cape) {
    const L = gear.cape, top = Q.neck + 1, bottom = Q.hip + 7 + L * 4;
    const wind = Math.sin(phase * .55) * 2.4 - (Q.lean || 0) * 14;
    g.save(); g.scale(face, 1); g.strokeStyle = INK; g.lineWidth = CL;
    if (L === 1) {
      g.beginPath(); g.moveTo(-3, top); g.quadraticCurveTo(-13, top + 1 + wind, -22, top + 8 + wind);
      g.lineTo(-17, top + 12 + wind); g.quadraticCurveTo(-9, top + 8, 3, top + 4);
      g.closePath(); g.fillStyle = C(L); g.fill(); g.stroke();
    } else {
      g.beginPath(); g.moveTo(-6, top); g.quadraticCurveTo(-18 - L * 2, top + 8 + wind, -22 - L * 3, bottom + wind);
      if (L >= 3) { g.lineTo(-14, bottom - 6 + wind); g.lineTo(-9, bottom + 2 + wind); }
      g.quadraticCurveTo(-1, bottom - 3, 6, Q.hip - 1); g.lineTo(5, top + 4); g.closePath();
      g.fillStyle = C(L); g.fill(); g.stroke();
      g.lineWidth = DT; g.strokeStyle = L >= 3 ? "#f2c45e" : "#efe6d2";
      g.beginPath(); g.moveTo(-5, top + 4); g.quadraticCurveTo(-13, top + 12 + wind, -17 - L * 2, bottom - 3 + wind); g.stroke();
      if (L >= 3) { g.beginPath(); g.moveTo(-1, top + 2); g.lineTo(5, top + 7); g.stroke(); }
    }
    g.restore();
  }

  /* ── НОГИ и сапоги, привязанные к каждой ступне ── */
  g.strokeStyle = INK; g.lineWidth = gear._chem ? 8 : SK;
  sline(g, 0, Q.hip, Q.lb[0], Q.lb[1]); sline(g, 0, Q.hip, Q.lf[0], Q.lf[1]);
  if (gear._chem) {
    g.strokeStyle = "#c7d86c"; g.lineWidth = 4.8;
    sline(g, 0, Q.hip, Q.lb[0], Q.lb[1]); sline(g, 0, Q.hip, Q.lf[0], Q.lf[1]);
  }
  if (gear.boots) {
    drawHeroBoot(g, Q.lb, [0, Q.hip], face, gear.boots, C(gear.boots), CL, DT);
    drawHeroBoot(g, Q.lf, [0, Q.hip], face, gear.boots, C(gear.boots), CL, DT);
  }

  /* ── ТОРС и новая посадка куртки ── */
  g.strokeStyle = INK; g.lineWidth = SK; sline(g, 0, Q.hip, 0, Q.neck);
  if (gear.jacket) {
    const L = gear.jacket, top = Q.neck + 2, bottom = Q.hip + 1;
    g.save(); g.scale(face, 1); g.strokeStyle = INK; g.lineWidth = CL;
    if (L === 1) {                                      // приталенный жилет
      spoly(g, [[-7.5, top], [7.5, top], [6, bottom], [-6, bottom]], C(L));
      spoly(g, [[-4.5, top], [0, top + 7], [4.5, top]], PAPER);
      g.lineWidth = DT; sline(g, 0, top + 7, 0, bottom - 1);
    } else if (L === 2) {                               // длинная куртка с лацканами
      spoly(g, [[-9, top], [9, top], [7.2, bottom + 8], [1, bottom + 4],
                [0, bottom + 9], [-7.2, bottom + 8]], C(L));
      spoly(g, [[-8, top + 1], [-2, top], [-5, top + 9], [0, top + 6]], "#efe6d2");
      spoly(g, [[8, top + 1], [2, top], [5, top + 9], [0, top + 6]], "#efe6d2");
      g.fillStyle = "#efe6d2"; g.beginPath(); g.arc(0, top + 12, 1.4, 0, 7); g.fill();
    } else {                                            // цельная бронекуртка
      spoly(g, [[-10, top + 2], [-6, top - 2], [6, top - 2], [10, top + 2],
                [7.5, bottom], [0, bottom + 3], [-7.5, bottom]], C(L));
      spoly(g, [[-5.5, top + 2], [0, top + 6], [5.5, top + 2], [4, bottom - 2],
                [0, bottom + 1], [-4, bottom - 2]], "#6f5aa3");
      g.lineWidth = DT; g.strokeStyle = "#efe6d2";
      sline(g, -5, top + 10, 5, top + 10); sline(g, 0, top + 6, 0, bottom);
      g.strokeStyle = INK; g.lineWidth = CL;
      scircle(g, -10, top + 3, 4.8, C(L)); scircle(g, 10, top + 3, 4.8, C(L));
    }
    g.restore();
  }
  if (gear._chem) {                                    // герметичный комбинезон поверх одежды
    g.save(); g.scale(face, 1); g.strokeStyle = INK; g.lineWidth = CL;
    spoly(g, [[-10,Q.neck+1],[10,Q.neck+1],[8,Q.hip+3],[0,Q.hip+6],[-8,Q.hip+3]], "#c7d86c");
    g.strokeStyle = "#eef4ae"; g.lineWidth = DT; sline(g, 0, Q.neck+4, 0, Q.hip+2);
    spoly(g, [[3,Q.neck+7],[8,Q.neck+8],[7,Q.neck+15],[3,Q.neck+14]], "#728d50");
    g.restore();
  }

  /* ── РЕМЕНЬ И ПОДСУМКИ ── */
  if (gear.clip) {
    const L = gear.clip, by = Q.hip - 1;
    g.save(); g.scale(face, 1); g.strokeStyle = "#6b4a2a"; g.lineWidth = 3.2;
    sline(g, -8, by, 8, by); g.strokeStyle = INK; g.lineWidth = CL;
    const slots = L === 1 ? [-5] : L === 2 ? [-6, 2] : [-8, 0, 8];
    for (const px of slots) {
      spoly(g, [[px - 3.2, by - 1], [px + 3.2, by - 1], [px + 2.7, by + 7], [px - 2.7, by + 7]], C(L));
      g.lineWidth = DT; g.strokeStyle = "#efe6d2"; sline(g, px - 2, by + 1.5, px + 2, by + 1.5);
      g.lineWidth = CL; g.strokeStyle = INK;
    }
    if (L >= 3) scircle(g, 0, by, 2.4, "#f2c45e");
    g.restore();
  }

  /* ── ЗАДНЯЯ РУКА И ПЕРЧАТКА ── */
  g.save(); g.scale(face, 1); g.strokeStyle = INK; g.lineWidth = gear._chem ? 8 : SK;
  sline(g, 0, Q.neck + 2, Q.ab[0], Q.ab[1]);
  if (gear._chem) { g.strokeStyle = "#c7d86c"; g.lineWidth = 4.8; sline(g, 0, Q.neck + 2, Q.ab[0], Q.ab[1]); }
  if (gear.gloves) drawHeroGlove(g, Q.ab, [0, Q.neck + 2], gear.gloves, C(gear.gloves), CL, DT);
  g.restore();

  /* ── ОРУЖИЕ ── */
  // Точка крепления зеркалится вместе с телом, затем оружие чуть выносится
  // по направлению прицела. При взгляде влево зеркалим модель после поворота
  // на aim + PI: ствол смотрит в цель, но рукоять не переворачивается вверх.
  const gunPush = gear.jacket ? 6.5 : 3.5;
  const gunX = Q.gunAt[0] * face + Math.cos(aim) * gunPush;
  const gunY = Q.gunAt[1] + Math.sin(aim) * gunPush;
  g.save(); g.translate(gunX, gunY); g.rotate(face > 0 ? aim : aim + Math.PI);
  g.scale(face * 1.3, 1.3); drawGunModel(g, gear.gun || 0, muzzle, gear._w); g.restore();

  /* ── ПЕРЕДНЯЯ РУКА И ПЕРЧАТКА ── */
  g.save(); g.scale(face, 1); g.strokeStyle = INK; g.lineWidth = gear._chem ? 8 : SK;
  sline(g, 0, Q.neck + 2, Q.af[0], Q.af[1]);
  if (gear._chem) { g.strokeStyle = "#c7d86c"; g.lineWidth = 4.8; sline(g, 0, Q.neck + 2, Q.af[0], Q.af[1]); }
  if (gear.gloves) drawHeroGlove(g, Q.af, [0, Q.neck + 2], gear.gloves, C(gear.gloves), CL, DT);
  g.restore();

  /* ── ГОЛОВА, ОПТИКА И ШЛЕМ ── */
  g.strokeStyle = INK; g.lineWidth = SK; sline(g, 0, Q.neck, 0, Q.neck - 4);
  scircle(g, Q.head[0], Q.head[1], 8.5, PAPER);
  if (gear.helm < 3) {
    g.fillStyle = INK; g.beginPath(); g.arc(Q.head[0] + face * 3, Q.head[1] - 1.5, 1.25, 0, 7); g.fill();
  }
  g.save(); g.translate(Q.head[0], Q.head[1]); g.scale(face, 1);

  if (gear.scope && gear.helm < 3) {
    const L = gear.scope; g.strokeStyle = INK; g.lineWidth = CL;
    if (L === 1) {                                      // лёгкие очки
      scircle(g, -3.5, -1.2, 3.1, "#d9eef5"); scircle(g, 3.8, -1.2, 3.1, "#d9eef5");
      g.lineWidth = DT; sline(g, -.4, -1.5, .8, -1.5); sline(g, 6.8, -1.4, 10, -2.5);
    } else if (L === 2) {                               // цельный тактический визор
      spoly(g, [[-9, -4], [9.5, -3], [8, 2.3], [-8.5, 1.5]], "#76b8d5");
      g.lineWidth = DT; g.strokeStyle = "#e9f8ff"; sline(g, -6, -2.5, 3, -1.8);
    } else {                                            // энергетическая оптика
      spoly(g, [[-10, -4.5], [10.5, -3], [8.5, 2.8], [-9, 1.8]], C(L));
      g.lineWidth = DT; g.strokeStyle = "#f2d9ff"; sline(g, -7, -2.5, 4, -1.5);
      g.strokeStyle = INK; scircle(g, 10, -1, 2.5, "#9fd6e8");
    }
  }

  if (gear.helm) {
    const L = gear.helm; g.strokeStyle = INK; g.lineWidth = CL;
    if (L === 1) {                                      // лёгкий открытый шлем
      g.beginPath(); g.moveTo(-8.4, -1);
      g.quadraticCurveTo(-7, -8.5, 0, -9.4);
      g.quadraticCurveTo(7.2, -8.4, 8.8, -1);
      g.lineTo(6.3, .8); g.lineTo(-7, .8); g.closePath();
      g.fillStyle = C(L); g.fill(); g.stroke();
      spoly(g, [[1, -1.3], [12.5, -.4], [7.5, 1.8], [1, 1]], "#6fa66a");
      spoly(g, [[-8, -.5], [-5.7, .2], [-5.5, 5.4], [-8.5, 3.8]], C(L));
      g.lineWidth = DT; g.strokeStyle = "#dcebd7"; sline(g, -5.5, -5.8, 3.5, -7.1);
      g.fillStyle = "#e8c66a"; scircle(g, -6.7, -.8, 1.5, "#e8c66a");
    } else if (L === 2) {                               // рейнджерский шлем
      g.beginPath(); g.arc(0, 0, 9.8, Math.PI, .08); g.lineTo(8.5, 4); g.lineTo(-8.5, 4); g.closePath();
      g.fillStyle = C(L); g.fill(); g.stroke();
      spoly(g, [[-10, -1], [11, -1], [9, 2], [-9, 2]], "#5f91c9");
      g.lineWidth = DT; g.strokeStyle = "#dfeaf0"; sline(g, -5, -6.5, 4, -6.5);
    } else {                                            // закрытый рыцарский шлем
      g.beginPath(); g.arc(0, 0, 10.2, Math.PI, .12); g.lineTo(8.5, 7); g.lineTo(2.5, 5);
      g.lineTo(0, 8); g.lineTo(-8.5, 6); g.closePath(); g.fillStyle = C(L); g.fill(); g.stroke();
      spoly(g, [[-8.5, -2], [9.5, -2], [8, 2.5], [-8, 2]], "#342f38");
      g.strokeStyle = "#efe6d2"; g.lineWidth = DT; sline(g, -5.5, -.8, 4, -.8);
      spoly(g, [[1, 1], [5, 1], [4.5, 8], [1.5, 8]], C(L));
      if (L >= 4) {
        g.strokeStyle = INK; g.lineWidth = CL;
        spoly(g, [[-2, -10], [0, -17], [3, -10], [8, -15], [6, -7], [-5, -7]], "#e08a2a");
        g.fillStyle = "#fff4c2"; g.beginPath(); g.arc(0, -9, 2, 0, 7); g.fill();
      }
    }
  }
  if (gear._chem) {                                    // капюшон и стекло противогаза
    g.strokeStyle = INK; g.lineWidth = CL;
    scircle(g, 0, 0, 11.5, "#c7d86c");
    spoly(g, [[-7,-5],[8,-4],[8,2],[-7,2]], "#577879");
    g.strokeStyle = "#dff4e9"; g.lineWidth = DT; sline(g, -5, -3.5, 4, -2.8);
    scircle(g, 7, 5, 4.2, "#59784b");
    g.strokeStyle = "#e8ef9d"; g.lineWidth = 1.2; sline(g, 5, 4, 9, 6); sline(g, 9, 4, 5, 6);
  }
  g.restore();
  g.restore();
}
