const fs=require('fs'),path=require('path'),assert=require('assert'),h=require('./arena-harness.cjs')({native:true,width:160,height:160});h.box.assert=assert;
const types=[{kind:'medal'},...['gun','helm','jacket','gloves','boots','scope','clip','cape'].map(key=>({kind:'gear',key})),{kind:'heal'},{kind:'ult'},...['airstrike','gas','tank'].map(key=>({kind:'supply',key})),{kind:'continue'}];
const hashes=new Set();h.run('reset();running=true;');
for(const option of types){
 h.box.option=option;h.run(`drawBossRewardIcon(ctx,option,160);assert.equal(ctx.getTransform().a,1);assert.equal(ctx.getTransform().d,1);`);
 const pixels=h.ctx.getImageData(0,0,160,160).data;let painted=0,edge=0;
 for(let y=0;y<160;y++)for(let x=0;x<160;x++){if(pixels[(y*160+x)*4+3]>0){painted++;if(x<2||y<2||x>157||y>157)edge++;}}
 assert(painted>300,'empty icon '+JSON.stringify(option));assert.equal(edge,0,'clipped icon '+JSON.stringify(option));
 const hash=require('crypto').createHash('sha256').update(pixels).digest('hex');
 if(option.kind!=='continue'){assert(!hashes.has(hash),'duplicate equipment icon');hashes.add(hash);}
}
h.run(`P.hp=4;P.hpMax=5;assert.equal(bossRewardValue({kind:'heal'}),'+1');ult.charge=ULT_FULL*.9;assert.equal(bossRewardValue({kind:'ult'}),'+10%');ult.charge=ULT_FULL*.999;assert.equal(bossRewardValue({kind:'ult'}),'+<1%');P.gear.helm=2;assert.equal(bossRewardValue({kind:'gear',key:'helm'}),'2 → 3');`);
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');assert(html.includes('boss-reward-choice:focus-visible'));assert(html.includes('max-height:calc(100dvh - 32px);overflow-y:auto'));assert(html.includes('minmax(0,1fr)'));
console.log('PASS: 15 actual Canvas reward icons, distinct equipment, unclipped pixels, balanced transforms, capped benefit badges, keyboard focus and scrollable layout rules');
