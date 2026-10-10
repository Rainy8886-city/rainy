// The only configuration point for the three existing business pages.
// Empty/null paths are reported as missing; no placeholder is counted as a task.
window.RESEARCH_CONFIG=Object.freeze({
  pages:{maps:'../overview.html?mapLoad=on-demand-v24#hangzhou-atlas',sandbox:'../sandbox/index.html',cities:'../overview.html#regional-flow'},
  assets:{maps:['/hangzhou-map/preview-rain.png','/hangzhou-map/preview-growth.png','/hangzhou-map/preview-mitigation.png'],china:'/regions/assets/china-provinces.json'},
  labels:['脚下的杭州','雨落杭州','同一场雨，四种回应','回到杭州']
});
