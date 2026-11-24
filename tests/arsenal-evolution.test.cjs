const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),make=require('./arena-harness.cjs');
const root=path.join(__dirname,'..'),h=make();h.box.assert=assert;
h.run(fs.readFileSync(path.join(root,'src/camp-progress.js'),'utf8'));
h.run(`
reset();running=true;props=[];
assert.deepEqual(ARSENAL_BRANCHES,['basic','shotgun','sniper','laser']);
for(const w of ARSENAL_BRANCHES){let last=0;
 for(let L=0;L<=4;L++){
  reset();P.wtype=w;P.gear.gun=L;applyGear();const stats=weaponStats(w),dps=stats.damage*stats.pellets*1000/stats.rate;
  assert(dps>last,'Every form improves DPS');last=dps;
  assert(weaponFormName(w,L));enemies=[{x:P.x+160,y:P.y,r:12,hp:1e9}];shotT=0;updateHeroFire(0);
  const beam=w==='laser'&&L===4;const hand=shots.filter(s=>s.source==='hand');assert.equal(hand.length,beam?0:stats.pellets);assert.equal(!!P.laserBeam,beam);assert(hand.every(s=>s.kind===weaponShotKind(w,L)));
  assert(hand.every(s=>Number.isFinite(s.x+s.y+s.vx+s.vy)));
  if(w==='sniper'&&L<2)assert(hand.every(s=>!s.pierce&&!s.crit));
  if(w==='laser')assert(hand.every(s=>Boolean(s.pierce)===(L>=3)));
 }
}
// New laser pierces at most two enemies, never reapplies damage to one target.
reset();P.wtype='laser';P.gear.gun=4;applyGear();shots=[];P.x=1000;P.y=1000;
enemies=[10,20,30].map(x=>({x:1000+x,y:1000,r:1,hp:100}));const oldHit=hit;hit=(e,d)=>{e.hp-=d;};
makeHeroShot({x:1000,y:1000},0,10,'laser',{source:'hand'});updateHeroProjectiles(34,2);hit=oldHit;
assert.deepEqual(enemies.map(e=>e.hp),[90,90,100]);assert.equal(shots.length,0);
// Old unlocked minigun preference migrates to the energy path, preserving achievements.
const veteran={...blankCamp(),weapon:'minigun',kills:777,bosses:4,stage:20,wins:2,shotgunStage:10,clean:1,bossTypes:[...CAMP_BOSSES],trialWins:{rush:true},style:'ember'};
let writes=0;localStorage.getItem=()=>JSON.stringify(veteran);localStorage.setItem=()=>writes++;
campProfile=loadCamp();assert.equal(writes,0);assert.equal(campProfile.weapon,'laser');assert.equal(campProfile.kills,777);assert.equal(campProfile.wins,2);
for(const w of ARSENAL_BRANCHES){assert(campChoose('weapon',w));reset();assert.equal(P.wtype,w);assert.equal(P.gear.gun,0);}
for(const s of CAMP_STYLES)assert(campStyleOpen(s));
const fresh=blankCamp();assert(!campStyleOpen('royal',fresh));assert(!campWeaponOpen('laser',fresh));
// A cosmetic preference cannot alter combat stats.
const before=JSON.stringify(heroGearStats());for(const style of CAMP_STYLES){P.campStyle=style;assert.equal(JSON.stringify(heroGearStats()),before);}
`);
const v=make({native:true,width:1000,height:630});v.run(fs.readFileSync(path.join(root,'src/camp-progress.js'),'utf8'));
v.run(`ctx.fillStyle=PAPER;ctx.fillRect(0,0,W,H);ctx.vackyStableSketch=true;
for(let row=0;row<4;row++)for(let lv=0;lv<=4;lv++){
 const w=ARSENAL_BRANCHES[row],x=24+lv*200,y=50+row*150;
 ctx.save();ctx.translate(x,y);ctx.scale(2.2,2.2);drawGunModel(ctx,lv,0,w);ctx.restore();
 ctx.fillStyle=INK;ctx.font='12px system-ui';ctx.textAlign='left';ctx.fillText((lv+1)+' · '+weaponFormName(w,lv),x,y+55,180);
}`);
if(process.argv.includes('--frames'))fs.writeFileSync(path.join(root,'audit/arsenal-evolution-v0197.png'),v.canvas.toBuffer('image/png'));
const c=make({native:true,width:960,height:380});c.run(fs.readFileSync(path.join(root,'src/camp-progress.js'),'utf8'));
c.run(`ctx.fillStyle=PAPER;ctx.fillRect(0,0,W,H);ctx.vackyStableSketch=true;
for(let i=0;i<CAMP_STYLES.length;i++){const style=CAMP_STYLES[i],x=80+i*160;drawHero(ctx,x,310,-1,0,{helm:3,boots:2,cape:3,gun:0,_holstered:true,_campStyle:style},3,Math.PI,0,{yaw:2.8,headYaw:2.8});ctx.fillStyle=INK;ctx.font='14px system-ui';ctx.textAlign='center';ctx.fillText(style,x,350);}`);
if(process.argv.includes('--frames'))fs.writeFileSync(path.join(root,'audit/arsenal-capes-v0197.png'),c.canvas.toBuffer('image/png'));
// Animate actual panel canvas without changing a run or the profile.
const p=make({native:true,width:520,height:230});p.run(fs.readFileSync(path.join(root,'src/camp-progress.js'),'utf8'));p.run(fs.readFileSync(path.join(root,'src/camp-ui.js'),'utf8'));
const get=p.box.document.getElementById;p.box.document.getElementById=id=>id==='arsenalPreview'?p.canvas:get(id);
p.run(`campPanelActive=true;campActiveSection='campEquipment';campProfile.weapon='laser';campProfile.style='royal';arsenalPreviewLevel=4;`);
const snapshot=p.run('JSON.stringify({P,campProfile,inventory,ult})');p.run('drawArsenalPreview(1000,true);drawArsenalPreview(1300,true);');
assert.equal(p.run('JSON.stringify({P,campProfile,inventory,ult})'),snapshot);
if(process.argv.includes('--frames'))fs.writeFileSync(path.join(root,'audit/arsenal-preview-v0197.png'),p.canvas.toBuffer('image/png'));
console.log('PASS: 20 forms, monotonic upgrades, real arrow/laser shots, pierce cap, legacy migration, locked starters, cosmetic-only styles and pure preview');
