(()=>{
'use strict';
const BPM=108,BEAT=60/BPM,FADE=2.5;
// One C-major motif, reharmonized and revoiced through the chronological journey.
const MOTIF=[0,4,7,9,7,4,2,4,7,12,9,7,4,2,0,7];
const CHORDS=[[0,4,7],[5,9,12],[9,12,16],[7,11,14],[0,4,7],[5,9,12],[2,5,9],[7,11,14]];
const PROFILES={
 prologue:{bars:24,voice:'digital',density:1,bass:.016,drums:.004,pad:.009,echo:.13},
 selection:{bars:12,voice:'bubble',density:2,bass:.032,drums:.018,pad:.006,echo:.08},
 arrival:{bars:24,voice:'future',density:1,bass:0,drums:0,pad:.018,echo:.23},
 entrance:{bars:24,voice:'digital',density:2,bass:.033,drums:.023,pad:.008,echo:.1},
 explore:{bars:24,voice:'piano',density:1,bass:.018,drums:.005,pad:.012,echo:.14},
 maps:{bars:24,voice:'piano',density:.5,bass:.014,drums:0,pad:.013,echo:.16},
 'hall-sandbox':{bars:24,voice:'wood',density:2,bass:.034,drums:.021,pad:.008,echo:.11},
 sandbox:{bars:24,voice:'pluck',density:2,bass:.035,drums:.024,pad:.008,echo:.12},
 'hall-cities':{bars:24,voice:'piano',density:2,bass:.023,drums:.012,pad:.015,echo:.2},
 cities:{bars:24,voice:'future',density:2,bass:.022,drums:.013,pad:.014,echo:.23},
 finale:{bars:24,voice:'future',density:.5,bass:.007,drums:0,pad:.022,echo:.3}
};
const hz=n=>220*2**(n/12);
function voice(ctx,bus,freq,time,duration,volume,kind='piano'){
 const presets={bubble:[.025,.28,'sine',.12],digital:[.018,.58,'sine',.18],wood:[.012,.23,'sine',.035],pluck:[.018,.42,'triangle',.05],piano:[.035,1.15,'sine',.13],future:[.32,2.3,'sine',.075],pad:[.65,3.2,'sine',.055],bass:[.045,.36,'sine',.02],electric:[.06,.8,'triangle',.07],softbell:[.055,.65,'sine',.2],roundpluck:[.055,.28,'triangle',.035]};
 const [attack,decay,type,harmonic]=presets[kind]||presets.piano,release=Math.min(duration*.25,.65),a=Math.min(Math.max(attack,.045),duration*.25);
 const gain=ctx.createGain(),filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=kind==='bass'?450:1050;filter.Q.value=.35;
 gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(volume,time+a);
 gain.gain.exponentialRampToValueAtTime(Math.max(.0001,volume*(kind==='pad'||kind==='future'?.68:.19)),time+Math.max(a+.01,Math.min(decay,duration-release)));
 gain.gain.linearRampToValueAtTime(0,time+duration);filter.connect(gain);gain.connect(bus);
 [1,2].forEach((multiple,i)=>{const o=ctx.createOscillator(),level=ctx.createGain();o.type=type;o.frequency.value=freq*multiple;level.gain.value=i?harmonic*.35:1;o.connect(level);level.connect(filter);o.start(time);o.stop(time+duration+.015);o.onended=()=>{o.disconnect();level.disconnect();if(i===1){filter.disconnect();gain.disconnect();}};});
}
function noise(ctx){const b=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.15),ctx.sampleRate),d=b.getChannelData(0);let seed=729;for(let i=0;i<d.length;i++){seed=(seed*16807)%2147483647;d[i]=(seed/2147483647*2-1);}return b;}
function drum(ctx,bus,t,volume,kind,n){
 const gain=ctx.createGain();gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(volume,t+.006);gain.gain.exponentialRampToValueAtTime(.0001,t+(kind==='kick'?.15:.085));gain.connect(bus);
 const source=kind==='kick'?ctx.createOscillator():ctx.createBufferSource();
 if(kind==='kick'){source.frequency.setValueAtTime(95,t);source.frequency.exponentialRampToValueAtTime(55,t+.11);source.connect(gain);}else{source.buffer=n;const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=kind==='hat'?1400:900;f.Q.value=.7;source.connect(f);f.connect(gain);}
 source.start(t);source.stop(t+.16);
}
async function renderTexture(profile){
 const seconds=profile.bars*4*BEAT,rate=24000,ctx=new OfflineAudioContext(2,Math.ceil((seconds+4)*rate),rate),bus=ctx.createGain();bus.gain.value=.6;bus.connect(ctx.destination);const events=[];
 const add=(kind,note,time,duration,volume,pan)=>{const p=ctx.createStereoPanner();p.pan.value=pan;p.connect(bus);voice(ctx,p,hz(note),time,duration,volume,kind);events.push({kind,note,time,duration});};
 for(let bar=0;bar<profile.bars;bar++){const chord=CHORDS[bar%8],t=bar*4*BEAT,phrase=Math.floor(bar/8),part=(bar+phrase)%4;
  // Short answers near phrase endings; never replace or retime the existing lead.
  if(part===1){add('electric',chord[0],t+3.25*BEAT,.7*BEAT,.007,-.22);add('electric',chord[1],t+3.25*BEAT,.7*BEAT,.004,-.22);}
  if(part===2){add('roundpluck',chord[1],t+3.12*BEAT,.4*BEAT,.006,.18);if(bar%8!==6)add('roundpluck',chord[2],t+3.65*BEAT,.32*BEAT,.004,.18);}
  if(part===3)add('softbell',chord[1],t+3.72*BEAT,.48*BEAT,.004,.25);
  if(bar%8===6){add('pad',chord[0],t+1.5*BEAT,5*BEAT,.0016,-.15);add('pad',chord[2],t+1.5*BEAT,5*BEAT,.0012,.15);}
 }
 const rendered=await ctx.startRendering(),length=Math.round(seconds*rate),loop=ctx.createBuffer(2,length,rate);let sum=0,peak=0;
 for(let c=0;c<2;c++){const src=rendered.getChannelData(c),dst=loop.getChannelData(c);for(let i=0;i<src.length;i++)dst[i%length]+=src[i];for(let i=0;i<length;i++){sum+=dst[i]*dst[i];peak=Math.max(peak,Math.abs(dst[i]));if(i&&i%65536===0)await new Promise(done=>setTimeout(done,0));}}
 const scale=Math.min(.008/Math.max(.0001,Math.sqrt(sum/(length*2))),.035/Math.max(.0001,peak));for(let c=0;c<2;c++){const dst=loop.getChannelData(c);for(let i=0;i<length;i++){dst[i]*=scale;if(i&&i%65536===0)await new Promise(done=>setTimeout(done,0));}}
 loop.textureEvents=events;return loop;
}
async function renderLoop(profile,harmony=false){
 const seconds=profile.bars*4*BEAT,sampleRate=24000,ctx=new OfflineAudioContext(2,Math.ceil((seconds+4)*sampleRate),sampleRate),bus=ctx.createGain();bus.gain.value=.72;bus.connect(ctx.destination);
 // Gentle stereo echoes + a short diffuse room, no giant hall or cathedral tail.
 // Harmony follows the lead exactly: delayed notes sounded like a second song.
 const convolution=ctx.createConvolver(),ir=ctx.createBuffer(2,Math.floor(sampleRate*.75),sampleRate);let seed=97;for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<d.length;i++){seed=(seed*16807)%2147483647;d[i]=(seed/2147483647*2-1)*Math.exp(-i/sampleRate*7)*.13;}}convolution.buffer=ir;const room=ctx.createGain();room.gain.value=profile.voice==='future'?.16:.06;bus.connect(convolution);convolution.connect(room);room.connect(ctx.destination);
 const n=noise(ctx);
 for(let bar=0;bar<profile.bars;bar++){
  const chord=CHORDS[bar%8],t=bar*4*BEAT,phrase=Math.floor(bar/8);
  const count=profile.density*4;
  for(let j=0;j<count;j++){
   const step=4/count,when=t+j*step*BEAT,note=j%2===0?MOTIF[(bar%8*2+Math.floor(j/4))%16]:chord[(j+bar)%3];
   // One clean lead: no overlapping counter-melody or early chord bed.
   const duration=BEAT*step*.88;
   const rainSwell=.82+.18*Math.sin(Math.PI*(bar%8)/7),storm=['sandbox','pluck','wood'].includes(profile.voice)?1.12:1;
   if(!harmony)voice(ctx,bus,hz(note),when,duration,.04*rainSwell*storm,profile.voice);
   else {const degree=((note%12)+12)%12,third=({0:4,2:5,4:7,5:9,7:11,9:12,11:14})[degree]??degree+3;voice(ctx,bus,hz(note-degree+third-12),when,duration,.014*rainSwell,profile.voice);}
  }
  if(!harmony&&profile.drums)for(let beat=0;beat<4;beat++){drum(ctx,bus,t+beat*BEAT,profile.drums*.65*(beat%2?.5:.65),beat%2?'brush':'kick',n);}
 }
 const rendered=await ctx.startRendering(),length=Math.round(seconds*sampleRate),loop=ctx.createBuffer(2,length,sampleRate);
 // Fold release/reverb tail into the opening: loop boundaries retain their sustain.
 for(let c=0;c<2;c++){const src=rendered.getChannelData(c),dst=loop.getChannelData(c);for(let i=0;i<src.length;i++)dst[i%length]+=src[i];}
 let power=0,peak=0;for(let c=0;c<2;c++){const samples=loop.getChannelData(c);for(let i=0;i<samples.length;i++){const v=samples[i];power+=v*v;peak=Math.max(peak,Math.abs(v));if(i&&i%65536===0)await new Promise(done=>setTimeout(done,0));}}
 const rms=Math.sqrt(power/(length*2)),scale=Math.min((harmony?.030:.075)/Math.max(.001,rms),.65/Math.max(.001,peak));for(let c=0;c<2;c++){const d=loop.getChannelData(c);for(let i=0;i<d.length;i++){d[i]*=scale;if(i&&i%65536===0)await new Promise(done=>setTimeout(done,0));}}
 if(!harmony){loop.harmonyBuffer=await renderLoop(profile,true);loop.textureBuffer=await renderTexture(profile);}
 return loop;
}
// A lyrical, percussion-free arrangement. Offline stems avoid scheduling work during play.
const FLOW_CHORDS=[[0,4,7,11],[0,4,7,9],[0,5,9,12],[2,5,9,12],[0,4,9,12],[0,4,7,11],[2,5,7,11],[0,2,7,11]];
async function renderSingingLayer(layer){
 const seconds=48*4*BEAT,rate=16000,ctx=new OfflineAudioContext(2,Math.ceil((seconds+4)*rate),rate),events=[];
 const bus=ctx.createGain();bus.gain.value=.65;bus.connect(ctx.destination);
 const stringWave=ctx.createPeriodicWave(new Float32Array(8),new Float32Array([0,1,.32,.14,.07,.035,.017,.008]));
 const room=ctx.createDelay(1),wet=ctx.createGain();room.delayTime.value=.19;wet.gain.value=.10;bus.connect(room);room.connect(wet);wet.connect(ctx.destination);
 function note(n,t,d,v,pan,kind){const gain=ctx.createGain(),p=ctx.createStereoPanner(),f=ctx.createBiquadFilter(),strings=kind==='strings',pad=kind==='pad'||strings;p.pan.value=pan;f.type='lowpass';f.frequency.value=strings?850:pad?720:1250;f.Q.value=.25;const attack=Math.min(d*.27,strings?.8:pad?.65:kind==='bell'?.12:.10),release=Math.min(d*.45,strings?1.25:pad?1.15:.75);
  gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(v,t+attack);gain.gain.linearRampToValueAtTime(v*(pad?.90:.84),t+Math.max(attack,d-release));gain.gain.linearRampToValueAtTime(0,t+d);f.connect(gain);gain.connect(p);p.connect(bus);
  const partials=strings?[1,1]:[1,2,3];partials.forEach((partial,i)=>{const o=ctx.createOscillator(),level=ctx.createGain();o.type='sine';o.frequency.value=hz(n)*partial;let bow=null,bowDepth=null;if(strings){o.setPeriodicWave(stringWave);o.detune.value=i?2.5:-2.5;level.gain.value=.5;bow=ctx.createOscillator();bowDepth=ctx.createGain();bow.frequency.value=4.1+i*.3;bowDepth.gain.value=1.7;bow.connect(bowDepth);bowDepth.connect(o.detune);bow.start(t);bow.stop(t+d+.01);}else level.gain.value=i===0?1:i===1?(kind==='electric'?.17:.08):.025;o.connect(level);level.connect(f);o.start(t);o.stop(t+d+.01);o.onended=()=>{o.disconnect();level.disconnect();bow?.disconnect();bowDepth?.disconnect();if(i===partials.length-1){f.disconnect();gain.disconnect();p.disconnect();}};});events.push({kind,note:n,time:t,duration:d});
 }
 if(layer==='lead'){const phrases=[[0,4,7,9,7,4,2,4],[7,12,9,7,4,2,0,7],[4,5,9,7,5,4,2,0],[9,7,4,2,5,4,2,0],null,[7,9,12,11,9,7,5,4],[4,7,9,12,9,5,4,2],[2,5,7,9,7,4,2,0],[9,12,11,9,7,5,2,4],null,[4,2,5,9,7,4,2,7],[7,5,4,2,4,2,0,0]],rhythms=[[2,1,1,3,1,2,2,4],[3,1,2,2,1,1,3,3],[1,2,3,2,2,1,1,4]];for(let phrase=0;phrase<phrases.length;phrase++){if(!phrases[phrase])continue;let beat=phrase*16;for(let j=0;j<8;j++){const n=phrases[phrase][j],len=rhythms[phrase%3][j],swell=.86+.14*Math.sin(Math.PI*j/7);note(n,beat*BEAT,len*BEAT+.65,.034*swell,-.05,phrase%4===2?'electric':'piano');beat+=len;}}}
 if(layer==='harmony')for(let bar=0;bar<48;bar++){const chord=FLOW_CHORDS[bar%8],swell=(bar>=16&&bar<20||bar>=36&&bar<40?.72:.86)+.14*Math.sin(Math.PI*(bar%8)/7);chord.forEach((n,i)=>note(n-12,bar*4*BEAT,4*BEAT+1.35,.010*swell,i%2?.28:-.28,i===0?'pad':'strings'));}
 if(layer==='texture')for(let bar=0;bar<48;bar++){const chord=FLOW_CHORDS[bar%8],part=(bar+Math.floor(bar/8))%4,t=bar*4*BEAT;if(part!==3)for(let j=0;j<3;j++)note(chord[(j+Math.floor(bar/8))%4],t+(.4+j*1.2)*BEAT,2.7*BEAT,.004,j%2?.20:-.20,'electric');if(bar%8===7)note(chord[1]+12,t+2.8*BEAT,2.5*BEAT,.002,.20,'bell');}
 const rendered=await ctx.startRendering(),length=Math.round(seconds*rate),loop=ctx.createBuffer(2,length,rate);let power=0,peak=0;
 for(let c=0;c<2;c++){const src=rendered.getChannelData(c),dst=loop.getChannelData(c);for(let i=0;i<src.length;i++)dst[i%length]+=src[i];for(let i=0;i<length;i++){power+=dst[i]*dst[i];peak=Math.max(peak,Math.abs(dst[i]));if(i&&i%65536===0)await new Promise(done=>setTimeout(done,0));}}
 const target=layer==='lead'?.055:layer==='harmony'?.022:.009,ceiling=layer==='lead'?.28:layer==='harmony'?.09:.06,scale=Math.min(target/Math.max(.0001,Math.sqrt(power/(2*length))),ceiling/Math.max(.0001,peak));for(let c=0;c<2;c++){const dst=loop.getChannelData(c);for(let i=0;i<length;i++){dst[i]*=scale;if(i&&i%65536===0)await new Promise(done=>setTimeout(done,0));}}
 // Folded sustain stays audible across the loop; smooth the residual sample
 // mismatch locally instead of fading the whole song to silence at its edges.
 for(let c=0;c<2;c++){const d=loop.getChannelData(c),span=Math.round(rate*.04),middle=(d[0]+d[length-1])*.5,startDelta=middle-d[0],endDelta=middle-d[length-1];for(let i=0;i<span;i++){const weight=.5+.5*Math.cos(Math.PI*i/(span-1));d[i]+=startDelta*weight;d[length-1-i]+=endDelta*weight;}}
 loop.arrangementEvents=events;return loop;
}
async function renderFlow(){const lead=await renderSingingLayer('lead');lead.harmonyBuffer=await renderSingingLayer('harmony');lead.textureBuffer=await renderSingingLayer('texture');return lead;}
// Compact synthesized character voice + treasure chime, reused as cached one-shots.
function rewardBuffer(ctx,kind){const rate=16000,duration=kind==='key'?.85:.65,b=ctx.createBuffer(1,Math.round(rate*duration),rate),data=b.getChannelData(0);let phase=0,peak=0;
 for(let i=0;i<data.length;i++){const t=i/rate;let value=0;
  if(kind==='key'){for(const [offset,freq,level]of [[0,880,.13],[.10,1174.66,.11],[.20,1567.98,.09]]){const u=t-offset;if(u<0)continue;const envelope=(1-Math.exp(-u*170))*Math.exp(-u*7)*Math.min(1,(duration-t)/.07);value+=level*envelope*(Math.sin(2*Math.PI*freq*u)+.12*Math.sin(2*Math.PI*freq*2.01*u));}}
  else{for(const [offset,freq]of [[0,523.25],[.15,659.25],[.3,783.99]]){const u=t-offset;if(u>=0){const envelope=(1-Math.exp(-u*45))*Math.exp(-u*9)*Math.min(1,(duration-t)/.08);value+=envelope*(Math.sin(2*Math.PI*freq*u)+.05*Math.sin(4*Math.PI*freq*u));}}}
  data[i]=value;peak=Math.max(peak,Math.abs(value));
 }const limit=kind==='key'?.20:.10;if(peak>0)for(let i=0;i<data.length;i++)data[i]*=limit/peak;return b;}
