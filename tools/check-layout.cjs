const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');const path=require('path');const assert=require('assert/strict');
const base=process.env.AA_LAYOUT_URL||'http://127.0.0.1:9401';
(async()=>{
 const dir=path.resolve('work/layout-check-'+Date.now());fs.mkdirSync(dir,{recursive:true});const checks=[];const browser=await chromium.launch({channel:'msedge'});
 async function bounds(page,label){const data=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('h1,h2,.collection-label,.hero-aside,#navigation')].filter(e=>e.clientWidth>0&&e.scrollWidth>e.clientWidth+2).map(e=>({tag:e.tagName,cls:e.className,w:e.clientWidth,scroll:e.scrollWidth}))}));assert(data.scroll<=data.width+1,`${label}: horizontal page overflow`);assert.deepEqual(data.overflow,[],`${label}: text overflow`);checks.push(label);}
 try{
  for(const width of [320,390,768,1024,1440,1920]){
   const page=await browser.newPage({viewport:{width,height:900},hasTouch:width<768});const errors=[];page.on('pageerror',e=>errors.push(e.message));
   assert.equal((await page.goto(base,{waitUntil:'networkidle'})).status(),200);await page.evaluate(()=>document.fonts.ready);await bounds(page,`home ${width}`);
   assert.equal(await page.locator('.collection-card').count(),4);
   assert(await page.locator('.collection-card').evaluateAll(es=>es.every(e=>getComputedStyle(e).opacity!=='0')),'below-fold cards must not be hidden before scrolling');
   assert(await page.locator('.collection-card').first().evaluate(e=>e.querySelector('.collection-label').getBoundingClientRect().top>=e.querySelector('.crop').getBoundingClientRect().bottom-1));
   if(width<768){assert(!(await page.locator('#navigation').isVisible()));await page.locator('.menu').click();assert(await page.locator('#navigation').isVisible());await page.keyboard.press('Escape');assert(!(await page.locator('#navigation').isVisible()));assert(await page.locator('.menu').evaluate(e=>e===document.activeElement));checks.push(`menu touch/Escape/focus ${width}`);}
   for(const card of await page.locator('.collection-card').all()){await card.scrollIntoViewIfNeeded();await card.locator('img').evaluate(async i=>{await i.decode();if(!i.naturalWidth)throw new Error('Image not loaded')});}
   await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(800);
   if([390,1440].includes(width)){await page.evaluate(()=>document.activeElement?.blur());await page.screenshot({path:path.join(dir,`after-${width}.png`),fullPage:true});}
   await page.evaluate(()=>{document.querySelector('.hero-title h1').textContent='ARTS BY ALEXIS';document.querySelector('.collection-label h2').textContent='A very long collection name for creative experiments and stories';});await bounds(page,`long titles ${width}`);
   const href=await page.locator('.collection-card').first().getAttribute('href');assert.equal((await page.goto(href,{waitUntil:'networkidle'})).status(),200);await bounds(page,`collection ${width}`);
   await page.locator('.art-card').first().click();await page.waitForLoadState('networkidle');await bounds(page,`detail ${width}`);
   assert.equal(await page.locator('nav.detail-return').evaluate(e=>getComputedStyle(e).display),'flex');
   await page.locator('.image-button').first().click();await page.waitForSelector('.pswp--ui-visible');await page.waitForTimeout(400);if(width<768)await page.locator('.pswp__button--close').click();else await page.keyboard.press('Escape');await page.waitForSelector('.pswp--open',{state:'hidden'});checks.push(`lightbox ${width}`);
   await page.goto(base+'/about/',{waitUntil:'networkidle'});await bounds(page,`about ${width}`);
   assert.deepEqual(errors,[]);await page.close();
  }
  for(const mode of ['no-js','reduced']){
   const page=await browser.newPage({viewport:{width:390,height:844},javaScriptEnabled:mode!=='no-js',reducedMotion:mode==='reduced'?'reduce':'no-preference'});
   await page.goto(base,{waitUntil:'networkidle'});await bounds(page,mode);
   if(mode==='no-js')assert(await page.locator('#navigation').isVisible());
   assert(await page.locator('.collection-card').evaluateAll(es=>es.every(e=>getComputedStyle(e).opacity==='1')));checks.push(mode+' cards visible');await page.close();
  }
  fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({passed:true,checks},null,2));console.log(JSON.stringify({passed:true,checks,dir}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
