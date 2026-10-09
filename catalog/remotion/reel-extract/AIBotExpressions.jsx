import React from 'react';
import {C} from './colors.js';
import {QuestionMark} from './QuestionMark.jsx';
import {BOT_FACE_ANCHORS, botEyePose, botSymbolPose, botSweatPose,
  thoughtCloudPose, liveBotConfetti} from './aiBotExpressions.mjs';

const Eye = ({face, pose, side}) => {
  const kind = pose[side], morph = pose[`${side}Morph`];
  const length = (face.height - face.width) / 2;
  const span = face.width * (kind === 'smile' ? 1.05 : 0.75) * morph;
  const endY = kind === 'smile' ? 3 * morph : 0;
  const controlY = kind === 'smile' ? -face.height * 0.28 * morph : 0;
  const d = `M ${-span} ${-length * (1 - morph) + endY} Q 0 ${controlY} ${span} ${length * (1 - morph) + endY}`;
  return <g transform={`translate(${side === 'left' ? -face.gap / 2 : face.gap / 2} 0) scale(1 ${pose.openness})`}>
    <path d={d} fill="none" stroke="#151517" strokeWidth={face.width} strokeLinecap="round" />
  </g>;
};

const QuestionBubble = ({t}) => {
  const p = thoughtCloudPose(t);
  return <g data-bot-thought-cloud="" opacity={p.opacity}
    transform={`translate(644 ${161 + p.y}) scale(${p.scale})`}>
    <path d="M -121 83 C -174 91 -181 24 -154 -2 C -180 -38 -136 -80 -101 -71 C -88 -144 24 -157 69 -95 C 126 -107 164 -66 143 -25 C 190 -2 177 53 143 63 C 161 110 91 136 63 101 C 27 146 -41 135 -53 103 C -76 122 -112 112 -121 83 Z"
      fill="#FFF9EE" stroke={C.accentDeep} strokeWidth={7} strokeLinejoin="round" />
    <circle cx={-86} cy={141} r={15} fill="#FFF9EE" stroke={C.accentDeep} strokeWidth={5} />
    <circle cx={-104} cy={170} r={8} fill="#FFF9EE" stroke={C.accentDeep} strokeWidth={4} />
    <g transform={`translate(-3 -1) rotate(${p.questionAngle}) scale(${1.7 * p.questionScale})`}>
      <QuestionMark color={C.accentDeep} outline={false} />
    </g>
  </g>;
};

const QUESTIONS = [
  {id: 'claude', x: 182, y: 205, at: 13.16, color: '#EB8E6B'},
  {id: 'grok', x: 1453, y: 251, at: 13.41, color: C.accent},
  {id: 'gpt', x: 924, y: 632, at: 13.7, color: '#51B698'},
  {id: 'glm', x: 1424, y: 675, at: 14.02, color: '#9479E2', exclamation: true},
];
const SWEAT = [{id: 'claude', x: 263, y: 299, at: 13.3},
  {id: 'workbuddy', x: 1041, y: 263, at: 13.56}];

