const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');const assert=require('assert/strict');
(async()=>{const env=Object.fromEntries(fs.readFileSync('work/docker.env','utf8').trim().split(/\r?\n/).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1)];}));
 const base='http://127.0.0.1:9401';const browser=await chromium.launch({channel:'msedge'});const checks=[];
 try{const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
 assert.equal((await page.goto(base,{waitUntil:'networkidle'})).status(),200);assert.equal(await page.locator('.collection-card').count(),4);
 for(const card of await page.locator('.collection-card').all()){await card.scrollIntoViewIfNeeded();await page.waitForTimeout(700);assert(await card.locator('img').evaluate(i=>i.complete&&i.naturalWidth>0));}checks.push('four collections and images');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));checks.push('mobile no overflow');
 await page.goto(base+'/wp-login.php');await page.locator('#user_login').fill('alexis');await page.locator('#user_pass').fill(env.AA_EDITOR_PASSWORD);await page.locator('#wp-submit').click();await page.waitForURL('**/edit.php?post_type=aa_artwork');checks.push('editor login');
 assert.equal((await context.request.get(base+'/wp-admin/plugins.php')).status(),403);checks.push('editor cannot manage plugins');
 assert((await page.locator('#the-list tr.type-aa_artwork').count())>=4);checks.push('artworks remain manageable after source import');
 fs.writeFileSync('work/docker-check.json',JSON.stringify({passed:true,checks},null,2));console.log(JSON.stringify({passed:true,checks}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
