"use strict";
function drawHeroDamageFeedback(g){
 const f=P.damageFeedback;if(!f||f.life<=0)return;
 const age=1000-f.life,fade=Math.min(1,f.life/350),r=34+Math.min(1,age/180)*8;
 g.save();g.translate(P.x,P.y-8);g.globalAlpha=fade;g.lineWidth=3;
 g.strokeStyle='#fff4db';g.lineWidth=6;g.beginPath();
 if(f.area)g.arc(0,0,r,0,Math.PI*2);else g.arc(0,0,r,f.angle-.48,f.angle+.48);
 g.stroke();g.strokeStyle='#bf4733';g.lineWidth=3;g.stroke();
 if(!f.area){
  g.rotate(f.angle);g.beginPath();g.moveTo(r+12,0);g.lineTo(r+3,-6);g.lineTo(r+3,6);g.closePath();
  g.fillStyle='#bf4733';g.fill();g.strokeStyle='#fff4db';g.lineWidth=1.5;g.stroke();
 }
 g.restore();
}
/* render.js — отрисовка кадра */

// Code-native frost: no image downloads, particles or per-frame random geometry.
function drawIceField(g,ic){
  const fade=Math.max(0,Math.min(1,ic.life/1500)),age=Math.max(0,11000-ic.life);
  const bloom=1-Math.pow(1-Math.min(1,age/650),3),r=ic.r;
  g.save();g.translate(ic.x,ic.y);g.globalAlpha=fade;g.lineJoin='round';g.lineCap='round';
  g.fillStyle='rgba(134,211,231,.26)';g.strokeStyle='#78b9cb';g.lineWidth=2;
  g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.fill();g.stroke();
  g.save();g.beginPath();g.arc(0,0,r-3,0,Math.PI*2);g.clip();
  // Translucent irregular frozen plates leave enemies and ground readable.
  for(let i=0;i<9;i++){
    const a=i*2.399+ic.x*.003,rr=r*(.22+(i%3)*.24),x=Math.cos(a)*rr,y=Math.sin(a)*rr;
    g.save();g.translate(x,y);g.rotate(a);g.scale(bloom,bloom);
    g.strokeStyle='rgba(102,171,194,.30)';g.lineWidth=1;
    spoly(g,[[-36,-15],[-7,-26],[31,-12],[39,10],[3,24],[-30,12]],i%2?'rgba(236,252,250,.48)':'rgba(151,218,233,.32)');
    g.strokeStyle='rgba(255,255,246,.7)';sline(g,-21,-10,7,-18);g.restore();
  }
  g.save();g.scale(bloom,bloom);g.strokeStyle='rgba(252,255,247,.86)';g.lineWidth=2.3;
  // Six fern-like frost branches instead of six plain spokes.
  for(let i=0;i<6;i++){
    g.save();g.rotate(i*Math.PI/3+.12);sline(g,0,0,r*.70,0);
    for(let j=1;j<=3;j++){const x=r*(.14+j*.14),d=r*(.20-j*.032);sline(g,x,0,x-d,-d);sline(g,x,0,x-d,d);}
    g.restore();
  }
  g.restore();g.restore();
  // Low edge crystals, contained inside the actual slowing radius.
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6+.17,rr=r-13,x=Math.cos(a)*rr,y=Math.sin(a)*rr;
    const shimmer=.80+.20*Math.sin(age/480+i*1.9);
    g.save();g.translate(x,y);g.rotate(a+Math.PI/2);g.scale(.7+.3*bloom,.7+.3*bloom);
    g.globalAlpha=fade*shimmer;g.strokeStyle='#6da9bd';g.lineWidth=1.2;
    spoly(g,[[-7,3],[-5,-6],[0,-12],[5,-5],[7,4],[0,8]],'#bae6eb');
    spoly(g,[[0,-12],[5,-5],[0,8],[-1,-3]],'#eefdf5');g.restore();
  }
  if(age<650){g.globalAlpha=fade*(1-age/650)*.75;g.strokeStyle='#fafff3';g.lineWidth=3;
    g.beginPath();g.arc(0,0,Math.max(1,(r-5)*bloom),0,Math.PI*2);g.stroke();}
  g.restore();
}

/* ── кинематографичные эффекты ульты ─────────────────────── */
function drawUltImpact(g, f) {
  const a = Math.max(0, Math.min(1, f.life));
  const grow = 1 - a, power = f.power || 1;
  const accent = f.style === "spiral" || f.style === "bolt" ? "#8a53c4"
               : f.style === "cross" ? "#c8402c" : "#e08a2a";
  g.save(); g.translate(f.x, f.y); g.rotate(f.dir || 0);
  g.lineCap = "round"; g.lineJoin = "round";

  if (f.style === "aura") {
    g.globalAlpha = a * .75; g.strokeStyle = accent; g.lineWidth = 3.2;
    g.beginPath(); g.arc(0, 0, 20 + grow * 48, 0, 7); g.stroke();
    g.globalAlpha = a * .22; g.lineWidth = 12;
    g.beginPath(); g.arc(0, 0, 15 + grow * 62, 0, 7); g.stroke();
    for (let i = 0; i < 10; i++) {
      const an = i / 10 * 6.283 + f.seed, r = 24 + grow * 38;
      g.globalAlpha = a * (.35 + (i % 3) * .12); g.lineWidth = 2;
      g.beginPath(); g.moveTo(Math.cos(an) * r, Math.sin(an) * r);
      g.lineTo(Math.cos(an) * (r + 8 + power * 5), Math.sin(an) * (r + 8 + power * 5)); g.stroke();
    }
    g.restore(); return;
  }

  // Звезда появляется только на финальных ударах. Мелкие попадания остаются
  // чистыми и не превращают сцену в облако пересекающихся фигур.
  if (power >= 1.2) {
    const spikes = f.style === "ground" || f.style === "meteor" ? 12 : 8;
    const outer = (26 + power * 24) * (1 + grow * .32);
    g.globalAlpha = a * .14; g.fillStyle = accent; g.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const an = i / (spikes * 2) * 6.283 + f.seed;
      const rr = i % 2 ? 10 + power * 4 : outer * (.82 + hash(i, f.seed) * .18);
      const x = Math.cos(an) * rr, y = Math.sin(an) * rr;
      if (i) g.lineTo(x, y); else g.moveTo(x, y);
    }
    g.closePath(); g.fill();
  }

  g.strokeStyle = "#fff8e8"; g.globalAlpha = a * .95;
  g.save();
  if (f.style === "cross") {
    for (const s of [-1, 1]) {
      g.save(); g.rotate(s * .72); g.lineWidth = 8;
      g.beginPath(); g.moveTo(-58 * power, 18); g.quadraticCurveTo(0, -20, 62 * power, -8); g.stroke();
      g.strokeStyle = accent; g.globalAlpha = a * .62; g.lineWidth = 2.8;
      g.beginPath(); g.moveTo(-70 * power, 25); g.quadraticCurveTo(0, -30, 76 * power, -14); g.stroke(); g.restore();
    }
  } else if (f.style === "meteor") {
    g.rotate(-(f.dir || 0));
    g.globalAlpha = a * .26; g.fillStyle = accent;
    g.beginPath(); g.moveTo(-30, 10); g.lineTo(-13, -185 * power); g.lineTo(13, -185 * power); g.lineTo(30, 10); g.closePath(); g.fill();
    g.globalAlpha = a * .9; g.strokeStyle = "#fff8e8"; g.lineWidth = 6;
    g.beginPath(); g.moveTo(0, -155 * power); g.lineTo(0, 12); g.stroke();
    g.strokeStyle = accent; g.globalAlpha = a * .72; g.lineWidth = 4;
    g.beginPath(); g.ellipse(0, 11, 34 + grow * 125 * power, 10 + grow * 34 * power, 0, 0, 7); g.stroke();
  } else if (f.style === "spiral") {
    g.rotate(-(f.dir || 0));
    for (let i = 0; i < 4; i++) {
      g.globalAlpha = a * (.72 - i * .11); g.strokeStyle = i % 2 ? "#fff8e8" : accent;
      g.lineWidth = 5 - i * .7; g.beginPath();
      g.arc(0, 0, 18 + i * 13 + grow * 42, f.seed + i * .6 + grow * 3,
            f.seed + i * .6 + grow * 3 + 4.7); g.stroke();
    }
  } else if (f.style === "dance") {
    g.rotate(-(f.dir || 0));
    for (let i = 0; i < 3; i++) {
      const r = 24 + i * 18 + grow * 72;
      g.globalAlpha = a * (.82 - i * .18); g.strokeStyle = i === 1 ? "#fff8e8" : accent;
      g.lineWidth = 5 - i; g.beginPath(); g.arc(0, 0, r, f.seed + i * .7, f.seed + i * .7 + 5.15); g.stroke();
    }
  } else if (f.style === "slash" || f.style === "shot") {
    g.lineWidth = 7 + power * 2;
    g.beginPath(); g.moveTo(-42 * power, 18); g.quadraticCurveTo(0, -18, 54 * power, -8); g.stroke();
    g.strokeStyle = accent; g.globalAlpha = a * .55; g.lineWidth = 2.4;
    g.beginPath(); g.moveTo(-54 * power, 25); g.quadraticCurveTo(3, -27, 68 * power, -13); g.stroke();
  } else if (f.style === "upper" || f.style === "bolt") {
    g.rotate(-(f.dir || 0));
    const h = f.style === "upper" ? 145 * power : 210 * power;
    g.globalAlpha = a * .18; g.fillStyle = accent;
    g.beginPath(); g.moveTo(-22, 14); g.lineTo(-8, -h); g.lineTo(8, -h); g.lineTo(22, 14); g.closePath(); g.fill();
    g.globalAlpha = a * .95; g.strokeStyle = "#fff8e8"; g.lineWidth = 5;
    g.beginPath(); g.moveTo(0, 12); g.lineTo(0, -h); g.stroke();
  } else if (f.style === "ground") {
    g.rotate(-(f.dir || 0));
    g.globalAlpha = a * .85; g.strokeStyle = "#fff8e8"; g.lineWidth = 5;
    g.beginPath(); g.ellipse(0, 8, 24 + grow * 95 * power, 7 + grow * 30 * power, 0, 0, 7); g.stroke();
    g.strokeStyle = "#8a53c4"; g.globalAlpha = a * .48; g.lineWidth = 2.5;
    for (let i = 0; i < 9; i++) {
      const an = Math.PI * (.08 + i / 10 * .84), r = 20 + grow * 45;
      g.beginPath(); g.moveTo(Math.cos(an) * r, 9 + Math.sin(an) * r * .24);
      g.lineTo(Math.cos(an) * (r + 32 * power), 9 + Math.sin(an) * (r + 32 * power) * .24); g.stroke();
    }
  } else {
    g.globalAlpha = a * .85; g.strokeStyle = "#fff8e8"; g.lineWidth = 4.5;
    g.beginPath(); g.arc(0, 0, 12 + grow * 54 * power, 0, 7); g.stroke();
  }

  g.restore();
  // Тонкие расходящиеся штрихи сохраняют рисованный стиль игры.
  g.rotate(-(f.dir || 0)); g.strokeStyle = accent; g.lineWidth = 2.2;
  for (let i = 0; i < 8; i++) {
    const an = i / 8 * 6.283 + f.seed, r1 = 26 + grow * 24, r2 = r1 + 18 + power * 13;
    g.globalAlpha = a * (.25 + (i % 4) * .10);
    g.beginPath(); g.moveTo(Math.cos(an) * r1, Math.sin(an) * r1);
    g.lineTo(Math.cos(an) * r2, Math.sin(an) * r2); g.stroke();
  }
  g.restore();
}

