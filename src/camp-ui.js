"use strict";
const CAMP_TEXT={
 title:['Мой лагерь','My camp'],close:['Закрыть','Close'],next:['Следующая цель','Next goal'],done:['Все награды открыты · попробуй другое испытание','All rewards unlocked · try another trial'],
 journal:['Путь героя','Hero journal'],loadout:['Оружие на старте','Starting weapon'],styles:['Цвет плаща','Cape colour'],trials:['Испытания','Trials'],
 intro:['Награды за игру, не за вход. Прогресс сохраняется после боссов, смены стадии и окончания забега.','Earn rewards by playing, not logging in. Progress saves after bosses, stage changes and at the end of a run.'],
 cosmetic:['Только внешний вид. В бою цвет появится, когда получишь плащ.','Appearance only. In battle, the colour appears when you obtain a cape.'],
 gearHint:['Выбор действует со следующего забега. Всё оружие начинает с уровня 0.','Choices apply to the next run. All weapons start at level 0.'],
 trialHint:['Откроются после победы на 20-й стадии. Одно испытание за забег; обычный режим всегда доступен.','Unlock after beating stage 20. One trial per run; normal mode is always available.'],
 open:['Открыто','Unlocked'],locked:['Закрыто','Locked'],selected:['Выбрано','Selected'],reward:['Награда','Reward'],new:['Открыто в этом забеге','Unlocked this run'],
 error:['Прогресс не удалось сохранить. Не закрывай игру: при следующей контрольной точке повторим попытку.','Progress could not be saved. Keep the game open: the next checkpoint will retry.'],
 readonly:['Сохранение лагеря не удалось прочитать. Оно не перезаписано; новые награды пока не сохраняются.','Camp save could not be read. It was not overwritten; new rewards cannot be saved yet.'],
 normal:['Обычный забег','Normal run'],rush:['Обычные враги · скорость +15%','Regular enemies · speed +15%'],elites:['Больше элит · появляются на 30% чаще','More elites · spawn 30% more often'],bosses:['Стойкие боссы · здоровье +25%','Tough bosses · health +25%'],
 classic:['Классический','Classic'],tide:['Морская волна','Tide'],ember:['Тлеющий огонь','Ember'],
 basic:['Ружьё','Basic gun'],shotgunWeapon:['Дробовик','Shotgun'],sniper:['Снайперка','Sniper'],minigun:['Миниган','Minigun'],
 first:['Победи первого босса','Defeat your first boss'],ten:['Дойди до стадии 10','Reach stage 10'],crowd:['Победи 500 врагов за любое число забегов','Defeat 500 enemies across any number of runs'],clear:['Победи финального босса','Defeat the final boss'],
 collection:['Победи все 4 вида боссов','Defeat all 4 boss types'],shotgun:['Начни с дробовиком и дойди до стадии 10, не меняя оружие','Start with a shotgun and reach stage 10 without switching weapons'],clean:['Победи босса, не получив урона во время боя','Defeat a boss without taking damage during the fight'],trial:['Пройди любое испытание до конца','Complete any trial'],
 firstReward:['Кубок в лагере + старт с дробовиком','Camp trophy + shotgun start'],tenReward:['Старт со снайперкой','Sniper start'],crowdReward:['Старт с миниганом','Minigun start'],clearReward:['Знамя победителя + испытания','Victory banner + trials'],collectionReward:['Четыре трофея на столе','Four trophies on the workbench'],shotgunReward:['Цвет плаща «Морская волна»','Tide cape colour'],cleanReward:['Тёплый фонарь в лагере','Warm camp lantern'],trialReward:['Цвет «Тлеющий огонь» + знаки на знамени','Ember cape colour + banner insignia'],
 over:['Забег окончен','Run complete'],retry:['Ещё забег','Play again'],menu:['В лагерь','Return to camp'],test:['Тестовый забег · достижения не засчитываются','Test run · achievements are not counted'],record:['Рекорд режима','Mode record'],saved:['Достигнутое не потеряно','Your progress is kept'],
 stats:['Стадия / Время / Побеждено / Боссов','Stage / Time / Defeated / Bosses']
};
Object.assign(CAMP_TEXT,{
 nextRun:['Следующий забег','Next run'],activeRun:['Текущий забег','Current run'],retrySave:['Повторить сохранение','Retry saving'],
 noRecord:['Рекорд ещё не записан','No saved record yet'],trialBest:['Лучшее в этом испытании','Best in this trial'],
 equipment:['Снаряжение','Equipment'],goals:['Цели и награды','Goals and rewards'],tasks:['Задания','Quests'],earned:['наград открыто','rewards unlocked'],
 restartTitle:['Начать новый забег?','Start a new run?'],restartHint:['Уровень и снаряжение текущего забега сбросятся. Достижения и оставшиеся заряды способностей сохранятся.','The current run’s level and equipment will reset. Achievements and remaining ability charges are kept.'],
 restartAccept:['Да, начать заново','Yes, start again'],restartCancel:['Остаться в забеге','Keep this run']
});
function campText(key){return CAMP_TEXT[key]?.[typeof uiLanguage==='undefined'||uiLanguage==='ru'?0:1]||key;}
Object.assign(CAMP_TEXT,{
 champion:['Лагерь чемпиона','Champion camp'],completeCamp:['Лагерь полностью обустроен','Camp fully restored'],
 firstReward:['Кубок и пьедестал + старт с дробовиком','Trophy pedestal + shotgun start'],
 tenReward:['Навес оружейной + старт со снайперкой','Armoury awning + sniper start'],
 crowdReward:['Укреплённая оружейная + старт с миниганом','Reinforced armoury + minigun start'],
 clearReward:['Знамёна победителя + испытания','Victory standards + trials'],
 shotgunReward:['Морская палатка и ковёр + цвет плаща «Морская волна»','Tide tent and rug + Tide cape colour'],
 cleanReward:['Фонарь и тёплая гирлянда в лагере','Camp lantern and warm string lights'],
 trialReward:['Праздничное оформление + цвет плаща «Тлеющий огонь»','Festival decorations + Ember cape colour'],
 campFinale:['Все 8 заданий: павильон чемпиона, золотая корона и праздничные огни. Только внешний вид.','All 8 quests: champion pavilion, golden crown and festive lights. Cosmetic only.']
});
const CAMP_SECTIONS=[['campGoals','tasks'],['campEquipment','equipment'],['campTrials','trials'],['campWorkshop','workshop']];
CAMP_TEXT.workshop=['Мастерская','Workshop'];
Object.assign(CAMP_TEXT,{
 equipment:['Арсенал и облик','Arsenal & appearance'],loadout:['Ветка оружия','Weapon branch'],styles:['Облик плаща','Cape appearance'],
 gearHint:['Выбери путь развития. Каждый забег — с простой формы, затем 4 улучшения. Выбор действует со следующего забега.','Choose an evolution path. Every run starts simple, followed by 4 upgrades. Applies to the next run.'],
 cosmetic:['Узор и отделка видны на герое. Это только облик: в бою сначала нужно получить плащ.','Patterns and trim are shown on the hero. Cosmetic only: obtain a cape during the run first.'],
 basic:['Штурмовая ветка','Assault path'],shotgunWeapon:['Дробовая ветка','Shotgun path'],sniper:['Точная ветка','Precision path'],laser:['Энергетическая ветка','Energy path'],
 ranger:['Следопыт','Ranger'],royal:['Королевский','Royal'],astral:['Созвездия','Constellations'],
 firstReward:['Кубок, дробовая ветка и облик «Следопыт»','Trophy, shotgun path and Ranger cape'],
 tenReward:['Навес оружейной + точная ветка (старт с луком)','Armoury awning + precision path (bow start)'],
 crowdReward:['Укреплённая оружейная + энергетическая ветка','Reinforced armoury + energy path'],
 clearReward:['Знамёна, королевский плащ и испытания','Standards, Royal cape and challenges'],
 collectionReward:['Трофеи и плащ «Созвездия»','Trophies and Constellations cape']
});
Object.assign(CAMP_TEXT,{
 equipment:['Арсенал','Arsenal'],weapons:['Оружие','Weapons'],appearance:['Облик','Appearance'],
 nextRunShort:['На следующий забег','For your next run'],evolveHint:['Старт с I · улучшения — в бою','Start at I · upgrade in battle'],
 capeHint:['Только облик · плащ нужно найти в бою','Cosmetic only · find a cape in battle'],
 assaultShort:['Штурм','Assault'],shotgunShort:['Дробь','Shotgun'],precisionShort:['Точность','Precision'],energyShort:['Энергия','Energy'],
 lockFirst:['Первый босс','First boss'],lockTen:['Стадия 10','Stage 10'],lockCrowd:['500 врагов','500 enemies'],lockClear:['Финальный босс','Final boss'],
 lockShotgun:['Дробовик: стадия 10','Shotgun: stage 10'],lockTrial:['Пройди испытание','Clear a trial'],lockCollection:['4 вида боссов','4 boss types'],
 questFirst:['Первый босс','First boss'],questTen:['10-я стадия','Stage 10'],questCrowd:['500 врагов','500 enemies'],questClear:['Финальный босс','Final boss'],
 questCollection:['4 вида боссов','4 boss types'],questShotgun:['Мастер дробовика','Shotgun mastery'],questClean:['Босс без урона','Untouched'],questTrial:['Первое испытание','First trial'],
 campGrowing:['Обустраивай свой лагерь','Build your camp'],campRewardCount:['наград','rewards'],
 normalShort:['Арена','Arena'],rushShort:['Натиск','Rush'],elitesShort:['Элита','Elites'],bossesShort:['Титаны','Titans'],
 normalMod:['20 стадий','20 stages'],rushMod:['+15% скорость врагов','+15% enemy speed'],elitesMod:['+30% элитных врагов','+30% elite spawns'],bossesMod:['+25% здоровье боссов','+25% boss health'],
 trialGate:['Испытания откроются после финального босса','Defeat the final boss to unlock trials']
});
const campWeaponLabel=w=>campText(({basic:'assaultShort',shotgun:'shotgunShort',sniper:'precisionShort',laser:'energyShort',minigun:'energyShort'})[w]||w);
const campQuestLabel=id=>campText('quest'+id[0].toUpperCase()+id.slice(1));
let campEquipmentView='weapons',campExpandedGoal=null;
let arsenalPreviewLevel=0,arsenalPreviewLast=-Infinity,arsenalPreviewShot=null;
function fireArsenalPreview(button,now=performance.now()){
 if(!campPanelActive||campActiveSection!=='campEquipment'||campEquipmentView!=='weapons'||document.getElementById('arsenalFire')!==button||(typeof Playables!=='undefined'&&Playables.blocked))return false;
 const w=campProfile.weapon==='minigun'?'laser':campProfile.weapon,L=arsenalPreviewLevel,stats=weaponStats(w,{gun:L,clip:0,scope:0},1);
 if(arsenalPreviewShot&&now-arsenalPreviewShot.at<Math.max(90,Math.min(260,stats.rate*.30)))return false;
 arsenalPreviewShot={at:now,w,L};
 const sound=w==='basic'?(L>=2?'minigun':'rifle'):w==='sniper'&&L<2?'arrow':w;
 soundCue(sound,null,.75);drawArsenalPreview(now,true);return true;
}
function drawArsenalPreview(now=0,force=false){
 if(campPanelActive&&campActiveSection==='campWorkshop'&&typeof tickCampRange==='function'){tickCampRange(now,force);return;}
 if(!campPanelActive||campActiveSection!=='campEquipment'||(typeof Playables!=='undefined'&&Playables.blocked))return;
 if(campEquipmentView==='appearance'){drawCampStylePreview(now,force);return;}
 const canvas=document.getElementById('arsenalPreview');if(!canvas||(!force&&now-arsenalPreviewLast<33))return;arsenalPreviewLast=now;
 const g=canvas.getContext('2d'),w=campProfile.weapon==='minigun'?'laser':campProfile.weapon,L=arsenalPreviewLevel;
 const reduced=typeof menuMotionQuery!=='undefined'&&menuMotionQuery?.matches;
 const time=reduced?0:now/1000,stats=weaponStats(w,{gun:L,clip:0,scope:0},1);
 const age=arsenalPreviewShot?.w===w&&arsenalPreviewShot?.L===L?now-arsenalPreviewShot.at:Infinity;
 const active=age>=0&&age<460,beam=w==='laser'&&L===4,flight=weaponShotKind(w,L)==='sniper'?150:230;
 const recoil=!reduced&&active?Math.sin(Math.min(1,age/180)*Math.PI)*(w==='sniper'?4:2.5):0,hx=135-recoil;
 paintCampPreviewStage(g);
 g.fillStyle='#dfceaa';g.beginPath();g.ellipse(140,207,95,11,0,0,7);g.fill();
 drawHero(g,hx,202,1,Math.sin(time)*.2,{helm:3,jacket:2,gloves:1,boots:2,cape:3,gun:L,_w:w,_holdWeapon:true,_campStyle:campProfile.style},2.25,0,active&&age<75?1:0,{yaw:.25,headYaw:.25,headTilt:Math.sin(time*.9)*.015});
 const tip=gunMuzzlePoint(w,L),anchor=heroRestWeaponAnchor(w,L,2,0,1),sy=202+(anchor[1]+tip.y*1.3)*2.25;
 g.strokeStyle='#806747';g.lineWidth=4;sline(g,447,sy+10,447,203);scircle(g,447,sy,28,'#d0b986');scircle(g,447,sy,16,'#a88452');scircle(g,447,sy,5,'#f8e8be');
 const kind=weaponShotKind(w,L),u=reduced?.75:Math.max(0,Math.min(1,age/flight));
 const sx=hx+(anchor[0]+6.5+tip.x*1.3)*2.25,ex=418,x=sx+(ex-sx)*u;
 if(active){
  g.strokeStyle=kind==='laser'?'#3d929f':kind==='arrow'?'#805b35':'#6b6253';g.lineWidth=kind==='laser'?4:2;
  if(beam&&age<310){sline(g,sx,sy,ex,sy);g.strokeStyle='#d1ffee';g.lineWidth=1.5;sline(g,sx,sy,ex,sy);}
  else if(age<flight||reduced&&age<220){
   if(kind==='sniper')drawSniperProjectile(g,x,sy,0,false,1.15);
   else for(let i=0;i<(kind==='pellet'?Math.min(5,stats.pellets):1);i++){const y=sy+(i-(kind==='pellet'?Math.min(5,stats.pellets)-1:0)/2)*u*9;sline(g,Math.max(sx,x-(kind==='arrow'?20:kind==='laser'?24:8)),y,x,y);if(kind==='arrow'){sline(g,x-4,y-3,x,y);sline(g,x-4,y+3,x,y);}}
  }
  if(age>=flight){g.save();g.globalAlpha=(460-age)/(460-flight);g.strokeStyle='#f7edc4';g.lineWidth=2;g.beginPath();g.arc(447,sy,reduced?12:6+(age-flight)*.07,0,Math.PI*2);g.stroke();g.restore();}
 }
 g.fillStyle='#856844';g.font='12px system-ui';g.textAlign='center';g.fillText(weaponFormName(w,L),270,25);
 if(!active){g.font='11px system-ui';g.fillText(bossText('Нажми, чтобы выстрелить','Tap to fire'),270,222);}
}
function paintCampPreviewStage(g){
 g.clearRect(0,0,520,230);g.vackyStableSketch=true;
 const sky=g.createLinearGradient(0,0,0,230);sky.addColorStop(0,'#faf1db');sky.addColorStop(1,'#ede0bb');g.fillStyle=sky;g.fillRect(0,0,520,230);
 g.fillStyle='#f2dba0';g.beginPath();g.arc(430,52,24,0,Math.PI*2);g.fill();
 g.fillStyle='#e4ddbc';g.beginPath();g.ellipse(260,216,240,33,0,0,7);g.fill();
 g.strokeStyle='#b7bb8e';g.lineWidth=1.2;
 for(const [x,y]of [[28,185],[70,213],[336,205],[482,195]]){sline(g,x-3,y-5,x,y);sline(g,x,y,x+2,y-7);}
 g.strokeStyle='#d4c59d';g.lineWidth=1;sline(g,22,164,498,164);
}
function paintCampCape(g,style){
 g.save();g.strokeStyle=INK;g.lineWidth=1.5;
 spoly(g,[[-12,0],[12,0],[17,35],[0,30],[-17,35]],campCapeColor(style)||'#8a53c4');
 g.clip();drawCapePattern(g,style,0,0,30,35,0);g.restore();
}
function drawCampStylePreview(now=0,force=false){
 const canvas=document.getElementById('campStylePreview');if(!canvas||(!force&&now-arsenalPreviewLast<33))return;arsenalPreviewLast=now;
 const g=canvas.getContext('2d'),style=campProfile.style,reduced=typeof menuMotionQuery!=='undefined'&&menuMotionQuery?.matches,time=reduced?0:now/1000;
 paintCampPreviewStage(g);g.fillStyle='#d7c69f';g.beginPath();g.ellipse(178,211,63,9,0,0,7);g.fill();
 drawHero(g,177,208,1,Math.sin(time)*.15,{helm:3,jacket:2,gloves:1,boots:2,cape:3,gun:0,_holstered:true,_campStyle:style},2.45,0,0,{yaw:-.55,headYaw:-.1,headTilt:Math.sin(time*.8)*.018});
 g.strokeStyle='#a48a60';g.lineWidth=4;sline(g,373,60,373,199);sline(g,348,202,398,202);sline(g,346,69,400,69);
 g.save();g.translate(373,65);g.scale(3,3);paintCampCape(g,style);g.restore();
 g.fillStyle='#856844';g.font='12px system-ui';g.textAlign='center';g.fillText(campText(style),270,25);
}
function campWeaponIcon(w,level=0){
 const c=campNode('canvas');c.width=160;c.height=80;c.setAttribute('aria-hidden','true');const g=c.getContext('2d');
 const scale=w==='sniper'&&level===0?1.35:Math.min(2.15,120/(gunMuzzlePoint(w,level).x+12));
 const left=(w==='basic'&&level<2||w==='laser'&&level===0||w==='sniper'&&level===0)?-1:-10;
 g.save();g.translate(80-(left+gunMuzzlePoint(w,level).x)*scale/2,43);g.scale(scale,scale);g.vackyStableSketch=true;drawGunModel(g,level,0,w);g.restore();return c;
}
function campCapeIcon(style){
 const c=campNode('canvas');c.width=160;c.height=80;c.setAttribute('aria-hidden','true');const g=c.getContext('2d');
 g.vackyStableSketch=true;g.save();g.translate(80,9);g.scale(1.65,1.65);paintCampCape(g,style);g.restore();return c;
}
function switchCampEquipment(view){
 if(!campPanelActive||campActiveSection!=='campEquipment'||!['weapons','appearance'].includes(view)||(typeof Playables!=='undefined'&&Playables.blocked))return false;
 campEquipmentView=view;renderCampPanel();document.getElementById('campPanel').scrollTop=0;
 document.getElementById('campEquipment-'+view)?.focus({preventScroll:true});return true;
}
let campPanelActive=false,campReturnFocus=null,campActiveSection='campGoals';
function campDialogOpen(){return campPanelActive;}
function campNode(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
function campStatus(){return campReadOnly?campText('readonly'):campSaveError?campText('error'):'';}
function campGoalText(g){return g?campText(g.id)+' · '+Math.min(g.target,g.value(campProfile))+'/'+g.target:campText('done');}
function refreshCampMenu(){
 const button=document.getElementById('btnCamp');if(!button)return;
 document.getElementById('campMenuLabel').textContent=campText('tasks');
 const complete=CAMP_GOALS.every(g=>campUnlocked(g.id));
 document.getElementById('campDockTitle').textContent=campText(complete?'champion':'title');
 document.getElementById('campDock').classList.toggle('is-complete',complete);
 document.getElementById('campDockNav').setAttribute('aria-label',campText('title'));
 document.getElementById('campEquipmentLabel').textContent=campText('equipment');
 document.getElementById('campTrialsLabel').textContent=campText('trials');
 document.getElementById('campDockProgress').textContent=CAMP_GOALS.filter(g=>campUnlocked(g.id)).length+'/8 '+campText('earned');
 if(typeof refreshRangeDock==='function')refreshRangeDock();
 document.getElementById('campNextGoal').textContent=campGoalText(campNextGoal());
 document.getElementById('campMenuStatus').textContent=campStatus();
 const weaponName=w=>campText(w==='shotgun'?'shotgunWeapon':w);
 const next=campText('nextRun')+': '+weaponName(campProfile.weapon)+' · '+campText(campProfile.trial);
 document.getElementById('campLoadoutSummary').textContent=typeof menuHasRun!=='undefined'&&menuHasRun?campText('activeRun')+': '+weaponName(P.wtype)+' · '+campText(P.trial||'normal')+'\n'+next:next;
 if(campPanelActive)renderCampPanel();
}
function openCampPanel(section='campGoals'){
 if(typeof settingsOpen==='function'&&settingsOpen())return false;
 if(runConfirmOpen())return false;
 if(document.getElementById('start').classList.contains('hidden'))return false;
 if((typeof Playables!=='undefined'&&Playables.blocked)||tutorialOpen()||gameHelpOpen()||languageMenuActive||menuDeparture)return false;
 campReturnFocus=document.activeElement;campPanelActive=true;pointer.active=false;
 campEquipmentView='weapons';campExpandedGoal=null;arsenalPreviewLevel=0;
 campActiveSection=CAMP_SECTIONS.some(([id])=>id===section)?section:'campGoals';
 document.getElementById('campDialog').classList.remove('hidden');renderCampPanel();
 document.getElementById('campPanel').scrollTop=0;
 if(['campEquipment','campTrials','campWorkshop'].includes(section)){
  document.getElementById(section)?.focus({preventScroll:true});
 }else document.getElementById('campTitle').focus({preventScroll:true});return true;
}
function switchCampSection(section){
 if(!campPanelActive||!CAMP_SECTIONS.some(([id])=>id===section)||(typeof Playables!=='undefined'&&Playables.blocked))return false;
 if(campActiveSection==='campWorkshop'&&section!==campActiveSection&&typeof leaveCampRange==='function')leaveCampRange();
 campActiveSection=section;renderCampPanel();document.getElementById('campPanel').scrollTop=0;
 document.getElementById('campNav-'+section)?.focus({preventScroll:true});return true;
}
function closeCampPanel(){
 if(typeof leaveCampRange==='function')leaveCampRange();
 arsenalPreviewShot=null;campPanelActive=false;document.getElementById('campDialog').classList.add('hidden');
 campReturnFocus?.focus?.({preventScroll:true});campReturnFocus=null;menuScenePainted=false;
}
function campIcon(kind,key){
 const c=campNode('canvas');c.width=160;c.height=160;c.setAttribute('aria-hidden','true');
 drawBossRewardIcon(c.getContext('2d'),{kind,key},160,160);return c;
}
function renderCampPanel(){
 arsenalPreviewShot=null;arsenalPreviewLast=-Infinity;
 const panel=document.getElementById('campPanel'),scroll=panel?.scrollTop||0;
 const focusedId=document.getElementById('campContent').contains(document.activeElement)?document.activeElement.id:null;
 document.getElementById('campTitle').textContent=campText(CAMP_SECTIONS.find(([id])=>id===campActiveSection)[1]);
 document.getElementById('btnCloseCamp').textContent='×';document.getElementById('btnCloseCamp').setAttribute('aria-label',campText('close'));
 const root=document.getElementById('campContent');root.innerHTML='';
 document.getElementById('campDialog').setAttribute('dir',typeof uiLanguage!=='undefined'&&uiLanguage==='ar'?'rtl':'ltr');
 const nav=campNode('nav',undefined,'camp-section-nav');nav.setAttribute('aria-label',campText('title'));root.appendChild(nav);
 for(const [id,key] of CAMP_SECTIONS){
  const button=campNode('button',campText(key));button.id='campNav-'+id;button.type='button';
  button.setAttribute('aria-pressed',String(id===campActiveSection));button.setAttribute('aria-controls','campSectionContent');
  button.onclick=()=>{if(document.getElementById(button.id)===button)switchCampSection(id);};nav.appendChild(button);
 }
 const warning=campNode('p',campStatus(),'camp-save-warning');warning.setAttribute('role','status');root.appendChild(warning);
 if(campSaveError&&!campReadOnly){
  const retry=campNode('button',campText('retrySave'),'menu-secondary');retry.id='campRetrySave';retry.type='button';
  retry.onclick=()=>{retryCampSave();refreshCampMenu();(document.getElementById('campRetrySave')||document.getElementById('btnCloseCamp'))?.focus({preventScroll:true});};root.appendChild(retry);
 }
 const content=campNode('section',undefined,'camp-section-content');content.id='campSectionContent';content.setAttribute('aria-labelledby',campActiveSection);root.appendChild(content);
 const heading=(id,text)=>{const h=campNode('h3',text,'camp-sr-only');h.id=id;h.tabIndex=-1;content.appendChild(h);};
 const kitBar=text=>{const bar=campNode('div',undefined,'camp-kit-bar');bar.appendChild(campNode('span',campText('nextRunShort')));bar.appendChild(campNode('strong',text));content.appendChild(bar);};
 if(campActiveSection==='campGoals'){
 heading('campGoals',campText('journal'));
 const earned=CAMP_GOALS.filter(g=>campUnlocked(g.id)).length;
 const banner=campNode('div',undefined,'camp-progress-card');banner.appendChild(campIcon('medal'));
 const bannerCopy=campNode('div');bannerCopy.appendChild(campNode('strong',campText(earned===8?'champion':'campGrowing')));
 bannerCopy.appendChild(campNode('small',earned+' / 8 '+campText('campRewardCount')));
 const track=campNode('div',undefined,'camp-progress-track');track.setAttribute('aria-hidden','true');for(let i=0;i<8;i++)track.appendChild(campNode('span',undefined,i<earned?'is-filled':''));bannerCopy.appendChild(track);banner.appendChild(bannerCopy);content.appendChild(banner);
 const list=campNode('div',undefined,'camp-achievements');content.appendChild(list);
 for(const goal of CAMP_GOALS){
  const unlocked=campUnlocked(goal.id),expanded=campExpandedGoal===goal.id,row=campNode('article',undefined,'camp-achievement'+(unlocked?' is-unlocked':'')+(expanded?' is-expanded':''));
  const art={first:['gear','gun'],ten:['gear','scope'],crowd:['supply','tank'],shotgun:['gear','cape'],clean:['heal'],trial:['ult']}[goal.id]||['medal'];
  const b=campNode('button',undefined,'camp-quest-toggle');b.id='camp-goal-'+goal.id;b.type='button';b.setAttribute('aria-expanded',String(expanded));b.setAttribute('aria-controls','camp-goal-detail-'+goal.id);b.appendChild(campIcon(...art));
  const copy=campNode('div');copy.appendChild(campNode('strong',campQuestLabel(goal.id)));
  const progress=campNode('progress');progress.max=goal.target;progress.value=Math.min(goal.target,goal.value(campProfile));progress.setAttribute('aria-label',campText(goal.id));copy.appendChild(progress);
  copy.appendChild(campNode('small',Math.min(goal.target,goal.value(campProfile))+' / '+goal.target));b.appendChild(copy);b.appendChild(campNode('span',unlocked?'✓':expanded?'−':'+','camp-quest-mark'));row.appendChild(b);
  b.onclick=()=>{if(!campPanelActive||campActiveSection!=='campGoals'||document.getElementById(b.id)!==b||(typeof Playables!=='undefined'&&Playables.blocked))return;campExpandedGoal=expanded?null:goal.id;renderCampPanel();document.getElementById(b.id)?.focus({preventScroll:true});};
  const detail=campNode('div',undefined,'camp-quest-detail');detail.id='camp-goal-detail-'+goal.id;detail.hidden=!expanded;
  if(expanded){detail.appendChild(campNode('p',campText(goal.id)));detail.appendChild(campNode('span',campText('reward')+': '+campText(goal.id+'Reward'),'camp-reward-label'));}
  row.appendChild(detail);list.appendChild(row);
 }
 }
 const choose=(box,key,value,title,unlocked,reason,icon,modifier='')=>{
  const b=campNode('button',undefined,'camp-option');b.type='button';b.id='camp-'+key+'-'+value;
  b.disabled=!unlocked||campReadOnly;b.setAttribute('aria-pressed',String(campProfile[key]===value));
  if(icon)b.appendChild(icon);b.appendChild(campNode('strong',title));
  if(modifier)b.appendChild(campNode('span',modifier,'camp-trial-modifier'));
  const status=!unlocked?'🔒 '+reason:campProfile[key]===value?'✓':'';
  if(status)b.appendChild(campNode('small',status,'camp-choice-status'+(!unlocked?' is-locked':'')));
  b.setAttribute('aria-label',title+(!unlocked?' · '+campText('locked')+' · '+reason:campProfile[key]===value?' · '+campText('selected'):''));
  b.onclick=()=>{if(!campPanelActive||document.getElementById(b.id)!==b)return;const old=campProfile[key];if(campChoose(key,value)){if(key==='weapon'&&old!==value)arsenalPreviewLevel=0;refreshCampMenu();menuScenePainted=false;document.getElementById(b.id)?.focus({preventScroll:true});}else refreshCampMenu();};box.appendChild(b);return b;
 };
 if(campActiveSection==='campEquipment'){
 heading('campEquipment',campText('equipment'));
 const tabs=campNode('nav',undefined,'camp-equipment-nav');tabs.setAttribute('aria-label',campText('equipment'));
 for(const view of ['weapons','appearance']){const b=campNode('button',campText(view));b.id='campEquipment-'+view;b.type='button';b.setAttribute('aria-pressed',String(view===campEquipmentView));b.onclick=()=>{if(document.getElementById(b.id)===b)switchCampEquipment(view);};tabs.appendChild(b);}content.appendChild(tabs);
 const selected=campProfile.weapon==='minigun'?'laser':campProfile.weapon;
 if(campEquipmentView==='weapons'){
 kitBar(campWeaponLabel(selected));
 const fire=campNode('button',undefined,'arsenal-fire');fire.type='button';fire.id='arsenalFire';fire.setAttribute('aria-label',weaponFormName(selected,arsenalPreviewLevel)+' · '+bossText('Выстрелить — Enter или пробел','Fire — Enter or Space'));
 const preview=campNode('canvas');preview.id='arsenalPreview';preview.width=520;preview.height=230;preview.className='arsenal-preview';preview.setAttribute('aria-hidden','true');fire.appendChild(preview);content.appendChild(fire);
 fire.onclick=()=>fireArsenalPreview(fire);
 const evolution=campNode('div',undefined,'arsenal-evolution');evolution.setAttribute('aria-label',bossText('Эволюция оружия — предпросмотр','Weapon evolution preview'));content.appendChild(evolution);
 for(let lv=0;lv<=4;lv++){
  const b=campNode('button');b.type='button';b.id='arsenal-level-'+lv;b.setAttribute('aria-pressed',String(lv===arsenalPreviewLevel));b.setAttribute('aria-label',bossText('Предпросмотр: ','Preview: ')+weaponFormName(selected,lv)+' · '+(lv+1)+'/5');b.title=weaponFormName(selected,lv);
  b.appendChild(campWeaponIcon(selected,lv));b.appendChild(campNode('small',['I','II','III','IV','V'][lv]));
  b.onclick=()=>{if(!campPanelActive||document.getElementById(b.id)!==b||(typeof Playables!=='undefined'&&Playables.blocked))return;arsenalPreviewLevel=lv;renderCampPanel();document.getElementById(b.id)?.focus({preventScroll:true});};evolution.appendChild(b);
 }
 const weapons=campNode('div',undefined,'camp-options camp-weapon-grid');weapons.setAttribute('aria-label',campText('loadout'));content.appendChild(weapons);
 for(const w of ARSENAL_BRANCHES){
  choose(weapons,'weapon',w,campWeaponLabel(w),campWeaponOpen(w),campText({shotgun:'lockFirst',sniper:'lockTen',laser:'lockCrowd'}[w]),campWeaponIcon(w));
 }
 content.appendChild(campNode('p',campText('evolveHint'),'camp-footnote'));
 }else{
 kitBar(campText(campProfile.style));
 const preview=campNode('canvas');preview.id='campStylePreview';preview.width=520;preview.height=230;preview.className='camp-style-preview';preview.setAttribute('role','img');preview.setAttribute('aria-label',campText('appearance')+' · '+campText(campProfile.style));content.appendChild(preview);
 const styles=campNode('div',undefined,'camp-options camp-style-grid');styles.setAttribute('aria-label',campText('styles'));content.appendChild(styles);
 for(const s of CAMP_STYLES)choose(styles,'style',s,campText(s),campStyleOpen(s),campText(({tide:'lockShotgun',ember:'lockTrial',ranger:'lockFirst',royal:'lockClear',astral:'lockCollection'})[s]),campCapeIcon(s));
 content.appendChild(campNode('p',campText('capeHint'),'camp-footnote'));
 }
 drawArsenalPreview(0,true);
 }
 if(campActiveSection==='campTrials'){
 heading('campTrials',campText('trials'));kitBar(campText(campProfile.trial+'Short'));
 const trials=campNode('div',undefined,'camp-options camp-trial-grid');content.appendChild(trials);
 for(const mode of CAMP_TRIALS){
  const best=campProfile.best[mode],completed=campProfile.trialWins[mode];
  const art=mode==='normal'?campIcon('medal'):campIcon('gear',({rush:'boots',elites:'gloves',bosses:'helm'})[mode]);
  const button=choose(trials,'trial',mode,campText(mode+'Short')+(completed?' ★':''),mode==='normal'||campUnlocked('clear'),campText('lockClear'),art,campText(mode+'Mod'));button.className+=' camp-trial-option';
  if(best)button.appendChild(campNode('small',campText('record')+' '+formatRunTime(best),'camp-trial-record'));
 }
 if(!campUnlocked('clear'))content.appendChild(campNode('p',campText('trialGate'),'camp-footnote'));
 }
 if(campActiveSection==='campWorkshop'&&typeof renderCampRange==='function'){
  heading('campWorkshop',campText('workshop'));renderCampRange(content);
 }
 if(focusedId)document.getElementById(focusedId)?.focus({preventScroll:true});
 if(panel)panel.scrollTop=scroll;
}
let resultExitPending=false;
function leaveRunResult(action){
 if(resultExitPending)return false;
 resultExitPending=true;
 let completed=false;
 const complete=()=>{if(completed)return;completed=true;resultExitPending=false;action();};
 if(typeof Playables!=='undefined'&&typeof Playables.requestInterstitial==='function')Playables.requestInterstitial('run_result',complete);
 else complete();
 return true;
}
function retryFinishedRun(id){
 if(running||document.getElementById(id)?.classList.contains('hidden')||(typeof Playables!=='undefined'&&Playables.blocked))return false;
 return leaveRunResult(start);
}
let runRestartRequest=null;
function runConfirmOpen(){return !!runRestartRequest;}
function requestRunRestart(origin){
 if(typeof settingsOpen==='function'&&settingsOpen())return false;
 const source=origin==='pause'?'pause':origin==='menu'?'start':null;
 if(!source||!running||!paused||runRestartRequest||document.getElementById(source).classList.contains('hidden')||campDialogOpen()||tutorialOpen()||gameHelpOpen()||languageMenuActive||(typeof Playables!=='undefined'&&Playables.blocked))return false;
 runRestartRequest={owner:P.campRun,focus:document.activeElement};pointer.active=false;
 document.getElementById('runConfirmTitle').textContent=campText('restartTitle');
 document.getElementById('runConfirmHint').textContent=campText('restartHint');
 if(typeof economyWallet==='function'&&economyWallet()>0){
   document.getElementById('runConfirmHint').textContent+=bossText(' Сбросятся детали этого забега: ',' Parts from this run will be lost: ')+economyWallet()+'.';
 }
 document.getElementById('runConfirmStats').textContent=campText('stats').split(' / ')[0]+' '+P.stage+'/20 · '+formatRunTime(P.runMs);
 document.getElementById('btnCancelNewRun').textContent=campText('restartCancel');document.getElementById('btnConfirmNewRun').textContent=campText('restartAccept');
 document.getElementById('runConfirm').classList.remove('hidden');document.getElementById('btnCancelNewRun').focus({preventScroll:true});return true;
}
function cancelRunRestart(restore=true){
 const pending=runRestartRequest;runRestartRequest=null;document.getElementById('runConfirm').classList.add('hidden');
 if(restore)pending?.focus?.focus?.({preventScroll:true});
}
function confirmRunRestart(){
 if(!runRestartRequest||(typeof Playables!=='undefined'&&Playables.blocked))return false;
 if(!running||P.campRun!==runRestartRequest.owner){cancelRunRestart();return false;}
 cancelRunRestart(false);document.getElementById('pause').classList.add('hidden');
 start();return true;
}
function renderCampResult(id){
 const root=document.getElementById(id);if(!root)return;root.innerHTML='';
 if(P.economy?.settled){
   const {earned,spent,banked}=P.economy;
   root.appendChild(campNode('strong',bossText('В лагерь доставлено: ','Delivered to camp: ')+'+'+banked+bossText(' дет.',' parts'),'parts-receipt'));
   if(spent)root.appendChild(campNode('p',bossText('Собрано: ','Found: ')+earned+bossText(' · Потрачено у каравана: ',' · Spent at caravan: ')+spent,'camp-explainer'));
 }
 root.appendChild(campNode('strong',P.testRun?campText('test'):campStatus()?campText('journal'):campText('saved')));
 root.appendChild(campNode('p',campText(P.trial||'normal'),'camp-explainer'));
 if(P.testRun)return;
 for(const goal of P.campRun?.unlocks||[])root.appendChild(campNode('p','✓ '+campText('new')+': '+campText(goal+'Reward'),'camp-new-unlock'));
 root.appendChild(campNode('p',campGoalText(campNextGoal())));
 if(campStatus())root.appendChild(campNode('p',campStatus(),'camp-save-warning'));
}
function showCampAfterRun(){
 if(running||['over','dragonVictory'].every(id=>document.getElementById(id).classList.contains('hidden')))return;
 if(typeof Playables!=='undefined'&&Playables.blocked)return;
 return leaveRunResult(()=>{
 if(typeof resetArenaEnding==='function')resetArenaEnding();
 checkpointCamp();running=false;paused=false;userPaused=false;menuHasRun=false;pointer.active=false;menuDeparture=null;
 for(const id of ['over','dragonVictory','pause','levelup','bossReward'])document.getElementById(id).classList.add('hidden');
 document.getElementById('start').classList.remove('hidden');syncMainMenu();menuScenePainted=false;document.getElementById('btnStart').focus({preventScroll:true});
 });
}
function initCampUI(){
 document.getElementById('btnCancelNewRun').onclick=()=>cancelRunRestart();document.getElementById('btnConfirmNewRun').onclick=confirmRunRestart;
 document.getElementById('runConfirm').addEventListener('click',e=>{if(e.target===e.currentTarget)cancelRunRestart();});
 document.addEventListener('keydown',e=>{
  if(!runConfirmOpen())return;e.stopPropagation();
  if(e.key==='Escape'||e.code==='Escape'){e.preventDefault();cancelRunRestart();return;}
  if(e.key==='Tab'){
   const cancel=document.getElementById('btnCancelNewRun'),confirm=document.getElementById('btnConfirmNewRun'),active=document.activeElement;
   if(e.shiftKey&&(active===cancel||active!==confirm)){e.preventDefault();confirm.focus();}
   else if(!e.shiftKey&&(active===confirm||active!==cancel)){e.preventDefault();cancel.focus();}
  }
 },true);
 document.getElementById('btnCamp').onclick=()=>openCampPanel('campGoals');
 document.getElementById('btnCampEquipment').onclick=()=>openCampPanel('campEquipment');
 document.getElementById('btnCampTrials').onclick=()=>openCampPanel('campTrials');
 const workshop=document.getElementById('btnCampWorkshop');if(workshop)workshop.onclick=()=>openCampPanel('campWorkshop');
 document.getElementById('btnCloseCamp').onclick=closeCampPanel;
 document.getElementById('campDialog').addEventListener('click',e=>{if(e.target===e.currentTarget)closeCampPanel();});
 document.getElementById('btnOverMenu').onclick=showCampAfterRun;
 document.getElementById('btnVictoryMenu').onclick=showCampAfterRun;
 document.getElementById('btnOverRetry').onclick=()=>retryFinishedRun('over');
 document.getElementById('btnVictoryRestart').onclick=()=>retryFinishedRun('dragonVictory');
 // Capture prevents gameplay shortcuts underneath the modal, including ability hotkeys.
 document.addEventListener('keydown',e=>{
  if(!campPanelActive)return;e.stopPropagation();
  if(e.key==='Escape'||e.code==='Escape'){e.preventDefault();closeCampPanel();return;}
  if(campActiveSection==='campWorkshop'&&typeof handleCampRangeKey==='function'&&handleCampRangeKey(e))return;
  if(e.key!=='Tab')return;
  const dialog=document.getElementById('campDialog'),nodes=[...dialog.querySelectorAll('button:not(:disabled)')],first=nodes[0],last=nodes[nodes.length-1];
  if(!nodes.length)return;
  const entering=document.activeElement===document.getElementById('campTitle')||!dialog.contains(document.activeElement);
  if(e.shiftKey&&(document.activeElement===first||entering)){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&(document.activeElement===last||entering)){e.preventDefault();first.focus();}
 },true);
 refreshCampMenu();
}
