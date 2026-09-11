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
  const tip=w==='sniper'?40+L*3.5:w==='shotgun'?24+L*2.5:w==='minigun'?38+L*2:[16,22,30,34,38][L];
  const push=P.gear.jacket?6.5:3.5,a=P.aim;
  return heroCombatPoint(2*P.face+Math.cos(a)*(push+tip*1.3)+Math.sin(a)*2.6*P.face,
    -27+Math.sin(a)*(push+tip*1.3)-Math.cos(a)*2.6*P.face);
}
function makeHeroShot(origin,a,dmg,kind,extra={}){
  const sp=kind==='sniper'?13:kind==='pellet'?7.4:7.2;
  const s={x:origin.x,y:origin.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,a,
    life:kind==='sniper'?1400:850,dmg,kind,pierce:kind==='sniper',hit:[],
    crit:kind==='sniper'&&Math.random()<.22+.05*P.gear.gun,...extra};
  shots.push(s);return s;
}
function updateHeroFire(dt){
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
    const kind=P.wtype==='minigun'?'mini':P.wtype==='shotgun'?'pellet':P.wtype;
    for(let i=0;i<P.gear.clip;i++)P.backpackQueue.push({slot:i,delay:65+i*45,
      target:packNear[i+1]||packNear[0],dmg:P.damage,kind});
  }
  shotT-=dt;if(shotT>0||!near.length)return;
  shotT=P.fireRate*(P.hasteT>0?.55:1);SFX.shot();
  P.muzzle=P.wtype==='minigun'?60:100;
  P.recoilT=P.wtype==='sniper'?170:P.wtype==='shotgun'?140:80;
  const origin=heroGunTip(),a=Math.atan2(near[0].y-origin.y,near[0].x-origin.x);
  const kind=P.wtype==='minigun'?'mini':P.wtype==='shotgun'?'pellet':P.wtype;
  if(P.wtype==='shotgun'){
    for(let i=0;i<P.pellets;i++)makeHeroShot(origin,a+(i/(P.pellets-1)-.5)*P.spread+rnd(-.05,.05),P.damage,kind,{source:'hand'});
    P.recoil=1;
  }else{
    makeHeroShot(origin,a+(kind==='mini'?rnd(-P.spread,P.spread)/2:0),P.damage,kind,{source:'hand'});
    if(kind==='mini')P.spinV=.42;
    if(kind==='sniper'){shake=Math.max(shake,7);P.recoil=1;}
  }
  puffs.push({x:origin.x,y:origin.y,vx:Math.cos(a)*1.2,vy:Math.sin(a)*1.2-.3,life:.5,r:rnd(2,4)});
}
function backpackTargetInRange(s,e){return e.hp>0&&dist(e,s.anchor)<=s.range;}
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
