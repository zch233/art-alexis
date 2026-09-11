const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');const assert=require('assert/strict');
(async()=>{
 const credentials=JSON.parse(fs.readFileSync('work/local-access.json','utf8'));const base=credentials.url;
 const browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext();const page=await context.newPage();const errors=[];const report=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:900});
  for(const path of ['/','/about/','/work/','/collection/early-explorations/','/artwork/early-explorations-untitled/']){
   const response=await page.goto(base+path,{waitUntil:'networkidle'});assert.equal(response.status(),200,path);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(800);
   const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,broken:[...document.querySelectorAll('img[src]')].some(i=>i.complete&&!i.naturalWidth)}));assert(!state.overflow,`${width} ${path} overflows`);assert(!state.broken,`${path} broken image`);report.push({width,path,...state});
   if(width!==320)await page.screenshot({path:`work/wp-${width}-${path.replaceAll('/','_')||'home'}.png`,fullPage:true});
   if(path.startsWith('/artwork')){await page.locator('.image-button').first().click();await page.locator('.pswp--open').waitFor();await page.waitForTimeout(700);await page.keyboard.press('Escape');await page.locator('.pswp--open').waitFor({state:'detached'});}
   if(width===390&&path==='/'){await page.locator('.menu').click();assert.equal(await page.locator('.menu').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('.menu').getAttribute('aria-expanded'),'false');}
  }
 }
 // Anonymous hidden routes and API must be unavailable.
 const fixtures=JSON.parse(fs.readFileSync('work/integration-result.json','utf8'));assert.equal((await context.request.get(base+'/?post_type=aa_collection&p='+fixtures.fixture)).status(),404);assert.equal((await context.request.get(base+'/wp-json/art-alexis/v1/collection/'+fixtures.fixture+'/works')).status(),404);
 const editor=await browser.newContext();const admin=await editor.newPage();admin.on('pageerror',e=>errors.push(e.message));await admin.goto(base+'/wp-login.php');await admin.locator('#user_login').fill(credentials.editor);await admin.locator('#user_pass').fill(credentials.password);await admin.locator('#wp-submit').click();await admin.waitForURL('**/edit.php?post_type=aa_artwork');assert.equal(await admin.locator('#menu-plugins').count(),0);
 const denied=await editor.request.get(base+'/wp-admin/plugins.php');assert.equal(denied.status(),403);
 await admin.goto(base+'/wp-admin/post-new.php?post_type=aa_artwork');await admin.locator('#title').fill('Browser upload QA');await admin.locator('#aa_collection').selectOption({label:'Early Explorations'});
 await admin.locator('#aa-files').setInputFiles(['reference/assets/early-explorations.jpg','reference/assets/finding-my-style.jpg']);await admin.waitForFunction(()=>document.querySelectorAll('#aa-gallery li').length===2,{},{timeout:90000});
 await admin.locator('#aa_summary').fill('Upload test — image order and description.');await admin.locator('#aa-gallery li').nth(1).getByRole('button',{name:'上移',exact:true}).click();await admin.locator('#aa-gallery li').first().getByRole('button',{name:'设为封面'}).click();
 await admin.locator('#publish').click();await admin.waitForLoadState('networkidle');const id=new URL(admin.url()).searchParams.get('post');assert(id);report.push({editorUpload:'two images, ordering, cover and publish',id});
 const published=await context.request.get(base+'/?post_type=aa_artwork&p='+id);assert.equal(published.status(),200);assert((await published.text()).includes('Upload test'));
 await admin.screenshot({path:'work/wp-editor.png',fullPage:true});
 // Remove only this QA artwork from public display via standard trash, retain images.
 const trash=admin.locator('#delete-action a');await trash.click();await admin.waitForLoadState('networkidle');assert.equal((await context.request.get(base+'/?post_type=aa_artwork&p='+id)).status(),404);
 assert.equal(errors.length,0,errors.join('\n'));fs.writeFileSync('work/browser-result.json',JSON.stringify({report,errors,passed:true},null,2));console.log(JSON.stringify({passed:true,pageChecks:report.length,errors}));await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
