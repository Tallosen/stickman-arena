"use strict";
/* cards.js — карточки уровня и постоянных улучшений */

/* ── карточки ─────────────────────────────────────────────── */
function card(box, icon, title, sub, cb, rare) {
  const el = document.createElement("div");
  el.className = rare ? "card rare" : "card";
  el.innerHTML = `<canvas width="40" height="52"></canvas><div><b>${title}</b><span>${sub}</span></div>`;
  icon(el.querySelector("canvas").getContext("2d"));
  el.onclick = cb; box.appendChild(el);
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
  paused = true;
  const pool = GK.filter(k => P.gear[k] < GEAR[k].max);
  const pick = [];
  while (pick.length < Math.min(3, pool.length)) {
    const c = pool[Math.random() * pool.length | 0];
    if (!pick.includes(c)) pick.push(c);
  }
  // редкий ствол: небольшой шанс подменить одну из трёх вещей
  const notOwned = RARE_KEYS.filter(w => w !== P.wtype);
  if (notOwned.length && Math.random() < RARE_CHANCE) {
    pendingRare = notOwned[Math.random() * notOwned.length | 0];
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
    if (queuedLevels > 0) setTimeout(() => { SFX.level(); offerCards(); }, 120);
    else paused = false;
  };
  const box = document.getElementById("cards"); box.innerHTML = "";
  for (const key of pick) {
    if (key === "@rare") {
      const w = pendingRare, W2 = WEAPONS[w];
      card(box, heroIcon({ ...P.gear, _w: w }),
        `${W2.name} <span class="rr">РЕДКОЕ</span>`, W2.desc, () => {
          P.wtype = w; applyGear();
          SFX.chest(); setTimeout(() => SFX.level(), 160);
          close();
        }, true);
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
          if (P.pet) { P.pet.lvl++; P.pet.hpMax = 4 + P.pet.lvl; P.pet.hp = P.pet.hpMax; }
          else { P.pet = makePet(ty); if (isRare) { SFX.chest(); setTimeout(() => SFX.level(), 160); } }
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
    queuedLevels > 1 ? `ещё уровней в очереди: ${queuedLevels - 1}` : "";
  document.getElementById("levelup").classList.remove("hidden");
}

function offerPerks() {
  const keys = Object.keys(PERKS), pick = [];
  while (pick.length < 3) { const c = keys[Math.random() * keys.length | 0]; if (!pick.includes(c)) pick.push(c); }
  const box = document.getElementById("perks"); box.innerHTML = "";
  for (const key of pick)
    card(box, heroIcon(P.gear), `${PERKS[key].name} ${"◆".repeat(meta[key] + 1)}`, PERKS[key].desc, () => {
      meta[key]++; document.getElementById("over").classList.add("hidden"); start();
    });
}
