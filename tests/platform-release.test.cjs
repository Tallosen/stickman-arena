const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=name=>fs.readFileSync(path.join(__dirname,'../src',name+'.js'),'utf8');
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const tick=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
function make({init=Promise.resolve(),load=Promise.resolve(['']),supported=true,qa=false}={}){
 let time=0,serial=0,launches=0,reads=0,writes=0,requests=0,mode='open';
 const raf=new Map(),timers=new Map(),nodes=new Map(),handlers={},inputs={},windowKeys={},sounds=[];
 const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,textContent:''});return nodes.get(id);};
 const on=(event,fn)=>(handlers[event]??=[]).push(fn),emit=(event,value)=>(handlers[event]||[]).forEach(fn=>fn(value));
 const bridge={initialize:()=>init,EVENT_NAME:{PAUSE_STATE_CHANGED:'pause',AUDIO_STATE_CHANGED:'audio',INTERSTITIAL_STATE_CHANGED:'ad'},
  platform:{id:'playgama',language:'en',isAudioEnabled:true,isPaused:false,on,sendMessage:()=>Promise.resolve()},
  storage:{get:()=>{reads++;return load;},set:()=>{writes++;return Promise.resolve();}},
  advertisement:{isInterstitialSupported:supported,interstitialState:'closed',rewardedState:'closed',on,
   showInterstitial:placement=>{assert.equal(placement,'run_result');requests++;if(mode==='throw')throw Error('ad unavailable');if(mode==='open'){bridge.advertisement.interstitialState='loading';emit('ad','loading');}}
  }
 };
 const box={bridge,console,VACKY_REQUIRE_PLAYGAMA:true,VACKY_DEV:qa,performance:{now:()=>time},
  requestAnimationFrame:fn=>{raf.set(++serial,fn);return serial;},cancelAnimationFrame:id=>raf.delete(id),
  setTimeout:(fn,ms)=>{timers.set(++serial,{fn,due:time+ms});return serial;},clearTimeout:id=>timers.delete(id),
  addEventListener:(type,fn)=>(windowKeys[type]??=[]).push(fn),
  document:{getElementById:node,addEventListener:(type,fn)=>(inputs[type]??=[]).push(fn)},
  localStorage:{getItem(){throw Error('Cloud must never use browser storage');},setItem(){throw Error('Cloud must never write browser storage');}},
  location:{reload(){throw Error('Unexpected reload');}}
 };
 box.window=box;vm.createContext(box);vm.runInContext(source('playgama-adapter')+'\n'+source('playables'),box);
 const P=vm.runInContext('Playables',box);
 const frame=async()=>{time+=16;const jobs=[...raf.values()];raf.clear();jobs.forEach(fn=>fn(time));await tick();};
 const advance=async ms=>{time+=ms;for(const [id,timer] of [...timers])if(timer.due<=time){timers.delete(id);timer.fn();}await tick();};
 return {P,bridge,box,node,emit,windowKeys,inputs,sounds,frame,advance,
  boot:()=>P.boot(()=>{launches++;return {initial(){},suspend(){},resume(){},audio:value=>sounds.push(value)};}),
  ad:state=>{bridge.advertisement.interstitialState=state;emit('ad',state);},mode:value=>mode=value,
  get launches(){return launches;},get reads(){return reads;},get writes(){return writes;},get requests(){return requests;}};
}
async function boot(h){const promise=h.boot();await tick();await h.frame();await promise;assert.equal(h.launches,1);assert(!h.P.blocked);}
(async()=>{
 const delayedInit=deferred(),h=make({init:delayedInit.promise});const first=h.boot();await h.advance(15000);await first;
 assert(h.P.blocked);assert.equal(h.launches,0);assert.equal(h.reads,0);assert(!h.node('platformRetry').hidden);
 delayedInit.resolve();await tick();assert.equal(h.launches,0,'Expired initialization cannot start a late game');
 h.bridge.initialize=()=>Promise.resolve();await boot(h);assert.equal(h.writes,0);
 const delayedLoad=deferred(),l=make({load:delayedLoad.promise});const loading=l.boot();await tick();await l.frame();await l.advance(15000);await loading;
 assert.equal(l.launches,0);assert.equal(l.writes,0);assert(!l.node('platformRetry').hidden);
 l.bridge.storage.get=()=>Promise.resolve([JSON.stringify({format:'vacky-playables',version:1,records:{kept:'new'}})]);
 await boot(l);delayedLoad.resolve([JSON.stringify({format:'vacky-playables',version:1,records:{kept:'stale'}})]);await tick();
 assert.equal(l.P.storage.getItem('kept'),'new','Late expired load must not replace the successful retry');
 const bad=make({load:Promise.resolve(['broken'])});const failed=bad.boot();await tick();await bad.frame();await failed;assert.equal(bad.launches,0);assert.equal(bad.writes,0);
 let prevented=0,stopped=0;
 const event={key:'Escape',code:'Escape',preventDefault(){prevented++;},stopImmediatePropagation(){stopped++;}};
 bad.windowKeys.keydown[0](event);assert.equal(stopped,1);assert.equal(prevented,0,'Fullscreen default is retained even before launch');
 const a=make();await boot(a);let continued=0;
 assert(a.P.requestInterstitial('run_result',()=>continued++));assert(a.P.blocked);assert(!a.P.audioAllowed);assert.equal(continued,0);
 assert(!a.P.requestInterstitial('run_result',()=>continued++));assert.equal(a.requests,1);
 a.emit('pause',true);a.ad('opened');a.ad('closed');assert.equal(continued,0,'Closing an ad cannot undo host pause');
 a.emit('audio',false);a.emit('pause',false);assert.equal(continued,1);assert(!a.P.blocked);assert(!a.P.audioAllowed,'Host mute survives ad close');
 a.ad('closed');assert.equal(continued,1);a.mode('skip');a.P.requestInterstitial('run_result',()=>continued++);assert.equal(continued,2);
 a.mode('throw');a.P.requestInterstitial('run_result',()=>continued++);assert.equal(continued,3);assert(!a.P.blocked);
 a.mode('open');a.P.requestInterstitial('run_result',()=>continued++);a.ad('failed');assert.equal(continued,4);assert(!a.P.blocked);
 const save=deferred();a.bridge.storage.set=()=>save.promise;a.P.storage.setItem('kept','saved');await tick();assert(a.P.savePending);
 assert(!a.P.requestInterstitial('run_result'));save.resolve();await tick();assert(!a.P.savePending);assert(!a.P.blocked);
 for(const options of [{supported:false},{qa:true}]){const q=make(options);await boot(q);let done=0;q.P.requestInterstitial('run_result',()=>done++);assert.equal(done,1);assert.equal(q.requests,0);}
 console.log('PASS: init/load deadlines and safe late-response retry; no corrupt-save overwrite; browser Escape; ad close/fail/skip/host pause and mute; no QA ads; savePending acknowledgement');
})().catch(error=>{console.error(error);process.exitCode=1;});
