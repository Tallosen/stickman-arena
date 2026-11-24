const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const noop=()=>{};const ctx=new Proxy({createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),measureText:s=>({width:String(s).length*7})},{get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
class Element{
 constructor(tag='div'){this.tag=tag;this.children=[];this.dataset={};this.style={};this.attrs={};this.events={};this.value='all';this.isConnected=true;this.classes=new Set();this.width=720;this.height=480;this.scrollTop=0;this.classList={add:(...s)=>s.forEach(x=>this.classes.add(x)),remove:(...s)=>s.forEach(x=>this.classes.delete(x)),contains:s=>this.classes.has(s),toggle:(s,on)=>{on=on??!this.classes.has(s);on?this.classes.add(s):this.classes.delete(s);return on;}};}
 appendChild(e){this.children.push(e);return e;}replaceChildren(){this.children=[];}setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k];}
 set innerHTML(v){this.children=[];for(const m of v.matchAll(/<(canvas|div|button|b|span)\b/g))this.children.push(new Element(m[1]));}get innerHTML(){return '';}
 addEventListener(k,fn){(this.events[k]??=[]).push(fn);}querySelector(s){return this.children.find(e=>e.tag===s)||new Element(s);}
 querySelectorAll(){return this.children.filter(e=>e.tag==='button');}focus(){}scrollIntoView(){}setPointerCapture(){}click(){this.onclick?.();}
 getBoundingClientRect(){return {left:0,top:0,width:600,height:410};}getClientRects(){return this.classes.has('hidden')?[]:[{}];}
 getContext(kind){return kind==='webgl'||kind==='webgl2'?null:ctx;}
}
const tick=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
async function runMode(cloud,playgama=false,reduced=false,fresh=false){
 const html=fs.readFileSync(path.join(root,playgama?'dist/playgama/index.html':cloud?'dist/youtube/index.html':'dist/index.html'),'utf8'),elements=new Map(),events={},raf=new Map(),timers=new Map();let id=0,time=1000,reads=0,writes=0;
 for(const m of html.matchAll(/<([a-z][a-z0-9]*)\b[^>]*\bid="([^"]+)"[^>]*>/g)){const e=new Element(m[1]);if(/class="[^"]*\bhidden\b/.test(m[0]))e.classList.add('hidden');elements.set(m[2],e);}
 const ability=['airstrike','gas','tank'].map(kind=>{const e=new Element('button');e.dataset.ability=kind;return e;});
 const homes=[...html.matchAll(/<button\b[^>]*data-open-home="([^"]+)"[^>]*>/g)].map(m=>{const id=m[0].match(/id="([^"]+)"/)?.[1],e=id?elements.get(id):new Element('button');e.dataset.openHome=m[1];return e;});
 const bookEntries=Array.from(html.matchAll(/<button\b[^>]*\bdata-open-book(?:\s|>)/g),()=>new Element('button'));
 const languages=[elements.get('menuLanguagestart'),elements.get('menuLanguagepause')];
 const languageChoices=[elements.get('chooseLanguageEn'),elements.get('chooseLanguageRu')];languageChoices[0].dataset.chooseLanguage='en';languageChoices[1].dataset.chooseLanguage='ru';
 const soundButtons=[elements.get('menuSoundstart'),elements.get('menuSoundpause')];
 const el=id=>elements.get(id),document={body:new Element(),activeElement:new Element(),hidden:false,getElementById:el,createElement:t=>new Element(t),addEventListener:(k,f)=>{(events[k]??=[]).push(f);},querySelectorAll:s=>s==='[data-open-home]'?homes:s==='[data-open-book]'?bookEntries:s==='[data-language]'?languages:s==='[data-sound]'?soundButtons:s==='[data-choose-language]'?languageChoices:s==='.ability-slot'?ability:[]};
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
 const exposed='window.testGame={cellSlot:()=>homeThumbSlots[0],beginDragonCare,careActive:()=>homeCareActive,musicVoices:()=>dragonMusicVoices.size,P,meta,inventory,craftDragon,feedDragonEgg,hatchDragonEgg,useAbility,grantRandomAbility,openDragonHome,dragonProfile,start,saveMeta,homeHatch:()=>homeHatching,homeTab:()=>homeTab,homeRaf:()=>homeRaf,homePending:()=>homeThumbJobs.length,homeTime:()=>homeAnimTime,shelfVisible:v=>{homeShelfVisible=v;wakeDragonHome();},cacheFrames:()=>[...homeThumbCache.values()].map(f=>f.length),beginHomeHatch,manualPause:()=>{userPaused=true;paused=true;},isPaused:()=>paused,pauseGame,resumeGame,replayTutorial,finishTutorial,tour:()=>tutorialActive};return platformGameHooks();';
 assert(html.indexOf(playgama?'bridge.playgama.com/v2/stable':'youtube.com/game_api/v1')<html.indexOf('const Playables'));
 if(playgama)assert(!html.includes('src="https://www.youtube.com/game_api/v1"'));
 assert(!html.includes('type="text/vacky-module"'));assert(!html.includes('src="src/'));
 for(const s of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(s[1].replace('return platformGameHooks();',exposed),box);
 const frame=async(ms=16)=>{time+=ms;const jobs=[...raf.values()];raf.clear();jobs.forEach(f=>f(time));await tick();};
 await tick();await frame();await tick();const api=box.testGame;assert(api,'Bundle did not launch: '+el('platformMessage').textContent);
 assert(el('platformGate').hidden,'Launch failed: '+el('platformMessage').textContent);
 if(fresh){
  await frame(300);
  assert.equal(api.tour()?.id,'welcome');api.finishTutorial();await tick();
  el('btnStart').onclick();
  assert.equal(api.tour()?.id,'move','Play must show movement synchronously, without a frame');
  assert(api.isPaused());assert.equal(api.P.runMs,0);
  await frame(1000);assert.equal(api.P.runMs,0,'No combat time while reading');
  api.finishTutorial();await tick();await frame(100);
  assert(!api.isPaused());assert(api.P.runMs>0);
  const records=cloud?JSON.parse(saves.at(-1)).records:Object.fromEntries(db);
  const progress=JSON.parse(records.vacky_tutorial_v1);
  assert(progress.seen.welcome&&progress.seen.move);
  if(cloud)assert.equal(reads+writes,0);
  console.log('PASS: fresh '+(playgama?'Playgama':cloud?'YouTube':'local')+' Play click immediately teaches movement, pauses battle and saves steps');
  return;
 }
 assert.equal(api.dragonProfile.counts.green,6);
 assert(!el('homeSections'));assert.equal(homes.length,8);
 el('dragonEggBtn').onclick();assert.equal(api.homeTab(),'incubator');assert(!el('incubatorPanel').classList.contains('hidden'));
 assert(api.feedDragonEgg().ok);await tick();assert.equal(api.dragonProfile.egg.fed,1);assert.equal(api.dragonProfile.counts.diamond,6);
 el('btnCloseHome').onclick();assert(el('dragonHome').classList.contains('hidden'));el('dragonHomeBtn').onclick();assert.equal(api.homeTab(),'warehouse');assert(el('incubatorPanel').classList.contains('hidden'));
 const personalitySeed=api.dragonProfile.personalities[0];assert(Number.isInteger(personalitySeed)&&personalitySeed>0,'Existing pet must receive a saved personality');
 for(let i=0;i<100;i++)await frame(34);assert.equal(api.homePending(),0);assert.equal(!!api.homeRaf(),!reduced,'Animation honors reduced motion');assert(api.cacheFrames().every(n=>n===(1)));
 api.shelfVisible(false);await frame(34);assert.equal(api.homeRaf(),0,'Offscreen collection stops');api.shelfVisible(true);await frame(34);
 const slot=api.cellSlot(),yaw=slot.view.yaw,ev=x=>({button:0,pointerId:1,pointerType:'mouse',clientX:x,clientY:100,preventDefault(){}});
 slot.c.events.pointerdown[0](ev(100));slot.c.events.pointermove[0](ev(160));await frame(34);assert(slot.view.yaw<yaw);assert(slot.dirty);slot.c.events.pointerup[0](ev(160));
 for(let i=0;i<100;i++)await frame(34);assert.equal(slot.frames.length,1);assert.equal(api.homePending(),0);assert(!slot.dirty,'Camera frame cache must rebuild');assert(!el('dragonHome').classList.contains('inspecting'));
 if(cloud){slot.c.events.pointerdown[0](ev(100));slot.c.events.pointermove[0](ev(140));system.pause();assert.equal(slot.gesture,null,'SDK pause cancels camera drag');system.resume();await frame(34);}
 if(cloud){const animationTime=api.homeTime();system.pause();assert.equal(raf.size,0,'SDK pause stops collection animation');await frame(70000);assert.equal(api.homeTime(),animationTime);system.resume();await frame(34);assert(api.homeTime()-animationTime<.07,'No animation jump on resume');assert(api.homeRaf()>0,'Collection resumes after SDK pause');}
 assert(api.beginDragonCare(0,'feed'));await tick();assert.equal(api.dragonProfile.care[0],2);assert(!api.beginDragonCare(0,'feed'),'Duplicate tap must not earn more affection');
 assert(api.beginDragonCare(0,'pet'));await tick();assert.equal(api.dragonProfile.care[0],3);
 assert(api.beginDragonCare(0,'music'));await tick();assert.equal(api.dragonProfile.care[0],4);await frame(34);assert.equal(api.careActive().kind,'music');
 if(cloud){const t=api.homeTime();system.pause();await frame(50000);assert.equal(api.homeTime(),t);assert(!api.beginDragonCare(0,'pet'));system.resume();await frame(34);assert.equal(api.careActive().kind,'music');}
 assert(api.beginDragonCare(0,'music'));if(reduced)assert.equal(api.careActive(),null,'Reduced motion stops immediately');else assert.equal(api.careActive().kind,'settle','Second music tap gently ends the pose');assert.equal(api.musicVoices(),0,'Music must stop immediately');assert.equal(api.dragonProfile.care[0],4);
 for(let i=0;i<16;i++)await frame(34);assert.equal(api.careActive(),null,'Silent settling must finish');
 for(let i=0;i<130;i++)await frame(34);assert(api.beginDragonCare(0,'music'));await tick();
 api.shelfVisible(false);await frame(34);assert.equal(api.careActive(),null,'Offscreen music stops');api.shelfVisible(true);await frame(34);
 assert.equal(api.dragonProfile.exclusives[0],2,'Care does not spend dragons');
 assert(api.craftDragon('green').ok);await tick();assert.equal(api.dragonProfile.counts.green,3);assert.equal(api.dragonProfile.counts.blue,1);
 if(!cloud){el('btnAdminCatalog').onclick();for(let p=0;p<12;p++){el('homeNext').onclick();await frame(34);assert(api.cacheFrames().length<=12,'Thumbnail cache must stay bounded while paging');}}
 el('btnCloseHome').onclick();assert(el('dragonHome').classList.contains('hidden'));assert.equal(api.homeRaf(),0,'Closed collection must stop animation');
 for(const entry of homes){entry.onclick();assert.equal(api.homeTab(),entry.dataset.openHome);el('btnCloseHome').onclick();}
 api.start();await frame();assert.equal(el('dragonEggBtn').style.display,undefined,'HUD sync must not expose menu buttons on arena');
 assert.equal(bookEntries.length,3);
 api.pauseGame();const menuTime=api.P.runMs;assert(api.isPaused());assert(!el('pause').classList.contains('hidden'));
 for(const entry of [el('dragonBookBtn'),...bookEntries]){entry.onclick();assert(!el('dragonBook').classList.contains('hidden'));await frame(1000);el('btnCloseBook').onclick();assert(api.isPaused());assert.equal(api.P.runMs,menuTime);}
 for(const entry of [el('dragonEggBtn'),el('dragonHomeBtn')]){entry.onclick();await frame(1000);el('btnCloseHome').onclick();assert(api.isPaused());assert(!el('pause').classList.contains('hidden'));assert.equal(api.P.runMs,menuTime);}
 api.resumeGame();assert(!api.isPaused());assert(el('pause').classList.contains('hidden'));api.grantRandomAbility(api.P.x,api.P.y);await tick();api.meta.best=51;api.saveMeta();await tick();
 if(cloud){
  assert.equal(reads+writes,0,'YouTube touched localStorage');assert.deepEqual(trace,playgama?['init','load','ready']:['first','load','ready']);
  const saved=JSON.parse(saves.at(-1)).records;assert.equal(JSON.parse(saved.vacky_dragon_home_v2).personalities[0],personalitySeed);assert.equal(JSON.parse(saved.vacky_dragon_home_v2).care[0],5);assert.equal(JSON.parse(saved.vacky_dragon_home_v2).counts.blue,1);assert(saved.vacky_stickman_inventory_v1);assert.equal(JSON.parse(saved.vacky_meta_v1).best,51);
  assert.equal(el('devLvl').style.display,'none');assert(!events.visibilitychange,'Web visibility used in Playables');
  const ms=api.P.runMs;api.manualPause();system.pause();assert.equal(raf.size,0);assert.equal(timers.size,0);await frame(70000);assert.equal(api.P.runMs,ms);system.resume();await frame();assert(api.isPaused(),'Host resume cancelled manual pause');assert.equal(api.P.runMs,ms);
 }
 soundButtons[0].onclick();await tick();assert(soundButtons.every(b=>b.attrs['aria-pressed']==='true'));
 const prefs=cloud?JSON.parse(saves.at(-1)).records:Object.fromEntries(db);assert.equal(prefs.vacky_sound_muted_v1,'1');
 soundButtons[1].onclick();await tick();assert(soundButtons.every(b=>b.attrs['aria-pressed']==='false'));
 api.pauseGame();const languageTime=api.P.runMs;
 languages[1].onclick();assert(!el('languageDialog').classList.contains('hidden'));
 await frame(300);assert.equal(api.P.runMs,languageTime);
 languageChoices[0].onclick();await tick();assert(el('languageDialog').classList.contains('hidden'));assert(api.isPaused());
assert(languages.every(e=>e.value==='en'));if(cloud)assert.equal(JSON.parse(saves.at(-1)).records.vacky_language_v1,'en');else assert.equal(db.get('vacky_language_v1'),'en');
 api.openDragonHome('incubator');await tick();api.replayTutorial();await tick();assert.equal(api.tour().id,'egg');assert.equal(el('tutorialTitle').textContent,'Hatch your own pet');assert(api.isPaused());api.finishTutorial();await tick();assert.equal(api.tour(),null);
 if(cloud){assert.equal(reads+writes,0);const training=JSON.parse(JSON.parse(saves.at(-1)).records.vacky_tutorial_v1);assert(training.seen.egg);assert.equal(training.disabled,false);}
 else assert(JSON.parse(db.get('vacky_tutorial_v1')).seen.egg);
 el('btnCloseHome').onclick();
 console.log('PASS: entire '+(playgama?'Playgama':cloud?'strict YouTube':'local')+' bundle initializes, real collection/egg/craft/inventory/meta, separate Home screens'+(cloud?', no browser saves, SDK-only pause, no timer jump':''));
}
(async()=>{await runMode(false);await runMode(false,false,true);await runMode(true);await runMode(true,true);await runMode(false,false,false,true);await runMode(true,false,false,true);await runMode(true,true,false,true);})().catch(e=>{console.error(e);process.exitCode=1;});
