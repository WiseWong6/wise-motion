/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* 门形轮廓沿用本机 Overview.tsx 中的 Naive AI 标志；标志权利归原权利人。 */
(function(global){
  'use strict';
  const doorPath='M14.3581 7.87505C18.1899 5.43426 23.5171 5.81572 34.1714 6.57872C43.5286 7.24883 48.2072 7.58392 51.4781 10.0941C52.6915 11.0252 53.7409 12.1524 54.583 13.4292C56.8531 16.8711 56.8531 21.5617 56.8531 30.9429V51.104C56.8531 52.3367 56.8531 52.9531 56.4923 53.3799C56.1317 53.8066 55.5239 53.9093 54.3083 54.1146L53.7772 54.2043C52.6179 54.3508 52.2835 53.6588 52.2732 53.1375V23.3557C52.2732 21.0962 52.2731 19.9664 52.0503 19.0337C51.3375 16.049 49.0071 13.7187 46.0224 13.0058C45.0898 12.783 43.96 12.7831 41.7005 12.7831C39.229 12.7831 37.9933 12.7831 36.9733 13.0267C33.7088 13.8064 31.1599 16.3552 30.3802 19.6197C30.1366 20.6398 30.1366 21.8755 30.1366 24.3469V56.6867L30.1328 56.6745C30.1328 57.2097 29.7874 57.9466 28.546 57.7558C28.5016 57.749 28.4596 57.7434 28.4198 57.7389L10.5767 54.9189C9.34683 54.7245 8.73188 54.6274 8.36594 54.1991C8 53.7707 8 53.1481 8 51.903V30.9429C8 20.2613 8.00005 14.9205 10.7083 11.2728C11.7075 9.9271 12.9445 8.77554 14.3581 7.87505Z';
  const clamp=p=>Math.max(0,Math.min(1,p));
  let serial=0;
  global.MotionFactories['door-halftone-illustration']=root=>{
    const id='motion-door-halftone-'+ ++serial;
    const reveal=global.anime.cubicBezier(.65,0,.35,1),appear=global.anime.cubicBezier(.16,1,.3,1);
    // 沿用原作的 4.6 倍轮廓、点距及揭示窗口，只将整个标志移到画板中央。
    root.innerHTML=`<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true">
      <defs>
        <pattern id="${id}-dots" width="1.5" height="1.5" patternUnits="userSpaceOnUse"><circle cx=".75" cy=".75" r=".38" fill="var(--ink)"/></pattern>
        <clipPath id="${id}-reveal" clipPathUnits="userSpaceOnUse"><rect data-reveal x="0" y="0" width="240" height="0"/></clipPath>
      </defs>
      <g data-mark transform="translate(207.63787 57)" opacity="0"><g clip-path="url(#${id}-reveal)">
        <path data-door d="${doorPath}" transform="scale(4.6) translate(-8 -6)" fill="url(#${id}-dots)"/>
      </g></g>
    </svg>`;
    const mark=root.querySelector('[data-mark]'),window=root.querySelector('[data-reveal]');
    const set=(node,key,value)=>{value=String(value);if(node.getAttribute(key)!==value)node.setAttribute(key,value);};
    return ms=>{
      // 原作第 4 至 34 帧完成揭示，第 4 至 16 帧完成淡入（每秒 30 帧）。
      const elapsed=Math.min(1000,Math.max(0,ms-150));
      set(window,'height',246*reveal(clamp(elapsed/1000)));
      set(mark,'opacity',appear(clamp(elapsed/400)));
    };
  };
})(globalThis);
