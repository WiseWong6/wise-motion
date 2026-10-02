/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function(F){
  'use strict';
  const cx=[232,447,662,877],top=[990,820,650,480];
  const clamp=p=>Math.max(0,Math.min(1,p));
  const enter=(t,at,d)=>{const p=clamp((t-at)/d);return p<.5?4*p*p*p:1-(-2*p+2)**3/2;};
  const mix=(a,b,p)=>a+(b-a)*p;
  const landing=1.6+3/1.15,settled=landing+.28;
  function ballAt(t){
    if(t<1.6)return{x:cx[0],y:top[0]-26+3*Math.sin(t*3.4)};
    const h=Math.min(3,(t-1.6)*1.15),k=Math.min(2,Math.floor(h)),p=h-k;
    return{x:mix(cx[k],cx[k+1],p),y:mix(top[k],top[k+1],p)-26-92*Math.sin(Math.PI*p)};
  }
  let serial=0;
  F['step-hop']=(root,K)=>{
    const glow='motion-step-hop-'+ ++serial,labelSize=K.textSize('body',.43);
    root.innerHTML='<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true">'+
      `<defs><radialGradient id="${glow}"><stop stop-color="var(--accent)" stop-opacity=".2"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></radialGradient></defs>`+
      '<g transform="translate(82 -126) scale(.43)">'+
      '<path data-part="base" d="M150 1064H930" fill="none" stroke="var(--path)" stroke-width="2"/>'+
      cx.map((x,i)=>`<rect data-part="ghost${i}" x="${x-95}" y="${top[i]}" width="190" height="64" rx="10" fill="none" stroke="var(--path)" stroke-width="2" stroke-dasharray="12 9"/>`+
        `<g data-part="step${i}"><rect x="${x-95}" y="${top[i]}" width="190" height="64" rx="10" fill="var(--card)" stroke="var(--path)" stroke-width="2"/>`+
        `<path d="M${x-95} ${top[i]}h60" fill="none" stroke="var(--teal)" stroke-width="3"/>`+
        `<path d="M${x} ${top[i]+64}V1064" fill="none" stroke="var(--path)" stroke-opacity=".6" stroke-width="2" stroke-dasharray="8 10"/>`+
        `<text x="${x}" y="${top[i]+32}" text-anchor="middle" dominant-baseline="central" font-size="${labelSize}" font-weight="700" fill="var(--accent)">${String(i+1).padStart(2,'0')}</text></g>`).join('')+
      [4,3,2,1].map(j=>`<circle data-part="trail${j}" r="${2.2-j*.3}" fill="var(--accent)" opacity="${.26-j*.045}"/>`).join('')+
      `<circle data-part="glow" r="70" fill="url(#${glow})"/><circle data-part="ball" r="8" fill="var(--accent)"/></g></svg>`;
    const nodes=new Map([...root.querySelectorAll('[data-part]')].map(n=>[n.dataset.part,n]));
    const set=(id,attrs)=>{const node=nodes.get(id);for(const [key,value]of Object.entries(attrs))if(node.getAttribute(key)!==String(value))node.setAttribute(key,String(value));};
    return ms=>{
      // 沿用成片前两句的视觉时钟；最后一跳按同一弧线补足，尾迹追上后冻结。
      const seconds=Math.max(0,ms)/1000;
      const t=Math.min(settled,seconds<=2.4?seconds*2.3/2.4:2.3+(seconds-2.4)*1.7/(32/15));
      set('base',{opacity:enter(t,.2,.5)});
      for(let i=0;i<4;i++){
        const q=enter(t,.55+i*.55,.5),g=enter(t,.15+i*.14,.4)*(1-q);
        set('ghost'+i,{opacity:g>.01?g:0,'stroke-dashoffset':-t*34});
        set('step'+i,{opacity:q});
      }
      for(let j=4;j>=1;j--){const b=ballAt(t-j*.07);set('trail'+j,{cx:b.x,cy:b.y});}
      const b=ballAt(t);set('ball',{cx:b.x,cy:b.y});set('glow',{cx:b.x,cy:b.y});
    };
  };
})(globalThis.MotionFactories);
