/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function(F){
  'use strict';
  // 原片八处交接的遮罩与附加光效；两张示意画面只作为可替换载体。
  const W=1920,H=1080,diagonal=Math.hypot(W,H);
  const clamp=v=>Math.max(0,Math.min(1,v));
  const cubic=p=>p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
  const expo=p=>p<=0?0:p>=1?1:p<.5?Math.pow(2,20*p-10)/2:(2-Math.pow(2,-20*p+10))/2;
  const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
  const set=(node,key,value)=>{const next=String(value);if(node.getAttribute(key)!==next)node.setAttribute(key,next);};
  const rect=(x,y,w,h)=>`M${x} ${y}h${w}v${h}h${-w}Z`;
  const tiles=Array.from({length:170},(_,i)=>{const x=Math.floor(i/10),y=i%10;return {x:x*120+60,y:y*120+60,d:Math.hypot(x*120+60-W/2,y*120+60-H/2)/(diagonal*.55)};});
  const pixels=Array.from({length:576},(_,i)=>({x:Math.floor(i/18)*60,y:i%18*60,n:hash(i+.31)}));
  const settings={
    'iris-open-transition':{name:'圆孔扩张转场',type:'iris',at:4,d:.8},
    'slat-alternate-transition':{name:'横条交错展开转场',type:'slats',at:10,d:.7},
    'glitch-band-transition':{name:'横带撕裂闪切转场',type:'glitch',at:16,d:.45},
    'radial-flash-transition':{name:'中心闪亮切换',type:'flash',at:22,d:.5},
    'tile-wave-transition':{name:'方块由中心铺开转场',type:'tiles',at:30,d:.9},
    'diagonal-edge-transition':{name:'斜边推移转场',type:'diag',at:38,d:.7},
    'pixel-dissolve-transition':{name:'像素错序显露转场',type:'pixel',at:46,d:.8},
    'iris-flash-transition':{name:'圆孔扩张与闪亮交接',type:'iris',at:54,d:.5,flash:true}
  };
  // 参数直接来自原 transClip，不把方块波与像素随机显露混为同一种遮罩。
  function mask(type,p,t){
    if(type==='iris'){
      const r=cubic(p)*diagonal*.72;
      return r>0?`M${960-r} 540a${r} ${r} 0 1 0 ${r*2} 0a${r} ${r} 0 1 0 ${-r*2} 0Z`:'';
    }
    if(type==='slats')return Array.from({length:10},(_,i)=>{const w=W*cubic(clamp(p*1.8-i*.08));return rect(i%2?W-w:0,i*108,w,109);}).join('');
    if(type==='glitch'){
      const frame=Math.floor(t*30);
      return Array.from({length:18},(_,j)=>p>.92||hash(j*3.7+frame*.131)<p*1.25-.12?rect(0,j*60,W,61):'').join('');
    }
    if(type==='flash')return p>=.5?rect(0,0,W,H):'';
    if(type==='tiles')return tiles.map(c=>{const q=1-Math.pow(1-clamp(p*2.2-c.d*1.2),3),s=120*q+1;return q>0?rect(c.x-s/2,c.y-s/2,s,s):'';}).join('');
    if(type==='diag'){const x=-10+2630*expo(p);return `M-10 -10L${x} -10L${x-700} 1090L-10 1090Z`;}
    return pixels.map(c=>p>.95||c.n<p*1.1-.05?rect(c.x,c.y,60,60):'').join('');
  }
  let serial=0;
  function surface(after){
    const color=after?'var(--teal)':'var(--accent)',name=after?'AFTER':'BEFORE';
    return `<rect width="1920" height="1080" fill="${after?'var(--card)':'var(--stage)'}"/>
      <rect x="150" y="150" width="1620" height="780" rx="30" fill="none" stroke="var(--faint)" stroke-width="2"/>
      <g transform="translate(960 485)" fill="none" stroke="${color}" stroke-width="5">${after?'<rect x="-145" y="-145" width="290" height="290" rx="40" transform="rotate(45)"/><rect x="-85" y="-85" width="170" height="170" rx="20" transform="rotate(45)"/>':'<circle r="180"/><circle r="120"/>'}</g>
      <text x="960" y="790" text-anchor="middle" font-size="72" letter-spacing="10" fill="var(--ink)" style="font-family:Oswald,sans-serif;font-weight:700">${name}</text>`;
  }
  function make(root,cfg){
    const id='motion-reel-transition-'+ ++serial;
    root.innerHTML=`<svg class="pattern-svg" width="640" height="360" viewBox="0 0 1920 1080" aria-hidden="true"><title>${cfg.name}</title><defs>
      <clipPath id="${id}-mask"><path data-mask/></clipPath>
      <radialGradient id="${id}-flash" gradientUnits="userSpaceOnUse" cx="960" cy="540" r="${diagonal*.7}"><stop stop-color="#fffaf0"/><stop offset="1" stop-color="${cfg.flash?'#fff':'#ff7828'}" stop-opacity="${cfg.flash?.8:.7}"/></radialGradient></defs>
      <g data-surface="before">${surface(false)}</g><g data-layer="reveal" clip-path="url(#${id}-mask)">${surface(true)}</g>
      <g data-layer="edge"><path data-edge fill="none" stroke="${cfg.type==='iris'?'#f1e4c8':'#7b61ff'}" stroke-width="${cfg.type==='iris'?14:10}"/></g>
      <g data-layer="glitch" opacity="0">${Array.from({length:cfg.type==='glitch'?7:0},(_,i)=>`<rect data-fragment fill="${['#3ef2ff','#ff2bd6','#e8e2d0'][i%3]}" opacity="${i%3===2?.5:.55}"/>`).join('')}</g>
      <rect data-layer="flash" width="1920" height="1080" fill="url(#${id}-flash)" opacity="0"/></svg>`;
    const clip=root.querySelector('[data-mask]'),edge=root.querySelector('[data-edge]'),flash=root.querySelector('[data-layer="flash"]'),glitch=root.querySelector('[data-layer="glitch"]');
    const fragments=[...root.querySelectorAll('[data-fragment]')];let previous=-1;
    return ms=>{
      const time=Math.max(0,Math.min(1800,ms));if(time===previous)return;previous=time;
      const p=clamp((time-500)/(cfg.d*1000)),t=cfg.at-cfg.d/2+(time-500)/1000;
      set(clip,'d',mask(cfg.type,p,t));
      if(cfg.type==='iris'&&!cfg.flash&&p>0&&p<1)set(edge,'d',mask('iris',p,t));
      else if(cfg.type==='diag'){const x=-10+2630*expo(p);set(edge,'d',`M${x} -10L${x-700} 1090`);}
      else set(edge,'d','');
      set(flash,'opacity',cfg.type==='flash'||cfg.flash?1-Math.abs(p-.5)*2:0);
      const active=cfg.type==='glitch'&&p>.05&&p<.95;set(glitch,'opacity',active?1:0);
      // 隐藏状态也有确定几何，倒拖与直接跳到同一时刻得到完全相同的结果。
      const fr=active?Math.floor(t*30):0;
      fragments.forEach((node,k)=>{
        set(node,'x',hash(fr+k)*W-200);set(node,'y',hash(fr*2+k)*H);
        set(node,'width',200+hash(fr*3+k)*700);set(node,'height',6+hash(k+fr*5)*40);
      });
    };
  }
  for(const [id,cfg] of Object.entries(settings))F[id]=root=>make(root,cfg);
  const defaultBandCut = F['glitch-band-transition'];
  F['glitch-band-transition'] = (root, K, definition) => definition?.variant_id === 'poster-cut'
    ? globalThis.WiseGeometricPoster.make(root, K, definition, 'intermittent')
    : defaultBandCut(root, K, definition);
})(globalThis.MotionFactories);
