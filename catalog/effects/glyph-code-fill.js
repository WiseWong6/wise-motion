/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function(global){
  'use strict';
  const F=global.MotionFactories=global.MotionFactories||{};
  // 原宣传片 scene3 的源码材料；字形是固定窗口，只有内部材料滚动。
  const code=[
    'float smin(float a, float b, float k){',
    '  float h = clamp(.5+.5*(b-a)/k, 0., 1.);',
    '  return mix(b, a, h) - k*h*(1.-h);',
    '}',
    'const r = p.sp * (1 - Math.exp(-2.6 * dt));',
    'x = lerp(x, TA[i*2], easeInOutCubic(m1));',
    'for (let i = 0; i < 7000; i++) {',
    'body = np.sin(2*np.pi*np.cumsum(f)/SR)',
    'env = np.exp(-t * 7.5)',
    'mag = np.abs(np.fft.rfft(seg * win))',
    'vec3 n = normalize(grad(map, p));',
    'col = pal(dot(n, up)*.35 + fr*.6);',
    'glow += exp(-d * 6.) * .02;',
    'ctx.globalCompositeOperation = "lighter";',
    'await page.screenshot({ type: "jpeg" });',
    'ffmpeg -f image2pipe -i - out.mp4'
  ];
  const rows=code.map(line=>(line+'  ·  ').repeat(5));
  let serial=0;
  const set=(node,key,value)=>{value=String(value);if(node.getAttribute(key)!==value)node.setAttribute(key,value);};
  F['glyph-code-fill']=root=>{
    const id='motion-glyph-code-'+ ++serial;
    // 将原 1920×1080 画板等比缩小；细小代码是字形纹理，不是正文标签。
    // 填充与外描边共用同一个字形，避免字体或位置不同造成漏色。
    root.innerHTML=`<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true">
      <defs>
        <text id="${id}-shape" data-glyph x="320" y="180" text-anchor="middle" dominant-baseline="central" font-family="Source Han Sans SC,sans-serif" font-weight="700" font-size="${460/3}">代码</text>
        <clipPath id="${id}-clip" clipPathUnits="userSpaceOnUse"><use href="#${id}-shape"/></clipPath>
      </defs>
      <g data-code-texture clip-path="url(#${id}-clip)" font-family="Oswald,sans-serif" font-weight="700" font-size="7" dominant-baseline="text-before-edge" xml:space="preserve">
        ${Array.from({length:52},(_,i)=>`<text data-code-row="${i}" lengthAdjust="spacingAndGlyphs"/>`).join('')}
      </g>
      <use data-glyph-outline href="#${id}-shape" fill="none" stroke="var(--ink)" stroke-opacity=".35" stroke-width="${2/3}"/>
    </svg>`;
    const nodes=[...root.querySelectorAll('[data-code-row]')];
    return (ms,options={})=>{
      const t=Math.max(0,options.elapsed??ms)/1000;
      // 回收已从画板上缘离开的行；行身份仍按累计时间计算，循环不倒退。
      const offset=Math.floor(t*60/21),tick=Math.floor(t*20);
      nodes.forEach((node,n)=>{
        const i=n+offset,line=(i*5+tick)%rows.length,value=rows[line];
        set(node,'data-source-row',i);
        set(node,'x',-((t*600*(i%2?1:1.6)+i*131)%700)/3);
        set(node,'y',(i*21-t*60)/3);
        set(node,'fill',i%5===0?'var(--accent)':i%2===0?'var(--ink)':'var(--muted)');
        // 保留原等宽材料的行宽关系，目录里实际字形仍使用本地 Oswald。
        set(node,'textLength',value.length*4.2);
        if(node.textContent!==value)node.textContent=value;
      });
    };
  };
})(globalThis);
