const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
// Reuse only the existing lightweight DOM fixture, not its test execution.
const fixture=fs.readFileSync(path.join(__dirname,'dragon-home-ui.test.cjs'),'utf8').split('const saved=JSON.stringify(box.dragonProfile);')[0];
const host={require,__dirname,console};vm.createContext(host);
vm.runInContext(fixture+`
run("homeDragonDisplayMesh=()=>({d:{}});prepareRestingDragon=()=>({});buildCollectionHabitat=()=>({objects:['nest','toy','water']});homeHintSeen.clear()");
el('dragonHomeBtn').onclick();run('inspectHomeDragon(0)');
assert(el('homeSceneHint').textContent.includes('Вода'));assert(!el('homeSceneHint').textContent.includes('Растения'));
assert.equal(el('homeCanvas').attrs['aria-keyshortcuts'],'N B W Enter');assert.equal(el('homeCanvas').attrs['aria-describedby'],'homeSceneHint');
const profile=JSON.stringify(box.dragonProfile);
run("let picks=0;collectionInspectionTarget=()=>{picks++;return 'object:toy'};hoverHomeInspection({pointerType:'mouse',clientX:120,clientY:80})");
assert.equal(el('homeSceneHint').textContent,'Мяч — поиграть носом · B');assert.equal(el('homeCanvas').style.cursor,'pointer');assert.equal(run('homeCareActive'),null,'Hover must not trigger care');
run("for(let i=0;i<50;i++)hoverHomeInspection({pointerType:'mouse',clientX:120,clientY:80})");assert.equal(run('picks'),1,'Ray picks were not throttled');
box.clock+=101;run("hoverHomeInspection({pointerType:'touch',clientX:120,clientY:80})");assert.equal(run('picks'),1);
run("homeTouches.set(1,[10,10]);hoverHomeInspection({pointerType:'mouse',clientX:120,clientY:80});homeTouches.clear()");assert.equal(run('picks'),1,'Hover while dragging');
run("collectionInspectionTarget=()=>{picks++;return null};hoverHomeInspection({pointerType:'mouse',clientX:120,clientY:80})");assert.equal(el('homeCanvas').style.cursor,'grab');
run("collectionDragonTouchZone=()=>null;collectionIslandObjectAt=()=>null;handleHomeCanvasTap(10,10)");assert(run('homeHintIntro'),'Empty tap hides introduction');
run("collectionIslandObjectAt=()=> 'toy';beginHomeObjectAction=()=>true;handleHomeCanvasTap(10,10)");assert(!run('homeHintIntro'));assert.equal(el('homeSceneHint').textContent,run('HOME_CAMERA_HINT'));
run('returnHomeCollection();inspectHomeDragon(1)');assert(!run('homeHintIntro'),'Repeated same island tutorial');
run("buildCollectionHabitat=()=>({objects:['nest','toy','tree']});returnHomeCollection();inspectHomeDragon(0)");assert(run('homeHintIntro'));assert(el('homeSceneHint').textContent.includes('Растения'));assert(!el('homeSceneHint').textContent.includes('Вода'));
run('clearHomeHover(true)');assert.equal(el('homeSceneHint').textContent,run('HOME_CAMERA_HINT'));
const beforeBlocked=run('picks');box.clock+=101;box.Playables={blocked:true};run("hoverHomeInspection({pointerType:'mouse',clientX:20,clientY:20})");assert.equal(run('picks'),beforeBlocked,'Blocked hover performs picking');delete box.Playables;
el('btnBackToCollection').onclick();assert.equal(el('homeCanvas').title,'');assert.equal(el('homeCanvas').style.cursor,'');assert.equal(JSON.stringify(box.dragonProfile),profile);
assert(html.includes('#homeSceneHint{overflow-wrap:anywhere;line-height:1.5}'));
console.log('PASS: habitat-specific first-visit hints, available keyboard shortcuts, hover-only feedback, 10 Hz cap, touch/drag/block guards, dismissal and unchanged saves');
`,host);
// Depth classification must choose the visible surface, not an object through a pet/prop.
const {createCanvas}=require('@napi-rs/canvas');
const box={console,Math,assert,dragonProfile:{personalities:{}},c:createCanvas(420,280)};vm.createContext(box);
for(const file of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),box);
vm.runInContext(`
const face=(zone,z)=>({zone,points:[[1,1],[38,1],[1,38]],depths:[z,z,z]}),test={width:40,height:40};
collectionObjectShapes.set(test,[face('object:toy',.3)]);collectionPickShapes.set(test,[face('head',.4)]);assert.equal(collectionInspectionTarget(test,5,5),'head');
collectionObjectShapes.set(test,[face(null,.5)]);assert.equal(collectionInspectionTarget(test,5,5),null);assert.equal(collectionInspectionTarget(test,-1,5),null);
drawCollectionDragon(c,51,{yaw:.85,pitch:.55,distance:1},0);let found=false;
for(const f of collectionObjectShapes.get(c))if(f.zone==='object:toy'){
 const x=f.points.reduce((s,p)=>s+p[0],0)/f.points.length,y=f.points.reduce((s,p)=>s+p[1],0)/f.points.length;
 if(collectionInspectionTarget(c,x,y)==='object:toy')found=true;
}assert(found,'Visible toy cannot receive hover hint');
`,box);
console.log('PASS: depth-aware pet/object hints and native rendered toy reachability');
