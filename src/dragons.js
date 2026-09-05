"use strict";
/* dragons.js — финальная осада, спасение драконом и постоянная книга достижений */

const DRAGON_TYPES = [
  { id:"green",   name:"ЗЕЛЁНЫЙ ДРАКОН",       weight:40, rarity:"ОБЫЧНЫЙ",       col:"#4d9650", dark:"#285a35", wing:"#89bf67", accent:"#d7ee8d", breath:"#9bd866" },
  { id:"blue",    name:"СИНИЙ ДРАКОН",         weight:20, rarity:"НЕОБЫЧНЫЙ",     col:"#397fb9", dark:"#24517d", wing:"#74b9db", accent:"#d8f5ff", breath:"#73cef2" },
  { id:"violet",  name:"ФИОЛЕТОВЫЙ ДРАКОН",    weight:10, rarity:"РЕДКИЙ",        col:"#7545a7", dark:"#432568", wing:"#a86ed1", accent:"#edc6ff", breath:"#b678ec" },
  { id:"pink",    name:"РОЗОВЫЙ ДРАКОН",       weight:5,  rarity:"ЭПИЧЕСКИЙ",     col:"#cf568c", dark:"#81365f", wing:"#ef8fba", accent:"#ffe0ed", breath:"#ff8fc1" },
  { id:"blackgold",name:"ЧЁРНО-ЗОЛОТОЙ ДРАКОН",weight:3,  rarity:"ЛЕГЕНДАРНЫЙ",   col:"#26241f", dark:"#11100e", wing:"#4b4539", accent:"#e9bc35", breath:"#e4a126" },
  { id:"gold",    name:"ЗОЛОТОЙ ДРАКОН",       weight:1.5,rarity:"МИФИЧЕСКИЙ",    col:"#d69b19", dark:"#88560a", wing:"#f0c348", accent:"#fff3a8", breath:"#ffd44d" },
  { id:"diamond", name:"БРИЛЛИАНТОВЫЙ ДРАКОН", weight:.5, rarity:"БРИЛЛИАНТОВЫЙ",col:"#8bdde3", dark:"#377f9a", wing:"#c4f5f7", accent:"#ffffff", breath:"#b4f5ff" },
];
const DRAGON_KEY="vacky_stickman_dragons_v1";
const dragonCollection=dragonProfile.counts;
let dragonFinale=null;
let forcedDragonId=null;
let dragonAltar=null;
const ALTAR_HOLD_MS=2000;

// Один алтарь на забег; место под весь круг проверяется на препятствия.
function unlockDragonAltar(){
  if(dragonAltar||dragonFinale||!heroBuildComplete())return;
  const clear=(x,y)=>x>150&&y>150&&x<WORLD-150&&y<WORLD-150&&
    Math.hypot(x-P.x,y-P.y)>380&&
    props.every(o=>Math.hypot(x-o.x,y-o.y)>o.r+130);
  let spot=null;
  for(let i=0;i<160&&!spot;i++){
    const a=Math.random()*Math.PI*2,r=480+Math.random()*430;
    const x=P.x+Math.cos(a)*r,y=P.y+Math.sin(a)*r;
    if(clear(x,y))spot={x,y};
  }
  // Детерминированный запасной поиск, если герой стоит у края карты.
  if(!spot)for(let y=180;y<WORLD-120&&!spot;y+=110)
    for(let x=180;x<WORLD-120&&!spot;x+=110)if(clear(x,y))spot={x,y};
  if(!spot)return;
  dragonAltar={...spot,r:80,hold:0,notice:8500};
  queuedLevels=0;P.xp=STAGE_XP;
  pops.push({x:P.x,y:P.y-72,txt:"АЛТАРЬ ОТКРЫТ · МЕТКА НА КАРТЕ",life:3,col:"#287e94"});
  SFX.chest();
}

function updateDragonAltar(dt){
  if(!running||paused||dragonFinale)return;
  if(!dragonAltar)unlockDragonAltar();
  const a=dragonAltar;if(!a)return;
  a.notice=Math.max(0,a.notice-dt);
  const inside=Math.hypot(P.x-a.x,P.y-a.y)<=a.r;
  // Движение внутри круга разрешено; только выход обнуляет призыв.
  if(!inside)a.hold=0;
  else a.hold=Math.min(ALTAR_HOLD_MS,a.hold+dt);
  if(a.hold>=ALTAR_HOLD_MS)startDragonFinale();
}

