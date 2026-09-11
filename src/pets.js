"use strict";
/* pets.js — логика питомцев, яиц и цыплят */

function petEnemyAlive(e) { return e.hp > 0 && !e.rewarded && !e.stormCaught; }
function petNearest(x,y,range,leash=420) {
  let target=null, best=range;
  for(const e of enemies){
    if(!petEnemyAlive(e)||Math.hypot(e.x-P.x,e.y-P.y)>leash)continue;
    const d=Math.hypot(e.x-x,e.y-y);if(d<best){best=d;target=e;}
  }
  return target;
}
// Test the whole swept segment, not just its endpoint. Same rock hull as pushOut.
function petPathClear(ax,ay,bx,by,r) {
  if(bx<r||by<r||bx>WORLD-r||by>WORLD-r)return false;
  const dx=bx-ax,dy=by-ay,len=dx*dx+dy*dy;
  for(const o of props){
    const t=len?Math.max(0,Math.min(1,((o.x-ax)*dx+(o.y-ay)*dy)/len)):0;
    if(Math.hypot(ax+dx*t-o.x,ay+dy*t-o.y)<o.r*.78+r-.01)return false;
  }
  return true;
}
// Small on-demand A*: cached waypoints keep the chosen detour stable around rocks.
// No teleport fallback. If an area is sealed off, wait/retry or return to the owner.
function petRoute(p,tx,ty) {
  const step=36,r=p.r||7,ox=p.x,oy=p.y;
  const nodes=new Map(),open=[];
  const first={ix:0,iy:0,x:ox,y:oy,g:0,h:Math.hypot(tx-ox,ty-oy),parent:null};
  open.push(first);nodes.set('0,0',first);let end=null;
  for(let tries=0;open.length&&tries<1400;tries++){
    let bi=0;for(let i=1;i<open.length;i++)if(open[i].g+open[i].h<open[bi].g+open[bi].h)bi=i;
    const n=open.splice(bi,1)[0];n.closed=true;
    if(n.h<64&&petPathClear(n.x,n.y,tx,ty,r)){end=n;break;}
    for(let iy=-1;iy<=1;iy++)for(let ix=-1;ix<=1;ix++){
      if(!ix&&!iy)continue;
      const nx=n.ix+ix,ny=n.iy+iy,key=nx+','+ny,x=ox+nx*step,y=oy+ny*step;
      let next=nodes.get(key);if(next?.closed)continue;
      if(!petPathClear(n.x,n.y,x,y,r))continue;
      const cost=n.g+Math.hypot(ix,iy)*step;
      if(!next){next={ix:nx,iy:ny,x,y,g:Infinity,h:Math.hypot(tx-x,ty-y)};nodes.set(key,next);open.push(next);}
      if(cost<next.g){next.g=cost;next.parent=n;}
    }
  }
  if(!end)return [];
  const route=[{x:tx,y:ty}];for(let n=end;n.parent;n=n.parent)route.unshift({x:n.x,y:n.y});
  return route;
}
function petMove(p,tx,ty,speed,k,flying=false) {
  const d=Math.hypot(tx-p.x,ty-p.y),r=p.r||7;
  if(d<4)return d;
  p.navWait=Math.max(0,(p.navWait||0)-k*16.67);
  let goal={x:tx,y:ty};
  if(!flying&&!petPathClear(p.x,p.y,tx,ty,r)){
    const changed=!p.navGoal||Math.hypot(tx-p.navGoal.x,ty-p.navGoal.y)>64;
    if(!p.navWait&&(changed||!p.nav?.length)){
      p.nav=petRoute(p,tx,ty);p.navGoal={x:tx,y:ty};p.navWait=650;
    }
    if(!p.nav?.length)return d;
    while(p.nav.length>1&&petPathClear(p.x,p.y,p.nav[1].x,p.nav[1].y,r))p.nav.shift();
    goal=p.nav[0];
    if(Math.hypot(goal.x-p.x,goal.y-p.y)<4){p.nav.shift();goal=p.nav[0];if(!goal)return d;}
  }else p.nav=null;
  const dx=goal.x-p.x,dy=goal.y-p.y,dist=Math.hypot(dx,dy)||1,move=Math.min(dist,speed*k);
  const x=p.x+dx/dist*move,y=p.y+dy/dist*move;
  if(flying||petPathClear(p.x,p.y,x,y,r)){p.x=x;p.y=y;if(Math.abs(dx)>1)p.face=dx>0?1:-1;}
  else {p.nav=null;}
  return d;
}
function updatePetTurrets(dt,S) {
  for(const tu of turrets){
    tu.life-=dt;tu.cd-=dt;if(tu.life<=0)continue;
    const e=petNearest(tu.x,tu.y,260,600);if(!e)continue;
    tu.a=Math.atan2(e.y-(tu.y-6),e.x-tu.x);
    if(tu.cd<=0){
      tu.cd=S.turCd;beep(660,.04,'square',.014,-220);
      shots.push({x:tu.x+Math.cos(tu.a)*14,y:tu.y-6+Math.sin(tu.a)*14,
        vx:Math.cos(tu.a)*7,vy:Math.sin(tu.a)*7,a:tu.a,life:650,dmg:S.turDmg,source:'pet'});
    }
  }
  turrets=turrets.filter(t=>t.life>0);
}
function boarDetonate(p,S) {
  explode(p.x,p.y,S.boarR,S.boarDmg);
  Object.assign(booms[booms.length-1],{style:'boar',duration:720,seed:p.phase});
  p.hp=0;p.dead=p.reviveMs;p.fuse=0;p.chargeTarget=null;p.nav=null;
}