function drawEmpoweredUltFX(g){
 const s=ult.signature;if(!s)return;
 const p=Math.min(1,ult.t/ult.dur),low=visualFX('lowFX'),id=s.id;
 const x=P.x+(ult.stageX||0),ground=P.y+(ult.stageY||0)+13,y=ground-37-(ult.lift||0),aim=P.aim;
 const charge=Math.min(1,p/s.beats[0]),muzzle=empoweredUltMuzzle();
 const line=(x1,y1,x2,y2,w=2)=>{g.lineWidth=w;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();};
 const ring=(cx,cy,r)=>{g.beginPath();g.arc(cx,cy,r,0,Math.PI*2);g.stroke();};
 g.save();g.lineCap='round';g.lineJoin='round';g.strokeStyle=s.color;g.fillStyle=s.color;
 if(!low&&p>.14&&p<.78){
  g.globalAlpha=.25;for(let i=0;i<3;i++){
   const dx=ult.signatureFace*(18+i*7);line(x-dx,y+18+i*6,x-dx-ult.signatureFace*26,y+20+i*6,1.5);
  }
 }
 if(id==='constellation'&&p>.10&&p<.73){
  g.save();g.translate(x+ult.signatureFace*28,y-50);g.rotate(ult.t/120);
  g.globalAlpha=.85;g.fillStyle='#efc14e';g.strokeStyle='#725936';g.lineWidth=1.6;
  g.beginPath();g.ellipse(0,0,6,Math.abs(Math.cos(ult.t/80))*8+1,0,0,Math.PI*2);g.fill();g.stroke();g.restore();
 }
 // Charging tells the weapon apart even before the first shot. No screen-sized fill.
 if(p<s.beats[0]){
  g.globalAlpha=.25+charge*.45;
  if(id==='rail'||id==='constellation'){
   for(const e of ult.signatureTargets.slice(0,low?3:6)){
    const r=19+(1-charge)*15;g.lineWidth=1.5;ring(e.x,e.y-12,r);
    for(let k=0;k<4;k++){const a=k*Math.PI/2;line(e.x+Math.cos(a)*(r-5),e.y-12+Math.sin(a)*(r-5),e.x+Math.cos(a)*(r+5),e.y-12+Math.sin(a)*(r+5));}
   }
   if(id==='rail'){g.setLineDash([6,10]);line(muzzle.x,muzzle.y,muzzle.x+Math.cos(muzzle.aim)*230,muzzle.y+Math.sin(muzzle.aim)*230,1);g.setLineDash([]);}
  }else if(id==='fan'||id==='quake'){
   g.lineWidth=2;g.beginPath();g.ellipse(x,ground,24+charge*38,9+charge*12,0,0,Math.PI*2);g.stroke();
   if(id==='fan')for(const d of [-.38,0,.38])line(muzzle.x+Math.cos(muzzle.aim+d)*8,muzzle.y+Math.sin(muzzle.aim+d)*8,muzzle.x+Math.cos(muzzle.aim+d)*(18+charge*20),muzzle.y+Math.sin(muzzle.aim+d)*(18+charge*20));
  }else{
   const count=id==='helix'||id==='sweep'?6:3;
   for(let i=0;i<count;i++){const a=ult.t/190+i*Math.PI*2/count,r=16+charge*9;
    line(muzzle.x+Math.cos(a)*r,muzzle.y+Math.sin(a)*r,muzzle.x+Math.cos(a)*(r+6),muzzle.y+Math.sin(a)*(r+6),3);}
  }
 }
 for(const f of ult.signatureFX||[]){
  const age=(ult.t-f.born)/600,a=Math.max(0,1-age),travel=1-Math.pow(1-age,3);
  g.strokeStyle=s.color;g.globalAlpha=a*.75;
  if(id==='quake'){
   const r=28+travel*205;g.lineWidth=4*a+1;g.beginPath();g.ellipse(f.ox,f.oy,r,r*.42,0,0,Math.PI*2);g.stroke();
   for(let i=0;i<(low?6:12);i++){const an=i*Math.PI/6;line(f.ox+Math.cos(an)*(r-12),f.oy+Math.sin(an)*(r-12)*.42,f.ox+Math.cos(an)*(r+18),f.oy+Math.sin(an)*(r+18)*.42,2);}
  }else if(id==='fan'){
   for(let i=0;i<(low?5:9);i++){const an=f.aim+(i/(low?4:8)-.5)*1.20,r=45+travel*205;
    line(f.ox+Math.cos(an)*Math.max(35,r-85),f.oy+Math.sin(an)*Math.max(35,r-85),f.ox+Math.cos(an)*r,f.oy+Math.sin(an)*r,3*a+1);}
   g.beginPath();g.arc(f.ox,f.oy,50+travel*185,f.aim-.65,f.aim+.65);g.stroke();
  }else if(id==='helix'){
   for(let arm=0;arm<2;arm++){
    g.beginPath();for(let i=0;i<=(low?16:36);i++){const q=i/(low?16:36),an=q*Math.PI*2+f.beat*.6+arm*Math.PI,r=24+q*(38+travel*58);
     const px=f.ox+Math.cos(an)*r,py=f.oy+Math.sin(an)*r*.68;if(i)g.lineTo(px,py);else g.moveTo(px,py);}g.lineWidth=2.5;g.stroke();
   }
  }else if(id==='sweep'){
   const an=f.aim,r=65+travel*110;
   for(let j=0;j<(low?2:4);j++){const d=an+j*.045;line(f.ox+Math.cos(d)*38,f.oy+Math.sin(d)*38,f.ox+Math.cos(d)*r,f.oy+Math.sin(d)*r,2.5);}
  }
  // Precision shots and winged volleys have different routes, not a recoloured shared burst.
  const points=f.points.length?f.points:[{x:f.ox+Math.cos(f.aim)*220,y:f.oy+Math.sin(f.aim)*220}];
  for(let i=0;i<points.length;i++){
   const target=points[i];g.globalAlpha=a*(id==='rail'?.85:.48);
   if(id==='rail'){
    const an=Math.atan2(target.y-f.oy,target.x-f.ox),endx=target.x+Math.cos(an)*55,endy=target.y+Math.sin(an)*55;
    g.strokeStyle=s.color;line(f.ox,f.oy,endx,endy,9*a+1);g.strokeStyle='#fff8e8';line(f.ox,f.oy,endx,endy,2);
    g.strokeStyle=s.color;if(!low)for(let k=1;k<4;k++)ring(f.ox+(target.x-f.ox)*k/4,f.oy+(target.y-f.oy)*k/4,5+travel*13);
   }else if(id==='constellation'){
    const from=i?points[i-1]:{x:f.ox,y:f.oy};line(from.x,from.y,target.x,target.y,2.5);ring(target.x,target.y,8+age*22);
    line(target.x-7,target.y,target.x+7,target.y);line(target.x,target.y-7,target.x,target.y+7);
   }else if(id==='salvo'){
    for(const side of [-1,1]){g.beginPath();g.moveTo(f.ox,f.oy);g.quadraticCurveTo((f.ox+target.x)/2+side*45,(f.oy+target.y)/2-65,target.x,target.y);g.lineWidth=2.5;g.stroke();}
   }else if(id==='lance'){
    const an=Math.atan2(target.y-f.oy,target.x-f.ox),px=f.ox+(target.x-f.ox)*travel,py=f.oy+(target.y-f.oy)*travel;
    line(px-Math.cos(an)*55,py-Math.sin(an)*55,px,py,4);line(px,py,px-Math.cos(an-.4)*12,py-Math.sin(an-.4)*12);line(px,py,px-Math.cos(an+.4)*12,py-Math.sin(an+.4)*12);
   }
  }
 }
 // The dragon arrives after the weapon's own choreography, not instead of it.
 if(p>.70){g.globalAlpha=Math.sin(Math.min(1,(p-.70)/.30)*Math.PI)*.45;g.strokeStyle=ult.dragonType?.breath||s.color;g.lineWidth=2;
  for(const side of [-1,1]){g.beginPath();g.moveTo(x,ground-61);g.quadraticCurveTo(x+side*38,ground-105,x+side*78,ground-79);g.lineTo(x+side*43,ground-72);g.lineTo(x+side*55,ground-55);g.stroke();}}
 g.restore();
}

