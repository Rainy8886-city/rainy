// Pointer Events keep joystick and camera fingers independent on touch screens.
(()=>{'use strict';
class ResearchTouchControls{
 constructor(api){
  this.api=api;this.pointer=null;this.active=false;this.running=false;
  this.media=matchMedia('(pointer:coarse)');this.override=null;
  this.enabled=this.media.matches;
  const root=this.root=document.createElement('div');root.id='mobileControls';root.hidden=true;
  root.innerHTML='<div id="moveStick" role="group" aria-label="触屏移动摇杆"><span class="stick-label">移动</span><span id="stickKnob"></span></div><div class="touch-actions"><button id="mobileInteract" type="button">交互</button><button id="mobileJump" type="button">跳跃</button><button id="mobileRun" type="button" aria-pressed="false">奔跑</button><button id="mobileWave" type="button">挥手</button><button id="mobileZoomIn" type="button" aria-label="拉近视角">视角＋</button><button id="mobileZoomOut" type="button" aria-label="拉远视角">视角－</button></div>';
  document.body.append(root);this.stick=root.querySelector('#moveStick');this.knob=root.querySelector('#stickKnob');
  this.interact=root.querySelector('#mobileInteract');this.run=root.querySelector('#mobileRun');
  this.stick.addEventListener('pointerdown',e=>{if(!this.active||this.pointer!==null)return;e.preventDefault();this.pointer=e.pointerId;this.stick.setPointerCapture(e.pointerId);this.move(e);});
  this.stick.addEventListener('pointermove',e=>{if(e.pointerId===this.pointer){e.preventDefault();this.move(e);}});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])this.stick.addEventListener(type,e=>{if(e.pointerId===this.pointer)this.release();});
  root.addEventListener('pointerdown',e=>e.stopPropagation());
  const action=(id,fn)=>root.querySelector('#'+id).addEventListener('click',()=>{if(this.active)fn();});
  action('mobileInteract',api.interact);action('mobileJump',api.jump);action('mobileWave',api.wave);
  action('mobileRun',()=>{this.running=!this.running;this.run.setAttribute('aria-pressed',String(this.running));api.run(this.running);});
  action('mobileZoomIn',()=>api.zoom(-.65));action('mobileZoomOut',()=>api.zoom(.65));
  this.toggle=document.createElement('button');this.toggle.id='touchControlsToggle';this.toggle.type='button';document.getElementById('audioControls').append(this.toggle);
  const enable=()=>{this.enabled=this.override??this.media.matches;document.body.classList.toggle('touch-game',this.enabled);this.toggle.textContent='触屏操作：'+(this.enabled?'开启':'关闭');this.toggle.setAttribute('aria-pressed',String(this.enabled));};
  this.toggle.addEventListener('click',()=>{this.override=!this.enabled;enable();this.reset();this.sync();});
  enable();this.media.addEventListener('change',enable);
  window.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&this.override===null&&!this.enabled){this.override=true;enable();}},{passive:true});
  window.addEventListener('resize',()=>this.reset());window.addEventListener('blur',()=>this.reset());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.reset();});
 }
 move(e){const rect=this.stick.getBoundingClientRect(),radius=rect.width*.32;let x=(e.clientX-rect.left-rect.width/2)/radius,y=(e.clientY-rect.top-rect.height/2)/radius;const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}const strength=Math.min(1,length);if(strength<.12)x=y=0;else{const scale=(strength-.12)/(.88*strength);x*=scale;y*=scale;}this.knob.style.transform=`translate(${x*radius}px,${y*radius}px)`;this.api.move(x,y);}
 release(){const id=this.pointer;this.pointer=null;if(id!==null&&this.stick.hasPointerCapture(id))this.stick.releasePointerCapture(id);this.knob.style.transform='translate(0,0)';this.api.move(0,0);}
 reset(){this.release();this.running=false;this.run.setAttribute('aria-pressed','false');this.api.run(false);}
 sync(){const active=this.enabled&&this.api.available();if(active!==this.active){this.active=active;this.root.hidden=!active;if(!active)this.reset();}this.interact.disabled=!this.api.canInteract();}
}
window.ResearchTouchControls=ResearchTouchControls;
})();
