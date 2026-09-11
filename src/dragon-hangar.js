"use strict";
/* Historical module/API name retained for saved builds; the scene is now a cave. */
const dragonHangarCache=new Map();
function drawDragonHangar(g,w,h){
  const key=w+"x"+h;
  if(dragonHangarCache.has(key)){g.drawImage(dragonHangarCache.get(key),0,0);return;}
  const c=document.createElement("canvas");c.width=w;c.height=h;const p=c.getContext("2d");
  p.scale(w/720,h/480);p.lineJoin="round";p.lineCap="round";
  const line=(x,y,xx,yy,col="#2b2620",lw=2)=>{p.strokeStyle=col;p.lineWidth=lw;p.beginPath();p.moveTo(x,y);p.lineTo(xx,yy);p.stroke();};
  const poly=(a,fill,lw=2)=>{p.fillStyle=fill;p.strokeStyle="#39352d";p.lineWidth=lw;p.beginPath();a.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.closePath();p.fill();p.stroke();};
  p.fillStyle="#e9dfc9";p.fillRect(0,0,720,480);
  if(w>=250){
    // A warm paper-and-ink cave, not an industrial room or a dark neon screen.
    poly([[0,0],[720,0],[720,343],[645,297],[590,274],[124,285],[0,347]],"#b8b09a");
    poly([[228,251],[234,135],[265,79],[306,55],[394,58],[446,93],[475,166],[475,272]],"#dbe0c4",3);
    poly([[238,224],[271,178],[309,199],[355,157],[398,188],[470,210],[475,272],[228,272]],"#a9ba90",1.5);
    poly([[242,254],[305,210],[354,232],[411,204],[471,243],[475,280],[228,280]],"#c8ceb0",1.5);
    // Offset rock layers form a natural vaulted opening.
    poly([[207,273],[190,173],[213,93],[262,44],[319,27],[303,68],[262,96],[245,153],[247,255]],"#938f7b");
    poly([[392,35],[448,64],[492,112],[518,206],[503,279],[472,266],[468,173],[443,110],[404,81]],"#9d9984");
    poly([[0,0],[183,0],[177,42],[140,67],[147,105],[94,93],[61,139],[0,126]],"#8f8b77",3);
    poly([[535,0],[720,0],[720,165],[681,119],[631,135],[615,82],[570,85]],"#8c8875",3);
    for(const [x,y,len] of [[172,17,75],[540,15,100],[74,75,110],[641,77,130],[347,0,44]]){
      poly([[x-13,y],[x+19,y+3],[x+4,y+len]],"#a29b83",1.8);line(x+4,y+17,x+4,y+len-8,"#d0c3a5",1);
    }
    // Collection alcoves carved into the rock: no spoilers inside empty niches.
    for(const [x,y] of [[102,165],[552,185]]){
      poly([[x-30,y+65],[x-31,y+5],[x-13,y-13],[x+22,y-9],[x+34,y+20],[x+31,y+65]],"#777866",2);
      poly([[x-36,y+58],[x+36,y+57],[x+43,y+72],[x-42,y+73]],"#bdb298",2);
      for(let j=0;j<4;j++)line(x-18+j*12,y+61,x-11+j*12,y+65,"#928459",1.5);
    }
    // Stone ledges, moss and torchlight keep the room welcoming and readable.
    poly([[0,264],[50,241],[84,261],[91,308],[39,339],[0,326]],"#9c9983",3);
    poly([[635,283],[680,255],[720,284],[720,354],[647,341]],"#969680",3);
    for(const [x,y] of [[49,247],[130,281],[593,273],[679,259]]){
      poly([[x-21,y],[x-5,y-10],[x+10,y-6],[x+22,y+3],[x+4,y+8]],"#8eaa70",1);
    }
    for(const x of [180,524]){
      line(x,215,x+6,175,"#6b4d32",6);
      poly([[x-4,181],[x-10,165],[x+2,142],[x+4,158],[x+14,163],[x+10,181]],"#d29042",1.5);
      poly([[x,176],[x,164],[x+5,158],[x+8,176]],"#f1d58c",1);
    }
    p.fillStyle="#fff1bf22";p.beginPath();p.moveTo(240,124);p.lineTo(180,382);p.lineTo(558,382);p.lineTo(471,126);p.fill();
  }
  poly([[0,344],[111,301],[225,276],[492,276],[626,307],[720,350],[720,480],[0,480]],"#e6d8bc",1);
  for(const [x,y,sc] of [[62,390,.7],[596,403,1],[152,444,.65],[531,308,.42],[253,310,.36]]){
    poly([[x-20*sc,y],[x-7*sc,y-12*sc],[x+19*sc,y-6*sc],[x+24*sc,y+9*sc],[x,y+14*sc]],"#c4bea6",1.5);
    line(x-6*sc,y-5*sc,x+8*sc,y+4*sc,"#938b75",1);
  }
  p.fillStyle="#71694e25";p.beginPath();p.ellipse(360,395,160,28,0,0,7);p.fill();
  // A low stone nest replaces the bolted metal turntable.
  for(let j=0;j<13;j++){
    const a=j/13*6.283,x=360+Math.cos(a)*133,y=375+Math.sin(a)*26;
    poly([[x-20,y-8],[x-5,y-17],[x+19,y-10],[x+23,y+9],[x-14,y+13]],j%2?"#b1aa90":"#c7bea2",1.8);
  }
  p.fillStyle="#c3aa70";p.strokeStyle="#6c5939";p.lineWidth=2;p.beginPath();p.ellipse(360,369,114,23,0,0,7);p.fill();p.stroke();
  for(let j=0;j<22;j++){
    const a=j*2.4,x=360+Math.cos(a)*101,y=369+Math.sin(a)*17;
    line(x-8,y-3,x+10,y+4,j%2?"#ead69e":"#907648",1.3);
  }
  dragonHangarCache.set(key,c);if(dragonHangarCache.size>5)dragonHangarCache.delete(dragonHangarCache.keys().next().value);
  g.drawImage(c,0,0);
}
