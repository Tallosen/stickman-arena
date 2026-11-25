"use strict";
Playables.boot(async()=>{
  for(const source of document.querySelectorAll('script[type="text/vacky-module"]')){
    await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=source.getAttribute('src');s.onload=resolve;s.onerror=()=>reject(Error((typeof uiLanguage==='undefined'||uiLanguage!=='ru'?'Module failed to load: ':'Не загрузился ')+s.src));document.body.appendChild(s);});
  }
  return platformGameHooks();
});
