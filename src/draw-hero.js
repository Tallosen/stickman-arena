"use strict";
/* draw-hero.js — модели оружия и послойная одежда героя */

/* ── пять моделей оружия ──────────────────────────────────── */
function drawSniperProjectile(g,x,y,a,gold=false,scale=1){
 g.save();g.translate(x,y);g.rotate(a);g.scale(scale,scale);
 // Tapered tracer plus a distinct pointed round, not a generic dot or laser bar.
 g.fillStyle=gold?'#dca64455':'#83b4c955';g.beginPath();g.moveTo(-43,0);g.lineTo(-9,-3);g.lineTo(1,0);g.lineTo(-9,3);g.closePath();g.fill();
 g.strokeStyle=gold?'#e8c66e':'#b0dfec';g.lineWidth=1.4;g.beginPath();g.moveTo(-32,0);g.lineTo(-8,0);g.stroke();
 g.strokeStyle=gold?'#91652d':'#456271';g.lineWidth=1;
 spoly(g,[[-12,-2],[-3,-2],[3,0],[-3,2],[-12,2]],gold?'#f1c96b':'#d3e5e7');
 g.strokeStyle='#fff7d5';g.lineWidth=1;sline(g,-8,-.6,-1,-.6);g.restore();
}
function gunMuzzlePoint(type,lv){
  return {x:type==='laser'?20+lv*8:type==='sniper'&&lv<2?[18,32][lv]:['shotgun','dropShotgun'].includes(type)?24+lv*2.5:['sniper','goldSniper'].includes(type)?40+lv*3.5:type==='minigun'?38+lv*2:[16,22,30,34,38][Math.min(4,lv)],y:-2};
}
function drawGunModel(g, lv, muzzle, type) {
  if(lv===4&&(type==='sniper'||type==='shotgun'))return drawRefinedTopGun(g,type,muzzle);
  if(type==='laser'||type==='shotgun'||type==='sniper'&&lv<2||(!type||type==='basic')&&lv>0)return drawEvolutionGun(g,lv,muzzle,type||'basic');
  if (type && type !== "basic") return drawRareGun(g, lv, muzzle, type);
  return drawBasicGun(g, lv, muzzle);
}
function drawRefinedTopGun(g,type,muzzle){
 g.save();g.strokeStyle=INK;g.lineWidth=1.8;g.lineCap='round';g.lineJoin='round';
 const tip=gunMuzzlePoint(type,4).x,sniper=type==='sniper';
 // Shaped stock, trigger grip and separate receiver: not an enlarged pistol.
 spoly(g,[[-10,-5],[2,-5],[7,-2],[5,4],[-5,3],[-10,7]],'#52636a');
 spoly(g,[[-10,-5],[-7,-5],[-7,6],[-10,7]],'#343d43');
 spoly(g,[[3,0],[10,1],[8,11],[3,9]],'#654d38');
 spoly(g,[[1,-6],[sniper?30:20,-6],[sniper?33:22,-2],[sniper?30:20,3],[1,3]],'#647d84');
 spoly(g,[[sniper?29:18,-4],[tip,-4],[tip,0],[sniper?29:18,0]],'#414e55');
 g.strokeStyle='#bdd0ce';g.lineWidth=.9;sline(g,4,-4,sniper?29:20,-4);g.strokeStyle=INK;g.lineWidth=1.4;
 if(sniper){
  spoly(g,[[13,3],[21,3],[20,10],[13,9]],'#3b474e');
  spoly(g,[[10,-8],[31,-8],[31,-6],[10,-6]],'#35454e');
  spoly(g,[[12,-15],[27,-15],[30,-12],[27,-9],[12,-9]],'#425863');
  scircle(g,29,-12,3.8,'#93cad8');g.strokeStyle='#e1f1eb';g.lineWidth=1;sline(g,14,-13,23,-13);
  g.strokeStyle=INK;spoly(g,[[tip-7,-5],[tip,-5],[tip,1],[tip-7,1]],'#6a7b81');
  sline(g,tip-5,-4,tip-5,0);sline(g,tip-2,-4,tip-2,0);
  g.strokeStyle='#354a53';for(let i=0;i<3;i++)sline(g,22+i*3,-1,22+i*3,1);
 }else{
  spoly(g,[[16,1],[tip-2,1],[tip-2,4],[16,4]],'#455961');
  spoly(g,[[18,2],[28,2],[28,7],[18,7]],'#927253');
  g.lineWidth=1;for(let i=0;i<3;i++)sline(g,20+i*3,3,20+i*3,6);
  spoly(g,[[2,-9],[17,-9],[17,-6],[2,-6]],'#36464b');
  g.strokeStyle='#d4b36f';g.lineWidth=1.6;for(let i=0;i<3;i++)sline(g,5+i*4,-8,5+i*4,-6);
  g.strokeStyle=INK;g.lineWidth=1.4;sline(g,tip-3,-4,tip-3,-7);
 }
 if(muzzle>0){g.strokeStyle='#e9a745';g.lineWidth=2;for(let i=-1;i<=1;i++)sline(g,tip,-2,tip+12,-2+i*5);}
 g.restore();
}
function drawEvolutionGun(g,lv,muzzle,type){
 g.save();g.strokeStyle=INK;g.lineWidth=2;g.lineJoin='round';g.lineCap='round';
 const tip=gunMuzzlePoint(type,lv).x,col=TIER[lv];
 if(type==='sniper'){
  if(lv===0){
   g.strokeStyle='#805b35';g.lineWidth=3;g.beginPath();g.moveTo(7,-21);g.quadraticCurveTo(25,-2,7,17);g.stroke();
   g.strokeStyle='#c8b898';g.lineWidth=1;g.beginPath();g.moveTo(7,-21);g.lineTo(muzzle?8:0,-2);g.lineTo(7,17);g.stroke();
   g.strokeStyle='#60472c';g.lineWidth=4;sline(g,16,-5,16,1);
  }else{
   spoly(g,[[-4,1],[18,-4],[27,-2],[9,4],[4,11],[-4,8]],'#775b3e');
   g.lineWidth=3;g.beginPath();g.moveTo(20,-18);g.quadraticCurveTo(35,-2,20,14);g.stroke();
   g.strokeStyle='#c8b898';g.lineWidth=1;g.beginPath();g.moveTo(20,-18);g.lineTo(muzzle?20:3,-2);g.lineTo(20,14);g.stroke();
  }
  if(!muzzle){g.strokeStyle='#806037';g.lineWidth=1.3;sline(g,0,-2,tip,-2);spoly(g,[[tip-4,-5],[tip,-2],[tip-4,1]],'#9bada9');}
 }else if(type==='laser'){
  spoly(g,[[0,-7],[tip-7,-7],[tip,-4],[tip,1],[0,3]],'#435961');
  spoly(g,[[1,2],[9,2],[7,12],[0,10]],'#39434c');
  if(lv>0)spoly(g,[[-8,-4],[0,-4],[0,4],[-8,7]],'#647984');
  for(let i=0;i<=lv;i++){g.strokeStyle='#64cbd0';g.lineWidth=2;sline(g,6+i*7,-5,6+i*7,1);}
  if(lv>=2){g.strokeStyle=INK;spoly(g,[[8,-12],[23,-12],[25,-7],[8,-7]],'#597881');scircle(g,22,-9,2,'#b0efe8');}
  if(lv===4){g.strokeStyle=INK;spoly(g,[[tip-12,-10],[tip,-8],[tip,-5],[tip-12,-6]],'#b3ded9');spoly(g,[[tip-12,4],[tip,1],[tip,5],[tip-12,8]],'#b3ded9');}
 }else if(type==='shotgun'){
  spoly(g,[[0,-5],[tip,-5],[tip,-1],[0,1]],'#68757a');
  spoly(g,[[-6,-1],[10,-1],[8,10],[-6,7]],lv>=3?'#4d4740':'#8b643f');
  if(lv>=1)spoly(g,[[8,-1],[tip,-1],[tip,2],[8,2]],'#566469');
  if(lv>=2)spoly(g,[[14,2],[tip-3,2],[tip-3,6],[14,6]],'#9b7649');
  if(lv>=3)spoly(g,[[8,3],[14,3],[14,14],[7,12]],col);
  if(lv===4){g.strokeStyle='#dfa128';g.lineWidth=2;sline(g,2,-7,tip-3,-7);}
 }else{
  spoly(g,[[1,-5],[tip,-5],[tip,-1],[1,1]],lv===4?'#59676b':'#7a8586');
  spoly(g,[[1,1],[9,1],[7,10],[0,8]],'#6d533a');
  if(lv>=2){spoly(g,[[10,1],[17,1],[15,12],[9,10]],'#3e494d');spoly(g,[[-8,-4],[0,-4],[0,3],[-8,6]],'#667277');}
  if(lv>=3)spoly(g,[[11,-10],[24,-10],[24,-5],[11,-5]],'#39454c');
  if(lv===4){g.strokeStyle='#dfa128';g.lineWidth=2;sline(g,3,-3,tip-3,-3);}
 }
 if(muzzle>0&&type!=='sniper'){
  g.strokeStyle=type==='laser'?'#85ece5':'#e9a745';g.lineWidth=type==='laser'?3:2;
  if(type==='laser'){sline(g,tip,-2,tip+14,-2);g.strokeStyle='#e5fff7';g.lineWidth=1;sline(g,tip,-2,tip+10,-2);}
  else for(let i=-1;i<=1;i++)sline(g,tip,-2,tip+9+lv,-2+i*5);
 }
 g.restore();
}

