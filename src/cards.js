"use strict";
/* cards.js — карточки уровня и постоянных улучшений */

/* ── карточки ─────────────────────────────────────────────── */
function card(box, icon, title, sub, cb, rarity) {
  const el = document.createElement("button");el.type="button";
  el.className = rarity === "gold" ? "card gold" : rarity ? "card rare" : "card";
  el.innerHTML = `<canvas width="40" height="52"></canvas><div><b>${title}</b><span>${sub}</span></div>`;
  icon(el.querySelector("canvas").getContext("2d"));
  // One shared latch per offer: a touch's compatibility click or another card
  // cannot spend the same level twice, including while the next offer is queued.
  const choice=box.cardChoice||(box.cardChoice={accepted:false});
  let gesture=null,suppressClick=false;
  const activate=()=>{
    if(choice.accepted||box.cardChoice!==choice)return;
    choice.accepted=true;el.disabled=true;pointer.active=false;cb();
  };
  el.addEventListener('pointerdown',e=>{
    if(e.isPrimary===false){gesture=null;suppressClick=true;return;}
    if(e.button!==0)return;
    suppressClick=false;
    gesture={id:e.pointerId,x:e.clientX,y:e.clientY,scroll:box.scrollTop||0,moved:false};
    el.setPointerCapture?.(e.pointerId);
  });
  el.addEventListener('pointermove',e=>{
    if(gesture&&gesture.id===e.pointerId&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>12)gesture.moved=true;
  });
  el.addEventListener('pointercancel',()=>{gesture=null;suppressClick=true;});
  el.addEventListener('lostpointercapture',()=>{if(gesture){gesture=null;suppressClick=true;}});
  el.addEventListener('pointerup',e=>{
    if(!gesture||gesture.id!==e.pointerId)return;
    const tap=!gesture.moved&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)<=12&&Math.abs((box.scrollTop||0)-gesture.scroll)<2;
    gesture=null;suppressClick=true;
    if(tap){e.preventDefault();e.stopPropagation();activate();}
  });
  el.onclick=e=>{
    // Native keyboard/assistive activation remains available without a pointer.
    if(!e||e.detail===0||!suppressClick)activate();
  };
  box.appendChild(el);
}
const heroIcon = gear => g => drawHero(g, 18, 50, 1, 0, gear, .62, -.2, 0);
const petIcon = (type, lvl) => g => drawPet(g, 15, 42, type, lvl, 1, 0, { saw: .6, aim: -.3, state: "up", bite: 0 });
function rollPet() {
  const all = Object.keys(PETS);
  const common = all.filter(x => !PETS[x].rare && x !== lastPetRoll);
  const rares  = all.filter(x =>  PETS[x].rare && x !== lastPetRoll);
  // редкий питомец выпадает нечасто, как и редкий ствол
  const pool = (rares.length && Math.random() < RARE_PET_CHANCE) ? rares : common;
  const ty = pool[Math.random() * pool.length | 0] || all[0];
  lastPetRoll = ty;
  return ty;
}

