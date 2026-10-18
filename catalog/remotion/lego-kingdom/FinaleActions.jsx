import React from 'react';
import { C, F, Svg, tw, clamp01, backOut, inOut } from './theme.js';

/**
 * Frame-driven extracts from LEGO Kingdom's current authored components.
 * Apache-2.0. Source: components/EfficiencyModelReveal.tsx,
 * scenes/StandaloneEfficiency.tsx and scenes/Finale.tsx. All geometry uses
 * the original 1080×1440 design board and 30 fps. No recordings, portrait
 * or audio.
 */

const LINEAR = (p) => p;
const FULL = { position: 'absolute', inset: 0 };
const SOURCE = {
  efficiency: ['video/src/components/EfficiencyModelReveal.tsx', 'video/src/scenes/StandaloneEfficiency.tsx'],
  finale: ['video/src/scenes/Finale.tsx', 'video/src/components/Bits.tsx'],
  baseplate: ['video/src/components/Baseplate.tsx'],
  timing: ['video/src/timeline.json', 'video/src/timeline.ts', 'video/src/data/visual-timing.json'],
};

// Identical clamped, piecewise-linear time mapping to timeline.ts.
export function mapFinaleFrame(frame, input, output, easing = LINEAR) {
  if (frame <= input[0]) return output[0];
  for (let i = 1; i < input.length; i++) {
    if (frame <= input[i]) {
      const p = easing(clamp01((frame - input[i - 1]) / (input[i] - input[i - 1])));
      return output[i - 1] + p * (output[i] - output[i - 1]);
    }
  }
  return output[output.length - 1];
}

export const compareVisualFrame = (frame) => mapFinaleFrame(frame,
  [0, 1, 104, 157, 245, 346, 534], [0, 2, 148, 231, 332, 427, 546]);

export function efficiencyPose(frame) {
  // StandaloneEfficiency explicitly bypasses the obsolete 88→112 docking.
  const f = Math.min(88, Math.max(0, frame) / 80 * 88);
  return {
    authoredFrame: f,
    count: Math.min(100, Math.floor(clamp01((f - 36) / 52) * 100)),
    factsIn: tw(f, 23, 38),
    finish: clamp01((frame - 80) / 15),
  };
}

function Baseplate({ frame }) {
  const offset = frame * .12;
  return <div style={{ ...FULL, background: C.paper,
    backgroundImage: 'radial-gradient(circle at 50% 54%, rgba(120,95,60,0.09) 0 9px, transparent 10px), radial-gradient(circle at 46% 44%, rgba(255,255,255,0.55) 0 6px, transparent 7px)',
    backgroundSize: '40px 40px', backgroundPosition: `${offset}px ${offset * .5}px` }} />;
}

