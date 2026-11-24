const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const {createCanvas}=require('@napi-rs/canvas');
const c=createCanvas(900,620),ctx=c.getContext('2d'),noop=()=>{};
const element=()=>({style:{},classList:{add:noop,remove:noop,contains:()=>true},addEventListener:noop,getContext:()=>ctx,appendChild:noop});
const box={console,document:{body:element(),getElementById:()=>element(),createElement:element,addEventListener:noop},innerWidth:900,innerHeight:620,devicePixelRatio:1,addEventListener:noop,requestAnimationFrame:noop,setTimeout:noop,localStorage:{getItem:()=>null,setItem:noop},c};
box.window=box;vm.createContext(box);
vm.runInContext('Math.random=()=>.000777',box);
for(const f of ['core','config','combat','draw-hero','draw-pets','abilities','menu-scene'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f+'.js'),'utf8'),box,{filename:f});
const previewTag=vm.runInContext('VERSION',box).replace('.','');
vm.runInContext('paintArenaCamp(c.getContext("2d"),900,620,1)',box);
const first=c.toBuffer('image/png');
fs.writeFileSync(path.resolve(__dirname,'../../../preview-arena-menu-v'+previewTag+'.png'),first);
vm.runInContext('paintArenaCamp(c.getContext("2d"),900,620,3)',box);
assert(!first.equals(c.toBuffer('image/png')),'Camp is not animated');
vm.runInContext('paintArenaCamp(c.getContext("2d"),900,620,1)',box);
assert(first.equals(c.toBuffer('image/png')),'Frames leave trails or mutate scene state');
console.log('Native camp preview: original hero, six pets, items, abilities, weapons; animation changes, exact clean redraw verified.');
const sheet=createCanvas(1200,840),sg=sheet.getContext('2d');
for(let i=0;i<6;i++){
 const t=[1,15,28,33.7,35.2,37.5][i];
 vm.runInContext(`paintArenaCamp(c.getContext('2d'),900,620,${t})`,box);
 const x=i%3*400,y=Math.floor(i/3)*420;
 sg.fillStyle='#f7eddc';sg.fillRect(x,y,400,420);sg.drawImage(c,x,y+40,400,276);
 sg.fillStyle='#352e24';sg.font='18px sans-serif';
 sg.fillText(t+'s: '+vm.runInContext(`menuHeroPose(${t}).activity`,box),x+16,y+28);
}
fs.writeFileSync(path.resolve(__dirname,'../../../preview-arena-poses-v'+previewTag+'.png'),sheet.toBuffer('image/png'));
// Larger isolated samples: every gesture at its peak plus sit/rise/walk.
const poses=createCanvas(1600,800),pg=poses.getContext('2d');
box.pg=pg;
const samples=[{seed:0,t:1}];
for(const activity of ['stand','walk','wave','stretch','look','gear','sitDown']){
 let sample;
 for(let seed=0;seed<60&&!sample;seed++){
  const times=[];
  for(let t=0;t<78;t+=.05)if(vm.runInContext(`menuHeroPose(${t},${seed}).activity`,box)===activity)times.push(t);
  if(times.length)sample={seed,t:times[Math.floor(times.length/2)]};
 }
 assert(sample,'Missing preview activity '+activity);samples.push(sample);
}
samples.forEach(({seed,t},i)=>{
 const x=i%4*400,y=Math.floor(i/4)*400;
 pg.fillStyle='#f7eddc';pg.fillRect(x,y,400,400);
 pg.save();pg.translate(x+180,y+350);pg.vackyStableSketch=true;
 vm.runInContext(`{const p=menuHeroPose(${t},${seed});drawHero(pg,0,p.y-440,1,p.phase,MENU_HERO_GEAR,3,0,0,p,1)}`,box);
 pg.restore();pg.fillStyle='#352e24';pg.font='18px sans-serif';
 pg.fillText(vm.runInContext(`menuHeroPose(${t},${seed}).activity`,box),x+16,y+28);
});
fs.writeFileSync(path.resolve(__dirname,'../../../preview-arena-rig-v'+previewTag+'.png'),poses.toBuffer('image/png'));
let tapTime=0,tapMax=0;
for(let t=120;t<160;t+=.02){const tap=vm.runInContext(`menuHeroPose(${t}).tap`,box);if(tap>tapMax){tapMax=tap;tapTime=t;}}
vm.runInContext(`paintArenaCamp(c.getContext('2d'),900,620,${tapTime})`,box);
fs.writeFileSync(path.resolve(__dirname,'../../../preview-arena-knock-v'+previewTag+'.png'),c.toBuffer('image/png'));
const greetings=createCanvas(900,620),gg=greetings.getContext('2d');
for(const [i,kind] of ['hero','dog'].entries()){
 vm.runInContext(`menuReaction={kind:'${kind}',start:1};paintArenaCamp(c.getContext('2d'),900,620,2.1)`,box);
 gg.fillStyle='#f7eddc';gg.fillRect(i*450,0,450,620);gg.drawImage(c,i*450,60,450,310);
 gg.fillStyle='#352e24';gg.font='18px sans-serif';gg.fillText(kind+' tap',i*450+16,30);
}
vm.runInContext('menuReaction=null',box);
fs.writeFileSync(path.resolve(__dirname,'../../../preview-arena-reactions-v'+previewTag+'.png'),greetings.toBuffer('image/png'));
vm.runInContext(`paintArenaCamp(c.getContext('2d'),900,620,menuSchedule(0).wait+28.5)`,box);
fs.writeFileSync(path.resolve(__dirname,'../../../preview-arena-parrot-v'+previewTag+'.png'),c.toBuffer('image/png'));
const directions=createCanvas(1500,380),dg=directions.getContext('2d');box.dg=dg;
const directionSamples=[['turn',0,1.95],['left',0,3.8],['right',0,10.5],['approach',120,3.8],['depart',120,10.5]];
directionSamples.forEach(([label,base,offset],i)=>{
 const t=vm.runInContext(`menuSchedule(${base},1).wait+${base+offset}`,box);
 dg.fillStyle='#f7eddc';dg.fillRect(i*300,0,300,380);dg.save();dg.translate(i*300+150,335);dg.vackyStableSketch=true;
 vm.runInContext(`{const p=menuHeroPose(${t},1);drawHero(dg,0,0,1,p.phase,MENU_HERO_GEAR,3.6,0,0,p,1)}`,box);
 dg.restore();dg.fillStyle='#352e24';dg.font='18px sans-serif';dg.fillText(label,i*300+16,28);
});
fs.writeFileSync(path.resolve(__dirname,'../../../preview-arena-facing-v'+previewTag+'.png'),directions.toBuffer('image/png'));
const backs=createCanvas(1500,440),bg=backs.getContext('2d');box.bg=bg;
for(const [i,yaw] of [Math.PI/2,Math.PI*.75,Math.PI,Math.PI*1.25,Math.PI*1.5].entries()){
 bg.fillStyle='#f7eddc';bg.fillRect(i*300,0,300,440);bg.save();bg.translate(i*300+150,395);bg.vackyStableSketch=true;
 vm.runInContext(`{const t=menuSchedule(120,1).wait+130.5,p=menuHeroPose(t,1);p.yaw=${yaw};p.headYaw=${yaw};drawHero(bg,0,0,1,p.phase,MENU_HERO_GEAR,4.2,0,0,p,1)}`,box);
 bg.restore();bg.fillStyle='#352e24';bg.font='18px sans-serif';bg.fillText(['side','rear 3/4','rear','rear 3/4','side'][i],i*300+20,28);
}
fs.writeFileSync(path.resolve(__dirname,'../../../preview-arena-backpack-v'+previewTag+'.png'),backs.toBuffer('image/png'));
const heads=createCanvas(1260,520),hg=heads.getContext('2d');box.hg=hg;
for(let row=0;row<2;row++)for(const [i,yaw] of [Math.PI,-Math.PI/2,-.6,0,.6,Math.PI/2].entries()){
 hg.fillStyle='#f7eddc';hg.fillRect(i*210,row*260,210,260);hg.save();hg.translate(i*210+105,row*260+145);hg.scale(7.5,7.5);hg.vackyStableSketch=true;
 vm.runInContext(`drawMenuHeroHead(hg,{head:[0,0],yaw:${yaw},blink:${row}},MENU_HERO_GEAR,3,2.2,1.4)`,box);hg.restore();
 hg.fillStyle='#352e24';hg.font='15px sans-serif';hg.fillText(['back','left','3/4 left','front','3/4 right','right'][i]+(row?' / blink':''),i*210+12,row*260+25);
}
fs.writeFileSync(path.resolve(__dirname,'../../../preview-arena-face-v'+previewTag+'.png'),heads.toBuffer('image/png'));
// Side-by-side reference: original battle equipment vs projected menu equipment.
const equipment=createCanvas(1000,600),eg=equipment.getContext('2d');box.eg=eg;
eg.fillStyle='#f7eddc';eg.fillRect(0,0,1000,600);
for(let column=0;column<2;column++){
 eg.save();eg.translate(column*500+220,265);eg.scale(5,5);eg.vackyStableSketch=true;
 vm.runInContext(column===0?
  'drawHeroBoot(eg,[0,0],[0,-20],1,4,TIER[4],2.2,1.4)':
  'drawHeroBoot(eg,[0,0],[0,-20],1,4,TIER[4],2.2,1.4,Math.PI/2)',box);
 eg.restore();
 eg.save();eg.translate(column*500+310,570);eg.scale(5,5);eg.vackyStableSketch=true;
 vm.runInContext(column===0?
  'drawCombatBackpack(eg,1,3,{neck:-40,hip:-16},null,2.2,1.4)':
  'drawCombatBackpack(eg,1,3,{neck:-40,hip:-16,yaw:Math.PI/2},null,2.2,1.4)',box);
 eg.restore();eg.fillStyle='#352e24';eg.font='22px sans-serif';
 eg.fillText(column?'Menu / projected':'Battle / original',column*500+40,38);
}
fs.writeFileSync(path.resolve(__dirname,'../../../preview-arena-equipment-v'+previewTag+'.png'),equipment.toBuffer('image/png'));
const interactions=createCanvas(1350,930),ig=interactions.getContext('2d');
for(const [row,kind] of ['rack','chest'].entries())for(const [col,age] of [2.7,6,9.3].entries()){
 vm.runInContext(`menuReaction={kind:'${kind}',start:1};paintArenaCamp(c.getContext('2d'),900,620,${1+age})`,box);
 ig.fillStyle='#f7eddc';ig.fillRect(col*450,row*465,450,465);ig.drawImage(c,col*450,row*465+80,450,310);
 ig.fillStyle='#352e24';ig.font='18px sans-serif';ig.fillText(kind+' / '+age+'s',col*450+20,row*465+30);
}
vm.runInContext('menuReaction=null',box);
fs.writeFileSync(path.resolve(__dirname,'../../../preview-arena-interactions-v'+previewTag+'.png'),interactions.toBuffer('image/png'));
const departure=createCanvas(1350,400),lg=departure.getContext('2d');
for(const [col,age] of [0,.3,.599].entries()){
 vm.runInContext(`menuDeparture={start:1,complete:()=>{}};paintArenaCamp(c.getContext('2d'),900,620,${1+age})`,box);
 lg.fillStyle='#f7eddc';lg.fillRect(col*450,0,450,400);lg.drawImage(c,col*450,50,450,310);
 lg.fillStyle='#352e24';lg.font='18px sans-serif';lg.fillText('Ready / '+age+'s',col*450+20,30);
}
vm.runInContext('menuDeparture=null',box);
fs.writeFileSync(path.resolve(__dirname,'../../../preview-arena-departure-v'+previewTag+'.png'),departure.toBuffer('image/png'));
