// Native Canvas artwork sheets. These are not HTML/browser layout screenshots.
const fs=require('node:fs'),path=require('node:path'),make=require('../tests/arena-harness.cjs');
const root=path.join(__dirname,'..'),h=make({native:true,width:520,height:230});
for(const file of ['camp-progress','camp-ui'])h.run(fs.readFileSync(path.join(root,'src',file+'.js'),'utf8'));
const get=h.box.document.getElementById;
const create=h.box.document.createElement;
h.box.document.createElement=tag=>{const c=create(tag);if(tag==='canvas')c.setAttribute=()=>{};return c;};
h.box.document.getElementById=id=>['arsenalPreview','campStylePreview'].includes(id)?h.canvas:get(id);
h.run('reset();campPanelActive=true;campActiveSection="campEquipment";');
const sheet=(name,cases,code)=>{
 const out=make({native:true,width:1040,height:Math.ceil(cases.length/2)*230});
 cases.forEach((value,i)=>{h.box.previewCase=value;h.run(code);out.ctx.drawImage(h.canvas,(i%2)*520,Math.floor(i/2)*230);});
 fs.writeFileSync(path.join(root,'audit/'+name+'.png'),out.canvas.toBuffer('image/png'));
};
sheet('camp-arsenal-art-v0205',[['basic',0],['shotgun',4],['sniper',0],['laser',4]],'campEquipmentView="weapons";campProfile.weapon=previewCase[0];arsenalPreviewLevel=previewCase[1];arsenalPreviewShot=null;drawArsenalPreview(0,true);');
sheet('camp-style-art-v0205',['classic','tide','ember','ranger','royal','astral'],'campEquipmentView="appearance";campProfile.style=previewCase;drawArsenalPreview(0,true);');
const icons=make({native:true,width:800,height:320});
for(const [row,w]of ['basic','shotgun','sniper','laser'].entries())for(let level=0;level<5;level++){
 h.box.previewWeapon=w;h.box.previewLevel=level;
 const c=h.run('campWeaponIcon(previewWeapon,previewLevel)');icons.ctx.drawImage(c,level*160,row*80);
}
fs.writeFileSync(path.join(root,'audit/camp-weapon-icons-v0205.png'),icons.canvas.toBuffer('image/png'));
console.log('Wrote three native Canvas artwork sheets; no browser layout claim.');
