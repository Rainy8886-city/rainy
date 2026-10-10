/* Fixed real administrative geometry; all road and land-use timelines are illustrative. */
(()=>{
  const T=window.THREE,host=document.getElementById('hangzhouGrowthScene');if(!T||!host)return;
  const section=document.getElementById('hangzhou-growth-page'),slider=document.getElementById('hangzhouGrowthSlider'),yearOut=document.getElementById('hangzhouGrowthYear');
  const ticks=[...document.querySelectorAll('#hangzhouGrowthTicks span')];
  const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'low-power'});renderer.setClearColor('#09151e');renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=T.SRGBColorSpace;host.append(renderer.domElement);
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-9,9,5,-5,.1,100),group=new T.Group();group.rotation.y=-.12;scene.add(group);
  camera.position.set(0,21.2,20);camera.lookAt(0,1.2,0);
  scene.add(new T.AmbientLight(0xffffff,1.3));const light=new T.DirectionalLight(0xffe8d4,2);light.position.set(-5,10,8);scene.add(light);
  const districts=[],pickables=[],roads=[];
  const detail=document.getElementById('hangzhouGrowthDetail'),detailName=document.getElementById('hzGrowthDistrictName'),detailData=document.getElementById('hzGrowthDistrictData');
  let selected=-1;
  const urbanStart=[68,72,38,58,24,18,10,7,22,32,8,3,7],urbanEnd=[86,91,57,88,51,47,43,37,65,69,39,29,41];
  const hardStart=[58,63,29,49,21,15,9,6,18,28,7,3,6],hardEnd=[85,91,57,88,67,64,66,62,78,80,59,53,63];
  // Official city-district totals, not district hardening rates. Table 11-03,
  // Public Utilities in Urban Districts (2016–2023), p.324.
  // Original unit: 10,000 m²; divide by 100 to display km². Unverified years stay null.
  const officialRoadArea=[6932,8291,8840,9341,10073,12467,13843,16141,null,null];
  const color=hex=>new T.Color(hex),pale=color('#c9e5eb'),blue=color('#07547b');
  let ready=false,visible=false,frame=0,current=2016,target=2016,start=2016,time=0,animating=false,kmPerUnit=1;
  const smooth=t=>t*t*(3-2*t),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const inRing=(x,z,r)=>{let yes=false;for(let a=0,b=r.length-1;a<r.length;b=a++){const p=r[a],q=r[b];if((p[1]>z)!==(q[1]>z)&&x<(q[0]-p[0])*(z-p[1])/(q[1]-p[1])+p[0])yes=!yes;}return yes;};
  let seed=330100;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  function addRoad(a,b,birth,contains,main=false){
    const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(len<.015)return;
    const bend=(random()-.5)*len*.32;
    const curve=new T.CatmullRomCurve3([new T.Vector3(a.x,.026,a.z),new T.Vector3(a.x+dx*.32-dz/len*bend,.026,a.z+dz*.32+dx/len*bend),new T.Vector3(a.x+dx*.72+dz/len*bend*.6,.026,a.z+dz*.72-dx/len*bend*.6),new T.Vector3(b.x,.026,b.z)]);
    const points=curve.getPoints(18),segments=[];for(let i=0;i<points.length-1;i++){const p=points[i],q=points[i+1];if(contains(p.x,p.z)&&contains(q.x,q.z))segments.push(p,q);}
    if(!segments.length)return;
    const geometry=new T.BufferGeometry().setFromPoints(segments),material=new T.LineBasicMaterial({color:main?'#f4deb0':'#eef6ee',transparent:true,opacity:main?.68:.58});
    const line=new T.LineSegments(geometry,material);group.add(line);roads.push({line,birth,size:segments.length,main});
  }
  function makeRoads(){
    const containsAny=(x,z)=>districts.some(d=>d.contains(x,z));
    // Irregular illustrative connecting corridors, not claimed real road alignments.
    [[11,12],[12,10],[10,6],[6,2],[2,1],[1,0],[0,3],[3,4],[4,8],[8,9],[9,1],[1,5],[5,7],[7,6]].forEach(([a,b])=>addRoad(districts[a],districts[b],2015,containsAny,true));
    districts.forEach(d=>{
      const nodes=[{x:d.x,z:d.z,birth:2015}],b=d.bounds,count=d.index<6?55:38;
      for(let i=0;i<count;i++){
        let point=null;for(let attempt=0;attempt<70;attempt++){const x=b.minX+random()*(b.maxX-b.minX),z=b.minZ+random()*(b.maxZ-b.minZ);if(d.contains(x,z)){point={x,z};break;}}if(!point)continue;
        const closest=nodes.slice().sort((a,b)=>Math.hypot(a.x-point.x,a.z-point.z)-Math.hypot(b.x-point.x,b.z-point.z));
        const parent=closest[0],birth=i<8?2015:Math.max(parent.birth,2016+Math.round((i-8)/(count-9)*9));point.birth=birth;addRoad(parent,point,birth,d.contains);
        if(i>8&&i%3===0&&closest[1])addRoad(closest[1],point,Math.max(birth,closest[1].birth),d.contains);
        nodes.push(point);
      }
    });
  }
  function drawLabels(){
    const d=districts[selected];detail.classList.toggle('selected',!!d);
    detailName.textContent=d?d.name:'点击地图分区，查看区名与数据';
    detailData.textContent=d?`· 建成区占比 ${Math.round(d.urban)}% · 道路硬化率 ${Math.round(d.hard)}%`:'';
    document.getElementById('hzGrowthDetailClose').hidden=!d;
    districts.forEach(d=>d.borders.forEach(line=>{line.material.color.set(d.index===selected?'#edc57d':'#9ec5d3');line.material.opacity=d.index===selected?1:.85;}));
  }
  const raycaster=new T.Raycaster(),pointer=new T.Vector2();
  function hitAt(event){const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);group.updateMatrixWorld(true);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(pickables.filter(mesh=>mesh.visible))[0];}
  renderer.domElement.addEventListener('click',event=>{if(!ready)return;const hit=hitAt(event);selected=hit?hit.object.userData.districtIndex:-1;drawLabels();request();});
  renderer.domElement.addEventListener('pointermove',event=>{if(ready)renderer.domElement.style.cursor=hitAt(event)?'pointer':'';});
  document.getElementById('hzGrowthDetailClose').addEventListener('click',()=>{selected=-1;drawLabels();request();});
  host.tabIndex=0;host.setAttribute('aria-describedby','hangzhouGrowthDetail');
  host.addEventListener('keydown',event=>{if(!ready)return;if(event.key==='Escape'){selected=-1;}else if(['ArrowLeft','ArrowUp','ArrowRight','ArrowDown','Enter'].includes(event.key)){event.preventDefault();const step=['ArrowLeft','ArrowUp'].includes(event.key)?-1:1;selected=(selected+step+districts.length)%districts.length;}else return;drawLabels();request();});
  function update(){
    const progress=clamp((current-2016)/9,0,1);let urbanTotal=0,hardTotal=0;
    districts.forEach(d=>{
      const p=clamp(progress+(Math.sin(progress*Math.PI)*.045*Math.sin(d.index*1.7)),0,1);
      d.urban=urbanStart[d.index]+(urbanEnd[d.index]-urbanStart[d.index])*p;d.hard=hardStart[d.index]+(hardEnd[d.index]-hardStart[d.index])*p;
      d.height=6.9*Math.pow(d.hard/100,2.35);d.column.visible=d.hard>=30;d.column.scale.y=d.height;d.column.position.y=d.height/2+.03;
      d.material.color.copy(pale).lerp(blue,Math.pow(d.urban/100,.85));urbanTotal+=d.urban;hardTotal+=d.hard;
    });
    let shown=0;roads.forEach(r=>{const portion=clamp(current-r.birth+1,0,1),size=Math.floor(r.size*portion/2)*2;r.line.visible=size>0;r.line.geometry.setDrawRange(0,size);r.line.material.color.set(current-r.birth<1&&r.birth>=2016?'#efb96b':r.main?'#f4deb0':'#eef6ee');if(size)shown++;});host.dataset.visibleRoads=String(shown);
    const selectedYear=Number(slider.value),verifiedYear=Math.min(selectedYear,2023),roadArea=officialRoadArea[verifiedYear-2016];
    document.getElementById('hzGrowthAreaLabel').textContent=selectedYear<=2023?`${verifiedYear}年市区道路面积（统计值）`:`最近已核实道路面积 · ${verifiedYear}年`;
    document.getElementById('hzGrowthArea').textContent=(roadArea/100).toFixed(2)+' km²';drawLabels();
  }
  function render(now){frame=0;if(!ready||!visible)return;if(animating){const t=clamp((now-time)/600,0,1);current=start+(target-start)*smooth(t);update();if(t===1)animating=false;}renderer.render(scene,camera);if(animating)request();}
  function request(){if(visible&&!frame)frame=requestAnimationFrame(render);}
  host.addEventListener('hz-snapshot',event=>{if(!ready)return;renderer.render(scene,camera);renderer.domElement.toBlob(blob=>{if(blob)event.detail.capture(URL.createObjectURL(blob));},'image/png');});
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const aspect=w/h,span=Math.max(10.8,15.8/aspect);camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();if(ready){drawLabels();request();}}
  slider.addEventListener('input',()=>{target=Number(slider.value);yearOut.value=String(target);yearOut.textContent=String(target);slider.setAttribute('aria-valuetext',target+'年');host.setAttribute('aria-label',`杭州${target}年路网与城区扩张示意地图`);ticks.forEach(tick=>tick.classList.toggle('active',Number(tick.textContent)===target));start=current;time=performance.now();animating=true;request();});
  new ResizeObserver(resize).observe(host);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)request();else if(frame){cancelAnimationFrame(frame);frame=0;}},{rootMargin:'100px'}).observe(section);
  fetch('./hangzhou-map/hangzhou-districts.geojson').then(r=>{if(!r.ok)throw Error('行政边界加载失败');return r.json();}).then(data=>{
    const all=[];const walk=c=>{if(typeof c[0]==='number')all.push(c);else c.forEach(walk);};data.features.forEach(f=>walk(f.geometry.coordinates));
    const cos=Math.cos(30.2*Math.PI/180),xs=all.map(c=>c[0]*cos),ys=all.map(c=>c[1]),minX=Math.min(...xs),maxX=Math.max(...xs),centerX=(minX+maxX)/2,centerY=(Math.min(...ys)+Math.max(...ys))/2,scale=14/(maxX-minX);
    const project=c=>[(c[0]*cos-centerX)*scale,-(c[1]-centerY)*scale];kmPerUnit=111.2/scale;
    data.features.forEach((feature,index)=>{
      const material=new T.MeshBasicMaterial({color:pale,side:T.DoubleSide});
      const polygons=(feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates).map(rings=>rings.map(ring=>ring.map(project)));
      const borders=[];
      polygons.forEach(rings=>{
        const vectors=ring=>ring.slice(0,-1).map(([x,z])=>new T.Vector2(x,-z));const shape=new T.Shape(vectors(rings[0]));rings.slice(1).forEach(ring=>shape.holes.push(new T.Path(vectors(ring))));
        const mesh=new T.Mesh(new T.ShapeGeometry(shape),material);mesh.rotation.x=-Math.PI/2;mesh.userData.districtIndex=index;group.add(mesh);pickables.push(mesh);
        rings.forEach(ring=>{const geo=new T.BufferGeometry().setFromPoints(ring.map(([x,z])=>new T.Vector3(x,.012,z))),line=new T.Line(geo,new T.LineBasicMaterial({color:'#9ec5d3',transparent:true,opacity:.85}));group.add(line);borders.push(line);});
      });
      const contains=(x,z)=>polygons.some(rings=>inRing(x,z,rings[0])&&!rings.slice(1).some(r=>inRing(x,z,r)));
      let [x,z]=project(feature.properties.centroid||feature.properties.center);
      // Separate the two screen-aligned cones without changing the map or data.
      // These are display anchors, constrained to their own administrative polygon.
      const displayAnchors={'拱墅区':[120.13,30.33],'滨江区':[120.20,30.19]};
      const anchor=displayAnchors[feature.properties.name];
      if(anchor){const [ax,az]=project(anchor);if(contains(ax,az)){x=ax;z=az;}}
      const column=new T.Mesh(new T.ConeGeometry(.045,1,32),new T.MeshStandardMaterial({color:'#ee8b39',roughness:.65,metalness:.05}));column.position.set(x,.5,z);group.add(column);
      column.userData.districtIndex=index;pickables.push(column);
      const vertices=polygons.flat(2),bounds={minX:Math.min(...vertices.map(p=>p[0])),maxX:Math.max(...vertices.map(p=>p[0])),minZ:Math.min(...vertices.map(p=>p[1])),maxZ:Math.max(...vertices.map(p=>p[1]))};
      districts.push({index,name:feature.properties.name,x,z,column,material,borders,height:0,contains,bounds});
    });
    makeRoads();ready=true;resize();update();host.dataset.ready='true';request();
  }).catch(e=>{host.dataset.ready='error';console.error('Hangzhou growth:',e);});
})();
