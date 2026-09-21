const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge'});
 try{for(const fallback of [false,true]){
  const context=await browser.newContext({viewport:{width:1920,height:945},reducedMotion:'reduce'});
  const page=await context.newPage(),cdp=await context.newCDPSession(page),requests=[],errors=[];
  await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  page.on('response',r=>{if(/\.(woff2|ttf)(\?|$)/.test(r.url()))requests.push({url:r.url(),status:r.status()})});
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*.woff2?*',async route=>{if(fallback)return route.abort();await new Promise(resolve=>setTimeout(resolve,1200));await route.continue()});
  await page.goto('http://127.0.0.1:9401/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
  await cdp.send('DOM.enable');await cdp.send('CSS.enable');
  const {root}=await cdp.send('DOM.getDocument');const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector:'.hero-title h1'});
  const {fonts}=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});
  assert(fonts.some(f=>f.isCustomFont&&/Gasoek/.test(f.familyName)&&f.glyphCount>0));
  assert.equal(errors.length,0);assert(requests.some(r=>r.url.includes(fallback?'gasoek.ttf':'gasoek.woff2')&&r.status===200));
  console.log(JSON.stringify({case:fallback?'WOFF2 failure -> TTF fallback':'cold cache + delayed WOFF2',passed:true,renderedFonts:fonts,requests}));await context.close();
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
