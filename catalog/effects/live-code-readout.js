/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
(function(global){
'use strict';
const F=global.MotionFactories=global.MotionFactories||{};
const code=[
  'float map(vec3 p) {',
  '  float d = metaballs(p, 6);',
  '  d = smin(d, core(p), 0.6);',
  '  float g = gyroid(p * 3.4);',
  '  return mix(d, shell(g), morph);',
  '}'
];
const clamp=p=>Math.max(0,Math.min(1,p)),part=(t,a,b)=>clamp((t-a)/(b-a));
// 提取原 scene4 的右上窗口；同一帧形变参数驱动读数、进度条和代码行高亮。
F['live-code-readout']=(root,K,def)=>{
  const body=K.textSize('body'),caption=K.textSize('caption');
  root.innerHTML=`<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true">
    <g data-part="window" transform="translate(50 30)" opacity="0">
      <rect width="540" height="300" rx="14" fill="var(--card)" fill-opacity=".6" stroke="var(--ink)" stroke-opacity=".14" stroke-width="1.5"/>
      ${[0,1,2].map(i=>`<circle cx="${28+i*22}" cy="26" r="6" fill="var(--ink)" opacity=".22"/>`).join('')}
      <g font-weight="700" dominant-baseline="central" xml:space="preserve">
        <text x="100" y="27" font-size="${caption}" fill="var(--faint)">scene.frag</text>
        ${code.map((_,i)=>`<text data-part="line${i}" data-code-line="${i}" x="28" y="${72+i*34}" font-size="${body}"/>`).join('')}
        <text data-part="value" x="28" y="272" font-size="${body}"/>
      </g>
      <rect x="250" y="268" width="250" height="6" fill="var(--track)"/>
      <rect data-part="progress" x="250" y="268" width="0" height="6" fill="var(--accent)"/>
    </g>
  </svg>`;
  const nodes=new Map([...root.querySelectorAll('[data-part]')].map(n=>[n.dataset.part,n]));
  const set=(id,attrs={},value)=>{const n=nodes.get(id);for(const [key,v]of Object.entries(attrs))if(n.getAttribute(key)!==String(v))n.setAttribute(key,String(v));if(value!==undefined&&n.textContent!==value)n.textContent=value;};
  return ms=>{
    const t=12.6+Math.max(0,Math.min(ms,2300))/1000,p=part(t,12.6,13.1),u=part(t,13.6,14.9);
    const morph=u<.5?4*u*u*u:1-(-2*u+2)**3/2;
    set('window',{opacity:p>=1?1:1-2**(-10*p),'data-morph':morph});
    let count=Math.floor(part(t,12.7,13.6)*170);
    code.forEach((line,i)=>{
      const value=line.slice(0,Math.max(0,count));count-=line.length;
      set('line'+i,{fill:i===4&&morph>0&&morph<1?'var(--accent)':i===0||i===5?'var(--faint)':'var(--ink)'},value);
    });
    set('value',{fill:morph>0?'var(--accent)':'var(--faint)'},'morph = '+morph.toFixed(3));
    set('progress',{width:250*morph});
  };
};
})(globalThis);
