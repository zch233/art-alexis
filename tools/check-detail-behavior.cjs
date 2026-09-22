// Read-only E2E: synthetic pagination/empty states are browser response fixtures,
// never inserted into WordPress or its database.
const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');const assert=require('node:assert/strict');const path=require('node:path');
const base='http://127.0.0.1:9401';
(async()=>{
 const dir=path.resolve('work/detail-check-'+Date.now());fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge'});const checks=[];
 try{
  for(const width of [390,1440]){
   const p=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.goto(base,{waitUntil:'networkidle'});const card=p.locator('.collection-card').first();await card.scrollIntoViewIfNeeded();const y=await p.evaluate(()=>scrollY);await card.click();await p.waitForLoadState('networkidle');
   assert(!await p.locator('.site-header').count());assert.equal(await p.locator('.detail-header').evaluate(e=>getComputedStyle(e).position),'sticky');assert.equal(await p.locator('.recommend-card').count(),4);
   await p.locator('.image-button').first().click();await p.waitForSelector('.pswp--ui-visible');await p.waitForTimeout(400);assert(await p.locator('.pswp__caption').innerText());await p.keyboard.press('Escape');await p.waitForSelector('.pswp--open',{state:'hidden'});assert(await p.locator('.image-button').first().evaluate(e=>e===document.activeElement));checks.push(`collection lightbox/caption/focus ${width}`);
   await p.locator('.detail-close').click();await p.waitForLoadState('networkidle');await p.waitForTimeout(150);const returned=await p.evaluate(()=>({y:scrollY,saved:sessionStorage.getItem('aa-home-scroll'),flag:sessionStorage.getItem('aa-home-restore')}));assert(Math.abs(returned.y-y)<5,JSON.stringify({width,expected:y,...returned}));checks.push(`close restores home position ${width}`);
   await p.goto(base+'/collection/current-works/',{waitUntil:'networkidle'});assert.equal(await p.locator('.cw-grid').evaluate(e=>getComputedStyle(e).columnCount),width<601?'1':'2');
   assert(await p.locator('.image-button img').first().evaluate(i=>Math.abs(i.clientWidth/i.clientHeight-i.naturalWidth/i.naturalHeight)<.02));checks.push(`current works columns and uncropped images ${width}`);
   assert.deepEqual(errors,[]);await p.close();
  }
  const p=await browser.newPage({viewport:{width:390,height:900},reducedMotion:'reduce'});const route=base+'/collection/early-explorations/';const original=await (await p.request.get(route)).text();
  const button='<a id="load-more" class="all-work" href="?works_page=2">Load more artworks ↓</a>';
  const first=original.replace('data-navigation="off"','data-navigation="on"').replace(/data-pages="\d+"/,'data-pages="2"').replace('<p id="list-status"',button+'<p id="list-status"');
  let fail=true;
  await p.route('**/collection/early-explorations/**',async r=>{
   const u=new URL(r.request().url());
   if(!u.searchParams.has('works_page'))return r.fulfill({body:first,contentType:'text/html'});
   if(fail)return r.fulfill({status:503,body:'temporarily unavailable'});
   const figure=original.match(/<figure class="detail-shot"[\s\S]*?<\/figure>/)?.[0];assert(figure);
   const next=figure.replace(/data-id="\d+"/,'data-id="987654"').replace('data-caption="','data-caption="Second page ');
   return r.fulfill({body:`<div id="work-grid" data-page="2" data-pages="2">${next}</div>`,contentType:'text/html'});
  });
  await p.goto(route,{waitUntil:'networkidle'});const before=await p.locator('#work-grid figure').count();await p.locator('#load-more').click();await p.waitForFunction(()=>document.querySelector('#list-status').textContent.includes('Unable'));
  assert.equal(await p.locator('#work-grid figure').count(),before);assert(!await p.locator('#work-grid').getAttribute('aria-busy'));checks.push('pagination failure preserves gallery and permits retry');
  fail=false;await p.locator('#load-more').click();await p.waitForFunction(()=>document.querySelector('#work-grid').dataset.page==='2');assert.equal(await p.locator('#work-grid figure').count(),before+1);assert(!await p.locator('#load-more').isVisible());
  await p.locator('.image-button').last().click();await p.waitForSelector('.pswp--ui-visible');await p.waitForTimeout(400);const caption=await p.locator('.pswp__caption').textContent();assert(caption.startsWith('Second page'),JSON.stringify({caption,expected:'Second page'}));await p.keyboard.press('ArrowLeft');await p.waitForTimeout(400);assert(!(await p.locator('.pswp__caption').textContent()).startsWith('Second page'));await p.keyboard.press('Escape');checks.push('pagination append/last-page/lightbox navigation');await p.close();
  const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});await nojs.goto(route);assert(await nojs.locator('.image-button').first().getAttribute('href'));assert(await nojs.locator('.detail-close').isVisible());checks.push('no-JS detail image/return links');await nojs.close();
  fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({passed:true,checks},null,2));console.log(JSON.stringify({passed:true,dir,checks}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
