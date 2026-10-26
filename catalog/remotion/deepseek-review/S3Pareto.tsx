// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React from "react";
import { interpolate } from "remotion";
import { EASE_IN_OUT, EASE_OUT } from "./anim";
import { LAYOUT, SCHEME, SPACE, TEXT, TYPE } from "./theme";

const S = SCHEME.paper;
const W = LAYOUT.width;
const H = 652;
const BASELINE = 576;
const X = (u: number) => 44 + u * 840;
const Y = (v: number) => BASELINE - v * 520;
const fOld = (x: number) => 0.95 * (1 - Math.exp(-2.6 * (x - 0.05)));
const fNew = (x: number) => 1 - Math.exp(-4.5 * (x - 0.03));
const OLD_PT = { x: 0.62, y: fOld(0.62) };
const NEW_PT = { x: 0.39, y: fNew(0.39) };
const curve = (fn: (x: number) => number, x0: number, x1: number) => Array.from({ length: 65 }, (_, i) => {
  const x = x0 + (x1 - x0) * i / 64;
  return `${i ? "L" : "M"}${X(x).toFixed(2)},${Y(Math.max(0, fn(x))).toFixed(2)}`;
}).join(" ");
const OLD_PATH = curve(fOld, 0.06, 0.98);
const NEW_PATH = curve(fNew, 0.04, 0.98);
const GAIN_AREA = `${NEW_PATH} ${curve(fOld, 0.98, 0.06).replace("M", "L")} Z`;
// Preserve the original chart clock while omitting its surrounding scene.
const ORIGINAL_GRAPH_FRAMES = 241;
const GRAPH_SWEEP_END_FRAME = 197;

export const S3Pareto = ({frame}) => {
  const svgId = React.useId().replace(/:/g, '');
  const frameProgress = (from: number, to: number, easing = EASE_OUT) => interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
  const t = Math.max(0, Math.min(1, frame / (ORIGINAL_GRAPH_FRAMES - 1)));
  const p = (from: number, to: number, easing = EASE_OUT) => interpolate(t, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
  const axes = p(0.24, 0.37);
  const oldLine = p(0.27, 0.48);
  const newLine = p(0.34, 0.78, (x) => x);
  const move = p(0.39, 0.78, EASE_IN_OUT);
  const currentX = OLD_PT.x + (NEW_PT.x - OLD_PT.x) * move;
  const currentY = OLD_PT.y + (NEW_PT.y - OLD_PT.y) * move;
  const highlightX = X(0.04 + 0.94 * frameProgress((ORIGINAL_GRAPH_FRAMES - 1) * 0.42, GRAPH_SWEEP_END_FRAME, (x) => x));

  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: W, height: H, translate: `0 ${(1 - p(0.24, 0.43)) * SPACE.md}px`, opacity: p(0.24, 0.39) }}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width: W, height: H, overflow: "visible" }}>
            <defs>
              <clipPath id={`${svgId}-pareto-old-reveal`}><rect x={0} y={0} width={X(0.06 + 0.92 * oldLine)} height={H} /></clipPath>
              <clipPath id={`${svgId}-pareto-gain-reveal`}><rect x={0} y={0} width={highlightX} height={H} /></clipPath>
              <pattern id={`${svgId}-pareto-gain-hatch`} width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1={0} y1={0} x2={0} y2={14} stroke={S.accent} strokeWidth={2} /></pattern>
            </defs>
            <line x1={44} y1={BASELINE} x2={44 + 840 * axes} y2={BASELINE} stroke={S.fg} strokeWidth={2} />
            <line x1={44} y1={BASELINE} x2={44} y2={BASELINE - 547 * axes} stroke={S.fg} strokeWidth={2} />
            <text x={64} y={TYPE.label} fill={S.sub} style={TEXT.label} opacity={axes}>↑ 任务表现</text>
            <text x={884} y={BASELINE + 50} textAnchor="end" fill={S.sub} style={TEXT.label} opacity={axes}>每项任务的费用 / 时间 →</text>
            <path d={GAIN_AREA} fill={`url(#${svgId}-pareto-gain-hatch)`} opacity={p(0.49, 0.77) * 0.4} clipPath={`url(#${svgId}-pareto-gain-reveal)`} />
            <path d={OLD_PATH} fill="none" stroke={S.sub} strokeWidth={4} strokeDasharray="8 8" clipPath={`url(#${svgId}-pareto-old-reveal)`} />
            <path d={NEW_PATH} fill="none" stroke={S.accent} strokeWidth={8} pathLength={1} strokeDasharray={`${newLine} 1`} />
            <line x1={X(OLD_PT.x)} x2={X(OLD_PT.x)} y1={Y(OLD_PT.y)} y2={BASELINE} stroke={S.sub} strokeWidth={1.5} strokeDasharray="5 7" opacity={p(0.37, 0.47)} />
            <line x1={X(currentX)} x2={X(currentX)} y1={Y(currentY)} y2={BASELINE} stroke={S.accent} strokeWidth={3} strokeDasharray="5 7" opacity={p(0.4, 0.53)} />
            <path d={`M ${X(OLD_PT.x)} ${Y(OLD_PT.y)} L ${X(currentX)} ${Y(currentY)}`} fill="none" stroke={S.fg} strokeWidth={2} opacity={move} />
            <circle cx={X(OLD_PT.x)} cy={Y(OLD_PT.y)} r={12 * p(0.31, 0.41)} fill={S.bg} stroke={S.fg} strokeWidth={3} />
            <text x={X(OLD_PT.x) + SPACE.sm} y={Y(OLD_PT.y) + SPACE.md} fill={S.sub} style={TEXT.label} opacity={p(0.34, 0.46)}>上一版</text>
            <circle cx={X(currentX)} cy={Y(currentY)} r={18 * p(0.4, 0.52)} fill={S.accent} />
            <text x={X(currentX) - SPACE.sm} y={Y(currentY) - SPACE.md} textAnchor="end" fill={S.accent} style={TEXT.labelStrong} opacity={p(0.5, 0.62)}>新版</text>
            <g opacity={p(0.61, 0.77)}>
              <path d={`M ${X(currentX)} ${BASELINE - 26} H ${X(OLD_PT.x)}`} fill="none" stroke={S.accent} strokeWidth={3} />
              <path d={`M ${X(currentX) + 12} ${BASELINE - 35} L ${X(currentX)} ${BASELINE - 26} L ${X(currentX) + 12} ${BASELINE - 17}`} fill="none" stroke={S.accent} strokeWidth={3} />
              <text x={(X(currentX) + X(OLD_PT.x)) / 2} y={BASELINE - 43} textAnchor="middle" fill={S.accent} style={TEXT.label}>同样任务，更少开销</text>
            </g>
          </svg>
    </div>
  );
};
