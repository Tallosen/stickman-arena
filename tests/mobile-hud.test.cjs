const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createCanvas } = require('@napi-rs/canvas');
const make = require('./arena-harness.cjs');

const root = path.join(__dirname, '..');
const ui = fs.readFileSync(path.join(root, 'src/ui.js'), 'utf8');
const frames = process.argv.includes('--frames');
const zeroSafe = { top: 0, right: 0, bottom: 0, left: 0 };
const cases = [[280,568], [320,568], [390,844], [568,320], [640,360], [844,390]]
  .map(([width,height]) => ({ width, height, safe: zeroSafe, suffix: '' }));
cases.push({ width:390, height:844, safe:{ top:47, right:0, bottom:34, left:0 }, suffix:'-safe' });
cases.push({ width:844, height:390, safe:{ top:0, right:44, bottom:21, left:44 }, suffix:'-safe' });
const failures = [];
let rendered = 0;

const overlaps = (a,b) => a.x < b.x+b.w-.1 && a.x+a.w > b.x+.1 && a.y < b.y+b.h-.1 && a.y+a.h > b.y+.1;
const inside = (a,b,tolerance=1) => a.x >= b.x-tolerance && a.y >= b.y-tolerance && a.x+a.w <= b.x+b.w+tolerance && a.y+a.h <= b.y+b.h+tolerance;
const check = (condition,message) => { if (!condition) failures.push(message); };
const rect = (name,x,y,w,h) => ({ name,x,y,w,h });

// Native text measurement catches unbounded labels and wrapped text outside its card.
function observe(g) {
  const state = { group:'', rects:[], texts:[] };
  const map = (x,y,w,h) => {
    const t=g.getTransform(), a={x:t.a*x+t.c*y+t.e,y:t.b*x+t.d*y+t.f};
    const b={x:t.a*(x+w)+t.c*(y+h)+t.e,y:t.b*(x+w)+t.d*(y+h)+t.f};
    return {x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(b.x-a.x),h:Math.abs(b.y-a.y)};
  };
  for (const method of ['roundRect','fillRect']) {
    const original=g[method].bind(g);
    g[method]=(...args) => {
      if (state.group) state.rects.push({group:state.group,kind:method,...map(...args),fill:g.fillStyle});
      return original(...args);
    };
  }
  const originalText=g.fillText.bind(g);
  g.fillText=(text,x,y,maxWidth) => {
    if (state.group) {
      const m=g.measureText(String(text)), w=Math.min(m.width,Number.isFinite(maxWidth)?maxWidth:Infinity);
      const left=g.textAlign==='center'?x-w/2:['right','end'].includes(g.textAlign)?x-w:x;
      state.texts.push({group:state.group,text:String(text),...map(left,y-m.actualBoundingBoxAscent,w,m.actualBoundingBoxAscent+m.actualBoundingBoxDescent)});
    }
    return maxWidth===undefined?originalText(text,x,y):originalText(text,x,y,maxWidth);
  };
  state.capture=(group,draw) => { const old=state.group; state.group=group;try{return draw();}finally{state.group=old;} };
  return state;
}

function controls(width,height,safe) {
  const landscape=height<=500&&width/height>=1.2,small=width<=420,size=landscape?48:small?52:56,right=landscape?26:small?31:29,itemSize=landscape?72:86,itemBottom=landscape?12:20,dockBottom=landscape?98:120;
  return [
    rect('pause',safe.left+14,safe.top+72,44,44),
    rect('pet',safe.left+14,height-safe.bottom-110,88,88),
    rect('item',width-safe.right-14-itemSize,height-safe.bottom-itemBottom-itemSize,itemSize,itemSize),
    rect('ability toggle',width-safe.right-right-size,height-safe.bottom-dockBottom-size,size,size),
    rect('ultimate',width/2-34,height-safe.bottom-80,68,68)
  ];
}

