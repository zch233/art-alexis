const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');
(async()=>{
 const dir=path.resolve('work/home-hotfix-'+Date.now());fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge'});const results=[],failures=[];
 try{for(const width of [390,768,1440,1920])for(const gutter of [false,true])for(const contact of [false,true]){
  const p=await browser.newPage({viewport:{width,height:945},reducedMotion:'reduce'});
  await p.goto('http://127.0.0.1:9401/',{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
  if(gutter)await p.addStyleTag({content:'html{scrollbar-gutter:stable}'});
  await p.evaluate(contact=>{const existing=document.querySelector('.header-contact');if(!existing)throw Error('CONTACT missing');existing.href=contact?'mailto:qa@example.test':'/#contact';},contact);
  const data=await p.evaluate(()=>{
   const rect=s=>{const e=document.querySelector(s),r=e?.getBoundingClientRect();return r?{x:r.x,y:r.y,w:r.width,h:r.height}:null};
   const frame=getComputedStyle(document.body,'::before');
   const lines=['.hero-grid::before','.hero-grid::after','.hero-title::after','.hero-scroll::after'].map(s=>{const [sel,pseudo]=s.split('::'),e=document.querySelector(sel),r=e.getBoundingClientRect(),v=getComputedStyle(e,'::'+pseudo);const left=parseFloat(v.left),w=parseFloat(v.width);const tx=v.transform==='none'?0:new DOMMatrix(v.transform).m41;return{s,content:v.content,x:r.x+left+tx,w,right:r.x+left+tx+w}});
   const shell=rect('.hero-shell');return{shell,body:rect('body'),nav:rect('#navigation'),contact:rect('.header-contact'),brand:rect('.brand'),frameLeft:parseFloat(frame.left),frameRight:parseFloat(frame.right),fonts:[...document.fonts].map(f=>({family:f.family,weight:f.weight,status:f.status})),lines,subtitleDivider:getComputedStyle(document.querySelector('.hero-scroll')).boxShadow,navOverflow:getComputedStyle(document.querySelector('.navbar-container')).overflow};
  });
  const label=`${width}/${gutter?'gutter':'overlay'}/${contact?'contact':'empty'}`;
  const check=(condition,message)=>{if(!condition)failures.push(label+': '+message)};
  check(Math.abs(data.frameLeft-data.shell.x)<1,'frame left does not align');check(Math.abs(data.body.w-data.frameRight-data.shell.x-data.shell.w)<1,'frame right does not align');
  check(data.fonts.some(f=>f.family==='Gasoek One'&&f.status==='loaded'),'actual display font not loaded');
  check(data.fonts.some(f=>f.family==='Poppins'&&f.weight==='500'&&f.status==='loaded'),'Poppins medium not loaded');
  if(width>=768){check(data.nav.x+data.nav.w/2>data.body.w*.4&&data.nav.x+data.nav.w/2<data.body.w*.6,'desktop menu not centrally placed');check(data.navOverflow==='hidden','brand hairlines escape navbar');check(data.subtitleDivider==='none','extra vertical line in subtitle row');}
  check(data.lines.some(l=>l.s==='.hero-grid::after'&&l.content!=='none'&&l.x<=.5&&l.right>=data.body.w-.5),'bottom hairline does not span page');
  if(width>=768)check(data.lines.some(l=>l.s==='.hero-title::after'&&l.content!=='none'&&l.x<=.5&&l.right>=data.body.w-.5),'middle hairline does not span page');
  if(width===1920&&gutter&&!contact)await p.screenshot({path:path.join(dir,'desktop-scrollbar.png')});
  if(width===390&&!gutter&&!contact)await p.screenshot({path:path.join(dir,'mobile.png')});
  results.push({label,...data});await p.close();
 }
 // CONTACT is optional content, not a layout switch.
 for(const width of [768,1440,1920])for(const gutter of ['gutter','overlay']){const a=results.find(r=>r.label===`${width}/${gutter}/empty`),b=results.find(r=>r.label===`${width}/${gutter}/contact`);if(Math.abs(a.nav.x-b.nav.x)>1)failures.push(`${width}/${gutter}: menu moves when email changes`);}
 }finally{await browser.close();}
 fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({passed:!failures.length,results,failures},null,2));console.log(JSON.stringify({dir,passed:!failures.length,cases:results.length,failures}));assert.equal(failures.length,0);
})().catch(e=>{console.error(e);process.exitCode=1});
