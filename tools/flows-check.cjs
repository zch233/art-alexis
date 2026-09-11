const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');const assert=require('assert/strict');
(async()=>{
 const c=JSON.parse(fs.readFileSync('work/local-access.json'));const fixture=JSON.parse(fs.readFileSync('work/integration-result.json')).fixture;const b=await chromium.launch({channel:'msedge'});const editor=await b.newContext();const p=await editor.newPage();const guest=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const g=await guest.newPage();const checks=[];
 await p.goto(c.url+'/wp-login.php');await p.locator('#user_login').fill(c.editor);await p.locator('#user_pass').fill(c.password);await p.locator('#wp-submit').click();await p.waitForURL('**/edit.php?post_type=aa_artwork');
 await p.goto(c.url+'/wp-admin/post.php?post='+fixture+'&action=edit');await p.locator('[name=aa_hidden]').uncheck();await p.locator('#publish').click();await p.waitForLoadState('networkidle');
 try{
  await g.goto(c.url+'/?post_type=aa_collection&p='+fixture);assert.equal(await g.locator('.art-card').count(),12);await g.locator('#load-more').click();await g.waitForFunction(()=>document.querySelectorAll('.art-card').length===14);checks.push('12 -> 14 items, no duplicates');
  await g.locator('.art-card').last().scrollIntoViewIfNeeded();const previous=await g.evaluate(()=>scrollY);await g.locator('.art-card').last().click();await g.locator('[data-back-collection]').first().click();await g.waitForFunction(()=>document.querySelectorAll('.art-card').length===14);await g.waitForTimeout(500);assert(Math.abs((await g.evaluate(()=>scrollY))-previous)<100);checks.push('mobile return restores loaded items and position');
  await p.goto(c.url+'/wp-admin/post-new.php?post_type=aa_artwork');const aa=await p.evaluate(()=>AAAdmin);
  const bad=await editor.request.post(c.url+'/wp-admin/admin-ajax.php',{multipart:{action:'aa_upload',nonce:aa.nonce,post:String(aa.post),file:{name:'pretend.jpg',mimeType:'image/jpeg',buffer:Buffer.from('not an image')}}});assert.equal(bad.status(),400);checks.push('spoofed image rejected');
  const noNonce=await editor.request.post(c.url+'/wp-admin/admin-ajax.php',{form:{action:'aa_upload',nonce:'invalid'}});assert.equal(noNonce.status(),403);checks.push('invalid nonce rejected');
  const anonymous=await guest.request.post(c.url+'/wp-admin/admin-ajax.php',{form:{action:'aa_upload'}});assert(anonymous.status()>=400);checks.push('anonymous upload rejected');
  assert.equal((await guest.request.get(c.url+'/wp-json/wp/v2/aa_artwork')).status(),404);checks.push('no unfiltered content REST endpoint');
 }finally{
  await p.goto(c.url+'/wp-admin/post.php?post='+fixture+'&action=edit');await p.locator('[name=aa_hidden]').check();await p.locator('#publish').click();await p.waitForLoadState('networkidle');
 }
 assert.equal((await guest.request.get(c.url+'/?post_type=aa_collection&p='+fixture)).status(),404);checks.push('hide after browsing returns 404');
 // Put only previously generated, known QA collections and their test works in the trash.
 for(const id of [17,33]){await p.goto(c.url+'/wp-admin/post.php?post='+id+'&action=edit');if(await p.locator('#title').count() && (await p.locator('#title').inputValue())==='QA collection'){await p.locator('#delete-action a').click();await p.waitForLoadState('domcontentloaded');}}
 fs.writeFileSync('work/flows-result.json',JSON.stringify({passed:true,checks},null,2));console.log(JSON.stringify({passed:true,checks}));await b.close();
})().catch(e=>{console.error(e);process.exitCode=1});
