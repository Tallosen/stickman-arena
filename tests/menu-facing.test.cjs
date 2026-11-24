const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const box={assert};vm.createContext(box);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/menu-scene.js'),'utf8'),box);
vm.runInContext(`
let left=0,right=0,front=0,back=0;
for(let seed=0;seed<10;seed++)for(let t=0;t<160;t+=.03){
 const p=menuHeroPose(t,seed),n=menuHeroPose(t+.001,seed),s=menuSchedule(t,seed);
 assert(Math.abs(p.yaw-n.yaw)<.012,'Head snaps during turn');
 if(p.activity==='walk'){
  if(s.kind===4){
   if(s.u<5.5){front++;assert(Math.cos(p.yaw)>.99);}else{back++;assert(Math.cos(p.yaw)<-.99);}
  }else if(n.x<p.x-1e-6){left++;assert(Math.sin(p.yaw)<-.99,'Walking left while looking right');}
  else if(n.x>p.x+1e-6){right++;assert(Math.sin(p.yaw)>.99,'Walking right while looking left');}
 }
 if(p.activity==='stepBack')assert(Math.sin(p.yaw)<-.99,'Small return step faces wrong way');
 assert(p.blink>=0&&p.blink<=1);
}
assert(left&&right&&front&&back);
`,box);
console.log('PASS: left/right travel faces motion, approach faces viewer, departure shows back, continuous pivots and blinking');