function updatePet(dt, k) {
  const p = P.pet; if (!p) return;
  const S = petStats(p);
  updatePetTurrets(dt,S); // Independent lifetime/attacks, including recall and revival.
  if (p.dead > 0) {                       // ждём воскрешения
    p.dead -= dt;
    if (p.dead <= 0) {
      p.hpMax = S.hp; p.hp = p.hpMax;
      p.x = P.x + rnd(-30, 30); p.y = P.y + rnd(-30, 30);
      pushOut(p);p.nav=null;p.chargeTarget=null;p.fuse=0;p.hurt=1500;
      p.state = "up"; p.timer = 1200; p.burrow=null;p.emergeT=0;SFX.revive();
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * 6.28;
        puffs.push({ x: p.x, y: p.y, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2, life: 1, r: rnd(2, 5) });
      }
    }
    return;
  }
  if (p.hurt > 0) p.hurt -= dt;
  p.saw += .5 * k; p.phase += .3 * k;
  if (p.bite > 0) p.bite -= dt;
  if (p.cd > 0) p.cd -= dt;

  const nearest = (x, y, rng) => {
    let b = null, bd = rng;
    for (const e of enemies) { if(!petEnemyAlive(e))continue;const d = Math.hypot(e.x - x, e.y - y); if (d < bd) { bd = d; b = e; } }
    return b;
  };
  const flying = p.type === "parrot";
  if (p.recall > 0 && !(p.type==='mole'&&p.state==='down')) { // underground exit stays reserved
    p.recall -= dt;
    const dx = P.x - p.x, dy = P.y - p.y, d = Math.hypot(dx, dy);
    if (d > 40) {
      petMove(p,P.x,P.y,4.6,k,flying);
      p.face = dx > 0 ? 1 : -1; p.phase += .4 * k;
      if (!flying) pushOut(p);
      return;
    }
    p.recall = 0;
  }
  const goto = (tx,ty,sp) => petMove(p,tx,ty,sp,k,flying);

  if (p.type === "dog") {
    // собака держится рядом с хозяином: дальше поводка не уходит
    const LEASH = 200;
    const homeX = P.x - P.face * 36, homeY = P.y + 20;
    const fromOwner = Math.hypot(p.x - P.x, p.y - P.y);

    let tg = null;
    if (fromOwner < LEASH) {
      let bd = 180;
      for (const e of enemies) {
        if(!petEnemyAlive(e))continue;
        if (Math.hypot(e.x - P.x, e.y - P.y) > LEASH) continue;   // цель тоже должна быть рядом
        const d = Math.hypot(e.x - p.x, e.y - p.y);
        if (d < bd) { bd = d; tg = e; }
      }
    }

    if (fromOwner > LEASH) {
      goto(P.x, P.y, 3.1);                                        // отбежала — возвращается
    } else if (tg) {
      if(Math.hypot(tg.x-p.x,tg.y-p.y)>tg.r+13)goto(tg.x, tg.y, 3.7);
      if (p.cd<=0 && Math.hypot(tg.x - p.x, tg.y - p.y) < tg.r + 19) {
        hit(tg, S.dogDmg, p.x, p.y); p.cd = S.dogCd; p.bite = 220; SFX.bite();
      }
    } else if (Math.hypot(homeX - p.x, homeY - p.y) > 28) {
      goto(homeX, homeY, 2.5);                                    // трусит у ноги
    }

  } else if (p.type === "cat") {
    const bx = P.x - P.face * 44, by = P.y + 16;
    if (Math.hypot(bx - p.x, by - p.y) > 16) goto(bx, by, 3.0);
    const tg = nearest(p.x, p.y, 250);
    if (tg) {
      p.aim = Math.atan2(tg.y - (p.y - 14), tg.x - p.x);
      if (p.cd <= 0) {
        p.cd = S.catCd; beep(900, .035, "square", .015, -300);
        shots.push({ x: p.x + Math.cos(p.aim) * 16, y: p.y - 14 + Math.sin(p.aim) * 16,
                     vx: Math.cos(p.aim) * 7.6, vy: Math.sin(p.aim) * 7.6,
                     a: p.aim, life: 620, dmg: S.catDmg, source:'pet' });
      }
    }

  } else if (p.type === "parrot") {
    p.a += .028 * k;
    goto(P.x + Math.cos(p.a) * 96, P.y - 30 + Math.sin(p.a) * 62, 4.2);
    p.drop -= dt;
    const mine = mines.filter(m => m.mini).length;
    if (p.drop <= 0 && mine < S.mineCap) {
      p.drop = S.dropCd;
      mines.push({ x: p.x, y: p.y + 26, arm: 500, mini: true, dmg: S.mineDmg, blastR:S.mineR, ttl:11000 });
    }

  } else if (p.type === "boar") {
    let tg=p.chargeTarget;
    const valid=e=>e&&enemies.includes(e)&&petEnemyAlive(e)&&Math.hypot(e.x-P.x,e.y-P.y)<420;
    if(!valid(tg)||p.fuse>5500||Math.hypot(p.x-P.x,p.y-P.y)>480){
      if(tg&&p.fuse>5500){p.ignoredTarget=tg;p.retryCd=2000;}
      tg=null;p.chargeTarget=null;p.fuse=0;
    }
    p.retryCd=Math.max(0,(p.retryCd||0)-dt);
    if(!tg&&Math.hypot(p.x-P.x,p.y-P.y)<400){
      let best=Infinity;
      for(const e of enemies){
        if(!valid(e)||(p.retryCd>0&&e===p.ignoredTarget))continue;
        const d=Math.hypot(e.x-p.x,e.y-p.y);if(d>380)continue;
        const priority=d*((enemyBaseKind(e.kind)==='tank'||e.kind==='elite')?.55:1);
        if(priority<best){best=priority;tg=e;}
      }
      if(tg){p.chargeTarget=tg;p.fuse=0;p.nav=null;}
    }
    if(tg){
      p.fuse=(p.fuse||0)+dt;
      // Readable 0.32s wind-up, then accelerating charge with a locked target.
      if(p.fuse>320)goto(tg.x,tg.y,Math.min(5.4,3.6+(p.fuse-320)/700));
      if(p.fuse>320&&Math.hypot(tg.x-p.x,tg.y-p.y)<tg.r+22){boarDetonate(p,S);return;}
    }else if(Math.hypot(P.x-p.x,P.y-p.y)>60)goto(P.x,P.y,4.0);

  } else if (p.type === "chicken") {
    const hx = P.x - P.face * 42, hy = P.y + 24;
    if (Math.hypot(hx - p.x, hy - p.y) > 26) goto(hx, hy, 2.6);
    p.drop -= dt;
    if (p.drop <= 0 && eggs.length + chicks.length < S.eggCap) {
      p.drop = S.eggCd;
      // Guaranteed mixed squad, at most one healer (including unhatched eggs).
      const healer=[...eggs,...chicks].some(c=>c.kind==='green'&&!c.dead&&c.hp!==0);
      p.eggSerial=(p.eggSerial||0)+1;
      const kind=!healer&&p.eggSerial%3===0?'green':p.eggSerial%3===2?'red':'yellow';
      eggs.push({ x: p.x - p.face * 12, y: p.y + 5, t: 1500, wob: 0, kind });
      beep(880, .06, "sine", .035, 180);
    }

  } else if (p.type === "mole") {
    p.emergeT=Math.max(0,(p.emergeT||0)-dt);
    p.timer -= dt;
    if (p.state === "up") {
      if (p.timer <= 0) {
        let goal=null;
        for(let i=0;i<32;i++){
          const a=Math.random()*Math.PI*2,d=rnd(70,Math.min(210,Math.max(90,Math.min(W,H)*.4))),x=P.x+Math.cos(a)*d,y=P.y+Math.sin(a)*d;
          if(x<40||y<40||x>WORLD-40||y>WORLD-40||Math.hypot(x-p.x,y-p.y)<55)continue;
          if(props.some(o=>Math.hypot(o.x-x,o.y-y)<o.r+p.r+12))continue;
          goal={x,y};break;
        }
        if(goal){
          if(turrets.length<S.turCap)turrets.push({x:p.x,y:p.y,life:13000,cd:0,a:0});
          p.burrow={from:{x:p.x,y:p.y},to:goal,elapsed:0,duration:Math.max(1300,Math.hypot(goal.x-p.x,goal.y-p.y)/.20)};
          p.state='down';p.timer=p.burrow.duration;SFX.build();
          for(let i=0;i<6;i++)puffs.push({x:p.x,y:p.y,vx:rnd(-1.3,1.3),vy:rnd(-1,0),life:.6,r:rnd(2,3)});
        }else p.timer=400; // crowded map: wait above ground, never choose an unsafe exit
      }
    } else if(p.burrow){
      const b=p.burrow;b.elapsed=Math.min(b.duration,b.elapsed+dt);
      const u=b.elapsed/b.duration;
      p.x=b.from.x+(b.to.x-b.from.x)*u;p.y=b.from.y+(b.to.y-b.from.y)*u;
      p.face=b.to.x>=b.from.x?1:-1;
      if(u>=1){
        p.state='up';p.timer=1700;p.emergeT=420;p.burrow=null;
        for(let i=0;i<9;i++){const a=Math.random()*Math.PI*2;puffs.push({x:p.x,y:p.y,vx:Math.cos(a)*1.6,vy:Math.sin(a)*1.6-.5,life:.8,r:rnd(2,4)});}
      }
    }else {p.state='up';p.timer=400;}
  }

  if (p.dead > 0) return;
  const underground=p.type==='mole'&&p.state==='down';
  if(!underground&&!flying)pushOut(p); // flying parrot and mole tunnel pass above/below rocks

  // урон питомцу
  for (const e of underground?[]:enemies) {
    if(!petEnemyAlive(e))continue;
    if (Math.hypot(e.x - p.x, e.y - p.y) < e.r + p.r && p.hurt <= 0) {
      p.hp--; p.hurt = 900;
      pops.push({ x: p.x, y: p.y - 28, txt: "-1", life: .9, col: "#c8402c" });
      if (p.hp <= 0) {
        p.dead = p.reviveMs; SFX.dead();
        for (let i = 0; i < 14; i++) {
          const a = Math.random() * 6.28, sp = rnd(.8, 2.6);
          puffs.push({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, r: rnd(2, 5) });
        }
      }
      break;
    }
  }

}

