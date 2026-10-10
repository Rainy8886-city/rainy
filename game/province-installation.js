(()=>{
 const T=THREE,cases={130000:['石家庄','明渠分流'],310000:['上海','深隧调蓄'],410000:['郑州','极端超载'],440000:['广州','河网与潮位']};
 function texture(feature){
  const c=document.createElement('canvas');c.width=384;c.height=512;const x=c.getContext('2d'),polys=feature.geometry.type==='MultiPolygon'?feature.geometry.coordinates:[feature.geometry.coordinates];
  const points=polys.flatMap(poly=>poly[0]),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys),scale=Math.min(280/(hiX-loX||1),260/(hiY-loY||1));
  const project=p=>[192+(p[0]-(hiX+loX)/2)*scale,215-(p[1]-(hiY+loY)/2)*scale];
  x.strokeStyle='#90bbcf';x.fillStyle='#456c87aa';x.lineWidth=2;polys.forEach(poly=>{x.beginPath();poly.forEach(ring=>{ring.forEach((p,i)=>{const q=project(p);i?x.lineTo(...q):x.moveTo(...q);});x.closePath();});x.fill('evenodd');x.stroke();});
  const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;return map;
 }
 window.ResearchProvinceInstallation={cases,create(scene,data,interactables){
  const root=new T.Group();root.name='SuspendedProvinceGallery';scene.add(root);
  const mapTarget={type:'page',hall:2,name:'四城调研地图 · 按 F 开始',position:new T.Vector3(0,0,-52),bounds:{minX:-8,maxX:8,minZ:-58,maxZ:-46}};
  const steel=new T.MeshStandardMaterial({color:0x627480,metalness:.82,roughness:.4});
  const glass=new T.MeshPhysicalMaterial({color:0x30475c,metalness:.25,roughness:.25,clearcoat:.35,transparent:true,opacity:.52,side:T.DoubleSide,depthWrite:false});
  // Small, static studio reflections give the thin frame metal highlights without
  // realtime reflection probes, extra shadow maps, or a full-screen bloom pass.
  const environment=new T.CubeTexture(Array.from({length:6},(_,i)=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,64,64);g.addColorStop(0,'#0c1520');g.addColorStop(.42,i===2?'#8199ae':'#253d52');g.addColorStop(.53,i===2?'#d2dce5':'#607f94');g.addColorStop(.67,'#172d41');g.addColorStop(1,'#070e16');x.fillStyle=g;x.fillRect(0,0,64,64);return c;}));environment.colorSpace=T.SRGBColorSpace;environment.needsUpdate=true;steel.envMap=glass.envMap=environment;steel.envMapIntensity=.65;glass.envMapIntensity=.45;
  const geometry=new T.BoxGeometry(1.20,1.52,.065),edgeGeo=new T.EdgesGeometry(geometry),edgeMat=new T.LineBasicMaterial({color:0x7893a3,transparent:true,opacity:.55}),cables=[],plates=[];
  const features=data.features.filter(f=>f.properties.name);let n=0,seed=739391;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},occupied=[];
  const panes=new T.InstancedMesh(geometry,glass,features.length),bars=new T.InstancedMesh(new T.BoxGeometry(1.25,.035,.095),steel,features.length*2),outline=[];root.add(panes,bars);const matrix=new T.Matrix4(),offset=new T.Matrix4(),vertex=new T.Vector3();
  features.forEach(f=>{
   n++;const group=new T.Group();let bounds,placed=false;
   // A seeded three-dimensional cloud, lower at its heart and spreading upward
   // toward its perimeter. Reject intersecting bounds instead of lining up rows.
   for(let attempt=0;attempt<1200;attempt++){
    const radius=(attempt>600?5.8:5.25)*Math.sqrt(random()),angle=random()*Math.PI*2,scale=.72+random()*.38;
    group.position.set(Math.cos(angle)*radius,2.5+radius*.56+(random()-.5)*1.45,-52+Math.sin(angle)*radius);
    // Upright plates share one radial rule: front faces point outward, with the
    // same 30-degree horizontal offset. No random pitch or sideways roll.
    group.rotation.set(0,Math.atan2(group.position.x,group.position.z+52)+Math.PI/6,0);group.scale.setScalar(scale);group.updateMatrix();
    bounds=new T.Box3(new T.Vector3(-.625,-.81,-.06),new T.Vector3(.625,.81,.06)).applyMatrix4(group.matrix).expandByScalar(.09);
    if(!occupied.some(box=>box.intersectsBox(bounds))){placed=true;break;}
   }
   if(!placed)throw Error('悬吊展片空间不足，请调整装置密度');occupied.push(bounds);root.add(group);
   const {x,y,z}=group.position;
   group.updateMatrix();panes.setMatrixAt(n-1,group.matrix);for(const [j,yOffset] of [[0,.78],[1,-.78]]){offset.makeTranslation(0,yOffset,0);matrix.multiplyMatrices(group.matrix,offset);bars.setMatrixAt((n-1)*2+j,matrix);}const edge=edgeGeo.attributes.position;for(let j=0;j<edge.count;j++){vertex.fromBufferAttribute(edge,j).applyMatrix4(group.matrix);outline.push(vertex.x,vertex.y,vertex.z);}
   const face=new T.Mesh(new T.PlaneGeometry(1.16,1.48),new T.MeshBasicMaterial({map:texture(f),transparent:true,side:T.FrontSide,depthWrite:false}));face.position.z=.045;group.add(face);
   const back=new T.Mesh(face.geometry,face.material);back.position.z=-.045;back.rotation.y=Math.PI;group.add(back);
   const code=String(f.properties.adcode),info=cases[code];
   face.userData.target=back.userData.target=mapTarget;interactables.push(face,back);
   for(const dx of [-.46,.46]){vertex.set(dx,.80,0).applyMatrix4(group.matrix);cables.push(vertex.x,7.65,vertex.z,vertex.x,vertex.y,vertex.z);}
   plates.push({group,face,back,bounds,code,city:info?.[0],done:false});
  });
  const wireGeo=new T.BufferGeometry();wireGeo.setAttribute('position',new T.Float32BufferAttribute(cables,3));root.add(new T.LineSegments(wireGeo,new T.LineBasicMaterial({color:0x66808f,transparent:true,opacity:.45})));
  const outlineGeo=new T.BufferGeometry();outlineGeo.setAttribute('position',new T.Float32BufferAttribute(outline,3));root.add(new T.LineSegments(outlineGeo,edgeMat));edgeGeo.dispose();
  ResearchWorld.block(root,14,.10,10,0,7.72,-52,new T.MeshStandardMaterial({color:0x182633,metalness:.6,roughness:.65}));
  const pool=document.createElement('canvas');pool.width=pool.height=128;const ctx=pool.getContext('2d'),gradient=ctx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'#4b88a344');gradient.addColorStop(.5,'#36678219');gradient.addColorStop(1,'#18324d00');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);const poolMap=new T.CanvasTexture(pool);poolMap.colorSpace=T.SRGBColorSpace;
  // Baked projected light uses authentic province boundaries, not another city model.
  const atlas=document.createElement('canvas');atlas.width=1400;atlas.height=1000;const a=atlas.getContext('2d'),all=features.flatMap(f=>(f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates]).flatMap(poly=>poly[0])),xs=all.map(p=>p[0]),ys=all.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),scale=Math.min(1240/(maxX-minX),840/(maxY-minY));
  const project=p=>[700+(p[0]-(maxX+minX)/2)*scale,500-(p[1]-(maxY+minY)/2)*scale];
  a.shadowColor='#77b7e1';a.shadowBlur=22;a.lineWidth=2;a.strokeStyle='#9ac4df';a.fillStyle='#49799b';
  features.forEach(f=>{const polys=f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates];polys.forEach(poly=>{a.beginPath();poly.forEach(ring=>{ring.forEach((p,i)=>{const q=project(p);i?a.lineTo(...q):a.moveTo(...q);});a.closePath();});a.fill('evenodd');a.stroke();});});
  a.shadowBlur=0;a.textAlign='center';a.font='36px "Microsoft YaHei",sans-serif';a.fillStyle='#91b9d0';a.fillText('四城调研 · 靠近地图按 F 开始',700,965);
  const atlasMap=new T.CanvasTexture(atlas);atlasMap.colorSpace=T.SRGBColorSpace;const projectedMap=new T.Mesh(new T.PlaneGeometry(19,13.57),new T.MeshBasicMaterial({map:atlasMap,transparent:true,opacity:.38,depthWrite:false,blending:T.AdditiveBlending}));projectedMap.name='ChinaProjectedLight';projectedMap.rotation.x=-Math.PI/2;projectedMap.position.set(0,.032,-52);root.add(projectedMap);
  projectedMap.userData.target=mapTarget;interactables.push(projectedMap);
  const halo=new T.Mesh(new T.PlaneGeometry(21,15),new T.MeshBasicMaterial({map:poolMap,transparent:true,opacity:.45,depthWrite:false}));halo.rotation.x=-Math.PI/2;halo.position.set(0,.025,-52);root.add(halo);
  for(const x of [-5,0,5]){const light=new T.SpotLight(0x8db5ce,.65,18,.6,.9,1.5);light.position.set(x,7.4,-48);light.target.position.set(x/2,2,-53);root.add(light,light.target);const lamp=new T.Mesh(new T.CylinderGeometry(.16,.22,.32,12),steel);lamp.position.copy(light.position);root.add(lamp);const lens=new T.Mesh(new T.CircleGeometry(.17,16),new T.MeshBasicMaterial({color:0x8faebf}));lens.rotation.x=-Math.PI/2;lens.position.copy(light.position);lens.position.y-=.17;root.add(lens);}
  return{root,plates,feedback(progress){plates.forEach(p=>{const done=!!p.city&&progress.cities.has(p.city);if(done===p.done)return;p.done=done;p.face.material.color.set(done?0x9fe0c9:0xd9e5ef);});}};
 }};
})();
