"use strict";
/* ui.js — интерфейс, радар, кружок питомца, кнопки, старт */

/* ── интерфейс ────────────────────────────────────────────── */
const hudHeight = () => W < 560 ? 62 : 46;
function hud() {
  const mobile = W < 560, hh = hudHeight();
  const heartY = mobile ? 14 : 17, textY = mobile ? 36 : 20, barY = mobile ? 49 : 30;
  ctx.fillStyle = "rgba(245,236,221,.9)"; ctx.fillRect(0, 0, W, hh);
  ctx.strokeStyle = INK; ctx.lineWidth = 2; sline(ctx, 0, hh, W, hh);
  ctx.lineWidth = 2;
  const maxVisible = mobile ? Math.max(8, Math.floor((W - 48) / 15)) : P.hpMax;
  const visibleHearts = Math.min(P.hpMax, maxVisible);
  for (let i = 0; i < visibleHearts; i++) {
    const v = Math.max(0, Math.min(1, P.hp - i));
    const cx2 = 16 + i * 15;
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    scircle(ctx, cx2, heartY, 5, PAPER);
    if (v > 0) {                                   // половинка — левый полукруг
      ctx.save();
      ctx.beginPath();
      if (v >= 1) ctx.arc(cx2, heartY, 4.4, 0, 7);
      else { ctx.moveTo(cx2, heartY - 4.4); ctx.arc(cx2, heartY, 4.4, -Math.PI / 2, Math.PI / 2, true); ctx.closePath(); }
      ctx.fillStyle = FOE; ctx.fill();
      ctx.restore();
    }
  }
  if (P.hpMax > visibleHearts) {
    ctx.fillStyle=INK;ctx.font="800 10px system-ui";ctx.textAlign="left";
    ctx.fillText("+"+(P.hpMax-visibleHearts),18+visibleHearts*15,heartY+3.5);
  }
  const bw = W - 32;
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  ctx.strokeRect(16, barY, bw, 6);
  ctx.fillStyle = HERO; ctx.fillRect(16, barY, bw * (P.xp / P.xpNext), 6);
  ctx.fillStyle = INK; ctx.font = "700 12px system-ui"; ctx.textAlign = "right";
  const build=`ФУЛЛ ${buildUpgradeCount()}/${FULL_BUILD_CHOICES}`;
  ctx.fillText(mobile?`СТ.${P.lvl} · ${build} · ${score}`:
    `СТАДИЯ ${P.lvl}   ${build}   ${P.xp}/${STAGE_XP} XP   ${score}`, W - 16, textY);
  ctx.textAlign = "left";
  // шкалы эффектов живут под миникартой: слева их перекрывали пауза и +LV
  const RS = Math.min(112, W * .28), rx = W - RS - 12;
  let by = hh + 10 + RS + 9;
  const buff = (act, max, col, label, value) => {
    if (!(act > 0)) return;
    ctx.fillStyle = "rgba(253,246,232,.92)"; ctx.fillRect(rx, by, RS, 14);
    ctx.fillStyle = col; ctx.fillRect(rx, by, RS * Math.min(1, act / max), 14);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.8; ctx.strokeRect(rx, by, RS, 14);
    ctx.fillStyle = INK; ctx.font = "800 9px system-ui"; ctx.textAlign = "center";
    ctx.fillText(label + "  " + (value === undefined ? Math.ceil(act / 1000) : value), rx + RS / 2, by + 10.4);
    ctx.textAlign = "left";
    by += 18;
  };
  buff(xpBoost, 20000, "#f0c443", "ОПЫТ ×2");
  buff(P.hasteT, 7000, "#f0a83a", "УСКОРЕНИЕ");
  buff(P.invT, 6000, "#a9dcf0", "НЕУЯЗВИМОСТЬ");
  const tankHP=allyTanks.reduce((s,q)=>s+Math.max(0,q.hp),0);
  const tankMax=allyTanks.reduce((s,q)=>s+q.hpMax,0);
  buff(tankHP, tankMax || 1, "#6b97c7", "ТАНК ×"+allyTanks.length,
       Math.ceil(tankHP)+"/"+Math.ceil(tankMax));
  if (P.stagePulse > 0) {
    const a=Math.min(1,P.stagePulse/300,(1600-P.stagePulse)/260);
    ctx.save();ctx.globalAlpha=Math.max(0,a);ctx.textAlign="center";
    ctx.fillStyle="rgba(253,246,232,.94)";ctx.strokeStyle="#d2691e";ctx.lineWidth=3;
    const ww=Math.min(310,W-34),yy=H*.25;
    ctx.beginPath();ctx.roundRect(W/2-ww/2,yy-34,ww,68,14);ctx.fill();ctx.stroke();
    ctx.fillStyle="#d2691e";ctx.font="900 22px system-ui";ctx.fillText("СТАДИЯ "+P.lvl,W/2,yy-3);
    ctx.fillStyle=INK;ctx.font="700 10px system-ui";ctx.fillText("ВРАГИ СИЛЬНЕЕ · ГЕРОЙ СИЛЬНЕЕ",W/2,yy+17);ctx.restore();
  }
  radar(); ultGauge(); syncHUD();
}
function ultGauge() {
  const cx = W / 2, cy = H - 46, R = 27;
  const f = ult.charge / ULT_FULL, ready = f >= 1;
  ctx.save();
  if (ready && !ult.on) {                    // пульсирует, когда готова
    ctx.globalAlpha = .35 + Math.abs(Math.sin(t / 220)) * .45;
    ctx.beginPath(); ctx.arc(cx, cy, R + 7, 0, 7);
    ctx.fillStyle = "#8a53c4"; ctx.fill(); ctx.globalAlpha = 1;
  }
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7);
  ctx.fillStyle = "#fdf6e8"; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, R - 1, -Math.PI / 2, -Math.PI / 2 + Math.min(1, f) * 6.2832);
  ctx.strokeStyle = ready ? "#8a53c4" : HERO; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.stroke();
  // молния
  ctx.fillStyle = ready ? "#8a53c4" : "rgba(43,38,32,.30)";
  ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
  ctx.save(); ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.moveTo(-3, -13); ctx.lineTo(6, -13); ctx.lineTo(1, -2);
  ctx.lineTo(7, -2); ctx.lineTo(-5, 13); ctx.lineTo(-1, 0); ctx.lineTo(-6, 0);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
  if (ready && !ult.on) {
    ctx.fillStyle = "#7b3fb5"; ctx.font = "800 10px system-ui"; ctx.textAlign = "center";
    ctx.fillText(touchMode ? "РАЗВЕДИ ПАЛЬЦЫ" : "ДВОЙНОЙ КЛИК", cx, cy + R + 15);
    ctx.textAlign = "left";
  }
  ctx.restore();
}

