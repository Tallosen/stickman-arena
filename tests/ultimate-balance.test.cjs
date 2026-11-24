const assert=require('assert'),fs=require('fs'),path=require('path');
const h=require('./arena-harness.cjs')();h.box.assert=assert;
h.run(`
function encounter(stage,gun=3,weapon='basic'){
 reset();running=true;paused=false;props=[];P.gear.gun=gun;P.wtype=weapon;P.lvl=30;Object.assign(P,weaponStats(weapon));
 enterRunStage(stage);const e=stageBoss.enemy;e.x=P.x+70;e.y=P.y;e.kind='elite';return e;
}
const report=[];
for(const stage of [5,10,15,20])for(const weapon of ['basic','shotgun','sniper','minigun']){
 const e=encounter(stage,3,weapon);ult.charge=ULT_FULL;ult.forceMode='cross';startUlt();
 for(let i=0;i<120;i++)updateUlt(20);
 const fraction=(e.maxhp-e.hp)/e.maxhp;
 assert(fraction>=.099&&fraction<=.14001,'Ordinary ultimate outside budget');
 report.push({stage,weapon,damage:Math.round(fraction*1000)/10});
 const hp=e.hp;hit(e,1e8,P.x,P.y);assert(Math.abs(hp-e.hp-e.maxhp*(stage>=15?.025:.055))<1e-7,'Ordinary shots bypassed cap');
}
// Every old cinematic and all its projectiles share a per-cast boss budget.
for(const mode of [...ULT_MODES,...SNIPER_ULT_MODES]){
 const e=encounter(20);ult.charge=ULT_FULL;ult.forceMode=mode;startUlt();
 for(let i=0;i<360;i++){updateUlt(20);updateHeroProjectiles(20,20/16.67);}
 assert(e.hp>=e.maxhp*.86-1e-6,mode+' exceeded cast cap');
 assert(e.hp<e.maxhp,mode+' did no damage to nearby boss');
}
for(const weapon of ['basic','shotgun','sniper','minigun']){
 const e=encounter(20,4,weapon);ult.charge=ULT_FULL;startUlt();assert.equal(ult.mode,'dragonburst');
 const type=ult.dragonType;for(let i=0;i<121;i++)updateUlt(20);
 assert(!ult.on);assert(dragonAssist?.ultimate);assert.strictEqual(dragonAssist.type,type);
 assert(Math.abs(e.hp/e.maxhp-.86)<1e-6);
 const charge=ult.charge;startUlt();assert.equal(ult.charge,charge,'Uncharged trigger spent state');
 paused=true;updateBossEncounter(2000);assert.equal(dragonAssist.age,0);paused=false;
 for(let i=0;i<62;i++)updateBossEncounter(100);
 assert.equal(dragonAssist,null);assert(Math.abs(e.hp/e.maxhp-.80)<1e-6,'Alliance should deal 20% total outside vulnerability');
 assert(!P.runWon);
}
// Vulnerability is useful but cannot exceed 18% + three 2% ally pulses.
let late=encounter(20);ult.charge=ULT_FULL;startUlt();const cast=ult.cast;
hitUlt(late,1e6,P.x,P.y,cast);const after=late.hp;ult.on=false;ult.charge=ULT_FULL;startUlt();
shots=[{x:late.x-10,y:late.y,vx:10,vy:0,life:100,dmg:1e6,a:0,kind:'sniper',hit:[],pierce:1,ultCast:cast}];
updateHeroProjectiles(16.67,1);assert.equal(late.hp,after,'Late projectile gained a fresh cast budget');
let e=encounter(20,4);e.vulnerableT=1e6;ult.charge=ULT_FULL;startUlt();for(let i=0;i<121;i++)updateUlt(20);
assert(Math.abs(e.hp/e.maxhp-.82)<1e-6);updateBossEncounter(6200);assert(e.hp>=e.maxhp*.76-1e-6);
e.hp=1;startUltDragonAssist(DRAGON_TYPES[0],100);updateBossEncounter(4400);assert.equal(e.hp,1);assert(!e.rewarded);
reset();assert.equal(dragonAssist,null);assert.equal(ult.cast,null);
running=true;paused=false;P.stage=12;P.gear.gun=4;startDragonAssist(true);const old=dragonAssist;
assert(startUltDragonAssist(DRAGON_TYPES[1],100));assert.notEqual(dragonAssist,old);
updateBossEncounter(6200);assert.equal(dragonAssist,null,'Empty arena must expire the ally');
console.log('ULT BALANCE',JSON.stringify(report));
`);
// Actual Canvas rendering, not a browser screenshot. Check draw functions are pure.
const v=require('./arena-harness.cjs')({native:true,width:900,height:620});
v.run("reset();running=true;paused=false;props=[];P.gear.gun=4;P.x=430;P.y=380;ult.charge=ULT_FULL;startUlt();updateUlt(700);");
const dir=path.join(__dirname,'..','audit');fs.mkdirSync(dir,{recursive:true});
for(const phase of ['charge','breath']){
 if(phase==='breath')v.run('startUltDragonAssist(DRAGON_TYPES[1],100);dragonAssist.age=1800;dragonAssist.breathAt=1700;dragonAssist.x=610;dragonAssist.y=420;');
 const before=v.run('JSON.stringify({P,dragonAssist})');
 v.run("ctx.fillStyle='#eee5d1';ctx.fillRect(0,0,900,620);drawUltMotionFX(ctx);drawHero(ctx,P.x,P.y+17,P.face,0,{...P.gear,_w:P.wtype},1.42,P.aim,0,ultPose(),1.55);drawDragonAssist(ctx);");
 assert.equal(v.run('JSON.stringify({P,dragonAssist})'),before);
 fs.writeFileSync(path.join(dir,'ultimate-v0162-'+phase+'.png'),v.canvas.toBuffer('image/png'));
}
console.log('PASS: ultimate scaling, cast caps, every cinematic, four weapons, ally duration/pause/cleanup/nonlethal damage and native render');
