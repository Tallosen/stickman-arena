const fs=require('fs'),path=require('path');
const {createCanvas}=require('@napi-rs/canvas');
const output=path.resolve(__dirname,'../../..');
const sheet=createCanvas(1170,844),g=sheet.getContext('2d');
for(let i=0;i<3;i++){
 const h=require('./arena-harness.cjs')({native:true,width:390,height:844});
 const ui=fs.readFileSync(path.join(__dirname,'../src/ui.js'),'utf8');h.run(ui.slice(0,ui.indexOf('function hud()')));
 h.run(`reset();running=true;P.gear=Object.fromEntries(GK.map(k=>[k,GEAR[k].max]));applyGear();P.hp=12;P.hpMax=17;P.lvl=34;
 hud=function(){drawTopHUD(ctx,W,P)};
 ${i?`enterRunStage(20);stageBoss.enemy.x=P.x+65;stageBoss.enemy.y=P.y-120;stageBoss.enemy.entryAge=3000;stageBoss.enemy.bossSpec={...stageBoss.enemy.bossSpec,...BOSS_ARCHETYPES[${i===1?1:2}]};stageBoss.spec=stageBoss.enemy.bossSpec;openBossWindow(stageBoss.enemy,1000,${i===1?"'reload'":"'exhaust'"});nightFade=1;`:''}
 hurtHero(2.5,{x:P.x-80,y:P.y-30,area:${i===2}});updateDamageFeedback(220);shake=0;
 cam.x=P.x-W/2;cam.y=P.y-H/2;draw();`);
 g.drawImage(h.canvas,i*390,0);
}
fs.writeFileSync(path.join(output,'preview-damage-windows-v0149.png'),sheet.toBuffer('image/png'));
const landscape=require('./arena-harness.cjs')({native:true,width:844,height:390});
const ui=fs.readFileSync(path.join(__dirname,'../src/ui.js'),'utf8');landscape.run(ui.slice(0,ui.indexOf('function hud()')));
landscape.run(`reset();running=true;hud=function(){drawTopHUD(ctx,W,P)};enterRunStage(15);stageBoss.enemy.x=P.x+150;stageBoss.enemy.y=P.y+50;stageBoss.enemy.entryAge=3000;openBossWindow(stageBoss.enemy,1200,'stagger');nightFade=1;hurtHero(1,{x:P.x+80,y:P.y});updateDamageFeedback(200);shake=0;cam.x=P.x-W/2;cam.y=P.y-H/2;draw();`);
fs.writeFileSync(path.join(output,'preview-damage-landscape-v0149.png'),landscape.canvas.toBuffer('image/png'));
console.log('Rendered portrait/day/night/area-hit, compact HP trail, and landscape stagger.');
