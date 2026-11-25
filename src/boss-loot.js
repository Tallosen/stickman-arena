"use strict";
// Ordinary trophies open in the live arena; only final pickup is cinematic.
let bossLoot=null,bossLootOpening=null;
const bossLootWaiting=[];
const bossLootNotices=[];
function bossLootLocked(){return bossLootOpening?.q.stage===20||bossLoot?.stage===20;}
function allBossLoot(){return bossLoot?[bossLoot,...bossLootWaiting]:bossLootWaiting;}
const bossLootCollected=new Set();
function resetBossLoot(){bossLoot=null;bossLootOpening=null;bossLootWaiting.length=0;bossLootNotices.length=0;bossLootCollected.clear();}
function dropBossLoot(stage,enemy){
 if(allBossLoot().some(q=>q.stage===stage)||bossLootCollected.has(stage))return false;
 let point=enemyFreePoint(enemy.x+26,enemy.y+18,28);
 // The final trophy lands within a short, collision-free walk. No homing or AFK timer.
 if(stage===20&&(!petPathClear(P.x,P.y,point.x,point.y,P.r)||Math.hypot(point.x-P.x,point.y-P.y)>240)){
  point={x:P.x,y:P.y};
  for(let i=0;i<24;i++){const a=i*Math.PI/12,x=P.x+Math.cos(a)*150,y=P.y+Math.sin(a)*150;
   if(petPathClear(P.x,P.y,x,y,Math.max(28,P.r))){point={x,y};break;}}
 }
 const q={stage,x:point.x,y:point.y,fromX:enemy.x,fromY:enemy.y,age:0,landed:false,
  color:stage===20?'#e3b54a':enemy.bossSpec?.color||'#85669b',
  reward:null,error:false};
 if(stage===20){if(bossLoot)bossLootWaiting.unshift(bossLoot);bossLoot=q;}
 else if(bossLoot)bossLootWaiting.push(q);else bossLoot=q;
 if(stage!==20)return true;
 // Survivors retreat without awarding kills/XP; no new attacks in the recovery interval.
 enemies=[];bossMarks=[];bossProjectiles=[];dragonAssist=null;resetEnemyHazards();
 shots=[];nades=[];booms=[];flashes=[];hitStop=0;shake=0;P.muzzle=0;P.recoilT=0;P.laserBeam=null;P.laserTick=0;
 ult.on=false;ult.zoom=1;ult.rot=0;ult.lift=0;ult.trail=[];ult.stageX=0;ult.stageY=0;
 document.body.classList.remove('sniper-cinematic');document.getElementById('levelup')?.classList.add('hidden');
 paused=false;userPaused=false;pointer.active=false;return true;
}
function pickupBossLoot(q=bossLoot){
 if(!q||!running||paused||q.age<1250||Math.hypot(P.x-q.x,P.y-q.y)>(q.stage===20?52:38)||(typeof Playables!=='undefined'&&Playables.blocked))return false;
 if(bossLootOpening||bossRewardPending||ult.on)return false;
 if(bossLootCollected.has(q.stage))return false;
 if(q.error&&q.age<q.retryAt)return false;
 bossLootOpening={q,age:0};
 if(q.stage===20){pointer.active=false;P.run=0;SFX.chest?.();}
 P.hurt=Math.max(P.hurt,1000);return true;
}
function finishBossLootOpening(){
 if(typeof runSaveAction==='function'&&!runSaveDepth)return runSaveAction(()=>finishBossLootOpening(),true);
 if(typeof requestRunCheckpoint==='function')requestRunCheckpoint();
 const q=bossLootOpening.q;bossLootOpening=null;
 const remove=()=>{if(bossLoot===q)bossLoot=bossLootWaiting.shift()||null;else bossLootWaiting.splice(bossLootWaiting.indexOf(q),1);};
 if(q.stage===20){
  // The recovered final trophy opens a real choice; no reward or ending yet.
  bossLoot=null;bossLootNotices.length=0;offerBossReward(20);
 }else{
  // Roll only when opened, against the current build. Keep it on save retry.
  if(!q.reward){const pool=bossRewardOptions(q.stage,true);q.reward=pool[Math.floor(Math.random()*pool.length)];}
  if(typeof localizedBossReward==='function')q.reward=localizedBossReward(q.reward);
  const option=q.reward,notice={stage:q.stage,title:option.title,impact:bossRewardImpact(option),category:bossRewardCategory(option),age:0};
  const icon=document.createElement('canvas');icon.width=icon.height=96;drawBossRewardIcon(icon.getContext('2d'),option,96);notice.icon=icon;
  if(!grantBossReward(option)){q.error=true;q.retryAt=q.age+1500;return false;}
  remove();bossLootNotices.push(notice);P.hurt=Math.max(P.hurt,1000);SFX.chest?.();
 }
 bossLootCollected.add(q.stage);return true;
}
function updateBossLootNotice(dt){
 if(!running||paused||ult.on||(typeof Playables!=='undefined'&&Playables.blocked))return;
 if(typeof hudNoticePriority==='function'&&hudNoticePriority()==='menu')return;
 const n=bossLootNotices[0];if(!n)return;n.age+=Math.max(0,Math.min(1000,dt));if(n.age>=4200)bossLootNotices.shift();
}
function drawBossLootNotice(g){
 const n=bossLootNotices[0];if(!n||!running||ult.on||bossRewardPending)return;
 if(typeof hudNoticePriority==='function'&&hudNoticePriority()==='menu')return;
 const box=typeof arenaHUDLayout==='function'?arenaHUDLayout().notice:{w:Math.min(360,W-24),x:(W-Math.min(360,W-24))/2,y:118};
 const {w,x,y}=box;
 g.save();g.globalAlpha=Math.min(1,(4200-n.age)/400);g.fillStyle='#fff4dfee';g.strokeStyle='#b79457';g.lineWidth=1.5;
 g.beginPath();g.roundRect(x,y,w,116,13);g.fill();g.stroke();
 g.fillStyle='#eedcb4';g.beginPath();g.roundRect(x+9,y+30,38,38,9);g.fill();g.drawImage(n.icon,x+10,y+31,36,36);
 const wrap=(text,xx,yy,width,step)=>{if(typeof hudWrappedText==='function')hudWrappedText(g,text,xx,yy,width,step);else g.fillText(text,xx,yy,width);};
 g.textAlign='left';g.fillStyle='#947035';g.font='800 10px system-ui';g.fillText(n.header||bossText('НАГРАДА БОССА · ','BOSS REWARD · ')+n.stage,x+10,y+18,w-20);
 g.fillStyle='#493624';g.font='800 13px system-ui';wrap(n.title,x+54,y+43,w-64,16);
 g.font='700 11px system-ui';g.fillStyle='#72552f';wrap(n.impact||bossText('Все запасы заполнены','All supplies are full'),x+10,y+81,w-20,13);
 g.fillStyle='#88765a';g.font='10px system-ui';g.fillText(n.category,x+10,y+108,w-20);g.restore();
}
function updateBossLoot(dt,activeMs=dt){
 const q=bossLoot;if(!q||!running||paused||(typeof Playables!=='undefined'&&Playables.blocked))return;
 const step=Math.max(0,Math.min(100,dt)),elapsed=Math.max(0,Math.min(1000,activeMs)),k=step/16.67;
 for(const bag of allBossLoot()){
  bag.age+=elapsed;if(bag.age>=900&&!bag.landed){bag.landed=true;SFX.crateLand?.(bag.x);}
 }
 if(bossLootOpening){bossLootOpening.age+=step;if(bossLootOpening.age>=650)finishBossLootOpening();return;}
 if(q.stage!==20){for(const bag of allBossLoot())if(pickupBossLoot(bag))break;return;}
 t+=step;updateNightLighting(elapsed);
 updateDamageFeedback(elapsed);P.hurt=Math.max(0,P.hurt-step);
 let walking=false;
 pointer.active=false;
 if(q.age>=1000){const x=P.x,y=P.y;petMove(P,q.x,q.y,2.5,k);walking=Math.hypot(P.x-x,P.y-y)>.1;
  if(walking){P.phase+=.23*k;P.aim=Math.atan2(P.y-y,P.x-x);}}
 if(P.pet&&P.pet.dead<=0){const p=P.pet;p.hurt=0;p.state='up';p.burrow=null;p.bite=0;
  const d=petMove(p,q.x-45,q.y+28,3.7,k);p.phase+=d>6?.3*k:0;p.aim=Math.atan2(q.y-p.y,q.x-p.x);}
 P.run+=(Number(walking)-P.run)*Math.min(1,.10*k);pushOut(P);
 cam.x=Math.max(0,Math.min(WORLD-W,P.x-W/2));cam.y=Math.max(0,Math.min(WORLD-H,P.y-H/2));
 for(const p of pops){p.y-=.4*k;p.life-=step/750;}pops=pops.filter(p=>p.life>0);
 for(const p of puffs)p.life-=step/400;puffs=puffs.filter(p=>p.life>0);
 for(const c of corpses)c.life-=step/550;corpses=corpses.filter(c=>c.life>0);
 pickupBossLoot();
}
function drawBossLoot(g){
 for(const q of allBossLoot())drawBossLootBag(g,q);
}
function drawBossLootBag(g,q){
 const u=Math.min(1,q.age/900),ease=u*u*(3-2*u),x=q.fromX+(q.x-q.fromX)*ease,y=q.fromY+(q.y-q.fromY)*ease;
 const lift=u<1?Math.sin(u*Math.PI)*78+26*(1-u):q.age<1250?Math.sin((q.age-900)/350*Math.PI)*9:Math.sin(q.age/430)*2;
 const pulse=.5+.5*Math.sin(q.age/300),scale=q.stage===20?1.05:.90;
 g.save();g.translate(x,y);g.lineCap='round';g.lineJoin='round';
 g.fillStyle='rgba(234,193,97,.12)';g.beginPath();g.ellipse(0,5,45+pulse*3,19,0,0,7);g.fill();
 g.strokeStyle='#e8bc5a';g.lineWidth=2;g.beginPath();g.ellipse(0,5,38,15,0,0,7);g.stroke();
 g.fillStyle='rgba(89,64,34,.18)';g.beginPath();g.ellipse(0,6,21,7,0,0,7);g.fill();
 if(u===1){const beam=g.createLinearGradient(0,-125,0,0);beam.addColorStop(0,'rgba(255,218,119,0)');beam.addColorStop(1,'rgba(255,218,119,.26)');g.fillStyle=beam;g.fillRect(-13,-125,26,122);}
 g.translate(0,-lift);g.rotate(u<1?Math.sin(u*Math.PI)*.30:0);g.scale(scale,scale);
 g.strokeStyle='#584b38';g.lineWidth=2.5;
 const box=(a,b,w,h,color,r=5)=>{g.fillStyle=color;g.beginPath();g.roundRect(a,b,w,h,r);g.fill();g.stroke();};
 box(-11,-48,22,13,'#c3a373',4);box(-25,-30,9,25,'#9e835f',4);box(16,-30,9,25,'#9e835f',4);
 const opening=bossLootOpening?.q===q?Math.min(1,bossLootOpening.age/650):0;
 box(-19,-39,38,40,q.color,8);box(-19,-39-opening*16,38,13,'#e8d7ae',6);box(-13,-16,26,15,'#a98756',4);
 if(opening){g.save();g.globalAlpha=Math.sin(opening*Math.PI);for(let i=0;i<(q.stage===20?3:1);i++){
  const xx=q.stage===20?(i-1)*24:0,yy=-48-Math.sin(opening*Math.PI/2)*35+i%2*6;
  g.fillStyle=['#efc45e','#ba99d4','#85bfae'][i];g.strokeStyle='#fff4c9';g.beginPath();g.roundRect(xx-7,yy,14,18,3);g.fill();g.stroke();
  g.strokeStyle='#68533c';g.lineWidth=1.5;
  if(i===0){sline(g,xx,yy+3,xx,yy+14);sline(g,xx-4,yy+11,xx+4,yy+11);}
  else if(i===1){sline(g,xx+2,yy+3,xx-3,yy+10);sline(g,xx-3,yy+10,xx+3,yy+9);sline(g,xx+3,yy+9,xx-2,yy+15);}
  else{g.strokeRect(xx-4,yy+6,8,7);sline(g,xx,yy+5,xx,yy+14);}
 }g.restore();}
 g.strokeStyle='#ffefbf';g.lineWidth=2;sline(g,-12,-22,-12,-30);sline(g,12,-22,12,-30);
 g.strokeStyle='#695037';box(-4,-29,8,10,'#f6d376',2);
 if(q.stage===20){const points=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?3:7;points.push([Math.cos(a)*r,-9+Math.sin(a)*r]);}spoly(g,points,'#ffe69a');}
 g.restore();
}
function drawBossLootGuide(g){
 for(const q of allBossLoot()){
  if(bossLootOpening?.q===q)continue;
  const sx=q.x-cam.x,sy=q.y-cam.y,off=sx<36||sx>W-36||sy<115||sy>H-110;
  const x=Math.max(40,Math.min(W-40,sx)),y=Math.max(112,Math.min(H-110,sy));
  g.save();g.textAlign='center';g.font='700 11px system-ui';
  const text=q.error?bossText('Ошибка сохранения · повторяем…','Save failed · retrying…'):bossText('Трофей · ','Trophy · ')+q.stage;
  const width=Math.min(210,g.measureText(text).width+20);
  const label=typeof hudWorldLabelRect==='function'?hudWorldLabelRect(x,y-86,width):{x:Math.max(8,Math.min(W-width-8,x-width/2)),y:y-86,w:width,h:23};
  if(label){g.fillStyle='#fff1d3';g.strokeStyle='#bf964e';g.lineWidth=1;
    g.beginPath();g.roundRect(label.x,label.y,label.w,label.h,7);g.fill();g.stroke();
    g.fillStyle='#775021';g.fillText(text,label.x+label.w/2,label.y+16,label.w-12);}
  if(off){g.translate(x,y-40);g.rotate(Math.atan2(sy-y,sx-x));g.fillStyle='#d89129';g.strokeStyle='#fff1cc';g.lineWidth=2;
   g.beginPath();g.moveTo(12,0);g.lineTo(-7,-8);g.lineTo(-3,0);g.lineTo(-7,8);g.closePath();g.fill();g.stroke();}
  g.restore();
 }
}