function EfficiencyGrid({ frame, elapsed = 186, unit = '座', label = '本次任务', completedLabel = '完成城堡' }) {
  const { authoredFrame: f, count, factsIn, finish } = efficiencyPose(frame);
  return <>
    <Svg width={1080} height={1440} style={FULL}>
      {Array.from({ length: 100 }, (_, i) => {
        const local = clamp01((f - 36 - i * 0.48) / 4.5);
        const settled = 1 - Math.pow(1 - local, 3);
        const x = 171 + (i % 20) * 37;
        const y = 873 + Math.floor(i / 20) * 31;
        return <g key={i} opacity={factsIn}>
          <rect x={x} y={y} width={28} height={19} rx={3} fill={C.paperLo} />
          <g opacity={local} transform={`translate(${x - (1 - settled) * 75} ${y - (1 - settled) * 45})`}>
            <rect width={28} height={19} rx={3} fill={C.orange} />
            <path d="M5 -2h5m8 0h5" stroke={C.orange} strokeWidth={4} />
            <path d="M3 16h22" stroke="rgba(90,35,20,0.23)" strokeWidth={3} />
          </g>
        </g>;
      })}
      {frame >= 80 && <g>
        <circle cx={948} cy={742} r={29} fill="none" stroke={C.green} strokeWidth={4}
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - finish} />
        <path d="M935 742l9 9 18-21" fill="none" stroke={C.green} strokeWidth={5}
          strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - finish} />
      </g>}
    </Svg>
    <div style={{ position: 'absolute', left: 170, right: 170, top: 593, opacity: factsIn,
      display: 'flex', justifyContent: 'space-between', color: C.ink }}>
      <div>
        <div style={{ fontFamily: F.cn, fontWeight: 700, fontSize: 24, color: C.ink2 }}>{label}用时</div>
        <div style={{ fontFamily: F.num, fontWeight: 700, fontSize: 146, lineHeight: 1.2 }}>{elapsed}<span style={{ fontFamily: F.cn, fontWeight: 900, fontSize: 34, marginLeft: 12 }}>秒</span></div>
      </div>
      <div style={{ minWidth: 245 }}>
        <div style={{ fontFamily: F.cn, fontWeight: 700, fontSize: 24, color: C.ink2 }}>{completedLabel}</div>
        <div style={{ fontFamily: F.num, fontWeight: 700, fontSize: 146, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>{count}<span style={{ fontFamily: F.cn, fontWeight: 900, fontSize: 34, marginLeft: 12 }}>{unit}</span></div>
      </div>
    </div>
  </>;
}

function Check({ p, size = 44, crossed = false }) {
  return <Svg width={size} height={size} viewBox="0 0 44 44" style={{ flex: 'none', transform: `scale(${backOut(clamp01(p * 1.4), 2.4)})` }}>
    <circle cx={22} cy={22} r={21} fill={crossed ? C.red : C.green} />
    {crossed ? <path d="M14 14 L30 30 M30 14 L14 30" stroke="#fff" strokeWidth={4.5} strokeLinecap="round" />
      : <path d="M12 23 L19 30 L32 15" stroke="#fff" strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={34} strokeDashoffset={34 * (1 - clamp01(p * 1.6 - 0.4))} />}
  </Svg>;
}

const DEFAULT_LANES = [
  { name: '示例模型', sub: 'Ultrafast · thinking', done: 185.8 / 60, stamp: '186秒 · 完成', color: C.orange },
  { name: '模型 A', sub: 'High', done: 23, stamp: '23分钟 · 完成', color: '#4D7DA1' },
  { name: '模型 B Flash', sub: 'Low', done: 26 + 4 / 60, stamp: '26分4秒 · 完成', color: C.teal },
  { name: '模型 B', sub: 'Max', done: 0, stamp: '未完成', color: '#B7AC9A' },
  { name: '模型 C Flash', sub: 'None', done: 0, stamp: '未完成', color: '#B7AC9A' },
  { name: '模型 D', sub: 'Default', done: 0, stamp: '未完成', color: '#B7AC9A' },
];
const COMPARE_DONE_AT = [134, 217, 318, 397];

export function comparisonPose(frame, firstMinutes = 185.8 / 60) {
  const f = compareVisualFrame(frame);
  return {
    authoredFrame: f,
    minute: mapFinaleFrame(f, [12, 134, 148, 217, 231, 318, 332, 397],
      [0, firstMinutes, firstMinutes, 23, 23, 26 + 4 / 60, 26 + 4 / 60, 30]),
    chartOut: tw(f, 425, 441, 0, 1, inOut),
  };
}

function ComparisonTimer({ frame, lanes = DEFAULT_LANES, labels = lanes.map((lane) => lane.name), title = '同一项任务' }) {
  const { authoredFrame: f, minute: m, chartOut } = comparisonPose(frame, lanes[0].done);
  const X0 = 390, X1 = 1010;
  const xOf = (v) => X0 + (X1 - X0) * v / 30;
  return <div style={{ ...FULL, opacity: 1 - chartOut, transform: `translateY(${-30 * chartOut}px)` }}>
    <div style={{ position: 'absolute', left: 60, top: 58, fontFamily: F.cn, fontWeight: 900, fontSize: 76, lineHeight: 1.18, color: C.ink,
      clipPath: `inset(0 ${(1 - tw(f, 2, 20)) * 100}% 0 0)` }}>{title}</div>
    <Svg width={1080} height={1440} style={FULL}>
      {[0, 5, 10, 15, 20, 25, 30].map((v) => <g key={v} opacity={tw(f, 6, 18)}>
        <line x1={xOf(v)} y1={246} x2={xOf(v)} y2={1106} stroke="rgba(28,26,23,0.12)" strokeWidth={v % 10 ? 1.5 : 2.5} strokeDasharray={v % 10 ? '6 8' : undefined} />
        <text x={xOf(v)} y={226} fill={C.ink2} fontFamily={F.mono} fontSize={20} textAnchor="middle">{v}′</text>
      </g>)}
      <line x1={xOf(m)} y1={242} x2={xOf(m)} y2={1106} stroke={C.ink} strokeWidth={2.5} opacity={1 - tw(f, 397, 409)} />
    </Svg>
    {lanes.map((lane, i) => {
      const name = labels[i] ?? lane.name;
      const stop = lane.done || 30;
      const stampAt = COMPARE_DONE_AT[Math.min(i, 3)] + Math.max(0, i - 3) * 3;
      const p = tw(f, stampAt, stampAt + 10);
      return <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: 280 + i * 140, height: 114, opacity: tw(f, 4 + i * 3, 17 + i * 3) }}>
        <div style={{ position: 'absolute', left: 60, top: 6, width: 315 }}>
          <div style={{ fontFamily: /[\u4e00-\u9fff]/.test(name) ? F.cn : F.num, fontWeight: /[\u4e00-\u9fff]/.test(name) ? 900 : 600, fontSize: i === 0 ? 37 : 39, color: C.ink, whiteSpace: 'nowrap' }}>{name}</div>
          <div style={{ fontFamily: F.cn, fontWeight: 700, fontSize: 22, color: C.mute, marginTop: 6 }}>{lane.sub}</div>
        </div>
        <div style={{ position: 'absolute', left: X0, width: X1 - X0, top: 24, height: 54, borderRadius: 11, background: 'rgba(28,26,23,0.06)' }} />
        <div style={{ position: 'absolute', left: X0, width: Math.max(0, xOf(Math.min(m, stop)) - X0), top: 24, height: 54, borderRadius: 11,
          background: lane.done ? lane.color : 'repeating-linear-gradient(-45deg, #B7AC9A 0 10px, #CFC5B4 10px 20px)',
          backgroundSize: lane.done ? undefined : '28.284271px 28.284271px', backgroundPositionX: lane.done ? undefined : `${frame * 1.6}px`,
          boxShadow: lane.done ? '0 6px 16px rgba(60,40,20,0.12)' : undefined }} />
        {m >= stop && <div style={{ position: 'absolute', left: Math.min(xOf(stop) + 12, lane.done ? 738 : 820), top: 30, display: 'flex', alignItems: 'center', gap: 8,
          opacity: p, transform: `scale(${.8 + .2 * backOut(p)})`, transformOrigin: '0 50%' }}>
          <Check p={p} size={40} crossed={!lane.done} />
          <span style={{ fontFamily: F.cn, fontWeight: 900, fontSize: 25, whiteSpace: 'nowrap', color: lane.done ? C.ink : C.red,
            background: 'rgba(250,246,238,0.96)', padding: '3px 8px', borderRadius: 8 }}>{lane.stamp}</span>
        </div>}
      </div>;
    })}
  </div>;
}

