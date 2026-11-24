const fs=require('fs'),path=require('path'),h=require('./arena-harness.cjs')({native:true,width:900,height:620});
h.run('reset();running=true;paused=false;P.gear=Object.fromEntries(GK.map(k=>[k,GEAR[k].max]));P.lvl=30;applyGear();P.hp=P.hpMax;');
const tag=h.run('VERSION').replace('.','');
const ui=fs.readFileSync(path.join(__dirname,'../src/ui.js'),'utf8');
h.run(ui.slice(ui.indexOf('const hudHeight'),ui.indexOf('function hud()'))+';hud=()=>drawTopHUD(ctx,W,P);');
for(const stage of [5,10,15,20]){
 h.run(`resetBossRun();enemies=[];pops=[];enterRunStage(${stage});constBoss=stageBoss.enemy;Object.assign(constBoss,{x:P.x+125,y:P.y-70,attackCd:0});bossMovementIntent(constBoss,P.x,P.y,16);cam.x=P.x-W/2;cam.y=P.y-H/2;draw();drawBossHUD(ctx);` .replace('constBoss=','globalThis.constBoss='));
 fs.writeFileSync(path.resolve(__dirname,'../../../preview-boss-'+stage+'-v'+tag+'.png'),h.canvas.toBuffer('image/png'));
}
h.run('pops=[];startDragonAssist();dragonAssist.age=2100;draw();drawBossHUD(ctx);');
fs.writeFileSync(path.resolve(__dirname,'../../../preview-boss-dragon-v'+tag+'.png'),h.canvas.toBuffer('image/png'));
console.log('Rendered all four night encounters and dragon assistance with the native Canvas renderer.');
for(const [width,height,label] of [[390,844,'phone'],[844,390,'landscape']]){
 const view=require('./arena-harness.cjs')({native:true,width,height});
 view.run(ui.slice(ui.indexOf('const hudHeight'),ui.indexOf('function hud()'))+';hud=()=>drawTopHUD(ctx,W,P);');
 view.run('reset();running=true;P.lvl=30;P.gear=Object.fromEntries(GK.map(k=>[k,GEAR[k].max]));applyGear();P.hp=P.hpMax;enterRunStage(20);stageBoss.enemy.x=P.x+85;stageBoss.enemy.y=P.y+20;cam.x=P.x-W/2;cam.y=P.y-H/2;draw();');
 fs.writeFileSync(path.resolve(__dirname,'../../../preview-boss-'+label+'-v'+tag+'.png'),view.canvas.toBuffer('image/png'));
}
