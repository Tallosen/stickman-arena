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

function drawEnemyIntent(g,e){
  if(e.hp<=0)return;
  if(e.kind==='pyro'&&e.attackState==='windup'&&e.fireAim){drawFireMarker(g,e.fireAim.x,e.fireAim.y,40,1-e.attackT/950);return;}
  if(e.kind==='drummer'){
    g.save();g.globalAlpha=.12;g.strokeStyle='#9b4a3d';g.lineWidth=1.5;g.setLineDash([3,14]);
    g.beginPath();g.arc(e.x,e.y,180,0,7);g.stroke();g.setLineDash([]);
    g.globalAlpha=.4;g.beginPath();g.ellipse(e.x,e.y,24+Math.sin(e.phase*2)*3,12,0,0,7);g.stroke();g.restore();
  }
  if(e.kind!=='dasher'||e.attackState!=='windup'||e.hp<=0)return;
  const a=e.dashAngle,L=e.dashLength||150,u=1-Math.max(0,e.attackT)/750;
  g.save();g.translate(e.x,e.y);g.rotate(a);g.strokeStyle='#bd482f';g.lineWidth=2;
  g.globalAlpha=.35+u*.4;g.setLineDash([7,5]);g.beginPath();g.moveTo(12,0);g.lineTo(L,0);g.stroke();g.setLineDash([]);
  g.beginPath();g.moveTo(L-10,-6);g.lineTo(L,0);g.lineTo(L-10,6);g.stroke();
  g.lineWidth=2.5;g.beginPath();g.arc(0,0,e.r+6,-Math.PI/2,-Math.PI/2+u*Math.PI*2);g.stroke();g.restore();
}
function drawFoe(g, x, y, face, phase, sc, col, kind, rot, flinch, detail) {
  const sw = Math.sin(phase) * .6;
  g.save(); g.translate(x, y);
  if (rot) g.rotate(rot);
  const f = Math.max(0, flinch || 0);                // сжимается от попадания
  g.scale(sc * (1 + f * .22), sc * (1 - f * .16));
  g.strokeStyle = col; g.lineWidth = 2.4; g.lineCap = "round"; g.lineJoin = "round";

  if(kind==='pyro'||kind==='drummer'){
    g.save();g.scale(face,1);g.lineWidth=2.7;
    sline(g,0,-11,sw*8,2);sline(g,0,-11,-sw*8,2);sline(g,0,-11,0,-25);
    scircle(g,0,-31,5.8,PAPER);
    if(kind==='pyro'){
      // Hood, soot mask, fire pot and a raised throwing hand — still a red stickman.
      spoly(g,[[-7,-29],[-7,-36],[-1,-41],[6,-36],[7,-29],[3,-34],[-3,-34]],'#b65139');
      g.lineWidth=1.4;spoly(g,[[-4,-29],[5,-29],[3,-25],[-3,-25]],'#6e5142');
      g.fillStyle=col;g.beginPath();g.arc(2,-32,1,0,7);g.fill();
      g.lineWidth=2.2;sline(g,0,-23,-10,-18);sline(g,-10,-18,-11,-11);
      spoly(g,[[-17,-18],[-8,-18],[-7,-7],[-16,-7]],'#b27440');
      const lifted=detail?.attackState==='windup',yy=lifted?-33:-19;
      sline(g,1,-23,10,yy);sline(g,10,yy,13,yy-3);
      g.strokeStyle='#ac512b';g.lineWidth=1.2;
      spoly(g,[[10,yy-4],[9,yy-9],[13,yy-15],[14,yy-10],[17,yy-7],[16,yy-3]],'#ec9b3e');
      g.strokeStyle='#f8db81';sline(g,13,yy-5,13,yy-9);
    }else{
      spoly(g,[[-6,-35],[-6,-40],[6,-40],[6,-35]],'#9e4437');
      g.lineWidth=1.3;sline(g,-6,-36,6,-36);g.fillStyle=col;g.beginPath();g.arc(2,-32,1,0,7);g.fill();
      g.strokeStyle='#974638';sline(g,-9,-15,-9,-47);
      spoly(g,[[-9,-47],[5,-45],[2,-40],[5,-37],[-9,-39]],'#cc6650');
      g.strokeStyle=col;g.lineWidth=2.2;
      const beat=Math.sin(phase*2.5)*3;
      sline(g,0,-24,-10,-24+beat);sline(g,0,-24,10,-24-beat);
      g.strokeStyle='#805c39';g.lineWidth=1.5;sline(g,-10,-24+beat,-5,-15);sline(g,10,-24-beat,4,-15);
      g.strokeStyle=col;g.lineWidth=1.7;
      spoly(g,[[-9,-17],[9,-17],[8,-7],[-8,-7]],'#c88154');
      g.beginPath();g.ellipse(0,-17,9,4,0,0,7);g.fillStyle='#f0dbab';g.fill();g.stroke();
      g.lineWidth=1;sline(g,-6,-14,-3,-8);sline(g,6,-14,3,-8);
    }g.restore();
  } else if (kind === "runner"||kind==='dasher') {
    // бегун: наклон вперёд, руки назад, частый шаг
    g.save(); g.scale(face, 1); g.rotate(-.20);
    const f = Math.sin(phase * 1.55) * .85;
    sline(g, 0, -11, f * 11, 2); sline(g, 0, -11, -f * 11, 2);
    sline(g, 0, -11, 0, -24);
    sline(g, 0, -21, -10, -14 + f * 4);
    sline(g, 0, -21, -8, -25 - f * 3);
    g.fillStyle = PAPER; scircle(g, 2, -29, 5.2, PAPER);
    g.fillStyle = col; g.beginPath(); g.arc(4, -30, .9, 0, 7); g.fill();
    if(kind==='dasher'){
      spoly(g,[[-3,-33],[0,-39],[3,-34],[8,-36],[5,-29]],'#e7ad83');
      g.strokeStyle=col;g.lineWidth=2;sline(g,-4,-28,6,-28);sline(g,-9,-23,-17,-29);
    }
    g.restore();

  } else if (kind === "tank"||kind==='shield') {
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
    if(kind==='shield'){
      spoly(g,[[-7,-32],[-5,-39],[6,-39],[8,-32],[3,-34]],'#bf5b47');
      sline(g,-7,-22,6,-12);sline(g,7,-22,-5,-12);
    }
    g.restore();
    if(kind==='shield'){
      const a=detail?.guardAngle??(face>0?0:Math.PI);
      g.save();g.translate(Math.cos(a)*13,-15+Math.sin(a)*8);g.rotate(a);g.strokeStyle=col;
      spoly(g,[[-3,-13],[5,-10],[7,0],[4,12],[-3,15],[-5,0]],detail?.shieldFlash>0?'#fff0c1':'#ecc4ae');
      g.lineWidth=1.5;sline(g,1,-8,3,7);scircle(g,2,0,2.6,col);g.restore();
    }

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
    if(kind==='flanker'){
      g.lineWidth=2;spoly(g,[[-6,-34],[6,-34],[6,-30],[-6,-30]],'#bc493a');
      spoly(g,[[-5,-32],[-14,-37],[-11,-31],[-17,-29]],'#e0a784');
      g.beginPath();g.moveTo(8,-16+sw*3);g.quadraticCurveTo(17,-24+sw*3,16,-14+sw*3);g.stroke();
      g.beginPath();g.moveTo(-8,-18-sw*3);g.quadraticCurveTo(-17,-24-sw*3,-16,-14-sw*3);g.stroke();
    }
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