function Cursor({ x, y, press = 0, scale = 1.25 }) {
  return <Svg width={34 * scale} height={44 * scale} viewBox="0 0 34 44" style={{ position: 'absolute', left: x - 3 * scale, top: y - 2 * scale,
    transform: `scale(${1 - press * .12})`, transformOrigin: '10% 5%', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,.35))' }}>
    <path d="M3 2 L3 34 L11 27 L16.5 40 L22 37.6 L16.6 25 L27 25 Z" fill="#111" stroke="#fff" strokeWidth={2.4} strokeLinejoin="round" />
  </Svg>;
}

export function fileEditorPose(frame, textLength = 20) {
  const local = compareVisualFrame(frame + 346) - 427;
  const fileIn = tw(local, 4, 18);
  const morph = tw(local, 27, 49, 0, 1, inOut);
  const cursorIn = tw(local, 52, 74, 0, 1, inOut);
  const press = local >= 77 && local < 82;
  const processing = tw(local, 81, 94, 0, 1, LINEAR);
  const sent = tw(local, 94, 100, 0, 1, inOut);
  const fold = tw(local, 99, 121, 0, 1, inOut);
  const push = tw(local, 4, 121, 0, 1, LINEAR);
  const exit = tw(local, 113, 123, 0, 1, inOut);
  const ring = tw(local, 78, 94, 0, 1, LINEAR);
  const panelY = 500 - 88 * morph - 10 * push - 48 * fold;
  const panelH = 164 + 260 * morph * (1 - fold);
  const panelScale = .985 + .028 * push - .06 * fold;
  const panelRise = (1 - fileIn) * 38;
  const buttonX = 540 + (934 - 540) * panelScale;
  const buttonY = panelY + panelRise + panelH / 2 + (panelH / 2 - 70) * panelScale;
  return { local, fileIn, morph, cursorIn, press, processing, sent, fold, push, exit, ring,
    panelY, panelH, panelScale, panelRise, buttonX, buttonY,
    typed: Math.floor(tw(local, 44, 73, 0, textLength, LINEAR)), editorOpacity: morph * (1 - fold) };
}

