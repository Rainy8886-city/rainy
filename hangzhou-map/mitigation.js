/* Demonstration only. Fixed current boundaries; no historical measurements or causal estimates. */
(()=>{
  const T=window.THREE,host=document.getElementById('hangzhouMitigationScene');if(!T||!host)return;
  const section=document.getElementById('hangzhou-mitigation-page'),slider=document.getElementById('hangzhouMitigationSlider'),yearOut=document.getElementById('hangzhouMitigationYear'),detail=document.getElementById('hangzhouMitigationDetail');
  // Explicit annual scenarios avoid uniform +5 interpolation. All values are synthetic.
  const rain=[1780,1450,1620,1980,2110,1740,1360,1890,1540,1660];
  // Invented demonstration projects, NOT actual Hangzhou works or completion dates.
  // Each project affects only its listed districts; benefits persist into later years.
  const projects={
    2017:[{districts:[0,1],measure:'低洼点排水口与支管改造',factor:.64}],
    2018:[{districts:[4,5],measure:'调蓄空间与排水通道改造',factor:.68}],
    2021:[{districts:[0,1],measure:'排水主干管扩容',factor:.56},{districts:[8,9],measure:'泵站与应急排涝能力提升',factor:.59}],
    2022:[{districts:[2,3],measure:'透水铺装与雨水花园',factor:.57},{districts:[6],measure:'易涝点排水改造',factor:.62}],
    2024:[{districts:[4,5],measure:'调蓄设施与溢流通道完善',factor:.52},{districts:[7,10],measure:'沟渠疏通与低洼点整治',factor:.55}],
    2025:[{districts:[8,9],measure:'重点片区排水系统完善',factor:.65},{districts:[11,12],measure:'局部易涝点整治',factor:.48}]
  };
  const districtNames=['上城区','拱墅区','西湖区','滨江区','萧山区','余杭区','富阳区','临安区','钱塘区','临平区','桐庐县','淳安县','建德市'];
  const activeProjects=()=>{
    const year=2016+target,sourceYear=Object.keys(projects).map(Number).filter(y=>y<=year).pop();
    return {year,sourceYear,items:sourceYear?projects[sourceYear]:[]};
  };
  const baseCounts=[29,32,19,12,24,21,13,11,18,15,9,7,8];
  // Intentionally simple narrative model: yearly rain pressure × cumulative local
  // treatment factor. Not a hydrological model or evidence of real causation.
  const reductions=baseCounts.map(()=>1),counts=rain.map((r,i)=>{
    (projects[2016+i]||[]).forEach(p=>p.districts.forEach(d=>reductions[d]*=p.factor));
    return baseCounts.map((base,d)=>Math.round(base*Math.pow(r/rain[0],1.15)*reductions[d]));
  });
  const severityBase=[.91,1,.61,.53,.79,.72,.44,.36,.65,.58,.29,.22,.26];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=t=>t*t*(3-2*t);
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'low-power'});renderer.setClearColor('#09151e');renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;host.append(renderer.domElement);
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-9,9,5,-5,.1,100),group=new T.Group();group.rotation.y=-.12;scene.add(group);camera.position.set(0,21.2,20);camera.lookAt(0,1.2,0);
  scene.add(new T.AmbientLight(0xffffff,1.6));const light=new T.DirectionalLight(0xeaf6ff,1.7);light.position.set(-5,10,8);scene.add(light);
  const districts=[],pickables=[],pale=new T.Color('#c9e5eb'),deep=new T.Color('#032c50');let selected=-1,ready=false,visible=false,frame=0,current=0,target=0,start=0,time=0,animating=false;
  const blend=(values,index)=>{const lo=Math.floor(current),hi=Math.min(9,lo+1),fraction=current-lo;return values[lo][index]+(values[hi][index]-values[lo][index])*fraction;};
  function showDetail(){const d=districts[selected];detail.classList.toggle('selected',!!d);let text='点击分区，查看积水情况';if(d){const history=Object.keys(projects).filter(year=>Number(year)<=2016+target&&projects[year].some(p=>p.districts.includes(selected)));text=`${d.name} · 积水点 ${counts[target][selected]} 处 · 积水程度 ${['轻','中','重'][Math.min(2,Math.floor(d.severity*3))]}`;if(history.length)text+=` · 模拟治理：${history.join('、')}年`;}detail.textContent=text;const treated=new Set(activeProjects().items.flatMap(p=>p.districts));districts.forEach(d=>{d.marker.visible=treated.has(d.index);d.borders.forEach(line=>line.material.color.set(d.index===selected?'#e0f4fb':treated.has(d.index)?'#e0bb75':'#84b6c8'));});}
  function update(){districts.forEach(d=>{d.count=blend(counts,d.index);d.severity=clamp(severityBase[d.index]*d.count/baseCounts[d.index],0,1);d.material.color.copy(pale).lerp(deep,d.severity);const height=5.3*d.count/32;d.column.visible=d.count>.01;d.column.scale.y=Math.max(.001,height);d.column.position.y=height/2+.025;});showDetail();}
  function render(now){frame=0;if(!ready||!visible)return;if(animating){const t=clamp((now-time)/650,0,1);current=start+(target-start)*smooth(t);update();if(t===1)animating=false;}renderer.render(scene,camera);if(animating)request();}
  function request(){if(visible&&!frame)frame=requestAnimationFrame(render);}
  host.addEventListener('hz-snapshot',event=>{if(!ready)return;renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{if(blob)event.detail.capture(URL.createObjectURL(blob));},'image/png');});
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const aspect=w/h,span=Math.max(10.8,15.8/aspect);camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();request();}
  const ticks=[...document.querySelectorAll('#hangzhouMitigationTicks span')],svg=document.getElementById('hangzhouMitigationRainChart');
  const points=rain.map((value,i)=>({x:i*1000/9,y:88-(value-1200)/(2200-1200)*76}));
  // Shape-preserving cubic segments: flat tangents at peaks prevent false overshoots.
  const slopes=points.map((p,i)=>{if(i===0)return(points[1].y-p.y)/(points[1].x-p.x);if(i===9)return(p.y-points[8].y)/(p.x-points[8].x);const a=(p.y-points[i-1].y)/(p.x-points[i-1].x),b=(points[i+1].y-p.y)/(points[i+1].x-p.x);return a*b<=0?0:2*a*b/(a+b);});
  let path=`M${points[0].x},${points[0].y}`;points.slice(1).forEach((p,j)=>{const prev=points[j],dx=(p.x-prev.x)/3;path+=` C${prev.x+dx},${prev.y+slopes[j]*dx} ${p.x-dx},${p.y-slopes[j+1]*dx} ${p.x},${p.y}`;});
  document.getElementById('hzRainCurve').setAttribute('d',path);document.getElementById('hzRainArea').setAttribute('d',path+' L1000,100 L0,100 Z');
  const dots=document.getElementById('hzRainDots');points.forEach((p,i)=>{const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y);dot.setAttribute('r','3');const title=document.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=`${2016+i}年：${rain[i]} mm（示意）`;dot.append(title);dots.append(dot);});
  function updateProjects(){
    const {year,sourceYear,items}=activeProjects(),panel=document.getElementById('hzMitigationProjects'),list=document.getElementById('hzMitigationProjectList');panel.hidden=!items.length;list.replaceChildren();
    panel.querySelector('.hz-project-kicker').textContent=!sourceYear||sourceYear===year?'当年治理 · 情景示意':`沿用${sourceYear}年治理措施 · 情景示意`;
    panel.querySelector('small').textContent='金色圈标出治理区域，点击查看';
    items.forEach(p=>p.districts.forEach(index=>{const button=document.createElement('button');button.type='button';const name=document.createElement('strong');name.textContent=districtNames[index];button.append(name,document.createTextNode(p.measure));button.addEventListener('click',()=>{selected=index;showDetail();request();});list.append(button);}));
    const total=counts[target].reduce((a,b)=>a+b,0),previous=target?counts[target-1].reduce((a,b)=>a+b,0):total;
    let story=`积水点 ${total} 处`;if(target){const rainChange=Math.round((rain[target]/rain[target-1]-1)*100);story=`年雨量${rainChange>=0?'增加':'减少'} ${Math.abs(rainChange)}% · 积水点 ${previous} → ${total} 处`;}
    document.getElementById('hzMitigationYearStory').textContent=story;
  }
  function updateRain(){const p=points[target];const marker=document.getElementById('hzRainActive'),line=document.getElementById('hzRainSelection');marker.setAttribute('cx',p.x);marker.setAttribute('cy',p.y);line.setAttribute('x1',p.x);line.setAttribute('x2',p.x);document.getElementById('hangzhouMitigationRain').textContent=`${rain[target]} mm`;svg.setAttribute('aria-label',`2016至2025年降雨量示意曲线，当前${2016+target}年，${rain[target]}毫米`);ticks.forEach((tick,i)=>{tick.classList.toggle('active',i===target);tick.classList.toggle('has-project',!!projects[2016+i]);});updateProjects();}
  slider.addEventListener('input',()=>{target=clamp(Number(slider.value)-2016,0,9);yearOut.value=String(2016+target);yearOut.textContent=String(2016+target);slider.setAttribute('aria-valuetext',`${2016+target}年，降雨量${rain[target]}毫米，示意`);host.setAttribute('aria-label',`杭州${2016+target}年积水严重程度与点位数量示意地图`);updateRain();start=current;time=performance.now();animating=true;request();});
  svg.addEventListener('click',event=>{const box=svg.getBoundingClientRect(),index=clamp(Math.round((event.clientX-box.left)/box.width*9),0,9);slider.value=String(2016+index);slider.dispatchEvent(new Event('input'));});updateRain();
  const raycaster=new T.Raycaster(),pointer=new T.Vector2();function hitAt(event){const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);group.updateMatrixWorld(true);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(pickables.filter(mesh=>mesh.visible))[0];}
  renderer.domElement.addEventListener('click',event=>{if(!ready)return;const hit=hitAt(event);selected=hit?hit.object.userData.districtIndex:-1;showDetail();request();});renderer.domElement.addEventListener('pointermove',event=>{if(ready)renderer.domElement.style.cursor=hitAt(event)?'pointer':'';});host.tabIndex=0;host.setAttribute('aria-describedby','hangzhouMitigationDetail');host.addEventListener('keydown',event=>{if(!ready)return;if(event.key==='Escape')selected=-1;else if(['ArrowLeft','ArrowUp','ArrowRight','ArrowDown','Enter'].includes(event.key)){event.preventDefault();const step=['ArrowLeft','ArrowUp'].includes(event.key)?-1:1;selected=(selected+step+districts.length)%districts.length;}else return;showDetail();request();});
  new ResizeObserver(resize).observe(host);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)request();else if(frame){cancelAnimationFrame(frame);frame=0;}},{rootMargin:'100px'}).observe(section);
  const inRing=(x,z,r)=>{let yes=false;for(let a=0,b=r.length-1;a<r.length;b=a++){const p=r[a],q=r[b];if((p[1]>z)!==(q[1]>z)&&x<(q[0]-p[0])*(z-p[1])/(q[1]-p[1])+p[0])yes=!yes;}return yes;};
  fetch('./hangzhou-map/hangzhou-districts.geojson').then(r=>{if(!r.ok)throw Error('行政边界加载失败');return r.json();}).then(data=>{
    const all=[];const walk=c=>{if(typeof c[0]==='number')all.push(c);else c.forEach(walk);};data.features.forEach(f=>walk(f.geometry.coordinates));const cos=Math.cos(30.2*Math.PI/180),xs=all.map(c=>c[0]*cos),ys=all.map(c=>c[1]),minX=Math.min(...xs),maxX=Math.max(...xs),centerX=(minX+maxX)/2,centerY=(Math.min(...ys)+Math.max(...ys))/2,scale=14/(maxX-minX);const project=c=>[(c[0]*cos-centerX)*scale,-(c[1]-centerY)*scale];
    data.features.forEach((feature,index)=>{const material=new T.MeshBasicMaterial({color:pale,side:T.DoubleSide}),borders=[];const polygons=(feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates).map(rings=>rings.map(ring=>ring.map(project)));
      polygons.forEach(rings=>{const vectors=ring=>ring.slice(0,-1).map(([x,z])=>new T.Vector2(x,-z));const shape=new T.Shape(vectors(rings[0]));rings.slice(1).forEach(ring=>shape.holes.push(new T.Path(vectors(ring))));const mesh=new T.Mesh(new T.ShapeGeometry(shape),material);mesh.rotation.x=-Math.PI/2;mesh.userData.districtIndex=index;group.add(mesh);pickables.push(mesh);rings.forEach(ring=>{const geo=new T.BufferGeometry().setFromPoints(ring.map(([x,z])=>new T.Vector3(x,.012,z))),line=new T.Line(geo,new T.LineBasicMaterial({color:'#84b6c8',transparent:true,opacity:.9}));group.add(line);borders.push(line);});});
      let [x,z]=project(feature.properties.centroid||feature.properties.center);const anchors={'拱墅区':[120.13,30.33],'滨江区':[120.20,30.19]},anchor=anchors[feature.properties.name];if(anchor){const [ax,az]=project(anchor);if(polygons.some(rings=>inRing(ax,az,rings[0])&&!rings.slice(1).some(r=>inRing(ax,az,r)))){x=ax;z=az;}}
      const geometry=new T.ConeGeometry(.048,1,32),positions=geometry.attributes.position,colors=[];const bottom=new T.Color('#6db9da'),top=new T.Color('#064a8c');for(let i=0;i<positions.count;i++){const c=bottom.clone().lerp(top,clamp(positions.getY(i)+.5,0,1));colors.push(c.r,c.g,c.b);}geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));const column=new T.Mesh(geometry,new T.MeshStandardMaterial({vertexColors:true,roughness:.65,metalness:.02}));column.position.set(x,.5,z);column.userData.districtIndex=index;group.add(column);pickables.push(column);
      const marker=new T.Mesh(new T.RingGeometry(.095,.12,32),new T.MeshBasicMaterial({color:'#e0bb75',side:T.DoubleSide}));marker.rotation.x=-Math.PI/2;marker.position.set(x,.035,z);marker.visible=false;marker.userData.districtIndex=index;group.add(marker);pickables.push(marker);districts.push({index,name:feature.properties.name,material,borders,column,marker,count:0,severity:0});
    });ready=true;resize();update();host.dataset.ready='true';request();
  }).catch(error=>{host.dataset.ready='error';detail.textContent='地图加载失败，请刷新重试';console.error('Hangzhou mitigation:',error);});
})();
