const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
(async()=>{const dir=path.resolve('work/hover-'+Date.now());fs.mkdirSync(dir,{recursive:true});const b=await chromium.launch({channel:'msedge'});const report=[];
for(const width of [390,1440])for(const source of [true,false]){
 const p=await b.newPage({viewport:{width,height:950},reducedMotion:'reduce'});
 await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:['Gasoek One','Poppins'].flatMap(f=>(f==='Poppins'?[400,500,600,700]:[400]).map(w=>`@font-face{font-family:'${f}';font-weight:${w};src:url('/__qa-fonts/${f==='Poppins'?'poppins'+(w===400?'':'-'+w):'gasoek'}.woff2')}`)).join('')}));
 await p.route('**/__qa-fonts/*',r=>r.fulfill({path:'wordpress/themes/art-alexis/assets/'+new URL(r.request().url()).pathname.split('/').pop(),contentType:'font/woff2'}));
 await p.goto(source?'http://127.0.0.1:9402/index.html':'http://localhost:9401/',{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
 for(const [name,selector] of [['card',source?'.work-card-wrap':'.collection-card'],['contact',source?'.footer-c2a-button':'.contact'],['more',source?'.button':'.all-work'],...(width>767?[['header-contact',source?'.navbar-contact-button-wrapper':'.header-contact']]:[])]){
  const e=p.locator(selector).first();await e.scrollIntoViewIfNeeded();await p.mouse.move(0,0);await p.waitForTimeout(500);
  for(const state of ['normal','hover']){if(state==='hover'){await e.hover();await p.waitForTimeout(600)}
   report.push({width,source,name,state,styles:await e.evaluate(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{padding:s.padding,font:s.fontFamily,height:r.height,width:r.width,border:s.border,images:[...e.querySelectorAll('img')].map(x=>x.src)}})});
   await e.screenshot({path:path.join(dir,`${source?'source':'local'}-${name}-${width}-${state}.png`)});
  }
 }await p.close();
}await b.close();fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2));
const assert=require('node:assert/strict');for(const ref of report.filter(x=>x.source)){const local=report.find(x=>!x.source&&x.width===ref.width&&x.name===ref.name&&x.state===ref.state);assert.equal(local.styles.padding,ref.styles.padding,JSON.stringify(ref));for(const key of ['height','width'])assert(Math.abs(local.styles[key]-ref.styles[key])<=2,JSON.stringify({ref,local}));}
console.log('PASS hover paddings/geometry '+dir)})().catch(e=>{console.error(e);process.exitCode=1});