function FileEditorSend({ frame, inputText = '请按照这份提示词，建造一个乐高城堡王国。', filename = '乐高城堡王国-任务说明.txt', fileDetails = '279 行 · 101.5 KB · 97,628 字符' }) {
  const p = fileEditorPose(frame, inputText.length);
  const { local, fileIn, morph, cursorIn, press, processing, sent, ring, panelY, panelH, panelScale, panelRise, buttonX, buttonY, typed, editorOpacity, exit } = p;
  return <>
    <div style={{ position: 'absolute', left: 60, right: 60, top: panelY, height: panelH, opacity: fileIn * (1 - exit),
      transform: `translateY(${panelRise}px) scale(${panelScale})`, transformOrigin: '50% 50%', borderRadius: 28, background: '#FFF',
      border: '2px solid #E2DCD2', boxShadow: '0 26px 64px rgba(60,40,20,.15)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 30, right: 30, top: 26, height: 112, display: 'flex', alignItems: 'center', gap: 24,
        padding: `0 ${18 * morph}px`, borderRadius: 18, boxSizing: 'border-box', background: `rgba(245,241,234,${morph})` }}>
        <div style={{ width: 82 - 26 * morph, height: 104 - 32 * morph, borderRadius: 10, background: C.red, position: 'relative', flex: 'none' }}>
          <div style={{ position: 'absolute', right: 0, top: 0, width: 24, height: 24, background: '#FFF', borderBottomLeftRadius: 7 }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 12, textAlign: 'center', fontFamily: F.mono, fontSize: 17, color: '#FFF' }}>TXT</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F.cn, fontWeight: 900, fontSize: 39 - 5 * morph, color: C.ink }}>{filename}</div>
          <div style={{ fontFamily: F.mono, fontSize: 20, color: C.mute, marginTop: 8 }}>{fileDetails}</div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 48, right: 48, top: 170, fontFamily: F.cn, fontSize: 30, color: C.ink2, opacity: editorOpacity, whiteSpace: 'nowrap' }}>
        {inputText.slice(0, typed)}<span style={{ color: C.orange, marginLeft: 5, opacity: (1 - sent) * (.6 + .4 * Math.cos(local * .45)) }}>│</span>
      </div>
      <div style={{ position: 'absolute', left: 36, bottom: 42, display: 'flex', gap: 14, opacity: editorOpacity, fontFamily: F.mono, fontSize: 18, color: C.ink2 }}>
        <span style={{ padding: '7px 14px', borderRadius: 10, border: '1px solid #DDD6CA' }}>☑ Thinking</span>
        <span style={{ padding: '7px 14px', borderRadius: 10, border: '1px solid #DDD6CA' }}>Tools · Web, Code</span>
      </div>
      <div style={{ position: 'absolute', right: 46, bottom: 30, width: 80, height: 80, borderRadius: 40, background: sent > .5 ? C.green : C.ink,
        display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: editorOpacity, transform: `scale(${press ? .88 : 1})` }}>
        <Svg width={36} height={36} viewBox="0 0 36 36" style={{ opacity: local < 81 ? 1 : sent }}><path d={sent > .5 ? 'M7 18 L15 26 L29 10' : 'M18 29 V7 M8 17 L18 7 L28 17'} stroke="#FFF" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>
        {local >= 81 && local < 100 && <Svg width={44} height={44} viewBox="0 0 44 44" style={{ position: 'absolute', opacity: 1 - sent, transform: 'rotate(-90deg)' }}>
          <circle cx={22} cy={22} r={16} fill="none" stroke="#FFF" strokeWidth={3} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - processing} />
        </Svg>}
      </div>
    </div>
    {local >= 52 && local < 101 && <div style={{ opacity: tw(local, 52, 58) * (1 - tw(local, 94, 101)) }}>
      <Cursor x={780 + (buttonX - 780) * cursorIn} y={1020 + (buttonY - 1020) * cursorIn} press={press ? 1 : 0} />
    </div>}
    {ring > 0 && ring < 1 && <div style={{ position: 'absolute', left: buttonX - 42 - 44 * ring, top: buttonY - 42 - 44 * ring,
      width: 84 + 88 * ring, height: 84 + 88 * ring, borderRadius: '50%', border: `3px solid ${C.orange}`, opacity: 1 - ring }} />}
  </>;
}