const ConfusedSymbols = ({t}) => <>
  <QuestionBubble t={t} />
  {QUESTIONS.map(q => {
    const p = botSymbolPose(t, q.at, 1.26);
    return <g key={q.id} data-bot-question={q.id} opacity={p.opacity}
      transform={`translate(${q.x} ${q.y + p.y}) rotate(${p.angle}) scale(${p.scale * 0.7})`}>
      <QuestionMark color={q.color} />
      {q.exclamation && <g transform="translate(50 0) rotate(15)">
        <path d="M 0 -39 V 9" stroke="#FFF9EE" strokeWidth={21} strokeLinecap="round" />
        <circle cx={0} cy={38} r={11} fill="#FFF9EE" />
        <path d="M 0 -39 V 9" stroke={q.color} strokeWidth={14} strokeLinecap="round" />
        <circle cx={0} cy={38} r={7.5} fill={q.color} />
      </g>}
    </g>;
  })}
  {SWEAT.map(s => {
    const p = botSweatPose(t, s.at);
    return <g key={s.id} data-bot-sweat={s.id} opacity={p.opacity}
      transform={`translate(${s.x + p.x} ${s.y + p.y}) scale(${p.scale})`}>
      <path d="M 0 -28 C -6 -13 -16 2 -16 12 A 16 16 0 0 0 16 12 C 16 2 6 -13 0 -28 Z"
        fill="#88CBFF" stroke="#437CDC" strokeWidth={4} strokeLinejoin="round" />
      <path d="M 8 9 Q 13 17 5 21" fill="none" stroke="#E7F4FF" strokeWidth={5} strokeLinecap="round" />
    </g>;
  })}
  <g data-bot-thinking-swirl="deepseek" opacity={botSymbolPose(t, 13.48, 1.78).opacity}
    transform="translate(132 474)">
    <path d="M -28 4 C -25 -16 30 -16 28 4 C 27 22 -29 22 -25 4 C -20 -8 20 -8 19 4 C 17 13 -14 13 -12 4 C -11 0 7 0 6 4"
      fill="none" stroke="#EDF4FF" strokeWidth={10} strokeLinecap="round" />
    <path d="M -28 4 C -25 -16 30 -16 28 4 C 27 22 -29 22 -25 4 C -20 -8 20 -8 19 4 C 17 13 -14 13 -12 4 C -11 0 7 0 6 4"
      fill="none" stroke="#7298EA" strokeWidth={5.5} strokeLinecap="round" />
  </g>
</>;

const HappySymbols = ({t}) => {
  return <>
    {liveBotConfetti(t).map(p => <g key={p.id} data-bot-confetti={p.id} opacity={p.opacity}
      transform={`translate(${p.x} ${p.y}) rotate(${p.angle}) scale(1 ${p.kind === 'star' ? 1 : p.flutter})`}>
      {p.kind === 'star' ? <path
        d={`M 0 ${-p.width * 0.6} L ${p.width * 0.18} ${-p.width * 0.18} L ${p.width * 0.6} 0 L ${p.width * 0.18} ${p.width * 0.18} L 0 ${p.width * 0.6} L ${-p.width * 0.18} ${p.width * 0.18} L ${-p.width * 0.6} 0 L ${-p.width * 0.18} ${-p.width * 0.18} Z`}
        fill={p.color} />
        : p.kind === 'streamer' ? <path
          d={`M ${-p.width * 0.8} ${-p.height * 0.7} C ${p.width * 0.4} ${-p.height * 1.2} ${-p.width * 0.4} ${p.height * 0.3} ${p.width * 0.2} ${p.height * 0.4} Q ${p.width * 0.55} ${p.height * 0.6} ${p.width * 0.8} ${p.height * 0.15}`}
          fill="none" stroke={p.color} strokeWidth={p.width * 0.2} strokeLinecap="round" />
        : <rect x={-p.width / 2} y={-p.height / 2} width={p.width} height={p.height} rx={2} fill={p.color} />}
    </g>)}
  </>;
};

export const AIBotCelebration = ({t}) => <svg data-bot-celebration="" viewBox="0 0 1536 1024"
  width="100%" height="100%" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 3, overflow: 'visible', pointerEvents: 'none'}}>
  <HappySymbols t={t} />
</svg>;

export const AIBotExpressions = ({t, mood, showFaces = true, showSymbols = true}) => <svg data-bot-expressions={mood} viewBox="0 0 1536 1024"
  width="100%" height="100%" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2, overflow: 'visible', pointerEvents: 'none'}}>
  {showFaces && BOT_FACE_ANCHORS[mood].map((face, index) => {
    const pose = botEyePose(t, mood, index);
    return <g key={face.id} data-bot-face={face.id}
      transform={`translate(${face.x} ${face.y}) rotate(${face.angle}) translate(${pose.x} ${pose.y})`}>
      <Eye face={face} pose={pose} side="left" /><Eye face={face} pose={pose} side="right" />
    </g>;
  })}
  {showSymbols && mood === 'confused' && <ConfusedSymbols t={t} />}
</svg>;
