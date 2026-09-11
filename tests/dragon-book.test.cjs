const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.join(__dirname,'..'),db=new Map();let fail=false;
class El{
 constructor(tag='div'){this.tag=tag;this.children=[];this.style={};this.attrs={};this.scrollTop=0;this.disabled=false;this.classList={toggle(){},add(){},remove(){},contains(){return false;}};}
 set innerHTML(s){this.children=[];this.markup=s;if(s.includes('<canvas')){this.children.push(new El('canvas'),new El('div'));}}
 get innerHTML(){return this.markup||'';}appendChild(e){this.children.push(e);}setAttribute(k,v){this.attrs[k]=v;}
 querySelector(s){const m=s.match(/data-dragon="([^"]+)"/);return this.children.find(e=>m?e.attrs['data-dragon']===m[1]:e.tag===s)||null;}
 getContext(){return {};}focus(){}
}
const els=Object.fromEntries(['dragonBook','dragonGrid','dragonTotal','craftMessage','btnCloseBook'].map(k=>[k,new El()]));
const box={assert,console,document:{getElementById:id=>els[id],createElement:t=>new El(t)},localStorage:{getItem:k=>db.get(k)??null,setItem:(k,v)=>{if(fail)throw Error('storage');db.set(k,v);}},addEventListener(){},openDragonHome(){box.home=true;}};
vm.createContext(box);for(const f of ['dragon-economy.js','dragons.js'])vm.runInContext(fs.readFileSync(path.join(root,'src',f),'utf8'),box);
const run=s=>vm.runInContext(s,box);run('drawDragon=()=>{}');
for(let i=0;i<6;i++){
 run(`dragonTransaction(p=>{for(const id of DRAGON_IDS)p.counts[id]=0;p.counts[DRAGON_IDS[${i}]]=3;p.rescues=90;return true;});`);
 run(`assert(craftDragon(DRAGON_IDS[${i}]).ok);assert.equal(dragonCollection[DRAGON_IDS[${i}]],0);assert.equal(dragonCollection[DRAGON_IDS[${i+1}]],1);assert.equal(dragonProfile.rescues,90);assert(!craftDragon(DRAGON_IDS[${i}]).ok);assert.equal(readDragonProfile().counts[DRAGON_IDS[${i+1}]],1);`);
}
run(`dragonTransaction(p=>{for(const id of DRAGON_IDS)p.counts[id]=0;p.counts.green=729;return true;});
for(let i=0;i<6;i++)while(dragonCollection[DRAGON_IDS[i]]>=3)assert(craftDragon(DRAGON_IDS[i]).ok);
assert.equal(dragonCollection.diamond,1);assert.equal(Object.values(dragonCollection).reduce((a,b)=>a+b,0),1);assert.equal(DRAGON_EGG_COST,5);`);
console.log('PASS: all six 3:1 steps, persisted counts, insufficient stock, 729 green → 1 diamond, rescues and incubation unchanged');
run(`dragonTransaction(p=>{p.counts.green=6;p.counts.blue=0;return true;});renderDragonBook();`);
assert.equal(els.dragonGrid.children.length,7);const first=els.dragonGrid.children[0],button=first.children.at(-1);
assert.equal(button.textContent,'3 → 1 · Синий');assert(!button.disabled);assert.equal(button.tag,'button');
els.dragonBook.scrollTop=230;button.onclick();button.onclick();assert.equal(run('dragonCollection.green'),3);assert.equal(run('dragonCollection.blue'),1);assert.equal(els.dragonBook.scrollTop,230);
assert(els.craftMessage.textContent.includes('Сохранено'));
const second=els.dragonGrid.children[0].children.at(-1);fail=true;const saved=db.get('vacky_dragon_home_v2');second.onclick();assert.equal(run('dragonCollection.green'),3);assert.equal(db.get('vacky_dragon_home_v2'),saved);fail=false;
assert(els.craftMessage.textContent.includes('Ресурсы не списаны'));
run('renderDragonBook()');els.dragonGrid.children[0].children.at(-1).onclick();assert.equal(run('dragonCollection.green'),0);assert.equal(run('dragonCollection.blue'),2);
assert(els.dragonGrid.children[0].children.at(-1).disabled);assert(els.dragonGrid.children[0].children.at(-1).textContent.includes('Ещё 3'));
els.dragonGrid.children.at(-1).children.at(-1).onclick();assert(box.home);
for(const card of els.dragonGrid.children){assert(!card.innerHTML.includes('вес '));assert.equal(card.children.at(-1).className,'craft-btn');}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.equal((html.match(/id="btnCloseBook"/g)||[]).length,1);assert(html.includes('.book-overlay.hidden{display:none}'));
assert(/\.book-header\{position:sticky;top:0/.test(html));assert(html.includes('width:min(760px,100%)'));
assert(/\.craft-btn\{[^}]*min-height:44px/.test(html));assert(/@media\(max-width:559px\)[^\n]*grid-template-columns:1fr/.test(html));
for(const width of [280,320,360,390,540,560,768,1024]){
 const cover=Math.min(760,width-20),inside=cover-6-(width<=559?20:28),card=(inside-(width<=559?0:12))/(width<=559?1:2);
 assert(card-24-88-10>=100,'Text column too narrow: '+width);assert(cover<=width-20);
}
console.log('PASS: book controls, one transaction per old button, retry after save error, preserved scroll, seven cards, one close button, mobile widths and 44px controls');
