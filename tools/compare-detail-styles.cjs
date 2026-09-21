const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
const selectors=['.detail-header-inner','.detail-title','.detail-meta','.detail-body','.detail-gallery-wrap','.detail-gallery','.detail-shot-frame','.detail-shot-hint','.detail-shot figcaption','.cw-card-title','.cw-card-desc','.detail-recommend','.recommend-head','.recommend-title','.recommend-sub','.recommend-grid','.recommend-card','.recommend-card h3','.recommend-card p','.recommend-arrow','.footer-signature'];
const props=['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','textTransform','opacity','padding','marginTop','marginBottom','gap','columnCount','columnGap','borderTopWidth'];
(async()=>{const dir=path.resolve('work/detail-styles-'+Date.now());fs.mkdirSync(dir,{recursive:true});const b=await chromium.launch({channel:'msedge'});const differences=[],checks=[];
try{for(const width of [390,768,1440])for(const slug of ['early-explorations','finding-my-style','creative-experiments','current-works']){
 const pages=[];for(const source of [true,false]){
  const p=await b.newPage({viewport:{width,height:900},reducedMotion:'reduce'});pages.push(p);
  // Same committed font glyphs, served under the reference origin, isolate CSS.
  await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:['Gasoek One','Poppins'].flatMap(f=>(f==='Poppins'?[400,500,600,700]:[400]).map(w=>`@font-face{font-family:'${f}';font-weight:${w};src:url('/__qa-fonts/${f==='Poppins'?'poppins'+(w===400?'':'-'+w):'gasoek'}.woff2')}`)).join('')}));
  await p.route('**/__qa-fonts/*',r=>r.fulfill({path:'wordpress/themes/art-alexis/assets/'+new URL(r.request().url()).pathname.split('/').pop(),contentType:'font/woff2'}));
  await p.goto(source?'http://127.0.0.1:9402/work-detail.html?slug='+slug:'http://127.0.0.1:9401/collection/'+slug+'/',{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
  await p.evaluate(()=>Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode().catch(()=>{})})));
 }
 const read=p=>p.evaluate(({selectors,props})=>Object.fromEntries(selectors.map(s=>{const e=document.querySelector(s);if(!e)return[s,null];const v=getComputedStyle(e);return[s,Object.fromEntries(props.map(k=>[k,v[k].replaceAll('"','')]))]})),{selectors,props});
 const ref=await read(pages[0]),local=await read(pages[1]);
 const geometry=p=>p.evaluate(()=>Object.fromEntries(['.detail-header-inner','.detail-gallery','.detail-recommend','.recommend-grid','.footer-signature'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return[s,{x:r.x,y:r.y,w:r.width,h:r.height}]})));
 const refBox=await geometry(pages[0]),localBox=await geometry(pages[1]);
 for(const s in refBox)for(const k in refBox[s])if(Math.abs(refBox[s][k]-localBox[s][k])>2)differences.push({width,slug,selector:s,property:k,reference:refBox[s][k],local:localBox[s][k]});
 for(const s of selectors)if(ref[s]&&local[s])for(const k of props)if(ref[s][k]!==local[s][k])differences.push({width,slug,selector:s,property:k,reference:ref[s][k],local:local[s][k]});
 if(width!==768){await pages[0].screenshot({path:path.join(dir,`${slug}-${width}-source.png`)});await pages[1].screenshot({path:path.join(dir,`${slug}-${width}-local.png`)});}
 checks.push({width,slug,sourceFigures:await pages[0].locator('.detail-gallery figure').count(),localFigures:await pages[1].locator('.detail-gallery figure').count()});
 for(const p of pages)await p.close();
 }}finally{await b.close()}fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify({checks,differences},null,2));console.log(JSON.stringify({dir,cases:checks.length,differences}));if(differences.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