function drawControls(g,boxes) {
  g.save();g.font='9px system-ui';g.textAlign='center';
  for(const b of boxes){g.fillStyle='#fff7e9';g.strokeStyle='#76654e';g.lineWidth=1;g.beginPath();g.roundRect(b.x,b.y,b.w,b.h,12);g.fill();g.stroke();g.fillStyle='#55432f';g.fillText(b.name,b.x+b.w/2,b.y+b.h/2+3,b.w-6);}
  g.restore();
}

const scenes = [
  {name:'stage',expected:'hud',setup:'P.stagePulse=800;'},
  {name:'boss-entry',expected:'bossArrival',setup:'enterRunStage(15);stageBoss.enemy.entryAge=600;P.stagePulse=800;'},
  {name:'boss-phase',expected:'bossArrival',setup:'enterRunStage(15);stageBoss.enemy.entryAge=3000;stageBoss.enemy.phaseBanner=1700;P.stagePulse=0;'},
  {name:'airstrike',expected:'ability',setup:"P.stagePulse=0;abilityBursts.push({kind:'airstrike',t:500,dur:1800});"},
  {name:'gas',expected:'ability',setup:"P.stagePulse=0;abilityBursts.push({kind:'gas',t:500,dur:1800});"},
  {name:'tank',expected:'ability',setup:"P.stagePulse=0;abilityBursts.push({kind:'tank',t:500,dur:1800});"},
  {name:'reward',expected:'reward',setup:`enterRunStage(15);stageBoss.enemy.entryAge=600;P.stagePulse=800;abilityBursts.push({kind:'airstrike',t:500,dur:1800});
    bossLootNotices.push({stage:10,title:bossText('Боевой рюкзак: самонаводящиеся пули','Combat backpack: homing projectiles'),impact:bossText('Дополнительный модуль · уровень 2 → 3','Additional module · level 2 → 3'),category:bossText('Улучшение героя · этот забег','Hero upgrade · this run'),age:500,icon:document.createElement('canvas')});`},
  {name:'airdrop',expected:'airdrop',setup:"P.stagePulse=0;Object.assign(weaponDelivery,{state:'flying',x:P.x+200,y:P.y});"}
];

