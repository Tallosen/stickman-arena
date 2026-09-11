"use strict";
// Used only by the separate Playgama package. Never load two platform SDKs together.
async function createPlaygamaAdapter(){
  if(typeof bridge==="undefined")throw Error("Не загрузился Playgama Bridge. Повтори загрузку.");
  await bridge.initialize();
  if(!bridge.platform.id||bridge.platform.id==="mock")throw Error("Открой эту сборку в среде Playgama / QA Tool.");
  const key="vacky_profile_v1";
  const language=bridge.platform.language||"en";
  return {
    IN_PLAYABLES_ENV:true,provider:"Playgama",language,
    game:{
      firstFrameReady(){},
      gameReady(){return bridge.platform.sendMessage("game_ready");},
      async loadData(){
        const values=await bridge.storage.get([key]);
        if(!Array.isArray(values)||values.length!==1)throw Error("Playgama вернул непонятный ответ сохранения.");
        const value=values[0];return value==null?"":typeof value==="string"?value:JSON.stringify(value);
      },
      saveData(text){return bridge.storage.set([key],[text]);}
    },
    system:{
      isAudioEnabled:()=>bridge.platform.isAudioEnabled,
      onAudioEnabledChange:fn=>bridge.platform.on(bridge.EVENT_NAME.AUDIO_STATE_CHANGED,fn),
      onPause(fn){bridge.platform.on(bridge.EVENT_NAME.PAUSE_STATE_CHANGED,paused=>{if(paused)fn();});if(bridge.platform.isPaused)fn();},
      onResume(fn){bridge.platform.on(bridge.EVENT_NAME.PAUSE_STATE_CHANGED,paused=>{if(!paused)fn();});}
    }
  };
}
