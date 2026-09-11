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
async function runMode(cloud,playgama=false,reduced=false){
 const html=fs.readFileSync(path.join(root,playgama?'dist/playgama/index.html':cloud?'dist/youtube/index.html':'dist/index.html'),'utf8'),elements=new Map(),events={},raf=new Map(),timers=new Map();let id=0,time=1000,reads=0,writes=0;
 for(const m of html.matchAll(/<([a-z][a-z0-9]*)\b[^>]*\bid="([^"]+)"[^>]*>/g)){const e=new Element(m[1]);if(/class="[^"]*\bhidden\b/.test(m[0]))e.classList.add('hidden');elements.set(m[2],e);}
 const ability=['airstrike','gas','tank'].map(kind=>{const e=new Element('button');e.dataset.ability=kind;return e;});
 const homes=[...html.matchAll(/<button\b[^>]*data-open-home="([^"]+)"[^>]*>/g)].map(m=>{const id=m[0].match(/id="([^"]+)"/)?.[1],e=id?elements.get(id):new Element('button');e.dataset.openHome=m[1];return e;});
 const el=id=>elements.get(id),document={body:new Element(),activeElement:new Element(),hidden:false,getElementById:el,createElement:t=>new Element(t),addEventListener:(k,f)=>{(events[k]??=[]).push(f);},querySelectorAll:s=>s==='[data-open-home]'?homes:s==='.ability-slot'?ability:[]};
 const profile={version:2,revision:1,counts:{green:6,blue:0,violet:0,pink:0,blackgold:0,gold:0,diamond:7},rescues:13,exclusives:{0:2},egg:null};
 const db=new Map([['vacky_dragon_home_v2',JSON.stringify(profile)]]),trace=[],saves=[],system={};
 const box={console,document,innerWidth:390,innerHeight:844,devicePixelRatio:1,performance:{now:()=>time},matchMedia:()=>({matches:reduced}),ResizeObserver:class{observe(){}},IntersectionObserver:class{observe(){}},
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
 const exposed='window.testGame={P,meta,inventory,craftDragon,feedDragonEgg,hatchDragonEgg,useAbility,grantRandomAbility,openDragonHome,dragonProfile,start,saveMeta,homeHatch:()=>homeHatching,homeTab:()=>homeTab,homeRaf:()=>homeRaf,homePending:()=>homeThumbJobs.length,homeTime:()=>homeAnimTime,shelfVisible:v=>{homeShelfVisible=v;wakeDragonHome();},cacheFrames:()=>[...homeThumbCache.values()].map(f=>f.length),beginHomeHatch,manualPause:()=>{userPaused=true;paused=true;},isPaused:()=>paused};return platformGameHooks();';
 assert(html.indexOf(playgama?'bridge.playgama.com/v2/stable':'youtube.com/game_api/v1')<html.indexOf('const Playables'));
 if(playgama)assert(!html.includes('src="https://www.youtube.com/game_api/v1"'));
 assert(!html.includes('type="text/vacky-module"'));assert(!html.includes('src="src/'));
 for(const s of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(s[1].replace('return platformGameHooks();',exposed),box);
 const frame=async(ms=16)=>{time+=ms;const jobs=[...raf.values()];raf.clear();jobs.forEach(f=>f(time));await tick();};
 await tick();await frame();await tick();const api=box.testGame;assert(api,'Bundle did not launch: '+el('platformMessage').textContent);
 assert(el('platformGate').hidden,'Launch failed: '+el('platformMessage').textContent);assert.equal(api.dragonProfile.counts.green,6);
 assert(!el('homeSections'));assert.equal(homes.length,10);
 el('dragonEggBtn').onclick();assert.equal(api.homeTab(),'incubator');assert(!el('incubatorPanel').classList.contains('hidden'));
 assert(api.feedDragonEgg().ok);await tick();assert.equal(api.dragonProfile.egg.fed,1);assert.equal(api.dragonProfile.counts.diamond,6);
 el('btnCloseHome').onclick();assert(el('dragonHome').classList.contains('hidden'));el('dragonHomeBtn').onclick();assert.equal(api.homeTab(),'warehouse');assert(el('incubatorPanel').classList.contains('hidden'));
 for(let i=0;i<20;i++)await frame(34);assert.equal(api.homePending(),0);assert.equal(!!api.homeRaf(),!reduced,'Animation honors reduced motion');assert(api.cacheFrames().every(n=>n===(reduced?1:12)));
 api.shelfVisible(false);await frame(34);assert.equal(api.homeRaf(),0,'Offscreen collection stops');api.shelfVisible(true);await frame(34);
 if(cloud){const animationTime=api.homeTime();system.pause();assert.equal(raf.size,0,'SDK pause stops collection animation');await frame(70000);assert.equal(api.homeTime(),animationTime);system.resume();await frame(34);assert(api.homeTime()-animationTime<.07,'No animation jump on resume');assert(api.homeRaf()>0,'Collection resumes after SDK pause');}
 assert(api.craftDragon('green').ok);await tick();assert.equal(api.dragonProfile.counts.green,3);assert.equal(api.dragonProfile.counts.blue,1);
 if(!cloud){el('btnAdminCatalog').onclick();for(let p=0;p<12;p++){el('homeNext').onclick();await frame(34);assert(api.cacheFrames().length<=12,'Thumbnail cache must stay bounded while paging');}}
 el('btnCloseHome').onclick();assert(el('dragonHome').classList.contains('hidden'));assert.equal(api.homeRaf(),0,'Closed collection must stop animation');
 for(const entry of homes){entry.onclick();assert.equal(api.homeTab(),entry.dataset.openHome);el('btnCloseHome').onclick();}
 api.start();await frame();assert.equal(el('dragonEggBtn').style.display,'flex');api.grantRandomAbility(api.P.x,api.P.y);await tick();api.meta.best=51;api.saveMeta();await tick();
 if(cloud){
  assert.equal(reads+writes,0,'YouTube touched localStorage');assert.deepEqual(trace,playgama?['init','load','ready']:['first','load','ready']);
  const saved=JSON.parse(saves.at(-1)).records;assert.equal(JSON.parse(saved.vacky_dragon_home_v2).counts.blue,1);assert(saved.vacky_stickman_inventory_v1);assert.equal(JSON.parse(saved.vacky_meta_v1).best,51);
  assert.equal(el('devLvl').style.display,'none');assert(!events.visibilitychange,'Web visibility used in Playables');
  const ms=api.P.runMs;api.manualPause();system.pause();assert.equal(raf.size,0);assert.equal(timers.size,0);await frame(70000);assert.equal(api.P.runMs,ms);system.resume();await frame();assert(api.isPaused(),'Host resume cancelled manual pause');assert.equal(api.P.runMs,ms);
 }
 console.log('PASS: entire '+(playgama?'Playgama':cloud?'strict YouTube':'local')+' bundle initializes, real collection/egg/craft/inventory/meta, separate Home screens'+(cloud?', no browser saves, SDK-only pause, no timer jump':''));
}
(async()=>{await runMode(false);await runMode(false,false,true);await runMode(true);await runMode(true,true);})().catch(e=>{console.error(e);process.exitCode=1;});
