(()=>{
 const T=THREE;
 const halls=[
  {title:'读懂杭州的雨',tag:'01 / 观察城市',question:'雨落在哪里，城市又向哪里生长？',lines:['对照积水与降雨、路网与扩张、内涝治理三张地图。','调整年份，观察同一片城市在不同阶段的变化。','从空间线索出发，理解雨、水与城市建设的关系。'],steps:['降雨与积水','城市扩张','治理变化'],note:'地图里的线索，需要放在时间与空间中一起阅读。'},
  {title:'让城市接住雨',tag:'02 / 模拟过程',question:'当雨越来越大，水会去哪里？',lines:['进入杭州微缩沙盘，运行完整的降雨演示。','观察雨水汇集、积水出现与暴雨淹没的过程。','思考地表、河网和排水系统怎样共同承接雨水。'],steps:['雨水落下','汇流积水','承载考验'],note:'蓝绿空间与排水设施，需要形成相互配合的系统。'},
  {title:'向不同城市学习',tag:'03 / 比较方案',question:'同一场雨，为什么需要不同的答案？',lines:['比较上海、广州、郑州与石家庄的治理情境。','了解深隧调蓄、河网潮位、极端超载与明渠分流。','把方案放回当地条件，寻找杭州可以借鉴的思路。'],steps:['当地条件','治理策略','杭州启发'],note:'不是复制一座城市，而是理解一种解决问题的方法。'}
 ];
 function panelTexture(info,diagram=false){
  const c=document.createElement('canvas');c.width=1800;c.height=960;const x=c.getContext('2d');x.scale(1.5,1.5);
  x.fillStyle='#0c1925';x.fillRect(0,0,1200,640);x.fillStyle='#65bbc9';x.fillRect(48,52,7,32);
  x.font='24px "Microsoft YaHei",sans-serif';x.fillText(info.tag,78,77);x.fillStyle='#e4edf0';x.font='500 48px "Microsoft YaHei",sans-serif';x.fillText(diagram?'从线索到理解':info.question,52,164);
  if(!diagram){x.font='29px "Microsoft YaHei",sans-serif';info.lines.forEach((s,i)=>{x.fillStyle='#9bb9c9';x.fillText('0'+(i+1),54,275+i*84);x.fillStyle='#d4dfe5';x.fillText(s,117,275+i*84);});}
  else{info.steps.forEach((s,i)=>{const px=70+i*380;x.strokeStyle='#416e85';x.lineWidth=2;x.strokeRect(px,248,300,116);x.fillStyle='#90d3df';x.font='34px "Microsoft YaHei",sans-serif';x.fillText(s,px+37,321);if(i<2){x.fillStyle='#678d9e';x.font='36px sans-serif';x.fillText('→',px+317,320);}});x.fillStyle='#b9ced8';x.font='29px "Microsoft YaHei",sans-serif';x.fillText(info.note,54,470);}
  x.fillStyle='#476271';x.fillRect(52,551,1096,1);x.fillStyle='#88a4b4';x.font='23px "Microsoft YaHei",sans-serif';x.fillText('杭州 / 蓝绿协同韧性城市研究馆',54,595);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;
 }
 window.ResearchExhibition={halls,decorate(scene){
  const records=[];
  halls.forEach((info,i)=>{
   const z=-26*i,group=new T.Group();group.name='ExhibitionHall'+(i+1);scene.add(group);
   for(const side of [-1,1]){const map=panelTexture(info,side===1),material=new T.MeshBasicMaterial({map});const board=new T.Mesh(new T.PlaneGeometry(7.2,3.84),material);board.position.set(side*11.79,3.05,z+1);board.rotation.y=side===-1?Math.PI/2:-Math.PI/2;group.add(board);ResearchWorld.block(group,.06,4.06,7.44,side*11.86,3.05,z+1,new T.MeshBasicMaterial({color:0x1d3446}));}
   // Three non-shadow lights, one per hall: no extra shadow maps or per-frame textures.
   const light=new T.SpotLight(0x91bed7,1.5,20,.68,.8,1.3);light.position.set(-3,5.65,z+2);light.target.position.set(0,.5,z-1);group.add(light,light.target);
   if(i<2)ResearchWorld.block(group,3.2,.035,.22,-3,5.7,z+2,new T.MeshBasicMaterial({color:0xa9d0df}));
   const accent=new T.MeshBasicMaterial({color:0x315b72});
   for(const side of [-1,1])ResearchWorld.block(group,.09,.012,14,side*9.1,.023,z,accent);
   const status=ResearchWorld.sign(group,'○ 调研尚未完成',4.5,.48,0,3.77,z-10.7,'');status.name='ExhibitionCompletion'+i;
   records.push({light,accent,status,done:false});
  });
  return{records,feedback(progress){records.forEach((r,i)=>{const done=progress.complete(i);if(done===r.done)return;r.done=done;r.accent.color.set(done?0x75c5b3:0x315b72);r.light.color.set(done?0xb5ddd4:0x91bed7);r.status.material.map.dispose();r.status.material.map=ResearchWorld.textTexture(done?'✓ 本厅调研已完成':'○ 调研尚未完成','',done?'#9ed8c9':'#a9bcc7');r.status.material.needsUpdate=true;});}};
 }};
})();
