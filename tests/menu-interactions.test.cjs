const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const events={},start={classList:{contains:()=>false}},canvas={addEventListener:(k,f)=>events[k]=f};
const box={assert,document:{getElementById:id=>id==='start'?start:canvas},Playables:{blocked:false}};
vm.createContext(box);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/menu-scene.js'),'utf8'),box);
vm.runInContext(`
for(const kind of ['rack','chest'])for(let seed=0;seed<4;seed++)for(const start of [1,9,20,33,135]){
 const reaction={kind,start};
 for(let age=0;age<12;age+=.025){
  const t=start+age,p=menuHeroPose(t,seed,reaction),n=menuHeroPose(t+.001,seed,reaction);
  for(const key of ['x','y','hip','neck','depth'])assert(Math.abs(p[key]-n[key])<.5,'Jump in '+key+' '+kind+' '+age);
  for(const key of ['lf','lb','kf','kb','af','ab','head'])p[key].forEach((v,i)=>{
   assert(Number.isFinite(v));assert(Math.abs(v-n[key][i])<.6,'Jump in '+key+' '+kind+' '+age);
  });
  if(age>5.2&&age<6.5){assert.equal(p.x,kind==='rack'?330:610);assert.equal(menuPropWeight(reaction,t),1);}
 }
 for(const edge of [0,1,1.6,4.2,4.6,7,7.4,8,10.6,12]){
  const a=menuHeroPose(start+edge-1e-6,seed,reaction),b=menuHeroPose(start+edge+1e-6,seed,reaction);
  for(const key of ['x','y','lf','lb','kf','kb','af','ab','head']){
   const aa=Array.isArray(a[key])?a[key]:[a[key]],bb=Array.isArray(b[key])?b[key]:[b[key]];
   aa.forEach((v,i)=>assert(Math.abs(v-bb[i])<.002,'Boundary jump '+kind+' '+edge+' '+key));
  }
 }
 assert.deepStrictEqual(menuHeroPose(start+12,seed,reaction),menuHeroPose(start+12,seed));
}
assert.equal(menuHit(160,300,1),'rack');assert.equal(menuHit(748,390,1),'chest');
assert(menuReact('rack'));assert(!menuReact('chest'));menuSceneTime=13;assert(menuReact('chest'));
assert(!menuReact('unknown'));menuSceneTime=26;
Playables.blocked=true;assert(!menuReact('rack'));Playables.blocked=false;
let launches=0;assert(menuBeginDeparture(()=>launches++));assert(!menuReact('rack'));
assert(menuBeginDeparture(()=>launches++));assert.equal(launches,1);assert.equal(menuDeparture,null);
for(const kind of ['rack','chest'])for(const age of [2.5,6,9.5]){
 const action={kind,start:1},from=menuObjectPose(1+age,0,action),departure={kind:'depart',start:1+age,from};
 const original=JSON.stringify(from),before=menuHeroPose(1+age,0,action),after=menuHeroPose(1+age,0,departure);
 for(const key of ['x','y','lf','lb','kf','kb','af','ab','head'])assert.deepStrictEqual(before[key],after[key],'Launch snaps '+key);
 menuHeroPose(1.3+age,0,departure);assert.equal(JSON.stringify(from),original,'Departure mutates pose snapshot');
}
`,box);
console.log('PASS: prop scenes, exact endpoints, joint continuity, hit targets, double taps, platform blocking and skippable single launch');
