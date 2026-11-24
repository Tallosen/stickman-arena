"use strict";
// Contextual instructions, no rewards or saved state attached to opening help.
const GAME_HELP={
 run:{title:"Как играть",text:["Веди пальцем или мышью — герой бежит, оружие целится само. Уничтожай красных, получай опыт и выбирай улучшения.","Обычные стадии длятся минуту. На стадиях 5, 10, 15 и 20 наступает ночь: победи босса, чтобы пройти дальше. Драконы иногда помогают, но завершает забег только победа над последним боссом.","Предмет используется кнопкой справа внизу или пробелом. Ульта — двойное нажатие или разведение двух пальцев. В меню паузы — продолжение боя, новый забег, язык и звук."]},
 resume:{title:"Продолжить забег",text:["Закрывает меню и продолжает текущий бой с того же места. Пока открыто меню паузы, время стадий не идёт."]},
 restart:{title:"Начать заново",text:["Текущий забег и прокачка героя в нём сбросятся. Начнётся новая игра с первой стадии.","Постоянные улучшения и оставшиеся заряды инвентаря сохранятся. Уже использованные заряды не возвращаются."]},
};
GAME_HELP.run.text.push("Полоска XP слева сверху относится к уровню героя: за опыт ты выбираешь улучшения. Обычные стадии справа идут по времени, отдельно от прокачки; стадии боссов — до победы. На мини-карте видны объекты и враги.","Редкий сундук даёт один случайный заряд авиаудара, химического тумана или танка. Чемоданчик справа над кнопкой предмета раскрывает три способности в ряд влево. Открытие бесплатно, выбор способности расходует заряд и сворачивает ряд. Неиспользованные заряды остаются после смерти и выхода. Предмет справа внизу (мина, граната, лёд) — отдельная находка для текущего боя.");
let helpReturnFocus=null;
function gameHelpOpen(){return !document.getElementById("gameHelp").classList.contains("hidden");}
function openGameHelp(topic,trigger){
 const source=GAME_HELP[topic];
 const info=topic==="guide"?{title:typeof uiLabel==="function"?uiLabel("guide"):"Путеводитель по игре"}:typeof localizedHelp==="function"?localizedHelp(topic,source):source;if(!info||(typeof Playables!=="undefined"&&Playables.blocked))return;
 helpReturnFocus=trigger||document.activeElement;pointer.active=false;
 document.getElementById("gameHelpTitle").textContent=info.title;
 const body=document.getElementById("gameHelpText");body.replaceChildren();
 const sections=topic==="guide"?["run","resume","restart"].map(k=>typeof localizedHelp==="function"?localizedHelp(k,GAME_HELP[k]):GAME_HELP[k]):[info];
 for(const section of sections){
  if(topic==="guide"){const h=document.createElement("h3");h.textContent=section.title;body.appendChild(h);}
  for(const text of section.text){const p=document.createElement("p");p.textContent=text;body.appendChild(p);}
 }
 if((topic==='guide'||topic==='run')&&typeof campText==='function'){
  const h=document.createElement('h3');h.textContent=campText('title');body.appendChild(h);
  for(const key of ['intro','gearHint','cosmetic','trialHint']){const p=document.createElement('p');p.textContent=campText(key);body.appendChild(p);}
 }
 document.getElementById("gameHelp").classList.remove("hidden");document.getElementById("btnCloseHelp").focus({preventScroll:true});
}
function closeGameHelp(){
 document.getElementById("gameHelp").classList.add("hidden");pointer.active=false;
 if(helpReturnFocus?.isConnected)helpReturnFocus.focus({preventScroll:true});helpReturnFocus=null;
}
for(const b of document.querySelectorAll("[data-help]")){
 b.onclick=e=>{e?.stopPropagation();openGameHelp(b.dataset.help,b);};
 b.addEventListener("pointerdown",e=>{e.stopPropagation();pointer.active=false;});
}
document.getElementById("btnCloseHelp").onclick=closeGameHelp;
document.getElementById("gameHelp").addEventListener("click",e=>{if(e.target===e.currentTarget)closeGameHelp();});
document.addEventListener("keydown",e=>{
 if(!gameHelpOpen())return;
 // Capture before home/arena shortcuts: Escape must dismiss only this help layer.
 if(e.key==="Escape"||e.code==="Escape"){e.preventDefault();closeGameHelp();}
 else if(e.key==="Tab"){
  e.preventDefault();const close=document.getElementById("btnCloseHelp"),replay=document.getElementById("btnReplayTutorial");
  (document.activeElement===close?replay:close).focus({preventScroll:true});
 }
 e.stopImmediatePropagation();
},true);
