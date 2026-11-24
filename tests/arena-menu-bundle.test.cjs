const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const noop=()=>{};const ctx=new Proxy({createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),measureText:s=>({width:String(s).length*7})},{get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.dataset={};this.style={};this.attrs={};this.events={};this.value='all';this.isConnected=true;this.classes=new Set();this.width=720;this.height=480;this.scrollTop=0;this.classList={add:(...s)=>s.forEach(x=>this.classes.add(x)),remove:(...s)=>s.forEach(x=>this.classes.delete(x)),contains:s=>this.classes.has(s),toggle:(s,on)=>{on=on??!this.classes.has(s);on?this.classes.add(s):this.classes.delete(s);return on;}};}
 appendChild(e){this.children.push(e);return e;}replaceChildren(){this.children=[];}setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k];}contains(e){return this===e||this.children.some(c=>c.contains(e));}
 set innerHTML(v){this.children=[];for(const m of v.matchAll(/<(canvas|div|button|b|span)\b/g))this.children.push(new Element(m[1]));}get innerHTML(){return '';}
 addEventListener(k,fn){(this.events[k]??=[]).push(fn);}querySelector(s){return this.children.find(e=>e.tag===s)||new Element(s);}
 querySelectorAll(selector){const all=this.children.flatMap(e=>[e,...e.querySelectorAll('*')]);return selector==='*'?all:all.filter(e=>e.tag==='button'&&(!selector?.includes(':disabled')||!e.disabled));}focus(){this.focused=true;}scrollIntoView(){}setPointerCapture(){}click(){this.onclick?.();}
 getBoundingClientRect(){return {left:0,top:0,width:600,height:410};}getClientRects(){return this.classes.has('hidden')?[]:[{}];}
 getContext(kind){return kind==='webgl'||kind==='webgl2'?null:ctx;}
}
const tick=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
async function runMode(cloud,playgama=false,reduced=false,fresh=false,qa=false){
 const version=fs.readFileSync(path.join(root,'src/config.js'),'utf8').match(/VERSION = "([^"]+)"/)[1];
 const html=fs.readFileSync(path.join(root,qa?'dist/StickmanArena_v'+version+'_QA.html':playgama?'dist/playgama/index.html':cloud?'dist/youtube/index.html':'dist/index.html'),'utf8'),elements=new Map(),events={},raf=new Map(),timers=new Map();let id=0,time=1000,reads=0,writes=0;
 for(const m of html.matchAll(/<([a-z][a-z0-9]*)\b[^>]*\bid="([^"]+)"[^>]*>/g)){const e=new Element(m[1]);if(/class="[^"]*\bhidden\b/.test(m[0]))e.classList.add('hidden');elements.set(m[2],e);}
 const ability=['airstrike','gas','tank'].map(kind=>{const e=new Element('button');e.dataset.ability=kind;e.appendChild(new Element('canvas'));e.appendChild(new Element('b'));return e;});
 elements.get('abilityDock').appendChild(elements.get('abilityToggle'));elements.get('abilityDock').appendChild(elements.get('abilityPanel'));ability.forEach(e=>elements.get('abilityPanel').appendChild(e));
 elements.get('campDialog').appendChild(elements.get('campTitle'));elements.get('campDialog').appendChild(elements.get('btnCloseCamp'));elements.get('campDialog').appendChild(elements.get('campContent'));
 const homes=[...html.matchAll(/<button\b[^>]*data-open-home="([^"]+)"[^>]*>/g)].map(m=>{const id=m[0].match(/id="([^"]+)"/)?.[1],e=id?elements.get(id):new Element('button');e.dataset.openHome=m[1];return e;});
 const bookEntries=Array.from(html.matchAll(/<button\b[^>]*\bdata-open-book(?:\s|>)/g),()=>new Element('button'));
 const languages=[elements.get('menuLanguagestart'),elements.get('menuLanguagepause')];
 const languageChoices=[elements.get('chooseLanguageEn'),elements.get('chooseLanguageRu')];languageChoices[0].dataset.chooseLanguage='en';languageChoices[1].dataset.chooseLanguage='ru';
 const soundButtons=[elements.get('menuSoundstart'),elements.get('menuSoundpause')];
 const el=id=>elements.get(id)||elements.get('campContent')?.querySelectorAll('*').find(e=>e.id===id)||document.body.querySelectorAll('*').find(e=>e.id===id),document={body:new Element(),activeElement:new Element(),hidden:false,getElementById:el,createElement:t=>new Element(t),addEventListener:(k,f)=>{(events[k]??=[]).push(f);},querySelectorAll:s=>s==='[data-open-home]'?homes:s==='[data-open-book]'?bookEntries:s==='[data-language]'?languages:s==='[data-sound]'?soundButtons:s==='[data-choose-language]'?languageChoices:s==='.ability-slot'?ability:[]};
 const profile={version:2,revision:1,counts:{green:6,blue:0,violet:0,pink:0,blackgold:0,gold:0,diamond:7},rescues:13,exclusives:{0:2},egg:null};
 const db=new Map([['vacky_dragon_home_v2',JSON.stringify(profile)]]),trace=[],saves=[],system={};
 if(fresh)db.clear();
 const box={console,document,innerWidth:390,innerHeight:844,devicePixelRatio:1,performance:{now:()=>time},matchMedia:()=>({matches:reduced}),ResizeObserver:class{observe(){}disconnect(){}},IntersectionObserver:class{observe(){}disconnect(){}},
  addEventListener:(k,f)=>{(events[k]??=[]).push(f);},requestAnimationFrame:f=>{raf.set(++id,f);return id;},cancelAnimationFrame:id=>raf.delete(id),setTimeout:(f,ms)=>{timers.set(++id,f);return id;},clearTimeout:id=>timers.delete(id),
  localStorage:{getItem:k=>{reads++;return db.get(k)??null;},setItem:(k,v)=>{writes++;db.set(k,v);}},location:{reload:noop}};
 if(cloud)box.ytgame={IN_PLAYABLES_ENV:true,game:{firstFrameReady:()=>trace.push('first'),gameReady:()=>trace.push('ready'),loadData:async()=>{trace.push('load');return JSON.stringify({format:'vacky-playables',version:1,records:Object.fromEntries(db)});},saveData:async text=>{saves.push(text);}},system:{isAudioEnabled:()=>false,onAudioEnabledChange:f=>system.audio=f,onPause:f=>system.pause=f,onResume:f=>system.resume=f}};

 if(playgama){delete box.ytgame;box.bridge={
  initialize:async()=>{trace.push('init');},
  EVENT_NAME:{PAUSE_STATE_CHANGED:'pause',AUDIO_STATE_CHANGED:'audio'},
  platform:{id:'playgama',language:'ru',isAudioEnabled:false,isPaused:false,sendMessage:async m=>{assert.equal(m,'game_ready');trace.push('ready');},
    on:(event,fn)=>{if(event==='audio')system.audio=fn;else{const previous=system.state;system.state=v=>{previous?.(v);fn(v);};system.pause=()=>system.state(true);system.resume=()=>system.state(false);}}},
  storage:{get:async keys=>{assert.deepEqual([...keys],['vacky_profile_v1']);trace.push('load');return [JSON.stringify({format:'vacky-playables',version:1,records:Object.fromEntries(db)})];},
    set:async (keys,values)=>{assert.deepEqual([...keys],['vacky_profile_v1']);saves.push(values[0]);}}
 };}
 box.window=box;vm.createContext(box);