function drawUltMotionFX(g) {
  if(ult.mode==='dragonburst')drawEmpoweredUltFX(g);
  const p = Math.max(0, Math.min(1, ult.t / ult.dur));
  const hy = P.y + 17 - (ult.lift || 0);
  g.save(); g.lineCap = "round";

  if (ult.mode === "flip" && ult.lift > 12) {
    g.strokeStyle = "#e08a2a";
    for (let i = 0; i < 4; i++) {
      g.globalAlpha = .34 - i * .055; g.lineWidth = 5 - i * .7;
      g.beginPath(); g.ellipse(P.x, hy - 18, 35 + i * 9, 19 + i * 4,
                               ult.rot * .18 + i * .5, -.5, 4.1); g.stroke();
    }
  }
  if (ult.mode === "upper" && p > .27 && p < .74) {
    g.strokeStyle = "#fff8e8";
    for (let i = -2; i <= 2; i++) {
      g.globalAlpha = .50 - Math.abs(i) * .08; g.lineWidth = 4 - Math.abs(i) * .5;
      g.beginPath(); g.moveTo(P.x + i * 11, P.y + 18);
      g.lineTo(P.x + i * 6, hy - 72 - Math.abs(i) * 12); g.stroke();
    }
  }
  if (ult.mode === "rain" && ult.lift > 80) {
    g.strokeStyle = "#8a53c4";
    for (let i = 0; i < 7; i++) {
      const x = P.x - 62 + i * 21 + Math.sin(i * 2.7) * 5;
      g.globalAlpha = .12 + (i % 3) * .05; g.lineWidth = 2 + i % 2;
      g.beginPath(); g.moveTo(x, hy - 85 - (i % 2) * 24); g.lineTo(x - 7, P.y + 28); g.stroke();
    }
  }
  if (ult.mode === "slam" && ult.lift > 12) {
    g.strokeStyle = "#e08a2a";
    for (let i = 0; i < 8; i++) {
      const x = P.x - 76 + i * 22;
      g.globalAlpha = .12 + (i % 3) * .055; g.lineWidth = 2.2;
      g.beginPath(); g.moveTo(x, hy - 80); g.lineTo(x + 13, hy + 34); g.stroke();
    }
  }
  if (ult.mode === "meteor" && ult.lift > 16) {
    const tail = 55 + ult.lift * .55;
    g.globalAlpha = .20; g.fillStyle = "#e08a2a";
    g.beginPath(); g.moveTo(P.x - 24, hy + 6); g.lineTo(P.x - 8, hy - tail);
    g.lineTo(P.x + 8, hy - tail * 1.15); g.lineTo(P.x + 25, hy + 6); g.closePath(); g.fill();
    g.strokeStyle = "#fff8e8"; g.lineWidth = 4;
    for (let i = -2; i <= 2; i++) {
      g.globalAlpha = .42 - Math.abs(i) * .07;
      g.beginPath(); g.moveTo(P.x + i * 8, hy - 18); g.lineTo(P.x + i * 4, hy - tail); g.stroke();
    }
  }
  if (ult.mode === "spiral") {
    const r = 34 + Math.sin(p * Math.PI) * 30;
    for (let i = 0; i < 3; i++) {
      g.globalAlpha = .42 - i * .09; g.strokeStyle = i === 1 ? "#fff8e8" : "#8a53c4";
      g.lineWidth = 4.4 - i * .7; g.beginPath();
      g.arc(P.x, hy - 18, r + i * 13, ult.spinAim + i * 1.1,
            ult.spinAim + i * 1.1 + Math.PI * 1.42); g.stroke();
    }
    for (let i = 0; i < 8; i++) {
      const an = ult.spinAim + i / 8 * 6.283, rr = r + (i % 3) * 8;
      g.globalAlpha = .85; g.fillStyle = i % 2 ? "#8a53c4" : "#e08a2a";
      g.beginPath(); g.arc(P.x + Math.cos(an) * rr, hy - 18 + Math.sin(an) * rr * .62, 2.8, 0, 7); g.fill();
    }
  }
  if (ult.mode === "dance") {
    const pulse = Math.max(0, ult.dancePulse || 0);
    g.globalAlpha = .10 + pulse * .12; g.fillStyle = "#e08a2a";
    g.beginPath(); g.ellipse(P.x + (ult.stageX || 0), P.y + 19, 58 + pulse * 16, 15 + pulse * 4, 0, 0, 7); g.fill();
    g.globalAlpha = .72; g.strokeStyle = "#fff8e8"; g.lineWidth = 2.8;
    const a0 = ult.spinAim || P.aim;
    for (let i = 0; i < 3; i++) {
      const an = a0 + (i - 1) * .23;
      g.beginPath(); g.moveTo(P.x + (ult.stageX || 0) + Math.cos(an) * 24, hy - 18 + Math.sin(an) * 18);
      g.lineTo(P.x + (ult.stageX || 0) + Math.cos(an) * (54 + pulse * 35), hy - 18 + Math.sin(an) * (42 + pulse * 18)); g.stroke();
    }
  }
  if(ult.mode==="ricochet"){
    const toss=Math.min(1,p/.24),cx=P.x+P.face*(20+Math.sin(toss*Math.PI)*16),cy=P.y-42-Math.sin(toss*Math.PI)*50;
    g.globalAlpha=.24;g.fillStyle="#e3b52f";g.beginPath();g.arc(cx,cy,15,0,7);g.fill();
    g.globalAlpha=1;g.fillStyle="#f0c94d";g.strokeStyle=INK;g.lineWidth=2.2;g.beginPath();g.ellipse(cx,cy,7,10*Math.abs(Math.cos(ult.coinSpin||0))+.8,ult.coinSpin||0,0,7);g.fill();g.stroke();
    g.strokeStyle="#fff4b0";g.lineWidth=2;g.beginPath();g.moveTo(cx-2,cy-4);g.lineTo(cx+2,cy+4);g.stroke();
  }
  if(ult.mode==="quickdraw"){
    for(const e of (ult.queue||[]).slice(ult.step||0)){
      g.globalAlpha=.32;g.strokeStyle="#d7aa32";g.lineWidth=2;g.setLineDash([5,7]);g.beginPath();g.arc(e.x,e.y-12,e.r+12,0,7);g.stroke();g.setLineDash([]);
    }
    g.globalAlpha=.28;g.strokeStyle="#fff4b0";g.lineWidth=3;
    for(let i=-2;i<=2;i++){g.beginPath();g.moveTo(P.x+P.face*20,P.y-28+i*12);g.lineTo(P.x-P.face*(64+Math.abs(i)*12),P.y-28+i*15);g.stroke();}
  }
  if(ult.mode==="dive"){
    g.globalAlpha=.30;g.strokeStyle="#e3b52f";g.lineWidth=3;
    for(let i=0;i<3;i++){const yy=hy-34+i*24;g.beginPath();g.moveTo(P.x-P.face*(42+i*9),yy);g.lineTo(P.x-P.face*(112+i*14),yy+P.face*i*2);g.stroke();}
  }
  if(ult.mode==="shellstorm"){
    const toss=Math.min(1,p/.30),fade=p>.82?Math.max(0,(1-p)/.18):1;
    for(let i=0;i<3;i++){
      const an=-2.30+i*.72,rr=30+Math.sin(toss*Math.PI)*22;
      const x=P.x+P.face*(17+Math.cos(an)*rr),y=P.y-52+Math.sin(an)*rr-Math.sin(toss*Math.PI)*34;
      g.save();g.translate(x,y);g.rotate((ult.shellSpin||0)*(i%2?1:-1)+i);
      g.globalAlpha=.95*fade;g.fillStyle="#d9a62e";g.strokeStyle=INK;g.lineWidth=1.7;
      g.beginPath();g.roundRect(-3,-8,6,16,2);g.fill();g.stroke();
      g.strokeStyle="#fff1a6";g.lineWidth=1.2;sline(g,-1,-5,-1,5);g.restore();
    }
  }
  if(ult.mode==="rollshot"){
    const roll=Math.min(1,p/.58),cx=P.x+(ult.stageX||0),cy=hy-14;
    g.globalAlpha=.30;g.strokeStyle="#e3b52f";g.lineWidth=4;
    for(let i=0;i<3;i++){g.beginPath();g.arc(cx,cy,27+i*11,-2.8+roll*4.8,-.4+roll*4.8);g.stroke();}
    g.globalAlpha=.25;g.strokeStyle="#fff4b0";g.lineWidth=3;
    for(let i=-2;i<=2;i++)sline(g,cx-P.face*(42+i*7),P.y+8+i*6,cx-P.face*(100+i*11),P.y+10+i*7);
  }
  if (ult.mode === "cross") {
    const pulse = .5 + .5 * Math.sin(ult.t / 48);
    g.globalAlpha = .10 + pulse * .10; g.strokeStyle = ult.mode === "cross" ? "#c8402c" : "#8a53c4";
    g.lineWidth = 10; g.beginPath(); g.arc(P.x, hy - 18, 30 + pulse * 18, 0, 7); g.stroke();
  }
  g.restore();
}

