// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React from "react";
import { interpolate } from "remotion";
import { EASE_IN_OUT, EASE_OUT } from "./anim";
import { LAYOUT, PAD, SCHEME, SCENE_TIMING, TEXT } from "./theme";

const S = SCHEME.paper;
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const CHANNELS = ["剧本", "镜头", "声音"];
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** A continuous visual argument: investment → tools → an authored work.
 *  Coin and output counts are symbolic, without invented prices or ratios.
 *  The same three output cards become editing tracks, then a finished film.
 */
export const S13Closing = ({frame, fps = 30, durationInFrames = 206}) => {
  const svgId = React.useId().replace(/:/g, '');
  const timing = SCENE_TIMING.closing;
  const cue = (seconds: number) => Math.ceil((seconds - timing.sourceTrimStartSeconds) / timing.voicePlaybackRate * fps + timing.voiceFrom - timing.sequenceFrom);
  const value = cue(2.335);
  const creation = cue(3.585);
  const together = cue(5.105);
  const p = (a: number, b: number) => interpolate(frame, [a, b], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const morph = interpolate(frame, [creation - 2, creation + 25], [0, 1], { ...CLAMP, easing: EASE_IN_OUT });
  const titleLift = interpolate(frame, [24, 46], [0, 1], { ...CLAMP, easing: EASE_IN_OUT });
  const engine = p(30, 45) * (1 - p(creation - 2, creation + 12));
  const run = Math.max(0, (frame - 42) / 32) % 1;
  const play = interpolate(frame, [together + 2, durationInFrames - 32], [0, 1], CLAMP);
  const finish = p(durationInFrames - 30, durationInFrames - 18);
  const headline = frame < value ? "国产模型" : frame < creation ? "极佳的性价比" : frame < together ? "创造好的内容" : "创造更好的作品";
  const headlineStart = frame < value ? 0 : frame < creation ? value : frame < together ? creation : together;

  return <div style={{ position: "absolute", inset: 0, backgroundColor: S.bg, color: S.fg, overflow: "hidden" }}>
    <div style={{ ...TEXT.title, position: "absolute", left: PAD, width: LAYOUT.width, top: mix(670, 220, titleLift), textAlign: "center", opacity: p(headlineStart, headlineStart + 6), translate: `0 ${16 * (1 - p(headlineStart, headlineStart + 6))}px`, color: frame < value ? S.fg : S.accent }}>
      {headline}
    </div>
    <svg width={1080} height={1440} viewBox="0 0 1080 1440" style={{ width: 1080, height: 1440, position: "absolute", inset: 0 }}>
      <defs>
        <clipPath id={`${svgId}-closing-film-window`}><rect x={184} y={510} width={712} height={250} rx={10} /></clipPath>
      </defs>

      {/* The first scene: a budget enters the model and opens creative capabilities. */}
      <g opacity={engine}>
        <g stroke={S.accent} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.45}>
          <path d="M 236 780 H 374 M 622 780 H 676" pathLength={1} strokeDasharray={`${p(38, value - 8)} 1`} opacity={frame > 38 ? 1 : 0} />
          {[
            "M 676 780 V 630 Q 676 610 696 610 H 728",
            "M 676 780 H 728",
            "M 676 780 V 930 Q 676 950 696 950 H 728",
          ].map((d, i) => <path key={d} d={d} pathLength={1} strokeDasharray={`${p(value - 12 + i * 5, value + 2 + i * 5)} 1`} opacity={frame > value - 12 + i * 5 ? 1 : 0} />)}
        </g>
        <g transform={`translate(${mix(180, 355, p(43, 60))} 780)`} opacity={1 - p(56, 64)}>
          <circle r={44} fill={S.bg} stroke={S.accent} strokeWidth={3} />
          <circle r={34} fill="none" stroke={S.accent} strokeWidth={1} opacity={0.3} />
          <text y={16} textAnchor="middle" fill={S.accent} style={TEXT.subheading}>¥</text>
        </g>
        <text x={180} y={884} textAnchor="middle" fill={S.fg} style={TEXT.body}>投入</text>
        <circle cx={242 + run * 128} cy={780} r={5} fill={S.accent} opacity={Math.sin(run * Math.PI)} />
        {[0, 1, 2, 3, 4].map((i) => <g key={i} stroke={S.accent} strokeWidth={3} opacity={0.65}>
          <path d={`M ${420 + i * 40} 656 V 670 M ${420 + i * 40} 890 V 904 M 374 ${700 + i * 40} H 388 M 608 ${700 + i * 40} H 622`} />
        </g>)}
        <rect x={388} y={670} width={220} height={220} rx={24} fill={S.bg} stroke={S.accent} strokeWidth={3} />
        <rect x={408} y={690} width={180} height={180} rx={14} fill={S.accent} opacity={0.04 + 0.04 * Math.sin(frame / 9) ** 2} />
        <text x={498} y={800} textAnchor="middle" fill={S.fg} style={TEXT.subheading}>模型</text>
        <path d="M 450 834 H 546" stroke={S.accent} strokeWidth={3} pathLength={1} strokeDasharray={`${p(42, value)} 1`} />
      </g>

      {/* The second scene: output cards reflow into one working edit. */}
      <g opacity={p(creation + 4, creation + 20)}>
        <rect x={160} y={442} width={760} height={686} rx={20} fill={S.bg} stroke={S.accent} strokeWidth={2.5} />
        <circle cx={188} cy={470} r={5} fill={S.accent} opacity={0.3} />
        <circle cx={208} cy={470} r={5} fill={S.accent} opacity={0.5} />
        <circle cx={228} cy={470} r={5} fill={S.accent} />
        <path d="M 160 492 H 920" stroke={S.line} />
        <g clipPath={`url(#${svgId}-closing-film-window)`}>
          <rect x={184} y={510} width={712} height={250} fill={S.accent} opacity={0.035} />
          <g opacity={p(creation + 22, together + 16)}>
            <circle cx={690 + Math.sin(frame / 24) * 14} cy={586 - 12 * play} r={34 + 4 * play} fill={S.accent} opacity={0.35} />
            <path d={`M 150 760 L ${330 - play * 16} 570 L 480 760 M 390 760 L ${620 - play * 30} 605 L 820 760 M 680 760 L 840 650 L 980 760`} fill={S.accent} opacity={0.12} />
            <path d={`M 150 760 L ${330 - play * 16} 570 L 480 760 M 390 760 L ${620 - play * 30} 605 L 820 760 M 680 760 L 840 650 L 980 760`} fill="none" stroke={S.accent} strokeWidth={2.5} />
            {[0, 1, 2].map((i) => <path key={i} d={`M 160 ${704 + i * 16} Q 400 ${682 + i * 16 + Math.sin(frame / 10 + i) * 8} 920 ${706 + i * 14}`} stroke={S.accent} strokeWidth={1.5} fill="none" opacity={0.2} />)}
          </g>
          <path d="M 206 534 H 232 M 206 534 V 560 M 874 534 H 848 M 874 534 V 560 M 206 736 H 232 M 206 736 V 710 M 874 736 H 848 M 874 736 V 710" stroke={S.accent} strokeWidth={2} fill="none" opacity={0.4} />
        </g>
      </g>

      {CHANNELS.map((label, i) => {
        const appear = p(value - 8 + i * 5, value + 2 + i * 5);
        const x = mix(728, 184, morph), y = mix(554 + i * 170, 806 + i * 88, morph);
        const width = mix(268, 712, morph), height = mix(112, 68, morph);
        const labelY = mix(34, 43, morph);
        const contentX = mix(24, 128, morph), contentY = mix(64, 16, morph);
        const contentWidth = width - contentX - 24;
        return <g key={label} transform={`translate(${x} ${y + 18 * (1 - appear)})`} opacity={appear}>
          <rect width={width} height={height} rx={10} fill={S.bg} stroke={S.accent} strokeWidth={2} strokeOpacity={0.55} />
          <rect width={width} height={height} rx={10} fill={S.accent} opacity={0.03} />
          <text x={24} y={labelY} fill={S.fg} style={TEXT.body}>{label}</text>
          <g transform={`translate(${contentX} ${contentY})`}>
            {i === 0 ? [0, 1, 2].map((line) => <rect key={line} x={0} y={line * 12} width={contentWidth * [0.88, 0.66, 0.76][line] * p(value + 2, value + 20)} height={4} rx={2} fill={S.accent} opacity={0.55} />) : null}
            {i === 1 ? [0, 1, 2, 3].map((shot) => {
              const w = (contentWidth - 18) / 4;
              return <g key={shot} transform={`translate(${shot * (w + 6)} 0)`} opacity={p(value + 7 + shot * 2, value + 15 + shot * 2)}>
                <rect width={w} height={36} rx={3} fill={S.accent} opacity={0.08 + shot * 0.04} />
                <path d={`M 4 32 L ${w * 0.4} 11 L ${w * 0.65} 30 L ${w * 0.8} 19 L ${w - 4} 32`} stroke={S.accent} strokeWidth={1.5} fill="none" />
              </g>;
            }) : null}
            {i === 2 ? Array.from({ length: 28 }, (_, bar) => {
              const h = 6 + 25 * Math.abs(Math.sin(bar * 0.74 + frame / 9)) * p(value + 10, value + 27);
              return <rect key={bar} x={bar * contentWidth / 28} y={(36 - h) / 2} width={Math.max(3, contentWidth / 28 - 5)} height={h} rx={1.5} fill={S.accent} opacity={0.7} />;
            }) : null}
          </g>
        </g>;
      })}

      {/* A moving playhead joins script, camera and sound; the result remains alive. */}
      <g opacity={p(together, together + 8)}>
        <path d={`M ${312 + 560 * play} 794 V 1060`} stroke={S.accent} strokeWidth={2.5} />
        <path d={`M ${305 + 560 * play} 785 H ${319 + 560 * play} L ${312 + 560 * play} 795 Z`} fill={S.accent} />
        <g transform={`translate(${mix(890, 862, finish)} ${mix(1148, 1090, finish)})`}>
          <circle r={28} fill={S.accent} opacity={finish} />
          <path d="M -11 0 L -3 8 L 12 -8" stroke={S.bg} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" pathLength={1} strokeDasharray={`${finish} 1`} />
        </g>
      </g>
      <text x={540} y={1206} textAnchor="middle" fill={S.sub} style={TEXT.body} opacity={engine}>投入，转化为创作能力</text>
      <text x={540} y={1206} textAnchor="middle" fill={S.fg} style={TEXT.body} opacity={p(together + 4, together + 14)}>把想法，做成作品</text>
    </svg>
  </div>;
};
