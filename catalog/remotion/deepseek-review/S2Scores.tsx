// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React from "react";
import { interpolate } from "remotion";
import { EASE_IN_OUT, EASE_OUT } from "./anim";
import { SceneShell } from "./SceneShell";
import { GAINS } from "./data";
import { LAYOUT, SCHEME, SPACE, TEXT, TYPE } from "./theme";

const S = SCHEME.paper;
const SHORT_NAMES = ["Terminal", "Program", "Apex", "HLE", "Automation", "Chartography", "Agents", "BabyVision", "DeepSWE", "NL2Repo", "ZeroBench"];
const MAX_DELTA = Math.max(...GAINS.map((g) => g.next - g.prev));
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const S2Scores = ({frame, fps = 30, durationInFrames = 137}) => {
  const p = (from: number, to: number, easing = EASE_OUT) => interpolate(frame, [from, to], [0, 1], { ...CLAMP, easing });
  const openingLift = p(16, 42, EASE_IN_OUT);
  const total = Math.round(11 * p(44, 90));
  const chartTop = LAYOUT.contentTop + TYPE.number + SPACE.md + TYPE.subheading * TEXT.subheading.lineHeight + SPACE.xl;

  return (
    <SceneShell scheme={S}>
      <div style={{ position: "absolute", inset: 0 }}>
        <div style={{ ...TEXT.title, position: "absolute", top: (LAYOUT.centerY - TYPE.title * TEXT.title.lineHeight / 2) * (1 - openingLift) + LAYOUT.titleTop * openingLift, width: "100%", textAlign: "center", opacity: p(0, 10) }}>官方公布的基准测试</div>
        <div style={{ ...TEXT.number, position: "absolute", top: LAYOUT.contentTop, width: "100%", display: "flex", justifyContent: "center", opacity: p(44, 52), translate: `0 ${(1 - p(44, 66)) * SPACE.md}px` }}>
          <span>{String(total).padStart(2, "0")}</span><span style={{ color: S.accent }}>/11</span>
        </div>
        <div style={{ ...TEXT.subheading, position: "absolute", top: LAYOUT.contentTop + TYPE.number + SPACE.md, width: "100%", textAlign: "center", opacity: p(60, 78), translate: `0 ${(1 - p(60, 84)) * SPACE.sm}px` }}>全部较上一版<span style={{ color: S.accent }}>提升</span></div>

        <svg width={LAYOUT.width} height={576} viewBox={`0 0 ${LAYOUT.width} 576`} style={{ width: LAYOUT.width, height: 576, position: "absolute", top: chartTop, overflow: "visible", opacity: p(66, 86), translate: `0 ${(1 - p(66, 96)) * SPACE.md}px` }}>
          <text x={0} y={TYPE.label} fill={S.sub} style={TEXT.label}>较上一版增加的分数</text>
          <line x1={0} y1={320} x2={LAYOUT.width * p(66, 86)} y2={320} stroke={S.line} strokeWidth={2} />
          {GAINS.map((g, i) => {
            const gain = g.next - g.prev;
            // All eleven bars settle by frame 119, before the shortened scene's handoff.
            const growth = p(66 + i * 2, 99 + i * 2, (x) => x);
            const h = gain / MAX_DELTA * 256 * growth;
            const x = i * (LAYOUT.width / GAINS.length) + 5;
            return <g key={g.name} opacity={0.35 + 0.65 * growth}>
              <rect x={x} y={320 - h} width={58} height={h} fill={i === 0 ? S.accent : S.fg} />
              <text x={x + 29} y={304 - h} fill={i === 0 ? S.accent : S.fg} textAnchor="middle" style={TEXT.labelStrong}>+{(gain * growth).toFixed(1)}</text>
              <text x={x + 29} y={352} fill={S.sub} style={TEXT.label} textAnchor="end" transform={`rotate(-60 ${x + 29} 352)`}>{SHORT_NAMES[i]}</text>
            </g>;
          })}
        </svg>
      </div>

    </SceneShell>
  );
};