/* Оптика поверх настоящего игрового мира и настоящих drawFoe-моделей. */
function drawWorldScope(g, p, mode, bar) {
  const raw=Math.max(0,Math.min(1,(p-.18)/.075));
  const enter=raw*raw*(3-2*raw), fade=p>.91?Math.max(0,(1-p)/.09):1;
  const aa=enter*fade, kick=ult.fpKick||0, cx=W/2, cy=H/2+kick*12;
  const r=Math.min(W,H)*(mode==="scope"?.342:.382);
  g.save();
  // Тёмный корпус прицела закрывает только края: внутри остаётся реальная карта.
  g.globalAlpha=.94*aa;g.fillStyle="#17150f";
  g.beginPath();g.rect(0,0,W,H);g.moveTo(cx+r,cy);g.arc(cx,cy,r,0,Math.PI*2,true);g.fill("evenodd");
  g.globalAlpha=aa;g.strokeStyle="#26221b";g.lineWidth=10;g.beginPath();g.arc(cx,cy,r+3,0,7);g.stroke();
  g.strokeStyle="#d7aa32";g.lineWidth=2.5;g.beginPath();g.arc(cx,cy,r-2,0,7);g.stroke();
  // Тонкая сетка с делениями, как у настоящей оптики.
  g.strokeStyle="#26221b";g.lineWidth=2;
  g.beginPath();g.moveTo(cx-r,cy);g.lineTo(cx+r,cy);g.moveTo(cx,cy-r);g.lineTo(cx,cy+r);g.stroke();
  for(let i=-4;i<=4;i++)if(i){
    const d=i*r*.115;g.lineWidth=Math.abs(i)%2?1.4:2;
    g.beginPath();g.moveTo(cx+d,cy-6);g.lineTo(cx+d,cy+6);g.moveTo(cx-6,cy+d);g.lineTo(cx+6,cy+d);g.stroke();
  }
  const lock=mode==="scope"?(ult.scopeLock||0):Math.min(1,(ult.next||0)<260?1:.72);
  g.strokeStyle=lock>.92?"#c8402c":"#d7aa32";g.lineWidth=2.8;
  g.beginPath();g.arc(cx,cy,17+(1-lock)*42,0,7);g.stroke();
  g.fillStyle="#c8402c";g.beginPath();g.arc(cx,cy,3.3,0,7);g.fill();
  // Короткая вспышка остаётся строго внутри линзы.
  if(kick>.48&&!visualFX('reduceFlash')){g.globalAlpha=aa*(kick-.48)/.52*.32;g.fillStyle="#fff5b0";g.beginPath();g.arc(cx,cy,r-5,0,7);g.fill();}
  g.globalAlpha=aa*.84;g.fillStyle="#17150f";g.fillRect(cx-148,cy-r-31,296,24);
  g.globalAlpha=aa;g.fillStyle="#e3bd4b";g.font="900 11px system-ui";g.textAlign="center";
  if(mode==="scope") g.fillText(ult.fired?"TARGET DOWN · CONFIRMED":"GOLD SCOPE · HOLD BREATH",cx,cy-r-15);
  else {
    const total=Math.max(1,(ult.queue||[]).length), shown=Math.min(total,(ult.step||0)+1);
    g.fillText(ult.current?"CHAIN SCOPE · TARGET "+shown+"/"+total:"CHAIN SCOPE · CLEAR",cx,cy-r-15);
  }
  g.globalAlpha=aa*.78;g.fillStyle="#17150f";g.fillRect(cx-45,cy+r-18,90,27);
  g.globalAlpha=aa;g.fillStyle="#e3bd4b";g.font="800 10px system-ui";g.fillText(mode==="scope"?"× 8.0":"× 6.0",cx,cy+r);
  g.restore();
}

