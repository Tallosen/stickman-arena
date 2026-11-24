const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),make=require('./arena-harness.cjs');
const ui=fs.readFileSync(path.join(__dirname,'../src/ui.js'),'utf8');
for(const [width,height] of [[320,720],[390,844],[844,390],[1440,900]]){
 const h=make({native:true,width,height});h.box.assert=assert;
 h.run(ui.slice(ui.indexOf('const hudHeight'),ui.indexOf('function hud()')));h.run(ui.slice(ui.indexOf('let radarNear='),ui.indexOf('const useBtn')));
 h.run(`reset();running=true;props=[];P.x=50;P.y=50;P.aim=.3;let m=radarLayout(),p=radarPoint(P.x,P.y);assert.equal(p.x,m.x+P.x*m.size/WORLD);assert(toggleRadar());m=radarLayout();p=radarPoint(P.x,P.y);assert.equal(p.x,m.x+m.size/2);assert.equal(p.y,m.y+m.size/2);assert.equal(m.range,680);radar();assert(toggleRadar());assert.equal(radarLayout().range,WORLD);radar();paused=true;assert(!toggleRadar());paused=false;
 cv.getBoundingClientRect=()=>({left:0,top:0});let stop=0;pointer.active=true;assert(radarPointerDown({clientX:m.x+20,clientY:m.y+20,preventDefault(){},stopImmediatePropagation(){stop++;}}));assert.equal(stop,1);assert(!pointer.active);assert(radarConsumesPointer({clientX:m.x+20,clientY:m.y+20}));assert(!radarConsumesPointer({clientX:10,clientY:300}));
 `);
 if(process.argv.includes('--frames')&&width===390){h.run(`props=[{x:90,y:100,r:28}];enemies=[{x:170,y:130,hp:3},{x:260,y:220,hp:40,boss:true}];P.x=110;P.y=150;ctx.fillStyle='#eee3ca';ctx.fillRect(0,0,W,H);radarNear=false;radar();drawTopHUD(ctx,W,P);`);fs.writeFileSync(path.join(__dirname,'../audit/radar-full-v0189.png'),h.canvas.toBuffer('image/png'));h.run("ctx.fillStyle='#eee3ca';ctx.fillRect(0,0,W,H);radarNear=true;radar();drawTopHUD(ctx,W,P);");fs.writeFileSync(path.join(__dirname,'../audit/radar-near-v0189.png'),h.canvas.toBuffer('image/png'));}
}
console.log('PASS: full/near map projection, hero centering at map edge, four sizes, clipping, toggle pause and consumed pointer input');
