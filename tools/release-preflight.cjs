// Artifact integrity is separate from the outstanding real-device/platform release gates.
const fs=require('node:fs'),path=require('node:path');
const {root,sha256,fingerprint}=require('./release-fingerprint.cjs');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const version=read('src/config.js').match(/VERSION = "([^"]+)"/)[1],checks=[];
function check(name,fn){try{if(!fn())throw Error('Condition failed');checks.push({name,passed:true});}catch(error){checks.push({name,passed:false,error:error.message});}}
const publicFile='dist/playgama/index.html',qaFile='dist/StickmanArena_v'+version+'_QA.html';
check('Playgama archive has root entry and valid matching config',()=>JSON.stringify(JSON.parse(read('dist/playgama/playgama-bridge-config.json')))===JSON.stringify(JSON.parse(read('playgama-bridge-config.json'))));
check('Public build uses one Playgama SDK and excludes QA flag',()=>{
 const html=read(publicFile),scripts=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]);
 return scripts.length===1&&scripts[0]==='https://bridge.playgama.com/v2/stable/playgama-bridge.js'&&html.includes('window.VACKY_REQUIRE_PLAYGAMA=true')&&!html.includes('window.VACKY_DEV=true');
});
check('QA keeps admin and isolated test storage',()=>read(qaFile).includes('window.VACKY_DEV=true')&&read(qaFile).includes("qaPrefix='vacky_qa_v1:'"));
check('Both builds carry current version',()=>[publicFile,qaFile].every(file=>read(file).includes('VERSION = "'+version+'"')));
check('Current full regression run passed without source changes',()=>{
 const report=JSON.parse(read('audit/regression-current.json'));
 return report.version===version&&report.exitCode===0&&report.sourceUnchanged&&report.sourceFingerprint===fingerprint()&&
  [publicFile,qaFile,'dist/playgama/playgama-bridge-config.json'].every(file=>report.artifactHashes?.[file]===sha256(fs.readFileSync(path.join(root,file))));
});
check('Audio manifest provenance and referenced file hashes',()=>{
 const manifest=JSON.parse(read('assets/audio/manifest.json'));require('./audio-provenance.cjs').validate(manifest);
 for(const group of [manifest.groups,manifest.previousWeapons])for(const clips of Object.values(group))for(const clip of clips){
  if(/reference|bullet-time|jutkiy-zvuk/i.test(clip.file)||clip.file.includes('..')||path.isAbsolute(clip.file))throw Error('Reference or invalid audio in active bank');
  if(sha256(fs.readFileSync(path.join(root,'assets/audio',clip.file)))!==clip.sha256)throw Error('Audio hash mismatch');
 }
 return true;
});
check('Package below platform size limit',()=>{
 const total=fs.readdirSync(path.join(root,'dist/playgama')).reduce((sum,file)=>sum+fs.statSync(path.join(root,'dist/playgama',file)).size,0);return total<300*1024*1024;
});
const gates=JSON.parse(read('release-gates.json'));
const blockers=gates.items.filter(item=>item.status!=='verified'||!item.evidence||!item.verifiedAt);
const artifacts=[publicFile,'dist/playgama/playgama-bridge-config.json',qaFile].filter(file=>fs.existsSync(path.join(root,file))).map(file=>({file,bytes:fs.statSync(path.join(root,file)).size,sha256:sha256(fs.readFileSync(path.join(root,file)))}));
const passed=checks.every(c=>c.passed),report={version,checkedAt:new Date().toISOString(),artifactChecksPassed:passed,publishReady:passed&&blockers.length===0,checks,blockers,artifacts};
fs.mkdirSync(path.join(root,'audit'),{recursive:true});fs.writeFileSync(path.join(root,'audit/release-preflight.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
process.exitCode=passed&&(!process.argv.includes('--require-publish-ready')||report.publishReady)?0:1;
