const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');const path=require('node:path');
(async()=>{
 const out=path.resolve('work/export-probe-'+Date.now());fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge'});const results=[];
 try{for(const width of [1440,390,768])for(const route of ['index.html','work-detail.html?slug=early-explorations','work-detail.html?slug=current-works']){
  const p=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
  await p.route('**/filmx-698c13.webflow.shared.014188d62.css',r=>r.fulfill({path:'work/export-webflow.css',contentType:'text/css'}));
  await p.goto('http://127.0.0.1:9402/'+route,{waitUntil:'load',timeout:60000});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(2200);
  await p.evaluate(()=>{document.querySelectorAll('[data-w-id][style]').forEach(e=>e.removeAttribute('style'));document.querySelectorAll('img').forEach(i=>i.loading='eager')});
  await p.screenshot({path:path.join(out,`${route.split('?')[0]}-${route.split('=')[1]||'home'}-${width}.png`),fullPage:true});
  const metrics=await p.evaluate(()=>({fonts:[...document.fonts].map(f=>[f.family,f.weight,f.status]),height:document.documentElement.scrollHeight,items:[...document.querySelectorAll('.navbar,.navbar-container,.brand,.nav-link,.hero-section,.hero-section-secondary-content-wrapper,.hero-title-container,.hero-title-text,.padded-content-box,.padded-content-flex-box,.hero-scroll-arrow,.about-block,.section-title-container,.about-intro-wrapper,.about-intro-wrapper p,.work-card-wrap,.work-card-image,.work-card-text-container,.work-card-text-wrapper,h4,.button,.button h6,.button img,.footer-c2a-button,.footer-signature,.detail-header-inner,.detail-title,.detail-meta,.detail-body,.detail-gallery-wrap,.detail-shot-frame,.detail-recommend,.recommend-head,.recommend-grid,.cw-grid,.cw-card')].map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{selector:e.className||e.tagName,text:e.textContent.trim().slice(0,70),x:r.x,y:r.y,width:r.width,height:r.height,font:s.fontFamily,fontSize:s.fontSize,lineHeight:s.lineHeight,fontWeight:s.fontWeight,padding:s.padding,margin:s.margin,gap:s.gap}})}));results.push({width,route,...metrics});await p.close();
 }}finally{await browser.close();}
 fs.writeFileSync(path.join(out,'metrics.json'),JSON.stringify(results,null,2));console.log(out);
})().catch(e=>{console.error(e);process.exitCode=1});
