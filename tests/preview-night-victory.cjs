const fs=require('fs'),path=require('path'),h=require('./arena-harness.cjs')({native:true,width:900,height:620});
const {createCanvas}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'../../..'),tag=h.run('VERSION').replace('.','');
const ui=fs.readFileSync(path.join(__dirname,'../src/ui.js'),'utf8');h.run(ui.slice(ui.indexOf('const hudHeight'),ui.indexOf('function hud()'))+';hud=()=>drawTopHUD(ctx,W,P);');
h.run('reset();running=true;P.lvl=30;P.gear=Object.fromEntries(GK.map(k=>[k,GEAR[k].max]));applyGear();P.hp=P.hpMax;enterRunStage(20);stageBoss.enemy.x=P.x+170;stageBoss.enemy.y=P.y+80;cam.x=P.x-W/2;cam.y=P.y-H/2;pops=[];');
const lightSheet=createCanvas(1350,330),lg=lightSheet.getContext('2d');
for(const [i,ms] of [0,2250,2250].entries()){
 h.run(`updateNightLighting(${ms});draw();`);lg.drawImage(h.canvas,i*450,20,450,310);lg.fillStyle='#2b2620';lg.fillText(['Day','Dusk 2.25 s','Night 4.5 s'][i],i*450+15,14);
}
fs.writeFileSync(path.join(root,'preview-night-transition-v'+tag+'.png'),lightSheet.toBuffer('image/png'));
const bossSheet=createCanvas(1800,1240),bg=bossSheet.getContext('2d');
for(let i=0;i<4;i++){
 h.run(`{const e=stageBoss.enemy;e.bossSpec={...e.bossSpec,...BOSS_ARCHETYPES[${i}]};stageBoss.spec=e.bossSpec;e.attackState='chase';e.attackCd=0;e.bossCycle=0;bossMarks=[];bossProjectiles=[];bossMovementIntent(e,P.x,P.y,16);draw();}`);
 bg.drawImage(h.canvas,i%2*900,Math.floor(i/2)*620);
}
fs.writeFileSync(path.join(root,'preview-boss-variety-v'+tag+'.png'),bossSheet.toBuffer('image/png'));
const portrait=createCanvas(420,245),sheet=createCanvas(1680,510),sg=sheet.getContext('2d');h.box.vg=portrait.getContext('2d');
for(const [i,w] of ['basic','shotgun','sniper','minigun'].entries())for(let row=0;row<2;row++){
 h.run(`P.wtype='${w}';P.gear=Object.fromEntries(GK.map(k=>[k,${row?'Math.min(2,GEAR[k].max)':'GEAR[k].max'}]));drawVictoryHero(vg,420,245);`);
 sg.fillStyle='#f7e5b5';sg.fillRect(i*420,row*255,420,255);sg.drawImage(portrait,i*420,row*255);sg.fillStyle='#493824';sg.font='14px sans-serif';sg.fillText(w+' / '+(row?'mixed gear':'max gear'),i*420+12,row*255+18);
}
fs.writeFileSync(path.join(root,'preview-victory-gear-v'+tag+'.png'),sheet.toBuffer('image/png'));
console.log('Rendered transition, all archetypes and eight real-equipment victory portraits.');
