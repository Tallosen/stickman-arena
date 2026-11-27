"use strict";
// Local QA tools, with the same mutations/reward handlers used by normal gameplay.
let adminOwner=null,adminNodes=null,adminResetArmed=false;
const adminAllowed=()=>DRAGON_ADMIN_ENABLED&&typeof Playables!=='undefined'&&Playables.testStorage===true&&!Playables.cloud&&!Playables.blocked;
const adminPanelOpen=()=>!!adminOwner;
function adminConflict(){
 if(typeof rankingOpen==='function'&&rankingOpen())return true;
 if(typeof bossLootLocked==='function'&&bossLootLocked())return true;
 if(typeof arenaEnding!=='undefined'&&arenaEnding)return true;
 if(typeof settingsOpen==='function'&&settingsOpen())return true;
 return tutorialOpen()||gameHelpOpen()||languageMenuOpen()||campDialogOpen()||runConfirmOpen()||levelOpen()||!!bossRewardPending||!!menuDeparture||ult.on||!!dragonFinale;
}
function adminOpen(){
 if(!adminAllowed()||adminOwner||adminConflict())return false;
 adminOwner={paused,userPaused,focus:document.activeElement};paused=true;pointer.active=false;adminResetArmed=false;
 adminNodes.overlay.classList.remove('hidden');adminRefresh();adminNodes.close.focus();return true;
}
function adminClose(){
 if(!adminOwner)return false;
 const old=adminOwner;adminOwner=null;adminResetArmed=false;
 paused=old.paused;userPaused=old.userPaused;pointer.active=false;
 adminNodes?.overlay.classList.add('hidden');old.focus?.focus?.({preventScroll:true});return true;
}
function adminBattleReady(){return adminAllowed()&&running&&!P.runWon&&!adminConflict();}
function adminBattle(action){
 if(typeof runSaveAction==='function'&&!runSaveDepth)return runSaveAction(()=>adminBattle(action),true);
 if(!adminBattleReady())return false;
 adminClose();paused=false;userPaused=false;menuHasRun=false;P.testRun=true;pointer.active=false;
 for(const id of ['start','pause'])document.getElementById(id).classList.add('hidden');
 P.runMs=Math.max(1,P.runMs);action();syncHUD();return true;
}
function adminStart(withTutorial=false){
 if(typeof runSaveAction==='function'&&!runSaveDepth)return runSaveAction(()=>adminStart(withTutorial),true);
 if(!adminAllowed()||running||adminConflict())return false;
 adminClose();tutorialProgress={version:1,disabled:!withTutorial,seen:{}};saveTutorial();
 for(const id of ['pause','over','dragonVictory'])document.getElementById(id).classList.add('hidden');
 paused=false;start();P.testRun=true;return true;
}
function adminJump(stage,type=null){
 if(!Number.isInteger(stage)||stage<1||stage>20||type!==null&&!CAMP_BOSSES.includes(type))return false;
 return adminBattle(()=>{
  enemies=[];bossMarks=[];bossProjectiles=[];stageBoss=null;dragonAssist=null;dragonAssistWait=0;resetEnemyHazards();
  // Jumping bypasses earlier gates, but creates no fictitious boss kills or rewards.
  defeatedBossStages.clear();for(const n of [5,10,15,20])if(n<stage)defeatedBossStages.add(n);
  enterRunStage(stage);
  if(type&&stageBoss){
   const spec={...stageBoss.spec,...BOSS_ARCHETYPES.find(b=>b.id===type)};
   stageBoss.spec=spec;Object.assign(stageBoss.enemy,{bossSpec:spec,r:spec.r,speed:spec.speed});lastBossArchetype=type;
  }
 });
}
function adminDefeatBoss(){
 if(!stageBoss||stageBoss.enemy.rewarded)return false;
 return adminBattle(()=>{
  const enemy=stageBoss.enemy;enemy.hp=0;popEnemy(enemy);
  // XP may open a level card. Boss reward gets priority; queued cards are retained.
  paused=false;updateRunProgress(0);
 });
}
function adminCampFixture(id){
 // All fixtures are QA-only. Reset detaches the current run's quest checkpoint.
 if(!adminAllowed()||adminConflict()||!['all','reset',...CAMP_GOALS.map(g=>g.id)].includes(id))return false;
 if(campDraft||campReadOnly)return false;
 const next=id==='reset'?blankCamp():JSON.parse(JSON.stringify(campProfile));
 if(id==='reset')for(const key of ['parts','rangeTier','rangeBest'])next[key]=campProfile[key];
 const fill=key=>{
  if(key==='first')next.bosses=Math.max(1,next.bosses);
  if(key==='ten')next.stage=Math.max(10,next.stage);
  if(key==='crowd')next.kills=Math.max(500,next.kills);
  if(key==='clear'){next.wins=Math.max(1,next.wins);next.stage=20;}
  if(key==='collection')next.bossTypes=[...CAMP_BOSSES];
  if(key==='shotgun')next.shotgunStage=Math.max(10,next.shotgunStage);
  if(key==='clean')next.clean=Math.max(1,next.clean);
  if(key==='trial'){next.wins=Math.max(1,next.wins);next.trialWins.rush=true;}
 };
 if(id==='all')CAMP_GOALS.forEach(g=>fill(g.id));else fill(id);
 if(!saveCamp(next))return false;
 // An ended run must not repopulate cleared stage goals on the next start().
 if(id==='reset')P.campRun=null;
 refreshCampMenu();return true;
}
function adminNextCampGoal(){
 const goal=campNextGoal();if(!goal||!adminCampFixture(goal.id))return false;
 adminClose();
 // Let the tester see the new decoration immediately, without opening a journal.
 if(running)returnToMainMenu();else{
  for(const id of ['over','dragonVictory'])document.getElementById(id).classList.add('hidden');
  document.getElementById('start').classList.remove('hidden');menuHasRun=false;syncMainMenu();
 }
 menuScenePainted=false;return true;
}
function adminViewCamp(){
 if(!adminAllowed()||adminConflict())return false;
 adminClose();if(running){returnToMainMenu();}else{
  for(const id of ['over','dragonVictory'])document.getElementById(id).classList.add('hidden');
  document.getElementById('start').classList.remove('hidden');menuHasRun=false;syncMainMenu();
 }
 return openCampPanel();
}
function adminSupply(kind){
 if(!adminAllowed()||!ABILITY_KEYS.includes(kind))return false;
 const next={...inventory,[kind]:Math.min(999,inventory[kind]+5)};
 if(!saveInventory(next))return false;
 Object.assign(inventory,next);if(running)P.testRun=true;return true;
}
function adminRefresh(message=''){
 if(!adminNodes)return;
 adminNodes.status.textContent=(message?message+'\n':'')+(running?'Стадия '+P.stage+'/20 · HP '+P.hp+'/'+P.hpMax+' · уровень '+P.lvl:'Забег не запущен')+
  '\nЗадания: '+CAMP_GOALS.filter(g=>campUnlocked(g.id)).length+'/8 · '+campProfile.kills+' врагов · '+campProfile.bosses+' боссов'+
  '\nЗапасы: авиаудар '+inventory.airstrike+' · туман '+inventory.gas+' · танк '+inventory.tank+
  (campSaveError?'\nОшибка сохранения — повтори запись в меню лагеря.':'');
 for(const item of adminNodes.actions)item.button.disabled=!adminAllowed()||!item.available();
 adminNodes.reset.textContent=adminResetArmed?'Подтвердить сброс всех заданий':'Сбросить все задания лагеря';
}
function initAdminUI(){
 if(!DRAGON_ADMIN_ENABLED||!Playables.testStorage||Playables.cloud)return;
 const make=(tag,text,parent)=>{const e=document.createElement(tag);if(text)e.textContent=text;parent?.appendChild(e);return e;};
 const launch=make('button','ADMIN · TEST',document.body);launch.className='qa-launch';launch.id='adminLaunch';launch.type='button';launch.setAttribute('aria-label','Открыть тестовую админ-панель');launch.onclick=adminOpen;
 const overlay=make('section',null,document.body);overlay.id='adminPanel';overlay.className='qa-overlay hidden';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','adminTitle');
 const card=make('div',null,overlay);card.className='qa-card';const header=make('header',null,card);
 make('h2','Тестовая панель',header).id='adminTitle';const close=make('button','Закрыть ×',header);close.onclick=adminClose;
 make('p','Отдельный QA-профиль. Награды и задания сохраняются здесь, обычный прогресс не меняется. В открытой панели бой стоит на паузе.',card);
 const status=make('p',null,card);status.className='qa-status';status.setAttribute('role','status');
 adminNodes={overlay,close,status,actions:[],reset:null};
 const group=(title,note)=>{make('h3',title,card);if(note)make('small',note,card);const grid=make('div',null,card);grid.className='qa-grid';return grid;};
 const button=(grid,label,fn,available=()=>true)=>{
  const b=make('button',label,grid);b.type='button';adminNodes.actions.push({button:b,available});
  b.onclick=()=>{if(!adminAllowed()||!adminOwner||!available())return;const ok=fn();if(adminOwner)adminRefresh(ok===false?'Не выполнено. Проверь состояние забега или сохранение.':'Готово.');};return b;
 };
 let grid=group('Быстрая проверка лагеря','Все 8 заданий и их награды одним нажатием. Работает и во время забега: герой, снаряжение и текущий бой не меняются. Только QA-профиль.');
 button(grid,'Завершить все задания лагеря',()=>adminCampFixture('all'));
 button(grid,'Мастерская · +56 деталей',()=>runSaveAction(()=>{const next=campDraft||campProfile;const ok=saveCamp({...next,parts:Math.min(1e9,next.parts+56)});if(ok)refreshCampMenu();return ok;},true));
 button(grid,'Выполнить следующее задание → лагерь',adminNextCampGoal,()=>!!campNextGoal());
 adminNodes.reset=button(grid,'Сбросить все задания лагеря',()=>{
  if(!adminResetArmed){adminResetArmed=true;return true;}
  const ok=adminCampFixture('reset');adminResetArmed=false;return ok;
 });adminNodes.reset.className='qa-danger';
 make('small','Следующее задание выполняется по порядку и возвращает к сцене лагеря. Сброс требует второго нажатия; текущий тестовый забег после сброса больше не записывает задания — для обычного зачёта начни новый.',card);
 grid=group('Забег','Новый тест запускается без обучения. Чтобы заменить текущий забег, сначала заверши его или используй «Заново» в обычном меню.');
 button(grid,'Начать тест',()=>adminStart(),()=>!running);
 button(grid,'Первый запуск с обучением',()=>adminStart(true),()=>!running);
 button(grid,'Завершить поражением',()=>adminBattle(()=>gameOver()),()=>running);
 button(grid,'Открыть задания / экипировку',adminViewCamp);
 grid=group('Стадии и боссы','Переход пропускает предыдущих боссов без наград. «Победить босса» запускает обычную выдачу XP, награды и зачёт задания.');
 button(grid,'+ Стадия',()=>adminJump(P.stage+1),()=>running&&P.stage<20);
 for(const stage of [5,10,15,20])button(grid,'На стадию '+stage,()=>adminJump(stage),()=>running);
 for(const [id,label] of [['bruiser','Таран'],['gunner','Стрелок'],['shaman','Шаман'],['hunter','Охотник']])button(grid,label,()=>adminJump(isBossStage(P.stage)?P.stage:Math.min(20,Math.ceil(P.stage/5)*5),id),()=>running);
 button(grid,'Победить босса → награда',adminDefeatBoss,()=>running&&!!stageBoss&&!stageBoss.enemy.rewarded);
 grid=group('Герой, предметы и способности','Действие закрывает панель и возвращает в бой. Награды боссов зависят от здоровья, заряда ульты и уровня снаряжения.');
 button(grid,'+ Уровень / выбор улучшения',()=>adminBattle(()=>{P.xp=P.xpNext-1;gainXP();}),()=>running);
 button(grid,'Полный комплект + питомец',()=>adminBattle(()=>devLaunchFinale()),()=>running);
 button(grid,'Выдать кабана',()=>adminBattle(()=>{P.pet=makePet('boar');pushOut(P.pet);}),()=>running);
 button(grid,'Полное здоровье',()=>adminBattle(()=>{P.hp=P.hpMax;}),()=>running);
 button(grid,'Оставить 1 HP',()=>adminBattle(()=>{P.hp=1;}),()=>running);
 button(grid,'Зарядить ульту',()=>adminBattle(()=>{ult.charge=ULT_FULL;}),()=>running);
 button(grid,'Ульта дракона · оружие 4/4',()=>adminBattle(()=>{P.gear.gun=GEAR.gun.max;applyGear();ult.forceMode=null;ult.charge=ULT_FULL;}),()=>running);
 button(grid,'Обнулить заряд ульты',()=>adminBattle(()=>{ult.charge=0;}),()=>running);
 for(const [weapon,variants] of Object.entries(EMPOWERED_ULTS))for(const variant of variants){
  button(grid,'Ульта 4/4 · '+variant.name,()=>adminBattle(()=>{P.wtype=weapon;P.gear.gun=GEAR.gun.max;applyGear();ult.forceMode=null;ult.forceSignature=variant.id;ult.charge=ULT_FULL;}),()=>running);
 }
 button(grid,'Редкий сундук рядом',()=>adminBattle(spawnRareChestNearPlayer),()=>running);
 for(const w of DROP_WEAPONS)button(grid,'Авиадроп · '+WEAPONS[w].name,()=>adminBattle(()=>{resetWeaponDelivery();return launchWeaponDelivery(w);}),()=>running);
 button(grid,'Авиадроп · +75 с прокачки',()=>adminBattle(()=>{if(P.dropWeapon!==P.wtype||!isDropWeapon(P.wtype))return false;P.dropWeaponMs+=DROP_UPGRADE_MS;P.gear.gun=Math.min(4,Math.floor(P.dropWeaponMs/DROP_UPGRADE_MS));applyGear();return true;}),()=>running&&P.dropWeapon===P.wtype&&isDropWeapon(P.wtype));
 button(grid,'Секреты / компас',()=>adminBattle(devTestCompass),()=>running);
 button(grid,'Снайперская ульта: следующая',()=>adminBattle(()=>{P.wtype='sniper';applyGear();ult.forceMode=SNIPER_ULT_MODES[devSniperIndex++%SNIPER_ULT_MODES.length];ult.weaponBag='sniper';ult.charge=ULT_FULL;}),()=>running);
 button(grid,'Дракон-помощник: следующий',()=>adminBattle(()=>devLaunchFinale(DEV_DRAGONS[devDragonIndex++%DEV_DRAGONS.length])),()=>running);
 for(const [kind,label] of [['airstrike','Авиаудар'],['gas','Химический туман'],['tank','Танк']])button(grid,label+' +5',()=>adminSupply(kind));
 grid=group('Задания лагеря','Можно выполнить конкретное задание отдельно. Для последовательного развития используй «Выполнить следующее задание» вверху.');
 button(grid,'+100 врагов (зачёт задания)',()=>adminBattle(()=>{score+=100;checkpointCamp();}),()=>running);
 for(const goal of CAMP_GOALS)button(grid,'Выполнить: '+campText(goal.id),()=>adminCampFixture(goal.id));
 grid=group('Проверка новых звуков','Включи звук в настройках. Кнопки только воспроизводят звук, не меняют забег, задания или запасы. Каждый пример останавливает предыдущий.');
 for(const [name,label] of [['rifle','Ружьё'],['shotgun','Дробовик'],['sniper','Снайперка'],['minigun','Миниган'],['boom','Взрыв'],['hurt','Получение урона'],['ultimate','Ульта'],['dragon','Рычание дракона'],['breath','Огненное дыхание'],['boss','Появление босса'],['chest','Награда'],['victory','Победа']]){
  const preview=button(grid,'Звук · '+label,()=>{stopGameSounds();return playSound(name);});preview.dataset.soundPreview='true';
 }
 button(grid,'Остановить звуки',()=>{stopGameSounds();return true;}).dataset.soundPreview='true';
 button(grid,'Послушать · Крылья',()=>{stopGameSounds();return SFX.wings(P.x);}).dataset.soundPreview='true';
 grid=group('Ящики, гранаты и ульта · новые эффекты','Короткие звуки действий. Прослушивание не расходует предметы и заряд ульты.');
 for(const [name,label] of [['pickup','Подбор ящика'],['chest','Награда из сундука'],['crateLand','Приземление ящика'],['grenadeThrow','Бросок гранаты'],['grenadeBlast','Взрыв гранаты'],['ultimate','Начало ульты'],['ultImpact','Удар ульты']]){
  button(grid,'Эффект · '+label,()=>{stopGameSounds();return SFX[name]?.(P.x);}).dataset.soundPreview='true';
 }
 grid=group('Питомцы, мины и подбор · 0.175','В бою между голосами питомцев не меньше 5 секунд; курица — не чаще раза в 9 секунд. Прослушивание сбрасывает паузы только для проверки.');
 for(const [name,label] of [['petChicken','Курица'],['petDog','Собака'],['petCat','Кот'],['petParrot','Попугай'],['petBoar','Кабан'],['petMole','Крот'],['chirp','Цыплёнок'],['mineBlast','Мина'],['mineMini','Маленькая мина'],['petBlast','Взрыв питомца']]){
  button(grid,'Тихий эффект · '+label,()=>{stopGameSounds();return playSound(name,P.x,null,name.startsWith('pet')&&name!=='petBlast'?.62:name==='chirp'?.45:name==='mineMini'?.75:name==='petBlast'?.8:1);}).dataset.soundPreview='true';
 }
 grid=group('Сравнение звуков · 30 событий','«Было»: снайперка — 0.177; уровень, сундук, авиаудар, газ и танк — 0.176; остальные — более ранние версии. «Стало» — текущий набор. Присланные MP3 не используются. Микшер одинаковый. Для восьми новых вариантов снайперки нажимай «Звук · Снайперка» несколько раз; подбор — «Эффект · Подбор ящика».');
 for(const [name,label] of [['rifle','Ружьё'],['shotgun','Дробовик'],['sniper','Снайперка'],['minigun','Миниган'],['hit','Попадание'],['boom','Взрыв'],['dragon','Дракон'],['breath','Дыхание'],['click','Кнопка'],['chest','Сундук'],['level','Уровень'],['heal','Лечение'],['victory','Победа'],['dead','Поражение'],['ultimate','Ульта'],['ice','Лёд'],['gas','Газ'],['tank','Танк'],['slash','Взмах оружия'],['build','Сборка']]){
  for(const recorded of [false,true])button(grid,(recorded?'Стало · ':'Было · ')+label,()=>{stopGameSounds();return playSound(name,null,null,1,recorded?true:'previous');}).dataset.soundPreview='true';
 }
 for(const [name,label] of [['pop','Красный враг — гибель'],['hurt','Удар врага по герою'],['wings','Крылья дракона'],['bite','Укус'],['revive','Возрождение'],['boss','Босс'],['airstrike','Авиаудар'],['turret','Турель'],['chirp','Питомец'],['petDown','Питомец ранен']]){
  for(const recorded of [false,true])button(grid,(recorded?'Стало · ':'Было · ')+label,()=>{stopGameSounds();return playSound(name,null,null,1,recorded?true:'previous');}).dataset.soundPreview='true';
 }
 make('p','Сброс касается только заданий, выбора экипировки и испытаний тестового профиля. Запасы способностей и обычные сохранения остаются. Для закрытия — Esc. Если открыта награда, обучение или другое окно, сначала закрой его.',card);
 overlay.addEventListener('pointerdown',e=>{e.stopPropagation();pointer.active=false;});
 // Capture runs before the gameplay hotkeys; Enter/Space still activate focused buttons.
 window.addEventListener('keydown',e=>{
  if(!adminOwner)return;
  e.stopImmediatePropagation();
  if(e.code==='Escape'){e.preventDefault();adminClose();return;}
  if(e.code==='Tab'){
   const buttons=[close,...adminNodes.actions.filter(i=>!i.button.disabled).map(i=>i.button)];
   const i=buttons.indexOf(document.activeElement),next=e.shiftKey?(i<=0?buttons.length-1:i-1):(i+1)%buttons.length;
   e.preventDefault();buttons[next].focus();
  }
 },true);
 document.body.classList.add('qa-panel-ready');
}
