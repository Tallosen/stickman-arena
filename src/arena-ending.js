"use strict";
// Presentation only. Victory/rewards are committed before this skippable epilogue.
let arenaEnding=null,arenaEndingBackdrop=null;
const endingEase=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
function resetArenaEnding(){
 arenaEnding=null;arenaEndingBackdrop=null;document.getElementById('arenaEnding')?.classList.add('hidden');
 document.body.classList.remove('arena-ending','ending-results');
}
function startArenaEnding(reward=null){
 if(arenaEnding||!P.runWon)return false;
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 let frame=null;
 // Freeze the last real arena frame; never advance enemies while celebrating.
 try{if(cv.width&&cv.height){frame=document.createElement('canvas');frame.width=cv.width;frame.height=cv.height;frame.getContext('2d').drawImage(cv,0,0);}}catch(_){frame=null;}
 arenaEnding={age:0,duration:reduced?3200:8200,reduced,frame,gear:{...P.gear,_w:P.wtype},pet:P.pet?{type:P.pet.type,lvl:P.pet.lvl||1}:null,chapter:-1,sounded:false};
 // This is a receipt of the already-saved grant, never another reward operation.
 arenaEnding.reward=reward?{...reward,total:reward.kind==='supply'?inventory[reward.key]:null}:null;
 arenaEnding.rewardDuration=reward?3400:0;
 if(reward){const art=document.createElement('canvas');art.width=160;art.height=160;drawBossRewardIcon(art.getContext('2d'),reward,160);arenaEnding.rewardArt=art;}
 document.body.classList.add('arena-ending');document.body.classList.remove('ending-results');
 document.getElementById('dragonVictory').classList.add('hidden');
 document.getElementById('arenaEnding').classList.remove('hidden');
 if(typeof syncHUD==='function')syncHUD();
 const skip=document.getElementById('btnEndingSkip');skip.textContent=bossText('К итогам →','View results →');skip.disabled=true;
 document.getElementById('endingEyebrow').textContent=bossText('20 / 20 · АРЕНА ОСВОБОЖДЕНА','20 / 20 · ARENA LIBERATED');
 updateArenaEnding(0);document.getElementById('endingTitle').focus?.({preventScroll:true});
 stopGameSounds();return true;
}
function completeArenaEnding(){
 if(!arenaEnding||arenaEnding.age<arenaEnding.rewardDuration||(typeof Playables!=='undefined'&&Playables.blocked))return false;
 try{if(cv.width&&cv.height){arenaEndingBackdrop=document.createElement('canvas');arenaEndingBackdrop.width=cv.width;arenaEndingBackdrop.height=cv.height;arenaEndingBackdrop.getContext('2d').drawImage(cv,0,0);}}catch(_){arenaEndingBackdrop=null;}
 arenaEnding=null;document.getElementById('arenaEnding').classList.add('hidden');
 document.body.classList.remove('arena-ending');document.body.classList.add('ending-results');
 document.getElementById('dragonVictory').classList.remove('hidden');
 document.getElementById('btnVictoryMenu')?.focus?.({preventScroll:true});return true;
}
function updateArenaEnding(dt){
 const s=arenaEnding;if(!s||paused||(typeof Playables!=='undefined'&&Playables.blocked))return;
 s.age+=Math.max(0,Math.min(100,Number(dt)||0));
 const sceneAge=Math.max(0,s.age-s.rewardDuration),receipt=s.age<s.rewardDuration;
 if(receipt){
  document.getElementById('arenaEnding').classList.remove('ending-day');
  document.getElementById('endingEyebrow').textContent=bossText('ТРОФЕЙ ЧЕМПИОНА · ПОЛУЧЕНО','CHAMPION TROPHY · RECEIVED');
  document.getElementById('endingTitle').textContent=s.reward.kind==='continue'?bossText('Все запасы заполнены','All supplies are full'):s.reward.title;
  document.getElementById('endingSubtitle').textContent=s.reward.kind==='supply'?bossText('Сохранено для следующих забегов · в запасе: ','Saved for future runs · in stock: ')+s.reward.total:bossText('Лимит достигнут — впереди заслуженный финал','Limit reached — your finale awaits');
  document.getElementById('btnEndingSkip').disabled=true;return;
 }
 const phase=sceneAge/s.duration,chapter=phase<.24?0:phase<.70?1:2;
 document.getElementById('arenaEnding').classList.toggle('ending-day',phase>=.34);
 if(chapter!==s.chapter){
  s.chapter=chapter;
  document.getElementById('endingEyebrow').textContent=bossText('20 / 20 · АРЕНА ОСВОБОЖДЕНА','20 / 20 · ARENA LIBERATED');
  document.getElementById('endingTitle').textContent=[bossText('Последний бой позади','The last battle is over'),bossText('Ты встретил рассвет','You made it to dawn'),bossText('Лагерь ждёт героя','Your camp awaits')][chapter];
  document.getElementById('endingSubtitle').textContent=[bossText('Четыре босса повержены. Арена снова свободна.','Four bosses defeated. The arena is free again.'),bossText('Двадцать стадий. Один победитель.','Twenty stages. One champion.'),bossText('Награда получена. Пора вернуться домой.','Reward claimed. Time to head home.')][chapter];
 }
 document.getElementById('btnEndingSkip').disabled=sceneAge<700;
 if(!s.sounded&&sceneAge>=1000){s.sounded=true;SFX.victory?.();}
 if(sceneAge>=s.duration)completeArenaEnding();
}
function drawArenaEndingBackdrop(g){
 if(!arenaEndingBackdrop)return false;
 g.save();g.setTransform(DPR,0,0,DPR,0,0);g.drawImage(arenaEndingBackdrop,0,0,arenaEndingBackdrop.width,arenaEndingBackdrop.height,0,0,W,H);g.restore();return true;
}
function drawArenaRewardReceipt(g,s){
 const fade=endingEase(s.age/260)*(1-endingEase((s.age-s.rewardDuration+280)/280));
 const short=H<480,w=Math.min(330,W-36),h=short?142:230,cx=W/2,cy=H*.55;
 g.save();g.setTransform(DPR,0,0,DPR,0,0);g.fillStyle='#282c43';g.fillRect(0,0,W,H);
 if(s.frame)g.drawImage(s.frame,0,0,s.frame.width,s.frame.height,0,0,W,H);
 g.fillStyle='rgba(24,27,43,.32)';g.fillRect(0,0,W,H);g.globalAlpha=fade;
 g.translate(cx,cy+(s.reduced?0:12*(1-endingEase(s.age/400))));
 g.fillStyle='#fff1d5';g.strokeStyle='#d2aa57';g.lineWidth=2;g.beginPath();g.roundRect(-w/2,-h/2,w,h,22);g.fill();g.stroke();
 const size=short?90:140,iy=-h/2+10;
 if(s.rewardArt)g.drawImage(s.rewardArt,-size/2,iy,size,size);
 if(s.reward.kind==='supply'){
  g.fillStyle='#cb681c';g.beginPath();g.roundRect(size/2-20,iy+size-32,48,30,15);g.fill();
  g.fillStyle='#fff8e6';g.textAlign='center';g.font='800 18px system-ui';g.fillText('+1',size/2+4,iy+size-11);
 }
 g.textAlign='center';g.fillStyle='#77552e';g.font='700 '+(short?12:15)+'px system-ui';
 const line=s.reward.kind==='supply'?bossText('В запасе: ','In stock: ')+s.reward.total:bossText('Запас 999 / 999','Stock 999 / 999');
 g.fillText(line,0,h/2-(short?17:43),w-26);
 if(!short){g.fillStyle='#987749';g.font='12px system-ui';g.fillText(s.reward.kind==='supply'?bossText('Награда сохранена','Reward saved'):bossText('Лимит запасов достигнут','Stock limit reached'),0,h/2-20,w-26);}
 g.restore();
}
function drawArenaEnding(g){
 const s=arenaEnding;if(!s)return;
 if(s.age<s.rewardDuration){drawArenaRewardReceipt(g,s);return;}
 const sceneAge=Math.max(0,s.age-s.rewardDuration);
 const progress=sceneAge/s.duration,dawn=endingEase(progress/.67),fade=endingEase(sceneAge/(s.reduced?350:1200));
 const stable=g.vackyStableSketch;g.vackyStableSketch=true;g.save();g.setTransform(DPR,0,0,DPR,0,0);
 g.clearRect(0,0,W,H);g.fillStyle='#282c43';g.fillRect(0,0,W,H);
 if(s.frame)g.drawImage(s.frame,0,0,s.frame.width,s.frame.height,0,0,W,H);
 if(s.rewardDuration&&sceneAge<500){g.fillStyle='rgba(24,27,43,'+(.32*(1-endingEase(sceneAge/500)))+')';g.fillRect(0,0,W,H);}
 g.globalAlpha=fade;
 const color=(a,b)=>'rgb('+a.map((v,i)=>Math.round(v+(b[i]-v)*dawn)).join(',')+')';
 const sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,color([33,39,67],[246,229,191]));sky.addColorStop(1,color([112,100,114],[249,239,214]));g.fillStyle=sky;g.fillRect(0,0,W,H);
 // Dawn is gradual, not a full-screen flash; no camera shake or random geometry.
 const sunX=W*.73,sunY=H*(.45-.18*dawn),sunR=Math.min(W,H)*.08;
 g.fillStyle=color([192,186,185],[244,198,111]);g.beginPath();g.arc(sunX,sunY,sunR,0,Math.PI*2);g.fill();
 for(let layer=0;layer<3;layer++){
  g.fillStyle=[color([65,69,88],[205,200,165]),color([75,78,85],[197,190,148]),color([91,89,83],[219,204,162])][layer];
  g.beginPath();g.moveTo(0,H);
  for(let i=0;i<=16;i++)g.lineTo(W*i/16,H*(.49+layer*.095)-Math.sin(i*.72+layer)*H*.055-Math.cos(i*1.31)*H*.024);
  g.lineTo(W,H);g.closePath();g.fill();
 }
 g.save();g.translate(W/2,H*.71);const sc=Math.min(W/700,H/480);g.scale(sc,sc);g.lineCap='round';g.lineJoin='round';
 g.strokeStyle='#a59370';g.lineWidth=2;
 g.fillStyle='#e9dbb6';g.beginPath();g.ellipse(0,8,295,60,0,0,Math.PI*2);g.fill();g.stroke();
 g.strokeStyle='#cab98e';g.beginPath();g.ellipse(0,8,263,45,0,0,Math.PI*2);g.stroke();
 // The final banner mirrors the game's outlined camp props.
 const breeze=s.reduced?0:Math.sin(s.age/650)*5;
 g.strokeStyle='#766343';g.lineWidth=5;sline(g,158,12,158,-183);
 g.strokeStyle='#70557c';g.lineWidth=2;
 spoly(g,[[159,-180],[226,-175+breeze],[225,-99+breeze*.4],[192,-111],[159,-100]],'#805491');
 g.fillStyle='#f5d277';g.textAlign='center';g.font='800 26px system-ui';g.fillText('20',191,-133+breeze*.3);
 g.strokeStyle='#ad965f';g.lineWidth=2;scircle(g,158,-187,5,'#dfb357');
 for(const side of [-1,1]){
  g.strokeStyle='#9b835d';g.lineWidth=7;sline(g,side*270,1,side*270,-72);
  g.strokeStyle='#a3af7c';g.lineWidth=2;scircle(g,side*270,-87,32,'#afbd88');scircle(g,side*255,-111,26,'#c2cd96');
 }
 // Keep the real equipment. Only the pose changes; gameplay state is untouched.
 const breath=s.reduced?0:Math.sin(s.age/520)*.65,raise=s.reduced?.8:endingEase((progress-.22)/.24);
 const shoulder=[-7,-57+breath],a=2.02+raise*1.52,b=1.5-raise*2.55;
 const elbow=[shoulder[0]+Math.cos(a)*18,shoulder[1]+Math.sin(a)*18];
 const hand=[elbow[0]+Math.cos(b)*18,elbow[1]+Math.sin(b)*18];
 const pose={lf:[10,0],lb:[-10,0],kf:[8,-19],kb:[-8,-19],hip:-36,neck:-60+breath,head:[0,-74+breath],af:[16,-34],ab:hand,sb:shoulder,eb:elbow,gunAt:[12,-34],lean:0,squash:1};
 g.fillStyle='rgba(102,83,49,.16)';g.beginPath();g.ellipse(0,9,47,11,0,0,7);g.fill();
 drawHero(g,0,0,1,0,s.gear,2.05,.48,0,pose,1);
 if(s.pet){
  const arrival=s.reduced?1:endingEase((progress-.17)/.34),x=-320+arrival*214,phase=arrival<1?s.age/65:0;
  g.save();g.translate(x,19);g.scale(1.3,1.3);drawPet(g,0,0,s.pet.type,s.pet.lvl,1,phase,{state:'up',aim:0,bite:0,saw:0,menuTime:s.age/1000,menuHappy:1,menuScene:true});g.restore();
 }
 if(!s.reduced&&!(typeof visualSettings!=='undefined'&&visualSettings.lowFX)){
  // A few slow golden motes, not a blinding explosion or confetti wall.
  g.globalAlpha=fade*endingEase((progress-.3)/.2)*.6;g.fillStyle='#fff2b4';
  for(let i=0;i<16;i++){const x=Math.sin(i*2.39)*225,y=-30-((s.age*.017+i*19)%155);g.beginPath();g.arc(x,y,1.4+i%2*.5,0,7);g.fill();}
 }
 g.restore();g.restore();g.vackyStableSketch=stable;
}
document.getElementById('btnEndingSkip')?.addEventListener('click',event=>{event.stopPropagation();if(arenaEnding&&arenaEnding.age>=arenaEnding.rewardDuration+700)completeArenaEnding();});
document.getElementById('arenaEnding')?.addEventListener('keydown',event=>{
 if(!arenaEnding)return;
 if(event.key==='Tab'){event.preventDefault();(arenaEnding.age>=arenaEnding.rewardDuration+700?document.getElementById('btnEndingSkip'):document.getElementById('endingTitle')).focus?.();}
 if(event.key==='Escape'&&arenaEnding.age>=arenaEnding.rewardDuration+700){event.preventDefault();event.stopPropagation();completeArenaEnding();}
});
