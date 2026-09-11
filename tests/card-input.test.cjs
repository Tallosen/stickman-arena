const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const box={console,assert};vm.createContext(box);
vm.runInContext(`
const pointer={active:true};
const document={createElement:()=>({listeners:{},addEventListener(k,fn){this.listeners[k]=fn},
 querySelector:()=>({getContext:()=>({})}),setPointerCapture(){}})};
function list(){return {children:[],scrollTop:0,appendChild(el){this.children.push(el)}};}
function emit(el,type,extra={}){el.listeners[type]?.({pointerId:1,isPrimary:true,button:0,clientX:100,clientY:100,preventDefault(){},stopPropagation(){},...extra});}
`,box);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/cards.js'),'utf8'),box);
vm.runInContext(`
let picked=0;const panel=list();
function next(){panel.cardChoice={accepted:false};card(panel,()=>{},'Test','Text',()=>picked++);return panel.children.at(-1);}
let el=next();assert.equal(el.type,'button');
emit(el,'pointerdown');emit(el,'pointerup');assert.equal(picked,1);assert.equal(pointer.active,false);
el.onclick({detail:1});el.onclick({detail:0});assert.equal(picked,1);
card(panel,()=>{},'Other','',()=>picked++);panel.children.at(-1).onclick({detail:0});assert.equal(picked,1);
const stale=el;el=next();stale.onclick({detail:0});assert.equal(picked,1);
emit(el,'pointerdown');emit(el,'pointermove',{clientY:106});emit(el,'pointerup',{clientY:106});assert.equal(picked,2,'First tap with small finger drift');
for(const cancel of ['drag','cancel','lost','scroll','secondary','far-up']){
 el=next();emit(el,'pointerdown');
 if(cancel==='drag'){emit(el,'pointermove',{clientY:125});emit(el,'pointermove',{clientY:100});}
 if(cancel==='cancel')emit(el,'pointercancel');
 if(cancel==='lost')emit(el,'lostpointercapture');
 if(cancel==='scroll')panel.scrollTop+=15;
 if(cancel==='secondary')emit(el,'pointerdown',{pointerId:2,isPrimary:false});
 emit(el,'pointerup',cancel==='far-up'?{clientX:130}:{});el.onclick({detail:1});assert.equal(picked,2,cancel);
 // The very next tap must still work.
 emit(el,'pointerdown');emit(el,'pointerup');assert.equal(picked,3,cancel+' recovery');picked=2;
}
el=next();el.onclick({detail:0});assert.equal(picked,3,'Keyboard activation');
el=next();el.onclick({detail:1});assert.equal(picked,4,'Click fallback');
console.log('PASS: first tap, finger drift, duplicate click, sibling/stale offers, scroll/drag/cancel/multitouch, recovery, keyboard');
`,box);
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
assert(html.includes('overflow-x:hidden;padding:3px 6px 7px 3px'));
assert(html.includes('flex:0 0 auto'));
assert(!/\.card:active\{[^}]*transform/.test(html));
assert(html.includes('.card>*{pointer-events:none}'));
console.log('PASS: horizontal clipping, shadow inset, stable hit boxes, non-shrinking cards, decorative children');
