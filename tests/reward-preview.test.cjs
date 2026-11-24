const assert=require('assert'),h=require('./arena-harness.cjs')();h.box.assert=assert;
h.run(`
for(const w of Object.keys(WEAPONS))for(const level of [1,20,50])for(const bonuses of [0,2])for(const key of GK){
 reset();running=true;P.wtype=w;P.lvl=level;meta.hp=meta.dmg=meta.spd=bonuses;
 P.gear=Object.fromEntries(GK.map(k=>[k,k===key?GEAR[k].max-1:2]));applyGear();P.hp=Math.min(2,P.hpMax);
 const option={kind:'gear',key,id:'gear:'+key,title:key},snapshot=JSON.stringify({P,meta,inventory,ult});
 const preview=bossRewardPreview(option);assert(bossRewardImpact(option));assert.equal(JSON.stringify({P,meta,inventory,ult}),snapshot,'Preview mutated live state');
 for(const [stat,value] of Object.entries(preview.before))assert.equal(P[stat],value,'Before '+stat);
 bossRewardPending={stage:5,options:[option]};const beforeHP=P.hp;assert(claimBossReward(option.id));
 for(const [stat,value] of Object.entries(preview.after))assert.equal(P[stat],value,'After '+w+' '+key+' '+stat);
 assert.equal(P.gear[key],preview.gearAfter[key]);if(key==='helm')assert.equal(P.hp,beforeHP+1);
 assert(!claimBossReward(option.id));
}
reset();P.hp=4.5;P.hpMax=5;let p=bossRewardPreview({kind:'heal'});assert.equal(p.after,5);assert.equal(p.before,4.5);
ult.charge=ULT_FULL*.9;p=bossRewardPreview({kind:'ult'});assert.equal(p.after,100);assert.equal(p.before,90);
inventory.tank=998;p=bossRewardPreview({kind:'supply',key:'tank'});assert.equal(p.before,998);assert.equal(p.after,999);
inventory.tank=999;assert.equal(bossRewardPreview({kind:'supply',key:'tank'}).after,999);
P.wtype='shotgun';assert(bossRewardImpact({kind:'gear',key:'gun'}).includes('Дробин'));assert(bossRewardImpact({kind:'gear',key:'clip'}).includes('модулей'));
P.wtype='minigun';P.lvl=100;P.gear.gun=4;P.gear.gloves=3;assert(bossRewardImpact({kind:'gear',key:'gloves'}).includes('пределе'));
globalThis.uiLanguage='en';assert(bossRewardImpact({kind:'gear',key:'gloves'}).includes('cap'));
assert.equal(bossRewardImpact({kind:'continue'}),'');
`);
console.log('PASS: 192 weapon/level/perk/gear combinations: previews exactly match applied stats, no mutation, healing/ammo/ultimate caps, shotgun pellets, backpack modules, saturated fire rate and RU/EN.');
