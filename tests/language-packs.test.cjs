const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),db=new Map(),els=new Map();
const doc={activeElement:null,documentElement:{setAttribute(){}},addEventListener(){},getElementById:id=>els.get(id)};
class El{
 constructor(id){this.id=id;this.dataset={};this.attrs={};this.classes=new Set(['hidden']);this.classList={add:v=>this.classes.add(v),remove:v=>this.classes.delete(v),toggle(){}};}
 setAttribute(k,v){this.attrs[k]=v;}focus(){doc.activeElement=this;}addEventListener(){}
}
for(const id of ['languageDialog','btnCloseLanguage','menuLanguagestart','menuLanguagepause'])els.set(id,new El(id));
const choices=[...html.matchAll(/id="(chooseLanguage[^"]+)" data-choose-language="([^"]+)"/g)].map(m=>{const el=new El(m[1]);el.dataset.chooseLanguage=m[2];els.set(m[1],el);return el;});
const launch=[els.get('menuLanguagestart'),els.get('menuLanguagepause')],names=[new El(),new El()],shell=new El(),labels=[...html.matchAll(/data-i18n="([^"]+)"/g)].map(m=>{const e=new El();e.dataset.i18n=m[1];return e;});
doc.querySelectorAll=s=>({'[data-language]':launch,'[data-choose-language]':choices,'[data-language-name]':names,'[data-i18n]':labels,'.main-menu-shell,.language-card,#tutorialCard,.game-help-card':[shell]}[s]||[]);
const box={assert,document:doc,console,Playables:{provider:'Playgama',language:'en',blocked:false,audioAllowed:true,storage:{getItem:k=>db.get(k)??null,setItem:(k,v)=>db.set(k,v)}}};
vm.createContext(box);const run=s=>vm.runInContext(s,box);
for(const file of ['language-packs.js','localization.js'])run(fs.readFileSync(path.join(root,'src',file),'utf8'));
run('initLocalization()');assert.equal(choices.length,15);assert.equal(new Set(choices.map(e=>e.dataset.chooseLanguage)).size,15);
const tipIds='welcome move health upgrade item ultimate inventory menu altar'.split(' ');
for(const choice of choices){
 const code=choice.dataset.chooseLanguage;
 launch[0].onclick();choice.onclick();
 assert(els.get('languageDialog').hidden);assert.equal(db.get('vacky_language_v1'),code);
 assert.equal(run('loadLanguage()'),code);assert(names.every(e=>e.textContent===run('LANGUAGE_NAMES['+JSON.stringify(code)+']')));
 assert.equal(shell.attrs.dir,code==='ar'?'rtl':'ltr');
 assert(labels.every(e=>e.textContent&&e.textContent!==e.dataset.i18n));
 launch[1].onclick();assert.equal(doc.activeElement,choice);
 els.get('btnCloseLanguage').onclick();assert(els.get('languageDialog').hidden);assert.equal(doc.activeElement,launch[1]);
 if(!['en','ru'].includes(code)){
  for(const key of run('Object.keys(UI_LABELS)'))assert(run('LANGUAGE_PACKS['+JSON.stringify(code)+'].ui['+JSON.stringify(key)+']'),code+' missing '+key);
  for(const id of tipIds){const step=run('localizedTutorialStep('+JSON.stringify(id)+',{target:"hero",title:"RU",text:"RU"})');assert.equal(step.target,'hero');assert(step.title!=='RU'&&step.text!=='RU');assert(step.text.length>20);}
  for(const topic of ['run','restart','resume']){const help=run('localizedHelp('+JSON.stringify(topic)+',{})');assert(help.title&&help.text.length&&help.text.every(Boolean));}
 }
}
for(const [input,expected] of [['pt-BR','pt'],['zh-TW','zh'],['ar-SA','ar'],['hi_IN','hi'],['es-MX','es'],['xx','en']]){
 db.delete('vacky_language_v1');box.Playables.language=input;assert.equal(run('loadLanguage()'),expected);
}
assert(/\.language-dialog\.hidden,\.language-dialog\[hidden\]\{display:none!important\}/.test(html));
console.log('PASS: all 15 language choices, save/reload, selected focus, close visibility, 13 complete menu/tutorial/guide packs, Arabic direction and platform language variants');
