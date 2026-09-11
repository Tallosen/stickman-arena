const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const ui=fs.readFileSync(path.join(__dirname,'../src/ui.js'),'utf8');let calls=[];
const g=new Proxy({}, {get:(_,key)=>(...args)=>calls.push([key,...args]),set:(_,key,value)=>{calls.push(['set',key,value]);return true;}});
const box={assert,g};vm.createContext(box);
vm.runInContext(`const INK='#2b2620',FOE='#c8402c',RUN_STAGES=20;let full=false,done=false;
function heroBuildComplete(){return full;}function campaignComplete(){return done;}function stageRemaining(){return 31000;}
function campaignRemaining(){return 243000;}function formatRunTime(ms){return Math.floor(ms/60000)+':'+String(Math.floor(ms/1000)%60).padStart(2,'0');}
`+ui.slice(ui.indexOf('const hudHeight'),ui.indexOf('function hud()')),box);
for(const width of [280,320,360,390,559,560,786,1440])for(const hpMax of [5,7,15,19,99])for(const xp of [-1,0,50,100,150]){
 box.width=width;box.hpMax=hpMax;box.xp=xp;calls=[];
 vm.runInContext(`{
 const L=topHUDLayout(width);assert(L.left.x+L.left.w+8<=L.right.x+.01);assert(L.right.x+L.right.w<width);
 assert(L.left.w<=264);assert(L.left.y+L.left.h<=hudHeight());
 const p={lvl:36,hp:hpMax-.5,hpMax,xp,xpNext:100,stage:20};drawTopHUD(g,width,p);
 }`,box);
 assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
 assert(calls.flat().filter(v=>typeof v==='number').every(Number.isFinite));
 for(const c of calls.filter(c=>c[0]==='roundRect')){assert(c[3]>=0&&c[4]>=0);assert(c[1]>=0&&c[1]+c[3]<=width);}
 assert(!calls.some(c=>c[0]==='fillText'&&String(c[1]).includes('ФУЛЛ')));
 assert(calls.some(c=>c[0]==='fillText'&&c[1]===(hpMax-.5)+'/'+hpMax));
}
calls=[];vm.runInContext(`done=true;full=true;drawTopHUD(g,320,{lvl:36,hp:0,hpMax:19,xp:0,xpNext:100,stage:20});`,box);
for(const label of ['MAX','АЛТАРЬ ОТКРЫТ','ДРАКОН ЧЕРЕЗ','4:03','0/19'])assert(calls.some(c=>c[0]==='fillText'&&c[1]===label),label);
console.log('PASS: 8 widths × 5 HP limits × 5 XP values, separated panels, bounded XP, exact HP, balanced drawing, MAX and finale timer');
