"use strict";
function maybeSpawnCaravan(bag){
  if(![5,10,15].includes(bag.stage)||P.stage>=bag.stage+5)return;
  if(bag.stage!==5&&Math.random()>=.5)return;
  const point=enemyFreePoint(bag.x+76,bag.y-26,24);
  P.economy.caravan={stage:bag.stage,x:point.x,y:point.y,heal:false,reroll:false};
}
function caravanInReach(){
  const stall=P.economy?.caravan;
  return !!stall&&running&&!paused&&!ult.on&&!dragonFinale&&!P.abilityMenuOpen&&!bossLootLocked()&&
    !Playables.blocked&&Math.hypot(P.x-stall.x,P.y-stall.y)<=112;
}
function canBuyCaravanItem(kind){
  return caravanInReach()&&(kind==='heal'||kind==='reroll')&&!P.economy.caravan[kind]&&economyWallet()>=ECONOMY_PRICES[kind]&&
    (kind==='heal'?P.hp<P.hpMax:canRedrawGear());
}
function buyCaravanItem(kind){
  if(!canBuyCaravanItem(kind)||hudNoticePriority()!=='caravan')return false;
  if(!runSaveDepth&&Playables.storage.transaction)return runSaveAction(()=>buyCaravanItem(kind),true);
  P.economy.spent+=ECONOMY_PRICES[kind];P.economy.caravan[kind]=true;
  if(kind==='heal')P.hp=Math.min(P.hpMax,P.hp+2);else P.economy.rerolls++;
  pointer.active=false;SFX.chest?.();syncCaravanUI();return true;
}
function drawCaravan(g){
  const stall=P.economy?.caravan;
  if(!stall||stall.x<cam.x-85||stall.x>cam.x+W+85||stall.y<cam.y-30||stall.y>cam.y+H+95)return;
  g.save();g.translate(stall.x,stall.y);g.strokeStyle='#594831';g.lineJoin='round';g.lineWidth=2.5;
  g.fillStyle='#64563a28';g.beginPath();g.ellipse(1,6,44,9,0,0,Math.PI*2);g.fill();
  const board=(x,y,w,h,r,color)=>{g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=color;g.fill();g.stroke();};
  board(-34,-51,4,48,2,'#bf9561');board(29,-51,4,48,2,'#bf9561');
  board(-37,-22,74,22,4,'#bf8a51');board(-39,-24,78,5,2,'#edc68a');
  for(const x of [-24,24]){scircle(g,x,3,9,'#76573d');scircle(g,x,3,4,'#e6bf7c');}
  for(let i=0;i<6;i++){const x=-39+i*13,color=i%2?'#f1ddb1':'#4a8377';
    spoly(g,[[x+5,-59],[x+18,-59],[x+13,-46],[x,-46]],color);board(x,-46,13,6,2,color);}
  if(!stall.heal){board(-28,-36,17,12,2,'#ece0be');g.fillStyle='#a85139';g.fillRect(-21,-34,4,8);g.fillRect(-23,-32,8,4);}
  if(!stall.reroll){g.save();g.translate(15,-30);g.rotate(-.15);board(-6,-8,12,15,2,'#edcd88');g.fillStyle='#47766b';g.fillRect(-3,-4,6,3);g.restore();}
  g.restore();
}
let caravanDisplayKey='';
function syncCaravanUI(){
  const panel=document.getElementById('caravanCounter');if(!panel)return;
  if(!caravanInReach()||hudNoticePriority()!=='caravan'){if(!panel.hidden)panel.hidden=true;caravanDisplayKey='';return;}
  const q=arenaHUDLayout().notice,stall=P.economy.caravan;
  const key=[q.x,q.y,q.w,uiLanguage,economyWallet(),P.hp,P.hpMax,stall.heal,stall.reroll,heroBuildComplete()].join('|');
  if(key===caravanDisplayKey)return;caravanDisplayKey=key;
  panel.style.left=q.x+'px';panel.style.top=q.y+'px';panel.style.width=q.w+'px';panel.hidden=false;
  document.getElementById('caravanWallet').textContent=gameText('Караван · детали: ','Caravan · parts: ')+economyWallet();
  for(const kind of ['heal','reroll']){
    const btn=document.getElementById('cart-'+kind),label=kind==='heal'?gameText('Лечение +2','Heal +2'):gameText('Перевыбор','Redraw');
    btn.textContent=label+' · '+(stall[kind]?'✓':ECONOMY_PRICES[kind]);btn.disabled=!canBuyCaravanItem(kind);
    btn.title=kind==='heal'?gameText('Восстановить до 2 сердец (F)','Restore up to 2 hearts (F)'):gameText('Сменить карты при повышении уровня (R)','Redraw an upgrade offer (R)');
  }
}
const caravanCounter=document.getElementById('caravanCounter');
if(caravanCounter){
  for(const event of ['pointerdown','pointermove'])caravanCounter.addEventListener(event,e=>{e.stopPropagation();pointer.active=false;});
  for(const kind of ['heal','reroll'])document.getElementById('cart-'+kind).onclick=()=>buyCaravanItem(kind);
  addEventListener('keydown',e=>{
    if(caravanCounter.hidden||e.repeat||e.altKey||e.metaKey||e.ctrlKey||!['KeyF','KeyR'].includes(e.code))return;
    e.preventDefault();buyCaravanItem(e.code==='KeyF'?'heal':'reroll');
  });
}
