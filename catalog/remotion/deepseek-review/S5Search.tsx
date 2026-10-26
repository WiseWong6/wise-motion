// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React from "react";
import { interpolate } from "remotion";
import { EASE_IN_OUT, EASE_OUT } from "./anim";
import { SceneShell } from "./SceneShell";
import { LAYOUT, SCHEME, SPACE, TEXT } from "./theme";

const S = SCHEME.paper;
const QUERY = "deepseek v4.1 flash 1017";
const RESULTS = [
  { title: "官方发布说明", detail: "api-docs.deepseek.com", blocked: false },
  { title: "要求模型只引用本站", detail: "操纵内容示意", blocked: true },
  { title: "公开模型卡", detail: "huggingface.co/deepseek-ai", blocked: false },
];
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Restore the previous sweep → rejection → side-by-side delivery choreography.
export const S5Search = ({frame, fps = 30, durationInFrames = 244}) => {
  const span = durationInFrames - 1;
  const t = frame / span;
  const p = (a: number, b: number, easing = EASE_OUT) => interpolate(t, [a, b], [0, 1], { ...CLAMP, easing });
  const typed = Math.floor(p(0.24, 0.39, (x) => x) * QUERY.length);
  const reject = p(0.65, 0.77, EASE_IN_OUT);
  const compact = p(0.74, 0.87, EASE_IN_OUT);
  const scan = p(0.5, 0.65, (x) => x);

  return <SceneShell scheme={S}>
    <div style={{ ...TEXT.title, position: "absolute", left: 0, right: 0, textAlign: "center", top: interpolate(frame, [18, span * 0.29], [LAYOUT.centerY - 44, LAYOUT.titleTop], { ...CLAMP, easing: EASE_IN_OUT }), opacity: p(0, 0.04) }}>
      过滤 <span style={{ color: S.accent }}>GEO</span> 操纵
    </div>
    <div style={{ ...TEXT.body, position: "absolute", left: 0, right: 0, top: 240, textAlign: "center", opacity: p(0.3, 0.4) }}>识别搜索作弊与低质量生成内容</div>
    <div style={{ position: "absolute", left: 0, right: 0, top: interpolate(t, [0.24, 0.42], [760, 360], { ...CLAMP, easing: EASE_IN_OUT }), height: 88, display: "flex", gap: SPACE.sm, alignItems: "center", borderBottom: `3px solid ${S.accent}`, opacity: p(0.24, 0.29) }}>
      <svg style={{width: 32, height: 32}} width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={S.accent} strokeWidth={2}><circle cx={10} cy={10} r={7} /><path d="M 15 15 L 22 22" /></svg>
      <div style={{ ...TEXT.body, flex: 1 }}>{QUERY.slice(0, typed)}<span style={{ color: S.accent, opacity: 1 - p(0.395, 0.43) }}>│</span></div>
      <div style={{ ...TEXT.bodyStrong, padding: "10px 24px", color: S.accent, border: `1px solid ${S.accent}`, scale: 1 - 0.08 * Math.sin(p(0.4, 0.43) * Math.PI) }}>搜索 ↵</div>
    </div>
    <div style={{ ...TEXT.label, position: "absolute", top: 480, color: S.sub, opacity: p(0.42, 0.48) }}>筛选过程示意</div>
    <div style={{ position: "absolute", left: 0, top: 544, width: LAYOUT.width, height: 660 }}>
      {RESULTS.map((result, i) => {
        const enter = p(0.43 + i * 0.02, 0.52 + i * 0.02);
        return <div key={result.title} style={{ position: "absolute", top: i * 168 - (i === 2 ? reject * 168 : 0), left: 0, width: LAYOUT.width - compact * 512, height: 144, boxSizing: "border-box", padding: "24px 24px", background: S.bg, border: `1px solid ${S.line}`, borderLeft: `4px solid ${S.accent}`, translate: `${-1020 * (1 - enter) + (result.blocked ? reject * 1080 : 0)}px 0`, opacity: enter * (result.blocked ? 1 - reject : 1) }}>
          <div style={{ ...TEXT.bodyStrong, whiteSpace: "nowrap" }}>{result.title}</div>
          <div style={{ ...TEXT.label, color: S.sub, marginTop: 8, whiteSpace: "nowrap" }}>{result.detail}</div>
          {result.blocked ? <>
            <div style={{ position: "absolute", left: 24, top: 47, height: 3, width: `${p(0.6, 0.65) * 42}%`, background: S.accent }} />
            <div style={{ ...TEXT.bodyStrong, position: "absolute", right: 24, top: 24, color: S.accent, background: S.bg, padding: "8px 16px", opacity: p(0.61, 0.66) }}>识别操纵 → 过滤</div>
          </> : null}
        </div>;
      })}
      <div style={{ position: "absolute", left: scan * LAYOUT.width, top: 0, height: 480, width: 3, background: S.accent, opacity: p(0.49, 0.52) * (1 - p(0.65, 0.68)) }} />
      <svg width={912} height={600} viewBox="0 0 912 600" style={{ width: 912, height: 600, position: "absolute", inset: 0, pointerEvents: "none" }}>
        {[0, 1].map((i) => {
          const travel = p(0.82 + i * 0.025, 0.97 + i * 0.02, (x) => x);
          const y0 = 72 + i * 168, y1 = 328 + i * 112;
          const x = 400 * (1 - travel) ** 2 + 2 * 450 * (1 - travel) * travel + 480 * travel ** 2;
          const y = y0 * (1 - travel) ** 2 + 2 * y0 * (1 - travel) * travel + y1 * travel ** 2;
          return <g key={i}>
            <path d={`M 400 ${y0} Q 450 ${y0} 480 ${y1}`} stroke={S.accent} strokeWidth={2.5} fill="none" opacity={p(0.8, 0.88) * 0.5} pathLength={1} strokeDasharray={`${p(0.8, 0.94)} 1`} />
            <g transform={`translate(${x - 10} ${y - 13})`} opacity={Math.sin(travel * Math.PI)}><rect width={20} height={26} rx={2} fill={S.accent} /><path d="M4 8 H16 M4 13 H16 M4 18 H12" stroke="white" strokeWidth={2} /></g>
          </g>;
        })}
      </svg>
      <div style={{ position: "absolute", left: 480, top: 264, width: 432, height: 304, boxSizing: "border-box", padding: "24px 32px", border: `2px solid ${S.accent}`, background: S.bg, opacity: p(0.79, 0.88), translate: `${32 * (1 - p(0.79, 0.88))}px 0` }}>
        <div style={{ ...TEXT.subheading, color: S.accent }}>递送给模型</div>
        {["官方发布说明", "公开模型卡"].map((title, i) => <div key={title} style={{ ...TEXT.bodyStrong, marginTop: SPACE.sm, opacity: p(0.86 + i * 0.025, 0.92 + i * 0.025) }}>{title}<div style={{ height: 2, marginTop: 10, background: S.accent, width: `${p(0.88 + i * 0.025, 0.96 + i * 0.025) * 100}%` }} /></div>)}
      </div>
    </div>
    <div style={{ ...TEXT.subheading, position: "absolute", left: 0, right: 0, top: 1224, textAlign: "center", opacity: p(0.87, 0.96) }}>减少干扰，<span style={{ color: S.accent }}>再交给模型</span></div>
  </SceneShell>;
};
