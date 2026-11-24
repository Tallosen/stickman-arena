const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),make=require('./arena-harness.cjs');
const root=path.join(__dirname,'..');

// A small live tree, not a registry of every element ever created: detached
// controls must really disappear from getElementById after a panel rebuild.
function setup(){
 const h=make(),events={};let document;
 h.ctx.createLinearGradient=()=>({addColorStop(){}});
 class Element{
  constructor(tag='div'){
   this.tag=tag;this.children=[];this.parentNode=null;this.style={};this.dataset={};this.attrs={};this.events={};this.scrollTop=0;this._text='';this._class='';this.disabled=false;
   this.classList={contains:k=>this._class.split(/\s+/).includes(k),add:(...keys)=>{this._class=[...new Set([...this._class.split(/\s+/).filter(Boolean),...keys])].join(' ');},remove:(...keys)=>{this._class=this._class.split(/\s+/).filter(k=>!keys.includes(k)).join(' ');},toggle:(k,on)=>{on=on??!this.classList.contains(k);this.classList[on?'add':'remove'](k);return on;}};
  }
  get className(){return this._class;}set className(value){this._class=String(value);}
  get textContent(){return this._text+this.children.map(e=>e.textContent).join('');}set textContent(value){this._text=String(value??'');this.replaceChildren();}
  set innerHTML(value){assert.equal(value,'','Camp UI uses explicit DOM nodes');this._text='';this.replaceChildren();}get innerHTML(){return '';}
  appendChild(child){child.parentNode=this;this.children.push(child);return child;}
  replaceChildren(...children){for(const child of this.children)child.parentNode=null;this.children=[];for(const child of children)this.appendChild(child);}
  get lastChild(){return this.children.at(-1)||null;}get firstChild(){return this.children[0]||null;}
  get isConnected(){return this===document.body||!!this.parentNode?.isConnected;}
  setAttribute(key,value){this.attrs[key]=String(value);if(key==='id')this.id=String(value);}
  getAttribute(key){return this.attrs[key]??null;}removeAttribute(key){delete this.attrs[key];}
  addEventListener(key,fn){(this.events[key]??=[]).push(fn);}
  contains(element){return this===element||this.children.some(child=>child.contains(element));}
  querySelectorAll(selector){const all=this.children.flatMap(child=>[child,...child.querySelectorAll('*')]);return all.filter(e=>selector==='*'||selector.startsWith('.')&&e.classList.contains(selector.slice(1))||selector.startsWith('#')&&e.id===selector.slice(1)||selector==='button:not(:disabled)'&&e.tag==='button'&&!e.disabled||e.tag===selector);}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  focus(){document.activeElement=this;}scrollIntoView(){}getContext(){return h.ctx;}
 }
 document={body:new Element(),activeElement:null,createElement:tag=>new Element(tag),getElementById:id=>document.body.querySelectorAll('*').find(e=>e.id===id)||null,querySelectorAll:selector=>document.body.querySelectorAll(selector),addEventListener:(key,fn)=>{(events[key]??=[]).push(fn);}};
 const add=(id,parent=document.body,tag='div')=>{const e=new Element(tag);e.id=id;parent.appendChild(e);return e;};
 add('start');const dialog=add('campDialog');dialog.className='hidden';const panel=add('campPanel',dialog);add('campTitle',panel,'h2');add('btnCloseCamp',panel,'button');add('campContent',panel);
 for(const id of ['btnCamp','campMenuLabel','campDockTitle','campDock','campDockNav','campEquipmentLabel','campTrialsLabel','campDockProgress','campNextGoal','campMenuStatus','campLoadoutSummary'])add(id);
 document.activeElement=document.getElementById('btnCamp');
 h.box.document=document;h.box.performance={now:()=>1000};h.box.Playables={blocked:false,cloud:false,storage:{getItem:()=>null,setItem:()=>{if(h.box.failWrite)throw Error('Storage unavailable');}}};
 h.box.failWrite=false;h.box.assert=assert;
 h.run(`let uiLanguage='ru',menuScenePainted=false,menuHasRun=false,menuDeparture=null,languageMenuActive=false;
 function tutorialOpen(){return false;}function gameHelpOpen(){return false;}function settingsOpen(){return false;}
 function soundCue(){};reset();`);
 for(const file of ['camp-progress','camp-ui'])h.run(fs.readFileSync(path.join(root,'src',file+'.js'),'utf8'));
 return {h,document,el:id=>document.getElementById(id)};
}
const {h,document,el}=setup();
const click=node=>{assert(node,'Missing button');assert.equal(typeof node.onclick,'function');return node.onclick({stopPropagation(){},preventDefault(){}});};
const content=()=>el('campContent'),snapshot=()=>h.run('JSON.stringify({P,inventory,ult})');
const openDetails=()=>content().querySelectorAll('.camp-quest-detail').filter(e=>!e.hidden);
const full=`campProfile={...blankCamp(),kills:500,bosses:4,stage:20,wins:1,shotgunStage:10,clean:1,bossTypes:[...CAMP_BOSSES],trialWins:{rush:true},best:{normal:900000,rush:1000000}};`;

