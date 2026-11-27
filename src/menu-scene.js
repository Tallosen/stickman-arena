"use strict";
// The camp uses the arena's own drawing functions. No game state, audio or timers.
let menuSceneLast=-Infinity,menuSceneTime=0,menuScenePainted=false;
const menuHeroSeed=Math.floor(Math.random()*1000000);
const MENU_HERO_GEAR={helm:4,scope:3,gun:4,cape:3,clip:3,jacket:3,gloves:4,boots:4,_noShadow:true,_holstered:true};
const MENU_RACK_WEAPON_SCALE=2.2;
const MENU_FIRE={x:570,y:492,radius:32};
function menuHeldWeaponPose(hero,kind){
 const handKey=kind==='rack'?'ab':'af',shoulderKey=kind==='rack'?'sb':'sf',bodyScale=3+1.4*hero.depth;
 return {handKey,shoulderKey,side:kind==='rack'?-1:1,scale:bodyScale*1.3,bodyScale,grip:[4,4],
  x:hero.x+hero[handKey][0]*bodyScale,y:hero.y+80*hero.depth+hero[handKey][1]*bodyScale};
}
function drawMenuHeldWeapon(g,hero,kind,opacity){
 const p=menuHeldWeaponPose(hero,kind);
 g.save();g.globalAlpha*=opacity;g.translate(p.x,p.y);g.scale(p.side*p.scale,p.scale);g.translate(-p.grip[0],-p.grip[1]);
 const weapon=typeof campProfile!=='undefined'&&campWeaponOpen(campProfile.weapon)?campProfile.weapon:'basic';
 drawGunModel(g,2,0,weapon);g.restore();
 // The palm is in front of the grip, rather than hidden behind the receiver.
 g.save();g.translate(hero.x,hero.y+80*hero.depth);g.scale(p.bodyScale,p.bodyScale);
 drawHeroGlove(g,hero[p.handKey],hero[p.shoulderKey],MENU_HERO_GEAR.gloves,TIER[MENU_HERO_GEAR.gloves],2.2,1.4);g.restore();
}
function drawMenuCampfire(g,time){
 g.save();g.translate(MENU_FIRE.x,MENU_FIRE.y);g.lineJoin='round';g.lineCap='round';
 const oval=(x,y,rx,ry,color)=>{g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();};
 oval(0,2,43,14,'#a9926340');oval(0,-1,31,10,'#806e51');oval(0,-2,24,7,'#4e4031');
 const stone=i=>{const a=i*Math.PI/5,x=Math.cos(a)*32,y=Math.sin(a)*10;
  g.strokeStyle='#887c67';g.lineWidth=1.8;g.beginPath();g.ellipse(x,y,7.5,5.5,a*.15,0,Math.PI*2);g.fillStyle=i%2?'#b7ab92':'#c9bea4';g.fill();g.stroke();
  g.strokeStyle='#e1d4b8';g.lineWidth=1.2;sline(g,x-3,y-2,x+2,y-3);
 };
 for(let i=5;i<10;i++)stone(i);
 for(const angle of [-.28,.35]){g.save();g.rotate(angle);g.fillStyle='#735039';g.strokeStyle='#503e2d';g.lineWidth=2;
  g.beginPath();g.roundRect(-26,-8,52,10,4);g.fill();g.stroke();oval(23,-3,4,4,'#c39862');
  g.strokeStyle='#a5774d';g.lineWidth=1.2;sline(g,-19,-5,15,-5);g.restore();}
 // Smooth, bounded flames: no random frame noise, extra timers or particle lists.
 for(let i=0;i<3;i++){
  const x=(i-1)*12,sway=Math.sin(time*2.1+i*1.7)*3,h=[31,49,35][i]+Math.sin(time*2.7+i)*3;
  g.beginPath();g.moveTo(x-11,-5);g.bezierCurveTo(x-18,-h*.5,x+7+sway,-h*.7,x+sway,-h);
  g.bezierCurveTo(x+20,-h*.56,x+17,-10,x+9,-4);g.quadraticCurveTo(x,-1,x-11,-5);
  g.fillStyle=['#df7c35','#ef9e40','#e98b33'][i];g.fill();
 }
 g.beginPath();g.moveTo(-10,-5);g.quadraticCurveTo(-15,-19,2+Math.sin(time*2)*2,-33);g.quadraticCurveTo(1,-19,12,-7);g.quadraticCurveTo(2,2,-10,-5);g.fillStyle='#ffe2a0';g.fill();
 for(let i=0;i<3;i++){const t=(time*.23+i/3)%1;g.globalAlpha=Math.sin(t*Math.PI)*.6;oval(Math.sin(time+i*2)*7,-30-t*40,1.4,2.2,'#d99746');}g.globalAlpha=1;
 for(let i=0;i<=5;i++)stone(i);
 g.restore();
}
let menuReaction=null;
let menuDeparture=null;
const menuPropDuration=12;
function menuPropWeight(reaction,time){
 if(!reaction||!['rack','chest'].includes(reaction.kind))return 0;
 const t=time-reaction.start;return menuEase((t-4.6)/.5)*menuEase((7.4-t)/.5);
}
function menuBeginDeparture(complete){
 if(menuDeparture){const done=menuDeparture.complete;menuDeparture=null;done();return true;}
 if(!menuCanReact()||menuMotionQuery?.matches)return false;
 const from=menuReaction&&['rack','chest'].includes(menuReaction.kind)?menuObjectPose(menuSceneTime,menuHeroSeed,menuReaction):null;
 menuDeparture={start:menuSceneTime,complete,from};menuReaction=null;return true;
}
const menuEase=x=>{x=Math.max(0,Math.min(1,x));return Math.max(0,Math.min(1,x*x*x*(x*(x*6-15)+10)));};
function menuSchedule(time,seed=menuHeroSeed){
 const cycle=Math.floor(time/40),t=time-cycle*40;
 const pick=n=>{const v=Math.sin(seed*.017+cycle*71.31+n*17.73)*43758.5453;return v-Math.floor(v);};
 const wait=5+pick(1)*3,kind=cycle%5===3?4:cycle%2===0?6:[0,1,2,3,5][Math.floor(pick(2)*5)];
 return {u:t-wait,wait,cycle,kind,destination:kind===4?445:kind===6?350+pick(3)*42:500};
}
function menuBirdVisit(time,seed=menuHeroSeed){
 const s=menuSchedule(time,seed);
 if(s.kind!==6||s.u<26.5||s.u>=31)return 0;
 return s.u<27.8?menuEase((s.u-26.5)/1.3):s.u<29.5?1:1-menuEase((s.u-29.5)/1.5);
}
// Yaw: 0 faces the viewer, +/- PI/2 faces along the path, PI faces the camp.
function menuHeroHeading(time,seed=menuHeroSeed){
 const {u,kind}=menuSchedule(time,seed),near=kind===4,rest=.32,left=kind===6?-Math.PI/2:-.45,right=kind===6?Math.PI/2:.45;
 const blend=(a,b,t)=>a+(b-a)*menuEase(t);
 if(u<1.6)return rest;
 if(u<2.3)return blend(rest,near?0:left,(u-1.6)/.7);
 if(u<5.5)return near?0:left;
 if(u<6.2)return blend(near?0:left,near?0:rest,(u-5.5)/.7);
 if(u<8.5)return near?0:rest;
 if(u<9.2)return blend(near?0:rest,near?Math.PI:right,(u-8.5)/.7);
 if(u<12.4)return near?Math.PI:right;
 if(kind!==6)return blend(near?Math.PI:right,rest,(u-12.4)/1.0);
 if(u<13.2)return blend(right,-.8,(u-12.4)/.8);
 if(u<22.8)return -.8;
 if(u<23.6)return blend(-.8,left,(u-22.8)/.8);
 if(u<24.6)return left;
 return blend(left,rest,(u-24.6)/1.4);
}
// Two rigid segments: animation supplies a target, never stretches a limb.
function menuLimb(root,target,upper,lower,bend,gap=.05){
 const dx=target[0]-root[0],dy=target[1]-root[1],raw=Math.hypot(dx,dy);
 const d=Math.max(Math.abs(upper-lower)+gap,Math.min(upper+lower-gap,raw));
 const ux=raw>1e-8?dx/raw:0,uy=raw>1e-8?dy/raw:1;
 const along=(upper*upper-lower*lower+d*d)/(2*d),side=Math.sqrt(Math.max(0,upper*upper-along*along))*bend;
 return {joint:[root[0]+ux*along+uy*side,root[1]+uy*along-ux*side],end:[root[0]+ux*d,root[1]+uy*d]};
}
// Legs bend in the character's forward plane, then rotate with the pelvis.
// Projection may shorten a limb on screen; its actual 3D segments stay rigid.
function menuLegRig(q,yaw,walking=false){
 const c=Math.cos(yaw),s=Math.sin(yaw);
 const project=([x,y,z])=>[x*c+z*s,y];
 return [1,-1].map((side,i)=>{
  const target=q[i?'lb':'lf'],forward=(target[0]-side*6)*(walking?q.turn:1);
  const leg=menuLimb([0,q.hip],[forward,target[1]],18,20,1,.000000001);
  const hip=[side*7,q.hip,0],knee=[side*7,leg.joint[1],leg.joint[0]],foot=[side*7,leg.end[1],leg.end[0]];
  return {hip,knee,foot,root:project(hip),joint:project(knee),end:project(foot),depth:foot[2]*c-foot[0]*s};
 });
}
function menuHeroPose(time,seed=menuHeroSeed,reaction=null,raw=false){
 const {u,kind,destination}=menuSchedule(time,seed),near=kind===4;
 const seated={x:448,y:419,turn:1,hip:-18,neck:-42,head:[0,-57],lf:[17,7],lb:[9,7],af:[20,-19],ab:[-18,-20],gunAt:[8,-16],lean:0};
 const standing={x:500,y:440,turn:1,hip:-36,neck:-60,head:[0,-75],lf:[6,0],lb:[-6,0],af:[14.5,-33],ab:[-14.5,-33],gunAt:[4,-28],lean:0};
 const mix=(a,b,u)=>Object.fromEntries(Object.keys(a).map(k=>[k,Array.isArray(a[k])?a[k].map((v,i)=>v+(b[k][i]-v)*u):a[k]+(b[k]-a[k])*u]));
 let q=mix(seated,seated,0),activity='sit',phase=time*.6,depth=0,tap=0;
 if(u>=0&&u<1.6){q=mix(seated,standing,menuEase(u/1.6));activity='stand';}
 else if(u>=1.6&&u<2.3){q=mix(standing,standing,0);q.turn=near?1:Math.cos(Math.PI*menuEase((u-1.6)/.7));activity='turn';}
 else if(u>=2.3&&u<5.5){walk((u-2.3)/3.2,false);}
 else if(u>=5.5&&u<6.2){q=mix(standing,standing,0);q.x=destination;depth=near?1:0;q.turn=near?1:-Math.cos(Math.PI*menuEase((u-5.5)/.7));activity='turn';}
 else if(u>=6.2&&u<9.2){
  q=mix(standing,standing,0);q.x=destination;depth=near?1:0;const a=(u-6.2)/3,envelope=Math.sin(a*Math.PI)**2;
  activity=['wave','stretch','look','gear','knock','watchPet','watchPet'][kind];
  if(kind===0){q.af[0]+=8*envelope+Math.sin(a*Math.PI*6)*2*envelope;q.af[1]-=37*envelope;}
  if(kind===1){q.af[0]+=4.5*envelope;q.af[1]-=42*envelope;q.ab[0]-=4.5*envelope;q.ab[1]-=42*envelope;q.head[1]-=2*envelope;}
  if(kind===2){q.head[0]+=Math.sin(a*Math.PI*2)*4*envelope;q.head[1]+=envelope;}
  if(kind===3){q.ab[0]-=7.5*envelope;q.ab[1]-=18*envelope;q.head[0]-=3*envelope;}
  if(kind===4){
   for(const center of [.28,.49,.70]){const d=(a-center)/.075;if(Math.abs(d)<1)tap+=Math.cos(d*Math.PI/2)**2;}
   const raised=menuEase(a/.18)*menuEase((1-a)/.18);
   q.af[0]+=11.5*raised+3*tap;q.af[1]-=24*raised+2*tap;q.head[0]+=3*envelope;q.head[1]+=envelope;
  }
  if(kind===5||kind===6){const cat=menuCatPose(time,seed);q.head[0]+=Math.max(-3,Math.min(3,(cat.x-q.x)/50))*envelope;q.head[1]+=2*envelope;q.af[1]+=3*envelope;}
 }
 else if(u>=9.2&&u<12.4){walk((u-9.2)/3.2,true);}
 else if(u>=12.4&&u<14){q=mix(standing,seated,menuEase((u-12.4)/1.6));activity='sitDown';}
 if(kind===6&&u>=12.4&&u<26){
  const beside={...standing,x:526,hip:-18,neck:-42,head:[-2,-57],lf:[14,0],lb:[-3,0],af:[20,-19],ab:[-18,-20]};
  if(u<14.4){q=mix(standing,standing,0);q.head[0]=-3*Math.sin((u-12.4)/2*Math.PI)**2;activity='noticeCat';}
  else if(u<16){q=mix(standing,beside,menuEase((u-14.4)/1.6));activity='crouch';}
  else if(u<22){q=mix(beside,beside,0);q.head[0]-=Math.sin((u-16)*.8)*.6;activity='sitWithCat';}
  else if(u<23.6){q=mix(beside,{...standing,x:526},menuEase((u-22)/1.6));activity='rise';}
  else if(u<24.6){q=mix({...standing,x:526},standing,menuEase(u-23.6));activity='stepBack';}
  else{q=mix(standing,seated,menuEase((u-24.6)/1.4));activity='sitDown';}
 }
 // Seated downtime: a quiet gear check and a glance toward the companions.
 if(activity==='sit'){
  const settled=u<0?menuEase(-u):menuEase(u-(kind===6?26:14));
  const rest=Math.sin(Math.max(0,Math.sin(time*.45))*Math.PI/2)**4*settled;
  q.af[1]-=3*rest;q.ab[1]-=1.2*rest;q.head[0]+=Math.sin(time*.32)*.8*settled;
 }
 if(raw)return {q,activity,phase,depth,yaw:menuHeroHeading(time,seed)};
 let yawOverride=null;
 if(reaction&&['rack','chest','depart'].includes(reaction.kind)){
  const action=menuObjectPose(time,seed,reaction);
  if(action){q=action.q;depth=action.depth;yawOverride=action.yaw;activity=action.activity;}
 }
 const greeting=menuReactionWeight(reaction,'hero',time);
 if(greeting){q.af=[q.af[0]+(26-q.af[0])*greeting+Math.sin((time-reaction.start)*9)*2*greeting,q.af[1]+(q.neck-10-q.af[1])*greeting];q.head[0]+=greeting;}
 const birdVisit=menuBirdVisit(time,seed);
 if(birdVisit){q.head[0]-=1.4*birdVisit;if(yawOverride===null)activity='watchBird';}
 const breath=Math.sin(time*1.45)*.35;
 q.neck+=breath;q.head[1]+=breath;q.head[0]+=(q.turn-1)*2;q.af[1]+=breath*.4;q.ab[1]+=breath*.4;
 const yaw=yawOverride??menuHeroHeading(time,seed),legs=menuLegRig(q,yaw,activity==='walk');
 for(const [i,foot,knee,root] of [[0,'lf','kf','hf'],[1,'lb','kb','hb']]){
  q[foot]=legs[i].end;q[knee]=legs[i].joint;q[root]=legs[i].root;
 }
 q.legDepthF=legs[0].depth;q.legDepthB=legs[1].depth;
 q.sf=[8,q.neck+4];q.sb=[-8,q.neck+4];
 for(const [hand,elbow,shoulder,bend] of [['af','ef','sf',1],['ab','eb','sb',-1]]){
  const arm=menuLimb(q[shoulder],q[hand],12,13,bend);q[hand]=arm.end;q[elbow]=arm.joint;
 }
 const blinkPhase=((time+seed*.13)%4.7+4.7)%4.7;
 const blink=blinkPhase<.19?Math.sin(blinkPhase/.19*Math.PI)**2:0;
 return {...q,activity,phase,depth,tap,yaw,headYaw:yaw-birdVisit*.75,blink,headTilt:Math.sin(time*1.1)*.045+depth*.035-birdVisit*.07};
 function walk(v,back){
  q=mix(standing,standing,0);const e=menuEase(v),weight=menuEase(v/.15)*menuEase((1-v)/.15)*(near||Math.abs(destination-500)>1?1:0);
  q.x=back?destination+(500-destination)*e:500+(destination-500)*e;q.turn=near?1:back?1:-1;depth=near?(back?1-e:e):0;
  const distance=e*(near?38:Math.abs(500-destination)/3),front=menuStep(distance,0),rear=menuStep(distance,.5);
  q.lf=[6+front.x*weight*q.turn,-front.lift*weight];q.lb=[-6+rear.x*weight*q.turn,-rear.lift*weight];
  const sway=Math.sin(distance/18*Math.PI*2),bob=(.5+.5*Math.cos(distance/18*Math.PI*4))*.8*weight;
  q.hip+=bob;q.neck+=bob;q.head[1]+=bob*.65;q.head[0]+=sway*.65*weight;
  q.af[0]+=sway*1.2*weight;q.ab[0]-=sway*1.2*weight;q.af[1]-=sway*1.4*weight;q.ab[1]+=sway*1.4*weight;
  activity='walk';phase=time*.6;
 }
}
function menuObjectPose(time,seed,reaction){
 const t=time-reaction.start,duration=reaction.kind==='depart'?.6:menuPropDuration;
 if(t<0||t>=duration)return null;
 const origin=reaction.from||menuHeroPose(reaction.start,seed,null,true);
 const from={...origin,q:Object.fromEntries(Object.entries(origin.q).map(([k,v])=>[k,Array.isArray(v)?v.slice():v]))},to=menuHeroPose(reaction.start+duration,seed,null,true);
 // Convert an interrupted walking stride into body-local leg coordinates before
 // blending into a stationary pose; otherwise a leftward step flips at tap time.
 for(const state of [from,to])if(state.activity==='walk'){
  state.q.lf[0]=6+(state.q.lf[0]-6)*state.q.turn;
  state.q.lb[0]=-6+(state.q.lb[0]+6)*state.q.turn;
 }
 const mix=(a,b,v)=>Object.fromEntries(Object.keys(a).map(k=>[k,Array.isArray(a[k])?a[k].map((x,i)=>x+(b[k][i]-x)*v):a[k]+(b[k]-a[k])*v]));
 const angle=(a,b,v)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*v;
 const stand=x=>({x,y:440,turn:1,hip:-36,neck:-60,head:[0,-75],lf:[6,0],lb:[-6,0],af:[14.5,-33],ab:[-14.5,-33],gunAt:[4,-28],lean:0});
 if(reaction.kind==='depart'){
  const e=menuEase(t/duration),q=mix(from.q,stand(from.q.x),e);
  return {q,depth:from.depth*(1-e),yaw:angle(from.yaw,.25,e),activity:'ready'};
 }
 const target=reaction.kind==='rack'?330:610,heading=target>=from.q.x?Math.PI/2:-Math.PI/2,back=to.q.x>=target?Math.PI/2:-Math.PI/2;
 let q,yaw=heading,depth=0,activity='inspect';
 if(t<1){const e=menuEase(t);q=mix(from.q,stand(from.q.x),e);depth=from.depth*(1-e);yaw=from.yaw;}
 else if(t<1.6){const e=menuEase((t-1)/.6);q=stand(from.q.x);q.turn=1+(Math.sin(heading)-1)*e;yaw=angle(from.yaw,heading,e);}
 else if(t<4.2){q=walk(from.q.x,target,(t-1.6)/2.6,heading);activity='walk';}
 else if(t<7.4){
  q=stand(target);q.turn=Math.sin(heading);const w=menuEase((t-4.2)/.4)*menuEase((7.4-t)/.4);
  if(reaction.kind==='chest'){q.hip+=11*w;q.neck+=11*w;q.head[1]+=14*w;q.af=[14.5+6*w,-33+5*w];}
  else{q.ab=[-14.5-7*w,-33-14*w];q.head[1]+=2*w;}
 }else if(t<8){const e=menuEase((t-7.4)/.6);q=stand(target);q.turn=Math.sin(heading)+(Math.sin(back)-Math.sin(heading))*e;yaw=angle(heading,back,e);}
 else if(t<10.6){q=walk(target,to.q.x,(t-8)/2.6,back);yaw=back;activity='walk';}
 else{const e=menuEase((t-10.6)/1.4);q=mix({...stand(to.q.x),turn:Math.sin(back)},to.q,e);depth=to.depth*e;yaw=angle(back,to.yaw,e);}
 return {q,depth,yaw,activity};
 function walk(a,b,v,dir){
  const e=menuEase(v),w=menuEase(v/.18)*menuEase((1-v)/.18),q=stand(a+(b-a)*e),distance=Math.abs(b-a)*e/3;
  q.turn=Math.sin(dir)<0?-1:1;
  const f=menuStep(distance,0),r=menuStep(distance,.5);
  q.lf=[6+f.x*w*q.turn,-f.lift*w];q.lb=[-6+r.x*w*q.turn,-r.lift*w];
  return q;
 }
}
function menuReactionWeight(reaction,kind,time){
 const t=reaction&&reaction.kind===kind?(time-reaction.start)/2.2:-1;
 return t>=0&&t<1?Math.sin(t*Math.PI)**2:0;
}
// Ground contact lasts longer than the airborne return; feet roll through a step.
function menuStep(distance,offset){
 const f=((distance/18+offset)%1+1)%1;
 if(f<.62)return {x:5.58-f*18,lift:0};
 const u=(f-.62)/.38;return {x:-5.58+11.16*menuEase(u),lift:Math.sin(Math.PI*u)**2*4};
}
const menuMotionQuery=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
menuMotionQuery?.addEventListener?.('change',()=>{menuScenePainted=false;});
const MENU_COMPANIONS=[
 {type:'boar',a:145,b:245,y:445,scale:1.55,period:14,offset:.16,arc:3},
 {type:'cat',a:300,b:440,y:493,scale:1.5,period:11,offset:.62,arc:4},
 {type:'dog',a:325,b:582,y:552,scale:1.65,period:12,offset:.12,arc:5},
 {type:'mole',a:670,b:760,y:458,scale:1.55,period:16,offset:.60,arc:3},
 {type:'chicken',a:670,b:735,y:519,scale:1.6,period:10,offset:.20,arc:4},
 {type:'parrot',a:550,b:754,y:199,scale:1.4,period:13,offset:.70,arc:21}
];
function menuCompanionPose(p,time){
 const cycle=((time/p.period+p.offset)%1+1)%1,back=cycle>=.5;
 const u=Math.min(1,(back?cycle-.5:cycle)/.4),smooth=u*u*(3-2*u),moving=u<1;
 const span=p.b-p.a,speed=moving?4*u*(1-u):0;
 const distance=back?span*(1-smooth):span*smooth;
 const phase=(back?span+span*smooth:span*smooth)*.14;
 const rest=Math.max(0,(back?cycle-.5:cycle)-.4)/.1,sniff=Math.sin(Math.PI*rest)**2;
 return {type:p.type,x:p.a+distance,y:p.y-Math.sin(smooth*Math.PI)*p.arc,
  face:back?-1:1,scale:p.scale,phase:p.type==='parrot'?time*5:Math.asin(Math.sin(phase)*speed),bob:Math.sin(phase*2)*speed*(p.type==='parrot'?2:1.2),moving,sniff};
}
function menuCatPose(time,seed=menuHeroSeed){
 const p=MENU_COMPANIONS[1],base=menuCompanionPose(p,time),s=menuSchedule(time,seed);
 if(s.kind!==6||s.u<3.4||s.u>=22.2)return base;
 const perch={...base,x:446,y:363,face:-1,phase:0,bob:0,moving:false,sniff:0};
 if(s.u>=4.6&&s.u<21)return perch;
 const up=s.u<4.6,v=up?(s.u-3.4)/1.2:(s.u-21)/1.2,e=menuEase(v);
 const ground=menuCompanionPose(p,s.cycle*40+s.wait+(up?3.4:22.2));
 const from=up?ground:perch,to=up?perch:ground;
 return {...base,x:from.x+(to.x-from.x)*e,y:from.y+(to.y-from.y)*e-26*Math.sin(Math.PI*v)**2,
  face:up?1:-1,phase:from.phase+(to.phase-from.phase)*e+Math.sin(v*Math.PI)*.6,bob:from.bob+(to.bob-from.bob)*e,moving:true,sniff:0};
}
function menuShoulderPerch(hero){
 const point=MENU_HERO_GEAR.jacket>=3?[-10,hero.neck-2]:hero.sb;
 return {x:hero.x+point[0]*3,y:hero.y+point[1]*3};
}
function menuParrotPose(time,seed=menuHeroSeed,hero=menuHeroPose(time,seed)){
 const p=MENU_COMPANIONS[5],base=menuCompanionPose(p,time),s=menuSchedule(time,seed);
 if(s.kind!==6||s.u<26.5||s.u>=31)return {...base,perch:0,front:false};
 const arriving=s.u<27.8,leaving=s.u>=29.5,weight=menuBirdVisit(time,seed);
 const anchor=menuCompanionPose(p,s.cycle*40+s.wait+(leaving?31:26.5));
 const shoulder=menuShoulderPerch(hero);
 const flight=arriving?(s.u-26.5)/1.3:leaving?(s.u-29.5)/1.5:0;
 return {...base,x:anchor.x+(shoulder.x-anchor.x)*weight,
  y:anchor.y+anchor.bob+(shoulder.y-anchor.y-anchor.bob)*weight-75*Math.sin(Math.PI*flight)**2,
  bob:0,sniff:0,face:-1,perch:menuEase((weight-.6)/.4),front:true,moving:arriving||leaving};
}
function menuCanReact(){
 if(typeof settingsOpen==='function'&&settingsOpen())return false;
 if(typeof campDialogOpen==='function'&&campDialogOpen())return false;
 return typeof document!=='undefined'&&!document.getElementById('start')?.classList.contains('hidden')&&
  !menuDeparture&&
  !(typeof languageMenuActive!=='undefined'&&languageMenuActive)&&
  !(typeof Playables!=='undefined'&&Playables.blocked)&&!menuMotionQuery?.matches&&
  !(typeof tutorialOpen==='function'&&tutorialOpen())&&!(typeof gameHelpOpen==='function'&&gameHelpOpen());
}
function menuReact(kind){
 if(!['hero','dog','rack','chest'].includes(kind)||!menuCanReact()||(menuReaction&&menuSceneTime-menuReaction.start<(['rack','chest'].includes(menuReaction.kind)?menuPropDuration:2.2)))return false;
 menuReaction={kind,start:menuSceneTime};return true;
}
function menuHit(x,y,time=menuSceneTime){
 if(typeof drawCampRangeStand==='function'&&x>=742&&x<=828&&y>=422&&y<=491)return 'workshop';
 const dog=menuCompanionPose(MENU_COMPANIONS[2],time);
 if(Math.abs(x-dog.x)<49&&y>dog.y-60&&y<dog.y+12)return 'dog';
 const hero=menuHeroPose(time,menuHeroSeed,menuReaction),scale=3+1.4*hero.depth,root=hero.y+80*hero.depth;
 if(x>hero.x-scale*27&&x<hero.x+scale*31&&y>root+(hero.head[1]-12)*scale&&y<root+Math.max(...[hero.lf[1],hero.lb[1]])*scale+8)return 'hero';
 if(x>=140&&x<=278&&y>=228&&y<=401)return 'rack';
 if(x>=650&&x<=773&&y>=323&&y<=420)return 'chest';
 return null;
}
function menuPoint(event,rect){
 const scale=Math.min(rect.width/900,rect.height/620);
 return {x:(event.clientX-rect.left-(rect.width-900*scale)/2)/scale,y:(event.clientY-rect.top-(rect.height-620*scale)/2)/scale};
}
if(typeof document!=='undefined'){
 const canvas=document.getElementById('menuScene');let press=null;
 canvas?.addEventListener('pointerdown',e=>{if(e.isPrimary!==false&&(!e.button||e.button===0)&&menuCanReact())press={x:e.clientX,y:e.clientY,id:e.pointerId};});
 canvas?.addEventListener('pointercancel',()=>{press=null;});
 canvas?.addEventListener('pointerup',e=>{
  const start=press;press=null;if(!start||start.id!==e.pointerId||Math.hypot(e.clientX-start.x,e.clientY-start.y)>8)return;
  const p=menuPoint(e,canvas.getBoundingClientRect()),kind=menuHit(p.x,p.y);
  if(kind==='workshop'){e.preventDefault();e.stopPropagation();openCampPanel('campWorkshop');return;}
  if(kind&&menuReact(kind)){e.preventDefault();e.stopPropagation();}
 });
 canvas?.addEventListener('keydown',e=>{const kind=e.key==='ArrowLeft'?'rack':e.key==='ArrowRight'?'chest':e.key==='Enter'||e.key===' '?'hero':null;if(kind){e.preventDefault();e.stopPropagation();menuReact(kind);}});
}
function menuCampRewards(){
 const flags={};for(const id of ['first','ten','crowd','clear','collection','shotgun','clean','trial'])flags[id]=typeof campUnlocked==='function'&&campUnlocked(id);
 flags.complete=Object.values(flags).every(Boolean);return flags;
}
function menuCampLantern(g,x,y,time,seed=0){
 g.save();const glow=g.createRadialGradient(x,y,2,x,y,32);glow.addColorStop(0,'#ffd37470');glow.addColorStop(1,'#ffd37400');
 g.fillStyle=glow;g.beginPath();g.arc(x,y,32,0,7);g.fill();
 g.lineWidth=2;g.strokeStyle='#90703d';g.fillStyle='#f4d991';g.beginPath();g.roundRect(x-6,y-9,12,19,3);g.fill();g.stroke();
 sline(g,x-7,y-10,x+7,y-10);sline(g,x-6,y+10,x+6,y+10);
 g.fillStyle='#fff8cf';g.globalAlpha=.8+Math.sin(time*1.5+seed)*.12;g.beginPath();g.ellipse(x,y+1,2.5,5,0,0,7);g.fill();g.restore();
}
function drawMenuChampionPavilion(g,time){
 g.save();g.lineWidth=3;g.strokeStyle='#886735';
 const glow=g.createRadialGradient(450,210,20,450,210,240);glow.addColorStop(0,'#f1cf7340');glow.addColorStop(1,'#f1cf7300');g.fillStyle=glow;g.fillRect(215,25,480,345);
 // All construction is behind the hero's walking plane, leaving the center open.
 for(const x of [291,609]){
  g.fillStyle='#bb965a';g.beginPath();g.roundRect(x-6,179,12,164,4);g.fill();g.stroke();
  g.fillStyle='#e7c578';g.beginPath();g.roundRect(x-13,329,26,14,3);g.fill();g.stroke();sline(g,x-8,190,x+8,190);
 }
 spoly(g,[[291,170],[347,120],[450,105],[553,120],[609,170]],'#6e557f');
 spoly(g,[[291,170],[450,105],[403,173]],'#9971a3');
 spoly(g,[[497,173],[450,105],[609,170]],'#85618f');
 spoly(g,[[403,173],[450,105],[497,173]],'#ead294');
 g.strokeStyle='#e8c46e';g.lineWidth=4;sline(g,291,170,450,105);sline(g,450,105,609,170);
 g.fillStyle='#785585';g.strokeStyle='#886735';g.lineWidth=2;
 for(let i=0;i<8;i++){const x=289+i*40;g.beginPath();g.moveTo(x,170);g.lineTo(x+40,170);g.lineTo(x+36,187);g.quadraticCurveTo(x+20,200,x+4,187);g.closePath();g.fill();g.stroke();g.strokeStyle='#efd28a';sline(g,x+7,188,x+33,188);g.strokeStyle='#886735';}
 for(const side of [-1,1]){
  const x=450+side*145;g.save();g.translate(x,195);g.scale(side,1);
  spoly(g,[[-5,0],[-43,0],[-31,90],[-8,123],[6,116]],'#93709b');
  g.strokeStyle='#ebcc85';sline(g,-31,12,-23,81);sline(g,-27,87,-7,93);g.restore();
 }
 // Crown is large enough to read at phone size; it is not a combat reward.
 g.fillStyle='#f5d47f';g.strokeStyle='#8d6d36';g.lineWidth=3;
 spoly(g,[[424,94],[419,65],[436,78],[450,53],[464,78],[481,65],[476,94]],'#edc365');
 g.fillStyle='#fff0b1';g.beginPath();g.roundRect(423,92,54,10,3);g.fill();g.stroke();
 g.fillStyle='#9a6b9e';g.beginPath();g.moveTo(450,76);g.lineTo(455,84);g.lineTo(450,91);g.lineTo(445,84);g.closePath();g.fill();
 for(const x of [304,596]){sline(g,x,187,x,214);menuCampLantern(g,x,226,time,x);}
 // Bounded decorative sparks: deterministic, no timers or particle allocations.
 for(let i=0;i<10;i++){
  const x=256+i*43+Math.sin(time*.4+i)*5,y=83+(i%3)*20+Math.cos(time*.5+i)*5;
  g.globalAlpha=.25+.3*(1+Math.sin(time*.8+i))*.5;g.strokeStyle=i%2?'#c7983f':'#f5d885';g.lineWidth=1.7;
  sline(g,x-3,y,x+3,y);sline(g,x,y-4,x,y+4);
 }g.restore();
}
function drawMenuCampRewardDetails(g,time,rewards){
 g.save();g.lineJoin='round';g.lineCap='round';g.strokeStyle='#886f46';g.lineWidth=2;
 if(rewards.ten){
  // Roof above the rack; no weapon artwork or interaction bounds are moved.
  spoly(g,[[136,229],[155,207],[263,207],[284,229]],'#6e9290');
  g.strokeStyle='#e8d397';g.lineWidth=3;sline(g,136,230,284,230);
  for(let i=0;i<5;i++){g.fillStyle=i%2?'#e1d3a4':'#6e9290';g.fillRect(139+i*28,230,26,8);}
 }
 if(rewards.crowd){
  // Reinforced corner caps stay outside gun silhouettes, not bars across them.
  g.strokeStyle='#cba65d';g.lineWidth=4;
  for(const [x,y,sx,sy] of [[141,239,1,1],[279,239,-1,1],[141,389,1,-1],[279,389,-1,-1]]){
   sline(g,x,y,x+sx*12,y);sline(g,x,y,x,y+sy*13);
  }
  g.fillStyle='#e6c982';g.strokeStyle='#806444';g.lineWidth=1.5;
  spoly(g,[[202,231],[208,225],[214,231],[208,238]],'#e6c982');
 }
 if(rewards.trial){
  g.strokeStyle='#8e6f3e';g.lineWidth=2;
  spoly(g,[[635,283],[783,283],[778,318],[751,309],[723,320],[694,309],[642,319]],'#aa6553');
  g.strokeStyle='#ebc77d';g.lineWidth=3;sline(g,645,291,774,291);
  for(const x of [667,710,753]){g.beginPath();g.moveTo(x,297);g.lineTo(x+4,303);g.lineTo(x,309);g.lineTo(x-4,303);g.closePath();g.stroke();}
 }
 if(rewards.clear){
  // A matching second standard turns a lone flag into a ceremonial entrance.
  g.strokeStyle='#80623d';g.lineWidth=4;sline(g,62,210,62,382);
  spoly(g,[[63,219],[99,223],[99,300],[81,289],[63,297]],'#8d669a');
  g.strokeStyle='#e5c67b';g.lineWidth=2;sline(g,68,226,68,279);sline(g,94,230,94,279);
  g.fillStyle='#efd488';g.beginPath();g.moveTo(81,244);g.lineTo(89,257);g.lineTo(81,270);g.lineTo(73,257);g.closePath();g.fill();
 }
 if(rewards.clean){
  g.strokeStyle='#9c895e';g.lineWidth=1.8;g.beginPath();g.moveTo(155,160);g.quadraticCurveTo(450,65,751,171);g.stroke();
  for(const [i,x] of [185,256,330,572,646,720].entries()){
   const u=(x-155)/596,y=(1-u)**2*160+2*(1-u)*u*65+u*u*171;
   sline(g,x,y,x,y+9);menuCampLantern(g,x,y+19,time,i);
  }
 }
 g.restore();
}
function drawMenuCampBackdrop(g,time,rewards=menuCampRewards()){
 g.save();
 // Distant vegetation stays below the horizon and behind all interactive props.
 g.fillStyle='#d7ddbd66';g.beginPath();g.moveTo(52,292);
 g.bezierCurveTo(156,226,224,244,322,283);g.bezierCurveTo(458,212,575,234,690,280);
 g.bezierCurveTo(742,244,817,253,864,292);g.lineTo(864,317);g.lineTo(52,317);g.closePath();g.fill();
 // A pitched canvas tent: stitched panels, open doorway, guy ropes and pegs.
 if(rewards.complete){drawMenuChampionPavilion(g,time);g.restore();return;}
 g.strokeStyle='#a28c62';g.lineWidth=2;g.lineJoin='round';
 g.beginPath();g.ellipse(365,315,85,12,0,0,Math.PI*2);g.fillStyle='#9eaa7130';g.fill();
 spoly(g,[[309,311],[353,218],[410,228],[442,308]],rewards.shotgun?'#5d9699':'#a9b48a');
 spoly(g,[[291,310],[353,218],[395,311]],rewards.shotgun?'#9ec5bf':'#cfcca0');
 spoly(g,[[321,311],[352,251],[369,311]],'#6c7257');
 spoly(g,[[352,251],[342,310],[321,311]],'#e5d8ac');
 g.strokeStyle='#e7e2bd';g.lineWidth=2;sline(g,361,234,426,300);sline(g,309,301,344,237);
 g.strokeStyle='#927d55';sline(g,306,282,280,318);sline(g,424,281,461,314);
 g.lineWidth=4;sline(g,277,315,282,321);sline(g,458,311,463,318);
 g.lineWidth=2;sline(g,353,219,353,207);
 g.fillStyle='#c0925d';g.beginPath();g.moveTo(353,207);g.quadraticCurveTo(366,203+Math.sin(time*.8)*1.5,376,209);g.lineTo(353,218);g.fill();
 g.restore();
}
function drawMenuScorePlaque(g){
 const best=typeof rankingProfile==='undefined'?0:rankingProfile.best;
 const ru=typeof uiLanguage==='undefined'||uiLanguage==='ru';
 const earned=typeof campUnlocked==='function'&&campUnlocked('first');
 g.save();g.translate(20,350);g.lineJoin='round';g.lineCap='round';
 // The record belongs to the trophy pedestal beside the rack, behind pets.
 // Its top stays below the hanging banner and its right edge clears the rack.
 g.fillStyle='#75604422';g.beginPath();g.ellipse(57,60,62,9,0,0,Math.PI*2);g.fill();
 const face=g.createLinearGradient(0,0,0,57);face.addColorStop(0,'#e2d2b0');face.addColorStop(1,'#cbb990');
 g.fillStyle=face;g.strokeStyle='#8d7855';g.lineWidth=2.5;
 g.beginPath();g.roundRect(8,5,96,49,3);g.fill();g.stroke();
 g.fillStyle='#b9a27a';g.beginPath();g.roundRect(3,51,108,9,3);g.fill();g.stroke();
 g.fillStyle='#eadbb6';g.beginPath();g.roundRect(0,0,112,9,3);g.fill();g.stroke();
 g.strokeStyle='#f7e8c6';g.lineWidth=1;g.beginPath();g.moveTo(14,12);g.lineTo(14,47);g.stroke();
 if(earned){
 // Keep the first boss's existing cup reward, now on the record pedestal.
 g.save();g.translate(56,-19);g.strokeStyle='#856235';g.lineWidth=2.5;
 g.beginPath();g.moveTo(-10,-12);g.bezierCurveTo(-26,-17,-24,3,-9,3);g.moveTo(10,-12);g.bezierCurveTo(26,-17,24,3,9,3);g.stroke();
 g.fillStyle='#deb452';g.beginPath();g.moveTo(-11,-16);g.lineTo(11,-16);g.lineTo(8,0);g.quadraticCurveTo(0,11,-8,0);g.closePath();g.fill();g.stroke();
 g.beginPath();g.moveTo(0,6);g.lineTo(0,15);g.moveTo(-9,17);g.lineTo(9,17);g.stroke();
 g.strokeStyle='#fff0bb';g.lineWidth=2;g.beginPath();g.moveTo(-6,-11);g.lineTo(-5,-3);g.stroke();g.restore();
 }else{
  g.fillStyle='#b8aa85';g.strokeStyle='#8d7855';g.lineWidth=2;
  g.beginPath();g.moveTo(56,-17);g.lineTo(65,-6);g.lineTo(56,0);g.lineTo(47,-6);g.closePath();g.fill();g.stroke();
 }
 g.textAlign='center';g.fillStyle='#806640';g.font='800 16px system-ui';g.fillText(ru?'РЕКОРД':'BEST SCORE',56,25,84);
 g.fillStyle='#483c29';g.font='900 26px system-ui';g.fillText(String(best),56,47,84);
 g.restore();
}
function drawMenuCampGround(g,rewards=menuCampRewards()){
 g.save();
 // An irregular clearing, rather than concentric rings resembling a platform.
 const ground=()=>{g.beginPath();g.moveTo(91,438);g.bezierCurveTo(127,376,257,355,388,366);g.bezierCurveTo(525,354,709,353,794,421);g.bezierCurveTo(878,490,779,535,665,551);g.bezierCurveTo(541,582,428,563,302,557);g.bezierCurveTo(183,550,65,506,91,438);g.closePath();};
 ground();g.fillStyle=rewards.complete?'#b9c39299':'#d8d7b580';g.fill();
 g.save();g.translate(450,464);g.scale(.96,.91);g.translate(-450,-464);ground();
 const earth=g.createLinearGradient(0,360,0,575);earth.addColorStop(0,'#ede0bd');earth.addColorStop(.65,'#f1e5c8');earth.addColorStop(1,'#e6d6b1');g.fillStyle=earth;g.fill();g.restore();
 if(rewards.shotgun||rewards.complete){
  g.strokeStyle='#a8864c';g.lineWidth=2;
  spoly(g,[[368,367],[520,367],[568,493],[328,493]],rewards.complete?'#9b697d':'#72a2a0');
  g.strokeStyle='#ead294';g.lineWidth=3;
  g.beginPath();g.moveTo(379,380);g.lineTo(510,380);g.lineTo(549,482);g.lineTo(347,482);g.closePath();g.stroke();
  for(let i=0;i<17;i++)sline(g,331+i*14,494,330+i*14,499);
  g.lineWidth=2;for(const y of [405,438,469]){g.beginPath();g.moveTo(448,y-9);g.lineTo(465,y);g.lineTo(448,y+9);g.lineTo(431,y);g.closePath();g.stroke();}
 }
 // Low plants and pebbles only on the clearing edge; keep the hero/pet paths open.
 for(const [i,p] of [[120,450],[177,512],[304,560],[679,542],[798,454],[747,396],[319,369]].entries()){
  const [x,y]=p;g.strokeStyle='#9caa78';g.lineWidth=2;
  for(let j=0;j<3;j++){const xx=x+(j-1)*6;sline(g,xx,y,xx-3,y-8-j*2);sline(g,xx,y,xx+4,y-12+j);}
  if(i%2===0)for(let j=0;j<2;j++){g.fillStyle='#f8f1cc';g.beginPath();g.arc(x+j*12-4,y-13,3,0,7);g.fill();g.fillStyle='#d4a65a';g.beginPath();g.arc(x+j*12-4,y-13,1.3,0,7);g.fill();}
  g.fillStyle='#b9ac8c';g.beginPath();g.ellipse(x+18,y+3,4,2,-.2,0,7);g.fill();
 }
 g.restore();
}
function drawMenuWeaponRack(g,rewards,weapon,reaction,propWeight){
 g.save();g.lineJoin='round';g.lineCap='round';
 const panel=(x,y,w,h,r,fill,stroke='#735d43',width=2)=>{g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=fill;g.fill();g.strokeStyle=stroke;g.lineWidth=width;g.stroke();};
 // Splayed legs and an inset, three-bay display; familiar in-game gun models.
 g.strokeStyle='#6f5c44';g.lineWidth=9;sline(g,157,249,149,402);sline(g,261,249,272,402);
 panel(136,397,40,10,4,'#bc9b6b');panel(250,397,40,10,4,'#bc9b6b');
 panel(140,235,143,158,8,'#80694e');
 panel(137,231,143,159,8,'#bc9965','#66543d',3);
 const board=g.createLinearGradient(148,239,265,385);board.addColorStop(0,'#eee0bf');board.addColorStop(1,'#d1c29d');
 panel(148,243,121,140,5,board,'#927a55',2);
 panel(143,226,133,17,5,'#d6b47d','#735d43',2.5);
 g.strokeStyle='#f1d9a0';g.lineWidth=1.2;sline(g,151,231,267,231);
 for(const x of [144,273]){g.strokeStyle='#9b7b51';g.lineWidth=1;sline(g,x,252,x,376);}
 const weapons=[weapon,...['basic','shotgun','sniper'].filter(w=>w!==weapon)].slice(0,3);
 for(const [i,type] of weapons.entries()){
  const y=268+i*46;
  panel(153,y-19,111,40,4,i%2?'#d6cfb4':'#e3d9bb','#b1a27e',1);
  // Felt support pads and small brass hooks read as mounting hardware.
  for(const x of [183,232]){
   panel(x-4,y-7,8,16,2,'#7c8770','#7c8770',1);
   g.strokeStyle='#9c8055';g.lineWidth=2;g.beginPath();g.moveTo(x-2,y+6);g.quadraticCurveTo(x-2,y+12,x+4,y+10);g.stroke();
  }
  g.save();if(i===0&&reaction?.kind==='rack')g.globalAlpha=1-propWeight;
  g.translate(161,y);g.scale(MENU_RACK_WEAPON_SCALE,MENU_RACK_WEAPON_SCALE);drawGunModel(g,2,0,type);g.restore();
 }
 for(const [x,y] of [[145,238],[272,238],[145,383],[272,383]]){
  g.fillStyle='#e7cf97';g.strokeStyle='#8c714b';g.lineWidth=1;g.beginPath();g.arc(x,y,2.4,0,7);g.fill();g.stroke();
 }
 panel(153,387,111,7,2,'#a7885a','#816a46',1.5);
 g.restore();
}
function paintArenaCamp(g,w,h,time=0){
 const campRewards=menuCampRewards();
 const reaction=menuDeparture?{kind:'depart',start:menuDeparture.start,from:menuDeparture.from}:menuReaction;
 const propWeight=menuPropWeight(reaction,time),launch=menuDeparture?menuEase((time-menuDeparture.start)/.6):0;
 const sketchMode=g.vackyStableSketch;g.vackyStableSketch=true;
 g.save();g.setTransform(w/900,0,0,h/620,0,0);g.clearRect(0,0,900,620);
 g.lineCap='round';g.lineJoin='round';g.strokeStyle=INK;g.lineWidth=3;
 const ellipse=(x,y,rx,ry,color)=>{g.fillStyle=color;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();};
 const shadow=(x,y,rx,ry)=>{g.save();g.globalAlpha=.07;ellipse(x-5,y+2,rx*1.2,ry*1.45,'#75674f');g.globalAlpha=.13;ellipse(x,y,rx,ry,'#75674f');g.restore();};
 const box=(x,y,w,h,color)=>{g.fillStyle=color;g.strokeStyle='#66553d';g.lineWidth=3;g.beginPath();g.roundRect(x,y,w,h,9);g.fill();g.stroke();};
 ellipse(687,133,42,42,'#efd7aa');
 // Quiet arena scenery in the distance.
 g.strokeStyle='#decba6';g.lineWidth=2;
 for(let i=0;i<2;i++){g.beginPath();g.moveTo(45,318-i*23);g.bezierCurveTo(220,250-i*14,540,285-i*20,850,322-i*13);g.stroke();}
 drawMenuCampBackdrop(g,time,campRewards);
 for(const [x,y,s] of [[119,244,.82],[768,278,.70]]){
  g.save();g.translate(x,y);g.scale(s,s);g.strokeStyle='#9c8b67';g.lineWidth=7;sline(g,0,0,0,-65);
  ellipse(-18,-65,34,31,'#c4ce9f');ellipse(19,-79,39,40,'#b0c08b');ellipse(0,-111,31,28,'#d0d7a9');g.restore();
 }
 // A hand-tied camp banner and distant shrubs, not a boxed background.
 g.strokeStyle='#bda985';g.lineWidth=2;g.beginPath();g.moveTo(167,169);g.quadraticCurveTo(430,249,743,184);g.stroke();
 for(let i=0;i<7;i++){
  const t=(i+1)/8,x=(1-t)**2*167+2*(1-t)*t*430+t*t*743,y=(1-t)**2*169+2*(1-t)*t*249+t*t*184;
  const sway=Math.sin(time*.9+i)*2;g.strokeStyle='#a88e67';g.lineWidth=1.4;
  spoly(g,[[x-9,y],[x+9,y+1],[x+sway,y+22]],['#c8884f','#b0bf91','#dfc48c'][i%3]);
 }
 drawMenuCampGround(g,campRewards);
 const sunlight=g.createRadialGradient(640,389,15,520,428,330);sunlight.addColorStop(0,'#fff7d54d');sunlight.addColorStop(1,'#fff7d500');
 ellipse(450,464,343,91,sunlight);
 // A freestanding wooden rack: supports, hooks and grain give objects a purpose.
 shadow(205,402,76,12);
 const rackStart=typeof campProfile!=='undefined'&&campWeaponOpen(campProfile.weapon)?campProfile.weapon:'basic';
 drawMenuWeaponRack(g,campRewards,rackStart,reaction,propWeight);
 // Braced workbench, folded cloth, individual trays, a cup with quiet steam.
 shadow(723,397,108,11);g.strokeStyle='#796246';g.lineWidth=7;
 for(const [x,y] of [[630,392],[646,379],[806,394],[787,378]])sline(g,x,279,x+(x<700?-5:5),y);
 g.lineWidth=4;sline(g,629,375,809,376);sline(g,648,291,793,374);
 box(611,268,216,16,'#a88458');
 g.strokeStyle='#7b6345';g.lineWidth=2;spoly(g,[[611,268],[625,258],[818,258],[827,268]],'#d9bb88');
 spoly(g,[[637,261],[774,261],[783,288],[647,287]],'#d6ddbb');
 g.strokeStyle='#a3ad86';sline(g,649,281,776,282);
 for(const x of [642,697,752])ellipse(x,266,18,3,'#97a280');
 for(const [i,key] of ['mine','nade','ice'].entries())drawItemIcon(g,key,642+i*55,254,1.4);
 box(793,244,16,17,'#f5e5bf');g.strokeStyle='#806c4e';g.lineWidth=2;
 g.beginPath();g.arc(811,251,5,-Math.PI/2,Math.PI/2);g.stroke();ellipse(801,245,6,2,'#a48058');
 g.strokeStyle='#c5b796';g.lineWidth=1.6;
 for(let i=0;i<2;i++){const sway=Math.sin(time*1.3+i)*2;g.beginPath();g.moveTo(798+i*7,238);g.bezierCurveTo(792+i*7+sway,233,803+i*7+sway,228,797+i*7,221);g.stroke();}
 // Foreground chest occludes the workbench shadow, not the other way around.
 shadow(716,420,63,11);
 const open=reaction?.kind==='chest'?propWeight:0;
 box(661,344,103,70,'#d5ae62');
 if(open){ellipse(712,348,49,8,'#695434');g.save();g.globalAlpha=open*.28;ellipse(712,339,44,20,'#fff1b5');g.restore();}
 g.save();g.translate(656,356);g.rotate(-open*.45);box(0,-26,112,26,'#e8c681');g.restore();box(705,342,20,28,'#f1d88c');
 g.strokeStyle='#695434';g.lineWidth=2;sline(g,715,352,715,363);
 for(const x of [671,749]){box(x,368,7,34,'#b58d50');ellipse(x+3,377,1.4,1.4,'#fff0bc');}
 g.strokeStyle='#f3d893';sline(g,678,397,739,397);
 // Keep the seat surface at y=363: both the seated pelvis and visiting cat use it.
 shadow(454,432,55,11);g.strokeStyle='#735a3d';g.lineWidth=3;
 g.beginPath();g.moveTo(413,363);g.lineTo(414,413);g.lineTo(403,429);g.quadraticCurveTo(450,445,505,429);g.lineTo(491,412);g.lineTo(494,363);g.closePath();g.fillStyle='#aa8150';g.fill();g.stroke();
 for(let i=0;i<6;i++){const x=420+i*13;g.strokeStyle=i%2?'#81613f':'#c59d64';g.lineWidth=i%2?2:4;g.beginPath();g.moveTo(x,376);g.quadraticCurveTo(x-4,401,x+(i<3?-5:5),426);g.stroke();}
 ellipse(453,363,41,12,'#dec18b');g.strokeStyle='#80603c';g.lineWidth=2;g.beginPath();g.ellipse(453,363,41,12,0,0,Math.PI*2);g.stroke();
 g.strokeStyle='#b18a56';g.lineWidth=1.3;for(const r of [12,24,33]){g.beginPath();g.ellipse(452,363,r,r*.25,0,0,Math.PI*2);g.stroke();}sline(g,477,355,466,361);
 const warmth=g.createRadialGradient(MENU_FIRE.x,MENU_FIRE.y,4,MENU_FIRE.x,MENU_FIRE.y,62);warmth.addColorStop(0,'#efaf4833');warmth.addColorStop(1,'#efaf4800');ellipse(MENU_FIRE.x,MENU_FIRE.y,62,23,warmth);
 drawMenuCampRewardDetails(g,time,campRewards);
 if(typeof drawCampMilestones==='function')drawCampMilestones(g,time);
 drawMenuScorePlaque(g);
 if(typeof drawCampRangeStand==='function')drawCampRangeStand(g,785,484,economyRangeTier(),time);
 const hero=menuHeroPose(time,menuHeroSeed,reaction),gear={...MENU_HERO_GEAR,_campStyle:typeof campProfile==='undefined'?'classic':campProfile.style};
 const floor=440+80*hero.depth,scale=3+1.4*hero.depth;
 const pets=MENU_COMPANIONS.map(p=>p.type==='cat'?menuCatPose(time):p.type==='parrot'?menuParrotPose(time,menuHeroSeed,hero):menuCompanionPose(p,time)).map((p,i)=>launch?{...p,x:p.x+(hero.x+(i-2)*35-p.x)*launch*.3}:p).sort((a,b)=>a.y-b.y);
 const paintPet=p=>{
  if(p.type!=='parrot')shadow(p.x,p.y+4,15*p.scale,3*p.scale);
  const happy=p.type==='dog'?menuReactionWeight(menuReaction,'dog',time):0;
  g.save();g.translate(p.x,p.y+p.bob-happy*5);g.rotate(p.sniff*p.face*(p.type==='chicken'?.14:.065));g.scale(p.scale,p.scale);
  drawPet(g,0,0,p.type,1,p.face,p.phase,{state:'up',aim:p.face>0?0:Math.PI,bite:0,saw:0,menuTime:time,menuHappy:happy,menuScene:true,menuPerch:p.perch||0});g.restore();
  if(happy>.01){g.save();g.globalAlpha=happy;g.translate(p.x+18*p.face,p.y-62-happy*8);g.strokeStyle='#aa6451';g.lineWidth=1.8;
   g.beginPath();g.moveTo(0,4);g.bezierCurveTo(-18,-7,-5,-16,0,-8);g.bezierCurveTo(5,-16,18,-7,0,4);g.fillStyle='#dfa38b';g.fill();g.stroke();g.restore();}
 };
 // Depth ordering prevents companions being painted through the approaching hero.
 const paintHero=()=>{
 shadow(hero.x+(hero.lf[0]+hero.lb[0])*scale/2,floor,44+hero.depth*16,10+hero.depth*3);
 g.save();g.translate(hero.x,hero.y+80*hero.depth);
 drawHero(g,0,0,1,hero.phase,gear,scale,0,0,hero,1);g.restore();
 if((reaction?.kind==='rack'&&propWeight>0)||launch>0){
  drawMenuHeldWeapon(g,hero,reaction?.kind==='rack'?'rack':'depart',reaction?.kind==='rack'?propWeight:launch);
 }
 };
 [...pets.map(p=>({y:p.front?Infinity:p.y,paint:()=>paintPet(p)})),{y:floor,paint:paintHero},{y:MENU_FIRE.y,paint:()=>drawMenuCampfire(g,time)}].sort((a,b)=>a.y-b.y).forEach(o=>o.paint());
 if(hero.tap>.001){
  const x=hero.x+hero.af[0]*scale,y=hero.y+80*hero.depth+hero.af[1]*scale;
  g.save();g.globalAlpha=hero.tap*.75;g.strokeStyle='#ad7842';g.lineWidth=2;
  for(let i=0;i<3;i++){const a=-1.2+i*.6;const r=22+(1-hero.tap)*9;sline(g,x+Math.cos(a)*r,y+Math.sin(a)*r,x+Math.cos(a)*(r+9),y+Math.sin(a)*(r+9));}
  g.strokeStyle='#fff9e9';g.lineWidth=3;g.beginPath();g.arc(x,y,20+(1-hero.tap)*15,-1.8,.9);g.stroke();g.restore();
 }
 g.strokeStyle='#a9b184';g.lineWidth=2.5;
 for(const [x,y] of [[81,432],[214,408],[820,410],[610,510],[270,560]]){sline(g,x,y,x-5,y-9);sline(g,x,y,x+6,y-12);}
 g.restore();g.vackyStableSketch=sketchMode;
}
function drawArenaMenu(now,force=false){
 const menu=document.getElementById('start'),canvas=document.getElementById('menuScene');
 if(!canvas||!menu||menu.classList.contains('hidden'))return false;
 if(typeof Playables!=='undefined'&&Playables.blocked)return true;
 if(menuDeparture&&((typeof gameHelpOpen==='function'&&gameHelpOpen())||(typeof tutorialOpen==='function'&&tutorialOpen())||(typeof languageMenuActive!=='undefined'&&languageMenuActive))){menuSceneLast=now;return true;}
 const reduced=!!menuMotionQuery?.matches;
 const width=Math.max(1,Math.min(900,Math.round((canvas.getBoundingClientRect().width||450)*Math.min(1.6,devicePixelRatio||1))));
 const height=Math.round(width*620/900),resized=canvas.width!==width||canvas.height!==height;
 if(!force&&!resized&&menuScenePainted&&reduced&&!menuDeparture)return true;
 if(resized){canvas.width=width;canvas.height=height;}
 if(Number.isFinite(menuSceneLast))menuSceneTime+=Math.max(0,Math.min(.1,(now-menuSceneLast)/1000));
 menuSceneLast=now;menuScenePainted=true;
 paintArenaCamp(canvas.getContext('2d'),width,height,reduced?0:menuSceneTime);
 if(menuDeparture&&(reduced||menuSceneTime-menuDeparture.start>=.6)){
  const done=menuDeparture.complete;menuDeparture=null;done();
 }
 return true;
}
