"use strict";
function recordedSoundVariantCount(name,previous=false){
 if(typeof RECORDED_SOUNDS==='undefined')return 0;
 return (previous?PREVIOUS_WEAPON_SOUNDS[name]:RECORDED_SOUNDS[name])?.length||0;
}
// AudioContext is still created only by a user/game sound. No network or decode promises.
function recordedSoundBuffer(context,name,variant,previous=false){
 if(typeof RECORDED_SOUNDS==='undefined'||!Object.hasOwn(RECORDED_SOUNDS,name))return null;
 const clips=previous?PREVIOUS_WEAPON_SOUNDS[name]:RECORDED_SOUNDS[name];if(!clips?.length)return null;
 const rate=previous?PREVIOUS_SOUND_RATES[name]:RECORDED_SOUND_RATES[name];
 const raw=atob(clips[variant%clips.length]);
 if(![22050,44100].includes(rate)||!raw.length||raw.length%2||raw.length>rate*5)throw Error('Invalid embedded sound');
 const buffer=context.createBuffer(1,raw.length/2,rate),pcm=buffer.getChannelData(0);
 for(let i=0;i<pcm.length;i++){const n=raw.charCodeAt(i*2)|(raw.charCodeAt(i*2+1)<<8);pcm[i]=(n>=32768?n-65536:n)/32768;}
 return buffer;
}
