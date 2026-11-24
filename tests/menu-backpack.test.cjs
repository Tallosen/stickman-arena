const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'../src/draw-hero.js'),'utf8');
const box={TIER:['none','green','blue','purple']};vm.createContext(box);
box.INK='#2b2620';
const combat=fs.readFileSync(path.join(__dirname,'../src/combat.js'),'utf8');
vm.runInContext(combat.slice(combat.indexOf('function backpackPort('),combat.indexOf('function heroCombatPoint(')),box);
vm.runInContext(source.slice(source.indexOf('function menuBackpackFrame('),source.indexOf('function drawCombatBackpack(')),box);
const pose={neck:-52,hip:-25,yaw:0};
const rig=(yaw,extra={})=>box.menuBackpackGeometry(3,{...pose,yaw,...extra});
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
assert(rig(-Math.PI/2).project([0,0,-15])[0]>14,'Left-facing hero must carry pack on screen right');
assert(rig(Math.PI/2).project([0,0,-15])[0]<-14,'Right-facing hero must carry pack on screen left');
assert.equal(rig(0).foreground,false);assert.equal(rig(Math.PI).foreground,true);
near(rig(0).strapOpacity,1);near(rig(Math.PI).strapOpacity,0);
for(let level=1;level<=3;level++){
 const back=box.menuBackpackGeometry(level,{...pose,yaw:Math.PI});
 const panel=back.faces.find(f=>f.surface==='rear-panel');
 assert(panel&&panel.color===box.TIER[level],'Rear armor must retain its equipment-tier color');
 assert.equal(back.faces.filter(f=>f.surface==='rear-cell').length,level);
 const widths=back.faces.filter(f=>f.surface==='module').map(f=>Math.max(...f.points.map(p=>p[0]))-Math.min(...f.points.map(p=>p[0])));
 assert(widths.every(w=>w<=2.11),'Side modules must not become full-width gray slabs from behind');
 assert(back.faces.filter(f=>f.surface==='module').every(f=>f.points.every(p=>Math.abs(p[0])>5)), 'Modules must leave the center of the rear panel visible');
 assert.equal(back.faces.some(f=>f.surface==='rear-core'),level===3);
}
for(let i=0;i<=720;i++){
 const yaw=-Math.PI+i*Math.PI/360,a=rig(yaw),b=rig(yaw,{neck:pose.neck+7,hip:pose.hip+7});
 assert(a.strapOpacity>=0&&a.strapOpacity<=1);
 assert.deepStrictEqual(a.faces,rig(yaw,{headYaw:yaw+1}).faces,'Head movement must not twist backpack');
 for(let j=0;j<a.faces.length;j++){
  const face=a.faces[j];
  if(j)assert(face.depth>=a.faces[j-1].depth,'Backpack faces not depth sorted');
  face.points.forEach((p,k)=>{
   assert(p.every(Number.isFinite));near(p[0],b.faces[j].points[k][0]);near(p[1]+7,b.faces[j].points[k][1]);
  });
 }
 // Frame projection is continuous through both profile-layer transitions.
 const p=a.project([9,-40,-30]),q=rig(yaw+1e-5).project([9,-40,-30]);
 assert(Math.hypot(p[0]-q[0],p[1]-q[1])<.001);
}
assert(box.menuBackpackGeometry(3,pose).faces.length>box.menuBackpackGeometry(2,pose).faces.length);
assert(box.menuBackpackGeometry(3,pose).faces.some(f=>f.color==='#bce1e3'),'Missing original cyan tier-three core');
let fillPoints=[];
const calls=[],g={save(){calls.push('save')},restore(){calls.push('restore')},beginPath(){fillPoints=[]},moveTo(...p){fillPoints.push(p)},lineTo(...p){fillPoints.push(p)},closePath(){},fill(){calls.push({points:fillPoints,color:this.fillStyle})}};
box.spoly=(_g,points,color)=>calls.push({points,color});box.INK='black';
box.drawMenuBackpack(g,3,pose,2);
assert.equal(calls[0],'save');assert.equal(calls.at(-1),'restore');
assert.equal(JSON.stringify(calls.slice(1,-1)),JSON.stringify(rig(0).faces.map(f=>({points:f.points,color:f.color}))));
// The battle renderer consumes the exact same canonical hull/panel/cells/barrel.
const battleStart=source.indexOf('function drawCombatBackpack('),battleEnd=source.indexOf('/* ── человечек:',battleStart);
vm.runInContext(source.slice(battleStart,battleEnd),box);
const polygons=[];
box.spoly=(_g,points,color)=>polygons.push({points:JSON.parse(JSON.stringify(points)),color});
box.scircle=()=>{};box.sline=()=>{};
const battleContext={save(){},restore(){},scale(){},translate(){},rotate(){}};
for(let level=1;level<=3;level++){
 polygons.length=0;
 box.drawCombatBackpack(battleContext,1,level,{neck:pose.neck,hip:pose.hip},null,2.2,1.4);
 const model=JSON.parse(JSON.stringify(box.heroBackpackModel(level,pose)));
 assert.deepStrictEqual(polygons[0].points,model.hull);
 assert.deepStrictEqual(polygons[1].points,model.panel);
 for(let i=0;i<level;i++)assert.deepStrictEqual(polygons[2+i].points,model.cells[i]);
 for(let i=0;i<level;i++)assert.deepStrictEqual(polygons[2+level+i].points,model.barrel);
 // In profile, projection preserves original side contours (only a constant
 // camera-depth offset affects height). No alternate menu silhouette.
 const profile=box.menuBackpackGeometry(level,{...pose,yaw:Math.PI/2});
 for(const outline of [model.hull,model.panel,...model.cells]){
  assert(profile.faces.some(f=>f.points.length===outline.length&&f.points.every((p,i)=>Math.abs(p[0]-outline[i][0])<1e-8)),'Menu has drifted from the arena equipment');
 }
}
console.log('PASS: backpack follows torso at 721 angles, correct sides/depth/straps, continuous projection, breathing attachment and independent head turn');
