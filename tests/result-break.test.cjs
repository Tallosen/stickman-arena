const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes=new Map();
const node=id=>{if(!nodes.has(id)){const classes=new Set(['hidden']);nodes.set(id,{classList:{contains:name=>classes.has(name),add:name=>classes.add(name),remove:name=>classes.delete(name)},focus(){}});}return nodes.get(id);};
let requests=0,starts=0,checkpoints=0,complete;
const box={document:{getElementById:node},running:false,paused:true,userPaused:false,menuHasRun:false,pointer:{active:false},menuDeparture:null,menuScenePainted:false,
 Playables:{blocked:false,requestInterstitial(placement,fn){assert.equal(placement,'run_result');requests++;complete=fn;}},
 start(){starts++;box.running=true;node('over').classList.add('hidden');node('dragonVictory').classList.add('hidden');},
 checkpointCamp(){checkpoints++;},resetArenaEnding(){},syncMainMenu(){},console};
vm.createContext(box);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/camp-ui.js'),'utf8'),box);
node('over').classList.remove('hidden');assert(vm.runInContext("retryFinishedRun('over')",box));assert.equal(requests,1);assert.equal(starts,0);
assert(!vm.runInContext("retryFinishedRun('over')",box));assert.equal(requests,1,'Double click cannot queue two restarts');
complete();complete();assert.equal(starts,1);assert(!vm.runInContext("retryFinishedRun('over')",box));
box.running=false;node('dragonVictory').classList.remove('hidden');vm.runInContext('showCampAfterRun()',box);assert.equal(requests,2);assert.equal(checkpoints,0);
vm.runInContext('showCampAfterRun()',box);assert.equal(requests,2);complete();assert.equal(checkpoints,1);assert(!node('start').classList.contains('hidden'));assert(node('dragonVictory').classList.contains('hidden'));
vm.runInContext('showCampAfterRun()',box);assert.equal(requests,2,'Hidden result cannot request an ad');
box.Playables.blocked=true;node('over').classList.remove('hidden');assert(!vm.runInContext("retryFinishedRun('over')",box));assert.equal(requests,2);
box.Playables.blocked=false;delete box.Playables.requestInterstitial;assert(vm.runInContext("retryFinishedRun('over')",box));assert.equal(starts,2,'Local builds continue immediately');
console.log('PASS: result actions wait for ad continuation, double-click/hidden-result guards, immediate local restart');