const exposed='window.testGame={delivery:()=>weaponDelivery,collectDelivery:()=>{P.x=weaponDelivery.x;P.y=weaponDelivery.y;for(let i=0;i<7;i++)updateWeaponDelivery(1000);},P,meta,inventory,hurtHero,loadRanking,ranking:()=>rankingProfile,openRanking,closeRanking,rankingOpen,loot:()=>bossLoot,collectLoot:()=>{P.x=bossLoot.x;P.y=bossLoot.y;updateBossLoot(34,1000);updateBossLoot(34,300);for(let i=0;i<7;i++)updateBossLoot(100,100);},start,gameOver,react:menuReact,saveMeta,grantRandomAbility,pauseGame,resumeGame,finishTutorial,replayTutorial,tour:()=>tutorialActive,isPaused:()=>paused,menuTime:()=>menuSceneTime,language:setGameLanguage,labels:uiLabel,help:GAME_HELP,win:s=>{paused=false;enterRunStage(s);stageBoss.enemy.hp=0;stageBoss.enemy.rewarded=true;updateRunProgress(0);},noCollection:()=>typeof craftDragon===\"undefined\"&&typeof openDragonHome===\"undefined\"};return platformGameHooks();';
 assert(html.indexOf(playgama?'bridge.playgama.com/v2/stable':'youtube.com/game_api/v1')<html.indexOf('const Playables'));
 if(playgama)assert(!html.includes('src="https://www.youtube.com/game_api/v1"'));
 assert(!html.includes('type="text/vacky-module"'));assert(!html.includes('src="src/'));
 const adminAPI='window.testAdmin={open:adminOpen,close:adminClose,start:adminStart,jump:adminJump,kill:adminDefeatBoss,fixture:adminCampFixture,view:adminViewCamp,allowed:adminAllowed,profile:()=>campProfile,claim:claimBossReward,pending:()=>bossRewardPending,boss:()=>stageBoss,nodes:()=>adminNodes};';
 const settingsAPI='window.testSettings={open:openSettings,close:closeSettings,isOpen:settingsOpen,language:()=>uiLanguage};';
 for(const s of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(s[1].replace('return platformGameHooks();',settingsAPI+adminAPI+exposed),box);
 const frame=async(ms=16)=>{time+=ms;const jobs=[...raf.values()];raf.clear();jobs.forEach(f=>f(time));await tick();};
 await tick();await frame();await tick();const api=box.testGame;assert(api,'Bundle did not launch: '+el('platformMessage').textContent);
 assert(el('platformGate').hidden,'Launch failed: '+el('platformMessage').textContent);
 assert(api.openRanking());await tick();assert(api.rankingOpen());assert(!el('rankingDialog').classList.contains('hidden'));
 assert(el('rankingStatus').textContent.length>20);assert(el('rankingBest').textContent.includes('0'));
 const beforeRankStart=JSON.stringify(api.P);api.start();assert.equal(JSON.stringify(api.P),beforeRankStart);assert(api.closeRanking());assert(!api.rankingOpen());
 if(qa){
  const a=box.testAdmin,live=[...db].filter(([k])=>!k.startsWith('vacky_qa_v1:'));
  if(api.tour())api.finishTutorial(true);
  assert(a.allowed());assert(el('adminLaunch'));assert(a.open());assert(api.isPaused());
  const adminKeys=events.keydown.find(f=>String(f).includes('if(!adminOwner)return;'));
  let keyStopped=false,tabStopped=false;adminKeys({code:'Tab',shiftKey:true,preventDefault(){tabStopped=true;},stopImmediatePropagation(){keyStopped=true;}});assert(keyStopped&&tabStopped);
  const hit=label=>{const item=a.nodes().actions.find(i=>i.button.textContent===label);assert(item,'Missing admin action '+label);assert(!item.button.disabled,'Disabled '+label);item.button.onclick();};
  const audioState=JSON.stringify({hp:api.P.hp,stage:api.P.stage,gear:api.P.gear,inventory:api.inventory,profile:a.profile()}),audioWrites=writes;
  const previews=a.nodes().actions.filter(i=>i.button.textContent.startsWith('Звук · '));assert.equal(previews.length,12);
  assert.equal(a.nodes().actions.filter(i=>i.button.textContent.startsWith('Ульта 4/4 · ')).length,14,'Every empowered variant has an admin control');
  for(const item of previews)item.button.onclick();hit('Остановить звуки');
  const comparison=a.nodes().actions.filter(i=>/^(Было|Стало) · /.test(i.button.textContent));assert.equal(comparison.length,60);
   for(const item of comparison)item.button.onclick();
   const actionSounds=a.nodes().actions.filter(i=>/^Эффект · /.test(i.button.textContent));assert.equal(actionSounds.length,7);
   for(const item of actionSounds)item.button.onclick();
   const comfortSounds=a.nodes().actions.filter(i=>/^Тихий эффект · /.test(i.button.textContent));assert.equal(comfortSounds.length,10);
   for(const item of comfortSounds)item.button.onclick();
  assert.equal(JSON.stringify({hp:api.P.hp,stage:api.P.stage,gear:api.P.gear,inventory:api.inventory,profile:a.profile()}),audioState,'Audio previews cannot change gameplay');assert.equal(writes,audioWrites,'Audio previews cannot save progress');assert(api.isPaused());
  hit('Завершить все задания лагеря');assert.equal(a.profile().bossTypes.length,4);assert.equal(a.profile().kills,500);
  assert(el('campDock').classList.contains('is-complete'));assert.equal(el('campDockTitle').textContent,'Лагерь чемпиона');
  hit('Сбросить все задания лагеря');assert.equal(a.profile().kills,500,'Reset requires confirmation');
  hit('Подтвердить сброс всех заданий');assert.equal(a.profile().kills,0);
  assert(!el('campDock').classList.contains('is-complete'));assert.equal(el('campDockTitle').textContent,'Мой лагерь');
  for(let step=1;step<=8;step++){
   hit('Выполнить следующее задание → лагерь');assert(el('campDockProgress').textContent.startsWith(step+'/8'),'Exactly one goal per click');
   assert(!el('start').classList.contains('hidden'));assert(a.open());
  }
  assert(a.nodes().actions.find(i=>i.button.textContent==='Выполнить следующее задание → лагерь').button.disabled);
  hit('Сбросить все задания лагеря');hit('Подтвердить сброс всех заданий');
  hit('Первый запуск с обучением');assert(api.tour());assert(!a.open(),'Cannot cover tutorial');api.finishTutorial(true);
  assert(a.open());const at=api.P.runMs;await frame(1000);assert.equal(api.P.runMs,at,'Admin pauses battle');
  a.close();assert(!api.isPaused());api.pauseGame();assert(a.open());a.close();assert(api.isPaused(),'Closing must preserve user pause');api.resumeGame();
  assert(a.open());hit('Выдать кабана');assert.equal(api.P.pet.type,'boar');assert(api.P.testRun);assert(!api.isPaused());
  for(const [weapon,label] of [['minigun','Миниган'],['dropShotgun','Штурмовой дробовик'],['goldSniper','Золотая снайперка']]){
   assert(a.open());hit('Авиадроп · '+label);assert.equal(api.delivery().state,'flying');assert.equal(api.delivery().weapon,weapon);assert(api.P.testRun);assert(!api.isPaused());
   api.collectDelivery();assert.equal(api.P.wtype,weapon);assert.equal(api.P.gear.gun,0);
   assert(a.open());hit('Авиадроп · +75 с прокачки');assert.equal(api.P.gear.gun,1);
  }
  assert(a.open());hit('+100 врагов (зачёт задания)');assert.equal(a.profile().kills,100);
  assert(a.open());hit('Ульта дракона · оружие 4/4');assert.equal(api.P.gear.gun,4);assert(!api.isPaused(),'QA ultimate preparation must return to battle');
  for(const [stage,type] of [[5,'bruiser'],[10,'gunner'],[15,'shaman'],[20,'hunter']]){
   assert(a.open());assert(a.jump(stage,type));assert.equal(a.boss().spec.id,type);assert(a.kill());assert(api.loot());assert(!a.pending());
   if(stage===20)assert(!a.open(),'Cannot cover final pickup');else{assert(a.open(),'Normal trophy does not block admin');a.close();}assert(!a.kill(),'Cannot grant boss reward twice');
   api.collectLoot();if(stage!==20){assert(!a.pending());assert(!api.isPaused());continue;}assert(a.pending());assert(!api.P.runWon);
   const choice=a.pending().options[0],before=choice.kind==='gear'?api.P.gear[choice.key]:api.inventory[choice.key];
   assert(a.claim(choice.id));assert(!a.claim(choice.id));
   if(choice.kind==='gear')assert.equal(api.P.gear[choice.key],before+1);
   if(choice.kind==='supply')assert.equal(api.inventory[choice.key],before+1);
  }
  assert(api.P.runWon);assert.equal(a.profile().bosses,4);assert.equal(a.profile().wins,1);assert.equal(a.profile().bossTypes.length,4);
  assert(!a.open(),'Admin cannot cover the epilogue');assert(!el('arenaEnding').classList.contains('hidden'));
  assert(el('endingTitle').textContent.includes('+1')||el('endingTitle').textContent==='Все запасы заполнены');
  for(let i=0;i<125;i++)await frame(34);
  assert(!el('btnEndingSkip').disabled);
  for(const fn of el('btnEndingSkip').events.click||[])fn({stopPropagation:noop});
  assert(el('arenaEnding').classList.contains('hidden'));assert(!el('dragonVictory').classList.contains('hidden'));
  assert(a.open());hit('Авиаудар +5');assert(api.inventory.airstrike>=5);
  const saveItem=box.localStorage.setItem,stashBefore=api.inventory.airstrike;box.localStorage.setItem=()=>{throw Error('quota');};hit('Авиаудар +5');assert.equal(api.inventory.airstrike,stashBefore,'Failed QA inventory save must roll back');box.localStorage.setItem=saveItem;
  adminKeys({code:'Escape',preventDefault:noop,stopImmediatePropagation:noop});assert(a.view());assert(!el('campDialog').classList.contains('hidden'));
  assert(el('campGoals'));assert(!el('camp-weapon-basic'));
  el('campNav-campEquipment').onclick();assert(el('camp-weapon-shotgun'));assert(!el('campGoals'));assert(!el('camp-trial-rush'));
  el('campNav-campTrials').onclick();assert(el('camp-trial-rush'));assert(!el('camp-weapon-shotgun'));el('btnCloseCamp').onclick();
  assert.deepEqual([...db].filter(([k])=>!k.startsWith('vacky_qa_v1:')),live,'QA modified live keys');
  assert(db.has('vacky_qa_v1:vacky_arena_camp_v1'));assert(db.has('vacky_qa_v1:vacky_stickman_inventory_v1'));
  assert(a.fixture('reset'));assert(a.start());assert.equal(a.profile().stage,0,'Old result must not resurrect reset goals on new start');assert.equal(a.profile().wins,0);assert.equal(a.profile().bosses,0);
  assert(a.open());const liveRun=JSON.stringify(api.P);hit('Завершить все задания лагеря');
  const completed=JSON.stringify(a.profile());hit('Завершить все задания лагеря');assert.equal(JSON.stringify(a.profile()),completed,'Completion must be idempotent');
  assert.equal(JSON.stringify(api.P),liveRun,'Complete all must not alter the current run');assert(api.isPaused());
  assert(a.nodes().status.textContent.includes('Задания: 8/8'));
  const savedQA=JSON.parse(db.get('vacky_qa_v1:vacky_arena_camp_v1'));assert.equal(savedQA.shotgunStage,10);assert.equal(savedQA.clean,1);assert(savedQA.trialWins.rush);
  assert.deepEqual([...db].filter(([k])=>!k.startsWith('vacky_qa_v1:')),live,'Completing goals modified live keys');a.close();
  const stageBeforeReset=api.P.stage;assert(a.fixture('reset'));assert.equal(api.P.stage,stageBeforeReset);assert.equal(api.P.campRun,null);
  api.P.runMs=900;api.gameOver();assert.equal(a.profile().stage,0,'Ended test run must not repopulate reset goals');
  assert(a.start());assert(api.P.campRun,'New test run must restore ordinary quest accounting');
  console.log('PASS QA bundle: isolated saves, full panel, reset confirmation, pause ownership, tutorial guard, four bosses/rewards, real quest credit and camp navigation');return;
 }
 assert(!el('adminLaunch'));assert(!box.testAdmin.allowed());assert(!box.testAdmin.fixture('all'));

 assert(api.noCollection());assert.equal(homes.length+bookEntries.length,0);
 for(const key of ['dragonBook','dragonHome','btnVictoryBook','dragonBookBtn','dragonEggBtn','dragonHomeBtn'])assert(!el(key),'Removed UI remains: '+key);
 assert(el('menuScene'));assert(el('btnStart'));assert.deepEqual(Object.keys(api.help).sort(),['restart','resume','run']);
 assert(/<footer class="menu-build-info" dir="ltr">[\s\S]*?<span id="verTag"><\/span><\/footer>/.test(html),'Version must stay in the menu footer');
 assert.equal((html.match(/id="verTag"/g)||[]).length,1,'Duplicate version label');
 assert(html.indexOf('id="btnMenuNewRun"')<html.indexOf('<footer class="menu-build-info"'),'Footer must follow game actions');
 assert(/#verTag\{position:static;/.test(html),'Version must not float over the scene');
 assert.equal(el('verTag').textContent,'v'+html.match(/const VERSION = "([^"]+)"/)[1],'Footer version does not match the build');
 // Boot is read-only for archived collection data.
 const originalProfile=JSON.stringify(profile);
 const oldMenuTime=api.menuTime();await frame(120);assert(reduced?api.menuTime()===oldMenuTime:api.menuTime()>oldMenuTime);
 if(api.tour())api.finishTutorial(true);await tick();
 // New camp is an accessible, read-only visit until an unlocked choice is made.
 const beforeCamp=JSON.stringify({P:api.P,meta:api.meta,inventory:api.inventory});
 const settings=box.testSettings;document.activeElement=el('settingsLaunchstart');el('settingsLaunchstart').onclick();assert(settings.isOpen());
 assert.equal(api.react('hero'),false);el('btnCamp').onclick();assert(el('campDialog').classList.contains('hidden'));
 const beforeSettingsStart=JSON.stringify(api.P);api.start();assert.equal(JSON.stringify(api.P),beforeSettingsStart,'Settings must block start behind it');
 assert(el('settingsPCText').textContent.includes('1 / 2 / 3'));assert(el('settingsPhoneText').textContent.length>100);
 assert.equal(el('settingsControlsstart').children.length,2);assert(el('settingsControlspause').classList.contains('hidden'));
 for(const key of ['shake','reduceFlash','lowFX']){
  const button=el('visual-'+key),old=button.getAttribute('aria-pressed');
  button.onclick();await tick();assert.notEqual(button.getAttribute('aria-pressed'),old);
  button.onclick();await tick();assert.equal(button.getAttribute('aria-pressed'),old);
 }
 document.activeElement=el('visual-lowFX');
 const previousLanguage=settings.language();el('menuLanguagestart').onclick();assert(!settings.close(),'Language child owns close');
 el('chooseLanguageEn').onclick();await tick();assert(settings.isOpen());assert(el('languageDialog').classList.contains('hidden'));
 const mute=el('menuSoundstart').attrs['aria-pressed'];el('menuSoundstart').onclick();await tick();assert.notEqual(el('menuSoundstart').attrs['aria-pressed'],mute);el('menuSoundstart').onclick();await tick();api.language(previousLanguage);await tick();
 const settingsKeys=events.keydown.find(f=>String(f).includes('if(!settingsOpen()||languageMenuOpen())return;'));let settingsStopped=false;
 settingsKeys({key:'Tab',preventDefault:noop,stopImmediatePropagation(){settingsStopped=true;}});assert(settingsStopped);
 assert(el('settingsClose').focused,'Last comfort control must wrap focus to Close');
 settingsKeys({key:'Escape',preventDefault:noop,stopImmediatePropagation:noop});assert(!settings.isOpen());assert(el('settingsLaunchstart').focused);
 assert(!settings.open('pause'),'Hidden pause menu cannot open settings');
 const hiddenPreference=el('visual-lowFX').getAttribute('aria-pressed');el('visual-lowFX').onclick();assert.equal(el('visual-lowFX').getAttribute('aria-pressed'),hiddenPreference,'Hidden settings changed preference');
 if(cloud){system.pause();el('settingsLaunchstart').onclick();assert(!settings.isOpen(),'SDK suspension must block settings');system.resume();await tick();}
 assert(html.indexOf('class="camp-dock"')<html.indexOf('id="btnStart"'),'Preparation must precede Play');
 assert(el('campDockProgress').textContent.startsWith('0/8'));
 for(const [button,heading] of [['btnCampEquipment','campEquipment'],['btnCampTrials','campTrials']]){
  el(button).onclick();assert(!el('campDialog').classList.contains('hidden'));assert(el(heading).focused,'Direct camp section not focused');
  assert.equal(el('campNav-'+heading).getAttribute('aria-pressed'),'true');
  assert(!el('campGoals'),'Quests must not render in other sections');
  if(heading==='campEquipment'){assert(el('camp-weapon-sniper').disabled);assert(!el('camp-style-classic'));assert(el('campEquipment-appearance'));assert(!el('camp-trial-rush'));}
  else{assert(el('camp-trial-rush').disabled);assert(!el('camp-weapon-sniper'));assert(!el('camp-style-classic'));}
  el('btnCloseCamp').onclick();
 }
 assert.equal(JSON.stringify({P:api.P,meta:api.meta,inventory:api.inventory}),beforeCamp,'Camp navigation mutates gameplay');
 el('btnCamp').onclick();assert(!el('campDialog').classList.contains('hidden'));assert(el('campTitle').focused);
 assert.equal(el('campContent').querySelectorAll('*').filter(e=>e.tag==='article').length,8);
 assert.equal(el('campContent').querySelectorAll('*').find(e=>e.tag==='nav').children.length,3);
 assert(!el('camp-weapon-sniper'));assert(!el('camp-trial-rush'));
 el('campPanel').scrollTop=250;el('campNav-campEquipment').onclick();
 assert.equal(el('campPanel').scrollTop,0);assert(!el('campGoals'));assert(el('campNav-campEquipment').focused);
 const staleWeapon=el('camp-weapon-basic');
 document.activeElement=el('campNav-campEquipment');api.language('en');await tick();
 assert(el('camp-weapon-basic'));assert(!el('campGoals'));assert(el('campNav-campEquipment').focused,'Refresh lost navigation focus');
 assert.equal(el('campTitle').textContent,'Arsenal');
 assert(el('camp-weapon-laser'));assert(!el('camp-weapon-minigun'));assert(!el('camp-style-royal'));
 el('campEquipment-appearance').onclick();assert(el('camp-style-royal'));assert(el('camp-style-astral'));assert(!el('arsenalFire'));assert(!el('camp-weapon-basic'));
 el('campEquipment-weapons').onclick();assert(el('arsenalFire'));assert(!el('camp-style-royal'));
 const previewState=JSON.stringify({gear:api.P.gear,inventory:api.inventory,profile:box.testAdmin.profile()});
 for(let lv=0;lv<=4;lv++){el('arsenal-level-'+lv).onclick();assert.equal(el('arsenal-level-'+lv).attrs['aria-pressed'],'true');await frame(40);}
 assert(!el('arsenalListen'));assert.equal(el('arsenalFire').tag,'button');el('arsenalFire').onclick();assert.equal(JSON.stringify({gear:api.P.gear,inventory:api.inventory,profile:box.testAdmin.profile()}),previewState,'Preview changed real equipment, profile or stock');
 if(cloud){system.pause();el('campNav-campTrials').onclick();assert(el('campEquipment'),'SDK suspension must block camp section changes');system.resume();await tick();}
 el('campNav-campTrials').onclick();assert(!el('campEquipment'));assert(el('campTrials'));
 const beforeHiddenChoice=JSON.stringify(box.testAdmin.profile());staleWeapon.onclick();assert.equal(JSON.stringify(box.testAdmin.profile()),beforeHiddenChoice);
 el('campNav-campGoals').onclick();assert.equal(el('campContent').querySelectorAll('*').filter(e=>e.tag==='article').length,8);
 assert(!el('camp-weapon-basic'));assert(!el('camp-trial-normal'));
 assert.equal(api.react('hero'),false,'Hero must not react through camp dialog');
 const campKeys=events.keydown.find(f=>String(f).includes('campPanelActive'));
 document.activeElement=el('campTitle');let stopped=false,prevented=false;
 campKeys({key:'Tab',code:'Tab',stopPropagation(){stopped=true;},preventDefault(){prevented=true;}});assert(stopped&&prevented&&el('btnCloseCamp').focused);
 document.activeElement=el('campNav-campGoals');prevented=false;campKeys({key:'Tab',stopPropagation(){},preventDefault(){prevented=true;}});assert(!prevented,'Section navigation must retain natural Tab order');
 campKeys({key:'Escape',code:'Escape',stopPropagation(){},preventDefault(){}});assert(el('campDialog').classList.contains('hidden'));
 assert.equal(JSON.stringify({P:api.P,meta:api.meta,inventory:api.inventory}),beforeCamp);
 const untouched=JSON.stringify({P:api.P,meta:api.meta,inventory:api.inventory});
 for(const kind of ['rack','chest']){
  assert.equal(api.react(kind),!reduced);
  if(!reduced)for(let i=0;i<125;i++)await frame(100);
  assert.equal(JSON.stringify({P:api.P,meta:api.meta,inventory:api.inventory}),untouched,'Camp interaction changes gameplay');
 }
 api.replayTutorial();await tick();assert.equal(api.tour().id,'welcome');api.finishTutorial();await tick();
 el('btnStart').onclick();assert.equal(api.tour().id,'move','Play must explain movement immediately');assert(api.isPaused());await tick();api.finishTutorial(true);await tick();
 assert(el('start').classList.contains('hidden'));
 const closedMenuTime=api.menuTime();await frame(120);assert.equal(api.menuTime(),closedMenuTime,'Camp animates during battle');assert(api.P.runMs>0);
 // Real UI handlers in every local/cloud bundle: opening is free, selecting costs once.
 const stash={...api.inventory};Object.assign(api.inventory,{airstrike:2,gas:0,tank:0});await frame();
 const toggle=el('abilityToggle'),panel=el('abilityPanel');assert(panel.hidden);assert.equal(toggle.getAttribute('aria-expanded'),'false');
 toggle.onclick();assert(!panel.hidden);assert.equal(api.inventory.airstrike,2);assert(ability[1].disabled);
 assert.equal(el('abilityTotal').textContent,'2');ability[0].onclick();assert.equal(api.inventory.airstrike,1);assert(panel.hidden);
 ability[0].onclick();assert.equal(api.inventory.airstrike,1,'hidden slot spent another charge');
 await tick();await frame(); // Cloud inventory saves temporarily block input by design.
 toggle.onclick();ability[1].onclick();assert(!panel.hidden);assert.equal(api.inventory.gas,0,'empty slot spent a charge');
 for(const fn of events.keydown||[])fn({code:'Escape',key:'Escape',preventDefault:noop,stopPropagation:noop,stopImmediatePropagation:noop});
 assert(panel.hidden);assert(!api.isPaused(),'Escape should close the tray before pausing');
 toggle.onclick();for(const fn of events.pointerdown||[])fn({target:el('game'),stopPropagation:noop});assert(panel.hidden);
 toggle.onclick();api.pauseGame();await frame();assert(panel.hidden);toggle.onclick();assert(panel.hidden);api.resumeGame();
 if(cloud){system.pause();toggle.onclick();assert(panel.hidden);const savedCount=api.inventory.airstrike;ability[0].onclick();assert.equal(api.inventory.airstrike,savedCount);system.resume();await tick();}
 Object.assign(api.inventory,stash);await frame();
 api.pauseGame();const pausedAt=api.P.runMs;await frame(1000);assert.equal(api.P.runMs,pausedAt);
 el('settingsLaunchpause').onclick();assert(settings.isOpen());api.resumeGame();assert(api.isPaused());
 settings.close();assert(api.isPaused(),'Closing settings must not resume a paused run');
 assert(!el('pause').classList.contains('hidden'));
 const beforeMenu=JSON.stringify(api.P);el('btnMainMenu').onclick();
 assert(!el('start').classList.contains('hidden'));assert(el('pause').classList.contains('hidden'));assert.equal(el('mainPlayLabel').dataset.i18n,'resume');
 assert(!el('btnMenuNewRun').classList.contains('hidden'));
 await tick();await frame();
 assert.equal(api.meta.bestStage,1);assert(!el('menuRecord').classList.contains('hidden'));
 const movingTime=api.menuTime();await frame(2000);assert.equal(JSON.stringify(api.P),beforeMenu,'Menu advanced or reset the run');
 if(!reduced)assert(api.menuTime()>movingTime,'Companions stopped on return');
 el('btnStart').onclick();assert(!api.isPaused());assert(el('start').classList.contains('hidden'));assert.equal(JSON.stringify(api.P),beforeMenu);
 api.pauseGame();el('btnMainMenu').onclick();await tick();el('btnMenuNewRun').onclick();
 assert(!el('runConfirm').classList.contains('hidden'));assert(el('btnCancelNewRun').focused);const beforeConfirm=JSON.stringify(api.P);
 el('btnStart').onclick();api.start();api.resumeGame();el('btnMainMenu').onclick();await frame(1000);assert.equal(JSON.stringify(api.P),beforeConfirm,'Open confirmation restarted or advanced the run');
 const confirmKeys=events.keydown.find(f=>String(f).includes('if(!runConfirmOpen())'));
 document.activeElement=el('btnCancelNewRun');let trapped=false;confirmKeys({key:'Tab',shiftKey:true,stopPropagation:noop,preventDefault(){trapped=true;}});assert(trapped&&el('btnConfirmNewRun').focused);
 document.activeElement=el('btnConfirmNewRun');trapped=false;confirmKeys({key:'Tab',shiftKey:false,stopPropagation:noop,preventDefault(){trapped=true;}});assert(trapped&&el('btnCancelNewRun').focused);
 confirmKeys({key:'Escape',stopPropagation:noop,preventDefault:noop});assert(el('runConfirm').classList.contains('hidden'));assert.equal(JSON.stringify(api.P),beforeConfirm);assert(api.isPaused());
 el('btnMenuNewRun').onclick();if(cloud){system.pause();el('btnConfirmNewRun').onclick();assert.equal(JSON.stringify(api.P),beforeConfirm);assert(!el('runConfirm').classList.contains('hidden'));system.resume();await tick();}
 el('btnConfirmNewRun').onclick();await tick();assert(el('runConfirm').classList.contains('hidden'));assert(el('start').classList.contains('hidden'));
 assert.equal(api.P.runMs,0);assert.equal(api.P.lvl,1);assert(!api.isPaused());
 api.P.runMs=123;el('btnConfirmNewRun').onclick();assert.equal(api.P.runMs,123,'Repeated confirm reset run again');
 api.pauseGame();await tick();assert(!el('pause').classList.contains('hidden'),'New run left stale user pause');el('btnRestart').onclick();assert(!el('runConfirm').classList.contains('hidden'));
 el('btnCancelNewRun').onclick();assert(!el('pause').classList.contains('hidden'));assert.equal(api.P.runMs,123);api.resumeGame();
 for(const lang of ['en','ru','es','pt','fr','de','it','pl','tr','id','hi','ja','ko','zh','ar']){assert(api.language(lang));await tick();assert(!/collection|коллекци/.test(api.labels('tagline')));}
 soundButtons[0].onclick();await tick();assert(soundButtons.every(b=>b.attrs['aria-pressed']==='true'));soundButtons[1].onclick();await tick();assert(soundButtons.every(b=>b.attrs['aria-pressed']==='false'));
 api.grantRandomAbility(api.P.x,api.P.y);api.meta.best=51;api.saveMeta();await tick();
 if(cloud){
  assert.equal(reads+writes,0,'Cloud touched localStorage');
  const saved=JSON.parse(saves.at(-1)).records;
  if(!fresh)assert.equal(saved.vacky_dragon_home_v2,originalProfile,'Archived collection overwritten');
  api.pauseGame();system.pause();assert.equal(raf.size,0);await frame(70000);system.resume();await frame();assert(api.isPaused());api.resumeGame();
 }else if(!fresh)assert.equal(db.get('vacky_dragon_home_v2'),originalProfile);
 const stageBefore=api.P.stage;el('devStage').onclick({stopPropagation(){}});
 assert.equal(api.P.stage,stageBefore,'Stage shortcut must be disabled in public builds');
 await frame();assert.equal(el('devStage').style.display,'none');
 for(const stage of [5,10,15,20]){
  assert(api.language(stage===5?'ru':'en'),'Language change must be accepted before the boss test');await tick();
  api.win(stage);await tick();assert(api.loot());assert(el('bossReward').classList.contains('hidden'));assert(!api.isPaused());
  // A supply reward starts a cloud save. Let it settle before the next UI input,
  // as the real platform overlay does; gear rewards do not take this async path.
  api.collectLoot();await tick();if(stage!==20){assert(!api.isPaused());assert(el('bossReward').classList.contains('hidden'));continue;}assert(!api.P.runWon);assert(!el('bossReward').classList.contains('hidden'));assert(api.isPaused());
  const buttons=el('bossRewardChoices').children;assert(buttons.length>=1&&buttons.length<=3);
  assert.equal(el('bossRewardTitle').textContent,stage===5?'Твоя награда':'Your reward');
  assert(el('bossRewardStage').textContent.includes(String(stage)));assert(el('bossRewardFooter').textContent);
  for(const fn of el('bossReward').events.keydown||[])fn({key:'Tab',shiftKey:true,preventDefault:noop});assert(buttons.at(-1).focused);
  for(const fn of el('bossReward').events.keydown||[])fn({key:'Tab',shiftKey:false,preventDefault:noop});assert(buttons[0].focused);
  for(const b of buttons){
   assert(b.dataset.kind);assert.equal(b.children[0].className,'boss-reward-art');assert.equal(b.children[0].children[0].tag,'canvas');
   assert.equal(b.children[0].children[0].width,160);assert(b.children[0].children[1].textContent);
   assert.equal(b.children[1].className,'boss-reward-copy');assert(b.children[1].children[0].textContent);assert(b.children[1].children[1].textContent);
   assert.equal(b.children[1].children[3].className,'boss-reward-impact');assert(b.children[1].children[3].textContent);
  }
  if(cloud&&stage===5){system.pause();buttons[0].onclick();assert(!el('bossReward').classList.contains('hidden'));system.resume();await tick();}
  buttons[0].onclick();const inventoryAfter=JSON.stringify(api.inventory);buttons[0].onclick();assert.equal(JSON.stringify(api.inventory),inventoryAfter);await tick();
 }
 assert(!el('arenaEnding').classList.contains('hidden'),'Epilogue precedes results');assert(el('dragonVictory').classList.contains('hidden'));
 const wonInventory=JSON.stringify(api.inventory),wonTime=api.P.runMs;
 for(let i=0;i<360;i++)await frame(34);
 assert(el('arenaEnding').classList.contains('hidden'));assert.equal(api.P.runMs,wonTime);assert.equal(JSON.stringify(api.inventory),wonInventory);
 assert(!el('dragonVictory').classList.contains('hidden'));assert(!/коллекци|Награда|обмен/.test(el('victoryDragonText').textContent));
 assert.equal(el('victoryBosses').children.length,4);assert.equal(el('victoryGear').children.length,8);
 assert(el('victoryProgress').children.length>0);assert(!el('perks'),'Infinite death perks must be removed');
 el('btnVictoryMenu').onclick();await tick();assert(!el('start').classList.contains('hidden'));assert(el('dragonVictory').classList.contains('hidden'));
 el('btnCampTrials').onclick();assert(!el('camp-trial-rush').disabled);assert(!el('camp-weapon-shotgun'));
 el('campNav-campEquipment').onclick();assert(!el('camp-weapon-shotgun').disabled);assert(!el('camp-trial-rush'));
 el('campPanel').scrollTop=375;
 const oldWeapon=api.P.wtype;el('camp-weapon-shotgun').onclick();await tick();assert.equal(api.P.wtype,oldWeapon,'Selection changed finished run');assert.equal(el('campPanel').scrollTop,375);
 assert.equal(el('camp-weapon-shotgun').attrs['aria-pressed'],'true');
 const detachedBasic=el('camp-weapon-basic');el('campNav-campTrials').onclick();detachedBasic.onclick();
 assert.equal(box.testAdmin.profile().weapon,'shotgun','Detached equipment button changed the selected weapon');
 el('campNav-campEquipment').onclick();assert.equal(el('camp-weapon-shotgun').attrs['aria-pressed'],'true');el('btnCloseCamp').onclick();
 api.start();assert.equal(api.P.stage,1);assert.equal(api.P.wtype,'shotgun');assert.equal(api.P.gear.gun,0);
 api.P.runMs=3000;api.P.hp=1;api.P.invT=0;api.P.hurt=0;api.P.redKills=54321;api.P.testRun=false;api.P.trial='normal';
 const oldPerks=[api.meta.hp,api.meta.dmg,api.meta.spd,api.meta.luck];
 assert(api.hurtHero(1,{x:api.P.x+10,y:api.P.y}),'Fatal hit must finish the run');await tick();
 assert.equal(api.P.hp,0);assert(!api.P.runWon);assert(api.P.rankingRecorded,'Death must save the score without a victory');
 assert.equal(api.ranking().best,54321);assert(api.loadRanking().runs.some(r=>r.kills===54321&&!r.won),'Defeat survives a reload');
 assert(el('overScoreStatus').textContent.includes('54321'));
 const recordedRows=api.ranking().runs.length;api.gameOver();assert.equal(api.ranking().runs.length,recordedRows,'Duplicate gameOver cannot record twice');
 assert(!el('over').classList.contains('hidden'));assert(el('overProgress').children.length>0);assert(el('btnOverRetry').focused);
 assert.deepEqual([api.meta.hp,api.meta.dmg,api.meta.spd,api.meta.luck],oldPerks,'Death must not grant permanent power');
 if(cloud){system.pause();el('btnOverRetry').onclick();assert.equal(api.P.hp,0);assert(!el('over').classList.contains('hidden'));system.resume();await tick();}
 el('btnOverRetry').onclick();await tick();assert(el('over').classList.contains('hidden'));api.P.runMs=1234;
 el('btnOverRetry').onclick();el('btnVictoryRestart').onclick();assert.equal(api.P.runMs,1234,'Hidden/duplicate end-screen actions must not reset a live run');
 el('btnOverMenu').onclick();el('btnCamp').onclick();assert(el('start').classList.contains('hidden'));assert(el('campDialog').classList.contains('hidden'));assert.equal(api.P.runMs,1234);
 api.gameOver();await tick();
 el('btnOverMenu').onclick();await tick();assert(el('over').classList.contains('hidden'));assert(!el('start').classList.contains('hidden'));
 assert.equal(api.ranking().best,54321,'A weaker defeat cannot replace the best score');
 assert(el('menuBestScore').textContent.includes('54321'),'Camp record reflects the defeated run');
 console.log('PASS arena menu:',cloud?(playgama?'Playgama':'YouTube'):'local',reduced?'reduced':'animated',fresh?'fresh':'existing');
}
(async()=>{for(const args of [[false],[false,false,true],[false,false,false,true],[true],[true,true],[false,false,false,false,true]])await runMode(...args);})().catch(e=>{console.error(e);process.exitCode=1;});
