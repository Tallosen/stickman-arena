// Exercise the actual canvas/DOM writers, not just translation dictionaries.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,'src',f),'utf8');
const noop=()=>{},texts=[],db=new Map([['vacky_language_v1','en']]),nodes=new Map();
const paint=new Proxy({fillText:text=>texts.push(String(text)),measureText:text=>({width:String(text).length*6})},{get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
class El{
 constructor(){this.style={};this.attrs={};this.dataset={};this.children=[];this.classList={add:noop,remove:noop,toggle:noop};this.scrollTop=0;}
 setAttribute(k,v){this.attrs[k]=v;}getContext(){return paint;}appendChild(el){this.children.push(el);}addEventListener(){}
 set innerHTML(v){this.html=v;this.children=[];}get innerHTML(){return this.html||'';}querySelector(){return new El();}
}
const el=id=>{if(!nodes.has(id))nodes.set(id,new El());return nodes.get(id);};
const doc={documentElement:new El(),getElementById:el,createElement:()=>new El(),querySelectorAll:()=>[],addEventListener:noop};
const box={assert,console,document:doc,ctx:paint,localStorage:{getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,v)},navigator:{language:'en'},setTimeout:noop};
vm.createContext(box);const run=s=>vm.runInContext(s,box);
for(const file of ['language-packs.js','localization.js','config.js','progression.js'])run(read(file));
run(`
 const INK='#222',FOE='#c43',HERO='#d70',WORLD=2800,W=390,H=844;
 const P={lvl:2,hp:5,hpMax:5,xp:30,xpNext:100,stage:2,stageMs:1000,stagePulse:900,hasteT:6000,invT:5000,item:'mine',redKills:40,
 gear:Object.fromEntries(GK.map(k=>[k,0])),wtype:'basic',pet:null,abilityMenuOpen:false};
 let running=true,paused=false,xpBoost=20000,t=100,touchMode=false;queuedLevels=1;
 const pointer={active:false},allyTanks=[{hp:100,hpMax:200}],ult={on:false,charge:42000},ULT_FULL=42000;
 const SFX={};const empoweredUlt=()=>true,radar=()=>{},syncRadarButton=()=>{},drawPetBadge=()=>{},drawItemIcon=()=>{},drawHero=()=>{},drawPet=()=>{},abilityMenuAvailable=()=>true;
 const setAbilityMenuOpen=()=>{};
 const useBtn=document.getElementById('useBtn'),useIco=document.getElementById('useIco'),useName=document.getElementById('useName'),pauseBtn=document.getElementById('pauseBtn');
 const devLvl=document.getElementById('devLvl'),devStage=document.getElementById('devStage'),devUlt=document.getElementById('devUlt'),devRare=document.getElementById('devRare'),devSniper=document.getElementById('devSniper'),devFull=document.getElementById('devFull'),devDragon=document.getElementById('devDragon'),devCompass=document.getElementById('devCompass');
 const abilityDock=document.getElementById('abilityDock'),abilityPanel=document.getElementById('abilityPanel'),abilityToggle=document.getElementById('abilityToggle'),abilityTotal=document.getElementById('abilityTotal');
 const abilitySlots=ABILITY_KEYS.map(k=>{const e=document.createElement('button');e.dataset.ability=k;return e;});
`);
run(read('bosses.js'));
const ui=read('ui.js');
run(ui.slice(ui.indexOf('const hudHeight'),ui.indexOf('let radarNear=false')));
run(ui.slice(ui.indexOf('let lastItem ='),ui.indexOf('// если какой-то модуль')));
run(read('cards.js'));
const noRussian=(values,label)=>{for(const value of values)assert(!/[А-Яа-яЁё]/u.test(value),label+': '+value);};
run('applyLanguage();hud();');
noRussian(texts,'English combat canvas');
for(const expected of ['LV','STAGE 2 / 20','NEW WAVE','HASTE  6','INVULNERABLE  5','XP ×2  20','TANK ×1  100/200','DRAGON · ULT','DOUBLE CLICK'])assert(texts.includes(expected),expected);
assert.equal(el('useName').textContent,'Mine');
noRussian([el('pauseBtn').attrs.title,el('pauseBtn').attrs['aria-label'],el('victoryTag').textContent],'DOM labels');
run(`for(const table of [GEAR,WEAPONS,ITEMS,PETS,PERKS,ABILITIES])for(const entry of Object.values(table))for(const key of ['name','desc','short'])if(entry[key])assert(!/[А-Яа-яЁё]/.test(entry[key]),entry[key]);
 for(const w of Object.keys(WEAPONS))for(let tier=0;tier<5;tier++)assert(!/[А-Яа-яЁё]/.test(weaponFormName(w,tier)));
 for(const slot of abilitySlots){assert(!/[А-Яа-яЁё]/.test(slot.title));assert(!/[А-Яа-яЁё]/.test(slot.attrs['aria-label']));}
`);
// Switch with the same item/charge counts. Cached labels must change while paused.
run(`paused=true;setGameLanguage('ru');`);assert.equal(el('useName').textContent,'Мина');
assert.equal(run('ABILITIES.airstrike.name'),'АВИАУДАР');
run(`setGameLanguage('en');`);assert.equal(el('useName').textContent,'Mine');
run(`P.item=null;syncHUD();`);assert.equal(el('useName').textContent,'empty');
run(`P.item='mine';syncHUD();`);
const unchanged=run('JSON.stringify({item:P.item,gear:P.gear,hp:P.hp,inventory})');
run(`setGameLanguage('ru');setGameLanguage('en');`);
assert.equal(run('JSON.stringify({item:P.item,gear:P.gear,hp:P.hp,inventory})'),unchanged);
// Actual level cards, including a rare pet and the queued-upgrade caption.
run(`queuedLevels=2;offerCards({pick:['gun','helm','clip','@pet'],pet:'chicken'});`);
noRussian(el('cards').children.map(e=>e.innerHTML),'English upgrade cards');
assert(el('cards').children.some(e=>e.innerHTML.includes('Chicken')&&e.innerHTML.includes('RARE')));
noRussian([el('levelTitle').textContent,el('queueTag').textContent],'Upgrade headings');
assert.equal(el('levelTitle').textContent,'LEVEL 2');assert.equal(el('queueTag').textContent,'more levels queued: 1');
run(`queuedLevels=1;offerCards({pick:['boots','jacket','scope','@pet'],pet:'dog'});`);
noRussian(el('cards').children.map(e=>e.innerHTML).concat(el('queueTag').textContent),'Equipment cards');
// A Russian saved reward must display in the current language, retaining its ID.
run(`const savedReward={id:'supply:airstrike',kind:'supply',key:'airstrike',title:'АВИАУДАР +1',desc:'Сохранится'};
 const translated=localizedBossReward(savedReward);assert.equal(translated.id,savedReward.id);assert.equal(translated.title,'AIRSTRIKE +1');assert(!/[А-Яа-яЁё]/.test(translated.desc));assert.equal(savedReward.title,'АВИАУДАР +1');`);
for(const stage of [5,10,15,20]){
 run(`P.stage=${stage};`);texts.length=0;run('hud();');noRussian(texts,'Boss-stage canvas');assert(texts.includes('BOSS '+stage+' / 20'));
 run(`for(const option of bossRewardOptions(${stage},true))assert(!/[А-Яа-яЁё]/.test(option.title+' '+option.desc));`);
}
run(`setGameLanguage('es');P.stage=2;touchMode=true;`);texts.length=0;run('hud();');noRussian(texts,'Non-Russian combat fallback');assert(texts.includes('SPREAD TWO FINGERS'));
run(`setGameLanguage('ru');`);texts.length=0;run('hud();');assert(texts.includes('СТАДИЯ 2 / 20'));assert(texts.includes('НОВАЯ ВОЛНА'));assert.equal(el('useName').textContent,'Мина');
console.log('PASS: real HUD canvas/DOM, live RU/EN switch without changing the item, weapon forms, gear/pet cards, bosses, saved reward copy and non-RU fallback');

// The pre-game/save gate has a separate scope and must translate independently.
async function platformGate(corrupt=false){
 const els=new Map(),records=new Map(corrupt?[['vacky_atomic_v1','{"version":999}']]:[]);
 const get=id=>{if(!els.has(id))els.set(id,{});return els.get(id);};
 const shell={console,document:{getElementById:get,hidden:false,addEventListener:noop},navigator:{language:'en-US'},performance:{now:()=>0},
 requestAnimationFrame:()=>1,cancelAnimationFrame:noop,setTimeout:()=>1,clearTimeout:noop,addEventListener:noop,
 localStorage:{getItem:k=>records.get(k)??null,setItem:(k,v)=>records.set(k,v)},location:{reload:noop}};
 shell.window=shell;vm.createContext(shell);vm.runInContext(read('playables.js')+';window.api=Playables;',shell);
 await shell.api.boot(()=>({language:()=> 'en'}));
 if(corrupt){assert(shell.api.blocked);noRussian([get('platformMessage').textContent,get('platformRetry').textContent],'Startup error');assert.equal(get('platformRetry').textContent,'Retry');assert.equal(records.get('vacky_atomic_v1'),'{"version":999}');}
 else{
  shell.localStorage.setItem=()=>{throw Error('Disk unavailable');};
  shell.api.storage.transaction(()=>shell.api.storage.setItem('run','checkpoint'));
  assert(shell.api.blocked);assert(get('platformMessage').textContent.includes('Could not save the run'));
  noRussian([get('platformMessage').textContent,get('platformRetry').textContent],'Save error');
 }
}
(async()=>{await platformGate();await platformGate(true);console.log('PASS: English startup/retry/save-failure gate with original damaged data preserved');})().catch(e=>{console.error(e);process.exitCode=1;});
