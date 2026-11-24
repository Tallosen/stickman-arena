const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'../src/settings-ui.js'),'utf8'),key='vacky_visual_settings_v1';
function fixture(db=new Map(),reduced=false){
 let fail=false;const box={matchMedia:()=>({matches:reduced}),Playables:{blocked:false,storage:{getItem:k=>db.get(k)??null,setItem(k,v){if(fail)throw Error('quota');db.set(k,v);}}}};
 vm.createContext(box);vm.runInContext(source,box);vm.runInContext('function refreshSettingsLabels(){} function languageMenuOpen(){return false;} settingsOwner={origin:"start"};',box);
 return {box,run:s=>vm.runInContext(s,box),fail:v=>fail=v};
}
const db=new Map(),a=fixture(db);assert.equal(a.run('visualSettings.shake'),true);
assert(a.run('toggleVisualSetting("lowFX")'));assert.equal(JSON.parse(db.get(key)).lowFX,true);
const b=fixture(db);assert.equal(b.run('visualSettings.lowFX'),true,'Reload must retain preference');
a.fail(true);assert.equal(a.run('toggleVisualSetting("shake")'),false);assert(a.run('visualSettings.shake'));assert.equal(a.run('visualSettingsError'),'save');
a.fail(false);assert(a.run('toggleVisualSetting("shake")'));assert.equal(a.run('visualSettings.shake'),false);
a.box.Playables.blocked=true;assert.equal(a.run('toggleVisualSetting("reduceFlash")'),false);
a.box.Playables.blocked=false;a.run('settingsOwner=null');assert.equal(a.run('toggleVisualSetting("reduceFlash")'),false);
for(const raw of ['{broken','{"version":2}','{"version":1,"shake":"yes"}']){
 const store=new Map([[key,raw]]),c=fixture(store);assert(c.run('visualSettingsReadOnly'));assert.equal(c.run('toggleVisualSetting("lowFX")'),false);assert.equal(store.get(key),raw);
}
const reduced=fixture(new Map(),true);assert(!reduced.run('visualSettings.shake'));assert(reduced.run('visualSettings.reduceFlash'));
// Rendering complexity drops, but it neither alters enemies nor damage/state.
const h=require('./arena-harness.cjs')();h.run('reset();running=true;paused=false;');
h.run('const visualSettings={shake:true,reduceFlash:false,lowFX:false};');
let fills=0;const noop=()=>{};
const drawCtx=new Proxy({fill(){fills++;}},{get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});h.box.fxContext=drawCtx;
const before=h.run('JSON.stringify({P,enemies,score})');
h.run('drawDragonBreath(fxContext,{x:0,y:0},{x:200,y:100},DRAGON_TYPES[0],1800,200);');const high=fills;fills=0;
h.run('visualSettings.lowFX=true;drawDragonBreath(fxContext,{x:0,y:0},{x:200,y:100},DRAGON_TYPES[0],1800,200);');assert(fills<high*.65);
assert.equal(h.run('JSON.stringify({P,enemies,score})'),before);
console.log('PASS comfort settings: persistence, rollback, corrupted/future saves preserved, hidden/blocked guards, OS defaults and lower draw cost without combat mutation');
