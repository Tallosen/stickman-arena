"use strict";
let flashes = [], hitStop = 0;
let enemyRouteBudget=2;
// Local depenetration handles exact centres and overlapping rock hulls.
function enemyFreePoint(x,y,r){
  const q={x:Math.max(r,Math.min(WORLD-r,x)),y:Math.max(r,Math.min(WORLD-r,y)),r};
  for(let pass=0;pass<8;pass++){
    let changed=false;
    for(const o of props){
      const dx=q.x-o.x,dy=q.y-o.y,d=Math.hypot(dx,dy),reach=o.r*.78+r+.2;
      if(d<reach){const a=d>.001?Math.atan2(dy,dx):Math.atan2(WORLD/2-o.y,WORLD/2-o.x);
        q.x=Math.max(r,Math.min(WORLD-r,o.x+Math.cos(a)*reach));
        q.y=Math.max(r,Math.min(WORLD-r,o.y+Math.sin(a)*reach));changed=true;}
    }
    if(!changed||petPathClear(q.x,q.y,q.x,q.y,r))return q;
  }
  let best=null,bd=Infinity;
  for(const o of props){
    if(Math.hypot(o.x-x,o.y-y)>o.r*.78+r+180)continue;
    for(let i=0;i<32;i++){
      const a=i*Math.PI/16,reach=o.r*.78+r+.5,xx=o.x+Math.cos(a)*reach,yy=o.y+Math.sin(a)*reach,d=Math.hypot(xx-x,yy-y);
      if(d<bd&&petPathClear(xx,yy,xx,yy,r)){bd=d;best={x:xx,y:yy,r};}
    }
  }
  return best||q;
}
function enemyResolveRocks(e){
  if(petPathClear(e.x,e.y,e.x,e.y,e.r))return;
  const q=enemyFreePoint(e.x,e.y,e.r);e.x=q.x;e.y=q.y;e.rockPath=null;
}
// Swept collisions cover pursuit, recoil and crowd separation equally.
function enemyDisplace(e,dx,dy){
  if(petPathClear(e.x,e.y,e.x+dx,e.y+dy,e.r)){e.x+=dx;e.y+=dy;return false;}
  let lo=0,hi=1;
  for(let i=0;i<9;i++){const m=(lo+hi)/2;if(petPathClear(e.x,e.y,e.x+dx*m,e.y+dy*m,e.r))lo=m;else hi=m;}
  e.x+=dx*lo;e.y+=dy*lo;return true;
}
function enemyRockIntent(e,tx,ty,intent,dt){
  e.rockWait=Math.max(0,(e.rockWait||0)-dt);
  if(intent.locked)return intent;
  const vl=Math.hypot(intent.vx,intent.vy)||1;
  if(petPathClear(e.x,e.y,tx,ty,e.r)&&petPathClear(e.x,e.y,e.x+intent.vx/vl*32,e.y+intent.vy/vl*32,e.r)){
    e.rockPath=null;return intent;
  }
  const changed=!e.rockGoal||Math.hypot(tx-e.rockGoal.x,ty-e.rockGoal.y)>72;
  if(!e.rockWait&&(!e.rockPath?.length||changed)&&enemyRouteBudget>0){
    enemyRouteBudget--;const goal=enemyFreePoint(tx,ty,e.r);
    e.rockPath=petRoute(e,goal.x,goal.y);e.rockGoal={x:tx,y:ty};e.rockWait=800;
  }
  const route=e.rockPath;
  if(!route?.length)return {...intent,vx:0,vy:0};
  while(route.length>1&&petPathClear(e.x,e.y,route[1].x,route[1].y,e.r))route.shift();
  if(Math.hypot(route[0].x-e.x,route[0].y-e.y)<4)route.shift();
  if(!route.length)return {...intent,vx:0,vy:0};
  if(!petPathClear(e.x,e.y,route[0].x,route[0].y,e.r)){e.rockPath=null;return {...intent,vx:0,vy:0};}
  const dx=route[0].x-e.x,dy=route[0].y-e.y,d=Math.hypot(dx,dy)||1;
  return {...intent,vx:dx/d,vy:dy/d};
}
/* world.js — враги, взрывы, сундуки, бусты, коллизии */

