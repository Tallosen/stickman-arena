const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const config=fs.readFileSync(path.join(__dirname,'../src/config.js'),'utf8');
const code=config.slice(config.indexOf('const meta ='),config.indexOf('const ITEMS ='));
for(const cloud of [false,true]){
 const saved={hp:2,dmg:3,spd:1,luck:1,best:310,bestStage:5},db=new Map([['vacky_meta_v1',JSON.stringify(saved)]]),writes=[];
 const storage={getItem:k=>db.get(k)??null,setItem:(k,v)=>{writes.push([k,v]);db.set(k,v)}};
 const box={RUN_STAGES:20,P:{runMs:0,stage:1},localStorage:cloud?{getItem(){throw Error('Cloud read local')},setItem(){throw Error('Cloud wrote local')}}:storage};
 if(cloud)box.Playables={storage};
 vm.createContext(box);vm.runInContext(code,box);
 assert.equal(vm.runInContext('meta.bestStage',box),5);
 assert.equal(box.rememberRunStage(),false);assert.equal(writes.length,0);
 box.P={runMs:200000,stage:4};assert.equal(box.rememberRunStage(),false);
 box.P={runMs:500000,stage:9};assert.equal(box.rememberRunStage(),true);
 assert.equal(box.rememberRunStage(),false);assert.equal(writes.length,1);
 const result=JSON.parse(db.get('vacky_meta_v1'));assert.deepStrictEqual(result,{...saved,bestStage:9,bestClearMs:0});
 box.P={runMs:2000000,stage:999};box.rememberRunStage();assert.equal(JSON.parse(db.get('vacky_meta_v1')).bestStage,20);
 const loaded={...box,P:{runMs:0,stage:1}};vm.createContext(loaded);vm.runInContext(code,loaded);
 assert.equal(vm.runInContext('meta.bestStage',loaded),20);
}
console.log('PASS: record only after active play, monotonic/capped stages, load/save through platform storage, no perk or time-record changes');
