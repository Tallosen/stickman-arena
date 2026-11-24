const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),db=new Map(),els=new Map(),events={};
let fail=false;
const doc={activeElement:null,documentElement:{setAttribute(){}},getElementById:id=>els.get(id),addEventListener:(k,f)=>events[k]=f};
class El{
 constructor(id){this.id=id;this.attrs={};this.dataset={};this.hidden=true;this.handlers={};this.classList={add:()=>this.hidden=true,remove:()=>this.hidden=false,toggle(){}};}
 setAttribute(k,v){this.attrs[k]=v;}focus(){doc.activeElement=this;}addEventListener(k,f){this.handlers[k]=f;}
}
for(const id of ['languageDialog','btnCloseLanguage','chooseLanguageEn','chooseLanguageRu','menuLanguagestart','menuLanguagepause'])els.set(id,new El(id));
const launch=[els.get('menuLanguagestart'),els.get('menuLanguagepause')],choices=[els.get('chooseLanguageEn'),els.get('chooseLanguageRu')],names=[{},{}],status=[{}];
choices[0].dataset.chooseLanguage='en';choices[1].dataset.chooseLanguage='ru';
doc.querySelectorAll=s=>({'[data-language]':launch,'[data-choose-language]':choices,'[data-language-name]':names,'[data-language-status]':status}[s]||[]);
const box={document:doc,console,navigator:{language:'en'},pointer:{active:true},tutorialOpen:()=>false,Playables:{provider:'Playgama',language:'ru',blocked:false,audioAllowed:true,storage:{getItem:k=>db.get(k)??null,setItem(k,v){if(fail)throw Error('quota');db.set(k,v);}}}};
vm.createContext(box);const run=s=>vm.runInContext(s,box);run(fs.readFileSync(path.join(root,'src/language-packs.js'),'utf8'));run(fs.readFileSync(path.join(root,'src/localization.js'),'utf8'));run('initLocalization()');
assert(names.every(n=>n.textContent==='Русский'),'Host language takes precedence on initial load');
launch[0].onclick();assert(run('languageMenuOpen()'));assert.equal(doc.activeElement,choices[1]);assert.equal(box.pointer.active,false);
choices[0].onclick();assert(!run('languageMenuOpen()'));assert.equal(doc.activeElement,launch[0]);assert(names.every(n=>n.textContent==='English'));assert.equal(db.get('vacky_language_v1'),'en');assert(launch.every(b=>b.attrs['aria-expanded']==='false'));
launch[1].onclick();assert.equal(doc.activeElement,choices[0]);
let stopped=false;events.keydown({key:'Tab',preventDefault(){},stopImmediatePropagation(){stopped=true;}});assert(stopped);assert.equal(doc.activeElement,choices[1]);
events.keydown({key:'Escape',preventDefault(){},stopImmediatePropagation(){}});assert(!run('languageMenuOpen()'));assert.equal(doc.activeElement,launch[1]);
box.Playables.blocked=true;launch[0].onclick();assert(!run('languageMenuOpen()'));box.Playables.blocked=false;
launch[0].onclick();fail=true;choices[1].onclick();assert(run('languageMenuOpen()'));assert(status[0].textContent);assert.equal(db.get('vacky_language_v1'),'en');fail=false;
els.get('languageDialog').handlers.click({target:els.get('languageDialog')});assert(!run('languageMenuOpen()'));
box.tutorialOpen=()=>true;launch[0].onclick();assert(!run('languageMenuOpen()'));
assert(!html.includes('<select id="menuLanguage'));assert.equal([...html.matchAll(/class="language-pill"/g)].length,2);assert.equal([...html.matchAll(/data-choose-language=/g)].length,15);
box.tutorialOpen=()=>false;launch[0].onclick();assert(run('languageMenuOpen()'));assert(!els.get('languageDialog').hidden);els.get('btnCloseLanguage').onclick();assert(els.get('languageDialog').hidden);assert(!run('languageMenuOpen()'));
assert(/\.language-dialog\.hidden,\.language-dialog\[hidden\]\{display:none!important\}/.test(html),'CSS must actually hide the closed grid dialog');
assert(html.includes('justify-content:flex-end'));assert(html.includes('min-height:44px'));
console.log('PASS: language dialog, host default, visible selected language, save/reopen, focus/keyboard/backdrop, SDK/tutorial guards, 15-language list');
