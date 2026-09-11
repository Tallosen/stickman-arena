/* SDK precedes bootstrap; game modules run only after cloud load. */
const fs=require('fs');
const ORDER=['core.js','config.js','map-art.js','arena-secrets.js','pets.js','draw-pets.js','ult.js','state.js','progression.js','world.js','enemy-hazards.js','combat.js','abilities.js','dragon-economy.js','dragons.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-hangar.js','dragon-cave.js','dragon-collection.js','dragon-home.js','update.js','cards.js','draw-hero.js','draw-foe.js','render.js','ui.js'];
const html=fs.readFileSync('index.html','utf8');
const code=ORDER.map(f=>'/* ===== '+f+' ===== */\n'+fs.readFileSync('src/'+f,'utf8')).join('\n');
const platform=fs.readFileSync('src/playables.js','utf8');
const out=html.replace(/ *<script type="text\/vacky-module" src="src\/[^"]+"><\/script>\r?\n?/g,'')
 .replace(/ *<script src="src\/(playables|boot-source)\.js"><\/script>\r?\n?/g,'')
 .replace('</body>',()=>'<script>\n'+platform+'\nPlayables.boot(()=>{\n'+code+'\nreturn platformGameHooks();\n});\n</script>\n</body>');
const ver=fs.readFileSync('src/config.js','utf8').match(/VERSION = "([^"]+)"/)[1];
fs.mkdirSync('dist',{recursive:true});fs.writeFileSync('dist/index.html',out);fs.writeFileSync('dist/StickmanArena_v'+ver+'.html',out);
const catalogue=out.replace('return platformGameHooks();','const hooks=platformGameHooks();const first=hooks.initial;hooks.initial=()=>{first();hooks.catalogue();};return hooks;');
fs.writeFileSync('dist/DragonCatalog_v'+ver+'.html',catalogue);
fs.mkdirSync('dist/youtube',{recursive:true});
const youtube=out.replace('<script src="https://www.youtube.com/game_api/v1"></script>',
 '<script src="https://www.youtube.com/game_api/v1"></script>\n<script>window.VACKY_REQUIRE_PLAYABLES=true;</script>');
fs.writeFileSync('dist/youtube/index.html',youtube);
console.log('Built v'+ver+': local/GitHub HTML, catalogue and strict YouTube index.html');
fs.mkdirSync('dist/playgama',{recursive:true});
const bridgeAdapter=fs.readFileSync('src/playgama-adapter.js','utf8');
const playgama=out.replace('<script src="https://www.youtube.com/game_api/v1"></script>',
 '<script src="https://bridge.playgama.com/v2/stable/playgama-bridge.js"></script>\n<script>window.VACKY_REQUIRE_PLAYGAMA=true;</script>')
 .replace('const Playables =',()=>bridgeAdapter+'\nconst Playables =');
fs.writeFileSync('dist/playgama/index.html',playgama);
fs.copyFileSync('playgama-bridge-config.json','dist/playgama/playgama-bridge-config.json');
