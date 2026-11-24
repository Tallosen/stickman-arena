"use strict";
/* Версия проекта. Меняется здесь и только здесь — дальше сама
   расходится в заголовок вкладки, на стартовый экран и в имя сборки. */
const VERSION = "0.206";
// Renderer defaults also work in isolated tests without the settings UI module.
function visualFX(key){return typeof visualSettings==='undefined'?key==='shake':visualSettings[key];}
const MAP_RARE_CHEST_CHANCE = .015;
const BACKPACK_RANGE_MAX=420;
const backpackSalvoCooldown=fireRate=>Math.max(900,fireRate*2.2);
// Explicit opt-in in the separate local QA build, never enabled on a host platform.
const DRAGON_ADMIN_ENABLED = typeof window!=='undefined'&&window.VACKY_DEV===true&&!(typeof Playables!=='undefined'&&Playables.cloud);

const RUN_STAGES=20,STAGE_MS=60000,OVERTIME_MS=300000;
const RUN_MAIN_MS=RUN_STAGES*STAGE_MS,RUN_LIMIT_MS=RUN_MAIN_MS+OVERTIME_MS;
const isBossStage=stage=>stage>=5&&stage<=20&&stage%5===0;
function stageWave(stage){
  const n=Math.max(0,Math.floor(stage||1)-1);
  return {interval:Math.max(180,820-n*62),eliteInterval:Math.max(22000,44000-n*1800),
    tankChance:Math.min(.24,Math.max(0,(n-1)*.04)),runnerChance:Math.min(.48,.10+n*.045)};
}
// Same minute-long stages, with breathing room around a short pressure peak.
// Only incoming reinforcements change: existing enemies are never erased.
function stageTempo(stage,elapsed=0){
  if(isBossStage(stage))return {density:1,phase:'boss'};
  const s=Math.max(0,Math.min(60,(Number(elapsed)||0)/1000));
  const ramp=(a,b,u)=>a+(b-a)*(u*u*(3-2*u));
  const density=s<6?.65:s<12?ramp(.65,1,(s-6)/6):s<36?1:s<40?ramp(1,1.35,(s-36)/4):s<48?1.35:s<54?ramp(1.35,.65,(s-48)/6):.65;
  return {density,phase:s<10||s>=52?'breather':s>=36?'surge':'steady'};
}
function stageSpawnInterval(stage,elapsed=0){
  const base=stageWave(stage).interval;
  return isBossStage(stage)?base*3:Math.max(140,base/stageTempo(stage,elapsed).density);
}
function stageXPIncome(stage){
  const w=stageWave(stage);
  return ((1-w.tankChance-w.runnerChance)*55+w.runnerChance*70+w.tankChance*150)*1000/w.interval+500*1000/w.eliteInterval;
}
// About 1.8 upgrade choices per minute at the reference pace. XP is earned, not timed.
function heroXPRequired(level){
  const referenceStage=Math.min(RUN_STAGES,1+Math.floor((Math.max(1,level)-1)/1.8));
  return Math.round(stageXPIncome(referenceStage)*24/25)*25;
}
function enemyBaseKind(kind){return {dasher:'runner',shield:'tank',flanker:'basic',pyro:'basic',drummer:'tank'}[kind]||kind;}
function stageEnemyKind(stage,roll,variantRoll){
  const w=stageWave(stage),base=roll<w.tankChance?'tank':roll<w.tankChance+w.runnerChance?'runner':'basic';
  if(base==='basic'&&stage>=6&&variantRoll>=.72&&variantRoll<.72+Math.min(.24,.12+(stage-6)*.01))return 'pyro';
  if(base==='tank'&&stage>=12&&variantRoll>=.7&&variantRoll<.7+Math.min(.25,.14+(stage-12)*.014))return 'drummer';
  if(base==='runner'&&stage>=5&&variantRoll<Math.min(.45,.22+(stage-5)*.025))return 'dasher';
  if(base==='tank'&&stage>=10&&variantRoll<Math.min(.5,.28+(stage-10)*.025))return 'shield';
  if(base==='basic'&&stage>=15&&variantRoll<Math.min(.55,.3+(stage-15)*.025))return 'flanker';
  return base;
}

