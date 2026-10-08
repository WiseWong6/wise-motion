// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
// 原视频公式，改为独立局部时间；不依赖旁白、原工程或网络。
// Same fixed string hash and Mulberry32 sample as Remotion random(seed).
// Kept local so the browser painter does not bundle Remotion's media/network runtime.
const random = seed => {
 let h=0;
 for(let i=0;i<seed.length;i++)h=((h<<5)-h+seed.charCodeAt(i))|0;
 let t=h+1831565813;
 t=Math.imul(t^(t>>>15),t|1);
 t^=t+Math.imul(t^(t>>>7),t|61);
 return ((t^(t>>>14))>>>0)/4294967296;
};
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, p) => a + (b - a) * p;
export const expoOut = x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const expoIn = x => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10));
export const cubicOut = x => 1 - Math.pow(1 - x, 3);
export const cubicIn = x => x * x * x;
export const inOut = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const quintInOut = x => (x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2);
export const backOut = (x, s = 1.7) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
export const prog = (t, a, b, ease = cubicOut) => ease(clamp((t - a) / Math.max(1e-6, b - a)));
export const springy = (t, a, dur = 0.5, bounce = 0.35) => {
  const x = clamp((t - a) / dur);
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return 1 - Math.exp(-6 * x) * Math.cos(x * Math.PI * (1.5 + bounce * 4));
};
export const rnd = (...k) => random(k.join('-'));
export const shake = (t, a, dur = 0.35, amp = 14, seed = 's') => {
  if (t < a || t > a + dur) return [0, 0];
  const k = Math.floor(t * 30), f = 1 - (t - a) / dur;
  return [(rnd(seed, k, 0) - 0.5) * 2 * amp * f, (rnd(seed, k, 1) - 0.5) * 2 * amp * f];
};

