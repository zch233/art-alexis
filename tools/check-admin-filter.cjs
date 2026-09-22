const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const env=Object.fromEntries(fs.readFileSync('work/docker.env','utf8').trim().split(/\r?\n/).map(s=>{const i=s.indexOf('=');return[s.slice(0,i),s.slice(i+1)]}));const b=await chromium.launch({channel:'msedge'});const checks=[];
try{const p=await b.newPage();const base='http://127.0.0.1:9401';await p.goto(base+'/wp-login.php');await p.locator('#user_login').fill('alexis');await p.locator('#user_pass').fill(env.AA_EDITOR_PASSWORD);await p.locator('#wp-submit').click();await p.waitForURL('**/edit.php?post_type=aa_artwork');
const rows=()=>p.locator('#the-list tr.type-aa_artwork');const all=await rows().count();assert(all>0);
const expected={};for(const name of await rows().locator('.column-aa_state').allTextContents())expected[name.trim()]=(expected[name.trim()]||0)+1;
const options=await p.locator('#aa-filter option').evaluateAll(es=>es.filter(e=>e.value).map(e=>({value:e.value,label:e.textContent.trim()})));
for(const option of options){await p.locator('#aa-filter').selectOption(option.value);await Promise.all([p.waitForNavigation(),p.locator('#post-query-submit').click()]);assert.equal(rows?await rows().count():0,expected[option.label]||0);assert.equal(new URL(p.url()).searchParams.get('aa_filter_collection'),option.value);assert(!new URL(p.url()).searchParams.has('aa_collection'));checks.push(option.label);}
await p.locator('#aa-filter').selectOption('');await Promise.all([p.waitForNavigation(),p.locator('#post-query-submit').click()]);assert.equal(await rows().count(),all);checks.push('reset all');
const chosen=options.find(o=>expected[o.label]>0);const url=base+'/wp-admin/edit.php?post_type=aa_artwork&aa_filter_collection='+chosen.value;
await p.goto(url+'&s=qa-does-not-exist-xyz');assert.equal(await rows().count(),0);checks.push('search intersects filter');
await p.goto(url+'&orderby=title&order=asc');assert.equal(await rows().count(),expected[chosen.label]);checks.push('sort preserves filter');
await p.goto(url+'&m=190001');assert.equal(await rows().count(),0);checks.push('date intersects filter');
for(const bad of ['-1','invalid','999999999','%5Bbad%5D']){await p.goto(base+'/wp-admin/edit.php?post_type=aa_artwork&aa_filter_collection='+bad);assert.equal(await rows().count(),0)}checks.push('invalid values empty safely');
await p.goto(base+'/wp-admin/edit.php?post_type=aa_collection');const categoryCount=await p.locator('#the-list tr.type-aa_collection').count();await p.goto(base+'/wp-admin/edit.php?post_type=aa_collection&aa_filter_collection='+chosen.value);assert.equal(await p.locator('#the-list tr.type-aa_collection').count(),categoryCount);checks.push('collection list unaffected');
console.log(JSON.stringify({passed:true,checks}));
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
