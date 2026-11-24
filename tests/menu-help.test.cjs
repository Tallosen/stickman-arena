const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
let focused=null;class El{constructor(){this.children=[];this.dataset={};this.events={};this.isConnected=true;this.hidden=true;this.classList={contains:()=>this.hidden,add:()=>this.hidden=true,remove:()=>this.hidden=false};}replaceChildren(){this.children=[];}appendChild(c){this.children.push(c);}focus(){focused=this;}addEventListener(k,f){this.events[k]=f;}}
const ids=Object.fromEntries(['gameHelp','gameHelpText','gameHelpTitle','btnCloseHelp','btnReplayTutorial'].map(id=>[id,new El()]));
const buttons=[...html.matchAll(/<button\b[^>]*data-help="([^"]+)"[^>]*>/g)].map(m=>{const e=new El();e.dataset.help=m[1];return e;});
const handlers={};const box={console,pointer:{active:true},paused:true,userPaused:true,running:true,Playables:{blocked:false},document:{activeElement:null,getElementById:id=>ids[id],createElement:()=>new El(),querySelectorAll:()=>buttons,addEventListener:(k,f,capture)=>{handlers[k]=f;assert(capture===true);}}};vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(root,'src/menu-help.js'),'utf8'),box);const run=s=>vm.runInContext(s,box);
for(const b of buttons){assert.equal(b.dataset.help,'guide');b.onclick({stopPropagation(){}});assert(!ids.gameHelp.hidden);assert(ids.gameHelpText.children.length>=10);assert.equal(focused,ids.btnCloseHelp);ids.btnCloseHelp.onclick();assert(ids.gameHelp.hidden);assert.equal(focused,b);assert(box.paused&&box.userPaused&&box.running);}
const b=buttons[0],key=(k)=>({key:k,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;}});
b.onclick();let e=key('Tab');handlers.keydown(e);assert(e.prevented&&e.stopped);assert.equal(focused,ids.btnCloseHelp);
e=key('p');handlers.keydown(e);assert(e.stopped);assert(!ids.gameHelp.hidden);
e=key('Escape');handlers.keydown(e);assert(e.prevented&&e.stopped);assert(ids.gameHelp.hidden);assert.equal(focused,b);assert(box.paused);
b.onclick();ids.gameHelp.events.click({target:ids.gameHelpText,currentTarget:ids.gameHelp});assert(!ids.gameHelp.hidden);ids.gameHelp.events.click({target:ids.gameHelp,currentTarget:ids.gameHelp});assert(ids.gameHelp.hidden);
box.Playables.blocked=true;b.onclick();assert(ids.gameHelp.hidden);box.Playables.blocked=false;
run('openGameHelp("missing")');assert(ids.gameHelp.hidden);
assert(!fs.readFileSync(path.join(root,'src/menu-help.js'),'utf8').includes('localStorage'));
console.log('PASS: every help topic is wired, Escape closes only help, shortcuts isolated, focus returns, Tab trapped, backdrop-only dismissal, platform guard and no save/game-state mutation');
