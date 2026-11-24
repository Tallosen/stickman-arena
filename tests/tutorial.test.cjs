const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'..'),db=new Map();
function setup(existing=false,language=null){
 let time=1000,home=false,book=false,level=false;const els={},handlers={};
 const doc={activeElement:null,getElementById:id=>els[id]||(els[id]=new El(id)),addEventListener:(name,f)=>handlers[name]=f};
 class El{constructor(id){this.id=id;this.style={};this.isConnected=true;this.hidden=true;this.classList={contains:()=>this.hidden,add:()=>this.hidden=true,remove:()=>this.hidden=false,toggle:(_,v)=>this.hidden=v};}focus(){doc.activeElement=this;}getClientRects(){return this.hidden?[]:[{}];}getBoundingClientRect(){return this.id==='tutorialCard'?{left:14,top:16,width:292,height:230}:{left:40,top:80,width:220,height:48};}}
 const box={assert,console,innerWidth:320,innerHeight:568,document:doc,performance:{now:()=>time},addEventListener(){},pointer:{active:true},paused:false,userPaused:false,running:false,dragonFinale:null,dragonAltar:null,ult:{on:false},inventory:{gas:0},meta:{best:existing?10:0},dragonProfile:{rescues:0,counts:{},exclusives:{}},P:{runMs:0,item:null},homeTab:'incubator',caveHeld:null,dragonHomeOpen:()=>home,dragonBookOpen:()=>book,levelOpen:()=>level,ultReady:()=>box.ready||false,gameHelpOpen:()=>false,closeGameHelp(){},Playables:{blocked:false,storage:{getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,v)}}};
 vm.createContext(box);if(language){box.navigator={language};vm.runInContext(fs.readFileSync(path.join(root,'src/language-packs.js'),'utf8'),box);vm.runInContext(fs.readFileSync(path.join(root,'src/localization.js'),'utf8'),box);}vm.runInContext(fs.readFileSync(path.join(root,'src/tutorial.js'),'utf8'),box);const run=s=>vm.runInContext(s,box);
 const tick=(ms=7000)=>{time+=ms;run('tickTutorial('+time+')');};
 const done=()=>run('finishTutorial()'),id=()=>run('tutorialActive?.id');
 return {box,run,tick,done,id,el:doc.getElementById,home:v=>home=v,book:v=>book=v,level:v=>level=v};
}
let t=setup();t.el('start').hidden=false;t.el('btnStart').hidden=false;t.tick();assert.equal(t.id(),'welcome');assert.equal(t.el('tutorial').hidden,false);t.done();assert.equal(t.id(),undefined);assert(JSON.parse(db.get('vacky_tutorial_v1')).seen.welcome);
t.el('start').hidden=true;t.box.running=true;t.tick(300);assert.equal(t.id(),'move','First movement should not wait behind cooldown');assert(t.box.paused);t.done();assert(!t.box.paused);
t.tick();assert.equal(t.id(),undefined);t.box.P.runMs=9000;t.tick();assert.equal(t.id(),'health');t.done();
t.level(true);t.box.paused=true;t.el('cards').hidden=false;t.tick(300);assert.equal(t.id(),'upgrade');t.done();assert(t.box.paused,'Upgrade stays paused');t.level(false);t.box.paused=false;
t.box.P.item='ice';t.tick();assert.equal(t.id(),'item');t.done();t.box.ready=true;t.tick();assert.equal(t.id(),'ultimate');t.done();t.box.inventory.gas=1;t.tick();assert.equal(t.id(),'inventory');t.done();t.box.P.runMs=23000;t.tick();assert.equal(t.id(),'menu');t.done();
t.box.userPaused=true;t.box.paused=true;t.el('pause').hidden=false;t.tick(300);assert.equal(t.id(),undefined);t.done();assert(t.box.paused&&t.box.userPaused);
t.home(false);t.el('pause').hidden=true;t.box.userPaused=false;t.box.paused=false;t.box.P.stage=5;t.box.isBossStage=s=>s%5===0;t.tick();assert.equal(t.id(),'altar');t.done();t.box.running=false;t.el('dragonVictory').hidden=false;t.tick(300);assert.equal(t.id(),undefined);
const stored=db.get('vacky_tutorial_v1');let reload=setup();reload.el('start').hidden=false;reload.tick();assert.equal(reload.id(),undefined);assert.equal(db.get('vacky_tutorial_v1'),stored);
reload.run('replayTutorial()');assert.equal(reload.id(),'welcome');reload.run('finishTutorial(true)');assert(JSON.parse(db.get('vacky_tutorial_v1')).disabled);reload.tick();assert.equal(reload.id(),undefined);
reload=setup();reload.el('start').hidden=false;reload.tick();assert.equal(reload.id(),undefined);
reload.box.Playables.blocked=true;reload.run('replayTutorial()');assert.equal(reload.id(),undefined);reload.box.Playables.blocked=false;reload.run('replayTutorial()');assert.equal(reload.id(),'welcome');
reload.box.Playables.blocked=true;reload.done();assert.equal(reload.id(),'welcome');reload.box.Playables.blocked=false;reload.done();
db.clear();t=setup(true);t.el('start').hidden=false;t.tick();assert.equal(t.id(),undefined,'Existing player should not be interrupted');t.run('replayTutorial()');assert.equal(t.id(),'welcome');
for(const width of [280,320,390,768]){t.box.innerWidth=width;for(const height of [320,568,844]){t.box.innerHeight=height;t.run('positionTutorial()');const left=parseFloat(t.el('tutorialCard').style.left),top=parseFloat(t.el('tutorialCard').style.top);assert(left>=0&&left<width);assert(top>=0&&top<height);}}
db.set('vacky_tutorial_v1','broken');const broken=setup();broken.tick();assert.equal(broken.id(),undefined);assert.equal(db.get('vacky_tutorial_v1'),'broken');
db.clear();const english=setup(false,'en-US');english.el('start').hidden=false;english.tick();assert.equal(english.id(),'welcome');assert.equal(english.el('tutorialTitle').textContent,'Welcome!');english.done();assert(JSON.parse(db.get('vacky_tutorial_v1')).seen.welcome);
console.log('PASS: 9 arena contextual steps, automatic first visit in RU/EN, reload/skip/replay, immediate movement, paced battle tips, pause ownership, platform blocking, old/corrupt profile handling and bounded card positioning');
