const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');const path=require('node:path');
const assert=require('node:assert/strict');
const baseline=JSON.parse(fs.readFileSync(process.argv[2]||'work/export-probe-1789895489131/metrics.json','utf8'));
(async()=>{
 const dir=path.resolve('work/source-parity-'+Date.now());fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge'});const results=[];
 const mappings={'.site-header':'navbar w-nav','.navbar-container':'navbar-container','.hero-grid':'hero-section-secondary-content-wrapper','.hero-title':'hero-content-box hero-title-container','.hero-title h1':'hero-title-text','.hero-subtitle':'hero-content-box padded-content-box','.hero-scroll':'hero-content-box padded-content-flex-box','.section-title-container':'section-title-container','.about-intro-wrapper':'about-intro-wrapper','.about-intro-wrapper p':'about-intro-wrapper p','.collection-card .crop':'work-card-image','.work-card-text-wrapper':'work-card-text-wrapper','.detail-header-inner':'detail-header-inner','.detail-title':'detail-title','.detail-body':'detail-body','.detail-gallery-wrap':'detail-gallery-wrap'};
 try{for(const width of [1440,390,768])for(const [name,route,ref] of [['home','/','index.html'],['early','/collection/early-explorations/','work-detail.html?slug=early-explorations'],['current','/collection/current-works/','work-detail.html?slug=current-works']]){
  const p=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:9401'+route,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
  await p.evaluate(()=>document.querySelectorAll('img').forEach(i=>i.loading='eager'));await p.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
  await p.screenshot({path:path.join(dir,`${name}-${width}.png`),fullPage:true});
  const expected=baseline.find(b=>b.width===width&&b.route===ref);const diffs=[];
  for(const [selector,refSelector]of Object.entries(mappings)){
   const loc=p.locator(selector).first();if(!await loc.count())continue;
   const actual=await loc.evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{x:r.x,y:r.y,width:r.width,height:r.height,fontSize:s.fontSize,lineHeight:s.lineHeight}});const exp=expected?.items.find(i=>i.selector===refSelector);if(!exp)continue;
   diffs.push({selector,actual,expected:exp,delta:Object.fromEntries(['x','y','width','height'].map(k=>[k,+(actual[k]-exp[k]).toFixed(2)]))});
  }
  results.push({name,width,errors,overflow:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),diffs});await p.close();
 }}finally{await browser.close();}
 fs.writeFileSync(path.join(dir,'comparison.json'),JSON.stringify(results,null,2));
 for(const result of results){
  assert(!result.overflow,`${result.name} ${result.width} overflow`);assert.deepEqual(result.errors,[]);
  assert(result.diffs.length>0,'Reference metrics were not found');
  for(const diff of result.diffs){
   // Compare layout, not the total height of galleries with different real data.
   const keys=result.name==='home'||['.detail-header-inner','.detail-title'].includes(diff.selector)?['x','y','width','height']:['x','y','width'];
   for(const key of keys)assert(Math.abs(diff.delta[key])<=1,`${result.name} ${result.width} ${diff.selector} ${key}: ${diff.delta[key]}`);
  }
 }
 console.log(JSON.stringify({passed:true,dir,viewports:[1440,390,768],pages:['home','early','current'],tolerancePx:1,scope:'Home key boxes; detail header and column geometry. Artwork data is not replaced.'}));
})().catch(e=>{console.error(e);process.exitCode=1});
