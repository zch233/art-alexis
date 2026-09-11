const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const c=JSON.parse(fs.readFileSync('work/local-access.json'));const b=await chromium.launch({channel:'msedge'});
 try{const p=await b.newPage();await p.goto(c.url+'/wp-login.php');await p.locator('#user_login').fill(c.editor);await p.locator('#user_pass').fill(c.password);await p.locator('#wp-submit').click();await p.waitForURL('**/edit.php?post_type=aa_artwork');
 const moved=[];
 // Only explicit test IDs: recoverable trash, no file deletion.
 for(const id of [18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48]){
  await p.goto(c.url+'/wp-admin/post.php?post='+id+'&action=edit');
  if(await p.locator('#title').count() && /^QA\b/.test(await p.locator('#title').inputValue()) && await p.locator('#delete-action a').count()){
   await p.locator('#delete-action a').click();await p.waitForLoadState('domcontentloaded');moved.push(id);
  }
 }
 console.log(JSON.stringify({movedToTrash:moved}));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
