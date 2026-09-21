const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');const path=require('node:path');
(async()=>{
 const dir=path.resolve('work/home-diagnostic-'+Date.now());fs.mkdirSync(dir,{recursive:true});
 const b=await chromium.launch({channel:'msedge'});const report=[];
 try{for(const [name,url] of [['local','http://127.0.0.1:9401/'],['live','https://artsbyalexis.com/']]){
  const p=await b.newPage({viewport:{width:1920,height:945},reducedMotion:'reduce'});const network=[],errors=[];
  p.on('response',r=>{if(/css|ttf|woff/.test(r.url()))network.push({url:r.url(),status:r.status(),type:r.headers()['content-type']});});p.on('requestfailed',r=>network.push({url:r.url(),error:r.failure()?.errorText}));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  try{await p.goto(url,{waitUntil:'domcontentloaded',timeout:45000});await p.evaluate(()=>document.fonts.ready);await p.addStyleTag({content:'html{scrollbar-gutter:stable}'});await p.waitForTimeout(1500);
   const data=await p.evaluate(()=>({viewport:innerWidth,client:document.documentElement.clientWidth,fonts:[...document.fonts].map(f=>({family:f.family,weight:f.weight,status:f.status})),fontOK:document.fonts.check('200px "Gasoek One"'),styles:[...document.styleSheets].map(s=>s.href),boxes:Object.fromEntries(['.navbar-container','.brand','#navigation','.header-contact','.hero-shell','.hero-grid','.hero-title','.hero-title h1','.hero-subtitle','.hero-scroll'].map(sel=>{const e=document.querySelector(sel);if(!e)return[sel,null];const r=e.getBoundingClientRect(),s=getComputedStyle(e);return[sel,{x:r.x,y:r.y,w:r.width,h:r.height,font:s.fontFamily,before:getComputedStyle(e,'::before').cssText,after:{left:getComputedStyle(e,'::after').left,width:getComputedStyle(e,'::after').width}}]})),frame:{left:getComputedStyle(document.body,'::before').left,right:getComputedStyle(document.body,'::before').right}}));
   await p.screenshot({path:path.join(dir,name+'.png')});report.push({name,url,...data,network,errors});
  }catch(e){report.push({name,error:e.message,network,errors});}await p.close();
 }}finally{await b.close();}fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({dir,report}));
})().catch(e=>{console.error(e);process.exitCode=1});
