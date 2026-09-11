const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const code=fs.readFileSync(path.join(__dirname,'../src/playables.js'),'utf8');
const defer=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const tick=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
function harness({cloud=true,strict=false,raw='',loadFail=false}={}){
 const trace=[],handlers={},nodes=new Map(),raf=new Map(),timers=new Map(),db=new Map();let time=0,id=0,reads=0,writes=0,loading=defer(),save=[];
 const node=k=>{if(!nodes.has(k))nodes.set(k,{hidden:false,textContent:'',focus(){}});return nodes.get(k);};
 const box={console,performance:{now:()=>time},VACKY_REQUIRE_PLAYABLES:strict,
  document:{getElementById:node,addEventListener:(k,fn)=>{handlers['input:'+k]=fn;}},
  localStorage:{getItem:k=>{reads++;return db.get(k)??null;},setItem:(k,v)=>{writes++;db.set(k,v);}},
  requestAnimationFrame:fn=>{raf.set(++id,fn);return id;},cancelAnimationFrame:id=>raf.delete(id),
  setTimeout:(fn,ms)=>{timers.set(++id,{fn,due:time+ms});return id;},clearTimeout:id=>timers.delete(id),location:{reload:()=>trace.push('reload')},
 };
 if(cloud)box.ytgame={IN_PLAYABLES_ENV:true,game:{firstFrameReady:()=>trace.push('first'),gameReady:()=>trace.push('ready'),
  loadData:()=>{trace.push('load');return loading.promise;},saveData:text=>{trace.push('save');const d=defer();save.push({text,...d});return d.promise;}},
  system:{isAudioEnabled:()=>false,onAudioEnabledChange:fn=>handlers.audio=fn,onPause:fn=>handlers.pause=fn,onResume:fn=>handlers.resume=fn}};
 box.window=box;vm.createContext(box);vm.runInContext(code,box);const P=vm.runInContext('Playables',box);
 const launch=()=>{trace.push('launch');P.requestFrame(()=>trace.push('frame'));return {initial:()=>trace.push('paint'),suspend:()=>trace.push('freeze'),resume:()=>trace.push('wake'),audio:b=>trace.push('audio:'+b)};};
 const frame=async()=>{time+=16;const jobs=[...raf.values()];raf.clear();jobs.forEach(fn=>fn(time));await tick();};
 const advance=async(ms)=>{time+=ms;for(const [id,t] of [...timers])if(t.due<=time){timers.delete(id);t.fn();}await tick();};
 return {P,box,node,trace,handlers,raf,timers,save,db,frame,advance,launch,get reads(){return reads;},get writes(){return writes;},
  resolve:v=>loading.resolve(v??raw),reject:()=>loading.reject(Error('offline')),newLoad:()=>{loading=defer();},tick};
}
(async()=>{
 let h=harness(),boot=h.P.boot(h.launch);assert(!h.trace.includes('load'));await h.frame();assert.deepEqual(h.trace,['first','load']);
 assert.throws(()=>h.P.storage.setItem('x','1'));h.resolve();await boot;assert(h.trace.indexOf('paint')<h.trace.indexOf('ready'));assert(!h.P.audioAllowed);
 assert.equal(h.reads,0);assert.equal(h.writes,0);assert(h.node('platformGate').hidden);assert.equal(h.trace.filter(x=>x==='first').length,1);
 h.handlers.audio(true);assert(h.P.audioAllowed);h.P.delay(()=>h.trace.push('timer'),100);h.handlers.pause();assert(h.P.blocked);assert.equal(h.raf.size,0);assert.equal(h.timers.size,0);
 let prevented=0;h.handlers['input:click']({target:{},preventDefault(){prevented++;},stopImmediatePropagation(){prevented++;}});assert.equal(prevented,2);
 await h.advance(5000);assert(!h.trace.includes('timer'));h.handlers.resume();await h.advance(99);assert(!h.trace.includes('timer'));await h.advance(1);assert(h.trace.includes('timer'));await h.frame();assert(h.trace.includes('frame'));assert.equal(h.trace.filter(x=>x==='ready').length,1);
 h.P.storage.setItem('profile','one');await tick();assert(h.P.blocked);assert.equal(h.save.length,1);
 h.P.storage.setItem('inventory','two');await tick();assert.equal(h.save.length,1,'Overlapping saves');h.save[0].resolve();await tick();assert.equal(h.save.length,2);
 assert.deepEqual(JSON.parse(h.save[1].text).records,{profile:'one',inventory:'two'});h.save[1].reject();await tick();assert(h.P.blocked);assert(!h.node('platformRetry').hidden);assert.equal(h.reads+h.writes,0);
 h.node('platformRetry').onclick();await tick();assert.equal(h.save[2].text,h.save[1].text);h.save[2].resolve();await tick();assert(!h.P.blocked);
 console.log('PASS: load-before-save, first frame before ready, zero browser storage in YouTube, serialized save/retry, pause freezes frames/timers/input, mute');
 h=harness();boot=h.P.boot(h.launch);await h.frame();h.reject();await boot;assert(!h.trace.includes('launch'));assert(!h.trace.includes('ready'));assert.equal(h.save.length,0);
 h.newLoad();h.node('platformRetry').onclick();await tick();h.resolve();await tick();assert.equal(h.trace.filter(x=>x==='first').length,1);assert(h.trace.includes('ready'));
 for(const raw of ['broken','{"version":99}',JSON.stringify({format:'vacky-playables',version:1,records:{vacky_dragon_home_v2:'bad'}})]){
  h=harness({raw});boot=h.P.boot(h.launch);await h.frame();h.resolve();await boot;assert(!h.trace.includes('launch'));assert.equal(h.save.length,0);
 }
 h=harness();boot=h.P.boot(h.launch);await h.frame();h.handlers.pause();h.resolve();await tick();assert(!h.trace.includes('launch'));h.handlers.resume();await boot;assert(h.trace.includes('ready'));
 console.log('PASS: failed/corrupt/newer cloud data never overwritten, load retry, pause during loading defers game initialization');
 h=harness({cloud:false});await h.P.boot(h.launch);h.P.storage.setItem('local','yes');assert.equal(h.db.get('local'),'yes');assert(!h.trace.includes('first'));assert(!h.trace.includes('save'));
 h=harness({cloud:false,strict:true});await h.P.boot(h.launch);assert(!h.trace.includes('launch'));assert.equal(h.reads+h.writes,0);
 h=harness({cloud:false});await h.P.boot(()=>({initial(){h.P.requestFrame(()=>{});throw Error('paint failed');}}));assert(h.P.blocked);assert.equal(h.raf.size,0);assert(!h.node('platformGate').hidden);h.node('platformRetry').onclick();assert(h.trace.includes('reload'));
 console.log('PASS: GitHub/local fallback, strict YouTube package refusing non-Playables environment, failed first paint blocks input and frames');
})().catch(e=>{console.error(e);process.exitCode=1;});
