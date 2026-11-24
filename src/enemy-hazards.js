"use strict";
let enemyFireballs=[],enemyFires=[],enemySteam=[];
function resetEnemyHazards(){enemyFireballs=[];enemyFires=[];enemySteam=[];}
function touchesIce(x,y,r=0){return ices.some(ic=>ic.life>0&&Math.hypot(x-ic.x,y-ic.y)<ic.r+r);}
function extinguishFire(x,y){
  if(enemySteam.length<24)enemySteam.push({x,y,life:650});
}
function pyroMovementIntent(e,tx,ty,dt){
  const dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy)||1;
  const move={vx:dx/d,vy:dy/d,pace:1,locked:false};
  e.attackCd=Math.max(0,(e.attackCd||0)-dt);
  if(dragonFinale){e.attackState='chase';return move;}
  if(touchesIce(e.x,e.y)){e.attackState='chase';e.attackCd=Math.max(700,e.attackCd);return move;}
  if(e.attackState==='windup'){
    e.attackT-=dt;move.pace=.12;move.locked=true;
    if(e.attackT<=0){
      if(enemyFireballs.length<4&&enemyFires.length<8)enemyFireballs.push({from:{x:e.x,y:e.y-18},x:e.fireAim.x,y:e.fireAim.y,
        age:0,duration:650,r:40,damage:P.stage>=15?1.5:1});
      e.attackState='chase';e.attackCd=5200;
    }
  }else if(!e.attackCd&&d>65&&d<320&&enemyFireballs.length<4&&enemyFires.length<8){
    // Lock the visible landing circle NOW: no prediction or later retargeting.
    e.fireAim={x:Math.max(40,Math.min(WORLD-40,tx)),y:Math.max(40,Math.min(WORLD-40,ty))};
    e.attackState='windup';e.attackT=950;move.pace=.12;move.locked=true;
  }else if(d<220){
    move.vx+=-dy/d*.65*(e.flankSide||1);move.vy+=dx/d*.65*(e.flankSide||1);move.pace=.55;
  }
  return move;
}
function updateEnemyHazards(dt){
  if(dragonFinale){resetEnemyHazards();return false;}
  for(const s of enemySteam)s.life-=dt;
  enemySteam=enemySteam.filter(s=>s.life>0);
  for(const b of enemyFireballs){
    b.age+=dt;if(b.age<b.duration)continue;
    if(touchesIce(b.x,b.y,b.r))extinguishFire(b.x,b.y);
    else if(enemyFires.length<8)enemyFires.push({x:b.x,y:b.y,r:b.r,damage:b.damage,life:3600});
  }
  enemyFireballs=enemyFireballs.filter(b=>b.age<b.duration);
  for(const f of enemyFires){
    f.life-=dt;
    if(touchesIce(f.x,f.y,f.r)){f.life=0;extinguishFire(f.x,f.y);continue;}
    if(f.life<=0)continue;
    if(Math.hypot(P.x-f.x,P.y-f.y)<f.r+P.r&&P.hurt<=0&&P.invT<=0){
      if(hurtHero(f.damage,{x:f.x,y:f.y,area:true},true))return true;
    }
    for(const q of allyTanks)if(!q.dead&&q.hp>0&&q.hurt<=0&&Math.hypot(q.x-f.x,q.y-f.y)<f.r+20){q.hp=Math.max(0,q.hp-8);q.hurt=600;}
  }
  enemyFires=enemyFires.filter(f=>f.life>0);return false;
}
function drawFireMarker(g,x,y,r,progress){
  g.save();g.translate(x,y);g.fillStyle='rgba(226,119,43,.10)';g.strokeStyle='#b7542e';g.lineWidth=2;
  g.setLineDash([5,5]);g.beginPath();g.arc(0,0,r,0,7);g.fill();g.stroke();g.setLineDash([]);
  g.strokeStyle='#e19837';g.lineWidth=3;g.beginPath();g.arc(0,0,r,-Math.PI/2,-Math.PI/2+Math.min(1,progress)*Math.PI*2);g.stroke();
  g.lineWidth=1.5;sline(g,-6,0,6,0);sline(g,0,-6,0,6);g.restore();
}
function drawEnemyHazards(g){
  for(const f of enemyFires){
    g.save();g.translate(f.x,f.y);g.globalAlpha=Math.min(1,f.life/500);g.strokeStyle='#c08043';g.lineWidth=1.4;
    g.fillStyle='rgba(213,133,50,.18)';g.beginPath();g.arc(0,0,f.r,0,7);g.fill();g.stroke();
    for(let i=0;i<7;i++){
      const a=i*2.399,x=Math.cos(a)*(i?25:0),y=Math.sin(a)*(i?22:0),h=13+Math.sin(t/130+i)*3;
      g.strokeStyle='#b8552b';g.lineWidth=1.2;
      spoly(g,[[x-6,y+3],[x-7,y-4],[x-2,y-9],[x,y-h],[x+4,y-7],[x+6,y],[x+2,y+4]],'#ed9a39');
      g.strokeStyle='#f5d57a';spoly(g,[[x-2,y+2],[x,y-7],[x+3,y+1]],'#f8df86');
    }g.restore();
  }
  for(const b of enemyFireballs){
    const u=Math.min(1,b.age/b.duration),x=b.from.x+(b.x-b.from.x)*u,y=b.from.y+(b.y-b.from.y)*u;
    drawFireMarker(g,b.x,b.y,b.r,1);
    g.save();g.fillStyle='rgba(83,57,33,.18)';g.beginPath();g.ellipse(x,y,7,3,0,0,7);g.fill();
    g.translate(x,y-Math.sin(u*Math.PI)*65);g.rotate(u*5);g.strokeStyle='#b74d29';g.lineWidth=1.5;
    spoly(g,[[-5,4],[-6,-3],[-2,-8],[0,-15],[4,-6],[6,2],[2,6]],'#ed9538');
    g.strokeStyle='#ffe5a1';scircle(g,0,0,2.8,'#ffe5a1');g.restore();
  }
  for(const s of enemySteam){g.save();g.globalAlpha=s.life/650*.65;g.fillStyle='#f3faf0';
    for(let i=0;i<3;i++){g.beginPath();g.ellipse(s.x+(i-1)*10,s.y-(650-s.life)*.035-i*4,8+i*2,5+i,0,0,7);g.fill();}g.restore();}
}