/* config.js — все константы: одежда, оружие, питомцы, предметы */

/* ── одежда ───────────────────────────────────────────────── */
const GEAR = {
  gun:    { name: "Ружьё",    desc: "Урон больше",         max: 4 },
  helm:   { name: "Шапка",    desc: "+1 сердце",           max: 4 },
  jacket: { name: "Куртка",   desc: "Дольше неуязвим",     max: 3 },
  gloves: { name: "Перчатки", desc: "Стреляешь чаще",      max: 4 },
  boots:  { name: "Сапоги",   desc: "Бежишь быстрее",      max: 4 },
  scope:  { name: "Прицел",   desc: "Дальность больше",    max: 3 },
  clip:   { name: "Боевой рюкзак", desc: "+1 модуль с самонаводящейся пулей", max: 3 },
  cape:   { name: "Плащ",     desc: "+10% опыта",          max: 3 },
};
const GK = Object.keys(GEAR);

/* Редкие стволы. Базовый есть всегда, редкие выпадают нечасто
   и полностью меняют способ стрельбы.                          */
const WEAPONS = {
  basic:   { name: "Ружьё",     rare: 0, rarity: "common", desc: "Надёжный ствол" },
  shotgun: { name: "Дробовик",  rare: 0, rarity: "common", desc: "Веер дроби, но близко" },
  sniper:  { name: "Точная ветка", rare: 0, rarity: "common", desc: "От лука до снайперской винтовки" },
  minigun: { name: "Миниган",   rare: 1, rarity: "rare", desc: "Шквал огня в упор" },
  laser:   { name: "Лазер", rare: 0, rarity: "common", desc: "От импульсного бластера до луча Призмы" },
  dropShotgun:{name:'Штурмовой дробовик',rare:1,rarity:'gold',desc:'Авиадроп · плотная картечь'},
  goldSniper:{name:'Золотая снайперка',rare:1,rarity:'gold',desc:'Авиадроп · тяжёлый пробой'},
};
const DROP_WEAPONS=['minigun','dropShotgun','goldSniper'];
const DROP_UPGRADE_MS=75000;
function isDropWeapon(w){return DROP_WEAPONS.includes(w);}
function upgradeableGear(key){return P.gear[key]<GEAR[key].max&&!(key==='gun'&&P.dropWeapon===P.wtype&&isDropWeapon(P.wtype));}
// Stable weapon IDs preserve old saves; the displayed form follows the run upgrade.
const ARSENAL_BRANCHES=['basic','shotgun','sniper','laser'];
const WEAPON_FORMS={
 basic:[['Пистолет','Pistol'],['Тяжёлый пистолет','Heavy pistol'],['Пистолет-пулемёт','SMG'],['Штурмовой автомат','Assault rifle'],['Автомат «Бастион»','Bastion rifle']],
 shotgun:[['Однозарядное ружьё','Single-shot gun'],['Обрез','Sawed-off'],['Помповый дробовик','Pump shotgun'],['Боевой дробовик','Combat shotgun'],['Дробовик «Гром»','Thunder shotgun']],
 sniper:[['Лук','Bow'],['Арбалет','Crossbow'],['Охотничья винтовка','Hunting rifle'],['Точная винтовка','Marksman rifle'],['Снайперка «Сокол»','Falcon sniper']],
 laser:[['Бластер','Blaster'],['Лазерный карабин','Laser carbine'],['Импульсная винтовка','Pulse rifle'],['Лучевая винтовка','Beam rifle'],['Лазер «Призма»','Prism laser']]
};
function weaponFormName(w,level=0){const pair=WEAPON_FORMS[w]?.[Math.max(0,Math.min(4,level))];return pair?pair[typeof uiLanguage==='undefined'||uiLanguage==='ru'?0:1]:WEAPONS[w]?.name||w;}
function weaponShotKind(w,level){return w==='goldSniper'?'sniper':w==='dropShotgun'?'pellet':w==='laser'?'laser':w==='sniper'&&level<2?'arrow':w==='minigun'?'mini':w==='shotgun'?'pellet':w;}
function weaponTriggerPoint(w,level){return w==='sniper'&&level===0?[16,-2]:[5,6];}
// Keep the ordinary trigger hand within the arm's reach. Drawing and shot
// emission share this anchor; explicit cinematic poses retain their own anchor.
function heroRestWeaponAnchor(w,level,jacket,aim,face,neck=-40){
 const [gx,gy]=weaponTriggerPoint(w,level),push=jacket?6.5:3.5;
 const dx=2+Math.cos(aim)*face*(push+gx*1.3)-Math.sin(aim)*gy*1.3-6;
 const dy=10+Math.sin(aim)*(push+gx*1.3)+Math.cos(aim)*face*gy*1.3;
 const d=Math.hypot(dx,dy),pull=d>24?1-24/d:0;
 return [2-dx*pull,neck+13-dy*pull];
}
const RARE_KEYS = Object.keys(WEAPONS).filter(k => WEAPONS[k].rare);
const RARE_CHANCE = .24;
const GOLD_WEAPON_CHANCE = .025;
const TIER = ["#8a8178", "#4e8f4a", "#3d78bd", "#8a53c4", "#dfa128"];

