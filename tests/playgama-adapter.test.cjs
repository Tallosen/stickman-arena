const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const code=fs.readFileSync(path.join(__dirname,'../src/playgama-adapter.js'),'utf8');
const defer=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
(async()=>{
 let init=defer(),reads=0,writes=0,raw=null,events={},paused=0,resumed=0,audio=null;
 const platform={id:'playgama',language:'en',isAudioEnabled:false,isPaused:true,on:(key,fn)=>(events[key]??=[]).push(fn),sendMessage:async key=>assert.equal(key,'game_ready')};
 const box={bridge:{initialize:()=>init.promise,platform,EVENT_NAME:{PAUSE_STATE_CHANGED:'pause',AUDIO_STATE_CHANGED:'audio'},storage:{
   get:async keys=>{reads++;assert.equal(keys[0],'vacky_profile_v1');return [raw];},
   set:async(keys,values)=>{writes++;assert.equal(keys[0],'vacky_profile_v1');raw=values[0];}
 }}};vm.createContext(box);vm.runInContext(code,box);
 const pending=vm.runInContext('createPlaygamaAdapter()',box);assert.equal(reads+writes,0);init.resolve();const adapter=await pending;
 assert.equal(adapter.language,'en');assert.equal(adapter.system.isAudioEnabled(),false);
 adapter.system.onPause(()=>paused++);adapter.system.onResume(()=>resumed++);adapter.system.onAudioEnabledChange(v=>audio=v);
 assert.equal(paused,1);events.pause.forEach(fn=>fn(false));assert.equal(resumed,1);events.audio[0](true);assert.equal(audio,true);
 assert.equal(await adapter.game.loadData(),'');await adapter.game.saveData('{"safe":1}');assert.equal(await adapter.game.loadData(),'{"safe":1}');
 raw={format:'vacky-playables',version:1,records:{}};assert.equal(JSON.parse(await adapter.game.loadData()).version,1);
 box.bridge.storage.get=async()=>{throw Error('offline')};await assert.rejects(adapter.game.loadData(),/offline/);
 box.bridge.storage.set=async()=>{throw Error('offline')};await assert.rejects(adapter.game.saveData('next'),/offline/);
 platform.id='mock';await assert.rejects(vm.runInContext('createPlaygamaAdapter()',box),/QA Tool/);
 init=defer();const failed=vm.runInContext('createPlaygamaAdapter()',box);init.reject(Error('init failed'));await assert.rejects(failed,/init failed/);
 console.log('PASS: Bridge v2 initialization gate, array storage API, initial mute/pause, callbacks, save/load failures, mock rejection');
})().catch(e=>{console.error(e);process.exitCode=1;});