for(const language of ['ru','en'])for(const complete of [false,true]){
 h.run(`closeCampPanel();uiLanguage=${JSON.stringify(language)};campReadOnly=false;campSaveError=false;campProfile=blankCamp();${complete?full:''}`);
 const before=snapshot();assert(h.run(`openCampPanel('campEquipment')`));
 assert.equal(h.run('campEquipmentView'),'weapons');assert(el('arsenalFire'));assert(!el('campStylePreview'));assert(!el('camp-style-classic'));
 for(const weapon of ['basic','shotgun','sniper','laser']){
  const b=el('camp-weapon-'+weapon);assert(b?.querySelector('canvas'),'Weapon choices need an image');
  assert.equal(b.disabled,!complete&&weapon!=='basic');
  if(b.disabled)assert(b.textContent.trim().length>5,'A locked weapon needs a visible reason');
  assert(b.textContent.length<100,'Primary choices must remain compact');
 }
 for(let level=0;level<5;level++){
  const b=el('arsenal-level-'+level);assert(b?.querySelector('canvas'),'Evolution steps must show the model');
  assert(b.textContent.trim().length<=5,'Only a short tier marker belongs in the evolution strip');
  assert((b.getAttribute('aria-label')||'').length>3,'Compact evolution steps need accessible names');
  click(b);assert.equal(el('arsenal-level-'+level).getAttribute('aria-pressed'),'true');
 }
 assert(content().textContent.length<700,'Weapons view still reads like a long description');
 const oldFire=el('arsenalFire'),oldLevel=el('arsenal-level-0'),oldWeapon=el('camp-weapon-basic');
 click(el('campEquipment-appearance'));
 assert.equal(h.run('campEquipmentView'),'appearance');assert(el('campStylePreview'));assert(!el('arsenalFire'));assert(!el('camp-weapon-basic'));
 assert.equal(content().querySelectorAll('button').filter(b=>b.id?.startsWith('camp-style-')).length,6);
 const stored=h.run('JSON.stringify(campProfile)'),preview=h.run('arsenalPreviewLevel');
 click(oldFire);click(oldLevel);click(oldWeapon);assert.equal(h.run('JSON.stringify(campProfile)'),stored);assert.equal(h.run('arsenalPreviewLevel'),preview);
 for(const style of ['classic','tide','ember','ranger','royal','astral']){
  const b=el('camp-style-'+style);assert(b?.querySelector('canvas'));assert.equal(b.disabled,!complete&&style!=='classic');
  if(b.disabled)assert(b.textContent.trim().length>5,'A locked cape needs a visible reason');
 }
 assert(content().textContent.length<900,'Appearance view should not be another manual');
 const oldStyle=el('camp-style-classic');click(el('campNav-campGoals'));
 assert.equal(content().querySelectorAll('article').length,8);assert(!el('campStylePreview'));assert(!el('arsenalFire'));
 const first=el('camp-goal-first'),ten=el('camp-goal-ten');assert(first&&ten);
 click(first);assert.equal(el('camp-goal-first').getAttribute('aria-expanded'),'true');
 assert.equal(openDetails().length,1);assert(openDetails()[0].textContent.length>10);
 assert(openDetails()[0].textContent.includes(h.run("campText('first')")),'Expanded quest must explain its actual condition');
 assert(openDetails()[0].textContent.includes(h.run("campText('firstReward')")),'Expanded quest must explain the actual reward');
 click(el('camp-goal-ten'));assert.equal(el('camp-goal-ten').getAttribute('aria-expanded'),'true');
 assert.equal(el('camp-goal-first').getAttribute('aria-expanded'),'false');assert.equal(openDetails().length,1);
 const activeGoal=h.run('campExpandedGoal');click(first);assert.equal(h.run('campExpandedGoal'),activeGoal,'Detached quest button reopened a panel');
 click(oldStyle);assert.equal(h.run('JSON.stringify(campProfile)'),stored);
 click(el('campNav-campTrials'));for(const mode of ['normal','rush','elites','bosses']){
  const b=el('camp-trial-'+mode);assert(b);assert.equal(b.disabled,!complete&&mode!=='normal');
  const amount={rush:'15',elites:'30',bosses:'25'}[mode];if(amount)assert(b.textContent.includes(amount),'Trial modifier is not visible');
 }
 assert.equal(snapshot(),before,'Browsing or previewing changed the current run');
 h.run('closeCampPanel();');assert(h.run(`openCampPanel('campEquipment')`));assert.equal(h.run('campEquipmentView'),'weapons');
}