const PERKS = {
  hp:   { name: "Закалка",  desc: "+1 сердце навсегда" },
  dmg:  { name: "Сила",     desc: "+15% урона навсегда" },
  spd:  { name: "Резвость", desc: "+8% скорости навсегда" },
  luck: { name: "Удача",    desc: "Сундуки чаще" },
};
const meta = { hp: 0, dmg: 0, spd: 0, luck: 0, best: 0, bestStage: 0, bestClearMs:0 };
const META_KEY='vacky_meta_v1';
function saveMeta(){try{(typeof Playables==='undefined'?localStorage:Playables.storage).setItem(META_KEY,JSON.stringify(meta));}catch(_){}}
try{
  const saved=JSON.parse((typeof Playables==='undefined'?localStorage:Playables.storage).getItem(META_KEY)||'{}');
  for(const key of Object.keys(meta))if(Number.isSafeInteger(saved[key])&&saved[key]>=0)meta[key]=saved[key];
}catch(_){}
meta.bestStage=Math.min(RUN_STAGES,meta.bestStage);
function rememberRunStage(){
 if(typeof P==='undefined'||!(P.runMs>0)||P.testRun)return false;
 const stage=Math.max(1,Math.min(RUN_STAGES,Math.floor(P.stage)||1));
 if(stage<=meta.bestStage)return false;
 meta.bestStage=stage;saveMeta();return true;
}

const ITEMS = {
  mine: { name: "Мина",    col: "#c8402c" },
  nade: { name: "Граната", col: "#4e8f4a" },
  ice:  { name: "Лёд",     col: "#4aa8cf" },
  xp:   { name: "Опыт ×2", col: "#dfa128" },
};

/* Эксклюзивные расходуемые способности из редкого сундука.
   Инвентарь хранится отдельно от забега и переживает смерть/перезагрузку. */
const ABILITIES = {
  airstrike:{ name: "АВИАУДАР", short: "УДАР", col: "#d2691e", desc: "Серия ракет бьёт по скоплениям врагов" },
  gas:    { name: "ТОКСИЧНЫЙ ТУМАН", short: "ГАЗ", col: "#4e8f4a", desc: "Химкостюм и смертельный дым" },
  tank:   { name: "БОЕВОЙ ТАНК", short: "ТАНК", col: "#3d78bd", desc: "Бронированный союзник живёт, пока есть прочность" },
};
const ABILITY_KEYS = Object.keys(ABILITIES);
const INVENTORY_KEY = "vacky_stickman_inventory_v1";
const inventory = { airstrike: 0, gas: 0, tank: 0 };
let inventoryReadOnly = false;
function loadInventory() {
  try {
    const raw = (typeof Playables==='undefined'?localStorage:Playables.storage).getItem(INVENTORY_KEY);
    const saved = raw === null ? {} : JSON.parse(raw);
    if(!saved || typeof saved !== 'object' || Array.isArray(saved) || Object.values(saved).some(n=>!Number.isSafeInteger(n)||n<0))throw Error('Invalid inventory');
    const next = {};
    for (const key of ABILITY_KEYS) {
      // Старые заряды магнита автоматически превращаются в авиаудары.
      const value = key === "airstrike" && saved.airstrike === undefined ? saved.vacuum : saved[key];
      next[key] = Math.min(999, value || 0);
    }
    Object.assign(inventory,next);inventoryReadOnly=false;return true;
  } catch (_) { inventoryReadOnly=true;return false; }
}
function saveInventory(next=inventory) {
  if(inventoryReadOnly || ABILITY_KEYS.some(key=>!Number.isSafeInteger(next[key])||next[key]<0||next[key]>999))return false;
  try { (typeof Playables==='undefined'?localStorage:Playables.storage).setItem(INVENTORY_KEY, JSON.stringify(next));return true; } catch (_) {return false;}
}
loadInventory();


