const fs=require('fs'),path=require('path'),{createCanvas}=require('@napi-rs/canvas');
const h=require('./arena-harness.cjs')({native:true,width:160,height:160});h.run('reset();');
const options=[{kind:'medal'},...['gun','helm','jacket','gloves','boots','scope','clip','cape'].map(key=>({kind:'gear',key})),{kind:'heal'},{kind:'ult'},...['airstrike','gas','tank'].map(key=>({kind:'supply',key})),{kind:'continue'}];
const sheet=createCanvas(900,570),g=sheet.getContext('2d');g.fillStyle='#f5e8cc';g.fillRect(0,0,900,570);
options.forEach((option,i)=>{h.box.option=option;h.run('drawBossRewardIcon(ctx,option,160)');const x=i%5*180,y=Math.floor(i/5)*190;g.fillStyle='#fff8e8';g.beginPath();g.roundRect(x+10,y+10,160,160,20);g.fill();g.drawImage(h.canvas,x+10,y+10);g.fillStyle='#574634';g.font='12px system-ui';g.textAlign='center';g.fillText(option.key||option.kind,x+90,y+185);});
fs.writeFileSync(path.resolve(__dirname,'../../../preview-boss-reward-icons-v0152.png'),sheet.toBuffer('image/png'));