function radar() {
  const S = Math.min(112, W * .28), x = W - S - 12, y = hudHeight() + 10, s = S / WORLD;
  ctx.fillStyle = "rgba(253,246,232,.92)"; ctx.strokeStyle = INK; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.roundRect(x, y, S, S, 6); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, S, S, 6); ctx.clip();
  ctx.fillStyle = "rgba(120,140,100,.5)";
  for (const o of props) ctx.fillRect(x + o.x * s - 1, y + o.y * s - 1, 2.4, 2.4);
  ctx.fillStyle = FOE;
  for (const e of enemies) ctx.fillRect(x + e.x * s - 1, y + e.y * s - 1, 2, 2);
  ctx.fillStyle = "#4e8f4a";
  for (const tu of turrets) ctx.fillRect(x + tu.x * s - 1, y + tu.y * s - 1, 3, 3);
  ctx.fillStyle = "#3d78bd";
  for (const q of allyTanks) ctx.fillRect(x + q.x * s - 2, y + q.y * s - 2, 4, 4);
  if (P.pet && P.pet.dead <= 0) { ctx.fillStyle = "#3d78bd"; ctx.fillRect(x + P.pet.x * s - 1, y + P.pet.y * s - 1, 3, 3); }
  for (const c of chests) {
    const px=x+c.x*s, py=y+c.y*s;
    ctx.fillStyle = c.rare ? "#8a53c4" : "#dfa128";
    if (c.rare) { ctx.save(); ctx.translate(px,py); ctx.rotate(Math.PI/4); ctx.fillRect(-3.5,-3.5,7,7); ctx.restore(); }
    else ctx.fillRect(px-2,py-2,5,5);
  }
  for (const h of pickups) {
    ctx.fillStyle = BOOSTS[h.kind].col;
    ctx.fillRect(x + h.x * s - 2, y + h.y * s - 2, 4.5, 4.5);
  }
  ctx.strokeStyle = "rgba(43,38,32,.4)"; ctx.lineWidth = 1;
  ctx.strokeRect(x + cam.x * s, y + cam.y * s, W * s, H * s);
  drawAltarRadar(ctx,x,y,s);
  ctx.fillStyle = HERO;
  ctx.beginPath(); ctx.arc(x + P.x * s, y + P.y * s, 3.2, 0, 7); ctx.fill();
  ctx.restore();
}
const useBtn = document.getElementById("useBtn");
const useIco = document.getElementById("useIco");
const useName = document.getElementById("useName");
const abilityDock = document.getElementById("abilityDock");
const abilitySlots = [...document.querySelectorAll(".ability-slot")];
const petBadge = document.getElementById("petBadge");
const dragonBookBtn = document.getElementById("dragonBookBtn");
const petCtx = petBadge.getContext("2d");
const REVIVE = 12000;