h.run(`closeCampPanel();${full}openCampPanel('campEquipment');`);
click(el('arsenal-level-4'));assert.equal(h.run('arsenalPreviewLevel'),4);
const beforeChoice=snapshot();click(el('camp-weapon-shotgun'));assert.equal(h.run('campProfile.weapon'),'shotgun');assert.equal(snapshot(),beforeChoice,'Loadout selection changed the current battle');
assert.equal(h.run('arsenalPreviewLevel'),0,'A newly selected branch must show its actual starting form');
h.box.failWrite=true;click(el('camp-weapon-sniper'));assert.equal(h.run('campProfile.weapon'),'shotgun','Failed save selected a weapon');
assert(h.run('campSaveError'));assert(content().querySelector('.camp-save-warning').textContent.length>15);assert(el('campRetrySave'));
h.box.failWrite=false;click(el('campRetrySave'));assert(!h.run('campSaveError'));assert.equal(h.run('campProfile.weapon'),'shotgun');
h.run('campReadOnly=true;renderCampPanel();');assert(el('camp-weapon-basic').disabled);assert(content().querySelector('.camp-save-warning').textContent.length>15);assert(!el('campRetrySave'));
h.run('campReadOnly=false;renderCampPanel();');h.box.Playables.blocked=true;
const section=h.run('campEquipmentView'),profile=h.run('JSON.stringify(campProfile)');click(el('campEquipment-appearance'));click(el('camp-weapon-basic'));
assert.equal(h.run('campEquipmentView'),section);assert.equal(h.run('JSON.stringify(campProfile)'),profile);h.box.Playables.blocked=false;
const staleTab=el('campEquipment-appearance');h.run('closeCampPanel();');click(staleTab);assert.equal(h.run('campEquipmentView'),section,'Closed panel changed subtab');

// Native rendering: the arrow starts at the rendered bow's muzzle, including
// the rest-pose anchor introduced for reachable arms in 0.203.
const native=make({native:true,width:520,height:230});native.box.assert=assert;
for(const file of ['camp-progress','camp-ui'])native.run(fs.readFileSync(path.join(root,'src',file+'.js'),'utf8'));
const nativeGet=native.box.document.getElementById,fire={};native.box.testFire=fire;
native.box.document.getElementById=id=>id==='arsenalPreview'?native.canvas:id==='arsenalFire'?fire:nativeGet(id);
native.run(`reset();campPanelActive=true;campActiveSection='campEquipment';campEquipmentView='weapons';campProfile.weapon='sniper';arsenalPreviewLevel=0;
let gunMatrix=null,drawnTip=null,projectileLines=[];const oldGun=drawGunModel,oldLine=sline;
drawGunModel=(g,...args)=>{gunMatrix=g.getTransform();const t=gunMuzzlePoint('sniper',0);drawnTip=[gunMatrix.a*t.x+gunMatrix.c*t.y+gunMatrix.e,gunMatrix.b*t.x+gunMatrix.d*t.y+gunMatrix.f];return oldGun(g,...args);};
sline=(g,x1,y1,x2,y2)=>{if(g.strokeStyle==='#805b35'&&Math.abs(y1-y2)<1e-7)projectileLines.push([x1,y1,x2,y2]);return oldLine(g,x1,y1,x2,y2);};
soundCue=()=>{};assert(fireArsenalPreview(testFire,1000));drawArsenalPreview(1010,true);
assert(drawnTip&&projectileLines.length,'Bow preview did not emit a visible arrow');
assert(projectileLines.some(line=>Math.hypot(line[0]-drawnTip[0],line[1]-drawnTip[1])<.001),'Preview arrow begins away from the drawn bow');
drawGunModel=oldGun;sline=oldLine;
`);
console.log('PASS: concise separated camp views in RU/EN, fresh/full unlocks, one quest detail, stale/closed/host-pause guards, next-run selection and save rollback, native bow muzzle alignment. DOM/CSS checks do not certify browser layout.');
