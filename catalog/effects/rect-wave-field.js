/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function(F){
  'use strict';
  const clamp=p=>Math.max(0,Math.min(1,p));
  const ease=p=>{p=clamp(p);return p<.5?4*p*p*p:1-(-2*p+2)**3/2;};
  const enter=(t,at,d)=>ease((t-at)/d);
  F['rect-wave-field']=root=>{
    // 各列固定八点，保留原亮波与相位起伏，取消高斯轮廓和横向收窄。
    root.innerHTML='<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true">'+
      Array.from({length:25},(_,i)=>`<g data-col="${i-12}">`+Array.from({length:8},(_,row)=>
        `<circle data-row="${row}" cx="${104+i*18}" cy="${96+row*24}" r="3.2"/>`).join('')+'</g>').join('')+'</svg>';
    const columns=[...root.querySelectorAll('[data-col]')].map(group=>({group,col:Number(group.dataset.col),dots:[...group.children]}));
    const set=(node,attrs)=>{for(const [key,value] of Object.entries(attrs))if(node.getAttribute(key)!==String(value))node.setAttribute(key,String(value));};
    return ms=>{
      const t=Math.min(5.4,Math.max(0,ms-150)/1000),active=1-enter(t,4.8,.6);
      // 亮波从矩形左外侧扫到右外侧，末尾随起伏一同衰减至静止。
      const scan=-16+(t-1.2)*8;
      for(const {group,col,dots} of columns){
        const wave=Math.exp(-Math.pow((col-scan)/2.1,2))*active;
        set(group,{fill:`color-mix(in srgb, var(--accent) ${wave*100}%, var(--muted))`});
        for(let row=0;row<8;row++){
          const p=enter(t,.1+(col+12)*.025+row*.035,.45);
          const x=320+col*18+Math.sin(t*1.37+row*.72+col*.31)*2*active;
          const y=96+row*24+Math.sin(t*2.05+col*.45+row*.83)*6*active;
          set(dots[row],{cx:x,cy:y,r:3.2+wave*1.3,opacity:p*(.55+wave*.4)});
        }
      }
    };
  };
})(globalThis.MotionFactories);