/* ── враги ────────────────────────────────────────────────── */
const KINDS = {
  basic:  { r: 11, hp: 1,  spd: .76, xp: 55 },
  runner: { r: 9,  hp: 1,  spd: 1.5, xp: 70 },
  tank:   { r: 17, hp: 6,  spd: .46, xp: 150 },
  elite:  { r: 25, hp: 26, spd: .54, xp: 500 },
  dasher: { r: 10, hp: 1, spd: 1.05, xp: 70 },
  shield: { r: 17, hp: 4, spd: .43, xp: 150 },
  flanker:{ r: 11, hp: 1, spd: 1.0, xp: 55 },
  pyro:   { r: 12, hp: 1.8, spd: .72, xp: 55 },
  drummer:{ r: 16, hp: 5, spd: .49, xp: 150 },
};
function spawn(kind) {
  // Specialists replace regular wave slots; cap active pressure, not XP income.
  if(kind==='pyro'&&enemies.filter(e=>e.hp>0&&e.kind===kind).length>=(P.stage>=16?4:P.stage>=10?3:2))kind='basic';
  if(kind==='drummer'&&enemies.filter(e=>e.hp>0&&e.kind===kind).length>=2)kind='tank';
  const K = KINDS[kind], a = Math.random() * 6.283, d = Math.max(W, H) * .62 + 60;
  const x = Math.max(30, Math.min(WORLD - 30, P.x + Math.cos(a) * d));
  const y = Math.max(30, Math.min(WORLD - 30, P.y + Math.sin(a) * d));
  const stage = Math.max(1, P.stage || 1);
  const hpScale = (1 + (stage - 1) * .32) * (1 + Math.min(.55, (stage-1)*.035))*(1+Math.min(.18,Math.max(0,stage-5)*.012));
  const speedScale = (1 + Math.min(.46, (stage - 1) * .045))*(1+Math.min(.08,Math.max(0,stage-7)*.006));
  const hp = Math.ceil(K.hp * hpScale);
  enemies.push({ kind, x, y, r: K.r, xp: K.xp, hp, maxhp: hp,
    speed: K.spd * speedScale, phase: rnd(0, 6),
    face: 1, flash: 0, kb: 0, kbx: 0, kby: 0, orbCd: 0, slip: 0,
    lx: x, ly: y, stuckT: 0, wander: 0, wanderT: 0, bob: rnd(0, 6),
    attackState:'chase',attackT:0,attackCd:rnd(900,1800),flankSide:Math.random()<.5?-1:1,
    guardAngle:Math.atan2(P.y-y,P.x-x),shieldFlash:0 });
  enemyResolveRocks(enemies[enemies.length-1]);
}
function enemyMovementIntent(e,tx,ty,dt){
  const dx=tx-e.x,dy=ty-e.y,d=Math.hypot(dx,dy)||1;
  let vx=dx/d,vy=dy/d,pace=1,locked=false;
  if(e.kind==='pyro')return pyroMovementIntent(e,tx,ty,dt);
  e.shieldFlash=Math.max(0,(e.shieldFlash||0)-dt);
  if(e.kind==='shield'){
    if(!Number.isFinite(e.guardAngle))e.guardAngle=Math.atan2(dy,dx);
    const a=Math.atan2(dy,dx),delta=Math.atan2(Math.sin(a-e.guardAngle),Math.cos(a-e.guardAngle));
    e.guardAngle+=Math.max(-dt*.0018,Math.min(dt*.0018,delta));
  }
  if(e.kind==='flanker'&&d>65){
    const bend=d<330?.85:.35,side=e.flankSide||1;
    vx+=-dy/d*bend*side;vy+=dx/d*bend*side;
  }
  if(e.kind==='dasher'){
    e.attackCd=Math.max(0,(e.attackCd||0)-dt);
    if(e.attackState==='windup'){
      e.attackT-=dt;pace=0;locked=true;
      if(e.attackT<=0){e.attackState='dash';e.attackT=430;}
    }else if(e.attackState==='dash'){
      e.attackT-=dt;vx=Math.cos(e.dashAngle);vy=Math.sin(e.dashAngle);pace=3.7;locked=true;
      if(e.attackT<=0){e.attackState='recover';e.attackT=550;pace=0;}
    }else if(e.attackState==='recover'){
      e.attackT-=dt;pace=.25;locked=true;
      if(e.attackT<=0){e.attackState='chase';e.attackCd=2600;}
    }else if(!e.attackCd&&d>85&&d<310){
      e.attackState='windup';e.attackT=750;e.dashAngle=Math.atan2(dy,dx);
      e.dashFrom={x:e.x,y:e.y};e.dashLength=e.speed*3.7*430/16.67;
      pace=0;locked=true;
    }
  }
  return {vx,vy,pace,locked};
}
function popEnemy(e) {
  if (e.rewarded) return;
  e.rewarded = true;
  gainXP(e.xp);
  if (e.xp >= 150)
    pops.push({ x:e.x, y:e.y-e.r-24, txt:"XP +"+e.xp, life:1.15, col:"#c79018" });
  // у каждого типа своя смерть
  if (ult.on) {                                   // кинематографичная гибель
    const a = Math.atan2(e.y - P.y, e.x - P.x) + rnd(-.28, .28);
    const pow = 7 + Math.random() * 5;
    // каждый десятый летит «в камеру» — эффектный крупный план
    const scopeFall = !!e.scopeFall, toCam = !scopeFall && Math.random() < .12;
    corpses.push({
      kind: e.kind, x: e.x, y: e.y, sc: e.r / 11, mode: "launch",
      style: scopeFall ? "scopefall" : toCam ? "camera" : "throw",
      vx: scopeFall ? Math.cos(a) * .18 : e.launchUp ? Math.cos(a) * 2 : Math.cos(a) * pow,
      vy: scopeFall ? Math.sin(a) * .12 : e.launchUp ? Math.sin(a) * 2 : Math.sin(a) * pow,
      ang: a, spin: scopeFall ? P.face * .004 : e.launchUp ? rnd(-.12, .12) : rnd(-.05, .05), tilt: 0,
      bold: 5.2, z: scopeFall ? 10 : 0, vz: scopeFall ? 0 : e.launchUp ? 15 : (toCam ? 9 : rnd(3.4, 6.2)),
      t: 0, life: scopeFall ? 3.2 : toCam ? 1.0 : 2.1, max: scopeFall ? 3.2 : toCam ? 1.0 : 2.1,
      landed: 0, trail: [],
    });
    flashes.push({ x: e.x, y: e.y - 14 * (e.r / 11), r: 8, max: 52 + e.r * 2.2,
                   life: 1, rot: Math.random() * 6.28 });
    hitStop = Math.max(hitStop, 55);
    for (let i = 0; i < 14; i++) {
      const an = Math.random() * 6.28, sp = rnd(1.5, 5);
      puffs.push({ x: e.x, y: e.y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, life: 1, r: rnd(2, 5) });
    }
    score++; SFX.pop();
    return;
  }
  const c = { kind: e.kind, x: e.x, y: e.y, face: e.face, sc: e.r / 11,
              rot: 0, rotV: 0, vx: e.kbx * 2.4, vy: e.kby * 2.4,
              life: 1, max: 1, mode: "puff", phase: e.phase };
  if (enemyBaseKind(e.kind) === "runner") {                       // кувыркается и тает
    c.mode = "tumble"; c.rotV = (Math.random() < .5 ? -1 : 1) * .14;
    c.vx = e.kbx * 4.2 + rnd(-.6, .6); c.vy = e.kby * 4.2 - 1.9; c.max = 1.25; c.life = 1.25;
  } else if (enemyBaseKind(e.kind) === "tank") {                  // тяжело заваливается набок
    c.mode = "fall"; c.max = 1.6; c.life = 1.6;
  } else if (e.kind === "elite") {                 // разлетается с ударной волной
    c.mode = "blast"; c.max = 1.2; c.life = 1.2;
    booms.push({ x: e.x, y: e.y, r: 14, max: 150, life: 1 });
    booms.push({ x: e.x, y: e.y, r: 8, max: 96, life: .8 });
    shake = Math.max(shake, 20);
  } else {                                         // обычный просто лопается
    c.mode = "pop"; c.max = .34; c.life = .34;
  }
  corpses.push(c);
  if (corpses.length > 40) corpses.shift();

  for (let i = 0; i < (e.kind === "elite" ? 24 : 8); i++) {
    const a = Math.random() * 6.28, s = rnd(.6, 3);
    puffs.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, r: rnd(2, 5) });
  }
  score++; shake = Math.max(shake, e.kind === "elite" ? 16 : 3); SFX.pop();
  if (!ult.on) ult.charge = Math.min(ULT_FULL, ult.charge + ULT_PER_KILL);
}
function hit(e, dmg, hx, hy) {
  if (e.hp <= 0 || e.rewarded) return;
  if(e.kind==='shield'&&Number.isFinite(hx)&&Number.isFinite(hy)){
    const a=Math.atan2(hy-e.y,hx-e.x),front=Math.cos(a-(e.guardAngle||0));
    if(front>.45){dmg*=.6;e.shieldFlash=150;}
  }
  if(e.kind==='dasher'&&(e.attackState==='windup'||e.attackState==='dash')){
    e.attackState='recover';e.attackT=550;e.attackCd=2600;
  }
  e.hp -= dmg; e.flash = 110; e.flinch = 1;
  if (hx !== undefined) { const a = Math.atan2(e.y - hy, e.x - hx); e.kb = 3.4; e.kbx = Math.cos(a); e.kby = Math.sin(a); }
  pops.push({ x: e.x, y: e.y - e.r - 10, txt: Math.round(dmg * 10) / 10, life: 1, col: INK });
  if (e.hp <= 0) popEnemy(e);
}