function drawDragonAltar(g){
  const a=dragonAltar;if(!a||dragonFinale||!running)return;
  g.save();g.translate(a.x,a.y);g.lineJoin="round";g.lineCap="round";
  const pulse=.5+.5*Math.sin(t/420),progress=a.hold/ALTAR_HOLD_MS;
  g.fillStyle="rgba(81,189,202,.12)";g.strokeStyle="#398994";g.lineWidth=2.5;
  g.beginPath();g.arc(0,0,a.r,0,Math.PI*2);g.fill();g.stroke();
  g.strokeStyle="rgba(66,157,171,.35)";g.lineWidth=7;
  g.beginPath();g.arc(0,0,a.r+7+pulse*3,0,Math.PI*2);g.stroke();
  for(let i=0;i<8;i++){
    const ang=i*Math.PI/4,x=Math.cos(ang)*a.r,y=Math.sin(ang)*a.r;
    g.save();g.translate(x,y);g.rotate(ang+Math.PI/4);
    g.fillStyle="#f4d37f";g.strokeStyle=INK;g.lineWidth=1.5;
    g.fillRect(-3,-3,6,6);g.strokeRect(-3,-3,6,6);g.restore();
  }
  if(progress>0){g.strokeStyle="#f1b840";g.lineWidth=6;g.beginPath();
    g.arc(0,0,a.r,-Math.PI/2,-Math.PI/2+progress*Math.PI*2);g.stroke();}
  // Стенд находится за центром круга, чтобы герой не накладывался на пьедестал.
  g.save();g.translate(0,-30);g.scale(1.25,1.25);g.strokeStyle=INK;g.lineWidth=2.8;
  spoly(g,[[-25,10],[25,10],[31,20],[-31,20]],"#857d72");
  spoly(g,[[-18,-6],[18,-6],[21,10],[-21,10]],"#b9ae97");
  spoly(g,[[-22,-9],[0,-18],[22,-9],[0,0]],"#e2ccb0");
  const bob=Math.sin(t/430)*3;
  g.save();g.translate(0,-32+bob);
  g.fillStyle="rgba(77,193,216,.18)";g.beginPath();g.arc(0,0,21+pulse*3,0,7);g.fill();
  spoly(g,[[0,-18],[12,0],[0,17],[-12,0]],"#86e0e5");
  g.strokeStyle="#e9ffff";g.lineWidth=1.5;sline(g,0,-14,0,12);
  // Золотые крылья — эмблема призыва на стенде.
  g.strokeStyle=INK;g.lineWidth=1.8;
  spoly(g,[[-12,1],[-29,-12],[-23,5],[-10,10]],"#e6bf59");
  spoly(g,[[12,1],[29,-12],[23,5],[10,10]],"#e6bf59");g.restore();
  g.restore();
  g.fillStyle=INK;g.textAlign="center";g.font="800 11px system-ui";
  g.fillText("АЛТАРЬ ДРАКОНА",0,a.r+27);
  g.font="700 10px system-ui";g.fillText("2 СЕК В КРУГЕ · МОЖНО БЕГАТЬ",0,a.r+41);
  g.restore();
}

function drawAltarRadar(g,x,y,s){
  const a=dragonAltar;if(!a||dragonFinale)return;
  g.save();g.translate(x+a.x*s,y+a.y*s);g.strokeStyle="#246f80";g.lineWidth=1.8;
  g.fillStyle="rgba(74,179,196,.22)";g.beginPath();g.arc(0,0,7+Math.sin(t/260)*1.5,0,7);g.fill();g.stroke();
  spoly(g,[[0,-5],[4,0],[0,5],[-4,0]],"#a7f1ef");g.restore();
}

function drawAltarGuide(g){
  const a=dragonAltar;if(!a||dragonFinale||!running)return;
  const d=Math.hypot(a.x-P.x,a.y-P.y),near=d<a.r+30;
  const title=a.hold>0?"ПРИЗЫВ "+Math.ceil((ALTAR_HOLD_MS-a.hold)/1000)+"…":
    near?"ПОБУДЬ В КРУГЕ 2 СЕК":"АЛТАРЬ ДРАКОНА · "+Math.round(d)+" м";
  const width=Math.min(286,W-24),xx=W/2,yy=H-198;
  g.save();g.fillStyle="rgba(253,246,232,.94)";g.strokeStyle="#398994";g.lineWidth=2;
  g.beginPath();g.roundRect(xx-width/2,yy,width,53,10);g.fill();g.stroke();
  g.fillStyle=INK;g.textAlign="center";g.font="800 "+(W<380?10:11)+"px system-ui";
  g.fillText(title,xx,yy+18);
  g.font="600 10px system-ui";g.fillText(near?"Выйди из круга, чтобы отменить":
    "Призови, когда решишь завершить забег",xx,yy+34);
  if(!near){
    const angle=Math.atan2(a.y-P.y,a.x-P.x);
    g.translate(xx,yy-17);g.rotate(angle);g.strokeStyle="#246f80";g.lineWidth=2;
    spoly(g,[[10,0],[-7,-6],[-3,0],[-7,6]],"#a7f1ef");
  }
  g.restore();
}

function dragonTotal(){return dragonProfile.rescues;}
function rollDragon(){
  if(forcedDragonId){
    const forced=DRAGON_TYPES.find(d=>d.id===forcedDragonId);forcedDragonId=null;
    if(forced)return forced;
  }
  const total=DRAGON_TYPES.reduce((n,d)=>n+d.weight,0);
  let r=Math.random()*total;
  for(const d of DRAGON_TYPES){r-=d.weight;if(r<=0)return d;}
  return DRAGON_TYPES[0];
}
function forceNextDragon(id){forcedDragonId=DRAGON_TYPES.some(d=>d.id===id)?id:null;}

function resetDragonFinale(){
  dragonFinale=null;
  dragonAltar=null;forcedDragonId=null;
  if(typeof document!=="undefined")document.body.classList.remove("dragon-finale");
  for(const id of ["dragonVictory","dragonBook","dragonHome"]) {
    const el=typeof document!=="undefined"?document.getElementById(id):null;
    if(el)el.classList.add("hidden");
  }
  document.getElementById("btnRetryDragonSave")?.classList.add("hidden");
}

function startDragonFinale(testPreview=false){
  if(dragonFinale)return;
  if(!testPreview&&(!heroBuildComplete()||!dragonAltar||dragonAltar.hold<ALTAR_HOLD_MS))return;
  const type=rollDragon();
  dragonFinale={t:0,type,nextKill:0,rewarded:false,finished:false,cleared:0,roared:false,burst:false};
  document.body.classList.add("dragon-finale");
  pointer.active=false;P.xp=STAGE_XP;P.stagePulse=0;queuedLevels=0;
  if(ult.on){ult.on=false;ult.zoom=1;ult.rot=0;ult.lift=0;document.body.classList.remove("sniper-cinematic");}
  // Доводим толпу примерно до 72 врагов: достаточно страшно, но безопасно для телефона.
  const need=Math.max(0,72-enemies.length);
  for(let i=0;i<need;i++){
    const r=Math.random();spawn(r<.18?"tank":r<.55?"runner":"basic");
    const e=enemies[enemies.length-1];e.finalSiege=1;e.speed*=1.12;e.hp=Math.ceil(e.hp*2.4);e.maxhp=e.hp;
  }
  pops.push({x:P.x,y:P.y-72,txt:"ПОСЛЕДНЯЯ ОСАДА",life:2.5,col:"#c8402c"});
  shake=Math.max(shake,18);chain([110,98,82,65],"sawtooth",.075);noise(.45,.10,900,-480);
}

