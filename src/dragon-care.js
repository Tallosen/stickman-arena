"use strict";
// Optional affection only: no hunger, decay, currencies or combat advantage.
const DRAGON_CARE_ACTIONS={feed:{label:"Покормить",duration:5.6},pet:{label:"Погладить",duration:3.2},music:{label:"Музыка",duration:8}};
const DRAGON_MEAL_REPLIES=['Довольно кивает ♥','Радостно машет хвостом ♥','Спасибо крылышками ♥','Жмурится от удовольствия ♥','Вкусно — ещё бы! ♥','Сыто потягивается ♥','Обнимает крылышками ♥','Благодарно склоняет голову ♥'];
function collectionMealState(t,duration=5.6){
 const mealEnd=Math.min(4,Math.max(.1,duration)),time=Math.max(0,t)*4/mealEnd;
 const q=Math.max(0,Math.min(1,time/.65,(4-time)/.55)),reach=q*q*(3-2*q);
 const biteCount=Math.max(0,Math.min(5,Math.floor((time-.925)/.55)+1));
 const end=duration>mealEnd?Math.max(0,Math.min(1,(t-mealEnd)/(duration-mealEnd))):0;
 return {time,reach,biteCount,portions:5-biteCount,
  chew:time>=.65&&time<3.4?Math.max(0,Math.sin((time-.65)/.55*Math.PI*2)):0,
  satisfaction:Math.sin(end*Math.PI)**2,stage:time<.65?'approach':time<3.45?'eat':t<mealEnd?'rise':'react'};
}
const CARE_ICONS={
 feed:'<path d="M4 13h24l-3 12H7Z" fill="#d9b077"/><path d="M9 13c-5-9 6-12 7-4 4-9 12-3 7 4" fill="#abbd77"/><path d="M7 18h18"/>',
 pet:'<path d="M6 19V9c0-3 4-3 4 0v6-10c0-3 4-3 4 0v9-10c0-3 4-3 4 0v10-7c0-3 4-3 4 0v11l3-4c2-3 5 0 3 3l-5 8c-3 5-15 4-17-6Z" fill="#efc597"/>',
 music:'<path d="M12 24V8l15-4v16M12 12l15-4" fill="none"/><ellipse cx="8" cy="25" rx="4" ry="3" fill="#bc8ac1"/><ellipse cx="23" cy="21" rx="4" ry="3" fill="#bc8ac1"/>',
 heart:'<path d="M16 27 4 15C-3 4 12-2 16 7 20-2 35 4 28 15Z" fill="currentColor" stroke="none"/>'
};
function careIcon(kind){return '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="#574532" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+CARE_ICONS[kind]+'</svg>';}
let homeCareActive=null;
let homeLife=null;
function beginHomeLife(id){homeLife={id,entered:homeAnimTime,next:homeAnimTime+11,serial:0,action:null,caption:null};}
function endHomeLife(){homeLife=null;}
function dragonLifeHabit(id){return ['sleep','sniff','play'][dragonPersonality(id).idle%3];}
const DRAGON_BOND_REPLIES=['Благодарный поклон','Два счастливых прыжка','Крылатое приветствие','Ласковый кивок','Танец доверия','Счастливый хвост','Тёплые объятия','Радостное покачивание'];
function homeInvitationOpen(id){
 return !(typeof homeReduced!=='undefined'&&homeReduced)&&!!homeLife&&homeLife.id===id&&homeLife.action?.activity==='ask'&&homeAnimTime>=homeLife.action.start&&homeAnimTime-homeLife.action.start<homeLife.action.duration&&dragonBond(id)>=18;
}
function claimHomeInvitation(id){
 if(homeCareActive||!homeInvitationOpen(id))return false;
 homeLife.action=null;homeLife.next=homeAnimTime+20;homeLife.caption=null;return true;
}
function homeLifeCaption(id){return homeInvitationOpen(id)?'Подставляет голову — можно погладить ♥':'';}
function syncHomeLifeCaption(){
 if(!homeLife)return;
 const caption=homeLifeCaption(homeLife.id);if(caption===homeLife.caption)return;
 homeLife.caption=caption;refreshCareControls();
}
function homeLifeFor(id){
 if(!homeLife||homeLife.id!==id||typeof homeReduced!=='undefined'&&homeReduced)return null;
 const now=homeAnimTime;
 if(homeCareActive){homeLife.entered=-99;homeLife.action=null;homeLife.next=Math.max(homeLife.next,now+11);syncHomeLifeCaption();return null;}
 if(now-homeLife.entered<2.8)return {id,kind:'greet',bond:dragonBond(id),t:now-homeLife.entered,duration:2.8};
 if(homeLife.action&&now-homeLife.action.start>=homeLife.action.duration)homeLife.action=null;
 if(!homeLife.action&&now>=homeLife.next){
  let activity=dragonLifeHabit(id);
  if(dragonBond(id)>=18&&homeLife.serial%3===1)activity='ask';
  if(activity==='play'&&typeof collectionHabitat==='function'&&collectionHabitat(homeDragonDisplayMesh(id).d,dragonPersonality(id))==='water')activity='splash';
  homeLife.serial++;
  homeLife.action={activity,start:now,duration:activity==='sleep'?6:activity==='ask'?5.5:4.5};homeLife.next=now+15+dragonPersonality(id).flair%6;
 }
 syncHomeLifeCaption();
 return homeLife.action?{id,kind:'activity',activity:homeLife.action.activity,t:now-homeLife.action.start,duration:homeLife.action.duration,automatic:true}:null;
}
function beginHomeObjectAction(object){
 if(!dragonHomeOpen()||homeTab!=='warehouse'||caveHeld===null||!homeCanView(caveHeld)||(typeof Playables!=='undefined'&&Playables.blocked))return false;
 const mesh=homeDragonDisplayMesh(caveHeld),scene=buildCollectionHabitat(prepareRestingDragon(mesh),dragonPersonality(caveHeld));
 if(!scene.objects.includes(object))return false;
 const activity={nest:'sleep',water:'splash',toy:'play',tree:'sniff'}[object];if(!activity)return false;
 const transitionPose=captureHomeCarePose(caveHeld);
 stopDragonCare();homeCareActive={id:caveHeld,kind:'activity',activity,transitionPose,start:homeAnimTime,duration:activity==='sleep'?6:4.5,note:-1};
 refreshCareControls();wakeDragonHome();return true;
}
const homeCareCooldown=new Map();
const homeTouchCounts=new Map();
function dragonBond(id){return Math.max(0,Math.min(30,dragonProfile.care?.[id]||0));}
function earnDragonAffection(id,kind){
  if(!Number.isInteger(id)||!DRAGON_CARE_ACTIONS[kind])return {ok:false,message:"Действие недоступно"};
  return dragonTransaction(p=>{
    if(!p.exclusives[id])return "Этот дракон ещё не в коллекции";
    p.care=p.care||{};p.care[id]=Math.min(30,(p.care[id]||0)+(Object.keys(DRAGON_CARE_ACTIONS)[id%3]===kind?2:1));return true;
  });
}
function stopDragonCare(){stopDragonMusic();homeCareActive=null;}
function captureHomeCarePose(id){
 if(typeof homeReduced!=='undefined'&&homeReduced||typeof collectionMotion!=='function'||typeof homeDragonDisplayMesh!=='function')return null;
 let care=homeCareFor(id);
 if(!care&&homeLife?.id===id&&homeLife.action&&homeLife.action.activity!=='ask'){
  const a=homeLife.action,t=homeAnimTime-a.start;
  if(t>=0&&t<a.duration)care={id,kind:'activity',activity:a.activity,t,duration:a.duration};
 }
 if(!care)return null;
 return applyCollectionCare(collectionMotion(homeDragonDisplayMesh(id).d,homeAnimTime),care);
}
function homeSleepingCare(id){
 const manual=homeCareFor(id);
 if(manual)return manual.kind==='activity'&&manual.activity==='sleep'?manual:null;
 if(homeCareActive||!homeLife||homeLife.id!==id||(typeof homeReduced!=='undefined'&&homeReduced))return null;
 const a=homeLife.action,t=a?homeAnimTime-a.start:-1;
 return a?.activity==='sleep'&&t>=0&&t<a.duration?{id,kind:'activity',activity:'sleep',t,duration:a.duration}:null;
}
function touchHomeDragon(zone=null){
 if(!dragonHomeOpen()||homeTab!=="warehouse"||caveHeld===null||!homeCanView(caveHeld)||(typeof Playables!=="undefined"&&Playables.blocked))return false;
 if(['touch','bond','wake'].includes(homeCareActive?.kind)&&homeAnimTime-homeCareActive.start<.7)return false;
 const sleeping=homeSleepingCare(caveHeld);
 if(sleeping){
  const reduced=typeof homeReduced!=='undefined'&&homeReduced,d=homeDragonDisplayMesh(caveHeld).d;
  const fromPose=applyCollectionCare(collectionMotion(d,reduced?0:homeAnimTime),reduced?{...sleeping,t:.8}:sleeping);
  stopDragonCare();
  if(homeLife){homeLife.action=null;homeLife.entered=-99;homeLife.next=homeAnimTime+15;homeLife.caption=null;}
  homeCareActive={id:caveHeld,kind:'wake',fromPose,start:homeAnimTime,duration:3.2,note:-1};
  refreshCareControls();wakeDragonHome();return true;
 }
 const transitionPose=captureHomeCarePose(caveHeld);
 if((zone==='head'||zone===null)&&claimHomeInvitation(caveHeld)){
  stopDragonCare();homeCareActive={id:caveHeld,kind:'bond',transitionPose,reply:dragonPersonality(caveHeld).idle,start:homeAnimTime,duration:3.4,note:-1};
  refreshCareControls();wakeDragonHome();return true;
 }
 const count=homeTouchCounts.get(caveHeld)||0;homeTouchCounts.set(caveHeld,count+1);
 const choices={head:[2,6,7],belly:[0,5,3],tail:[1,3,4]}[zone];
 const reaction=choices?choices[(dragonPersonality(caveHeld).idle+count)%choices.length]:(dragonPersonality(caveHeld).idle+count*3)%8;
 stopDragonCare();homeCareActive={id:caveHeld,kind:"touch",transitionPose,zone:choices?zone:null,reaction,start:homeAnimTime,duration:3.2,note:-1};
 refreshCareControls();wakeDragonHome();return true;
}
function homeCareFor(id){
  const a=homeCareActive;if(!a||a.id!==id)return null;
  const t=Math.max(0,homeAnimTime-a.start);return t<a.duration?{id:a.id,kind:a.kind,activity:a.activity,transitionPose:a.transitionPose,fromPose:a.fromPose,reply:a.reply,bondReply:a.bondReply,zone:a.zone,reaction:a.reaction,t,duration:a.duration}:null;
}
function beginDragonCare(id,kind){
  if(!dragonHomeOpen()||homeTab!=="warehouse"||!homeCanView(id)||!DRAGON_CARE_ACTIONS[kind]||(typeof Playables!=="undefined"&&Playables.blocked))return false;
  if(caveHeld!==id&&!(caveHeld===null&&homeThumbSlots.some(s=>s.id===id)))return false;
  if(kind==="music"&&homeCareActive?.id===id&&homeCareActive.kind===kind){
    const transitionPose=captureHomeCarePose(id);stopDragonCare();
    if(transitionPose)homeCareActive={id,kind:'settle',transitionPose,start:homeAnimTime,duration:.45,note:-1};
    refreshCareControls();wakeDragonHome();return true;
  }
  const key=id+":"+kind,last=homeCareCooldown.get(key);
  const now=performance.now()/1000;
  if(last!==undefined&&now-last<4)return false;
  // Admin previews react but never create owned dragons or affection records.
  if(typeof id==="number"&&dragonProfile.exclusives[id]&&dragonBond(id)<30){
    const r=earnDragonAffection(id,kind);if(!r.ok){homeMessage(r.message);return false;}
  }
  homeCareCooldown.set(key,now);
  const transitionPose=captureHomeCarePose(id);
  const personality=dragonPersonality(id);
  const bondReply=kind==='pet'&&claimHomeInvitation(id);
  stopDragonCare();
  homeCareActive={id,kind,bondReply,transitionPose,reply:personality.idle,start:homeAnimTime,duration:kind==="music"?dragonTune(personality).step*dragonTune(personality).length:DRAGON_CARE_ACTIONS[kind].duration,note:-1};
  try{audio();}catch(_){} // Unlock audio from the explicit care gesture, not an autoplay frame.
  if(kind!=="music")beep(kind==="feed"?523:659,.12,"sine",.035);
  homeMessage("");refreshCareControls();wakeDragonHome();return true;
}
function createCareControls(id){
  const box=document.createElement("div");box.className="dragon-care";
  const bond=document.createElement("div");bond.className="care-bond";box.appendChild(bond);
  const row=document.createElement("div");row.className="care-actions";box.appendChild(row);
  const buttons=[];
  for(const [kind,info] of Object.entries(DRAGON_CARE_ACTIONS)){
    const b=document.createElement("button");b.type="button";b.innerHTML=careIcon(kind);b.title=info.label;b.setAttribute("aria-label",info.label+": "+homeEntry(id).name);
    b.onclick=e=>{e?.stopPropagation();beginDragonCare(id,kind);};row.appendChild(b);buttons.push({b,kind});
  }
  const status=document.createElement("div");status.className="care-caption";status.setAttribute("aria-live","polite");box.appendChild(status);
  function refresh(){
    const points=dragonBond(id),active=homeCareFor(id),preview=homeAdmin&&!homeCount(id);
    bond.innerHTML=Array.from({length:5},(_,i)=>'<i class="'+(points>=6*(i+1)?'filled':'')+'">'+careIcon('heart')+'</i>').join('');
    bond.setAttribute("aria-label",preview?"Просмотр модели":`Дружба: ${points} из 30. Не уменьшается после выхода.`);bond.title=preview?"Просмотр модели":"Дружба сохраняется и не уменьшается";
    for(const {b,kind} of buttons){const on=active?.kind===kind;b.classList.toggle("active",on);if(kind==="music"){b.setAttribute("aria-pressed",String(on));b.setAttribute("aria-label",(on?"Остановить музыку":"Музыка")+": "+homeEntry(id).name);}}
    const favorite=typeof id==="number"&&Object.keys(DRAGON_CARE_ACTIONS)[id%3]===active?.kind;
    const personality=dragonPersonality(id),song=dragonTune(personality);
    buttons.find(x=>x.kind==="music").b.title=song.name+" · "+DRAGON_DANCES[personality.dance];
    status.textContent=active?(favorite?{feed:"Любит угощения ♥",pet:"Любит ласку ♥",music:"Любит музыку ♫"}:{feed:"Хрум-хрум!",pet:"Доволен ♥",music:"Танцуем!"})[active.kind]:points>=30?"Лучшие друзья":points>=18?"Доверяет тебе":points>=6?"Рад тебя видеть":"Познакомимся?";
    if(active?.kind==="music")status.textContent="♫ "+song.name;
    if(active?.kind==="touch")status.textContent=["Прыгает от радости ♥","Ой! Это ты ♥","Обнимает крылышками ♥","Удивился и обрадовался ♥","Прячется и выглядывает ♥","Потанцуем? ♥","Просит ещё ♥","Поклон для тебя ♥"][active.reaction??personality.idle];
    if(active?.zone)status.textContent={head:"Подставляет голову для ласки ♥",belly:"Щекотно! ♥",tail:"Ой, мой хвост! ♥"}[active.zone];
    if(active?.kind==='activity')status.textContent={sleep:'Устроился поуютнее ♥',play:'Играет с мячиком',sniff:'Ловит аромат листочка',splash:'Плещется в воде'}[active.activity];
    if(active?.kind==='bond'||active?.bondReply)status.textContent=DRAGON_BOND_REPLIES[active.reply??personality.idle]+' ♥';
    if(active?.kind==='wake')status.textContent='Сонно потягивается — это ты? ♥';
    if(active?.kind==='settle')status.textContent='Потанцевали! ♥';
    if(active?.kind==='feed'&&collectionMealState(active.t,active.duration).stage==='react')status.textContent=DRAGON_MEAL_REPLIES[personality.idle];
    if(!active&&homeLifeCaption(id))status.textContent=homeLifeCaption(id);
    box.title=typeof collectionHabitat==="function"?COLLECTION_BIOMES[collectionHabitat(homeDragonDisplayMesh(id).d,personality)].name:DRAGON_HABITATS[personality.habitat][0];
  }
  refresh();return {box,refresh};
}
function refreshCareControls(){for(const slot of homeThumbSlots)slot.care?.refresh();if(typeof homeInspectCare!=="undefined")homeInspectCare?.refresh();}
function updateDragonCare(){
  const a=homeCareActive;if(!a)return;
  const shown=homeTab==="warehouse"&&(caveHeld===a.id?homeCanvasVisible:caveHeld===null&&homeShelfVisible&&homeThumbSlots.some(s=>s.id===a.id&&s.visible));
  if(!shown||!homeCareFor(a.id)){stopDragonCare();refreshCareControls();return;}
  if(a.kind==='feed'){
    const phase=collectionMealState(homeAnimTime-a.start,a.duration).stage;
    if(a.phase!==phase){a.phase=phase;refreshCareControls();}
  }
  if(a.kind==="music"){
    const personality=dragonPersonality(a.id),beat=Math.floor((homeAnimTime-a.start)/dragonTune(personality).step);
    if(beat!==a.note){a.note=beat;playDragonTuneStep(personality,beat);}
  }
}
function applyCollectionCare(m,care){
 const target=collectionCarePose(m,care);
 if(!care?.transitionPose)return target;
 return blendCollectionCarePose(care.transitionPose,target,care.t/(care.kind==='settle'?care.duration:.32));
}
function blendCollectionCarePose(from,target,progress){
 if(progress>=1)return target;
 const u=Math.max(0,progress),blend=u*u*(3-2*u),v={...target};
 for(const key of new Set([...Object.keys(from),...Object.keys(target)])){
  const start=from[key]||0,end=target[key]||0;
  const delta=key==='turn'?Math.atan2(Math.sin(end-start),Math.cos(end-start)):end-start;
  v[key]=start+delta*blend;
 }
 return v;
}
function collectionCarePose(m,care){
  if(!care)return m;
  if(care.kind==='settle')return m;
  if(care.kind==='wake')return collectionWakeMotion(m,care);
  const fade=Math.min(1,care.t*5,(care.duration-care.t)*4),beat=Math.sin(care.t*Math.PI*2/ .64);
  const v={...m};
  if(care.kind==="feed"){
    const meal=collectionMealState(care.t,care.duration),s=meal.satisfaction,reply=dragonPersonality(care.id??0).idle;
    v.feed=meal.reach;v.jaw=v.feed*(.04+meal.chew*.19);v.blink=Math.max(v.blink||0,v.feed*.35,s*.8);v.tail+=fade*.12;
    v.jaw+=s*.045;
    switch(reply){
      case 0:v.nod+=Math.sin((care.t-4)*8)*s*.18;break;
      case 1:v.tail+=Math.sin(care.t*10)*s*.48;v.look+=s*.1;break;
      case 2:v.wing+=Math.sin(care.t*7)*s*.3;v.nod+=s*.1;break;
      case 3:v.blink=Math.max(v.blink,s*.96);v.nod+=s*.15;break;
      case 4:v.look+=Math.sin(care.t*5)*s*.2;v.nod+=s*.12;break;
      case 5:v.stretch+=s*.12;v.wing+=s*.18;break;
      case 6:v.wing-=s*.4;v.tail+=s*.22;break;
      default:v.nod-=s*.23;v.look+=s*.1;
    }
  }
  if(care.kind==="pet"){v.look+=fade*.16;v.nod+=fade*.09;v.tail+=Math.sin(care.t*9)*fade*.3;v.blink=Math.max(v.blink||0,fade*.83);v.jaw=fade*.07;}
  const personality=dragonPersonality(care.id??0);
  if(care.kind==='greet'){
    const s=Math.sin(Math.PI*Math.min(1,care.t/care.duration)),bond=care.bond||0;
    v.look+=s*(bond>=6?.16:.07);v.nod+=s*(bond>=18?.22:.08);v.tail+=Math.sin(care.t*9)*s*(.1+bond*.014);
    v.blink=Math.max(v.blink||0,s*(bond>=6?.8:.3));v.jaw=s*.09;
    if(bond>=18)v.wing+=s*.28;
    if(bond>=30){const favorite=personality.idle%3;if(favorite===0)v.nod+=s*.25;else if(favorite===1)v.wing-=s*.55;else v.hop=Math.max(0,Math.sin((care.t-.35)*Math.PI*2))*s*.3;}
  }
  if(care.kind==='activity'){
    const s=Math.min(1,care.t/.8,(care.duration-care.t)/.8),soft=Math.max(0,s*s*(3-2*s));
    if(care.activity==='sleep')Object.assign(v,collectionSleepMotion(m,care.t,care.duration));
    if(care.activity==='play'){
      const play=collectionToyPlay(care.t,care.duration);
      v.feed=play.reach;v.toyReach=play.reach;v.toyTravel=play.noseTravel;
      v.eyeNod=-play.reach;v.eyeLook=play.travel/.34*play.reach;
      v.tail+=Math.sin(care.t*8)*(.16*play.reach+.32*play.celebrate);
      v.nod+=play.celebrate*.18;v.wing+=play.celebrate*.22;
      v.blink=Math.max(v.blink||0,play.celebrate*.85);v.jaw=play.celebrate*.06;
    }
    if(care.activity==='sniff'){v.nod+=Math.sin(care.t*8)*soft*.08;v.look+=soft*.15;v.blink=soft*.5;v.jaw=soft*.05;}
    if(care.activity==='splash'){v.hop=Math.max(0,Math.sin(care.t*6))*soft*.18;v.wing+=Math.sin(care.t*6)*soft*.16;v.tail+=Math.sin(care.t*8)*soft*.5;v.blink=soft*.6;}
    if(care.activity==='ask'){v.nod+=soft*.2;v.tail+=Math.sin(care.t*5)*soft*.16;v.blink=Math.max(v.blink||0,soft*.55);v.jaw=soft*.025;}
  }
  if(care.kind==='bond'||care.bondReply){
    const t=care.t,s=Math.sin(Math.min(1,t/care.duration)*Math.PI)*fade,reply=care.reply??personality.idle;
    v.blink=Math.max(v.blink||0,s*.8);v.nod+=s*.1;v.jaw=s*.07;
    switch(reply){
      case 0:v.nod-=s*.32;v.wing+=s*.2;break;
      case 1:{const jump=(start)=>Math.sin(Math.max(0,Math.min(1,(t-start)/.7))*Math.PI);v.hop=(jump(.25)*.38+jump(1.2)*.28)*s;v.tail+=s*.3;break;}
      case 2:v.wing+=Math.sin(t*5)*s*.4;v.look+=s*.2;break;
      case 3:v.nod+=s*.24;v.look+=Math.sin(t*3)*s*.14;break;
      case 4:v.step=Math.sin(t*7)*s*.12;v.turn=Math.sin(t*4)*s*.12;break;
      case 5:v.tail+=Math.sin(t*9)*s*.65;v.nod+=Math.sin(t*5)*s*.08;break;
      case 6:v.wing-=s*.55;v.look+=s*.15;v.tail+=s*.28;break;
      default:v.look+=Math.sin(t*5)*s*.22;v.tail+=Math.sin(t*6)*s*.3;
    }
  }
  if(care.kind==="touch"){
    const t=care.t,b=Math.sin(t*(6+personality.flair/35)),s=Math.sin(Math.min(1,t/care.duration)*Math.PI)*fade;
    const pulse=(start,duration)=>Math.sin(Math.max(0,Math.min(1,(t-start)/duration))*Math.PI);
    const leap=pulse(.18,.7),second=pulse(1.08,.65),land=pulse(.88,.24);
    const kind=care.reaction??personality.idle;
    v.jaw=s*([.25,.30,.08,.27,.06,.18,.1,.06][kind]);
    if([1,3].includes(kind)){v.eyeWide=pulse(.05,.7)*.3;v.blink*=1-s;}
    else v.blink=Math.max(v.blink||0,s*([2,4,6,7].includes(kind)?.9:.4));
    v.squash=-pulse(0,.18)*.13-land*.11;
    switch(kind){
      case 0:v.hop=leap*.66+second*.38;v.wing+=leap*.55;v.tail+=b*s*.55;v.nod+=s*.18;break;
      case 1:v.hop=pulse(.07,.58)*.52;v.sway=-pulse(.12,1.2)*.22;v.wing+=pulse(.08,.7)*.65;v.look+=s*.32;v.tail+=b*s*.32;break;
      case 2:v.wing-=s*.68;v.nod+=s*.3;v.sway=(v.sway||0)+Math.sin(t*3)*s*.09;v.tail+=b*s*.4;break;
      case 3:v.hop=leap*.43;v.look+=Math.sin(t*5)*s*.45;v.nod+=s*.2;v.wing+=leap*.45;break;
      case 4:v.squash-=s*.13;v.wing-=s*.55;v.nod-=s*.38;v.look+=Math.sin(t*4)*s*.32;v.tail+=b*s*.18;break;
      case 5:v.hop=leap*.42+second*.42;v.turn=Math.sin(t*4)*s*.2;v.wing+=s*.32;v.tail+=b*s*.6;break;
      case 6:v.hop=second*.22;v.nod+=s*.36;v.look+=b*s*.23;v.step=b*s*.15;v.tail+=b*s*.55;break;
      default:v.nod-=s*.48;v.wing+=s*.42;v.squash-=s*.08;v.tail+=b*s*.3;
    }
    v.squash+=(v.hop||0)*.08;
    if(care.zone==="head"){v.blink=Math.max(v.blink||0,s*.92);v.nod+=s*.10;}
    if(care.zone==="belly"){v.turn=(v.turn||0)+Math.sin(t*11)*s*.10;v.jaw=Math.max(v.jaw||0,s*.22);}
    if(care.zone==="tail"){v.look+=s*.28;v.tail+=Math.sin(t*8)*s*.22;}
  }
  if(care.kind==="music")dragonDanceMotion(v,care,personality,fade);
  else if(care.activity!=='sleep'){v.look+=Math.sin(care.t*(2+personality.idle*.3))*.035*fade;v.tail*=care.kind==='feed'?1+(-.2+personality.flair/160)*fade:.8+personality.flair/160;}
  return v;
}
function collectionSleepMotion(base,t,duration=6){
 const u=Math.max(0,Math.min(1,t/duration)),smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
 const rest=smooth(u/.22)*(1-smooth((u-.72)/.28));
 const yawn=Math.sin(Math.PI*smooth(u/.22)),stretch=Math.sin(Math.PI*smooth((u-.72)/.28));
 return {...base,squash:(base.squash||0)*(1-rest)-rest*.30,
  breath:base.breath*(1-rest)+Math.sin(t*Math.PI*.8)*.009*rest,
  look:base.look*(1-rest),nod:base.nod*(1-rest)-rest*.25+stretch*.13,
  tail:base.tail*(1-rest)+rest*.30,wing:base.wing*(1-rest)-rest*.32+stretch*.14,
  blink:base.blink*(1-rest)+rest*.99,jaw:base.jaw*(1-rest)+yawn*.14,
  stretch:base.stretch*(1-rest)+stretch*.10};
}
function collectionWakeMotion(base,care){
 const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
 const blend=smooth(care.t/1.65),stretch=Math.sin(Math.PI*smooth((care.t-.45)/2.4)),v={...base};
 for(const key of new Set([...Object.keys(base),...Object.keys(care.fromPose||{})])){
  const from=care.fromPose?.[key]??base[key]??0,to=base[key]??0;v[key]=from+(to-from)*blend;
 }
 v.stretch+=stretch*.13;v.nod+=stretch*.16;v.wing+=stretch*.15;
 v.blink=Math.max(v.blink||0,stretch*.55);v.jaw+=stretch*.065;
 return v;
}
function drawCollectionCare(g,w,h,care){
  if(!care)return;
  if(care.kind==='activity')return;
  if(care.kind==='wake')return;
  if(care.kind==='settle')return;
  if(care.kind==="feed"&&collectionMealState(care.t,care.duration).satisfaction<.08)return;
  const t=care.t,fade=Math.min(1,t*5,(care.duration-t)*3);
  g.save();g.globalAlpha=Math.max(0,fade);g.lineWidth=Math.max(1,w/220);g.strokeStyle="#68513a";
  for(let i=0;i<3;i++){
    const phase=(t*.55+i/3)%1,x=w*(.3+i*.19)+Math.sin(t*2+i)*w*.018,y=h*(.43-phase*.25);
    g.globalAlpha=Math.max(0,fade*(1-phase));g.fillStyle=care.kind==="music"?"#9b66ab":"#cb746e";
    g.font=`bold ${Math.max(13,w*.075)}px system-ui`;g.textAlign="center";
    g.fillText(care.kind==="music"?(i%2?"♫":"♪"):care.kind==="touch"&&t<.7?"!":"♥",x,y);
  }
  g.restore();
}