/* ── предметы ─────────────────────────────────────────────── */
function useItem() {
  if (!running || paused || !P.item) return;
  const it = P.item; P.item = null;
  if (it === "mine") {mines.push({ x: P.x, y: P.y, arm: 700 });triggerArenaSecret('mine',P.x,P.y);}
  else if (it === "nade") {
    let tg = null, bd = 1e9;
    for (const e of enemies) { const d = dist(e, P); if (d < bd) { bd = d; tg = e; } }
    const a = tg ? Math.atan2(tg.y - P.y, tg.x - P.x) : P.aim;
    nades.push({ x: P.x, y: P.y, vx: Math.cos(a) * 5.5, vy: Math.sin(a) * 5.5, fuse: 700 });
  } else if (it === "ice") { ices.push({ x: P.x, y: P.y, r: 150, life: 11000 });triggerArenaSecret('ice',P.x,P.y,150); SFX.ice(); }
  else if (it === "xp") { xpBoost = 20000; SFX.chest(); }
}
function explode(x, y, r, dmg) {
  booms.push({ x, y, r: 10, max: r, life: 1 });
  shake = Math.max(shake, 14); SFX.boom();
  for (const e of enemies) if (Math.hypot(e.x - x, e.y - y) < r + e.r) hit(e, dmg, x, y);
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * 6.28, s = rnd(1, 4);
    puffs.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, r: rnd(3, 7) });
  }
}
function spawnChest() {
  if (chests.filter(c=>!c.elite).length >= 3) return;
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * 6.283, d = rnd(260, 620);
    const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    if (x < 60 || y < 60 || x > WORLD - 60 || y > WORLD - 60) continue;
    if (props.some(o => Math.hypot(o.x - x, o.y - y) < o.r + 40)) continue;
    const rare = !chests.some(c => c.rare) && Math.random() < MAP_RARE_CHEST_CHANCE;
    const r = Math.random();
    chests.push({ x, y, a: 0, rare, item: rare ? null : r < .10 ? "xp" : r < .40 ? "mine" : r < .72 ? "nade" : "ice" });
    return;
  }
}

