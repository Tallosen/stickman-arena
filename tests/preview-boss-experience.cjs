const fs=require('fs'),path=require('path'),h=require('./arena-harness.cjs')({native:true,width:800,height:550});
const {createCanvas}=require('@napi-rs/canvas');
const sheet=createCanvas(1600,1100),g=sheet.getContext('2d'),root=path.resolve(__dirname,'../../..');
for(let i=0;i<4;i++){
 h.run(`reset();running=true;P.gear=Object.fromEntries(GK.map(k=>[k,GEAR[k].max]));applyGear();enterRunStage(20);const e${i}=stageBoss.enemy;Object.assign(e${i},{x:P.x+170,y:P.y+80,entryAge:3000,phase:2,phase2:true,phaseBanner:1900});e${i}.bossSpec={...e${i}.bossSpec,...BOSS_ARCHETYPES[${i}]};stageBoss.spec=e${i}.bossSpec;e${i}.hp=e${i}.maxhp*.45;e${i}.attackCd=0;bossMovementIntent(e${i},P.x,P.y,16);${i===1?"e1.attackState='recover';e1.attackT=325;e1.recoveryDuration=650;":''}nightFade=1;cam.x=P.x-W/2;cam.y=P.y-H/2;pops=[];draw();`);
 g.drawImage(h.canvas,i%2*800,Math.floor(i/2)*550);
}
fs.writeFileSync(path.join(root,'preview-boss-experience-v0148.png'),sheet.toBuffer('image/png'));
h.run('stageBoss.enemy.entryAge=600;stageBoss.enemy.phaseBanner=0;draw();');fs.writeFileSync(path.join(root,'preview-boss-arrival-v0148.png'),h.canvas.toBuffer('image/png'));
console.log('Rendered all four phase-two poses, safe mage corridor, reload, arrival and readable HUD.');
