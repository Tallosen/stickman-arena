/* SDK precedes bootstrap; game modules run only after cloud load. */
const fs=require('fs');
require('./tools/build-sound-bank.cjs');
const ORDER=['core.js','language-packs.js','localization.js','config.js','camp-progress.js','map-art.js','arena-secrets.js','pets.js','draw-pets.js','ult.js','state.js','progression.js','world.js','enemy-hazards.js','combat.js','abilities.js','dragons.js','bosses.js','update.js','cards.js','draw-hero.js','draw-foe.js','render.js','menu-scene.js','menu-help.js','tutorial.js','camp-ui.js','ui.js'];
const html=fs.readFileSync('index.html','utf8');
ORDER.splice(ORDER.indexOf('ui.js'),0,'ranking.js');
ORDER.splice(ORDER.indexOf('ui.js'),0,'run-save.js');
ORDER.splice(ORDER.indexOf('bosses.js')+1,0,'arena-ending.js');
ORDER.splice(ORDER.indexOf('bosses.js')+1,0,'boss-loot.js');
ORDER.splice(ORDER.indexOf('core.js')+1,0,'sound-samples.js','sound-sample-player.js','sound-design.js');
ORDER.splice(ORDER.indexOf('ui.js'),0,'admin-ui.js','settings-ui.js');
const code=ORDER.map(f=>'/* ===== '+f+' ===== */\n'+fs.readFileSync('src/'+f,'utf8')).join('\n');
const platform=fs.readFileSync('src/playables.js','utf8');
const out=html.replace(/ *<script type="text\/vacky-module" src="src\/[^"]+"><\/script>\r?\n?/g,'')
 .replace(/ *<script src="src\/(playables|boot-source)\.js"><\/script>\r?\n?/g,'')
 .replace('</body>',()=>'<script>\n'+platform+'\nPlayables.boot(()=>{\n'+code+'\nreturn platformGameHooks();\n});\n</script>\n</body>');
const ver=fs.readFileSync('src/config.js','utf8').match(/VERSION = "([^"]+)"/)[1];
fs.mkdirSync('dist',{recursive:true});fs.writeFileSync('dist/index.html',out);fs.writeFileSync('dist/StickmanArena_v'+ver+'.html',out);
fs.writeFileSync('dist/StickmanArena_v'+ver+'_QA.html',out.replace('const Playables =','window.VACKY_DEV=true;\nconst Playables ='));
fs.mkdirSync('dist/youtube',{recursive:true});
const youtube=out.replace('<script src="https://www.youtube.com/game_api/v1"></script>',
 '<script src="https://www.youtube.com/game_api/v1"></script>\n<script>window.VACKY_REQUIRE_PLAYABLES=true;</script>');
fs.writeFileSync('dist/youtube/index.html',youtube);
console.log('Built v'+ver+': arena-only local/GitHub HTML and strict YouTube index.html');
fs.mkdirSync('dist/playgama',{recursive:true});
const bridgeAdapter=fs.readFileSync('src/playgama-adapter.js','utf8');
const playgama=out.replace('<script src="https://www.youtube.com/game_api/v1"></script>',
 '<script src="https://bridge.playgama.com/v2/stable/playgama-bridge.js"></script>\n<script>window.VACKY_REQUIRE_PLAYGAMA=true;</script>')
 .replace('const Playables =',()=>bridgeAdapter+'\nconst Playables =');
fs.writeFileSync('dist/playgama/index.html',playgama);
fs.copyFileSync('playgama-bridge-config.json','dist/playgama/playgama-bridge-config.json');
