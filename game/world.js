(()=>{const T=THREE,flat=c=>new T.MeshStandardMaterial({color:c,roughness:1,flatShading:true});
 const palette={floor:new T.MeshBasicMaterial({color:0x000000}),wall:flat(0x000000),white:flat(0xf2f1e8),base:flat(0x101d2a),cyan:new T.MeshBasicMaterial({color:0x315863}),green:flat(0x729d83),blue:flat(0x5799ba)};
 function block(parent,w,h,d,x,y,z,m){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function textTexture(text,sub='',color='#cadce5',bg='#080e16',w=1024,h=192){const canvas=document.createElement('canvas');canvas.width=w*2;canvas.height=h*2;const ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='500 54px "Microsoft YaHei",sans-serif';ctx.fillText(text,w/2,sub?h*.38:h*.52,w-40);if(sub){ctx.fillStyle='#8cabbc';ctx.font='26px "Microsoft YaHei",sans-serif';ctx.fillText(sub,w/2,h*.76,w-40);}const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;}
 function sign(parent,text,w,h,x,y,z,sub=''){const m=new T.MeshBasicMaterial({map:textTexture(text,sub),side:T.DoubleSide});const p=new T.Mesh(new T.PlaneGeometry(w,h),m);p.position.set(x,y,z);parent.add(p);return p;}
 function dispose(root){const geometries=new Set(),materials=new Set(),textures=new Set();root.traverse(o=>{o.userData.disposeRig?.();if(o.userData.cuteTexture)textures.add(o.userData.cuteTexture);if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){materials.add(m);if(m.map)textures.add(m.map);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());root.clear();}
 window.ResearchWorld={palette,block,sign,textTexture,dispose,
 selection(){const scene=new T.Scene();scene.background=new T.Color(0x07131e);scene.add(new T.HemisphereLight(0xffffff,0x566879,1.65));const light=new T.DirectionalLight(0xfff3e3,1.15);light.position.set(-3,5,8);scene.add(light);block(scene,30,.2,24,0,-.23,0,palette.floor);const stage=new T.Mesh(new T.CylinderGeometry(2.3,2.5,.7,48),palette.base);stage.position.y=.18;scene.add(stage);const ring=new T.Mesh(new T.TorusGeometry(2.37,.045,6,64),palette.cyan);ring.rotation.x=Math.PI/2;ring.position.y=.46;scene.add(ring);return scene;},
 async create(config){
  const scene=new T.Scene();scene.background=new T.Color(0x000000);scene.fog=new T.Fog(0x000000,45,115);scene.add(new T.HemisphereLight(0xf4faff,0x7d95a2,1));const sun=new T.DirectionalLight(0xffffff,.45);sun.position.set(6,7,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:1,far:100});scene.add(sun);
  const colliders=[],occluders=[],interactables=[],doors=[],cards=[],assets=[];let provinceInstallation=null;
  function solid(w,h,d,x,y,z,m,type='wall'){const o=block(scene,w,h,d,x,y,z,m);const c={minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,type,enabled:type!=='lintel',mesh:o};colliders.push(c);occluders.push(o);return o;}
  for(let i=0;i<4;i++){
   const z=-26*i;block(scene,24,.25,22,0,-.125,z,palette.floor);
   const glass=new T.MeshPhysicalMaterial({color:0xb3d7e0,transparent:true,opacity:.15,roughness:.8,depthWrite:false,side:T.DoubleSide});const wallMat=i===3?glass:palette.wall;
   const roomHeight=i>=2?9.2:6;solid(.32,roomHeight,22,-12,roomHeight/2,z,wallMat);solid(.32,roomHeight,22,12,roomHeight/2,z,wallMat);
   for(const zz of [z+11,z-11]){if(i===0&&zz===11||i===3&&zz===z-11){solid(24,roomHeight,.3,0,roomHeight/2,zz,wallMat);}else{solid(9,6,.3,-7.5,3,zz,wallMat);solid(9,6,.3,7.5,3,zz,wallMat);solid(6,1.3,.3,0,5.35,zz,wallMat,'lintel');}}
   if(i<3){const ceiling=block(scene,24,.14,22,0,roomHeight,z,palette.wall);occluders.push(ceiling);}else{
    for(const x of [-12,12])for(const zz of [z-11,z,z+11])block(scene,.16,9.2,.16,x,4.6,zz,palette.base);
    for(const zz of [z-11,z+11])block(scene,24,.16,.16,0,9.1,zz,palette.base);block(scene,24,.12,22,0,9.2,z,glass);
   }
   if(i===2)for(const zz of [z-11,z+11])solid(24,3.2,.3,0,7.6,zz,palette.wall,'lintel');
   for(const x of [-10.8,10.8])block(scene,.07,.025,19,x,.016,z,palette.cyan);
   if(i<3){sign(scene,ResearchExhibition.halls[i].title,10,1.05,0,4.8,z-10.79);}
   if(i<3){const corridor=z-13;block(scene,6,.25,4,0,-.125,corridor,palette.floor);solid(.3,6,4,-3,3,corridor,palette.wall);solid(.3,6,4,3,3,corridor,palette.wall);const roof=block(scene,6,.16,4,0,6,corridor,palette.wall);occluders.push(roof);
    const leaf=solid(5.8,4.7,.26,0,2.35,z-11,palette.base,'door');const lock=block(scene,.3,.5,.17,1.85,1.6,z-10.75,palette.cyan);const door={index:i,z:z-11,leaf,lock,open:false,opening:false,progress:0,collider:colliders[colliders.length-1]};doors.push(door);leaf.userData.target={type:'door',hall:i,name:'通往'+config.labels[i+1],position:new T.Vector3(1,0,z-9.9)};lock.userData.target=leaf.userData.target;interactables.push(leaf,lock);
   }
  }
  // First hall: three authentic project previews on one raised floor display.
  const target={type:'page',hall:0,name:'杭州三张地图调查',position:new T.Vector3(0,0,0),bounds:{minX:-9,maxX:9,minZ:-6.5,maxZ:4.8}};
  const mapPositions=[[0,-4],[-5,2.4],[5,2.4]];
  config.assets.maps.forEach((url,i)=>{const p=new T.Mesh(new T.PlaneGeometry(8,4.25),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.92,depthWrite:false}));p.rotation.x=-Math.PI/2;p.position.set(mapPositions[i][0],.028,mapPositions[i][1]);p.userData.target=target;scene.add(p);interactables.push(p);const task=new Promise(resolve=>new T.TextureLoader().load(url,async t=>{const image=t.image,c=document.createElement('canvas');c.width=Math.min(image.width,1024);c.height=Math.round(image.height*c.width/image.width);const ctx=c.getContext('2d');ctx.drawImage(image,0,0,c.width,c.height);const data=ctx.getImageData(0,0,c.width,c.height),bg=Array.from(data.data.slice(0,3));for(let n=0;n<data.data.length;n+=4){if(n&&n%262144===0)await new Promise(done=>setTimeout(done,0));const distance=Math.hypot(data.data[n]-bg[0],data.data[n+1]-bg[1],data.data[n+2]-bg[2]);data.data[n+3]*=T.MathUtils.clamp((distance-6)/24,0,1);}ctx.putImageData(data,0,0);const projection=new T.CanvasTexture(c);projection.colorSpace=T.SRGBColorSpace;p.material.map=projection;p.material.needsUpdate=true;p.geometry.dispose();p.geometry=new T.PlaneGeometry(8,8*c.height/c.width);t.dispose();resolve(true);},undefined,()=>resolve(false)));assets.push(task);
  });
  const mapGlow=new T.Mesh(new T.CircleGeometry(.01,8),palette.cyan);mapGlow.visible=false;scene.add(mapGlow);const ripples=Array.from({length:26},()=>{const ring=new T.Mesh(new T.RingGeometry(.98,1,64),new T.MeshBasicMaterial({color:0x537f93,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set((Math.random()-.5)*19,.019,(Math.random()-.5)*15);scene.add(ring);return{ring,age:Math.random()*3,duration:2.4+Math.random()*1.2};});const arrow=new T.Group();const stem=block(arrow,.16,.55,.12,0,.26,0,palette.cyan);const sh=new T.Shape([new T.Vector2(-.36,.1),new T.Vector2(.36,.1),new T.Vector2(0,-.36)]);const triangle=new T.Mesh(new T.ExtrudeGeometry(sh,{depth:.1,bevelEnabled:false}),palette.cyan);triangle.position.z=-.05;arrow.add(triangle);arrow.position.set(0,3.8,0);scene.add(arrow);
  // Second hall: geometry-only visual entrance, not a duplicate simulator.
  const table=solid(8.5,.74,7.5,0,.37,-26,palette.base,'exhibit');block(scene,8.6,.035,7.6,0,.757,-26,palette.white);
  const sandTarget={type:'page',hall:1,name:'杭州降雨沙盘模拟',position:new T.Vector3(0,0,-26),bounds:{minX:-4.3,maxX:4.3,minZ:-29.8,maxZ:-22.2}};table.userData.target=sandTarget;interactables.push(table);
  // Exact miniature of the existing knowledge sandbox, not a different grid city.
  let sandboxAsset=null;
  function loadSandboxBuffers(){return Promise.all([0,1,2,3].map(part=>fetch('./knowledge-sandbox-part-'+part+'.bin?v=retiehe36').then(r=>{if(!r.ok)throw Error('沙盘几何下载失败');return r.arrayBuffer();}))).then(parts=>{const joined=new Uint8Array(parts.reduce((sum,part)=>sum+part.byteLength,0));let offset=0;for(const part of parts){joined.set(new Uint8Array(part),offset);offset+=part.byteLength;}return joined.buffer;});}
  function loadSandbox(){if(sandboxAsset)return sandboxAsset;sandboxAsset=Promise.all([fetch('./knowledge-sandbox-compact.json?v=packed1').then(r=>{if(!r.ok)throw Error('沙盘信息下载失败');return r.json();}),loadSandboxBuffers()]).then(async([data,buffers])=>{
   function revive(value){if(!value||typeof value!=='object')return value;if(value.$buffer){const b=value.$buffer;return new window[b.type](buffers,b.offset,b.length);}for(const key of Object.keys(value))value[key]=revive(value[key]);return value;}
   const model=new T.ObjectLoader().parse(revive(data));
   model.name='KnowledgeSandboxMiniature';model.scale.setScalar(.019);model.position.set(0,1.3,-26);
   // Preserve original instanced buildings, normals, textures and hidden pick helpers.
   model.traverse(o=>{if(!o.isMesh)return;o.castShadow=false;o.receiveShadow=false;o.userData.target=sandTarget;if(!Array.isArray(o.material)&&o.material.visible!==false)interactables.push(o);});scene.add(model);return true;
  }).catch(error=>{console.warn('知识沙盘模型加载失败',error);sandboxAsset=null;return false;});return sandboxAsset;}
  const sandGlow=block(scene,8.6,.04,.08,0,1.26,-22.15,palette.cyan);sign(scene,'杭州微缩沙盘',5,.45,0,1.03,-22.22);
  // Third hall: verified provincial geometries, not a hand-drawn national border.
  const chinaTask=fetch(config.assets.china).then(r=>{if(!r.ok)throw Error('中国地图资源加载失败');return r.json();}).then(data=>{
    provinceInstallation=ResearchProvinceInstallation.create(scene,data,interactables);return true;
   }).catch(e=>{sign(scene,'地图素材未能载入',9,.6,0,3,-58.75);console.warn(e.message);return false;});assets.push(chinaTask);
  const desk=solid(4,.85,1.4,0,.425,-54.4,palette.base,'exhibit');block(scene,4.1,.1,1.5,0,.9,-54.4,palette.white);const citiesTarget={type:'page',hall:2,name:'四座城市治理方案',position:new T.Vector3(0,0,-54.4),bounds:{minX:-2,maxX:2,minZ:-55.1,maxZ:-53.7}};desk.userData.target=citiesTarget;interactables.push(desk);const citiesGlow=block(scene,4.1,.04,.06,0,.96,-53.62,palette.cyan);sign(scene,'跨城市方案调查',3.8,.45,0,.71,-53.65);
  // Replace the old map desk with a walkable suspended province installation.
  desk.visible=false;colliders.find(c=>c.mesh===desk).enabled=false;occluders.splice(occluders.indexOf(desk),1);interactables.splice(interactables.indexOf(desk),1);citiesGlow.visible=false;scene.children.filter(o=>o.position.z===-54.4||o.position.z===-53.65).forEach(o=>o.visible=false);
  // Final photo-backed glass room and falling rain.
  const rainView=new T.Group();rainView.name='RainNightObservation';scene.add(rainView);
  const futureCity=null; // Photo-backed finale, as requested; no city geometry.
  const cityLightTime={value:0};
  // Create panorama surfaces immediately; load only the final image, once.
  const cityAsset=Promise.resolve(true);for(const [w,h,x,y,z,angle]of [[23.9,9.05,0,4.56,-89.25,0],[22,9.05,-12.22,4.56,-78,Math.PI/2],[22,9.05,12.22,4.56,-78,-Math.PI/2]]){const view=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:0x07131e,side:T.DoubleSide,fog:false}));view.name='RainCityPanorama';view.position.set(x,y,z);view.rotation.y=angle;rainView.add(view);}
  const rainPositions=new Float32Array(650*6);for(let i=0;i<650;i++){const x=(Math.random()-.5)*28,y=Math.random()*12,z=-89.5-Math.random()*3;rainPositions.set([x,y,z,x-.025,y-.28,z],i*6);}const rainGeo=new T.BufferGeometry();rainGeo.setAttribute('position',new T.BufferAttribute(rainPositions,3));const rain=new T.LineSegments(rainGeo,new T.LineBasicMaterial({color:0x98b8d0,transparent:true,opacity:.22,depthWrite:false,fog:false}));rainView.add(rain);
  // Retain more native vertical detail, rather than enlarging a narrow crop.
  cityAsset.then(()=>{rainView.children.filter(o=>o.material?.map&&o.material.onBeforeCompile).forEach(view=>{
   view.material.map.repeat.y=.62;view.material.map.offset.y=.15;view.material.color.set(0xdce6ef);
   const previous=view.material.onBeforeCompile;view.material.onBeforeCompile=shader=>{previous(shader);shader.fragmentShader=shader.fragmentShader.replace('(centerColor-adjacentColor)*.35','(centerColor-adjacentColor)*.45').replace('diffuseColor.rgb,1.55','diffuseColor.rgb,1.18');shader.fragmentShader=shader.fragmentShader.replace('float nightLuma=','diffuseColor.rgb=pow(max(diffuseColor.rgb,vec3(0.)),vec3(1.06))*1.10;float nightLuma=');shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','float neonPulse=.35+.65*smoothstep(-.55,.8,sin(cityTime*(.55+lightSeed*.35)+lightSeed*41.));vec3 neonTint=mix(vec3(.025,.32,.48),vec3(.37,.055,.23),step(.5,fract(lightSeed*7.)));diffuseColor.rgb+=neonTint*cityLight*selective*neonPulse*.35;\n#include <color_fragment>');};view.material.needsUpdate=true;
  });});
  const wetGlass=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time:{value:0}},vertexShader:`varying vec2 vUv;varying vec3 vWorld;varying vec3 vNormal;void main(){vUv=uv;vWorld=(modelMatrix*vec4(position,1.)).xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`,fragmentShader:`
   precision highp float;uniform float time;uniform sampler2D cityBehindGlass;uniform vec2 cityRepeat;uniform vec2 cityOffset;uniform float screenMode;uniform vec2 screenSize;varying vec2 vUv;varying vec3 vWorld;varying vec3 vNormal;
   float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
   vec2 drops(vec2 uv,vec2 grid,float salt){vec2 q=uv*grid;float rim=0.,shine=0.;for(int ix=-1;ix<=1;ix++){for(int iy=-1;iy<=1;iy++){vec2 cell=floor(q)+vec2(float(ix),float(iy));float seed=hash(cell+salt);float moving=step(.56,seed);float phase=time*(.35+seed*1.7);float s=hash(cell+salt*3.);float fall=pow(fract(phase+hash(cell+17.)),1.45);vec2 center=cell+vec2(.12+.76*hash(cell+5.),mix(hash(cell+9.),1.-fall,moving));vec2 p=q-center;p.x+=sin(time*(.25+seed)+seed*30.)*.025*moving;float r=.060+s*.105;float shape=length(p*vec2(1.,mix(.95,.57,moving)));float bead=1.-smoothstep(r,r+.016,shape);float highlight=(1.-smoothstep(.010,.032,length(p-vec2(-r*.24,r*.38))))*.85;float contour=(1.-smoothstep(.008,.025,abs(shape-r*.83)))*bead;rim+=bead*(.28+.18*s)+contour*.20;shine+=highlight+contour*.12;float trail=(1.-smoothstep(.006,.021,abs(p.x+sin(p.y*9.+seed*21.)*.005)))*(1.-smoothstep(.08,.85,p.y))*step(.04,p.y);rim+=trail*.23*moving;}}return vec2(rim,shine);}
   void main(){vec2 water=drops(vUv,vec2(96.,34.),3.)+drops(vUv+vec2(.007,.017),vec2(65.,25.),19.)*.72;
    vec3 viewDir=normalize(cameraPosition-vWorld);float fresnel=pow(1.-abs(dot(viewDir,normalize(vNormal))),3.);
    float diagonal=vUv.x+vUv.y*.29+viewDir.x*.045;
    float reflection=exp(-pow((diagonal-.31)/.055,2.))*.095+exp(-pow((diagonal-.76)/.12,2.))*.035;
    float ceiling=exp(-pow((vUv.y-.88+vUv.x*.045)/.009,2.))*.07;
    float edge=pow(1.-min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y))*2.,12.)*.035;
    float cyanPulse=.3+.7*smoothstep(-.5,.85,sin(time*.85));float pinkPulse=.25+.75*smoothstep(-.5,.85,sin(time*.67+2.6));
    float cyanGlow=exp(-pow((vUv.x-.23-viewDir.x*.035)/.075,2.))*exp(-pow((vUv.y-.42)/.42,2.))*cyanPulse;
    float pinkGlow=exp(-pow((vUv.x-.73-viewDir.x*.04)/.095,2.))*exp(-pow((vUv.y-.31)/.38,2.))*pinkPulse;
    vec3 neonReflection=vec3(.055,.62,.88)*cyanGlow+vec3(.77,.095,.46)*pinkGlow;
    float neonAmount=(cyanGlow+pinkGlow)*.09;
    float alpha=.001+fresnel*.012+reflection*.10+ceiling*.12+edge*.20+water.x*.42+water.y*.55+neonAmount*.25;
    vec2 refractOffset=clamp(vec2(dFdx(water.x),dFdy(water.x))*vec2(.09,.06),vec2(-.004),vec2(.004));
    vec2 behindUv=mix((vUv+refractOffset)*cityRepeat+cityOffset,gl_FragCoord.xy/screenSize+refractOffset,screenMode);
    vec3 refractedCity=texture2D(cityBehindGlass,behindUv).rgb;
    vec3 glassColor=refractedCity*.96;
    gl_FragColor=vec4(glassColor+water.y*.28+neonReflection*(.12+water.y*.65),clamp(alpha,0.,.42));}
   `});const glassPanes=[];for(const [w,x,z,angle,segment]of [[23.7,0,-88.81,0,1],[21.7,-11.81,-78,Math.PI/2,0],[21.7,11.81,-78,-Math.PI/2,2]]){const glass=wetGlass.clone();glass.uniforms.time=wetGlass.uniforms.time;glass.uniforms.cityBehindGlass={value:null};glass.uniforms.cityRepeat={value:new T.Vector2(1/3,.62)};glass.uniforms.cityOffset={value:new T.Vector2(segment/3,.15)};glass.uniforms.screenMode={value:0};glass.uniforms.screenSize={value:new T.Vector2(1,1)};const pane=new T.Mesh(new T.PlaneGeometry(w,8.9),glass);pane.name='ReflectiveWetGlass';pane.position.set(x,4.55,z);pane.rotation.y=angle;rainView.add(pane);glassPanes.push(pane);cityAsset.then(()=>{const image=rainView.children.find(o=>o.material?.map&&Math.abs(o.rotation.y-angle)<.01);if(image){glass.uniforms.cityBehindGlass.value=image.material.map;if(futureCity)image.visible=false;}});}
  let glassTarget=null,lastCityTime=0;
  const photoAsset=cityAsset.then(()=>new Promise(resolve=>new T.TextureLoader().load('./hangzhou-qianjiang-night-panorama.png',photo=>{
   photo.colorSpace=T.SRGBColorSpace;photo.anisotropy=16;
   // One tiny static glyph atlas; the GPU scrolls it without repainting canvases.
   const ledCanvas=document.createElement('canvas');ledCanvas.width=128;ledCanvas.height=768;const ledContext=ledCanvas.getContext('2d');ledContext.fillStyle='#ffffff';ledContext.textAlign='center';ledContext.textBaseline='middle';ledContext.font='bold 104px "Microsoft YaHei",sans-serif';Array.from('新征程新目标').forEach((char,i)=>ledContext.fillText(char,64,i*128+64,112));const ledTexture=new T.CanvasTexture(ledCanvas);ledTexture.minFilter=T.LinearFilter;ledTexture.generateMipmaps=false;
   // Measured facade bounds in panorama UV space: individual rooms switch,
   // not whole buildings. No extra geometry or per-frame canvas redraws.
   const officeFacades=[
    [.033,.060,.60,.83,5,24],[.088,.113,.60,.78,7,20],
    [.121,.139,.60,.75,5,19],[.164,.181,.50,.63,6,14],
    [.134,.166,.12,.44,7,24],[.202,.227,.025,.22,5,14],
    [.412,.435,.525,.620,7,12],[.444,.461,.54,.65,5,13],
    [.470,.484,.56,.66,5,14],[.488,.502,.56,.645,5,10],
    [.608,.619,.54,.65,4,13],[.640,.653,.54,.63,4,10],
    [.679,.700,.04,.24,5,18],[.752,.773,.02,.16,5,12],
    [.838,.848,.565,.70,4,17],[.865,.880,.56,.69,5,16]
   ];
   const officeFunctions=`
void officeRooms(inout vec3 color,vec2 uv,vec4 bounds,vec2 grid,float salt){
 if(uv.x<bounds.x||uv.x>bounds.y||uv.y<bounds.z||uv.y>bounds.w)return;
 vec2 room=(uv-bounds.xz)/(bounds.yw-bounds.xz)*grid;
 vec2 id=floor(room);vec2 local=fract(room);
 float seed=fract(sin(dot(id+salt,vec2(12.9898,78.233)))*43758.5453);
 if(seed<.44)return;
 float mask=smoothstep(.22,.30,local.x)*(1.-smoothstep(.70,.78,local.x))*smoothstep(.22,.30,local.y)*(1.-smoothstep(.66,.74,local.y));
 float on=smoothstep(-.035,.035,sin(photoTime*(.46+seed*.38)+seed*83.+salt));
 vec3 roomLight=mix(vec3(.28,.43,.61),vec3(.58,.46,.26),step(.72,seed));
 color=mix(color,mix(vec3(.004,.009,.016),roomLight,on),mask*.94);
}
`;
   const officeCalls=officeFacades.map((b,i)=>`officeRooms(diffuseColor.rgb,vMapUv,vec4(${b.slice(0,4).map(n=>n.toFixed(4)).join(',')}),vec2(${Math.round(b[4]*1.5).toFixed(1)},${Math.round(b[5]*1.4).toFixed(1)}),${(i+1).toFixed(1)});`).join('\n');
   const views=rainView.children.filter(o=>o.name==='RainCityPanorama');
   views.forEach(view=>{const front=Math.abs(view.rotation.y)<.01,segment=front?1:view.rotation.y>0?0:2,texture=photo.clone();texture.repeat.set(1/3,.62);texture.offset.set(segment/3,.15);texture.needsUpdate=true;const material=new T.MeshBasicMaterial({map:texture,color:0x9baed2,side:T.DoubleSide,fog:false});material.onBeforeCompile=shader=>{shader.uniforms.photoTime=cityLightTime;shader.uniforms.facadeLetters={value:ledTexture};shader.fragmentShader='uniform float photoTime;uniform sampler2D facadeLetters;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
diffuseColor.rgb=pow(max(diffuseColor.rgb,vec3(0.)),vec3(1.45))*vec3(.78,.84,.96);
float lamp=smoothstep(.12,.55,dot(diffuseColor.rgb,vec3(.21,.72,.07)));
vec2 windowCell=floor(vMapUv*vec2(260.,140.));
float windowSeed=fract(sin(dot(windowCell,vec2(12.9898,78.233)))*43758.5453);
float waterArea=step(.24,vMapUv.x)*step(vMapUv.x,.76)*step(.20,vMapUv.y)*step(vMapUv.y,.48);
float buildingMask=(1.-waterArea)*step(vMapUv.y,.87);
// Narrow, asynchronous wave highlights stay inside the river and follow
// existing blue/gold reflections rather than flashing the whole surface.
float riverMask=smoothstep(.245,.275,vMapUv.x)*(1.-smoothstep(.745,.775,vMapUv.x))*smoothstep(.205,.235,vMapUv.y)*(1.-smoothstep(.465,.485,vMapUv.y));
float easternRiver=smoothstep(.76,.80,vMapUv.x)*smoothstep(.335,.35,vMapUv.y)*(1.-smoothstep(.40,.423,vMapUv.y));
riverMask=max(riverMask,easternRiver);
float wavePhase=vMapUv.y*1700.+sin(vMapUv.x*190.+photoTime*.65)*1.7+photoTime*1.5;
float thinWave=pow(.5+.5*sin(wavePhase),18.);
float waveBreak=smoothstep(.25,.80,.5+.5*sin(vMapUv.x*680.-photoTime*.80+sin(vMapUv.y*480.)));
float reflectionLuma=dot(diffuseColor.rgb,vec3(.21,.72,.07));
float litReflection=smoothstep(.015,.13,reflectionLuma);
float shimmer=thinWave*waveBreak*riverMask*(.025+litReflection*.15);
vec3 reflectionTint=mix(vec3(.16,.40,.70),vec3(.75,.57,.30),smoothstep(.015,.08,diffuseColor.r-diffuseColor.b*.7));
diffuseColor.rgb+=reflectionTint*shimmer;
${officeCalls}
// Replace the photographed stationary ferries with their moving image patches.
// River color fills the old position; bright hull/cabin pixels travel together.
for(int boat=0;boat<2;boat++){
 vec2 source=boat==0?vec2(.322,.379):vec2(.803,.337);
 vec2 halfSize=boat==0?vec2(.008,.010):vec2(.009,.010);
 vec2 oldLocal=(vMapUv-source)/halfSize;
 float erase=(1.-smoothstep(.70,1.,abs(oldLocal.x)))*(1.-smoothstep(.65,1.,abs(oldLocal.y)));
 vec3 river=texture2D(map,vMapUv+vec2(0.,.024)).rgb*vec3(.61,.68,.82);
 diffuseColor.rgb=mix(diffuseColor.rgb,river,erase);
 float travel=sin(photoTime*.045+float(boat)*2.1)*.060;
 // First ferry stays in the middle window's visible river, not the
 // panorama seam between the left and front windows.
 vec2 route=boat==0?vec2(.490,.360):source+vec2(0.,.008);
 vec2 destination=route+vec2(travel,0.);
 float boatScale=boat==0?1.05:1.;
 vec2 patchUv=(vMapUv-destination)/boatScale+source;
 vec2 boatLocal=(vMapUv-destination)/(halfSize*boatScale);
 float boatMask=(1.-smoothstep(.72,1.,abs(boatLocal.x)))*(1.-smoothstep(.55,1.,abs(boatLocal.y)));
 vec3 boatPixel=texture2D(map,patchUv).rgb;
 float hull=smoothstep(.15,.32,max(boatPixel.r,max(boatPixel.g,boatPixel.b)))*boatMask;
 diffuseColor.rgb=mix(diffuseColor.rgb,boatPixel*vec3(.65,.73,.88),hull);
 float direction=cos(photoTime*.045+float(boat)*2.1);
 vec2 wake=vMapUv-destination;
 float behind=step(0.,-wake.x*sign(direction))*step(abs(wake.x),.026);
 float ripple=(1.-smoothstep(.0006,.0025,abs(abs(wake.y+.002)-abs(wake.x)*.09)))*behind*(1.-abs(wake.x)/.026);
 diffuseColor.rgb+=vec3(.09,.16,.23)*ripple;
}
float neonBlue=smoothstep(.035,.25,diffuseColor.b-diffuseColor.r*.65)*lamp*buildingMask;
float neonCycle=.5+.5*sin(photoTime*.95+floor(vMapUv.x*97.)*2.7);
diffuseColor.rgb+=vec3(.035,.15,.24)*neonBlue*neonCycle;
// Road-aligned moving headlights and taillights. All six segments share a
// distance-based phase, so vehicles move through bends without restarting.
for(int lane=0;lane<6;lane++){
 vec2 a,b;float offset;
 if(lane==0){a=vec2(.057,.32);b=vec2(.076,.17);offset=0.;}
 else if(lane==1){a=vec2(.076,.17);b=vec2(.116,-.01);offset=.1512;}
 else if(lane==2){a=vec2(.199,.396);b=vec2(.263,.29);offset=0.;}
 else if(lane==3){a=vec2(.263,.29);b=vec2(.351,.115);offset=.1238;}
 else if(lane==4){a=vec2(.351,.115);b=vec2(.50,-.012);offset=.3197;}
 else{a=vec2(.735,.448);b=vec2(.972,.391);offset=.53;}
 vec2 tangent=b-a;float roadLength=length(tangent);vec2 direction=tangent/roadLength;
 float along=dot(vMapUv-a,direction);float routeGate=smoothstep(0.,.003,along)*(1.-smoothstep(roadLength-.003,roadLength,along));
 float across=dot(vMapUv-a,vec2(-direction.y,direction.x));
 float carPhase=fract((along+offset)*170.-photoTime*.48+float(lane)*.03);
 float tailPhase=fract((along+offset)*137.+photoTime*.38+.37);
 float headlights=1.-smoothstep(.025,.12,min(carPhase,1.-carPhase));
 float taillights=1.-smoothstep(.025,.12,min(tailPhase,1.-tailPhase));
 float headRoad=1.-smoothstep(.00028,.00095,abs(across-.0011));
 float tailRoad=1.-smoothstep(.00028,.00095,abs(across+.0011));
 float glow=(1.-smoothstep(.0006,.003,abs(across)))*.06;
 diffuseColor.rgb+=routeGate*(vec3(.95,.91,.77)*headlights*headRoad*.95+vec3(.78,.075,.025)*taillights*tailRoad*.82+vec3(.12,.18,.22)*glow*(headlights+taillights));
}
vec2 facade=vec2((vMapUv.x-.566)/.009,(vMapUv.y-.52)/.24);
float facadeMask=step(0.,facade.x)*step(facade.x,1.)*step(0.,facade.y)*step(facade.y,1.);
float glyph=texture2D(facadeLetters,vec2(clamp(facade.x,0.,1.),fract(facade.y*.72-photoTime*.045))).a;
float fade=smoothstep(0.,.08,facade.y)*(1.-smoothstep(.91,1.,facade.y));
vec2 ledCell=fract(facade*vec2(24.,144.))-.5;float ledDots=1.-smoothstep(.28,.48,length(ledCell));
diffuseColor.rgb+=vec3(.28,.78,1.)*glyph*facadeMask*fade*(.40+.28*ledDots);
`);shader.fragmentShader=shader.fragmentShader.replace('void main() {',officeFunctions+'\nvoid main() {');};view.material=material;view.visible=true;
    const pane=glassPanes.find(p=>Math.abs(p.rotation.y-view.rotation.y)<.01);if(pane){pane.material.uniforms.cityBehindGlass.value=texture;pane.material.uniforms.cityRepeat.value.copy(texture.repeat);pane.material.uniforms.cityOffset.value.copy(texture.offset);}
   });resolve(true);
  },undefined,()=>resolve(false))));
  // The finale panorama loads in the background, not on the entrance critical path.
  function prepareFrame(renderer,camera){if(!futureCity||camera.position.z>-62)return;futureCity.update(Math.min(.05,Math.max(0,cityLightTime.value-lastCityTime)),cityLightTime.value);lastCityTime=cityLightTime.value;const size=renderer.getDrawingBufferSize(new T.Vector2()),width=Math.min(1280,size.x),height=Math.round(width*size.y/size.x);if(!glassTarget){glassTarget=new T.WebGLRenderTarget(width,height);scene.userData.rainTarget=glassTarget;}if(glassTarget.width!==width||glassTarget.height!==height)glassTarget.setSize(width,height);glassPanes.forEach(p=>p.visible=false);const previous=renderer.getRenderTarget();renderer.setRenderTarget(glassTarget);renderer.render(scene,camera);renderer.setRenderTarget(previous);glassPanes.forEach(p=>{p.visible=true;p.material.uniforms.cityBehindGlass.value=glassTarget.texture;p.material.uniforms.screenMode.value=1;p.material.uniforms.screenSize.value.copy(size);});}
  // A quiet final-room terminal: a few static meshes, no new render target or lights.
  const computer=new T.Group();computer.name='FinalDedicationComputer';scene.add(computer);
  const computerTarget={type:'dedication',hall:3,name:'雨信终端 · 致敬与创作人员',position:new T.Vector3(0,0,-82.2)};
  const caseMat=flat(0x7c8375),deskMat=flat(0x243139);
  const desktop=block(computer,2.65,.14,1.2,0,1.35,-84,deskMat);
  for(const x of [-1.05,1.05])block(computer,.13,1.28,.8,x,.64,-84,deskMat);
  block(computer,1.85,1.3,.30,0,2.15,-84.12,caseMat);
  block(computer,.28,.24,.23,0,1.55,-84.12,caseMat);
  const screen=sign(computer,'雨信终端',1.60,1.02,0,2.15,-83.958,'致敬与创作人员');screen.material.map.dispose();screen.material.map=textTexture('雨信终端','致敬与创作人员','#c4d6b6','#101b18',768,480);
  block(computer,1.35,.08,.42,0,1.47,-83.69,caseMat);
  const keysTexture=textTexture('▱ ▱ ▱ ▱ ▱ ▱','▱ ▱ ▱ ▱ ▱','#9ca58e','#687261',512,192),keyboard=new T.Mesh(new T.PlaneGeometry(1.2,.32),new T.MeshBasicMaterial({map:keysTexture}));keyboard.rotation.x=-Math.PI/2;keyboard.position.set(0,1.516,-83.69);computer.add(keyboard);
  block(computer,.04,.04,.015,.70,1.59,-83.962,new T.MeshBasicMaterial({color:0xa8c892}));
  computer.traverse(o=>{if(o.isMesh){o.userData.target=computerTarget;interactables.push(o);}});
  colliders.push({minX:-1.325,maxX:1.325,minZ:-84.6,maxZ:-83.4,type:'table',enabled:true,mesh:desktop});occluders.push(desktop);
  // Opaque reveals keep the panorama strictly behind the window opening.
  const reveal=new T.MeshBasicMaterial({color:0x080b0d});
  for(const side of [-1,1]){block(scene,.34,.42,22.4,side*11.85,.15,-78,reveal);block(scene,.34,.42,22.4,side*11.85,9.18,-78,reveal);block(scene,.2,16,44,side*12.1,17.2,-78,reveal);block(scene,.2,16,44,side*12.1,-8,-78,reveal);}
  block(scene,24.4,.42,.34,0,.15,-88.7,reveal);block(scene,24.4,.42,.34,0,9.18,-88.7,reveal);
  block(scene,48,16,.2,0,17.2,-89.1,reveal);block(scene,48,16,.2,0,-8,-89.1,reveal);
  [mapGlow,sandGlow,citiesGlow].forEach(o=>{o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.55;});
  // A slow optional image/model must not hold the whole entrance screen forever.
  // Late assets still fill their meshes when ready; the playable shell is complete.
  const exhibition=ResearchExhibition.decorate(scene);
  let assetTimer;const loaded=await Promise.race([Promise.all(assets),new Promise(resolve=>{assetTimer=setTimeout(()=>resolve(null),6000);})]);clearTimeout(assetTimer);
  return{scene,colliders,occluders,interactables,doors,cards,arrow,exhibition,get provinceInstallation(){return provinceInstallation;},prepareFrame,ensureNearby:z=>{if(z<-6)loadSandbox();},glows:[mapGlow,sandGlow,citiesGlow],assetsOK:loaded?loaded.every(Boolean):false,
   update(dt,t){ripples.forEach(r=>{r.age+=dt;if(r.age>r.duration){r.age=0;r.ring.position.x=(Math.random()-.5)*19;r.ring.position.z=(Math.random()-.5)*15;}const u=r.age/r.duration;r.ring.scale.setScalar(.08+u*.85);r.ring.material.opacity=Math.sin(Math.PI*u)*.105;});if(arrow.visible){arrow.position.y=3.8+Math.sin(t*2)*.18;arrow.scale.setScalar(.9+.1*Math.sin(t*3));}const p=rainGeo.attributes.position;for(let i=0;i<p.count;i++){p.setY(i,p.getY(i)-dt*4.6);if(p.getY(i)<-.5)p.setY(i,12);}p.needsUpdate=true;wetGlass.uniforms.time.value=t;cityLightTime.value=t;},
   feedback(hall,near,progress){this.glows.forEach((o,i)=>{o.scale.x=i===hall&&near?1.02:1;o.material.opacity=i===hall&&near?1:.55;});exhibition.feedback(progress);provinceInstallation?.feedback(progress);cards.forEach(c=>c.light.material.color.set(progress.cities.has(c.city)?0x70dfa4:0x667c85));}
  };
 }
};})();
