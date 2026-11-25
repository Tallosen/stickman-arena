"use strict";
/* Backpack ports are shared by the model and projectile emission. */
function backpackPort(index,face,neck=-40){
  const a=(face>0?Math.PI:0)+(index-1)*.36*face;
  const x=-face*(18+(index%2)*3),y=neck+5+index*7;
  return {x,y,a,mx:x+Math.cos(a)*10,my:y+Math.sin(a)*10};
}
function heroCombatPoint(x,y){
  const run=P.run||0,lean=-P.face*run*.055,squash=1+Math.sin(P.phase*2)*.018*run;
  const rc=(P.recoilT||0)>0?P.recoilT/170*4:0;
  x*=1.02;y*=1.02*squash;
  return {x:P.x-Math.cos(P.aim)*rc+x*Math.cos(lean)-y*Math.sin(lean),
    y:P.y+17-Math.sin(P.aim)*rc+x*Math.sin(lean)+y*Math.cos(lean)};
}
function heroGunTip(){
  const L=P.gear.gun,w=P.wtype;
  const tip=gunMuzzlePoint(w,L).x;
  const push=P.gear.jacket?6.5:3.5,a=P.aim;
  const anchor=heroRestWeaponAnchor(w,L,P.gear.jacket,a,P.face);
  return heroCombatPoint(anchor[0]*P.face+Math.cos(a)*(push+tip*1.3)+Math.sin(a)*2.6*P.face,
    anchor[1]+Math.sin(a)*(push+tip*1.3)-Math.cos(a)*2.6*P.face);
}
function makeHeroShot(origin,a,dmg,kind,extra={}){
  const sp=kind==='laser'?23:kind==='arrow'?9:kind==='sniper'?13:kind==='pellet'?7.4:7.2;
  const s={x:origin.x,y:origin.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,a,
    life:kind==='sniper'?1400:kind==='arrow'?1200:kind==='laser'?450:850,dmg,kind,pierce:kind==='sniper'||kind==='laser'&&P.gear.gun>=3,hit:[],
    crit:kind==='sniper'&&Math.random()<.22+.05*P.gear.gun,weaponType:P.wtype,...extra};
  if(kind==='pellet'&&extra.source==='hand')s.falloff={x:P.x,y:P.y,start:120,end:P.range};
  shots.push(s);return s;
}
function updateHeroFire(dt){
  P.laserBeam=null;
  P.backpackCooldown=Math.max(0,(P.backpackCooldown||0)-dt);
  P.backpackFlash=(P.backpackFlash||[0,0,0]).map(v=>Math.max(0,v-dt));
  P.backpackQueue=P.backpackQueue||[];
  if(ult.on||dragonFinale){P.backpackQueue=[];return;}
  const near=enemies.filter(e=>e.hp>0&&dist(e,P)<P.range).sort((a,b)=>dist(a,P)-dist(b,P));
  const packRange=Math.min(P.range,BACKPACK_RANGE_MAX),packNear=near.filter(e=>dist(e,P)<packRange);
  if(near.length){P.aim=Math.atan2(near[0].y-(P.y-11),near[0].x-P.x);P.face=Math.cos(P.aim)>0?1:-1;}
  for(const event of P.backpackQueue){
    event.delay-=dt;if(event.delay>0)continue;
    event.done=true;
    if(event.slot>=P.gear.clip)continue;
    const target=packNear.includes(event.target)?event.target:packNear[0];
    if(!target)continue;
    const port=backpackPort(event.slot,P.face),origin=heroCombatPoint(port.mx,port.my);
    const shot=makeHeroShot(origin,port.a-P.face*(P.run||0)*.055,event.dmg,event.kind,
      {source:'backpack',target,age:0,slot:event.slot,anchor:{x:P.x,y:P.y},range:packRange});
    shot.life+=650;P.backpackFlash[event.slot]=110;
    puffs.push({x:origin.x,y:origin.y,vx:Math.cos(port.a)*.7,vy:Math.sin(port.a)*.7-.2,life:.35,r:2});
  }
  P.backpackQueue=P.backpackQueue.filter(e=>!e.done);
  // Separate auxiliary cadence. Haste and fast minigun cycles cannot flood pods.
  if(P.gear.clip>0&&packNear.length&&P.backpackCooldown<=0){
    P.backpackCooldown=backpackSalvoCooldown(P.fireRate);
    const kind='basic'; // These are the same guided modules, not copies of the hand weapon.
    for(let i=0;i<P.gear.clip;i++)P.backpackQueue.push({slot:i,delay:65+i*45,
      target:packNear[i+1]||packNear[0],dmg:P.backpackDamage,kind});
  }
  if(!near.length){shotT=0;P.laserTick=0;P.beamSoundT=0;return;}
  if(P.wtype==='laser'&&P.gear.gun===4){updateLaserBeam(dt,near[0]);return;}
  shotT-=dt;if(shotT>0)return;
  // Carry the fraction of a frame, but never bank shots while there is no target.
  shotT+=P.fireRate*(P.hasteT>0?.55:1);SFX.shot();
  P.muzzle=P.wtype==='minigun'?60:100;
  P.recoilT=['sniper','goldSniper'].includes(P.wtype)&&P.gear.gun>=2?170:['shotgun','dropShotgun'].includes(P.wtype)?140:80;
  const origin=heroGunTip(),a=Math.atan2(near[0].y-origin.y,near[0].x-origin.x);
  const kind=weaponShotKind(P.wtype,P.gear.gun);
  if(kind==='pellet'){
    for(let i=0;i<P.pellets;i++)makeHeroShot(origin,a+(i/(P.pellets-1)-.5)*P.spread+rnd(-.05,.05),P.damage,kind,{source:'hand'});
    P.recoil=1;
  }else{
    makeHeroShot(origin,a+(kind==='mini'?rnd(-P.spread,P.spread)/2:0),P.damage,kind,{source:'hand'});
    if(kind==='mini')P.spinV=.42;
    if(kind==='sniper'){shake=Math.max(shake,7);P.recoil=1;}
  }
  puffs.push({x:origin.x,y:origin.y,vx:Math.cos(a)*1.2,vy:Math.sin(a)*1.2-.3,life:.5,r:rnd(2,4)});
}
function updateLaserBeam(dt,target){
 const origin=heroGunTip(),a=Math.atan2(target.y-origin.y,target.x-origin.x),reach=P.range;
 const end={x:origin.x+Math.cos(a)*reach,y:origin.y+Math.sin(a)*reach};
 const ray={...end,hit:[],source:'hand'},contacts=heroShotContacts(ray,origin.x,origin.y).slice(0,P.gear.gun>=3?2:1);
 const last=contacts[contacts.length-1];
 if(last){end.x=origin.x+(end.x-origin.x)*last.u;end.y=origin.y+(end.y-origin.y)*last.u;}
 P.laserBeam={x:origin.x,y:origin.y,ex:end.x,ey:end.y,age:t};P.muzzle=60;P.recoilT=0;
 P.beamSoundT=(P.beamSoundT||0)-dt;if(P.beamSoundT<=0){SFX.shot();P.beamSoundT=150;}
 P.laserTick=(P.laserTick||0)+Math.max(0,dt);
 const ticks=Math.min(10,Math.floor(P.laserTick/100));P.laserTick-=ticks*100;
 if(ticks)for(const {e} of contacts)if(e.hp>0)hit(e,P.damage*1000/P.fireRate*.1*ticks*(P.hasteT>0?1/.55:1),e.x,e.y);
}
function backpackTargetInRange(s,e){return e.hp>0&&dist(e,s.anchor)<=s.range;}
function heroShotContacts(s,x0,y0){
  const dx=s.x-x0,dy=s.y-y0,length2=dx*dx+dy*dy,contacts=[];
  for(const e of enemies){
    if(e.hp<=0||s.hit?.includes(e)||(s.source==='backpack'&&!backpackTargetInRange(s,e)))continue;
    const ex=e.x-x0,ey=e.y-y0,r=e.r+4;
    if(length2<1e-10){if(ex*ex+ey*ey<=r*r)contacts.push({e,u:0});continue;}
    const u=(ex*dx+ey*dy)/length2,perp2=Math.max(0,ex*ex+ey*ey-u*u*length2);
    if(perp2>r*r)continue;
    const half=Math.sqrt((r*r-perp2)/length2),entry=Math.max(0,u-half);
    if(entry<=1&&u+half>=0)contacts.push({e,u:entry});
  }
  return contacts.sort((a,b)=>a.u-b.u);
}
function updateHeroProjectiles(dt,k){
  for(const s of shots){
    steerBackpackShot(s,dt,k);
    const x0=s.x,y0=s.y;s.x+=s.vx*k;s.y+=s.vy*k;s.life-=dt;
    if(s.source==='backpack'&&(s.life<=0||dist(s,s.anchor)>s.range+48)){s.life=0;continue;}
    for(const {e,u} of heroShotContacts(s,x0,y0)){
      const x=x0+(s.x-x0)*u,y=y0+(s.y-y0)*u;
      const fall=s.falloff,falloff=fall?1-.55*Math.max(0,Math.min(1,(Math.hypot(x-fall.x,y-fall.y)-fall.start)/Math.max(1,fall.end-fall.start))):1;
      const damage=(s.dmg||P.damage)*falloff;
      const impact=d=>s.ultCast?hitUlt(e,d,x,y,s.ultCast):hit(e,d,x,y);
      if(s.pierce){
        s.hit.push(e);
        const big=enemyBaseKind(e.kind)==='tank'||e.kind==='elite';
        if(s.crit&&big){
          impact(damage*3);
          pops.push({x:e.x,y:e.y-e.r-26,txt:gameText('КРИТ!','CRIT!'),life:1.4,col:'#8a53c4'});
          shake=Math.max(shake,15); // impact() already emitted the one contact/death cue
        }else impact(damage);
        if(s.kind==='laser'&&s.hit.length>=2){s.life=0;break;}
      }else{impact(damage);s.life=0;break;}
    }
  }
  shots=shots.filter(s=>s.life>0);
}
function steerBackpackShot(s,dt,k){
  if(s.source!=='backpack')return;
  s.age+=dt;
  // First clear the backpack backwards; then curve around the owner toward a target.
  if(s.age<145)return;
  if(!s.target||!backpackTargetInRange(s,s.target)||!enemies.includes(s.target))
    s.target=enemies.filter(e=>backpackTargetInRange(s,e)).sort((a,b)=>dist(a,s)-dist(b,s))[0];
  if(!s.target)return;
  const a=Math.atan2(s.target.y-s.y,s.target.x-s.x),delta=Math.atan2(Math.sin(a-s.a),Math.cos(a-s.a));
  s.a+=Math.max(-.18*k,Math.min(.18*k,delta));
  const speed=Math.hypot(s.vx,s.vy);s.vx=Math.cos(s.a)*speed;s.vy=Math.sin(s.a)*speed;
}
