"use strict";
const homeCellViews=new Map();
function cellView(id){if(!homeCellViews.has(id))homeCellViews.set(id,{yaw:.85,pitch:.35,distance:1.06});return homeCellViews.get(id);}
function cellCanInteract(slot){return dragonHomeOpen()&&homeTab==="warehouse"&&caveHeld===null&&homeThumbSlots.includes(slot)&&slot.c.isConnected&&!(typeof Playables!=="undefined"&&Playables.blocked);}
function invalidateCellFrames(slot){
  homeThumbJobs=homeThumbJobs.filter(j=>j.id!==slot.id);slot.frames=[];slot.frames.width=slot.c.width;slot.dirty=true;
  homeThumbCache.delete(slot.id);homeThumbCache.set(slot.id,slot.frames);
}
function queueCellFrames(slot){
  homeThumbJobs=homeThumbJobs.filter(j=>j.id!==slot.id);
  homeThumbJobs.push({id:slot.id,c:slot.c,frames:slot.frames,view:{...slot.view},width:slot.c.width,height:slot.c.height});wakeDragonHome();
}
function finishCellGesture(slot){if(slot.gesture?.moved&&homeThumbSlots.includes(slot)&&slot.c.isConnected)queueCellFrames(slot);slot.gesture=null;slot.c.classList.remove("orbiting");}
function cancelCellGestures(){for(const slot of homeThumbSlots)finishCellGesture(slot);}
function attachCellCamera(slot){
  const c=slot.c;c.tabIndex=0;c.setAttribute("aria-label",homeEntry(slot.id).name+". Потяни в сторону для вращения камеры. Стрелки — повернуть, плюс и минус — приблизить.");
  c.addEventListener("pointerdown",e=>{
    if(e.button!==0||!cellCanInteract(slot))return;
    if(slot.gesture){finishCellGesture(slot);return;}
    slot.gesture={id:e.pointerId,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,touch:e.pointerType==="touch",moved:false,start:performance.now()};
    if(e.pointerType!=="touch"){e.preventDefault();c.focus({preventScroll:true});}c.setPointerCapture(e.pointerId);
  });
  c.addEventListener("pointermove",e=>{
    const p=slot.gesture;if(!p||p.id!==e.pointerId||!cellCanInteract(slot))return;
    const dx=e.clientX-p.sx,dy=e.clientY-p.sy;
    if(!p.moved){if(Math.hypot(dx,dy)<7)return;if(p.touch&&Math.abs(dy)>Math.abs(dx)){finishCellGesture(slot);return;}p.moved=true;invalidateCellFrames(slot);c.classList.add("orbiting");}
    slot.view.yaw-=(e.clientX-p.x)*.014;
    if(!p.touch)slot.view.pitch=Math.max(.12,Math.min(1.12,slot.view.pitch+(e.clientY-p.y)*.009));
    p.x=e.clientX;p.y=e.clientY;wakeDragonHome();
  });
  for(const type of ["pointerup","pointercancel","lostpointercapture"])c.addEventListener(type,e=>{
    if(slot.gesture?.id!==e.pointerId)return;
    const tap=type==="pointerup"&&!slot.gesture.moved&&performance.now()-slot.gesture.start<600&&cellCanInteract(slot);
    finishCellGesture(slot);if(tap)inspectHomeDragon(slot.id);
  });
  c.addEventListener("keydown",e=>{
    if(!cellCanInteract(slot))return;
    if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();inspectHomeDragon(slot.id);return;}
    const changes={ArrowLeft:[-.16,0,0],ArrowRight:[.16,0,0],ArrowUp:[0,-.08,0],ArrowDown:[0,.08,0],"+":[0,0,-.1],"=":[0,0,-.1],"-":[0,0,.1]};
    if(!changes[e.key])return;e.preventDefault();e.stopPropagation();const [yaw,pitch,distance]=changes[e.key];
    finishCellGesture(slot);invalidateCellFrames(slot);slot.view.yaw+=yaw;slot.view.pitch=Math.max(.12,Math.min(1.12,slot.view.pitch+pitch));slot.view.distance=Math.max(.62,Math.min(2.5,slot.view.distance+distance));queueCellFrames(slot);
  });
}
