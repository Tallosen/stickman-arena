"use strict";
// Three discoveries unlock one supply delivery, never an early campaign ending.
let arenaSecrets=[],arenaSecretComplete=false,arenaSecretTime=0,arenaSecretDropIssued=false,compassStorm=null;
let weaponDelivery=null;
function resetWeaponDelivery(){weaponDelivery={rolled:false,eligible:false,stage:0,state:'waiting',age:0,weapon:null};}
function launchWeaponDelivery(forcedWeapon=null){
 const d=weaponDelivery;if(!d||d.state!=='waiting'||!running||paused||ult.on||P.runWon)return false;
 if(forcedWeapon&&!DROP_WEAPONS.includes(forcedWeapon))return false;
 d.rolled=true;d.eligible=true;d.weapon=forcedWeapon||d.weapon||DROP_WEAPONS[Math.floor(Math.random()*3)];
 let point={x:P.x,y:P.y};
 for(let i=0;i<24;i++){const a=i*Math.PI/12,x=P.x+Math.cos(a)*210,y=P.y+Math.sin(a)*210;
  if(x>60&&y>60&&x<WORLD-60&&y<WORLD-60&&petPathClear(P.x,P.y,x,y,32)){point={x,y};break;}}
 Object.assign(d,point,{state:'flying',age:0});
 pops.push({x:P.x,y:P.y-80,txt:bossText('САМОЛЁТ СНАБЖЕНИЯ','SUPPLY PLANE'),life:2.5,col:'#ab792f'});SFX.build?.();return true;
}
function weaponDeliveryNotice(title,impact){
 const icon=document.createElement('canvas');icon.width=icon.height=96;drawBossRewardIcon(icon.getContext('2d'),{kind:'gear',key:'gun',level:P.gear.gun},96);
 bossLootNotices.push({header:bossText('ОРУЖИЕ АВИАДРОПА','AIRDROP WEAPON'),title,impact,category:bossText('Улучшение каждые 75 с боя · только этот забег','Upgrade every 75s of combat · this run'),icon,age:0});
}
function collectWeaponDelivery(){
 const d=weaponDelivery;if(!d||d.state!=='ground'||!running||paused||ult.on||P.runWon||dist(d,P)>40)return false;
 d.state='collected';P.storedGunLevel=P.gear.gun;P.wtype=d.weapon;P.dropWeapon=d.weapon;P.dropWeaponMs=0;P.gear.gun=0;
 P.laserBeam=null;P.laserTick=0;P.backpackQueue=[];shotT=0;ult.bag=[];ult.weaponBag=null;
 if(P.campRun)P.campRun.shotgunOnly=false;
 if(typeof requestRunCheckpoint==='function')requestRunCheckpoint();
 applyGear();SFX.chest?.();weaponDeliveryNotice(weaponFormName(P.wtype,0),bossText('Получено · уровень 1/5','Acquired · level 1/5'));return true;
}
function updateWeaponDelivery(dt){
 if(!running||paused||ult.on||P.runWon||(typeof Playables!=='undefined'&&Playables.blocked)||bossLootLocked())return;
 const d=weaponDelivery;if(!d)return;
 // Exactly one probability check per run; later stages cannot retry a failed roll.
 if(!d.rolled){d.rolled=true;d.eligible=Math.random()<.33;
  if(typeof requestRunCheckpoint==='function')requestRunCheckpoint();
  if(d.eligible){d.stage=6+Math.floor(Math.random()*4);d.weapon=DROP_WEAPONS[Math.floor(Math.random()*3)];}}
 if(d.eligible&&d.state==='waiting'&&P.stage>=d.stage&&P.stage<20&&!isBossStage(P.stage))launchWeaponDelivery();
 if(d.state==='flying'){d.age+=dt;if(d.age>=6500){d.state='ground';SFX.crateLand?.(d.x);}}
 if(d.state==='ground')collectWeaponDelivery();
 if(P.dropWeapon===P.wtype&&isDropWeapon(P.wtype)&&P.gear.gun<4&&enemies.some(e=>e.hp>0&&dist(e,P)<P.range)){
  P.dropWeaponMs+=Math.max(0,dt);
  const lv=Math.min(4,Math.floor(P.dropWeaponMs/DROP_UPGRADE_MS));
  if(lv>P.gear.gun){P.gear.gun=lv;applyGear();if(typeof requestRunCheckpoint==='function')requestRunCheckpoint();SFX.level?.();weaponDeliveryNotice(weaponFormName(P.wtype,lv),bossText('Улучшено · уровень ','Upgraded · level ')+(lv+1)+'/5');}
 }
}
function drawWeaponDelivery(g){
 const d=weaponDelivery;if(!d||!['flying','ground'].includes(d.state))return;
 g.save();g.translate(d.x,d.y);g.strokeStyle=INK;g.lineWidth=2;g.lineJoin='round';
 g.fillStyle='#70583422';g.beginPath();g.ellipse(0,5,28,11,0,0,7);g.fill();
 g.strokeStyle='#c49942';g.setLineDash([5,5]);g.beginPath();g.ellipse(0,6,43,22,0,0,7);g.stroke();g.setLineDash([]);
 if(d.age>2000||d.state==='ground'){
  const lift=d.state==='ground'?0:Math.max(0,1-(d.age-2000)/4500)*210;
  g.save();g.translate(0,-lift);g.strokeStyle='#66563f';
  if(lift>0){g.fillStyle='#e7d2a1';g.beginPath();g.arc(0,-68,42,Math.PI,Math.PI*2);g.closePath();g.fill();g.stroke();sline(g,-42,-68,-17,-20);sline(g,42,-68,17,-20);sline(g,0,-108,0,-20);}
  spoly(g,[[-23,-34],[23,-34],[23,0],[-23,0]],'#697b71');spoly(g,[[-26,-39],[26,-39],[26,-30],[-26,-30]],'#a1ae90');
  g.strokeStyle='#efc661';g.lineWidth=4;sline(g,-12,-35,-12,-2);sline(g,12,-35,12,-2);
  g.fillStyle='#f5df95';g.font='bold 15px system-ui';g.textAlign='center';g.fillText('★',0,-12);g.restore();
 }
 if(d.state==='flying'){
  const x=-900+d.age*.45;g.save();g.translate(x,-220);g.strokeStyle='#394d55';g.lineWidth=3;
  spoly(g,[[-55,-7],[4,-7],[38,-47],[48,-44],[25,-5],[77,0],[25,5],[48,44],[38,47],[4,7],[-55,7],[-69,22],[-75,19],[-63,0],[-75,-19],[-69,-22]],'#849899');
  spoly(g,[[38,-4],[59,-3],[67,0],[38,3]],'#c9e1db');g.restore();
 }
 g.restore();
}
function drawWeaponDeliveryHUD(g){
 const d=weaponDelivery;
 // Delivery guidance disappears on pickup. Mastery only uses short upgrade notices.
 if(!running||!['flying','ground'].includes(d?.state))return;
 const title=bossText('АВИАДРОП','AIRDROP');
 const sub=d.state==='flying'?bossText('Доставка · отметка на карте','Incoming · marked on map'):bossText('Забери ящик · ','Collect crate · ')+Math.round(dist(d,P))+bossText(' м',' m');
 g.save();g.fillStyle='#fff3dae8';g.strokeStyle='#bb9655';g.lineWidth=1;g.beginPath();g.roundRect(10,118,194,43,8);g.fill();g.stroke();g.fillStyle='#76502b';g.textAlign='left';g.font='bold 10px system-ui';g.fillText(title,19,135,176);g.font='10px system-ui';g.fillText(sub,19,151,176);g.restore();
}
function resetArenaSecrets(){
  resetWeaponDelivery();
  arenaSecretComplete=false;arenaSecretTime=0;arenaSecretDropIssued=false;compassStorm=null;
  arenaSecrets=[{kind:'mine',x:WORLD/2,y:WORLD/2,r:105,lit:false,age:0}];
  const free=(x,y)=>x>120&&y>120&&x<WORLD-120&&y<WORLD-120&&
    props.every(o=>Math.hypot(x-o.x,y-o.y)>o.r+90)&&
    arenaSecrets.every(s=>Math.hypot(x-s.x,y-s.y)>650);
  for(const kind of ['nade','ice']){
    let spot=null;
    for(let n=0;n<160&&!spot;n++){const x=150+Math.random()*(WORLD-300),y=150+Math.random()*(WORLD-300);if(free(x,y))spot={x,y};}
    if(!spot)for(let y=180;y<WORLD-120&&!spot;y+=120)for(let x=180;x<WORLD-120&&!spot;x+=120)if(free(x,y))spot={x,y};
    if(spot)arenaSecrets.push({kind,...spot,r:kind==='nade'?28:38,lit:false,age:0});
  }
}
function triggerArenaSecret(kind,x,y,r=0){
  if(!running||paused||dragonFinale)return false;
  const s=arenaSecrets.find(s=>s.kind===kind&&!s.lit&&Math.hypot(x-s.x,y-s.y)<=s.r+Math.max(0,r));
  if(!s)return false;
  s.lit=true;s.age=0;
  const count=arenaSecrets.filter(s=>s.lit).length;
  const name={mine:'СОЛНЕЧНЫЙ КОМПАС',nade:'КОРОЛЬ ТАЙНИКА',ice:'ЛУННЫЙ ИСТОЧНИК'}[kind];
  pops.push({x:s.x,y:s.y-65,txt:name+' · '+count+'/3',life:2.5,col:kind==='ice'?'#438fa7':'#aa7a27'});
  if(kind==='ice')SFX.ice();else SFX.chest();
  if(count===3){arenaSecretComplete=true;arenaSecretTime=0;
    queueCompassDrop();
    pops.push({x:P.x,y:P.y-85,txt:'ЭЛИТНЫЙ ДРОП · В ЦЕНТР КОМПАСА',life:3.5,col:'#8650b1'});}
  return true;
}
function queueCompassDrop(){
  if(!arenaSecretComplete||arenaSecretDropIssued)return false;
  arenaSecretDropIssued=true;
  compassStorm={age:0,duration:6000};
  chests.push({x:WORLD/2,y:WORLD/2,a:0,rare:true,elite:true,compassReward:true,
    dropT:3600,dropDuration:3600,landT:600,rewardGranted:false});
  return true;
}
function updateCompassStorm(dt){
  if(!compassStorm||!running||paused)return;
  if(dragonFinale){compassStorm=null;for(const e of enemies){e.stormCaught=null;e.stormLift=0;}return;}
  if(ult.on)return; // Do not fight cinematic enemy choreography.
  const storm=compassStorm;storm.age+=dt;
  for(const e of enemies){
    if(e.hp<=0||e.rewarded||e.boss)continue;
    if(!e.stormCaught){const seed=hash(e.x+17,e.y-13);
      e.stormCaught={x:e.x,y:e.y,age:0,delay:seed*1400,duration:950+seed*550,seed};
      e.attackState='chase';e.attackT=0;
    }
    const c=e.stormCaught;c.age+=dt;
    const p=Math.max(0,Math.min(1,(c.age-c.delay)/c.duration));
    const a=c.seed*Math.PI*2+p*9,r=Math.sin(p*Math.PI)*30;
    e.x=Math.max(e.r,Math.min(WORLD-e.r,c.x+Math.cos(a)*r));
    e.y=Math.max(e.r,Math.min(WORLD-e.r,c.y+Math.sin(a)*r*.55));
    e.stormLift=p*85;e.phase+=dt*.015;
    if(p>=1||storm.age>=storm.duration){e.y-=e.stormLift;e.hp=0;popEnemy(e);}
  }
  if(storm.age>=storm.duration)compassStorm=null;
}
function drawCompassStorm(g,L,R,T,B){
  if(!compassStorm||dragonFinale||ult.on)return;
  const age=compassStorm.age,fade=Math.min(1,age/400,(6000-age)/600);
  g.save();g.strokeStyle='#8e90b1';g.lineWidth=1.7;g.lineCap='round';
  // Low-contrast travelling gusts in screen-visible world cells.
  for(let x=Math.floor(L/180)*180;x<R;x+=180)for(let y=Math.floor(T/160)*160;y<B;y+=160){
    const a=hash(x,y)*6,xx=x+((age*.16+hash(y,x)*160)%180),yy=y+Math.sin(age/280+a)*9;
    g.globalAlpha=.22*fade;g.beginPath();g.moveTo(xx-40,yy+8);g.quadraticCurveTo(xx,yy-17,xx+38,yy);g.stroke();
  }
  for(const e of enemies){
    const c=e.stormCaught;if(!c||e.hp<=0||e.x<L-80||e.x>R+80||e.y<T-20||e.y>B+110)continue;
    const p=Math.max(0,Math.min(1,(c.age-c.delay)/c.duration));
    g.save();g.translate(c.x,c.y);g.globalAlpha=fade*(.25+p*.35);
    g.save();g.globalAlpha=fade*.10;g.fillStyle='#a5a2c2';g.beginPath();g.moveTo(-5,3);
    g.bezierCurveTo(-8,-23,-18,-42,-34,-67);g.quadraticCurveTo(0,-79,34,-67);
    g.bezierCurveTo(18,-42,8,-23,5,3);g.closePath();g.fill();g.restore();
    for(let i=0;i<5;i++){
      const w=8+i*6,yy=-i*14+Math.sin(age/130+i)*2,spin=age/160+i*.7;
      g.strokeStyle=i%2?'#b2a5c8':'#839db0';g.lineWidth=2.2;
      g.beginPath();g.ellipse(Math.sin(spin)*4,yy,w,w*.24,0,spin,spin+Math.PI*1.6);g.stroke();
    }
    g.globalAlpha=fade*.22;g.fillStyle='#b5a4c9';g.beginPath();g.ellipse(0,5,21,8,0,0,7);g.fill();g.restore();
  }
  g.restore();
}
function devTestCompass(){
  if(!DRAGON_ADMIN_ENABLED||!running||paused||dragonFinale)return false;
  P.x=WORLD/2;P.y=WORLD/2+165;pointer.active=false;
  P.hurt=Math.max(P.hurt,6000);
  for(const s of arenaSecrets)if(!s.lit)triggerArenaSecret(s.kind,s.x,s.y);
  return true;
}
function updateArenaSecrets(dt){
  if(!running||paused||dragonFinale)return;
  for(const s of arenaSecrets)if(s.lit)s.age=Math.min(60000,s.age+dt);
  if(arenaSecretComplete)arenaSecretTime=Math.min(60000,arenaSecretTime+dt);
}
function secretPetal(g,x,y,a,r,col){
  g.save();g.translate(x,y);g.rotate(a);g.strokeStyle='#6b9697';g.lineWidth=1.2;
  g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(-r*.55,-r*.55,0,-r);g.quadraticCurveTo(r*.55,-r*.55,0,0);
  g.fillStyle=col;g.fill();g.stroke();g.restore();
}
function drawArenaSecrets(g,L,R,T,B){
  for(const s of arenaSecrets){
    if(s.x+150<L||s.x-150>R||s.y+160<T||s.y-160>B)continue;
    const u=Math.min(1,s.age/1400),bloom=1-Math.pow(1-u,3),clock=s.age;
    g.save();g.translate(s.x,s.y);g.lineCap='round';g.lineJoin='round';
    if(s.kind==='mine'){
      if(s.lit){
        g.globalAlpha=.13+.04*Math.sin(clock/750);g.fillStyle='#e9bc55';g.beginPath();g.arc(0,0,105,0,7);g.fill();
        g.globalAlpha=1;g.strokeStyle='#d2a241';g.lineWidth=3;
        g.beginPath();g.arc(0,0,105,-Math.PI/2,-Math.PI/2+Math.PI*2*bloom);g.stroke();
        g.strokeStyle='#fff0b3';g.lineWidth=1.6;g.beginPath();g.arc(0,0,99,0,7);g.stroke();
        for(let i=0;i<8;i++){g.save();g.rotate(i*Math.PI/4);g.globalAlpha=.35+.55*bloom;
          spoly(g,[[0,-89],[5,-75],[0,-80],[-5,-75]],'#f1cb67');g.restore();}
      }
      // Three small seals are lit as discoveries are made, without a HUD panel.
      for(const [i,kind] of ['mine','nade','ice'].entries()){
        const lit=arenaSecrets.some(q=>q.kind===kind&&q.lit),x=(i-1)*19;
        g.strokeStyle=lit?'#b89543':'rgba(160,137,94,.35)';g.lineWidth=1;
        scircle(g,x,76,5,lit?(kind==='ice'?'#a8dedf':'#efd388'):'rgba(236,222,196,.3)');
      }
      if(arenaSecretComplete){
        // A small constellation dragon, not a finale / collectible dragon.
        const a=arenaSecretTime/1100;g.save();g.translate(0,-18+Math.sin(a)*4);
        g.globalAlpha=Math.min(1,arenaSecretTime/900)*.82;g.strokeStyle='#b88a2e';g.lineWidth=1.5;
        const pts=[[-33,0],[-18,-21],[-6,-9],[0,4],[8,-10],[22,-23],[33,-2],[11,0],[5,13],[-7,18],[-22,12]];
        g.beginPath();g.moveTo(...pts[0]);for(const p of pts.slice(1))g.lineTo(...p);g.stroke();
        for(const [x,y] of pts)scircle(g,x,y,2.2,'#fff1b7');
        sline(g,5,13,15,12);sline(g,15,12,20,6);scircle(g,20,6,2,'#fff1b7');g.restore();
      }
    }else if(s.kind==='nade'){
      g.fillStyle='rgba(101,85,52,.10)';g.beginPath();g.ellipse(0,11,40,22,0,0,7);g.fill();
      g.strokeStyle='#978b70';g.lineWidth=1.7;
      if(!s.lit){
        spoly(g,[[-28,8],[-20,-19],[0,-29],[24,-16],[29,9],[8,23],[-16,19]],'#d3c6a8');
        g.strokeStyle='#81765f';sline(g,0,-24,-5,-8);sline(g,-5,-8,6,1);sline(g,6,1,-1,19);
        // A tiny fuse engraving rewards paying attention to the rock.
        scircle(g,13,6,4,'#c3b591');sline(g,14,2,17,-2);sline(g,17,-2,20,0);
      }else{
        for(let i=0;i<7;i++){const a=i*6.283/7,x=Math.cos(a)*(26+12*bloom),y=Math.sin(a)*24;
          spoly(g,[[x-7,y-3],[x,y-8],[x+7,y],[x+3,y+6],[x-6,y+5]],'#cabc9f');}
        // Surprise: a tiny golden duck wearing a crown rises out of the rubble.
        g.save();g.translate(0,10-23*bloom+Math.sin(clock/600)*2);g.scale(.4+.6*bloom,.4+.6*bloom);
        g.strokeStyle='#a37d34';g.lineWidth=1.7;
        g.beginPath();g.ellipse(-2,5,15,10,0,0,7);g.fillStyle='#e8c35f';g.fill();g.stroke();
        scircle(g,9,-5,8,'#f0d277');spoly(g,[[15,-5],[23,-2],[15,0]],'#d99545');
        g.strokeStyle='#665233';scircle(g,11,-7,1.2,'#665233');
        g.strokeStyle='#b48b36';spoly(g,[[3,-12],[1,-20],[7,-17],[11,-22],[14,-16],[18,-19],[16,-11]],'#f4dd89');
        g.strokeStyle='#c69e43';sline(g,-10,5,1,8);g.restore();
      }
    }else{
      g.strokeStyle=s.lit?'#7cb2b9':'#b0a88e';g.lineWidth=1.4;
      g.beginPath();g.ellipse(0,4,39,28,0,0,7);g.fillStyle=s.lit?'rgba(131,209,216,.22)':'rgba(174,172,139,.13)';g.fill();g.stroke();
      for(let i=0;i<8;i++){const a=i*Math.PI/4,x=Math.cos(a)*35,y=Math.sin(a)*24+4;
        spoly(g,[[x-5,y],[x-2,y-5],[x+5,y-3],[x+6,y+3],[x,y+5]],s.lit?'#c5d9cf':'#d4cbb3');}
      if(!s.lit){g.strokeStyle='#9eaa94';g.lineWidth=1;sline(g,-9,8,9,-8);sline(g,-9,-8,9,8);sline(g,0,-12,0,12);}
      else{
        g.save();g.translate(0,-4-Math.sin(clock/900)*2);g.scale(bloom,bloom);
        for(let i=0;i<8;i++)secretPetal(g,0,3,i*Math.PI/4,26,i%2?'#d9f2e9':'#9dd6d7');
        g.strokeStyle='#8caf9d';scircle(g,0,3,6,'#f2e6a7');g.restore();
        g.strokeStyle='rgba(151,216,214,.5)';g.beginPath();g.ellipse(0,4,14+18*((clock%2200)/2200),9+12*((clock%2200)/2200),0,0,7);g.stroke();
      }
    }
    if(s.lit&&clock<2200){
      g.strokeStyle=s.kind==='ice'?'#8bc9d2':'#d7b052';g.lineWidth=1.3;g.globalAlpha=Math.max(0,1-clock/2200);
      for(let i=0;i<10;i++){const a=i*2.399,r=18+clock*.025,x=Math.cos(a)*r,y=Math.sin(a)*r*.55-clock*.018;
        sline(g,x-2,y,x+2,y);sline(g,x,y-2,x,y+2);}
    }
    g.restore();
  }
}
