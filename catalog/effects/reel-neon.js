/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function(F){
  'use strict';
  // 原片 10–16 秒的背景与标题。独立动作与组合共用几何、颜色和时钟。
  // 原 Avenir Next Heavy Italic 与 Futura Bold 固定字形；保留字距，避免字体异步加载改变轮廓。
  const typeArtwork = {"chrome":{"font":"AvenirNext-HeavyItalic","text":"BROADCAST","size":200,"spacing":-4,"width":1241.2,"path":"M-529.4 -141.6Q-522 -141.6 -514.6 -140Q-507.2 -138.4 -501.2 -134.7Q-495.2 -131 -491.5 -125.1Q-487.8 -119.2 -487.8 -110.6Q-487.8 -96 -495.9 -86.9Q-504 -77.8 -516.4 -74.4V-74Q-511.6 -73 -507.3 -70.6Q-503 -68.2 -499.7 -64.3Q-496.4 -60.4 -494.5 -55.2Q-492.6 -50 -492.6 -43.8Q-492.6 -33 -497.1 -24.8Q-501.6 -16.6 -509.7 -11.1Q-517.8 -5.6 -529 -2.8Q-540.2 0 -553.4 0H-619.2L-594.2 -141.6ZM-557.8 -105.8 -561 -86.4H-548.2Q-545.6 -86.4 -542.9 -86.8Q-540.2 -87.2 -538 -88.4Q-535.8 -89.6 -534.4 -91.7Q-533 -93.8 -533 -97.2Q-533 -101.8 -536.7 -103.8Q-540.4 -105.8 -546.2 -105.8ZM-566 -57.4 -569.8 -36H-558Q-554.2 -36 -550.6 -36.5Q-547 -37 -544.3 -38.3Q-541.6 -39.6 -540 -41.9Q-538.4 -44.2 -538.4 -47.8Q-538.4 -52.4 -542 -54.9Q-545.6 -57.4 -552.4 -57.4ZM-406.8 0 -426.2 -51.8H-431.8L-440.6 0H-485.2L-460.2 -141.6H-402Q-390.4 -141.6 -381 -139Q-371.6 -136.4 -365 -131.4Q-358.4 -126.4 -354.9 -119.1Q-351.4 -111.8 -351.4 -102.4Q-351.4 -84.8 -359.7 -73.4Q-368 -62 -382.4 -57.8L-354.8 0ZM-417 -81.2Q-407.8 -81.2 -402.6 -84.3Q-397.4 -87.4 -397.4 -94.2Q-397.4 -100.4 -401.7 -102.7Q-406 -105 -413.4 -105H-422L-426.2 -81.2ZM-273.4 3.6Q-290.4 3.6 -303.5 -1.1Q-316.6 -5.8 -325.5 -14.4Q-334.4 -23 -339 -34.8Q-343.6 -46.6 -343.6 -60.8Q-343.6 -78.4 -337.4 -93.8Q-331.2 -109.2 -320 -120.6Q-308.8 -132 -292.9 -138.6Q-277 -145.2 -257.6 -145.2Q-240.4 -145.2 -227.3 -140.5Q-214.2 -135.8 -205.3 -127.2Q-196.4 -118.6 -191.8 -106.8Q-187.2 -95 -187.2 -80.8Q-187.2 -63.2 -193.3 -47.8Q-199.4 -32.4 -210.7 -21Q-222 -9.6 -237.9 -3Q-253.8 3.6 -273.4 3.6ZM-235.4 -77.4Q-235.4 -82.8 -237.1 -87.5Q-238.8 -92.2 -242.1 -95.7Q-245.4 -99.2 -250.3 -101.2Q-255.2 -103.2 -261.4 -103.2Q-269.2 -103.2 -275.5 -99.9Q-281.8 -96.6 -286.2 -91.2Q-290.6 -85.8 -293 -78.8Q-295.4 -71.8 -295.4 -64.6Q-295.4 -59.2 -293.7 -54.5Q-292 -49.8 -288.7 -46.3Q-285.4 -42.8 -280.5 -40.8Q-275.6 -38.8 -269.2 -38.8Q-261.4 -38.8 -255.2 -42Q-249 -45.2 -244.6 -50.6Q-240.2 -56 -237.8 -63Q-235.4 -70 -235.4 -77.4ZM-94.8 0 -98 -21.6H-144L-155.8 0H-207.4L-120.4 -141.6H-71.6L-46.8 0ZM-106 -93.4 -126.2 -57H-101.8ZM-13.4 -141.6H45.2Q57.2 -141.6 69.3 -138.3Q81.4 -135 91.1 -127.8Q100.8 -120.6 107 -109.1Q113.2 -97.6 113.2 -81.2Q113.2 -62.6 106.7 -47.5Q100.2 -32.4 88.6 -21.9Q77 -11.4 61.2 -5.7Q45.4 0 26.8 0H-38.4ZM13.8 -39.8H28.8Q37.8 -39.8 44.6 -42.9Q51.4 -46 56 -51.1Q60.6 -56.2 62.9 -62.7Q65.2 -69.2 65.2 -76.2Q65.2 -81.6 63.6 -86.4Q62 -91.2 58.6 -94.7Q55.2 -98.2 49.9 -100.3Q44.6 -102.4 37.4 -102.4H25ZM244.6 -16.2Q240.4 -12.6 234.9 -8.9Q229.4 -5.2 222.4 -2.4Q215.4 0.4 206.7 2.2Q198 4 187.4 4Q171.4 4 158.9 -0.4Q146.4 -4.8 137.7 -13Q129 -21.2 124.4 -32.8Q119.8 -44.4 119.8 -58.6Q119.8 -76.8 126.1 -92.6Q132.4 -108.4 143.8 -120.2Q155.2 -132 170.8 -138.8Q186.4 -145.6 205 -145.6Q223.4 -145.6 237.4 -139.9Q251.4 -134.2 258.8 -125.8L226.6 -92.6Q223 -97.8 217.1 -100.3Q211.2 -102.8 203.8 -102.8Q196.2 -102.8 190 -99.7Q183.8 -96.6 179.4 -91.3Q175 -86 172.6 -79Q170.2 -72 170.2 -64Q170.2 -53.6 176.7 -46.4Q183.2 -39.2 196.2 -39.2Q203.8 -39.2 210.4 -42.4Q217 -45.6 221.8 -50.2L244.6 -16.2ZM340.4 0 337.2 -21.6H291.2L279.4 0H227.8L314.8 -141.6H363.6L388.4 0ZM329.2 -93.4 309 -57H333.4ZM490 -99.4Q486.6 -103.4 481.2 -105.9Q475.8 -108.4 468.6 -108.4Q463 -108.4 458.5 -106Q454 -103.6 454 -98.6Q454 -94.6 457.8 -92.4Q461.6 -90.2 469 -87.8Q478.2 -84.8 485.4 -81Q492.6 -77.2 497.6 -72.2Q502.6 -67.2 505.3 -60.8Q508 -54.4 508 -46.4Q508 -32.8 502 -23.2Q496 -13.6 486.7 -7.6Q477.4 -1.6 466.2 1.2Q455 4 444.4 4Q436 4 427.6 2.6Q419.2 1.2 411.5 -1.4Q403.8 -4 397 -7.8Q390.2 -11.6 385.2 -16.4L416.8 -45.6Q419.2 -42.8 422.6 -40.6Q426 -38.4 429.7 -36.9Q433.4 -35.4 437.2 -34.5Q441 -33.6 444.2 -33.6Q451.2 -33.6 455.4 -35.9Q459.6 -38.2 459.6 -42.6Q459.6 -46.2 456.1 -49Q452.6 -51.8 443 -54.8Q435.4 -57.2 428.7 -60.4Q422 -63.6 417.1 -68.1Q412.2 -72.6 409.4 -78.9Q406.6 -85.2 406.6 -94.2Q406.6 -105.2 411.1 -114.6Q415.6 -124 423.9 -130.9Q432.2 -137.8 443.7 -141.7Q455.2 -145.6 469 -145.6Q476.6 -145.6 484 -144.3Q491.4 -143 498 -140.7Q504.6 -138.4 510.2 -135.2Q515.8 -132 519.6 -128ZM596 -102.6 578 0H531.6L549.6 -102.6H513.8L520.8 -141.6H637.6L630.6 -102.6Z"},"year":{"font":"Futura-Bold","text":"1981","size":130,"spacing":6,"width":361.74000000000007,"path":"M34.45 -76.44H20.15V-98.02H59.93V0H34.45ZM105.58 0 133.4 -31.98H132.88Q129.24 -29.77 126.9 -29.315Q124.56 -28.86 122.74 -28.86Q115.59 -28.86 109.545 -31.59Q103.5 -34.32 99.145 -39.065Q94.79 -43.81 92.32 -50.18Q89.85 -56.55 89.85 -63.83Q89.85 -71.63 92.71 -78.325Q95.57 -85.02 100.965 -90.025Q106.36 -95.03 114.03 -97.89Q121.7 -100.75 131.32 -100.75Q141.07 -100.75 148.74 -97.89Q156.41 -95.03 161.805 -90.09Q167.2 -85.15 170.06 -78.585Q172.92 -72.02 172.92 -64.61Q172.92 -56.29 169.215 -46.605Q165.51 -36.92 157.84 -27.56L135.09 0ZM147.7 -64.35Q147.7 -67.73 146.4 -70.655Q145.1 -73.58 142.89 -75.79Q140.68 -78 137.755 -79.3Q134.83 -80.6 131.45 -80.6Q128.07 -80.6 125.145 -79.3Q122.22 -78 120.01 -75.79Q117.8 -73.58 116.5 -70.655Q115.2 -67.73 115.2 -64.35Q115.2 -60.97 116.5 -58.045Q117.8 -55.12 120.01 -52.91Q122.22 -50.7 125.145 -49.4Q128.07 -48.1 131.45 -48.1Q134.83 -48.1 137.755 -49.4Q140.68 -50.7 142.89 -52.91Q145.1 -55.12 146.4 -58.045Q147.7 -60.97 147.7 -64.35ZM214.15 -29.64Q214.15 -27.17 215.06 -24.96Q215.97 -22.75 217.53 -21.125Q219.09 -19.5 221.235 -18.525Q223.38 -17.55 225.85 -17.55Q228.19 -17.55 230.335 -18.525Q232.48 -19.5 234.105 -21.125Q235.73 -22.75 236.64 -24.895Q237.55 -27.04 237.55 -29.51Q237.55 -34.45 234.105 -37.895Q230.66 -41.34 225.85 -41.34Q220.91 -41.34 217.53 -37.895Q214.15 -34.45 214.15 -29.64ZM215.06 -73.06Q215.06 -68.51 218.18 -65.325Q221.3 -62.14 225.85 -62.14Q228.19 -62.14 230.14 -63.05Q232.09 -63.96 233.52 -65.455Q234.95 -66.95 235.795 -68.9Q236.64 -70.85 236.64 -72.93Q236.64 -77.35 233.52 -80.535Q230.4 -83.72 225.85 -83.72Q221.3 -83.72 218.18 -80.6Q215.06 -77.48 215.06 -73.06ZM207.78 -51.74Q192.44 -58.11 192.44 -73.32Q192.44 -79.56 194.91 -84.565Q197.38 -89.57 201.735 -93.21Q206.09 -96.85 212.265 -98.8Q218.44 -100.75 225.85 -100.75Q233.26 -100.75 239.435 -98.8Q245.61 -96.85 249.965 -93.21Q254.32 -89.57 256.79 -84.565Q259.26 -79.56 259.26 -73.32Q259.26 -69.42 258.48 -66.365Q257.7 -63.31 255.815 -60.775Q253.93 -58.24 250.875 -56.03Q247.82 -53.82 243.27 -51.74Q263.29 -43.94 263.29 -26.52Q263.29 -20.28 260.495 -14.95Q257.7 -9.62 252.695 -5.72Q247.69 -1.82 240.865 0.39Q234.04 2.6 225.85 2.6Q217.92 2.6 211.095 0.455Q204.27 -1.69 199.2 -5.59Q194.13 -9.49 191.27 -14.82Q188.41 -20.15 188.41 -26.52Q188.41 -44.33 207.78 -51.74ZM301.79 -76.44H287.49V-98.02H327.27V0H301.79Z"}};
  const clamp=v=>Math.max(0,Math.min(1,v));
  const hash=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);};
  const stars=Array.from({length:140},(_,i)=>({x:hash(i)*1920,y:hash(i+.5)*480,sin:Math.sin(i*1.3),cos:Math.cos(i*1.3)}));
  const rays=Array.from({length:45},(_,i)=>{const j=i-22;return `M${960+j*6} 640L${960+j*190} 1080`;}).join('');
  const bands=Array.from({length:14},(_,k)=>`M0 ${k*30}h1920v${Math.max(0,26-k*2.2)}h-1920Z`).join('');
  const set=(node,key,value)=>{const next=String(value);if(node.getAttribute(key)!==next)node.setAttribute(key,next);};
  let serial=0;
  function starLayer(){
    return '<g data-layer="stars" fill="#fff">'+stars.map(p=>`<rect data-star x="${p.x}" y="${p.y}" width="2" height="2"/>`).join('')+'</g>';
  }
  function sunLayer(id){
    return `<defs><clipPath id="${id}-sky"><rect width="1920" height="640"/></clipPath>
      <clipPath id="${id}-stripes"><rect data-part="sun-top" width="1920" height="0"/><path data-part="sun-bands" d="${bands}"/></clipPath>
      <radialGradient id="${id}-glow"><stop stop-color="#ff3ca0" stop-opacity=".35"/><stop offset="${.6/2.2}" stop-color="#ff3ca0" stop-opacity=".35"/><stop offset="1" stop-color="#ff3ca0" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}-sun" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#ffe36b"/><stop offset=".5" stop-color="#ff4f8b"/><stop offset="1" stop-color="#9b1dff"/></linearGradient></defs>
      <g data-layer="sun" clip-path="url(#${id}-sky)"><circle data-part="glow" cx="960" r="0" fill="url(#${id}-glow)"/>
      <circle data-part="sun" cx="960" r="0" fill="url(#${id}-sun)" clip-path="url(#${id}-stripes)"/></g>`;
  }
  function gridLayer(id){
    // 横线与纵线在同一路径里描边，保留交点处原来的亮度；不叠加逐线透明度。
    return `<defs><path id="${id}-grid" data-part="grid-path"/></defs><g data-layer="grid" fill="none" stroke="#ff2bd6">
      <use data-part="grid-glow" href="#${id}-grid" stroke-width="7"/>
      <use data-part="grid-core" href="#${id}-grid" stroke-width="2"/>
      <rect x="0" y="639" width="1920" height="2" fill="#ff9df0" stroke="none"/></g>`;
  }
  function starMotion(root){
    const nodes=[...root.querySelectorAll('[data-star]')];
    return t=>{
      const sin=Math.sin(t*3),cos=Math.cos(t*3);
      nodes.forEach((node,i)=>set(node,'opacity',.275*(1+sin*stars[i].cos+cos*stars[i].sin)));
    };
  }
  function sunMotion(root){
    const part=name=>root.querySelector(`[data-part="${name}"]`);
    const top=part('sun-top'),stripes=part('sun-bands'),sun=part('sun'),glow=part('glow');
    return (t,beat)=>{
      const p=clamp(t/1.3),rise=p>=1?1:1-Math.pow(2,-10*p);
      const r=250*(1+.02*beat),y=510+(1-rise)*380;
      set(top,'height',y);set(stripes,'transform',`translate(0 ${y+(t*22)%30})`);
      set(sun,'cy',y);set(sun,'r',r);set(glow,'cy',y);set(glow,'r',r*2.2);
    };
  }
  function gridMotion(root){
    const path=root.querySelector('[data-part="grid-path"]'),glow=root.querySelector('[data-part="grid-glow"]'),core=root.querySelector('[data-part="grid-core"]');
    return (t,beat)=>{
      const phase=(t*2.4)%1,rows=[];
      for(let i=0;i<40;i++){
        const y=640+150/((i+1-phase)*.35);
        if(y>1090||y<640)continue;
        rows.push(`M0 ${y}L1920 ${y}`);
      }
      set(path,'d',rows.join('')+rays);
      const alpha=.55+.45*beat;
      set(glow,'stroke-opacity',.18*alpha);set(core,'stroke-opacity',alpha);
    };
  }
  function chromeLayer(id){
    return `<defs><path id="${id}-chrome-word" d="${typeArtwork.chrome.path}"/>
      <linearGradient id="${id}-chrome" gradientUnits="userSpaceOnUse" x1="0" y1="-150" x2="0" y2="20">
      ${[[0,'#ffffff'],[.35,'#9fd8ff'],[.52,'#2a1b6e'],[.56,'#ff7ae0'],[.8,'#ffe9fb'],[1,'#ffffff']].map(([at,color])=>`<stop offset="${at}" stop-color="${color}"/>`).join('')}</linearGradient>
      <clipPath id="${id}-chrome-buffer"><rect width="1920" height="420"/></clipPath></defs>
      <g data-layer="chrome" aria-label="BROADCAST" data-font="${typeArtwork.chrome.font}">
      ${[6,5,4,3,2,1].map(e=>`<use data-echo="${e}" href="#${id}-chrome-word" fill="none" stroke="${e%2?'#ff2bd6':'#3ef2ff'}" stroke-width="2" opacity="0"/>`).join('')}
      ${[['back',-5],['front',0]].map(([name,x])=>`<g transform="translate(${x} 210)"><g clip-path="url(#${id}-chrome-buffer)"><use data-part="chrome-${name}" href="#${id}-chrome-word" fill="url(#${id}-chrome)" opacity="0"/></g></g>`).join('')}
      <use data-part="chrome-outline" href="#${id}-chrome-word" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="1.5" opacity="0"/></g>`;
  }
  function chromeMotion(root){
    const echoes=[...root.querySelectorAll('[data-echo]')],back=root.querySelector('[data-part="chrome-back"]'),front=root.querySelector('[data-part="chrome-front"]'),outline=root.querySelector('[data-part="chrome-outline"]');
    const enter=t=>{const p=clamp(t-.3);return p>=1?1:1-Math.pow(2,-10*p);};
    return t=>{
      echoes.forEach(node=>{
        const e=+node.dataset.echo,p=enter(t-e*.05);
        set(node,'opacity',p*(.9-e*.12));set(node,'transform',`translate(960 ${500+e*11*p}) scale(${5-4*p})`);
      });
      const p=enter(t),scale=5-4*p;
      for(const [node,alpha,y] of [[back,.5,290],[front,1,290],[outline,1,500]]){
        set(node,'opacity',p*alpha);set(node,'transform',`translate(960 ${y}) scale(${scale})`);
      }
    };
  }
  function neonLayer(id,centered){
    const x=centered?(1920-typeArtwork.year.width)/2:120,y=centered?580:250;
    return `<defs><path id="${id}-neon-year" d="${typeArtwork.year.path}"/>
      <filter id="${id}-neon-glow" filterUnits="userSpaceOnUse" x="-130" y="-230" width="650" height="360" color-interpolation-filters="sRGB"><feGaussianBlur data-part="neon-blur" stdDeviation="12"/></filter></defs>
      <g data-layer="neon" transform="translate(${x} ${y})" aria-label="1981" data-font="${typeArtwork.year.font}">
      <g data-part="neon-lamp" visibility="hidden" fill="none" stroke-width="3"><use href="#${id}-neon-year" stroke="#3ef2ff" filter="url(#${id}-neon-glow)"/>
      <use href="#${id}-neon-year" stroke="#bafcff"/></g></g>`;
  }
  function neonMotion(root){
    const lamp=root.querySelector('[data-part="neon-lamp"]'),blur=root.querySelector('[data-part="neon-blur"]');
    return (t,beat)=>{
      const on=t>.9&&!(t<1.3&&hash(Math.floor(t*30))<.5);
      set(lamp,'visibility',on?'visible':'hidden');
      set(blur,'stdDeviation',(24+20*beat)/2);
    };
  }
  function flareLayer(id){
    return `<defs><radialGradient id="${id}-flare"><stop stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
      <g data-layer="flare"><circle data-part="flare-glow" r="160" fill="url(#${id}-flare)" opacity="0"/><rect data-part="flare-horizontal" x="-300" y="-1" width="600" height="2" fill="#fff" opacity="0"/><rect data-part="flare-vertical" x="-1" y="-140" width="2" height="280" fill="#fff" opacity="0"/></g>`;
  }
  function flareMotion(root){
    const layer=root.querySelector('[data-layer="flare"]'),glow=layer.querySelector('[data-part="flare-glow"]'),lines=[...layer.querySelectorAll('rect')];
    return t=>{
      const p=clamp((t-1.6)),q=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
      const phase=clamp((t-1.7)/.8),alpha=phase>0&&phase<1?Math.sin(phase*Math.PI):0;
      // 原片三次分别叠加，中心交叉处会更亮；整组淡入会丢失这个叠加结果。
      set(glow,'opacity',alpha);lines.forEach(line=>set(line,'opacity',alpha*.9));
      set(layer,'transform',`translate(${576+768*q} 380)`);
    };
  }
  // 两个原场景的 typeOn 共用同一规则：写完前光标常亮，写完后每 0.4 秒明灭一次。
  // 保留原说明文字与间距；英文统一 Oswald Bold，前缀宽度只在创建时准备。
  // 字宽取自本地 Oswald-Bold.woff2 的 advance / unitsPerEm；破折号采用本地中文粗体。
  const captionWidths={" ":.256,"&":.57,",":.238,".":.244,":":.278,"A":.551,"C":.563,"D":.586,"E":.447,"F":.434,"G":.582,"H":.61,"I":.301,"L":.443,"M":.704,"N":.561,"O":.586,"R":.6,"S":.514,"T":.445,"V":.526,"Y":.493,"a":.46,"c":.468,"d":.503,"e":.47,"f":.32,"g":.502,"h":.509,"i":.265,"j":.269,"l":.274,"m":.753,"n":.507,"p":.505,"q":.504,"r":.383,"s":.424,"t":.351,"u":.504,"w":.597,"y":.448,"—":.908};
  const captionPresets={
    neon:{text:'LOGOS LEARN TO FLY — CHROME, NEON & THE VIDEO TOASTER',x:960,y:960,align:'center',size:22,color:'#ffd6f6',track:5,start:2.2,cps:45,caretEnd:4.5},
    grit:{text:'Title sequences get raw: scratched film, jittered type, handmade grit.',x:120,y:930,align:'left',size:26,color:'#bdb6a2',track:0,start:.6,cps:32,caretEnd:5.2}
  };
  const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function captionLayer(options={}){
    const o={...captionPresets.neon,...options};
    return `<g data-layer="caption" aria-label="${escape(o.text)}" fill="${o.color}"${o.centered?' transform="translate(960 540) scale(2) translate(-960 -951.2)"':''}>
      <text data-part="caption-text" y="${o.y}" font-size="${o.size}" letter-spacing="${o.track}" lengthAdjust="spacingAndGlyphs" xml:space="preserve" style="font-family:Oswald,'Source Han Sans SC',sans-serif;font-weight:700;font-kerning:none;font-variant-ligatures:none;white-space:pre"></text>
      <rect data-part="caption-caret" y="${o.y-o.size*.8}" width="${Math.max(2,o.size*.08)}" height="${o.size*.95}" visibility="hidden"/></g>`;
  }
  function captionMotion(root,options={}){
    const o={...captionPresets.neon,...options},layer=root.querySelector('[data-layer="caption"]');
    const text=layer.querySelector('[data-part="caption-text"]'),caret=layer.querySelector('[data-part="caption-caret"]');
    const chars=Array.from(o.text),prefixes=[''],widths=[-o.track];
    chars.forEach(ch=>{prefixes.push(prefixes[prefixes.length-1]+ch);widths.push(widths.at(-1)+(captionWidths[ch]??.6)*o.size+o.track);});
    const x=o.x-(o.align==='center'?widths.at(-1)/2:o.align==='right'?widths.at(-1):0);
    set(text,'x',x);set(caret,'x',x+widths[0]);let previous=-1;
    return t=>{
      const n=Math.max(0,Math.min(chars.length,Math.floor((t-o.start)*o.cps)));
      if(n!==previous){text.textContent=prefixes[n];if(n)set(text,'textLength',widths[n]);else text.removeAttribute('textLength');set(caret,'x',x+widths[n]+(n?o.track+4:0));previous=n;}
      const visible=t>=o.start&&t<o.caretEnd&&(n<chars.length||Math.floor(t*2.5)%2===0);
      set(caret,'visibility',visible?'visible':'hidden');
    };
  }
  const builders={stars:starLayer,sun:sunLayer,grid:gridLayer,chrome:chromeLayer,neon:neonLayer,flare:flareLayer,caption:(_id,centered)=>captionLayer({centered})};
  const motions={stars:starMotion,sun:sunMotion,grid:gridMotion,chrome:chromeMotion,neon:neonMotion,flare:flareMotion,caption:captionMotion};
  function scene(root,title,layers,centered=false){
    const id='motion-neon-'+ ++serial;
    root.innerHTML=`<svg class="pattern-svg" width="640" height="360" viewBox="0 0 1920 1080" aria-hidden="true"><title>${title}</title><defs>
      <linearGradient id="${id}-sky-bg" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#07011a"/><stop offset=".6" stop-color="#1b0638"/><stop offset="1" stop-color="#4a0e5c"/></linearGradient>
      <linearGradient id="${id}-floor-bg" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#1b0335"/><stop offset="1" stop-color="#050010"/></linearGradient></defs>
      <rect width="1920" height="640" fill="url(#${id}-sky-bg)"/><rect y="640" width="1920" height="440" fill="url(#${id}-floor-bg)"/>${layers.map(layer=>builders[layer](id,centered)).join('')}</svg>`;
    const draw=layers.map(layer=>motions[layer](root));let previous=-1;
    return ms=>{
      const time=Math.max(0,Math.min(6000,ms));if(time===previous)return;
      const t=time/1000,globalTime=10+t,beat=Math.exp(-(globalTime-Math.floor(globalTime*2)/2)*7);
      draw.forEach(render=>render(t,beat));previous=time;
    };
  }
  F['striped-sun-rise']=root=>scene(root,'条纹太阳升起',['sun']);
  F['perspective-grid-flow']=root=>scene(root,'透视网格前行',['grid']);
  F['star-twinkle']=root=>scene(root,'星点错峰闪烁',['stars']);
  F['neon-horizon']=root=>scene(root,'霓虹地平线',['stars','sun','grid']);
  F['neon-horizon'].breakdown=[
    {id:'stars',actions:['star-twinkle'],name:'星点闪烁',start:0,end:6000,time:'0–6 秒',detail:'140 个星点固定在各自位置，只改变亮度。每颗星的明暗时刻错开，组合与独立动作的坐标和时间完全一致。'},
    {id:'sun',actions:['striped-sun-rise'],name:'条纹太阳',start:0,end:6000,time:'0–6 秒',detail:'太阳在前 1.3 秒从地平线下升起。下半部条纹以每秒 22 像素持续下移，间隙逐级加宽；圆盘随半秒节拍微微胀缩。'},
    {id:'grid',actions:['perspective-grid-flow'],name:'透视网格',start:0,end:6000,time:'0–6 秒',detail:'地面横线按透视距离向前滚来，纵线汇向地平线；7 像素柔边与 2 像素亮芯共同描线，亮度响应同一半秒节拍。'}
  ];
  F['chrome-outline-echo']=root=>scene(root,'文字描边多层拖影',['chrome']);
  F['neon-type-flicker']=root=>scene(root,'霓虹文字点亮闪烁',['neon'],true);
  F['cross-flare-travel']=root=>scene(root,'十字光斑横移闪亮',['flare']);
  F['caption-type-caret']=root=>{
    const draw=scene(root,'说明文字打字与光标闪烁',['caption'],true);
    // 独立字幕去掉开头两秒等待；组合继续使用原场景时钟。
    return ms=>draw(Math.max(0,Math.min(4000,ms))+2000);
  };
  F['caption-type-caret'].layer=captionLayer;
  F['caption-type-caret'].motion=captionMotion;
  F['caption-type-caret'].presets=captionPresets;
  F['neon-title-sequence']=root=>scene(root,'霓虹文字片头',['stars','sun','grid','chrome','flare','neon','caption']);
  F['neon-title-sequence'].breakdown=[...F['neon-horizon'].breakdown,
    {id:'chrome',actions:['chrome-outline-echo'],name:'主字与描边拖影',start:300,end:1600,time:'0.30–1.60 秒',detail:'原倾斜大字从五倍缩回原大，六层描边每层晚 0.05 秒、交替青色与品红。主字从 0.30 秒同步进入；到位后描边仍逐层向下错开。'},
    {id:'neon',actions:['neon-type-flicker'],name:'霓虹字点亮',start:900,end:6000,time:'0.90 秒起',detail:'空心年份在 0.90–1.30 秒间按原来的固定帧次明灭，之后稳定点亮，青色辉光继续随半秒节拍呼吸。'},
    {id:'flare',actions:['cross-flare-travel'],name:'十字光斑横移',start:1700,end:2500,time:'1.70–2.50 秒',detail:'原片白色十字光斑沿水平方向滑过，径向泛光与两根细线共同渐亮再淡去；不裁进字形，也不恢复字内扫光。'},
    {id:'caption',actions:['caption-type-caret'],name:'说明文字与闪烁光标',start:2200,end:4500,time:'2.20–4.50 秒',detail:'底部原说明以每秒 45 字写出，行首位置按整句宽度固定；输入时光标跟在末字后，写完后每 0.4 秒明灭一次，4.50 秒截止，文字继续保留。'}
  ];
})(globalThis.MotionFactories);