function drawUltScreenFX(g) {
  const p = Math.max(0, Math.min(1, ult.t / ult.dur));
  const rush = (["dash", "meteor", "cross"].includes(ult.mode))
    ? Math.sin(Math.min(1, p * 1.35) * Math.PI) : 0;
  const intro = Math.max(0, 1 - p * 7);
  const energy = Math.max(intro * .55, rush * .10, (ult.punch || 0) * .52);

  if (energy > .035) {
    g.save(); g.translate(W / 2, H / 2); g.strokeStyle = "#2b2620"; g.lineCap = "round";
    for (let i = 0; i < 14; i++) {
      const an = i / 14 * 6.283 + .07 * Math.sin(i * 4.1);
      const wob = hash(i, Math.floor(ult.t / 90));
      const r1 = Math.min(W, H) * (.28 + wob * .12);
      const r2 = r1 + (42 + wob * 105) * energy;
      g.globalAlpha = energy * (.07 + (i % 4) * .018); g.lineWidth = 1.1 + (i % 3) * .55;
      g.beginPath(); g.moveTo(Math.cos(an) * r1, Math.sin(an) * r1);
      g.lineTo(Math.cos(an) * r2, Math.sin(an) * r2); g.stroke();
    }
    g.restore();
  }

  if ((ult.flash || 0) > .01&&!visualFX('reduceFlash')) {
    g.fillStyle = "rgba(255,248,232," + Math.min(.55, ult.flash).toFixed(3) + ")";
    g.fillRect(0, 0, W, H);
  }

  const bar = 42 + Math.sin(Math.min(1, p * 5) * Math.PI / 2) * 20;
  const a = Math.min(.62, Math.min(p, 1 - p) * 4) * .68;
  g.fillStyle = "rgba(43,38,32," + a.toFixed(3) + ")";
  g.fillRect(0, 0, W, bar); g.fillRect(0, H - bar, W, bar);
  const edge = ult.mode === "spiral" || ult.mode === "dash" ? "#8a53c4"
             : ult.mode === "cross" ? "#c8402c" : "#e08a2a";
  g.globalAlpha = a * .58; g.fillStyle = edge;
  g.fillRect(0, bar - 2, W, 2); g.fillRect(0, H - bar, W, 2);
  g.globalAlpha = 1;

  if(ult.mode==='dragonburst'&&ult.signature){
    const english={lance:'GUN-FU DASH',salvo:'WINGED DIVE',fan:'RECOIL LEAP',quake:'METEOR LANDING',sweep:'SLIDING BARRAGE',helix:'AIRBORNE VORTEX',rail:'ROLL AND BREAK',constellation:'RICOCHET DIVE'};
    g.save();g.globalAlpha=Math.min(1,p*6,(1-p)*6)*.90;g.fillStyle=ult.signature.color;g.font='900 12px system-ui';g.textAlign='center';
    g.fillText(typeof uiLanguage!=='undefined'&&uiLanguage==='ru'?ult.signature.name:P.wtype==='laser'?(ult.signature.id==='rail'?'PRISM BREAKTHROUGH':'PRISM BEAM NETWORK'):english[ult.signature.id],W/2,bar-14);g.restore();
  }
  if (ult.mode === "scope" || ult.mode === "deadeye") drawWorldScope(g,p,ult.mode,bar);
  else if(SNIPER_STANDARD_ULT_MODES.includes(ult.mode)){
    const names={ricochet:"GOLDEN RICOCHET",quickdraw:"QUICKDRAW · TRIPLE TAP",dive:"AIRBORNE · BULLET TIME",shellstorm:"BRASS STORM",rollshot:"ROLLING THUNDER"};
    const sub={ricochet:"FLIP THE COIN  //  BREAK THE LINE",quickdraw:"STEP BACK  //  THREE TARGETS",dive:"DIVE  //  AIM  //  FIRE",shellstorm:"THREE SHELLS  //  SIX RICOCHETS",rollshot:"ROLL  //  FIRE  //  KNEEL"};
    const aa=Math.min(1,p*7,(1-p)*7);g.save();g.globalAlpha=aa*.78;g.fillStyle="#211d16";g.fillRect(W/2-165,bar+5,330,42);
    g.globalAlpha=aa;g.fillStyle="#f0c94d";g.textAlign="center";g.font="900 12px system-ui";g.fillText(names[ult.mode],W/2,bar+21);
    g.globalAlpha=aa*.75;g.font="700 9px system-ui";g.fillText(sub[ult.mode],W/2,bar+36);g.restore();
  }
}

/* Эксклюзивный сундук: фиолетовый корпус, золото, кристалл и редкий замок. */
function drawRareChest(g, x, y, sc, phase) {
  const bob = Math.sin(phase * 2) * 2;
  g.save(); g.translate(x, y + bob); g.scale(sc, sc);
  g.lineCap = "round"; g.lineJoin = "round";
  g.globalAlpha = .12 + Math.abs(Math.sin(phase)) * .06; g.fillStyle = "#8a53c4";
  g.beginPath(); g.ellipse(0, 10, 34, 15, 0, 0, 7); g.fill(); g.globalAlpha = 1;
  g.strokeStyle = INK; g.lineWidth = 2.7;
  spoly(g, [[-23,-2],[23,-2],[20,17],[-20,17]], "#694397");
  g.beginPath(); g.moveTo(-23,-2); g.quadraticCurveTo(-19,-24,0,-27);
  g.quadraticCurveTo(19,-24,23,-2); g.closePath(); g.fillStyle="#9661cb"; g.fill(); g.stroke();
  g.strokeStyle="#efc95e"; g.lineWidth=3.6;
  sline(g,-23,-2,23,-2); sline(g,-10,-20,-10,17); sline(g,10,-20,10,17);
  spoly(g,[[-7,-6],[7,-6],[8,8],[0,13],[-8,8]],"#efc95e");
  scircle(g,0,0,2.3,"#fff2a8"); g.strokeStyle=INK; g.lineWidth=1.6; sline(g,0,2,0,6);
  g.strokeStyle="#e7c85e"; g.lineWidth=2;
  for(let i=0;i<6;i++){
    const a=phase+i*1.047, r=31+(i%2)*8; sline(g,Math.cos(a)*r,Math.sin(a)*r*.65-6,Math.cos(a)*(r+6),Math.sin(a)*(r+6)*.65-6);
  }
  g.fillStyle="#d8b4ff"; g.strokeStyle=INK; g.lineWidth=2;
  spoly(g,[[0,-39],[7,-31],[3,-22],[-3,-22],[-7,-31]],"#d8b4ff");
  g.restore();
}

