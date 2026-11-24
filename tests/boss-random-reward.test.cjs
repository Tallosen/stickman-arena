const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),make=require('./arena-harness.cjs');
const h=make();h.box.assert=assert;
h.run(`
function prep(){reset();running=true;paused=false;props=[];P.hp=1;ult.charge=0;for(const k of ABILITY_KEYS)inventory[k]=7;enterRunStage(5);stageBoss.enemy.hp=0;stageBoss.enemy.rewarded=true;updateRunProgress(0);P.x=bossLoot.x;P.y=bossLoot.y;bossLoot.age=1500;}
prep();const pool=bossRewardOptions(5,true);assert.equal(pool.length,GK.length+2+ABILITY_KEYS.length);
const random=Math.random;
for(let i=0;i<pool.length;i++){
 prep();const option=bossRewardOptions(5,true)[i],preview=bossRewardImpact(option),before=JSON.stringify({gear:P.gear,inventory,hp:P.hp,ult:ult.charge});
 Math.random=()=> (i+.5)/pool.length;
 assert(pickupBossLoot());for(let n=0;n<7;n++)updateBossLoot(100);Math.random=random;
 assert(!bossRewardPending&&!paused);assert.equal(bossLootNotices.length,1);assert.equal(bossLootNotices[0].title,option.title);assert.equal(bossLootNotices[0].impact,preview);
 assert.notEqual(JSON.stringify({gear:P.gear,inventory,hp:P.hp,ult:ult.charge}),before,'Each pool entry has an actual effect');
 const after=JSON.stringify({gear:P.gear,inventory,hp:P.hp,ult:ult.charge});assert(!pickupBossLoot());updateBossLoot(100);assert.equal(JSON.stringify({gear:P.gear,inventory,hp:P.hp,ult:ult.charge}),after);
}
prep();for(const k of GK)P.gear[k]=GEAR[k].max;applyGear();P.hp=P.hpMax;ult.charge=ULT_FULL;for(const k of ABILITY_KEYS)inventory[k]=999;
assert.equal(bossRewardOptions(5,true)[0].kind,'continue');inventory.tank=998;
const only=bossRewardOptions(5,true);assert.equal(only.length,1);assert.equal(only[0].key,'tank');
assert(pickupBossLoot());for(let n=0;n<7;n++)updateBossLoot(100);assert.equal(inventory.tank,999);assert(bossLootNotices[0].impact.includes('998 → 999'));
`);
if(process.argv.includes('--frames'))for(const [width,height] of [[390,844],[844,390],[320,640]]){
 const v=make({native:true,width,height}),ui=fs.readFileSync(path.join(__dirname,'../src/ui.js'),'utf8');
 v.run(ui.slice(ui.indexOf('const hudHeight'),ui.indexOf('function hud()'))+ui.slice(ui.indexOf('let radarNear='),ui.indexOf('const useBtn'))+';hud=()=>{drawTopHUD(ctx,W,P);radar();};');
 v.run(`reset();running=true;paused=false;props=[];P.x=1000;P.y=1000;cam.x=P.x-W/2;cam.y=P.y-H/2;P.stage=11;inventory.tank=3;
 dropBossLoot(10,{x:P.x,y:P.y,bossSpec:{color:'#507f91'}});bossLoot.reward=bossRewardOptions(20).find(o=>o.key==='tank');P.x=bossLoot.x;P.y=bossLoot.y;bossLoot.age=1500;pickupBossLoot();for(let n=0;n<7;n++)updateBossLoot(100);draw();`);
 fs.writeFileSync(path.join(__dirname,'../audit/boss-bonus-v0193-'+width+'.png'),v.canvas.toBuffer('image/png'));
}
console.log('PASS: every random bonus reachable and effective, exact receipt, one grant, no pre-final modal, capped/full pool and native HUD layouts');
