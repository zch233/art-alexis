/* global wp, jQuery, AAAdmin */
(() => {
  let gallery = AAAdmin.gallery || [];
  const list = document.querySelector('#aa-gallery');
  const value = document.querySelector('#aa-gallery-value');
  const sync = () => { if(value) value.value = JSON.stringify(gallery.map(({id,caption,alt})=>({id,caption,alt}))); };
  const element = (tag,text,cls) => {const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e};
  function render(){
    if(!list)return;list.replaceChildren();
    gallery.forEach((item,index)=>{
      const li=element('li');li.dataset.id=item.id;
      const img=element('img');img.src=item.url;img.alt='图集图片 '+(index+1);li.append(img);
      const fields=element('div');
      for(const [key,label] of [['alt','图片描述（供屏幕阅读器）'],['caption','图片说明（可选）']]){
        const lab=element('label',label);const input=element(key==='caption'?'textarea':'input');input.value=item[key]||'';input.addEventListener('input',()=>{item[key]=input.value;sync()});lab.append(input);fields.append(lab);
      }
      const actions=element('div',null,'aa-actions');
      for(const [label,handler,disabled] of [
        ['上移',()=>{[gallery[index-1],gallery[index]]=[gallery[index],gallery[index-1]];render()},index===0],
        ['下移',()=>{[gallery[index+1],gallery[index]]=[gallery[index],gallery[index+1]];render()},index===gallery.length-1],
        ['设为封面',()=>setCover(item),false],
        ['从图集移除',()=>{gallery.splice(index,1);render()},false]
      ]){const b=element('button',label,'button');b.type='button';b.disabled=disabled;b.addEventListener('click',handler);actions.append(b)}
      fields.append(actions);li.append(fields);list.append(li);
    });sync();
  }
  function setCover(item){const picker=document.querySelector('[name="aa_cover"]')?.closest('.aa-picker');if(picker)updatePicker(picker,item.id,item.url);}
  function updatePicker(picker,id,url){picker.querySelector('input').value=id;const wrap=picker.querySelector('.aa-cover');wrap.replaceChildren();if(url){const img=element('img');img.src=url;img.alt='封面预览';wrap.append(img)}focusPreview();}
  function focusPreview(){const x=document.querySelector('[name="aa_focus_x"]')?.value||50;const y=document.querySelector('[name="aa_focus_y"]')?.value||50;const img=document.querySelector('[name="aa_cover"]')?.closest('.aa-picker').querySelector('img');if(img)img.style.objectPosition=`${x}% ${y}%`;}
  document.querySelectorAll('.aa-picker').forEach(picker=>{
    picker.querySelector('.aa-select').addEventListener('click',()=>{const frame=wp.media({title:'选择图片',library:{type:['image/jpeg','image/png','image/webp']},multiple:false,button:{text:'使用图片'}});frame.on('select',()=>{const a=frame.state().get('selection').first().toJSON();updatePicker(picker,a.id,a.sizes?.medium?.url||a.url)});frame.open()});
    picker.querySelector('.aa-clear').addEventListener('click',()=>updatePicker(picker,0,''));
  });
  document.querySelectorAll('input[type=range]').forEach(input=>input.addEventListener('input',focusPreview));focusPreview();
  document.querySelector('.aa-gallery-select')?.addEventListener('click',()=>{
    const frame=wp.media({title:'添加作品图片',library:{type:['image/jpeg','image/png','image/webp']},multiple:true,button:{text:'添加到图集'}});
    frame.on('select',()=>{frame.state().get('selection').each(a=>{const d=a.toJSON();if(!gallery.some(g=>g.id===d.id))gallery.push({id:d.id,url:d.sizes?.thumbnail?.url||d.url,caption:d.caption||'',alt:d.alt||''})});render()});frame.open();
  });
  if(list)jQuery(list).sortable({handle:'img',placeholder:'aa-sort-placeholder',update:()=>{const byId=new Map(gallery.map(x=>[String(x.id),x]));gallery=[...list.children].map(li=>byId.get(li.dataset.id));render()}});
  let uploading=0;
  document.querySelector('#post-preview')?.addEventListener('click',async event=>{
    event.preventDefault();event.stopImmediatePropagation();sync();
    if(uploading){alert('图片正在上传，请完成后预览。');return;}
    const preview=window.open('about:blank','aa-preview');
    try{const data=new FormData(document.querySelector('#post'));data.set('action','aa_preview');const response=await fetch(AAAdmin.ajax,{method:'POST',body:data});const json=await response.json();if(!json.success)throw new Error(json.data?.message||'预览生成失败');if(preview)preview.location.href=json.data.url;else location.href=json.data.url;}
    catch(error){preview?.close();alert(error.message);}
  },true);
  document.querySelector('#aa-files')?.addEventListener('change',async event=>{
    const files=[...event.target.files];event.target.value='';const status=document.querySelector('#aa-upload-status');
    if(files.length>20){status.textContent='每批最多20张，请重新选择。';return;}
    for(const file of files){
      const row=element('div',null,'aa-upload-row');const name=element('span',file.name);const progress=element('progress');progress.max=100;progress.value=0;progress.setAttribute('aria-label',file.name+' 上传进度');const msg=element('span','等待上传');const retry=element('button','重试','button');retry.type='button';retry.hidden=true;row.append(name,progress,msg,retry);status.append(row);
      const upload=()=>new Promise(resolve=>{
        retry.hidden=true;uploading++;msg.textContent='上传中…';const data=new FormData();data.append('action','aa_upload');data.append('nonce',AAAdmin.nonce);data.append('post',AAAdmin.post);data.append('file',file);
        const xhr=new XMLHttpRequest();xhr.open('POST',AAAdmin.ajax);xhr.timeout=180000;xhr.upload.onprogress=e=>{if(e.lengthComputable)progress.value=e.loaded/e.total*100};
        const fail=text=>{msg.textContent=text;retry.hidden=false;uploading--;resolve()};
        xhr.onload=()=>{let json;try{json=JSON.parse(xhr.responseText)}catch{return fail('服务器响应异常，请重试')}if(!json.success)return fail(json.data?.message||'上传失败');const item=json.data;if(!gallery.some(g=>g.id===item.id))gallery.push(item);render();msg.textContent='已上传，请保存作品';progress.value=100;uploading--;resolve()};xhr.onerror=()=>fail('网络中断，请重试');xhr.ontimeout=()=>fail('上传超时，请检查媒体库后重试');xhr.send(data);
      });retry.addEventListener('click',upload);await upload();
    }
  });
  document.querySelector('#post')?.addEventListener('submit',event=>{sync();if(uploading){event.preventDefault();const status=document.querySelector('#aa-upload-status');let note=status.querySelector('.aa-wait');if(!note){note=element('p','图片正在上传，请完成后保存。','aa-wait');status.prepend(note)}}});
  render();
})();
