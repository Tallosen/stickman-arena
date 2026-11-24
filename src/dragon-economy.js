"use strict";
/* One durable transaction contains the wallet, incubation and its predetermined reward.
   The old collection remains untouched as a migration fallback. No cloud sync is implied. */
const DRAGON_PROFILE_KEY="vacky_dragon_home_v2";
const DRAGON_IDS=["green","blue","violet","pink","blackgold","gold","diamond"];
const DRAGON_CRAFT_COST=3, DRAGON_EGG_COST=5;
let dragonStorageError="";
function cleanDragonProfile(raw){
  if(!raw||raw.version!==2||!raw.counts||!raw.exclusives)throw Error("Повреждено сохранение дома. Данные не перезаписаны.");
  const count=n=>Number.isSafeInteger(n)&&n>=0?Math.min(n,100000000):0;
  const p={version:2,revision:count(raw.revision),counts:{},rescues:count(raw.rescues),exclusives:{},egg:null};
  for(const id of DRAGON_IDS)p.counts[id]=count(raw.counts[id]);
  for(let id=0;id<100;id++)if(count(raw.exclusives[id]))p.exclusives[id]=count(raw.exclusives[id]);
  p.care={};
  p.personalities={};
  for(let id=0;id<100;id++)if(p.exclusives[id]&&Number.isInteger(raw.personalities?.[id])&&raw.personalities[id]>0&&raw.personalities[id]<2147483647)p.personalities[id]=raw.personalities[id];
  for(let id=0;id<100;id++)if(p.exclusives[id]&&Number.isSafeInteger(raw.care?.[id]))p.care[id]=Math.max(0,Math.min(30,raw.care[id]));
  if(raw.egg){
    const e=raw.egg;
    if(![0,1,2].includes(e.shell)||!Number.isInteger(e.fed)||e.fed<0||e.fed>5||
      (e.fed===5&&(!Number.isInteger(e.reward)||e.reward<0||e.reward>=100)))throw Error("Не удалось прочитать яйцо. Сохранение оставлено нетронутым.");
    // Старые три оболочки становятся одним яйцом без потери вложений и результата.
    p.egg={shell:0,fed:e.fed,reward:e.fed===5?e.reward:null};
  }
  return p;
}
function readDragonProfile(){
  const saved=(typeof Playables==='undefined'?localStorage:Playables.storage).getItem(DRAGON_PROFILE_KEY);
  if(saved!==null)return cleanDragonProfile(JSON.parse(saved));
  const old=JSON.parse((typeof Playables==='undefined'?localStorage:Playables.storage).getItem("vacky_stickman_dragons_v1")||"{}");
  const counts=Object.fromEntries(DRAGON_IDS.map(id=>[id,Math.max(0,Math.min(9999,Math.floor(Number(old?.[id])||0)))]));
  return {version:2,revision:0,counts,rescues:Object.values(counts).reduce((a,b)=>a+b,0),exclusives:{},egg:null};
}
let dragonProfile;
try{dragonProfile=readDragonProfile();}catch(err){
  dragonStorageError=String(err.message);
  dragonProfile={version:2,revision:0,counts:Object.fromEntries(DRAGON_IDS.map(id=>[id,0])),rescues:0,exclusives:{},egg:null};
}
function adoptDragonProfile(next){
  Object.assign(dragonProfile.counts,next.counts);
  const counts=dragonProfile.counts;Object.assign(dragonProfile,next);dragonProfile.counts=counts;
}
function dragonTransaction(change){
  try{
    const draft=readDragonProfile();
    const result=change(draft);
    if(result!==true){adoptDragonProfile(draft);return {ok:false,message:result||"Действие недоступно"};}
    draft.revision++;(typeof Playables==='undefined'?localStorage:Playables.storage).setItem(DRAGON_PROFILE_KEY,JSON.stringify(draft));
    adoptDragonProfile(draft);dragonStorageError="";return {ok:true};
  }catch(err){dragonStorageError="Не удалось сохранить. Ресурсы не списаны. Проверь доступ к хранилищу браузера. "+err.message;return {ok:false,message:dragonStorageError};}
}
function craftDragon(id){
  const i=DRAGON_IDS.indexOf(id);
  return dragonTransaction(p=>{
    if(i<0||i>=DRAGON_IDS.length-1)return "Бриллиантовые драконы нужны инкубатору";
    if(p.counts[id]<DRAGON_CRAFT_COST)return `Нужны ${DRAGON_CRAFT_COST} одинаковых дракона`;
    p.counts[id]-=DRAGON_CRAFT_COST;p.counts[DRAGON_IDS[i+1]]++;return true;
  });
}
function selectDragonEgg(shell){
  return dragonTransaction(p=>{
    if(shell!==0)return "В ангаре одно яйцо";
    if(p.egg?.fed>0)return "Сначала закончи инкубацию текущего яйца";
    p.egg={shell,fed:0,reward:null};return true;
  });
}
function feedDragonEgg(){
  return dragonTransaction(p=>{
    if(p.egg?.fed>=5)return "Яйцо готово к вылуплению";
    if(p.counts.diamond<1)return "Нужен бриллиантовый дракон";
    if(!p.egg)p.egg={shell:0,fed:0,reward:null};
    p.counts.diamond--;p.egg.fed++;
    if(p.egg.fed===5)p.egg.reward=Math.floor(Math.random()*100);
    return true;
  });
}
function hatchDragonEgg(){
  let id=null;
  const result=dragonTransaction(p=>{
    if(!p.egg||p.egg.fed!==5)return "Нет готового яйца";
    id=p.egg.reward;p.exclusives[id]=(p.exclusives[id]||0)+1;p.egg=null;
    p.personalities=p.personalities||{};if(!p.personalities[id])p.personalities[id]=1+Math.floor(Math.random()*2147483646);return true;
  });
  return {...result,id:result.ok?id:null};
}
function awardRescueDragon(id){return dragonTransaction(p=>{
  if(!DRAGON_IDS.includes(id))return "Неизвестный дракон";
  p.counts[id]++;p.rescues++;return true;
});}
function adminAddDiamondDragons(){
  if(typeof DRAGON_ADMIN_ENABLED==="undefined"||!DRAGON_ADMIN_ENABLED)return {ok:false,message:"Админ-инструменты отключены"};
  return dragonTransaction(p=>{p.counts.diamond+=5;return true;});
}
if(typeof Playables==='undefined'||!Playables.cloud)addEventListener("storage",e=>{
  if(e.key!==DRAGON_PROFILE_KEY)return;
  try{adoptDragonProfile(readDragonProfile());if(typeof refreshDragonHome==="function")refreshDragonHome();
    if(typeof dragonBookOpen==="function"&&dragonBookOpen())renderDragonBook();
  }catch(err){dragonStorageError=err.message;}
});
