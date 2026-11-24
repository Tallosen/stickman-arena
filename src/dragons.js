"use strict";
/* Arena dragon models and uniform ally selection. No collection or automatic victory. */

const DRAGON_TYPES = [
  { id:"green",   name:"ЗЕЛЁНЫЙ ДРАКОН",       rarity:"ОБЫЧНЫЙ",       col:"#4d9650", dark:"#285a35", wing:"#89bf67", accent:"#d7ee8d", breath:"#9bd866" },
  { id:"blue",    name:"СИНИЙ ДРАКОН",         rarity:"НЕОБЫЧНЫЙ",     col:"#397fb9", dark:"#24517d", wing:"#74b9db", accent:"#d8f5ff", breath:"#73cef2" },
  { id:"violet",  name:"ФИОЛЕТОВЫЙ ДРАКОН",    rarity:"РЕДКИЙ",        col:"#7545a7", dark:"#432568", wing:"#a86ed1", accent:"#edc6ff", breath:"#b678ec" },
  { id:"pink",    name:"РОЗОВЫЙ ДРАКОН",       rarity:"ЭПИЧЕСКИЙ",     col:"#cf568c", dark:"#81365f", wing:"#ef8fba", accent:"#ffe0ed", breath:"#ff8fc1" },
  { id:"blackgold",name:"ЧЁРНО-ЗОЛОТОЙ ДРАКОН",rarity:"ЛЕГЕНДАРНЫЙ",   col:"#26241f", dark:"#11100e", wing:"#4b4539", accent:"#e9bc35", breath:"#e4a126" },
  { id:"gold",    name:"ЗОЛОТОЙ ДРАКОН",       rarity:"МИФИЧЕСКИЙ",    col:"#d69b19", dark:"#88560a", wing:"#f0c348", accent:"#fff3a8", breath:"#ffd44d" },
  { id:"diamond", name:"БРИЛЛИАНТОВЫЙ ДРАКОН", rarity:"БРИЛЛИАНТОВЫЙ",col:"#8bdde3", dark:"#377f9a", wing:"#c4f5f7", accent:"#ffffff", breath:"#b4f5ff" },
];
// Compatibility guards remain for arena modules; dragons no longer own victory.
let dragonFinale=null,dragonAltar=null,forcedDragonId=null;
const ALTAR_HOLD_MS=2000;
function unlockDragonAltar(){}
function updateDragonAltar(){}
function drawDragonAltar(){}
function drawAltarRadar(){}
function drawAltarGuide(){}
function dragonBookOpen(){return false;}
function dragonHomeOpen(){return false;}
function rollDragon(){
 if(forcedDragonId){const d=DRAGON_TYPES.find(d=>d.id===forcedDragonId);forcedDragonId=null;if(d)return d;}
 return DRAGON_TYPES[Math.floor(Math.random()*DRAGON_TYPES.length)];
}
function forceNextDragon(id){forcedDragonId=DRAGON_TYPES.some(d=>d.id===id)?id:null;}
function resetDragonFinale(){
 dragonFinale=null;dragonAltar=null;forcedDragonId=null;
 if(typeof resetBossRun==='function')resetBossRun();
 document.body.classList.remove('dragon-finale');
 for(const id of ['dragonVictory','dragonBook','dragonHome'])document.getElementById(id)?.classList.add('hidden');
 document.getElementById('btnRetryDragonSave')?.classList.add('hidden');
}
function startDragonFinale(testPreview=false){
 // Existing developer preview now previews assistance, never a victory or forced siege.
 if(testPreview&&typeof startDragonAssist==='function')return startDragonAssist(true);
 return false;
}
function updateDragonFinale(){}
function finishDragonVictory(){return false;}

