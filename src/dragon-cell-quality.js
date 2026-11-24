"use strict";
// High-resolution animation frames exist only for cells intersecting the viewport.
// Fixed per-cell ceiling avoids invalidating other dragons when scrolling.
// Three resting layers per cell, eight cells: below 6M pixels at 576px.
const CELL_HD_PIXEL_BUDGET=6000000,CELL_ASPECT=328/224;
const cellQualitySlots=new WeakMap();
function compactCellQuality(slot){
  homeThumbJobs=homeThumbJobs.filter(j=>j.id!==slot.id);
  const low=document.createElement("canvas");low.width=220;low.height=150;
  if(slot.frames.length||slot.hasImage)low.getContext("2d").drawImage(slot.c,0,0,220,150);
  else {const g=low.getContext("2d");g.fillStyle="#f5ecdd";g.fillRect(0,0,220,150);}
  const painted=!!slot.frames.length||!!slot.hasImage;
  slot.frames=painted?[low]:[];slot.frames.width=220;slot.dirty=false;
  homeThumbCache.set(slot.id,slot.frames);
  slot.c.width=220;slot.c.height=150;slot.c.getContext("2d").drawImage(low,0,0);
}
function resizeCellQuality(slot,width){
  const height=Math.floor(width/CELL_ASPECT);
  if(slot.c.width!==width||slot.c.height!==height){
    const poster=document.createElement("canvas");poster.width=slot.c.width;poster.height=slot.c.height;poster.getContext("2d").drawImage(slot.c,0,0);
    slot.c.width=width;slot.c.height=height;const g=slot.c.getContext("2d");g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";g.drawImage(poster,0,0,width,height);
  }
  if(slot.frames.width!==width||(slot.frames.length&&!slot.frames.layers)){invalidateCellFrames(slot);slot.frames.width=width;}
  if(!slot.gesture?.moved&&slot.frames.length<(homeReduced?1:HOME_IDLE_FRAMES)&&!homeThumbJobs.some(j=>j.id===slot.id))queueCellFrames(slot);
}
function updateCellQualities(){
  if(!dragonHomeOpen()||homeTab!=="warehouse")return;
  const visible=homeThumbSlots.filter(s=>s.visible&&s.c.isConnected);
  const limit=576;
  // Read all bounds before writes, to avoid repeated layout passes.
  const sizes=visible.map(s=>({slot:s,width:Math.max(220,Math.min(limit,Math.ceil(s.c.getBoundingClientRect().width*Math.min(1.5,devicePixelRatio||1)/16)*16))}));
  for(const {slot,width} of sizes)resizeCellQuality(slot,width);
  wakeDragonHome();
}
const homeCellQualityObserver=new IntersectionObserver(entries=>{
  for(const e of entries){
    const slot=cellQualitySlots.get(e.target);if(!slot||!homeThumbSlots.includes(slot))continue;
    const shown=e.isIntersecting;
    if(!shown&&slot.visible){finishCellGesture(slot);slot.visible=false;compactCellQuality(slot);}else slot.visible=shown;
  }
  updateCellQualities();
},{root:dragonHome,threshold:0});
const homeCellSizeObserver=new ResizeObserver(()=>updateCellQualities());
function observeCellQuality(slot){cellQualitySlots.set(slot.c,slot);homeCellQualityObserver.observe(slot.c);homeCellSizeObserver.observe(slot.c);}
function disconnectCellQuality(){homeCellQualityObserver.disconnect();homeCellSizeObserver.disconnect();for(const slot of homeThumbSlots)compactCellQuality(slot);}
