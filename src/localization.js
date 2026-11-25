"use strict";
const LANGUAGE_KEY="vacky_language_v1";
const SOUND_KEY="vacky_sound_muted_v1";
function loadAudioMuted(){try{return languageStorage().getItem(SOUND_KEY)==="1";}catch(_){return false;}}
let userAudioMuted=loadAudioMuted();
function refreshSoundButtons(){
 const hostMuted=typeof Playables!=="undefined"&&!Playables.audioAllowed;
 for(const el of document.querySelectorAll("[data-sound]")){
  el.setAttribute("aria-pressed",String(userAudioMuted));
  const text=uiLabel(userAudioMuted?"soundOn":hostMuted?"soundHost":"soundOff");
  el.setAttribute("aria-label",text);el.setAttribute("title",text);
  el.classList.toggle("sound-muted",userAudioMuted||hostMuted);
 }
 if(typeof refreshSettingsLabels==='function')refreshSettingsLabels();
}
function toggleGameSound(){
 if(typeof Playables!=="undefined"&&Playables.blocked)return false;
 userAudioMuted=!userAudioMuted;let saved=true;
 try{languageStorage().setItem(SOUND_KEY,userAudioMuted?"1":"0");}catch(_){saved=false;}
 try{if(!userAudioMuted)audio();platformAudio(typeof Playables==="undefined"||Playables.audioAllowed);}catch(_){}
 refreshSoundButtons();
 for(const el of document.querySelectorAll("[data-language-status]"))el.textContent=saved?"":uiLabel("saveSound");
 return saved;
}
const UI_LABELS={
 settings:['Настройки','Settings'],
 bestStage:["Лучшая стадия","Best stage"],campHint:["Нажми на героя, собаку, стенд или сундук","Tap the hero, dog, weapon rack or chest"],
 mainMenu:["В ГЛАВНОЕ МЕНЮ","MAIN MENU"],newRun:["НОВЫЙ ЗАБЕГ","NEW RUN"],
 soundOn:["Включить звук","Enable sound"],soundOff:["Выключить звук","Mute sound"],soundHost:["Звук выключен площадкой","Sound disabled by platform"],saveSound:["Не удалось сохранить настройку звука.","Could not save sound preference."],
 stage:["Стадия","Stage"],level:["Уровень","Level"],defeated:["Побеждено","Defeated"],
 play:["ИГРАТЬ","PLAY"],resume:["ПРОДОЛЖИТЬ","RESUME"],restart:["ЗАНОВО","NEW RUN"],pause:["Пауза","Paused"],language:["Язык","Language"],
 tagline:["Выживи 20 стадий. Собери снаряжение. Дойди до финала.","Survive 20 stages. Gear up. Reach the finale."],
 gotit:["Понятно","Got it"],skip:["Пропустить обучение","Skip tutorial"],replay:["Повторить обучение","Replay tutorial"],guide:["Путеводитель по игре","Game guide"],close:["Закрыть ✕","Close ✕"],
 saveError:["Не удалось сохранить язык. После выхода выбор может сброситься.","Could not save your language. It may reset after you leave."],
 saveTutorial:["Не удалось сохранить обучение. После перезагрузки подсказки могут повториться.","Could not save tutorial progress. Tips may reappear after reloading."]
};
function languageStorage(){return typeof Playables!=="undefined"?Playables.storage:localStorage;}
function loadLanguage(){
 try{const v=languageStorage().getItem(LANGUAGE_KEY);if(LANGUAGE_NAMES[v])return v;}catch(_){}
 const detected=typeof Playables!=="undefined"&&Playables.provider==="Playgama"?Playables.language:(typeof navigator!=="undefined"?navigator.language:(typeof Playables!=="undefined"?Playables.language:"ru"));
 const code=String(detected||"en").toLowerCase().split(/[-_]/)[0];
 return LANGUAGE_NAMES[code]?code:"en";
}
let uiLanguage=loadLanguage();
let languageReturnFocus=null,languageMenuActive=false;
function languageMenuOpen(){return languageMenuActive;}
function openLanguageMenu(trigger){
 if((typeof Playables!=="undefined"&&Playables.blocked)||(typeof tutorialOpen==="function"&&tutorialOpen()))return;
 languageReturnFocus=trigger||document.activeElement;languageMenuActive=true;
 if(typeof pointer!=="undefined")pointer.active=false;
 document.getElementById("languageDialog").classList.remove("hidden");
 document.getElementById("languageDialog").hidden=false;
 applyLanguage();
 [...document.querySelectorAll("[data-choose-language]")].find(el=>el.dataset.chooseLanguage===uiLanguage)?.focus({preventScroll:true});
}
function closeLanguageMenu(){
  languageMenuActive=false;document.getElementById("languageDialog").classList.add("hidden");
 document.getElementById("languageDialog").hidden=true;
 for(const el of document.querySelectorAll("[data-language]"))el.setAttribute?.("aria-expanded","false");
 if(typeof pointer!=="undefined")pointer.active=false;
 languageReturnFocus?.focus?.({preventScroll:true});languageReturnFocus=null;
}
function uiLabel(key,fallback=key){return LANGUAGE_PACKS[uiLanguage]?.ui[key]??UI_LABELS[key]?.[uiLanguage==="ru"?0:1]??fallback;}
function applyLanguage(){
 if(typeof refreshRankingLabels==='function')refreshRankingLabels();
 document.documentElement?.setAttribute("lang",uiLanguage);
 for(const el of document.querySelectorAll("[data-i18n]"))el.textContent=uiLabel(el.dataset.i18n,el.textContent);
 for(const el of document.querySelectorAll("[data-language]")){
  el.value=uiLanguage;
  el.setAttribute?.("title",uiLabel("language")+": "+LANGUAGE_NAMES[uiLanguage]);
  el.setAttribute?.("aria-expanded",String(languageMenuActive));
 }
 for(const el of document.querySelectorAll("[data-language-name]")){el.textContent=LANGUAGE_NAMES[uiLanguage];el.setAttribute?.("dir","auto");}
 for(const el of document.querySelectorAll(".main-menu-shell,.language-card,#tutorialCard,.game-help-card"))el.setAttribute("dir",uiLanguage==="ar"?"rtl":"ltr");
 for(const el of document.querySelectorAll("[data-choose-language]"))el.setAttribute("aria-pressed",String(el.dataset.chooseLanguage===uiLanguage));
 refreshSoundButtons();
 const guide=document.getElementById("gameGuideBtn");guide?.setAttribute("aria-label",uiLabel("guide"));
 document.getElementById("btnCloseHelp")?.setAttribute("aria-label",uiLabel("close"));
 document.getElementById("btnCloseLanguage")?.setAttribute("aria-label",uiLabel("close"));
 document.getElementById("menuScene")?.setAttribute("aria-label",uiLabel("campHint")+" · ← / → · Enter");
 if(typeof refreshMenuRecord==='function')refreshMenuRecord();
 if(typeof refreshCampMenu==='function')refreshCampMenu();
 if(typeof refreshRunCheckpointLabel==='function')refreshRunCheckpointLabel();
 const ru=uiLanguage==='ru';
 const pause=document.getElementById('pauseBtn');
 pause?.setAttribute('title',ru?'Меню и пауза (P)':'Menu and pause (P)');
 pause?.setAttribute('aria-label',ru?'Открыть меню и приостановить игру':'Open menu and pause the game');
 document.getElementById('btnCloseCamp')?.setAttribute('aria-label',uiLabel('close'));
 const finale=document.getElementById('victoryTag');
 if(finale)finale.textContent=ru?'20 СТАДИЙ · ФИНАЛ ПРОЙДЕН':'20 STAGES · FINALE COMPLETE';
 if(typeof syncHUD==='function')syncHUD();
}
function setGameLanguage(lang){
 if(!LANGUAGE_NAMES[lang]||(typeof Playables!=="undefined"&&Playables.blocked))return false;
 uiLanguage=lang;let saved=true;try{languageStorage().setItem(LANGUAGE_KEY,lang);}catch(_){saved=false;}
 applyLanguage();
 for(const el of document.querySelectorAll("[data-language-status]"))el.textContent=saved?"":uiLabel("saveError");
 if(typeof refreshPauseStats==="function")refreshPauseStats();
 return saved;
}
function initLocalization(){
 for(const el of document.querySelectorAll("[data-sound]"))el.onclick=toggleGameSound;
 for(const el of document.querySelectorAll("[data-language]")){
  el.onchange=()=>setGameLanguage(el.value);
  el.onclick=()=>openLanguageMenu(el);
 }
 for(const el of document.querySelectorAll("[data-choose-language]"))el.onclick=()=>{
  if(setGameLanguage(el.dataset.chooseLanguage))closeLanguageMenu();
 };
 const dialog=document.getElementById("languageDialog");
 dialog?.addEventListener?.("click",e=>{if(e.target===dialog)closeLanguageMenu();});
 const close=document.getElementById("btnCloseLanguage");if(close)close.onclick=closeLanguageMenu;
 document.addEventListener?.("keydown",e=>{
  if(!languageMenuOpen())return;
  if(e.key==="Escape"){e.preventDefault();closeLanguageMenu();}
  else if(e.key==="Tab"){
   e.preventDefault();const buttons=[document.getElementById("btnCloseLanguage"),...document.querySelectorAll("[data-choose-language]")];
   const index=buttons.indexOf(document.activeElement);
   buttons[(index+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus({preventScroll:true});
  }
  e.stopImmediatePropagation();
 },true);
 applyLanguage();
}
const TUTORIAL_EN={
 welcome:["Welcome!","Start with Play. Tips will appear as you discover the game and point out the controls. Combat pauses while you read.","Getting started"],
 move:["Move and dodge","On a phone, drag your finger across the arena. With a mouse, move the pointer. Your hero follows it and aims and shoots automatically. Press Got it, then try moving away from the red enemies.","Your first battle"],
 health:["Health and experience","Your health and XP bar are at the top left. Defeated enemies grant XP immediately. Keep moving so the red enemies cannot surround you.","The basics"],
 upgrade:["Your first upgrade","Choose one card to improve your hero, weapon or combat pet. XP raises your level; time advances the stages. These are separate kinds of progress.","Level up"],
 item:["You found an item","Use this button to activate a mine, grenade or ice. You can also press Space. The item is consumed, so choose your moment.","A useful find"],
 ultimate:["Ultimate ready","The lightning bolt at the bottom activates your hero's powerful move. Tap it, double-tap the arena, or spread two fingers on a phone. The charge builds up again after use.","A powerful move"],
 inventory:["Your ability stash","Airstrike, toxic fog and tank charges come from rare chests. Tap a slot to spend one charge. Unused charges survive defeat and remain after you leave.","A rare find"],
 menu:["This is the menu","Pause is at the top left. The menu lets you resume, start a new run, choose your language or toggle sound. The single question mark opens the full guide and lets you replay this tutorial.","Finding your way"],
 altar:["Night bosses",BOSS_RULES.en,"Boss battle"],
};
function localizedTutorialStep(id,original){
 if(id==='altar')return {...original,title:'5 · 10 · 15 · 20',text:BOSS_RULES[uiLanguage]||BOSS_RULES.en};
 const v=LANGUAGE_PACKS[uiLanguage]?.tips[id]||TUTORIAL_EN[id];
 if(id==='inventory')return {...original,title:v?.[0]||original.title,text:abilityMenuHint()+' '+(uiLanguage==='ru'?original.text:v?.[1]||original.text),tag:v?.[2]||original.tag};
 return uiLanguage!=="ru"&&v?{...original,title:v[0],text:v[1],tag:v[2]||uiLabel("guide")}:original;
}
const HELP_EN={
 run:{title:"How to play",text:["Drag a finger or move the mouse pointer to guide your hero. Your weapon aims and fires automatically. Defeat red enemies, earn XP and pick upgrades.","There are 20 one-minute stages. After that, the altar appears: stay in its circle for two seconds to summon the final dragon. You may keep playing for up to five extra minutes before the dragon arrives automatically.","Use the bottom-right button or Space for your current mine, grenade or ice. Activate your ultimate with the lightning bolt, a double tap, or a two-finger spread.","Health and hero XP are at the top left; stage progress is separate and depends on time. The mini-map shows objects and the final altar.","Rare chests grant one random airstrike, toxic fog or tank charge. Slots beside the ultimate show your stash. Each activation spends one charge; unused charges persist after defeat and leaving the game."]},
 restart:{title:"Starting a new run",text:["A new run resets the current battle and its hero upgrades, starting again at stage one.","Permanent upgrades and unused inventory charges remain. Spent charges are not refunded."]},
 resume:{title:"Resume your run",text:["Closes the pause menu and continues the same battle. Stage time does not advance while the pause menu is open."]}
};
function abilityMenuHint(){return uiLanguage==='ru'?'Нажми кнопку с чемоданчиком справа над предметом: три способности раскроются в ряд влево. Выбери одну — меню свернётся. Открытие меню не тратит заряды.':'Tap the case button on the right, above your item, to reveal three abilities in a row to the left. Choose one to use it and close the row. Opening the menu costs no charges.';}
function localizedHelp(topic,original){
 const pack=LANGUAGE_PACKS[uiLanguage];let result=uiLanguage==="en"?(HELP_EN[topic]||original):original;
 const ids={run:["move","health","upgrade","item","ultimate","inventory","altar"],restart:["restart"],resume:["resume"]}[topic];
 if(!ids)return original;
 if(pack)result={title:pack.tips[ids[0]][0],text:ids.map(id=>pack.tips[id][1])};
 if(topic==='run'&&result)result={...result,text:[...result.text,uiLanguage==='ru'?
  'Красная дуга показывает, откуда пришёл удар; кольцо — урон от опасной зоны. Золотой след на здоровье показывает потерянные HP. После перезарядки начинается новый залп — атакуй, пока босс перезаряжается! Золотое кольцо и подпись означают уязвимость: +40% урона, с прежним ограничением урона за одно попадание. Таран оглушается о камни, колдун устаёт после заклинания. Тонкая золотая полоска показывает, сколько осталось до конца окна.':
  'A red arc points toward an incoming hit; a ring means area damage. The gold health trail shows lost HP. Attack while a boss reloads or recovers: a gold ring and label mark a +40% damage window, with the existing per-hit cap. The juggernaut staggers against rocks; the sorcerer tires after a spell. The thin gold bar shows how much time remains.']};
 if(topic==='run'&&result)result={...result,text:[...result.text,uiLanguage==='ru'?
  'Передышка — меньше новых врагов, а не безопасность: оставшиеся враги продолжают бой. На обычной стадии давление плавно растёт до короткого натиска, затем снижается; таймер рядом показывает время до следующей стадии. Рюкзак использует собственные одинаковые модули для любого оружия. Дробовик лучше работает вблизи: на расстоянии дробь теряет урон.':
  'A breather reduces reinforcements; surviving enemies still fight. Normal stages build toward a short surge, then ease off. The adjacent timer counts down to the next stage. Backpack modules have their own damage, regardless of the weapon in your hands. Shotguns work best up close: pellet damage falls with distance.']};
 return result;
}
HELP_EN.run.text[1]=BOSS_RULES.en;
HELP_EN.run.text[3]='Health and hero XP are at the top left; stage progress is at the top right. Defeat bosses to advance; other stages are timed.';
HELP_EN.run.text[4]='Rare chests grant an airstrike, toxic fog or tank charge. The case button on the right, above your item, opens their slots to the left. Choose an ability to spend one charge and close the row. Unused charges persist after defeat and leaving the game.';
