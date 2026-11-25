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
let hudSafeArea={top:0,right:0,bottom:0,left:0};
function resize() {
  if(typeof Playables!=='undefined'&&Playables.hostPaused)return;
  DPR = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  if(typeof getComputedStyle==='function'&&document.documentElement){
    const css=getComputedStyle(document.documentElement);
    for(const side of ['top','right','bottom','left'])hudSafeArea[side]=Math.max(0,parseFloat(css.getPropertyValue('--safe-'+side))||0);
  }
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
  if(L<1e-8)return;
  const o = (g.vackyStableSketch===true?.12:hash(x1 + x2, y1 + y2)-.5) * Math.min(4, L * .10);
  g.beginPath(); g.moveTo(x1, y1);
  g.quadraticCurveTo((x1 + x2) / 2 - dy / L * o, (y1 + y2) / 2 + dx / L * o, x2, y2);
  g.stroke();
}
function scircle(g, x, y, r, fill) {         // кружок «от руки»
  const stable=g.vackyStableSketch===true,w = stable?1.012:1 + (hash(x, y) - .5) * .10;
  g.beginPath(); g.ellipse(x, y, r * w, r / w, stable?.3:hash(y, x) * 3, 0, 6.2832);
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
let audioMaster=null;
const audioVoices=new Set();
function stopGameSounds(){for(const voice of [...audioVoices])voice.stop();if(typeof soundCooldowns!=='undefined')soundCooldowns.clear();}
function gameAudioAllowed(){
  return (typeof Playables==='undefined'||Playables.audioAllowed)&&
    (typeof userAudioMuted==='undefined'||!userAudioMuted);
}
function audio(){
  if(!AC){AC=new (window.AudioContext||webkitAudioContext)();audioMaster=AC.createGain();
    // Linear bus: no automatic make-up gain, transient pumping or saturation.
    // Voice peak budget below + .72 trim bounds worst-case aligned PCM peaks.
    const trim=AC.createGain();trim.gain.value=.72;
    audioMaster.connect(trim);trim.connect(AC.destination);
  }
  const allowed=gameAudioAllowed();
  audioMaster.gain.value=allowed?1:0;
  if(allowed&&AC.state==='suspended')AC.resume().catch(()=>{});
  return AC;
}
function platformAudio(enabled){
  enabled=enabled&&gameAudioAllowed();
  if(typeof refreshSoundButtons==='function')refreshSoundButtons();
  if(!AC)return;audioMaster.gain.value=enabled?1:0;
  if(!enabled)stopGameSounds();
  if(enabled)AC.resume().catch(()=>{});else AC.suspend().catch(()=>{});
}
function beep(f, d, ty = "square", v = .05, sl = 0) {
  if(!gameAudioAllowed())return;
  if(typeof playDesignedTone==='function')return playDesignedTone(f,d,ty,v,sl);
  try {
    const a = audio(), o = a.createOscillator(), g = a.createGain();
    o.type = ty; o.frequency.setValueAtTime(f, a.currentTime);
    if (sl) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + sl), a.currentTime + d);
    g.gain.setValueAtTime(v, a.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + d);
    o.connect(g); g.connect(audioMaster); o.start(); o.stop(a.currentTime + d);
  } catch (e) {}
}
function noise(dur, vol, cut, sweep) {
  if(!gameAudioAllowed())return;
  if(typeof playDesignedNoise==='function')return playDesignedNoise(dur,vol,cut,sweep);
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
    src.connect(f); f.connect(g); g.connect(audioMaster); src.start();
  } catch (e) {}
}
const vary = () => .92 + Math.random() * .16;
const chain = (notes, ty = "triangle", v = .05) =>
  typeof playDesignedChain==='function'?playDesignedChain(notes,ty,v):notes.forEach((n, i) => (typeof Playables==='undefined'?setTimeout:Playables.delay)(() => beep(n, .11, ty, v), i * 75));

function soundCue(name,x=null,gain=1){return typeof playSound==='function'?playSound(name,x,null,gain):false;}

const SFX = {
  shot:(weapon=null,x=null)=>{const w=weapon||(typeof P!=='undefined'?P.wtype:'basic');
    if(w==='goldSniper')return typeof playSound==='function'?playSound('sniper',x,null,1,true,'precision'):false;
    if(w==='dropShotgun')return soundCue('shotgun',x);
    if(!weapon&&w==='sniper'&&(P.gear?.gun??4)<2)return soundCue('arrow',x,.8);
    if(!weapon&&w==='basic'&&(P.gear?.gun??0)>=2)return soundCue('minigun',x,.85);
    // Explicit weapons are NPC/auxiliary cues; the player's precision shot has its own lane.
    if(!weapon&&w==='sniper')return typeof playSound==='function'?playSound('sniper',x,null,1,true,'precision'):false;
    return soundCue(w==='basic'?'rifle':w,x,weapon ? .8 : 1);},
  hit:x=>soundCue('hit',x,.55),pop:x=>soundCue('pop',x,.7),hurt:()=>soundCue('hurt'),
  level:()=>soundCue('level'),chest:()=>soundCue('chest'),heal:()=>soundCue('heal'),
  boom:()=>soundCue('boom'),ice:()=>soundCue('ice'),bite:x=>soundCue('bite',x,.65),
  dead:()=>soundCue('dead'),revive:()=>soundCue('revive'),build:()=>soundCue('build'),
  click:()=>soundCue('click'),boss:()=>soundCue('boss'),ultimate:()=>soundCue('ultimate'),
  pickup:x=>soundCue('pickup',x),crateLand:x=>soundCue('crateLand',x),
  grenadeThrow:x=>soundCue('grenadeThrow',x),grenadeBlast:x=>soundCue('grenadeBlast',x),
  ultImpact:x=>soundCue('ultImpact',x),
  ultMove:x=>typeof playSound==='function'?playSound('slash',x,null,.85,true,'action'):false,
  ultLand:x=>soundCue('ultImpact',x),airstrikeImpact:x=>soundCue('grenadeBlast',x),
  mineBlast:x=>soundCue('mineBlast',x),mineMini:x=>soundCue('mineMini',x,.75),petBlast:x=>soundCue('petBlast',x,.8),
  petVoice:(type,x)=>soundCue(({chicken:'petChicken',dog:'petDog',cat:'petCat',parrot:'petParrot',boar:'petBoar',mole:'petMole'})[type]||'chirp',x,.62),
  petShot:x=>soundCue('turret',x,.35),
  dragon:()=>soundCue('dragon'),breath:x=>soundCue('breath',x),victory:()=>soundCue('victory'),
  ability:kind=>soundCue(kind),
  turret:x=>soundCue('turret',x,.55),slash:x=>soundCue('slash',x,.42),
  chirp:x=>soundCue('chirp',x,.45),petDown:x=>soundCue('petDown',x,.5),
  wings:x=>soundCue('wings',x,.28),
};