const spec = (id, name, category, frames, previewFrame, summary, details, sourceFiles, aliases, extra = {}) => ({
  id, name, category, frames, previewFrame, summary, details, sourceFiles: [...sourceFiles, ...SOURCE.timing], aliases, ...extra,
});
export const FINALE_SPECS = {
  'efficiency-grid': spec('lego-hundred-grid', '百格斜向飞入累计', 'data', 96, 70,
    '100个小块依次从左上飞入20列五行格子，数字同步累计。',
    '原1080×1440布局与“完成城堡/座”原文；第36视觉帧开始，每格错开0.48视觉帧、飞行4.5帧；80输出帧到100，末15输出帧画完成圈。仅提取百格统计，不包含原品牌颗粒字和场景标题。', [...SOURCE.efficiency, ...SOURCE.baseplate],
    ['100格', '百格', '累计', '积木', '斜向飞入']),
  'comparison-timer': spec('lego-comparison-timer', '条形计时与完成印章', 'data', 370, 288,
    '一根计时光标依次经过各行终点，条形停止后弹出勾选或未完成印章。',
    '保留原标题、六行布局、点阵底板、等宽分钟刻度及全部副标题；仅首行原项目品牌名替换为“示例模型”，可通过labels六项文字数组传入调用方名称，其余五行名称保持原文。保留原0–30分钟分段进度与停留：原视觉134、217、318、397到达终点，按最新535帧时间锚点换算；条纹以输出帧滚动，结尾保留原图表上移淡出。', [...SOURCE.finale, ...SOURCE.baseplate],
    ['条形图', '对比', '计时光标', '完成印章', '用时']),
  'file-editor-send': spec('lego-file-editor-send', '文件展开输入与发送折回', 'environment', 189, 143,
    '文件卡展开为输入框，逐字输入，鼠标点击，环形处理后勾选，卡片折叠并上移。',
    '保留原文件名、输入文字、Thinking与Tools文字及等宽字；原局部时间0–119按最新输出346–534的188间隔映射；形变27–49、打字44–73、按压77–82、处理81–94、成功94–100、折叠99–121。原片在局部119截断，保留原末帧淡出程度，不补造123帧尾部。', [...SOURCE.finale, ...SOURCE.baseplate],
    ['文件卡', '输入框', '打字', '发送', '进度环', '折叠上移', '界面反馈'], { kind: 'action' }),

};

/** Each mode is independently seekable; parent composition owns the clock. */
export function FinaleAction({ mode = 'efficiency-grid', frame = 0, ...props }) {
  const spec = FINALE_SPECS[mode];
  if (!spec) throw new Error(`Unknown finale action mode: ${mode}`);
  const f = Math.max(0, Math.min(spec.frames - 1, Number.isFinite(frame) ? frame : 0));
  const baseplateFrame = mode === 'file-editor-send' ? compareVisualFrame(f + 346)
    : mode === 'comparison-timer' ? compareVisualFrame(f) : f;
  return <div style={{ position: 'absolute', width: 1080, height: 1440, overflow: 'hidden', background: C.paper }}>
    <Baseplate frame={baseplateFrame} />
    {mode === 'efficiency-grid' && <EfficiencyGrid frame={f} {...props} />}
    {mode === 'comparison-timer' && <ComparisonTimer frame={f} {...props} />}
    {mode === 'file-editor-send' && <FileEditorSend frame={f} {...props} />}
  </div>;
}
