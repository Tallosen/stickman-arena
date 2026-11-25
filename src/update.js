"use strict";
/* update.js — главный цикл и вся физика кадра */

/* ── цикл ─────────────────────────────────────────────────── */
let last = 0;
const ARENA_STEP_MS=1000/60,ARENA_FRAME_MS=100;
function arenaFrameActive(){
  return running&&!paused&&!(typeof Playables!=='undefined'&&Playables.blocked);
}
(typeof Playables==='undefined'?requestAnimationFrame:Playables.requestFrame)(function loop(now) {
  (typeof Playables==='undefined'?requestAnimationFrame:Playables.requestFrame)(loop);
  // At most six small steps: a slow display must not shorten combat while
  // the stage clock keeps advancing. Long stalls are discarded for both.
  const activeMs=Math.max(0,Math.min(ARENA_FRAME_MS,now-last));
  const dt=Math.min(34,activeMs);last=now;
  try {
    if(typeof tickTutorial==="function")tickTutorial(now);
    if(typeof drawArsenalPreview==='function')drawArsenalPreview(now);
    if(typeof arenaEnding!=='undefined'&&arenaEnding){updateArenaEnding(dt);if(arenaEnding)drawArenaEnding(ctx);return;}
    if(typeof drawArenaMenu==='function'&&drawArenaMenu(now))return;
    if(P.runWon&&typeof drawArenaEndingBackdrop==='function'&&drawArenaEndingBackdrop(ctx))return;
    // Дом полностью закрывает арену: не рисуем второй невидимый игровой кадр.
    if(typeof dragonHomeOpen==="function"&&dragonHomeOpen())return;
    const steps=Math.min(6,Math.max(1,Math.ceil(activeMs/ARENA_STEP_MS-1e-7)));
    const stepMs=activeMs/steps;
    for(let step=0;step<steps&&stepMs>0&&arenaFrameActive();step++){
      let elapsed=stepMs;
      if(hitStop>0){
        const held=Math.min(hitStop,elapsed);hitStop=Math.max(0,hitStop-held);
        updateRunProgress(held);updateNightLighting(held);elapsed-=held;
      }
      if(elapsed>0&&arenaFrameActive())update(elapsed,elapsed);
      // A level choice, death or cloud save can begin inside update(). The
      // rest of this frame is dropped, never replayed after the dialog closes.
    }
    draw();
  } catch (err) {
    running = false;
    fatal((typeof uiLanguage==='undefined'||uiLanguage==='ru'?"Сбой в кадре: ":"Frame error: ") + err.message);
    throw err;
  }
});

