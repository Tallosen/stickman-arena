"use strict";
/* Версия проекта. Меняется здесь и только здесь — дальше сама
   расходится в заголовок вкладки, на стартовый экран и в имя сборки. */
const VERSION = "0.22";

/* config.js — все константы: одежда, оружие, питомцы, предметы */

/* ── одежда ───────────────────────────────────────────────── */
const GEAR = {
  gun:    { name: "Ружьё",    desc: "Урон больше",         max: 4 },
  helm:   { name: "Шапка",    desc: "+1 сердце",           max: 4 },
  jacket: { name: "Куртка",   desc: "Дольше неуязвим",     max: 3 },
  gloves: { name: "Перчатки", desc: "Стреляешь чаще",      max: 4 },
  boots:  { name: "Сапоги",   desc: "Бежишь быстрее",      max: 4 },
  scope:  { name: "Прицел",   desc: "Дальность больше",    max: 3 },
  clip:   { name: "Магазин",  desc: "Ещё одна пуля",       max: 3 },
  cape:   { name: "Плащ",     desc: "Опыт летит издалека", max: 3 },
};
const GK = Object.keys(GEAR);

/* Редкие стволы. Базовый есть всегда, редкие выпадают нечасто
   и полностью меняют способ стрельбы.                          */
const WEAPONS = {
  basic:   { name: "Ружьё",     rare: 0, desc: "Надёжный ствол" },
  shotgun: { name: "Дробовик",  rare: 1, desc: "Веер дроби, но близко" },
  sniper:  { name: "Снайперка", rare: 1, desc: "Прошивает всех насквозь" },
  minigun: { name: "Миниган",   rare: 1, desc: "Шквал огня в упор" },
};
const RARE_KEYS = Object.keys(WEAPONS).filter(k => WEAPONS[k].rare);
const RARE_CHANCE = .24;
const TIER = ["#8a8178", "#4e8f4a", "#3d78bd", "#8a53c4", "#dfa128"];

const PERKS = {
  hp:   { name: "Закалка",  desc: "+1 сердце навсегда" },
  dmg:  { name: "Сила",     desc: "+15% урона навсегда" },
  spd:  { name: "Резвость", desc: "+8% скорости навсегда" },
  luck: { name: "Удача",    desc: "Сундуки чаще" },
};
const meta = { hp: 0, dmg: 0, spd: 0, luck: 0, best: 0 };

const ITEMS = {
  mine: { name: "Мина",    col: "#c8402c" },
  nade: { name: "Граната", col: "#4e8f4a" },
  ice:  { name: "Лёд",     col: "#4aa8cf" },
  xp:   { name: "Опыт ×2", col: "#dfa128" },
};


/* ── питомцы ──────────────────────────────────────────────── */
const PETS = {
  dog:    { name: "Собака",  desc: "Кидается на врагов с пилой" },
  cat:    { name: "Кошка",   desc: "Автомат на спине, стреляет сама" },
  parrot: { name: "Попугай", desc: "Летает и роняет мини-мины" },
  mole:   { name: "Крот",    desc: "Ныряет и ставит турели" },
  boar:   { name: "Кабан",   desc: "Взрывается на крупных врагах", revive: 19000 },
  chicken:{ name: "Курица",  desc: "Несёт яйца, из них цыплята", rare: 1 },
};
const PET_MAX = 5;
const RARE_PET_CHANCE = .18;   // шанс, что в карточке предложат редкого питомца
let turrets = [], eggs = [], chicks = [], pendingPet = null, pendingRare = null, lastPetRoll = null, queuedLevels = 0;

function petStats(p) {
  const l = p.lvl;
  return {
    dogDmg:  1.6 + 1.25 * l,
    dogCd:   620 - 45 * l,
    catDmg:  .5 + .35 * l,
    catCd:   470 - 62 * l,
    mineCap: l <= 2 ? 3 : l <= 4 ? 5 : 7,
    mineDmg: 3 + 1.5 * l,
    dropCd:  2400 - 190 * l,
    turCap:  1 + Math.floor(l / 2),
    turDmg:  .8 + .4 * l,
    turCd:   760 - 70 * l,
    boarR:   96 + 24 * l,
    boarDmg: 8 + 4.5 * l,
    eggCap:  2 + l,
    eggCd:   3400 - 330 * l,
    chickDmg:.7 + .38 * l,
  };
}
function makePet(type) {
  return { type, lvl: 1, x: P.x + 40, y: P.y + 20, a: 0, face: 1, phase: 0,
           cd: 0, drop: 0, state: "up", timer: 1400, saw: 0, aim: 0, bite: 0, recall: 0,
           r: 11, hp: 4, hpMax: 4, hurt: 0, dead: 0,
           reviveMs: PETS[type].revive || 12000 };
}
