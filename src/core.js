"use strict";
/* core.js — канвас, размеры, карандашные примитивы, звук */

/* Ошибка в любом модуле раньше давала просто мёртвый экран.
   Теперь она выводится поверх страницы — видно, какой файл не долетел. */
function fatal(msg) {
  let box = document.getElementById("errBox");
  if (!box) {
    box = document.createElement("div");
    box.id = "errBox";
    box.style.cssText = "position:fixed;left:0;right:0;top:0;z-index:99;padding:14px 16px;" +
      "background:#c8402c;color:#fff;font:600 13px/1.5 system-ui;white-space:pre-wrap";
    document.body.appendChild(box);
  }
  box.textContent += msg + "\n";
}
addEventListener("error", e => {
  if (e.target && e.target.tagName === "SCRIPT")
    fatal("Не загрузился файл: " + e.target.src.split("/").slice(-2).join("/"));
  else fatal("Ошибка: " + (e.message || e) + "\n" + (e.filename || "").split("/").pop() + ":" + e.lineno);
}, true);

const cv = document.getElementById("c"), ctx = cv.getContext("2d");
let W, H, DPR;
function resize() {
  DPR = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  cv.width = W * DPR; cv.height = H * DPR;
  cv.style.width = W + "px"; cv.style.height = H + "px";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
addEventListener("resize", resize); resize();

const WORLD = 2800, cam = { x: 0, y: 0 };
const PAPER = "#f5ecdd", INK = "#2b2620", HERO = "#d2691e", FOE = "#c8402c";

/* ── карандашные примитивы ────────────────────────────────── */
function hash(a, b) { const s = Math.sin(a * 12.9898 + b * 4.1414) * 43758.5453; return s - Math.floor(s); }
function sline(g, x1, y1, x2, y2) {          // чуть кривая линия
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
  const o = (hash(x1 + x2, y1 + y2) - .5) * Math.min(4, L * .10);
  g.beginPath(); g.moveTo(x1, y1);
  g.quadraticCurveTo((x1 + x2) / 2 - dy / L * o, (y1 + y2) / 2 + dx / L * o, x2, y2);
  g.stroke();
}
function scircle(g, x, y, r, fill) {         // кружок «от руки»
  const w = 1 + (hash(x, y) - .5) * .10;
  g.beginPath(); g.ellipse(x, y, r * w, r / w, hash(y, x) * 3, 0, 6.2832);
  if (fill) { g.fillStyle = fill; g.fill(); }
  g.stroke();
}
function spoly(g, pts, fill) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  if (fill) { g.fillStyle = fill; g.fill(); }
  g.stroke();
}

/* ── звук ─────────────────────────────────────────────────── */
let AC = null;
const audio = () => AC || (AC = new (window.AudioContext || webkitAudioContext)());
function beep(f, d, ty = "square", v = .05, sl = 0) {
  try {
    const a = audio(), o = a.createOscillator(), g = a.createGain();
    o.type = ty; o.frequency.setValueAtTime(f, a.currentTime);
    if (sl) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + sl), a.currentTime + d);
    g.gain.setValueAtTime(v, a.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + d);
    o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + d);
  } catch (e) {}
}
function noise(dur, vol, cut, sweep) {
  try {
    const a = audio(), n = Math.floor(a.sampleRate * dur);
    const buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = a.createBufferSource(); src.buffer = buf;
    const f = a.createBiquadFilter(); f.type = "lowpass";
    f.frequency.setValueAtTime(cut, a.currentTime);
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(80, cut + sweep), a.currentTime + dur);
    const g = a.createGain(); g.gain.setValueAtTime(vol, a.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + dur);
    src.connect(f); f.connect(g); g.connect(a.destination); src.start();
  } catch (e) {}
}
const vary = () => .92 + Math.random() * .16;
const chain = (notes, ty = "triangle", v = .05) =>
  notes.forEach((n, i) => setTimeout(() => beep(n, .11, ty, v), i * 75));

const SFX = {
  shot: () => { beep(700 * vary(), .045, "square", .02, -300); noise(.05, .02, 3000, -2000); },
  pop:  () => { beep(330 * vary(), .11, "triangle", .04, -190); noise(.12, .035, 1600, -1200); },
  hurt: () => { beep(150, .22, "sawtooth", .07, -80); noise(.18, .05, 900, -600); },
  level:() => chain([523, 659, 784, 1047], "square", .05),
  chest:() => chain([784, 988, 1175], "triangle", .05),
  heal: () => chain([659, 880], "sine", .06),
  boom: () => { beep(80, .4, "sawtooth", .08, -40); noise(.45, .1, 1800, -1600); },
  ice:  () => { beep(1400, .35, "sine", .045, -900); noise(.3, .03, 5000, -4000); },
  bite: () => { beep(220, .07, "square", .035, -120); noise(.09, .04, 1400, -900); },
  dead: () => chain([440, 330, 247, 165], "triangle", .06),
  revive:() => chain([392, 523, 659, 880], "sine", .06),
  build:() => { beep(500, .05, "square", .03); setTimeout(() => beep(700, .07, "square", .03), 60); },
};
