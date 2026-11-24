const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const events={},touches=new Map(),released=[];
const box={assert,console,cv:{addEventListener:(name,fn)=>events[name]=fn},addEventListener:()=>{},Playables:{cloud:true},
 ultPointerUp:e=>{released.push(e.pointerId);touches.delete(e.pointerId);}};
vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/state.js'),'utf8'),box);
for(const type of ['touch','pen','mouse'])for(const event of ['pointerup','pointercancel','lostpointercapture']){
 vm.runInContext('running=true;paused=false;pointer={active:true,x:150,y:200};',box);touches.clear();touches.set(17,{});touches.set(23,{});
 events[event]({pointerId:17,pointerType:type});
 const result=vm.runInContext('({active:pointer.active,x:pointer.x,y:pointer.y,running,paused})',box);
 assert.equal(result.active,type==='mouse'&&event!=='pointercancel',type+' '+event);
 assert.equal(result.x,150);assert.equal(result.y,200);assert(result.running);assert(!result.paused);
 assert(!touches.has(17));assert(touches.has(23),'Release only its own pinch participant');
 events[event]({pointerId:17,pointerType:type});assert(!touches.has(17),'Repeated cancellation is safe');
}
vm.runInContext('paused=true;pointer.active=true;',box);events.pointercancel({pointerId:23,pointerType:'touch'});
assert(vm.runInContext('paused&&!pointer.active',box));assert.equal(touches.size,0);
console.log('PASS: touch/pen release, cancellation and capture loss stop stale movement; cancelled mouse stops, normal mouse release/capture loss preserve hover movement; pinch participants cleared idempotently; pause unchanged');
