"use strict";
let settingsOwner=null;
const VISUAL_SETTINGS_KEY='vacky_visual_settings_v1';
let visualSettingsError='',visualSettingsReadOnly=false;
const visualSettings=loadVisualSettings();
function loadVisualSettings(){
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 const defaults={shake:!reduced,reduceFlash:!!reduced,lowFX:false};
 try{
  const raw=(typeof Playables==='undefined'?localStorage:Playables.storage).getItem(VISUAL_SETTINGS_KEY);
  if(!raw)return defaults;const data=JSON.parse(raw);
  if(!data||data.version!==1||Object.keys(defaults).some(k=>typeof data[k]!=='boolean'))throw Error('Invalid visual settings');
  return {shake:data.shake,reduceFlash:data.reduceFlash,lowFX:data.lowFX};
 }catch(_){visualSettingsReadOnly=true;return defaults;}
}
function toggleVisualSetting(key){
 if(!settingsOpen()||languageMenuOpen()||visualSettingsReadOnly||!Object.hasOwn(visualSettings,key)||Playables.blocked)return false;
 const next={...visualSettings,[key]:!visualSettings[key]};
 try{Playables.storage.setItem(VISUAL_SETTINGS_KEY,JSON.stringify({version:1,...next}));}
 catch(_){visualSettingsError='save';refreshSettingsLabels();return false;}
 Object.assign(visualSettings,next);visualSettingsError='';refreshSettingsLabels();return true;
}
function settingsOpen(){return !!settingsOwner;}
function refreshSettingsLabels(){
 const el=id=>document.getElementById(id),ru=uiLanguage==='ru';
 if(!el('settingsTitle'))return;
 el('settingsTitle').textContent=uiLabel('settings');el('settingsClose').setAttribute('aria-label',uiLabel('close'));
 el('settingsCard').setAttribute('dir',uiLanguage==='ar'?'rtl':'ltr');
 el('settingsPCTitle').textContent=ru?'ПК · мышь и клавиши':'PC · mouse and keys';
 el('settingsPCText').textContent=ru?'Движение — веди курсор по арене.\nПредмет — E или пробел; также кнопка справа внизу.\nУльта — двойной щелчок по арене или кнопка молнии, когда заряд заполнен.\nСпособности — 1 / 2 / 3: авиаудар / туман / танк.\nПауза — P или Esc.':'Move — point the mouse across the arena.\nItem — E or Space, or the bottom-right button.\nUltimate — double-click the arena or tap the lightning button when fully charged.\nAbilities — 1 / 2 / 3: airstrike / fog / tank.\nPause — P or Esc.';
 if(typeof Playables!=='undefined'&&Playables.provider==='Playgama')el('settingsPCText').textContent=el('settingsPCText').textContent.replace('P или Esc','P').replace('P or Esc','P');
 el('settingsPhoneTitle').textContent=ru?'Телефон · касания':'Phone · touch controls';
 el('settingsPhoneText').textContent=ru?'Движение — удерживай палец на арене и веди его; отпусти, чтобы остановиться.\nПредмет — кнопка справа внизу.\nУльта — кнопка молнии при полном заряде.\nСпособности — раскрой кнопку над предметом и выбери одну из трёх.\nПауза — кнопка Ⅱ.':'Move — hold and drag a finger on the arena; release to stop.\nItem — the bottom-right button.\nUltimate — the lightning button when fully charged.\nAbilities — expand the button above the item and choose one of three.\nPause — the Ⅱ button.';
 el('settingsAutoFire').textContent=ru?'Прицеливание и стрельба автоматические. Способности расходуют сохранённые заряды.':'Aiming and shooting are automatic. Abilities spend saved charges.';
 el('settingsVisualTitle').textContent=ru?'Комфорт боя':'Combat comfort';
 el('settingsVisualHint').textContent=ru?'Меняется только изображение. Урон, скорость боя и предупреждения об атаках сохраняются.':'Visuals only. Damage, combat speed and attack warnings stay unchanged.';
 for(const [key,ruName,enName] of [['shake','Тряска камеры','Camera shake'],['reduceFlash','Меньше вспышек','Reduced flashes'],['lowFX','Облегчённые эффекты','Lighter effects']]){
  const button=el('visual-'+key);button.textContent=(ru?ruName:enName)+' · '+(visualSettings[key]?(ru?'Вкл':'On'):(ru?'Выкл':'Off'));
  button.setAttribute('aria-pressed',String(visualSettings[key]));button.disabled=visualSettingsReadOnly;
 }
 el('settingsVisualStatus').textContent=visualSettingsReadOnly?(ru?'Настройки не удалось прочитать. Исходная запись не изменена.':'Settings could not be read. The original save was preserved.'):
  visualSettingsError?(ru?'Не удалось сохранить. Изменение не применено — попробуй ещё раз.':'Could not save. The change was not applied — try again.'):'';
 const hostMuted=typeof Playables!=='undefined'&&!Playables.audioAllowed;
 el('settingsSoundState').textContent=userAudioMuted?(ru?'Звук: выключен':'Sound: off'):hostMuted?uiLabel('soundHost'):(ru?'Звук: включён':'Sound: on');
}
function openSettings(origin){
 if(!['start','pause'].includes(origin)||settingsOwner||document.getElementById(origin).classList.contains('hidden'))return false;
 if(Playables.blocked||tutorialOpen()||gameHelpOpen()||languageMenuOpen()||campDialogOpen()||runConfirmOpen()||adminPanelOpen()||menuDeparture)return false;
 settingsOwner={origin,paused,focus:document.activeElement};paused=true;pointer.active=false;
 for(const id of ['start','pause'])document.getElementById('settingsControls'+id).classList.toggle('hidden',id!==origin);
 document.getElementById('settingsDialog').classList.remove('hidden');
 document.getElementById('settingsLaunch'+origin).setAttribute('aria-expanded','true');
 refreshSettingsLabels();document.getElementById('settingsClose').focus({preventScroll:true});return true;
}
function closeSettings(){
 if(!settingsOwner||languageMenuOpen())return false;
 const old=settingsOwner;settingsOwner=null;paused=old.paused;pointer.active=false;
 document.getElementById('settingsDialog').classList.add('hidden');
 document.getElementById('settingsLaunch'+old.origin).setAttribute('aria-expanded','false');
 (old.focus||document.getElementById('settingsLaunch'+old.origin))?.focus?.({preventScroll:true});return true;
}
function initSettingsUI(){
 for(const key of ['shake','reduceFlash','lowFX'])document.getElementById('visual-'+key).onclick=()=>toggleVisualSetting(key);
 for(const origin of ['start','pause']){
  const row=document.getElementById('settingsControls'+origin);
  // Reuse the existing localized/saved controls and their exact event handlers.
  row.appendChild(document.getElementById('menuLanguage'+origin));row.appendChild(document.getElementById('menuSound'+origin));
  document.getElementById('settingsLaunch'+origin).onclick=()=>openSettings(origin);
 }
 document.getElementById('settingsClose').onclick=closeSettings;
 document.getElementById('settingsDialog').addEventListener('click',e=>{if(e.target===e.currentTarget)closeSettings();});
 window.addEventListener('keydown',e=>{
  if(!settingsOpen()||languageMenuOpen())return;
  e.stopImmediatePropagation();
  if(e.key==='Escape'||e.code==='Escape'){e.preventDefault();closeSettings();}
  if(e.key==='Tab'||e.code==='Tab'){
   e.preventDefault();const ids=['settingsClose','menuLanguage'+settingsOwner.origin,'menuSound'+settingsOwner.origin,'visual-shake','visual-reduceFlash','visual-lowFX'];
   const nodes=ids.map(id=>document.getElementById(id)).filter(b=>!b.disabled),i=nodes.indexOf(document.activeElement);
   nodes[(i+(e.shiftKey?-1:1)+nodes.length)%nodes.length].focus({preventScroll:true});
  }
 },true);
 refreshSettingsLabels();
}