function drawRareGun(g, lv, muzzle, type) {
  const modelType=type,gold=type==='goldSniper';if(gold)type='sniper';if(type==='dropShotgun')type='shotgun';
  g.strokeStyle = INK; g.lineWidth = 2.2; g.lineCap = "round"; g.lineJoin = "round";
  let tip = 26;
  if (type === "shotgun") {
    const L = gunMuzzlePoint(modelType,lv).x;
    spoly(g, [[2, -6], [L, -6], [L, -2.6], [2, -2.6]], "#6f7a82");     // верхний ствол
    spoly(g, [[2, -2.4], [L, -2.4], [L, 1], [2, 1]], "#6f7a82");       // нижний
    spoly(g, [[-1, -2], [11, -2], [9, 12], [-4, 9]], "#7a5330");       // приклад
    spoly(g, [[12, 1], [21, 1], [21, 4.6], [12, 4.6]], "#8a6238");     // цевьё
    g.lineWidth = 1.4; sline(g, 14, 2.8, 19, 2.8); g.lineWidth = 2.2;
    tip = L;
  } else if (type === "sniper") {
    const L = gunMuzzlePoint(modelType,lv).x;
    spoly(g, [[2, -4], [L, -3], [L, -.6], [2, .6]], gold?'#c99a27':'#76848b');
    spoly(g, [[-2, -2], [12, -2], [10, 13], [-5, 10]], "#6b4a20");     // золотой приклад
    if(lv>=3||gold){spoly(g, [[10, -12], [26, -12], [26, -5.4], [10, -5.4]], gold?'#aa7616':'#50646c');// прицел
    scircle(g, 26, -8.7, 3.4, "#9fd6e8");
    g.strokeStyle="#fff0a4"; g.lineWidth = 1.4; sline(g, 12, -8.7, 22, -8.7); g.strokeStyle=INK; g.lineWidth = 2.2;}
    if(gold){spoly(g, [[L - 12, 1], [L - 9, 1], [L - 4, 11], [L - 7, 11]], "#9b741f");  // сошки
    spoly(g, [[L - 12, 1], [L - 9, 1], [L - 16, 11], [L - 19, 11]], "#9b741f");}
    tip = L;
  } else {
    const L = 26 + lv * 2;
    spoly(g, [[-2, -3], [10, -3], [9, 12], [-5, 9]], "#3f3a34");       // корпус
    spoly(g, [[8, 2], [19, 2], [19, 12], [8, 12]], "#5d666d");         // короб
    // блок стволов: сами стволы всегда горизонтальны, по кругу ходит
    // только их смещение и «глубина» — иначе выглядит как крутящееся солнце
    const sp = P.spin || 0, bars = [];
    for (let i = 0; i < 4; i++) {
      const a = sp + i * Math.PI / 2;
      const depth = (Math.cos(a) + 1) / 2;                // 0 — дальний, 1 — ближний
      bars.push({ oy: Math.sin(a) * 3.8, depth });
    }
    bars.sort((a, b) => a.depth - b.depth);               // дальние рисуем первыми
    for (const b of bars) {
      const th = 1.15 + b.depth * 1.15;
      const shade = b.depth > .55 ? "#a3acb3" : b.depth > .25 ? "#7b848b" : "#5f686e";
      g.save(); g.translate(12, -3);
      spoly(g, [[0, b.oy - th], [L, b.oy - th], [L, b.oy + th], [0, b.oy + th]], shade);
      g.restore();
    }
    scircle(g, 12, -3, 5.2, "#5d666d");
    tip = L + 12;
  }
  if (muzzle > 0) {
    g.strokeStyle = "#e08a2a"; g.lineWidth = 2.6;
    const n = type === "shotgun" ? 5 : 3;
    for (let i = 0; i < n; i++)
      sline(g, tip, -2, tip + 11 + lv * 2, -2 + (i - (n - 1) / 2) * (5 + lv));
    g.strokeStyle = INK; g.lineWidth = 2.2;
  }
}

function drawBasicGun(g, lv, muzzle) {
  g.strokeStyle = INK; g.lineWidth = 2.2; g.lineCap = "round"; g.lineJoin = "round";
  let tip = 20;
  if (lv === 0) {                                   // пистолет
    spoly(g, [[2, -4], [16, -4], [16, -.5], [2, 0]], "#9a8f82");
    spoly(g, [[3, 0], [8, 0], [7, 8], [2, 7]], "#6b4a2a");
    tip = 16;
  } else if (lv === 1) {                            // обрез, два ствола
    spoly(g, [[2, -5], [22, -5], [22, -2.6], [2, -2]], "#7f8a92");
    spoly(g, [[2, -2], [22, -1.6], [22, .8], [2, 1.4]], "#7f8a92");
    spoly(g, [[1, 1], [9, 1.4], [7, 10], [0, 8]], "#7a5330");
    tip = 22;
  } else if (lv === 2) {                            // винтовка с прицелом
    spoly(g, [[2, -4], [30, -3.4], [30, -1], [2, 1]], "#6f7a82");
    spoly(g, [[0, -2], [10, -2], [9, 9], [-2, 7]], "#7a5330");
    spoly(g, [[12, -8], [22, -8], [22, -4], [12, -4]], "#3d3a36");
    sline(g, 24, -2, 30, -2);
    tip = 30;
  } else if (lv === 3) {                            // тяжёлый автомат
    spoly(g, [[2, -5], [34, -4], [34, -1], [2, 1.5]], "#5d666d");
    spoly(g, [[0, -3], [12, -3], [11, 10], [-3, 8]], "#3f3a34");
    spoly(g, [[9, 1], [16, 1], [15, 13], [8, 12]], "#3f3a34");   // магазин
    spoly(g, [[14, -9], [24, -9], [24, -4.5], [14, -4.5]], "#2f2c28");
    sline(g, 26, -5, 33, -5);
    tip = 34;
  } else {                                          // плазменная пушка
    spoly(g, [[2, -7], [26, -6], [26, 1], [2, 3]], "#4a5a66");
    spoly(g, [[26, -9], [38, -12], [38, 6], [26, 4]], "#7fc7e0");   // раструб
    spoly(g, [[0, -4], [13, -4], [12, 12], [-4, 9]], "#3f3a34");
    for (let i = 0; i < 3; i++) { g.strokeStyle = "#e08a2a"; sline(g, 8 + i * 6, -8, 8 + i * 6, 4); }
    g.strokeStyle = INK;
    tip = 38;
  }
  if (muzzle > 0) {
    g.strokeStyle = "#e08a2a"; g.lineWidth = 2.4;
    for (let i = -1; i <= 1; i++) sline(g, tip, -2, tip + 10 + lv * 2, -2 + i * (6 + lv));
    g.strokeStyle = INK; g.lineWidth = 2.2;
  }
}

