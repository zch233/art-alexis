const collections = [
  { slug:'early-explorations', title:'Early Explorations', age:'Age 6–12' },
  { slug:'finding-my-style', title:'Finding My Style', age:'Ages 13–14' },
  { slug:'creative-experiments', title:'Creative Experiments', age:'' },
  { slug:'current-works', title:'Current Works', age:'' }
];
const intro = "Hi, I'm Alexis! I've been writing and drawing passionately since I was young. I adore creating, as the only limitation is my own mind. Creativity makes me feel free, and I love linking my art and writing through story.";
const params = new URLSearchParams(location.search);
const favicon=document.createElement('link');favicon.rel='icon';favicon.href='data:,';document.head.append(favicon);
const page = params.get('page') || 'home';
const selected = collections.find(c=>c.slug===params.get('collection')) || collections[0];
const link = (p,c)=>`?page=${p}${c?'&collection='+c.slug:''}`;
const photo = c=>`assets/${c.slug}.jpg`;
const card = (c,i)=>`<a class="collection-card" href="${link('collection',c)}"><div class="crop"><img src="${photo(c)}" alt="Artwork from ${c.title}" loading="lazy"></div><div class="collection-label"><span class="number">0${i+1} / COLLECTION</span><h3>${c.title}</h3><div class="bottom"><p>${c.age || 'Art & stories'} · 1 artwork</p><span class="arrow" aria-hidden="true">↗</span></div></div></a>`;
const heading = (label,title,desc='')=>`<section class="section-heading"><p class="eyebrow">${label}</p><h1>${title}</h1>${desc?`<div class="subrow"><p>${desc}</p></div>`:''}</section>`;
const views = {
home:()=>`<section class="hero"><div class="hero-title"><h1>ALEXIS</h1></div><div class="hero-aside"><p>Arts by Alexis</p><a href="#about" aria-label="Explore the page">↓</a></div></section><section class="split" id="about"><div><p class="eyebrow">ART & STORIES</p><h2>ABOUT</h2></div><div><p>${intro}</p><a class="text-link" href="${link('about')}">More about me ↗</a></div></section>${heading('Explore the collections','WORK')}${collections.map(card).join('')}<a class="all-work" href="${link('work')}">See more work <span aria-hidden="true">↗</span></a>`,
work:()=>`${heading('Art & stories','WORK','Explore my art through four collections.')}${collections.map(card).join('')}`,
about:()=>`${heading('A little about me','ABOUT')}<section class="split"><div class="about-left"><div class="about-mark">ART &<br>STORIES.</div></div><div><p class="about-intro">${intro}</p><a class="text-link" href="${link('work')}">Explore my work ↗</a></div></section>`,
collection:()=>`${heading('Collection / '+(collections.indexOf(selected)+1).toString().padStart(2,'0'),selected.title,selected.age || 'Art & stories')}<section class="work-grid"><a class="art-card" href="${link('artwork',selected)}"><div class="crop"><img src="${photo(selected)}" alt="Untitled — ${selected.title}"></div><div class="art-label"><div><h3>Untitled</h3><p>${selected.title}</p></div><span class="arrow" aria-hidden="true">↗</span></div></a></section><p class="end-list">1 artwork · You’ve seen all the works in this collection.</p><a class="all-work" href="${link('work')}">← All collections</a>`,
artwork:()=>`<section class="detail-heading"><a class="back" href="${link('collection',selected)}">← ${selected.title}</a><div class="detail-info"><div><p class="eyebrow">ARTWORK / 01</p><h1>UNTITLED</h1></div><p>${selected.title}${selected.age?'<br>'+selected.age:''}</p></div></section><figure class="art-figure"><button class="image-button" aria-label="View Untitled enlarged"><img src="${photo(selected)}" alt="Untitled — artwork from ${selected.title}"></button><figcaption><span>Untitled</span><span>Tap image to take a closer look ↗</span></figcaption></figure><div class="detail-return"><a class="text-link" href="${link('collection',selected)}">← Back to ${selected.title}</a></div>`
};
document.querySelector('#main').innerHTML = (views[page]||views.home)();
document.title = `ALEXIS — ${page==='collection'?selected.title:page==='artwork'?'Untitled':page.charAt(0).toUpperCase()+page.slice(1)} · Design preview`;
document.querySelectorAll('nav a').forEach(a=>{if(a.getAttribute('href')===link(page))a.setAttribute('aria-current','page')});
const menu=document.querySelector('.menu');menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));document.querySelector('nav').classList.toggle('open',open);menu.textContent=open?'Close':'Menu'});
const viewer=document.querySelector('#viewer');document.querySelector('.image-button')?.addEventListener('click',()=>{const img=viewer.querySelector('img');img.src=photo(selected);img.alt=`Untitled — ${selected.title}`;viewer.showModal()});document.querySelector('#close-viewer').addEventListener('click',()=>viewer.close());
// Preview uses ordinary navigation. Production list restoration includes pagination state.
try{const key='preview-scroll:'+location.search;addEventListener('pagehide',()=>sessionStorage.setItem(key,String(scrollY)));if(performance.getEntriesByType('navigation')[0]?.type==='back_forward'){addEventListener('load',()=>scrollTo(0,Number(sessionStorage.getItem(key)||0)))}}catch{}
