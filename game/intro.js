(()=>{'use strict';
 const panel=document.getElementById('prologue'),text=document.getElementById('introText'),next=document.getElementById('introNext'),title=document.getElementById('introTitle'),cursor=document.querySelector('.retro-cursor');
 const pages=[
 {title:'未来的杭州，能接住每一场雨吗？',button:'接受邀请 →',lines:['2077年，杭州。','一场雨落下，穿过树梢，流入河道。','城市与水，已经学会了更从容地相处。','此刻，一封来自未来的信，抵达了你的屏幕。']},
 {title:'你好，来自过去的朋友',button:'成为调研员 →',lines:['你眼前这座城市，来自许多人曾经做出的选择。','一片被留下的绿地，一条重新连通的水脉，','一次对雨水更细致的观察。','','我们想邀请你，回到这些选择开始的地方。','这一次，你将成为城市韧性调研员。','从脚下的杭州出发，寻找城市与雨共生的答案。']}
 ];let page=0,timer=null,index=0,characters=[],exiting=false;
 function finishText(){clearTimeout(timer);timer=null;characters.forEach(c=>c.classList.add('shown'));index=characters.length;next.disabled=false;text.setAttribute('aria-busy','false');}
 function type(){if(index>=characters.length){finishText();return;}const span=characters[index++];span._line.append(span,cursor);span.classList.add('shown');const pause=/[。！]/.test(span.textContent)?340:/[，、]/.test(span.textContent)?160:(index%4===0?105:70);timer=setTimeout(type,pause);}
 function show(){clearTimeout(timer);const data=pages[page];title.textContent=data.title;next.textContent=data.button;next.disabled=true;text.replaceChildren();text.setAttribute('aria-busy','true');characters=[];index=0;for(const line of data.lines){const p=document.createElement('p');if(!line)p.className='intro-space';p.setAttribute('aria-label',line);for(const char of line){const span=document.createElement('span');span.textContent=char;span.setAttribute('aria-hidden','true');span._line=p;characters.push(span);}text.append(p);}timer=setTimeout(type,500);}
 next.onclick=()=>{if(exiting)return;if(page===0){page=1;show();return;}exiting=true;panel.classList.add('intro-exit');next.disabled=true;clearTimeout(timer);timer=setTimeout(()=>{panel.hidden=true;document.getElementById('selection').hidden=false;window.dispatchEvent(new Event('research-intro-complete'));document.querySelector('#viewport canvas')?.focus({preventScroll:true});},650);};
 window.addEventListener('pagehide',()=>{clearTimeout(timer);next.onclick=null;},{once:true});show();
})();
