const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('dist/index.html'),version=html.match(/const VERSION = "([^"]+)"/)[1];
for(const file of ['dist/index.html','dist/youtube/index.html','dist/playgama/index.html']){
 const s=read(file);assert(!s.includes('window.VACKY_DEV=true;'));assert(s.includes('window.VACKY_DEV===true'));
 assert(!s.includes('id="perks"'));assert(!s.includes('function offerPerks('));
 for(const id of ['btnCamp','campDialog','campTitle','campContent','btnCloseCamp','overHero','overProgress','btnOverRetry','btnOverMenu','btnVictoryMenu'])assert.equal((s.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 assert(s.includes('aria-modal="true" aria-labelledby="campTitle"'));assert(s.includes('button:not(:disabled)'));
 assert(s.includes('campPanelActive=false'));assert(s.includes('campSaveError'));
}
assert(read('dist/StickmanArena_v'+version+'_QA.html').includes('window.VACKY_DEV=true;'));
assert(html.includes('.qa-overlay.hidden{display:none}'),'QA modal must stay hidden despite later flex declaration');
assert(html.includes('body.qa-panel-ready .hud-dev{display:none!important}'),'Old shortcuts must not overlap full panel');
assert(html.includes('#start .camp-dock-button{min-height:44px;flex-direction:row;'),'Camp shortcuts must be a compact accessible row');
assert(html.includes('#start .camp-dock-arrow,#start #campNextGoal,#start #campLoadoutSummary{display:none}'),'Details belong inside camp');
assert(html.includes('.camp-panel canvas{pointer-events:none;touch-action:pan-y}'));
assert(html.includes('grid-template-columns:repeat(2,minmax(0,1fr))'));assert(html.includes('@media(max-width:450px)'));
assert(html.includes('.arsenal-evolution{display:grid;grid-template-columns:repeat(5,minmax(0,1fr))'));
assert(!html.includes('flex:0 0 112px'),'Evolution must fit without a horizontal strip');
assert(html.includes('.camp-panel{width:min(640px,100%)'));
assert(html.includes('@media(max-width:330px){.camp-panel{padding:0 4px 12px}'));
// Conservative declared grid widths, including a wider-than-styled scrollbar.
// Native browser line wrapping, safe areas and touch use still require device QA.
for(const width of [280,320,360,390,450,600,844]){
 const panel=Math.min(640,width-24),padding=width<=330?8:width<=450?20:36;
 const inside=panel-4-padding-20,gap=width<=330?1:width<=450?3:6,tier=(inside-gap*4)/5;
 assert(tier>=44,'Five touchable evolution steps at '+width);assert((inside-8)/2>=44);assert(html.includes('min-width:44px;min-height:44px'));
}
console.log('PASS: public/QA separation, no endless death perks, single dialog/result IDs, modal/scroll/keyboard semantics, narrow-width CSS constraints. Not a real-device test.');