function updateDragonFinale(dt){
  if(!dragonFinale||dragonFinale.finished)return;
  const f=dragonFinale;f.t+=dt;pointer.active=false;
  // Красные окружают героя, но финальная сцена не может оборваться случайной смертью.
  P.hp=Math.max(P.hp,.5);
  if(f.t>2050&&!f.roared){
    f.roared=true;shake=Math.max(shake,24);noise(.65,.12,520,-330);chain([92,123,184],"sawtooth",.055);
  }
  if(f.t>3500&&f.t<6900){
    f.nextKill-=dt;
    if(f.nextKill<=0){
      f.nextKill+=125;
      const live=enemies.filter(e=>e.hp>0&&!e.rewarded)
        .sort((a,b)=>(a.x+b.y*.18)-(b.x+a.y*.18));
      for(const e of live.slice(0,4)){
        e.launchUp=1;e.dragonKill=1;
        const a=Math.atan2(e.y-P.y,e.x-P.x);e.kb=8;e.kbx=Math.cos(a);e.kby=Math.sin(a);
        hit(e,e.hp+999,P.x-260,P.y-170);f.cleared++;
      }
      shake=Math.max(shake,13);noise(.08,.025,2400,-1600);
    }
  }
  if(f.t>7000&&!f.rewardAttempted){
    for(const e of enemies.filter(e=>e.hp>0&&!e.rewarded)){e.launchUp=1;hit(e,e.hp+999,P.x,P.y);f.cleared++;}
    const award=awardRescueDragon(f.type.id);
    f.rewardAttempted=true;f.rewarded=award.ok;
    pops.push({x:P.x,y:P.y-82,txt:award.ok?f.type.name+" +1":"НАГРАДА ЖДЁТ СОХРАНЕНИЯ",life:2.6,col:f.type.accent});
    chain([392,523,659,784,1047,1318],"sine",.07);
  }
  if(f.t>8950&&!f.finished)finishDragonVictory();
}

function finishDragonVictory(){
  const f=dragonFinale;if(!f||f.finished)return;
  f.finished=true;running=false;paused=false;pointer.active=false;
  document.body.classList.remove("dragon-finale");
  meta.best=Math.max(meta.best,Math.round(t/1000));
  const title=document.getElementById("victoryDragonName");
  const sub=document.getElementById("victoryDragonText");
  if(title){title.textContent=f.type.name;title.style.color=f.type.id==="blackgold"?"#b88716":f.type.col;}
  if(sub)sub.textContent=f.rewarded?`Спасение №${dragonTotal()} · ${f.type.rarity} · в коллекции: ${dragonCollection[f.type.id]}`:"Награда ещё не сохранена. Разреши хранение данных браузеру и нажми «Повторить сохранение» перед новым забегом.";
  document.getElementById("btnRetryDragonSave").classList.toggle("hidden",!!f.rewarded);
  const c=document.getElementById("victoryDragonCanvas");
  if(c){const g=c.getContext("2d");g.clearRect(0,0,c.width,c.height);drawDragon(g,c.width/2-8,c.height*.62,1.25,f.type,.8,0);}
  document.getElementById("dragonVictory").classList.remove("hidden");
}

function retryDragonReward(){
  const f=dragonFinale;if(!f?.finished||f.rewarded)return;
  const result=awardRescueDragon(f.type.id);
  if(result.ok){f.rewarded=true;document.getElementById("btnRetryDragonSave").classList.add("hidden");
    document.getElementById("victoryDragonText").textContent=`Награда сохранена · Спасений: ${dragonTotal()} · В коллекции: ${dragonCollection[f.type.id]}`;
  }else document.getElementById("victoryDragonText").textContent=result.message;
}

function dragonBookOpen(){return !document.getElementById("dragonBook").classList.contains("hidden");}
function renderDragonBook(){
  const grid=document.getElementById("dragonGrid");if(!grid)return;grid.innerHTML="";
  document.getElementById("dragonTotal").textContent="СПАСЕНИЙ: "+dragonTotal()+" · В КНИГЕ: "+Object.values(dragonCollection).reduce((a,b)=>a+b,0);
  for(const d of DRAGON_TYPES){
    const card=document.createElement("div");card.className="dragon-card "+(dragonCollection[d.id]?"owned":"locked");
    card.innerHTML=`<canvas width="160" height="116"></canvas><div><b>${d.name}</b><span>${d.rarity} · вес ${d.weight}</span><strong>×${dragonCollection[d.id]}</strong></div>`;
    card.style.borderColor=d.dark;card.style.boxShadow=dragonCollection[d.id]?`0 0 18px ${d.breath}66`:"none";
    grid.appendChild(card);const g=card.querySelector("canvas").getContext("2d");
    drawDragon(g,76,78,.54,d,.9,0);
    const i=DRAGON_IDS.indexOf(d.id),btn=document.createElement("button");btn.className="craft-btn";
    if(i<6){btn.textContent=`3 → 1 ${DRAGON_TYPES[i+1].name.toLowerCase()}`;btn.disabled=dragonCollection[d.id]<3;
      btn.onclick=()=>{const result=craftDragon(d.id);renderDragonBook();document.getElementById("craftMessage").textContent=result.ok?`Создан ${DRAGON_TYPES[i+1].name.toLowerCase()}. Сохранено.`:result.message;};
    }else{btn.textContent="К инкубатору →";btn.onclick=openDragonHome;}
    card.querySelector("div").appendChild(btn);
  }
}
function openDragonBook(){
  if(dragonFinale&&!dragonFinale.finished)return;
  pointer.active=false;if(running)paused=true;renderDragonBook();
  document.getElementById("dragonBook").classList.remove("hidden");
}
function closeDragonBook(){
  document.getElementById("dragonBook").classList.add("hidden");
  if(running&&!userPaused&&!levelOpen()&&!dragonHomeOpen())paused=false;
}

