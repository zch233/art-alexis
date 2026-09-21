const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');
(async()=>{const browser=await chromium.launch({channel:'msedge'});try{
 const p=await browser.newPage({viewport:{width:1440,height:900}});
 await p.route('**/filmx-698c13.webflow.shared.014188d62.css',r=>r.fulfill({path:'work/export-webflow.css',contentType:'text/css'}));
 await p.goto('http://127.0.0.1:9402/',{waitUntil:'load',timeout:60000});await p.waitForTimeout(2000);
 const data=await p.evaluate(()=>{const data=window.Webflow?.require('ix2')?.store?.getState()?.ixData;return {data,items:[...document.querySelectorAll('[data-w-id]')].map(e=>({id:e.dataset.wId,selector:e.className,style:e.getAttribute('style')}))}});
 fs.writeFileSync('work/source-motion.json',JSON.stringify(data,null,2));console.log(JSON.stringify({loaded:!!data.data,items:data.items.length,actions:data.data?Object.keys(data.data.actionLists):[]}));
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
