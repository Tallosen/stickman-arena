const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const scene=fs.readFileSync(path.join(__dirname,'../src/menu-scene.js'),'utf8');
const box={assert};vm.createContext(box);vm.runInContext(scene,box);
vm.runInContext(`
const near=(a,b)=>assert(Math.abs(a-b)<1e-8);
for(let seed=0;seed<4;seed++)for(let t=0;t<160;t+=.17){
 const hero=menuHeroPose(t,seed);
 for(const kind of ['rack','depart']){
  const p=menuHeldWeaponPose(hero,kind),hand=hero[kind==='rack'?'ab':'af'];
  near(p.scale/p.bodyScale,1.3);
  const origin=[p.x-p.grip[0]*p.scale*p.side,p.y-p.grip[1]*p.scale];
  near(origin[0]+p.grip[0]*p.scale*p.side,hero.x+hand[0]*p.bodyScale);
  near(origin[1]+p.grip[1]*p.scale,hero.y+80*hero.depth+hand[1]*p.bodyScale);
  assert(hero[p.shoulderKey].every(Number.isFinite));
 }
 // The fire is outside all ordinary companion paths (ground-plane clearance).
 for(const spec of MENU_COMPANIONS){
  if(spec.type==='parrot')continue;
  const pet=spec.type==='cat'?menuCatPose(t,seed):menuCompanionPose(spec,t);
  assert(Math.hypot(pet.x-MENU_FIRE.x,pet.y-MENU_FIRE.y)>MENU_FIRE.radius+15);
 }
}
assert(MENU_RACK_WEAPON_SCALE>1.4);
// Largest rack weapon stays inside the enlarged board.
assert(161-5*MENU_RACK_WEAPON_SCALE>=146);
assert(161+47*MENU_RACK_WEAPON_SCALE<=272);
assert(360+13*MENU_RACK_WEAPON_SCALE<=392);
`,box);
assert(scene.includes('paint:()=>drawMenuCampfire(g,time)'));
assert(scene.includes("sort((a,b)=>a.y-b.y).forEach(o=>o.paint())"));
assert(!/setInterval\(|setTimeout\(|requestAnimationFrame\(/.test(scene));
console.log('Camp props: held-weapon grip and arena scale, rack bounds, companion/fire clearance, depth ordering; no extra animation loops.');