/* Бриллиантовый — отдельная модель: не органический дракон с другой краской,
   а собранный из прозрачных кристаллов небесный змей. */
function drawDiamondDragon(g,x,y,sc,d,flap,breath,bank=0){
  const cy=flap*6.283,wing=Math.sin(cy),bob=Math.sin(cy*.55)*2;
  g.save();g.translate(x,y+bob);g.rotate(bank);g.scale(sc,sc);g.lineJoin="round";g.lineCap="round";
  g.globalAlpha=.16;g.fillStyle="#17465a";g.beginPath();g.ellipse(-4,39,91,13,0,0,7);g.fill();g.globalAlpha=1;

  // Две пары кристаллических крыльев с отдельными гранями.
  const crystalWing=(side,near)=>{
    const lift=wing*(near?26:-17),root=near?2:-9;
    g.save();g.globalAlpha=near?.88:.48;g.strokeStyle=near?"#246f8f":"#377f9a";g.lineWidth=3;
    spoly(g,[[root,-2],[side*22,-51-lift],[side*48,-101-lift],[side*65,-43-lift*.45],[side*91,-66-lift*.3],[side*69,-10],[side*39,-21]],near?"#c7fbff":"#7fcbd5");
    g.globalAlpha=near?.48:.27;g.fillStyle="#ffffff";
    spoly(g,[[root,-4],[side*47,-94-lift],[side*48,-37-lift*.3]],"#ffffff");
    spoly(g,[[side*48,-37-lift*.3],[side*88,-63-lift*.3],[side*66,-12]],"#8befff");
    g.globalAlpha=near?.68:.38;g.strokeStyle="#ffffff";g.lineWidth=1.5;
    sline(g,root,-3,side*48,-96-lift);sline(g,root,-3,side*88,-63-lift*.3);sline(g,root,-3,side*67,-11);
    g.restore();
  };
  crystalWing(-1,false);crystalWing(1,false);

  // Сегментированный хвост заканчивается большим ромбовидным лезвием.
  g.strokeStyle="#17465a";g.lineWidth=19;g.beginPath();g.moveTo(-27,11);g.bezierCurveTo(-62,24,-91,18,-122,2+Math.sin(cy*.7)*7);g.stroke();
  g.strokeStyle="#82dbe2";g.lineWidth=12;g.beginPath();g.moveTo(-27,11);g.bezierCurveTo(-62,24,-91,18,-122,2+Math.sin(cy*.7)*7);g.stroke();
  g.strokeStyle="#246f8f";g.lineWidth=2.5;
  for(let i=0;i<5;i++){const xx=-43-i*16,yy=11+i*1.2;spoly(g,[[xx-7,yy],[xx,yy-15],[xx+7,yy+1]],i%2?"#ffffff":"#a8f5f7");}
  const tw=Math.sin(cy*.7)*7;spoly(g,[[-119,-7+tw],[-142,-25+tw],[-150,1+tw],[-140,26+tw],[-118,10+tw]],"#dfffff");
  g.globalAlpha=.65;g.strokeStyle="#ffffff";sline(g,-145,0+tw,-120,1+tw);sline(g,-145,0+tw,-140,-20+tw);g.globalAlpha=1;

  // Угловатый корпус — несколько крупных прозрачных граней вместо овала.
  g.strokeStyle="#17465a";g.lineWidth=3.5;
  spoly(g,[[-34,-5],[-13,-24],[18,-20],[39,1],[25,25],[-8,31],[-35,18]],"#73cad6");
  g.globalAlpha=.56;spoly(g,[[-27,-3],[-12,-20],[0,8],[-8,28],[-31,16]],"#dfffff");
  spoly(g,[[-11,-20],[18,-17],[5,8],[0,8]],"#ffffff");
  spoly(g,[[5,8],[35,2],[23,23],[-7,29]],"#82ecf1");g.globalAlpha=1;

  // Тонкая кристаллическая шея и отдельная маска головы.
  g.strokeStyle="#17465a";g.lineWidth=19;g.beginPath();g.moveTo(26,5);g.quadraticCurveTo(34,-19,51,-34);g.stroke();
  g.strokeStyle="#8edfe5";g.lineWidth=13;g.beginPath();g.moveTo(26,5);g.quadraticCurveTo(34,-19,51,-34);g.stroke();
  g.strokeStyle="#17465a";g.lineWidth=3;
  spoly(g,[[43,-51],[64,-54],[87,-40],[75,-24],[48,-27],[38,-38]],"#a9f1f3");
  spoly(g,[[70,-42],[99,-34],[80,-22],[65,-27]],"#4aa9bd");
  spoly(g,[[53,-48],[64,-54],[62,-31]],"#ffffff");
  spoly(g,[[40,-49],[29,-72],[51,-54]],"#dfffff");spoly(g,[[61,-53],[66,-80],[74,-49]],"#ffffff");
  g.shadowColor="#ffffff";g.shadowBlur=12;g.fillStyle="#ffffff";g.beginPath();g.arc(63,-42,4.5,0,7);g.fill();g.shadowBlur=0;
  g.fillStyle="#17465a";g.beginPath();g.arc(64,-42,1.6,0,7);g.fill();

  // Кристаллические лапы похожи на лезвия и заметно отличаются от обычных.
  const claw=(lx,dir)=>{g.strokeStyle="#17465a";g.lineWidth=8;g.beginPath();g.moveTo(lx,18);g.lineTo(lx+dir*4,35);g.stroke();
    g.strokeStyle="#baf8fa";g.lineWidth=4;g.beginPath();g.moveTo(lx,18);g.lineTo(lx+dir*4,35);g.stroke();
    g.strokeStyle="#246f8f";g.lineWidth=2;spoly(g,[[lx+dir*2,33],[lx+dir*17,39],[lx+dir*7,27]],"#ffffff");};
  claw(-16,-1);claw(18,1);
  crystalWing(-1,true);crystalWing(1,true);

  // Призматический луч разбивается на три цвета у края экрана.
  if(breath>0){
    const len=155+breath*115,sy=-29;g.globalAlpha=.25+.28*breath;g.fillStyle="#b9fbff";
    spoly(g,[[87,sy-5],[87+len,sy-14],[87+len,sy+14],[87,sy+5]],"#b9fbff");
    const cols=["#ff8eba","#fff27a","#83e8ff"];
    for(let i=0;i<3;i++){g.globalAlpha=.72;g.strokeStyle=cols[i];g.lineWidth=3.2;sline(g,94,sy+i*2-2,94+len,sy+(i-1)*13);}
    for(let i=0;i<9;i++){const px=110+i*len/10,py=sy+Math.sin(cy*2+i)*12;g.globalAlpha=.7;g.fillStyle=i%2?"#fff":"#8ff7ff";
      spoly(g,[[px,py-4],[px+4,py],[px,py+4],[px-4,py]],g.fillStyle);}
    g.globalAlpha=1;
  }
  g.restore();
}

