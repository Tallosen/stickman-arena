const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..'),db=new Map();
let fail=false,created=0;
const buttons=Array.from({length:2},()=>({attrs:{},classes:new Set(),setAttribute(k,v){this.attrs[k]=v;},classList:{toggle(){}}}));
class AudioContext{
 constructor(){created++;this.state='suspended';this.destination={};}
 createGain(){return {gain:{value:1},connect(){}};}
 resume(){this.state='running';return Promise.resolve();}
 suspend(){this.state='suspended';return Promise.resolve();}
}
const status=[{}],box={assert,console,AudioContext,navigator:{language:'ru'},Playables:{audioAllowed:true,blocked:false,storage:{getItem:k=>db.get(k)??null,setItem(k,v){if(fail)throw Error('quota');db.set(k,v);}}},document:{documentElement:{setAttribute(){}},getElementById:()=>null,querySelectorAll:s=>s==='[data-sound]'?buttons:s==='[data-language-status]'?status:[]}};
box.window=box;vm.createContext(box);
const core=fs.readFileSync(path.join(root,'src/core.js'),'utf8');
vm.runInContext(core.slice(core.indexOf('let AC = null;'),core.indexOf('function beep(')),box);
vm.runInContext(fs.readFileSync(path.join(root,'src/language-packs.js'),'utf8'),box);vm.runInContext(fs.readFileSync(path.join(root,'src/localization.js'),'utf8'),box);
const run=s=>vm.runInContext(s,box);
run('initLocalization()');assert.equal(created,0,'No autoplay from preferences');
run('audio()');assert.equal(run('audioMaster.gain.value'),1);
buttons[0].onclick();assert.equal(db.get('vacky_sound_muted_v1'),'1');assert(buttons.every(b=>b.attrs['aria-pressed']==='true'));assert.equal(run('audioMaster.gain.value'),0);
run('platformAudio(true);audio()');assert.equal(run('audioMaster.gain.value'),0,'Host resume cannot unmute user');
box.Playables.audioAllowed=false;buttons[1].onclick();assert.equal(run('audioMaster.gain.value'),0,'User cannot unmute host');assert.equal(db.get('vacky_sound_muted_v1'),'0');
box.Playables.audioAllowed=true;run('platformAudio(true)');assert.equal(run('audioMaster.gain.value'),1);
box.Playables.blocked=true;assert.equal(run('toggleGameSound()'),false);assert.equal(db.get('vacky_sound_muted_v1'),'0');box.Playables.blocked=false;
buttons[0].onclick();assert.equal(run('loadAudioMuted()'),true);
fail=true;assert.equal(run('toggleGameSound()'),false);assert(status[0].textContent);
console.log('PASS: sound buttons sync, persisted mute, host mute dominates, no autoplay, blocked input and save failure');
