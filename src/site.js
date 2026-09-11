import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import PhotoSwipe from 'photoswipe';
import 'photoswipe/style.css';
import 'lenis/dist/lenis.css';
import './site.css';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const menu = document.querySelector('.menu');
const navigation = document.querySelector('#navigation');
const closeMenu = () => {navigation?.classList.remove('open');menu?.setAttribute('aria-expanded','false');if(menu)menu.textContent='Menu';};
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';navigation.classList.toggle('open',open);menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Close':'Menu';});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
navigation?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});

let lenis;
gsap.registerPlugin(ScrollTrigger);
const mm=gsap.matchMedia();
mm.add('(prefers-reduced-motion: no-preference)',()=>{
  const intro=gsap.timeline({defaults:{duration:.65,ease:'power3.out'}});
  intro.from('.hero-title h1, .section-heading h1, .detail-info h1',{y:24,autoAlpha:0,clearProps:'all'});
  document.querySelectorAll('.collection-card').forEach(card=>gsap.from(card,{y:24,opacity:0,duration:.55,clearProps:'all',scrollTrigger:{trigger:card,start:'top 94%',once:true}}));
  if(matchMedia('(pointer:fine)').matches){
    lenis=new Lenis({lerp:.12,anchors:true,autoRaf:false});
    const tick=time=>lenis?.raf(time*1000);gsap.ticker.add(tick);lenis.on('scroll',ScrollTrigger.update);
    const visibility=()=>document.hidden?lenis?.stop():lenis?.start();document.addEventListener('visibilitychange',visibility);
    return()=>{gsap.ticker.remove(tick);document.removeEventListener('visibilitychange',visibility);lenis?.destroy();lenis=null;};
  }
});

const lightbox=new PhotoSwipeLightbox({gallery:'#art-gallery',children:'a.image-button',pswpModule:PhotoSwipe,showHideAnimationType:reduced.matches?'none':'fade',bgOpacity:1,loop:false,returnFocus:true,initialZoomLevel:'fit',secondaryZoomLevel:2,maxZoomLevel:4,closeTitle:'Close',zoomTitle:'Zoom',arrowPrevTitle:'Previous image',arrowNextTitle:'Next image'});
lightbox.on('beforeOpen',()=>lenis?.stop());lightbox.on('destroy',()=>lenis?.start());lightbox.init();

const grid=document.querySelector('#work-grid');
if(grid){
  const button=document.querySelector('#load-more');const status=document.querySelector('#list-status');let page=Number(grid.dataset.page);let pages=Number(grid.dataset.pages);let busy=false;
  const storageKey='aa-list:'+location.pathname;const restoreKey='aa-restore:'+location.pathname;
  const store=()=>{try{sessionStorage.setItem(storageKey,JSON.stringify({page,scroll:scrollY}));}catch{}};
  function card(item){
    const a=document.createElement('a');a.className='art-card';a.href=item.url;a.dataset.id=item.id;
    const crop=document.createElement('div');crop.className='crop';
    if(item.image){const img=document.createElement('img');img.src=item.image;img.srcset=item.srcset;img.sizes='(max-width:767px) 100vw, 50vw';img.alt=item.alt;img.loading='lazy';img.style.objectPosition=item.focus;crop.append(img)}else{crop.textContent='Image coming soon';}
    const label=document.createElement('div');label.className='art-label';const title=document.createElement('h2');title.textContent=item.title;const arrow=document.createElement('span');arrow.className='arrow';arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');label.append(title,arrow);a.append(crop,label);return a;
  }
  async function load(){
    if(busy||page>=pages)return false;busy=true;grid.setAttribute('aria-busy','true');button?.setAttribute('aria-disabled','true');status.textContent='Loading artworks…';
    try{
      const response=await fetch(`${AA.api}${grid.dataset.collection}/works?page=${page+1}`,{cache:'no-store'});
      if(!response.ok)throw new Error('Request failed');const data=await response.json();
      const existing=new Set([...grid.children].map(x=>Number(x.dataset.id)));for(const item of data.items)if(!existing.has(item.id))grid.append(card(item));
      page=data.page;pages=data.pages;grid.dataset.page=page;
      if(button){button.hidden=page>=pages;const url=new URL(location.href);url.searchParams.set('works_page',page+1);button.href=url;}
      status.textContent=page>=pages?'You’ve seen all the works in this collection.':`${grid.children.length} artworks shown.`;store();ScrollTrigger.refresh();return true;
    }catch{status.textContent='Unable to load artworks. Please try again.';return false;}
    finally{busy=false;grid.removeAttribute('aria-busy');button?.removeAttribute('aria-disabled');}
  }
  button?.addEventListener('click',event=>{event.preventDefault();load();});
  grid.addEventListener('click',e=>{if(e.target.closest('a.art-card'))store();});addEventListener('pagehide',store);
  // Only restore when returning, and re-fetch public data rather than storing stale HTML.
  (async()=>{try{const returning=sessionStorage.getItem(restoreKey)||performance.getEntriesByType('navigation')[0]?.type==='back_forward';sessionStorage.removeItem(restoreKey);if(!returning)return;const saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');if(!saved)return;while(page<Math.min(saved.page,pages)){if(!await load())break;}await Promise.all([...grid.querySelectorAll('img')].map(img=>{img.loading='eager';return img.decode().catch(()=>{})}));if(lenis)lenis.scrollTo(saved.scroll,{immediate:true});else scrollTo(0,saved.scroll);}catch{}})();
}
document.querySelectorAll('[data-back-collection]').forEach(a=>a.addEventListener('click',()=>{try{sessionStorage.setItem('aa-restore:'+new URL(a.href).pathname,'1')}catch{}}));

// Small hero-only field, paused off-screen or when hidden. Mobile uses fewer particles.
const canvas=document.querySelector('#ambient-canvas');
if(canvas){
  const ctx=canvas.getContext('2d');let frame=0;let visible=false;let width=0,height=0,dots=[];let pointer={x:0,y:0};
  const fine=matchMedia('(pointer:fine)').matches;
  const resize=()=>{const box=canvas.parentElement.getBoundingClientRect();width=box.width;height=box.height;const dpr=Math.min(devicePixelRatio,1.5);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);dots=Array.from({length:fine?32:10},()=>({x:Math.random()*width,y:Math.random()*height,r:Math.random()*1.4+.5}));};
  const draw=()=>{frame=0;if(!visible||document.hidden||reduced.matches)return;ctx.clearRect(0,0,width,height);ctx.fillStyle='rgba(190,158,255,.35)';for(const d of dots){d.y-=.12;if(d.y<0)d.y=height;ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,Math.PI*2);ctx.fill();}if(fine&&pointer.x){const glow=ctx.createRadialGradient(pointer.x,pointer.y,0,pointer.x,pointer.y,180);glow.addColorStop(0,'rgba(154,107,255,.15)');glow.addColorStop(1,'rgba(154,107,255,0)');ctx.fillStyle=glow;ctx.fillRect(pointer.x-180,pointer.y-180,360,360);}frame=requestAnimationFrame(draw);};
  const start=()=>{if(frame)cancelAnimationFrame(frame);frame=0;if(reduced.matches)ctx.clearRect(0,0,width,height);else draw();};
  new ResizeObserver(resize).observe(canvas.parentElement);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;start();}).observe(canvas);
  canvas.parentElement.addEventListener('pointermove',e=>{if(fine){const box=canvas.getBoundingClientRect();pointer={x:e.clientX-box.left,y:e.clientY-box.top}}});
  document.addEventListener('visibilitychange',start);reduced.addEventListener('change',start);resize();
}
