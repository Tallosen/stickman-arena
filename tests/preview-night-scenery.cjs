const fs=require('fs'),path=require('path'),h=require('./arena-harness.cjs')({native:true,width:900,height:620});
const {createCanvas}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'../../..'),tag=h.run('VERSION').replace('.','');
h.run('reset();running=true;pops=[];t=1200;');
const sheet=createCanvas(1000,530),g=sheet.getContext('2d');h.box.gallery=g;
g.fillStyle='#f0e6d3';g.fillRect(0,0,1000,530);
for(const [row,amount] of [0,1].entries())for(let i=0;i<4;i++){
 g.save();g.translate(i*250,row*265);g.fillStyle=row?'#596073':'#f0e6d3';g.fillRect(0,0,250,265);
 g.fillStyle=row?'#f6e9c9':'#65583f';g.font='14px sans-serif';g.fillText(['Campfire','Stone brazier','Bound torch','Tripod'][i]+(row?' / night':' / day'),16,25);
 g.translate(125,185);g.scale(2.6,2.6);
 h.run(`drawNightScenery(gallery,{x:0,y:0,kind:NIGHT_SCENERY_TYPES[${i}],seed:.3,radius:170},${amount});`);g.restore();
}
fs.writeFileSync(path.join(root,'preview-night-props-v'+tag+'.png'),sheet.toBuffer('image/png'));
const mapSheet=createCanvas(1800,1240),mg=mapSheet.getContext('2d');
for(let i=0;i<4;i++){
 h.run(`{const q=${i<2?'P':'nightTorches.find(q=>q.kind===\'campfire\'&&q.x>450&&q.x<2300&&q.y>350&&q.y<2450)||nightTorches[0]'};cam.x=q.x-W/2;cam.y=q.y-H/2;nightFade=${i%2};draw();}`);
 mg.drawImage(h.canvas,i%2*900,Math.floor(i/2)*620);
}
fs.writeFileSync(path.join(root,'preview-night-map-v'+tag+'.png'),mapSheet.toBuffer('image/png'));
console.log('Rendered four scenery styles day/night and actual compass/roadside map.');
