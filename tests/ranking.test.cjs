const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm'),make=require('./arena-harness.cjs');
(async()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 assert(!html.includes('id="btnRanking"'),'No leaderboard button in main menu');
 assert(html.includes('aria-describedby="menuBestScore"'),'Canvas record has accessible text');
 const h=make();h.box.assert=assert;const db=new Map();h.box.localStorage={getItem:k=>db.get(k)||null,setItem:(k,v)=>db.set(k,v)};
 h.run(fs.readFileSync(path.join(__dirname,'../src/ranking.js'),'utf8'));
 h.run(`reset();running=true;props=[];spawn('basic');const e=enemies[0];popEnemy(e);assert.equal(P.redKills,1);popEnemy(e);assert.equal(P.redKills,1);e.boss=true;e.rewarded=false;popEnemy(e);assert.equal(P.redKills,1);
 P.runMs=5000;assert(recordRunScore());assert.equal(rankingProfile.best,1);assert(!recordRunScore());
 reset();P.runMs=5000;P.redKills=999;P.testRun=true;assert(!recordRunScore());assert.equal(rankingProfile.best,1);
 refreshRunScoreReceipt();assert(document.getElementById('overScoreStatus').textContent.includes('Админ-тест'));
 P.testRun=false;P.trial='rush';assert(!recordRunScore());P.trial='normal';assert(recordRunScore());assert.equal(rankingProfile.best,999);
 const raw=rankingStore().getItem(RANKING_KEY);assert.equal(loadRanking().best,999);
 reset();P.runMs=1000;P.redKills=1000;const save=localStorage.setItem;localStorage.setItem=()=>{throw Error('quota');};assert(!recordRunScore());assert(!P.rankingRecorded);assert.equal(rankingProfile.best,999);
 refreshRunScoreReceipt();assert(document.getElementById('overScoreStatus').textContent.includes('пока не сохранён'));
 localStorage.setItem=save;assert(recordRunScore());assert(document.getElementById('overScoreStatus').textContent.includes('Счёт сохранён: 1000'));
 `);
 let sent=[];h.box.Playables={leaderboardType:'in_game',testStorage:false,hostPaused:false,storage:h.box.localStorage,submitLeaderboard:async n=>{sent.push(n);throw Error('offline');}};
 assert.equal(await h.run('submitRanking()'),false);assert.equal(h.run('rankingProfile.pending'),1000);
 h.box.Playables.submitLeaderboard=async n=>sent.push(n);assert.equal(await h.run('submitRanking()'),true);assert.equal(h.run('rankingProfile.pending'),0);assert.deepEqual(sent,[1000,1000]);
 h.run('rankingProfile.pending=1000');h.box.Playables.testStorage=true;await h.run('submitRanking()');assert.equal(sent.length,2);
 h.box.Playables.testStorage=false;h.box.Playables.hostPaused=true;await h.run('submitRanking()');assert.equal(sent.length,2);
 h.run(`localStorage.setItem(RANKING_KEY,'{bad');loadRanking();assert(rankingReadOnly);assert(!saveRanking({}));assert.equal(localStorage.getItem(RANKING_KEY),'{bad');`);
 const calls=[],box={bridge:{initialize:async()=>{},platform:{id:'playgama',language:'ru'},leaderboards:{type:'in_game',setScore:async(...a)=>calls.push(a),getEntries:async id=>[{id:'1',name:'Player',rank:1,score:4}],showNativePopup:async()=>{}}}};vm.createContext(box);vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/playgama-adapter.js'),'utf8'),box);
 const api=(await vm.runInContext('createPlaygamaAdapter()',box)).leaderboards;assert.equal(api.type,'in_game');await api.submit(4);assert.deepEqual(calls,[['red_kills_v1',4]]);assert.equal((await api.entries())[0].score,4);await assert.rejects(api.submit(-1));await assert.rejects(api.show());box.bridge.leaderboards.type='native_popup';await api.show();await assert.rejects(api.entries());
 const view=make({native:true});view.run(fs.readFileSync(path.join(__dirname,'../src/ranking.js'),'utf8'));view.run(fs.readFileSync(path.join(__dirname,'../src/menu-scene.js'),'utf8'));
 const texts=[],positions=[],fillText=view.ctx.fillText.bind(view.ctx);view.ctx.fillText=(...args)=>{texts.push(args[0]);const m=view.ctx.getTransform();positions.push({x:m.a*args[1]+m.c*args[2]+m.e,y:m.b*args[1]+m.d*args[2]+m.f});return fillText(...args);};
 for(const score of [0,2457,1000000])for(const language of ['ru','en']){
  view.run(`rankingProfile.best=${score};`);view.box.uiLanguage=language;texts.length=0;positions.length=0;
  const before=view.run('JSON.stringify(rankingProfile)');view.run('drawMenuScorePlaque(ctx);refreshRankingLabels();');
  assert(texts.includes(String(score)));assert(texts.includes(language==='ru'?'РЕКОРД':'BEST SCORE'));
  assert(positions.every(p=>p.x===76&&p.y>=375&&p.y<=397),'Record belongs to the rack-side pedestal, not the foreground');
  assert.equal(view.run('JSON.stringify(rankingProfile)'),before,'Record display never changes saved results');
  assert(view.box.document.getElementById('menuBestScore').textContent.includes(String(score)));
 }
 console.log('PASS: accurate score, preserved records, QA exclusion, Bridge, no menu button, localized camp plaque and accessible record');
})().catch(e=>{console.error(e);process.exitCode=1;});
