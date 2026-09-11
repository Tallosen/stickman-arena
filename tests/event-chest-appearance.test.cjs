const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'../src');
const core=fs.readFileSync(path.join(root,'core.js'),'utf8');
const render=fs.readFileSync(path.join(root,'render.js'),'utf8');
let calls=[];
const g=new Proxy({}, {get:(_,key)=>(...args)=>calls.push([key,...args]),set:(_,key,value)=>{calls.push(['set',key,value]);return true;}});
const box={g};vm.createContext(box);
vm.runInContext(core.slice(core.indexOf('const PAPER ='),core.indexOf('/* ── звук')),box);
vm.runInContext(render.slice(render.indexOf('function drawRareChest('),render.indexOf('/* ── кадр')),box);
for(const phase of [0,.7,3.1]){
 calls=[];vm.runInContext(`drawRareChest(g,1400,1400,1.1,${phase})`,box);const regular=calls;
 for(const landT of [600,300,0]){
  calls=[];vm.runInContext(`drawEliteChest(g,{x:1400,y:1400,a:${phase},dropT:0,landT:${landT}})`,box);
  assert.deepStrictEqual(calls,regular,'Event chest differs from ordinary chest after landing');
 }
}
for(const dropT of [3600,1800,1]){
 calls=[];vm.runInContext(`drawEliteChest(g,{x:1400,y:1400,a:1,dropT:${dropT},dropDuration:3600,landT:600})`,box);
 assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
 assert(calls.flat().filter(v=>typeof v==='number').every(Number.isFinite));
 assert(calls.some(c=>c[0]==='scale'&&c[1]===1.1&&c[2]===1.1));
}
console.log('PASS: ordinary and event chest render identically after landing; regular scale in flight; finite balanced parachute draw');
