// Creates ignored private import media, never a public/static deployment folder.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const sharp=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{
 const root=path.resolve('D:/Users/gupo/Downloads/site-package');
 const html=fs.readFileSync(path.join(root,'work-detail.html'),'utf8');
 const literal=html.match(/const WORKS = ([\s\S]*?);\s*const DEFAULT_SLUG/)[1];
 const works=vm.runInNewContext('('+literal+')',Object.create(null),{timeout:1000});
 const dest=path.resolve('work/source-content-'+Date.now());fs.mkdirSync(dest,{recursive:true});
 const manifest={version:1,source:'client site-package',collections:[],files:{}};
 async function asset(relative){
  if(manifest.files[relative])return relative;
  const original=path.resolve(root,relative);if(!original.startsWith(root+path.sep))throw Error('Invalid asset path');
  const out=relative.replace(/\.svg$/i,'.png').replaceAll('/','__');const output=path.join(dest,out);
  if(relative.endsWith('.svg')){
   const svg=fs.readFileSync(original,'utf8');if(/<script|(?:href|url)\s*[=(]/i.test(svg))throw Error('Unsafe SVG source');
   await sharp(Buffer.from(svg)).png().toFile(output);
  }else fs.copyFileSync(original,output);
  const bytes=fs.readFileSync(output);manifest.files[relative]={file:out,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),placeholder:relative.endsWith('.svg')};return relative;
 }
 for(const [slug,w]of Object.entries(works)){
  const items=[];
  for(const [i,item]of (w.items||w.images.map(src=>({src,title:w.title,desc:''}))).entries())items.push({key:await asset(item.src),title:item.title,caption:item.desc||'',order:i});
  manifest.collections.push({slug,title:w.title,meta:w.meta,age:['early-explorations','finding-my-style'].includes(slug)?w.meta:'',cover:await asset(w.cover),grid:w.layout==='grid',items});
 }
 const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const intro=home.match(/<div class="about-intro-wrapper">[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/)[1].trim().replace(/\s+/g,' ');
 manifest.settings={brand:'ALEXIS',subtitle:'Arts by Alexis',footer:'Arts by Alexis',intro};
 fs.writeFileSync(path.join(dest,'manifest.json'),JSON.stringify(manifest,null,2));
 console.log(JSON.stringify({directory:dest,collections:manifest.collections.length,images:Object.keys(manifest.files).length,placeholders:Object.values(manifest.files).filter(f=>f.placeholder).length}));
})().catch(e=>{console.error(e);process.exitCode=1});
