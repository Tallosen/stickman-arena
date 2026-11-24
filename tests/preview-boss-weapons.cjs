const fs=require('fs'),path=require('path'),h=require('./arena-harness.cjs')({native:true,width:500,height:340});
const {createCanvas}=require('@napi-rs/canvas');
const sheet=createCanvas(2000,1020),g=sheet.getContext('2d'),root=path.resolve(__dirname,'../../..'),tag=h.run('VERSION').replace('.','');
for(let col=0;col<4;col++){
 const id=col<2?'gunner':'hunter',left=col%2;
 h.run(`reset();running=true;props=[];enterRunStage(15);Object.assign(stageBoss.enemy,{x:250,y:230,phase:.5,face:${left?-1:1},flinch:0,attackCd:0});stageBoss.enemy.bossSpec={...stageBoss.enemy.bossSpec,...BOSS_ARCHETYPES.find(a=>a.id==='${id}')};P.x=${left?25:475};P.y=${left?130:265};P.invT=1e9;bossMovementIntent(stageBoss.enemy,P.x,P.y,16);`);
 for(let row=0;row<3;row++){
  if(row===1)h.run('bossMovementIntent(stageBoss.enemy,P.x,P.y,stageBoss.enemy.attackT);');
  if(row===2)h.run('updateBossEncounter(220);bossMovementIntent(stageBoss.enemy,P.x,P.y,220);');
  h.run(`ctx.fillStyle='#596073';ctx.fillRect(0,0,W,H);drawBossMarks(ctx);{const e=stageBoss.enemy;drawFoe(ctx,e.x,e.y+13*e.r/11,e.face,e.phase,e.r/11,e.bossSpec.color,e.kind,0,e.flinch,e);}ctx.fillStyle='#f6e4c4';ctx.font='16px sans-serif';ctx.fillText('${id} / ${['aim','muzzle flash','projectiles'][row]}',14,24);`);
  g.drawImage(h.canvas,col*500,row*340);
 }
}
fs.writeFileSync(path.join(root,'preview-boss-weapons-v'+tag+'.png'),sheet.toBuffer('image/png'));
console.log('Rendered shotgun/sniper left/right: telegraph, muzzle flash and projectile flight.');