function drawEliteChest(g,c){
  // The event uses exactly the regular rare chest model and size after landing.
  if(!(c.dropT>0)){drawRareChest(g,c.x,c.y,1.1,c.a);return;}
  const flying=c.dropT>0,u=flying?c.dropT/c.dropDuration:0,height=Math.pow(u,.9)*420;
  g.save();g.translate(c.x,c.y);
  g.strokeStyle='#9b70be';g.lineWidth=2;g.setLineDash([5,7]);
  g.beginPath();g.ellipse(0,7,43,24,0,0,7);g.stroke();g.setLineDash([]);
  g.fillStyle='rgba(87,51,113,.13)';g.beginPath();g.ellipse(0,10,32-12*u,15-5*u,0,0,7);g.fill();
  g.translate(flying?Math.sin(c.a*.8)*14*u:0,-height);
  if(flying){
    g.save();g.strokeStyle='#7c6090';g.lineWidth=1.5;
    sline(g,-63,-91,-22,-12);sline(g,-22,-94,-10,-12);sline(g,22,-94,10,-12);sline(g,63,-91,22,-12);
    g.strokeStyle='#684784';g.lineWidth=2.5;
    g.beginPath();g.moveTo(-65,-91);g.bezierCurveTo(-60,-153,60,-153,65,-91);
    g.quadraticCurveTo(43,-105,22,-91);g.quadraticCurveTo(0,-103,-22,-91);g.quadraticCurveTo(-43,-105,-65,-91);
    g.fillStyle='#b793d3';g.fill();g.stroke();
    g.beginPath();g.moveTo(-22,-91);g.quadraticCurveTo(-19,-136,0,-137);g.quadraticCurveTo(19,-136,22,-91);
    g.quadraticCurveTo(0,-103,-22,-91);g.fillStyle='#e4d3ec';g.fill();g.stroke();
    g.strokeStyle='#b69145';g.lineWidth=1.5;spoly(g,[[0,-127],[6,-119],[0,-110],[-6,-119]],'#f3d482');g.restore();
  }
  drawRareChest(g,0,0,1.1,c.a);
  g.restore();
}

