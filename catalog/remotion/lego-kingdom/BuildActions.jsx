// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React from 'react';
import { C, F, tw, clamp01, backOut, inExpo, Svg } from './theme.js';
import { BUILD_DATA } from './build-data.js';

/**
 * Frame-only extractions of the current source's actual drawing functions.
 * Logical canvas: 1080 × 1440; 30 fps. No voice, watermark or portrait.
 * children may be a React node or ({frame, sourceFrame, alternate}) => node.
 * Tracked labels retain sampled anchors above the authorized original terrain
 * frames. Other source recordings are not bundled. resolveAsset maps local
 * asset paths; the Remotion wrapper supplies Img as ImageComponent.
 */
const FULL = { position: 'absolute', inset: 0 };
const linear = t => t;
const renderContent = (children, context, fallback) => children == null
  ? fallback : typeof children === 'function' ? children(context) : children;
const sample = (track, frame) => track[Math.max(0, Math.min(track.length - 1, Math.round(frame)))];
const engineFrame = frame => frame * 113 / 64;

// Original content fingerprints displayed by Brief.Engine.
const ENGINE_BLOCKS = [["001","u0gu2j1mqia7r"],["002","1picj5hn181zn"],["003","o34b4cho3a0z"],["004","1oh47zj1ivk8n"],["005","2uk8ec129df2n"],["006","1xfme8r180mh3o"],["007","1i24nwt178m1nk"],["008","kpoyu41b52b36"],["009","88f3lpsa670f"],["010","r43rlc1pjpsa0"],["011","1cbhl7018m66qt"],["012","if25rt414qef"],["013","1i5geic5b4vkg"],["014","1htnjag18xekw1"],["015","1ehexyi1yea1xi"],["016","nv8d1rktlefe"],["017","pkwgl5fc0gd7"],["018","924o4dw1pqr1"],["019","1apkjdiqwvbge"],["020","w4x8cv151o9d3"],["021","1bx5vjt1r7eisf"],["022","3ocnuf1ipip2y"],["023","n3pp5qhn91h4"],["024","tm5ukh69p51i"],["025","crtxp3m9a3dd"],["026","ijodq812saw3"],["027","leezxwv18ld0"],["028","11n8ikgkagwej"],["029","1m451mubrwtr7"],["030","103l6lt124v526"],["031","kpoqyklmvxxc"],["032","10l16kq1y5uosa"],["033","1puswt11r3n6mz"],["034","1573l7bqnnh0e"],["035","179lp2t4xnnfb"],["036","141cfga13morta"],["037","k0rdhz1kn53im"],["038","49x6geqhbxs5"],["039","2v4u3pf2yahd"],["040","mmfnozt6ykr0"],["041","13jr1mna345jn"],["042","10wxa4728vtgz"],["043","n954tl1v3bicl"],["044","pgd55qu1v80z"],["045","1u4uf30d2e6hb"],["046","56qz7zw6yt3"],["047","1qa3sx41anltbl"],["048","4ziqka1u27b6d"],["049","go2gz61i4fm7y"],["050","1vc6jcs1c6nfod"],["051","9y4hwz15l4fif"],["052","19szndd17ysb9e"],["053","na0arj1ym9sbk"],["054","13qprvmn9dflj"],["055","lztqyfdd94pu"]];

function Baseplate({ frame = 0, dark = false, drift }) {
  const offset = drift ?? frame * 0.12;
  const dot = dark ? 'rgba(255,255,255,0.05)' : 'rgba(120,95,60,0.09)';
  const hi = dark ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.55)';
  return <div style={{ ...FULL, background: dark ? '#0E0E10' : C.paper,
    backgroundImage: `radial-gradient(circle at 50% 54%, ${dot} 0 9px, transparent 10px), radial-gradient(circle at 46% 44%, ${hi} 0 6px, transparent 7px)`,
    backgroundSize: '40px 40px', backgroundPosition: `${offset}px ${offset * 0.5}px` }} />;
}

