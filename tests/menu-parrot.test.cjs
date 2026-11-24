const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const box={assert,console};vm.createContext(box);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/menu-scene.js'),'utf8'),box);
vm.runInContext(`
let landed=0,flown=0;
for(let seed=0;seed<15;seed++){
 for(let t=0;t<160;t+=.02){
  const hero=menuHeroPose(t,seed),bird=menuParrotPose(t,seed,hero),next=menuParrotPose(t+.001,seed);
  assert(Number.isFinite(bird.x)&&Number.isFinite(bird.y));
  assert(Math.abs(bird.x-next.x)<.6&&Math.abs(bird.y+bird.bob-next.y-next.bob)<.6,'Flight teleports');
  assert(bird.perch>=0&&bird.perch<=1);
  if(bird.front&&!bird.moving){
   assert.equal(bird.perch,1,'Wings not folded after landing');
   landed++;assert.equal(hero.depth,0);assert.equal(hero.activity,'watchBird');
   assert(Math.abs(bird.x-menuShoulderPerch(hero).x)<1e-8,'Feet miss shoulder X');
   assert(Math.abs(bird.y-menuShoulderPerch(hero).y)<1e-8,'Feet miss shoulder Y');
   assert.notEqual(menuCatPose(t,seed).y,363,'Cat scene still active');
   assert(!bird.moving);assert(bird.front);
  }else if(bird.front)flown++;
 }
}
assert(landed>100&&flown>100);
const s=menuSchedule(0,1),t=s.wait+28.5,hero=menuHeroPose(t,1,{kind:'hero',start:t-1}),bird=menuParrotPose(t,1,hero);
assert(Math.abs(bird.x-menuShoulderPerch(hero).x)<1e-8,'Greeting dislodges bird');
assert(MENU_COMPANIONS.filter(p=>p.type==='parrot').length===1);
`,box);
console.log('PASS: smooth flight, folded wings, shoulder attachment, no overlap with cat story, greeting compatibility');
