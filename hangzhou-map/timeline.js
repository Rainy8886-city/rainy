/* Hangzhou administrative boundaries; all annual observations below are illustrative. */
(()=>{
  const T=window.THREE,host=document.getElementById('hangzhouTimeScene');
  if(!T||!host)return;
  const slider=document.getElementById('hangzhouYearSlider'),yearOut=document.getElementById('hangzhouActiveYear'),tooltip=document.getElementById('hangzhouTimeTooltip');
  const section=document.getElementById('hangzhou-map-page'),ticks=[...document.querySelectorAll('#hangzhouYearTicks span')];
  const sites=[
    {name:'西湖东侧',lon:120.115,lat:30.270,sigma:.45},
    {name:'拱墅片区',lon:120.150,lat:30.340,sigma:.48},
    {name:'上城片区',lon:120.205,lat:30.245,sigma:.42},
    {name:'余杭片区',lon:120.015,lat:30.370,sigma:.56},
    {name:'滨江片区',lon:120.175,lat:30.175,sigma:.44},
    {name:'萧山片区',lon:120.285,lat:30.165,sigma:.52},
    {name:'临平片区',lon:120.305,lat:30.435,sigma:.46},
    {name:'钱塘片区',lon:120.435,lat:30.295,sigma:.53},
    {name:'富阳片区',lon:119.960,lat:30.055,sigma:.62},
    {name:'临安片区',lon:119.730,lat:30.235,sigma:.48},
    {name:'桐庐片区',lon:119.685,lat:29.795,sigma:.45},
    {name:'建德片区',lon:119.285,lat:29.485,sigma:.46},
    {name:'淳安片区',lon:119.030,lat:29.610,sigma:.54},
    {name:'淳安北部',lon:118.860,lat:29.940,sigma:.48},
    {name:'桐庐西侧',lon:119.500,lat:29.830,sigma:.43},
    {name:'临安西侧',lon:119.340,lat:30.210,sigma:.52}
  ];
  const peripheralFlood=[
    [.22,.18,.12,.16,.09,.24,.13],
    [.15,.32,.20,.11,.17,.14,.27],
    [.31,.14,.27,.22,.12,.18,.16],
    [.20,.36,.24,.43,.14,.29,.22],
    [.38,.25,.17,.26,.21,.19,.58],
    [.32,.45,.38,.47,.29,.34,.42],
    [.23,.17,.29,.18,.11,.24,.20],
    [.36,.27,.18,.30,.25,.21,.33],
    [.26,.48,.32,.23,.18,.39,.28],
    [.18,.25,.21,.33,.15,.27,.23]
  ];
  const flood=[
    [.78,.42,.61,.58,.28,.37,.16,.23,.08,.03,.02,.02],
    [.32,.91,.75,.44,.63,.48,.35,.17,.06,.04,.02,.01],
    [.22,.29,.35,.19,.41,.66,.23,.39,.10,.02,.03,.02],
    [.48,.65,.82,.31,.43,.88,.47,.71,.05,.04,.02,.01],
    [.90,.58,.46,.84,.62,.36,.54,.28,.12,.06,.03,.02],
    [.67,.94,.98,.72,.86,.91,.79,.82,.16,.04,.02,.03],
    [.38,.25,.47,.67,.31,.42,.29,.19,.06,.03,.01,.02],
    [.29,.63,.55,.41,.36,.71,.88,.81,.09,.05,.02,.01],
    [.62,.48,.79,.53,.72,.51,.39,.46,.13,.03,.03,.02],
    [.33,.41,.66,.28,.46,.37,.58,.43,.07,.03,.01,.01]
  ];
  flood.forEach((values,year)=>peripheralFlood[year].forEach((value,i)=>values[i+9]=value));
  const rainBase=[1370,1580,1180,1730,1670,2100,1310,1810,1560,1430];
  const observations=flood.map((values,y)=>sites.map((site,i)=>({
    flood:values[i]<.10?0:values[i],
    rain:Math.round((rainBase[y]+280*Math.sin((y+2)*(i+1)*1.31)+values[i]*300-(i>=8?460:0))/10)*10
  })));
  let renderer;
  try{renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});}catch(error){console.error('Hangzhou renderer:',error);return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.setClearColor('#09151e',1);
  if('outputColorSpace' in renderer)renderer.outputColorSpace=T.SRGBColorSpace;
  else if('outputEncoding' in renderer)renderer.outputEncoding=T.sRGBEncoding;
  host.append(renderer.domElement);
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-9,9,5,-5,.1,100);
  camera.position.set(0,21.2,20);camera.lookAt(0,1.2,0);
  scene.add(new T.AmbientLight('#ffffff',.86));
  const light=new T.DirectionalLight('#e8f6ff',.55);light.position.set(-7,12,8);scene.add(light);
  const rim=new T.DirectionalLight('#91b7d3',.22);rim.position.set(8,7,-8);scene.add(rim);
  const mapGroup=new T.Group();mapGroup.rotation.y=-.12;scene.add(mapGroup);
  const surfaces=[],borders=[],cones=[],count=sites.length;
  const pale=new T.Color('#c9e5eb'),mid=new T.Color('#49aabb');
  const deep=new T.Color().setRGB(6/255,71/255,106/255).convertSRGBToLinear();
  // Explicit linear RGB keeps marker colors consistent with the renderer's sRGB output.
  const redPale=new T.Color().setRGB(1,.78,.72).convertSRGBToLinear();
  const redMid=new T.Color().setRGB(1,.35,.30).convertSRGBToLinear();
  const redDeep=new T.Color().setRGB(.34,.005,.055).convertSRGBToLinear();
  const lightNormal=new T.Vector3(-.35,.86,.37).normalize();
  let current=observations[0].map(item=>({...item})),start=current.map(item=>({...item})),target=current.map(item=>({...item}));
  let strengths=current.map(item=>Math.pow(item.flood,1.3));
  let ready=false,visible=false,frame=0,transitionStart=0,transitioning=false,project;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const smooth=(a,b,value)=>{const t=clamp((value-a)/(b-a),0,1);return t*t*(3-2*t);};
  function coefficients(x,z){
    const weights=new Float32Array(count),dx=new Float32Array(count),dz=new Float32Array(count),skirts=new Float32Array(count),skirtX=new Float32Array(count),skirtZ=new Float32Array(count);
    sites.forEach((site,i)=>{
      const u=x-site.x,v=z-site.z,s2=site.sigma*site.sigma,r2=(u*u+v*v)/s2;
      if(r2>42)return;
      const core2=site.coreSigma*site.coreSigma,peak=Math.exp(-(u*u+v*v)/core2*.5),shoulder=Math.exp(-r2*.14),w=.90*peak+.10*shoulder;
      weights[i]=w;dx[i]=-u*(.90*peak/core2+.10*.28*shoulder/s2);dz[i]=-v*(.90*peak/core2+.10*.28*shoulder/s2);
      // Shared foothills bridge nearby peaks into a continuous rolling mountain range.
      skirts[i]=Math.exp(-r2*.12);skirtX[i]=-u/s2*.24*skirts[i];skirtZ[i]=-v/s2*.24*skirts[i];
    });
    return {weights,dx,dz,skirts,skirtX,skirtZ,fold:1,foldX:0,foldZ:0};
  }
  function sample(c){
    let sum=0,sx=0,sz=0,foothills=0,fx=0,fz=0;
    // A soft maximum preserves separate summits and valleys without breaking the shared terrain.
    for(let i=0;i<count;i++){const strength=strengths[i],v=c.weights[i]*strength;sum+=v**8;sx+=8*v**7*c.dx[i]*strength;sz+=8*v**7*c.dz[i]*strength;foothills+=c.skirts[i]*strength;fx+=c.skirtX[i]*strength;fz+=c.skirtZ[i]*strength;}
    const root=Math.pow(sum,1/8),ridge=Math.tanh(foothills*.42),h=2.85*root+.95*ridge;
    const slope=sum>1e-20?2.85/8*Math.pow(sum,-7/8):0,ridgeSlope=.95*.42*(1-ridge*ridge);
    return {height:h*c.fold,dx:(slope*sx+ridgeSlope*fx)*c.fold+h*c.foldX,dz:(slope*sz+ridgeSlope*fz)*c.fold+h*c.foldZ};
  }
  function subdivide(a,b,c,out,depth=0){
    const distance=(u,v)=>(u[0]-v[0])**2+(u[1]-v[1])**2;
    const ab=distance(a,b),bc=distance(b,c),ca=distance(c,a),longest=Math.max(ab,bc,ca);
    const cx=(a[0]+b[0]+c[0])/3,cz=(a[1]+b[1]+c[1])/3;
    const nearInk=sites.some(site=>(cx-site.x)**2+(cz-site.z)**2<(site.sigma*4.5)**2);
    if(longest<(nearInk?.0064:.0576)||depth>=16){out.push(a,b,c);return;}
    const midpoint=(u,v)=>[(u[0]+v[0])*.5,(u[1]+v[1])*.5];
    if(longest===ab){const m=midpoint(a,b);subdivide(a,m,c,out,depth+1);subdivide(m,b,c,out,depth+1);}
    else if(longest===bc){const m=midpoint(b,c);subdivide(a,b,m,out,depth+1);subdivide(a,m,c,out,depth+1);}
    else{const m=midpoint(c,a);subdivide(a,b,m,out,depth+1);subdivide(m,b,c,out,depth+1);}
  }
  function addSurface(rings){
    const vectors=ring=>ring.slice(0,-1).map(coord=>{const [x,z]=project(coord);return new T.Vector2(x,-z);});
    const shape=new T.Shape(vectors(rings[0]));rings.slice(1).forEach(ring=>shape.holes.push(new T.Path(vectors(ring))));
    const base=new T.ShapeGeometry(shape),flat=base.index?base.toNonIndexed():base,position=flat.getAttribute('position'),triangles=[];
    for(let i=0;i<position.count;i+=3)subdivide([position.getX(i),-position.getY(i)],[position.getX(i+1),-position.getY(i+1)],[position.getX(i+2),-position.getY(i+2)],triangles);
    const unique=new Map(),coords=[],indices=[];
    triangles.forEach(point=>{const key=point[0].toFixed(6)+','+point[1].toFixed(6);let index=unique.get(key);if(index===undefined){index=coords.length;unique.set(key,index);coords.push(point);}indices.push(index);});
    const geometry=new T.BufferGeometry(),positions=new Float32Array(coords.length*3),colors=new Float32Array(coords.length*3),normals=new Float32Array(coords.length*3);
    coords.forEach(([x,z],i)=>{positions[i*3]=x;positions[i*3+2]=z;normals[i*3+1]=1;});
    geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('color',new T.BufferAttribute(colors,3));geometry.setAttribute('normal',new T.BufferAttribute(normals,3));geometry.setIndex(indices);
    const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide}));mesh.frustumCulled=false;mapGroup.add(mesh);
    surfaces.push({geometry,positions,colors,normals,coeffs:coords.map(([x,z])=>coefficients(x,z))});
    if(flat!==base)flat.dispose();base.dispose();
    rings.forEach(ring=>{
      const raw=ring.map(project),coords=[];
      raw.slice(0,-1).forEach((a,i)=>{const b=raw[i+1],steps=Math.max(1,Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/.075));for(let j=0;j<steps;j++)coords.push([a[0]+(b[0]-a[0])*j/steps,a[1]+(b[1]-a[1])*j/steps]);});coords.push(raw[raw.length-1]);
      const positions=new Float32Array(coords.length*3),geometry=new T.BufferGeometry();
      coords.forEach(([x,z],i)=>{positions[i*3]=x;positions[i*3+2]=z;});geometry.setAttribute('position',new T.BufferAttribute(positions,3));
      const line=new T.Line(geometry,new T.LineBasicMaterial({color:'#547c94',transparent:true,opacity:.92}));line.frustumCulled=false;mapGroup.add(line);
      borders.push({geometry,positions,coeffs:coords.map(([x,z])=>coefficients(x,z))});
    });
  }
  function updateSurface(){
    strengths=current.map(item=>Math.pow(item.flood,1.3));
    const color=new T.Color(),normal=new T.Vector3();
    surfaces.forEach(surface=>{
      surface.coeffs.forEach((c,i)=>{
        const s=sample(c),shade=clamp(s.height/3.8,0,1),x=surface.positions[i*3],z=surface.positions[i*3+2];surface.positions[i*3+1]=s.height;
        const ink=shade*(.012*Math.sin(x*8+z*5)+.009*Math.cos(x*13-z*7));
        color.copy(pale).lerp(mid,smooth(.025,.70,shade+ink)).lerp(deep,smooth(.42,.82,shade+ink));
        normal.set(-s.dx,1,-s.dz).normalize();color.multiplyScalar(.82+.18*clamp(normal.dot(lightNormal),0,1));color.toArray(surface.colors,i*3);normal.toArray(surface.normals,i*3);
      });
      ['position','color','normal'].forEach(name=>surface.geometry.attributes[name].needsUpdate=true);
    });
    borders.forEach(border=>{border.coeffs.forEach((c,i)=>border.positions[i*3+1]=sample(c).height+.022);border.geometry.attributes.position.needsUpdate=true;});
    cones.forEach((cone,i)=>{
      const amount=clamp(current[i].flood,0,1),height=amount*4.5;
      cone.visible=amount>.001;cone.scale.y=height;cone.position.y=.025;
      let peak=sites[i].summitSamples[0],peakHeight=-Infinity;
      sites[i].summitSamples.forEach(point=>{const h=sample(point.coeff).height;if(h>peakHeight){peakHeight=h;peak=point;}});
      cone.position.x=peak.x;cone.position.z=peak.z;
      const colors=cone.geometry.attributes.color;
      cone.userData.levels.forEach((level,v)=>{const depth=amount*(.96+.04*level);color.copy(redPale).lerp(redMid,smooth(.10,.62,depth)).lerp(redDeep,smooth(.56,.98,depth));color.toArray(colors.array,v*3);});colors.needsUpdate=true;
      cone.userData.rain=Math.round(current[i].rain);cone.userData.flood=Math.round(current[i].flood*100);
    });
  }
  function resize(){
    const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h,false);const aspect=w/h,span=Math.max(10.8,15.8/aspect);
    camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();if(ready)requestRender();
  }
  function render(now){
    frame=0;if(!ready||!visible)return;
    if(transitioning){
      const t=clamp((now-transitionStart)/520,0,1),e=t*t*(3-2*t);
      current=start.map((item,i)=>({flood:item.flood+(target[i].flood-item.flood)*e,rain:item.rain+(target[i].rain-item.rain)*e}));
      updateSurface();if(t>=1)transitioning=false;
    }
    renderer.render(scene,camera);if(transitioning)requestRender();
  }
  function requestRender(){if(!frame&&visible)frame=requestAnimationFrame(render);}
  function selectYear(){
    const year=Number(slider.value),index=year-2016;yearOut.value=String(year);yearOut.textContent=String(year);slider.setAttribute('aria-valuetext',year+'年');
    host.setAttribute('aria-label',`杭州${year}年积水起伏与积水深度三角指标示意地图`);ticks.forEach(tick=>tick.classList.toggle('active',Number(tick.textContent)===year));tooltip.style.display='none';
    start=current.map(item=>({...item}));target=observations[index].map(item=>({...item}));transitionStart=performance.now();transitioning=true;requestRender();
  }
  slider.addEventListener('input',selectYear);
  host.addEventListener('hz-snapshot',event=>{if(!ready)return;renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{if(blob)event.detail.capture(URL.createObjectURL(blob));},'image/png');});
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)requestRender();else if(frame){cancelAnimationFrame(frame);frame=0;}},{rootMargin:'100px'}).observe(section);
  const raycaster=new T.Raycaster(),mouse=new T.Vector2();
  host.addEventListener('pointermove',event=>{
    if(!ready)return;const box=host.getBoundingClientRect();mouse.set((event.clientX-box.left)/box.width*2-1,-(event.clientY-box.top)/box.height*2+1);raycaster.setFromCamera(mouse,camera);
    const hit=raycaster.intersectObjects(cones.filter(cone=>cone.visible))[0];if(!hit){tooltip.style.display='none';return;}
    const point=hit.object.userData;tooltip.innerHTML=`<strong>${point.name} · ${slider.value}</strong>年度降雨量 ${point.rain} mm<br>积水严重指数 ${point.flood} / 100`;
    const rect=section.getBoundingClientRect();tooltip.style.left=Math.min(event.clientX-rect.left+14,rect.width-218)+'px';tooltip.style.top=clamp(event.clientY-rect.top-75,70,rect.height-210)+'px';tooltip.style.display='block';
  });
  host.addEventListener('pointerleave',()=>tooltip.style.display='none');
  fetch('./hangzhou-map/hangzhou-districts.geojson').then(response=>{if(!response.ok)throw Error('Hangzhou district data');return response.json();}).then(data=>{
    const coords=[];const walk=c=>{if(typeof c[0]==='number'){coords.push(c);return;}c.forEach(walk);};data.features.forEach(feature=>walk(feature.geometry.coordinates));
    const cos=Math.cos(30.2*Math.PI/180),xs=coords.map(c=>c[0]*cos),ys=coords.map(c=>c[1]);
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),scale=14/(maxX-minX),centerX=(minX+maxX)/2,centerY=(minY+maxY)/2;
    project=c=>[(c[0]*cos-centerX)*scale,-(c[1]-centerY)*scale];
    sites.forEach(site=>{[site.x,site.z]=project([site.lon,site.lat]);});
    sites.forEach((site,i)=>{
      const nearest=Math.min(...sites.filter((_,j)=>j!==i).map(other=>Math.hypot(site.x-other.x,site.z-other.z)));
      site.coreSigma=Math.min(site.sigma,nearest*.50);
    });
    data.features.forEach(feature=>{const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;polygons.forEach(addSurface);});
    sites.forEach((site,i)=>{
      // Track only this site's own summit, not a neighboring peak in the shared foothills.
      site.summitSamples=[];
      for(let a=-4;a<=4;a++)for(let b=-4;b<=4;b++){const x=site.x+a/4*site.coreSigma*.25,z=site.z+b/4*site.coreSigma*.25;site.summitSamples.push({x,z,coeff:coefficients(x,z)});}
      const geometry=new T.BufferGeometry(),halfWidth=i<8?.05:.04;
      geometry.setAttribute('position',new T.BufferAttribute(new Float32Array([-halfWidth,0,0,halfWidth,0,0,0,1,0]),3));
      const levels=[0,0,1];geometry.setAttribute('color',new T.BufferAttribute(new Float32Array(9),3));
      const cone=new T.Mesh(geometry,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,transparent:true,opacity:.90,depthTest:false,depthWrite:false}));
      cone.position.set(site.x,0,site.z);cone.rotation.y=.12;cone.renderOrder=10;cone.userData={name:site.name,levels};cone.frustumCulled=false;mapGroup.add(cone);cones.push(cone);
    });
    updateSurface();ready=true;resize();selectYear();host.dataset.ready='true';
  }).catch(error=>{host.dataset.ready='error';console.error('Hangzhou timeline:',error);});
})();