function drawDragon(g,x,y,sc,d,flap,breath,bank=0){
  if(d.id==="diamond")return drawDiamondDragon(g,x,y,sc,d,flap,breath,bank);
  const cycle=flap*6.283,wing=Math.sin(cycle),bob=Math.sin(cycle*.5)*2.2;
  const jaw=(breath||0)*5,tailWave=Math.sin(cycle*.72)*8;
  g.save();g.translate(x,y+bob);g.rotate(bank);g.scale(sc,sc);
  g.lineCap="round";g.lineJoin="round";g.strokeStyle=INK;

  // Мягкая тень подчёркивает крупный силуэт, не превращая его в плоскую наклейку.
  g.globalAlpha=.14;g.fillStyle="#17130f";g.beginPath();g.ellipse(-7,38,83,12,-.05,0,7);g.fill();g.globalAlpha=1;

  // Дальний хвост — длинный, гибкий и с читаемым наконечником.
  g.strokeStyle=INK;g.lineWidth=20;g.beginPath();g.moveTo(-28,12);g.bezierCurveTo(-65,26,-89,16,-112,2+tailWave);g.stroke();
  g.strokeStyle=d.dark;g.lineWidth=14;g.beginPath();g.moveTo(-28,12);g.bezierCurveTo(-65,26,-89,16,-112,2+tailWave);g.stroke();
  g.strokeStyle=INK;g.lineWidth=2.6;
  spoly(g,[[-111,-4+tailWave],[-133,-18+tailWave],[-126,4+tailWave],[-137,17+tailWave],[-110,9+tailWave]],d.accent);
  for(let i=0;i<4;i++)spoly(g,[[-45-i*15,11+i*2],[-51-i*15,-2+i*2],[-57-i*15,15+i*2]],d.accent);

  const wingShape=(near)=>{
    const side=near?1:-1,rootX=near?2:-11;
    const lift=(near?1:-.75)*wing;
    g.save();if(!near)g.globalAlpha=.72;
    g.strokeStyle=INK;g.lineWidth=3.4;g.beginPath();g.moveTo(rootX,-2);
    g.bezierCurveTo(rootX-11,-32,side*18-14,-78-lift*31,side*57-14,-95-lift*42);
    g.quadraticCurveTo(side*83-9,-74-lift*24,side*91-8,-44-lift*11);
    g.lineTo(side*65-7,-54-lift*10);g.lineTo(side*73-8,-20-lift*5);
    g.lineTo(side*47-5,-32-lift*4);g.lineTo(side*43-4,-2);g.closePath();
    g.fillStyle=near?d.wing:d.dark;g.fill();g.stroke();
    // Перепонки и костяные рёбра крыла.
    g.globalAlpha=near?.31:.18;g.fillStyle=d.accent;g.beginPath();g.moveTo(rootX,-5);
    g.lineTo(side*56-13,-85-lift*34);g.lineTo(side*69-8,-50-lift*15);
    g.lineTo(side*44-6,-29-lift*4);g.closePath();g.fill();
    g.globalAlpha=near?.58:.38;g.strokeStyle=d.accent;g.lineWidth=1.8;
    for(let i=0;i<3;i++)sline(g,rootX,-4,side*(43+i*14)-7,-30-i*17-lift*(6+i*8));
    g.restore();
  };
  wingShape(false);

  // Корпус с бронёй на брюхе.
  g.strokeStyle=INK;g.lineWidth=3.5;g.fillStyle=d.col;g.beginPath();g.ellipse(0,9,39,24,-.08,0,7);g.fill();g.stroke();
  g.globalAlpha=.32;g.fillStyle=d.accent;g.beginPath();g.ellipse(9,14,25,12,-.12,0,7);g.fill();g.globalAlpha=1;
  g.strokeStyle=d.dark;g.lineWidth=2;
  for(let i=-2;i<3;i++){g.beginPath();g.arc(i*10+3,13,9,-.08,2.85);g.stroke();}

  // Задние лапы поджаты во время полёта, когти остаются видимыми.
  const leg=(lx,flip)=>{g.strokeStyle=INK;g.lineWidth=10;g.beginPath();g.moveTo(lx,19);g.lineTo(lx-5*flip,35);g.lineTo(lx+9*flip,39);g.stroke();
    g.strokeStyle=d.dark;g.lineWidth=5.5;g.beginPath();g.moveTo(lx,19);g.lineTo(lx-5*flip,35);g.lineTo(lx+9*flip,39);g.stroke();
    g.strokeStyle=INK;g.lineWidth=1.8;for(let i=0;i<3;i++)sline(g,lx+7*flip+i*3*flip,38,lx+12*flip+i*4*flip,43-i);};
  leg(-17,-1);leg(17,1);

  // S-образная шея и угловатая голова с настоящей нижней челюстью.
  g.strokeStyle=INK;g.lineWidth=22;g.beginPath();g.moveTo(25,5);g.bezierCurveTo(31,-7,31,-25,43,-34);g.stroke();
  g.strokeStyle=d.col;g.lineWidth=16;g.beginPath();g.moveTo(25,5);g.bezierCurveTo(31,-7,31,-25,43,-34);g.stroke();
  g.strokeStyle=INK;g.lineWidth=3.2;
  spoly(g,[[38,-47],[57,-51],[76,-41],[70,-26],[49,-25],[37,-34]],d.col);
  spoly(g,[[65,-39],[91,-34],[80,-24],[61,-26]],d.dark);
  g.save();g.translate(0,jaw);
  spoly(g,[[61,-27],[82,-23],[70,-16],[51,-23]],d.col);g.restore();
  // Ноздри и светящийся глаз.
  g.fillStyle=INK;g.beginPath();g.arc(78,-31,1.7,0,7);g.fill();
  g.shadowColor=d.accent;g.shadowBlur=8;g.fillStyle=d.accent;g.beginPath();g.arc(57,-39,4.4,0,7);g.fill();g.shadowBlur=0;
  g.fillStyle=INK;g.beginPath();g.arc(58,-39,1.7,0,7);g.fill();
  g.strokeStyle=INK;g.lineWidth=2.2;sline(g,50,-44,63,-45);

  // Рога и гребень меняют характер в зависимости от редкости.
  const hornLen=d.id==="diamond"?27:d.id==="gold"?23:18;
  g.strokeStyle=INK;g.lineWidth=2.5;
  spoly(g,[[44,-48],[31,-64-hornLen*.25],[50,-53]],d.accent);
  spoly(g,[[57,-51],[56-hornLen*.15,-67-hornLen*.45],[66,-49]],d.accent);
  for(let i=0;i<6;i++){
    const xx=-27+i*12,h=13+(i%2)*5+(d.id==="diamond"?6:0);
    spoly(g,[[xx-6,-8],[xx,-8-h],[xx+7,-7]],d.id==="blackgold"&&i%2?"#e9bc35":d.accent);
  }

  // Ближнее крыло закрывает часть тела и даёт ощущение глубины.
  wingShape(true);

  // Передние лапы с когтями.
  g.strokeStyle=INK;g.lineWidth=9;g.beginPath();g.moveTo(27,-2);g.lineTo(43,12);g.lineTo(53,8);g.stroke();
  g.strokeStyle=d.col;g.lineWidth=5;g.beginPath();g.moveTo(27,-2);g.lineTo(43,12);g.lineTo(53,8);g.stroke();
  g.strokeStyle=INK;g.lineWidth=1.8;sline(g,51,7,59,3);sline(g,52,9,61,9);sline(g,51,11,58,15);

  // Уникальные детали самой модели, заметные даже в книге.
  if(d.id==="blackgold"){
    g.strokeStyle=d.accent;g.lineWidth=2.8;
    for(let i=-2;i<3;i++){g.beginPath();g.arc(i*11,8,8,-1.15,1.35);g.stroke();}
    spoly(g,[[-5,-17],[3,-29],[11,-16]],d.accent);
  }else if(d.id==="gold"){
    spoly(g,[[42,-53],[46,-69],[53,-58],[61,-73],[66,-52]],d.accent);
    g.globalAlpha=.55;g.strokeStyle="#fff8c8";g.lineWidth=2;sline(g,-21,3,24,3);g.globalAlpha=1;
  }else if(d.id==="diamond"){
    g.globalAlpha=.72;g.strokeStyle="#ffffff";g.lineWidth=1.8;
    for(let i=0;i<6;i++){const xx=-24+i*10;sline(g,xx,-1,xx+8,19);sline(g,xx+8,19,xx+14,1);}g.globalAlpha=1;
    spoly(g,[[-7,-20],[2,-38],[12,-19]],"#e9ffff");
  }else if(d.id==="pink"){
    g.fillStyle=d.accent;for(let i=0;i<4;i++){g.globalAlpha=.55;g.beginPath();g.arc(-14+i*12,5+(i%2)*4,3.2,0,7);g.fill();}g.globalAlpha=1;
  }else if(d.id==="blue"){
    g.strokeStyle=d.accent;g.lineWidth=2;sline(g,-20,5,-6,18);sline(g,-6,18,8,2);sline(g,8,2,22,15);
  }

  // Дыхание имеет объёмный внешний поток, белое ядро и летящие искры.
  if(breath>0){
    const len=145+breath*105,sy=-27+jaw*.45;
    g.globalAlpha=.20+.25*breath;g.fillStyle=d.breath;g.beginPath();g.moveTo(84,sy-7);
    g.bezierCurveTo(118,sy-36,174,sy-44,84+len,sy-6);g.bezierCurveTo(190,sy+40,120,sy+25,84,sy+5);g.closePath();g.fill();
    g.globalAlpha=.82;g.fillStyle=d.accent;g.beginPath();g.moveTo(87,sy-3);
    g.quadraticCurveTo(150,sy-14,85+len,sy);g.quadraticCurveTo(148,sy+13,87,sy+3);g.closePath();g.fill();
    for(let i=0;i<11;i++){
      const px=108+i*len/12,py=sy+Math.sin(cycle*2+i*2.1)*(8+i*.8);
      g.globalAlpha=.35+(i%3)*.18;g.fillStyle=i%2?d.accent:d.breath;g.beginPath();g.arc(px,py,2+(i%3),0,7);g.fill();
    }
    g.globalAlpha=1;
  }
  g.restore();
}

