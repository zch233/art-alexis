const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');const assert=require('assert/strict');
(async()=>{const b=await chromium.launch({channel:'msedge'});const checks=[];try{
 for(const port of [9402,9403]){const base='http://127.0.0.1:'+port;const c=await b.newContext();const p=await c.newPage();const fixture=JSON.parse(fs.readFileSync('work/vps-browser.json'));
 assert.equal((await p.goto(base+'/?post_type=aa_artwork&p='+fixture.artwork,{waitUntil:'networkidle'})).status(),200);assert(await p.locator('.image-button img').first().evaluate(i=>i.complete&&i.naturalWidth>0));assert.equal((await c.request.get(await p.locator('.image-button').first().getAttribute('href'))).status(),200);
 assert.equal((await c.request.get(base+'/wp-content/uploads/aa-probe.php')).status(),403);
 await p.goto(base+'/wp-login.php');await p.locator('#user_login').fill('alexis');await p.locator('#user_pass').fill(fs.readFileSync('deploy/secrets/editor-password.txt','utf8').trim());await p.locator('#wp-submit').click();await p.waitForURL('**/edit.php?post_type=aa_artwork');assert.equal(await p.locator('#the-list tr.type-aa_artwork').count(),1);checks.push(port+': artwork, original image, editor login, upload PHP block');await c.close();
 }
 fs.writeFileSync('work/vps-restore-result.json',JSON.stringify({passed:true,checks},null,2));console.log(JSON.stringify({passed:true,checks}));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