function updateFarm(dt, k) {
  const S = petStats(P.pet || {type:'chicken',lvl:1});
  if(P.pet)P.pet.healLock=Math.max(0,(P.pet.healLock||0)-dt);
  for (const eg of eggs) {
    eg.t -= dt; eg.wob += dt / 110;
    if (eg.t <= 0) {
      eg.dead = true;
      const ch={ x: eg.x, y: eg.y, r:7, hp:4, hurt:1000, life:22000, cd:0,
                    phase:rnd(0,6), face:1, kind:eg.kind, healCd:5000 };
      pushOut(ch);chicks.push(ch);
      beep(1150, .07, "triangle", .04, 260);
      for (let i = 0; i < 5; i++) {
        const a = Math.random() * 6.28;
        puffs.push({ x: eg.x, y: eg.y, vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 1.2, life: .7, r: rnd(2, 3.5) });
      }
    }
  }
  eggs = eggs.filter(e => !e.dead);

  for (const ch of chicks) {
    ch.life -= dt; ch.phase += .34 * k;
    if(ch.life<=0||ch.hp<=0)continue;
    if (ch.cd > 0) ch.cd -= dt;
    if (ch.hurt > 0) ch.hurt -= dt;
    let tg = null, bd = 210;
    for (const e of enemies) {
      if(!petEnemyAlive(e)||Math.hypot(e.x-P.x,e.y-P.y)>260||Math.hypot(ch.x-P.x,ch.y-P.y)>330)continue;
      const d = Math.hypot(e.x - ch.x, e.y - ch.y);
      if (d < bd) { bd = d; tg = e; }
    }
    const go = (tx,ty,sp) => petMove(ch,tx,ty,sp,k);
    if (ch.kind === "red") {                      // подрывник
      if (tg) {
        go(tg.x, tg.y, 3.1);
        if (Math.hypot(tg.x-ch.x,tg.y-ch.y) < tg.r + 12) {
          const lv = P.pet ? P.pet.lvl : 1;
          explode(ch.x, ch.y, 58 + 7 * lv, S.chickBlast);
          ch.hp = 0;
        }
      } else if (Math.hypot(P.x - ch.x, P.y - ch.y) > 90) go(P.x, P.y, 2.5);

    } else if (ch.kind === "green") {             // лекарь
      const hx2 = P.x - 34, hy2 = P.y + 26;
      if (Math.hypot(hx2 - ch.x, hy2 - ch.y) > 20) go(hx2, hy2, 2.5);
      ch.healCd -= dt;
      if (ch.healCd <= 0 && Math.hypot(P.x-ch.x,P.y-ch.y)<110 && !(P.pet?.healLock>0)) {
        if (P.hp < P.hpMax) {
          ch.healCd=9000;if(P.pet)P.pet.healLock=9000;
          P.hp = Math.min(P.hpMax, P.hp + .5);
          pops.push({ x: P.x, y: P.y - 52, txt: "+½", life: 1.2, col: "#4e8f4a" });
          chain([700, 950], "sine", .05);
          for (let i = 0; i < 6; i++) {
            const a = Math.random() * 6.28;
            puffs.push({ x: ch.x, y: ch.y - 8, vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 1.2 - .6, life: .9, r: rnd(2, 3.4) });
          }
        }
      }

    } else if (tg) {                              // жёлтый с ножиком
      if(Math.hypot(tg.x-ch.x,tg.y-ch.y)>tg.r+9)go(tg.x, tg.y, 3.5);
      if (Math.hypot(tg.x-ch.x,tg.y-ch.y) < tg.r + 15 && ch.cd <= 0) {
        hit(tg, S.chickDmg, ch.x, ch.y);
        ch.cd = 560; ch.slash = 200;
        beep(1300, .04, "square", .02, -300);
      }
    } else if (Math.hypot(P.x - ch.x, P.y - ch.y) > 90) {
      go(P.x, P.y, 2.4);
    }
    if (ch.slash > 0) ch.slash -= dt;

    for (const e of enemies) {
      if(!petEnemyAlive(e))continue;
      if (ch.hurt <= 0 && Math.hypot(e.x - ch.x, e.y - ch.y) < e.r + 8) {
        ch.hp--; ch.hurt = 700; break;
      }
    }
  }
  chicks = chicks.filter(c => c.hp > 0 && c.life > 0);
}
