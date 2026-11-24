const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),make=require('./arena-harness.cjs');
const root=path.join(__dirname,'..'),h=make();h.box.assert=assert;
h.run(fs.readFileSync(path.join(root,'src/cards.js'),'utf8'));
h.run(`
reset();const originalRandom=Math.random;
for(const n of [0,.039999,.04,.999]){lastPetRoll=null;Math.random=()=>n;assert.equal(rollPet()==='chicken',n<.04);}
lastPetRoll='chicken';Math.random=()=>0;assert.notEqual(rollPet(),'chicken');
let seed=198;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const counts=Object.fromEntries(Object.keys(PETS).map(k=>[k,0]));lastPetRoll=null;let previous=null;
for(let i=0;i<120000;i++){const pet=rollPet();assert.notEqual(pet,previous);previous=pet;counts[pet]++;}
const rareRate=counts.chicken/120000;assert(rareRate>.036&&rareRate<.041);
for(const key of Object.keys(PETS).filter(k=>k!=='chicken'))assert(counts[key]/120000>.185&&counts[key]/120000<.20);
Math.random=originalRandom;globalThis.petAudit={offers:120000,counts,baseRareChance:RARE_PET_CHANCE,observedRareRate:rareRate,seed:198};
// Selecting/levelling an owned chicken is not another rarity roll.
reset();P.pet=makePet('chicken');const roll=rollPet;rollPet=()=>{throw Error('Owned pet rerolled');};
const captured=[];card=(box,icon,title,sub,cb,rarity)=>captured.push({title,cb,rarity});
offerCards();const upgrade=captured.find(c=>c.title.startsWith(PETS.chicken.name));assert(upgrade);assert(!upgrade.rarity);upgrade.cb();assert.equal(P.pet.lvl,2);rollPet=roll;
// Resolve the same weapon grip in every ordinary and empowered pose.
reset();ult.dur=1000;
for(const w of Object.keys(WEAPONS))for(let L=0;L<5;L++)for(const face of [-1,1])for(const a of [-1.2,0,1.2]){
 P.wtype=w;P.gear.gun=L;P.gear.jacket=2;P.face=face;P.aim=face>0?a:Math.PI-a;
 const modes=[...Object.keys(POSES).map(mode=>({mode})),...EMPOWERED_ULTS[w].map(signature=>({mode:'dragonburst',signature}))];
 for(const entry of modes)for(const p of [0,.2,.5,.8,1]){
  ult.mode=entry.mode;ult.signature=entry.signature;ult.t=p*1000;ult.kick=0;
  const raw=keyframes(entry.signature?EMPOWERED_POSES[entry.signature.id]:POSES[entry.mode],p),q=ultPose();
  assert.deepEqual(q.af,raw.af,'Keep the original animated leading hand');assert.deepEqual(q.lf,raw.lf);assert.deepEqual(q.head,raw.head);
  const held=heroWeaponHoldPose({...P.gear,_w:w},P.aim,q,face);
  assert(Math.hypot(held.af[0]-raw.af[0],held.af[1]-raw.af[1])<1e-8,'No floating weapon during ult');
  assert([held.af,held.ab,held.ef,held.eb,q.gunAt].flat().every(Number.isFinite));
  const muzzle=empoweredUltMuzzle();assert(Number.isFinite(muzzle.x+muzzle.y));
 }
}
// Collected weapon never draws a persistent mastery plate; landing guidance remains.
reset();running=true;paused=false;props=[];P.wtype=P.dropWeapon='minigun';P.gear.gun=0;applyGear();weaponDelivery.state='collected';
let labels=[];const hud=new Proxy({fillText:s=>labels.push(s)},{get:(o,k)=>o[k]||(()=>{})});
drawWeaponDeliveryHUD(hud);assert.equal(labels.length,0);
for(const state of ['flying','ground']){weaponDelivery.state=state;weaponDelivery.x=P.x+200;weaponDelivery.y=P.y;labels=[];drawWeaponDeliveryHUD(hud);assert.equal(labels.length,2);}
weaponDelivery.state='collected';enemies=[{x:P.x+100,y:P.y,hp:1e9,r:10}];weaponDeliveryNotice=()=>bossLootNotices.push({title:'upgrade'});
for(let i=0;i<75;i++)updateWeaponDelivery(1000);assert.equal(P.gear.gun,1);assert.equal(bossLootNotices.length,1);labels=[];drawWeaponDeliveryHUD(hud);assert.equal(labels.length,0);
`);
const live=make({native:true,width:500,height:500});live.box.assert=assert;
live.run(`const originalDraw=drawHero;let heldDraws=0;drawHero=(...args)=>{if(ult.on){assert(args[5]._holdWeapon);heldDraws++;}return originalDraw(...args);};
for(const w of Object.keys(WEAPONS))for(const L of [0,4]){
 reset();running=true;paused=false;props=[];enemies=[];P.wtype=w;P.gear.gun=L;P.gear.jacket=2;P.gear.gloves=2;applyGear();ult.charge=ULT_FULL;startUlt();updateUlt(200);draw();
}assert(heldDraws>=28,'Actual render, shadow and afterimages use the held-weapon rig');`);
const v=make({native:true,width:1200,height:850});
v.run(`reset();ctx.fillStyle=PAPER;ctx.fillRect(0,0,W,H);ctx.vackyStableSketch=true;ult.dur=1000;
const examples=[['laser',0,'upper',.5,-1.15],['sniper',0,'rain',.5,.2],['shotgun',4,'dive',.5,.3],['sniper',4,'rollshot',.6,0],['minigun',4,'spiral',.5,-.4],['goldSniper',4,'scope',.5,0]];
for(const [i,[w,L,mode,p,aim]] of examples.entries()){
 P.wtype=w;P.gear={gun:L,helm:3,jacket:2,gloves:2,cape:2,boots:2,scope:0,clip:0};P.aim=aim;P.face=1;ult.mode=mode;ult.t=p*1000;ult.kick=0;
 const x=100+i%3*400,y=310+Math.floor(i/3)*405;
 drawHero(ctx,x,y,1,0,{...P.gear,_w:w,_holdWeapon:true},2.3,aim,0,ultPose());
 ctx.fillStyle=INK;ctx.font='15px system-ui';ctx.fillText(weaponFormName(w,L)+' · '+mode,x-65,y+40,345);
}
`);
if(process.argv.includes('--frames')){
 fs.writeFileSync(path.join(root,'audit/ult-grip-v0198.png'),v.canvas.toBuffer('image/png'));
 fs.writeFileSync(path.join(root,'audit/pet-chances-v0198.json'),JSON.stringify(h.box.petAudit,null,2));
}
console.log('PASS: 120k seeded pet offers, 4% boundary, no repeats, owned-pet upgrades; animated ult hand/grip alignment across all weapons/tiers/modes; no persistent mastery HUD');
