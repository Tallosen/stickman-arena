const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(/id="abilityToggle"[^>]*aria-controls="abilityPanel"[^>]*aria-expanded="false"/.test(html));
assert(/id="abilityPanel"[^>]*hidden/.test(html));assert(/\.ability-panel\[hidden\]\{display:none\}/.test(html));
assert(/prefers-reduced-motion:reduce\)\{\.ability-panel\{animation:none\}/.test(html));
assert.equal((html.match(/class="ability-slot"/g)||[]).length,3);
assert(/\.ability-dock\.hidden\{display:none\}/.test(html),'menu visibility must override the base display rule');
// Bounds from the actual CSS dimensions, not a browser layout/phone test.
const css=selector=>{const text=html.split(selector+'{')[1];assert(text,selector);return text.split('}')[0];};
const number=(text,key)=>Number(text.match(new RegExp('(?:^|;)'+key+':([0-9.]+)px'))?.[1]);
const mobile=html.split('@media(max-width:420px)')[1].split('\n')[0];
for(const width of [280,320,390,420,421,768,844])for(const height of [320,568,844]){
 const small=width<=420,toggle=small?number(mobile.split('.ability-toggle{')[1].split('}')[0],'width'):number(css('.ability-toggle'),'width');
 const slot=small?number(mobile.split('.ability-slot{')[1].split('}')[0],'width'):number(css('.ability-slot'),'width');
 const panelCSS=small?mobile.split('.ability-panel{')[1].split('}')[0]:css('.ability-panel');
 const padding=number(panelCSS,'padding'),gap=number(panelCSS,'gap'),border=1.5;
 const right=small?31:29,panelGap=small?8:10,panelW=slot*3+gap*2+padding*2+border*2;
 const left=width-right-toggle-panelGap-panelW;
 assert(left>=8,'expanded tray leaves the viewport at '+width);assert(toggle>=44&&slot>=44);
 for(const inset of height<450?[0,21]:[0,34]){
  const trayBottom=height-120-inset,panelTop=trayBottom-(small?48+15:56+17)+(small?5:7);
  const itemTop=height-20-86-inset;assert(trayBottom+(small?5:7)<itemTop,'tray overlaps item button');
  const bossY=height<450?66:height-236-inset;assert(bossY+42<panelTop,'tray overlaps boss HUD');
 }
}
console.log('PASS: collapsed/hidden panel semantics, three controls, reduced motion and CSS-derived bounds at 280–844 px, 44+ px targets, item/boss separation. No real browser layout claimed.');
