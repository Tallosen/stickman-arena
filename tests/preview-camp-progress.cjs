const fs=require('fs'),path=require('path'),assert=require('assert');
const {createCanvas}=require('@napi-rs/canvas');
const h=require('./arena-harness.cjs')({native:true,width:900,height:620});
for(const file of ['camp-progress','menu-scene'])h.run(fs.readFileSync(path.join(__dirname,'../src',file+'.js'),'utf8'));
h.run('reset();');
const sheet=createCanvas(1800,1240),g=sheet.getContext('2d');g.fillStyle='#f7eddc';g.fillRect(0,0,1800,1240);
for(let i=0;i<4;i++){
 h.run(`campProfile=blankCamp();${i>0?"Object.assign(campProfile,{bosses:4,wins:1,clean:1,bossTypes:[...CAMP_BOSSES],trialWins:{rush:true},shotgunStage:10,style:'"+['classic','classic','tide','ember'][i]+"'});":''}paintArenaCamp(ctx,900,620,1);`);
 g.drawImage(h.canvas,i%2*900,Math.floor(i/2)*620);
 g.fillStyle='#655031';g.font='20px system-ui';g.fillText(['Fresh camp','Earned decorations','Tide cape','Ember cape'][i],i%2*900+30,Math.floor(i/2)*620+35);
 if(i===0)h.box.clean=h.canvas.toBuffer('image/png');
 if(i===1)assert(!h.box.clean.equals(h.canvas.toBuffer('image/png')),'Earned camp did not change');
}
const file=path.resolve(__dirname,'../../../preview-camp-progress-v0153.png');fs.writeFileSync(file,sheet.toBuffer('image/png'));
// A locked style must never be selectable. Colour has no effect on real stats.
h.run(`campProfile=blankCamp();beginCampRun();applyGear();globalThis.before=[P.hpMax,P.speed,P.damage];P.campStyle='ember';applyGear();`);
assert.deepEqual(h.run('[P.hpMax,P.speed,P.damage]'),h.box.before);
console.log(file);