function star(g, x, y, r) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r;
    g[i ? "lineTo" : "moveTo"](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath();
  g.fillStyle = "#e0a52f"; g.fill();
  g.lineWidth = 1.4; g.strokeStyle = INK; g.stroke();
}

function drawPetBadge() {
  const p = P.pet;
  petBadge.classList.toggle("hidden", !p || !running);
  if (!p || !running) return;
  const S2 = 176, g = petCtx, c = S2 / 2, R = c - 14;
  g.setTransform(2, 0, 0, 2, 0, 0);
  g.clearRect(0, 0, S2, S2);
  const cc = c / 2, RR = R / 2;

  // подложка
  g.beginPath(); g.arc(cc, cc, RR, 0, 7);
  g.fillStyle = "#fdf6e8"; g.fill();
  g.lineWidth = 3; g.strokeStyle = INK; g.stroke();

  // аватарка питомца
  g.save();
  g.beginPath(); g.arc(cc, cc, RR - 2, 0, 7); g.clip();
  g.globalAlpha = p.dead > 0 ? .22 : 1;
  g.translate(cc - 1, cc + 13); g.scale(.92, .92);
  drawPet(g, 0, 0, p.type, p.lvl, 1, p.dead > 0 ? 0 : p.phase * .5,
          { saw: p.saw, aim: -.35, state: "up", bite: 0 });
  g.restore();

  // кольцо воскрешения
  if (p.dead > 0) {
    const done = 1 - p.dead / p.reviveMs;
    g.beginPath(); g.arc(cc, cc, RR + 1, 0, 7);
    g.strokeStyle = "rgba(43,38,32,.14)"; g.lineWidth = 5; g.stroke();
    g.beginPath(); g.arc(cc, cc, RR + 1, -Math.PI / 2, -Math.PI / 2 + done * 6.2832);
    g.strokeStyle = HERO; g.lineWidth = 5; g.lineCap = "round"; g.stroke();
    g.fillStyle = INK; g.font = "800 22px system-ui"; g.textAlign = "center";
    g.fillText(Math.ceil(p.dead / 1000), cc, cc + 8);
  } else {
    // полоска здоровья по нижней дуге
    g.beginPath(); g.arc(cc, cc, RR + 1, .35 * Math.PI, .65 * Math.PI);
    g.strokeStyle = "rgba(43,38,32,.14)"; g.lineWidth = 5; g.stroke();
    g.beginPath();
    g.arc(cc, cc, RR + 1, .65 * Math.PI, .65 * Math.PI - (p.hp / p.hpMax) * .3 * Math.PI, true);
    g.strokeStyle = "#4e8f4a"; g.lineWidth = 5; g.lineCap = "round"; g.stroke();
  }

  if (p.recall > 0) {                     // мигаем, пока бежит на зов
    g.beginPath(); g.arc(cc, cc, RR + 4, 0, 7);
    g.strokeStyle = HERO; g.lineWidth = 2.5;
    g.globalAlpha = .35 + Math.abs(Math.sin(t / 120)) * .5;
    g.stroke(); g.globalAlpha = 1;
  }

  // уровень звёздами
  const n = p.lvl, gap = 9.5, y0 = cc + RR - 3;
  for (let i = 0; i < n; i++) star(g, cc + (i - (n - 1) / 2) * gap, y0, 4.4);
}

const pauseBtn = document.getElementById("pauseBtn");
pauseBtn.addEventListener("pointerdown", e => { e.stopPropagation(); pointer.active = false; pauseGame(); });
pauseBtn.addEventListener("pointerenter", () => { pointer.active = false; });

// тап по шкале ульты тоже запускает её
cv.addEventListener("pointerdown", e => {
  const r = cv.getBoundingClientRect();
  if (Math.hypot(e.clientX - r.left - W / 2, e.clientY - r.top - (H - 46)) < 34 && ultReady()) {
    pointer.active = false; startUlt();
  }
});
// ── ВРЕМЕННО: мгновенный уровень для тестов. Удалить перед релизом ──
const devLvl = document.getElementById("devLvl");
devLvl.addEventListener("pointerenter", () => { pointer.active = false; });
// ── ВРЕМЕННО: мгновенная зарядка ульты. Удалить перед релизом ──
const devUlt = document.getElementById("devUlt");
devUlt.addEventListener("pointerenter", () => { pointer.active = false; });
devUlt.addEventListener("pointerdown", e => {
  e.stopPropagation(); pointer.active = false;
  if (!running || paused) return;
  if (ult.on) { ult.on = false; ult.zoom = 1; ult.rot = 0; ult.lift = 0; ult.charge = ULT_FULL; }
  else if (ult.charge >= ULT_FULL) ult.charge = 0;   // повторное нажатие сбрасывает
  else ult.charge = ULT_FULL;
});

