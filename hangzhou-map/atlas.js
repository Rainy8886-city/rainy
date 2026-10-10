(()=>{
  const hub=document.getElementById('hangzhou-atlas'),stage=document.getElementById('hzAtlasStage');if(!hub||!stage)return;
  const intro=document.getElementById('hzAtlasIntro'),buttons=[...stage.querySelectorAll('[data-map]')];
  const views={rain:{id:'hangzhou-map-page',title:'杭州市地区积水与降雨'},growth:{id:'hangzhou-growth-page',title:'杭州市路网与城市扩张'},mitigation:{id:'hangzhou-mitigation-page',title:'杭州市内涝治理变化'}};
  const dialog=document.createElement('div');dialog.className='hz-map-dialog';dialog.hidden=true;dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-label','杭州专题地图');
  const close=document.createElement('button');close.type='button';close.className='hz-map-close';close.setAttribute('aria-label','退出地图，返回三张地图总览');close.append(document.createTextNode('返回总览'));const x=document.createElement('span');x.textContent='×';close.append(x);dialog.append(close);
  Object.values(views).forEach(view=>{view.section=document.getElementById(view.id);dialog.append(view.section);});document.body.append(dialog);
  let opened=null,returnButton=null,savedOverflow='',savedScroll=0,background=[];
  let transitionToken=0,flight=null,animations=[];
  const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
  function clearTransition(){animations.forEach(animation=>animation.cancel());animations=[];if(flight)flight.remove();flight=null;dialog.classList.remove('is-opening');dialog.style.opacity='';}
  function imageRect(image){const rect=image.getBoundingClientRect(),scale=Math.min(rect.width/image.naturalWidth,rect.height/image.naturalHeight),width=image.naturalWidth*scale,height=image.naturalHeight*scale;return {left:rect.left+(rect.width-width)/2,top:rect.top+(rect.height-height)/2,width,height};}
  function preview(key){if(key){stage.dataset.active=key;intro.textContent='查看'+views[key].title;}else{delete stage.dataset.active;intro.textContent='同一座城市，三个观察视角';}buttons.forEach(button=>button.classList.toggle('is-active',button.dataset.map===key));}
  buttons.forEach(button=>{button.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')preview(button.dataset.map);});button.addEventListener('focus',()=>preview(button.dataset.map));button.addEventListener('click',()=>open(button.dataset.map,button));});
  stage.addEventListener('pointerleave',()=>preview(null));stage.addEventListener('focusout',event=>{if(!stage.contains(event.relatedTarget))preview(null);});
  async function open(key,button){if(!views[key])return;
    const token=++transitionToken;clearTransition();
    const image=button?.querySelector('img'),origin=image&&image.naturalWidth?imageRect(image):null;
    const animate=false;
    if(!opened){savedOverflow=document.body.style.overflow;savedScroll=window.scrollY;background=[...document.body.children].filter(e=>e!==dialog&&!['SCRIPT','STYLE','LINK'].includes(e.tagName)).map(e=>({element:e,inert:e.inert}));background.forEach(({element})=>element.inert=true);document.body.style.overflow='hidden';}
    returnButton=button||buttons.find(b=>b.dataset.map===key);opened=key;Object.entries(views).forEach(([name,view])=>view.section.classList.toggle('is-open',name===key));dialog.style.opacity='1';dialog.classList.add('is-opening');dialog.hidden=false;dialog.setAttribute('aria-label',views[key].title);dialog.scrollTop=0;history.replaceState(null,'','#'+views[key].id);close.focus({preventScroll:true});window.dispatchEvent(new Event('resize'));
    // The existing preview itself flies from its actual on-screen position into
    // the canvas slot. Live WebGL stays covered until it has resized and rendered.
    const host=views[key].section.querySelector('[id$="Scene"]');
    await nextFrame();if(token!==transitionToken)return;
    window.__loadHangzhouMap?.(key).catch(error=>{host.dataset.ready='error';console.error(error);});
    if(animate){
      const slot=host.getBoundingClientRect();
      // Match world-unit scale, not the canvas rectangle's aspect ratio. The
      // orthographic cameras use this same span rule on all three maps.
      const sourceSpan=Math.max(10.8,15.8/(image.naturalWidth/image.naturalHeight));
      const targetSpan=Math.max(10.8,15.8/(slot.width/slot.height));
      const pixelsPerSourcePixel=(slot.height/targetSpan)/(image.naturalHeight/sourceSpan);
      const width=image.naturalWidth*pixelsPerSourcePixel,height=image.naturalHeight*pixelsPerSourcePixel;
      const destination={left:slot.left+(slot.width-width)/2,top:slot.top+(slot.height-height)/2,width,height};
      flight=document.createElement('img');flight.className='hz-map-flight';flight.alt='';flight.setAttribute('aria-hidden','true');flight.src=image.currentSrc||image.src;
      Object.assign(flight.style,{left:destination.left+'px',top:destination.top+'px',width:destination.width+'px',height:destination.height+'px'});
      const from=`translate(${origin.left-destination.left}px,${origin.top-destination.top}px) scale(${origin.width/destination.width})`;
      flight.style.transform=from;document.body.append(flight);
      const zoom=flight.animate([{transform:from},{transform:'translate(0,0) scale(1)'}],{duration:720,easing:'cubic-bezier(.2,.75,.2,1)',fill:'forwards'});
      const backgroundFade=dialog.animate([{opacity:0},{opacity:1}],{duration:720,easing:'ease-in-out',fill:'forwards'});animations.push(zoom,backgroundFade);
      await zoom.finished.catch(()=>{});
    }
    if(token!==transitionToken)return;
    const deadline=performance.now()+20000;while(host.dataset.ready!=='true'&&host.dataset.ready!=='error'&&performance.now()<deadline){await nextFrame();if(token!==transitionToken)return;}
    await nextFrame();await nextFrame();if(token!==transitionToken)return;
    dialog.style.opacity='1';dialog.classList.remove('is-opening');
    // Replace on a single frame; overlapping two different snapshots creates
    // ghost outlines and makes the map look as if it shrinks at the end.
    if(token===transitionToken)clearTransition();
  }
  function exit(){if(!opened)return;
    if(!dialog.classList.contains('is-opening')){const image=returnButton?.querySelector('img');if(image)views[opened].section.querySelector('[id$="Scene"]').dispatchEvent(new CustomEvent('hz-snapshot',{detail:{capture:src=>image.src=src}}));}
    ++transitionToken;clearTransition();dialog.hidden=true;Object.values(views).forEach(view=>view.section.classList.remove('is-open'));opened=null;background.forEach(({element,inert})=>element.inert=inert);background=[];document.body.style.overflow=savedOverflow;history.replaceState(null,'','#hangzhou-atlas');window.scrollTo({top:savedScroll,behavior:'instant'});if(returnButton)returnButton.focus({preventScroll:true});preview(null);}
  close.addEventListener('click',exit);
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();exit();return;}if(event.key!=='Tab')return;const focusable=[...dialog.querySelectorAll('button:not([hidden]),input,[tabindex="0"],a[href]')].filter(e=>e.getClientRects().length&&!e.disabled);const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});
  function route(){const id=location.hash.slice(1),key=Object.keys(views).find(key=>views[key].id===id);if(key){hub.scrollIntoView({behavior:'instant'});open(key);}else if(id==='hangzhou-atlas'){if(opened)exit();hub.scrollIntoView({behavior:'instant'});}}
  window.addEventListener('hashchange',route);route();
})();