/* ── кадр ─────────────────────────────────────────────────── */
function draw() {
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.save();
  if (shake > .2&&visualFX('shake')) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
  const sniperPOV = ult.on && SNIPER_SCOPE_MODES.includes(ult.mode);
  const sniperP = sniperPOV ? Math.max(0,Math.min(1,ult.t/ult.dur)) : 0;
  const flyRaw = sniperPOV ? Math.max(0,Math.min(1,sniperP/.20)) : 0;
  const fly = flyRaw*flyRaw*(3-2*flyRaw);
  // Камера стартует на реальном герое и физически пролетает к реальному врагу.
  const Z = ult.zoom, focus = ult.on && ult.focus ? ult.focus : null;
  const fm = focus ? .30 : 0;
  const scopeX = ult.mode === "deadeye" ? ult.camX : focus ? focus.x : P.x;
  const scopeY = ult.mode === "deadeye" ? ult.camY : focus ? focus.y-12 : P.y;
  const followMotion=ult.on&&ult.mode==='dragonburst';
  const frameEnvelope=followMotion?Math.max(0,Math.min(1,ult.t/ult.dur/.12,(1-ult.t/ult.dur)/.15)):0;
  const motionPose=followMotion?ultPose():null;
  const bodyCenterY=motionPose?Math.cos((ult.rot||0)+motionPose.lean)*motionPose.neck*.5*motionPose.squash*ultHeroScale():0;
  const fx = ult.on ? (sniperPOV ? P.x+(scopeX-P.x)*fly : focus ? P.x+(focus.x-P.x)*fm : P.x)+(followMotion?(ult.stageX||0)*.78:0) : cam.x+W/2;
  const fy = ult.on ? (sniperPOV ? P.y+(scopeY-P.y)*fly : focus ? P.y+(focus.y-P.y)*fm : P.y)+(followMotion?((ult.stageY||0)-(ult.lift||0))*.90+bodyCenterY*.9*frameEnvelope:0) : cam.y+H/2;
  const up = ult.on ? Math.max(0, Math.min(1, ult.t / ult.dur)) : 0;
  const cant = !ult.on ? 0 : (ult.mode === "dash" || ult.mode === "combo")
    ? Math.sin((ult.step || 0) * 2.4) * .012
    : (ult.mode === "kick" || ult.mode === "cross") ? Math.sin(up * Math.PI) * P.face * .010 : 0;
  ctx.translate(W / 2, H / 2); ctx.rotate(visualFX('shake')?cant:0); ctx.scale(Z, Z); ctx.translate(-fx, -fy);
  const hw = W / 2 / Z + 70, hh = H / 2 / Z + 70;
  const L = fx - hw, R = fx + hw, T = fy - hh, B = fy + hh;
  const vis = o => o.x > L && o.x < R && o.y > T && o.y < B;

  drawMapGround(ctx,L,R,T,B);
  drawBossGround(ctx,L,R,T,B);
  drawArenaSecrets(ctx,L,R,T,B);
  if(typeof drawCaravan==='function')drawCaravan(ctx);

  ctx.lineCap = "round"; ctx.lineJoin = "round";

  for(const ic of ices)if(ic.x+ic.r>L&&ic.x-ic.r<R&&ic.y+ic.r>T&&ic.y-ic.r<B)drawIceField(ctx,ic);

  drawGasCloud(ctx, L, R, T, B);
  drawEnemyHazards(ctx);
  drawBossMarks(ctx);
  drawCompassStorm(ctx,L,R,T,B);

  for (const o of props) {                       // камни, кусты, деревья
    if(o.x+o.r*1.4<L||o.x-o.r*1.4>R||o.y+o.r*1.4<T||o.y-o.r*1.4>B)continue;
    drawMapProp(ctx,o);
  }

  drawNightTorches(ctx,L,R,T,B);
  for (const h of pickups) {                     // бусты на карте
    if (!vis(h)) continue;
    drawPickup(ctx, h);
  }
  drawDragonAltar(ctx);
  for (const c of chests) {                      // сундук
    if(c.elite){
      if(c.x+90>L&&c.x-90<R&&c.y+55>T&&c.y-(c.dropT>0?570:60)<B)drawEliteChest(ctx,c);
      continue;
    }
    if (!vis(c)) continue;
    if (c.rare) { drawRareChest(ctx, c.x, c.y, 1.1, c.a); continue; }
    ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
    ctx.save(); ctx.translate(c.x, c.y);
    spoly(ctx, [[-19, -2], [19, -2], [17, 13], [-17, 13]], "#c98f4e");   // короб
    ctx.beginPath(); ctx.moveTo(-19, -2);                                 // крышка дугой
    ctx.quadraticCurveTo(0, -22, 19, -2); ctx.closePath();
    ctx.fillStyle = "#dda964"; ctx.fill(); ctx.stroke();
    ctx.lineWidth = 2.2;
    sline(ctx, -19, -2, 19, -2);
    sline(ctx, -8, -16, -8, 13); sline(ctx, 8, -16, 8, 13);               // окантовка
    spoly(ctx, [[-4, -4], [4, -4], [4, 5], [-4, 5]], "#e8c66a");          // замок
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(0, 0, 1.5, 0, 7); ctx.fill();
    ctx.strokeStyle = "#e8c66a"; ctx.lineWidth = 1.8;                     // искры
    for (let i = 0; i < 3; i++) {
      const a2 = c.a + i * 2.1, rr = 26 + Math.sin(c.a * 2 + i) * 4;
      sline(ctx, Math.cos(a2) * rr, -6 + Math.sin(a2) * rr * .5,
                 Math.cos(a2) * (rr + 5), -6 + Math.sin(a2) * (rr + 5) * .5);
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 2.6;
    ctx.restore();
    const oy = c.y - 36 + Math.sin(c.a * 2) * 5;
    drawItemIcon(ctx, c.item, c.x, oy, 1.05);
  }

  ctx.strokeStyle = INK; ctx.lineWidth = 2;
  for (const m of mines) {
    ctx.globalAlpha = m.arm > 0 ? .5 : 1;
    if (m.mini) { ctx.lineWidth = 2; scircle(ctx, m.x, m.y, 6, "#4e8f4a");
      ctx.fillStyle = "#ffe0b0"; ctx.beginPath(); ctx.arc(m.x, m.y, 2, 0, 7); ctx.fill(); }
    else drawItemIcon(ctx, "mine", m.x, m.y, .95);
    ctx.globalAlpha = 1;
    if (m.arm <= 0 && !m.mini) { ctx.fillStyle = "#ffe0b0";
      ctx.beginPath(); ctx.arc(m.x, m.y, 1.6 + Math.sin(t / 120) * 1.4, 0, 7); ctx.fill(); }
  }
  for (const g of nades) { ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(t / 90); drawItemIcon(ctx, "nade", 0, 0, .85); ctx.restore(); }
  for (const [i,p] of puffs.entries()) {
    if(visualFX('lowFX')&&i%3)continue;
    ctx.globalAlpha = Math.max(0, p.life); ctx.lineWidth = 1.8;
    scircle(ctx, p.x, p.y, p.r, p.gas ? "#9fbd72" : "#e0d3bd"); ctx.globalAlpha = 1;
  }
  for (const c of corpses) drawCorpse(ctx, c);
  for (const e of enemies) {
    if (!vis(e)) continue;
    drawEnemyIntent(ctx,e);
    drawFoe(ctx, e.x, e.y + 13 * (e.r / 11)-(ult.on?0:(e.stormLift||0)), e.face, e.phase, e.r / 11,
            e.poison > 0 ? "#86aa65" : e.flash > 0 ? "#f0907c" : e.boss?e.bossSpec.color:FOE, e.kind, 0, e.flinch,e);
    if (e.kind === "elite" || enemyBaseKind(e.kind) === "tank") {
      const w = e.r * 2.2;
      ctx.fillStyle = "rgba(0,0,0,.12)"; ctx.fillRect(e.x - w / 2, e.y - e.r - 18, w, 4);
      ctx.fillStyle = FOE; ctx.fillRect(e.x - w / 2, e.y - e.r - 18, w * Math.max(0, e.hp / e.maxhp), 4);
    }
  }
  if(!visualFX('reduceFlash'))for (const f of flashes) drawFlash(ctx, f);
  for (const b of booms) {                            // волна стелется по земле
    if(b.style==='boar'){drawBoarBlast(ctx,b);continue;}
    const a2 = Math.max(0, b.life);
    ctx.globalAlpha = a2 * .85; ctx.strokeStyle = "#e08a2a"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(b.x, b.y + 8, b.r, b.r * .44, 0, 0, 7); ctx.stroke();
    ctx.globalAlpha = a2 * .25; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.ellipse(b.x, b.y + 8, b.r * .86, b.r * .38, 0, 0, 7); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if(P.laserBeam&&P.wtype==='laser'&&P.gear.gun===4&&!ult.on){
    const b=P.laserBeam;ctx.save();ctx.lineCap='round';ctx.strokeStyle='#3c91a6';ctx.lineWidth=6+P.gear.gun;
    ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.ex,b.ey);ctx.stroke();ctx.strokeStyle='#b2f5df';ctx.lineWidth=2.2;ctx.stroke();
    ctx.fillStyle='#ecfff3';ctx.beginPath();ctx.arc(b.ex,b.ey,3+Math.sin(t*.015)*.6,0,7);ctx.fill();ctx.restore();
  }
  for (const s of shots) {
    if(s.source==='backpack'){
      ctx.strokeStyle="#d2a23d";ctx.lineWidth=2;ctx.beginPath();
      ctx.moveTo(s.x-Math.cos(s.a)*9,s.y-Math.sin(s.a)*9);ctx.lineTo(s.x,s.y);ctx.stroke();
      ctx.fillStyle="#fff2bb";ctx.beginPath();ctx.arc(s.x,s.y,2.6,0,7);ctx.fill();
      continue;
    }
    const look=s.ultCast?weaponShotKind(P.wtype,P.gear.gun):s.kind;
    if(look==='arrow'){
      ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.a);ctx.strokeStyle='#805b35';ctx.lineWidth=1.6;sline(ctx,-19,0,0,0);
      spoly(ctx,[[-4,-3],[2,0],[-4,3]],'#a8b7ae');ctx.strokeStyle='#d9bd83';sline(ctx,-16,0,-21,-3);sline(ctx,-16,0,-21,3);ctx.restore();
    }else if(look==='laser'){
      ctx.strokeStyle='#3d929f';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(s.x-Math.cos(s.a)*42,s.y-Math.sin(s.a)*42);ctx.lineTo(s.x,s.y);ctx.stroke();
      ctx.strokeStyle='#c6fff1';ctx.lineWidth=1.7;ctx.stroke();
    }else if (look === "sniper") {
      drawSniperProjectile(ctx,s.x,s.y,s.a,(s.weaponType||P.wtype)==='goldSniper');
    } else if (s.kind === "pellet") {
      ctx.fillStyle = "#7a5330";
      ctx.beginPath(); ctx.arc(s.x, s.y, 2.4, 0, 7); ctx.fill();
    } else if (s.kind === "tank") {
      ctx.strokeStyle = "#3d78bd"; ctx.lineWidth = 4.2;
      ctx.beginPath(); ctx.moveTo(s.x,s.y); ctx.lineTo(s.x-Math.cos(s.a)*20,s.y-Math.sin(s.a)*20); ctx.stroke();
      ctx.globalAlpha=.65; ctx.fillStyle="#ffd36a"; ctx.beginPath(); ctx.arc(s.x,s.y,3.4,0,7); ctx.fill(); ctx.globalAlpha=1;
    } else if (s.kind === "mini") {
      ctx.strokeStyle = "#e08a2a"; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - Math.cos(s.a) * 8, s.y - Math.sin(s.a) * 8); ctx.stroke();
    } else {
      ctx.strokeStyle = INK; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - Math.cos(s.a) * 11, s.y - Math.sin(s.a) * 11); ctx.stroke();
    }
  }
  for (const eg of eggs) drawEgg(ctx, eg);
  for (const ch of chicks) drawChick(ctx, ch);
  for (const tu of turrets) drawTurret(ctx, tu);
  for (const q of allyTanks) drawAllyTank(ctx, q);
  if (running) {
    drawMoleBurrow(ctx,P.pet);
    if (P.pet && P.pet.dead <= 0 && !(P.pet.hurt > 0 && Math.floor(t / 80) % 2 === 0)) {
      drawPet(ctx, P.pet.x, P.pet.y, P.pet.type, P.pet.lvl, P.pet.face, P.pet.phase, P.pet);
      const w = P.pet.type==='mole'&&P.pet.state==='down'?0:22;
      ctx.fillStyle = "rgba(43,38,32,.18)"; ctx.fillRect(P.pet.x - w / 2, P.pet.y - 40, w, 3.5);
      ctx.fillStyle = "#4e8f4a"; ctx.fillRect(P.pet.x - w / 2, P.pet.y - 40, w * (P.pet.hp / P.pet.hpMax), 3.5);
    }
    if (P.invT > 0) {
      ctx.globalAlpha = .45;
      ctx.strokeStyle = "#4aa8cf"; ctx.lineWidth = 2.4; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.arc(P.x, P.y - 8, 34, 0, 7); ctx.stroke();
      ctx.setLineDash([]);
    }
    if (!(sniperPOV && sniperP>.13))
      if (ult.on) {
        const gear2 = { ...P.gear, _w: P.wtype, _holdWeapon:true, _noShadow: true, _chem: P.chemT > 0 };
        const SCU = ultHeroScale(), BOLD = 1.55;
        const pz = ultPose();
        for (let i = 0; !visualFX('lowFX')&&i < (ult.trail || []).length; i++) {
          const tr = ult.trail[i];
          ctx.globalAlpha = ult.mode === 'dragonburst'?.02+i*.015:ult.mode === "dive" ? .022 + i * .014 : .05 + i * .022;
          ctx.save(); ctx.translate(tr.x, tr.y + 17); ctx.rotate(tr.rot);
          drawHero(ctx, 0, 0, tr.face??P.face, 0, gear2, tr.sc??SCU, tr.aim??P.aim, 0, tr.pose, BOLD);
          ctx.restore();
        }
        ctx.globalAlpha = 1;
        const kick = (ult.kick || 0) * 5;
        const hx = P.x + (ult.stageX || 0) - Math.cos(P.aim) * kick;
        const hy = P.y + 17 + (ult.stageY || 0) - (ult.lift || 0) - Math.sin(P.aim) * kick;
        // тень на земле
        ctx.globalAlpha = .13; ctx.fillStyle = INK;
        ctx.beginPath(); ctx.ellipse(P.x+(ult.stageX||0), P.y + 17+(ult.stageY||0), 17, 5, 0, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
        // объём: тёмная копия со сдвигом, затем сама фигура
        ctx.save(); ctx.translate(hx + 2.5, hy + 3.5); ctx.rotate(ult.rot || 0);
        ctx.globalAlpha = .30;
        drawHero(ctx, 0, 0, P.face, 0, gear2, SCU, P.aim, 0, pz, BOLD);
        ctx.globalAlpha = 1; ctx.restore();
        ctx.save(); ctx.translate(hx, hy); ctx.rotate(ult.rot || 0);
        drawHero(ctx, 0, 0, P.face, 0, gear2, SCU, P.aim, P.muzzle, pz, BOLD);
        ctx.restore();
      } else
      {
        const run = P.run || 0;
        const rc = (P.recoilT || 0) > 0 ? (P.recoilT / 170) * 4 : 0;
        const hp2 = { lean: -P.face * run * .055, squash: 1 + Math.sin(P.phase * 2) * .018 * run };
        if(bossLoot?.stage===20){
          hp2.af=[7,-23];hp2.ab=[-8,-23];
          if(bossLootOpening){const reach=Math.sin(Math.min(1,bossLootOpening.age/650)*Math.PI);hp2.lean=P.face*.13*reach;hp2.af=[13,-21];}
        }
        for (const g2 of (P.ghosts || [])) {           // след при ускорении
          ctx.globalAlpha = Math.max(0, g2.life) * .14;
          drawHero(ctx, g2.x, g2.y + 17, g2.face, g2.ph,
                   { ...P.gear, _w: P.wtype, _holdWeapon:true, _noShadow: true, _holstered:bossLoot?.stage===20, _chem: P.chemT > 0 }, .99, P.aim, 0, hp2);
        }
        ctx.globalAlpha = P.hurt>0?.76+.16*(.5+.5*Math.sin(t/170)):1;
        drawHero(ctx, P.x - Math.cos(P.aim) * rc, P.y + 17 - Math.sin(P.aim) * rc,
                   P.face, P.phase, { ...P.gear, _w: P.wtype, _holdWeapon:true, _chem: P.chemT > 0, _holstered:bossLoot?.stage===20, _backpackFlash:P.backpackFlash }, 1.02, P.aim, P.muzzle, hp2);
      }
    ctx.globalAlpha = 1;
  }
  if(!sniperPOV)drawHeroDamageFeedback(ctx);
  drawDragonFinale(ctx);
  drawDragonAssist(ctx);
  ctx.font = "700 14px system-ui"; ctx.textAlign = "center";
  for (const p of pops) {
    ctx.globalAlpha = Math.min(1, p.life * 1.6); ctx.fillStyle = p.col;
    ctx.fillText(p.txt, p.x, p.y); ctx.globalAlpha = 1;
  }
  if (ult.on) {
    drawUltMotionFX(ctx);
    if (ult.mode === "whirl" && ult.ring) {           // росчерк по дуге
      const a0 = ult.spinAim;
      for (let i = 0; i < 6; i++) {
        ctx.globalAlpha = .40 - i * .06;
        ctx.strokeStyle = "#fff8e8"; ctx.lineWidth = 14 - i * 2;
        ctx.beginPath();
        ctx.arc(P.x, P.y - 16, 66, a0 - 1.5 - i * .16, a0 - .1 - i * .16);
        ctx.stroke();
      }
      ctx.globalAlpha = .9; ctx.strokeStyle = "#fff"; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(P.x, P.y - 16, 66, a0 - .30, a0); ctx.stroke();
      ctx.globalAlpha = .16; ctx.strokeStyle = "#c9b9a2"; ctx.lineWidth = 26;
      ctx.beginPath(); ctx.arc(P.x, P.y + 14, ult.ring * .55, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    for (const b of ult.blinks || []) {                // росчерки рывка
      ctx.globalAlpha = Math.max(0, b.life) * .85;
      ctx.strokeStyle = "#8a53c4"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(b.x1, b.y1 - 14); ctx.lineTo(b.x2, b.y2 - 14); ctx.stroke();
      ctx.globalAlpha = Math.max(0, b.life) * .3; ctx.lineWidth = 16;
      ctx.beginPath(); ctx.moveTo(b.x1, b.y1 - 14); ctx.lineTo(b.x2, b.y2 - 14); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (ult.slash > 0) {                               // дуга удара после рывка
      ctx.globalAlpha = ult.slash; ctx.strokeStyle = "#fff3d8"; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(P.x + Math.cos(P.aim) * 30, P.y - 14 + Math.sin(P.aim) * 30, 26,
              P.aim - 1.1, P.aim + 1.1);
      ctx.stroke(); ctx.globalAlpha = 1;
    }
    for (const m of ult.marks || []) {                 // прицелы ливня и падающие лучи
      const u = 1 - m.life;
      ctx.globalAlpha = Math.min(1, m.life * 2);
      ctx.strokeStyle = "#8a53c4"; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.arc(m.x, m.y, 10 + (1 - m.life) * 16, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(m.x, m.y, 26 * m.life + 6, 0, 7); ctx.stroke();
      if (m.life < .62) {
        ctx.strokeStyle = "#fff3d8"; ctx.lineWidth = 4;
        const drop = Math.min(1, (0.62 - m.life) / .17);
        ctx.beginPath();
        ctx.moveTo(m.x, m.y - 460 * (1 - drop) - 40);
        ctx.lineTo(m.x, m.y - 460 * (1 - drop) * .55);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (ult.tracer) {                                  // трассер расстрела
      const tr = ult.tracer;
      ctx.globalAlpha = Math.max(0, tr.life);
      ctx.strokeStyle = tr.gold ? "#f0c94d" : "#8a53c4"; ctx.lineWidth = tr.gold ? 5.5 : 4;
      ctx.beginPath(); ctx.moveTo(tr.x1, tr.y1); ctx.lineTo(tr.x2, tr.y2); ctx.stroke();
      ctx.globalAlpha = Math.max(0, tr.life) * .3; ctx.lineWidth = tr.gold ? 18 : 12;
      ctx.beginPath(); ctx.moveTo(tr.x1, tr.y1); ctx.lineTo(tr.x2, tr.y2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    for(const s of ult.goldSegments||[]){              // цепочка золотого рикошета
      const a3=Math.max(0,s.life);ctx.globalAlpha=a3*.22;ctx.strokeStyle=ult.mode==='dragonburst'?ult.dragonType.breath:"#e3b52f";ctx.lineWidth=16;
      ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();
      ctx.globalAlpha=a3;ctx.strokeStyle="#fff4ae";ctx.lineWidth=3.6;
      ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();ctx.globalAlpha=1;
    }
    if (ult.lift > 4) {                                // тень внизу, пока в воздухе
      ctx.globalAlpha = .10; ctx.fillStyle = INK;
      ctx.beginPath(); ctx.ellipse(P.x+(ult.stageX||0), P.y + 18+(ult.stageY||0), 16, 4.5, 0, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
    for (const f of (ult.impacts || [])) drawUltImpact(ctx, f);
    ctx.globalAlpha = 1;
  }
  drawAbilityWorldFX(ctx);
  drawBossLoot(ctx);
  drawWeaponDelivery(ctx);
  ctx.textAlign = "left"; ctx.restore();

  drawBossNight(ctx);

  if (ult.on) drawUltScreenFX(ctx);                    // лучи, вспышка и кино-полосы
  drawAbilityScreenFX(ctx);
  if (!sniperPOV) hud();
  if (!sniperPOV) drawBossHUD(ctx);
  if (!sniperPOV) drawBossArrival(ctx);
  if (!sniperPOV) drawAltarGuide(ctx);
  drawDragonScreenFX(ctx);                             // финальные кино-полосы поверх HUD
  drawBossLootGuide(ctx);
  drawBossLootNotice(ctx);
  if(!ult.on)drawWeaponDeliveryHUD(ctx);
}
