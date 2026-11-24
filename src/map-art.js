"use strict";
/* Painted terrain is visual only. Fixed world coordinates keep it still while
   the camera moves; a bounded tile cache avoids redrawing detail each frame. */
const MAP_TILE_SIZE=256,MAP_TILE_LIMIT=64,mapTiles=new Map();
// Shared by terrain painting and roadside scenery placement.
const MAP_TRAILS=[
 [[-120,620],[620,420],[640,1510],[1400,1400],[2040,1300],[2250,2080],[2920,1850]],
 [[2060,-100],[1950,780],[1500,960],[1400,1400],[1320,1830],[500,2130],[660,2920]]
];
function mapTrail(g,width,color){
  g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';
  for(const trail of MAP_TRAILS){
    g.beginPath();g.moveTo(...trail[0]);
    for(let i=1;i<trail.length;i+=3)g.bezierCurveTo(...trail[i],...trail[i+1],...trail[i+2]);
    g.stroke();
  }
}
function paintMapTile(g,tx,ty){
  const size=MAP_TILE_SIZE+2,x0=tx*MAP_TILE_SIZE-1,y0=ty*MAP_TILE_SIZE-1;
  g.fillStyle='#f0e6d3';g.fillRect(0,0,size,size);
  g.save();g.translate(-x0,-y0);
  // Large translucent meadow stains cross tile seams in world space.
  for(let x=Math.floor((x0-160)/160)*160;x<x0+size+160;x+=160)
    for(let y=Math.floor((y0-160)/160)*160;y<y0+size+160;y+=160){
      const h=hash(x+71,y+39);if(h<.47)continue;
      g.fillStyle=h>.8?'rgba(159,178,117,.13)':'rgba(194,188,139,.12)';
      g.beginPath();g.ellipse(x+hash(y,x)*70,y+h*55,65+h*55,28+h*23,h*3,0,Math.PI*2);g.fill();
    }
  mapTrail(g,92,'rgba(180,155,110,.055)');mapTrail(g,66,'#e9dcc1');
  mapTrail(g,43,'#eddfc4');mapTrail(g,16,'rgba(247,235,211,.4)');
  // Fine flecks, tiny stones and grass; no gameplay obstacles are added.
  for(let x=Math.floor((x0-24)/40)*40;x<x0+size+24;x+=40)
    for(let y=Math.floor((y0-24)/40)*40;y<y0+size+24;y+=40){
      const h=hash(x+11,y+47),px=x+hash(y+21,x)*31,py=y+h*31;
      g.fillStyle='rgba(139,119,80,.14)';g.beginPath();g.ellipse(px,py,1.1+h, .55+h*.45,h*3,0,7);g.fill();
      if(h>.78){g.strokeStyle='#929b6c';g.lineWidth=.9;
        sline(g,px+8,py+5,px+6,py);sline(g,px+8,py+5,px+10,py-3);sline(g,px+8,py+5,px+13,py+1);
      }else if(h<.09){g.strokeStyle='#b3a487';g.lineWidth=.65;
        spoly(g,[[px,py],[px+4,py-2],[px+7,py+1],[px+4,py+3]],'#e3d7bb');
      }else if(h>.68&&h<.72){g.strokeStyle='rgba(151,133,98,.17)';g.lineWidth=.7;
        sline(g,px,py,px+7,py-3);sline(g,px+3,py+3,px+10,py);}
    }
  g.restore();
}
function drawMapGround(g,L,R,T,B){
  g.save();g.fillStyle='#d8ceb8';g.fillRect(L,T,R-L,B-T);
  const size=MAP_TILE_SIZE;
  g.save();g.beginPath();g.rect(0,0,WORLD,WORLD);g.clip();
  for(let ty=Math.max(0,Math.floor(T/size));ty<=Math.min(Math.ceil(WORLD/size)-1,Math.floor(B/size));ty++)
    for(let tx=Math.max(0,Math.floor(L/size));tx<=Math.min(Math.ceil(WORLD/size)-1,Math.floor(R/size));tx++){
      const key=tx+','+ty;let tile=mapTiles.get(key);
      if(!tile){tile=document.createElement('canvas');tile.width=tile.height=size+2;paintMapTile(tile.getContext('2d'),tx,ty);}
      else mapTiles.delete(key);
      mapTiles.set(key,tile);if(mapTiles.size>MAP_TILE_LIMIT)mapTiles.delete(mapTiles.keys().next().value);
      // One-pixel bleed avoids hairline seams during fractional camera motion.
      g.drawImage(tile,tx*size-1,ty*size-1);
    }
  // A worn compass in the starting clearing, painted flat onto the earth.
  const cx=WORLD/2,cy=WORLD/2;
  if(cx+120>L&&cx-120<R&&cy+120>T&&cy-120<B){
    g.save();g.translate(cx,cy);g.strokeStyle='rgba(157,134,92,.16)';g.lineWidth=2;
    g.beginPath();g.arc(0,0,105,0,7);g.stroke();
    g.setLineDash([3,12]);g.beginPath();g.arc(0,0,114,0,7);g.stroke();g.setLineDash([]);
    for(let i=0;i<4;i++){g.save();g.rotate(i*Math.PI/2);spoly(g,[[0,-84],[9,-24],[0,-33],[-9,-24]],'rgba(178,155,110,.08)');g.restore();}
    g.restore();
  }
  g.restore();
  // Border retains the exact playable bounds; ink is softened, not moved.
  g.strokeStyle='#b6a47d';g.lineWidth=12;g.strokeRect(0,0,WORLD,WORLD);
  g.strokeStyle='#796e56';g.lineWidth=2;g.strokeRect(0,0,WORLD,WORLD);g.restore();
}
function drawMapProp(g,o){
  const r=o.r,seed=o.seed||0;
  g.save();g.translate(o.x,o.y);g.lineJoin='round';g.lineCap='round';
  g.fillStyle='rgba(80,73,47,.12)';g.beginPath();g.ellipse(6,r*.36,r*1.05,r*.63,.12,0,7);g.fill();
  g.fillStyle='rgba(144,161,99,.16)';g.beginPath();g.ellipse(-6,4,r*1.13,r*.77,seed,0,7);g.fill();
  g.strokeStyle='#565442';g.lineWidth=2.2;
  if(o.kind==='rock'){
    spoly(g,o.pts,'#cec5ae');g.save();g.clip();
    g.strokeStyle='rgba(117,107,84,.38)';g.lineWidth=1.2;
    for(let i=0;i<o.pts.length;i++){
      const a=o.pts[i],b=o.pts[(i+1)%o.pts.length];
      spoly(g,[a,b,[-r*.13,-r*.19]],['#ded6bf','#d2c9b1','#bcb59f','#c3baa3'][i%4]);
    }
    g.fillStyle='#a6b184';g.beginPath();g.ellipse(-r*.48,r*.18,r*.32,r*.16,-.4,0,7);g.fill();
    g.strokeStyle='#f1e8ce';g.lineWidth=1.4;sline(g,-r*.48,-r*.35,-r*.12,-r*.53);
    g.strokeStyle='#948e79';g.lineWidth=1;sline(g,r*.24,-r*.11,r*.16,r*.24);sline(g,r*.16,r*.24,r*.35,r*.32);
    g.restore();g.strokeStyle='#68614e';g.lineWidth=2.2;spoly(g,o.pts);
  }else if(o.kind==='bush'){
    // Clipping keeps the leafy silhouette inside the existing solid footprint.
    spoly(g,o.pts,'#899d6d');g.save();g.clip();g.lineWidth=1.1;g.strokeStyle='#778d62';
    for(let i=0;i<7;i++){
      const a=i*2.399+seed*4,x=Math.cos(a)*r*.51,y=Math.sin(a)*r*.45;
      scircle(g,x,y,r*(.31+(i%2)*.07),['#b2c58d','#a1b982','#c0ce9d'][i%3]);
      g.strokeStyle='#e0e6ba';sline(g,x-3,y-3,x+3,y-6);g.strokeStyle='#778d62';
    }
    g.restore();g.strokeStyle='#667951';g.lineWidth=2;spoly(g,o.pts);
  }else{
    g.strokeStyle='#63583c';g.lineWidth=2;
    spoly(g,[[-5,r*.78],[5,r*.78],[3,-r*.3],[-4,-r*.3]],'#a68a59');
    g.strokeStyle='#d2b77e';g.lineWidth=1.4;sline(g,-2,r*.55,-1,-r*.08);
    g.strokeStyle='#567149';g.lineWidth=2;
    scircle(g,0,-r*.23,r*.84,'#86a66d');
    scircle(g,-r*.40,-r*.20,r*.48,'#a0bc7e');
    scircle(g,r*.35,-r*.37,r*.47,'#93b675');
    scircle(g,-r*.06,-r*.62,r*.46,'#b8ce91');
    g.strokeStyle='#dfe8b6';g.lineWidth=1.6;
    for(let i=0;i<4;i++){const x=-r*.40+i*r*.23,y=-r*.65+(i%2)*r*.26;sline(g,x,y,x+5,y-2);}
  }
  g.restore();
}
