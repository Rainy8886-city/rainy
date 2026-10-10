(()=>{
 class TerminalLoading{
  constructor(parent=document.body){this.element=document.createElement('div');this.element.className='rain-terminal-loading';this.element.hidden=true;this.element.innerHTML='<div class="rain-terminal-card"><header><span>雨信终端 / RAIN MAIL</span><span class="rain-terminal-dot">●</span></header><div class="rain-terminal-screen"><small>HANGZHOU · CITY ARCHIVE</small><p role="status" aria-live="polite"></p><span class="rain-terminal-signal" aria-hidden="true">··· SIGNAL CONNECTING ···</span></div></div>';parent.append(this.element);this.text=this.element.querySelector('p');this.token=0;}
  begin(text='正在连接终端…'){clearTimeout(this.timer);this.element.hidden=false;this.element.classList.remove('is-leaving');this.text.textContent=text;this.element.setAttribute('aria-busy','true');const token=++this.token;this.timer=setTimeout(()=>{if(token===this.token)this.text.textContent='仍在读取档案，请稍候。可随时返回。';},12000);return token;}
  async painted(){await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}
  end(token=this.token){if(token!==this.token)return;clearTimeout(this.timer);this.element.setAttribute('aria-busy','false');this.element.classList.add('is-leaving');this.timer=setTimeout(()=>{if(token===this.token)this.element.hidden=true;},180);}
  cancel(){++this.token;clearTimeout(this.timer);this.element.hidden=true;this.element.setAttribute('aria-busy','false');}
 }
 window.TerminalLoading=TerminalLoading;
})();