function update(dt,activeMs=dt) {
  if(typeof runSaveAction==='function'&&!runSaveDepth)return runSaveAction(()=>update(dt,activeMs));
  updateRunProgress(activeMs);
  if(paused||!running)return;
  updateBossLootNotice(activeMs);
  const lootScene=bossLootLocked();
  if(bossLoot)updateBossLoot(dt,activeMs);
  if(lootScene||bossLootLocked()||paused||!running)return;
  updateDamageFeedback(activeMs);
  updateNightLighting(activeMs);
  if(!running)return;
  updateUlt(dt);                       // ульта живёт в реальном времени
  if (ult.on) dt *= .30;               // всё остальное — в замедлении
  t += dt; const k = dt / 16.67;
  updateDragonFinale(dt);
  updateAbilities(dt, k);
  if(stageBoss?.enemy.hp<=0&&stageBoss.enemy.rewarded){updateRunProgress(0);if(!running||paused||bossLootLocked())return;}
  if(updateBossEncounter(dt))return;
  updateArenaSecrets(dt);
  updateWeaponDelivery(activeMs);
  if (P.stagePulse > 0) P.stagePulse = Math.max(0, P.stagePulse - dt);
  if (shake > 0) shake = Math.max(0, shake - dt * .045);
  if (xpBoost > 0) xpBoost -= dt;
  if (P.muzzle > 0) P.muzzle -= dt;
  if (P.hasteT > 0) P.hasteT -= dt;
  P.spin = (P.spin || 0) + (P.spinV || 0) * k;
  P.spinV = (P.spinV || 0) * .93;
  if (P.invT > 0) P.invT -= dt;

  if (pointer.active && !ult.on && !dragonFinale) {
    const dx = pointer.x - P.x, dy = pointer.y - P.y, d = Math.hypot(dx, dy);
    if (d > 5) {
      const hs = P.hasteT > 0 ? 1.6 : 1;
      const v = Math.min(P.speed * hs * k, d);
      P.x += dx / d * v; P.y += dy / d * v; P.phase += .27 * hs * k;
      P.run += (1 - P.run) * .06 * k;          // плавно набирает
      P.stepT = (P.stepT || 0) - dt;
      if (P.stepT <= 0) {                         // пыль из-под ног при беге
        P.stepT = 190 / hs;
        puffs.push({ x: P.x + rnd(-7, 7), y: P.y + 15, vx: rnd(-.5, .5),
                     vy: rnd(-.5, -.1), life: .55, r: rnd(2, 4) });
      }
      if (P.hasteT > 0) {                         // след при ускорении
        P.ghostT = (P.ghostT || 0) - dt;
        if (P.ghostT <= 0) {
          P.ghostT = 58;
          P.ghosts = P.ghosts || [];
          P.ghosts.push({ x: P.x, y: P.y, ph: P.phase, face: P.face, life: 1 });
          if (P.ghosts.length > 4) P.ghosts.shift();
        }
      }
      if (Math.abs(dx) > 1) P.face = dx > 0 ? 1 : -1;
    }
  }
  else P.run += (0 - P.run) * .05 * k;       // и плавно гаснет
  if (P.ghosts) { for (const g2 of P.ghosts) g2.life -= dt / 210;
                  P.ghosts = P.ghosts.filter(g2 => g2.life > 0); }
  if (P.recoilT > 0) P.recoilT -= dt;
  pushOut(P);
  if (P.hurt > 0) P.hurt -= dt;
  P.orbA += .055 * k;
  cam.x = Math.max(0, Math.min(WORLD - W, P.x - W / 2));
  cam.y = Math.max(0, Math.min(WORLD - H, P.y - H / 2));

  if (!dragonFinale) {
    spawnT -= dt;
    if (spawnT <= 0 && enemies.length < 140) {
      const stage = Math.max(1, P.stage || 1);
      spawnT=stageSpawnInterval(stage,P.stageMs);
      spawn(stageEnemyKind(stage,Math.random(),Math.random()));
    }
    eliteT -= dt; if (eliteT <= 0 && (isBossStage(P.stage)||stageTempo(P.stage,P.stageMs).phase!=='breather')) {
      eliteT = stageWave(P.stage).eliteInterval*(typeof campModifier==='function'?campModifier('eliteInterval'):1); if(!isBossStage(P.stage)){spawn("elite");shake=10;}
    }
    chestT -= dt; if (chestT <= 0) { chestT = 13000 - meta.luck * 2200; spawnChest(); }
    healT -= dt; if (healT <= 0) { healT = 15000; spawnHeart(); }
  }

  for (const h of pickups) {
    h.a += .05 * k;
    if (dist(h, P) >= 34) continue;
    h.dead = true;
    if (h.kind === "heart") {
      if (P.hp < P.hpMax) { P.hp=Math.min(P.hpMax,P.hp+1); pops.push({ x: P.x, y: P.y - 52, txt: "+1", life: 1.2, col: "#c8402c" }); }
      else { gainXP(150); pops.push({ x:P.x, y:P.y-52, txt:"XP +150", life:1.2, col:"#c79018" }); }
      SFX.pickup?.(h.x);
    } else if (h.kind === "haste") {
      P.hasteT = 7000;
      pops.push({ x: P.x, y: P.y - 52, txt: gameText("УСКОРЕНИЕ","HASTE"), life: 1.4, col: "#a8761a" });
      SFX.pickup?.(h.x);
    } else {
      P.invT = 6000; P.seen = { x: P.x, y: P.y };
      pops.push({ x: P.x, y: P.y - 52, txt: gameText("НЕУЯЗВИМОСТЬ","INVULNERABLE"), life: 1.4, col: "#2f7d9c" });
      SFX.pickup?.(h.x);
    }
  }
  pickups = pickups.filter(h => !h.dead);

  for (const ic of ices) ic.life -= dt;
  ices = ices.filter(i => i.life > 0);
  updateCompassStorm(dt);
  if(updateEnemyHazards(dt))return;
  const drummers=enemies.filter(e=>e.kind==='drummer'&&e.hp>0);
  enemyRouteBudget=2; // Spread path searches across frames in a large crowd.

  for (const e of enemies) {
    if(e.hp<=0||e.stormCaught)continue;
    const bodyStartX=e.x,bodyStartY=e.y;
    enemyResolveRocks(e);
    let tankTarget = null, tankDistance = 1e9;
    for (const q of allyTanks) {
      if (q.dead || q.hp <= 0) continue;
      const d = Math.hypot(q.x-e.x,q.y-e.y);
      if (d < tankDistance && d < 430) { tankDistance=d; tankTarget=q; }
    }
    let slow = 1;
    for (const ic of ices) if (Math.hypot(e.x - ic.x, e.y - ic.y) < ic.r) {
      slow = .34; e.slip = 1; e.hp -= dt / 1000 * 1.4;
    }
    if (e.hp <= 0) { popEnemy(e); continue; }
    // Pursuit and attack timers keep running during hit reactions.
    {
      const tx = tankTarget ? tankTarget.x : P.invT > 0 ? P.seen.x : P.x;
      const ty = tankTarget ? tankTarget.y : P.invT > 0 ? P.seen.y : P.y;
      const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy) || 1;
      let intent=enemyMovementIntent(e,tx,ty,dt);
      e.rallied=e.kind!=='drummer'&&drummers.some(d=>d.hp>0&&dist(d,e)<180);
      if(e.rallied)intent.pace*=1.16;
      if(P.invT>0&&!intent.locked){intent.vx+=Math.cos(t/300+e.bob)*.5;intent.vy+=Math.sin(t/300+e.bob)*.5;}
      intent=enemyRockIntent(e,tx,ty,intent,dt);
      const {vx,vy}=intent;
      const j = e.slip > 0 ? rnd(-.6, .6) : 0;
      const vl = Math.hypot(vx, vy) || 1;
      const rockHit=enemyDisplace(e,(vx/vl+j)*e.speed*slow*k*intent.pace,(vy/vl+j)*e.speed*slow*k*intent.pace);
      if(rockHit&&(e.kind==='dasher'||e.boss)&&e.attackState==='dash'){
        e.attackState='recover';e.attackT=e.boss?750:550;e.attackCd=2600;
        if(e.boss)openBossWindow(e,e.bossSpec.id==='bruiser'?1200:750,'stagger');
      }
      if(e.kb>0){
        // Ordinary impacts slow the advance, but cannot indefinitely pin a survivor.
        const recoil=Math.min(e.kb,e.speed*slow*intent.pace*.65)*k;
        enemyDisplace(e,e.kbx*recoil,e.kby*recoil);
        e.kb*=Math.pow(.82,k);
        if(e.kb<.025)e.kb=0;
      }
      e.face = dx > 0 ? 1 : -1;
    }
    const baseKind=enemyBaseKind(e.kind);
    const anim = baseKind === 'runner' ? .30 : baseKind === 'tank' ? .13 : baseKind === 'elite' ? .17 : .23;
    if(e.boss){const travel=Math.hypot(e.x-bodyStartX,e.y-bodyStartY);e.moveBlend=(e.moveBlend||0)+(Math.min(1,travel/Math.max(.1,e.speed*k))-(e.moveBlend||0))*Math.min(1,dt/120);e.phase+=travel/Math.max(1,e.r/11*3.8);}
    else e.phase += (anim * slow + (e.slip > 0 ? .3 : 0)) * k;
    if (e.slip > 0) e.slip -= dt / 500;
    if (e.flash > 0) e.flash -= dt;
    if (e.poison > 0) e.poison -= dt;
    if (e.flinch > 0) e.flinch -= dt / 170;
    if (e.orbCd > 0) e.orbCd -= dt;
    if (tankTarget && Math.hypot(e.x-tankTarget.x,e.y-tankTarget.y) < e.r+tankTarget.r+3) {
      if (tankTarget.hurt <= 0) {
        const base = baseKind === "elite" ? 5 : baseKind === "tank" ? 2.4 : baseKind === "runner" ? 1.15 : .8;
        const dmg = base * (1 + (P.stage - 1) * .10);
        tankTarget.hp = Math.max(0, tankTarget.hp - dmg); tankTarget.hurt = 300;
        pops.push({x:tankTarget.x,y:tankTarget.y-38,txt:"-"+Math.round(dmg),life:.75,col:FOE});
        shake=Math.max(shake,e.kind==="elite"?9:3);
      }
      const a=Math.atan2(e.y-tankTarget.y,e.x-tankTarget.x);
      e.kb=2.8;e.kbx=Math.cos(a);e.kby=Math.sin(a);
      continue;
    }
    if (dist(e, P) < P.r + e.r && P.hurt <= 0 && P.invT <= 0 && !dragonFinale) {
      // мелкие снимают половину сердца, крупные — больше
      const base = baseKind === "elite" ? 1.5 : baseKind === "tank" ? 1 : .5;
      const dmg = e.boss?1+P.stage/10:Math.min(2.5, base + Math.floor((P.stage - 1) / 3) * .5);
      if(hurtHero(dmg,e,true))return;
    }
  }
  // мягкое расталкивание через сетку, иначе толпа слипается и стоит
  const cell = 48, grid = new Map();
  for (const e of enemies) {
    const key = ((e.x / cell) | 0) + "," + ((e.y / cell) | 0);
    if(e.hp<=0||e.stormCaught)continue;
    (grid.get(key) || grid.set(key, []).get(key)).push(e);
  }
  for (const e of enemies) {
    const cx2 = (e.x / cell) | 0, cy2 = (e.y / cell) | 0;
    if(e.hp<=0||e.stormCaught)continue;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const list = grid.get((cx2 + a) + "," + (cy2 + b)); if (!list) continue;
      for (const o of list) {
        if (o === e) continue;
        const dx = e.x - o.x, dy = e.y - o.y, d = Math.hypot(dx, dy), m = e.r + o.r;
        if (d < m && d > .01) {
          const push = (m - d) * .35;
          enemyDisplace(e,dx/d*push,dy/d*push);
        }
      }
    }
  }
  enemies = enemies.filter(e => e.hp > 0);

  updatePet(dt, k);
  updateFarm(dt, k);

  for (const m of mines) {
    if(m.mini){m.ttl=(m.ttl??11000)-dt;if(m.ttl<=0){m.dead=true;continue;}}
    if (m.arm > 0) { m.arm -= dt; continue; }
    for (const e of enemies) if (petEnemyAlive(e)&&Math.hypot(e.x - m.x, e.y - m.y) < e.r + (m.mini ? 18 : 26)) { m.dead = true; explode(m.x, m.y, m.mini ? (m.blastR||72) : 130, m.mini ? m.dmg : 9,m.mini?'mineMini':'mineBlast'); break; }
  }
  mines = mines.filter(m => !m.dead);
  for (const g of nades) {
    g.x += g.vx * k; g.y += g.vy * k; g.vx *= .965; g.vy *= .965; g.fuse -= dt;
    if (g.fuse <= 0) { g.dead = true;triggerArenaSecret('nade',g.x,g.y,155);explode(g.x, g.y, 155, 7,'grenadeBlast'); }
  }
  nades = nades.filter(g => !g.dead);

  updateHeroFire(dt);
  updateHeroProjectiles(dt,k);
  enemies = enemies.filter(e => e.hp > 0);

  for (const c of chests) {
    c.a += .04 * k;
    if(c.dead)continue;
    c.retryT=Math.max(0,(c.retryT||0)-dt);
    if(c.elite){
      if(c.dropT>0){c.dropT=Math.max(0,c.dropT-dt);
        if(c.dropT===0){SFX.crateLand?.(c.x);shake=Math.max(shake,7);
          pops.push({x:c.x,y:c.y-60,txt:gameText('ЭЛИТНЫЙ СУНДУК','ELITE CHEST'),life:2,col:'#8650b1'});}
        continue;
      }
      if(c.landT>0){c.landT=Math.max(0,c.landT-dt);continue;}
    }
    if (dist(c, P) < 42) {
      if(c.elite){if(grantEliteChestReward(c))c.dead=true;continue;}
      if(c.rare){if(grantRandomAbility(c.x,c.y,c))c.dead=true;continue;}
      c.dead = true;
      P.item = c.item;
      SFX.pickup?.(c.x);
      pops.push({ x: P.x, y: P.y - 48, txt: ITEMS[c.item].name, life: 1.4, col: ITEMS[c.item].col });
    }
  }
  chests = chests.filter(c => !c.dead);

  for (const c of corpses) {
    if (c.mode === "launch") {                            // бросок с дугой
      c.t += dt;
      if (c.style === "scopefall") {                      // замедленное падение внутри оптики
        c.x += c.vx * k; c.y += (.16 + c.vy) * k;
        c.z = Math.max(0, 10 - c.t / 210); c.tilt += c.spin * k;
        c.life -= dt / 1000;
        c.trail.push({ x:c.x, y:c.y, z:c.z, tilt:c.tilt });
        if(c.trail.length>7)c.trail.shift();
        continue;
      }
      c.x += c.vx * k; c.y += c.vy * k;
      c.z += c.vz * k; c.vz -= .40 * k;
      c.tilt += c.spin * k;
      if (c.style === "camera") {
        c.vz *= .995;                                     // летит на зрителя, не падает
      } else if (c.z <= 0 && c.vz < 0) {
        c.z = 0;
        if (c.landed < 2) {                               // отскок от земли
          c.landed++;
          c.vz = -c.vz * (c.landed === 1 ? .34 : .12);
          c.vx *= .45; c.vy *= .45; c.spin *= .3;
          for (let i = 0; i < 7; i++) {
            const an = Math.random() * 6.28, sp2 = rnd(.6, 2.2);
            puffs.push({ x: c.x, y: c.y, vx: Math.cos(an) * sp2, vy: Math.sin(an) * sp2,
                         life: .8, r: rnd(2, 4) });
          }
        } else { c.vz = 0; c.vx *= .80; c.vy *= .80; }    // скользит и замирает
      }
      c.trail.push({ x: c.x, y: c.y, z: c.z, tilt: c.tilt });
      if (c.trail.length > 5) c.trail.shift();
      c.life -= dt / 1000;
      continue;
    }
    c.life -= dt / 1000;
    c.x += c.vx * k; c.y += c.vy * k;
    c.vx *= .90; c.vy *= .90;
    if (c.mode === "tumble") { c.rot += c.rotV * k; c.vy += .14 * k; }
    if (c.mode === "fall") c.rot += (1.5 - c.rot) * .09 * k;
    if (c.mode === "blast") c.rot += .06 * k;
  }
  corpses = corpses.filter(c => c.life > 0);

  for (const p of puffs) { p.x += p.vx * k; p.y += p.vy * k; p.vx *= .92; p.vy *= .92; p.life -= dt / 430; }
  puffs = puffs.filter(p => p.life > 0);
  for (const p of pops) { p.y -= .55 * k; p.life -= dt / 750; }
  pops = pops.filter(p => p.life > 0);
  for (const b of booms) { b.r += (b.max - b.r) * Math.min(1,.22 * k); b.life -= dt / (b.duration||380); }
  booms = booms.filter(b => b.life > 0);
  for (const f of flashes) { f.r += (f.max - f.r) * .34 * k; f.life -= dt / 320; }
  flashes = flashes.filter(f => f.life > 0);
  updateDragonAltar(dt);
  if(stageBoss?.enemy.hp<=0&&stageBoss.enemy.rewarded){updateRunProgress(0);if(!running||bossLootLocked())return;}
  if (queuedLevels > 0 && !paused && !ult.on && !dragonFinale && !compassStorm) { SFX.level(); offerCards(); }
}
function gainXP(amount) {
  if (dragonFinale) return;
  // После полной сборки остаётся свободный бой на достигнутой стадии.
  // Опыт больше не открывает пустые карточки и не запускает финал.
  if(heroBuildComplete()){
    P.xp=P.xpNext;queuedLevels=0;return;
  }
  amount = Math.max(1, Math.floor(amount || 1));
  const awarded = Math.max(1, Math.round(amount * (xpBoost > 0 ? 2 : 1) * (P.xpMult || 1)));
  P.xp += awarded;
  // Re-evaluate every hero threshold; overflow survives multiple level-ups.
  while (P.xp >= P.xpNext) {
    P.xp -= P.xpNext;
    P.lvl++;
    P.xpNext = heroXPRequired(P.lvl);
    queuedLevels++;
    applyGear();
    P.hp = Math.min(P.hpMax, P.hp + 1);
  }
  if (P.xp < 0) P.xp = 0;                       // страховка от отрицательной полоски
}
