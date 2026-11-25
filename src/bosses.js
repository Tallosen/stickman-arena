"use strict";
// All encounter timers use the paused simulation; no background callbacks.
const BOSS_SPECS=[
 {stage:5,hp:650,speed:1,r:30},
 {stage:10,hp:2400,speed:1.2,r:33},
 {stage:15,hp:8200,speed:1.55,r:35},
 {stage:20,hp:18000,speed:1.8,r:38}
];
const BOSS_ARCHETYPES=[
 {id:'bruiser',name:'Железный таран',en:'Iron juggernaut',color:'#b7764d',attacks:['dash','slam','slam']},
 {id:'gunner',name:'Капитан картечи',en:'Scrap captain',color:'#507f91',attacks:['fan','aimed','fan']},
 {id:'shaman',name:'Пепельный колдун',en:'Ash sorcerer',color:'#9963b5',attacks:['rain','ring','slam']},
 {id:'hunter',name:'Ночной охотник',en:'Night hunter',color:'#7b8957',attacks:['aimed','dash','aimed']}
];
function bossFirearm(e){return e.bossSpec.id==='gunner'?'shotgun':e.bossSpec.id==='hunter'?'sniper':null;}
function bossPhase2(e){return e.bossSpec.stage>=15&&(e.phase2||e.hp<e.maxhp*.55);}
function bossActPose(e){
 const id=e.bossSpec.id,state=e.attackState;
 const shotHold=Math.min(1,Math.max(0,e.bossRecoil||0)),wind=state==='windup'||state==='shootwindup'||shotHold>0,u=shotHold|| (wind?Math.max(0,Math.min(1,1-e.attackT/(e.windupDuration||1250))):0);
 const reload=id==='gunner'&&state==='recover'?Math.sin(Math.PI*Math.max(0,Math.min(1,e.attackT/(e.recoveryDuration||500)))):0;
 const crouch=id==='hunter'?(wind?1.2*u:state==='recover'?1.2*Math.max(0,Math.min(1,e.attackT/(e.recoveryDuration||500))):0):0;
 const move=e.moveBlend??.65,ph=e.phase||0,face=e.face||1,dash=state==='dash',cast=Math.min(1,(e.castT||0)/(e.windupDuration||1250));
 const settle=state==='recover'?Math.max(0,Math.min(1,e.attackT/(e.recoveryDuration||750))):0;
 return {y:crouch+(wind?u:0)-Math.abs(Math.sin(ph))*.65*move+Math.sin((e.entryAge||0)/480)*.15+(state==='recover'?Math.sin(settle*Math.PI)*.6:0),
  lean:face*((dash?.26:wind&&id==='bruiser'?-.18*u:id==='hunter'?-.045:0)-Math.min(1,e.bossRecoil||0)*.085),
  stance:wind?3*u:dash?4:0,reload,raise:id==='shaman'?(wind?u*13:cast*13):id==='bruiser'?(wind?u*13:cast*17):0,
  move:wind||state==='shootwindup'||state==='recover'?0:move,dash};
}
// Two fixed-length bones per limb: knees/elbows bend instead of stretching.
function bossJoint(a,b,length,bend=1){
 const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.max(.001,Math.hypot(dx,dy)),reach=Math.min(d,length*2-.01),ux=dx/d,uy=dy/d;
 const end=[a[0]+ux*reach,a[1]+uy*reach],h=Math.sqrt(Math.max(0,length*length-reach*reach/4));
 return {end,joint:[a[0]+ux*reach/2-uy*h*bend,a[1]+uy*reach/2+ux*h*bend]};
}
const BOSS_LEG_BONE=7.8;
function bossHammerPose(e){
 const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
 const mix=(a,b,t)=>({grip:[a.grip[0]+(b.grip[0]-a.grip[0])*t,a.grip[1]+(b.grip[1]-a.grip[1])*t],angle:a.angle+(b.angle-a.angle)*t});
 const rest={grip:[-12,-25],angle:-.4},raised={grip:[-12,-36],angle:-.25},impact={grip:[-14,-17],angle:-2};
 // Use the actual warning/impact clock, not the unrelated casting arm timer.
 const mark=bossMarks.find(m=>m.owner===e);
 if(mark){
  const p=mark.age/Math.max(1,mark.delay);
  if(p<.72)return mix(rest,raised,ease(p/.72));
  if(p<1)return mix(raised,impact,ease((p-.72)/.28));
  return mix(impact,rest,ease((mark.age-mark.delay-60)/290));
 }
 const ready={grip:[-13,-30],angle:-.9};
 if(e.attackState==='windup')return mix(rest,ready,ease(1-e.attackT/(e.windupDuration||1250)));
 if(e.attackState==='dash')return mix(ready,rest,ease(1-e.attackT/600));
 const walk=Math.min(1,Math.max(0,e.moveBlend||0));
 return {grip:[-12,-25+Math.sin(e.phase||0)*.5*walk],angle:-.4+Math.sin((e.phase||0)*.7)*.035*walk};
}
function bossLegPose(e,phase,side,face=e.face||1){
 const act=bossActPose(e),cycle=((phase/(Math.PI*2)+(side<0?.5:0))%1+1)%1;
 const sway=Math.sin(phase*.7)*.1+act.lean,c=Math.cos(sway),s=Math.sin(sway);
 // Solve below the torso transform: hips follow the armour, soles stay level.
 // Coordinates are facing-local; drawFoe mirrors the complete lower body once.
 const pelvisX=12*s*face,hip=[side*2.7*c+pelvisX,side*2.7*face*s-12*c+act.y];
 const swing=Math.max(0,(cycle-.6)/.4),ease=swing*swing*(3-2*swing);
 const step=cycle<.6?1-2*cycle/.6:-1+2*ease;
 // This is a front/three-quarter silhouette, not a side-on running stick.
 // Each foot keeps its own lane even at the most extreme stride or lean.
 const lift=Math.sin(swing*Math.PI)*1.8*act.move;
 const foot=[pelvisX+side*(4.3+act.stance*.25)+step*1.6*act.move,2-lift];
 const limb=bossJoint(hip,foot,BOSS_LEG_BONE,-side);
 // Knees bend forward in depth, not sideways like a pair of bow legs.
 // Project a fixed-length 3D chain into this mostly frontal drawing.
 const mid=[(hip[0]+limb.end[0])/2,(hip[1]+limb.end[1])/2];
 const bend=[limb.joint[0]-mid[0],limb.joint[1]-mid[1]],projection=.24;
 const kneeDepth=Math.hypot(...bend)*Math.sqrt(1-projection*projection);
 limb.joint=[mid[0]+bend[0]*projection,mid[1]+bend[1]*projection];
 return {hip,...limb,kneeDepth,plant:lift<1e-8,ground:2,pelvisX};
}
// Same body transform as drawFoe. Both the gun drawing and bullet emission
// use this pose, including facing, sway, hit squash and the actual barrel tip.
function bossWeaponPose(e,view={}){
 const type=bossFirearm(e);if(!type)return null;
 const sc=view.sc??e.r/11,face=view.face??e.face??1,f=Math.max(0,view.flinch??e.flinch??0);
 const act=bossActPose(e),x=view.x??e.x,y=view.y??e.y+13*sc,rot=view.rot||0,sway=Math.sin((view.phase??e.phase)*.7)*.1+act.lean;
 const point=(px,py)=>{
  px*=face;const xx=(px*Math.cos(sway)-py*Math.sin(sway))*sc*(1+f*.22),yy=(px*Math.sin(sway)+py*Math.cos(sway)+act.y)*sc*(1-f*.16);
  return {x:x+xx*Math.cos(rot)-yy*Math.sin(rot),y:y+xx*Math.sin(rot)+yy*Math.cos(rot)};
 };
 const shoulder=point(0,-24),locked=e.attackState==='shootwindup'||(e.bossMuzzle||0)>0||(e.bossRecoil||0)>0;
 const angle=view.angle??(locked&&Number.isFinite(e.bossShotAngle)?e.bossShotAngle:Math.atan2((view.targetY??P.y)-shoulder.y,(view.targetX??P.x)-shoulder.x)+act.reload*.4*face);
 const recoil=view.recoil??e.bossRecoil??0,dir={x:Math.cos(angle),y:Math.sin(angle)},flip=dir.x>=0?1:-1;
 const scale=sc*(type==='shotgun'?.65:.55),origin={x:shoulder.x+dir.x*(7-3*recoil)*sc,y:shoulder.y+dir.y*(7-3*recoil)*sc};
 const at=(px,py)=>({x:origin.x+(px*dir.x-py*flip*dir.y)*scale,y:origin.y+(px*dir.y+py*flip*dir.x)*scale});
 const tip=gunMuzzlePoint(type,2);
 return {type,angle,origin,scale,flip,sc,muzzle:at(tip.x,tip.y),grip:at(2,6),support:at(18-act.reload*11,4+act.reload*5),rearShoulder:point(-5,-24),frontShoulder:point(5,-24)};
}
function drawBossWeapon(g,e,view){
 const p=bossWeaponPose(e,view);if(!p)return;
 g.save();g.strokeStyle=e.bossSpec.color;g.lineWidth=2.6*p.sc;g.lineCap='round';g.lineJoin='round';
 for(const [shoulder,hand] of [[p.rearShoulder,p.support],[p.frontShoulder,p.grip]]){
  g.beginPath();g.moveTo(shoulder.x,shoulder.y);g.lineTo((shoulder.x+hand.x)/2,(shoulder.y+hand.y)/2+5*p.sc);g.lineTo(hand.x,hand.y);g.stroke();
 }
 g.translate(p.origin.x,p.origin.y);g.rotate(p.angle);g.scale(p.scale,p.scale*p.flip);drawGunModel(g,2,e.bossMuzzle||0,p.type);g.restore();
}
let stageBoss=null,bossMarks=[],bossProjectiles=[],dragonAssist=null,dragonAssistWait=0,lastBossArchetype=null;
let nightFade=0,nightTorches=[];
const NIGHT_SCENERY_TYPES=['campfire','brazier','torch','tripod'];
const defeatedBossStages=new Set();
function bossName(spec){return typeof uiLanguage==='undefined'||uiLanguage==='ru'?spec.name:spec.en;}
function bossWords(key){
 const ru=typeof uiLanguage==='undefined'||uiLanguage==='ru';
 return ({night:['НОЧЬ · БОСС','NIGHT · BOSS'],defeat:['ПОБЕДИ БОССА','DEFEAT THE BOSS'],ally:['ДРАКОН ПОМОГАЕТ','DRAGON ASSIST'],win:['ПОБЕДА · БОСС ПОВЕРЖЕН','VICTORY · BOSS DEFEATED']})[key][ru?0:1];
}
function resetBossRun(){
 stageBoss=null;bossMarks=[];bossProjectiles=[];dragonAssist=null;dragonAssistWait=0;lastBossArchetype=null;defeatedBossStages.clear();nightFade=0;nightTorches=[];
 buildNightScenery();
 resetBossExperience();
}
function nightScenerySpotFree(q){
 // Keep the entire silhouette away from event art, not just its base point.
 return q.x>85&&q.y>85&&q.x<WORLD-85&&q.y<WORLD-85&&
  Math.hypot(q.x-WORLD/2,q.y-WORLD/2)>240&&
  arenaSecrets.every(s=>Math.hypot(q.x-s.x,q.y-s.y)>Math.max(170,s.r+100))&&
  props.every(p=>Math.hypot(p.x-q.x,p.y-q.y)>p.r+65)&&
  nightTorches.every(p=>Math.hypot(p.x-q.x,p.y-q.y)>235);
}
function buildNightScenery(){
 nightTorches=[];
 // Small rest stops on the verges of the actual painted paths, never a grid
 // across the battlefield. Try the opposite verge if scenery blocks a spot.
 for(const [branch,trail] of MAP_TRAILS.entries())for(let segment=0;segment<2;segment++){
  const [a,b,c,d]=trail.slice(segment*3,segment*3+4);
  for(let i=0;i<10;i++){
   const u=(i+.4)/10,v=1-u,seed=hash(branch*100+segment*20+i,431);
   const x=v*v*v*a[0]+3*v*v*u*b[0]+3*v*u*u*c[0]+u*u*u*d[0];
   const y=v*v*v*a[1]+3*v*v*u*b[1]+3*v*u*u*c[1]+u*u*u*d[1];
   const dx=3*v*v*(b[0]-a[0])+6*v*u*(c[0]-b[0])+3*u*u*(d[0]-c[0]);
   const dy=3*v*v*(b[1]-a[1])+6*v*u*(c[1]-b[1])+3*u*u*(d[1]-c[1]),length=Math.hypot(dx,dy)||1;
   for(const side of [seed>.5?1:-1,seed>.5?-1:1]){
    const offset=80+seed*35,q={x:x-dy/length*offset*side,y:y+dx/length*offset*side,seed};
    if(!nightScenerySpotFree(q))continue;
    q.kind=NIGHT_SCENERY_TYPES[nightTorches.length%4];q.radius=q.kind==='campfire'?170:q.kind==='brazier'?145:125;
    nightTorches.push(q);break;
   }
  }
 }
}
function updateNightLighting(dt){
 if(!running||paused)return;
 const target=isBossStage(P.stage)&&!P.runWon?1:0;
 nightFade=Math.max(0,Math.min(1,nightFade+Math.sign(target-nightFade)*Math.min(Math.abs(target-nightFade),Math.max(0,dt)/4500)));
}
function nightAmount(){return nightFade*nightFade*(3-2*nightFade);}
function chooseBossSpec(stage){
 const base=BOSS_SPECS.find(s=>s.stage===stage);if(!base)return null;
 const pool=BOSS_ARCHETYPES.filter(a=>a.id!==lastBossArchetype),type=pool[Math.floor(Math.random()*pool.length)];
 return {...base,...type,hp:Math.round(base.hp*(typeof campModifier==='function'?campModifier('bossHP'):1))};
}
function startStageBoss(savedSpec=null){
 if(stageBoss||defeatedBossStages.has(P.stage))return false;
 const spec=savedSpec||chooseBossSpec(P.stage);if(!spec)return false;lastBossArchetype=spec.id;
 spawn('elite');const e=enemies[enemies.length-1];
 Object.assign(e,{boss:true,bossSpec:spec,hp:spec.hp,maxhp:spec.hp,r:spec.r,speed:spec.speed,xp:800+P.stage*60,
  attackCd:2600,attackState:'chase',attackT:0,bossCycle:0,entryAge:0,enteredAt:P.runMs||0,campEntryHits:P.damageHits||0});
 const a=Math.atan2(e.y-P.y,e.x-P.x),point=enemyFreePoint(P.x+Math.cos(a)*330,P.y+Math.sin(a)*330,e.r);
 e.x=point.x;e.y=point.y;enemyResolveRocks(e);
 stageBoss={enemy:e,spec};bossMarks=[];bossProjectiles=[];dragonAssistWait=18000+Math.random()*22000;
 SFX.boss?.();return true;
}
function bossMark(x,y,r,e,delay){
 if(bossMarks.length>=8)return;
 bossMarks.push({x:Math.max(r,Math.min(WORLD-r,x)),y:Math.max(r,Math.min(WORLD-r,y)),r,age:0,delay,life:delay+350,owner:e});
}
function bossMovementIntent(e,tx,ty,dt){
 e.vulnerableT=Math.max(0,(e.vulnerableT||0)-dt);
 e.bossMuzzle=Math.max(0,(e.bossMuzzle||0)-dt);e.bossRecoil=Math.max(0,(e.bossRecoil||0)-dt/180);
 e.castT=Math.max(0,(e.castT||0)-dt);
 if(bossPhase2(e)&&!e.phase2){e.phase2=true;e.phaseBanner=2400;SFX.boss?.();}
 const dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy)||1;
 const intent={vx:dx/d,vy:dy/d,pace:1,locked:false};
 const tier=e.bossSpec.stage/5,enraged=bossPhase2(e);
 const cooldown=enraged?(tier===4?900:1300):tier>=3?1800:2800;
 if(e.attackState==='dash'){
  e.attackT-=dt;intent.vx=Math.cos(e.dashAngle);intent.vy=Math.sin(e.dashAngle);intent.pace=4.2;intent.locked=true;
  if(e.attackT<=0){e.attackState='recover';e.attackT=750;if(enraged&&e.bossSpec.id==='bruiser')bossMark(e.x,e.y,100,e,900);}
 }else if(e.attackState==='shootwindup'){
  e.attackT-=dt;intent.pace=0;intent.locked=true;
  if(e.attackT<=0){fireBossVolley(e);openBossWindow(e,bossFirearm(e)==='shotgun'?1000:650,bossFirearm(e)?'reload':'exhaust');}
 }else if(e.attackState==='windup'){
  e.attackT-=dt;intent.pace=0;intent.locked=true;
  if(e.attackT<=0){e.attackState='dash';e.attackT=600;}
 }else if(e.attackState==='reposition'){
  e.attackT-=dt;intent.locked=true;intent.pace=1.8;
  const angle=Math.atan2(dy,dx)+(e.bossSpec.id==='hunter'?Math.PI:(e.bossCycle%2?1:-1)*Math.PI/2);
  intent.vx=Math.cos(angle);intent.vy=Math.sin(angle);
  if(e.attackT<=0){e.attackState='chase';e.attackCd=350;}
 }else if(e.attackState==='recover'){
  e.attackT-=dt;intent.pace=e.vulnerableT>0?0:.15;intent.locked=true;
  // Telegraphs are dangerous, not vulnerability windows. Wait for the LAST impact.
  if(e.exhaustAfterCast&&!bossMarks.some(m=>m.owner===e&&!m.fired)){
   e.exhaustAfterCast=false;openBossWindow(e,e.bossSpec.id==='shaman'?1000:650,'exhaust');intent.pace=0;
  }
  if(e.attackT<=0&&!e.exhaustAfterCast){
   e.attackState=enraged&&bossFirearm(e)?'reposition':'chase';e.attackT=650;e.attackCd=cooldown;
  }
 }else{
  e.attackCd=Math.max(0,e.attackCd-dt);
  if(!e.attackCd&&d<650){
   const pattern=e.bossSpec.attacks,attack=pattern[e.bossCycle%pattern.length];
   e.bossCycle++;const delay=enraged?800:tier>=3?1000:1250;e.windupDuration=delay;
   if(attack==='dash'){
    e.attackState='windup';e.attackT=delay;e.dashAngle=Math.atan2(dy,dx);e.dashFrom={x:e.x,y:e.y};e.dashLength=e.speed*4.2*600/16.67;
   }else if(['fan','aimed','ring'].includes(attack)){
    const weapon=bossWeaponPose(e,{targetX:tx,targetY:ty});
    e.bossShotAngle=weapon?weapon.angle:Math.atan2(dy,dx);e.attackState='shootwindup';e.attackT=delay;e.bossShotKind=attack;
    e.bossShotFrom=weapon?bossWeaponPose(e).muzzle:{x:e.x,y:e.y-20};
   }else{
    e.castT=delay+250;
    if(attack==='slam')bossMark(e.x,e.y,100+tier*10,e,delay);
    else if(enraged){
     // Six circles leave a clearly open two-sector escape corridor.
     const gap=e.bossCycle%8;for(let i=0;i<8;i++){if(i===gap||i===(gap+1)%8)continue;const a=i*Math.PI/4;bossMark(tx+Math.cos(a)*145,ty+Math.sin(a)*145,48,e,delay+200);}
    }else for(let i=0;i<tier+1;i++){const a=i*Math.PI*2/Math.max(1,tier);bossMark(i===tier?tx:tx+Math.cos(a)*90,i===tier?ty:ty+Math.sin(a)*90,45,e,delay+i*200);}
    e.attackState='recover';e.attackT=delay+450;e.exhaustAfterCast=true;
   }
   intent.pace=0;intent.locked=true;
  }
 }
 return intent;
}
function openBossWindow(e,duration,reason){
 if(e.hp<=0)return;
 e.attackState='recover';e.attackT=duration;e.recoveryDuration=duration;
 e.vulnerableT=duration;e.vulnerableDuration=duration;e.vulnerableReason=reason;
}
function bossWindowLabel(e){
 return bossText(e.vulnerableReason==='stagger'?'ОГЛУШЁН':e.vulnerableReason==='reload'?'ПЕРЕЗАРЯДКА':'ИСТОЩЁН',
  e.vulnerableReason==='stagger'?'STAGGERED':e.vulnerableReason==='reload'?'RELOADING':'EXHAUSTED');
}
function bossVolleyAngles(e){
 const tier=e.bossSpec.stage/5,kind=e.bossShotKind;
 if(bossFirearm(e)==='sniper')return [e.bossShotAngle];
 if(bossFirearm(e)==='shotgun'){
  const count=4+tier,spread=kind==='aimed'?.09:.17;
  return Array.from({length:count},(_,i)=>e.bossShotAngle+(i-(count-1)/2)*spread);
 }
 const count=kind==='ring'?8+tier*2:kind==='aimed'?(tier>=3?3:1):3+tier;
 return Array.from({length:count},(_,i)=>e.bossShotAngle+(kind==='ring'?i*Math.PI*2/count:kind==='aimed'?(i-(count-1)/2)*.13:(i-(count-1)/2)*.23));
}
function fireBossVolley(e){
 const firearm=bossFirearm(e);
 if(!firearm&&e.bossSpec.id!=='shaman')return;
 if(firearm){e.bossMuzzle=110;e.bossRecoil=1;e.bossShotFrom=bossWeaponPose(e).muzzle;SFX.shot(firearm,e.x);}
 const kind=firearm==='shotgun'?'pellet':firearm==='sniper'?'sniper':'arcane';
 const speed=(kind==='sniper'?7.5:kind==='pellet'?4.4:2.6)+e.bossSpec.stage*.04;
 // A long barrel cannot shoot through a rock touching the weapon.
 if(firearm){const p=bossWeaponPose(e);if(!petPathClear(p.origin.x,p.origin.y,p.muzzle.x,p.muzzle.y,3))return;}
 for(const angle of bossVolleyAngles(e)){
  if(bossProjectiles.length>=64)break;
  bossProjectiles.push({x:e.bossShotFrom.x,y:e.bossShotFrom.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:firearm?3:6,life:firearm?2400:4000,kind,owner:e});
 }
}
function bossHurtPlayer(damage,source){
 return hurtHero(damage,source);
}
function soundDragonWings(a,dt){
 // Same 640 ms cycle as drawAssistingDragon. At most one cue per simulation step;
 // no timers, no replay of skipped flaps after a large dt or pause.
 if(Math.floor((a.age+160)/640)>Math.floor((a.age-dt+160)/640))SFX.wings?.(a.flyX??a.x);
}
function updateBossEncounter(dt){
 if(!running||paused||stageBoss?.enemy.hp<=0)return false;
 if(stageBoss){stageBoss.enemy.entryAge+=dt;stageBoss.enemy.phaseBanner=Math.max(0,(stageBoss.enemy.phaseBanner||0)-dt);}
 for(const m of bossMarks){
  m.age+=dt;
  if(!m.fired&&m.age>=m.delay){
   m.fired=true;
   if(Math.hypot(P.x-m.x,P.y-m.y)<m.r+P.r&&P.invT<=0&&P.hurt<=0){
    const damage=m.owner.bossSpec.stage>=15?m.owner.bossSpec.stage/5:.5+m.owner.bossSpec.stage/10;
    if(bossHurtPlayer(damage,{x:m.x,y:m.y,area:true}))return true;
   }
  }
 }
 bossMarks=bossMarks.filter(m=>m.age<m.life&&m.owner.hp>0);
 for(const b of bossProjectiles){
  const dx=b.vx*dt/16.67,dy=b.vy*dt/16.67,px=P.x-b.x,py=P.y-b.y,u=Math.max(0,Math.min(1,(px*dx+py*dy)/(dx*dx+dy*dy||1)));
  if(!petPathClear(b.x,b.y,b.x+dx,b.y+dy,b.r)){b.life=0;continue;}
  if(Math.hypot(px-dx*u,py-dy*u)<P.r+b.r){b.life=0;if(bossHurtPlayer(b.owner.bossSpec.stage>=15?2.5:1.5,{x:P.x-b.vx*20,y:P.y-b.vy*20}))return true;}
  b.x+=dx;b.y+=dy;b.life-=dt;
 }
 bossProjectiles=bossProjectiles.filter(b=>b.life>0&&b.owner.hp>0&&b.x>0&&b.y>0&&b.x<WORLD&&b.y<WORLD);
 if(dragonAssist?.ultimate){
  const a=dragonAssist;a.age+=dt;soundDragonWings(a,dt);
  const follow=1-Math.exp(-dt/240);
  a.flyX=(a.flyX??P.x)+(P.x-(a.flyX??P.x))*follow;
  a.flyY=(a.flyY??P.y)+(P.y-(a.flyY??P.y))*follow;
  const side=a.x-(a.flyX-95+Math.sin(a.age/950)*45);
  if(Math.abs(side)>35)a.turnTarget=side<0?Math.PI:0;
  a.turn=(a.turn||0)+((a.turnTarget||0)-(a.turn||0))*(1-Math.exp(-dt/150));
  while(a.pulses<3&&a.age>=1600+a.pulses*1400){
   a.pulses++;
   const targets=enemies.filter(e=>e.hp>0&&dist(e,P)<700).sort((l,r)=>(!!r.boss-!!l.boss)||dist(l,P)-dist(r,P));
   const target=targets[0];if(!target)continue;
   a.x=target.x;a.y=target.y;a.breathAt=a.age;
   for(const e of targets.filter(e=>dist(e,target)<180).slice(0,8)){
    if(e.boss){
     const damage=Math.min(e.maxhp*.02,Math.max(0,e.hp-1));
     if(damage>0)hit(e,damage,a.x-90,a.y-100,false,damage);
    }else hit(e,a.damage*.8,a.x-90,a.y-100);
   }
   booms.push({x:a.x,y:a.y,r:12,max:150,life:1});SFX.breath?.(a.x);
  }
  if(a.age>=6200)dragonAssist=null;
 }else if(dragonAssist){
  const a=dragonAssist;a.age+=dt;soundDragonWings(a,dt);
  if(!a.struck&&a.age<1800&&stageBoss){a.x=stageBoss.enemy.x;a.y=stageBoss.enemy.y;}
  if(!a.struck&&a.age>=2100){
   a.struck=true;const boss=stageBoss?.enemy;SFX.breath?.(a.x);
   // Assistance cannot deliver the killing blow to a boss.
   const damage=boss?Math.min(boss.maxhp*.05,Math.max(0,boss.hp-1)):0;
   if(damage>0)hit(boss,damage,a.x-200,a.y-100,false);
   enemies.filter(e=>!e.boss&&e.hp>0&&Math.hypot(e.x-a.x,e.y-a.y)<210).slice(0,8).forEach(e=>hit(e,35+P.stage*4,a.x,a.y));
  }
  if(a.age>=4400)dragonAssist=null;
 }else if(stageBoss){
  dragonAssistWait-=dt;
  if(dragonAssistWait<=0){dragonAssistWait=25000+Math.random()*25000;if(Math.random()<.55)startDragonAssist();}
 }
 return false;
}
function startDragonAssist(preview=false){
 if(!running||paused||dragonAssist||(!stageBoss&&!preview))return false;
 const e=stageBoss?.enemy||P;dragonAssist={age:0,struck:false,type:rollDragon(),x:e.x,y:e.y};
 SFX.dragon?.();pops.push({x:P.x,y:P.y-80,txt:bossWords('ally'),life:2,col:'#79c8d8'});return true;
}
function startUltDragonAssist(type,damage){
 if(!running||paused||!type||P.runWon)return false;
 // One ally slot: an existing random flight is replaced, never stacked.
 dragonAssist={ultimate:true,age:0,pulses:0,breathAt:-1000,type,damage,x:P.x,y:P.y,flyX:P.x,flyY:P.y,turn:0,turnTarget:0};
 dragonAssistWait=30000;
 SFX.dragon?.();
 pops.push({x:P.x,y:P.y-88,txt:bossText('СОЮЗ ДРАКОНА · 6 СЕК','DRAGON ALLIANCE · 6 SEC'),life:2.4,col:type.breath});return true;
}
function drawBossMarks(g){
 for(const m of bossMarks){
  if(!m.fired){
   g.save();g.fillStyle='rgba(234,148,65,.12)';g.strokeStyle='#ffd19a';g.lineWidth=2.5;g.setLineDash([7,5]);
   g.beginPath();g.arc(m.x,m.y,m.r,0,7);g.fill();g.stroke();g.setLineDash([]);g.lineWidth=4;
   g.beginPath();g.arc(m.x,m.y,m.r,-Math.PI/2,-Math.PI/2+Math.min(1,m.age/m.delay)*Math.PI*2);g.stroke();g.restore();
  }
  else{g.save();g.globalAlpha=Math.max(0,1-(m.age-m.delay)/350);g.strokeStyle='#efc888';g.lineWidth=6;g.beginPath();g.arc(m.x,m.y,m.r,0,7);g.stroke();g.restore();}
 }
 const e=stageBoss?.enemy;
 if(e?.hp>0&&e.vulnerableT>0){
  g.save();g.strokeStyle='#ffe09a';g.lineWidth=3.5;g.setLineDash([6,5]);
  g.beginPath();g.ellipse(e.x,e.y+15,e.r+14,13,0,0,Math.PI*2);g.stroke();g.setLineDash([]);
  g.restore();
 }
 if(e&&e.entryAge<1600){
  const u=e.entryAge/1600;g.save();g.globalAlpha=(1-u)*.6;g.strokeStyle='#e2c693';g.lineWidth=3;
  g.beginPath();g.ellipse(e.x,e.y+18,e.r+18+u*45,12+u*16,0,0,7);g.stroke();g.restore();
 }
 if(e?.attackState==='windup'){
  g.save();g.translate(e.dashFrom.x,e.dashFrom.y);g.rotate(e.dashAngle);g.strokeStyle='#ffce8b';g.lineWidth=3;g.setLineDash([8,6]);
  g.strokeRect(0,-e.r,e.dashLength,e.r*2);g.setLineDash([]);g.restore();
 }
 if(e?.attackState==='shootwindup'){
  g.save();g.strokeStyle='#f7c681';g.lineWidth=1.7;g.setLineDash([6,8]);
  const from=bossWeaponPose(e)?.muzzle||e.bossShotFrom;
  for(const a of bossVolleyAngles(e)){g.beginPath();g.moveTo(from.x,from.y);g.lineTo(from.x+Math.cos(a)*320,from.y+Math.sin(a)*320);g.stroke();}
  g.restore();
 }
 for(const b of bossProjectiles)drawBossProjectile(g,b);
}
function drawBossProjectile(g,b){
 g.save();g.translate(b.x,b.y);g.rotate(Math.atan2(b.vy,b.vx));g.lineCap='round';
 if(b.kind==='sniper'){
  g.strokeStyle='#be7847';g.lineWidth=4;g.beginPath();g.moveTo(-27,0);g.lineTo(0,0);g.stroke();
  g.strokeStyle='#fff0be';g.lineWidth=1.5;g.beginPath();g.moveTo(-20,0);g.lineTo(0,0);g.stroke();
 }else if(b.kind==='pellet'){
  g.strokeStyle='#805738';g.lineWidth=4;g.beginPath();g.moveTo(-5,0);g.lineTo(0,0);g.stroke();
  g.strokeStyle='#f5ca7c';g.lineWidth=1.6;g.beginPath();g.moveTo(-3,-.5);g.lineTo(0,-.5);g.stroke();
 }else{
  g.strokeStyle='#75508e';g.lineWidth=2;scircle(g,0,0,b.r,'#c7a4e8');g.fillStyle='#f0e3ff';g.beginPath();g.arc(-1,-1,2,0,7);g.fill();
 }g.restore();
}
function drawDragonAssist(g){
 if(dragonAssist?.ultimate){drawUltDragonAssist(g,dragonAssist);return;}
 const a=dragonAssist;if(!a)return;const u=a.age/4400,x=cam.x-180+u*(W+360),y=cam.y+Math.max(140,Math.min(190,H*.28))-Math.sin(u*Math.PI)*14;
 drawAssistingDragon(g,a,{x,y,face:1,scale:.7,bank:Math.sin(u*Math.PI*2)*.10},a.age-1900);
}
function drawUltDragonAssist(g,a){
 const entry=Math.max(0,1-a.age/1000),exit=Math.max(0,(a.age-5100)/1100);
 const x=(a.flyX??P.x)-95+Math.sin(a.age/950)*45-entry*entry*360+exit*exit*460;
 const y=(a.flyY??P.y)-145+Math.sin(a.age/700)*12-exit*exit*100;
 const bank=Math.sin(a.age/900)*.08-entry*.14-exit*.2;
 drawAssistingDragon(g,a,{x,y,face:Math.cos(a.turn||0),scale:.72,bank},a.age-a.breathAt);
}
function drawAssistingDragon(g,a,pose,phase){
 const flap=a.age/640,breath=phase>=0&&phase<780?Math.sin(Math.PI*phase/780):0;
 const mouth=dragonMouthPoint(pose,a.type,flap);
 drawDragonBreath(g,mouth,{x:a.x,y:a.y},a.type,a.age,phase);
 g.save();g.translate(pose.x,pose.y);g.scale(pose.face,1);
 drawDragon(g,0,0,pose.scale,a.type,flap,breath,pose.bank,true);g.restore();
}
function drawBossGround(g,L,R,T,B){
 const amount=nightAmount();if(amount<=0)return;
 g.save();g.globalAlpha=amount;g.fillStyle='rgba(23,34,72,.68)';g.fillRect(L,T,R-L,B-T);
 const moon=g.createRadialGradient(P.x,P.y,25,P.x,P.y,350);moon.addColorStop(0,'rgba(169,192,232,.12)');moon.addColorStop(1,'rgba(169,192,232,0)');
 g.fillStyle=moon;g.fillRect(L,T,R-L,B-T);
 for(const q of nightTorches){
  const radius=q.radius;
  if(q.x+radius<L||q.x-radius>R||q.y+radius<T||q.y-radius>B)continue;
  const glow=g.createRadialGradient(q.x,q.y,8,q.x,q.y,radius);glow.addColorStop(0,'rgba(255,197,100,.46)');glow.addColorStop(.4,'rgba(241,168,75,.19)');glow.addColorStop(1,'rgba(241,168,75,0)');g.fillStyle=glow;g.fillRect(q.x-radius,q.y-radius,radius*2,radius*2);
 }g.restore();
}
function drawNightScenery(g,q,amount){
 g.save();g.translate(q.x,q.y);g.lineCap='round';g.lineJoin='round';
 // Low, grounded props in the same moss/stone/wood palette as the map.
 const camp=q.kind==='campfire',brazier=q.kind==='brazier',tripod=q.kind==='tripod';
 const radius=camp?26:brazier?18:15;
 g.fillStyle='rgba(155,139,99,.13)';g.beginPath();g.ellipse(0,1,radius+8,radius*.52,0,0,7);g.fill();
 g.fillStyle='rgba(75,66,44,.16)';g.beginPath();g.ellipse(4,3,radius,radius*.34,0,0,7);g.fill();
 g.strokeStyle='#9ba579';g.lineWidth=1.1;
 sline(g,-radius-4,1,-radius-7,-4);sline(g,-radius-4,1,-radius-3,-5);
 const stone=(x,y,r)=>{g.strokeStyle='#8b8168';g.lineWidth=1.2;g.beginPath();g.ellipse(x,y,r,r*.65,-.2,0,7);g.fillStyle='#c8bda0';g.fill();g.stroke();};
 let fireY,fireScale;
 if(camp){
  g.fillStyle='#8b7a5b';g.beginPath();g.ellipse(0,-2,19,10,0,0,7);g.fill();
  for(let i=4;i<9;i++){const a=i*Math.PI*2/9;stone(Math.cos(a)*23,Math.sin(a)*11,5.5);}
  g.strokeStyle='#6b533b';g.lineWidth=6;sline(g,-13,-7,13,3);sline(g,-13,3,12,-7);
  g.strokeStyle='#ae8855';g.lineWidth=2;sline(g,-13,-8,12,2);sline(g,-12,2,12,-8);
  for(let i=0;i<4;i++){const a=i*Math.PI*2/9;stone(Math.cos(a)*23,Math.sin(a)*11,5.5);}
  fireY=-4;fireScale=1.05;
 }else if(brazier){
  stone(0,1,16);stone(0,-5,12);stone(0,-11,13);
  g.strokeStyle='#665e4b';g.lineWidth=1.6;
  spoly(g,[[-15,-18],[15,-18],[11,-10],[-11,-10]],'#92896b');
  g.fillStyle='#5d5440';g.beginPath();g.ellipse(0,-18,14,4,0,0,7);g.fill();
  g.strokeStyle='#cbb895';sline(g,-11,-14,10,-14);fireY=-18;fireScale=.8;
 }else if(tripod){
  g.strokeStyle='#735b3e';g.lineWidth=3.6;
  sline(g,-12,2,3,-28);sline(g,12,2,-3,-28);sline(g,2,5,0,-27);
  g.strokeStyle='#b39a69';g.lineWidth=1.3;sline(g,-10,1,3,-27);sline(g,11,1,-3,-27);
  g.strokeStyle='#655844';g.lineWidth=1.5;spoly(g,[[-9,-28],[9,-28],[6,-20],[-6,-20]],'#9c8862');
  g.strokeStyle='#cfb88c';sline(g,-6,-23,6,-23);stone(-12,3,3);stone(12,3,3);fireY=-28;fireScale=.65;
 }else{
  // A short bound wooden torch, planted into a small stone footing.
  stone(-4,1,6);stone(5,2,5);
  g.strokeStyle='#73583b';g.lineWidth=5;sline(g,0,0,-3,-26);
  g.strokeStyle='#b59460';g.lineWidth=1.4;sline(g,1,-2,-2,-25);
  g.strokeStyle='#67523c';g.lineWidth=1.5;spoly(g,[[-9,-34],[2,-36],[4,-24],[-6,-23]],'#b6a17b');
  g.strokeStyle='#806546';sline(g,-8,-31,3,-32);sline(g,-7,-27,3,-28);
  fireY=-34;fireScale=.65;
 }
 if(amount>0){
  g.save();g.translate(q.kind==='torch'?-3:0,fireY);g.scale(fireScale,fireScale);g.globalAlpha=amount;
  const sway=Math.sin(t/350+q.seed*8)*2;
  g.fillStyle='rgba(232,122,46,.24)';g.beginPath();g.ellipse(0,-5,13,8,0,0,7);g.fill();
  g.strokeStyle='#c1833e';g.lineWidth=1;
  g.beginPath();g.moveTo(-9,0);g.bezierCurveTo(-15,-9,-4,-13,-5,-21);g.quadraticCurveTo(1,-16,sway,-31);g.bezierCurveTo(15,-16,15,-5,9,0);g.closePath();g.fillStyle='#e9a64e';g.fill();g.stroke();
  g.beginPath();g.moveTo(-5,0);g.quadraticCurveTo(-6,-9,sway+2,-18);g.quadraticCurveTo(10,-6,5,0);g.closePath();g.fillStyle='#ffe6a2';g.fill();
  const spark=(t/90+q.seed*17)%24;g.globalAlpha=amount*(1-spark/24)*.65;g.fillStyle='#ffe0a0';g.beginPath();g.arc(sway,-33-spark,1,0,7);g.fill();g.restore();
 }
 g.restore();
}
function drawNightTorches(g,L,R,T,B){
 const amount=nightAmount();
 for(const q of nightTorches){
  if(q.x<L-40||q.x>R+40||q.y<T-30||q.y>B+85)continue;
  drawNightScenery(g,q,amount);
 }
}
function drawBossNight(g){
 const amount=nightAmount();if(amount<=0)return;
 g.save();g.globalAlpha=amount;g.fillStyle='rgba(18,25,62,.08)';g.fillRect(0,0,W,H);
 const light=g.createRadialGradient(W/2,H/2,30,W/2,H/2,Math.max(W,H)*.65);
 light.addColorStop(0,'rgba(14,22,48,0)');light.addColorStop(1,'rgba(8,13,36,.24)');g.fillStyle=light;g.fillRect(0,0,W,H);g.restore();
}
function drawBossHUD(g){
 const e=stageBoss?.enemy;if(!e||e.hp<=0)return;
 const enraged=e.bossSpec.stage>=15&&e.hp<e.maxhp*.55;
 const dockInset=typeof abilityDockInset==='number'?abilityDockInset:0;
 const width=Math.min(340,W-32),x=(W-width)/2,y=H<450?66:H-236-dockInset;
 g.save();g.fillStyle='#211e35';g.strokeStyle=enraged?'#f0a768':'#b99ad4';g.lineWidth=enraged?2.5:1.5;g.beginPath();g.roundRect(x,y,width,42,9);g.fill();g.stroke();
 g.fillStyle=e.vulnerableT>0?'#ffe09a':'#fff0ce';g.textAlign='center';g.font='800 12px system-ui';
 g.fillText(e.vulnerableT>0?bossWindowLabel(e)+bossText(' · УРОН +40%',' · DAMAGE +40%'):bossName(stageBoss.spec)+' · '+Math.ceil(e.hp)+' / '+e.maxhp,W/2,y+16,width-18);
 g.fillStyle='#53415e';g.fillRect(x+10,y+25,width-20,7);g.fillStyle=enraged?'#e99756':e.bossSpec.color;g.fillRect(x+10,y+25,(width-20)*Math.max(0,e.hp/e.maxhp),7);
 if(e.vulnerableT>0){g.fillStyle='#ffe09a';g.fillRect(x+10,y+36,(width-20)*Math.min(1,e.vulnerableT/e.vulnerableDuration),2);}
 g.restore();
}
function finishArenaVictory(reward=null){
 if(typeof runSaveAction==='function'&&!runSaveDepth)return runSaveAction(()=>finishArenaVictory(reward),true);
 if(typeof requestRunCheckpoint==='function')requestRunCheckpoint();
 if(typeof bossLoot!=='undefined'&&bossLoot?.stage===20)return false;
 if(bossRewardPending?.stage===20)return false;
 if(P.runWon||P.stage!==20||!BOSS_SPECS.every(s=>defeatedBossStages.has(s.stage)))return false;
 P.runWon=true;running=false;paused=false;userPaused=false;pointer.active=false;queuedLevels=0;
 ult.on=false;ult.zoom=1;ult.rot=0;ult.lift=0;bossMarks=[];bossProjectiles=[];dragonAssist=null;
 document.body.classList.remove('sniper-cinematic','dragon-finale');document.getElementById('levelup')?.classList.add('hidden');
 rememberRunStage();if(!P.testRun)meta.best=Math.max(meta.best,Math.round(P.runMs/1000));
 const newRecord=!P.testRun&&(!P.trial||P.trial==='normal')&&P.runMs>0&&(!meta.bestClearMs||P.runMs<meta.bestClearMs);
 if(newRecord)meta.bestClearMs=Math.round(P.runMs);saveMeta();
 document.getElementById('victoryDragonName').textContent=bossWords('win');
 document.getElementById('victoryDragonText').textContent=formatRunTime(P.runMs)+' · '+score+' · 20/20';
 renderBossResults(newRecord);
 if(typeof recordRunScore==='function')recordRunScore();
 if(typeof checkpointCamp==='function')checkpointCamp();
 if(typeof renderCampResult==='function'){
  renderCampResult('victoryProgress');document.getElementById('btnVictoryMenu').textContent=campText('menu');
  if(!P.testRun&&P.trial&&P.trial!=='normal')document.getElementById('victoryRecord').textContent=campProfile.best[P.trial]?campText('trialBest')+': '+formatRunTime(campProfile.best[P.trial]):campText('noRecord');
 }
 const c=document.getElementById('victoryDragonCanvas');if(c)drawVictoryHero(c.getContext('2d'),c.width,c.height);
 if(typeof startArenaEnding==='function')startArenaEnding(reward);
 else{document.getElementById('dragonVictory').classList.remove('hidden');SFX.victory?.();}
 return true;
}
function victoryHeroPresentation(){
 return {gear:{...P.gear,_w:P.wtype,_holdWeapon:true},pose:{lf:[8,0],lb:[-8,0],kf:[8,-20],kb:[-8,-20],hip:-36,neck:-60,head:[0,-74],af:[17,-38],ab:[-15,-38],gunAt:[2,-43]},aim:0,muzzle:0};
}
function drawVictoryHero(g,width,height){
 const model=victoryHeroPresentation(),stable=g.vackyStableSketch;g.vackyStableSketch=true;
 g.clearRect(0,0,width,height);drawHero(g,width*.42,height-25,1,0,model.gear,2.1,model.aim,model.muzzle,model.pose,1);g.vackyStableSketch=stable;
}