for (const spec of cases) for (const language of ['ru','en']) {
  const {width,height,safe,suffix}=spec, label=`${width}x${height}${suffix}/${language}`;
  const h=make({native:true,width,height});
  h.box.uiLanguage=language;
  h.box.safeValues=safe;
  h.box.document.documentElement={};
  h.box.getComputedStyle=()=>({getPropertyValue:key=>String(safe[key.replace('--safe-','')]||0)});
  h.run(`resize();`+ui.slice(ui.indexOf('const hudHeight'),ui.indexOf('const useBtn'))+`;function syncHUD(){syncRadarButton();}`);
  const o=observe(h.ctx);
  h.box.captureHUD=(name,draw)=>o.capture(name,draw);
  h.run(`for(const [name,tag] of [['drawTopHUD','top'],['radar','radar'],['ultGauge','ultimate']]){
    const original=globalThis[name];globalThis[name]=(...args)=>captureHUD(tag,()=>original(...args));
  }`);
  const target=h.box.document.getElementById('radarToggle'),attributes={},styleWrites=[];
  let attributeWrites=0;
  target.setAttribute=(key,value)=>{attributes[key]=value;attributeWrites++;};
  target.style=new Proxy({}, {set(obj,key,value){styleWrites.push([key,value]);obj[key]=value;return true;}});
  h.run('reset();running=true;paused=false;ult.on=false;syncRadarButton();');
  function checkRadarTarget(when) {
    const m=h.run('radarLayout()');
    for(const [key,value] of Object.entries({left:m.x,top:m.y,width:m.size,height:m.size}))
      assert.equal(parseFloat(target.style[key]),value,`${label} ${when} radar ${key}`);
    assert.equal(target.style.right,'auto');
  }
  checkRadarTarget('initial');
  const before=[attributeWrites,styleWrites.length];h.run('syncRadarButton();syncRadarButton();');
  assert.deepEqual([attributeWrites,styleWrites.length],before,`${label} unchanged radar must not rewrite DOM`);
  assert(h.run('toggleRadar()'));checkRadarTarget('toggle');assert.equal(attributes['aria-pressed'],'true');
  h.box.innerWidth=width+23;h.run('resize();syncRadarButton();');checkRadarTarget('resize');
  h.box.innerWidth=width;h.run('resize();radarNear=false;syncRadarButton();');checkRadarTarget('restored');
  h.canvas.getBoundingClientRect=()=>({left:7,top:11});
  const m=h.run('radarLayout()');
  h.box.radarEvent={clientX:7+m.x+m.size/2,clientY:11+m.y+m.size/2};
  assert(h.run('radarConsumesPointer(radarEvent)'),`${label} radar pointer uses same bounds`);
  h.box.radarEvent={clientX:7+m.x-2,clientY:11+m.y+m.size/2};
  assert(!h.run('radarConsumesPointer(radarEvent)'),`${label} outside pointer remains available`);

  o.rects=[];o.texts=[];h.ctx.font='800 13px system-ui';h.ctx.textAlign='left';
  o.capture('longWord',()=>h.run("hudWrappedText(ctx,'Самонаводящиеся projectiles',10,30,70,16)"));
  assert(o.texts.length<=2);
  for(const text of o.texts)assert(text.w<=70.1,`${label} long word must wrap inside narrow card`);
  const combined=frames?createCanvas(width*4,height*2):null, gallery=combined?.getContext('2d');
  for(const [sceneIndex,scene] of scenes.entries()) {
    h.run(`reset();running=true;paused=false;props=[];enemies=[];P.x=1400;P.y=1400;P.stage=6;P.lvl=36;P.redKills=123456;P.xp=50;P.xpNext=100;
      P.hasteT=4000;P.invT=3000;xpBoost=12000;P.stagePulse=0;touchMode=true;ult.charge=ULT_FULL;ult.on=false;
      allyTanks=[{x:P.x+30,y:P.y+20,hp:65,hpMax:90}];cam.x=P.x-W/2;cam.y=P.y-H/2;${scene.setup}`);
    const q=h.run('arenaHUDLayout()'), top=h.run('topHUDLayout(W)'), bottom=controls(width,height,safe);
    for(const control of bottom)check(!overlaps({...q.radar,w:q.radar.size,h:q.radar.size},control),`${label}: radar overlaps ${control.name}`);
    const blockers=[rect('radar',q.radar.x,q.radar.y,q.radar.size,q.radar.size),{name:'health HUD',...top.left},{name:'status HUD',...top.right},...bottom];
    o.rects=[];o.texts=[];
    h.ctx.fillStyle='#eee5d2';h.ctx.fillRect(0,0,width,height);
    o.capture('ability',()=>h.run('drawAbilityScreenFX(ctx)'));
    o.capture('hud',()=>h.run('hud()'));
    o.capture('bossHealth',()=>h.run('drawBossHUD(ctx)'));
    o.capture('bossArrival',()=>h.run('drawBossArrival(ctx)'));
    o.capture('reward',()=>h.run('drawBossLootNotice(ctx)'));
    o.capture('airdrop',()=>h.run('drawWeaponDeliveryHUD(ctx)'));
    const id=`${label}/${scene.name}`;
    const hudRects=o.rects.filter(r=>r.group==='hud'&&(r.kind==='roundRect'||r.fill==='rgba(253, 246, 232, 0.92)'||r.fill==='rgba(253,246,232,.92)'));
    // Full buff backgrounds are the first fillRect at each y; colored progress fills are smaller.
    const buffRects=o.rects.filter(r=>r.group==='hud'&&r.kind==='fillRect'&&Math.abs(r.w-q.buffs.w)<.01&&Math.abs(r.h-18)<.01);
    const stages=o.rects.filter(r=>r.group==='hud'&&r.kind==='roundRect');
    const panels=[...stages,...buffRects];
    for(const group of ['bossHealth','bossArrival','ability','reward','airdrop']){
      const panel=o.rects.find(r=>r.group===group&&r.kind==='roundRect');if(panel)panels.push(panel);
    }
    const noticeGroups=['hud','bossArrival','ability','reward','airdrop'];
    const visibleNotices=panels.filter(r=>noticeGroups.includes(r.group)&&r.kind==='roundRect');
    check(visibleNotices.length===1,`${id}: expected one notice, saw ${visibleNotices.map(r=>r.group)}`);
    check(visibleNotices[0]?.group===scene.expected,`${id}: expected ${scene.expected}, saw ${visibleNotices[0]?.group}`);
    for(const panel of panels){
      check(inside(panel,{x:safe.left,y:safe.top,w:width-safe.left-safe.right,h:height-safe.top-safe.bottom}),`${id}: ${panel.group} outside safe screen`);
      for(const blocked of blockers)check(!overlaps(panel,blocked),`${id}: ${panel.group} overlaps ${blocked.name} (${JSON.stringify(panel)})`);
    }
    for(const text of o.texts.filter(t=>['hud','bossHealth','bossArrival','ability','reward','airdrop'].includes(t.group))){
      check(panels.some(p=>p.group===text.group&&inside(text,p,1.5)),`${id}: text outside its ${text.group} card: ${JSON.stringify(text)}`);
    }
    for(let i=0;i<visibleNotices.length;i++)for(const panel of panels.filter(p=>p.group==='bossHealth'))
      check(!overlaps(visibleNotices[i],panel),`${id}: notice overlaps boss health`);
    rendered++;
    if(gallery){drawControls(h.ctx,bottom);gallery.drawImage(h.canvas,sceneIndex%4*width,Math.floor(sceneIndex/4)*height);}
  }
  // A narrow landscape inventory temporarily owns the notice area. Receipt time is retained.
  if(height<500){
    h.run(`P.abilityMenuOpen=true;bossLootNotices.length=0;bossLootNotices.push({stage:5,title:'Reward',age:800});`);
    const age=h.run('bossLootNotices[0].age');o.rects=[];
    o.capture('reward',()=>h.run('updateBossLootNotice(100);drawBossLootNotice(ctx)'));
    o.capture('bossArrival',()=>h.run('drawBossArrival(ctx);drawBossHUD(ctx)'));
    assert.equal(h.run('bossLootNotices[0].age'),age,`${label} menu must preserve reward display time`);
    assert.equal(o.rects.length,0,`${label} menu must not overlap notices`);
    h.run('P.abilityMenuOpen=false;updateBossLootNotice(100)');
    assert.equal(h.run('bossLootNotices[0].age'),age+100,`${label} receipt resumes after menu`);
  }
  // Floating trophy labels must avoid the top HUD and map even at world edges.
  for(const [cx,cy] of [[20,26],[width-30,26],[width-30,100]]){
    h.box.guidePoint={cx,cy};const labelBox=h.run('hudWorldLabelRect(guidePoint.cx,guidePoint.cy,100)');
    assert(labelBox,`${label} trophy guide must have a visible position`);
    const q=h.run('arenaHUDLayout()'),top=h.run('topHUDLayout(W)');
    for(const blocked of [top.left,top.right,{...q.radar,w:q.radar.size,h:q.radar.size}])assert(!overlaps(labelBox,blocked),`${label} trophy guide covers HUD/map`);
  }
  if(combined)fs.writeFileSync(path.join(root,`audit/mobile-hud-v0208-${width}x${height}${suffix}-${language}.png`),combined.toBuffer('image/png'));
}
assert.equal(failures.length,0,failures.slice(0,50).join('\n')+(failures.length>50?`\n... ${failures.length} failures total`:''));
console.log(`PASS: ${rendered} native mobile HUD scenes, RU/EN, safe areas, text/card bounds, notice priority, radar hit target resize/toggle and unchanged DOM cache`);
