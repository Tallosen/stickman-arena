"use strict";
const DRAGON_TUNES=[
 ["Солнечный шаг",[0,2,4,7,4,2,0,4],108],["Ягодный джем",[0,4,2,7,9,7,4,2],120],
 ["Лунные лапки",[9,7,4,2,0,2,4,7],92],["Облачный вальс",[0,4,7,4,2,5,9,5],96],
 ["Кристальный звон",[0,7,12,9,7,4,2,4],112],["Мохнатый грув",[0,0,4,2,7,4,2,0],116],
 ["Медовый свинг",[4,7,9,7,4,2,4,0],104],["Искристый хоп",[0,12,7,9,4,7,2,4],124],
 ["Тихая заводь",[0,2,5,9,7,5,2,0],88],["Цветочный твист",[7,4,7,9,12,9,7,4],118],
 ["Карамельный марш",[0,4,0,7,2,5,2,9],110],["Звёздный хвост",[12,9,7,4,7,2,4,0],100]
];
const DRAGON_DANCES=["Шаффл лапками","Крылатый свинг","Весёлый робот","Хвостатый твист","Пружинка","Лунная походка","Кивки в такт","Волна крыльями","Круг почёта","Крошка-диско","Поклон и хлопок","Боковой грув"];
const DRAGON_HABITATS=[
 ["Цветочная лужайка","#f4eedc","#c7d5a1","#dde5ba","#88a06b","#dfb2b5",0],
 ["Сад сакуры","#f5e9df","#dac1bb","#efdad2","#92a87b","#e09eae",0],
 ["Моховый островок","#ecebdc","#aebd91","#c8d3ab","#76915e","#be885e",1],
 ["Грибной уголок","#f0e7d7","#c1b98f","#ded7b1","#839463","#cc8e71",1],
 ["Снежное гнездо","#edf1e9","#c5dbe0","#e0edef","#879caa","#a9cbdc",2],
 ["Лавандовый грот","#eee9ed","#c6bfd6","#e0d8e6","#8f88ad","#ae9bcb",2],
 ["Тёплые дюны","#f5ecda","#dbc38c","#ecdcb0","#a29865","#c98f60",3],
 ["Медовая поляна","#f5eedb","#d8c596","#eadfb9","#9eaa6d","#d6ad62",3],
 ["Ягодная опушка","#f2ebdf","#bec6a1","#dce0ba","#84956c","#c88289",4],
 ["Осеннее убежище","#f2e6d7","#cbb092","#e6cdb0","#aa9b68","#ce9872",4],
 ["Бирюзовая заводь","#edf0e0","#aad1c1","#cce4d4","#77a391","#8bbfc9",5],
 ["Лунный сад","#eae9e5","#b9c4ca","#d4dde0","#8b98a6","#b9b4d0",5]
];
function newDragonPersonalitySeed(){return 1+Math.floor(Math.random()*2147483646);}
const personalityCache=new Map();
function personalityFromSeed(seed){
  if(personalityCache.has(seed))return personalityCache.get(seed);
  let x=seed>>>0;const roll=n=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)%n;};
  const p={seed,music:roll(24),dance:roll(12),habitat:roll(12),idle:roll(8),tempo:roll(5),flair:roll(100)};
  if(personalityCache.size>=128)personalityCache.delete(personalityCache.keys().next().value);personalityCache.set(seed,p);return p;
}
function dragonPersonality(id){
  const stored=typeof dragonProfile!=="undefined"?dragonProfile.personalities?.[id]:null;
  const fallback=(typeof id==="number"?id:97)*7919+104729;
  return personalityFromSeed(stored||fallback);
}
function ensureDragonPersonalities(){
  if(!Object.keys(dragonProfile.exclusives).some(id=>!dragonProfile.personalities?.[id]))return {ok:true};
  return dragonTransaction(p=>{p.personalities=p.personalities||{};for(const id of Object.keys(p.exclusives))if(!p.personalities[id])p.personalities[id]=newDragonPersonalitySeed();return true;});
}
// Eight arrangements, each with three melodies. Saved music IDs never change.
const DRAGON_ARRANGEMENTS=[
 {name:"Пиксельный квест",bpm:138,meter:8,voice:"square",gate:.38,lead:"1110111011101101",bass:"10001000",kick:"10001000",snare:"00100010",hat:"10101010",chords:[0,5,9,7]},
 {name:"Дождливый джаз",bpm:82,meter:8,voice:"triangle",gate:1.3,lead:"1001010010100100",bass:"10010010",kick:"10000100",snare:"00001000",hat:"00100101",chords:[0,9,2,7]},
 {name:"Вальс светлячков",bpm:114,meter:6,voice:"sine",gate:1.6,lead:"101010101101",bass:"100000",kick:"000000",snare:"000000",hat:"000000",chords:[0,5,7,0]},
 {name:"Манговая сальса",bpm:124,meter:8,voice:"triangle",gate:.42,lead:"1011010010110010",bass:"10010010",kick:"10000100",snare:"00100100",hat:"10110110",chords:[0,5,7,5]},
 {name:"Шкатулка снов",bpm:90,meter:8,voice:"bell",gate:2.6,lead:"1010001010010010",bass:"10000000",kick:"00000000",snare:"00000000",hat:"00000000",chords:[0,4,5,0]},
 {name:"Гаражный рок",bpm:132,meter:8,voice:"sawtooth",gate:.65,lead:"1100110111001010",bass:"10101010",kick:"10001010",snare:"00100010",hat:"11111111",chords:[0,0,5,7]},
 {name:"Северное сияние",bpm:66,meter:8,voice:"sine",gate:3.8,lead:"1000000010001000",bass:"10000000",kick:"00000000",snare:"00000000",hat:"00000000",chords:[0,5,9,4]},
 {name:"Фанки-лапки",bpm:108,meter:8,voice:"square",gate:.28,lead:"1010011010010110",bass:"10100101",kick:"10010010",snare:"00100010",hat:"10111011",chords:[0,7,5,7]}
];
function dragonTune(p){
 const family=Math.floor(p.music/3),variant=p.music%3,a=DRAGON_ARRANGEMENTS[family];
 const scales=[[0,4,7,12,9,7,4,2],[0,3,7,10,5,3,2,7],[7,9,12,4,2,0,5,7]];
 const notes=scales[variant].map((n,i)=>n+(family%3===1&&i%3===0?-1:0));
 return {...a,family,variant,name:a.name+" · "+["Искра","Листик","Комета"][variant],notes,root:196*Math.pow(2,(family+variant*2)/12),step:30/a.bpm,length:a.meter*4};
}
function dragonScoreStep(song,step){
 const events=[],i=step%song.meter,bar=Math.floor(step/song.meter),chord=song.chords[bar%4];
 const tone=(note,voice,duration,volume)=>events.push({frequency:song.root*Math.pow(2,note/12),voice,duration,volume});
 const hit=pattern=>pattern[step%pattern.length]==="1";
 if(hit(song.lead))tone(song.notes[(step+bar*song.variant)%8]+(bar%4===3?12:0),song.voice,song.step*song.gate,.023);
 if(hit(song.bass))tone(chord-24,"triangle",song.step*.95,.035);
 if(i===0&&[1,2,4,6].includes(song.family))for(const n of [0,song.family===1?3:4,7])tone(chord+n-12,"sine",song.step*(song.family===6?7:2),.009);
 if(hit(song.kick))events.push({frequency:105,voice:"kick",duration:.12,volume:.045});
 if(hit(song.snare))events.push({frequency:1400,voice:"noise",duration:.085,volume:.017});
 if(hit(song.hat))events.push({frequency:6500,voice:"noise",duration:.027,volume:.008});
 return events;
}
const dragonMusicVoices=new Set();
function stopDragonMusic(){for(const v of dragonMusicVoices){try{v.stop();}catch(_){} }dragonMusicVoices.clear();}
function playDragonVoice(e){
 if(typeof Playables!=="undefined"&&!Playables.audioAllowed)return;
 if(typeof gameAudioAllowed==="function"&&!gameAudioAllowed())return;
 try{
  audio();if(!AC||!audioMaster||dragonMusicVoices.size>=24)return;
  const now=AC.currentTime,d=Math.min(3.5,e.duration),gain=AC.createGain(),filter=AC.createBiquadFilter();
  let voice;
  if(e.voice==="noise"){
   voice=AC.createBufferSource();const buffer=AC.createBuffer(1,Math.ceil(AC.sampleRate*d),AC.sampleRate),data=buffer.getChannelData(0);
   for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1);voice.buffer=buffer;filter.type="highpass";filter.frequency.value=e.frequency;
  }else{voice=AC.createOscillator();voice.type=["bell","kick"].includes(e.voice)?"sine":e.voice;voice.frequency.setValueAtTime(e.frequency,now);if(e.voice==="kick")voice.frequency.exponentialRampToValueAtTime(35,now+d);filter.type="lowpass";filter.frequency.value=e.voice==="sawtooth"?1700:6000;}
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(e.volume,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+d);
  voice.connect(filter);filter.connect(gain);gain.connect(audioMaster);dragonMusicVoices.add(voice);
  voice.onended=()=>{dragonMusicVoices.delete(voice);voice.disconnect();filter.disconnect();gain.disconnect();};voice.start(now);voice.stop(now+d+.02);
  if(e.voice==="bell")playDragonVoice({...e,frequency:e.frequency*2.76,voice:"sine",duration:d*.55,volume:e.volume*.24});
 }catch(_){}
}
function playDragonTuneStep(p,step){
  for(const event of dragonScoreStep(dragonTune(p),step))playDragonVoice(event);
}
function dragonDancePose(v,care,p,fade){
  const song=dragonTune(p),phase=care.t/song.step*Math.PI,b=Math.sin(phase),c=Math.cos(phase),slow=Math.sin(phase*.5),strength=.85+p.flair/330;
  v.nod+=b*.09*fade;v.tail+=slow*.16*fade;
  switch(p.dance){
    case 0:v.sway=b*.22;v.step=b*.11;v.turn=slow*.15;break;
    case 1:v.wing+=b*.32;v.turn=slow*.28;v.hop=Math.max(0,c)*.045;break;
    case 2:v.turn=Math.round(slow*3)/3*.27;v.nod+=Math.round(b*2)/2*.13;v.sway=Math.round(c*2)/2*.1;break;
    case 3:v.turn=b*.35;v.tail+=c*.35;v.wing+=slow*.12;break;
    case 4:v.hop=Math.max(0,b)*.12;v.wing+=c*.2;v.step=slow*.05;break;
    case 5:v.sway=slow*.22;v.step=-b*.14;v.look+=c*.16;break;
    case 6:v.nod+=b*.23;v.look+=slow*.22;v.wing+=Math.abs(c)*.1;break;
    case 7:v.wing+=b*.38;v.look+=c*.17;v.turn=slow*.13;break;
    case 8:v.turn=Math.sin(care.t/care.duration*Math.PI*2)*.8;v.step=b*.12;v.hop=Math.max(0,c)*.05;break;
    case 9:v.turn=slow*.38;v.wing+=Math.abs(b)*.3;v.sway=c*.16;break;
    case 10:v.nod-=Math.max(0,slow)*.22;v.wing+=Math.max(0,b)*.33;v.hop=Math.max(0,-slow)*.07;break;
    default:v.sway=b*.2;v.look-=b*.15;v.tail+=c*.28;v.step=c*.08;
  }
  for(const k of ["sway","turn","step","hop"])v[k]=(v[k]||0)*fade*strength;
  if(p.dance===8){const u=Math.max(0,Math.min(1,care.t/care.duration));v.turn=Math.PI*2*u*u*(3-2*u);}
  return v;
}
function dragonDanceTiming(t,duration,song){
 const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
 const intro=Math.min(song.step*2,duration*.2),outro=Math.min(song.step*4,duration*.3);
 const entry=smooth(t/Math.max(.01,intro)),exit=smooth((duration-t)/Math.max(.01,outro));
 return {entry,weight:entry*exit,bow:Math.sin(Math.PI*smooth((t-duration+outro)/Math.max(.01,outro)))**2,
  spin:smooth((t-intro)/Math.max(.01,duration-intro-outro)),intro,outro};
}
function dragonDanceMotion(v,care,p,fade=1){
 const base={...v},song=dragonTune(p),timing=dragonDanceTiming(care.t,care.duration,song);
 const target=dragonDancePose({...base},care,p,1),weight=timing.weight*Math.max(0,Math.min(1,fade));
 // Fade every animated channel, including head and wings, not only steps/hops.
 for(const key of new Set([...Object.keys(base),...Object.keys(target)])){
  const start=base[key]||0;v[key]=start+((target[key]||0)-start)*weight;
 }
 const listening=Math.sin(care.t/song.step*Math.PI)*timing.entry*(1-timing.entry);
 v.nod+=listening*.12-timing.bow*.13;v.look+=listening*.07;
 v.blink=Math.max(v.blink||0,timing.bow*.72);
 // A full turn must finish forwards; fading its angle would spin backwards.
 if(p.dance===8)v.turn=(base.turn||0)+(care.t>=care.duration?0:Math.PI*2*timing.spin);
 return v;
}
