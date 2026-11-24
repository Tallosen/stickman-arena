const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),make=require('./arena-harness.cjs');
const root=path.join(__dirname,'..'),h=make({native:true,width:1000,height:650});h.box.assert=assert;
h.run(`reset();ctx.vackyStableSketch=true;
const originalGun=drawGunModel,originalCircle=scircle,originalBoot=drawHeroBoot;
let gunMatrix=null,palms=[],boots=[];
const project=(m,p)=>[m.a*p[0]+m.c*p[1]+m.e,m.b*p[0]+m.d*p[1]+m.f];
drawGunModel=(g,...args)=>{gunMatrix=g.getTransform();return originalGun(g,...args);};
scircle=(g,x,y,r,...args)=>{if(r===1.9)palms.push(project(g.getTransform(),[x,y]));return originalCircle(g,x,y,r,...args);};
drawHeroBoot=(g,foot,knee,...args)=>{boots.push(JSON.stringify([foot,knee]));return originalBoot(g,foot,knee,...args);};
for(const w of Object.keys(WEAPONS))for(let L=0;L<5;L++)for(const face of [-1,1])for(const a of [-1.1,0,1.1])for(const muzzle of [0,60]){
 const aim=face===1?a:Math.PI-a,gear={gun:L,helm:0,jacket:0,gloves:0,boots:2,_w:w},pose={lean:-face*.035,squash:1.02};
 boots=[];drawHero(ctx,400,350,face,.8,gear,1.02,aim,muzzle,pose);const oldBoots=boots.slice();
 palms=[];boots=[];drawHero(ctx,400,350,face,.8,{...gear,_holdWeapon:true},1.02,aim,muzzle,pose);
 assert.deepEqual(boots,oldBoots,'Hand rig must not alter feet');assert.equal(palms.length,2);
 const grip=project(gunMatrix,weaponTriggerPoint(w,L));assert(Math.hypot(grip[0]-palms[1][0],grip[1]-palms[1][1])<.001,w+'/'+L+'/'+face+'/'+aim+': '+JSON.stringify({grip,palm:palms[1]}));
 if(w==='sniper'&&L===0){const string=project(gunMatrix,[muzzle?8:0,-2]);assert(Math.hypot(string[0]-palms[0][0],string[1]-palms[0][1])<.001,'Bow hand must meet drawn string');}
}
drawGunModel=originalGun;scircle=originalCircle;drawHeroBoot=originalBoot;
// Exercise the normal battle renderer, including haste afterimages, not only a preview pose.
const realHero=drawHero;let seen=0;drawHero=(...args)=>{if(!args[5]._holstered){assert(args[5]._holdWeapon);seen++;}return realHero(...args);};
for(const w of Object.keys(WEAPONS)){
 reset();running=true;paused=false;props=[];P.wtype=w;P.aim=.8;P.gear.gun=0;P.ghosts=[{x:P.x-5,y:P.y,face:1,ph:.5,life:1}];draw();
}assert(seen>=14);drawHero=realHero;
ctx.fillStyle=PAPER;ctx.fillRect(0,0,W,H);ctx.vackyStableSketch=true;
const cases=[['sniper',0,1,.6,0],['sniper',0,1,-.35,2],['sniper',0,-1,Math.PI-.6,0],['sniper',1,1,.25,0],['sniper',4,1,0,2],['laser',4,-1,Math.PI+.3,0]];
for(const [i,[w,L,face,aim,gloves]] of cases.entries()){
 const x=125+i%3*330,y=240+Math.floor(i/3)*305;
 drawHero(ctx,x,y,face,.5,{gun:L,helm:0,jacket:0,gloves,boots:0,_w:w,_holdWeapon:true},2.5,aim,0,{lean:-face*.02,squash:1});
 ctx.fillStyle=INK;ctx.font='14px system-ui';ctx.textAlign='center';ctx.fillText(weaponFormName(w,L),x+20,y+38);
}
`);
if(process.argv.includes('--frames'))fs.writeFileSync(path.join(root,'audit/combat-grip-v0200.png'),h.canvas.toBuffer('image/png'));
console.log('PASS: actual canvas grip/hand transform alignment for every weapon, tier, direction and angle; bow string follows release; unchanged boot pose; normal battle and haste ghosts use held weapons');
