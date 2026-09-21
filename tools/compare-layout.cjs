const {chromium}=require('C:/Users/gupo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');const path=require('path');
(async()=>{
 const dest=path.resolve('work/layout-'+Date.now());fs.mkdirSync(dest,{recursive:true});
 const browser=await chromium.launch({channel:'msedge'});const report=[];
 try{for(const [name,url] of [['reference','https://283c1159b9d04caf91c12588bbe0c71b.app.workbuddy.link/'],['live','https://artsbyalexis.com/'],['local','http://127.0.0.1:9401/']]){
  for(const width of [1440,390]){
   const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
   try{let response;for(let attempt=0;attempt<3;attempt++){try{response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});break;}catch(e){if(attempt===2)throw e;}}
    await page.waitForTimeout(2500);await page.evaluate(()=>document.fonts.ready);
    for(let y=0;y<await page.evaluate(()=>document.documentElement.scrollHeight);y+=700){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(180);}
    await page.waitForTimeout(900);await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(700);
    if(name==='reference'&&width===1440)fs.writeFileSync(path.join(dest,'reference.html'),await page.content());
    await page.screenshot({path:path.join(dest,`${name}-${width}.png`),fullPage:true});
    const data=await page.evaluate(()=>({title:document.title,text:document.body.innerText.slice(0,5000),width:innerWidth,scrollWidth:document.documentElement.scrollWidth,links:[...document.querySelectorAll('a')].map(a=>({text:a.innerText,url:a.href})),styles:[...document.styleSheets].map(s=>s.href),metrics:[...document.querySelectorAll('header,nav,h1,h2,h3,.hero,.hero-title,.hero-aside,.split,.collection-card,.crop,footer')].map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{tag:e.tagName,cls:e.className,text:e.innerText?.slice(0,100),x:r.x,y:r.y,w:r.width,h:r.height,font:s.fontFamily,size:s.fontSize,display:s.display,padding:s.padding}})}));
    report.push({name,width,status:response?.status(),url:page.url(),errors,...data});
   }catch(e){report.push({name,width,error:e.message});}finally{await page.close();}
  }
 }}finally{await browser.close();}
 fs.writeFileSync(path.join(dest,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({dest,summary:report.map(({name,width,status,title,error,text})=>({name,width,status,title,error,text:text?.slice(0,180)}))}));
})().catch(e=>{console.error(e);process.exitCode=1});
