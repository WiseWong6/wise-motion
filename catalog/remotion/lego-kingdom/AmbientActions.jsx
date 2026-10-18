// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
// Motion extracted from the active lego-claude source, 30 fps, 1080 × 1440.
// Project recordings, audio and 3D geometry are not part of this overlay.
import React from 'react';
import {C, F, tw, clamp01, backOut, inOut, interpolate, Svg} from './theme.js';

const FULL = {position: 'absolute', inset: 0};
const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
const SOURCE = {
  verdict: 'video/src/scenes/Finale.tsx',
  bits: 'video/src/components/Bits.tsx',
  timeline: 'video/src/timeline.json',
};

export const AMBIENT_SPECS = {
  'verdict-checklist': {
    id: 'lego-verdict-checklist', name: '百分比与逐项勾选', category: 'data',
    frames: 167, previewFrame: 151, kind: 'action',
    summary: '进度先到满值，随后逐项勾选，并揭示对应说明。',
    details: '保留原设计时钟与当前167帧输出的分段映射，卡片入场、百分比、勾线和逐行裁切同步。保留原片清单文字；不额外添加下方格子。',
    sourceFiles: [SOURCE.verdict, SOURCE.bits, SOURCE.timeline], aliases: ['验收清单', '逐项完成', '百分比核对', '逐行打勾'],
    actions: [],
  },

};

// The latest fixed, square-ended caption bar keeps mask-stagger-text's motion:
// outCubic(section(p, .08 + i*.075, .4 + i*.075)), 90px at fontSize 44.
// It is already a catalog action; only its layout and global clock changed.
// Therefore this module deliberately registers no duplicate caption effect.

function Baseplate({frame, dark = false, drift = frame * .12}) {
  const dot = dark ? 'rgba(255,255,255,.05)' : 'rgba(120,95,60,.09)';
  const hi = dark ? 'rgba(255,255,255,.025)' : 'rgba(255,255,255,.55)';
  return <div style={{...FULL, background: dark ? '#0E0E10' : C.paper,
    backgroundImage: `radial-gradient(circle at 50% 54%, ${dot} 0 9px, transparent 10px), radial-gradient(circle at 46% 44%, ${hi} 0 6px, transparent 7px)`,
    backgroundSize: '40px 40px', backgroundPosition: `${drift}px ${drift * .5}px`}} />;
}

function Check({progress, size = 46}) {
  return <Svg width={size} height={size} viewBox="0 0 44 44" style={{flex: 'none',
    transform: `scale(${backOut(clamp01(progress * 1.4), 2.4)})`}}>
    <circle cx={22} cy={22} r={21} fill={C.green} />
    <path d="M12 23 L19 30 L32 15" stroke="#fff" strokeWidth={4.5} fill="none"
      strokeLinecap="round" strokeLinejoin="round" strokeDasharray={34}
      strokeDashoffset={34 * (1 - clamp01(progress * 1.6 - .4))} />
  </Svg>;
}

function designFrame(frame) {
  // Latest VerdictDay output anchors, not a uniform retime of the old scene.
  return interpolate(frame, [0, 6, 55, 103, 149, 166], [0, 6, 74, 104, 132, 179], CLAMP);
}

function VerdictChecklist({frame}) {
  const f = designFrame(frame);
  const card = tw(f, 4, 20), meter = tw(f, 10, 64, 0, 1, inOut);
  const rows = [
    {at: 76, label: '美术要求', value: '微缩摄影质感 · 树脂海水 · 日夜 · 涟漪'},
    {at: 104, label: '城堡数量', value: '100 / 100 座'},
    {at: 132, label: '结构地块', value: '9 个分区 · 232 座塔 · 790 个零件'},
  ];
  return <>
    <Baseplate frame={frame} />
    <div style={{position: 'absolute', left: 50, right: 50, top: 48, padding: '26px 36px',
      borderRadius: 26, background: 'rgba(250,246,238,.9)', boxShadow: '0 24px 60px rgba(40,25,10,.22)',
      opacity: card, transform: `translateY(${(1 - card) * -40}px)`}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{fontFamily: F.cn, fontWeight: 900, fontSize: 56, lineHeight: 1.12}}>整体还原度</div>
        <div style={{fontFamily: F.num, fontWeight: 700, fontSize: 88, lineHeight: 1,
          fontVariantNumeric: 'tabular-nums'}}>{Math.round(meter * 100)}%</div>
      </div>
      <div style={{height: 10, borderRadius: 5, background: '#E2D8C6', marginTop: 12, overflow: 'hidden'}}>
        <div style={{width: `${meter * 100}%`, height: '100%', background: `linear-gradient(90deg, ${C.yellow}, ${C.orange})`}} />
      </div>
      <div style={{marginTop: 20, display: 'flex', flexDirection: 'column', gap: 18}}>
        {rows.map(row => {
          const p = tw(f, row.at, row.at + 14);
          return <div key={row.label} style={{display: 'flex', alignItems: 'center', gap: 18, opacity: .25 + .75 * p}}>
            <Check progress={p} />
            <div style={{fontFamily: F.cn, fontWeight: 900, fontSize: 36, width: 168, flexShrink: 0, whiteSpace: 'nowrap'}}>{row.label}</div>
            <div style={{fontFamily: F.cn, fontWeight: 700, fontSize: 26, color: C.ink2,
              clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`}}>{row.value}</div>
          </div>;
        })}
      </div>
    </div>
  </>;
}

/** Explicit-frame, seek-safe action. No playback hooks, clocks, media, or timers. */
export function AmbientAction({mode = 'verdict-checklist', frame = 0, children}) {
  const spec = AMBIENT_SPECS[mode];
  if (!spec) throw new Error(`Unknown ambient action: ${mode}`);
  if (!Number.isFinite(frame)) throw new Error('AmbientAction requires a finite frame');
  const f = Math.max(0, Math.min(spec.frames - 1, frame));
  const content = <VerdictChecklist frame={f} />;
  return <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1440,
    overflow: 'hidden', color: C.ink, background: C.paper}} data-lego-ambient={mode}>
    {content}{children}
  </div>;
}
