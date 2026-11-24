const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..');
const h=require('./arena-harness.cjs')({native:true,width:900,height:620});
h.run(fs.readFileSync(path.join(root,'src/camp-progress.js'),'utf8'));
h.run(fs.readFileSync(path.join(root,'src/ranking.js'),'utf8'));
h.run(fs.readFileSync(path.join(root,'src/menu-scene.js'),'utf8'));
h.run('reset();');
const before=h.run('JSON.stringify({P,meta,inventory,campProfile})');
for(const time of [0,9,18,29,39,70])h.run(`paintArenaCamp(canvas.getContext('2d'),900,620,${time});`);
assert.equal(h.run('JSON.stringify({P,meta,inventory,campProfile})'),before,'Scenery must be cosmetic only');
// PNGs are real native Canvas renders, not browser/layout screenshots.
const dir=path.join(root,'audit');fs.mkdirSync(dir,{recursive:true});
const version=h.run('VERSION').replace('.','');
const full="{...blankCamp(),kills:500,bosses:4,stage:20,wins:1,shotgunStage:10,clean:1,bossTypes:[...CAMP_BOSSES],trialWins:{rush:true},style:'ember'}";
const paint=()=>h.run("{paintArenaCamp(canvas.getContext('2d'),900,620,0);const cg=canvas.getContext('2d');cg.save();cg.globalCompositeOperation='destination-over';cg.fillStyle='#f7efdf';cg.fillRect(0,0,900,620);cg.restore();}");
const snapshots={};
for(const state of ['fresh','partial','complete']){
 if(state==='partial')h.run("campProfile={...blankCamp(),bosses:1,stage:10,shotgunStage:10,clean:1};");
 if(state==='complete')h.run('campProfile='+full+';rankingProfile.best=2457;');
 const before=h.run('JSON.stringify({P,meta,inventory,campProfile})');
 for(const time of [0,9,18,29,39,70])h.run(`paintArenaCamp(canvas.getContext('2d'),900,620,${time});`);
 assert.equal(h.run('JSON.stringify({P,meta,inventory,campProfile})'),before);
 paint();snapshots[state]=h.ctx.getImageData(0,0,900,620).data;
 fs.writeFileSync(path.join(dir,'camp-v'+version+'-'+state+'.png'),h.canvas.toBuffer('image/png'));
}
const different=(a,b)=>{let count=0;for(let i=0;i<a.length;i+=4)if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2])>30)count++;return count;};
assert(different(snapshots.fresh,snapshots.complete)>900*620*.07,'Completed camp needs a substantial visual transformation');
assert(different(snapshots.fresh,snapshots.partial)>2000,'Partial rewards must visibly decorate camp');
assert(h.run('menuCampRewards().complete'));
for(const key of ['bosses','stage','kills','wins','bossTypes','shotgunStage','clean','trialWins']){
 h.run('campProfile='+full+';');h.run(`campProfile.${key}=${key==='bossTypes'?'[]':key==='trialWins'?'{}':'0'};`);
 assert(!h.run('menuCampRewards().complete'),'Premature completion after missing '+key);
}
console.log('PASS: native camp drawing at six animation points, scenery has no gameplay mutations; fresh/unlocked visual snapshots generated');