// Post-boss choice owns its own pause; it never spends queued level-up cards.
let bossRewardPending=null,bossRunLog=[];
const bossText=(ru,en)=>typeof uiLanguage==='undefined'||uiLanguage==='ru'?ru:en;
function resetBossExperience(){
 if(typeof resetBossLoot==='function')resetBossLoot();
 bossRewardPending=null;bossRunLog=[];document.getElementById('bossReward')?.classList.add('hidden');
}
// Saved reward IDs are language-neutral; rebuild copy when a saved bag opens.
function localizedBossReward(option){
 const result={...option};
 if(option.kind==='gear'){
  result.title=GEAR[option.key].name+' +1';
  result.desc=bossText('Улучшение снаряжения на этот забег','Equipment upgrade for this run');
 }else if(option.kind==='supply'){
  result.title=ABILITIES[option.key].name+' +1';
  result.desc=bossText('Заряд сохранится для следующих забегов','Charge carries over to future runs');
 }else{
  const copy={heal:[bossText('Восстановить здоровье','Restore health'),bossText('До 4 сердец, не выше максимума','Up to 4 hearts, capped at maximum')],
   ult:[bossText('Зарядить ульту','Charge ultimate'),bossText('+50% шкалы ульты','+50% ultimate charge')],
   continue:[bossText('Продолжить','Continue'),bossText('Все запасы уже заполнены','All supplies are already full')]}[option.kind];
  if(copy)[result.title,result.desc]=copy;
 }
 return result;
}
function bossRewardOptions(stage,randomPool=false){
 const options=[],gearNames=['Weapon','Helmet','Jacket','Gloves','Boots','Scope','Backpack','Cape'];
 if(stage<20){
  const pool=GK.filter(upgradeableGear);
  if(pool.length)for(const key of randomPool?pool:[pool[(stage/5-1)%pool.length]])options.push({id:'gear:'+key,key,kind:'gear',title:bossText(GEAR[key].name,gearNames[GK.indexOf(key)])+' +1',desc:bossText('Улучшение снаряжения на этот забег','Equipment upgrade for this run')});
  if(P.hp<P.hpMax)options.push({id:'heal',kind:'heal',title:bossText('Восстановить здоровье','Restore health'),desc:bossText('До 4 сердец, не выше максимума','Up to 4 hearts, capped at maximum')});
  if(ult.charge<ULT_FULL)options.push({id:'ult',kind:'ult',title:bossText('Зарядить ульту','Charge ultimate'),desc:bossText('+50% шкалы ульты','+50% ultimate charge')});
 }
 for(const [i,key] of ABILITY_KEYS.entries())if((randomPool||options.length<3)&&inventory[key]<999)options.push({id:'supply:'+key,key,kind:'supply',title:bossText(ABILITIES[key].name,['AIRSTRIKE','TOXIC FOG','BATTLE TANK'][i])+' +1',desc:bossText('Заряд сохранится для следующих забегов','Charge carries over to future runs')});
 if(!options.length)options.push({id:'continue',kind:'continue',title:bossText('Продолжить','Continue'),desc:bossText('Все запасы уже заполнены','All supplies are already full')});
 return randomPool?options:options.slice(0,3);
}
function offerBossReward(stage){
 if(bossRewardPending)return;
 bossRewardPending={stage,options:bossRewardOptions(stage)};paused=true;pointer.active=false;
 document.getElementById('levelup')?.classList.add('hidden');
 document.getElementById('bossRewardTitle').textContent=bossText('Твоя награда','Your reward');
 document.getElementById('bossRewardStage').textContent=bossText('СТАДИЯ ','STAGE ')+stage+bossText(' · БОСС ПОБЕЖДЁН',' · BOSS DEFEATED');
 document.getElementById('bossRewardHint').textContent=stage===20?bossText('Выбери 1 награду в запас для следующих забегов','Choose 1 reward to keep for future runs'):bossText('Трофей найден — выбери награду','Trophy recovered — choose a reward');
 document.getElementById('bossRewardFooter').textContent=bossText('Бой на паузе · Выбери 1 награду','Battle paused · Choose 1 reward');
 const medal=document.getElementById('bossRewardMedal');drawBossRewardIcon(medal.getContext('2d'),{kind:'medal'},medal.width);
 const box=document.getElementById('bossRewardChoices');box.innerHTML='';
 const offer=bossRewardPending;
 for(const option of offer.options){
  const button=document.createElement('button');button.type='button';button.className='boss-reward-choice';
  button.dataset.kind=option.kind;button.dataset.key=option.key||'';
  const art=document.createElement('span');art.className='boss-reward-art';art.setAttribute('aria-hidden','true');
  const canvas=document.createElement('canvas');canvas.width=canvas.height=160;art.appendChild(canvas);
  drawBossRewardIcon(canvas.getContext('2d'),option,160);
  const value=document.createElement('b');value.className='boss-reward-value';value.textContent=bossRewardValue(option);art.appendChild(value);button.appendChild(art);
  const copy=document.createElement('span');copy.className='boss-reward-copy';
  const category=document.createElement('span');category.className='boss-reward-category';category.textContent=bossRewardCategory(option);copy.appendChild(category);
  const title=document.createElement('strong'),desc=document.createElement('span');title.textContent=option.title;desc.className='boss-reward-desc';desc.textContent=option.desc;copy.appendChild(title);copy.appendChild(desc);button.appendChild(copy);
  const impact=document.createElement('span');impact.className='boss-reward-impact';impact.textContent=bossRewardImpact(option);copy.appendChild(impact);
  const arrow=document.createElement('span');arrow.className='boss-reward-arrow';arrow.textContent='›';arrow.setAttribute('aria-hidden','true');button.appendChild(arrow);
  button.onclick=event=>{event?.stopPropagation();if(bossRewardPending===offer)claimBossReward(option.id);};box.appendChild(button);
 }
 document.getElementById('bossReward').classList.remove('hidden');document.getElementById('bossRewardTitle').focus?.({preventScroll:true});
}
function bossRewardCategory(option){
 return option.kind==='gear'?bossText('Снаряжение · этот забег','Equipment · this run'):option.kind==='supply'?bossText('В запас · сохраняется','Stash · carries over'):option.kind==='heal'?bossText('Восстановление','Recovery'):option.kind==='ult'?bossText('Особый приём','Ultimate ability'):bossText('Всё собрано','Fully stocked');
}
// Uses the same pure calculation as applyGear, never temporarily mutates the hero.
function bossRewardPreview(option){
 if(option.kind==='gear'){
  const key=option.key,g={...P.gear,[key]:Math.min(GEAR[key].max,P.gear[key]+1)};
  return {before:heroGearStats(),after:heroGearStats(g),gearBefore:P.gear,gearAfter:g};
 }
 if(option.kind==='heal')return {before:P.hp,after:Math.min(P.hpMax,P.hp+4)};
 if(option.kind==='ult')return {before:ult.charge/ULT_FULL*100,after:Math.min(ULT_FULL,ult.charge+ULT_FULL*.5)/ULT_FULL*100};
 if(option.kind==='supply')return {before:inventory[option.key],after:Math.min(999,inventory[option.key]+1)};
 return null;
}
function bossRewardImpact(option){
 const p=bossRewardPreview(option);if(!p)return '';
 const n=v=>String(Math.round(v*100)/100),pair=(label,a,b,suffix='')=>label+': '+n(a)+suffix+' → '+n(b)+suffix;
 if(option.kind==='heal')return pair(bossText('Здоровье','Health'),p.before,p.after);
 if(option.kind==='ult')return pair(bossText('Заряд','Charge'),p.before,p.after,'%');
 if(option.kind==='supply')return pair(bossText('Зарядов в запасе','Charges in stash'),p.before,p.after);
 const a=p.before,b=p.after;
 if(option.key==='gun')return pair(P.wtype==='shotgun'?bossText('Базовый урон дробины вблизи','Base pellet damage, close range'):bossText('Базовый урон пули','Base bullet damage'),a.damage,b.damage)+(P.wtype==='shotgun'?' · '+pair(bossText('Дробин','Pellets'),a.pellets,b.pellets):'');
 if(option.key==='helm')return pair(bossText('Максимум HP','Max HP'),a.hpMax,b.hpMax)+' · '+bossText('Новое сердце заполнится','New heart is filled');
 if(option.key==='jacket')return pair(bossText('Защита после попадания','Protection after a hit'),a.iframe/1000,b.iframe/1000,bossText(' с',' s'));
 if(option.key==='gloves')return a.fireRate===b.fireRate?bossText('Базовая скорострельность уже на пределе','Base fire-rate cap already reached'):pair(bossText('Базовая скорострельность','Base fire rate'),1000/a.fireRate,1000/b.fireRate,bossText(' /с',' /s'));
 if(option.key==='boots')return bossText('Базовая скорость','Base speed')+' +'+n((b.speed/a.speed-1)*100)+'%';
 if(option.key==='scope')return pair(bossText('Базовая дальность','Base range'),a.range,b.range);
 if(option.key==='clip')return pair(bossText('Самонаводящихся модулей','Guided modules'),p.gearBefore.clip,p.gearAfter.clip);
 return pair(bossText('Бонус опыта','XP bonus'),(a.xpMult-1)*100,(b.xpMult-1)*100,'%');
}
function bossRewardValue(option){
 if(option.kind==='gear')return P.gear[option.key]+' → '+(P.gear[option.key]+1);
 if(option.kind==='heal')return '+'+Math.round(Math.min(4,P.hpMax-P.hp)*10)/10;
 if(option.kind==='ult'){const n=Math.max(0,Math.min(.5,1-ult.charge/ULT_FULL)*100);return n>0&&n<1?'+<1%':'+'+Math.round(n)+'%';}
 return option.kind==='supply'?(inventory[option.key]<999?'+1':'MAX'):'✓';
}
// Code-native icons: existing weapon/ability models, matching outlined equipment.
function drawBossRewardIcon(g,option,size=160){
 const stable=g.vackyStableSketch;g.vackyStableSketch=true;g.save();g.clearRect(0,0,size,size);g.scale(size/80,size/80);
 g.lineCap='round';g.lineJoin='round';g.strokeStyle=INK;g.lineWidth=2.6;
 const poly=(points,color)=>spoly(g,points,color);
 const rect=(x,y,w,h,color,r=4)=>{g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=color;g.fill();g.stroke();};
 const star=(x,y,r)=>{const points=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,d=i%2?r*.46:r;points.push([x+Math.cos(a)*d,y+Math.sin(a)*d]);}poly(points,'#fff0ac');};
 const level=Math.max(0,Math.min(4,option.level??((P.gear?.[option.key]||0)+1))),color=TIER[level];
 if(option.kind==='supply')drawAbilityIcon(g,option.key,40,39,1.85);
 else if(option.kind==='heal'){
  g.beginPath();g.moveTo(40,62);g.bezierCurveTo(8,42,13,19,28,20);g.bezierCurveTo(35,20,39,26,40,28);g.bezierCurveTo(52,9,78,25,61,45);g.closePath();g.fillStyle='#d57968';g.fill();g.stroke();
  g.strokeStyle='#fff5dc';g.lineWidth=4;g.beginPath();g.moveTo(22,31);g.quadraticCurveTo(24,26,29,28);g.stroke();
  g.strokeStyle=INK;rect(46,45,20,20,'#fff2d5',6);g.strokeStyle='#a9574d';g.lineWidth=3;sline(g,56,50,56,60);sline(g,51,55,61,55);
 }else if(option.kind==='ult'){
  scircle(g,40,40,26,'#d9c4ea');poly([[43,13],[23,43],[38,43],[33,68],[58,33],[43,33]],'#f1c64d');
  g.strokeStyle='#fff6cf';g.lineWidth=2;sline(g,44,24,34,37);
 }else if(option.kind==='medal'||option.kind==='continue'){
  poly([[22,44],[18,73],[33,65],[41,71],[44,43]],'#ca7940');poly([[39,44],[45,73],[53,64],[66,69],[58,42]],'#bd6636');
  scircle(g,41,34,25,'#dbaa42');g.strokeStyle='#fff0bd';g.lineWidth=2;g.beginPath();g.arc(41,34,20,0,Math.PI*2);g.stroke();g.strokeStyle=INK;star(41,34,14);
 }else if(option.key==='gun'){
  const type=P.wtype||'basic',tip=gunMuzzlePoint(type,level).x,scale=Math.min(1.7,59/(tip+8));g.translate(40-(tip-5)*scale/2,40);g.rotate(-.12);g.scale(scale,scale);drawGunModel(g,level,0,type);
 }else if(option.key==='helm'){
  g.beginPath();g.moveTo(17,48);g.lineTo(17,36);g.bezierCurveTo(17,8,64,8,64,36);g.lineTo(64,54);g.lineTo(53,62);g.lineTo(23,56);g.closePath();g.fillStyle=color;g.fill();g.stroke();
  rect(21,33,37,12,'#333944',4);g.strokeStyle='#a6d5e5';g.lineWidth=3;sline(g,27,37,49,37);
 }else if(option.key==='jacket'){
  poly([[25,16],[34,21],[45,21],[54,16],[67,33],[57,40],[54,65],[24,65],[22,40],[12,33]],color);
  poly([[33,21],[40,32],[46,21]],'#faf0d8');g.strokeStyle='#f3de9f';sline(g,40,33,40,61);sline(g,28,48,35,48);sline(g,46,48,51,48);
 }else if(option.key==='gloves'){
  for(const x of [15,42]){rect(x,28,23,28,color,7);rect(x-3,39,8,14,color,4);rect(x+2,55,19,9,'#5b534a',2);g.strokeStyle='#eee2b7';sline(g,x+5,34,x+18,34);g.strokeStyle=INK;}
 }else if(option.key==='boots'){
  for(const [x,y] of [[12,17],[38,24]]){poly([[x,y],[x+16,y],[x+16,y+26],[x+26,y+31],[x+26,y+40],[x-2,y+40],[x-2,y+27]],color);rect(x-2,y+37,28,5,'#453d31',2);g.strokeStyle='#eee2b7';sline(g,x+4,y+9,x+12,y+9);g.strokeStyle=INK;}
 }else if(option.key==='scope'){
  rect(15,30,41,18,'#766b59',5);scircle(g,55,39,16,color);scircle(g,55,39,10,'#a2cfdc');g.strokeStyle='#effafd';sline(g,51,35,56,32);g.strokeStyle=INK;rect(23,48,15,9,'#b6a685',2);
 }else if(option.key==='clip'){
  rect(29,13,22,12,'#b49a6a',4);rect(21,22,38,44,'#7d725c',8);rect(26,43,28,17,color,4);rect(15,30,9,25,'#b49a6a',3);rect(57,30,9,25,'#b49a6a',3);g.strokeStyle='#efe2b4';sline(g,30,28,50,28);
 }else if(option.key==='cape'){
  poly([[29,15],[50,15],[65,66],[42,57],[17,67]],color);g.strokeStyle='#ead693';g.lineWidth=3;sline(g,30,23,23,57);sline(g,49,23,57,56);g.strokeStyle=INK;scircle(g,39,19,5,'#e0b94d');
 }
 g.restore();g.vackyStableSketch=stable;
}
function grantBossReward(option){
 if(option.kind==='supply'){
  const before=inventory[option.key];inventory[option.key]=Math.min(999,before+1);
  if(saveInventory()===false){inventory[option.key]=before;return false;}
 }
 const oldHP=P.hpMax;
 if(option.kind==='gear'){P.gear[option.key]=Math.min(GEAR[option.key].max,P.gear[option.key]+1);applyGear();if(option.key==='helm')P.hp=Math.min(P.hpMax,P.hp+Math.max(0,P.hpMax-oldHP));}
 if(option.kind==='heal')P.hp=Math.min(P.hpMax,P.hp+4);
 if(option.kind==='ult')ult.charge=Math.min(ULT_FULL,ult.charge+ULT_FULL*.5);
 return true;
}
function claimBossReward(id){
 if(typeof runSaveAction==='function'&&!runSaveDepth)return runSaveAction(()=>claimBossReward(id),true);
 if(!running||!bossRewardPending||(typeof Playables!=='undefined'&&Playables.blocked))return false;
 const offer=bossRewardPending,option=offer.options.find(o=>o.id===id);if(!option)return false;
 if(!grantBossReward(option)){document.getElementById('bossRewardHint').textContent=bossText('Не удалось сохранить награду. Попробуй ещё раз.','Could not save the reward. Please retry.');return false;}
 // Clear before the finale so a double click cannot replay the grant.
 bossRewardPending=null;
 pops.push({x:P.x,y:P.y-65,txt:option.title,life:2.8,col:'#dfad52'});
 document.getElementById('bossReward').classList.add('hidden');paused=false;pointer.active=false;P.hurt=Math.max(P.hurt,1000);
 if(offer.stage===20)finishArenaVictory(option);else{if(P.stage<=offer.stage)enterRunStage(offer.stage+1);SFX.chest?.();}
 return true;
}
document.getElementById('bossReward')?.addEventListener('keydown',event=>{
 if(!bossRewardPending)return;
 if(event.key==='Escape'){event.preventDefault();event.stopPropagation();}
 if(event.key==='Tab'){
  const buttons=[...document.getElementById('bossRewardChoices').querySelectorAll('button')];if(!buttons.length)return;
  const index=buttons.indexOf(document.activeElement),next=index<0?(event.shiftKey?buttons.length-1:0):(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length;
  event.preventDefault();buttons[next].focus();
 }
});
function drawBossArrival(g){
 const e=stageBoss?.enemy;if(!e||e.hp<=0)return;
 const entry=e.entryAge<2300,phase=(e.phaseBanner||0)>0;if(!entry&&!phase)return;
 const clock=entry?e.entryAge:2400-e.phaseBanner,alpha=Math.min(1,clock/220,(entry?2300-clock:2400-clock)/400);
 const w=Math.min(340,W-24),x=(W-w)/2,y=Math.min(148,H*.25);
 g.save();g.globalAlpha=Math.max(0,alpha);g.fillStyle='#2d2940';g.strokeStyle=phase?'#efb468':'#b89e7b';g.lineWidth=1.5;
 g.beginPath();g.roundRect(x,y,w,58,12);g.fill();g.stroke();g.fillStyle='#f8e7bd';g.textAlign='center';g.font='800 14px system-ui';g.fillText(bossName(e.bossSpec),W/2,y+23,w-20);
 g.font='11px system-ui';g.fillText(phase?bossText('ВТОРАЯ ФАЗА · НОВАЯ ТАКТИКА','PHASE TWO · NEW TACTICS'):bossText('НОЧЬ · СТАДИЯ ','NIGHT · STAGE ')+P.stage,W/2,y+43,w-20);g.restore();
}
function renderBossResults(newRecord){
 document.getElementById('victoryDragonText').textContent=bossText('Время: ','Time: ')+formatRunTime(P.runMs)+bossText(' · Счёт: ',' · Score: ')+(P.redKills||0)+bossText(' · Боссов: ',' · Bosses: ')+defeatedBossStages.size;
 document.getElementById('victoryRecord').textContent=P.testRun?bossText('Тестовый забег · без рекорда','Test run · no record'):newRecord?bossText('НОВЫЙ РЕКОРД ПРОХОЖДЕНИЯ','NEW CLEAR-TIME RECORD'):bossText('Лучшее прохождение: ','Best clear: ')+formatRunTime(meta.bestClearMs||P.runMs);
 const list=document.getElementById('victoryBosses');list.innerHTML='';
 for(const log of bossRunLog){const row=document.createElement('div'),spec=BOSS_ARCHETYPES.find(a=>a.id===log.id);row.textContent=log.stage+' · '+bossName(spec)+' · '+formatRunTime(log.ms);list.appendChild(row);}
 const gear=document.getElementById('victoryGear');gear.innerHTML='';
 const names=['Weapon','Helmet','Jacket','Gloves','Boots','Scope','Backpack','Cape'];
 for(const [i,key] of GK.entries()){const badge=document.createElement('span');badge.textContent=bossText(GEAR[key].name,names[i])+' '+P.gear[key]+'/'+GEAR[key].max;gear.appendChild(badge);}
 document.getElementById('victoryWeapon').textContent=bossText('Оружие: ','Weapon: ')+weaponFormName(P.wtype,P.gear.gun);
}
