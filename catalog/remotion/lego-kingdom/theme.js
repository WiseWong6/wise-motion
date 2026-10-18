// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
// Original motion curves and palette. Demonstration text uses the catalog's licensed fonts.
import React from 'react';
import {Easing, interpolate} from 'remotion';
export {interpolate};
// Catalog icon CSS must not resize the motion's SVG drawing planes.
export function Svg({width,height,style,children,...props}) {
  return React.createElement('svg',{...props,width,height,style:{width,height,display:'block',flex:'none',...style}},children);
}
export const C = {paper:'#EEE6D8',paperHi:'#F7F2E9',paperLo:'#E2D7C4',ink:'#1C1A17',ink2:'#4B453D',mute:'#8D8373',hair:'#CFC4B0',red:'#D5452F',orange:'#E8643A',yellow:'#F2BD2C',blue:'#2A58B8',teal:'#2D8C88',green:'#3E8E3E',night:'#0B0C0E',white:'#FFFCF5'};
export const F = {cn:'"Source Han Sans SC", sans-serif',num:'"Lego Oswald", sans-serif',mono:'"Lego IBM Plex Mono", monospace',serif:'"Source Han Sans SC", serif'};
export const outExpo = Easing.bezier(.16,1,.3,1);
export const outQuart = Easing.bezier(.25,1,.5,1);
export const inOut = Easing.bezier(.65,0,.35,1);
export const inExpo = Easing.bezier(.7,0,.84,0);
export const clamp01 = v => Math.max(0,Math.min(1,v));
export const tw = (f,a,b,from=0,to=1,easing=outExpo) => interpolate(f,[a,b],[from,to],{extrapolateLeft:'clamp',extrapolateRight:'clamp',easing});
export const backOut = (t,c=1.7) => {const x=clamp01(t)-1;return 1+(c+1)*x*x*x+c*x*x;};
export const fmtInt = n => Math.round(n).toLocaleString('en-US');
