"use strict";
const dragonHome=document.getElementById("dragonHome"),homeCanvas=document.getElementById("homeCanvas");
const HOME_HATCH_MS=4600,HOME_PAGE_SIZE=8,homeReduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
let homeTab="incubator",homeSelected=null,homeReveal=null,homeHatching=0,homeRaf=0,homeLastFrame=0,homeFocus=null;
let homeAdmin=false,homePage=0,homeGridKey="",homeThumbJobs=[],homeNeedsPaint=true,homeCanvasVisible=true;
let homeDrawerOpen=false,homeShelfVisible=true,homeAnimTime=0;
let homeThumbSlots=[];
const HOME_IDLE_FRAMES=1,HOME_IDLE_CACHE_LIMIT=12;
const homeThumbCache=new Map(),homeTouches=new Map(),homeView={yaw:.85,pitch:.35,distance:1};
function dragonHomeOpen(){return !dragonHome.classList.contains("hidden");}
function homeMessage(s){document.getElementById("homeMessage").textContent=s||"";}
function setHomeDrawer(){homeDrawerOpen=false;}
function homeIsTap(tap,count,now){return !!tap&&!tap.moved&&count===1&&now-tap.start<600;}
let homeInspectCare=null;
const HOME_OBJECT_HINTS={nest:['Лежанка — отдохнуть','N'],toy:['Мяч — поиграть носом','B'],tree:['Растения — понюхать листочек','L'],water:['Вода — поплескаться','W']};
const HOME_TOUCH_HINTS={head:'Голова — погладить',belly:'Живот — пощекотать',tail:'Хвост — посмотреть реакцию'};
const HOME_CAMERA_HINT='Коснись питомца или предмета · потяни — повернуть · два пальца — приблизить';
const homeHintSeen=new Set();
let homeHintObjects=[],homeHintIntro=false,homeHintTarget=null,homeHintUntil=0,homeHintLastPick=-Infinity;
function beginHomeHints(id){
 homeHintObjects=typeof buildCollectionHabitat==='function'?buildCollectionHabitat(prepareRestingDragon(homeDragonDisplayMesh(id)),dragonPersonality(id)).objects.filter(key=>HOME_OBJECT_HINTS[key]):['nest','toy'];
 const key=[...homeHintObjects].sort().join(',');homeHintIntro=!homeHintSeen.has(key);homeHintSeen.add(key);
 homeHintTarget=null;homeHintLastPick=-Infinity;
 homeCanvas.setAttribute('aria-describedby','homeSceneHint');
 homeCanvas.setAttribute('aria-keyshortcuts',[...homeHintObjects.map(key=>HOME_OBJECT_HINTS[key][1]),'Enter'].join(' '));
}
function refreshHomeHint(){
 if(!dragonHomeOpen()||homeTab!=='warehouse'||caveHeld===null)return;
 const object=homeHintTarget?.startsWith('object:')?homeHintTarget.slice(7):null;
 const targetText=object&&homeHintObjects.includes(object)?HOME_OBJECT_HINTS[object].join(' · '):HOME_TOUCH_HINTS[homeHintTarget];
 const intro=homeHintObjects.map(key=>HOME_OBJECT_HINTS[key][0]).join(' · ');
 const text=targetText||(homeHintIntro?'Попробуй коснуться: '+intro:HOME_CAMERA_HINT),el=document.getElementById('homeSceneHint');
 if(el.textContent!==text)el.textContent=text;
 homeCanvas.title=targetText||homeHintObjects.map(key=>HOME_OBJECT_HINTS[key].join(' · ')).join('. ');
 homeCanvas.style.cursor=targetText?'pointer':'grab';
}
function clearHomeHover(dismiss=false){homeHintTarget=null;if(dismiss)homeHintIntro=false;refreshHomeHint();}
function hoverHomeInspection(e){
 if(e.pointerType!=='mouse'||!dragonHomeOpen()||homeTab!=='warehouse'||caveHeld===null||homeTouches.size||(typeof Playables!=='undefined'&&Playables.blocked)||typeof collectionInspectionTarget!=='function')return;
 const now=performance.now();if(now-homeHintLastPick<100)return;homeHintLastPick=now;
 const r=homeCanvas.getBoundingClientRect();if(!r.width||!r.height)return;
 homeHintTarget=collectionInspectionTarget(homeCanvas,(e.clientX-r.left)*homeCanvas.width/r.width,(e.clientY-r.top)*homeCanvas.height/r.height);
 homeHintUntil=homeAnimTime+1.2;refreshHomeHint();
}
const homeGaze={x:0,y:0,eyeStrength:0,headStrength:0,until:0,last:0};
function resetHomeGaze(){Object.assign(homeGaze,{x:0,y:0,eyeStrength:0,headStrength:0,until:0,last:homeAnimTime});}
function aimHomeGaze(e){
 if(homeReduced||!dragonHomeOpen()||homeTab!=="warehouse"||caveHeld===null||(typeof Playables!=="undefined"&&Playables.blocked))return;
 const r=homeCanvas.getBoundingClientRect();
 homeGaze.x=Math.max(-1,Math.min(1,(e.clientX-r.left)/Math.max(1,r.width)*2-1));homeGaze.y=Math.max(-1,Math.min(1,(e.clientY-r.top)/Math.max(1,r.height)*2-1));
 homeGaze.until=homeAnimTime+2.5;homeNeedsPaint=true;wakeDragonHome();
}
function homeAttentionView(view){
 if(homeReduced||homeTab!=="warehouse"||caveHeld===null)return view;
 const dt=Math.max(0,Math.min(.1,homeAnimTime-homeGaze.last));homeGaze.last=homeAnimTime;
 const goal=homeAnimTime<homeGaze.until?1:0;
 homeGaze.eyeStrength+=(goal-homeGaze.eyeStrength)*(1-Math.exp(-dt*12));homeGaze.headStrength+=(goal-homeGaze.headStrength)*(1-Math.exp(-dt*3));
 return {...view,gaze:{...homeGaze}};
}
function inspectHomeDragon(id){
 if(!dragonHomeOpen()||homeTab!=="warehouse"||!homeCanView(id)||(typeof Playables!=="undefined"&&Playables.blocked))return;
 cancelCellGestures();stopDragonCare();homeTouches.clear();caveHeld=id;homeSelected=id;Object.assign(homeView,cellView(id));
 resetHomeGaze();homeGaze.until=homeAnimTime+2;
 beginHomeLife(id);
 beginHomeHints(id);
 homeInspectCare=createCareControls(id);document.getElementById("homeInspectCare").replaceChildren(homeInspectCare.box);
 homeCanvasVisible=true;refreshDragonHome();homeCanvas.focus({preventScroll:true});homeCanvas.scrollIntoView({block:"nearest"});
}
function returnHomeCollection(){
 clearHomeHover(true);homeCanvas.style.cursor='';homeCanvas.title='';homeCanvas.setAttribute('aria-keyshortcuts','');
 const id=caveHeld;stopDragonCare();homeTouches.clear();caveHeld=null;homeInspectCare=null;
 resetHomeGaze();
 endHomeLife();
 document.getElementById("homeInspectCare").replaceChildren();homeShelfVisible=true;refreshDragonHome();
 homeThumbSlots.find(s=>s.id===id)?.c.focus({preventScroll:true});
}
function handleHomeCanvasTap(x,y){
 if(caveHeld===null)return;
 let acted=false;
 if(typeof collectionDragonTouchZone==='function'){const zone=collectionDragonTouchZone(homeCanvas,x,y);if(zone)acted=touchHomeDragon(zone);else if(typeof collectionIslandObjectAt==='function'){const object=collectionIslandObjectAt(homeCanvas,x,y);if(object)acted=beginHomeObjectAction(object);}}
 else if(collectionHitDragon(homeCanvas,x,y))acted=touchHomeDragon();
 if(acted)clearHomeHover(true);return acted;
}
function homeOwnedIds(){return Object.keys(dragonProfile.exclusives).map(Number).filter(id=>dragonProfile.exclusives[id]>0);}
function homeCatalogIds(){
  if(!homeAdmin)return homeOwnedIds();
  const f=document.getElementById("adminFamily").value;
  return f==="rescue"?DRAGON_IDS.slice():f!=="all"?Array.from({length:Math.min(3,100-Number(f)*3)},(_,i)=>Number(f)*3+i):[...DRAGON_IDS,...Array.from({length:100},(_,i)=>i)];
}
// Build the admin filter from anatomy definitions so all 34 plans are reachable.
for(let i=0;i<DRAGON_BREEDS.length;i++){
 const option=document.createElement("option");option.value=String(i);
 option.textContent=DRAGON_BREEDS[i].name+" · "+Math.min(3,100-i*3)+" вар.";
 document.getElementById("adminFamily").appendChild(option);
}
function homeEntry(id){return typeof id==="number"?exclusiveDragonSpec(id):DRAGON_TYPES.find(d=>d.id===id);}
function homeCount(id){return typeof id==="number"?(dragonProfile.exclusives[id]||0):dragonProfile.counts[id];}
function homeCanView(id){return id!==null&&(homeAdmin||typeof id==="number"&&dragonProfile.exclusives[id]>0);}
function openDragonHome(destination="incubator"){
  if(dragonFinale&&!dragonFinale.finished)return;
  homeFocus=document.activeElement;pointer.active=false;if(running)paused=true;
  homeAdmin=false;homePage=0;homeTab=["incubator","warehouse"].includes(destination)?destination:"incubator";homeGridKey="";homeHatching=0;homeReveal=null;
  resetCaveVisit();Object.assign(homeView,{yaw:.85,pitch:.35,distance:1});
  setHomeDrawer(false);
  document.getElementById("homeAdminTools").open=false;dragonHome.classList.remove("hidden");
  if(homeTab==="warehouse")ensureDragonPersonalities();
  homeMessage("");refreshDragonHome();document.getElementById("btnCloseHome").focus();resizeHomeCanvas();wakeDragonHome();
}
function closeDragonHome(){
  homeHintTarget=null;homeHintIntro=false;homeCanvas.style.cursor='';homeCanvas.title='';homeCanvas.setAttribute('aria-keyshortcuts','');
  endHomeLife();resetHomeGaze();
  cancelCellGestures();
  disconnectCellQuality();
  stopDragonCare();
  dragonHome.classList.add("hidden");homeTouches.clear();homeHatching=0;homeAdmin=false;homeThumbJobs=[];homeThumbSlots=[];
  (typeof Playables==="undefined"?cancelAnimationFrame:Playables.cancelFrame)(homeRaf);homeRaf=0;pointer.active=false;
  if(running&&!userPaused&&!levelOpen()&&!dragonBookOpen())paused=false;
  if(homeFocus?.isConnected)homeFocus.focus();
}
function setDragonHomeTab(tab){if(!["incubator","warehouse"].includes(tab))return;homeTab=tab;homeReveal=null;homeHatching=0;homeAdmin=false;homePage=0;homeGridKey="";setHomeDrawer(false);resetCaveVisit();Object.assign(homeView,{yaw:.85,pitch:.35,distance:1});homeMessage("");refreshDragonHome();}
function refreshDragonHome(){
  if(!dragonHomeOpen())return;
  homeNeedsPaint=true;
  document.getElementById("homeTitle").textContent=typeof uiLabel==="function"?uiLabel(homeTab==="incubator"?"hatch":"pets"):homeTab==="incubator"?"Вылупить питомца":"Мои питомцы";
  document.getElementById("btnCloseHome").textContent=typeof uiLabel==="function"?uiLabel("close"):"Закрыть ✕";
  const p=dragonProfile,fed=p.egg?.fed||0,owned=homeOwnedIds(),total=[...Object.values(p.counts),...Object.values(p.exclusives)].reduce((a,b)=>a+b,0);
  const collectionTotal=owned.reduce((n,id)=>n+p.exclusives[id],0);
  document.getElementById("homeWallet").textContent=`${homeTab==="warehouse"?collectionTotal:total} драконов · ${owned.length} / 100 видов`;
  document.getElementById("homeDiamondCount").textContent=String(p.counts.diamond);
  document.getElementById("homeAvailable").setAttribute("aria-label",`Бриллиантовые драконы в наличии: ${p.counts.diamond}`);
  document.getElementById("incubatorPanel").classList.toggle("hidden",homeTab!=="incubator");
  dragonHome.classList.toggle("view-warehouse",homeTab==="warehouse");
  dragonHome.classList.toggle("inspecting",caveHeld!==null);
  document.getElementById("btnBackToCollection").classList.toggle("hidden",caveHeld===null);
  document.getElementById("homeInspectCare").classList.toggle("hidden",caveHeld===null);
  document.getElementById("warehousePanel").classList.toggle("hidden",homeTab!=="warehouse"||caveHeld!==null);
  setHomeDrawer(homeDrawerOpen);
  document.getElementById("homeAdminTools").classList.toggle("hidden",!DRAGON_ADMIN_ENABLED);
  document.getElementById("adminFilterRow").classList.toggle("hidden",!homeAdmin);
  if(homeTab==="incubator"){
    document.getElementById("homeSceneTitle").textContent=homeReveal!==null?homeEntry(homeReveal).name:"Гнездо дракона";
    document.getElementById("homeSceneHint").textContent=homeReveal!==null?"В коллекции":fed===5?"Кто-то стучится изнутри!":"";
    document.getElementById("eggProgressText").textContent=`${fed} / 5`;
    document.getElementById("eggProgressBar").setAttribute("aria-valuenow",String(fed));
    document.getElementById("eggProgress").style.width=(fed*20)+"%";
    const b=document.getElementById("btnFeedEgg");b.textContent=fed===5?"Вылупить":"Вложить · 1";b.disabled=!!homeHatching||(fed<5&&p.counts.diamond<1);
    b.setAttribute("aria-label",fed===5?"Вылупить питомца из готового яйца":"Вложить в яйцо одного бриллиантового дракона — он будет потрачен");
    b.title=fed===5?"Яйцо готово, дополнительных драконов не требуется":"Один бриллиантовый дракон будет потрачен на яйцо";
  }else if(homeTab==="warehouse"){
    const ids=homeCatalogIds();if(!ids.includes(homeSelected))homeSelected=ids[0]??null;
    document.getElementById("homeSceneTitle").textContent=caveHeld!==null?homeEntry(caveHeld).name:"Гнёзда драконов";
    if(caveHeld!==null)refreshHomeHint();else document.getElementById("homeSceneHint").textContent='';
    document.getElementById("warehouseCount").textContent=homeAdmin?"107 моделей · тест":`${owned.length} видов · ${owned.reduce((n,id)=>n+p.exclusives[id],0)} драконов`;
    renderHomeShelf(ids);
  }
  if(dragonStorageError)homeMessage(dragonStorageError);
  // Update a changed selection immediately, even if the animation loop is suspended.
  resizeHomeCanvas();paintDragonHome(performance.now());wakeDragonHome();
}
function renderHomeShelf(ids){
  const pages=Math.max(1,Math.ceil(ids.length/HOME_PAGE_SIZE));homePage=Math.min(homePage,pages-1);
  document.getElementById("homePageLabel").textContent=`${homePage+1} / ${pages}`;
  document.getElementById("homePager").classList.toggle("hidden",pages===1);
  document.getElementById("homePrev").disabled=homePage===0;document.getElementById("homeNext").disabled=homePage===pages-1;
  const visible=ids.slice(homePage*HOME_PAGE_SIZE,(homePage+1)*HOME_PAGE_SIZE),key=JSON.stringify([homeAdmin,homePage,ids,visible.map(homeCount)]),grid=document.getElementById("exclusiveGrid");
  if(key!==homeGridKey){
    disconnectCellQuality();
    homeGridKey=key;grid.replaceChildren();homeThumbJobs=[];homeThumbSlots=[];
    if(!ids.length){const p=document.createElement("p");p.textContent="Неоткрытых драконов здесь не видно. Коллекция появится после первого вылупления.";grid.appendChild(p);}
    for(const id of visible){
      const cell=document.createElement("article");cell.className="exclusive-cell";
      const b=document.createElement("div");b.className="exclusive-card";b.dataset.dragon=String(id);b.setAttribute("aria-label",homeEntry(id).name+", в коллекции: "+homeCount(id));
      const c=document.createElement("canvas");c.width=328;c.height=224;b.appendChild(c);
      const s=document.createElement("span");s.textContent=homeEntry(id).name;b.appendChild(s);
      const n=document.createElement("b");n.textContent=homeAdmin&&!homeCount(id)?"ПРОСМОТР":"×"+homeCount(id);b.appendChild(n);
      cell.appendChild(b);
      const care=createCareControls(id);cell.appendChild(care.box);grid.appendChild(cell);
      let cached=homeThumbCache.get(id);
      if(!cached){cached=[];homeThumbCache.set(id,cached);}
      const slot={id,c,frames:cached,care,view:cellView(id),dirty:false,gesture:null,visible:true,hasImage:cached.length>0};homeThumbSlots.push(slot);attachCellCamera(slot);
      if(cached[0])c.getContext("2d").drawImage(cached[0],0,0,c.width,c.height);
      if(cached.length<(homeReduced?1:HOME_IDLE_FRAMES))homeThumbJobs.push({id,c,frames:cached,view:{...slot.view}});
      // Keep the current page most recent so all its animated frames remain cached.
      homeThumbCache.delete(id);homeThumbCache.set(id,cached);
      observeCellQuality(slot);
    }
    while(homeThumbCache.size>HOME_IDLE_CACHE_LIMIT)homeThumbCache.delete(homeThumbCache.keys().next().value);
  }
}
function drawHomeModel(canvas,id,time,view=homeView,care=null){
  const life=canvas===homeCanvas&&homeTab==='warehouse'&&caveHeld===id?homeLifeFor(id):null;
  drawCollectionDragon(canvas,id,canvas===homeCanvas?homeAttentionView(view):view,time,care||life);
}
function beginHomeHatch(){
  if(homeHatching||dragonProfile.egg?.fed!==5)return;
  homeReveal=null;homeHatching=performance.now();homeMessage("Тук-тук… Кто там?");refreshDragonHome();
  homeCanvas.scrollIntoView({behavior:homeReduced?"instant":"smooth",block:"center"});
}
function feedHomeEgg(){
  if(homeHatching)return;audio();
  if(dragonProfile.egg?.fed===5){beginHomeHatch();return;}
  const r=feedDragonEgg();homeReveal=null;homeMessage(r.ok?"Один бриллиантовый дракон вложен. Прогресс сохранён.":r.message);
  refreshDragonHome();if(r.ok&&dragonProfile.egg?.fed===5)beginHomeHatch();
}
function drawIncubator(time){
  const g=homeCanvas.getContext("2d"),w=homeCanvas.width,h=homeCanvas.height,egg=dragonProfile.egg;
  const fed=egg?.fed||0,progress=homeHatching?Math.min(1,(performance.now()-homeHatching)/HOME_HATCH_MS):0;
  const born=progress>.53&&Number.isInteger(egg?.reward),reveal=Math.max(0,(progress-.53)/.47);
  if(born)drawHomeModel(homeCanvas,egg.reward,time,{yaw:.85,pitch:.35,distance:1.7-.7*Math.min(1,reveal*2)});
  else drawCollectionNest(g,w,h);
  const r=Math.min(w*.13,h*.20),x=w/2,y=h*.61,rock=homeReduced?0:Math.sin(time*(progress?29:2))*((progress>0&&progress<.5)?progress*.3:.012);
  function shape(){g.beginPath();g.moveTo(0,-r*1.42);g.bezierCurveTo(r*.55,-r*1.42,r*1.08,-r*.21,r,r*.34);g.bezierCurveTo(r*.87,r*1.15,-r*.87,r*1.15,-r,r*.34);g.bezierCurveTo(-r*1.08,-r*.21,-r*.55,-r*1.42,0,-r*1.42);g.closePath();}
  function shell(half){
    g.save();g.translate(x,y);g.rotate(rock);
    if(born){const s=half===0?-1:1;g.translate(s*r*reveal*1.9,-Math.sin(reveal*Math.PI)*r*1.1+reveal*r*.4);g.rotate(s*reveal*1.3);g.globalAlpha=Math.max(0,1-reveal*1.5);}
    if(half!==null){g.beginPath();g.rect(-r*2,half===0?-r*2:0,r*4,r*2);g.clip();}
    shape();g.fillStyle="#f7eac8";g.strokeStyle="#2b2620";g.lineWidth=Math.max(2,w/240);g.fill();g.stroke();g.save();shape();g.clip();
    g.fillStyle="#dcc28e";g.beginPath();g.ellipse(r*.8,0,r*.35,r*1.4,0,0,7);g.fill();
    for(let i=0;i<7;i++){g.fillStyle=i%2?"#b4c397":"#d49a52";g.beginPath();g.ellipse(Math.sin(i*4)*r*.65,(i/7*1.6-1)*r,r*.12,r*.085,i,0,7);g.fill();}
    g.strokeStyle="#2b2620";g.lineWidth=Math.max(1.5,w/330);
    for(let j=0;j<fed;j++){g.beginPath();for(let k=0;k<6;k++){const a=-2+j*.85+k*.13,rr=r*(.2+k*.16),xx=Math.cos(a)*rr+(k%2)*r*.08,yy=Math.sin(a)*rr;k?g.lineTo(xx,yy):g.moveTo(xx,yy);}g.stroke();}
    if(progress>.28){g.strokeStyle="#ad662a";g.lineWidth=3;g.beginPath();for(let i=0;i<9;i++){const xx=-r+i*r*.25,yy=(i%2?.12:-.04)*r;i?g.lineTo(xx,yy):g.moveTo(xx,yy);}g.stroke();}
    if(progress>.38&&!born){g.fillStyle="#2b2620";g.beginPath();g.ellipse(r*.12,-r*.08,r*.24,r*.1,0,0,7);g.fill();g.fillStyle="#fff9df";for(const dx of [0,.23]){g.beginPath();g.arc(r*dx,-r*.08,r*.045,0,7);g.fill();}}
    g.restore();g.restore();
  }
  if(born){shell(0);shell(1);}else shell(null);
  if(progress>0){
    g.save();g.textAlign="center";g.font=`900 ${Math.max(14,w*.033)}px system-ui`;g.lineWidth=2;g.strokeStyle="#2b2620";g.fillStyle="#fff6df";
    g.beginPath();g.ellipse(w*.74,h*.44,w*.105,h*.047,-.1,0,7);g.fill();g.stroke();
    g.beginPath();g.moveTo(w*.67,h*.466);g.lineTo(w*.63,h*.51);g.lineTo(w*.70,h*.483);g.fill();g.stroke();g.fillStyle="#2b2620";
    const word=progress<.27?"ТУК…":progress<.53?"КРАК!":"ПРИВЕТ!";
    g.fillText(word,w*.74,h*.455);g.restore();
    if(born&&!homeReduced)for(let j=0;j<12;j++){const a=j*2.4,rr=r*(1+reveal*2.8);
      g.save();g.translate(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.65+reveal*reveal*r);g.rotate(a+reveal*4);g.globalAlpha=1-reveal;
      g.fillStyle=j%2?"#c47a37":"#99b978";g.strokeStyle="#2b2620";g.lineWidth=1;g.fillRect(-3,-4,6,8);g.strokeRect(-3,-4,6,8);g.restore();}
  }
}
function resizeHomeCanvas(){
  if(!dragonHomeOpen()||(homeTab==="warehouse"&&caveHeld===null)||(typeof Playables!=="undefined"&&Playables.blocked))return;
  const rect=homeCanvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,1.25),w=Math.round(Math.min(880,rect.width*ratio)),h=Math.round(rect.height*(w/Math.max(1,rect.width)));
  if(w>0&&h>0&&(homeCanvas.width!==w||homeCanvas.height!==h)){homeCanvas.width=w;homeCanvas.height=h;homeNeedsPaint=true;}
}
new ResizeObserver(resizeHomeCanvas).observe(homeCanvas);
new IntersectionObserver(e=>{homeCanvasVisible=e[0].isIntersecting;if(homeCanvasVisible){homeNeedsPaint=true;wakeDragonHome();}},{root:dragonHome}).observe(homeCanvas);
new IntersectionObserver(e=>{homeShelfVisible=e[0].isIntersecting;if(homeShelfVisible)wakeDragonHome();},{root:dragonHome}).observe(document.getElementById("warehousePanel"));
function homePageHidden(){return typeof Playables!=="undefined"&&Playables.cloud?false:document.hidden;}
function wakeDragonHome(){if(dragonHomeOpen()&&!homePageHidden()&&!homeRaf)homeRaf=(typeof Playables==="undefined"?requestAnimationFrame:Playables.requestFrame)(animateDragonHome);}
function paintDragonHome(now){
  if(!dragonHomeOpen()||(typeof Playables!=="undefined"&&Playables.blocked))return;
  const id=homeTab==="warehouse"?caveHeld:homeReveal;
  if(homeTab==="warehouse"&&id===null)return;
  if(homeCanView(id)){const care=homeCareFor(id);drawHomeModel(homeCanvas,id,homeReduced?0:homeAnimTime,homeView,care&&homeReduced?{...care,t:.8}:care);}
  else drawIncubator(homeReduced&&!homeHatching?0:now/1000);
  homeNeedsPaint=false;
}
function animateDragonHome(now){
  homeRaf=0;if(!dragonHomeOpen()||homePageHidden())return;
  if(homeTab==="warehouse"&&caveHeld===null&&!homeShelfVisible){updateDragonCare();return;}
  const restingShelf=homeTab==="warehouse"&&caveHeld===null&&!homeCareActive&&!homeThumbSlots.some(s=>s.gesture?.moved);
  if(now-homeLastFrame<1000/(restingShelf?20:30)){wakeDragonHome();return;}
  const dt=Math.min(.06,(now-homeLastFrame)/1000);homeLastFrame=now;
  homeAnimTime+=dt;
  if(homeHintTarget&&homeAnimTime>=homeHintUntil)clearHomeHover();
  updateDragonCare();
  const shelf=homeTab==="warehouse"&&caveHeld===null&&homeShelfVisible;
  const interacting=homeCareActive||homeThumbSlots.some(s=>s.gesture?.moved);
  if(shelf&&homeThumbJobs.length&&!homeHatching&&!interacting){
    const job=homeThumbJobs.shift();
    if(job.c.isConnected){
      if(!job.work){
        const frame=document.createElement("canvas");frame.width=job.width||220;frame.height=job.height||150;
        job.work=beginCellRestFrame(frame,job.id,job.view);homeThumbJobs.unshift(job);
      }else if(stepCellRestFrame(job.work,256)){
        job.frames.width=job.work.frame.width;job.frames.layers=job.work.layers;job.frames.push(job.work.frame);
      }else homeThumbJobs.unshift(job);
    }
  }
  if(shelf)for(const slot of homeThumbSlots){
    if(!slot.c.isConnected||!slot.visible)continue;
    const care=homeCareFor(slot.id);
    if(care||slot.gesture?.moved){drawHomeModel(slot.c,slot.id,homeReduced?0:homeAnimTime,slot.view,care&&homeReduced?{...care,t:.8}:care);slot.hasImage=true;continue;}
    if(!slot.frames.length)continue;slot.dirty=false;
    paintCellRest(slot,homeAnimTime,homeReduced);
  }
  if(homeHatching&&now-homeHatching>=HOME_HATCH_MS){
    const r=hatchDragonEgg();homeHatching=0;
    if(r.ok){homeReveal=r.id;homeSelected=r.id;Object.assign(homeView,{yaw:.85,pitch:.35,distance:1});homeMessage("Новый дракон появился в коллекции!");chain([392,523,659,784],"sine",.06);}
    else homeMessage(r.message);refreshDragonHome();
  }
  if(homeCanvasVisible||homeHatching)paintDragonHome(now);
  // Only visible cells animate, using bounded cached frames rather than live meshes.
  if(homeCareActive||(shelf&&(homeThumbJobs.length||!homeReduced&&homeThumbSlots.some(s=>s.visible)))||homeHatching||(!homeReduced&&homeCanvasVisible&&(homeTab!=="warehouse"||caveHeld!==null)))wakeDragonHome();
}
if(typeof Playables==="undefined"||!Playables.cloud)document.addEventListener("visibilitychange",()=>{if(document.hidden){(typeof Playables==="undefined"?cancelAnimationFrame:Playables.cancelFrame)(homeRaf);homeRaf=0;}else wakeDragonHome();});
document.getElementById("btnCloseHome").onclick=closeDragonHome;
document.getElementById("btnBackToCollection").onclick=returnHomeCollection;
document.getElementById("btnFeedEgg").onclick=feedHomeEgg;
for(const b of document.querySelectorAll("[data-open-home]")){
  b.onclick=()=>openDragonHome(b.dataset.openHome);
  b.addEventListener("pointerdown",e=>e.stopPropagation());
  b.addEventListener("pointerenter",()=>{pointer.active=false;});
}
document.getElementById("btnHomeBook").onclick=()=>{closeDragonHome();openDragonBook();};
document.getElementById("btnAdminDiamonds").onclick=()=>{const r=adminAddDiamondDragons();homeMessage(r.ok?"АДМИН: добавлено 5 бриллиантовых драконов. История спасений не изменена.":r.message);refreshDragonHome();};
document.getElementById("btnAdminCatalog").onclick=()=>{
  if(!DRAGON_ADMIN_ENABLED)return;
  homeAdmin=true;homeTab="warehouse";homePage=0;homeGridKey="";homeReveal=null;homeHatching=0;homeSelected=null;
  resetCaveVisit();Object.assign(homeView,{yaw:.85,pitch:.35,distance:1});
  setHomeDrawer(false);document.getElementById("adminFamily").value="all";homeMessage("");refreshDragonHome();homeCanvas.scrollIntoView({behavior:homeReduced?"instant":"smooth",block:"start"});
};
document.getElementById("adminFamily").onchange=()=>{homePage=0;homeSelected=null;resetCaveVisit();refreshDragonHome();};
document.getElementById("homePrev").onclick=()=>{homePage=Math.max(0,homePage-1);resetCaveVisit();refreshDragonHome();};
document.getElementById("homeNext").onclick=()=>{homePage++;resetCaveVisit();refreshDragonHome();};
let homeTap=null;
homeCanvas.addEventListener("pointerdown",e=>{if(e.button!==0||!dragonHomeOpen())return;clearHomeHover();homeTouches.set(e.pointerId,[e.clientX,e.clientY]);homeTap=homeTouches.size===1?{x:e.clientX,y:e.clientY,moved:false,start:performance.now()}:null;if(homeTouches.size===1)aimHomeGaze(e);else resetHomeGaze();homeCanvas.setPointerCapture(e.pointerId);});
homeCanvas.addEventListener("pointermove",e=>{
  const prev=homeTouches.get(e.pointerId);if(!prev){if(e.pointerType==='mouse'){aimHomeGaze(e);hoverHomeInspection(e);}return;}homeNeedsPaint=true;
  if(homeTap&&Math.hypot(e.clientX-homeTap.x,e.clientY-homeTap.y)>7)homeTap.moved=true;
  if(homeTap?.moved||homeTouches.size>1){resetHomeGaze();clearHomeHover(true);}
  if(homeTouches.size===2){const other=[...homeTouches.entries()].find(([id])=>id!==e.pointerId)[1];
    const before=Math.hypot(prev[0]-other[0],prev[1]-other[1]),after=Math.hypot(e.clientX-other[0],e.clientY-other[1]);
    if(before>3)homeView.distance=Math.max(.62,Math.min(2.5,homeView.distance*before/Math.max(3,after)));
  }else{homeView.yaw-=(e.clientX-prev[0])*.009;homeView.pitch=Math.max(.12,Math.min(1.12,homeView.pitch+(e.clientY-prev[1])*.007));}
  homeTouches.set(e.pointerId,[e.clientX,e.clientY]);paintDragonHome(performance.now());wakeDragonHome();
});
homeCanvas.addEventListener("pointerup",e=>{
  if(homeIsTap(homeTap,homeTouches.size,performance.now())){
    const r=homeCanvas.getBoundingClientRect(),x=(e.clientX-r.left)*homeCanvas.width/r.width,y=(e.clientY-r.top)*homeCanvas.height/r.height;
    handleHomeCanvasTap(x,y);
  }
  homeTap=null;
});
for(const type of ["pointerup","pointercancel","lostpointercapture"])homeCanvas.addEventListener(type,e=>{homeTouches.delete(e.pointerId);if(type!=="pointerup")homeTap=null;});
homeCanvas.addEventListener('pointerleave',()=>{homeGaze.until=0;clearHomeHover();});
homeCanvas.addEventListener("wheel",e=>{e.preventDefault();clearHomeHover(true);homeNeedsPaint=true;homeView.distance=Math.max(.62,Math.min(2.5,homeView.distance*Math.exp(e.deltaY*.001)));paintDragonHome(performance.now());},{passive:false});
dragonHome.addEventListener("keydown",e=>{
  if(e.key==="Escape"){
    e.preventDefault();e.stopPropagation();if(caveHeld!==null)returnHomeCollection();else closeDragonHome();
    return;
  }
  if(e.target===homeCanvas){
    const object={n:'nest',b:'toy',w:'water',l:'tree'}[e.key.toLowerCase()];
    if(object){e.preventDefault();if(beginHomeObjectAction(object))clearHomeHover(true);return;}
    if(e.key==="Enter"||e.key===" "){e.preventDefault();if(touchHomeDragon())clearHomeHover(true);return;}
    const changes={ArrowLeft:[-.12,0,0],ArrowRight:[.12,0,0],ArrowUp:[0,-.06,0],ArrowDown:[0,.06,0],"+":[0,0,-.12],"=":[0,0,-.12],"-":[0,0,.12]};
    if(changes[e.key]){e.preventDefault();clearHomeHover(true);const [yaw,pitch,distance]=changes[e.key];homeView.yaw+=yaw;homeView.pitch=Math.max(.12,Math.min(1.12,homeView.pitch+pitch));homeView.distance=Math.max(.62,Math.min(2.5,homeView.distance+distance));paintDragonHome(performance.now());return;}
  }
  if(e.key!=="Tab")return;
  const focusable=[...dragonHome.querySelectorAll("button:not(:disabled),summary,select:not(:disabled),canvas[tabindex]")].filter(el=>el.getClientRects().length);
  const first=focusable[0],last=focusable[focusable.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
});