// ── ВРЕМЕННО: принудительно поставить редкий сундук для проверки ──
const devRare = document.getElementById("devRare");
devRare.addEventListener("pointerenter", () => { pointer.active = false; });
devRare.addEventListener("pointerdown", e => {
  e.stopPropagation(); pointer.active = false; spawnRareChestNearPlayer();
});

// ── ВРЕМЕННО: экипировать золото и по очереди проверить все снайперские ульты ──
const devSniper = document.getElementById("devSniper");
let devSniperIndex = 0;
devSniper.addEventListener("pointerenter", () => { pointer.active = false; });
devSniper.addEventListener("pointerdown", e => {
  e.stopPropagation(); pointer.active=false;
  if(!running || paused)return;
  P.wtype="sniper"; applyGear();
  const mode=SNIPER_ULT_MODES[devSniperIndex++ % SNIPER_ULT_MODES.length];
  ult.forceMode=mode; ult.weaponBag="sniper"; ult.charge=ULT_FULL;
  pops=pops.filter(p=>!String(p.txt||"").startsWith("GOLD · "));
  pops.push({x:P.x,y:P.y-58,txt:"GOLD · "+mode.toUpperCase(),life:1.4,col:"#c79018"});
});

// ── ВРЕМЕННО: заполнить всю прокачку и сразу проверить финал с драконом ──
const devFull=document.getElementById("devFull");
devFull.addEventListener("pointerenter",()=>{pointer.active=false;});
function devLaunchFinale(forcedId=null){
  if(!running||dragonFinale)return;
  if(forcedId)forceNextDragon(forcedId);
  userPaused=false;paused=false;queuedLevels=0;
  document.getElementById("pause").classList.add("hidden");
  document.getElementById("levelup").classList.add("hidden");
  for(const key of GK)P.gear[key]=GEAR[key].max;
  if(!P.pet)P.pet=makePet("dog");
  P.pet.lvl=PET_MAX;P.pet.hpMax=4+PET_MAX;P.pet.hp=P.pet.hpMax;
  P.lvl=Math.max(P.lvl,FULL_BUILD_CHOICES+1);
  applyGear();P.hp=P.hpMax;
  const forced=forcedId&&DRAGON_TYPES.find(d=>d.id===forcedId);
  pops.push({x:P.x,y:P.y-62,txt:forced?"ТЕСТ · "+forced.name:"ФУЛЛ 33/33",life:1.2,col:forced?forced.accent:"#b88716"});
  // +FULL проверяет обычный маршрут к алтарю; +DRG остаётся быстрым просмотром.
  if(forcedId)startDragonFinale(true);
  else unlockDragonAltar();
}
devFull.addEventListener("pointerdown",e=>{
  e.stopPropagation();pointer.active=false;devLaunchFinale();
});

// ── ВРЕМЕННО: три особых вступления по очереди ──
const devDragon=document.getElementById("devDragon");
const DEV_DRAGONS=["diamond","blackgold","gold"];
let devDragonIndex=0;
devDragon.addEventListener("pointerenter",()=>{pointer.active=false;});
devDragon.addEventListener("pointerdown",e=>{
  e.stopPropagation();pointer.active=false;
  devLaunchFinale(DEV_DRAGONS[devDragonIndex++%DEV_DRAGONS.length]);
});

devLvl.addEventListener("pointerdown", e => {
  e.stopPropagation(); pointer.active = false;
  if (!running || paused) return;
  P.xp = P.xpNext - 1;
  gainXP();
});

document.getElementById("btnResume").onclick = resumeGame;
document.getElementById("btnRestart").onclick = () => {
  userPaused = false;
  document.getElementById("pause").classList.add("hidden");
  document.getElementById("levelup").classList.add("hidden");
  start();
};

cv.addEventListener("pointerdown", e => {
  const r = cv.getBoundingClientRect();
  if (Math.hypot(e.clientX - r.left - W / 2, e.clientY - r.top - (H - 46)) < 34 && ultReady()) {
    pointer.active = false; startUlt();
  }
});

