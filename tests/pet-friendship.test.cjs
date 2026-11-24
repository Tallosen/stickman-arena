const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const box={console,Math,assert,performance:{now:()=>100000},dragonProfile:{personalities:{},care:{0:18},exclusives:{0:1}},homeAnimTime:0,homeReduced:false,homeTab:'warehouse',caveHeld:0,homeThumbSlots:[],dragonHomeOpen:()=>true,homeCanView:()=>true,wakeDragonHome(){},homeMessage(){},audio(){},beep(){}};
vm.createContext(box);
for(const file of ['dragon-personality.js','dragon-breeds.js','dragon-camera.js','dragon-3d.js','dragon-collection.js','dragon-care.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),box);
vm.runInContext(`
let refreshes=0;refreshCareControls=()=>refreshes++;
function request(bond=18){stopDragonCare();homeCareCooldown.clear();dragonProfile.care[0]=bond;homeAnimTime=0;beginHomeLife(0);homeAnimTime=11;const first=homeLifeFor(0);assert.notEqual(first.activity,'ask');homeAnimTime=homeLife.next;return homeLifeFor(0);}
for(const bond of [0,6,17]){assert.notEqual(request(bond).activity,'ask');assert(!homeInvitationOpen(0));}
for(const bond of [18,30]){
 assert.equal(request(bond).activity,'ask');assert(homeLifeCaption(0));assert(!homeInvitationOpen(1));
 const save=JSON.stringify(dragonProfile),n=refreshes;for(let i=0;i<30;i++)homeLifeFor(0);assert.equal(refreshes,n,'Caption rebuilt every frame');
 homeAnimTime+=5.5;assert(!homeInvitationOpen(0));homeLifeFor(0);assert.equal(homeLifeCaption(0),'');assert.equal(JSON.stringify(dragonProfile),save,'Ignoring request changed save');
}
for(const zone of ['head',null]){
 request();const save=JSON.stringify(dragonProfile);assert(touchHomeDragon(zone));assert.equal(homeCareFor(0).kind,'bond');assert.equal(homeCareFor(0).reply,dragonPersonality(0).idle);assert(!touchHomeDragon(zone));assert(!claimHomeInvitation(0));assert.equal(JSON.stringify(dragonProfile),save);
}
for(const zone of ['tail','belly']){request();assert(touchHomeDragon(zone));assert.equal(homeCareFor(0).kind,'touch');homeLifeFor(0);assert(!homeInvitationOpen(0));}
request();assert(beginHomeObjectAction('toy'));homeLifeFor(0);assert(!homeInvitationOpen(0));
request();homeReduced=true;assert.equal(homeLifeFor(0),null);assert(!homeInvitationOpen(0));homeReduced=false;endHomeLife();assert(!homeInvitationOpen(0));
let failSave=false;dragonTransaction=fn=>{if(failSave)return {ok:false,message:'Save failed'};return {ok:fn(dragonProfile)===true};};
request();assert(beginDragonCare(0,'pet'));assert(homeCareFor(0).bondReply);assert.equal(dragonBond(0),19,'Request gave bonus affection');
request();failSave=true;assert(!beginDragonCare(0,'pet'));assert(homeInvitationOpen(0));assert.equal(dragonBond(0),18);failSave=false;
for(const kind of ['feed','music']){request();assert(beginDragonCare(0,kind));homeLifeFor(0);assert(!homeInvitationOpen(0));assert(!homeCareFor(0).bondReply);}
stopDragonCare();endHomeLife();const saved=JSON.stringify(dragonProfile);
for(let id=0;id<100;id++){
 const mesh=homeDragonDisplayMesh(id),d=mesh.d,rest=prepareRestingDragon(mesh);
 for(let reply=0;reply<8;reply++)for(const t of [.1,.6,1.5,2.7,3.39]){
  const m=applyCollectionCare(collectionMotion(d,t),{id,kind:'bond',reply,t,duration:3.4});assert(Object.values(m).every(Number.isFinite));
  for(let i=0;i<rest.faces.length;i+=97)for(const p of rest.faces[i].p){const v=collectionAnimatedPoint(p,rest.faces[i],d,m);assert(v.every(Number.isFinite)&&v[1]>=0);}
 }
 const ask=applyCollectionCare(collectionMotion(d,1),{id,kind:'activity',activity:'ask',t:1,duration:5.5});assert(Object.values(ask).every(Number.isFinite));
}
assert.equal(JSON.stringify(dragonProfile),saved);
`,box);
console.log('PASS: trust invitations, timeout, caption caching, head/keyboard acceptance, manual interruption, save failure, regular affection only, 100 models x 8 friendship replies');
