/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* 从自拍原图提炼的透明手机插画；不依赖原工程或联网。 */
(function(global){
  'use strict';
  const script=typeof document!=='undefined'?document.currentScript:null;
  const scriptURL=script?.src||(typeof document!=='undefined'?[...document.querySelectorAll('script[src]')].find(s=>s.src.endsWith('/effects/selfie-phone.js'))?.src:null);
  const asset=typeof document==='undefined'?'catalog/assets/selfie-phone.png':scriptURL?new URL('../assets/selfie-phone.png',scriptURL).href:
    new URL(/\/catalog\/[^/]*$/.test(new URL(document.baseURI).pathname)?'assets/selfie-phone.png':'catalog/assets/selfie-phone.png',document.baseURI).href;
  const F=global.MotionFactories=global.MotionFactories||{};
  F['selfie-phone-illustration']=root=>{
    root.innerHTML='<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true"><image data-part="phone" x="65" y="10" width="510" height="340" preserveAspectRatio="xMidYMid meet"/></svg>';
    root.querySelector('image').setAttribute('href',asset);
    return ()=>{};
  };
})(globalThis);