/* Рисует предмет в системе координат конечности: локальный верх направлен
   от кисти/ступни к плечу/бедру. Благодаря этому экипировка не съезжает в
   сложных позах и действительно ощущается надетой на персонажа. */
function onLimb(g, end, root, draw) {
  const a = Math.atan2(root[1] - end[1], root[0] - end[0]) + Math.PI / 2;
  g.save(); g.translate(end[0], end[1]); g.rotate(a); draw(); g.restore();
}

function menuBootGeometry(foot,knee,level,heading){
 const dx=knee[0]-foot[0],dy=knee[1]-foot[1],len=Math.max(.001,Math.hypot(dx,dy));
 const style=heroBootStyle(level),fraction=style.h/20,cuff=[dx*fraction,dy*fraction];
 const side=Math.sin(heading),nx=-dy/len,ny=dx/len,w=style.w*(.62+.18*Math.abs(side));
 const left=[cuff[0]-nx*w,cuff[1]-ny*w],right=[cuff[0]+nx*w,cuff[1]+ny*w];
 const heel=-w-1-Math.max(0,-side)*style.toe*.8,toe=w+1+Math.max(0,side)*style.toe*.8;
 const plateReach=3.2,up=[dx/len,dy/len];
 return {
  hull:[left,right,[w,-3],[toe,-2],[toe+.5,0],[heel-.5,0],[heel,-2],[-w,-3]],
  cuff:[left,right],
  seam:[[-w,-3],[w,-3]],
  sole:[[heel-.5,0],[toe+.5,0]],
  rivet:[cuff[0]*.375+w*.7*side,cuff[1]*.375],
  // The arena's pale diamond guard is attached to the cuff, in the shin plane.
  plate:[left,[cuff[0]+up[0]*plateReach,cuff[1]+up[1]*plateReach],right,[cuff[0]-up[0]*plateReach,cuff[1]-up[1]*plateReach]],
  stripe:[[cuff[0]-nx*(w-1)-up[0]*4,cuff[1]-ny*(w-1)-up[1]*4],[cuff[0]+nx*(w-1)-up[0]*4,cuff[1]+ny*(w-1)-up[1]*4]],
  fin:[[cuff[0]*.6-w*side,cuff[1]*.6],[cuff[0]*.6-(w+5)*side,cuff[1]*.6-3],[cuff[0]*.6-(w+1)*side,cuff[1]*.6+3]],
  side
 };
}
function heroBootStyle(level){return {h:[0,7,10,13,16][level],w:4.2+level*.55,toe:5+level};}
function drawMenuHeroBoot(g,foot,knee,level,color,line,detail,heading){
 const b=menuBootGeometry(foot,knee,level,heading);
 g.save();g.translate(...foot);g.strokeStyle=INK;g.lineWidth=line;g.lineJoin='round';
 if(level>=4){g.save();g.globalAlpha*=Math.abs(b.side);spoly(g,b.fin,'#f2c45e');g.restore();}
 spoly(g,b.hull,color);
 g.lineWidth=detail;g.strokeStyle=level>=3?'#fff0b9':'#efe6d2';
 if(level>=2)sline(g,...b.stripe[0],...b.stripe[1]);
 if(level>=3){g.strokeStyle=INK;spoly(g,b.plate,'#efe6d2');}
 g.strokeStyle=INK;sline(g,...b.seam[0],...b.seam[1]);sline(g,...b.sole[0],...b.sole[1]);
 if(level>=4){g.fillStyle='#fff4c2';g.beginPath();g.arc(...b.rivet,1.15,0,Math.PI*2);g.fill();}
 g.restore();
}
function drawHeroBoot(g, foot, hip, face, level, color, line, detail, heading) {
  if(Number.isFinite(heading)){drawMenuHeroBoot(g,foot,hip,level,color,line,detail,heading);return;}
  onLimb(g, foot, hip, () => {
    g.save(); g.scale(face, 1); g.strokeStyle = INK; g.lineWidth = line;
    const {h,w} = heroBootStyle(level);
    if(Number.isFinite(heading)){
      const d=Math.sin(heading),left=(5+level)*Math.max(0,-d),right=(5+level)*Math.max(0,d);
      spoly(g,[[-w,-h],[w,-h+1],[w+1,-1],[w+right,1],[-w-left-1,1],[-w-1,-1]],color);
    }else spoly(g, [[-w, -h], [w, -h + 1], [w + 1, -1], [w + 5 + level, 1],[-w - 1, 1]], color);
    g.lineWidth = detail;
    if (level >= 2) { g.strokeStyle = "#efe6d2"; sline(g, -w + 1, -h + 4, w - 1, -h + 4); }
    if (level >= 3) {
      g.strokeStyle = INK; sline(g, -w, -4, w + 2, -3);
      spoly(g, [[-w - 1, -h], [0, -h - 4], [w + 1, -h + 1], [0, -h + 4]], "#efe6d2");
    }
    if (level >= 4) {
      g.fillStyle = "#f2c45e"; g.strokeStyle = INK;
      if(Number.isFinite(heading)){
        const d=Math.sin(heading);
        if(Math.abs(d)>.12)spoly(g,[[-w*d,-9],[-(w+7)*d,-12],[-(w+3)*d,-6]],"#f2c45e");
      }else spoly(g, [[-w, -9], [-w - 7, -12], [-w - 3, -6]], "#f2c45e");
      g.fillStyle = "#fff4c2"; g.beginPath(); g.arc(w + 2, -6, 1.7, 0, 7); g.fill();
    }
    g.restore();
  });
}

function drawHeroGlove(g, hand, shoulder, level, color, line, detail) {
  onLimb(g, hand, shoulder, () => {
    g.strokeStyle = INK; g.lineWidth = line;
    const w = 3.8 + level * .65, h = 5 + level * 1.25;
    spoly(g, [[-w, -h], [w, -h], [w + 1.5, 2], [1.5, 4], [-w - 1, 2]], color);
    if (level >= 2) {
      g.lineWidth = detail; g.strokeStyle = "#efe6d2";
      sline(g, -w + 1, -h + 3, w - 1, -h + 3);
    }
    if (level >= 3) {
      g.strokeStyle = INK; g.lineWidth = detail;
      for (let i = -1; i <= 1; i++) sline(g, i * 2.2, -1, i * 2.5, 2.5);
    }
    if (level >= 4) {
      g.fillStyle = "#fff4c2"; g.beginPath(); g.arc(0, -h + 3.2, 2, 0, 7); g.fill();
      g.strokeStyle = "#e08a2a"; g.lineWidth = detail; g.stroke();
    }
  });
}

