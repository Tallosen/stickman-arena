"use strict";
// Paper display: existing collectible meshes, no cave, WebGL, residents or collisions.
function drawCollectionNest(g,w,h){
  g.fillStyle="#f5ecdd";g.fillRect(0,0,w,h);
  g.fillStyle="#e6d7b7";g.strokeStyle="#b8a17a";g.lineWidth=Math.max(1,w/400);
  g.beginPath();g.ellipse(w*.5,h*.79,w*.33,h*.09,0,0,Math.PI*2);g.fill();g.stroke();
  g.strokeStyle="#a68e64";
  for(let i=0;i<18;i++){const a=i*2.399,x=w*.5+Math.cos(a)*w*.29,y=h*.79+Math.sin(a)*h*.067;
    g.beginPath();g.moveTo(x-w*.027,y-h*.012);g.lineTo(x+w*.027,y+h*.008);g.stroke();}
  g.strokeStyle="#8d9c71";g.lineWidth=Math.max(1,w/270);
  for(const [x,y] of [[.13,.78],[.86,.81],[.79,.69]]){g.beginPath();g.moveTo(w*x,h*y);g.lineTo(w*(x-.012),h*(y-.03));g.moveTo(w*x,h*y);g.lineTo(w*(x+.015),h*(y-.04));g.stroke();}
}
const COLLECTION_IDLE_PERIOD=4.8;
function collectionMotion(d,time){
  const id=d.id||0,style=(d.family??Math.floor(id/3))%6,p=time/COLLECTION_IDLE_PERIOD*Math.PI*2+id*1.37;
  return {style,breath:Math.sin(p)*.018,tail:Math.sin(p)*(style===2?.28:.14),
    nod:Math.sin(p)*(style===0?.15:style===3?.1:.045),
    look:Math.sin(p)*(style===1?.2:.045),wing:Math.sin(p*2)*(style===4?.23:.085),
    stretch:(1-Math.cos(p))*.5*(style===5?.11:0),blink:Math.pow(Math.max(0,Math.sin(p+.8)),24)*.92,jaw:0};
}
const collectionRigCache=new WeakMap();
// One shared clock for the nose, ball and response; no timers or physics in idle cells.
function collectionToyPlay(t,duration=4.5){
 const u=Math.max(0,Math.min(1,t/duration)),smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
 const reach=smooth(u/.22)*(1-smooth((u-.72)/.18));
 const push=smooth((u-.22)/.14),returning=smooth((u-.52)/.24);
 const travel=.34*push*(1-returning),celebrate=Math.sin(Math.PI*smooth((u-.77)/.23));
 return {u,reach,travel,noseTravel:travel-.18*smooth((u-.36)/.10)*(1-smooth((u-.70)/.12)),spin:travel/.13,contact:u>=.22&&u<=.36,celebrate,
  phase:u<.22?'approach':u<.36?'push':u<.52?'watch':u<.76?'return':'happy'};
}
function collectionToyGeometry(center,spin=0){
 const faces=[],p=(i,j)=>{const a=i/6*Math.PI,b=j/10*Math.PI*2,x=Math.sin(a)*Math.cos(b)*.13,y=Math.cos(a)*.13,z=Math.sin(a)*Math.sin(b)*.13;
  return [center[0]+x*Math.cos(spin)+y*Math.sin(spin),center[1]+y*Math.cos(spin)-x*Math.sin(spin),center[2]+z];};
 for(let i=0;i<6;i++)for(let j=0;j<10;j++){
  const col=i===2||i===3?'#ecd3a0':'#c48362';
  if(i)faces.push({p:[p(i,j),p(i+1,j),p(i,j+1)],col});
  if(i<5)faces.push({p:[p(i,j+1),p(i+1,j),p(i+1,j+1)],col});
 }
 return faces;
}
function collectionRig(d){
  if(collectionRigCache.has(d))return collectionRigCache.get(d);
  const by=d.height||1.4,heads=Array.from({length:d.heads||1},(_,h)=>{
    const hz=(h-((d.heads||1)-1)/2)*.9,hx=d.body[0]*.7+(h===1?.22:0),hy=by+(d.neck??.65)+((d.heads||1)>1?Math.abs(h-1)*.25:0);
    const rest=p=>restingDragonPoint(p,d);
    return {root:rest([d.body[0]*.45,by,hz*.4]),neck:rest([hx,hy,hz]),jaw:rest([hx+.38,hy-.045,hz]),eyeY:rest([0,hy+(d.feature==="hammer"?.23:d.feature==="dragonfly"?.22:.28),0])[1],mouth:rest([hx+.7+.30*(d.headLength||1),hy-.09,hz])};
  });
  const head=Math.floor(heads.length/2),frame=heads[head],dx=frame.mouth[0]-frame.root[0],dy=frame.mouth[1]-frame.root[1],radius=Math.hypot(dx,dy);
  const rim=.22,mouthY=.30,pitch=Math.max(d.feature==="sword"?-.18:-.65,Math.asin(Math.max(-.95,Math.min(.95,(mouthY-frame.root[1])/radius)))-Math.atan2(dy,dx));
  const lower=mouthY-(frame.root[1]+dx*Math.sin(pitch)+dy*Math.cos(pitch));
  const food={head,pitch,lower,x:frame.root[0]+dx*Math.cos(pitch)-dy*Math.sin(pitch),z:frame.mouth[2],rim,r:.30,mouthY};
  const legs=Array.from({length:d.legs||0},(_,j)=>({hip:restingDragonPoint(dragonLegLayout(d,j).hip,d)}));
  const rig={heads,food,legs};collectionRigCache.set(d,rig);return rig;
}
function collectionAnimatedPoint(p,f,d,m){
  let [x,y,z]=p;const body=d.body,by=m.bodyY??restingDragonPoint([0,d.height||1.4,0],d)[1];
  // Weight at the floor stays zero: claws keep their world-space contact.
  const support=Math.min(1,Math.max(0,y/.55));
  if(f.part===2){
    const weight=Math.min(1,Math.hypot(x+body[0]*.65,y-by,z)/Math.max(.2,d.tail));
    z+=Math.sin(weight*2)*m.tail*weight;
  }
  if(f.part>=3&&f.part<=6){
    const rig=collectionRig(d),h=f.head||0,frame=rig.heads[h]||rig.heads[0],feed=h===rig.food.head?(m.feed||0):0;
    if(f.part===4){const [jx,jy]=frame.jaw,a=-(m.jaw||0),dx=x-jx,dy=y-jy;x=jx+dx*Math.cos(a)-dy*Math.sin(a);y=jy+dx*Math.sin(a)+dy*Math.cos(a);}
    if(f.part===5){
      if(f.eyeLayer){x+=(m.eyeLook||0)*.035;y+=(m.eyeNod||0)*.025;}
      y=frame.eyeY+(y-frame.eyeY)*Math.max(.08,1-(m.blink||0)+(m.eyeWide||0));
    }
    const [px,py,pz]=frame.root;
    let weight=1;
    if(f.part===6){const axis=frame.neck.map((v,i)=>v-frame.root[i]),length2=axis.reduce((n,v)=>n+v*v,0);weight=Math.max(0,Math.min(1,p.reduce((n,v,i)=>n+(v-frame.root[i])*axis[i],0)/length2));}
    const a=(m.nod*(1-feed)+rig.food.pitch*feed)*weight,dx=x-px,dy=y-py;
    x=px+dx*Math.cos(a)-dy*Math.sin(a);y=py+dx*Math.sin(a)+dy*Math.cos(a);
    const yaw=m.look*(1-feed)*weight,xx=x-px,zz=z-pz;x=px+xx*Math.cos(yaw)+zz*Math.sin(yaw);z=pz+zz*Math.cos(yaw)-xx*Math.sin(yaw);
    y+=rig.food.lower*feed*weight;
    if(h===rig.food.head&&m.toyReach){
      // Move the whole head assembly together; the neck blends to its fixed root.
      x+=(-.26+(m.toyTravel||0))*m.toyReach*weight;
      y-=.08*m.toyReach*weight;z+=.40*m.toyReach*weight;
    }
  }
  if(f.part===1&&f.tag){
    const side=Math.sign(f.tag),layer=Math.abs(f.tag)-1;
    const hinge=restingDragonPoint([.05-layer*.42,(d.height||1.4)+.28-layer*.1,side*.32],d,f.tag);
    const a=(m.wing+m.stretch)*side,dy=y-hinge[1],dz=z-hinge[2];
    y=hinge[1]+dy*Math.cos(a)-dz*Math.sin(a);z=hinge[2]+dy*Math.sin(a)+dz*Math.cos(a);
  }
  if(f.part>=10&&m.step){
    const side=f.part%2?1:-1,hip=collectionRig(d).legs[f.part-10]?.hip;
    const weight=hip?Math.max(0,Math.min(1,1-p[1]/Math.max(.01,hip[1])))**2:1-support;
    y+=Math.max(0,m.step*side)*weight;x+=m.step*side*.5*weight;
  }
  x+=(m.sway||0)*support;
  y+=(m.breath*by+m.stretch*.12)*support*(1-(m.feed||0));
  if(m.turn){const xx=x;x=xx*Math.cos(m.turn)+z*Math.sin(m.turn);z=z*Math.cos(m.turn)-xx*Math.sin(m.turn);}
  if(m.squash){y*=1+m.squash;x*=1-m.squash*.25;z*=1-m.squash*.25;}
  y+=m.hop||0;
  return [x,Math.max(0,y),z];
}
function collectionCamera(rest,view,w,h){
  // Lens and world geometry are fixed. Only the camera's eye moves when dollying.
  return dragonOrbitCamera(rest,{yaw:view.yaw,pitch:view.pitch,distance:Math.max(.62,Math.min(2.5,view.distance??1))},w,h);
}
function collectionHabitat(d={},personality=null){
  const feature=d.feature,variant=personality?.habitat??0;
  if(["flippers","seahorse","tentacles","gills","sword","manta","hydra"].includes(feature))return "water";
  if(["cobra","scorpion","sail","frill"].includes(feature))return "sand";
  if(feature==="phoenix")return "ember";
  if(feature==="crystal")return "snow";
  if(["antlers","mantis","beetle","mushroom","dragonfly","shell"].includes(feature))return "forest";
  if(["orbit","skeleton"].includes(feature))return "moon";
  return ["meadow","blossom","forest","forest","snow","blossom","sand","meadow","forest","meadow","water","moon"][variant%12];
}
const COLLECTION_BIOMES={
 meadow:{name:"Цветочный сад",bg:"#f5efdf",soil:"#ae966d",ground:"#bdd098",top:"#d2dea9",leaf:"#8caa65"},
 forest:{name:"Лесное убежище",bg:"#eef0e2",soil:"#98866b",ground:"#a2b77d",top:"#bbc995",leaf:"#6b925b"},
 blossom:{name:"Сад цветущих деревьев",bg:"#f8ece6",soil:"#b6957c",ground:"#c1cba0",top:"#e0dbb4",leaf:"#dba0b0"},
 water:{name:"Лагуна",bg:"#edf4ed",soil:"#bba57e",ground:"#e5d3a6",top:"#8dc9c2",leaf:"#79a284"},
 sand:{name:"Песчаный оазис",bg:"#f7efdf",soil:"#bd9869",ground:"#e8cc91",top:"#f1dcab",leaf:"#8da568"},
 snow:{name:"Снежная роща",bg:"#eef3f6",soil:"#99aeb9",ground:"#cfdee1",top:"#edf2ec",leaf:"#91b2b3"},
 ember:{name:"Тёплый вулканический сад",bg:"#f4eae1",soil:"#847c78",ground:"#b6a292",top:"#d0b99c",leaf:"#bb8661"},
 moon:{name:"Лунная поляна",bg:"#efedf4",soil:"#9c98ab",ground:"#c3bcd4",top:"#ded9e5",leaf:"#a7a2c2"}
};
function collectionPetClearance(rest){
 if(rest.petClearance!==undefined)return rest.petClearance;
 const d=rest.spec,rig=collectionRig(d);let radius=0;
 for(const f of rest.faces)for(const p of f.p){
  let reach=Math.hypot(p[0],p[2]);
  if(f.part===1&&f.tag){
   const side=Math.sign(f.tag),layer=Math.abs(f.tag)-1;
   const hinge=restingDragonPoint([.05-layer*.42,(d.height||1.4)+.28-layer*.1,side*.32],d,f.tag);
   reach=Math.hypot(p[0],Math.abs(hinge[2])+Math.hypot(p[1]-hinge[1],p[2]-hinge[2]));
  }else if(f.part>=3&&f.part<=6){
   const h=rig.heads[f.head||0]||rig.heads[0],delta=p.map((v,i)=>v-h.root[i]);
   const arm=f.part===4?Math.hypot(...h.jaw.map((v,i)=>v-h.root[i]))+Math.hypot(...p.map((v,i)=>v-h.jaw[i])):Math.hypot(...delta);
   reach=Math.hypot(h.root[0],h.root[2])+arm+.55;
  }else if(f.part===2){
   const by=restingDragonPoint([0,d.height||1.4,0],d)[1],weight=Math.min(1,Math.hypot(p[0]+d.body[0]*.65,p[1]-by,p[2])/Math.max(.2,d.tail));
   reach=Math.hypot(p[0],Math.abs(p[2])+Math.abs(Math.sin(weight*2))*2*weight);
  }else if(f.part>=10)reach+=.18;
  radius=Math.max(radius,reach);
 }
 // Full yaw does not change radial reach. Bound sway and horizontal squash too.
 return rest.petClearance=(radius+.30)*1.14+.08;
}
function buildCollectionHabitat(rest,personality=null){
  const biome=collectionHabitat(rest.spec,personality),variant=personality?.flair??0,key=biome+":"+variant;
  if(rest.habitatScene?.key===key)return rest.habitatScene;
  const food=collectionRig(rest.spec).food;
  const theme=COLLECTION_BIOMES[biome],faces=[],props=[],solidGroups=[],radius=Math.max(2,rest.radius*.92,Math.hypot(food.x-rest.target[0],food.z/.72)+food.r*1.3),rz=radius*.72,cx=rest.target[0];
  const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  let object=null;
  const objects=['nest','toy'];
  function face(p,color,lights=null){faces.push({p,rgb:rgb(color),col:color,lights,object});}
  const at=(x,y,z)=>[cx+x*radius,y*radius,z*rz];
  function patch(x,z,rx,ry,color,y=.005){
    const center=at(x,y,z),ring=Array.from({length:36},(_,i)=>{const a=i/36*Math.PI*2;return at(x+Math.cos(a)*rx,y,z+Math.sin(a)*ry);});
    for(let i=0;i<ring.length;i++)face([center,ring[i],ring[(i+1)%ring.length]],color);
  }
  function ell(x,y,z,rx,ry,rzLocal,color,rings=4,sides=8){
    const p=(i,j)=>{const a=i/rings*Math.PI,b=j/sides*Math.PI*2;return at(x+Math.sin(a)*Math.cos(b)*rx,y+Math.cos(a)*ry,z+Math.sin(a)*Math.sin(b)*rzLocal);};
    const light=(i,j)=>{const a=i/rings*Math.PI,b=j/sides*Math.PI*2;return .78+.24*Math.max(0,Math.sin(a)*Math.cos(b)*-.35+Math.cos(a)*.82+Math.sin(a)*Math.sin(b)*.4);};
    for(let i=0;i<rings;i++)for(let j=0;j<sides;j++){
      if(i)face([p(i,j),p(i+1,j),p(i,j+1)],color,[light(i,j),light(i+1,j),light(i,j+1)]);
      if(i<rings-1)face([p(i,j+1),p(i+1,j),p(i+1,j+1)],color,[light(i,j+1),light(i+1,j),light(i+1,j+1)]);
    }
  }
  function trunk(x,z,height,width,color){
    const n=8;
    for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;
      face([at(x+Math.cos(a)*width,0,z+Math.sin(a)*width),at(x+Math.cos(b)*width,0,z+Math.sin(b)*width),at(x+Math.cos(b)*width*.72,height,z+Math.sin(b)*width*.72),at(x+Math.cos(a)*width*.72,height,z+Math.sin(a)*width*.72)],color);
    }
  }
  function shadow(x,z,r){patch(x,z,r,r*.75,"#9eaa85",.009);}
  function tree(x,z,scale=1){
    const start=faces.length;
    object='tree';if(!objects.includes('tree'))objects.push('tree');
    props.push({kind:"tree",x,z,r:.2*scale});shadow(x,z,.19*scale);
    trunk(x,z,.28*scale,.034*scale,"#9e7c56");
    ell(x,.38*scale,z,.19*scale,.2*scale,.19*scale,theme.leaf);
    ell(x-.11*scale,.3*scale,z+.025,.13*scale,.13*scale,.13*scale,biome==="blossom"?"#edb9c5":biome==="snow"?"#d9e7e2":"#acc487");
    ell(x+.07*scale,.44*scale,z-.025,.115*scale,.12*scale,.12*scale,biome==="blossom"?"#f1ced3":biome==="snow"?"#edf3eb":"#bfd099");
    solidGroups.push({start,end:faces.length,prop:props[props.length-1],x:cx+x*radius,z:z*rz});
    object=null;
  }
  function rock(x,z,s=.1,color="#b3b6a5"){
    props.push({kind:"rock",x,z,r:s});ell(x,s*.47,z,s,s*.5,s*.75,color);
  }
  function flower(x,z,color){
    props.push({kind:"flower",x,z,r:.055});
    trunk(x,z,.085,.008,"#879c67");
    for(let i=0;i<5;i++){const a=i/5*Math.PI*2;ell(x+Math.cos(a)*.026,.085+Math.sin(a)*.024,z,.021,.019,.014,color,3,6);}
    ell(x,.089,z+.012,.015,.015,.012,"#ebc677",3,6);
    ell(x-.018,.035,z,.023,.012,.035,theme.leaf,3,6);
  }
  function mushroom(x,z,s=1){
    props.push({kind:"mushroom",x,z,r:.075*s});
    trunk(x,z,.07*s,.02*s,"#e7d4b2");ell(x,.092*s,z,.075*s,.038*s,.072*s,biome==="moon"?"#aca2ca":"#c78c78");
    ell(x-.025*s,.124*s,z+.006,.013*s,.006*s,.012*s,"#f9ead3",3,6);
  }
  function cactus(x,z){
    const start=faces.length;
    props.push({kind:"cactus",x,z,r:.14});
    ell(x,.14,z,.055,.16,.06,"#9caf76");
    ell(x-.075,.10,z,.08,.038,.034,"#90a568");
    ell(x-.12,.155,z,.035,.08,.035,"#a1b67f");
    ell(x+.08,.18,z,.07,.032,.032,"#90a568");
    ell(x+.12,.23,z,.03,.075,.03,"#afbc84");
    ell(x,.31,z,.032,.019,.03,"#dfb2a6",3,6);
    solidGroups.push({start,end:faces.length,prop:props[props.length-1],x:cx+x*radius,z:z*rz});
  }
  // Everything is rooted within the island. Keep the center open for the dragon.
  const edge=Array.from({length:48},(_,i)=>{const a=i/48*Math.PI*2,k=1+Math.sin(a*5)*.025+Math.cos(a*7)*.016;return at(Math.cos(a)*k,0,Math.sin(a)*k);});
  for(let i=0;i<48;i++){const a=edge[i],b=edge[(i+1)%48];
    face([at(0,0,0),a,b],theme.ground);
    face([a,b,[b[0],-radius*.09,b[2]],[a[0],-radius*.09,a[2]]],theme.soil);
  }
  patch(0,0,.92,.91,theme.top,.002);
  if(biome==="water"){
    object='water';objects.push('water');
    patch(-.07,0,.83,.82,"#79bbb9",.004);patch(-.14,-.06,.7,.7,"#91cec7",.006);
    // Short ripple arcs follow the water plane, not floating diamonds.
    for(const [x,z] of [[-.55,.1],[.34,.47],[-.12,-.56]]){
      const pts=Array.from({length:14},(_,i)=>{const a=.3+i/13*1.5;return at(x+Math.cos(a)*.16,.008,z+Math.sin(a)*.07);});
      for(let i=0;i<13;i++)face([pts[i],pts[i+1],[pts[i+1][0],pts[i+1][1],pts[i+1][2]+radius*.004],[pts[i][0],pts[i][1],pts[i][2]+radius*.004]],"#d9efe2");
    }
    object=null;
    for(const [x,z] of [[-.62,-.46],[.7,.18],[.54,-.55]])rock(x,z,.10,"#c3c8b0");
    for(const x of [-.60,-.55,-.50]){trunk(x,-.64,.16+(x+.6),.008,"#92a675");ell(x,.18+(x+.6),-.64,.014,.04,.012,"#b69e74",3,6);}
    patch(.42,.59,.13,.11,"#85af7d",.011);flower(.43,.59,"#e9bdc4");
    // A little shell sits on the sandy bank.
    props.push({kind:"shell",x:.78,z:-.25,r:.06});ell(.78,.035,-.25,.063,.035,.052,"#eed4bd");
  }else if(biome==="sand"){
    ell(-.56,-.018,-.46,.26,.09,.24,"#eed9a9");
    ell(.42,-.03,.47,.32,.09,.23,"#e5c88d");
    cactus(-.68,.26);cactus(.62,-.40);
    rock(-.64,.38,.10,"#d4b180");rock(.75,.22,.07,"#d8ba90");
    for(let i=0;i<5;i++)patch(-.29+i*.1,.68-Math.sin(i)*.025,.018,.027,"#ceb282",.007);
  }else if(biome==="snow"){
    tree(-.66,.29,.9);tree(.57,-.53,.64);
    for(const [x,z,s] of [[-.62,.34,.15],[.63,.31,.13],[.15,-.77,.08]])rock(x,z,s,"#edf2ec");
    props.push({kind:"snowfriend",x:.72,z:-.12,r:.08});ell(.72,.065,-.12,.065,.07,.06,"#f9f7ef");ell(.72,.155,-.12,.047,.049,.047,"#f9f7ef");
    ell(.75,.165,-.085,.008,.008,.008,"#7e898c",3,6);
  }else if(biome==="ember"){
    patch(-.60,-.33,.17,.22,"#ce8b60",.006);patch(-.60,-.33,.10,.15,"#edba77",.008);
    for(const [x,z] of [[-.73,-.12],[.65,-.45],[.66,.29]])rock(x,z,.11,"#928b86");
    tree(-.55,.43,.54);mushroom(.20,-.75,.7);
  }else{
    tree(-.66,.29,.94);if(biome!=="meadow")tree(.53,-.55,.64);
    patch(.60,.22,.20,.26,biome==="moon"?"#c7bed8":"#b0c08f",.006);
    mushroom(.64,.24,1);mushroom(.74,.1,.65);
    for(const [x,z] of [[-.34,.69],[-.19,.75],[.35,.65]])flower(x,z,biome==="moon"?"#c1afd8":biome==="blossom"?"#e5adbb":"#dfc391");
    rock(-.17,-.78,.09,biome==="moon"?"#c5c5d3":"#b3b6a5");
  }
  // Small woven sleeping nest, placed on the bank instead of a cluttered scatter.
  const nx=-cx/radius,nz=0,nrx=rest.spec.body[0]*1.1/radius,nrz=rest.spec.body[2]*1.65/rz;
  object='nest';props.push({kind:'nest',x:nx,z:nz,r:Math.max(nrx,nrz)});
  patch(nx,nz,nrx,nrz,biome==='water'?'#91b393':'#b79d75',.01);patch(nx,nz,nrx*.91,nrz*.86,biome==='water'?'#acc6a1':'#d7c498',.012);
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2;ell(nx+Math.cos(a)*nrx*.96,.022,Math.sin(a)*nrz*.93,.035,.012,.022,biome==='water'?'#94af7c':'#c6af82',3,6);}
  const toy=[food.x-.16,.13,food.z+.40];object='toy';props.push({kind:'toy',x:(toy[0]-cx)/radius,z:toy[2]/rz,r:.13/radius});
  for(const f of collectionToyGeometry(toy))faces.push({...f,object:'toy',rgb:rgb(f.col)});
  object=null;
  // The island is a fixed oval. Scenery must fit it; never pull the ground toward a prop.
  const clearance=collectionPetClearance(rest),placed=[];
  for(const group of solidGroups){
    const originalX=group.x,originalZ=group.z,scale=.65;let footprint=0;
    const points=new Set(faces.slice(group.start,group.end).flatMap(f=>f.p));
    for(const p of points){
      p[0]=originalX+(p[0]-originalX)*scale;p[1]*=scale;p[2]=originalZ+(p[2]-originalZ)*scale;
      footprint=Math.max(footprint,Math.hypot(p[0]-originalX,p[2]-originalZ));
    }
    const angle=Math.atan2(originalZ/rz,(originalX-cx)/radius),edgeRoom=.92-footprint/Math.min(radius,rz);
    let location=null;
    for(let i=0;i<48&&edgeRoom>0;i++){
      const a=angle+(i%2?1:-1)*Math.ceil(i/2)*Math.PI/24;
      const x=cx+Math.cos(a)*radius*edgeRoom,z=Math.sin(a)*rz*edgeRoom;
      if(Math.hypot(x,z)-footprint<clearance+.10)continue;
      if(placed.some(other=>Math.hypot(x-other.x,z-other.z)<footprint+other.footprint+.10))continue;
      location={x,z};break;
    }
    if(location){
      group.x=location.x;group.z=location.z;group.footprint=footprint;
      for(const p of points){p[0]+=group.x-originalX;p[2]+=group.z-originalZ;}
      group.replacement=faces.slice(group.start,group.end);group.groundcover=false;placed.push(group);
    }else{
      // A carpet of leaves and stemless flowers is safe to step over. No trunk or canopy
      // is left in the pet's swept volume, and the established leaf interaction remains.
      const start=faces.length,x=(originalX-cx)/radius,z=originalZ/rz;
      object=group.prop.kind==='tree'?'tree':null;
      patch(x,z,.16,.12,biome==='moon'?'#b9adcd':biome==='sand'?'#d9bd86':'#a7bb87',.004/radius);
      for(let i=0;i<5;i++){
        const a=i*2.399+variant*.3,lx=x+Math.cos(a)*.095,lz=z+Math.sin(a)*.065;
        ell(lx,.012/radius,lz,.052,.008/radius,.032,theme.leaf,2,6);
        if(i%2===0){
          const color=biome==='moon'?'#d1bedf':biome==='snow'?'#faf5e8':biome==='sand'?'#e2b3a3':'#ecc5af';
          for(let j=0;j<5;j++){const b=j/5*Math.PI*2;ell(lx+Math.cos(b)*.023,.021/radius,lz+Math.sin(b)*.023,.019,.005/radius,.019,color,2,6);}
          ell(lx,.024/radius,lz,.012,.004/radius,.012,'#eac373',2,6);
        }
      }
      group.replacement=faces.splice(start);group.groundcover=true;group.prop.groundcover=true;
      group.footprint=Math.max(...group.replacement.flatMap(f=>f.p.map(p=>Math.hypot(p[0]-group.x,p[2]-group.z))));
      object=null;
    }
    group.prop.top=Math.max(...group.replacement.flatMap(f=>f.p.map(p=>p[1])));
    group.prop.x=(group.x-cx)/radius;group.prop.z=group.z/rz;group.prop.r=group.footprint/Math.min(radius,rz);
  }
  const rebuilt=[];let cursor=0;
  for(const group of solidGroups){
    rebuilt.push(...faces.slice(cursor,group.start));cursor=group.end;
    group.start=rebuilt.length;rebuilt.push(...group.replacement);group.end=rebuilt.length;delete group.replacement;
  }
  rebuilt.push(...faces.slice(cursor));
  return rest.habitatScene={key,biome,theme,faces:rebuilt,props,objects,toy,radius,rz,cx,clearance,solidGroups};
}
function drawCollectionWorld(g,w,h,rest,camera,personality=null,care=null){
  const scene=buildCollectionHabitat(rest,personality);
  g.fillStyle=scene.theme.bg;g.fillRect(0,0,w,h);
  const queue=[];
  for(const f of scene.faces){
    if(f.object==='toy'&&care?.activity==='play')continue;
    const raw=f.p.map(camera.toCamera),clipped=raw.every(p=>p[2]>=.15)?raw:clipDragonNear(raw);if(clipped.length<3)continue;
    queue.push({zone:f.object?'object:'+f.object:null,points:clipped.map(camera.project),depths:clipped.map(p=>1/p[2]),z:clipped.reduce((s,p)=>s+p[2],0)/clipped.length,rgb:f.rgb,col:f.col,lights:clipped===raw?f.lights:null});
  }
  const raster=collectionRaster(g,w,h);if(!raster)queue.sort((a,b)=>b.z-a.z);
  for(const f of queue)paintCollectionFace(g,f,raster);
  if(raster)g.putImageData(raster.image,0,0);
  if(raster)raster.pickFaces=queue;
  return raster;
}
const collectionPickShapes=new WeakMap();
const collectionObjectShapes=new WeakMap();
function collectionHitDragon(canvas,x,y){
 return collectionDragonTouchZone(canvas,x,y)!==null;
}
function collectionDragonTouchZone(canvas,x,y){
 const shapes=collectionPickShapes.get(canvas)||[];
 if(x<0||y<0||x>=canvas.width||y>=canvas.height)return null;
 const zone=collectionPickSurface(shapes,x,y,shapes.environment?.[Math.floor(y)*canvas.width+Math.floor(x)]||0);
 return ['head','belly','tail'].includes(zone)?zone:null;
}
function collectionIslandObjectAt(canvas,x,y){
 if(x<0||y<0||x>=canvas.width||y>=canvas.height)return null;
 const zone=collectionPickSurface([...(collectionObjectShapes.get(canvas)||[]),...(collectionPickShapes.get(canvas)||[])],x,y,0);
 return zone?.startsWith('object:')?zone.slice(7):null;
}
function collectionInspectionTarget(canvas,x,y){
 if(x<0||y<0||x>=canvas.width||y>=canvas.height)return null;
 return collectionPickSurface([...(collectionObjectShapes.get(canvas)||[]),...(collectionPickShapes.get(canvas)||[])],x,y,0);
}
function collectionPickSurface(shapes,x,y,baseline=0){
 let closest=baseline,zone=null;
 for(const f of shapes)for(let i=1;i<f.points.length-1;i++){
  const ids=[0,i,i+1],[a,b,c]=ids.map(i=>f.points[i]),area=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(area)<1e-8)continue;
  const u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/area,v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/area,w=1-u-v;
  if(u<0||v<0||w<0)continue;
  const depth=u*f.depths[ids[0]]+v*f.depths[ids[1]]+w*f.depths[ids[2]];
  if(depth>closest+1e-7){closest=depth;zone=f.zone||null;}
 }
 return zone;
}
function applyCollectionAttention(m,camera,gaze){
 if(!gaze)return m;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),angle=clamp(Math.atan2(-camera.eye[2],camera.eye[0]-camera.target[0])+gaze.x*.35,-.48,.48);
 return {...m,look:m.look+angle*gaze.headStrength,nod:m.nod+clamp(-gaze.y*.18,-.18,.18)*gaze.headStrength,
  eyeLook:clamp(gaze.x,-1,1)*gaze.eyeStrength,eyeNod:clamp(-gaze.y,-1,1)*gaze.eyeStrength};
}
function collectionFoodBowl(queue,camera,rest,care){
 if(care?.kind!=="feed")return;
 const food=collectionRig(rest.spec).food,{x,z,r,rim:y}=food;
 const ring=(radius,height)=>Array.from({length:20},(_,i)=>{const a=i/20*Math.PI*2;return [x+Math.cos(a)*radius,height,z+Math.sin(a)*radius];});
 const add=(p,col)=>{const c=clipDragonNear(p.map(camera.toCamera));if(c.length>2)queue.push({points:c.map(camera.project),depths:c.map(p=>1/p[2]),z:c.reduce((s,p)=>s+p[2],0)/c.length,col});};
 const top=ring(r,y),bottom=ring(r*.76,.025),inner=ring(r*.80,y),well=ring(r*.55,.07);
 add(ring(r*1.07,.012),"#8f7f6033");
 for(let i=0;i<20;i++){
  const j=(i+1)%20;
  add([bottom[i],bottom[j],top[j],top[i]],i<10?"#c38b66":"#d7a582");
  add([top[i],top[j],inner[j],inner[i]],"#edd0a4");
  add([inner[i],inner[j],well[j],well[i]],"#a27250");
 }
 add(well,"#a97852");
 const portions=collectionMealState(care.t,care.duration).portions;
 for(let i=0;i<portions;i++){
  const a=i*2.399,xx=x+Math.cos(a)*r*.36,zz=z+Math.sin(a)*r*.36,col=i%2?"#9fae6c":"#d48965",s=.065;
  const point=(u,v)=>[xx+Math.sin(u)*Math.cos(v)*s,.16+Math.cos(u)*s,zz+Math.sin(u)*Math.sin(v)*s];
  for(let row=0;row<3;row++)for(let j=0;j<6;j++){const u=row*Math.PI/3,uu=(row+1)*Math.PI/3,v=j*Math.PI/3,vv=(j+1)*Math.PI/3;add([point(u,v),point(uu,v),point(uu,vv),point(u,vv)],col);}
 }
}
function collectionLifeObjects(queue,camera,rest,care,motion){
 if(care?.kind!=='activity')return;
 const scene=buildCollectionHabitat(rest,dragonPersonality(care.id)),rig=collectionRig(rest.spec),t=care.t;
 const mouth=collectionAnimatedPoint(rig.heads[rig.food.head].mouth,{part:3,head:rig.food.head},rest.spec,motion);
 const add=(points,col,zone=null)=>{const p=clipDragonNear(points.map(camera.toCamera));if(p.length>=3)queue.push({zone,points:p.map(camera.project),depths:p.map(v=>1/v[2]),z:p.reduce((s,v)=>s+v[2],0)/p.length,col});};
 const ball=(c,r,col,zone=null)=>{
  const p=(i,j)=>{const a=i/4*Math.PI,b=j/8*Math.PI*2;return [c[0]+Math.sin(a)*Math.cos(b)*r,c[1]+Math.cos(a)*r,c[2]+Math.sin(a)*Math.sin(b)*r];};
  for(let i=0;i<4;i++)for(let j=0;j<8;j++){if(i)add([p(i,j),p(i+1,j),p(i,j+1)],col,zone);if(i<3)add([p(i,j+1),p(i+1,j),p(i+1,j+1)],col,zone);}
 };
 if(care.activity==='play'){
  const play=collectionToyPlay(t,care.duration),c=[scene.toy[0]+play.travel,.13,scene.toy[2]];
  for(const f of collectionToyGeometry(c,play.spin))add(f.p,f.col,'object:toy');
 }
 if(care.activity==='splash'||scene.biome==='water'&&care.activity==='sniff'){
  for(let i=0;i<5;i++){const phase=(t*.8+i*.2)%1,a=i*2.399,c=care.activity==='splash'?[Math.cos(a)*rest.spec.body[0]*.65,.06+Math.sin(phase*Math.PI)*.45,(i%2?1:-1)*(rest.spec.body[2]+.15+phase*.35)]:[mouth[0]+.1+phase*.25,mouth[1]+phase*.6,mouth[2]+Math.sin(a)*.15];ball(c,.045+(1-phase)*.03,'#b6e2df');}
 }
 if(care.activity==='sniff'&&scene.biome!=='water'){
  if(['ember','sand','snow'].includes(scene.biome)){
   if(t>1&&t<2.3)for(let i=0;i<4;i++){const q=(t-1)/1.3;ball([mouth[0]+q*.6,mouth[1]+.1+q*.35,mouth[2]+Math.sin(i*2.4)*q*.3],.028,scene.biome==='snow'?'#e8f3ed':scene.biome==='sand'?'#d6bb88':'#edc079');}
  }else{
   const tree=scene.props.find(p=>p.kind==='tree'),origin=tree?[scene.cx+tree.x*scene.radius,tree.top??scene.radius*.4,tree.z*scene.rz]:[mouth[0]+.6,mouth[1]+.6,mouth[2]+.5];
   const q=Math.max(0,Math.min(1,t/.9,(care.duration-t)/.8)),c=origin.map((v,i)=>v+([mouth[0]+.18,mouth[1]+.12,mouth[2]][i]-v)*q),s=.12;
   add([[c[0]-s,c[1],c[2]],[c[0],c[1]+Math.sin(t*6)*.035,c[2]+s*.5],[c[0]+s,c[1],c[2]]],'#91ac70');
   add([[c[0]-s,c[1],c[2]],[c[0]+s,c[1],c[2]],[c[0],c[1]-.025,c[2]-s*.5]],'#bfd092');
  }
 }
}
function collectionTopology(rest){
  if(rest.collectionTopology)return rest.collectionTopology;
  const vertices=[],map=new Map(),faces=[];
  for(const f of rest.faces){
    const indices=f.p.map(p=>{const key=(f.surface||"flat"+faces.length)+":"+f.part+":"+(f.head||0)+":"+(f.tag||0)+":"+p.map(n=>Math.round(n*100000)).join(",");if(map.has(key))return map.get(key);const i=vertices.length;vertices.push({p,part:f.part,head:f.head||0,eyeLayer:f.eyeLayer||0,tag:f.tag,normal:[0,0,0]});map.set(key,i);return i;});
    const [p,a,b]=f.p,u=a.map((v,i)=>v-p[i]),v=b.map((v,i)=>v-p[i]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    for(const i of indices)for(let k=0;k<3;k++)vertices[i].normal[k]+=n[k];
    faces.push({indices,zone:f.part===2?'tail':f.part>=3&&f.part<=6?'head':'belly',rgb:f.col,glow:f.glow,light:dragonRgb(f.col,f.glow?1.04:1),shade:dragonRgb(f.col,f.glow?1.04:.91)});
  }
  for(const v of vertices){const n=v.normal,len=Math.hypot(...n)||1;v.light=.73+.29*Math.abs((n[0]*-.36+n[1]*.82+n[2]*.44)/len);}
  return rest.collectionTopology={vertices,faces};
}
function drawCollectionDragon(canvas,id,view={yaw:.85,pitch:.35,distance:1},time=0,care=null,transparent=false,defer=false,environmentDepth=null){
  const g=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
  const mesh=homeDragonDisplayMesh(id),rest=prepareRestingDragon(mesh),camera=collectionCamera(rest,view,w,h);
  let environment=null;
  if(transparent)g.clearRect(0,0,w,h);else environment=drawCollectionWorld(g,w,h,rest,camera,typeof dragonPersonality==="function"?dragonPersonality(id):null,care);
  const queue=[],idle=collectionMotion(mesh.d,time),motion=care?applyCollectionCare(idle,care):applyCollectionAttention(idle,camera,view.gaze);
  if(care?.activity==='ask'){
    const strength=Math.max(0,Math.min(1,care.t/.8,(care.duration-care.t)/.8));
    Object.assign(motion,applyCollectionAttention(motion,camera,{x:0,y:-.2,eyeStrength:strength,headStrength:strength*.75}));
  }
  motion.bodyY=restingDragonPoint([0,mesh.d.height||1.4,0],mesh.d)[1];
  const topology=collectionTopology(rest),world=topology.vertices.map(v=>collectionAnimatedPoint(v.p,v,mesh.d,motion)),projected=world.map(camera.toCamera);
  for(const f of topology.faces){
    const raw=f.indices.map(i=>projected[i]);
    const clipped=raw.every(p=>p[2]>=.15)?raw:clipDragonNear(raw);if(clipped.length<3)continue;
    const lights=f.indices.map(i=>f.glow?1.04:topology.vertices[i].light);
    queue.push({zone:f.zone,points:clipped.map(camera.project),depths:clipped.map(p=>1/p[2]),lights:clipped===raw?lights:clipped.map(()=>lights.reduce((a,b)=>a+b,0)/3),rgb:f.rgb,z:clipped.reduce((s,p)=>s+p[2],0)/clipped.length,col:f.light});
  }
  collectionFoodBowl(queue,camera,rest,care);
  if(typeof collectionLifeObjects==='function')collectionLifeObjects(queue,camera,rest,care,motion);
  if(!defer){const picks=queue.slice();picks.environment=environment?.depth;collectionPickShapes.set(canvas,picks);collectionObjectShapes.set(canvas,environment?.pickFaces||[]);}
  const raster=collectionRaster(g,w,h);
  if(raster&&(environment?.depth||environmentDepth))raster.depth.set(environment?.depth||environmentDepth);
  if(!raster||care?.kind==="feed")queue.sort((a,b)=>b.z-a.z);
  if(defer)return {g,queue,index:0,raster};
  for(const f of queue)paintCollectionFace(g,f,raster);
  if(raster)g.putImageData(raster.image,0,0);
  if(care)drawCollectionCare(g,w,h,care);
}
function collectionRaster(g,w,h){
  // One depth sample per output pixel. Reuse the current background, no triangle-edge alpha gaps.
  const image=g.getImageData?.(0,0,w,h);
  return image?.data?{image,depth:new Float32Array(w*h),w,h}:null;
}
function paintCollectionFace(g,f,r){
  if(!r){g.beginPath();f.points.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.closePath();g.fillStyle=f.col;g.fill();return;}
  let rgb=f.rgb,alpha=1;
  if(!rgb){const s=f.col;if(s[0]==="#"){rgb=[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));if(s.length===9)alpha=parseInt(s.slice(7,9),16)/255;}else rgb=[180,150,110];}
  const {w,h,depth,image}=r,data=image.data;
  for(let k=1;k<f.points.length-1;k++){
    const ids=[0,k,k+1],[a,b,c]=ids.map(i=>f.points[i]);
    const area=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(area)<1e-7)continue;
    const x0=Math.max(0,Math.ceil(Math.min(a[0],b[0],c[0])-.5)),x1=Math.min(w-1,Math.floor(Math.max(a[0],b[0],c[0])-.5));
    const y0=Math.max(0,Math.ceil(Math.min(a[1],b[1],c[1])-.5)),y1=Math.min(h-1,Math.floor(Math.max(a[1],b[1],c[1])-.5));
    const dz=ids.map(i=>f.depths?.[i]??1/f.z),light=ids.map(i=>f.lights?.[i]??1);
    const ax=(b[1]-c[1])/area,ay=(c[0]-b[0])/area,bx=(c[1]-a[1])/area,by=(a[0]-c[0])/area;
    for(let y=y0;y<=y1;y++){
      let u=ax*(x0+.5-c[0])+ay*(y+.5-c[1]),v=bx*(x0+.5-c[0])+by*(y+.5-c[1]);
      for(let x=x0;x<=x1;x++,u+=ax,v+=bx){
        const t=1-u-v;if(u< -1e-6||v< -1e-6||t< -1e-6)continue;
        const z=u*dz[0]+v*dz[1]+t*dz[2],i=y*w+x;if(z<=depth[i])continue;
        const l=(u*light[0]*dz[0]+v*light[1]*dz[1]+t*light[2]*dz[2])/z,j=i*4;
        for(let ch=0;ch<3;ch++)data[j+ch]=Math.min(255,rgb[ch]*l)*alpha+data[j+ch]*(1-alpha);
        data[j+3]=255*alpha+data[j+3]*(1-alpha);if(alpha>.99)depth[i]=z;
      }
    }
  }
}
function beginCellRestFrame(frame,id,view){
  const background=document.createElement("canvas"),sprite=document.createElement("canvas");
  background.width=sprite.width=frame.width;background.height=sprite.height=frame.height;
  const rest=prepareRestingDragon(homeDragonDisplayMesh(id)),camera=collectionCamera(rest,view,frame.width,frame.height);
  const environment=drawCollectionWorld(background.getContext("2d"),frame.width,frame.height,rest,camera,typeof dragonPersonality==="function"?dragonPersonality(id):null);
  const render=drawCollectionDragon(sprite,id,view,0,null,true,true,environment?.depth);
  return {frame,render,layers:{background,sprite,anchor:camera.project(camera.toCamera([rest.target[0],0,0]))}};
}
function stepCellRestFrame(work,limit=256){
  const {g,queue}=work.render,end=Math.min(queue.length,work.render.index+limit);
  for(;work.render.index<end;work.render.index++){
    paintCollectionFace(g,queue[work.render.index],work.render.raster);
  }
  if(end<queue.length)return false;
  if(work.render.raster)g.putImageData(work.render.raster.image,0,0);
  const target=work.frame.getContext("2d");target.drawImage(work.layers.background,0,0);target.drawImage(work.layers.sprite,0,0);return true;
}
function buildCellRestFrame(frame,id,view){
  const work=beginCellRestFrame(frame,id,view);while(!stepCellRestFrame(work)){}
  return work.layers;
}
function paintCellRest(slot,time,reduced){
  const frame=slot.frames[0];if(!frame)return;
  slot.hasImage=true;
  const g=slot.c.getContext("2d"),w=slot.c.width,h=slot.c.height,layers=slot.frames.layers;
  g.globalAlpha=1;g.clearRect(0,0,w,h);
  if(!layers){g.drawImage(frame,0,0,w,h);return;}
  g.drawImage(layers.background,0,0,w,h);
  const personality=typeof dragonPersonality==="function"?dragonPersonality(slot.id):null;
  const breath=reduced?0:Math.sin(time*(personality?1.4+personality.idle*.13:2)+(Number(slot.id)||0)*1.37)*(personality?.idle%2?.006:.004);
  const ax=layers.anchor[0]*w/frame.width,ay=layers.anchor[1]*h/frame.height;
  g.save();g.translate(ax,ay);g.scale(1+breath*.35,1+breath);g.translate(-ax,-ay);
  g.drawImage(layers.sprite,0,0,w,h);g.restore();
}