function Stud({ x, y, r, color }) {
  return <div style={{ position: 'absolute', left: x - r, top: y - r, width: r * 2,
    height: r * 2, borderRadius: '50%', background: color,
    boxShadow: `inset 0 ${-r * 0.18}px 0 rgba(0,0,0,0.18), inset 0 ${r * 0.16}px 0 rgba(255,255,255,0.32), 0 ${r * 0.14}px ${r * 0.2}px rgba(0,0,0,0.22)` }} />;
}

const PALETTE = [C.red, C.yellow, C.blue, C.green, '#F4EEE2', C.orange, C.teal, C.red, C.yellow, C.blue];
const hash = (a, b) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function brickTile(f, r, c, at = 22, dur = 11) {
  const wave = (c * 0.55 + r * 0.32) / (10 * 0.55 + 25 * 0.32);
  const jitter = hash(r, c) * 0.12;
  const inT = clamp01((f - (at - dur - 6) - (wave + jitter) * dur) / 6);
  const outT = clamp01((f - (at + 1) - (wave + jitter) * dur) / 5);
  return { inT, outT, s: backOut(inT, 2.2) * (1 - outT) };
}

function matrixCell(f, i) {
  const row = Math.floor(i / 5), col = i % 5;
  const st = 4 + (10 - row) * 3 + col * 0.9;
  const p = clamp01((f - st) / 9), y = -520 * (1 - inExpo(p));
  const settle = f > st + 9 ? Math.sin(clamp01((f - st - 9) / 5) * Math.PI) * -6 : 0;
  const scan = tw(f, 54, 76, -1, 11.5, linear);
  return { row, col, st, p, y, settle, lit: clamp01(1 - Math.abs(scan - row) / 1.2), done: scan > row + 0.5 };
}

function packet(f, side, n) {
  const endX = side === 0 ? 310 : 770;
  const p = ((f - 91) * 0.065 + n / 3 + side * 0.12) % 1, travel = p * 320;
  const x = travel < 40 ? 540 : travel < 270 ? 540 + (endX - 540) * (travel - 40) / 230 : endX;
  const y = travel < 40 ? 947 + travel : travel < 270 ? 987 : 987 + (travel - 270);
  return { p, x, y, opacity: Math.sin(p * Math.PI) };
}

// Both the wipe and the illustration use the same two-stud tile.
function BrickTile({ color }) {
  const W = 120, H = 60;
  return <>
    <div style={{ ...FULL, inset: 1, borderRadius: 4, background: color,
      boxShadow: 'inset 0 -5px 0 rgba(0,0,0,0.16), inset 0 3px 0 rgba(255,255,255,0.22)' }} />
    <Stud x={W * 0.27} y={H * 0.48} r={15} color={color} />
    <Stud x={W * 0.73} y={H * 0.48} r={15} color={color} />
  </>;
}

function BrickIllustration() {
  return <div data-brick-illustration="true" style={FULL}>
    {[C.red, C.yellow, C.blue, C.green, C.orange, C.teal].map((color, i) =>
      <div key={color} style={{position:'absolute',left:120+(i%2)*480,top:420+Math.floor(i/2)*240,
        width:120,height:60,transform:'scale(3)',transformOrigin:'0 0'}}><BrickTile color={color}/></div>)}
  </div>;
}

/** Original BrickWipe, with its frame supplied explicitly. */
function BrickWipe({ f, at = 22, dur = 11 }) {
  if (f < at - dur - 8 || f > at + dur + 8) return null;
  const tiles = [], W = 120, H = 60, COLS = 10, ROWS = 25;
  for (let r = 0; r < ROWS; r++) {
    const off = r % 2 ? -W / 2 : 0;
    for (let c = 0; c < COLS + 1; c++) {
      const { inT, s } = brickTile(f, r, c, at, dur);
      if (s <= 0.001) continue;
      const color = PALETTE[Math.floor(hash(c + 7, r + 3) * PALETTE.length)];
      tiles.push(<div key={`${r}-${c}`} style={{ position: 'absolute', left: c * W + off,
        top: r * H, width: W, height: H,
        transform: `scale(${s}) translateY(${(1 - inT) * -30}px)`, transformOrigin: '50% 50%' }}>
        <BrickTile color={color} />
      </div>);
    }
  }
  return <div style={{ ...FULL, overflow: 'hidden', pointerEvents: 'none' }}>{tiles}</div>;
}