class ResearchAudio{
 constructor(){this.context=null;this.muted=false;this.ending=false;this.theme='selection';this.cache=new Map();this.active=null;this.retired=new Set();this.generation=0;this.musicVolume=.42;this.sfxVolume=.5;this.musicMuted=false;this.sfxMuted=false;this.cooldowns=new Map();this.collisionArmed=true;this.pendingTheme='selection';try{Object.assign(this,JSON.parse(localStorage.getItem('rain-audio-settings')||'{}'));}catch{}try{this.muted=localStorage.getItem('rain-global-muted')==='true';}catch{}window.addEventListener('storage',e=>{if(e.key==='rain-global-muted'){this.muted=e.newValue==='true';this.applyVolumes();window.dispatchEvent(new Event('research-mute-sync'));}});document.addEventListener('visibilitychange',()=>{if(!this.context)return;if(document.hidden)this.context.suspend();else this.context.resume().catch(()=>{});});}
 async unlock(){if(!this.context){this.context=new (window.AudioContext||window.webkitAudioContext)();this.master=this.context.createGain();this.master.gain.value=.65;this.master.connect(this.context.destination);this.music=this.context.createGain();const musicFilter=this.context.createBiquadFilter();musicFilter.type='lowpass';musicFilter.frequency.value=1250;musicFilter.Q.value=.3;this.music.connect(musicFilter);musicFilter.connect(this.master);this.sfx=this.context.createGain();this.sfx.connect(this.master);const echo=this.context.createDelay(.5),tail=this.context.createGain();echo.delayTime.value=.09;tail.gain.value=.085;this.sfx.connect(echo);echo.connect(tail);tail.connect(this.master);this.applyVolumes();this.origin=this.context.currentTime; }await this.context.resume();}
 async start(){await this.unlock();this.setTheme('entrance');}
 prepare(theme){theme='explore';if(!this.cache.has(theme))this.cache.set(theme,renderFlow());return this.cache.get(theme);}
 // Scene metadata may change for sound effects, but the music never restarts.
 async setTheme(theme){if(!PROFILES[theme])theme='explore';this.pendingTheme=theme;this.theme=theme;theme='explore';if(!this.context||this.loadingTheme===theme)return;
 const generation=++this.generation;if(this.active?.theme===theme){this.loadingTheme=null;return;}this.loadingTheme=theme;let buffer;try{buffer=await this.prepare(theme);}catch(e){this.cache.delete(theme);if(generation===this.generation)this.loadingTheme=null;console.warn('音乐暂时未能生成',e);return;}if(generation!==this.generation||!this.context||this.context.state==='closed')return;this.loadingTheme=null;
 const now=this.context.currentTime,startAt=now+(this.active?1.25:0);for(const retired of this.retired){retired.gain.gain.cancelScheduledValues(now);retired.gain.gain.setTargetAtTime(0,now,.06);}
 if(this.active){const old=this.active;old.gain.gain.cancelScheduledValues(now);old.gain.gain.setValueAtTime(old.gain.gain.value,now);old.gain.gain.linearRampToValueAtTime(0,startAt);try{old.source.stop(startAt);old.harmonySource?.stop(startAt);old.textureSource?.stop(startAt);}catch{}this.retired.add(old);old.source.onended=()=>{old.source.disconnect();old.harmonySource?.disconnect();old.textureSource?.disconnect();old.harmonyGain?.disconnect();old.gain.disconnect();this.retired.delete(old);};}
 const source=this.context.createBufferSource(),gain=this.context.createGain();source.buffer=buffer;source.loop=true;source.connect(gain);gain.connect(this.music);gain.gain.setValueAtTime(0,now);gain.gain.setValueAtTime(0,startAt);gain.gain.linearRampToValueAtTime(1,startAt+(!this.active&&theme==='prologue'?7:FADE));source.start(startAt,0);
 const harmonySource=this.context.createBufferSource(),harmonyGain=this.context.createGain();harmonySource.buffer=buffer.harmonyBuffer;harmonySource.loop=true;harmonySource.connect(harmonyGain);harmonyGain.connect(gain);harmonyGain.gain.setValueAtTime(0,now);harmonyGain.gain.linearRampToValueAtTime(1,startAt+6);harmonySource.start(startAt,0);
 const textureSource=this.context.createBufferSource();textureSource.buffer=buffer.textureBuffer;textureSource.loop=true;textureSource.connect(gain);textureSource.start(startAt,0);
 this.active={source,gain,harmonySource,harmonyGain,textureSource,startedAt:startAt,theme,duration:buffer.duration};
 }
 applyVolumes(){if(!this.context)return;const now=this.context.currentTime;this.master.gain.cancelScheduledValues(now);this.master.gain.setValueAtTime(this.muted?0:.65,now);this.music.gain.cancelScheduledValues(now);this.sfx.gain.cancelScheduledValues(now);this.music.gain.setTargetAtTime(this.muted||this.musicMuted?0:this.musicVolume,now,.08);this.sfx.gain.setTargetAtTime(this.muted||this.sfxMuted?0:this.sfxVolume,now,.08);}
 configure(key,value){if(!['musicVolume','sfxVolume','musicMuted','sfxMuted'].includes(key))return;this[key]=key.endsWith('Volume')?Math.max(0,Math.min(1,Number(value))):Boolean(value);this.applyVolumes();try{localStorage.setItem('rain-audio-settings',JSON.stringify({musicVolume:this.musicVolume,sfxVolume:this.sfxVolume,musicMuted:this.musicMuted,sfxMuted:this.sfxMuted}));}catch{}}
 effect(kind){if(!['bump','confirm','key','cheer','adjust','step','intro','enter','door'].includes(kind))return;if(!this.context||this.context.state!=='running'){const reward=kind==='key'||kind==='cheer';if(reward){this.pendingRewards??=new Set();if(this.pendingRewards.has(kind))return;this.pendingRewards.add(kind);}this.unlock().then(()=>{this.pendingRewards?.delete(kind);if(this.context.state==='running')this.effect(kind);}).catch(()=>this.pendingRewards?.delete(kind));return;}const now=this.context.currentTime,cooldown=kind==='key'?1.1:kind==='cheer'?4:kind==='bump'?.75:kind==='door'?2.5:kind==='prompt'?2.5:kind==='adjust'?.2:kind==='step'?.18:.12;if(now-(this.cooldowns.get(kind)??-100)<cooldown)return;if(kind==='bump'&&!this.collisionArmed)return;this.cooldowns.set(kind,now);this.lastEffect={kind,time:now,audible:!this.muted&&!this.sfxMuted&&this.sfxVolume>0};
 if(kind==='key'||kind==='cheer'){this.rewardBuffers??=new Map();if(!this.rewardBuffers.has(kind))this.rewardBuffers.set(kind,rewardBuffer(this.context,kind));const source=this.context.createBufferSource(),filter=this.context.createBiquadFilter();source.buffer=this.rewardBuffers.get(kind);filter.type='lowpass';filter.frequency.value=kind==='key'?3200:2400;filter.Q.value=.35;source.connect(filter);filter.connect(this.sfx);source.start(now);source.onended=()=>{source.disconnect();filter.disconnect();};return;}
 if(kind==='door'){voice(this.context,this.sfx,310,now,.12,.06,'wood');voice(this.context,this.sfx,190,now+.12,.18,.055,'wood');const source=this.context.createBufferSource(),filter=this.context.createBiquadFilter(),gain=this.context.createGain();source.buffer=noise(this.context);source.loop=true;filter.type='lowpass';filter.frequency.value=420;gain.gain.setValueAtTime(0,now);gain.gain.setValueAtTime(0,now+.8);gain.gain.linearRampToValueAtTime(.11,now+1.03);gain.gain.setValueAtTime(.075,now+1.9);gain.gain.linearRampToValueAtTime(0,now+2.45);source.connect(filter);filter.connect(gain);gain.connect(this.sfx);source.start(now+.8);source.stop(now+2.48);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};return;}
 if(kind==='step'){const source=this.context.createBufferSource(),gain=this.context.createGain(),filter=this.context.createBiquadFilter();source.buffer=noise(this.context);filter.type='lowpass';filter.frequency.value=650;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.085,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+.085);source.connect(filter);filter.connect(gain);gain.connect(this.sfx);source.start(now);source.stop(now+.1);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};voice(this.context,this.sfx,145+Math.random()*15,now,.1,.065,'bass');return;}
 if(kind==='confirm'){[0,4].forEach((note,i)=>voice(this.context,this.sfx,hz(note),now+i*.12,.26,.07,'bubble'));return;}
 if(kind==='select'){voice(this.context,this.sfx,262,now,.24,.17,'bubble');return;}
 if(kind==='previewTap'){
  const source=this.context.createBufferSource(),gain=this.context.createGain(),filter=this.context.createBiquadFilter();source.buffer=noise(this.context);filter.type='lowpass';filter.frequency.value=850;filter.Q.value=.4;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.28,now+.006);gain.gain.exponentialRampToValueAtTime(.0001,now+.095);source.connect(filter);filter.connect(gain);gain.connect(this.sfx);source.start(now);source.stop(now+.11);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};voice(this.context,this.sfx,260,now+.012,.17,.16,'bubble');return;
 }
 if(kind==='intro'||kind==='enter'){
  if(kind==='interact'&&!this.muted&&!this.musicMuted&&!this.sfxMuted&&this.sfxVolume>0){const level=this.musicVolume;this.music.gain.cancelScheduledValues(now);this.music.gain.setValueAtTime(this.music.gain.value,now);this.music.gain.linearRampToValueAtTime(level*.48,now+.025);this.music.gain.setValueAtTime(level*.48,now+.28);this.music.gain.linearRampToValueAtTime(level,now+.55);}
  const tones=[349.23,440,523.25];
  tones.forEach((frequency,index)=>{
   const time=now+index*.13,g=this.context.createGain(),filter=this.context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1250;filter.Q.value=.3;
   g.gain.setValueAtTime(0,time);g.gain.linearRampToValueAtTime(.17,time+.035);g.gain.exponentialRampToValueAtTime(.0001,time+.38);filter.connect(g);g.connect(this.sfx);
   [1,2.01].forEach((ratio,i)=>{const o=this.context.createOscillator(),partial=this.context.createGain();o.type='sine';o.frequency.value=frequency*ratio;partial.gain.value=i?.13:1;o.connect(partial);partial.connect(filter);o.start(time);o.stop(time+.40);o.onended=()=>{o.disconnect();partial.disconnect();if(i===1){filter.disconnect();g.disconnect();}};});
  });return;
 }
 if(kind==='bump'){
  this.collisionArmed=false;const variation=[.98,1,1.025][Math.floor(Math.random()*3)];
  const gain=this.context.createGain(),filter=this.context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1100;filter.Q.value=.4;
  gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.26,now+.014);gain.gain.exponentialRampToValueAtTime(.065,now+.16);gain.gain.exponentialRampToValueAtTime(.0001,now+.62);filter.connect(gain);gain.connect(this.sfx);
  [1,2].forEach((ratio,i)=>{const o=this.context.createOscillator(),partial=this.context.createGain();o.type='sine';partial.gain.value=i?.12:1;
   [[0,440],[.065,215],[.15,310],[.26,245],[.4,270],[.6,252]].forEach(([time,freq],n)=>{if(n===0)o.frequency.setValueAtTime(freq*ratio*variation,now);else o.frequency.exponentialRampToValueAtTime(freq*ratio*variation,now+time);});
   o.connect(partial);partial.connect(filter);o.start(now);o.stop(now+.65);o.onended=()=>{o.disconnect();partial.disconnect();if(i===1){filter.disconnect();gain.disconnect();}};});return;
 }
 const future=['arrival','cities','finale'].includes(this.theme),kindVoice=future?'piano':'bubble';
 const notes={select:[0],confirm:[0,4],prompt:[7,9,12],interact:[0],adjust:[4],jump:[0],key:[0,4,7],door:[0,7]};
 (notes[kind]||[]).forEach((note,i)=>voice(this.context,this.sfx,hz(note),now+i*.105,kind==='prompt'?.28:.2,kind==='prompt'?.075:.055,kindVoice));
 }
 separated(){this.collisionArmed=true;}
 toggle(){this.muted=!this.muted;this.applyVolumes();try{localStorage.setItem('rain-global-muted',String(this.muted));}catch{}return this.muted;}
 end(){this.ending=true;this.setTheme('finale');}
 dispose(){this.generation++;for(const a of [this.active,...this.retired])if(a){try{a.source.stop();a.harmonySource?.stop();a.textureSource?.stop();}catch{}}this.active=null;this.retired.clear();this.context?.close();}
}
ResearchAudio.PROFILES=PROFILES;ResearchAudio.MOTIF=MOTIF;window.ResearchAudio=ResearchAudio;
})();
