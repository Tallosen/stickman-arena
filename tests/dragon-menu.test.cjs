const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const ids=['dragonBookBtn','dragonEggBtn','dragonHomeBtn'];
const pause=html.slice(html.indexOf('<div id="pause"'),html.indexOf('<div id="dragonBook"'));
for(const id of ids){assert.equal([...html.matchAll(new RegExp('id="'+id+'"','g'))].length,1);assert(pause.includes('id="'+id+'"'));}
const arena=html.slice(html.indexOf('<canvas id="c"'),html.indexOf('<div id="start"'));
for(const id of ids)assert(!arena.includes(id));
assert(!/class="hud-book/.test(html),'No fixed dragon buttons anywhere');
assert(!html.includes('dragon-menu-details'));assert(!html.includes('dragon-path'));
assert.equal([...html.matchAll(/class="dragon-menu-buttons"/g)].length,4);
const steps=pause.match(/<nav class="dragon-menu-buttons"[^>]*>([\s\S]*?)<\/nav>/)[1];
assert.equal([...steps.matchAll(/<button\b/g)].length,3);assert.equal([...steps.matchAll(/data-help=/g)].length,0);
const words=['Драконы и обмен','Вылупить питомца','Мои питомцы'];let prev=-1;for(const w of words){const at=steps.indexOf(w);assert(at>prev);prev=at;}
assert(!steps.includes('<small>'));assert(!steps.includes('<p>'));
assert(html.includes('overflow-y:auto;overflow-x:hidden;justify-content:flex-start'));
assert(html.includes('flex-shrink:0'));assert(html.includes('width:min(350px,100%)'));assert(html.includes('min-height:44px'));
assert(html.includes('role="dialog" aria-modal="true" aria-labelledby="gameHelpTitle"'));
const help=fs.readFileSync(path.join(root,'src/menu-help.js'),'utf8');assert(help.includes('3 одинаковых'));assert(help.includes('Всего нужно 5'));assert(help.includes('расходует'));assert(help.includes('может выпасть и сразу'));
assert.equal([...html.matchAll(/data-help="/g)].length,1);assert(html.includes('id="gameGuideBtn"'));assert(html.includes('id="btnReplayTutorial"'));
console.log('PASS: compact menus, exactly one guide question, repeat-training control, no fixed dragon HUD shortcuts or permanent diagram, bounded mobile layout');