function Brick({ w, h, color, edge, studs, children }) {
  return <div style={{ position: 'relative', width: w, height: h }}>
    {Array.from({ length: studs }, (_, i) => <div key={i} style={{ position: 'absolute',
      top: -9, left: ((i + 0.5) / studs) * w - 14, width: 28, height: 11,
      borderRadius: '4px 4px 0 0', background: color,
      boxShadow: `inset 0 -2px 0 ${edge}, inset 3px 0 0 rgba(255,255,255,0.35)` }} />)}
    <div style={{ ...FULL, borderRadius: 5, background: color,
      boxShadow: `inset 0 -6px 0 ${edge}, inset 0 2px 0 rgba(255,255,255,0.45), 0 6px 14px rgba(60,40,20,0.12)` }} />
    <div style={{ position: 'relative', height: '100%' }}>{children}</div>
  </div>;
}

/** The 55 actual block motions and displayed fingerprints from Brief.Engine. */
function MatrixScan({ f }) {
  const COLS = 5, W = 172, H = 46, GX = 10, GY = 20;
  const left = (1080 - (COLS * W + (COLS - 1) * GX)) / 2, top = 232;
  return <>
    {ENGINE_BLOCKS.map(([n, h], i) => {
      const { row, col, p, y, settle, lit, done } = matrixCell(f, i);
      return <div key={n} style={{ position: 'absolute', left: left + col * (W + GX),
        top: top + row * (H + GY) + y + settle, opacity: p > 0 ? 1 : 0 }}>
        <Brick w={W} h={H} color={lit > 0.05 ? `rgb(${220 - 60 * lit},${214 + 10 * lit},${200 - 80 * lit})` : '#DDD5C7'} edge="rgba(80,60,40,0.22)" studs={4}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: '100%', padding: '0 14px 4px', boxSizing: 'border-box' }}>
            <span style={{ fontFamily: F.num, fontWeight: 600, fontSize: 21, color: C.ink }}>§{n}</span>
            <span style={{ fontFamily: F.mono, fontSize: 11.5, color: done ? C.green : C.mute }}>{done ? '✓ ' : ''}{h.slice(0, 7)}</span>
          </div>
        </Brick>
      </div>;
    })}
  </>;
}

/** Same piecewise travel and phase offsets as Engine's live output packets. */
function PathPackets({ f }) {
  return <Svg width={1080} height={1440} style={{ ...FULL, opacity: tw(f, 91, 96) }}>
    {[0, 1].map(side => {
      const endX = side === 0 ? 310 : 770;
      return <g key={side}>
        <path d={`M540 947V987H${endX}V1035`} fill="none" stroke={C.hair} strokeWidth={3} />
        {[0, 1, 2].map(n => {
          const { x, y, opacity } = packet(f, side, n);
          return <rect key={n} x={x - 6} y={y - 6} width={12} height={12} rx={2}
            fill={side === 0 ? C.orange : C.red} opacity={opacity} />;
        })}
      </g>;
    })}
  </Svg>;
}

function EngineOutputs({ f }) {
  return <div style={{ position: 'absolute', left: 90, right: 90, top: 1038, display: 'flex', gap: 22 }}>
    {[{ k: 0, en: 'const KINGDOM', cn: '岛形 · 分区 · 河流', color: C.yellow, edge: 'rgba(120,80,0,0.3)' },
      { k: 1, en: 'const CASTLES', cn: '100 座城堡配方', color: C.red, edge: 'rgba(90,20,10,0.35)' }].map(s => {
      const p = tw(f, 76 + s.k * 6, 94 + s.k * 6), blink = Math.floor(f / 8) % 2 === 0;
      return <div key={s.k} style={{ flex: 1, opacity: p, transform: `translateY(${(1 - backOut(p)) * 60}px)` }}>
        <Brick w={439} h={110} color={s.color} edge={s.edge} studs={8}>
          <div style={{ padding: '14px 22px', color: s.k ? C.white : C.ink }}>
            <div style={{ fontFamily: F.mono, fontSize: 22, fontWeight: 400 }}>{s.en}<span style={{ opacity: blink ? 1 : 0 }}>▍</span></div>
            <div style={{ fontFamily: F.cn, fontWeight: 900, fontSize: 34, marginTop: 4 }}>{s.cn}</div>
          </div>
        </Brick>
      </div>;
    })}
  </div>;
}

