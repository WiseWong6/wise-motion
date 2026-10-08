// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import React, {useId} from 'react';

// 小尺寸匹配卡的示意图：用明亮纸面与完整轮廓保留动作辨识度。
export const MatchPreview = ({kind, t, width, height}) => {
  const id = `match-${useId().replace(/:/g, '')}`;
  const fold = 146 + Math.sin(t * 2.6) * 18;
  return <svg width={width} height={height} viewBox="0 0 280 158" role="img"
    aria-label={{turn: '浅色书页绕书脊翻起', art: '橙色圆形与网点几何插画', paper: '纸面折角与柔和投影'}[kind]}
    data-match-preview={kind} style={{display: 'block', width, height}}>
    <defs>
      <linearGradient id={`${id}-paper`} x1="0" x2="1">
        <stop stopColor="#d2c9b5" /><stop offset=".2" stopColor="#fff8e8" /><stop offset="1" stopColor="#e9dfca" />
      </linearGradient>
      <linearGradient id={`${id}-crease`}><stop stopColor="#594d38" stopOpacity=".48" /><stop offset="1" stopColor="#594d38" stopOpacity="0" /></linearGradient>
      <pattern id={`${id}-dots`} width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#30352f" /></pattern>
    </defs>
    <rect width="280" height="158" fill="#262d30" />
    {kind === 'turn' && <>
      <ellipse cx="140" cy="137" rx="107" ry="10" fill="#080d0e" opacity=".45" />
      <path d="M31 29 Q86 19 140 32 Q194 19 249 29 V130 Q194 120 140 134 Q86 120 31 130Z" fill="#819487" />
      <path d="M34 25 Q86 15 140 29 V129 Q86 116 34 126Z" fill="#f4ecda" />
      <path d="M140 29 Q194 15 246 25 V126 Q194 116 140 129Z" fill={`url(#${id}-paper)`} />
      <circle cx="81" cy="72" r="23" fill="#e77242" />
      <path d="M53 109L108 55L122 109Z" fill="#35483f" />
      <path d="M160 45H223M160 53H209M160 61H217" stroke="#aaa18b" strokeWidth="3" />
      <path d="M163 105L195 72L227 105Z" fill="#3cad87" />
      <path d={`M140 29 Q${fold + 29} 0 ${fold + 45} 16 L${fold + 45} 112 Q${fold + 20} 108 140 129Z`}
        fill={`url(#${id}-paper)`} stroke="#b9af98" strokeWidth="1" />
      <path d="M140 29V129" stroke="#8a806d" strokeWidth="2" />
      <path d="M100 17Q136 1 170 13" fill="none" stroke="#88d8b8" strokeWidth="2.5" />
      <path d="M163 7L171 13L162 17" fill="none" stroke="#88d8b8" strokeWidth="2.5" />
    </>}
    {kind === 'art' && <>
      <rect x="23" y="12" width="238" height="137" rx="2" fill="#101715" opacity=".45" />
      <rect x="19" y="8" width="238" height="137" rx="2" fill="#f0e9d7" />
      <circle cx="113" cy="76" r="57" fill="#ed7140" />
      <path d="M126 131L223 26L240 131Z" fill="#293d34" />
      <rect x="34" y="23" width="65" height="106" fill={`url(#${id}-dots)`} />
      {[0, 1, 2, 3, 4].map(i => <path key={i} d={`M${145 + i * 13} 24V130`} stroke="#f0e9d7" strokeWidth="1.5" opacity=".7" />)}
    </>}
    {kind === 'paper' && <>
      <path d="M47 34L237 22L250 136L58 145Z" fill="#0c1314" opacity=".6" />
      <path d="M34 20L218 12L236 125L49 138Z" fill={`url(#${id}-paper)`} />
      <path d="M137 16L153 130L172 129L154 15Z" fill={`url(#${id}-crease)`} />
      <path d="M218 12Q201 36 219 51L236 125Z" fill="#b1a389" />
      <path d="M218 12Q211 40 236 45L236 125Z" fill="#fffbed" />
      <path d="M59 49L115 46M61 61L108 58M64 73L119 70" stroke="#b0a58e" strokeWidth="3" />
      <path d="M74 113L94 86L114 111Z" fill="#3cad87" opacity=".9" />
      <path d="M36 20L137 16" stroke="#fffdf3" strokeWidth="2" />
    </>}
  </svg>;
};
