const revision=new URL(import.meta.url).searchParams.get('v')||'dev';
const [{swipeDirection},{animateRow,cancelRow}]=await Promise.all([import(`./swipe.mjs?v=${revision}`),import(`./scroll.mjs?v=${revision}`)]);
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={funnel:'M3 4h14l-5.5 6v5l-3 1v-6Z',folder:'M2.5 6V4.5h5l2 2h8v9a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1V6Z',chevronDown:'m6 8 4 4 4-4',chevronRight:'m8 5 5 5-5 5',chevronLeft:'m12 5-5 5 5 5',arrowLeft:'M16 10H4m5-5-5 5 5 5',arrowRight:'M4 10h12m-5-5 5 5-5 5',arrowUpRight:'M5 15 15 5M5 5h10v10',bookmark:'M5.5 3.5h9v13l-4.5-3-4.5 3Z',close:'m5 5 10 10M15 5 5 15',plus:'M10 4v12M4 10h12',minus:'M4 10h12',search:'M14 14l3 3M15 8.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z',filter:'M3 6h14M3 14h14M7 3v6m6 2v6',check:'m4.5 10 3.5 3.5 7.5-7.5',moon:'M16.5 11.7A7 7 0 0 1 8.3 3.5a7 7 0 1 0 8.2 8.2Z',sun:'M10 1.5v2m0 13v2M1.5 10h2m13 0h2M4 4l1.5 1.5m9 9L16 16M4 16l1.5-1.5m9-9L16 4M14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',system:'M3 3.5h14v10H3ZM10 13.5v3m-4 0h8'};
const icon=n=>n==='appearance'?'<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="M10 3a7 7 0 0 0 0 14Z" fill="currentColor" stroke="none"/></svg>':`<svg viewBox="0 0 20 20" aria-hidden="true"><path d="${paths[n]||paths.plus}"/></svg>`;
function hydrateIcons(){document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));}
const types=['All images','Photo + graphic','Cinematic','Photography','3D / material','Website / editorial'];
const scheme=matchMedia('(prefers-color-scheme: dark)');
let items=[],config={groups:[],collections:{}},route='all',type=types[0],saved=new Set(),viewerItems=[],viewerIndex=0,searchItems=[],searchQuery='',toastTimer,openerId,hasRendered=false,imageVersion=0;
const rowPositions={},pagePositions={},rowTargets=new WeakMap(),rowObservers=[],menuTimers={},dialogClosures=new Map();
try{const v=JSON.parse(localStorage.getItem('reference-room-saved-v1')||'[]');if(Array.isArray(v))saved=new Set(v.filter(x=>typeof x==='string'));}catch{}
let appearance='system';
const name=id=>config.collections[id]?.name||id;
const groupFor=id=>config.groups.find(g=>g.collections.includes(id));
const matchesType=r=>type===types[0]||r.type===type;
const dateText=value=>{if(!value)return 'Date not recorded';const d=new Date(value+'T12:00:00Z');return Number.isNaN(d.valueOf())?value:new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(d);};
function safeHref(url){try{const u=new URL(url);return u.protocol==='https:'?u.href:'#';}catch{return '#';}}
function toast(s){clearTimeout(toastTimer);$('toast').textContent=s;$('toast').classList.add('visible');toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2100);}
function menuOption(label,attrs,active,leading='',trailing=''){return `<button class="menu-item" ${attrs} aria-pressed="${active}"><span class="menu-item-label">${leading?icon(leading):''}<span>${esc(label)}</span></span><span class="menu-trailing">${trailing}<span class="menu-check">${icon('check')}</span></span></button>`;}
function setAppearance(choice){
  appearance=choice;const theme=choice==='system'?(scheme.matches?'dark':'light'):choice;
  document.documentElement.classList.add('theme-changing');document.documentElement.dataset.theme=theme;document.documentElement.dataset.appearance=choice;
  document.querySelector('meta[name="theme-color"]').content=theme==='dark'?'#151618':'#fafaf9';
  $('appearance-icon').innerHTML=icon(theme==='dark'?'sun':'moon');
  const label=`Switch to ${theme==='dark'?'light':'dark'} mode`;
  $('appearance-button').title=label;$('appearance-button').setAttribute('aria-label',label);
  setTimeout(()=>document.documentElement.classList.remove('theme-changing'),220);
}
scheme.addEventListener('change',()=>{if(appearance==='system')setAppearance('system');});
const menus={'browse-menu':'browse-button','treatment-menu':'treatment-button'};
function positionMenu(id){const el=$(id),anchor=$(menus[id]),r=anchor.getBoundingClientRect();const width=el.offsetWidth,height=el.offsetHeight;const left=Math.max(8,Math.min(innerWidth-width-8,r.right-width));const top=r.bottom+8+height>innerHeight-8?Math.max(8,r.top-height-8):r.bottom+8;el.style.setProperty('--popover-x',`${left}px`);el.style.setProperty('--popover-y',`${top}px`);el.style.setProperty('--popover-origin',`${r.right-left-18}px ${top<r.top?'bottom':'top'}`);}
function closeMenu(id,immediate=false){const el=$(id);el.inert=true;clearTimeout(menuTimers[id]);$(menus[id]).setAttribute('aria-expanded','false');if(el.hidden)return;if(immediate){el.hidden=true;el.classList.remove('is-closing');return;}el.classList.add('is-closing');menuTimers[id]=setTimeout(()=>{el.hidden=true;el.classList.remove('is-closing');},130);}
function closeMenus(immediate=false){Object.keys(menus).forEach(id=>closeMenu(id,immediate));}
function toggleMenu(id,focus=false){const el=$(id),open=el.hidden||el.classList.contains('is-closing');closeMenus(true);if(!open)return;clearTimeout(menuTimers[id]);el.classList.remove('is-closing');el.hidden=false;el.inert=false;positionMenu(id);$(menus[id]).setAttribute('aria-expanded','true');if(focus)el.querySelector('button,a')?.focus();}
Object.entries(menus).forEach(([id,button])=>{$(button).addEventListener('click',e=>toggleMenu(id,e.detail===0));$(button).addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();toggleMenu(id,true);}});$(id).addEventListener('keydown',e=>{const choices=[...$(id).querySelectorAll('button,a')];let index=choices.indexOf(document.activeElement);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();choices[(index+(e.key==='ArrowDown'?1:-1)+choices.length)%choices.length]?.focus();}if(e.key==='Home'||e.key==='End'){e.preventDefault();choices[e.key==='Home'?0:choices.length-1]?.focus();}});});
window.addEventListener('resize',()=>Object.keys(menus).forEach(id=>{if(!$(id).hidden)positionMenu(id);}));
window.addEventListener('scroll',()=>closeMenus(),{passive:true});
document.addEventListener('focusin',e=>Object.entries(menus).forEach(([id,button])=>{if(!$(id).hidden&&!e.target.closest('#'+id)&&!e.target.closest('#'+button))closeMenu(id);}));
function updateSaved(){
  const count=items.filter(r=>saved.has(r.id)).length;$('saved-count').textContent=count;$('saved-count').classList.toggle('is-empty',count===0);
  document.querySelectorAll('[data-save]').forEach(b=>{const active=saved.has(b.dataset.save);b.setAttribute('aria-pressed',active);b.setAttribute('aria-label',`${active?'Unsave':'Save'} ${items.find(r=>r.id===b.dataset.save)?.title||'image'}`);});
  const r=viewerItems[viewerIndex];if(r){$('viewer-save').innerHTML=icon('bookmark')+`<span class="save-label">${saved.has(r.id)?'Saved':'Save'}</span>`;$('viewer-save').setAttribute('aria-pressed',saved.has(r.id));$('viewer-save').setAttribute('aria-label',saved.has(r.id)?'Unsave image':'Save image');}
}
function refreshSavedGrid(){
  const active=document.activeElement,key=active?.dataset.save?'save':active?.dataset.image?'image':null;
  const id=key?active.dataset[key]:null,selector=key?`[data-${key}]`:null;
  const previous=selector?[...$('gallery').querySelectorAll(selector)]:[],index=previous.indexOf(active);
  renderPage();
  if(index>=0){const remaining=[...$('gallery').querySelectorAll(selector)];const next=remaining.find(button=>button.dataset[key]===id)||remaining[Math.min(index,remaining.length-1)]||$('empty-state').querySelector('a');next.focus({preventScroll:true});}
}
function saveImage(id){
  const had=saved.has(id);let persists=true;
  try{const latest=JSON.parse(localStorage.getItem('reference-room-saved-v1')||'[]');if(Array.isArray(latest))saved=new Set(latest.filter(value=>typeof value==='string'));}catch{}
  had?saved.delete(id):saved.add(id);
  try{localStorage.setItem('reference-room-saved-v1',JSON.stringify([...saved]));}catch{persists=false;}
  updateSaved();toast(had?(persists?'Removed from saved':'Removed for this visit'):(persists?'Image saved':'Saved for this visit'));
  if(route==='saved')refreshSavedGrid();
  {
    const buttons=[...document.querySelectorAll(`[data-save="${CSS.escape(id)}"]`)];
    if($('viewer').open&&viewerItems[viewerIndex]?.id===id)buttons.push($('viewer-save'));
    buttons.forEach(button=>{const mark=button.querySelector('svg');mark?.getAnimations().forEach(a=>a.cancel());mark?.animate([{transform:'scale(1)'},{transform:'scale(.84)',offset:.35},{transform:'scale(1)'}],{duration:180,easing:'cubic-bezier(.16,1,.3,1)'});});
  }
}
window.addEventListener('storage',event=>{
  if(event.key!=='reference-room-saved-v1')return;
  try{const value=JSON.parse(event.newValue||'[]');if(!Array.isArray(value))return;saved=new Set(value.filter(id=>typeof id==='string'&&(!items.length||items.some(item=>item.id===id))));updateSaved();if(route==='saved')refreshSavedGrid();}catch{}
});
function previewAttributes(r,sizes){return r.thumbnailSmall?`srcset="${esc(r.thumbnailSmall)} ${r.thumbnailSmallWidth}w, ${esc(r.thumbnail)} ${r.thumbnailWidth}w" sizes="${sizes}"`:'';}
function galleryImageSize(r){
  if(config.collections[route]||route==='saved')return '(max-width:600px) calc((100vw - 53px) / 2), (max-width:900px) calc((100vw - 66px) / 2), (min-width:1500px) calc((100vw - 156px) / 4), calc((100vw - 108px) / 3)';
  const width=Math.min(window.innerWidth-40,620,Math.max(175,(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--row-height'))||230)*r.width/r.height));
  return `${Math.ceil(width)}px`;
}
function viewerSource(r){return r.medium&&window.innerWidth*(window.devicePixelRatio||1)<=1440?r.medium:r.image;}
function card(r){return `<figure class="image-card" style="--ratio:${r.width/r.height}"><button class="thumb" data-image="${esc(r.id)}" aria-label="Open ${esc(r.title)}"><img src="${esc(r.thumbnail)}" ${previewAttributes(r,galleryImageSize(r))} alt="${esc(r.alt)}" width="${r.width}" height="${r.height}" loading="lazy" decoding="async" draggable="false"></button><figcaption><span class="image-title" title="${esc(r.title)}">${esc(r.title)}</span><button class="card-save" data-save="${esc(r.id)}" aria-label="${saved.has(r.id)?'Unsave':'Save'} ${esc(r.title)}" aria-pressed="${saved.has(r.id)}">${icon('bookmark')}</button></figcaption></figure>`;}
function row(id,refs){return `<section class="category-section" aria-labelledby="row-title-${esc(id)}"><div class="row-heading"><a class="row-title" href="#${esc(id)}"><h2 id="row-title-${esc(id)}">${esc(name(id))}</h2><small>${refs.length}</small></a><div class="row-controls"><a class="control control-quiet see-all" href="#${esc(id)}"><span>View all</span>${icon('arrowUpRight')}</a><div class="row-nav" aria-label="${esc(name(id))} row navigation"><button class="control row-arrow" data-row="${esc(id)}" data-step="-1" aria-label="Previous ${esc(name(id))} images">${icon('chevronLeft')}</button><button class="control row-arrow" data-row="${esc(id)}" data-step="1" aria-label="More ${esc(name(id))} images">${icon('chevronRight')}</button></div></div></div><div class="row-viewport"><div class="image-row" data-row-id="${esc(id)}" role="group" tabindex="0" aria-label="${esc(name(id))} images; scroll horizontally">${refs.map(card).join('')}</div><span class="row-edge row-edge-left" aria-hidden="true"></span><span class="row-edge row-edge-right" aria-hidden="true"></span></div></section>`;}
function availableForRoute(){if(route==='saved')return items.filter(r=>saved.has(r.id));if(config.collections[route])return items.filter(r=>r.company===route);const g=config.groups.find(g=>g.id===route);return g?items.filter(r=>g.collections.includes(r.company)):items;}
function renderPage(){
  document.querySelectorAll('.image-row').forEach(cancelRow);rowObservers.splice(0).forEach(o=>o.disconnect());
  const refs=availableForRoute().filter(matchesType),collection=config.collections[route],group=config.groups.find(g=>g.id===route),rootGroup=config.groups.length===1?config.groups[0]:null;
  $('page-title').textContent=route==='saved'?'Saved':collection?collection.name:group?group.title:rootGroup?rootGroup.title:'Library';$('page-count').textContent=`${refs.length} ${refs.length===1?'image':'images'}`;$('back-button').hidden=!collection&&!group;
  const sep=`<span class="breadcrumb-divider">${icon('chevronRight')}</span>`;
  $('breadcrumbs').innerHTML=route==='all'?`<span>Library</span>${rootGroup?`${sep}<span>${esc(rootGroup.title)}</span>`:''}`:route==='saved'?`<a href="#all">Library</a>${sep}<span>Saved</span>`:collection?`<a href="#all">Library</a>${sep}<a href="#${esc(groupFor(route)?.id||'all')}">${esc(groupFor(route)?.title||'Collections')}</a>${sep}<span>${esc(collection.name)}</span>`:`<a href="#all">Library</a>${sep}<span>${esc(group?.title||'Library')}</span>`;
  if(collection||route==='saved'){$('gallery').className='gallery image-grid';$('gallery').innerHTML=refs.map(card).join('');}else{$('gallery').className='gallery';const groups=group?[group]:config.groups;$('gallery').innerHTML=groups.map(g=>`${groups.length>1?`<div class="group-heading"><a href="#${esc(g.id)}">${esc(g.title)} ${icon('arrowUpRight')}</a></div>`:''}${g.collections.map(id=>{const list=refs.filter(r=>r.company===id);return list.length?row(id,list):'';}).join('')}`).join('');}
  const noSaved=route==='saved'&&availableForRoute().length===0;
  $('empty-state').hidden=refs.length>0;$('empty-title').textContent=noSaved?'Keep what catches your eye.':'No images in this view.';$('empty-copy').textContent=noSaved?'Save an image to find it here.':'Try a different image treatment.';
  document.title=route==='all'?'Reference':`${$('page-title').textContent} — Reference`;
  document.querySelectorAll('#browse-navigation a,.saved-nav').forEach(a=>{if(a.hash==='#'+route)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});setupRows();updateSaved();
  // Do not defer the first visible row behind native lazy-loading heuristics.
  [...$('gallery').querySelectorAll('img')].slice(0,3).forEach((img,index)=>{img.loading='eager';img.fetchPriority=index===0?'high':'auto';});
}

function scrollRow(el,step){
  const base=rowTargets.get(el)??el.scrollLeft,max=el.scrollWidth-el.clientWidth,offsets=[...el.querySelectorAll('.image-card')].map(c=>c.offsetLeft);let next;
  if(matchMedia('(max-width: 600px)').matches){const current=offsets.reduce((best,v,i)=>Math.abs(v-base)<Math.abs(offsets[best]-base)?i:best,0);next=offsets[Math.max(0,Math.min(offsets.length-1,current+step))];}
  else{const target=base+el.clientWidth*.8*step;next=step>0?offsets.find(v=>v>=target):offsets.slice().reverse().find(v=>v<=target);}
  const destination=Math.max(0,Math.min(max,next??(step>0?max:0)));rowTargets.set(el,destination);
  animateRow(el,destination);
}
function setupRows(){document.querySelectorAll('.image-row').forEach(el=>{
  const id=el.dataset.rowId,wrap=el.parentElement,section=el.closest('section');el.scrollLeft=rowPositions[id]||0;
  const setState=()=>{if(!el.isConnected)return;const before=el.scrollLeft>3,after=el.scrollWidth-el.clientWidth-el.scrollLeft>3;rowPositions[id]=el.scrollLeft;if(Math.abs((rowTargets.get(el)??el.scrollLeft)-el.scrollLeft)<3)rowTargets.delete(el);wrap.classList.toggle('has-before',before);wrap.classList.toggle('has-after',after);section.querySelector('[data-step="-1"]').disabled=!before;section.querySelector('[data-step="1"]').disabled=!after;};
  let frame=0;el.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;setState();});},{passive:true});const observer=new ResizeObserver(setState);observer.observe(el);rowObservers.push(observer);requestAnimationFrame(setState);
  el.addEventListener('keydown',e=>{if(e.target===el&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();scrollRow(el,e.key==='ArrowRight'?1:-1);}});
  const interrupt=()=>{cancelRow(el);rowTargets.delete(el);};
  el.addEventListener('pointerdown',interrupt,{passive:true});el.addEventListener('wheel',interrupt,{passive:true});
  el.addEventListener('keydown',e=>{if(['Home','End','PageUp','PageDown','Tab'].includes(e.key))interrupt();});
  let startX=0,startScroll=0,dragging=false,down=false;
  el.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0||e.target.closest('[data-save]'))return;down=true;dragging=false;startX=e.clientX;startScroll=el.scrollLeft;});
  el.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-startX;if(Math.abs(dx)>6&&!dragging){dragging=true;el.classList.add('dragging');el.setPointerCapture(e.pointerId);}if(dragging){e.preventDefault();el.scrollLeft=startScroll-dx;}});
  const end=()=>{down=false;el.classList.remove('dragging');if(dragging)setTimeout(()=>dragging=false,0);};el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('pointerleave',()=>{if(!dragging)down=false;});el.addEventListener('click',e=>{if(dragging){e.preventDefault();e.stopPropagation();}},true);
});}
function renderBrowse(){const link=(id,label,count,child=false)=>`<a class="menu-item ${child?'child-link':''}" href="#${esc(id)}"><span>${esc(label)}</span><span class="menu-trailing"><small>${count}</small><span class="menu-check">${icon('check')}</span></span></a>`;$('browse-navigation').innerHTML=link('all','All references',items.length)+'<div class="menu-rule"></div>'+config.groups.map(g=>link(g.id,g.title,items.filter(r=>g.collections.includes(r.company)).length)+g.collections.map(id=>link(id,name(id),items.filter(r=>r.company===id).length,true)).join('')).join('');}
function navigate(next){pagePositions[route]=window.scrollY;closeMenus();if(next!==route)location.hash=next;}
function renderTreatments(){$('treatment-label').textContent=type==='3D / material'?'3D & materials':type;$('treatment-options').innerHTML=types.map(t=>menuOption(t==='3D / material'?'3D & materials':t,`data-type="${esc(t)}"`,type===t)).join('');}
function applyRoute(){const hash=decodeURIComponent(location.hash.slice(1));route=config.collections[hash]||config.groups.some(g=>g.id===hash)||hash==='saved'?hash:'all';type=types[0];closeMenus(true);renderTreatments();const changed=hasRendered;const draw=()=>{renderPage();window.scrollTo({top:pagePositions[route]||0,behavior:'instant'});if(changed)$('main').focus({preventScroll:true});};if(hasRendered&&document.startViewTransition)document.startViewTransition(draw);else draw();hasRendered=true;}
function showDialog(id){closeMenus(true);const el=$(id);if(el.open||document.querySelector('dialog[open]'))return;el.classList.remove('is-closing');el.showModal();document.body.classList.add('modal-open');}
function closeDialog(id){const el=$(id);if(!el.open)return Promise.resolve();if(id==='viewer')clearViewerMotion();if(dialogClosures.has(id))return dialogClosures.get(id);el.classList.add('is-closing');const p=new Promise(resolve=>setTimeout(()=>{el.close();el.classList.remove('is-closing');dialogClosures.delete(id);resolve();},150));dialogClosures.set(id,p);return p;}
function openImage(id,list=availableForRoute().filter(matchesType)){clearViewerMotion();$('viewer').scrollTo({top:0,behavior:'instant'});viewerItems=[...list];viewerIndex=viewerItems.findIndex(r=>r.id===id);if(viewerIndex<0)return;openerId=id;updateViewer();showDialog('viewer');}
function updateViewer(){
  const r=viewerItems[viewerIndex];if(!r)return;const version=++imageVersion;
  $('viewer-company').textContent=name(r.company);$('viewer-position').textContent=`${viewerIndex+1} of ${viewerItems.length}`;$('viewer-title').textContent=r.title;$('viewer-subtitle').textContent=`${r.type} · ${dateText(r.date)}`;$('viewer-note').textContent=r.note;$('viewer-dimensions').textContent=`${r.width} × ${r.height} px`;$('viewer-source').href=safeHref(r.sourceUrl);$('viewer-original').href=r.imageUrl?safeHref(r.imageUrl):r.original;
  const img=$('viewer-image');img.src=r.thumbnail;img.alt=r.alt;$('image-loading').hidden=true;const loading=setTimeout(()=>{if(version===imageVersion){$('image-loading').textContent='Loading full image…';$('image-loading').hidden=false;}},300);
  const source=viewerSource(r),full=new Image();full.fetchPriority='high';full.onload=async()=>{try{await full.decode();}catch{}clearTimeout(loading);if(version!==imageVersion)return;img.src=source;$('image-loading').hidden=true;const connection=navigator.connection;if(!connection?.saveData&&!/2g/.test(connection?.effectiveType||'')){for(const neighbor of [viewerItems[viewerIndex-1],viewerItems[viewerIndex+1]]){if(neighbor){const next=new Image();next.fetchPriority='low';next.src=viewerSource(neighbor);}}}};full.onerror=()=>{clearTimeout(loading);if(version===imageVersion){$('image-loading').hidden=false;$('image-loading').textContent='Preview shown. Open the original for full resolution.';}};full.src=source;
  $('previous-image').disabled=viewerIndex===0;$('next-image').disabled=viewerIndex===viewerItems.length-1;updateSaved();prepareViewerNeighbors(viewerArt.clientWidth+16,false);
}
let viewerMotion=0,viewerMoving=false,viewerGesture=null,viewerEffects=[];
const viewerArt=$('viewer-image').parentElement;
const viewerLayers=()=>[$('viewer-image'),$('viewer-previous'),$('viewer-next')];
function clearViewerMotion(){
  if(viewerGesture&&viewerArt.hasPointerCapture(viewerGesture.id))viewerArt.releasePointerCapture(viewerGesture.id);
  viewerMotion++;viewerEffects.forEach(effect=>effect.cancel());viewerEffects=[];viewerMoving=false;viewerGesture=null;
  viewerArt.classList.remove('is-dragging','is-moving');
  viewerLayers().forEach(img=>img.style.transform='');
  $('viewer-previous').hidden=true;$('viewer-next').hidden=true;
}
function prepareViewerNeighbors(distance,show=true){
  for(const [id,step] of [['viewer-previous',-1],['viewer-next',1]]){
    const img=$(id),r=viewerItems[viewerIndex+step];img.hidden=!r||!show;
    if(r){img.src=r.thumbnail;img.style.transform=`translateX(${step*distance}px)`;}
  }
}
function dragViewer(dx,distance){
  $('viewer-image').style.transform=`translateX(${dx}px)`;
  $('viewer-previous').style.transform=`translateX(${dx-distance}px)`;
  $('viewer-next').style.transform=`translateX(${dx+distance}px)`;
}
async function settleViewer(){
  const gesture=viewerGesture;viewerGesture=null;
  if(!gesture?.locked){clearViewerMotion();return;}
  viewerMoving=true;viewerArt.classList.add('is-moving');const token=++viewerMotion;
  viewerEffects=viewerLayers().map((img,i)=>{
    const target=i===0?0:i===1?-gesture.distance:gesture.distance;
    return img.animate([{transform:img.style.transform},{transform:`translateX(${target}px)`}],{duration:180,easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'});
  });
  await Promise.all(viewerEffects.map(effect=>effect.finished.catch(()=>{})));
  if(token===viewerMotion)clearViewerMotion();
}
async function moveImage(step,offset=0){
  if(viewerMoving)return;const next=viewerIndex+step;if(next<0||next>=viewerItems.length)return;
  const distance=viewerArt.clientWidth+16;prepareViewerNeighbors(distance);viewerMoving=true;viewerGesture=null;viewerArt.classList.add('is-moving');const token=++viewerMotion;
  const current=$('viewer-image'),neighbor=$(step===1?'viewer-next':'viewer-previous');
  viewerEffects=[
    current.animate([{transform:`translateX(${offset}px)`},{transform:`translateX(${-step*distance}px)`}],{duration:240,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'}),
    neighbor.animate([{transform:`translateX(${offset+step*distance}px)`},{transform:'translateX(0)'}],{duration:240,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'})
  ];
  await Promise.all(viewerEffects.map(effect=>effect.finished.catch(()=>{})));
  if(token!==viewerMotion||!$('viewer').open)return;
  viewerIndex=next;updateViewer();clearViewerMotion();
}
viewerArt.addEventListener('pointerdown',e=>{
  if(!e.isPrimary){clearViewerMotion();return;}
  if(viewerMoving||!$('viewer').open||(e.pointerType==='mouse'&&e.button!==0))return;
  viewerGesture={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastTime:e.timeStamp,dx:0,dy:0,velocity:0,locked:false,distance:viewerArt.clientWidth+16};
});
viewerArt.addEventListener('pointermove',e=>{
  const g=viewerGesture;if(!g||g.id!==e.pointerId)return;
  g.dx=e.clientX-g.x;g.dy=e.clientY-g.y;
  if(!g.locked){
    if(Math.abs(g.dy)>8&&Math.abs(g.dy)>Math.abs(g.dx)){clearViewerMotion();return;}
    if(Math.abs(g.dx)<8||Math.abs(g.dx)<Math.abs(g.dy)*1.2)return;
    g.locked=true;viewerArt.setPointerCapture(e.pointerId);prepareViewerNeighbors(g.distance);viewerArt.classList.add('is-dragging');
  }
  const elapsed=e.timeStamp-g.lastTime;if(elapsed>0)g.velocity=(e.clientX-g.lastX)/elapsed;g.lastX=e.clientX;g.lastTime=e.timeStamp;
  const atEdge=g.dx>0?viewerIndex===0:viewerIndex===viewerItems.length-1;g.offset=atEdge?g.dx*.22:g.dx;
  dragViewer(g.offset,g.distance);
});
viewerArt.addEventListener('pointerup',e=>{
  const g=viewerGesture;if(!g||g.id!==e.pointerId)return;
  if(viewerArt.hasPointerCapture(e.pointerId))viewerArt.releasePointerCapture(e.pointerId);
  const step=g.locked?swipeDirection({dx:g.dx,dy:g.dy,width:viewerArt.clientWidth,velocity:e.timeStamp-g.lastTime>90?0:g.velocity,canPrevious:viewerIndex>0,canNext:viewerIndex<viewerItems.length-1}):0;
  if(step)moveImage(step,g.offset);else settleViewer();
});
viewerArt.addEventListener('pointercancel',()=>clearViewerMotion());
window.addEventListener('resize',()=>{if(viewerGesture||viewerMoving)clearViewerMotion();});

function renderSearch(){const q=searchQuery.toLowerCase();searchItems=items.filter(r=>!q||[r.title,r.note,r.alt,r.type,name(r.company),...(r.tags||[])].join(' ').toLowerCase().includes(q));$('search-result-count').textContent=q?`${searchItems.length} ${searchItems.length===1?'result':'results'}`:'Explore all images';$('search-results').innerHTML=searchItems.length?searchItems.map(r=>`<button class="search-result" data-result="${esc(r.id)}" aria-label="Open ${esc(r.title)}"><img src="${esc(r.thumbnailSmall||r.thumbnail)}" ${previewAttributes(r,'(max-width:600px) 42vw, 240px')} alt="${esc(r.alt)}" loading="lazy"><span>${esc(name(r.company))} · ${esc(r.title)}</span></button>`).join(''):'<p class="no-results">No images found. Try another word.</p>';}
function openSearch(){if(document.querySelector('dialog[open]'))return;searchQuery='';$('search-input').value='';renderSearch();showDialog('search-dialog');$('search-input').focus();}
$('gallery').addEventListener('click',e=>{const save=e.target.closest('[data-save]');if(save){saveImage(save.dataset.save);return;}const image=e.target.closest('[data-image]');if(image){const row=image.closest('[data-row-id]');openImage(image.dataset.image,row?items.filter(r=>r.company===row.dataset.rowId&&matchesType(r)):availableForRoute().filter(matchesType));return;}const arrow=e.target.closest('[data-row]');if(arrow)scrollRow(document.querySelector(`[data-row-id="${CSS.escape(arrow.dataset.row)}"]`),Number(arrow.dataset.step));});
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(a&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey){const next=a.hash.slice(1);if(next==='main')return;e.preventDefault();navigate(next);}Object.entries(menus).forEach(([id,button])=>{if(!$(id).hidden&&!e.target.closest('#'+id)&&!e.target.closest('#'+button))closeMenu(id);});});
$('back-button').addEventListener('click',()=>navigate(config.collections[route]?groupFor(route)?.id||'all':'all'));
$('appearance-button').addEventListener('click',()=>{closeMenus();setAppearance(document.documentElement.dataset.theme==='dark'?'light':'dark');});
$('treatment-options').addEventListener('click',e=>{const b=e.target.closest('[data-type]');if(!b)return;type=b.dataset.type;renderTreatments();closeMenu('treatment-menu');renderPage();$('treatment-button').focus();});
$('search-button').addEventListener('click',openSearch);$('close-search').addEventListener('click',()=>closeDialog('search-dialog'));$('search-input').addEventListener('input',e=>{searchQuery=e.target.value.trim();renderSearch();});
$('search-results').addEventListener('click',async e=>{const b=e.target.closest('[data-result]');if(!b)return;await closeDialog('search-dialog');openImage(b.dataset.result,searchItems);});
$('close-viewer').addEventListener('click',()=>closeDialog('viewer'));$('previous-image').addEventListener('click',()=>moveImage(-1));$('next-image').addEventListener('click',()=>moveImage(1));$('viewer-save').addEventListener('click',()=>saveImage(viewerItems[viewerIndex].id));
for(const id of ['viewer','search-dialog','about-dialog']){$(id).addEventListener('cancel',e=>{e.preventDefault();closeDialog(id);});$(id).addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('modal-open');if(id==='viewer'){imageVersion++;(document.querySelector(`[data-image="${CSS.escape(openerId||'')}"]`)||$('main')).focus({preventScroll:true});}});if(id!=='viewer')$(id).addEventListener('click',e=>{if(e.target!==$(id))return;const r=$(id).getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(id);});}
$('about-button').addEventListener('click',()=>showDialog('about-dialog'));$('close-about').addEventListener('click',()=>closeDialog('about-dialog'));
document.addEventListener('keydown',e=>{if($('viewer').open&&!dialogClosures.has('viewer')){if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();moveImage(e.key==='ArrowLeft'?-1:1);}return;}if(e.key==='Escape'){const active=Object.keys(menus).find(id=>!$(id).hidden);closeMenus();if(active)$(menus[active]).focus();return;}const typing=['INPUT','TEXTAREA'].includes(document.activeElement?.tagName);if((e.key==='/'&&!typing)||(e.key.toLowerCase()==='k'&&(e.metaKey||e.ctrlKey))){e.preventDefault();openSearch();}});
window.addEventListener('hashchange',applyRoute);
hydrateIcons();setAppearance(appearance);
try{const responses=await Promise.all([fetch(`library.json?v=${revision}`,{cache:'no-store'}),fetch(`collections.json?v=${revision}`,{cache:'no-store'})]);if(responses.some(r=>!r.ok))throw new Error('Collection unavailable');[items,config]=await Promise.all(responses.map(r=>r.json()));saved=new Set([...saved].filter(id=>items.some(r=>r.id===id)));renderBrowse();applyRoute();}catch(e){$('page-title').textContent='Couldn’t load the collection';$('page-count').textContent='Refresh to try again';console.error(e);}
