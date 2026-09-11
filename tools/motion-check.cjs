const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('assert/strict');
(async()=>{const b=await chromium.launch({channel:'msedge'});try{for(const mode of ['mobile','reduced','desktop']){
 const c=await b.newContext({viewport:{width:mode==='desktop'?1440:390,height:844},isMobile:mode!=='desktop',hasTouch:mode!=='desktop',reducedMotion:mode==='reduced'?'reduce':'no-preference'});const p=await c.newPage();await p.goto('http://127.0.0.1:9400/',{waitUntil:'networkidle'});
 const cards=p.locator('.collection-card');assert.equal(await cards.count(),4);
 for(let i=0;i<4;i++){await cards.nth(i).scrollIntoViewIfNeeded();await p.waitForTimeout(800);assert.equal(await cards.nth(i).evaluate(e=>getComputedStyle(e).opacity),'1');assert(await cards.nth(i).locator('img').evaluate(e=>e.complete&&e.naturalWidth>0));}
 await p.screenshot({path:'work/wp-scrolled-'+mode+'.png',fullPage:true});console.log(mode+': all four cards visible after scrolling');await c.close();
}}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