const LABEL_OFFSETS = { east: [145, 0], harbor: [50, 10], lake: [-100, 60], north: [0, -30],
  northeast: [120, -50], riverland: [-150, 0], royal: [140, -30], south: [140, 50], west: [-180, -10] };
const LABEL_COLORS = { royal: '#EDE3CC', north: '#E4E9EA', northeast: '#DFD3B8', east: '#D8C69A',
  harbor: '#3B86C9', south: '#BFD6A2', lake: '#538786', riverland: '#C9D9B0', west: '#A8C98A' };
const LABEL_NAMES = { royal: '王都', north: '朔方', northeast: '曙光', east: '东屿',
  harbor: '南港', south: '南泽', lake: '镜湖', riverland: '河湾', west: '西林' };

function layoutBackground(f) {
  const background = BUILD_DATA.layout.background;
  const frame = Math.max(0, Math.min(background.frames - 1, Math.round(f)));
  const segment = background.segments.find(item => frame >= item.start && frame <= item.end);
  return { frame, sourceShot: segment.sourceShot,
    sourceFrame: segment.sourceFirstFrame + frame - segment.start,
    path: background.prefix + String(frame).padStart(3, '0') + background.extension };
}

function LayoutFrame({ f, resolveAsset, ImageComponent }) {
  const background = layoutBackground(f);
  return <ImageComponent src={resolveAsset(background.path)} width={1080} height={1440}
    data-layout-frame={background.frame} data-original-shot={background.sourceShot}
    data-original-frame={background.sourceFrame} alt="" draggable={false} decoding="sync"
    style={{ ...FULL, width: 1080, height: 1440, objectFit: 'cover', transform: 'none' }} />;
}

function TrackedLabels({ f, children, resolveAsset, ImageComponent }) {
  const alternate = f >= BUILD_DATA.layout.cutAt;
  if (alternate) return <div style={{ ...FULL, background: '#FFFFFF' }}>
    {renderContent(children, { frame: f, sourceFrame: f - BUILD_DATA.layout.cutAt, alternate },
      <LayoutFrame f={f} resolveAsset={resolveAsset} ImageComponent={ImageComponent} />)}
  </div>;
  const anchors = sample(BUILD_DATA.layout.labels, f);
  return <div style={{ ...FULL, background: '#FFFFFF' }}>
    {renderContent(children, { frame: f, sourceFrame: f, alternate },
      <LayoutFrame f={f} resolveAsset={resolveAsset} ImageComponent={ImageComponent} />)}
    <Svg width={1080} height={1440} style={FULL}>
      {BUILD_DATA.layout.districts.map(({ key }, i) => {
        const [x, y] = anchors[i], [dx, dy] = LABEL_OFFSETS[key];
        return <g key={key} opacity={tw(f, 3 + i * 1.8, 12 + i * 1.8)}>
          <line x1={x} y1={y} x2={x + dx} y2={y + dy} stroke={C.ink2} strokeWidth={2} />
          <circle cx={x} cy={y} r={5} fill={C.orange} stroke={C.white} strokeWidth={2} />
        </g>;
      })}
    </Svg>
    {BUILD_DATA.layout.districts.map(({ key, count }, i) => {
      const [x, y] = anchors[i], [dx, dy] = LABEL_OFFSETS[key];
      const reveal = tw(f, 3 + i * 1.8, 12 + i * 1.8);
      return <div key={key} style={{ position: 'absolute', left: x + dx, top: y + dy,
        transform: `translate(-50%,-50%) scale(${backOut(reveal)})`, opacity: reveal }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px 10px 12px', borderRadius: 30,
          background: 'rgba(28,26,23,0.86)', color: C.white, whiteSpace: 'nowrap', boxShadow: '0 8px 20px rgba(0,0,0,0.18)' }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, background: LABEL_COLORS[key], border: '2px solid #fff' }} />
          <span style={{ fontFamily: F.cn, fontWeight: 900, fontSize: 28 }}>{LABEL_NAMES[key]}</span>
          <span style={{ fontFamily: F.num, fontWeight: 500, fontSize: 26, color: C.yellow }}>{count}</span>
        </div>
      </div>;
    })}
  </div>;
}

