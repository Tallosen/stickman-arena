"use strict";
const RANGE_DURATION=20000;
let rangeSession=null,rangeBoard=null;
function refreshRangeDock(){
  const b=document.getElementById('btnCampWorkshop');
  if(b)b.textContent=gameText('Мастерская · ','Workshop · ')+economyCampBalance()+gameText(' дет.',' parts');
}
function leaveCampRange(){rangeSession=null;rangeBoard=null;}
function pauseCampRangeClock(){if(rangeSession)rangeSession.last=null;}
document.addEventListener('visibilitychange',pauseCampRangeClock);
function newRangeSession(){
  return {playing:false,finished:false,elapsed:0,hits:0,shots:0,last:null,lastPaint:-Infinity,lastShot:-Infinity,impact:null,aim:352};
}
function targetAtRange(s){
  return {x:s.playing?350+Math.sin(s.elapsed/870+s.hits*.61)*108:352,y:110,r:28};
}
function paintTarget(g,x,y,r){
  g.save();g.strokeStyle='#6a533a';g.lineWidth=4;scircle(g,x,y,r,'#cf975d');
  g.lineWidth=1.5;scircle(g,x,y,r*.77,'#ffedc3');scircle(g,x,y,r*.5,'#be6742');scircle(g,x,y,r*.23,'#f5d89d');g.restore();
}
function drawCampRangeStand(g,x,y,tier,time){
  g.save();g.translate(x,y);g.strokeStyle='#755a40';g.lineWidth=4;
  g.fillStyle='#75674f22';g.beginPath();g.ellipse(0,4,43,8,0,0,7);g.fill();
  for(const side of [-1,1])sline(g,side*26,-29,side*31,3);
  if(tier){sline(g,-37,-28,37,-28);const offset=tier===2?Math.sin(time*1.5)*13:0;sline(g,offset,-28,offset,-45);paintTarget(g,offset,-50,19);
    if(tier===2){g.fillStyle='#527971';g.fillRect(-30,-27,60,4);}}
  else{g.fillStyle='#ead7b2';g.fillRect(-33,-37,66,27);g.strokeRect(-33,-37,66,27);g.fillStyle='#826c48';g.font='bold 17px system-ui';g.textAlign='center';g.fillText('⚒',0,-17);}
  g.restore();
}
function renderCampRange(content){
  if(!rangeSession)rangeSession=newRangeSession();
  const tier=economyRangeTier(),balance=economyCampBalance();
  const top=campNode('div',undefined,'camp-kit-bar');top.appendChild(campNode('strong',gameText('Оружейный тир','Shooting range')));
  top.appendChild(campNode('span',balance+gameText(' дет.',' parts')));content.appendChild(top);
  const button=campNode('button',undefined,'range-board');button.type='button';button.id='rangeBoard';button.disabled=tier===0;
  button.setAttribute('aria-label',gameText('Выстрелить в мишень. Стрелки — прицел, пробел — выстрел','Shoot the target. Arrow keys to aim, Space to fire'));
  const canvas=campNode('canvas');canvas.width=520;canvas.height=210;canvas.setAttribute('aria-hidden','true');button.appendChild(canvas);content.appendChild(button);
  const status=campNode('p',undefined,'range-status');status.id='rangeStatus';content.appendChild(status);
  rangeBoard={button,canvas,status};
  button.onclick=e=>{
    const r=canvas.getBoundingClientRect(),keyboard=!e||e.detail===0;
    shootAtRange(keyboard?rangeSession.aim:(e.clientX-r.left)*520/r.width,keyboard?110:(e.clientY-r.top)*210/r.height);
  };
  if(tier<2){
    const cost=ECONOMY_PRICES.range[tier],buy=campNode('button',
      (tier?gameText('Подвижные мишени','Moving targets'):gameText('Построить тир','Build range'))+' · '+cost+gameText(' дет.',' parts'),'menu-secondary');
    buy.id='rangeBuild';buy.type='button';buy.disabled=balance<cost||campReadOnly;
    buy.onclick=()=>{if(document.getElementById(buy.id)!==buy||!campPanelActive)return;
      const ok=buyRangeTier(tier);refreshCampMenu();
      if(ok){menuScenePainted=false;document.getElementById('rangeBoard')?.focus();}};
    content.appendChild(buy);
    if(!tier)content.appendChild(campNode('p',gameText('Детали из забега попадут сюда после победы или поражения.','Parts arrive here after a win or a defeat.'),'camp-footnote'));
  }else{
    const start=campNode('button',gameText('Серия на 20 секунд','20-second round'),'menu-secondary');start.id='rangeStart';start.type='button';content.appendChild(start);
    start.onclick=()=>{if(Playables.blocked||rangeSession?.playing||!campPanelActive||campActiveSection!=='campWorkshop')return;
      rangeSession=newRangeSession();rangeSession.playing=true;rangeSession.last=performance.now();start.hidden=true;button.focus();tickCampRange(performance.now(),true);};
    start.hidden=rangeSession.playing;
  }
  tickCampRange(performance.now(),true);
}
function shootAtRange(x,y){
  const s=rangeSession,now=performance.now();
  if(!s||!rangeBoard||!campPanelActive||campActiveSection!=='campWorkshop'||!economyRangeTier()||Playables.blocked||document.hidden)return;
  tickCampRange(now);
  if(s.finished||now-s.lastShot<180)return;
  const target=targetAtRange(s),hit=Math.hypot(target.x-x,target.y-y)<=target.r;
  s.lastShot=now;s.shots++;s.hits+=Number(hit);s.impact={x,y,hit};s.aim=Math.max(235,Math.min(478,x));
  const w=campProfile.weapon;soundCue(w==='sniper'?'arrow':w==='basic'?'rifle':w,null,.7);
  tickCampRange(now,true);
}
function handleCampRangeKey(e){
  if(!rangeSession||document.activeElement!==rangeBoard?.button||!['ArrowLeft','ArrowRight'].includes(e.key))return false;
  e.preventDefault();rangeSession.aim=Math.max(235,Math.min(478,rangeSession.aim+(e.key==='ArrowLeft'?-12:12)));tickCampRange(performance.now(),true);return true;
}
function tickCampRange(now,force=false){
  const s=rangeSession;if(!s||!rangeBoard)return;
  if(document.hidden||Playables.blocked){s.last=null;return;}
  if(s.playing){
    if(s.last!==null)s.elapsed+=Math.max(0,now-s.last);s.last=now;
    if(s.elapsed>=RANGE_DURATION){
      s.elapsed=RANGE_DURATION;s.playing=false;s.finished=true;force=true;recordRangeBest(s.hits);
      const start=document.getElementById('rangeStart');if(start)start.hidden=false;
    }
  }
  if(!force&&(!s.playing&&now-s.lastShot>500&&s.lastPaint>s.lastShot+350||now-s.lastPaint<32))return;
  s.lastPaint=now;
  const tier=economyRangeTier(),g=rangeBoard.canvas.getContext('2d'),target=targetAtRange(s);
  g.save();g.fillStyle='#f1e4c8';g.fillRect(0,0,520,210);g.lineCap='round';
  g.strokeStyle='#d3bd94';g.lineWidth=2;for(const y of [160,170])sline(g,10,y,510,y);
  g.lineWidth=5;g.strokeStyle='#806542';sline(g,target.x,132,target.x,164);paintTarget(g,target.x,target.y,target.r);
  const weapon=campProfile.weapon;
  drawHero(g,74,166,1,0,{helm:1,jacket:1,gloves:1,boots:1,cape:1,gun:0,_w:weapon,_holdWeapon:true,_campStyle:campProfile.style},1.7,0,now-s.lastShot<100?1:0);
  if(tier){
    g.strokeStyle='#416f68';g.lineWidth=1.6;const x=s.aim;sline(g,x-8,110,x-3,110);sline(g,x+3,110,x+8,110);sline(g,x,102,x,106);sline(g,x,114,x,118);
    if(s.impact&&now-s.lastShot<350){const impact=s.impact;g.globalAlpha=Math.max(0,1-(now-s.lastShot)/350);
      g.strokeStyle=impact.hit?'#b77722':'#81765e';g.lineWidth=2;sline(g,102,111,impact.x,impact.y);g.beginPath();g.arc(impact.x,impact.y,7+(now-s.lastShot)/35,0,7);g.stroke();}
  }
  g.restore();
  const value=!tier?gameText('Чертёж · неподвижная мишень','Blueprint · stationary target'):
    s.finished?gameText('Попадания: ','Hits: ')+s.hits+'/'+s.shots+gameText(' · Рекорд тира: ',' · Range best: ')+campProfile.rangeBest:
    (s.playing?Math.ceil((RANGE_DURATION-s.elapsed)/1000)+gameText(' с · ',' s · '):gameText('Тренировка · ','Practice · '))+gameText('Попадания: ','Hits: ')+s.hits+'/'+s.shots;
  if(rangeBoard.status.textContent!==value)rangeBoard.status.textContent=value;
}
