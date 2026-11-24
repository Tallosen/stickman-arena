const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),make=require('./arena-harness.cjs');
const root=path.join(__dirname,'..'),h=make();h.box.assert=assert;
h.run(`
reset();
for(const w of Object.keys(WEAPONS))for(let L=0;L<5;L++)for(const face of [-1,1])for(const a of [-.4,0,.4]){
 const aim=face===1?a:Math.PI-a,gear={gun:L,jacket:2,_w:w};
 const pose={neck:-60,gunAt:[2,-43]},q=heroWeaponHoldPose(gear,aim,pose,face);
 assert.deepEqual(pose,{neck:-60,gunAt:[2,-43]},'No mutation of caller pose');
 const trigger=w==='sniper'&&L===0?[16,-2]:[5,6];
 const x=pose.gunAt[0]*face+Math.cos(aim)*6.5+1.3*(Math.cos(aim)*trigger[0]-Math.sin(aim)*face*trigger[1]);
 const y=pose.gunAt[1]+Math.sin(aim)*6.5+1.3*(Math.sin(aim)*trigger[0]+Math.cos(aim)*face*trigger[1]);
 assert(Math.hypot(q.af[0]*face-x,q.af[1]-y)<1e-8,'Hand exactly follows rotated weapon grip');
 for(const p of [q.af,q.ab,q.ef,q.eb])assert(p.every(Number.isFinite));
 assert(Math.hypot(q.af[0]-q.ab[0],q.af[1]-q.ab[1])>5,'Hands must not be tied together');
}
for(let L=0;L<5;L++){
 reset();running=true;paused=false;P.wtype='laser';P.gear.gun=L;applyGear();enemies=[{x:P.x+160,y:P.y,r:12,hp:1000}];updateHeroFire(16);
 assert.equal(!!P.laserBeam,L===4);assert.equal(shots.filter(s=>s.source==='hand').length,L===4?0:1);
}
`);
const v=make({native:true,width:1100,height:700});
v.run(`ctx.fillStyle=PAPER;ctx.fillRect(0,0,W,H);ctx.vackyStableSketch=true;
for(const [i,w] of ['sniper','shotgun','laser'].entries()){
 P.wtype=w;P.gear={helm:4,jacket:3,gloves:4,boots:4,cape:3,clip:2,gun:4,scope:2};
 ctx.save();ctx.translate(i*365,0);drawVictoryHero(ctx,350,295);ctx.fillStyle=INK;ctx.font='15px system-ui';ctx.fillText(weaponFormName(w,4),40,315);ctx.restore();
 drawHero(ctx,110+i*365,600,1,0,{...P.gear,jacket:2,gloves:1,clip:0,_w:w,_holdWeapon:true},2.4,0,0,{yaw:.25,headYaw:.25});
}
ctx.save();ctx.globalCompositeOperation='destination-over';ctx.fillStyle=PAPER;ctx.fillRect(0,0,W,H);ctx.restore();
`);
if(process.argv.includes('--frames'))fs.writeFileSync(path.join(root,'audit/weapon-presentation-v0197.png'),v.canvas.toBuffer('image/png'));
console.log('PASS: grip attachment across weapons, tiers, directions and angles; Prism-only continuous beam; native result and preview renders');
