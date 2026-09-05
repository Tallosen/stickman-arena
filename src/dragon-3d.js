"use strict";
/* True three-dimensional polygon meshes, perspective projection, depth sorting and
   directional lighting. No CDN, sprite rotation or network requirement. */
const EXCLUSIVE_FAMILIES=[
  {name:"Виверн",body:[1.25,.65,.52],wings:1,legs:2,tail:2.5,horns:2},
  {name:"Лунный змей",body:[1.85,.38,.38],wings:0,legs:0,tail:3.2,horns:2},
  {name:"Бастион",body:[1.35,.83,.8],wings:1,legs:4,tail:1.8,horns:4},
  {name:"Серафим",body:[1.15,.5,.43],wings:3,legs:2,tail:2.2,horns:2},
  {name:"Гидра",body:[1.25,.58,.65],wings:1,legs:4,tail:2.2,horns:2,heads:3},
  {name:"Кристалликс",body:[1.05,.65,.52],wings:2,legs:4,tail:2.3,horns:5},
  {name:"Левиафан",body:[1.65,.5,.64],wings:0,legs:2,tail:3.1,horns:1},
  {name:"Феникс",body:[1.12,.6,.48],wings:1,legs:2,tail:2.8,horns:3},
  {name:"Ночной жнец",body:[1.3,.48,.4],wings:2,legs:4,tail:2.6,horns:4},
  {name:"Астральный страж",body:[1.08,.67,.62],wings:1,legs:4,tail:2,horns:3}
];
const EXCLUSIVE_EPITHETS=["Первого света","Звёздной бури","Тихого пламени","Северной короны","Вечной зари","Чёрного солнца","Лазурной бездны","Алого затмения","Серебряной кометы","Последней легенды"];
const exclusiveMeshCache=new Map();
function dragonHsl(h,s,l){
  h=((h%360)+360)%360/360;
  const a=s*Math.min(l,1-l),f=n=>{const k=(n+h*12)%12;return l-a*Math.max(-1,Math.min(k-3,9-k,1));};
  return [f(0)*255,f(8)*255,f(4)*255];
}
function exclusiveDragonSpec(id){
  const family=Math.floor(id/10),variant=id%10,f=EXCLUSIVE_FAMILIES[family];
  const hue=(family*31+variant*47+166)%360;
  return {...f,id,family,variant,name:f.name+" "+EXCLUSIVE_EPITHETS[variant],
    color:dragonHsl(hue,.56,.38+(variant%3)*.065),
    accent:dragonHsl(hue+65,.8,.73),wing:dragonHsl(hue+25,.51,.5),
    effect:["Искры","Орбитальные руны","Кристальная пыль","Северное сияние","Звёздный шлейф"][id%5]};
}
function dragonRgb(c,f=1){return `rgb(${c.map(v=>Math.max(0,Math.min(255,Math.round(v*f)))).join(",")})`;}
function buildExclusiveDragon(id){
  if(exclusiveMeshCache.has(id))return exclusiveMeshCache.get(id);
  const d=exclusiveDragonSpec(id),faces=[],v=d.variant;
  const tri=(a,b,c,col,tag=0,glow=false)=>faces.push({p:[a,b,c],col,tag,glow});
  function ell(c,r,col,tag=0,rings=5,sides=8){
    const p=(i,j)=>{const a=Math.PI*i/rings,b=j*Math.PI*2/sides;return [c[0]+Math.sin(a)*Math.cos(b)*r[0],c[1]+Math.cos(a)*r[1],c[2]+Math.sin(a)*Math.sin(b)*r[2]];};
    for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){
      if(i)tri(p(i,j),p(i+1,j),p(i,j+1),col,tag);
      if(i<rings-1)tri(p(i,j+1),p(i+1,j),p(i+1,j+1),col,tag);
    }
  }
  function rod(a,b,r1,r2,col,tag=0,sides=6,glow=false){
    const axis=b.map((n,i)=>n-a[i]),len=Math.hypot(...axis);if(len<.0001)return;
    const n=axis.map(x=>x/len),u=Math.abs(n[1])<.9?[n[2],0,-n[0]]:[0,-n[2],n[1]],ul=Math.hypot(...u);u.forEach((x,i)=>u[i]=x/ul);
    const w=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]];
    const p=(c,r,k)=>c.map((x,i)=>x+r*(u[i]*Math.cos(k*6.283/sides)+w[i]*Math.sin(k*6.283/sides)));
    for(let j=0;j<sides;j++){
      tri(p(a,r1,j),p(b,r2,j),p(a,r1,j+1),col,tag,glow);
      if(r2)tri(p(a,r1,j+1),p(b,r2,j),p(b,r2,j+1),col,tag,glow);
    }
  }
  const b=d.body,stretch=1+v*.026,by=1.4;
  ell([0,by,0],[b[0]*stretch,b[1],b[2]],d.color);
  ell([.45,by-.27,0],[b[0]*.67,b[1]*.66,b[2]*.92],d.accent);
  // Articulated curving tail: lengths and fin arrangements vary per individual.
  let prev=[-b[0]*.65,by,0];
  for(let i=1;i<=10;i++){
    const q=i/10,cur=[-b[0]*.65-q*d.tail*(1+v*.025),by-.45*q+Math.sin(q*4+v*.14)*q*.6,Math.sin(q*3+v*.22)*q*.66];
    rod(prev,cur,.37*(1-q)+.015,.33*(1-q)+.009,d.color);
    if(i%2===0)rod(cur,[cur[0]-.16,cur[1]+.35*(1-q)+.14,cur[2]],.15*(1-q)+.02,0,d.accent);
    prev=cur;
  }
  if([1,6,7,8].includes(d.family))for(let j=-2;j<=2;j++)rod(prev,[prev[0]-.55-Math.abs(j)*.08,prev[1]+.16,prev[2]+j*.19],.16,0,d.wing);
  const heads=d.heads||1;
  for(let h=0;h<heads;h++){
    const hz=(h-(heads-1)/2)*.75,hx=b[0]*.7+(h===1?.22:0),hy=2.05+(heads>1?Math.abs(h-1)*.25:0);
    rod([b[0]*.45,by,hz*.4],[hx,hy,hz],.37,.27,d.color);
    ell([hx+.32,hy+.17,hz],[.53+v*.012,.33,.31],d.color);
    ell([hx+.7,hy+.05,hz],[.4,.17,.24],d.color);
    rod([hx+.5,hy-.045,hz],[hx+1.01,hy-.045,hz],.1,.06,d.accent);
    for(const s of [-1,1]){
      ell([hx+.55,hy+.28,hz+s*.267],[.12,.085,.044],[15,20,30],0,3,6);
      ell([hx+.57,hy+.29,hz+s*.298],[.067,.05,.018],d.accent,0,3,6);
      for(let j=0;j<Math.ceil(d.horns/2);j++){
        const base=[hx+.13-j*.15,hy+.37,hz+s*(.18+j*.04)];
        rod(base,[base[0]-.27-v*.018,base[1]+.4+j*.15+v*.015,base[2]+s*.13],.105,0,d.accent);
      }
      // Visible teeth and side cheek plates anchor the head silhouette.
      for(let j=0;j<3;j++)rod([hx+.62+j*.12,hy-.04,hz+s*.19],[hx+.64+j*.12,hy-.15,hz+s*.17],.034,0,[239,237,213]);
    }
  }
  for(let j=0;j<d.legs;j++){
    const side=j%2?1:-1,front=j<2, lx=front?.7:-.7;
    const hip=[lx,by-.18,side*b[2]*.63],knee=[lx-.12,by-.64,side*(b[2]+.16)],foot=[lx+.24,.2,side*(b[2]+.27)];
    ell(knee,[.22,.28,.22],d.color,0,4,6);rod(hip,knee,.25,.18,d.color);rod(knee,foot,.15,.095,d.color);
    for(let c=-1;c<=1;c++)rod(foot,[foot[0]+.32,foot[1]-.06,foot[2]+c*.13],.065,0,d.accent);
  }
  // Wings are fully spatial membranes with ribs, not billboards. Tags animate hinges.
  for(let layer=0;layer<d.wings;layer++)for(const side of [-1,1]){
    const tag=side*(layer+1),wx=.05-layer*.42,wy=by+.28-layer*.1;
    const span=(2.4+v*.07)*(1-layer*.18),root=[wx,wy,side*.32];
    const elbow=[wx-.12,wy+.7,side*span*.51],tip=[wx+.12,wy+1.08-layer*.25,side*span];
    const fingers=[tip,[wx-.6,wy+.42,side*span*.91],[wx-1.22,wy+.04,side*span*.7],[wx-1.48,wy-.17,side*span*.4],[wx-.92,wy-.18,side*.4]];
    rod(root,elbow,.13,.075,d.color,tag);rod(elbow,tip,.075,.018,d.accent,tag);
    for(let k=0;k<fingers.length-1;k++){
      const mid=fingers[k].map((n,i)=>(n+fingers[k+1][i]+elbow[i])/3);
      mid[1]-=.12;
      tri(elbow,fingers[k],mid,k%2?d.wing:d.color,tag);
      tri(fingers[k],fingers[k+1],mid,d.wing,tag);tri(fingers[k+1],elbow,mid,d.wing,tag);
      rod(elbow,fingers[k],.042,.013,d.accent,tag);
    }
    if(d.family===3||d.family===7)for(let k=0;k<9;k++){
      const q=k/9,base=[wx-.2-q,wy+.65-q*.65,side*span*(.95-q*.52)];
      rod(base,[base[0]-.55,base[1]-.22,base[2]+side*.21],.13,0,k%2?d.accent:d.wing,tag,4);
    }
  }
  for(let j=0;j<5+v%4;j++){
    const x=-b[0]+j*b[0]*1.8/(5+v%4),size=.28+(v%3)*.07;
    rod([x,by+b[1]*.8,0],[x-.2,by+b[1]+size,0],.13,0,d.accent);
  }
  // Ten structural families have their own signature structures.
  if(d.family===2)for(const s of [-1,1])for(let j=0;j<5;j++)ell([-.85+j*.38,by+.22,s*b[2]*.77],[.29,.32,.16],j%2?d.accent:d.wing,0,3,5);
  if(d.family===5)for(let j=0;j<8;j++){
    const x=-1+j*.26;rod([x,by+.2,.25],[x-.28,by+1+(j%3)*.25,.4],.19,0,d.accent,0,4,true);
  }
  if(d.family===1||d.family===6)for(const s of [-1,1])for(let j=0;j<7;j++){
    const x=-1.3+j*.35;tri([x,by+.2,s*.25],[x-.4,by+.6,s*(.85+(j%3)*.16)],[x-.48,by-.1,s*.3],d.wing);
  }
  if(d.family===8)for(const s of [-1,1])rod([.2,by,s*.45],[-.8,by+.6,s*1.2],.18,0,d.accent);
  if(d.family===9)for(let j=0;j<8;j++){
    const a=j*Math.PI/4;ell([Math.cos(a)*1.2,by+1.25+Math.sin(a)*.4,Math.sin(a)*1.05],[.1,.17,.1],d.accent,0,3,5);
  }
  const mesh={d,faces};exclusiveMeshCache.set(id,mesh);
  if(exclusiveMeshCache.size>12)exclusiveMeshCache.delete(exclusiveMeshCache.keys().next().value);
  return mesh;
}
function renderExclusiveDragon(canvas,id,view,time=0){
  const {d,faces}=buildExclusiveDragon(id),g=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  g.clearRect(0,0,w,h);
  const glow=g.createRadialGradient(w*.5,h*.49,4,w*.5,h*.5,w*.58);
  glow.addColorStop(0,dragonRgb(d.color,.55));glow.addColorStop(1,"#080e1b");g.fillStyle=glow;g.fillRect(0,0,w,h);
  const yaw=view.yaw,pitch=view.pitch,cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
  const size=Math.min(w/9.2,h/6.5)*view.zoom;
  function project(p,tag=0){
    let [x,y,z]=p;
    if(tag){const side=Math.sign(tag),angle=Math.sin(time*1.7-Math.abs(tag)*.5)*.09*side;
      const yy=y-1.7,zz=z-side*.32;y=1.7+yy*Math.cos(angle)-zz*Math.sin(angle);z=side*.32+yy*Math.sin(angle)+zz*Math.cos(angle);}
    x+=.65;y-=1.2;
    const rx=x*cy+z*sy,rz=z*cy-x*sy,ry=y*cp-rz*sp,depth=rz*cp+y*sp;
    const k=10/(10-depth);
    return [w*.5+rx*size*k,h*.57-ry*size*k,depth,rx,ry];
  }
  // A turntable grid provides a stable depth cue while inspecting the mesh.
  g.strokeStyle="#ffffff13";g.lineWidth=1;
  for(let j=-4;j<=4;j++)for(const axis of [0,1]){
    const a=project(axis?[j,0,-4]:[-4,0,j]),b=project(axis?[j,0,4]:[4,0,j]);
    g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.stroke();
  }
  g.fillStyle="#00000048";g.beginPath();g.ellipse(w*.49,h*.76,size*2.4,size*.39,0,0,Math.PI*2);g.fill();
  const drawFaces=faces.map(f=>{const p=f.p.map(p=>project(p,f.tag));return {...f,p,z:(p[0][2]+p[1][2]+p[2][2])/3};}).sort((a,b)=>a.z-b.z);
  g.lineJoin="round";
  for(const f of drawFaces){
    const p=f.p,a=[p[1][3]-p[0][3],p[1][4]-p[0][4],p[1][2]-p[0][2]],b=[p[2][3]-p[0][3],p[2][4]-p[0][4],p[2][2]-p[0][2]];
    const n=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=Math.hypot(...n)||1;
    const light=f.glow?1.25:.52+.48*Math.abs((n[0]*-.35+n[1]*.7+n[2]*.6)/len);
    g.fillStyle=dragonRgb(f.col,light);g.strokeStyle=g.fillStyle;g.lineWidth=.45;
    g.beginPath();g.moveTo(p[0][0],p[0][1]);g.lineTo(p[1][0],p[1][1]);g.lineTo(p[2][0],p[2][1]);g.closePath();g.fill();g.stroke();
  }
  // Distinct restrained effect signatures, outside the face and body silhouette.
  g.fillStyle=dragonRgb(d.accent);g.strokeStyle=dragonRgb(d.accent);g.lineWidth=1.3;
  for(let i=0;i<18;i++){
    const a=i*2.4+time*.32,r=2.4+(i%4)*.16;
    const p=project([Math.cos(a)*r, .3+((i*.19+time*.14)%2.7),Math.sin(a)*r]);
    g.globalAlpha=.25+.3*Math.sin(i+time)**2;
    if(id%5===1){g.strokeRect(p[0]-3,p[1]-3,6,6);}else if(id%5===3){g.beginPath();g.moveTo(p[0],p[1]);g.lineTo(p[0]+7,p[1]-18);g.stroke();}
    else{g.beginPath();g.arc(p[0],p[1],id%5===2?2.4:1.5,0,7);g.fill();}
  }
  g.globalAlpha=1;
}
