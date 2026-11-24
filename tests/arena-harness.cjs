const fs=require('fs'),path=require('path'),vm=require('vm');
module.exports=function arenaHarness({native=false,width=900,height=620,sourceRoot=path.join(__dirname,'..')}={}){
 const noop=()=>{},createCanvas=native?require('@napi-rs/canvas').createCanvas:null;
 const canvas=native?createCanvas(width,height):null;
 const ctx=canvas?canvas.getContext('2d'):new Proxy({measureText:s=>({width:String(s).length*7}),createRadialGradient:()=>({addColorStop:noop})},{get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
 const els=new Map(),el=()=>({style:{},dataset:{},setAttribute:noop,classList:{add:noop,remove:noop,toggle:noop,contains:()=>true},addEventListener:noop,getContext:()=>ctx,appendChild:noop});
 let frame;
 const box={console,VACKY_DEV:true,document:{body:el(),getElementById(id){if(!els.has(id))els.set(id,el());return els.get(id)},createElement(tag){return native&&tag==='canvas'?createCanvas(256,256):el()},addEventListener:noop},
 innerWidth:width,innerHeight:height,devicePixelRatio:1,addEventListener:noop,requestAnimationFrame:fn=>{frame=fn},setTimeout:noop,localStorage:{getItem:()=>null,setItem:noop},hud:noop};
 box.window=box;box.canvas=canvas;vm.createContext(box);
 // core.js acquires the main canvas by ID.
 if(canvas){canvas.addEventListener=noop;canvas.style={};els.set('game',canvas);els.set('c',canvas);}
 for(const f of ['core','config','map-art','arena-secrets','pets','draw-pets','ult','state','progression','world','enemy-hazards','combat','abilities','dragons','bosses','boss-loot','arena-ending','update','draw-hero','draw-foe','render'])vm.runInContext(fs.readFileSync(path.join(sourceRoot,'src',f+'.js'),'utf8'),box,{filename:f});
 vm.runInContext('function offerCards(){queuedLevels=0;paused=false;} function gameOver(){running=false;} for(const key of Object.keys(SFX))SFX[key]=()=>{};',box);
 return {box,canvas,ctx,run:code=>vm.runInContext(code,box),frame:now=>frame(now)};
};
