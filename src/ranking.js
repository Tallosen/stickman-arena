"use strict";
const RANKING_KEY='vacky_red_ranking_v1';
let rankingReadOnly=false,rankingError=false,rankingBusy=false,rankingOwner=null,rankingRequest=0;
const rankingStore=()=>typeof Playables==='undefined'?localStorage:Playables.storage;
function loadRanking(){
 const empty={version:1,best:0,pending:0,runs:[]};
 try{const raw=rankingStore().getItem(RANKING_KEY);if(!raw)return empty;const p=JSON.parse(raw);
  if(p.version!==1||!Number.isSafeInteger(p.best)||p.best<0||p.best>1000000||!Number.isSafeInteger(p.pending)||p.pending<0||p.pending>p.best||!Array.isArray(p.runs))throw Error('Invalid ranking');
  if(p.runs.some(r=>!Number.isSafeInteger(r.kills)||r.kills<0||r.kills>p.best||!Number.isSafeInteger(r.ms)||r.ms<0||r.ms>86400000||!Number.isInteger(r.stage)||r.stage<1||r.stage>20))throw Error('Invalid run');
  return {...p,runs:p.runs.slice(0,10)};
 }catch(_){rankingReadOnly=true;return empty;}
}
let rankingProfile=loadRanking();
// Preserve completed runs across an in-page restart when a durable write fails.
// This draft cannot survive closing/reloading the page while storage is unavailable.
let rankingDraft=null;
function saveRanking(next){
 if(rankingReadOnly)return false;
 try{rankingStore().setItem(RANKING_KEY,JSON.stringify(next));rankingProfile=next;rankingError=false;return true;}catch(_){rankingError=true;return false;}
}
function recordRunScore(){
 if(P.rankingRecorded||P.testRun||(P.trial&&P.trial!=='normal')||!(P.runMs>0))return false;
 const kills=P.redKills||0;if(!Number.isSafeInteger(kills)||kills<1||kills>1000000)return false;
 if(!P.rankingQueued){
  const base=rankingDraft||rankingProfile,row={kills,ms:Math.round(P.runMs),stage:P.stage,won:!!P.runWon};
  const best=Math.max(base.best,kills),runs=[...base.runs,row].sort((a,b)=>b.kills-a.kills||a.ms-b.ms).slice(0,10);
  rankingDraft={version:1,best,pending:best>base.best?best:base.pending,runs};P.rankingQueued=true;
 }
 if(!retryRankingSave())return false;
 return true;
}
function retryRankingSave(){
 if(!rankingDraft)return true;
 if(!saveRanking(rankingDraft))return false;
 rankingDraft=null;if(P.rankingQueued)P.rankingRecorded=true;
 refreshRankingLabels();void submitRanking();return true;
}
function refreshRunScoreReceipt(){
 const el=document.getElementById('overScoreStatus');if(!el)return;
 const text=(a,b)=>bossText(a,b),score=P.redKills||0;
 let saved=false;
 if(P.testRun)el.textContent=text('Админ-тест: счёт не участвует в рейтинге.','Admin test: this score is not ranked.');
 else if(P.trial&&P.trial!=='normal')el.textContent=text('Испытание: счёт не участвует в обычном рейтинге.','Challenge: this score is not ranked in normal runs.');
 else if(P.rankingRecorded&&typeof Playables!=='undefined'&&Playables.savePending)el.textContent=text('Счёт ожидает сохранения: ','Score awaiting save: ')+score+text(' · Не закрывай игру.',' · Keep the game open.');
 else if(P.rankingRecorded){saved=true;el.textContent=text('Счёт сохранён: ','Score saved: ')+score+text(' · Лучший: ',' · Best: ')+rankingProfile.best;}
 else if(!score)el.textContent=text('Счёт: 0 · Лучший: ','Score: 0 · Best: ')+rankingProfile.best;
 else el.textContent=text('Счёт пока не сохранён. Открой рейтинг и нажми «Обновить» для повтора.','Score not saved yet. Open the leaderboard and press Refresh to retry.');
 el.style.color=saved?'#54713e':'#826039';
}
async function submitRanking(){
 const api=typeof Playables==='undefined'?null:Playables;
 if(rankingBusy||!rankingProfile.pending||!api||api.leaderboardType==='not_available'||!api.leaderboardType||api.testStorage||api.hostPaused)return false;
 rankingBusy=true;const sent=rankingProfile.pending;
 try{
  await api.submitLeaderboard(sent);
  // Submission may finish after another run has entered the retry draft.
  // Acknowledge only this score; keep a newer best pending and retain every row.
  if(rankingDraft&&rankingDraft.pending<=sent)rankingDraft={...rankingDraft,pending:0};
  const next={...rankingProfile,pending:rankingProfile.pending>sent?rankingProfile.pending:0};
  return saveRanking(next);
 }
 catch(_){rankingError=true;return false;}finally{rankingBusy=false;}
}
function rankingOpen(){return !!rankingOwner;}
function closeRanking(){if(!rankingOwner)return false;const owner=rankingOwner;rankingOwner=null;rankingRequest++;paused=owner.paused;pointer.active=false;document.getElementById('rankingDialog').classList.add('hidden');owner.focus?.focus?.();return true;}
async function refreshRanking(){
 if(!running&&P.runMs>0&&!P.rankingRecorded&&!P.testRun&&(!P.trial||P.trial==='normal')&&P.redKills>0)recordRunScore();
 else retryRankingSave();
 refreshRunScoreReceipt();
 const token=++rankingRequest,ru=typeof uiLanguage==='undefined'||uiLanguage==='ru';
 const text=(a,b)=>ru?a:b,el=id=>document.getElementById(id),list=el('rankingRows');list.innerHTML='';
 el('rankingTitle').textContent=text('Рейтинг по счёту','Score leaderboard');
 el('rankingRules').textContent=text('1 красный = 1 очко. Счёт сохраняется и при поражении; в рейтинге — лучший обычный забег. Боссы, испытания и админ-тесты не учитываются.','1 red bot = 1 point. Defeats count too; rankings use your best normal run. Bosses, challenges and admin tests are excluded.');
 el('rankingBest').textContent=text('Личный рекорд: ','Personal best: ')+rankingProfile.best;
 el('rankingClose').textContent=text('Закрыть','Close');el('rankingRefresh').textContent=text('Обновить','Refresh');
 const row=(rank,name,kills)=>{const tr=document.createElement('tr');for(const value of [rank,String(name).slice(0,60),kills]){const td=document.createElement('td');td.textContent=String(value);tr.appendChild(td);}list.appendChild(tr);};
 rankingProfile.runs.forEach((r,i)=>row(i+1,text('Ты · стадия ','You · stage ')+r.stage+' · '+formatRunTime(r.ms),r.kills));
 if(!rankingProfile.runs.length)row('—',text('Пока нет обычных забегов','No normal runs yet'),'—');
 if(P.testRun)el('rankingRules').textContent=text('Этот забег был с админ-командами: его счёт не записан. Начни новый обычный забег без тестовых кнопок — результат сохранится и при поражении.','This run used admin commands and is not ranked. Start a new normal run without test buttons; defeats count too.');
 const api=typeof Playables==='undefined'?null:Playables,type=api?.leaderboardType||'not_available';
 el('rankingScope').textContent=text('Личные забеги','Personal runs');
 el('rankingStatus').textContent=rankingReadOnly?text('Сохранение рекордов повреждено; оно не перезаписано.','Records could not be read; original data was preserved.'):rankingError?text('Не удалось сохранить/отправить рекорд. Обнови таблицу для повтора.','Could not save/send the record. Refresh to retry.'):text('Локальная таблица. Общий рейтинг доступен в настроенной сборке Playgama.','Local records. Online rankings require the configured Playgama build.');
 if(type==='not_available')return;
 el('rankingStatus').textContent=text('Подключаемся к Playgama…','Connecting to Playgama…');
 await submitRanking();if(!rankingOwner||token!==rankingRequest)return;
 try{
  if(type==='native_popup'){await api.showLeaderboard();if(token===rankingRequest)el('rankingStatus').textContent=text('Общая таблица открыта средствами платформы.','Leaderboard opened by the platform.');return;}
  if(type==='native'){el('rankingStatus').textContent=text('Общий рейтинг показывает платформа. Здесь — личные забеги.','The platform displays online rankings. Personal runs are shown here.');return;}
  const entries=await api.leaderboardEntries();if(!rankingOwner||token!==rankingRequest)return;
  if(!Array.isArray(entries))throw Error('Invalid leaderboard');
  const valid=entries.filter(e=>Number.isSafeInteger(e.score)&&e.score>=0&&Number.isSafeInteger(e.rank)&&e.rank>0).sort((a,b)=>a.rank-b.rank).slice(0,50);
  list.innerHTML='';valid.forEach(e=>row(e.rank,e.name||text('Игрок','Player'),e.score));
  el('rankingScope').textContent='Playgama · '+text('Общий рейтинг','Online leaderboard');
  el('rankingStatus').textContent=rankingProfile.pending?text('Таблица загружена, твой новый рекорд пока не отправлен. Повтори обновление.','Board loaded; your new record is still pending. Refresh to retry.'):valid.length?text('Результаты получены от Playgama.','Results received from Playgama.'):text('Пока нет результатов.','No results yet.');
 }catch(_){if(token===rankingRequest)el('rankingStatus').textContent=text('Playgama недоступна или таблица ещё не настроена. Показаны личные рекорды; можно повторить.','Playgama is unavailable or the board is not configured. Personal records remain available; retry later.');}
}
function openRanking(){
 if(rankingOwner||(typeof Playables!=='undefined'&&Playables.blocked)||running&&!paused)return false;
 if(typeof arenaEnding!=='undefined'&&arenaEnding)return false;
 rankingOwner={paused,focus:document.activeElement};paused=true;pointer.active=false;
 document.getElementById('rankingDialog').classList.remove('hidden');document.getElementById('rankingClose').focus?.();void refreshRanking();return true;
}
function refreshRankingLabels(){
 refreshRunScoreReceipt();
 for(const id of ['btnVictoryRanking','btnOverRanking']){const b=document.getElementById(id);if(b)b.textContent='🏆 '+bossText('Рейтинг','Leaderboard');}
 const record=document.getElementById('menuBestScore');
 if(record)record.textContent=bossText('Лучший счёт: ','Best score: ')+rankingProfile.best;
 if(typeof menuScenePainted!=='undefined')menuScenePainted=false;
}
function initRankingUI(){
 refreshRankingLabels();
 for(const id of ['btnVictoryRanking','btnOverRanking']){const b=document.getElementById(id);if(b)b.onclick=openRanking;}
 document.getElementById('rankingClose').onclick=closeRanking;document.getElementById('rankingRefresh').onclick=()=>{if(rankingOwner)void refreshRanking();};
 document.getElementById('rankingDialog').addEventListener('keydown',e=>{
  if(!rankingOwner)return;e.stopPropagation();
  if(e.key==='Escape'){e.preventDefault();closeRanking();}
  if(e.key==='Tab'){e.preventDefault();const a=document.getElementById('rankingClose'),b=document.getElementById('rankingRefresh');(document.activeElement===a?b:a).focus?.();}
 });
}