function drawDragonFinale(g){
  if(!dragonFinale)return;const f=dragonFinale,p=f.t;
  const special=f.type.id==="diamond"||f.type.id==="blackgold"||f.type.id==="gold";
  // Обычные виды влетают над ареной и заранее отбрасывают огромную тень.
  if(!special&&p>1250&&p<2350){
    const q=(p-1250)/1100,e=1-Math.pow(1-q,3);
    g.save();g.globalAlpha=Math.sin(q*Math.PI)*.22;g.fillStyle="#16130f";
    g.translate(P.x-520+e*780,P.y+35);g.rotate(-.12);g.beginPath();g.ellipse(0,0,125,25,0,0,7);g.fill();
    g.beginPath();g.moveTo(-18,0);g.lineTo(-110,-62);g.lineTo(-65,5);g.lineTo(-112,62);g.closePath();g.fill();g.restore();
  }

  // Бриллиантовый сначала рассыпает звезду, затем собирается из летящих граней.
  if(f.type.id==="diamond"&&p>850&&p<3350){
    const q=Math.max(0,Math.min(1,(p-1050)/1900)),ease=1-Math.pow(1-q,3);
    const tx=P.x-62,ty=P.y-66;
    g.save();g.globalCompositeOperation="lighter";
    for(let i=0;i<28;i++){
      const a=i/28*6.283+p/1150,r=(1-ease)*(220+(i%5)*42)+28;
      const sx=tx+Math.cos(a)*r,sy=ty-210*(1-ease)+Math.sin(a)*r*.72;
      g.save();g.translate(sx,sy);g.rotate(a-p/360+i);g.globalAlpha=.25+.7*q;
      g.strokeStyle=i%3?"#78dce8":"#ff9cd2";g.lineWidth=1.5;
      spoly(g,[[0,-9],[6,0],[0,9],[-6,0]],i%2?"#dfffff":"#9eeef3");g.restore();
    }
    g.globalAlpha=Math.sin(Math.min(1,q)*Math.PI)*.34;g.strokeStyle="#ffffff";g.lineWidth=8;
    g.beginPath();g.arc(tx,ty,35+ease*125,0,7);g.stroke();g.restore();
  }
  // Чёрно-золотой выходит из собственного затмения-портала.
  if(f.type.id==="blackgold"&&p>900&&p<3600){
    const q=Math.max(0,Math.min(1,(p-900)/1250)),fade=Math.min(1,(3600-p)/600);
    const px=P.x-62,py=P.y-65;g.save();g.translate(px,py);g.globalAlpha=q*fade;
    g.fillStyle="rgba(12,10,8,.84)";g.beginPath();g.ellipse(0,0,122*q,91*q,p/900,0,7);g.fill();
    for(let i=0;i<4;i++){g.strokeStyle=i%2?"#e9bc35":"#5a4318";g.lineWidth=8-i*1.4;g.globalAlpha=(.28+i*.12)*q*fade;
      g.beginPath();g.ellipse(0,0,102+i*13,72+i*9,-p/(520+i*90),i*.55,i*.55+4.7);g.stroke();}
    for(let i=0;i<12;i++){const a=i/12*6.283-p/700,r=132+(i%3)*13;g.globalAlpha=.65*q*fade;g.fillStyle="#e9bc35";
      g.beginPath();g.arc(Math.cos(a)*r,Math.sin(a)*r*.68,2+(i%2)*2,0,7);g.fill();}g.restore();
  }
  // Золотой спускается в солнечном столбе и закручивает вокруг себя корону лучей.
  if(f.type.id==="gold"&&p>700&&p<3500){
    const q=Math.max(0,Math.min(1,(p-700)/1500)),fade=Math.min(1,(3500-p)/650),px=P.x-62;
    g.save();g.globalAlpha=.09+.17*q*fade;g.fillStyle="#ffe477";
    g.beginPath();g.moveTo(px-86,P.y-H*.75);g.lineTo(px+86,P.y-H*.75);g.lineTo(px+132,P.y+95);g.lineTo(px-132,P.y+95);g.closePath();g.fill();
    g.translate(px,P.y-65);g.strokeStyle="#ffe991";g.lineWidth=5;
    for(let i=0;i<18;i++){const a=i/18*6.283+p/1300;g.globalAlpha=(.18+(i%3)*.08)*q*fade;
      sline(g,Math.cos(a)*65,Math.sin(a)*48,Math.cos(a)*190,Math.sin(a)*135);}
    g.globalAlpha=.32*q*fade;g.fillStyle="#fff4b0";g.beginPath();g.arc(0,0,92+Math.sin(p/150)*8,0,7);g.fill();g.restore();
  }
  if((special&&p<1750)||(!special&&p<1950))return;
  const raw=Math.min(1,(p-1950)/1250),enter=1-Math.pow(1-raw,3);
  const leave=p>7350?Math.min(1,(p-7350)/1150):0;
  let x=P.x-610+enter*548+Math.sin(p/410)*24+leave*410;
  // Держим крупную модель в верхней трети, но целиком внутри кадра телефона.
  let y=P.y-200+enter*135-Math.sin(p/330)*14-leave*150;
  let modelScale=1.72,modelAlpha=1;
  const breath=p>3450&&p<7100?
    Math.sin(Math.min(1,(p-3450)/520)*Math.PI/2)*Math.min(1,(7100-p)/430):0;
  let bank=(1-enter)*.22+Math.sin(p/680)*.045-leave*.18;
  if(f.type.id==="diamond"){
    const q=Math.max(0,Math.min(1,(p-1750)/1450)),e=1-Math.pow(1-q,3);
    x=P.x-62+Math.sin(p/260)*(1-e)*85+leave*420;
    y=P.y-410+e*344-Math.sin(p/330)*10-leave*160;
    modelScale=.30+1.52*e;modelAlpha=Math.max(.08,q);bank=(1-e)*-.65+Math.sin(p/700)*.035-leave*.22;
  }else if(f.type.id==="blackgold"){
    const q=Math.max(0,Math.min(1,(p-1950)/950)),e=1-Math.pow(1-q,3);
    const overshoot=1+Math.sin(q*Math.PI)*.16;
    x=P.x-62+leave*410;y=P.y-65-Math.sin(p/350)*10-leave*150;
    modelScale=Math.max(.08,1.72*e*overshoot);modelAlpha=e;bank=Math.sin(p/720)*.025-leave*.18;
  }else if(f.type.id==="gold"){
    const q=Math.max(0,Math.min(1,(p-1750)/1350)),e=1-Math.pow(1-q,3);
    x=P.x-62+Math.cos(q*7)*(1-e)*190+leave*420;
    y=P.y-430+e*365-Math.sin(p/370)*10-leave*160;
    modelScale=.58+1.14*e;modelAlpha=Math.max(.12,q);bank=Math.sin(q*7)*(1-e)*.52-leave*.18;
  }
  if(p>3250&&p<7250){
    g.save();g.globalAlpha=.12+.10*breath;g.fillStyle=f.type.breath;g.fillRect(P.x-W*.7,P.y-H*.7,W*1.4,H*1.4);g.restore();
  }
  g.save();g.translate(x,y);
  if(f.type.id==="diamond"){
    // Самая редкая версия получает отдельную призматическую корону и радужные осколки.
    for(let i=0;i<18;i++){
      const a=i/18*6.283+p/620,r=112+(i%3)*25;
      g.globalAlpha=.38+.22*Math.sin(p/120+i);g.strokeStyle=`hsl(${(i*38+p/18)%360} 82% 68%)`;g.lineWidth=3.2;
      sline(g,Math.cos(a)*48,Math.sin(a)*32,Math.cos(a)*r,Math.sin(a)*r*.72);
      g.save();g.translate(Math.cos(a)*r,Math.sin(a)*r*.72);g.rotate(a+p/400);
      spoly(g,[[0,-8],[5,0],[0,8],[-5,0]],i%2?"#ffffff":"#91f2ff");g.restore();
    }
    g.globalAlpha=.25;g.strokeStyle="#ffffff";g.lineWidth=9;g.beginPath();g.ellipse(0,-8,138,78,p/900,0,7);g.stroke();
  }else if(f.type.id==="gold"){
    g.strokeStyle="#ffe481";g.lineWidth=5;
    for(let i=0;i<14;i++){const a=i/14*6.283+p/1200;g.globalAlpha=.18+(i%3)*.08;sline(g,Math.cos(a)*55,Math.sin(a)*35,Math.cos(a)*145,Math.sin(a)*100);}
  }else if(f.type.id==="blackgold"){
    g.globalAlpha=.20;g.fillStyle="#1a1712";g.beginPath();g.arc(0,-8,120,0,7);g.fill();
    g.globalAlpha=.55;g.strokeStyle="#e3b52f";g.lineWidth=3;g.beginPath();g.arc(0,-8,104+p%180/18,0,7);g.stroke();
  }else if(f.type.id==="violet"){
    g.strokeStyle="#d7a8ff";g.lineWidth=3;
    for(let i=0;i<6;i++){const a=i/6*6.283+p/900;g.globalAlpha=.42;sline(g,Math.cos(a)*45,Math.sin(a)*28,Math.cos(a+.18)*96,Math.sin(a+.18)*70);}
  }else if(f.type.id==="pink"){
    g.fillStyle="#ffd0e4";
    for(let i=0;i<10;i++){const a=i/10*6.283+p/800,r=72+(i%3)*15;g.globalAlpha=.48;g.beginPath();g.arc(Math.cos(a)*r,Math.sin(a)*r*.64,3+(i%2)*2,0,7);g.fill();}
  }else if(f.type.id==="blue"){
    g.strokeStyle="#d6f5ff";g.lineWidth=2.3;
    for(let i=0;i<10;i++){const a=i/10*6.283-p/1100,r=70+(i%3)*18;g.globalAlpha=.48;sline(g,Math.cos(a)*r-5,Math.sin(a)*r*.6,Math.cos(a)*r+5,Math.sin(a)*r*.6);}
  }else{
    // Зелёный тоже получает собственный природный вихрь, но спокойнее редких видов.
    g.strokeStyle="#d7ee8d";g.lineWidth=2.4;
    for(let i=0;i<8;i++){const a=i/8*6.283+p/1050,r=78+(i%2)*17;g.globalAlpha=.34;
      g.beginPath();g.arc(Math.cos(a)*r,Math.sin(a)*r*.58,4,0,Math.PI);g.stroke();}
  }
  g.restore();
  g.save();g.globalAlpha=modelAlpha;drawDragon(g,x,y,modelScale,f.type,p/610,breath,bank);g.restore();

  // Удар проходит по арене заметной волной, а не просто мгновенно удаляет врагов.
  if(breath>0){
    g.save();g.translate(x+165,y-42);g.globalAlpha=.16+.20*breath;g.strokeStyle=f.type.accent;
    for(let i=0;i<4;i++){
      const travel=((p/7+i*150)%620),rr=18+i*5;g.lineWidth=7-i;
      g.beginPath();g.ellipse(travel,Math.sin(p/95+i)*24,rr*2.2,rr,0,0,7);g.stroke();
    }
    for(let i=0;i<16;i++){
      const px=((p*.32+i*67)%650),py=Math.sin(i*2.2+p/170)*72;
      g.globalAlpha=.20+(i%4)*.10;g.fillStyle=i%3?f.type.breath:f.type.accent;
      g.beginPath();g.arc(px,py,2+(i%3)*1.6,0,7);g.fill();
    }
    g.restore();
  }
}

function drawDragonScreenFX(g){
  if(!dragonFinale||dragonFinale.finished)return;const f=dragonFinale,p=f.t;
  const a=Math.min(1,p/500,p>8250?(8950-p)/700:1);
  g.save();g.globalAlpha=Math.max(0,a)*.82;g.fillStyle="#211d16";g.fillRect(0,0,W,44);g.fillRect(0,H-36,W,36);
  g.textAlign="center";g.fillStyle=p<2300?"#e85b43":f.type.accent;g.font="900 13px system-ui";
  g.fillText(p<2100?"FINAL SIEGE · HOLD THE LINE":p<7000?f.type.name+" · RESCUE":"АРЕНА ЗАЧИЩЕНА",W/2,27);
  g.restore();
}