/* ── питомцы ──────────────────────────────────────────────── */
const PETS = {
  dog:    { name: "Собака",  desc: "Защищает вблизи, быстро кусает", revive: 8500 },
  cat:    { name: "Кошка",   desc: "Точно стреляет на средней дистанции", revive: 10000 },
  parrot: { name: "Попугай", desc: "Минирует путь, сдерживает толпу", revive: 10000 },
  mole:   { name: "Крот",    desc: "Закрепляет зону огнём турелей", revive: 10000 },
  boar:   { name: "Кабан",   desc: "Прорывается к тяжёлым врагам и взрывается", revive: 8500 },
  chicken:{ name: "Курица",  desc: "Редкий отряд: бойцы, подрывники и лекарь", rare: 1, revive: 8000 },
};
const PET_MAX = 5;
const RARE_PET_CHANCE = .04;   // 4% на новый редкий выбор; повтор подряд исключён в rollPet
let turrets = [], eggs = [], chicks = [], pendingPet = null, pendingRare = null, lastPetRoll = null, queuedLevels = 0;

/* Полный набор улучшений героя независим от таймера кампании.
   Смена редкой пушки расходует выбор, но не увеличивает заполнение сборки. */
const FULL_BUILD_CHOICES = GK.reduce((sum,key)=>sum+GEAR[key].max,0) + PET_MAX;
function buildUpgradeCount(){
  const gear=GK.reduce((sum,key)=>sum+(key==='gun'&&isDropWeapon(P.wtype)&&P.dropWeapon===P.wtype?GEAR.gun.max:Math.min(GEAR[key].max,P.gear[key]||0)),0);
  const pet=P.pet?Math.min(PET_MAX,P.pet.lvl||1):0;
  return gear+pet;
}
function heroBuildComplete(){return buildUpgradeCount()>=FULL_BUILD_CHOICES;}

function petStats(p) {
  const l = Math.max(1, Math.min(PET_MAX, p.lvl || 1));
  // Shared, capped growth: pets remain relevant late without scaling with kill rate.
  const power = 1 + Math.min(32, Math.max(0, (P.lvl || 1) - 1)) * .045;
  return {
    power,
    hp: (p.type === 'boar' ? 8 : p.type === 'dog' ? 6 : 4) + l,
    dogDmg:  (1.65 + .85 * l) * power,
    dogCd:   650 - 40 * l,
    catDmg:  (.9 + .50 * l) * power,
    catCd:   510 - 38 * l,
    mineCap: 2 + Math.ceil(l / 2),
    mineDmg: (3.2 + 1.3 * l) * power,
    mineR:   68 + 5 * l,
    dropCd:  2750 - 160 * l,
    turCap:  1 + Math.floor(l / 2),
    turDmg:  (1.2 + .48 * l) * power,
    turCd:   780 - 45 * l,
    boarR:   94 + 12 * l,
    boarDmg: (16 + 6 * l) * power,
    eggCap:  3 + l,
    eggCd:   2600 - 180 * l,
    chickDmg:(1.5 + .65 * l) * power,
    chickBlast:(5 + 2 * l) * power,
  };
}
function makePet(type) {
  const hp = petStats({type, lvl:1}).hp;
  return { type, lvl: 1, x: P.x + 40, y: P.y + 20, a: 0, face: 1, phase: 0,
           cd: 0, drop: 0, state: "up", timer: 1400, saw: 0, aim: 0, bite: 0, recall: 0,
           r: 11, hp, hpMax: hp, hurt: 0, dead: 0,
           reviveMs: PETS[type].revive || 12000 };
}
