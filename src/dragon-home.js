"use strict";
const dragonHome=document.getElementById("dragonHome"),homeCanvas=document.getElementById("homeCanvas");
const EGG_SHELLS=[{name:"Лунное",col:"#8ed9e8"},{name:"Обсидиановое",col:"#b49adc"},{name:"Солнечное",col:"#f4c875"}];
let homeTab="incubator",homeSelected=null,homeReveal=null,homeHatching=0,homeRaf=0,homeLastFrame=0,homeFocus=null;
const homeView={yaw:-.65,pitch:.16,zoom:1,auto:!matchMedia("(prefers-reduced-motion: reduce)").matches};
const homeTouches=new Map();
function dragonHomeOpen(){return !dragonHome.classList.contains("hidden");}
function homeMessage(message){document.getElementById("homeMessage").textContent=message||"";}
function openDragonHome(){
  if(dragonFinale&&!dragonFinale.finished)return;
  homeFocus=document.activeElement;pointer.active=false;if(running)paused=true;
  dragonHome.classList.remove("hidden");homeHatching=0;homeReveal=null;
  refreshDragonHome();document.getElementById("btnCloseHome").focus();
  if(!homeRaf)homeRaf=requestAnimationFrame(animateDragonHome);
}
function closeDragonHome(){
  dragonHome.classList.add("hidden");homeTouches.clear();homeHatching=0;
  cancelAnimationFrame(homeRaf);homeRaf=0;
  pointer.active=false;if(running&&!userPaused&&!levelOpen()&&!dragonBookOpen())paused=false;
  if(homeFocus?.isConnected)homeFocus.focus();
}
function setDragonHomeTab(tab){homeTab=tab;homeReveal=null;homeHatching=0;refreshDragonHome();}
function refreshDragonHome(){
  if(!dragonHomeOpen())return;
  const p=dragonProfile,egg=p.egg,owned=Object.keys(p.exclusives).map(Number).filter(id=>p.exclusives[id]>0);
  document.getElementById("btnTurntable").textContent=homeView.auto?"Вращение: вкл":"Вращение: выкл";
  document.getElementById("homeWallet").textContent=`💎 ${p.counts.diamond} · Открыто ${owned.length}/100`;
  document.getElementById("tabIncubator").setAttribute("aria-selected",String(homeTab==="incubator"));
  document.getElementById("tabWarehouse").setAttribute("aria-selected",String(homeTab==="warehouse"));
  document.getElementById("incubatorPanel").classList.toggle("hidden",homeTab!=="incubator");
  document.getElementById("warehousePanel").classList.toggle("hidden",homeTab!=="warehouse");
  document.getElementById("viewerControls").classList.toggle("hidden",homeTab!=="warehouse"&&homeReveal===null);
  if(homeTab==="incubator"){
    document.getElementById("homeSceneTitle").textContent=homeReveal!==null?exclusiveDragonSpec(homeReveal).name:egg?EGG_SHELLS[egg.shell].name+" яйцо":"Выбери своё яйцо";
    document.getElementById("homeSceneHint").textContent=homeReveal!==null?"НОВЫЙ ОБИТАТЕЛЬ ДОМА · СОХРАНЁН":egg?.fed===5?"Внутри уже пробудилась новая жизнь":"Каждый вложенный дракон приближает вылупление";
    for(const b of document.querySelectorAll("[data-egg]")){
      b.classList.toggle("selected",egg?.shell===Number(b.dataset.egg));b.disabled=!!(egg?.fed>0)||!!homeHatching;
    }
    document.getElementById("eggProgressText").textContent=`${egg?.fed||0} / 5 бриллиантовых драконов`;
    document.getElementById("eggProgress").style.width=((egg?.fed||0)*20)+"%";
    const feed=document.getElementById("btnFeedEgg");
    feed.textContent=egg?.fed===5?"ВЫЛУПИТЬ ДРАКОНА":"ВЛОЖИТЬ 1 💎";
    feed.disabled=!!homeHatching||!egg||(egg.fed<5&&p.counts.diamond<1);
  }else{
    if(homeSelected===null||!p.exclusives[homeSelected])homeSelected=owned[0]??null;
    document.getElementById("homeSceneTitle").textContent=homeSelected===null?"Здесь начнётся твоя легенда":exclusiveDragonSpec(homeSelected).name;
    document.getElementById("homeSceneHint").textContent=homeSelected===null?"Вылупи первое яйцо — и дракон появится в хранилище":`${exclusiveDragonSpec(homeSelected).effect} · в хранилище ×${p.exclusives[homeSelected]}`;
    document.getElementById("warehouseCount").textContent=`Уникальных: ${owned.length} · Всего: ${owned.reduce((n,id)=>n+p.exclusives[id],0)}`;
    const grid=document.getElementById("exclusiveGrid");grid.replaceChildren();
    if(!owned.length){const empty=document.createElement("p");empty.textContent="Неоткрытые драконы скрыты. Их внешность станет сюрпризом при вылуплении.";grid.appendChild(empty);}
    for(const id of owned){
      const b=document.createElement("button"),spec=exclusiveDragonSpec(id);b.className="exclusive-card"+(id===homeSelected?" selected":"");
      b.setAttribute("aria-label",spec.name+", количество "+p.exclusives[id]);b.setAttribute("aria-pressed",String(id===homeSelected));
      const c=document.createElement("canvas");c.width=180;c.height=122;b.appendChild(c);
      const title=document.createElement("span");title.textContent=spec.name;b.appendChild(title);
      const n=document.createElement("b");n.textContent="×"+p.exclusives[id];b.appendChild(n);
      b.onclick=()=>{homeSelected=id;homeView.yaw=-.65;homeView.pitch=.16;homeView.zoom=1;refreshDragonHome();};
      grid.appendChild(b);renderExclusiveDragon(c,id,{yaw:-.65,pitch:.14,zoom:.94},0);
    }
  }
  if(dragonStorageError)homeMessage(dragonStorageError);
}
function beginHomeHatch(){
  if(homeHatching||dragonProfile.egg?.fed!==5)return;
  homeReveal=null;homeHatching=performance.now();homeMessage("Скорлупа раскрывается…");refreshDragonHome();
  homeCanvas.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"center"});
}
function feedHomeEgg(){
  if(homeHatching)return;
  if(dragonProfile.egg?.fed===5){beginHomeHatch();return;}
  const result=feedDragonEgg();homeReveal=null;
  homeMessage(result.ok?"Бриллиантовый дракон вложен. Прогресс сохранён.":result.message);
  refreshDragonHome();if(result.ok&&dragonProfile.egg?.fed===5)beginHomeHatch();
}
function drawIncubator(time){
  const g=homeCanvas.getContext("2d"),w=homeCanvas.width,h=homeCanvas.height,egg=dragonProfile.egg;
  const shell=EGG_SHELLS[egg?.shell||0],fed=egg?.fed||0;
  const progress=homeHatching?Math.min(1,(performance.now()-homeHatching)/3200):0;
  g.clearRect(0,0,w,h);g.fillStyle="#080e1b";g.fillRect(0,0,w,h);
  const r=Math.min(w*.2,h*.25),x=w/2,y=h*.47+Math.sin(time*1.5)*5;
  const halo=g.createRadialGradient(x,y,0,x,y,r*2.8);halo.addColorStop(0,shell.col+"65");halo.addColorStop(1,"#080e1b00");
  g.fillStyle=halo;g.fillRect(0,0,w,h);
  g.strokeStyle=shell.col;g.lineWidth=2;
  for(let j=0;j<3;j++){
    g.globalAlpha=.4-j*.1;g.beginPath();g.ellipse(x,h*.8,r*(1.2+j*.33),r*(.25+j*.055),0,0,7);g.stroke();
  }
  g.globalAlpha=1;g.save();g.translate(x+Math.sin(time*34)*progress*7,y);g.rotate(Math.sin(time*2.3)*.025);
  const fill=g.createLinearGradient(-r,-r,r,r);fill.addColorStop(0,"#fcf3dd");fill.addColorStop(.25,shell.col);fill.addColorStop(.65,egg?.shell===1?"#403758":"#587882");fill.addColorStop(1,"#172534");
  function eggPath(){g.beginPath();g.moveTo(0,-r*1.42);g.bezierCurveTo(r*.55,-r*1.42,r*1.08,-r*.21,r,r*.34);g.bezierCurveTo(r*.87,r*1.15,-r*.87,r*1.15,-r,r*.34);g.bezierCurveTo(-r*1.08,-r*.21,-r*.55,-r*1.42,0,-r*1.42);g.closePath();}
  eggPath();g.fillStyle=fill;g.fill();g.strokeStyle=shell.col;g.lineWidth=2;g.stroke();
  g.save();eggPath();g.clip();
  g.strokeStyle="#ffffff1f";g.lineWidth=1;
  for(let row=-5;row<5;row++)for(let col=-4;col<=4;col++){
    const xx=col*r*.32+(row%2)*r*.16,yy=row*r*.24;
    g.beginPath();g.moveTo(xx,yy);g.lineTo(xx+r*.16,yy+r*.22);g.lineTo(xx+r*.32,yy);g.stroke();
  }
  g.shadowColor=shell.col;g.shadowBlur=12;g.strokeStyle="#ecffff";g.lineWidth=2+progress*4;
  for(let j=0;j<fed;j++){
    const start=-1.7+j*.83;g.beginPath();
    for(let k=0;k<7;k++){
      const a=start+k*.19,rr=r*(.12+k*.135),xx=Math.cos(a)*rr+(k%2)*r*.065,yy=Math.sin(a)*rr;
      k?g.lineTo(xx,yy):g.moveTo(xx,yy);
    }g.stroke();
  }
  g.restore();g.restore();
  // Luminous pieces peel from the shell in the final beat before the reveal.
  if(progress>.6){
    const burst=(progress-.6)/.4;
    for(let j=0;j<12;j++){
      const a=j*Math.PI/6,rr=r*(.8+burst*2.5),cx=x+Math.cos(a)*rr,cy=y+Math.sin(a)*rr*.8;
      g.save();g.translate(cx,cy);g.rotate(a+burst*2);g.globalAlpha=Math.min(1,burst*4)*(1-burst*.5);
      g.fillStyle=j%2?shell.col:"#e4fcff";g.beginPath();g.moveTo(-r*.11,-r*.12);g.lineTo(r*.15,-r*.05);g.lineTo(r*.08,r*.14);g.closePath();g.fill();g.restore();
    }
  }
  for(let j=0;j<32;j++){
    const a=j*2.4+time*.25,rr=r*(1.25+(j%5)*.19+progress*3),py=y+Math.sin(a)*rr*.85;
    g.fillStyle=shell.col;g.globalAlpha=.15+.5*Math.sin(j+time)**2;
    g.fillRect(x+Math.cos(a)*rr,py,2+(j%3),2+(j%3));
  }
  g.globalAlpha=1;
  if(progress>.78){g.fillStyle=`rgba(221,253,255,${Math.sin((progress-.78)/.22*Math.PI)*.65})`;g.fillRect(0,0,w,h);}
}
function animateDragonHome(now){
  homeRaf=0;if(!dragonHomeOpen())return;
  homeRaf=requestAnimationFrame(animateDragonHome);
  if(now-homeLastFrame<33||document.hidden)return;
  const dt=Math.min(.05,(now-homeLastFrame)/1000);homeLastFrame=now;
  const rect=homeCanvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,1.5);
  const w=Math.round(rect.width*ratio),h=Math.round(rect.height*ratio);
  if(w>0&&h>0&&(w!==homeCanvas.width||h!==homeCanvas.height)){homeCanvas.width=w;homeCanvas.height=h;}
  if(homeHatching&&now-homeHatching>=3200){
    const result=hatchDragonEgg();homeHatching=0;
    if(result.ok){homeReveal=result.id;homeSelected=result.id;homeView.yaw=-.65;homeView.zoom=1;
      homeMessage("Дракон вылупился! Он уже сохранён в хранилище.");}
    else homeMessage(result.message);
    refreshDragonHome();
  }
  const id=homeTab==="warehouse"?homeSelected:homeReveal;
  if(id!==null&&dragonProfile.exclusives[id]){
    if(homeView.auto&&!homeTouches.size)homeView.yaw+=dt*.16;
    renderExclusiveDragon(homeCanvas,id,homeView,now/1000);
  }else drawIncubator(now/1000);
}
document.getElementById("btnCloseHome").onclick=closeDragonHome;
document.getElementById("tabIncubator").onclick=()=>setDragonHomeTab("incubator");
document.getElementById("tabWarehouse").onclick=()=>setDragonHomeTab("warehouse");
document.getElementById("btnFeedEgg").onclick=feedHomeEgg;
for(const b of document.querySelectorAll("[data-egg]"))b.onclick=()=>{
  const result=selectDragonEgg(Number(b.dataset.egg));homeReveal=null;
  homeMessage(result.ok?"Яйцо выбрано. Все три оболочки имеют одинаковый шанс находок.":result.message);refreshDragonHome();
};
for(const b of document.querySelectorAll("[data-open-home]"))b.onclick=openDragonHome;
document.getElementById("btnHomeBook").onclick=()=>{closeDragonHome();openDragonBook();};
document.getElementById("btnTurntable").onclick=()=>{homeView.auto=!homeView.auto;document.getElementById("btnTurntable").textContent=homeView.auto?"Вращение: вкл":"Вращение: выкл";};
document.getElementById("btnZoomIn").onclick=()=>homeView.zoom=Math.min(1.65,homeView.zoom+.15);
document.getElementById("btnZoomOut").onclick=()=>homeView.zoom=Math.max(.65,homeView.zoom-.15);
document.getElementById("btnResetView").onclick=()=>Object.assign(homeView,{yaw:-.65,pitch:.16,zoom:1});
homeCanvas.addEventListener("pointerdown",e=>{homeTouches.set(e.pointerId,[e.clientX,e.clientY]);homeCanvas.setPointerCapture(e.pointerId);});
homeCanvas.addEventListener("pointermove",e=>{
  const prev=homeTouches.get(e.pointerId);if(!prev)return;
  if(homeTouches.size===2){const other=[...homeTouches.entries()].find(([id])=>id!==e.pointerId)[1];
    const before=Math.hypot(prev[0]-other[0],prev[1]-other[1]),after=Math.hypot(e.clientX-other[0],e.clientY-other[1]);
    if(before>3)homeView.zoom=Math.max(.65,Math.min(1.65,homeView.zoom*after/before));
  }else{homeView.yaw+=(e.clientX-prev[0])*.009;homeView.pitch=Math.max(-.65,Math.min(.85,homeView.pitch+(e.clientY-prev[1])*.007));}
  homeTouches.set(e.pointerId,[e.clientX,e.clientY]);
});
for(const type of ["pointerup","pointercancel","lostpointercapture"])homeCanvas.addEventListener(type,e=>homeTouches.delete(e.pointerId));
homeCanvas.addEventListener("wheel",e=>{e.preventDefault();homeView.zoom=Math.max(.65,Math.min(1.65,homeView.zoom-e.deltaY*.001));},{passive:false});
dragonHome.addEventListener("keydown",e=>{
  if(e.key!=="Tab")return;
  const focusable=[...dragonHome.querySelectorAll("button:not(:disabled)")].filter(el=>el.getClientRects().length);
  const first=focusable[0],last=focusable[focusable.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
});
