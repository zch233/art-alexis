import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {CustomEase} from 'gsap/CustomEase';
import './source-motion.css';

gsap.registerPlugin(CustomEase);
CustomEase.create('sourceEase','0.25,0.1,0.25,1');

// Values transcribed from the export's inline scripts and ix2 action lists.
export function sourceMotion(){
  const hero=document.querySelector('.hero'),header=document.querySelector('.site-header,.detail-header');
  let active=true,progress=0,intro;
  const headerDepth=document.createElement('span');headerDepth.className='surface-depth header-depth';headerDepth.setAttribute('aria-hidden','true');header?.prepend(headerDepth);
  const layers=document.querySelectorAll('.surface-depth');
  const depth=ScrollTrigger.create({start:0,end:()=>Math.max(520,innerHeight*.72),onUpdate:self=>{
    progress=self.progress*self.progress*(3-2*self.progress);gsap.set(layers,{opacity:progress});
  },invalidateOnRefresh:true});
  const onLoad=()=>{
    if(!active||!hero)return;
    hero.classList.add('intro-playing');
    const tl=intro=gsap.timeline({defaults:{duration:.5,ease:'sourceEase'}});
    tl.fromTo(hero,{opacity:0},{opacity:1,duration:.9},.12)
      .fromTo('.site-header',{y:0,yPercent:-100},{y:0,yPercent:0},.1)
      .fromTo('.hero-title h1',{x:-30,opacity:0},{x:0,opacity:1,clearProps:'transform,opacity'},.4)
      .fromTo('.hero-subtitle p',{x:30,opacity:0},{x:0,opacity:1,clearProps:'transform,opacity'},.5)
      .fromTo('.hero-scroll svg',{opacity:0},{opacity:1,clearProps:'opacity'},.7)
      .call(()=>{document.documentElement.classList.remove('aa-motion-ready');gsap.set('.site-header',{clearProps:'transform'});});
  };
  if(hero){if(document.readyState==='complete')onLoad();else addEventListener('load',onLoad,{once:true});}
  // The export has slideInBottom (100px, 1s, outQuart), not a 16px card nudge.
  const reveals=[];
  document.querySelectorAll('.home-about .section-title-container h2,.home-work .section-title-container h2,.about-intro-wrapper p,.collection-card').forEach(el=>{
    ScrollTrigger.create({trigger:el,start:'top bottom',once:true,onEnter:()=>{
      reveals.push(gsap.fromTo(el,{y:100,opacity:0},{y:0,opacity:1,duration:1,delay:el.matches('.about-intro-wrapper p')?.2:0,ease:'power3.out',clearProps:'transform,opacity'}));
    }});
  });

  const canvas=document.querySelector('#ambient-canvas'),ctx=canvas?.getContext('2d');
  let frame=0,width=0,height=0,dots=[],last=0;
  const mouse={x:innerWidth*.5,y:innerHeight*.35,tx:innerWidth*.5,ty:innerHeight*.35};
  // Cache the two authored gradients; interpolate opacity instead of rebuilding
  // large gradients on every frame. Canvas stays bounded to the viewport.
  const glow=(rgb,core,mid)=>{const c=document.createElement('canvas');c.width=c.height=560;const g=c.getContext('2d');const r=g.createRadialGradient(280,280,0,280,280,280);r.addColorStop(0,`rgba(${rgb},${core})`);r.addColorStop(.45,`rgba(${rgb},${mid})`);r.addColorStop(1,`rgba(${rgb},0)`);g.fillStyle=r;g.fillRect(0,0,560,560);return c;};
  const glowTop=glow('154,107,255',.23,.1),glowDeep=glow('167,122,255',.28,.12);
  const resize=()=>{if(!ctx)return;width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);dots=Array.from({length:Math.min(90,Math.floor(width/14))},()=>({x:Math.random()*width,y:Math.random()*height,r:Math.random()*1.7+.5,a:Math.random()*.28+.08,s:Math.random()*.18+.04}));};
  const draw=time=>{
    frame=0;if(!active||document.hidden||!ctx)return;
    const dt=Math.min(3,last?(time-last)/16.667:1);last=time;
    const easing=1-Math.pow(.92,dt);mouse.x+=(mouse.tx-mouse.x)*easing;mouse.y+=(mouse.ty-mouse.y)*easing;
    ctx.clearRect(0,0,width,height);ctx.globalAlpha=1-progress;ctx.drawImage(glowTop,mouse.x-280,mouse.y-280);ctx.globalAlpha=progress;ctx.drawImage(glowDeep,mouse.x-280,mouse.y-280);ctx.globalAlpha=1;
    const rgb=[178,142,255].map((v,i)=>Math.round(v+([190,158,255][i]-v)*progress)).join(',');
    for(const d of dots){const influence=Math.max(0,1-Math.hypot(d.x-mouse.x,d.y-mouse.y)/340);ctx.beginPath();ctx.arc(d.x,d.y,d.r+influence*1.8,0,Math.PI*2);ctx.fillStyle=`rgba(${rgb},${d.a+influence*(.42+.04*progress)})`;ctx.fill();d.y-=d.s*dt;if(d.y < -4){d.y=height+4;d.x=Math.random()*width;}}
    frame=requestAnimationFrame(draw);
  };
  const start=()=>{cancelAnimationFrame(frame);last=0;frame=0;if(active&&!document.hidden&&ctx)frame=requestAnimationFrame(draw);};
  const pointer=e=>{mouse.tx=e.clientX;mouse.ty=e.clientY;};
  addEventListener('resize',resize,{passive:true});addEventListener('pointermove',pointer,{passive:true});document.addEventListener('visibilitychange',start);resize();start();
  return()=>{active=false;removeEventListener('load',onLoad);intro?.revert();depth.kill();reveals.forEach(t=>t.revert());cancelAnimationFrame(frame);removeEventListener('resize',resize);removeEventListener('pointermove',pointer);document.removeEventListener('visibilitychange',start);ctx?.clearRect(0,0,width,height);headerDepth.remove();hero?.classList.remove('intro-playing');gsap.set(layers,{clearProps:'opacity'});};
}
