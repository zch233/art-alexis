const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'msedge'});try{
for(const width of [390,1440])for(const layout of ['single','double'])for(const navigation of ['on','off']){
 const p=await b.newPage({viewport:{width,height:900},reducedMotion:'reduce',hasTouch:width===390});
 await p.route('**/collection/current-works/',async r=>{const response=await r.fetch();let body=await response.text();body=body.replace('data-navigation="on"',`data-navigation="${navigation}"`);if(layout==='single')body=body.replace('detail-gallery cw-grid','detail-gallery');await r.fulfill({response,body})});
 await p.goto('http://localhost:9401/collection/current-works/',{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
 assert(await p.evaluate(()=>document.fonts.check('38px "Gasoek One"')),'local alias font');
 assert.equal(await p.locator('#work-grid').evaluate(e=>getComputedStyle(e).columnCount),layout==='double'?(width<=600?'1':'2'):'auto');
 const trigger=p.locator('.image-button').nth(1);await trigger.click();await p.waitForSelector('.pswp--ui-visible');
 const initial=await p.locator('.lightbox-info-title').textContent();assert.equal(initial,'Untitled 02');
 assert.equal(await p.locator('.pswp__button--arrow--next').isVisible(),navigation==='on');
 await p.keyboard.press('ArrowRight');await p.waitForTimeout(450);
 assert.equal(await p.locator('.lightbox-info-title').textContent(),navigation==='on'?'Untitled 03':initial);
 await p.keyboard.press('Escape');await p.waitForTimeout(200);assert(await trigger.evaluate(e=>e===document.activeElement),JSON.stringify({width,layout,navigation,active:await p.evaluate(()=>document.activeElement.outerHTML.slice(0,180))}));await p.close();
}console.log('PASS 8 layout/navigation/viewport combinations, keyboard and focus, localhost fonts');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
