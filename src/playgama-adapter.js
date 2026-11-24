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
    advertisement:{
      get isSupported(){return bridge.advertisement?.isInterstitialSupported===true&&typeof bridge.advertisement.showInterstitial==='function';},
      get state(){return bridge.advertisement?.interstitialState;},
      onState(fn){bridge.advertisement?.on?.(bridge.EVENT_NAME.INTERSTITIAL_STATE_CHANGED,fn);},
      request(placement){
        const ads=bridge.advertisement;
        if(!this.isSupported||['loading','opened'].includes(ads.interstitialState)||['loading','opened'].includes(ads.rewardedState))return false;
        try{
          // Bridge returns void; this acknowledges a request, never an ad view/reward.
          // Universal platform pause/audio events own the actual display lifecycle.
          const result=ads.showInterstitial(placement);
          if(result&&typeof result.catch==='function')result.catch(()=>{});
          return true;
        }catch(_){return false;}
      }
    },
    leaderboards:{
      get type(){return bridge.leaderboards?.type||'not_available';},
      async submit(score){if(!Number.isSafeInteger(score)||score<1||score>1000000)throw Error('Invalid score');return bridge.leaderboards.setScore('red_kills_v1',score);},
      async entries(){if(bridge.leaderboards?.type!=='in_game')throw Error('Unavailable');return bridge.leaderboards.getEntries('red_kills_v1');},
      async show(){if(bridge.leaderboards?.type!=='native_popup')throw Error('Unavailable');return bridge.leaderboards.showNativePopup('red_kills_v1');}
    },
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
