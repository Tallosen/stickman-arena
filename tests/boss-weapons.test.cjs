const assert=require('assert'),h=require('./arena-harness.cjs')({native:true,width:500,height:340});h.box.assert=assert;h.box.pausedFrame=()=>h.frame(100);
h.run(`
reset();running=true;props=[];enterRunStage(20);const e=stageBoss.enemy;e.x=250;e.y=200;
const realDrawGun=drawGunModel;let paintedTip=null,paintedType=null;
drawGunModel=function(g,lv,muzzle,type){
 const m=g.getTransform(),tip=gunMuzzlePoint(type,lv);paintedTip={x:m.a*tip.x+m.c*tip.y+m.e,y:m.b*tip.x+m.d*tip.y+m.f};paintedType=type;
 realDrawGun(g,lv,muzzle,type);
};
for(const id of ['gunner','hunter'])for(const face of [-1,1])for(const angle of [-2.7,-1.1,.35,2])for(const phase of [0,3])for(const flinch of [0,.5,1])for(const recoil of [0,.5,1]){
 e.bossSpec={...e.bossSpec,...BOSS_ARCHETYPES.find(a=>a.id===id)};Object.assign(e,{face,phase,flinch,bossRecoil:recoil,bossMuzzle:50,bossShotAngle:angle,attackState:'shootwindup'});
 const p=bossWeaponPose(e);paintedTip=null;
 drawFoe(ctx,e.x,e.y+13*e.r/11,face,phase,e.r/11,e.bossSpec.color,'elite',0,flinch,e);
 assert.equal(paintedType,p.type);assert(Math.hypot(p.muzzle.x-paintedTip.x,p.muzzle.y-paintedTip.y)<.0001,'painted barrel and gameplay muzzle match: '+JSON.stringify({calculated:p.muzzle,paintedTip}));
 bossProjectiles=[];e.bossShotKind=id==='gunner'?'fan':'aimed';fireBossVolley(e);const firedPose=bossWeaponPose(e);
 assert.equal(bossProjectiles.length,id==='gunner'?8:1);
 assert(bossProjectiles.every(b=>b.kind===(id==='gunner'?'pellet':'sniper')&&b.r===3));
 assert(bossProjectiles.every(b=>Math.hypot(b.x-firedPose.muzzle.x,b.y-firedPose.muzzle.y)<1e-8));
 if(id==='hunter')assert(Math.abs(Math.atan2(bossProjectiles[0].vy,bossProjectiles[0].vx)-angle)<1e-8);
}
drawGunModel=realDrawGun;
for(const id of ['gunner','hunter']){
 e.bossSpec={...e.bossSpec,...BOSS_ARCHETYPES.find(a=>a.id===id)};e.attackState='chase';e.attackCd=0;e.bossMuzzle=0;e.bossRecoil=0;e.bossCycle=0;
 bossProjectiles=[];bossMovementIntent(e,e.x+250,e.y,16);const aim=e.bossShotAngle,delay=e.attackT;
 bossMovementIntent(e,e.x-250,e.y-200,delay-1);assert.equal(bossProjectiles.length,0);assert.equal(e.bossShotAngle,aim);
  bossMovementIntent(e,e.x-250,e.y-200,1);assert(bossProjectiles.length);assert(e.bossMuzzle>0&&e.bossRecoil>0);
  assert(bossProjectiles.every(b=>Math.hypot(b.x-bossWeaponPose(e).muzzle.x,b.y-bossWeaponPose(e).muzzle.y)<.0001),'shot pose must survive the windup-to-recovery transition');
 const pose=bossWeaponPose(e);bossProjectiles=[];
 props=[{x:(pose.origin.x+pose.muzzle.x)/2,y:(pose.origin.y+pose.muzzle.y)/2,r:8}];fireBossVolley(e);assert.equal(bossProjectiles.length,0,'barrel cannot protrude through cover to fire');props=[];
 paused=true;const flash=e.bossMuzzle;pausedFrame();assert.equal(e.bossMuzzle,flash);paused=false;
}
for(const archetype of BOSS_ARCHETYPES){
 if(archetype.id==='bruiser')assert(archetype.attacks.every(a=>a==='dash'||a==='slam'));
 if(archetype.id==='hunter')assert(archetype.attacks.every(a=>a==='aimed'||a==='dash'));
 if(archetype.id==='gunner')assert(archetype.attacks.every(a=>a==='fan'||a==='aimed'));
}
e.bossSpec={...e.bossSpec,...BOSS_ARCHETYPES.find(a=>a.id==='shaman')};e.bossShotKind='ring';e.bossShotFrom={x:e.x,y:e.y-20};bossProjectiles=[];fireBossVolley(e);assert.equal(bossProjectiles.length,16);assert(bossProjectiles.every(b=>b.kind==='arcane'));
e.bossSpec={...e.bossSpec,...BOSS_ARCHETYPES.find(a=>a.id==='bruiser')};bossProjectiles=[];fireBossVolley(e);assert.equal(bossProjectiles.length,0);
console.log('PASS: actual painted barrel matches firing origin across facing/aim/sway/flinch/recoil, weapon-specific ammo, locked telegraphs, cover, pause, mage-only orbs and melee-only bruiser');
`);