function Cursor({ x, y, scale = 1, press = 0 }) {
  return <Svg width={34 * scale} height={44 * scale} viewBox="0 0 34 44"
    style={{ position: 'absolute', left: x - 3 * scale, top: y - 2 * scale,
      transform: `scale(${1 - press * 0.12})`, transformOrigin: '10% 5%', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.35))' }}>
    <path d="M3 2 L3 34 L11 27 L16.5 40 L22 37.6 L16.6 25 L27 25 Z" fill="#111" stroke="#fff" strokeWidth="2.4" strokeLinejoin="round" />
  </Svg>;
}

function CursorTrail({ f, children }) {
  const track = BUILD_DATA.rippleCursor;
  const [x, y] = sample(track, f);
  const trail = Array.from({ length: 10 }, (_, k) => sample(track, f - k * 2));
  return <>
    {renderContent(children, { frame: f, sourceFrame: f }, null)}
    <Svg width={1080} height={1440} style={{ ...FULL, opacity: tw(f, 0, 5) }}>
      <polyline points={trail.map(([a, b]) => `${a},${b}`).join(' ')} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={4} strokeLinecap="round" />
    </Svg>
    <div style={{ opacity: tw(f, 0, 4) }}><Cursor x={x} y={y} scale={1.25} /></div>
  </>;
}

/** Read-only numerical seams for boundary checks and custom replacements. */
export const BUILD_MOTION = {
  engineFrame,
  brickTile,
  matrixCell,
  packet,
  layoutBackground,
  cursor: f => ({ point: sample(BUILD_DATA.rippleCursor, f),
    trail: Array.from({ length: 10 }, (_, k) => sample(BUILD_DATA.rippleCursor, f - k * 2)) }),
  layout: f => ({ alternate: f >= BUILD_DATA.layout.cutAt,
    sourceFrame: f < BUILD_DATA.layout.cutAt ? f : f - BUILD_DATA.layout.cutAt,
    anchors: sample(BUILD_DATA.layout.labels, f), offsets: LABEL_OFFSETS }),
};

