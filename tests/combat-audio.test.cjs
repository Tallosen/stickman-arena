const assert=require('node:assert/strict'),h=require('./arena-harness.cjs')();h.box.assert=assert;
h.run(`
let soundEvents=[];
SFX.hit=x=>soundEvents.push(['hit',x]);SFX.pop=x=>soundEvents.push(['pop',x]);SFX.hurt=()=>soundEvents.push(['hurt']);
for(const cinematic of [false,true]){
 reset();running=true;props=[];spawn('basic');let e=enemies.at(-1);
 Object.assign(e,{x:P.x+180,y:P.y,hp:10});ult.on=cinematic;soundEvents=[];
 hit(e,1,P.x,P.y);assert.deepEqual(soundEvents,[['hit',e.x]],'Nonlethal hit: one spatial contact');
 soundEvents=[];hit(e,100,P.x,P.y);
 assert.deepEqual(soundEvents,[['pop',e.x]],'Lethal hit: death cue only, not hit + death');
 popEnemy(e);hit(e,100,P.x,P.y);assert.equal(soundEvents.length,1,'Already-dead enemies are silent');
}
reset();running=true;P.hp=5;P.hpMax=5;P.hurt=0;P.invT=0;soundEvents=[];
hurtHero(1,{x:P.x-30,y:P.y});assert.deepEqual(soundEvents,[['hurt']]);
hurtHero(1,{x:P.x-30,y:P.y});assert.equal(soundEvents.length,1,'Invulnerability prevents repeated contact audio');
console.log('PASS: enemy nonlethal/lethal audio, cinematic death, spatial position, duplicate death and player contact gates');
`);