function offerCards() {
  if(heroBuildComplete()){
    queuedLevels=0;P.xp=P.xpNext;return;
  }
  paused = true;pointer.active=false;
  const title = document.getElementById("levelTitle");
  if (title) title.textContent = "УРОВЕНЬ " + P.lvl;
  const pool = GK.filter(k => P.gear[k] < GEAR[k].max);
  const pick = [];
  while (pick.length < Math.min(3, pool.length)) {
    const c = pool[Math.random() * pool.length | 0];
    if (!pick.includes(c)) pick.push(c);
  }
  // Золотая снайперка роллится отдельно и значительно реже фиолетовых стволов.
  const currentPower = weaponCombatRating(P.wtype);
  const notOwned = RARE_KEYS.filter(w => w !== P.wtype);
  const goldWeapons = notOwned.filter(w => WEAPONS[w].rarity === "gold");
  // Фиолетовая пушка появляется только если прямо сейчас сильнее текущей.
  // Золотая остаётся исключением и может выпасть на любой стадии.
  const rareWeapons = notOwned.filter(w => WEAPONS[w].rarity !== "gold" &&
    weaponCombatRating(w) >= currentPower * 1.04);
  if (goldWeapons.length && Math.random() < GOLD_WEAPON_CHANCE) {
    pendingRare = goldWeapons[Math.random() * goldWeapons.length | 0];
    pick[Math.random() * pick.length | 0] = "@rare";
  } else if (rareWeapons.length && Math.random() < RARE_CHANCE) {
    pendingRare = rareWeapons[Math.random() * rareWeapons.length | 0];
    pick[Math.random() * pick.length | 0] = "@rare";
  }

  // четвёртая строка всегда отдана питомцу
  const petRow = !P.pet || P.pet.lvl < PET_MAX;
  if (!P.pet) pendingPet = rollPet();
  if (petRow) pick.push("@pet");
  else {                                          // питомец на максимуме — добираем вещью
    const rest = pool.filter(c => !pick.includes(c));
    if (rest.length) pick.push(rest[Math.random() * rest.length | 0]);
  }

  const close = () => {
    queuedLevels = Math.max(0, queuedLevels - 1);
    document.getElementById("levelup").classList.add("hidden");
    if (heroBuildComplete()) {
      queuedLevels=0;paused=false;
      P.xp=P.xpNext;
    } else if (queuedLevels > 0) (typeof Playables==='undefined'?setTimeout:Playables.delay)(() => { SFX.level(); offerCards(); }, 120);
    else paused = false;
  };
  const box = document.getElementById("cards"); box.innerHTML = "";box.cardChoice={accepted:false};box.scrollTop=0;
  for (const key of pick) {
    if (key === "@rare") {
      const w = pendingRare, W2 = WEAPONS[w];
      const isGold = W2.rarity === "gold";
      const gain=Math.round((weaponCombatRating(w)/Math.max(.01,weaponCombatRating(P.wtype))-1)*100);
      card(box, heroIcon({ ...P.gear, _w: w }),
        `${W2.name} <span class="rr">${isGold ? "ЗОЛОТОЕ" : "РЕДКОЕ"}</span>`,
        W2.desc+(isGold?" · высший класс":` · сейчас сильнее на ${Math.max(4,gain)}%`), () => {
          P.wtype = w; applyGear();
          ult.bag = []; // новый тип оружия сразу получает правильный набор ульт
          SFX.chest(); (typeof Playables==='undefined'?setTimeout:Playables.delay)(() => SFX.level(), 160);
          close();
        }, isGold ? "gold" : true);
      continue;
    }
    if (key === "@pet") {
      const ty = P.pet ? P.pet.type : pendingPet;
      const lv = P.pet ? P.pet.lvl + 1 : 1;
      const isRare = !!PETS[ty].rare && !P.pet;
      const title = `${PETS[ty].name} ${"★".repeat(lv)}` +
                    (isRare ? ' <span class="rr">РЕДКИЙ</span>' : "");
      card(box, petIcon(ty, lv), title,
        P.pet ? "Питомец становится сильнее" : PETS[ty].desc, () => {
          if (P.pet) { P.pet.lvl++; P.pet.hpMax = petStats(P.pet).hp; P.pet.hp = P.pet.hpMax; }
          else { P.pet = makePet(ty); if (isRare) { SFX.chest(); (typeof Playables==='undefined'?setTimeout:Playables.delay)(() => SFX.level(), 160); } }
          close();
        }, isRare);
      continue;
    }
    const g = { ...P.gear, _w: P.wtype }; g[key]++;
    const nm = key === "gun" ? WEAPONS[P.wtype].name : GEAR[key].name;
    card(box, heroIcon(g), `${nm} ${"★".repeat(g[key])}`, GEAR[key].desc, () => {
      P.gear[key]++; applyGear(); P.hp = Math.min(P.hpMax, P.hp + 1); close();
    });
  }
  document.getElementById("queueTag").textContent =
    queuedLevels > 1 ? `ещё уровней в очереди: ${queuedLevels - 1}` :
    `ПРОКАЧКА ${buildUpgradeCount()}/${FULL_BUILD_CHOICES} · выбери усиление`;
  document.getElementById("levelup").classList.remove("hidden");
}

function offerPerks() {
  const keys = Object.keys(PERKS), pick = [];
  while (pick.length < 3) { const c = keys[Math.random() * keys.length | 0]; if (!pick.includes(c)) pick.push(c); }
  const box = document.getElementById("perks"); box.innerHTML = "";box.cardChoice={accepted:false};box.scrollTop=0;
  for (const key of pick)
    card(box, heroIcon(P.gear), `${PERKS[key].name} ${"◆".repeat(meta[key] + 1)}`, PERKS[key].desc, () => {
      meta[key]++; saveMeta(); document.getElementById("over").classList.add("hidden"); start();
    });
}