useBtn.addEventListener("pointerdown", e => { e.stopPropagation(); pointer.active = false; useItem(); });
for (const slot of abilitySlots) {
  const kind = slot.dataset.ability, ico = slot.querySelector("canvas").getContext("2d");
  ico.setTransform(2,0,0,2,0,0); ico.clearRect(0,0,44,44); drawAbilityIcon(ico,kind,22,22,1.35);
  slot.addEventListener("pointerdown", e => { e.stopPropagation(); pointer.active=false; useAbility(kind); });
  slot.addEventListener("pointerenter", () => { pointer.active=false; });
}
addEventListener("keydown", e => {
  if (e.code === "Digit1") useAbility("airstrike");
  if (e.code === "Digit2") useAbility("gas");
  if (e.code === "Digit3") useAbility("tank");
});
// мышь заехала на кнопку — герой замирает, а не бежит к ней
for (const el of [useBtn, petBadge])
  el.addEventListener("pointerenter", () => { pointer.active = false; });

dragonBookBtn.addEventListener("pointerdown", e => { e.stopPropagation(); openDragonBook(); });
dragonBookBtn.addEventListener("pointerenter", () => { pointer.active=false; });
document.getElementById("btnCloseBook").onclick=closeDragonBook;
document.getElementById("btnVictoryBook").onclick=openDragonBook;
document.getElementById("btnRetryDragonSave").onclick=retryDragonReward;
document.getElementById("btnVictoryRestart").onclick=()=>start();

// клик по кружку — питомец бежит к хозяину
petBadge.addEventListener("pointerdown", e => {
  e.stopPropagation(); pointer.active = false;
  const p = P.pet;
  if (!p || p.dead > 0 || !running) return;
  p.recall = 3000;
  if (p.type === "mole" && p.state === "down") { p.state = "up"; p.timer = 1500; }
  pops.push({ x: P.x, y: P.y - 60, txt: "КО МНЕ!", life: 1.2, col: HERO });
  chain([760, 1010], "square", .045);
});

let lastItem = "x", lastInventory = "";
function syncHUD() {
  if (P.item !== lastItem) {
    lastItem = P.item;
    useBtn.disabled = !P.item;
    const ig = useIco.getContext("2d");
    ig.setTransform(2, 0, 0, 2, 0, 0); ig.clearRect(0, 0, 36, 36);
    if (P.item) drawItemIcon(ig, P.item, 18, 18, 1.35);
    useName.textContent = P.item ? ITEMS[P.item].name : "пусто";
  }
  pauseBtn.style.display = running ? "flex" : "none";
  dragonBookBtn.style.display = running ? "flex" : "none";
  document.getElementById("dragonHomeBtn").style.display=running?"flex":"none";
  devLvl.style.display = running ? "block" : "none";
  devUlt.style.display = running ? "block" : "none";
  devRare.style.display = running ? "block" : "none";
  devSniper.style.display = running ? "block" : "none";
  devFull.style.display = running ? "block" : "none";
  devDragon.style.display = running ? "block" : "none";
  abilityDock.classList.toggle("hidden", !running);
  const invKey = ABILITY_KEYS.map(k => inventory[k]).join(",") + ":" + running + ":" + paused;
  if (invKey !== lastInventory) {
    lastInventory = invKey;
    for (const slot of abilitySlots) {
      const kind=slot.dataset.ability, n=inventory[kind];
      slot.disabled = !running || paused || n <= 0;
      slot.querySelector("b").textContent = n > 99 ? "99+" : n;
    }
  }
  drawPetBadge();
}

// если какой-то модуль не долетел, скажем об этом прямо
for (const [name, ref] of [["ult.js", typeof ult], ["cards.js", typeof offerCards],
                           ["pets.js", typeof updatePet], ["world.js", typeof spawn]])
  if (ref === "undefined") fatal("Не загружен модуль src/" + name);

document.title = "Stickman Arena v" + VERSION + " — Vacky Games";
{
  const tag = document.getElementById("verTag");
  if (tag) tag.textContent = "v" + VERSION;
}

function start() {
  reset(); running = true;
  document.getElementById("start").classList.add("hidden");
  document.getElementById("over").classList.add("hidden");
}
function gameOver() {
  running = false; meta.best = Math.max(meta.best, Math.round(t / 1000));
  document.getElementById("stats").textContent =
    `${(t / 1000).toFixed(0)} с · лопнул ${score} · стадия ${P.lvl} · прокачка ${buildUpgradeCount()}/${FULL_BUILD_CHOICES} · рекорд ${meta.best} с`;
  offerPerks(); document.getElementById("over").classList.remove("hidden");
}
document.getElementById("btnStart").onclick = () => { audio(); start(); };
reset(); running = false;
