const fs=require('fs'),path=require('path');
const {createCanvas}=require('@napi-rs/canvas');
const sheet=createCanvas(860,290),g=sheet.getContext('2d');g.fillStyle='#f4ead7';g.fillRect(0,0,860,290);
let y=0;
for(const width of [280,390,844]){
 const h=require('./arena-harness.cjs')({native:true,width,height:80}),ui=fs.readFileSync(path.join(__dirname,'../src/ui.js'),'utf8');
 h.run(ui.slice(0,ui.indexOf('function hud()')));
 h.run(`reset();P.stage=6;P.stageMs=${width===280?2000:width===390?42000:55000};drawTopHUD(ctx,W,P);`);
 g.drawImage(h.canvas,8,y);y+=90;
}
fs.writeFileSync(path.resolve(__dirname,'../../../preview-stage-tempo-v0150.png'),sheet.toBuffer('image/png'));
console.log('Rendered tempo labels at 280, 390 and 844 CSS pixels.');
