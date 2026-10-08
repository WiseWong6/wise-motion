// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import React from 'react';
import {C} from './colors.js';
import {clamp,lerp,prog,springy,cubicIn,cubicOut,expoOut} from './math.mjs';
import WORDS from './garbage-words.json';
const T={h1:80,h2:48};
const F={bold:'"Oswald", "Source Han Sans SC", sans-serif',heavy:'"Oswald", "Source Han Sans SC", sans-serif'};
export const KLine = ({t, li, rows, x = 72, y, w = 936, size = T.h1, font = size <= T.h2 ? F.bold : F.heavy, color = C.ink, hl = {}, mode = 'rise', align = 'left',
  lh = 1.22, rowGap = 0.2, exitAt, exit = 'up', lead = 0.03, tracking = 0, dur = 0.42, growUp = false, style, charStyle, hide = []}) => {
  const sceneT=t;
  const L=WORDS[li];
  const full = rows ? rows.join('') : L.text;
  const startIdx = [...L.text.slice(0, L.text.indexOf(full))].length;
  if (L.text.indexOf(full) < 0) throw new Error(`rows mismatch line ${li}`);
  const first = L.t[startIdx];
  if (t < first - lead - 0.05) return null;
  const marks = {};
  const fullArr = [...full];
  for (const [sub, col] of Object.entries(hl)) {
    let p = full.indexOf(sub);
    while (p >= 0) { const ci = [...full.slice(0, p)].length; for (let k = 0; k < [...sub].length; k++) marks[ci + k] = col; p = full.indexOf(sub, p + sub.length); }
  }
  let ex = 0;
  if (exitAt !== undefined) ex = prog(sceneT, exitAt, exitAt + 0.3, cubicIn);
  if (ex >= 1) return null;
  let ci = 0;
  const lines = rows || [full];
  let growingStyle = {};
  if (growUp && lines.length > 1) {
    // 下沿贴着内容；下一行开始出现才向上展开，不让未出现的行占位。
    const pitch = size * (lh + rowGap), rowH = size * lh;
    let count = 0, expansion = 0;
    for (let ri = 0; ri < lines.length; ri++) {
      if (ri > 0) {
        const cue = L.t[startIdx + count] - lead;
        expansion += pitch * prog(t, cue, cue + Math.min(dur, 0.36), cubicOut);
      }
      count += [...lines[ri]].length;
    }
    growingStyle = {top: y + (lines.length - 1) * pitch - expansion,
      height: rowH + expansion, overflow: 'hidden'};
  }
  return <div data-growing-title={growUp ? li : undefined} style={{position: 'absolute', left: x, top: y, width: w, textAlign: align, font: `${size}px/${lh} ${font}`, color, letterSpacing: tracking, ...growingStyle, ...style}}>
    {lines.map((row, ri) => <div key={ri} style={{display: 'block', whiteSpace: 'pre', height: size * lh, lineHeight: lh, marginBottom: ri < lines.length - 1 ? size * rowGap : 0, overflow: 'hidden'}}>
      {[...row].map((ch) => {
        const idx = ci++;
        const tc = L.t[startIdx + idx] - lead;
        const p = prog(t, tc, tc + dur, expoOut);
        const col = marks[idx] || undefined;
        if (hide.includes(idx)) return <span key={idx} style={{display: 'inline-block', opacity: 0}}>{ch === ' ' ? '\u2002' : ch}</span>;
        let inner = {display: 'inline-block', color: col};
        if (mode === 'rise') inner.transform = `translateY(${(1 - p) * 105 + (exit === 'up' ? -ex * 110 : 0)}%)`;
        if (mode === 'pop') { const s = springy(t, tc, 0.45, 0.4); inner.transform = `scale(${s}) translateY(${exit === 'up' ? -ex * 110 : 0}%)`; inner.opacity = clamp((t - tc) / 0.05); }
        if (mode === 'slam') { const q = clamp((t - tc) / 0.14); inner.transform = `scale(${lerp(2.2, 1, cubicOut(q))})`; inner.opacity = q; inner.filter = q < 1 ? `blur(${(1 - q) * 8}px)` : undefined; }
        if (mode === 'type') inner.opacity = t >= tc ? 1 : 0;
        if (mode === 'fade') { inner.opacity = p; inner.filter = p < 1 ? `blur(${(1 - p) * 10}px)` : undefined; inner.transform = `translateY(${(1 - p) * 20}px)`; }
        if (exit === 'fade' && ex > 0) inner.opacity = (inner.opacity ?? 1) * (1 - ex);
        const clip = mode === 'rise' || exit === 'up';
        return <span key={idx} style={{display: 'inline-block', overflow: clip ? 'hidden' : 'visible', verticalAlign: 'top', paddingBottom: clip ? '0.06em' : 0}}>
          <span style={{...inner, ...(charStyle ? charStyle(idx, ch, t - tc) : {})}}>{ch === ' ' ? '\u2002' : ch}</span>
        </span>;
      })}
    </div>)}
  </div>;
};

