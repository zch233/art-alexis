const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');const assert=require('assert/strict');
(async()=>{const base='http://127.0.0.1:9402',b=await chromium.launch({channel:'msedge'});const checks=[];
 try{const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const p=await c.newPage();
 assert.equal((await p.goto(base,{waitUntil:'networkidle'})).status(),200);assert.equal(await p.locator('.collection-card').count(),0);checks.push('empty site without private assets works');
 for(const path of ['/wp-config.php','/xmlrpc.php','/.env'])assert.equal((await c.request.get(base+path)).status(),404);checks.push('private paths blocked');
 await p.goto(base+'/wp-login.php');await p.locator('#user_login').fill('alexis');await p.locator('#user_pass').fill(fs.readFileSync('deploy/secrets/editor-password.txt','utf8').trim());await p.locator('#wp-submit').click();await p.waitForURL('**/edit.php?post_type=aa_artwork');
 assert.equal((await c.request.get(base+'/wp-admin/plugins.php')).status(),403);checks.push('editor login and permissions');
 await p.goto(base+'/wp-admin/post-new.php?post_type=aa_collection');await p.locator('#title').fill('VPS validation');await p.locator('#publish').click();await p.waitForLoadState('networkidle');const collection=new URL(p.url()).searchParams.get('post');
 await p.goto(base+'/wp-admin/post-new.php?post_type=aa_artwork');await p.locator('#title').fill('VPS upload verification');await p.locator('#aa_collection').selectOption(collection);await p.locator('#aa-files').setInputFiles('reference/assets/early-explorations.jpg');await p.waitForFunction(()=>document.querySelectorAll('#aa-gallery li').length===1,{},{timeout:90000});await p.locator('#publish').click();await p.waitForLoadState('networkidle');const artwork=new URL(p.url()).searchParams.get('post');checks.push('upload and publish on Apache/MySQL');
 const guest=await b.newContext();const g=await guest.newPage();assert.equal((await g.goto(base+'/?post_type=aa_artwork&p='+artwork,{waitUntil:'networkidle'})).status(),200);assert(await g.locator('.image-button img').first().evaluate(i=>i.complete&&i.naturalWidth>0));checks.push('published image accessible');
 fs.writeFileSync('work/vps-browser.json',JSON.stringify({passed:true,checks,collection,artwork},null,2));console.log(JSON.stringify({passed:true,checks,collection,artwork}));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
