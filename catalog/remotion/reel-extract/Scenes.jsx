// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import React, {useId} from 'react';
import {C} from './colors.js';
import {GlassFrame} from './GlassFrame.jsx';
import {KLine} from './KLine.jsx';
import {SURFACE} from './surfaces.js';
import {clamp, lerp, prog, springy, quintInOut, rnd} from './math.mjs';
import {GARBAGE_TITLE, GARBAGE_OUTPUT_COUNT, garbageBoxAt, garbageInputMorph, garbageTrashAt} from './garbageMotion.mjs';
import THUMB_IDS from './thumbs.json';
import CATALOG_FILL from './catalog-fill.json';
import {MatchPreview} from './MatchPreview.jsx';
export const THUMBS = THUMB_IDS.filter(id => !['spiral-galaxy-illustration', 'encore-umbrella-illustration', 'material-evolution-sequence'].includes(id));
export const CATALOG_THUMBS = [...THUMBS, ...CATALOG_FILL.map(([id]) => id)];
const W=1080, H=1440, M=72, MX=72, CW=936, COL_W=296, COLS=[72,392,712];
const F={reg:'"Source Han Sans SC", sans-serif',oswald:'"Oswald", sans-serif'};
const T={body:36,h1:80};
const mono=(size,color=C.dim)=>({font:`${size}px/1 "Oswald", sans-serif`,color});
export const MATCH_POOLS = [
  [
    {id: 'stack-flick', name: '纸片连续叠加'},
    {id: 'book-spine-turn', name: '绕书脊翻页', preview: 'turn'},
    {id: 'circle-expand-wordmark', name: '圆形扩黑与字标展开'},
    {id: 'card-conveyor', name: '斜向双向滚动'},
    {id: 'grid-flow-unfold', name: '网格起伏黄金生长'},
    {id: 'paper-spiral-sequence', name: '纸片螺旋展开'},
    {id: 'tile-round-wave', name: '圆角方块波浪'},
    {id: 'contour-draw-fill', name: '轮廓描绘填色'},
  ],
  [
    {id: 'benchmark-columns', name: '数据分栏对比'},
    {id: 'generative-point-morph', name: '点阵连续换形'},
    {id: 'book-geometric-illustration', name: '几何网点插画', preview: 'art'},
    {id: 'collage-film-sequence', name: '剪贴联动与海报归位'},
    {id: 'claude-plexus-illustration', name: '漂移点线网络'},
    {id: 'cyanotype', name: '蓝晒植物插画'},
    {id: 'claude-orbits-illustration', name: '轨道环绕插画'},
    {id: 'striped-sun-rise', name: '条纹日出插画'},
  ],
  [
    {id: 'capsule-type-sequence', name: '字母落定与碰撞炸出'},
    {id: 'book-paper-light', name: '纸张光影', preview: 'paper'},
    {id: 'metal-impact-type-sequence', name: '金属弹开汇聚成字'},
    {id: 'word-slam', name: '文字撞入换位'},
    {id: 'hud-acquisition-sequence', name: '目标扫描捕获锁定'},
    {id: 'chrome-outline-echo', name: '金属轮廓回响'},
    {id: 'sunset-water-reflection', name: '落日水面倒影'},
    {id: 'neon-title-sequence', name: '霓虹标题浮现'},
  ],
];
const STEP_STAGE = 500;
const STEP_TITLE_Y = 196, STEP_TITLE_H = T.h1 * (2 * 1.22 + 0.2), MATCH_RESULT_Y = H - 120;
// 标题与匹配结果之间居中放置动效区，上下留白相等。
export const WHEEL_H = 760, WHEEL_TOP = (STEP_TITLE_Y + STEP_TITLE_H + MATCH_RESULT_Y - WHEEL_H) / 2;
export const WHEEL_CELL = 296, WHEEL_ITEM_H = 272;
const WHEEL_IMAGE_W = COL_W - 16, WHEEL_IMAGE_H = WHEEL_IMAGE_W * 9 / 16;
export const wheelPosition = (t, start, stopAt, target) => {
  const speed = 4800, brake = Math.min(0.32, stopAt - start);
  const coast = stopAt - start - brake;
  const elapsed = clamp(t - start, 0, stopAt - start);
  const destination = target * WHEEL_CELL;
  const origin = destination - speed * (coast + brake / 2);
  if (elapsed <= coast) return origin + speed * elapsed;
  const u = clamp((elapsed - coast) / brake);
  return origin + speed * coast + speed * brake * (u / 2 + Math.sin(Math.PI * u) / (2 * Math.PI));
};
export const Reel = ({t, x, start, stopAt, target, items, asset}) => {
  const pos = wheelPosition(t, start, stopAt, target);
  const first = Math.round(pos / WHEEL_CELL);
  const locked = t >= stopAt;
  const radius = WHEEL_H / 2;
  const fade = 'linear-gradient(to bottom, transparent, #000 16%, #000 84%, transparent)';
  return <div style={{position: 'absolute', left: x, top: WHEEL_TOP, width: COL_W, height: WHEEL_H,
    overflow: 'hidden', maskImage: fade, WebkitMaskImage: fade}}>
    {Array.from({length: 7}, (_, k) => {
      const row = first + k - 3;
      const idx = ((row % items.length) + items.length) % items.length;
      const item = items[idx];
      const distance = row * WHEEL_CELL - pos;
      const angle = distance / radius;
      if (Math.abs(angle) >= Math.PI / 2) return null;
      const focus = clamp(1 - Math.abs(distance) / WHEEL_CELL);
      const facing = Math.cos(angle);
      const selected = locked && Math.abs(distance) < 1;
      const nameSize = Math.min(30, Math.floor((WHEEL_IMAGE_W - 8) / [...item.name].length));
      return <div key={row} style={{position: 'absolute', left: 0, right: 0, top: WHEEL_H / 2 - WHEEL_ITEM_H / 2,
        height: WHEEL_ITEM_H, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 12,
        boxSizing: 'border-box', whiteSpace: 'nowrap', color: selected ? C.accent : C.ink,
        opacity: locked ? (selected ? 1 : facing ** 2 * 0.16) : facing ** 2 * (0.48 + 0.52 * focus),
        transform: `translateY(${radius * Math.sin(angle)}px) perspective(900px) rotateX(${-angle * 180 / Math.PI}deg) scale(${1 + 0.04 * focus})`}}>
        <div style={{position: 'relative', overflow: 'hidden', borderRadius: SURFACE.radius.small,
          width: WHEEL_IMAGE_W, height: WHEEL_IMAGE_H, flexShrink: 0,
          outline: `1px solid ${selected ? C.accentLight + '66' : 'rgba(242,241,236,.12)'}`, outlineOffset: -1}}>
        {item.preview ? <MatchPreview kind={item.preview} t={t} width={WHEEL_IMAGE_W} height={WHEEL_IMAGE_H} /> : <img src={asset(`thumbs/${item.id}.webp`)} alt={item.name} style={{display: 'block', width: WHEEL_IMAGE_W, height: WHEEL_IMAGE_H, objectFit: 'contain'}} />}
        </div>
        <div data-match-title="" style={{width: WHEEL_IMAGE_W, height: 36, flexShrink: 0, textAlign: 'center', whiteSpace: 'nowrap', font: `${nameSize}px/36px ${F.reg}`}}>
          {item.name}
        </div>
      </div>;
    })}
  </div>;
};

