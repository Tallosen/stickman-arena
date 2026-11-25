"use strict";
const TUTORIAL_KEY="vacky_tutorial_v1";
const TUTORIAL_STEPS={
 welcome:{title:"Добро пожаловать!",text:"Начни с кнопки «Играть». Я буду подсказывать по ходу игры и показывать нужные места. Пока читаешь подсказку, бой стоит на паузе.",target:"btnStart",tag:"Первый шаг"},
 move:{title:"Двигайся и уклоняйся",text:"На телефоне веди пальцем по арене. Мышью — перемещай указатель. Герой бежит к выбранному месту, а оружие само целится и стреляет. Нажми «Понятно» и попробуй отойти от красных.",target:"hero",tag:"Первый бой"},
 health:{title:"Здоровье и опыт",text:"Сверху слева — здоровье героя и опыт до следующего уровня. За побеждённых врагов опыт начисляется сразу. Двигайся, чтобы красные не окружили тебя.",target:"health",tag:"После первых секунд боя"},
 upgrade:{title:"Первое улучшение",text:"Выбери одну из карточек. Она улучшит героя, оружие или боевого питомца. Уровни растут за опыт, а стадии меняются по времени — это две разные шкалы.",target:"levelTitle",tag:"Прокачка героя"},
 item:{title:"У тебя есть предмет",text:"Эта кнопка использует найденную мину, гранату или лёд. На клавиатуре можно нажать пробел. Предмет расходуется, поэтому выбирай момент.",target:"useBtn",tag:"Найден предмет"},
 ultimate:{title:"Ульта готова",text:"Молния внизу — сильный приём героя. Нажми её или дважды нажми на арену; на телефоне можно развести два пальца. После использования заряд накопится снова.",target:"ultimate",tag:"Сильный приём"},
 inventory:{title:"Запас особых способностей",text:"Здесь хранятся заряды авиаудара, химического тумана и танка из редких сундуков. Выбор способности расходует один заряд. Оставшийся запас сохраняется после смерти и выхода.",target:"abilityToggle",tag:"Редкая находка"},
 menu:{title:"Здесь находится меню",text:"Пауза — в левом верхнем углу. В меню можно продолжить бой, начать заново, выбрать язык и включить или выключить звук. Единственный «?» открывает полный справочник и повтор обучения.",target:"pauseBtn",tag:"Освоились в бою"},
 altar:{title:"Ночь и босс",text:"Боссы появляются на стадиях 5, 10, 15 и 20. Уклоняйся от отмеченных атак и победи босса, чтобы пройти дальше. Драконы иногда помогают. Победа над последним боссом завершает забег.",target:"timer",tag:"Бой с боссом"},
};
function tutorialStore(){return typeof Playables!=="undefined"?Playables.storage:localStorage;}
function tutorialExistingPlayer(){
 return (typeof dragonProfile!=="undefined"&&(dragonProfile.rescues>0||Object.values(dragonProfile.counts||{}).some(n=>n>0)||Object.keys(dragonProfile.exclusives||{}).length>0))||
  (typeof meta!=="undefined"&&Object.values(meta).some(n=>typeof n==="number"&&n>0));
}
function loadTutorial(){
 try{
  const raw=tutorialStore().getItem(TUTORIAL_KEY);
  if(raw===null)return {version:1,disabled:!!tutorialExistingPlayer(),seen:{}};
  const p=JSON.parse(raw);if(p?.version!==1||typeof p.disabled!=="boolean"||!p.seen||typeof p.seen!=="object")throw Error("Invalid tutorial");
  return {version:1,disabled:p.disabled,seen:Object.fromEntries(Object.keys(TUTORIAL_STEPS).filter(k=>p.seen[k]===true).map(k=>[k,true]))};
 }catch(_){return {version:1,disabled:true,seen:{}};} // Never replace an unreadable record automatically.
}
let tutorialProgress=loadTutorial(),tutorialActive=null,tutorialCheckAt=0,tutorialNextAt=0;
function tutorialOpen(){return tutorialActive!==null;}
function saveTutorial(){
 try{tutorialStore().setItem(TUTORIAL_KEY,JSON.stringify(tutorialProgress));document.getElementById("tutorialSaveStatus").textContent="";}
 catch(_){document.getElementById("tutorialSaveStatus").textContent=typeof uiLabel==='function'?uiLabel('saveTutorial'):"Не удалось сохранить обучение. После перезагрузки подсказки могут повториться.";}
}
function tutorialVisible(id){const el=document.getElementById(id);return !!el&&!el.classList.contains("hidden");}
function tutorialContext(){
 if(tutorialVisible("dragonVictory"))return null;
 if(tutorialVisible("start"))return "welcome";
 if(tutorialVisible("pause"))return "menu";
 if(levelOpen())return "upgrade";
 if(!running||paused||ult.on||dragonFinale)return null;
 const seen=tutorialProgress.seen;
 if(!seen.move)return "move";
 if(typeof isBossStage==='function'&&isBossStage(P.stage)&&!seen.altar)return "altar";
 if(P.runMs>=8000&&!seen.health)return "health";
 if(P.item&&!seen.item)return "item";
 if(ultReady()&&!seen.ultimate)return "ultimate";
 if(Object.values(inventory).some(n=>n>0)&&!seen.inventory)return "inventory";
 if(P.runMs>=22000&&!seen.menu)return "menu";
 return null;
}
function tutorialBounds(target){
 const width=innerWidth,height=innerHeight;
 if(target==="hero")return {left:width/2-42,top:height/2-55,width:84,height:100};
 if(target==="health")return {left:8,top:8,width:Math.min(264,width*.57),height:54};
 if(target==="timer")return {left:width-150,top:8,width:138,height:54};
 if(target==="ultimate")return {left:width/2-36,top:height-84,width:72,height:72};
 const el=document.getElementById(target);if(!el||!el.getClientRects().length)return null;
 const b=el.getBoundingClientRect();if(!b.width||!b.height||b.top>=height||b.left>=width||b.top+b.height<=0)return null;
 const left=Math.max(6,b.left),top=Math.max(6,b.top);
 return {left,top,width:Math.max(0,Math.min(width-6,b.left+b.width)-left),height:Math.max(0,Math.min(height-6,b.top+b.height)-top)};
}
function positionTutorial(){
 if(!tutorialActive)return;
 const b=tutorialBounds(TUTORIAL_STEPS[tutorialActive.id].target),spot=document.getElementById("tutorialSpot"),card=document.getElementById("tutorialCard");
 card.style.left=Math.max(14,(innerWidth-Math.min(350,innerWidth-28))/2)+"px";
 const cardHeight=card.getBoundingClientRect().height||240;
 let top=b&&b.top+b.height/2>innerHeight/2?16:innerHeight-cardHeight-16;
 top=Math.max(16,Math.min(innerHeight-cardHeight-16,top));card.style.top=top+"px";
 const overlap=b&&b.top<top+cardHeight&&b.top+b.height>top;
 spot.classList.toggle("hidden",!b||overlap);
 if(b){spot.style.left=b.left+"px";spot.style.top=b.top+"px";spot.style.width=b.width+"px";spot.style.height=b.height+"px";}
}
function showTutorial(id){
 if(!TUTORIAL_STEPS[id]||tutorialActive)return;
 tutorialActive={id,paused,focus:document.activeElement};if(running)paused=true;pointer.active=false;
 const step=typeof localizedTutorialStep==="function"?localizedTutorialStep(id,TUTORIAL_STEPS[id]):TUTORIAL_STEPS[id];document.getElementById("tutorialTitle").textContent=step.title;document.getElementById("tutorialText").textContent=step.text;document.getElementById("tutorialTag").textContent=step.tag;
 document.getElementById("tutorial").classList.remove("hidden");positionTutorial();document.getElementById("btnTutorialNext").focus({preventScroll:true});
 document.getElementById("gameGuideBtn").classList.add("hidden");
}
function finishTutorial(skip=false){
 if(!tutorialActive||(typeof Playables!=="undefined"&&Playables.blocked))return;
 const old=tutorialActive;tutorialProgress.seen[old.id]=true;if(skip)tutorialProgress.disabled=true;
 tutorialActive=null;document.getElementById("tutorial").classList.add("hidden");pointer.active=false;
 if(running&&!old.paused&&!userPaused&&!levelOpen()&&!dragonBookOpen()&&!dragonHomeOpen())paused=false;
 if(old.focus?.isConnected)old.focus.focus({preventScroll:true});
 tutorialNextAt=performance.now()+6500;saveTutorial();
}
function tickTutorial(now){
 if(typeof settingsOpen==='function'&&settingsOpen())return;
 if(typeof adminPanelOpen==='function'&&adminPanelOpen())return;
 if(typeof languageMenuOpen==="function"&&languageMenuOpen())return;
 if(now<tutorialCheckAt)return;tutorialCheckAt=now+250;
 const guide=document.getElementById("gameGuideBtn"),section=dragonHomeOpen()||dragonBookOpen();
 const inMenu=section||tutorialVisible("start")||tutorialVisible("pause")||tutorialVisible("over")||tutorialVisible("dragonVictory");
 guide.classList.toggle("hidden",!inMenu||gameHelpOpen()||tutorialOpen());guide.style.top=section?"auto":"14px";guide.style.bottom=section?"14px":"auto";
 if(tutorialActive){positionTutorial();return;}
 if(tutorialProgress.disabled||gameHelpOpen()||(typeof Playables!=="undefined"&&Playables.blocked))return;
 const id=tutorialContext();
 // First movement and newly opened screens explain themselves immediately; battle tips are spaced out.
 if(now<tutorialNextAt&&["health","item","ultimate","inventory","menu"].includes(id))return;
 if(id&&!tutorialProgress.seen[id])showTutorial(id);
}
function replayTutorial(){
 if(typeof Playables!=="undefined"&&Playables.blocked)return;
 closeGameHelp();tutorialProgress={version:1,disabled:false,seen:{}};tutorialNextAt=0;tutorialCheckAt=0;
 // Show the current section, then teach future situations as the player encounters them.
 const id=tutorialContext();if(id)showTutorial(id);saveTutorial();
}
document.getElementById("btnTutorialNext").onclick=()=>finishTutorial();
document.getElementById("btnTutorialSkip").onclick=()=>finishTutorial(true);
document.getElementById("btnReplayTutorial").onclick=replayTutorial;
document.addEventListener("keydown",e=>{
 if(!tutorialOpen())return;
 if(e.key==="Escape"||e.code==="Escape"){e.preventDefault();finishTutorial(true);}
 else if(e.key==="Tab"){e.preventDefault();const a=document.getElementById("btnTutorialNext"),b=document.getElementById("btnTutorialSkip");(document.activeElement===a?b:a).focus({preventScroll:true});}
 e.stopImmediatePropagation();
},true);
addEventListener("resize",positionTutorial);
