import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import PhotoSwipe from 'photoswipe';
import 'photoswipe/style.css';
import 'lenis/dist/lenis.css';
import './source-parity.css';
import './detail.css';
import {sourceMotion} from './source-motion';
import './source-lightbox.css';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
document.documentElement.classList.add('aa-js');
const menu = document.querySelector('.menu');
const navigation = document.querySelector('#navigation');
const closeMenu = () => {navigation?.classList.remove('open');menu?.setAttribute('aria-expanded','false');menu?.setAttribute('aria-label','Menu');};
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';navigation.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close menu':'Menu');});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
navigation?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
matchMedia('(min-width:768px)').addEventListener('change',closeMenu);

let lenis;
gsap.registerPlugin(ScrollTrigger);
const mm=gsap.matchMedia();
mm.add('(prefers-reduced-motion: no-preference)',()=>{
  const clearReveals=sourceMotion();
  if(document.querySelector('.hero')&&matchMedia('(pointer:fine)').matches){
    lenis=new Lenis({lerp:.1,anchors:true,autoRaf:false});
    const tick=time=>lenis?.raf(time*1000);gsap.ticker.add(tick);lenis.on('scroll',ScrollTrigger.update);
    const visibility=()=>document.hidden?lenis?.stop():lenis?.start();document.addEventListener('visibilitychange',visibility);
    return()=>{clearReveals();gsap.ticker.remove(tick);document.removeEventListener('visibilitychange',visibility);lenis?.destroy();lenis=null;};
  }
  return clearReveals;
});

