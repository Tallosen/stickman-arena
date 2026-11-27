"use strict";
const ECONOMY_PRICES = {heal:6, reroll:5, range:[16,40]};
function freshRunEconomy(){
  return {earned:0,spent:0,rerolls:0,banked:0,settled:false,stages:[],bags:[],caravan:null};
}
function validateRunEconomy(e){
  const validSources=(list,allowed)=>Array.isArray(list)&&list.length<=allowed.length&&new Set(list).size===list.length&&list.every(n=>allowed.includes(n));
  const waves=Array.from({length:20},(_,i)=>i+1).filter(n=>n%5!==0);
  if(!e||!validSources(e.stages,waves)||!validSources(e.bags,[5,10,15,20])||
     e.earned!==e.stages.length*2+e.bags.length*8||!Number.isSafeInteger(e.spent)||e.spent<0||e.spent>e.earned||
     !Number.isInteger(e.rerolls)||e.rerolls<0||e.rerolls>3||e.rerolls*5>e.spent||e.settled!==false||e.banked!==0)throw Error('Invalid parts ledger');
  const c=e.caravan;
  if(c!==null&&(!c||![5,10,15].includes(c.stage)||!e.bags.includes(c.stage)||!Number.isFinite(c.x)||!Number.isFinite(c.y)||
    c.x<0||c.x>WORLD||c.y<0||c.y>WORLD||typeof c.heal!=='boolean'||typeof c.reroll!=='boolean'))throw Error('Invalid caravan');
}
function economyWallet(){const e=P.economy;return e&&!e.settled?e.earned-e.spent:0;}
function economyCampBalance(){return campProfile.parts;}
function economyRangeTier(){return campProfile.rangeTier;}
function creditRunParts(stage,bag=false){
  const e=P.economy;
  if(!e||e.settled||P.testRun&&!campTestProgressAllowed())return 0;
  const events=bag?e.bags:e.stages;
  if(events.includes(stage))return 0;
  events.push(stage);
  const amount=bag?8:2;e.earned+=amount;
  return amount;
}
function settleRunParts(){
  const e=P.economy;if(!e||e.settled)return;
  const amount=P.testRun&&!campTestProgressAllowed()?0:economyWallet();
  const previous=campDraft||campProfile,next={...previous};
  if(amount&&!campReadOnly){
    next.parts=Math.min(1e9,next.parts+amount);
    if(!saveCamp(next))campDraft=next;
    e.banked=next.parts-previous.parts;
  }
  e.settled=true;
}
function buyRangeTier(expectedTier){
  if(Playables.blocked||campReadOnly)return false;
  if(!runSaveDepth&&Playables.storage.transaction)return runSaveAction(()=>buyRangeTier(expectedTier),true);
  const next=campDraft||campProfile,cost=ECONOMY_PRICES.range[next.rangeTier];
  if(expectedTier!==next.rangeTier||cost===undefined||next.parts<cost)return false;
  return saveCamp({...next,parts:next.parts-cost,rangeTier:next.rangeTier+1});
}
function recordRangeBest(hits){
  if(!Number.isSafeInteger(hits)||hits<1||hits>1000||Playables.blocked||campReadOnly)return false;
  if(!runSaveDepth&&Playables.storage.transaction)return runSaveAction(()=>recordRangeBest(hits),true);
  const next=campDraft||campProfile;
  return hits>next.rangeBest&&saveCamp({...next,rangeBest:hits});
}