export const BUILD_SPECS = {
  'brick-illustration': {
    id:'lego-brick-illustration',name:'彩色积木块',kind:'illustration',category:'illustration-object',frames:30,previewFrame:0,
    summary:'六种原色的双凸点积木以两列三行陈列，保留凸点高光、侧边厚度与阴影。',
    retain:'原120×60双凸点积木等比放大三倍；两列三行，六色陈列；静态主体不附加动作。',
    sourceFiles:['video/src/components/BrickWipe.tsx'],aliases:['积木','双凸点积木','彩色砖块','乐高']
  },
  'brick-wipe': {
    id: 'lego-brick-wipe', name: '斜向积木铺屏', category: 'transition', frames: 44, previewFrame: 22,
    summary: '彩色双凸点积木沿斜向波次弹入，盖住画面后沿同一波次缩离。',
    details: '1080×1440、30帧/秒；120×60积木，25行×11列，奇数行左移60。中心帧22，波次长度11；入场6帧、退场5帧；保留确定性扰动与2.2回弹。只保留源积木遮挡层，不另画底图；children可承载实际转场内容，第22帧提供交接标记。',
    sourceFiles: ['video/src/components/BrickWipe.tsx'], aliases: ['BrickWipe', '积木转场', '斜向铺屏', '彩砖遮挡']
  },
  'matrix-scan': {
    id: 'lego-matrix-scan', name: '矩阵落入逐行扫描', category: 'scanning', frames: 65, previewFrame: 42,
    summary: '五列十一行积木从上方错时落定，再由上至下扫描并留下完成标识。',
    details: '源组件名为Engine；原设计114帧按f=输出帧×113/64映射到65帧。五列、55格、172×46、横间10、纵间20；逐行倒序起落，9设计帧落下520像素，随后5帧负向6像素收稳；第54..76设计帧扫描。保留engine-blocks.json的原55条编号与内容指纹，单动作只保留矩阵层。',
    sourceFiles: ['video/src/scenes/Brief.tsx', 'video/src/data/engine-blocks.json', 'video/src/timeline.ts', 'video/src/timeline.json', 'video/src/data/visual-timing.json'], aliases: ['Engine', 'SourceMatrix', '源码矩阵', '落块扫描']
  },
  'path-packets': {
    id: 'lego-path-packets', name: '折线路径双向分流', category: 'connection', frames: 13, previewFrame: 9,
    summary: '数据方块从共同起点沿两条折线持续分流，经过转角时保持原分段路程。',
    details: '独立片段裁出原Engine当前输出第52..64帧，共13帧，采用f=(局部输出帧+52)×113/64；保留第91..96设计帧显现。起点540,947，经y987分流至x310或770，终点y1035。每侧3粒，12×12；相位偏置n/3+side×0.12，每设计帧推进0.065周，正弦透明度。包含源下方KINGDOM/CASTLES两个八凸点输出积木，保留原文字、439×110尺寸、1038纵坐标与共同时间；不增加起点框。完整等待与交接节奏见矩阵扫描与分流组合。',
    sourceFiles: ['video/src/scenes/Brief.tsx', 'video/src/timeline.ts'], aliases: ['Engine', '数据粒子', '折线路径', '分流连接'],
  },
  'tracked-labels': {
    id: 'lego-tracked-labels', name: '九点引线标注跟随', category: 'response', frames: 93, previewFrame: 35,
    summary: '真实城堡王国镜头上，九组原标注按实测轨迹逐帧跟随锚点，第46帧切入第二地形并结束标注。',
    details: '保留93帧原投影样本、九组偏移、原名称和配色、标注错时进入与回弹。背景使用原layout-clean-white-4k的0..45帧，第46帧直切原layout-alternate-4k的0..46帧；两段均按30帧/秒、无额外缩放漂移，降采样至1080×1440并无损保存。引线、锚点、标签由源码绘制，背景不含声音、水印和头像；children可替换背景。',
    sourceFiles: ['video/src/scenes/Brief.tsx', 'video/src/components/Shot.tsx', 'video/src/data/recording4-shots.json', 'capture/recording4-shots.mjs', 'capture/alternate-terrain.mjs'], aliases: ['Layout', '九分区', '跟随标签', '投影锚点', '两地形切换']
  },
  'cursor-trail': {
    id: 'lego-cursor-trail', name: '鼠标路径延迟拖尾', category: 'response', frames: 51, previewFrame: 30,
    summary: '鼠标沿逐帧轨迹移动，十个历史采样点连成固定延迟的短尾迹。',
    details: '保留51帧原鼠标坐标；第k个尾点取round(f−2k)，共10点，越界固定到首末样本。白色折线宽4，0..5帧进入，鼠标0..4帧进入、比例1.25。仅剥离原录屏，保留源鼠标与轨迹层，不绘制替代地形、底色或水面涟漪。',
    sourceFiles: ['video/src/scenes/Kingdom.tsx', 'video/src/components/Bits.tsx', 'video/src/data/recording4-shots.json'], aliases: ['Ripple', '鼠标轨迹', '延迟跟随', '尾迹', '路径采样']
  },
  'engine-flow': {
    id: 'lego-engine-flow', name: '矩阵扫描与分流组合', category: 'composition-interface', kind: 'composition', frames: 65, previewFrame: 60,
    summary: '积木矩阵错时落定，逐行扫描，两个输出块弹入，随后路径粒子将矩阵接到两处输出。',
    details: '共用矩阵与路径子动作的实际绘制。完整保留Engine原设计0..113帧到最新输出0..64帧的时间映射，输出块76+6k..94+6k设计帧入场，保留原点阵底、55条内容指纹、两行中文、KINGDOM/CASTLES输出块及100座城堡文案、标题擦入和光标闪动；原标题含品牌词，改由engineTitle参数提供，默认“引擎”，其余文字与原作一致。独立路径子动作裁出当前输出52..64帧，组合不裁切。',
    sourceFiles: ['video/src/scenes/Brief.tsx', 'video/src/components/Baseplate.tsx', 'video/src/data/engine-blocks.json', 'video/src/timeline.ts', 'video/src/timeline.json', 'video/src/data/visual-timing.json'],
    aliases: ['Engine', '源码矩阵组合', 'SourceMatrix', '矩阵数据流'], actions: ['lego-matrix-scan', 'lego-path-packets'],
    layers: [
      { id: 'matrix', name: '矩阵落入与逐行扫描', detail: '55格错时落定，再扫描并留下完成标识', start: 0, end: 2166.666667, actions: ['lego-matrix-scan'] },
      { id: 'outputs', name: '输出块与路径分流', detail: '输出块弹入，原输出第52帧起出现双路数据粒子', start: 1434.807, end: 2166.666667, actions: ['lego-path-packets'] },
    ]
  },
};