function menuCapeGeometry(level,Q,phase){
 const c=Math.cos(Q.yaw),s=Math.sin(Q.yaw),top=Q.neck+1,bottom=Q.hip+7+level*4;
 const wind=Math.sin(phase*.55)*2.4-(Q.lean||0)*14;
 const project=([x,y,z])=>[x*c+z*s,y];
 // Cloth hangs from both shoulders, always behind the torso in local space.
 const outline=level===1?[
  ['M',[-5,top,-6]],['Q',[-8,top+5,-12],[-9,top+10,-23+wind]],
  ['L',[0,top+14,-24+wind]],['Q',[7,top+5,-12],[5,top,-6]]
 ]:[
  ['M',[-6,top,-7]],['Q',[-12,top+9,-24],[-15,bottom,-30+wind]],
  ['L',[-5,bottom-5,-24+wind]],['L',[0,bottom+1,-19+wind]],
  ['L',[6,bottom-4,-13+wind]],['Q',[14,bottom,-13+wind],[12,Q.hip-1,-9]],
  ['Q',[9,top+8,-9],[6,top,-7]]
 ];
 const trim=level<2?[]:[
  [['M',[-5,top+3,-7.5]],['Q',[-10,top+12,-23],[-12,bottom-4,-28+wind]]],
  [['M',[5,top+3,-7.5]],['Q',[9,top+12,-10],[9,bottom-6,-16+wind]]]
 ];
 const map=path=>path.map(([op,...points])=>[op,...points.flatMap(project)]);
 return {outline:map(outline),trim:trim.map(map),foreground:c<0};
}
function drawCapePattern(g,style,x,y,w,h,phase=0){
 if(!style||style==='classic')return;
 g.save();g.translate(x,y);g.scale(w/30,h/35);g.lineWidth=1.1;
 if(style==='ranger'){
  g.strokeStyle='#c3c19b';for(let i=0;i<4;i++){sline(g,-12+i*7,23,-9+i*7,29);sline(g,-9+i*7,25,-6+i*7,31);}
  g.fillStyle='#899660';g.fillRect(-12,6,8,9);g.strokeRect(-12,6,8,9);
 }else if(style==='royal'){
  spoly(g,[[-12,0],[12,0],[9,28],[0,34],[-9,28]],'#c6a457');
  spoly(g,[[-8,1],[8,1],[6,23],[0,29],[-6,23]],'#663257');
  g.strokeStyle='#f4d58c';spoly(g,[[-5,10],[-3,15],[3,15],[5,10],[1,12],[0,8],[-1,12]],'#f4d58c');
 }else if(style==='astral'){
  g.strokeStyle='#849ecd';g.beginPath();g.moveTo(-8,7);g.lineTo(5,12);g.lineTo(-4,23);g.lineTo(8,29);g.stroke();
  for(const [a,b] of [[-8,7],[5,12],[-4,23],[8,29]]){g.fillStyle='#d4e3fa';g.beginPath();g.arc(a,b,1.3,0,7);g.fill();}
 }else if(style==='tide'){
  g.strokeStyle='#b9e1d3';for(let j=0;j<3;j++){g.beginPath();g.moveTo(-16,12+j*8);g.quadraticCurveTo(-4,5+j*8,3,12+j*8);g.quadraticCurveTo(10,18+j*8,17,12+j*8);g.stroke();}
 }else if(style==='ember'){
  for(let i=0;i<5;i++){const a=-14+i*7,b=25+Math.sin(phase*.5+i)*2;spoly(g,[[a-3,36],[a,b],[a+2,30],[a+5,23],[a+5,36]],i%2?'#e6a253':'#efc579');}
 }
 g.restore();
}
function drawMenuCape(g,level,Q,phase,line,detail,color,style='classic'){
 const cape=menuCapeGeometry(level,Q,phase);
 const path=commands=>{
  g.beginPath();
  for(const [op,...p] of commands){
   if(op==='M')g.moveTo(...p);else if(op==='Q')g.quadraticCurveTo(...p);else g.lineTo(...p);
  }
 };
 g.save();g.lineJoin='round';g.strokeStyle=INK;g.lineWidth=line;
 path(cape.outline);g.closePath();g.fillStyle=color||TIER[level];g.fill();g.stroke();
 g.save();g.clip();const pts=cape.outline.flatMap(c=>{const a=[];for(let i=1;i<c.length;i+=2)a.push([c[i],c[i+1]]);return a;}),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
 const lo=Math.min(...xs),hi=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
 drawCapePattern(g,style,(lo+hi)/2,top,hi-lo,bottom-top,phase);g.restore();
 g.strokeStyle=level>=3?'#f2c45e':'#efe6d2';g.lineWidth=detail;
 for(const trim of cape.trim){path(trim);g.stroke();}
 g.restore();
}
function menuBackpackFrame(Q){
 const c=Math.cos(Q.yaw),s=Math.sin(Q.yaw);
 const project=([x,y,z])=>[x*c+z*s,y+.12*(z*c-x*s)];
 return {c,s,project,foreground:c<0,strapOpacity:Math.max(0,c)};
}
// Canonical arena equipment: the menu projects these same contours, not a redesign.
function heroBackpackModel(level,Q){
 const top=Q.neck+1,bottom=Q.hip+1;
 return {
  hull:[[-23,top+3],[-18,top-2],[-7,top],[-7,bottom],[-20,bottom+1],[-24,bottom-4]],
  panel:[[-21,top+5],[-10,top+3],[-10,bottom-3],[-21,bottom-2]],
  handle:[[-18,top],[-18,top-5],[-12,top-5],[-12,top]],
  cells:Array.from({length:level},(_,i)=>[[-18+i*3.1,bottom-7],[-16+i*3.1,bottom-7],[-16+i*3.1,bottom-3],[-18+i*3.1,bottom-3]]),
  trim:[[-21,top+5],[-10,top+3]],core:[-15,top+11],
  barrel:[[1,-2.8],[9,-2.8],[11,-1.7],[11,1.7],[1,2.8]],
  ports:Array.from({length:level},(_,i)=>backpackPort(i,1,Q.neck))
 };
}
function menuBackpackGeometry(level,Q){
 const frame=menuBackpackFrame(Q),{c,s,project}=frame,faces=[],model=heroBackpackModel(level,Q);
 const add=(points,color,thin=false,surface='body')=>faces.push({points:points.map(project),depth:points.reduce((sum,p)=>sum+p[2]*c-p[0]*s,0)/points.length,color,thin,surface});
 const plane=(points,x)=>points.map(([z,y])=>[x,y,z]);
 const solid=(outline,width,color,center=0,surface='body')=>{
  add(plane(outline,center-width),color,false,surface);add(plane(outline,center+width),color,false,surface);
  outline.forEach((a,i)=>{const b=outline[(i+1)%outline.length];add([...plane([a,b],center-width),...plane([b,a],center+width)],color,'fill',surface);});
 };
 const line=(a,b,x,color,width=.65)=>{
  const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,nx=-dy/len*width,ny=dx/len*width;
  add(plane([[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]],x),color,'fill');
 };
 solid(model.hull,6,'#665744');
 for(const side of [-1,1]){
  const x=side*6.1;
  add(plane(model.panel,x),TIER[level]);
  for(const cell of model.cells)add(plane(cell,x+side*.1),'#efcd77',true);
  for(let i=1;i<model.handle.length;i++)line(model.handle[i-1],model.handle[i],x,INK);
  if(level===3){
   line(...model.trim,x+side*.1,'#edcf85');
   add(plane(Array.from({length:16},(_,i)=>[model.core[0]+Math.cos(i*Math.PI/8)*3,model.core[1]+Math.sin(i*Math.PI/8)*3]),x+side*.15),'#bce1e3',true);
  }
 }
 // Rear shell is a real body-local surface, not the extruded edge of the side plate.
 // Its palette and power cells match the existing arena equipment.
 const top=Q.neck+1,bottom=Q.hip+1;
 const rear=(points,z,color,surface)=>add(points.map(([x,y])=>[x,y,z]),color,true,surface);
 rear([[-5,top+4],[-3.8,top+2],[3.8,top+2],[5,top+4],[5,bottom-3],[3.5,bottom-1],[-3.5,bottom-1],[-5,bottom-3]],-24.2,TIER[level],'rear-panel');
 rear([[-4.4,top+4],[4.4,top+4],[4.4,top+5],[-4.4,top+5]],-24.4,'#edcf85','rear-trim');
 for(let i=0;i<level;i++){
  const x=(i-(level-1)/2)*3;
  rear([[x-.85,bottom-7],[x+.85,bottom-7],[x+.85,bottom-3],[x-.85,bottom-3]],-24.5,'#efcd77','rear-cell');
 }
 if(level===3)rear(Array.from({length:16},(_,i)=>[Math.cos(i*Math.PI/8)*2.6,top+11+Math.sin(i*Math.PI/8)*2.6]),-24.6,'#bce1e3','rear-core');
 for(const p of model.ports){
  const transform=([x,y])=>[p.x+x*Math.cos(p.a)-y*Math.sin(p.a),p.y+x*Math.sin(p.a)+y*Math.cos(p.a)];
  // Separate narrow side modules: never extrude a barrel across the entire pack.
  for(const side of [-1,1]){
   solid(Array.from({length:16},(_,i)=>transform([Math.cos(i*Math.PI/8)*3.5,Math.sin(i*Math.PI/8)*3.5])),.8,TIER[level],side*6.1,'module');
   solid(model.barrel.map(transform),1.05,'#a4a49a',side*6.4,'module');
   line(transform([7,-2.4]),transform([7,2.4]),side*7.5,INK);
  }
 }
 faces.sort((a,b)=>a.depth-b.depth);
 return {...frame,faces};
}
function drawMenuBackpack(g,level,Q,line){
 const rig=menuBackpackGeometry(level,Q);g.save();g.strokeStyle=INK;g.lineWidth=line;g.lineJoin='round';
 for(const face of rig.faces){
  g.lineWidth=face.thin?line*.42:line;
  if(face.thin==='fill'){
   g.beginPath();g.moveTo(...face.points[0]);face.points.slice(1).forEach(p=>g.lineTo(...p));g.closePath();g.fillStyle=face.color;g.fill();
  }else spoly(g,face.points,face.color);
 }
 g.restore();
}
function drawCombatBackpack(g,face,level,Q,flashes,line,detail){
  if(!level)return;
  if(Number.isFinite(Q.yaw)){drawMenuBackpack(g,level,Q,line);return;}
  const top=Q.neck+1,bottom=Q.hip+1,color=TIER[level],model=heroBackpackModel(level,Q);
  g.save();g.scale(face,1);g.strokeStyle=INK;g.lineWidth=line;
  // A rigid pack, handle, metal face plate and progressively larger power cells.
  spoly(g,model.hull,"#665744");
  spoly(g,model.panel,color);
  g.lineWidth=detail;sline(g,-18,top,-18,top-5);sline(g,-18,top-5,-12,top-5);sline(g,-12,top-5,-12,top);
  for(let i=0;i<level;i++){
    spoly(g,model.cells[i],"#efcd77");
  }
  if(level===3){g.strokeStyle="#edcf85";sline(g,-21,top+5,-10,top+3);scircle(g,-15,top+11,3,"#bce1e3");}
  g.restore();
  for(let i=0;i<level;i++){
    const p=backpackPort(i,face,Q.neck);
    g.save();g.translate(p.x,p.y);g.rotate(p.a);g.strokeStyle=INK;g.lineWidth=line;
    scircle(g,0,0,3.5,color);
    spoly(g,model.barrel,"#a4a49a");
    g.lineWidth=detail;sline(g,7,-2.4,7,2.4);
    if((flashes?.[i]||0)>0){
      g.strokeStyle="#c18b27";g.lineWidth=detail;
      spoly(g,[[10,-1],[17,-4],[15,0],[21,1],[14,3],[10,1]],"#fff0a0");
    }
    g.restore();
  }
}

