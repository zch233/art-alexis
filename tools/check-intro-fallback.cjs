const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'msedge'});try{
 const p=await b.newPage();await p.route('**/assets/site.js?*',r=>r.abort());
 await p.goto('http://127.0.0.1:9401/',{waitUntil:'load'});
 await p.waitForFunction(()=>!document.documentElement.classList.contains('aa-motion-ready'));
 assert.equal(await p.locator('.hero').evaluate(e=>getComputedStyle(e).opacity),'1');
 assert.equal(await p.locator('.site-header').evaluate(e=>getComputedStyle(e).transform),'none');
 console.log('PASS: failed animation bundle does not leave the home page hidden');
 }finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