// Keep the client's original line paths, not PhotoSwipe's filled toolbar icons.
const sourceIcon=(path,width=1.8)=>`<svg class="pswp__icn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
const galleryRoot=document.querySelector('#art-gallery');
const galleryNavigation=galleryRoot?.dataset.navigation!=='off';
galleryRoot?.addEventListener('click',e=>{const link=e.target.closest('a.image-button');if(link&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey)link.focus({preventScroll:true});},true);
const lightbox=new PhotoSwipeLightbox({gallery:'#art-gallery',children:'a.image-button',pswpModule:PhotoSwipe,mainClass:'source-lightbox',showHideAnimationType:'none',bgOpacity:.95,loop:true,returnFocus:true,zoom:false,counter:false,closeSVG:sourceIcon('M5 5 L19 19 M19 5 L5 19',1.6),arrowPrevSVG:sourceIcon('M15 5 L8 12 L15 19'),arrowNextSVG:sourceIcon('M9 5 L16 12 L9 19'),initialZoomLevel:z=>Math.min(1,z.fit),secondaryZoomLevel:2,maxZoomLevel:4,paddingFn:(viewport,item)=>{const pad=viewport.x<=600?20:48;const extra=item.element?.dataset.grid==='1'?80:0;return{top:pad+extra,bottom:pad+extra,left:pad,right:pad};},closeTitle:'Close image',zoomTitle:'Zoom',arrowPrevTitle:'Previous work',arrowNextTitle:'Next work'});
if(!galleryNavigation){
  lightbox.options.gallery=undefined;lightbox.options.children=undefined;
  galleryRoot?.addEventListener('click',e=>{const link=e.target.closest('a.image-button');if(!link||e.button||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;e.preventDefault();lightbox.loadAndOpen(0,{gallery:link});});
}
lightbox.on('uiRegister',()=>lightbox.pswp.ui.registerElement({name:'caption',order:9,isButton:false,appendTo:'root',onInit:(el,pswp)=>{
  const update=()=>{
    const data=pswp.currSlide?.data.element?.dataset||{};const grid=data.grid==='1';pswp.element.classList.toggle('has-info',grid);el.replaceChildren();
    pswp.element.classList.toggle('has-navigation',galleryNavigation&&pswp.getNumItems()>1);
    if(!grid){el.textContent=data.caption||'';return;}
    const title=document.createElement('div');title.className='lightbox-info-title';title.textContent=data.title||'';
    const desc=document.createElement('p');desc.className='lightbox-info-desc';desc.textContent=data.description||'';
    const count=document.createElement('div');count.className='lightbox-counter';count.textContent=galleryNavigation?`${String(pswp.currIndex+1).padStart(2,'0')} / ${String(pswp.getNumItems()).padStart(2,'0')}`:'';
    el.append(title,desc,count);
  };pswp.on('change',update);update();
}}));
lightbox.on('beforeOpen',()=>lenis?.stop());lightbox.on('destroy',()=>lenis?.start());lightbox.init();

const grid=document.querySelector('#work-grid');
if(grid){
  const button=document.querySelector('#load-more');const status=document.querySelector('#list-status');let page=Number(grid.dataset.page);let pages=Number(grid.dataset.pages);let busy=false;
  const storageKey='aa-list:'+location.pathname;const restoreKey='aa-restore:'+location.pathname;
  const store=()=>{try{sessionStorage.setItem(storageKey,JSON.stringify({page,scroll:scrollY}));}catch{}};
  async function load(){
    if(busy||page>=pages)return false;busy=true;grid.setAttribute('aria-busy','true');button?.setAttribute('aria-disabled','true');status.textContent='Loading artworks…';
    try{
      const nextURL=new URL(location.href);nextURL.searchParams.set('works_page',page+1);
      const response=await fetch(nextURL,{cache:'no-store'});
      if(!response.ok)throw new Error('Request failed');
      const doc=new DOMParser().parseFromString(await response.text(),'text/html');const incoming=doc.querySelector('#work-grid');
      if(!incoming||Number(incoming.dataset.page)!==page+1)throw new Error('Unexpected gallery response');
      const key=e=>`${e.dataset.id}:${e.dataset.imageId||''}`;const existing=new Set([...grid.children].map(key));
      // Server-rendered same-origin figures keep PHP and appended markup identical.
      for(const figure of incoming.children){if(figure.tagName!=='FIGURE'||existing.has(key(figure)))continue;figure.querySelectorAll('script,iframe,object,embed').forEach(e=>e.remove());grid.append(document.importNode(figure,true));existing.add(key(figure));}
      page=Number(incoming.dataset.page);pages=Number(incoming.dataset.pages);grid.dataset.page=page;
      if(button){button.hidden=page>=pages;const url=new URL(location.href);url.searchParams.set('works_page',page+1);button.href=url;}
      status.textContent=page>=pages?'You’ve seen all the works in this collection.':`${grid.children.length} images shown.`;store();ScrollTrigger.refresh();return true;
    }catch{status.textContent='Unable to load artworks. Please try again.';return false;}
    finally{busy=false;grid.removeAttribute('aria-busy');button?.removeAttribute('aria-disabled');}
  }
  button?.addEventListener('click',event=>{event.preventDefault();load();});
  grid.addEventListener('click',e=>{if(e.target.closest('a.art-card'))store();});addEventListener('pagehide',store);
  // Only restore when returning, and re-fetch public data rather than storing stale HTML.
  (async()=>{try{const returning=sessionStorage.getItem(restoreKey)||performance.getEntriesByType('navigation')[0]?.type==='back_forward';sessionStorage.removeItem(restoreKey);if(!returning)return;const saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');if(!saved)return;while(page<Math.min(saved.page,pages)){if(!await load())break;}await Promise.all([...grid.querySelectorAll('img')].map(img=>{img.loading='eager';return img.decode().catch(()=>{})}));if(lenis)lenis.scrollTo(saved.scroll,{immediate:true});else scrollTo(0,saved.scroll);}catch{}})();
}
document.querySelectorAll('[data-back-collection]').forEach(a=>a.addEventListener('click',()=>{try{sessionStorage.setItem('aa-restore:'+new URL(a.href).pathname,'1')}catch{}}));

document.querySelectorAll('.collection-card').forEach(a=>a.addEventListener('click',()=>{try{sessionStorage.setItem('aa-home-scroll',JSON.stringify({path:location.pathname,y:scrollY}));}catch{}}));
document.querySelector('[data-back-home]')?.addEventListener('click',()=>{try{sessionStorage.setItem('aa-home-restore','1')}catch{}});
if(document.querySelector('.hero')){
  (async()=>{try{
    if(!sessionStorage.getItem('aa-home-restore'))return;
    sessionStorage.removeItem('aa-home-restore');const saved=JSON.parse(sessionStorage.getItem('aa-home-scroll')||'null');
    if(saved?.path!==location.pathname)return;
    // Font swap changes the intro's line breaks. Restore only after its layout
    // settles, otherwise browser scroll anchoring moves the saved position.
    await document.fonts.ready;
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    if(lenis)lenis.scrollTo(saved.y,{immediate:true});else scrollTo(0,saved.y);
  }catch{}})();
}

// Match the source's whole-hero pointer target without stealing link clicks.
document.querySelector('.hero')?.addEventListener('click',e=>{
  if(e.target.closest('a,button')||getSelection()?.toString())return;
  const target=document.querySelector('#about');if(lenis)lenis.scrollTo(target);else target?.scrollIntoView({behavior:reduced.matches?'instant':'smooth'});
});