export function BuildAction({ mode = 'brick-wipe', frame = 0, children, engineTitle = '引擎',
  resolveAsset = path => path, ImageComponent = 'img' }) {
  const spec = BUILD_SPECS[mode];
  if (!spec) throw new Error(`Unknown BuildAction mode: ${mode}`);
  const f = Math.max(0, Math.min(spec.frames - 1, Number.isFinite(frame) ? frame : 0));
  let visual;
  if (mode === 'brick-illustration') visual = <BrickIllustration />;
  if (mode === 'brick-wipe') visual = <>
    {renderContent(children, { frame: f, alternate: f >= 22 }, null)}
    <BrickWipe f={f} />
  </>;
  if (mode === 'matrix-scan') visual = <MatrixScan f={engineFrame(f)} />;
  if (mode === 'path-packets') visual = <>
    <PathPackets f={engineFrame(f + 52)} /><EngineOutputs f={engineFrame(f + 52)} />
  </>;
  if (mode === 'engine-flow') visual = <>
    <Baseplate frame={engineFrame(f)} drift={engineFrame(f) * 0.3} />
    <div style={{ position: 'absolute', left: 90, top: 64, color: C.ink }}>
      <div style={{ fontFamily: F.cn, fontWeight: 900, fontSize: 104, lineHeight: 1.12,
        clipPath: `inset(0 ${(1 - tw(engineFrame(f), 4, 22)) * 100}% 0 0)` }}>{engineTitle}</div>
    </div>
    <div style={{ position: 'absolute', right: 90, top: 92, textAlign: 'right', fontFamily: F.mono,
      color: C.ink2, fontSize: 19, letterSpacing: '0.12em', lineHeight: 1.7, opacity: tw(engineFrame(f), 10, 24) }}>
      <div>渲染 · 材质 · 灯光</div><div>地形 · 河流 · 生长动画</div>
    </div>
    <div data-layer="matrix" style={FULL}><MatrixScan f={engineFrame(f)} /></div>
    <div data-layer="outputs" style={FULL}><PathPackets f={engineFrame(f)} /><EngineOutputs f={engineFrame(f)} /></div>
  </>;
  if (mode === 'tracked-labels') visual = <TrackedLabels f={f} children={children}
    resolveAsset={resolveAsset} ImageComponent={ImageComponent} />;
  if (mode === 'cursor-trail') visual = <CursorTrail f={f} children={children} />;
  return <div style={{ ...FULL, width: 1080, height: 1440, overflow: 'hidden' }}>{visual}</div>;
}
