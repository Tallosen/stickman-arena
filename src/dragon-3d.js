"use strict";
/* True three-dimensional polygon meshes, perspective projection, depth sorting and
   directional lighting. No CDN, sprite rotation or network requirement. */
const EXCLUSIVE_FAMILIES=DRAGON_BREEDS;
const EXCLUSIVE_EPITHETS=["Рассвета","Сумерек","Полуночи"];
const exclusiveMeshCache=new Map();
function dragonHsl(h,s,l){
  h=((h%360)+360)%360/360;
  const a=s*Math.min(l,1-l),f=n=>{const k=(n+h*12)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1));};
  return [f(0)*255,f(8)*255,f(4)*255];
}
function exclusiveDragonSpec(id){
  if(!Number.isInteger(id)||id<0||id>=100)throw Error("Неизвестный дракон");
  const family=Math.floor(id/3),variant=id%3,f=EXCLUSIVE_FAMILIES[family];
  const palette=DRAGON_PALETTES[family].map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)));
  const tint=c=>c.map(n=>variant===1?Math.round(n*.88+255*.12):variant===2?Math.round(n*.84):n);
  const soft=!['skeleton','crystal','sail','scorpion'].includes(f.feature),aquatic=['serpent','flippers','manta','sword'].includes(f.feature);
  return {...f,body:[f.body[0],f.body[1]*(soft?1.07:1.02),f.body[2]*(soft?1.06:1.02)],
    headWidth:(f.headWidth||1)*(aquatic?1.04:1.10),headLength:(f.headLength||1)*1.06,neck:(f.neck??.65)*.96,
    id,family,variant,name:f.name+" "+EXCLUSIVE_EPITHETS[variant],
    color:tint(palette[variant%3]),wing:tint(palette[(variant+1)%3]),accent:tint(palette[(variant+2)%3]),
    effect:["Искры","Орбитальные руны","Кристальная пыль","Северное сияние","Звёздный шлейф"][family%5]};

}
function dragonRgb(c,f=1){return `rgb(${c.map(v=>Math.max(0,Math.min(255,Math.round(v*f)))).join(",")})`;}
function dragonLegLayout(d,j){
  const b=d.body,by=d.height||1.4,side=j%2?1:-1,rows=d.legs/2,rx=b[0]*(1+(d.variant||0)*.055);
  // Place every socket inside the torso, including the last row of many-legged breeds.
  const lx=rows===1?rx*.20:rx*(.55-Math.floor(j/2)/(rows-1)*1.10);
  const hip=[lx,by-b[1]*.06,side*b[2]*.12],knee=[lx-.08,by-.64,side*(b[2]+.16)],foot=[lx+.24,.2,side*(b[2]+.27)];
  const rootRadius=Math.min(.20,b[1]*.30,b[2]*.32,rx*.12),kneeRadius=Math.max(.13,Math.min(.24,b[2]*.42));
  return {hip,knee,foot,rootRadius,kneeRadius};
}
function buildExclusiveDragon(id){
  if(exclusiveMeshCache.has(id))return exclusiveMeshCache.get(id);
  const d=exclusiveDragonSpec(id),faces=[],v=d.variant;let part=0,head=0,eyeLayer=0,surface=0,surfaceSerial=0;
  const tri=(a,b,c,col,tag=0,glow=false)=>faces.push({p:[a,b,c],col,tag,glow,part,head,eyeLayer,surface});
  function ell(c,r,col,tag=0,rings=7,sides=12){
    surface=++surfaceSerial;
    // Spend geometry on the silhouette, not on tiny eyes, joints and ornaments.
    const detail=rings>=7;
    rings=detail?rings+1:Math.max(3,rings);
    sides=detail?sides+2:Math.max(6,sides);
    const p=(i,j)=>{const a=Math.PI*i/rings,b=j*Math.PI*2/sides;return [c[0]+Math.sin(a)*Math.cos(b)*r[0],c[1]+Math.cos(a)*r[1],c[2]+Math.sin(a)*Math.sin(b)*r[2]];};
    for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){
      if(i)tri(p(i,j),p(i+1,j),p(i,j+1),col,tag);
      if(i<rings-1)tri(p(i,j+1),p(i+1,j),p(i+1,j+1),col,tag);
    }
    surface=0;
  }
  function rod(a,b,r1,r2,col,tag=0,sides=6,glow=false){
    surface=++surfaceSerial;
    const axis=b.map((n,i)=>n-a[i]),len=Math.hypot(...axis);if(len<.0001){surface=0;return;}
    const n=axis.map(x=>x/len),u=Math.abs(n[1])<.9?[n[2],0,-n[0]]:[0,-n[2],n[1]],ul=Math.hypot(...u);u.forEach((x,i)=>u[i]=x/ul);
    const w=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]];
    const p=(c,r,k)=>c.map((x,i)=>x+r*(u[i]*Math.cos(k*Math.PI*2/sides)+w[i]*Math.sin(k*Math.PI*2/sides)));
    for(let j=0;j<sides;j++){
      tri(p(a,r1,j),p(b,r2,j),p(a,r1,j+1),col,tag,glow);
      if(r2)tri(p(a,r1,j+1),p(b,r2,j),p(b,r2,j+1),col,tag,glow);
    }
    // Close tube ends; joints must not reveal the background when viewed end-on.
    surface=0;
    for(let j=0;j<sides;j++){
      tri(a,p(a,r1,j+1),p(a,r1,j),col,tag,glow);
      if(r2)tri(b,p(b,r2,j),p(b,r2,j+1),col,tag,glow);
    }
  }
  const b=d.body,stretch=1+v*.055,by=d.height||1.4;
  ell([0,by,0],[b[0]*stretch,b[1],b[2]],d.color);
  ell([.45,by-.27,0],[b[0]*.67,b[1]*.66,b[2]*.92],d.wing);
  // Articulated curving tail: lengths and fin arrangements vary per individual.
  part=2;let prev=[-b[0]*.65,by,0];
  for(let i=1;i<=10;i++){
    const q=i/10;let cur=[-b[0]*.65-q*d.tail*(1+v*.045),by-.45*q+Math.sin(q*4+v*.14)*q*.6,Math.sin(q*3+v*.22)*q*.66];
    if(d.tailForm==="scorpion")cur=[-b[0]*.65-Math.sin(q*Math.PI)*d.tail*.66,by+q*2.2,Math.sin(q*3)*.12];
    if(d.tailForm==="coil")cur=[-.6-Math.sin(q*6)*d.tail*.43,by-.8+Math.cos(q*6)*.5,q*.3];
    if(d.tailForm==="curl")cur=[-b[0]*.65-q*d.tail,by-.25,Math.sin(q*6)*.65];
    rod(prev,cur,.37*(1-q)+.015,.33*(1-q)+.009,d.color);
    if(i%2===0)rod(cur,[cur[0]-.16,cur[1]+.35*(1-q)+.14,cur[2]],.15*(1-q)+.02,0,d.accent);
    prev=cur;
  }
  if(["plumes","paddle","fork"].includes(d.tailForm))for(let j=-2;j<=2;j++)rod(prev,[prev[0]-.55-Math.abs(j)*.08,prev[1]+.16,prev[2]+j*.19],.16,0,d.wing);
  part=3;const heads=d.heads||1;
  for(let h=0;h<heads;h++){
    head=h;
    const hz=(h-(heads-1)/2)*.9,hx=b[0]*.7+(h===1?.22:0),hy=by+(d.neck??.65)+(heads>1?Math.abs(h-1)*.25:0),hw=d.headWidth||1,hl=d.headLength||1;
    part=6;rod([b[0]*.45,by,hz*.4],[hx,hy,hz],.37,.30,d.color);part=3;
    ell([hx+.32,hy+.17,hz],[(.53+v*.026)*hl,.36,.33*hw],d.color);
    ell([hx+.7,hy+.05,hz],[.4*hl,.17,.24*hw],d.color);
    part=4;ell([hx+.66,hy-.095,hz],[.39*hl,.09,.215*hw],d.color,0,4,8);part=3;
    for(const s of [-1,1]){
      const hammer=d.feature==="hammer",bug=d.feature==="dragonfly",ex=hammer?hx+.42:bug?hx+.40:hx+.32+.23*hl;
      const ey=hy+(hammer?.23:bug?.22:.28),ez=hammer?1.03*Math.sqrt(1-(.06/.24)**2-(.11/.24)**2):bug?.29:.33*hw*Math.sqrt(1-(.23/(.53+v*.026))**2-(.11/.36)**2);
      part=5;
      ell([ex,ey,hz+s*ez],bug?[.20,.21,.13]:[.15,.115,.052],[24,31,39],0,3,6);
      eyeLayer=1;ell([ex+.02,ey+.01,hz+s*(ez+(bug?.115:.037))],bug?[.11,.13,.027]:[.083,.075,.022],d.accent,0,3,6);
      ell([ex+.045,ey+.045,hz+s*(ez+(bug?.135:.052))],[.032,.032,.012],[255,250,227],0,2,4);eyeLayer=0;part=3;
      for(let j=0;j<Math.ceil(d.horns/2);j++){
        const bx=.13-j*.10,bz=s*(.15+j*.02)*hw;
        const base=[hx+.32+bx*hl,hy+.17+.36*Math.sqrt(Math.max(.1,1-(bx/(.53+v*.026))**2-(bz/(.33*hw))**2))*.90,hz+bz];
        rod(base,[base[0]-.27-v*.018,base[1]+.4+j*.15+v*.015,base[2]+s*.13],.105,0,d.accent);
      }
      // Visible teeth and side cheek plates anchor the head silhouette.
      for(let j=0;j<2;j++)rod([hx+.63+j*.16*hl,hy-.065,hz+s*.17*hw],[hx+.65+j*.16*hl,hy-.145,hz+s*.155*hw],.026,0,[239,237,213]);
    }
  }
  head=0;
  for(let j=0;j<d.legs;j++){
    part=10+j;
    const {hip,knee,foot,rootRadius,kneeRadius}=dragonLegLayout(d,j);
    // A rounded upper joint overlaps both the body and the thigh; no exposed flat cut.
    const shoulder=hip.map((v,i)=>v+(knee[i]-v)*.35);
    ell(shoulder,[kneeRadius*1.05,kneeRadius*1.35,kneeRadius],d.color,0,3,6);
    ell(knee,[kneeRadius,kneeRadius*1.25,kneeRadius],d.color,0,4,6);
    rod(hip,knee,rootRadius,kneeRadius*.78,d.color);rod(knee,foot,kneeRadius*.65,.095,d.color);
    for(let c=-1;c<=1;c++)rod(foot,[foot[0]+.32,foot[1]-.06,foot[2]+c*.13],.065,0,d.accent);
  }
  // Wings are fully spatial membranes with ribs, not billboards. Tags animate hinges.
  part=1;for(let layer=0;layer<d.wings;layer++)for(const side of [-1,1]){
    const tag=side*(layer+1),wx=.05-layer*.42,wy=by+.28-layer*.1;
    const span=((d.span||2.4)+v*.1)*(1-layer*.18),root=[wx,wy,side*.32];
    const elbow=[wx-.12,wy+.7,side*span*.51],tip=[wx+.12,wy+1.08-layer*.25,side*span];
    let fingers=[tip,[wx-.6,wy+.42,side*span*.91],[wx-1.22,wy+.04,side*span*.7],[wx-1.48,wy-.17,side*span*.4],[wx-.92,wy-.18,side*.4]];
    if(d.wingForm==="narrow")fingers=[tip,[wx-.28,wy+.4,side*span],[wx-.52,wy+.05,side*span*.75],[wx-.45,wy-.1,side*.4]];
    if(d.wingForm==="delta")fingers=[[wx+.8,wy+.35,side*span],[wx-1.8,wy-.2,side*span*.9],[wx-1.7,wy-.25,side*.35]];
    if(d.wingForm==="round")fingers=Array.from({length:8},(_,j)=>{const a=j/7*Math.PI;return [wx+.55-Math.sin(a)*2.15,wy+.4+Math.cos(a)*.8,side*(.4+Math.sin(a)*span)];});
    if(d.wingForm==="ring"){
      for(let j=0;j<16;j++){const a=j/16*6.283,aa=(j+1)/16*6.283;
        rod([wx+Math.cos(a)*.85,wy+Math.sin(a)*.85,side*1.4],[wx+Math.cos(aa)*.85,wy+Math.sin(aa)*.85,side*1.4],.065,.065,d.accent,tag);}
      rod(root,[wx,wy,side*1.4],.08,.04,d.color,tag);continue;
    }
    if(d.wingForm==="shard"){
      for(let j=0;j<5;j++){const tip=[wx+.45-j*.45,wy+1.3-j*.2,side*(span-j*.19)];
        rod(root,tip,.18,0,j%2?d.accent:d.wing,tag,4);}
      continue;
    }
    rod(root,elbow,.13,.075,d.color,tag);rod(elbow,tip,.075,.018,d.accent,tag);
    for(let k=0;k<fingers.length-1;k++){
      if(d.wingForm==="torn"&&k%2){rod(elbow,fingers[k],.07,0,d.accent,tag);continue;}
      const mid=fingers[k].map((n,i)=>(n+fingers[k+1][i]+elbow[i])/3);
      mid[1]-=.12;
      tri(elbow,fingers[k],mid,k%2?d.wing:d.color,tag);
      tri(fingers[k],fingers[k+1],mid,d.wing,tag);tri(fingers[k+1],elbow,mid,d.wing,tag);
      rod(elbow,fingers[k],.042,.013,d.accent,tag);
    }
    if(d.wingForm==="feather")for(let k=0;k<9;k++){
      const q=k/9,base=[wx-.2-q,wy+.65-q*.65,side*span*(.95-q*.52)];
      rod(base,[base[0]-.55,base[1]-.22,base[2]+side*.21],.13,0,k%2?d.accent:d.wing,tag,4);
    }
  }
  const spines=['crystal','sail','scorpion'].includes(d.feature)?5+v%3:4+v%2;
  part=0;for(let j=0;j<spines;j++){
    const x=-b[0]+j*b[0]*1.8/spines,size=.24+(v%3)*.06;
    const ridge=by+b[1]*Math.sqrt(Math.max(0,1-(x/(b[0]*stretch))**2))*.9;
    rod([x,ridge,0],[x-.14,ridge+size+.12,0],.13,0,d.accent);
  }
  // Signature anatomy: each plan has a visible, structural differentiator.
  const hx=b[0]*.7,hy=by+(d.neck??.65);
  function curve(points,r,col){for(let i=1;i<points.length;i++)rod(points[i-1],points[i],r*(1-(i-1)/points.length),r*(1-i/points.length),col);}
  function fan(center,r,col,vertical=true){
    for(let j=0;j<12;j++){const a=j/12*6.283,aa=(j+1)/12*6.283;
      tri(center,[center[0]+(vertical?0:Math.cos(a)*r),center[1]+(vertical?Math.cos(a)*r:0),center[2]+Math.sin(a)*r],
        [center[0]+(vertical?0:Math.cos(aa)*r),center[1]+(vertical?Math.cos(aa)*r:0),center[2]+Math.sin(aa)*r],j%2?col:d.wing);}
  }
  switch(d.feature){
    case "shell":
      ell([-.15,by+.37,0],[1.27,.76,.88],d.wing,0,4,8);
      for(let j=0;j<5;j++)rod([-.9+j*.4,by+.8,0],[-.92+j*.4,by+1.1,0],.15,0,d.accent);break;
    case "serpent":
      part=3;
      for(const side of [-1,1])curve([[hx+.5,hy,side*.2],[hx+.2,hy-.3,side*.6],[hx-.3,hy-.5,side*.8],[hx-.7,hy-.2,side*.95]],.045,d.accent);break;
    case "hydra":
      part=3;for(let j=0;j<3;j++){head=j;const hh=hy+Math.abs(j-1)*.25;rod([hx+(j===1?.22:0)+.2,hh+.4,(j-1)*.9],[hx-.1,hh+.95,(j-1)*.95],.14,0,d.wing);}head=0;break;
    case "crystal":
      for(let j=0;j<8;j++)rod([-1+j*.27,by+.25,.12],[-1.2+j*.27,by+1+(j%3)*.22,.25],.2,0,d.accent,0,4,true);break;
    case "flippers":case "sword":
      for(const side of [-1,1])for(const x of [-.85,.75])tri([x,by,side*.3],[x-.6,by-.5,side*1.5],[x-.65,by,side*.4],d.wing);
      if(d.feature==="sword"){part=3;rod([hx+.8,hy+.07,0],[hx+2.1,hy+.13,0],.14,0,d.accent);}break;
    case "phoenix":
      part=2;
      for(let j=-2;j<=2;j++)curve([[-.7,by,0],[-1.5,by+.5,j*.2],[-2.8,by-.2,j*.35],[-3.3,by-.7,j*.4]],.17,j%2?d.wing:d.accent);break;
    case "mantis":
      for(const side of [-1,1]){rod([.7,by+.2,side*.3],[1.2,by+1,side*.8],.14,.11,d.color);curve([[1.2,by+1,side*.8],[1.9,by+.7,side*.9],[2.1,by,side*.75]],.18,d.accent);}break;
    case "orbit":
      for(let j=0;j<9;j++){const a=j/9*6.283;ell([Math.cos(a)*1.45,by+1.05,Math.sin(a)*1.45],[.11,.18,.11],d.accent,0,3,5);}break;
    case "sail":
      for(let j=0;j<7;j++){const x=-1.3+j*.4;tri([x,by,0],[x+.2,by+1.6-Math.abs(x)*.4,0],[x+.4,by,0],d.wing);rod([x,by,0],[x+.2,by+1.6-Math.abs(x)*.4,0],.04,.015,d.accent);}break;
    case "hammer":
      part=3;
      ell([hx+.36,hy+.12,0],[.24,.24,1.03],d.wing);
      break; // The common eye rig is fitted to this crossbar; no duplicate eye pair.
    case "moth":
      for(const side of [-1,1]){part=3;curve([[hx+.2,hy+.3,side*.14],[hx+.05,hy+.85,side*.4],[hx+.32,hy+1,side*.6]],.065,d.accent);
        part=0;ell([0,by+.15,side*.4],[.65,.6,.3],d.accent,0,4,8);}break;
    case "manta":
      part=3;
      for(const side of [-1,1])curve([[hx+.6,hy,side*.25],[hx+1.1,hy+.3,side*.65],[hx+.8,hy+.65,side*.7]],.13,d.wing);break;
    case "segments":
      for(let j=0;j<8;j++)ell([-1.5+j*.43,by,0],[.3,.47,.46],j%2?d.color:d.wing,0,4,6);break;
    case "seahorse":
      for(let j=0;j<6;j++)rod([-.5,by-.5+j*.3,0],[-1.1,by-.35+j*.3,0],.14,0,d.wing);break;
    case "ram":
      part=3;
      for(const side of [-1,1])curve(Array.from({length:10},(_,j)=>{const a=j/9*5;return [hx+.1+Math.sin(a)*.4,hy+.3+Math.cos(a)*.5,side*(.33+j*.035)];}),.24,d.accent);break;
    case "antlers":
      part=3;
      for(const side of [-1,1]){const root=[hx,hy+.25,side*.17],tip=[hx-.65,hy+1.3,side*.8];rod(root,tip,.13,.045,d.accent);
        for(let j=0;j<4;j++)rod([hx-j*.14,hy+.4+j*.2,side*(.23+j*.12)],[hx+.3-j*.22,hy+.9+j*.19,side*(.6+j*.17)],.07,0,d.accent);}break;
    case "cobra":
      part=3;
      fan([hx-.1,hy-.1,0],.97,d.wing);for(const side of [-1,1])ell([hx-.05,hy+.25,side*.6],[.03,.23,.16],d.accent,0,4,6);break;
    case "club":
      part=2;ell(prev,[.52,.4,.43],d.wing,0,4,7);part=0;for(const side of [-1,1])for(let j=0;j<6;j++)rod([-.9+j*.34,by+.2,side*.52],[-1.05+j*.34,by+.5,side*1.03],.16,0,d.accent);break;
    case "scorpion":
      part=2;rod(prev,[prev[0]+.7,prev[1]-.35,0],.23,0,d.accent);part=0;
      for(const side of [-1,1]){const c=[hx+.6,by-.2,side*.9];rod([.8,by,side*.4],c,.18,.22,d.color);
        for(const fork of [-1,1])curve([c,[c[0]+.45,c[1]+fork*.25,c[2]],[c[0]+.65,c[1],c[2]]],.14,d.wing);}break;
    case "skeleton":
      for(let j=0;j<6;j++)for(const side of [-1,1])curve([[-.9+j*.3,by+.5,0],[-.9+j*.3,by+.15,side*.65],[-.8+j*.3,by-.5,side*.23]],.09,d.accent);break;
    case "ears":case "batEars":
      part=3;
      for(const side of [-1,1])ell([hx+.03,hy+.9,side*.24],[.19,d.feature==="ears"?.85:.6,.18],d.wing,0,4,6);
      if(d.feature==="ears"){part=0;for(const side of [-1,1])ell([-.25,by-.2,side*.5],[.45,.55,.35],d.wing);}break;
    case "beetle":
      for(const side of [-1,1])ell([-.2,by+.45,side*.37],[1.08,.48,.43],d.wing,0,4,7);
      part=3;curve([[hx+.6,hy+.2,0],[hx+.95,hy+.9,0],[hx+.55,hy+1.05,0]],.2,d.accent);break;
    case "tentacles":
      for(let j=0;j<8;j++){const a=j/8*6.283;curve([[0,by,0],[Math.cos(a)*.8,by-.55,Math.sin(a)*.8],[Math.cos(a)*1.7,by-1,Math.sin(a)*1.7],[Math.cos(a+.4)*2,by-.5,Math.sin(a+.4)*2]],.2,j%2?d.color:d.wing);}break;
    case "gills":
      part=3;
      for(const side of [-1,1])for(let j=0;j<3;j++){const tip=[hx-.12-j*.2,hy+.65-j*.4,side*(.75+j*.1)];
        rod([hx,hy,side*.3],tip,.1,.03,d.wing);for(let k=0;k<3;k++)rod(tip,[tip[0]+k*.12,tip[1]+.22,tip[2]+side*.14],.05,0,d.accent);}break;
    case "frill":
      part=3;
      fan([hx-.15,hy+.2,0],.76,d.wing);
      for(const side of [-1,1])rod([hx+.35,hy+.3,side*.23],[hx+.6,hy+1,side*.33],.15,0,d.accent);
      rod([hx+.9,hy+.14,0],[hx+1.18,hy+.55,0],.12,0,d.accent);break;
    case "mushroom":
      for(let j=0;j<4;j++){const x=-.85+j*.45,y=by+.9+(j%2)*.28;rod([x,by,0],[x,y,0],.12,.1,d.accent);ell([x,y,0],[.45,.18,.48],d.wing,0,3,7);
        ell([x+.14,y+.15,.1],[.1,.025,.1],d.accent,0,3,5);}break;
    case "twins":
      part=2;
      for(const side of [-1,1])curve([[-.7,by,0],[-1.6,by-.2,side*.3],[-2.8,by+.2,side*.8]],.18,side===1?d.wing:d.color);break;
    case "dragonfly":
      break; // Enlarged eyes belong to the common blinking eye rig above.
    case "peacock":
      part=2;
      for(let j=0;j<11;j++){const a=-1.25+j*.25,tip=[-1.55,by+.45+Math.cos(a)*1.65,Math.sin(a)*1.7];
        rod([-.8,by,0],tip,.11,.07,d.wing);ell(tip,[.06,.31,.2],d.accent,0,4,6);ell([tip[0]+.065,tip[1],tip[2]],[.02,.14,.09],d.color,0,3,6);}break;
    case "emperor":
      part=3;
      for(let j=0;j<7;j++){const a=j/7*6.283;rod([hx+.2+Math.cos(a)*.35,hy+.3,Math.sin(a)*.35],[hx+.2+Math.cos(a)*.38,hy+1.1+(j%2)*.18,Math.sin(a)*.38],.13,0,d.accent);}
      part=0;for(const side of [-1,1])ell([.5,by+.3,side*.58],[.45,.42,.2],d.wing,0,3,6);break;
  }
  const mesh={d,faces};exclusiveMeshCache.set(id,mesh);
  if(exclusiveMeshCache.size>12)exclusiveMeshCache.delete(exclusiveMeshCache.keys().next().value);
  return mesh;
}
function renderExclusiveDragon(canvas,id,view,time=0){
  renderRestingDragon(canvas,buildExclusiveDragon(id),view);
}
