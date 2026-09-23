/* global AABulk */
(() => {
  const heading=document.querySelector('.wrap .page-title-action');
  if(heading){const link=document.createElement('a');link.className='page-title-action';link.href=AABulk.url;link.textContent='批量新增';heading.after(link);}
  const form=document.querySelector('#aa-bulk-form');if(!form)return;
  const files=document.querySelector('#aa-bulk-files'),category=document.querySelector('#aa-bulk-category'),list=document.querySelector('#aa-bulk-items'),status=document.querySelector('#aa-bulk-status'),start=form.querySelector('[type=submit]');
  let items=[],busy=false,started=false;
  const publish=document.querySelector('#aa-bulk-publish');
  publish.addEventListener('change',()=>{start.textContent=publish.checked?'创建并直接发布':'创建草稿作品'});
  const el=(tag,text)=>{const node=document.createElement(tag);if(text)node.textContent=text;return node};
  files.addEventListener('change',()=>{
    items.forEach(item=>URL.revokeObjectURL(item.url));items=[];list.replaceChildren();status.textContent='';files.setCustomValidity('');
    if(files.files.length>20){files.setCustomValidity('每批最多20张');files.reportValidity();return;}
    for(const [index,file] of [...files.files].entries()){
      const row=el('li'),preview=el('img');const url=URL.createObjectURL(file);preview.src=url;preview.alt='';preview.width=80;preview.height=80;preview.style.objectFit='contain';
      const label=el('label',file.name+' — 作品标题'),title=el('input');title.id='aa-bulk-title-'+index;label.htmlFor=title.id;title.value=file.name.replace(/\.[^.]+$/,'');title.required=true;title.maxLength=200;
      const progress=el('progress');progress.max=100;progress.value=0;progress.setAttribute('aria-label',file.name+' 上传进度');
      const message=el('span','待上传'),retry=el('button','重试');message.id='aa-bulk-message-'+index;title.setAttribute('aria-describedby',message.id);retry.type='button';retry.className='button';retry.hidden=true;retry.setAttribute('aria-label','重试 '+file.name);
      const invalid=file.size>15*1024*1024?'单张图片不能超过15MB':!['image/jpeg','image/png','image/webp'].includes(file.type)?'请选择 JPG、PNG、静态 WebP 图片':'';
      if(invalid){message.textContent=invalid;files.setCustomValidity('请重新选择符合要求的图片');}
      const item={file,url,title,progress,message,retry,key:crypto.randomUUID(),done:false};items.push(item);row.append(preview,' ',label,' ',title,' ',progress,' ',message,' ',retry);row.style.marginBottom='16px';list.append(row);
      retry.addEventListener('click',()=>run([item]));
    }
  });
  async function upload(item){
    item.retry.hidden=true;item.message.textContent='正在上传…';item.progress.value=0;
    const data=new FormData();data.set('action','aa_bulk');data.set('nonce',AABulk.nonce);data.set('key',item.key);data.set('collection',category.value);data.set('title',item.title.value);data.set('file',item.file);
    data.set('publish',publish.checked?'1':'0');
    try{
      const result=await new Promise((resolve,reject)=>{const xhr=new XMLHttpRequest();xhr.open('POST',AABulk.ajax);xhr.timeout=180000;xhr.upload.onprogress=e=>{if(e.lengthComputable)item.progress.value=e.loaded/e.total*100};xhr.onload=()=>{try{const json=JSON.parse(xhr.responseText);if(!json.success)throw Error(json.data?.message||'会话失效或请求失败，请检查草稿后刷新页面');resolve(json.data)}catch(error){reject(error)}};xhr.onerror=()=>reject(Error('网络中断，可重试此项'));xhr.ontimeout=()=>reject(Error('响应超时，可重试此项（不会重复创建）'));xhr.send(data);});
      item.done=true;item.message.replaceChildren();const link=el('a',result.status==='publish'?'已发布，编辑作品':'已保存草稿，编辑作品');link.href=result.edit;link.target='_blank';link.rel='noopener';item.message.append(link);item.progress.value=100;
    }catch(error){item.message.textContent=error.message;item.retry.hidden=false;}
  }
  async function run(queue){
    publish.disabled=true;
    if(busy)return;busy=true;started=true;start.disabled=true;files.disabled=true;category.disabled=true;items.forEach(item=>{item.title.disabled=true;item.retry.disabled=true});form.setAttribute('aria-busy','true');
    for(const item of queue){if(!item.done)await upload(item);status.textContent=`已完成 ${items.filter(i=>i.done).length} / ${items.length} 件；失败项可单独重试。`;}
    busy=false;form.setAttribute('aria-busy','false');items.forEach(item=>item.retry.disabled=false);start.textContent='本批次已处理';
    if(items.every(item=>item.done)&&!form.querySelector('.aa-next-batch')){const next=el('a','再新增一批');next.className='button aa-next-batch';next.href=AABulk.url;start.after(next);}
  }
  form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity()||!items.length||started)return;run(items)});
  addEventListener('beforeunload',event=>{if(busy||(started&&items.some(i=>!i.done))){event.preventDefault();event.returnValue='';}});
})();