export function ImagePicker({t, asset}) {
  return <>
    <GlassFrame t={t} edgeOpacity={0.3} style={{position:'absolute',left:MX,top:WHEEL_TOP+WHEEL_H/2-(WHEEL_ITEM_H+20)/2,width:CW,height:WHEEL_ITEM_H+20,background:'linear-gradient(145deg, #181b1e, #111315)'}}>
      {[1,2].map(i=><div key={i} style={{position:'absolute',left:i*320-12,top:20,bottom:20,width:1,background:'rgba(242,241,236,.09)'}} />)}
    </GlassFrame>
    {MATCH_POOLS.map((items,i)=><Reel key={i} t={t} x={COLS[i]} start={42.6} stopAt={[43.7,43.92,44.14][i]} target={[1,2,1][i]} items={items} asset={asset} />)}
  </>;
}
const GRID = {cols: 6, rows: 9, w: (CW - 5 * 12) / 6, gapX: 12, gapY: 14, x0: M, y0: 416};
GRID.h = GRID.w * 9 / 16;
const cell = i => ({x: GRID.x0 + (i % GRID.cols) * (GRID.w + GRID.gapX), y: GRID.y0 + Math.floor(i / GRID.cols) * (GRID.h + GRID.gapY)});
export const CardStack = ({t, asset}) => {
 const n=Math.min(GRID.cols*GRID.rows,CATALOG_THUMBS.length);
 return <>
    <GlassFrame t={t} edgeOpacity={0.3} data-catalog-stage="" style={{position: 'absolute', left: M - 16, top: GRID.y0 - 16,
      width: CW + 32, height: cell(n - 1).y + GRID.h + 60 - (GRID.y0 - 16), background: '#121416',
      opacity: prog(t, 27.94, 28.24) }} />
    {Array.from({length: n}, (_, i) => {
      const id = CATALOG_THUMBS[i];
      const a = 26.2 + rnd('ga', i) * 0.9;
      if (t < a) return null;
      const px = M + rnd('px', i) * (CW - GRID.w), py = 1230 - Math.floor(i / 6) * 34 - rnd('py', i) * 30, pr = (rnd('pr', i) - 0.5) * 30;
      const fq = clamp((t - a) / 0.5);
      const bounce = fq >= 1 ? Math.exp(-(t - a - 0.5) * 8) * Math.sin((t - a - 0.5) * 30) * 10 : 0;
      let x = px, y = lerp(-200, py, fq * fq) - bounce, r = lerp(pr * 3, pr, fq * fq), s = 1.15;
      const g = cell(i);
      // 保留原归位时刻；独立动作在全部归位后保持。
      const sn = prog(t, 27.65 + i * 0.004, 28.05 + i * 0.004, quintInOut);
      x = lerp(x, g.x, sn); y = lerp(y, g.y, sn); r = lerp(r, 0, sn); s = lerp(s, 1, sn);
      return <GlassFrame key={i} t={t} small style={{position: 'absolute', left: x, top: y, width: GRID.w, height: GRID.h, transform: `rotate(${r}deg) scale(${s})`, opacity: 1}}>
        <img src={asset(`thumbs/${id}.webp`)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        {sn > 0.9 && <div style={{position: 'absolute', left: 4, bottom: 4, ...mono(14, 'rgba(242,241,236,.82)'),
          lineHeight: '18px', padding: '0 4px', borderRadius: 3, background: 'rgba(10,10,11,.72)'}}>{String(i + 1).padStart(3, '0')}</div>}
      </GlassFrame>;
    })}
</>;
};
const TRASH_ASSETS = [
  {file: 'paper.webp', name: '废纸团', size: 116},
  {file: 'can.webp', name: '压扁易拉罐', size: 112},
  {file: 'bottle.webp', name: '皱塑料瓶', size: 108},
  {file: 'banana.webp', name: '香蕉皮', size: 116},
  {file: 'carton.webp', name: '旧纸盒', size: 116},
  {file: 'bag.webp', name: '垃圾袋', size: 124},
];
const Trash = ({t, i, phase, asset: resolveAsset}) => {
  const pose = garbageTrashAt(t, i, phase);
  if (!pose) return null;
  const asset = TRASH_ASSETS[pose.assetIndex ?? i % TRASH_ASSETS.length];
  const size = asset.size * pose.scale;
  return <img src={resolveAsset(`trash-collage/${asset.file}`)} alt={asset.name} data-trash-phase={phase} data-trash-index={i}
    style={{position: 'absolute', left: pose.x - size / 2, top: pose.y - size / 2, width: size, height: size, objectFit: 'contain',
      opacity: pose.opacity, transform: `rotate(${pose.angle}deg) scaleX(${pose.flip ?? 1})`, zIndex: pose.layer, pointerEvents: 'none'}} />;
};

export function GarbageFlow({t, asset}) {
 const box=springy(t,22.35,.5,.3), machine=garbageBoxAt(t),led=Math.floor(t*6)%2;
 return <>
  {t < 23.19 && <KLine t={t} li={9} rows={['垃圾进']} x={GARBAGE_TITLE.x} y={GARBAGE_TITLE.y} w={GARBAGE_TITLE.width} size={GARBAGE_TITLE.size} mode="slam"
    charStyle={(i,ch,elapsed)=>{const morph=garbageInputMorph(t,i);return {opacity:clamp(elapsed/.14)*(1-morph),...(morph>0?{filter:`blur(${morph*8}px)`}:{})};}} />}
  {Array.from({length:6},(_,i)=><Trash key={'in'+i} t={t} i={i} phase="in" asset={asset} />)}
  <div style={{position:'absolute',inset:0,zIndex:0}}>{Array.from({length:GARBAGE_OUTPUT_COUNT},(_,i)=><Trash key={i} t={t} i={i} phase="out" asset={asset} />)}</div>
  <GlassFrame t={t} data-garbage-model="" style={{position:'absolute',left:machine.x-machine.w/2,top:machine.y-machine.h/2,width:machine.w,height:machine.h,transform:`scale(${box})`}}>
   <div style={{position:'absolute',left:0,right:0,top:90,textAlign:'center',font:'110px/1 "Oswald"',color:C.ink}}>AI</div>
   <div style={{position:'absolute',left:26,top:22,width:16,height:16,borderRadius:8,background:led?C.accent:'#2a2c44'}} />
   <div style={{position:'absolute',right:24,top:18,...mono(16)}}>MODEL</div>
   <div style={{position:'absolute',left:110,right:110,top:-6,height:12,background:C.bg}} />
   <div style={{position:'absolute',left:110,right:110,bottom:-6,height:12,background:C.bg}} />
  </GlassFrame>
  <KLine t={t} li={9} rows={['垃圾出']} x={GARBAGE_TITLE.x} y={1056} w={GARBAGE_TITLE.width} size={200} mode="rise" lead={0} dur={0.22} color={C.accent} />
 </>;
}
export const Mosaic = ({t, cols = 5, tw = 240, th = 135, speed = 160, seed = 0, asset}) => {
  const rows = 14;
  const travel = Math.max(0, t) * speed;
  const firstRow = Math.floor(travel / (th + 6));
  const off = travel - firstRow * (th + 6);
  return <div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: '#111'}}>
    {Array.from({length: rows * cols}, (_, i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const catalogRow = firstRow + r, tile = catalogRow * cols + c;
      const id = THUMBS[(tile * 7 + seed) % THUMBS.length];
      return <img key={tile} src={asset(`thumbs/${id}.webp`)} style={{position: 'absolute', left: c * (tw + 6) - (catalogRow % 2) * 120, top: r * (th + 6) - off, width: tw, height: th, objectFit: 'cover'}} />;
    })}
  </div>;
};
export const BigNum = ({t, digits, times, cx, cy, size, id, asset}) => {
  const txt = digits.split('').map((d, i) => t >= times[i] - 0.03 ? d : '').join('');
  const s = springy(t, times[times.length - 1], 0.5, 0.35);
  return <svg width={W} height={H} style={{position: 'absolute', inset: 0, width: W, height: H}}>
    <defs><clipPath id={id}><text x={cx} y={cy} textAnchor="middle" style={{font: `${size}px ${F.oswald}`}}>{txt}</text></clipPath></defs>
    <foreignObject x={0} y={0} width={W} height={H} clipPath={`url(#${id})`}>
      <div style={{width: W, height: H, position: 'relative'}}><Mosaic t={t} speed={480} seed={15} asset={asset} /></div>
    </foreignObject>
    <text x={cx} y={cy} textAnchor="middle" style={{font: `${size}px ${F.oswald}`, fill: 'none', stroke: C.bg, strokeWidth: 10, opacity: 0.55 * s}}>{txt}</text>
    <text x={cx} y={cy} textAnchor="middle" style={{font: `${size}px ${F.oswald}`, fill: 'none', stroke: C.accent, strokeWidth: 3, opacity: 0.95 * s}}>{txt}</text>
  </svg>;
};

export function MaskScroll({t,asset,digits='288'}) {
 const id=useId();
 return <><div style={{position:'absolute',inset:0,opacity:.03}}><Mosaic t={t} seed={3} asset={asset} /></div>
  <BigNum t={t} digits={digits} times={[...digits].map(()=>0)} cx={540} cy={820} size={540} id={id} asset={asset} />
 </>;
}
