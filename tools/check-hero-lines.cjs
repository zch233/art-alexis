const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'msedge'});const dir=path.resolve('work/hero-lines-'+Date.now());fs.mkdirSync(dir,{recursive:true});const checks=[];
try{for(const width of [390,1440]){
 const p=await b.newPage({viewport:{width,height:950}});let release;const hold=new Promise(r=>release=r);
 await p.route('**/assets/site.js*',async r=>{await hold;await r.continue()});
 const loading=p.goto('http://127.0.0.1:9401/',{waitUntil:'load'});
 await p.waitForSelector('.hero',{state:'attached'});await p.waitForTimeout(200);
 assert.equal(await p.locator('.hero').evaluate(e=>+getComputedStyle(e).opacity),0);
 assert.equal(await p.locator('body').evaluate(e=>parseFloat(getComputedStyle(e,'::before').top)),950);
 await p.screenshot({path:path.join(dir,`initial-${width}.png`)});checks.push(`no initial vertical rails ${width}`);
 release();await loading;
 await p.waitForFunction(()=>document.getAnimations().some(a=>a.animationName==='source-line-left'));
 const motion=await p.evaluate(()=>{const a=document.getAnimations().filter(a=>a.animationName?.startsWith('source-'));return a.map(a=>{a.pause();a.currentTime=250;return{name:a.animationName,duration:a.effect.getTiming().duration}})});
 assert(motion.some(x=>x.name==='source-line-left'&&x.duration===500));assert(motion.some(x=>x.name==='source-line-right'));assert(motion.some(x=>x.name==='source-rails'));
 // Keep CSS at its midpoint while the independent GSAP opacity reveal becomes visible.
 await p.waitForTimeout(450);
 assert(await p.locator('.hero').evaluate(e=>+getComputedStyle(e).opacity)>0);
 await p.screenshot({path:path.join(dir,`entering-${width}.png`)});
 await p.evaluate(()=>document.getAnimations().forEach(a=>a.finish()));await p.waitForTimeout(1500);
 const shape=await p.evaluate(()=>{const grid=document.querySelector('.hero-grid').getBoundingClientRect(),top=document.querySelector('.hero-rails-top').getBoundingClientRect(),bottom=document.querySelector('.hero-rails-bottom').getBoundingClientRect();return{grid:{top:grid.top,bottom:grid.bottom},topEnd:top.bottom,bottomStart:bottom.top,lineWidth:parseFloat(getComputedStyle(document.querySelector('.hero-grid'),'::before').width)}});
 assert(Math.abs(shape.topEnd-shape.grid.top)<1);assert(Math.abs(shape.bottomStart-shape.grid.bottom)<1);assert.equal(shape.lineWidth,width);
 await p.screenshot({path:path.join(dir,`final-${width}.png`)});checks.push(`segmented rails and animated viewport lines ${width}`);
 const card=p.locator('.collection-card').first();await card.scrollIntoViewIfNeeded();await p.waitForTimeout(1200);await card.hover();await p.waitForTimeout(350);
 assert(await card.evaluate(e=>{const s=getComputedStyle(e,'::before');return s.borderLeftWidth==='1px'&&s.borderRightWidth==='1px'&&s.zIndex==='3'}));
 await card.screenshot({path:path.join(dir,`hover-${width}.png`)});checks.push(`hover outer frame ${width}`);
 await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await p.locator('.hero-rails').first().evaluate(e=>getComputedStyle(e).animationName),'none');await p.close();
}console.log(JSON.stringify({passed:true,checks,dir}));}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
