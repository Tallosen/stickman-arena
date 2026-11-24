const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const sha256=data=>crypto.createHash('sha256').update(data).digest('hex');
function fingerprint(){
 const files=['index.html','build.js','playgama-bridge-config.json','assets/audio/manifest.json','package.json','package-lock.json'];
 for(const dir of ['src','tests','tools'])for(const name of fs.readdirSync(path.join(root,dir)))
  if(/\.(js|cjs)$/.test(name))files.push(dir+'/'+name);
 return sha256(files.sort().map(file=>file+'\0'+sha256(fs.readFileSync(path.join(root,file)))).join('\n'));
}
module.exports={root,sha256,fingerprint};