/* ── человечек: линии + одежда + ружьё ────────────────────── */
/* Пропорции героя (локальные единицы, ступни на y = 0):
   бедро -18 · плечи -40 · шея -44 · голова -52, r 8.5
   Толщина линий задаёт иерархию: скелет 3.0, одежда 2.2, мелочи 1.4 —
   иначе всё сливается в кашу.                                        */
/* pose — необязательный набор точек, которым можно полностью
   переопределить позу. Нужен для ульты: там свои ключевые кадры. */
function drawMenuHeroHead(g,Q,gear,skinLine,clothLine,detail){
 const yaw=Q.headYaw??Q.yaw,side=Math.sin(yaw),rear=Math.max(0,-Math.cos(yaw)),visible=1-Math.min(1,rear*1.7);
 const helmet=TIER[Math.max(1,Math.min(4,gear.helm||4))],profile=Math.abs(side);
 g.save();g.translate(...Q.head);g.rotate(Q.headTilt||0);g.strokeStyle=INK;g.lineWidth=clothLine;
 // Opaque full-face armour. No skin, eyes, mouth or facial layer underneath.
 g.beginPath();g.moveTo(-9,-3);g.bezierCurveTo(-9.5,-8,-5,-11,0,-11.2);g.bezierCurveTo(5,-11,9.5,-8,9,-3);
 g.lineTo(8.1,6.2);g.lineTo(0,9);g.lineTo(-8.1,6.2);g.closePath();g.fillStyle=helmet;g.fill();g.stroke();
 spoly(g,[[-6,-9],[-6.8,-14],[-2,-11],[0,-16],[2,-11],[6.8,-14],[6,-9]],'#f4c95f');
 g.strokeStyle='#fff0ab';g.lineWidth=1.1;sline(g,-5.5,-7.3,3,-8.4);
 const center=side*2.8,width=7.2-profile*2.7;
 g.save();g.globalAlpha*=visible;g.strokeStyle=INK;g.lineWidth=1.5;
 spoly(g,[[center-width,-3],[center+width,-2.7],[center+width-.7,1.4],[center-width+.7,1.4]],'#302b3d');
 g.strokeStyle='#bcdce2';g.lineWidth=.8;sline(g,center-width+1,-1.4,center+width-1,-1.2);
 g.strokeStyle='#7d551c';g.lineWidth=.85;
 for(let i=-1;i<=1;i++)sline(g,center+i*1.9,4,center+i*1.9,5.4);
 g.restore();
 g.strokeStyle='#a77627';g.lineWidth=1.2;sline(g,-7.8,2,-5.7,6);sline(g,7.8,2,5.7,6);
 if(rear>.01){g.save();g.globalAlpha*=rear;g.strokeStyle='#fff0ab';g.lineWidth=1.2;sline(g,0,-6,0,6);g.strokeStyle='#a77627';sline(g,-4,3,4,3);g.restore();}
 g.restore();
}
function heroWeaponHoldPose(gear,aim,pose,face=1,muzzle=0){
 const Q={...pose},w=gear._w||'basic',L=gear.gun||0,push=gear.jacket?6.5:3.5;
 const origin=[Q.gunAt[0]*face+Math.cos(aim)*push,Q.gunAt[1]+Math.sin(aim)*push];
 const project=([x,y])=>[(origin[0]+1.3*(Math.cos(aim)*x-Math.sin(aim)*face*y))*face,origin[1]+1.3*(Math.sin(aim)*x+Math.cos(aim)*face*y)];
 const bow=w==='sniper'&&L===0;
 Q.af=project(weaponTriggerPoint(w,L));
 Q.sf=[6,Q.neck+3];Q.sb=[-4,Q.neck+4];
 if(bow)Q.ab=project([muzzle>0?8:0,-2]);
 else{
  // Slide along the actual foregrip instead of stretching the arm to the muzzle.
  // Intersect its line with the shoulder's reach circle; when a scripted pose
  // cannot reach it, use the closest available point on the grip.
  const far=Math.min(21,gunMuzzlePoint(w,L).x*.56),near=Math.min(far,9);
  const base=project([0,4]),vx=Math.cos(aim)*face,vy=Math.sin(aim);
  const dx=base[0]-Q.sb[0],dy=base[1]-Q.sb[1],along=dx*vx+dy*vy,cross=dx*vy-dy*vx;
  const grip=Math.max(near,Math.min(far,(-along+Math.sqrt(Math.max(0,30*30-cross*cross)))/1.3));
  Q.ab=project([grip,4]);
 }
 // One continuous bend branch: crossing the shoulder's vertical must not flip
 // the elbow. The bend vanishes smoothly if the wrist reaches the shoulder.
 const elbow=(s,h)=>{const dx=h[0]-s[0],dy=h[1]-s[1],k=Math.min(.24,9/Math.max(.01,Math.hypot(dx,dy)));return [(s[0]+h[0])/2-dy*k,(s[1]+h[1])/2+dx*k];};
 Q.ef=elbow(Q.sf,Q.af);Q.eb=elbow(Q.sb,Q.ab);Q.weaponHeld=true;return Q;
}
function drawHero(g, x, y, face, phase, gear, sc, aim, muzzle, pose, bold) {
  const sw = Math.sin(phase) * .6;
  const D = {
    lf: [sw * 11, -2], lb: [-sw * 11, -2],      // ступни
    af: [11, -27], ab: [-10, -26 + sw * 4],     // кисти
    hip: -18, neck: -40, head: [0, -52],
    gunAt: [2, -27], lean: 0, squash: 1,
  };
  let Q = pose ? Object.assign({}, D, pose) : D;
  const bootShoulderF=Q.sf,bootShoulderB=Q.sb; // An arm grip must not change the leg/boot pose.
  if(gear._holdWeapon&&!gear._holstered){
    if(!pose?.gunAt)Q={...Q,gunAt:heroRestWeaponAnchor(gear._w||'basic',gear.gun||0,gear.jacket,aim,face,Q.neck)};
    Q=heroWeaponHoldPose(gear,aim,Q,face,muzzle);
  }
  const capeStyle=gear._campStyle||((typeof P!=='undefined'&&P.campStyle)||'classic');
  const capeColor=typeof campCapeColor==='function'?campCapeColor(capeStyle):null;
  g.save();
  g.translate(x, y);
  g.scale(sc, sc);
  if (Q.lean || Q.squash !== 1) {
    // Вращаем и сжимаем уже в локальных координатах героя, вокруг ступней.
    // Если сделать это до translate(x, y), наклон поворачивает координаты всего
    // мира и визуально уносит персонажа от его настоящей позиции.
    g.rotate(Q.lean); g.scale(1, Q.squash);
  }
  g.lineCap = "round"; g.lineJoin = "round";
  const C = l => TIER[Math.min(4, l)];
  const B = bold || 1;
  const SK = 3.0 * B, CL = 2.2 * Math.min(B, 1.7), DT = 1.4 * Math.min(B, 1.4);

  // Тень под ногами — привязывает фигуру к земле.
  if (!gear._noShadow) {
    g.globalAlpha = .13; g.fillStyle = INK;
    g.beginPath(); g.ellipse(0, 1, 13, 3.6, 0, 0, 7); g.fill(); g.globalAlpha = 1;
  }

  /* ── ПЛАЩ / ШАРФ: крепится к плечам и реагирует на движение ── */
  if(gear.cape&&Number.isFinite(Q.yaw)&&Math.cos(Q.yaw)>=0)drawMenuCape(g,gear.cape,Q,phase,CL,DT,capeColor,capeStyle);
  if (gear.cape&&!Number.isFinite(Q.yaw)) {
    const L = gear.cape, top = Q.neck + 1, bottom = Q.hip + 7 + L * 4;
    const wind = Math.sin(phase * .55) * 2.4 - (Q.lean || 0) * 14;
    g.save(); g.scale(face, 1); g.strokeStyle = INK; g.lineWidth = CL;
    if (L === 1) {
      g.beginPath(); g.moveTo(-3, top); g.quadraticCurveTo(-13, top + 1 + wind, -22, top + 8 + wind);
      g.lineTo(-17, top + 12 + wind); g.quadraticCurveTo(-9, top + 8, 3, top + 4);
      g.closePath(); g.fillStyle = capeColor||C(L); g.fill(); g.stroke();
    } else {
      g.beginPath(); g.moveTo(-6, top); g.quadraticCurveTo(-18 - L * 2, top + 8 + wind, -22 - L * 3, bottom + wind);
      if (L >= 3) { g.lineTo(-14, bottom - 6 + wind); g.lineTo(-9, bottom + 2 + wind); }
      g.quadraticCurveTo(-1, bottom - 3, 6, Q.hip - 1); g.lineTo(5, top + 4); g.closePath();
      g.fillStyle = capeColor||C(L); g.fill(); g.stroke();
      g.save();g.clip();drawCapePattern(g,capeStyle,-11,top,36,bottom-top,phase);g.restore();
      g.lineWidth = DT; g.strokeStyle = L >= 3 ? "#f2c45e" : "#efe6d2";
      g.beginPath(); g.moveTo(-5, top + 4); g.quadraticCurveTo(-13, top + 12 + wind, -17 - L * 2, bottom - 3 + wind); g.stroke();
      if (L >= 3) { g.beginPath(); g.moveTo(-1, top + 2); g.lineTo(5, top + 7); g.stroke(); }
    }
    g.restore();
  }

  if(!Number.isFinite(Q.yaw)||Math.cos(Q.yaw)>=0)drawCombatBackpack(g,face,gear.clip||0,Q,gear._backpackFlash,CL,DT);

  /* ── НОГИ и сапоги, привязанные к каждой ступне ── */
  g.strokeStyle = INK; g.lineWidth = gear._chem ? 8 : SK;
  const legs=[[Q.lb,Q.kb,Q.hb||[0,Q.hip],Q.legDepthB||0],[Q.lf,Q.kf,Q.hf||[0,Q.hip],Q.legDepthF||0]];
  if(Q.hf)legs.sort((a,b)=>a[3]-b[3]);
  for(const [foot,knee,root] of legs){
    g.strokeStyle=INK;g.lineWidth=gear._chem?8:SK;
    if(knee){sline(g,...root,...knee);sline(g,...knee,...foot);}
    else sline(g,0,Q.hip,foot[0],foot[1]);
    if(Q.hf&&gear.boots)drawHeroBoot(g,foot,knee,face,gear.boots,C(gear.boots),CL,DT,Q.yaw);
  }
  if (gear._chem) {
    g.strokeStyle = "#c7d86c"; g.lineWidth = 4.8;
    sline(g, 0, Q.hip, Q.lb[0], Q.lb[1]); sline(g, 0, Q.hip, Q.lf[0], Q.lf[1]);
  }
  if (gear.boots&&!Q.hf) {
    drawHeroBoot(g, Q.lb, bootShoulderB?[Q.lb[0],Q.lb[1]-20]:Q.kb||[0, Q.hip], face, gear.boots, C(gear.boots), CL, DT,Q.yaw);
    drawHeroBoot(g, Q.lf, bootShoulderF?[Q.lf[0],Q.lf[1]-20]:Q.kf||[0, Q.hip], face, gear.boots, C(gear.boots), CL, DT,Q.yaw);
  }

  /* ── ТОРС и новая посадка куртки ── */
  g.strokeStyle = INK; g.lineWidth = SK; sline(g, 0, Q.hip, 0, Q.neck);
  // Articulated arms start to either side of the spine. Join their shoulders
  // to the chest before clothing covers the skeleton (also for menu poses).
  if((Q.sf&&Q.ef)||(Q.sb&&Q.eb)){
    g.save();g.scale(face,1);
    if(Q.sb&&Q.eb)sline(g,0,Q.neck+2,...Q.sb);
    if(Q.sf&&Q.ef)sline(g,0,Q.neck+2,...Q.sf);
    g.restore();
  }
  if (gear.jacket) {
    const L = gear.jacket, top = Q.neck + 2, bottom = Q.hip + 1;
    const width=Number.isFinite(Q.yaw)?1-.18*Math.abs(Math.sin(Q.yaw)):1;
    g.save(); g.scale(face*width, 1); g.strokeStyle = INK; g.lineWidth = CL;
    if (L === 1) {                                      // приталенный жилет
      spoly(g, [[-7.5, top], [7.5, top], [6, bottom], [-6, bottom]], C(L));
      const front=Number.isFinite(Q.yaw)?Math.max(0,Math.min(1,Math.cos(Q.yaw)*2+.6)):1;
      g.save();g.globalAlpha*=front;
      spoly(g, [[-4.5, top], [0, top + 7], [4.5, top]], PAPER);
      g.lineWidth = DT; sline(g, 0, top + 7, 0, bottom - 1);g.restore();
      if(front<1){g.save();g.globalAlpha*=1-front;g.strokeStyle='#4c753e';g.lineWidth=DT;sline(g,-4,top+6,4,top+6);sline(g,0,top+7,0,bottom-2);g.restore();}
    } else if (L === 2) {                               // длинная куртка с лацканами
      spoly(g, [[-9, top], [9, top], [7.2, bottom + 8], [1, bottom + 4],
                [0, bottom + 9], [-7.2, bottom + 8]], C(L));
      spoly(g, [[-8, top + 1], [-2, top], [-5, top + 9], [0, top + 6]], "#efe6d2");
      spoly(g, [[8, top + 1], [2, top], [5, top + 9], [0, top + 6]], "#efe6d2");
      g.fillStyle = "#efe6d2"; g.beginPath(); g.arc(0, top + 12, 1.4, 0, 7); g.fill();
    } else {                                            // цельная бронекуртка
      spoly(g, [[-10, top + 2], [-6, top - 2], [6, top - 2], [10, top + 2],
                [7.5, bottom], [0, bottom + 3], [-7.5, bottom]], C(L));
      spoly(g, [[-5.5, top + 2], [0, top + 6], [5.5, top + 2], [4, bottom - 2],
                [0, bottom + 1], [-4, bottom - 2]], "#6f5aa3");
      g.lineWidth = DT; g.strokeStyle = "#efe6d2";
      sline(g, -5, top + 10, 5, top + 10); sline(g, 0, top + 6, 0, bottom);
      g.strokeStyle = INK; g.lineWidth = CL;
      scircle(g, -10, top + 3, 4.8, C(L)); scircle(g, 10, top + 3, 4.8, C(L));
    }
    g.restore();
  }
  if (gear._chem) {                                    // герметичный комбинезон поверх одежды
    g.save(); g.scale(face, 1); g.strokeStyle = INK; g.lineWidth = CL;
    spoly(g, [[-10,Q.neck+1],[10,Q.neck+1],[8,Q.hip+3],[0,Q.hip+6],[-8,Q.hip+3]], "#c7d86c");
    g.strokeStyle = "#eef4ae"; g.lineWidth = DT; sline(g, 0, Q.neck+4, 0, Q.hip+2);
    spoly(g, [[3,Q.neck+7],[8,Q.neck+8],[7,Q.neck+15],[3,Q.neck+14]], "#728d50");
    g.restore();
  }

  /* ── РЕМНИ РЮКЗАКА поверх торса, сам корпус остаётся за спиной ── */
  if(Number.isFinite(Q.yaw)&&Math.cos(Q.yaw)<0){
    if(gear.cape)drawMenuCape(g,gear.cape,Q,phase,CL,DT,capeColor,capeStyle);
    drawCombatBackpack(g,face,gear.clip||0,Q,gear._backpackFlash,CL,DT);
  }
  if (gear.clip) {
    if(Number.isFinite(Q.yaw)){
      const rig=menuBackpackFrame(Q);g.save();g.globalAlpha*=rig.strapOpacity;g.strokeStyle='#64533d';g.lineWidth=2.5;
      for(const x of [-5,5])sline(g,...rig.project([x,Q.neck+3,5]),...rig.project([x*.7,Q.hip-1,5]));
      sline(g,...rig.project([-6,Q.hip-1,5]),...rig.project([6,Q.hip-1,5]));g.restore();
    }else{
      g.save();g.scale(face,1);g.strokeStyle="#64533d";g.lineWidth=3.2;
      sline(g,-5,Q.neck+3,4,Q.hip-2);sline(g,-7,Q.hip-1,7,Q.hip-1);
      g.strokeStyle=INK;g.lineWidth=DT;spoly(g,[[0,Q.hip-7],[5,Q.hip-7],[5,Q.hip-3],[0,Q.hip-3]],"#e5bf63");
      g.restore();
    }
  }

  /* ── ЗАДНЯЯ РУКА И ПЕРЧАТКА ── */
  g.save(); g.scale(face, 1); g.strokeStyle = INK; g.lineWidth = gear._chem ? 8 : SK;
  if(Q.eb&&Q.sb){sline(g,...Q.sb,...Q.eb);sline(g,...Q.eb,...Q.ab);}
  else sline(g, 0, Q.neck + 2, Q.ab[0], Q.ab[1]);
  if (gear._chem) { g.strokeStyle = "#c7d86c"; g.lineWidth = 4.8; sline(g, 0, Q.neck + 2, Q.ab[0], Q.ab[1]); }
  if (gear.gloves&&!Q.weaponHeld) drawHeroGlove(g, Q.ab, Q.eb||[0, Q.neck + 2], gear.gloves, C(gear.gloves), CL, DT);
  g.restore();

  /* ── ОРУЖИЕ ── */
  // Точка крепления зеркалится вместе с телом, затем оружие чуть выносится
  // по направлению прицела. При взгляде влево зеркалим модель после поворота
  // на aim + PI: ствол смотрит в цель, но рукоять не переворачивается вверх.
  if(!gear._holstered){
  const gunPush = gear.jacket ? 6.5 : 3.5;
  const gunX = Q.gunAt[0] * face + Math.cos(aim) * gunPush;
  const gunY = Q.gunAt[1] + Math.sin(aim) * gunPush;
  g.save(); g.translate(gunX, gunY); g.rotate(face > 0 ? aim : aim + Math.PI);
  g.scale(face * 1.3, 1.3); if(!gear._holstered)drawGunModel(g, gear.gun || 0, muzzle, gear._w); g.restore();
  }

  /* ── ПЕРЕДНЯЯ РУКА И ПЕРЧАТКА ── */
  if(Q.weaponHeld){g.save();g.scale(face,1);if(gear.gloves)drawHeroGlove(g,Q.ab,Q.eb,gear.gloves,C(gear.gloves),CL,DT);else{g.strokeStyle=INK;g.lineWidth=1.2;scircle(g,...Q.ab,1.9,PAPER);}g.restore();}
  g.save(); g.scale(face, 1); g.strokeStyle = INK; g.lineWidth = gear._chem ? 8 : SK;
  if(Q.ef&&Q.sf){sline(g,...Q.sf,...Q.ef);sline(g,...Q.ef,...Q.af);}
  else sline(g, 0, Q.neck + 2, Q.af[0], Q.af[1]);
  if (gear._chem) { g.strokeStyle = "#c7d86c"; g.lineWidth = 4.8; sline(g, 0, Q.neck + 2, Q.af[0], Q.af[1]); }
  if (gear.gloves) drawHeroGlove(g, Q.af, Q.ef||[0, Q.neck + 2], gear.gloves, C(gear.gloves), CL, DT);
  else if(Q.weaponHeld){g.strokeStyle=INK;g.lineWidth=1.2;scircle(g,...Q.af,1.9,PAPER);}
  g.restore();

  /* ── ГОЛОВА, ОПТИКА И ШЛЕМ ── */
  g.strokeStyle = INK; g.lineWidth = SK;
  // For articulated menu poses, follow the actual head all the way inside it.
  if(Q.sf)sline(g,0,Q.neck,Q.head[0],Q.head[1]+6);
  else sline(g, 0, Q.neck, 0, Q.neck - 4);
  if(Number.isFinite(Q.yaw)){drawMenuHeroHead(g,Q,gear,SK,CL,DT);g.restore();return;}
  g.save();
  if(Q.headTilt){g.translate(...Q.head);g.rotate(Q.headTilt);g.translate(-Q.head[0],-Q.head[1]);}
  scircle(g, Q.head[0], Q.head[1], 8.5, PAPER);
  if (gear.helm < 3) {
    g.fillStyle = INK; g.beginPath(); g.arc(Q.head[0] + face * 3, Q.head[1] - 1.5, 1.25, 0, 7); g.fill();
  }
  g.save(); g.translate(Q.head[0], Q.head[1]); g.scale(face, 1);

  if (gear.scope && gear.helm < 3) {
    const L = gear.scope; g.strokeStyle = INK; g.lineWidth = CL;
    if (L === 1) {                                      // лёгкие очки
      scircle(g, -3.5, -1.2, 3.1, "#d9eef5"); scircle(g, 3.8, -1.2, 3.1, "#d9eef5");
      g.lineWidth = DT; sline(g, -.4, -1.5, .8, -1.5); sline(g, 6.8, -1.4, 10, -2.5);
    } else if (L === 2) {                               // цельный тактический визор
      spoly(g, [[-9, -4], [9.5, -3], [8, 2.3], [-8.5, 1.5]], "#76b8d5");
      g.lineWidth = DT; g.strokeStyle = "#e9f8ff"; sline(g, -6, -2.5, 3, -1.8);
    } else {                                            // энергетическая оптика
      spoly(g, [[-10, -4.5], [10.5, -3], [8.5, 2.8], [-9, 1.8]], C(L));
      g.lineWidth = DT; g.strokeStyle = "#f2d9ff"; sline(g, -7, -2.5, 4, -1.5);
      g.strokeStyle = INK; scircle(g, 10, -1, 2.5, "#9fd6e8");
    }
  }

  if (gear.helm) {
    const L = gear.helm; g.strokeStyle = INK; g.lineWidth = CL;
    if (L === 1) {                                      // лёгкий открытый шлем
      g.beginPath(); g.moveTo(-8.4, -1);
      g.quadraticCurveTo(-7, -8.5, 0, -9.4);
      g.quadraticCurveTo(7.2, -8.4, 8.8, -1);
      g.lineTo(6.3, .8); g.lineTo(-7, .8); g.closePath();
      g.fillStyle = C(L); g.fill(); g.stroke();
      spoly(g, [[1, -1.3], [12.5, -.4], [7.5, 1.8], [1, 1]], "#6fa66a");
      spoly(g, [[-8, -.5], [-5.7, .2], [-5.5, 5.4], [-8.5, 3.8]], C(L));
      g.lineWidth = DT; g.strokeStyle = "#dcebd7"; sline(g, -5.5, -5.8, 3.5, -7.1);
      g.fillStyle = "#e8c66a"; scircle(g, -6.7, -.8, 1.5, "#e8c66a");
    } else if (L === 2) {                               // рейнджерский шлем
      g.beginPath(); g.arc(0, 0, 9.8, Math.PI, .08); g.lineTo(8.5, 4); g.lineTo(-8.5, 4); g.closePath();
      g.fillStyle = C(L); g.fill(); g.stroke();
      spoly(g, [[-10, -1], [11, -1], [9, 2], [-9, 2]], "#5f91c9");
      g.lineWidth = DT; g.strokeStyle = "#dfeaf0"; sline(g, -5, -6.5, 4, -6.5);
    } else {                                            // закрытый рыцарский шлем
      g.beginPath(); g.arc(0, 0, 10.2, Math.PI, .12); g.lineTo(8.5, 6);
      g.lineTo(0, 8); g.lineTo(-8.5, 6); g.closePath(); g.fillStyle = C(L); g.fill(); g.stroke();
      spoly(g, [[-8.5, -2], [9.5, -2], [8, 2.5], [-8, 2]], "#342f38");
      g.strokeStyle = "#efe6d2"; g.lineWidth = DT; sline(g, -5.5, -.8, 4, -.8);
      // Continuous opaque chin plate: no protruding, pale-outlined nasal strip.
      g.strokeStyle = L >= 4 ? '#896029' : '#594568'; g.lineWidth = DT * .7;
      for(let i=-1;i<=1;i++)sline(g,i*2.4,4.3,i*2.4,5.5);
      if (L >= 4) {
        g.strokeStyle = INK; g.lineWidth = CL;
        spoly(g, [[-2, -10], [0, -17], [3, -10], [8, -15], [6, -7], [-5, -7]], "#e08a2a");
        g.fillStyle = "#fff4c2"; g.beginPath(); g.arc(0, -9, 2, 0, 7); g.fill();
      }
    }
  }
  if(Q.sf&&!gear._chem&&gear.helm<3){g.strokeStyle=INK;g.lineWidth=1.1;g.beginPath();g.moveTo(0,4.4);g.quadraticCurveTo(2.4,7,5,4.2);g.stroke();}
  if (gear._chem) {                                    // капюшон и стекло противогаза
    g.strokeStyle = INK; g.lineWidth = CL;
    scircle(g, 0, 0, 11.5, "#c7d86c");
    spoly(g, [[-7,-5],[8,-4],[8,2],[-7,2]], "#577879");
    g.strokeStyle = "#dff4e9"; g.lineWidth = DT; sline(g, -5, -3.5, 4, -2.8);
    scircle(g, 7, 5, 4.2, "#59784b");
    g.strokeStyle = "#e8ef9d"; g.lineWidth = 1.2; sline(g, 5, 4, 9, 6); sline(g, 9, 4, 5, 6);
  }
  g.restore();
  g.restore();
  g.restore();
}
