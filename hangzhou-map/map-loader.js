(()=>{
 const scripts={rain:'timeline.js',growth:'growth.js',mitigation:'mitigation.js'},pending=new Map();
 window.__loadHangzhouMap=key=>{if(!scripts[key])return Promise.reject(Error('未知地图'));if(pending.has(key))return pending.get(key);const task=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='./hangzhou-map/'+scripts[key]+'?v=on-demand-v24';script.onload=resolve;script.onerror=()=>{pending.delete(key);script.remove();reject(Error('地图脚本暂时未能加载，请重试'));};document.head.append(script);});pending.set(key,task);return task;};
 // Standalone pages retain their original eager maps; game overview stays lightweight.
 if(!window.__researchEmbeddedHall)for(const key of Object.keys(scripts))window.__loadHangzhouMap(key).catch(console.error);
})();
