const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),make=require('./arena-harness.cjs');
const root=path.join(__dirname,'..'),h=make();h.box.assert=assert;
h.run(`
function prep(){reset();running=true;paused=false;props=[];P.x=1000;P.y=1000;P.stage=1;enemies=[];}
const random=Math.random;
for(const roll of [0,.329999,.33,.999]){
 prep();let calls=0;Math.random=()=>{calls++;return roll;};updateWeaponDelivery(16);const n=calls;assert.equal(weaponDelivery.eligible,roll<.33);
 for(let i=0;i<100;i++)updateWeaponDelivery(16);assert.equal(calls,n,'No retry of chance or cargo roll');Math.random=random;
 if(roll>=.33){P.stage=19;updateWeaponDelivery(1000);assert.equal(weaponDelivery.state,'waiting');}
}
for(const w of DROP_WEAPONS){
 prep();P.gear.gun=4;P.gear.clip=3;applyGear();const pack=P.backpackDamage,lvl=P.lvl,xp=P.xp,ultDamage=ultBaseDamage();
 assert(launchWeaponDelivery(w));assert(!launchWeaponDelivery(w));const d=weaponDelivery;assert(petPathClear(P.x,P.y,d.x,d.y,32));
 P.x=d.x;P.y=d.y;assert(!collectWeaponDelivery());paused=true;updateWeaponDelivery(1000);assert.equal(d.age,0);paused=false;
 for(let i=0;i<7;i++)updateWeaponDelivery(1000);assert.equal(d.state,'collected');assert.equal(P.wtype,w);assert.equal(P.gear.gun,0);assert.equal(P.lvl,lvl);assert.equal(P.xp,xp);assert.equal(P.backpackDamage,pack);assert.equal(ultBaseDamage(),ultDamage);
 assert(!collectWeaponDelivery());assert(!upgradeableGear('gun'));assert(!bossRewardOptions(5,true).some(o=>o.key==='gun'));
 for(let i=0;i<300;i++)updateWeaponDelivery(1000);assert.equal(P.gear.gun,0,'No AFK mastery');
 enemies=[{x:P.x+150,y:P.y,hp:1e9,r:12}];
 for(let L=1;L<=4;L++){for(let i=0;i<74;i++)updateWeaponDelivery(1000);assert.equal(P.gear.gun,L-1);updateWeaponDelivery(1000);assert.equal(P.gear.gun,L);}
 assert.equal(P.dropWeaponMs,300000);for(let i=0;i<200;i++)updateWeaponDelivery(1000);assert.equal(P.dropWeaponMs,300000);assert(!launchWeaponDelivery(w));
 for(const k of GK)if(k!=='gun')P.gear[k]=GEAR[k].max;P.gear.gun=0;P.pet={lvl:PET_MAX};assert(heroBuildComplete(),'Timed gun must not create an empty XP offer');
}
prep();weaponDelivery.rolled=true;weaponDelivery.eligible=true;weaponDelivery.stage=6;weaponDelivery.weapon='minigun';P.stage=5;updateWeaponDelivery(16);assert.equal(weaponDelivery.state,'waiting');P.stage=6;updateWeaponDelivery(16);assert.equal(weaponDelivery.state,'flying');
prep();assert.equal(P.dropWeapon,null);assert.equal(weaponDelivery.rolled,false);assert.equal(P.laserBeam,null);
// A continuous beam has no projectile gaps and identical sustained DPS at both frame rates.
let values=[];const oldHit=hit;hit=(e,d)=>{e.hp-=d;};
for(const dt of [16,33]){
 prep();P.wtype='laser';P.gear.gun=4;applyGear();enemies=[{x:P.x+210,y:P.y,r:15,hp:10000}];const target=enemies[0];
 for(let ms=0;ms<10000;ms+=dt){updateHeroFire(Math.min(dt,10000-ms));assert(P.laserBeam);assert.equal(shots.length,0);}
 const actual=10000-target.hp,expected=P.damage*1000/P.fireRate*10;assert(Math.abs(actual-expected)<.00001);values.push(actual);
 enemies=[];updateHeroFire(16);assert.equal(P.laserBeam,null);
}
assert(Math.abs(values[0]-values[1])<.00001);
prep();P.wtype='laser';P.gear.gun=4;applyGear();P.aim=0;const o=heroGunTip();enemies=[100,160,220].map(dx=>({x:o.x+dx,y:o.y,r:5,hp:100}));updateLaserBeam(100,enemies[0]);assert(enemies[0].hp<100&&enemies[1].hp<100);assert.equal(enemies[2].hp,100);
ult.on=true;updateHeroFire(16);assert.equal(P.laserBeam,null);hit=oldHit;
prep();P.laserBeam={x:1,y:2,ex:3,ey:4};dropBossLoot(20,{x:P.x,y:P.y});assert.equal(P.laserBeam,null,'No stale beam during final trophy recovery');
// Compare same gear and hero level: pickup is useful immediately, mastery still matters.
prep();const dps=s=>s.damage*s.pellets*1000/s.rate;
for(const [rare,normal] of [['minigun','basic'],['dropShotgun','shotgun'],['goldSniper','sniper']]){
 const start=weaponStats(rare,{gun:0,clip:0,scope:0},1),top=weaponStats(rare,{gun:4,clip:0,scope:0},1),regular=weaponStats(normal,{gun:4,clip:0,scope:0},1);
 assert(dps(start)>dps(regular),'Drop starts above completed matching standard branch');
 assert(dps(top)>dps(start)*1.7&&dps(top)<dps(start)*2.7,'Mastery provides meaningful but bounded growth');
}
`);
const cards=fs.readFileSync(path.join(root,'src/cards.js'),'utf8');assert(!cards.includes('Math.random() < RARE_CHANCE'));assert(!cards.includes('Math.random() < GOLD_WEAPON_CHANCE'));
const v=make({native:true,width:900,height:600});v.run(`reset();running=true;paused=false;props=[];P.x=1000;P.y=1000;P.gear.helm=4;P.gear.gun=4;P.wtype='laser';applyGear();enemies=[{x:1230,y:1000,r:15,hp:1000,kind:'basic',phase:0,face:-1}];updateHeroFire(16);cam.x=P.x-W/2;cam.y=P.y-H/2;launchWeaponDelivery('goldSniper');weaponDelivery.age=3600;draw();`);
if(process.argv.includes('--frames'))fs.writeFileSync(path.join(root,'audit/airdrop-beam-v0196.png'),v.canvas.toBuffer('image/png'));
const art=make({native:true,width:1000,height:650});
art.run(`ctx.fillStyle=PAPER;ctx.fillRect(0,0,W,H);ctx.vackyStableSketch=true;
for(const [row,w] of ['sniper',...DROP_WEAPONS].entries())for(let lv=0;lv<5;lv++){
 const x=20+lv*200,y=60+row*155;ctx.save();ctx.translate(x,y);ctx.scale(2.2,2.2);drawGunModel(ctx,lv,0,w);ctx.restore();
 ctx.fillStyle=INK;ctx.font='12px system-ui';ctx.textAlign='left';ctx.fillText((lv+1)+' · '+weaponFormName(w,lv),x,y+57,184);
}`);
if(process.argv.includes('--frames'))fs.writeFileSync(path.join(root,'audit/airdrop-weapons-v0196.png'),art.canvas.toBuffer('image/png'));
const table=h.run(`DROP_WEAPONS.map(w=>({weapon:w,start:weaponStats(w,{gun:0,clip:0,scope:0},1),max:weaponStats(w,{gun:4,clip:0,scope:0},1)}))`);
if(process.argv.includes('--frames'))fs.writeFileSync(path.join(root,'audit/airdrop-balance-v0196.json'),JSON.stringify({upgradeCombatSeconds:300,probability:.33,stages:[6,7,8,9],weapons:table,scope:'Analytical weapon stats, not a live player balance test'},null,2));
console.log('PASS: exact 33% boundary, one roll/delivery, reachable crate, pause/flight/duplicate guards, preserved XP/pods/ult, 300s combat mastery, no AFK, continuous frame-rate-independent beam and two-target cap');
