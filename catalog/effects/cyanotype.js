/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* 三张已叠好的纸卡随镜头缩回，由暗绿纸面连续显影为深蓝。 */
(function(global){
  'use strict';
  const F=global.MotionFactories=global.MotionFactories||{};
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,p)=>a+(b-a)*p;
  const smooth=(p,a,b)=>{const q=clamp((p-a)/(b-a));return q*q*(3-2*q);};
  const fixed=n=>Number(n.toFixed(5));
  let instance=0;
  const scriptURL=typeof document==='undefined'?'':document.currentScript?.src||[...document.scripts].find(s=>s.src.endsWith('/effects/cyanotype.js'))?.src||'';
  function assetURL(doc){
    if(scriptURL)return new URL('../assets/cyanotype/botanical-atlas.webp',scriptURL).href;
    const directory=/\/catalog\/[^/]*$/.test(new URL(doc.baseURI).pathname)?'assets/':'catalog/assets/';
    return new URL(directory+'cyanotype/botanical-atlas.webp',doc.baseURI).href;
  }
  F.cyanotype=(root,K,definition)=>{
    root.dataset.art='original';
    const prefix='wm-cyanotype-'+(++instance);
    const asset=assetURL(root.ownerDocument);
    // 后卡、左前卡、右前卡。各纸面是图集中的独立窗口，按比例裁取，不拉伸植物。
    const cards=[
      {x:293,y:108.5,w:202,h:145,angle:1,tile:0},
      {x:249,y:202,w:163,h:202,angle:-26,tile:1},
      {x:403.8,y:224,w:140,h:200,angle:31,tile:2}
    ];
    root.innerHTML=`<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="三张已叠好的植物纸卡整体缓慢缩小，从暗绿显影为深蓝">
      <defs>
        <radialGradient id="${prefix}-light" cx="49%" cy="45%" r="74%"><stop stop-color="#e6ecdb"/><stop offset=".65" stop-color="#d0dccb"/><stop offset="1" stop-color="#afc2b2"/></radialGradient>
        <filter id="${prefix}-shadow" x="-12%" y="-12%" width="130%" height="135%"><feGaussianBlur stdDeviation="1.05"/></filter>
        ${cards.map((_,i)=>`<filter id="${prefix}-develop-${i}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix"/></filter>`).join('')}
      </defs>
      <rect width="640" height="360" fill="url(#${prefix}-light)"/>
      <rect class="cy-ambient" width="640" height="360" fill="#435c45"/>
      <g class="cy-stack">${cards.map((c,i)=>`<g class="cy-card" transform="translate(${c.x} ${c.y}) rotate(${c.angle})">
        <rect x="${-c.w/2+.8}" y="${-c.h/2+1.2}" width="${c.w}" height="${c.h}" fill="#233827" opacity=".18" filter="url(#${prefix}-shadow)"/>
        <g filter="url(#${prefix}-develop-${i})">
          <rect x="${-c.w/2}" y="${-c.h/2}" width="${c.w}" height="${c.h}" fill="#0d3654"/>
          <svg x="${-c.w/2}" y="${-c.h/2}" width="${c.w}" height="${c.h}" viewBox="${c.tile*512} 0 512 1024" preserveAspectRatio="xMidYMid slice" overflow="hidden">
            <image href="${asset}" width="1536" height="1024"/>
          </svg>
        </g>
        <rect x="${-c.w/2}" y="${-c.h/2}" width="${c.w}" height="${c.h}" fill="none" stroke="#d9eadb" stroke-opacity=".22" stroke-width=".45"/>
      </g>`).join('')}</g>
    </svg>`;
    const matrices=[...root.querySelectorAll('feColorMatrix')],ambient=root.querySelector('.cy-ambient');
    const stack=root.querySelector('.cy-stack');
    const dark=[.046,.10,.014,0,.012, .075,.15,.025,0,.031, .042,.088,.013,0,.03, 0,0,0,1,0];
    const developed=[.12756,.42912,.04332,0,0, .091418,.307536,.031046,0,.28, .046772,.157344,.015884,0,.41, 0,0,0,1,0];
    let last=-1,disposed=false,finish;
    const render=ms=>{
      const p=clamp(ms/definition.duration_ms);if(disposed||p===last)return;last=p;
      // 三卡从第一帧即叠好，原片的镜头后退只改变整组尺度。
      const zoom=smooth(p,0,.86),scale=mix(1.22,1,zoom);
      stack.setAttribute('transform','translate(320 180) scale('+fixed(scale)+') translate(-320 -180)');
      const exposure=p;
      matrices.forEach((matrix,i)=>{
        const development=smooth(exposure,.29+i*.018,.72+i*.018);
        matrix.setAttribute('values',dark.map((v,j)=>fixed(mix(v,developed[j],development))).join(' '));
      });
      ambient.setAttribute('opacity',fixed(mix(.15,0,smooth(exposure,.29,.78))));
    };
    // 先准备本地图集；播放、拖动和缩略图共用这份准备结果。
    const image=new global.Image();
    render.ready=new Promise((resolve,reject)=>{
      let settled=false;
      finish=error=>{
        if(settled)return;settled=true;image.onload=image.onerror=null;
        if(error)reject(error);else resolve();
      };
      const failed=()=>finish(new Error('植物纸面素材未能加载，请确认 catalog/assets/cyanotype 的文件完整。'));
      image.onerror=failed;
      if(typeof image.decode!=='function')image.onload=()=>finish();
      image.src=asset;
      if(typeof image.decode==='function'){
        try{Promise.resolve(image.decode()).then(()=>finish(),failed);}catch{failed();}
      }
    });
    render.destroy=()=>{disposed=true;finish();};
    return render;
  };

  F.cyanotype.requiresPreparation=true;
})(globalThis);
