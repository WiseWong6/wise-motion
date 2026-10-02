/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function(F){
  'use strict';
  // 按用户选择恢复前一版：整幅画面压成横线，再缩成亮点熄灭。
  // 这是独立关机演示，不声称直接复刻原片正文两轴同时收缩的动作。
  const DURATION=1200,W=640,H=360,CX=W/2,CY=H/2;
  const clamp=v=>Math.max(0,Math.min(1,v));
  const span=(t,start,end)=>clamp((t-start)/(end-start));
  const outCubic=p=>1-Math.pow(1-p,3);
  let serial=0;
  function stateAt(ms){
    const time=Math.max(0,Math.min(DURATION,Number.isFinite(ms)?ms:0));
    const verticalProgress=span(time,150,550),horizontalProgress=span(time,550,750);
    const fadeProgress=span(time,750,900),vertical=outCubic(verticalProgress),horizontal=outCubic(horizontalProgress);
    const fade=1-fadeProgress;
    return {time,verticalProgress,horizontalProgress,fadeProgress,
      scaleX:1-.992*horizontal,scaleY:1-.992*vertical,
      screenOpacity:fade,lineOpacity:span(verticalProgress,.65,1),
      glowRadius:2+4*horizontalProgress,glowOpacity:horizontalProgress*fade};
  }
  function set(node,name,value){
    const next=String(value);if(node.getAttribute(name)!==next)node.setAttribute(name,next);
  }
  function make(root,kit,definition={duration_ms:DURATION}){
    const duration=Number.isFinite(definition.duration_ms)&&definition.duration_ms>0?definition.duration_ms:DURATION;
    const id='motion-crt-glow-'+ ++serial;
    const dots=[];
    for(let y=20;y<H;y+=20)for(let x=20;x<W;x+=20)dots.push(`<rect x="${x-.4}" y="${y-.4}" width=".8" height=".8"/>`);
    root.innerHTML=`<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true"><title>关机收缩</title>
      <defs><radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="320" cy="180" r="2">
        <stop offset="0" stop-color="#fff"/><stop offset=".2" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </radialGradient></defs>
      <rect data-crt-back x="0" y="0" width="640" height="360" fill="#000"/>
      <g data-crt-screen>
        <rect data-crt-background x="0" y="0" width="640" height="360" fill="var(--surface)"/>
        <g data-crt-grid fill="var(--ink)" opacity=".16">${dots.join('')}</g>
        <g data-crt-content fill="var(--ink)">
          <rect x="36" y="32" width="568" height="296" rx="5" fill="none" stroke="var(--ink)" stroke-opacity=".4"/>
          <text x="80" y="124" font-size="21" dominant-baseline="central" style="font-family:var(--mono,monospace);font-weight:500">$ WISE MOTION</text>
          <g font-size="15" dominant-baseline="central" style="font-family:var(--font,sans-serif);font-weight:300">
            <text x="80" y="172" fill="var(--accent)">画面已就绪</text>
            <text x="80" y="207">让文字变成画面</text>
            <text x="80" y="242" fill="var(--muted)">影像 · 文字 · 声音</text>
          </g>
        </g>
        <rect data-crt-flash x="0" y="0" width="640" height="360" fill="#fff" opacity="0"/>
      </g>
      <circle data-crt-core cx="320" cy="180" r="2" fill="url(#${id})" opacity="0"/>
    </svg>`;
    const screen=root.querySelector('[data-crt-screen]'),flash=root.querySelector('[data-crt-flash]');
    const core=root.querySelector('[data-crt-core]'),gradient=root.querySelector('radialGradient');
    let previous=-1;
    const render=ms=>{
      const state=stateAt(ms*DURATION/duration);if(state.time===previous)return;previous=state.time;
      set(screen,'transform',`translate(${CX} ${CY}) scale(${state.scaleX} ${state.scaleY}) translate(${-CX} ${-CY})`);
      set(screen,'opacity',state.screenOpacity);set(flash,'opacity',state.lineOpacity);
      set(core,'r',state.glowRadius);set(gradient,'r',state.glowRadius);set(core,'opacity',state.glowOpacity);
    };
    render(0);return render;
  }
  make.stateAt=stateAt;
  make.timing={duration_ms:DURATION,stable_end:150,vertical_end:550,horizontal_end:750,fade_end:900};
  F['crt-collapse']=make;
})(globalThis.MotionFactories);
