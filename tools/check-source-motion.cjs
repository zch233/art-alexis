const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const dir=path.resolve('work/source-motion-check-'+Date.now());fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({channel:'msedge'}),checks=[];
 try{for(const width of [390,1440]){
  const p=await browser.newPage({viewport:{width,height:900},hasTouch:width<768}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:9401/',{waitUntil:'load'});
  const start=await p.locator('.hero').evaluate(e=>+getComputedStyle(e).opacity);assert(start<1,'whole hero must start fading, not title-only');
  await p.waitForTimeout(1600);await p.evaluate(()=>document.fonts.ready);
  assert.equal(await p.locator('.hero').evaluate(e=>+getComputedStyle(e).opacity),1);
  assert(await p.locator('#contact').count());
  assert(!await p.locator('a[href*="example.com"]').count());
  const glow=await p.locator('#ambient-canvas').evaluate(c=>{const ctx=c.getContext('2d');return ctx.getImageData(Math.round(c.width*.5),Math.round(c.height*.35),1,1).data[3]});assert(glow>25,'initial glow exists without mouse movement');
  if(width>767)assert(await p.locator('.header-contact').isVisible());
  else{await p.locator('.menu').click();assert(await p.locator('.nav-contact').isVisible());await p.keyboard.press('Escape');}
  await p.screenshot({path:path.join(dir,`home-${width}.png`)});
  await p.evaluate(()=>scrollTo(0,1000));await p.waitForTimeout(350);
  assert.equal(await p.locator('body > .surface-depth').evaluate(e=>+getComputedStyle(e).opacity),1);
  await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(150);
  assert.equal(await p.locator('#ambient-canvas').evaluate(e=>getComputedStyle(e).display),'none');assert.equal(await p.locator('.hero').evaluate(e=>+getComputedStyle(e).opacity),1);
  assert(!await p.locator('.header-depth').count());
  checks.push(`hero fade / contact / initial glow / depth / live reduced-motion ${width}`);assert.deepEqual(errors,[]);
  for(const slug of ['early-explorations','current-works']){
   await p.goto('http://127.0.0.1:9401/collection/'+slug+'/',{waitUntil:'networkidle'});
   await p.locator('.image-button').first().click();await p.waitForSelector('.pswp--ui-visible');
   const grid=slug==='current-works';assert.equal(await p.locator('.pswp.has-info').count(),grid?1:0);
   if(grid){assert(await p.locator('.lightbox-info-title').textContent());assert.match(await p.locator('.lightbox-counter').textContent(),/^01 \/ \d+$/);assert(await p.locator('.pswp__button--arrow--next').isVisible());assert(await p.locator('.pswp__button--arrow--next').evaluate(e=>{const a=e.getBoundingClientRect(),b=e.querySelector('svg').getBoundingClientRect();return b.top>=a.top&&b.bottom<=a.bottom&&getComputedStyle(e.querySelector('path')).stroke!=='none'}));await p.locator('.pswp__button--arrow--next').click();assert.match(await p.locator('.lightbox-counter').textContent(),/^02 \/ \d+$/);await p.locator('.pswp__button--arrow--prev').click();}
   else assert(!await p.locator('.pswp__button--arrow--next').isVisible());
   const close=await p.locator('.pswp__button--close').boundingBox();assert(Math.abs(close.x-(width-74))<2&&close.y===26,JSON.stringify({width,close}));
   await p.screenshot({path:path.join(dir,`${slug}-lightbox-${width}.png`)});
   await p.keyboard.press('Escape');await p.waitForTimeout(200);assert(await p.locator('.image-button').first().evaluate(e=>e===document.activeElement));checks.push(`${slug} source lightbox ${width}`);
  }await p.close();
 }}finally{await browser.close()}fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify({checks,passed:true},null,2));console.log(JSON.stringify({dir,checks,passed:true}));
})().catch(e=>{console.error(e);process.exitCode=1});