function dragonFlightMotion(flap){
 const cycle=flap*Math.PI*2;
 return {cycle,wing:Math.sin(cycle)+.18*Math.sin(cycle*2),bob:Math.sin(cycle-.6)*3.2};
}
// Shared transform keeps the breath attached to the animated mouth, including banking and turns.
function dragonMouthPoint(p,d,flap){
 const bob=dragonFlightMotion(flap).bob,lx=d.id==='diamond'?94:85,ly=d.id==='diamond'?-30:-26;
 const c=Math.cos(p.bank),s=Math.sin(p.bank);
 return {x:p.x+p.face*p.scale*(lx*c-ly*s),y:p.y+bob+p.scale*(lx*s+ly*c)};
}
function drawDragonBreath(g,from,to,d,age,phase){
 if(phase<0||phase>780)return;
 const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);if(length<1)return;
 const strength=Math.min(1,(phase+25)/100,Math.max(0,(780-phase)/220)),angle=Math.atan2(dy,dx);
 const warm=['gold','blackgold'].includes(d.id),outer=warm?'#de651d':d.dark,mid=warm?'#ffae32':d.breath;
 g.save();g.translate(from.x,from.y);g.rotate(angle);
 // Overlapping curling tongues, not a filled cone or a straight white beam.
 const tongues=visualFX('lowFX')?12:24,embers=visualFX('lowFX')?6:16;
 for(let i=0;i<tongues;i++){
  const u=(phase/390+i/tongues)%1,spread=Math.sin(u*Math.PI),r=(4+18*spread)*strength;
  const x=u*length,y=Math.sin(u*18-age/85+i*.7)*(3+14*spread);
  g.save();g.translate(x,y);g.rotate(Math.sin(age/110+i)*.32);
  g.globalAlpha=strength*(i%3?.65-.32*u:.18);g.fillStyle=i%3?mid:outer;
  g.beginPath();g.moveTo(-r*.7,0);g.bezierCurveTo(-r,-r,r*.7,-r*.75,r*2.1,-r*.35);
  g.quadraticCurveTo(r*.4,r*.15,r*.9,r*.6);g.quadraticCurveTo(-r*.5,r,-r*.7,0);g.fill();
  g.globalAlpha*=.8;g.fillStyle=d.accent;g.beginPath();g.moveTo(-r*.5,0);
  g.quadraticCurveTo(r*.2,-r*.4,r*1.5,-r*.15);g.quadraticCurveTo(r*.3,r*.45,-r*.5,0);g.fill();g.restore();
 }
 // Small embers peel away from the stream; their count never grows with elapsed time.
 for(let i=0;i<embers;i++){
  const u=(phase/510+i*.061)%1,x=u*length,y=Math.sin(i*8.3+age/140)*(12+u*34);
  g.globalAlpha=strength*(1-u)*.85;g.fillStyle=i%2?mid:d.accent;
  g.beginPath();g.ellipse(x,y,1.5+(i%3),1.2,0,0,7);g.fill();
 }
 g.restore();
 // Short-lived licking flames at the contact point, rather than a glowing spotlight.
 if(phase>100){
  g.save();g.translate(to.x,to.y);g.globalAlpha=strength*.7;
  for(let i=0;i<7;i++){
   const x=(i-3)*10,y=Math.sin(i*2)*7,h=(13+Math.sin(age/70+i)*7)*strength;
   g.fillStyle=i%2?mid:d.accent;g.beginPath();g.moveTo(x-5,y);g.quadraticCurveTo(x-9,y-h*.6,x+Math.sin(age/110+i)*6,y-h);
   g.quadraticCurveTo(x+1,y-h*.3,x+5,y);g.closePath();g.fill();
  }g.restore();
 }
}
function drawDiamondDragon(g,x,y,sc,d,flap,breath,bank=0,externalBreath=false){
  const motion=dragonFlightMotion(flap),cy=motion.cycle,wing=motion.wing,bob=motion.bob;
  g.save();g.translate(x,y+bob);g.rotate(bank);g.scale(sc,sc);g.lineJoin="round";g.lineCap="round";
  if(!externalBreath){g.globalAlpha=.16;g.fillStyle="#17465a";g.beginPath();g.ellipse(-4,39,91,13,0,0,7);g.fill();g.globalAlpha=1;}

  // Две пары кристаллических крыльев с отдельными гранями.
  const crystalWing=(side,near)=>{
    const lift=(near?wing:Math.sin(cy-.28))*26,root=near?2:-9;
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
  g.save();g.translate(0,breath*7);spoly(g,[[69,-28],[91,-26],[78,-17],[62,-24]],'#82dbe2');g.restore();
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
  if(breath>0&&!externalBreath){
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

function drawDragon(g,x,y,sc,d,flap,breath,bank=0,externalBreath=false){
  if(d.id==="diamond")return drawDiamondDragon(g,x,y,sc,d,flap,breath,bank,externalBreath);
  const motion=dragonFlightMotion(flap),cycle=motion.cycle,wing=motion.wing,bob=motion.bob;
  const jaw=(breath||0)*9,tailWave=Math.sin(cycle-.9)*8+Math.sin(cycle*.5)*3;
  g.save();g.translate(x,y+bob);g.rotate(bank);g.scale(sc,sc);
  g.lineCap="round";g.lineJoin="round";g.strokeStyle=INK;

  // Мягкая тень подчёркивает крупный силуэт, не превращая его в плоскую наклейку.
  if(!externalBreath){g.globalAlpha=.14;g.fillStyle="#17130f";g.beginPath();g.ellipse(-7,38,83,12,-.05,0,7);g.fill();g.globalAlpha=1;}

  // Дальний хвост — длинный, гибкий и с читаемым наконечником.
  g.strokeStyle=INK;g.lineWidth=20;g.beginPath();g.moveTo(-28,12);g.bezierCurveTo(-65,26,-89,16,-112,2+tailWave);g.stroke();
  g.strokeStyle=d.dark;g.lineWidth=14;g.beginPath();g.moveTo(-28,12);g.bezierCurveTo(-65,26,-89,16,-112,2+tailWave);g.stroke();
  g.strokeStyle=INK;g.lineWidth=2.6;
  spoly(g,[[-111,-4+tailWave],[-133,-18+tailWave],[-126,4+tailWave],[-137,17+tailWave],[-110,9+tailWave]],d.accent);
  for(let i=0;i<4;i++)spoly(g,[[-45-i*15,11+i*2],[-51-i*15,-2+i*2],[-57-i*15,15+i*2]],d.accent);

  const wingShape=(near)=>{
    const side=near?1:-1,rootX=near?2:-11;
    const lift=near?wing:Math.sin(cycle-.28);
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
  const leg=(lx,flip)=>{g.save();g.translate(lx,19);g.rotate(Math.sin(cycle-.8+flip*.3)*.10);g.translate(-lx,-19);g.strokeStyle=INK;g.lineWidth=10;g.beginPath();g.moveTo(lx,19);g.lineTo(lx-5*flip,35);g.lineTo(lx+9*flip,39);g.stroke();
    g.strokeStyle=d.dark;g.lineWidth=5.5;g.beginPath();g.moveTo(lx,19);g.lineTo(lx-5*flip,35);g.lineTo(lx+9*flip,39);g.stroke();
    g.strokeStyle=INK;g.lineWidth=1.8;for(let i=0;i<3;i++)sline(g,lx+7*flip+i*3*flip,38,lx+12*flip+i*4*flip,43-i);g.restore();};
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
  if(breath>0&&!externalBreath){
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

function drawDragonFinale(){}
function drawDragonScreenFX(){}