// Отдельный вызов нужен тестовой кнопке и будущим серверным событиям.
function spawnRareChestNearPlayer() {
  if (!running || paused || chests.some(c => c.rare)) return;
  const a = P.face > 0 ? 0 : Math.PI;
  chests.push({
    // Тестовый сундук сразу попадает в радиус подбора, чтобы быстро проверить награду.
    x: Math.max(54, Math.min(WORLD - 54, P.x + Math.cos(a) * 34)),
    y: Math.max(54, Math.min(WORLD - 54, P.y + 10)),
    a: 0, rare: true, item: null,
  });
}
const BOOSTS = {
  heart: { w: 5, col: "#c8402c" },
  haste: { w: 3, col: "#e0a52f" },
  ghost: { w: 3, col: "#4aa8cf" },
};
function rollBoost() {
  const keys = Object.keys(BOOSTS);
  let total = keys.reduce((a, k) => a + BOOSTS[k].w, 0), r = Math.random() * total;
  for (const k of keys) { r -= BOOSTS[k].w; if (r <= 0) return k; }
  return "heart";
}
function spawnHeart() {
  if (pickups.length >= 4) return;
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * 6.283, d = rnd(230, 640);
    const x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
    if (x < 60 || y < 60 || x > WORLD - 60 || y > WORLD - 60) continue;
    if (props.some(o => Math.hypot(o.x - x, o.y - y) < o.r + 34)) continue;
    pickups.push({ x, y, a: Math.random() * 6, kind: rollBoost() });
    return;
  }
}
function drawPickup(g, p) {
  const y = p.y - 4 + Math.sin(p.a) * 5;
  if (p.kind === "heart") { drawHeart(g, p.x, y, 1.4); return; }
  g.save(); g.translate(p.x, y);
  g.lineWidth = 2.4; g.lineJoin = "round";
  if (p.kind === "haste") {
    g.strokeStyle = "#a8761a";
    spoly(g, [[-3, -12], [6, -12], [1, -2], [7, -2], [-5, 12], [-1, 0], [-6, 0]], "#f0c443");
  } else {
    g.strokeStyle = "#2f7d9c";
    spoly(g, [[0, -13], [10, -8], [10, 2], [0, 13], [-10, 2], [-10, -8]], "#a9dcf0");
    g.lineWidth = 1.6; g.strokeStyle = "#2f7d9c";
    sline(g, 0, -9, 0, 8); sline(g, -6, -1, 6, -1);
  }
  g.restore();
}
function drawHeart(g, x, y, s2) {
  g.save(); g.translate(x, y); g.scale(s2, s2);
  g.strokeStyle = "#c8402c"; g.lineWidth = 2.4; g.fillStyle = "#f0a79a";
  g.beginPath();
  g.moveTo(0, 7); g.bezierCurveTo(-11, -1, -7, -11, 0, -5);
  g.bezierCurveTo(7, -11, 11, -1, 0, 7);
  g.closePath(); g.fill(); g.stroke();
  g.restore();
}
function pushOut(o) {
  for (const r of props) {
    const dx = o.x - r.x, dy = o.y - r.y, d = Math.hypot(dx, dy), m = r.r * .78 + o.r;
    if (d < m && d > .01) { o.x = r.x + dx / d * m; o.y = r.y + dy / d * m; }
  }
  o.x = Math.max(o.r, Math.min(WORLD - o.r, o.x));
  o.y = Math.max(o.r, Math.min(WORLD - o.r, o.y));
}
