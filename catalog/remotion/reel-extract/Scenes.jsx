// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
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
import {ActualEffect} from './ActualEffect.jsx';
import {definitions as NESTED,fills as FILLS,counts as COUNTS} from './nested-data.json';
export const THUMBS = THUMB_IDS.filter(id => !['spiral-galaxy-illustration', 'encore-umbrella-illustration', 'material-evolution-sequence'].includes(id));
export const CATALOG_THUMBS = [...THUMBS, ...CATALOG_FILL.map(([id]) => id)];
const W=1080, H=1440, M=72, MX=72, CW=936, COL_W=296, COLS=[72,392,712];
const F={bold:'"Oswald", "Source Han Sans SC", sans-serif',reg:'"Source Han Sans SC", sans-serif',oswald:'"Oswald", sans-serif'};
const T={body:36,h1:80,label:24,micro:16};
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
export const WHEEL_CELL = 296;
const WHEEL_IMAGE_W = COL_W - 16, WHEEL_IMAGE_H = WHEEL_IMAGE_W * 9 / 16;
export const WHEEL_ITEM_H = WHEEL_IMAGE_H + 12 + 36;
const MATCH_PANEL_PAD_X=24, MATCH_PANEL_H=WHEEL_ITEM_H+64;
const MATCH_PANEL_TOP=WHEEL_TOP+WHEEL_H/2-MATCH_PANEL_H/2;
export const wheelPosition = (t, start, stopAt, target) => {
  const speed = 3000, brake = Math.min(0.32, stopAt - start);
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
      return <div key={row} style={{position: 'absolute', left: 0, right: 0, top: WHEEL_H / 2 - WHEEL_ITEM_H / 2,
        height: WHEEL_ITEM_H, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        boxSizing: 'border-box', whiteSpace: 'nowrap', color: selected ? C.accent : C.ink,
        opacity: locked ? (selected ? 1 : facing ** 2 * 0.16) : facing ** 2 * (0.48 + 0.52 * focus),
        transform: `translateY(${radius * Math.sin(angle)}px) scale(${.9 + .1 * focus})`}}>
        <div style={{position: 'relative', overflow: 'hidden', borderRadius: SURFACE.radius.small,
          width: WHEEL_IMAGE_W, height: WHEEL_IMAGE_H, flexShrink: 0}}>
        {item.preview ? <MatchPreview kind={item.preview} t={t} width={WHEEL_IMAGE_W} height={WHEEL_IMAGE_H} /> : <img src={asset(`thumbs/${item.id}.webp`)} alt={item.name} style={{display: 'block', width: WHEEL_IMAGE_W, height: WHEEL_IMAGE_H, objectFit: 'contain'}} />}
        </div>
        <div data-match-title="" style={{width: WHEEL_IMAGE_W, height: 36, flexShrink: 0, textAlign: 'center', whiteSpace: 'nowrap', font: `${T.label}px/36px ${F.bold}`}}>
          {item.name}
        </div>
      </div>;
    })}
  </div>;
};

const MatchLighting = ({t}) => {
  const id=useId(), ribbon=`match-ribbon-${id}`, haze=`match-haze-${id}`, soft=`match-soft-${id}`;
  const appear = prog(t, 42.6, 42.9), lock = prog(t, 43.7, 44.24);
  const drift = Math.sin((t - 42.6) * 1.4) * 10;
  return <div data-match-lighting="" style={{position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: appear}}>
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, width: W, height: H, opacity: .7 + .3 * lock}}>
      <defs>
        <linearGradient id={ribbon} x1="0" y1="0" x2="1" y2=".5">
          <stop stopColor={C.accent} stopOpacity="0" /><stop offset=".35" stopColor={C.accent} stopOpacity=".12" />
          <stop offset=".72" stopColor={C.accentLight} stopOpacity=".65" /><stop offset="1" stopColor={C.accent} stopOpacity="0" />
        </linearGradient>
        <filter id={haze}><feGaussianBlur stdDeviation="7" /></filter>
        <filter id={soft}><feGaussianBlur stdDeviation="1.2" /></filter>
      </defs>
      {[`M 1030 -60 C 900 110 985 220 745 ${410 + drift} S 400 480 -80 310`,
        `M -100 1510 Q 430 ${1210 + drift} 1120 1110`].map((d, i) => <g key={i}>
        <path d={d} fill="none" stroke={`url(#${ribbon})`} strokeWidth={i === 0 ? 18 : 7} opacity=".3" filter={`url(#${haze})`} />
        <path d={d} fill="none" stroke={`url(#${ribbon})`} strokeWidth={i === 0 ? 3 : 1.2} opacity=".7" filter={`url(#${soft})`} />
      </g>)}
    </svg>
    {[{x: MX - MATCH_PANEL_PAD_X + 20, y: MATCH_PANEL_TOP + 180, w: 90, h: 140},
      {x: MX + CW + MATCH_PANEL_PAD_X - 8, y: MATCH_PANEL_TOP + 125, w: 70, h: 120},
      {x: 415, y: MATCH_PANEL_TOP, w: 230, h: 55}].map((point, i) =>
      <div key={i} style={{position: 'absolute', left: point.x - point.w / 2, top: point.y - point.h / 2, width: point.w, height: point.h,
        background: `radial-gradient(ellipse, ${C.accentLight}a0, ${C.accent}38 24%, transparent 68%)`, filter: 'blur(5px)', opacity: .5 + .5 * lock}} />)}
  </div>;
};

export function ImagePicker({t, asset}) {
  return <>
    <MatchLighting t={t} />
    <GlassFrame t={t} selected edgeOpacity={.85} style={{position:'absolute',left:MX-MATCH_PANEL_PAD_X,top:MATCH_PANEL_TOP,width:CW+MATCH_PANEL_PAD_X*2,height:MATCH_PANEL_H,zIndex:0,
      background:'linear-gradient(145deg, rgba(209,242,229,.07), rgba(7,13,11,.88) 38%, rgba(9,18,15,.84))',backdropFilter:'none',WebkitBackdropFilter:'none',
      boxShadow:`0 0 7px ${C.accentLight}35, 0 0 22px ${C.accent}22, inset 0 1px 0 ${C.accentPale}24`}} />
    {MATCH_POOLS.map((items,i)=><Reel key={i} t={t} x={COLS[i]} start={42.6} stopAt={[43.7,43.92,44.14][i]} target={[1,2,1][i]} items={items} asset={asset} />)}
    <div data-match-result="" style={{position:'absolute',left:MX,width:CW,top:MATCH_PANEL_TOP+MATCH_PANEL_H-22,zIndex:3,display:'flex',justifyContent:'center',opacity:prog(t,44.24,44.36)}}>
      <div style={{width:280,height:72,borderRadius:36,display:'flex',alignItems:'center',justifyContent:'center',gap:22,border:`1.5px solid ${C.accent}`,color:C.accent,
        background:'linear-gradient(180deg, #10261d, #07120d 70%)',boxShadow:`0 0 10px ${C.accent}50, inset 0 1px 0 ${C.accentLight}50`,font:`36px/1 ${F.bold}`}}>
        已匹配<svg width="38" height="38" viewBox="0 0 38 38" style={{width:38,height:38}}><circle cx="19" cy="19" r="18" fill={C.accent}/><path d="m11 19 5 5 11-12" fill="none" stroke={C.accentDeep} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
    </div>
  </>;
}
const GRID = {cols: 4, rows: 5, w: 222, gapX: 16, gapY: 20, x0: M, y0: 432};
GRID.h = GRID.w * 9 / 16;
const cell = i => ({x: GRID.x0 + (i % GRID.cols) * (GRID.w + GRID.gapX), y: GRID.y0 + Math.floor(i / GRID.cols) * (GRID.h + GRID.gapY)});
const CATALOG_FINAL = CATALOG_THUMBS.filter(id=>id!=="paper-spiral-sequence").slice(0,19).concat("paper-spiral-sequence");
export const CardStack = ({t,asset}) => <>
    {CATALOG_THUMBS.map((id, i) => {
      const at = 26.2 + rnd('ga', i) * .9;
      if (t < at) return null;
      const pileW = 146, pileH = pileW * 9 / 16;
      const px = M + rnd('px', i) * (CW - pileW);
      const py = 1230 - Math.floor(i / 6) * 34 - rnd('py', i) * 30;
      const pr = (rnd('pr', i) - .5) * 30;
      const fall = clamp((t - at) / .5);
      const bounce = fall >= 1 ? Math.exp(-(t - at - .5) * 8) * Math.sin((t - at - .5) * 30) * 10 : 0;
      const slot = CATALOG_FINAL.indexOf(id);
      const grow = prog(t, 27.65 + Math.max(0, slot) * .004, 28.05 + Math.max(0, slot) * .004, quintInOut);
      const g = slot >= 0 ? cell(slot) : {x: px, y: py};
      const x = lerp(px, g.x, grow), y = lerp(lerp(-200, py, fall * fall) - bounce, g.y, grow);
      const rotation = lerp(lerp(pr * 3, pr, fall * fall), 0, grow);
      const keep = id === "paper-spiral-sequence", out = 0;
      return <GlassFrame key={id} t={t} small selected={keep && t > 28.3}
        data-catalog-slot={slot} data-catalog-id={id}
        style={{position: 'absolute', left: x, top: y,
          width: lerp(pileW, GRID.w, grow), height: lerp(pileH, GRID.h, grow),
          transform: `rotate(${rotation}deg) scale(${lerp(1.15, 1, grow)})`,
          opacity: (slot < 0 ? 1 - grow : 1) * (keep ? 1 : 1 - out)}}>
        <img src={asset(`thumbs/${id}.webp`)} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
        {slot >= 0 && grow > .9 && <div style={{position: 'absolute', left: 8, bottom: 6, ...mono(T.micro, C.ink),
          lineHeight: '20px', padding: '0 4px', borderRadius: 3, background: 'rgba(10,10,11,.72)'}}>{String(i + 1).padStart(3, '0')}</div>}
      </GlassFrame>;
    })}
</>;
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
      opacity: pose.opacity, filter: `blur(${pose.blur ?? 0}px) drop-shadow(0 9px 7px rgba(0,0,0,.45))`, transform: `rotate(${pose.angle}deg) scaleX(${pose.flip ?? 1})`, zIndex: pose.layer, pointerEvents: 'none'}} />;
};

export function GarbageFlow({t, asset}) {
 const box=springy(t,22.35,.5,.3), machine=garbageBoxAt(t),led=Math.floor(t*6)%2;
 return <>
  {t < 23.19 && <KLine t={t} li={9} rows={['垃圾进']} x={GARBAGE_TITLE.x} y={GARBAGE_TITLE.y} w={GARBAGE_TITLE.width} size={GARBAGE_TITLE.size} mode="slam"
    charStyle={(i,ch,elapsed)=>{const morph=garbageInputMorph(t,i);return {opacity:clamp(elapsed/.14)*(1-morph),...(morph>0?{filter:`blur(${morph*8}px)`}:{})};}} />}
  {Array.from({length:6},(_,i)=><Trash key={'in'+i} t={t} i={i} phase="in" asset={asset} />)}
  <div style={{position:'absolute',inset:0,zIndex:0}}>{Array.from({length:GARBAGE_OUTPUT_COUNT},(_,i)=><Trash key={i} t={t} i={i} phase="out" asset={asset} />)}</div>
  <GlassFrame t={t} data-garbage-model="" style={{position:'absolute',left:machine.x-machine.w/2,top:machine.y-machine.h/2,width:machine.w,height:machine.h,transform:`scale(${box * 1.14})`}}>
   <div style={{position:'absolute',left:0,right:0,top:90,textAlign:'center',font:'110px/1 "Oswald"',color:C.ink}}>AI</div>
   <div style={{position:'absolute',left:26,top:22,width:16,height:16,borderRadius:8,background:led?C.accent:'#2a2c44'}} />
   <div style={{position:'absolute',right:24,top:18,...mono(16)}}>MODEL</div>
   <div style={{position:'absolute',left:110,right:110,top:-6,height:12,background:C.bg}} />
   <div style={{position:'absolute',left:110,right:110,bottom:-6,height:12,background:C.bg}} />
  </GlassFrame>
 </>;
}
export function MaskScroll({t,fillKind='action'}) {
 const id=useId(), fill=FILLS[fillKind], digits=COUNTS[fillKind];
 const centers=digits.length===3?[228,540,852]:[312,768];
 const size=fillKind==='action'?680:780,cy=930,top=cy-size*.82,height=size*.82;
 return <>{[...digits].map((digit,i)=>{
  const item=fill.items[i],clip=`number-${id}-${i}`,x=centers[i];
  const definition=NESTED[item.definitionId||item.id];
  const ms=Math.min(definition.duration_ms,item.offset+Math.max(0,t-48.1)*1000*item.speed);
  const effectH=height*(item.zoom||1.2),effectW=effectH*16/9;
  return <React.Fragment key={clip}>
   <svg width={W} height={H} style={{position:'absolute',inset:0,width:W,height:H,pointerEvents:'none'}}>
    <defs><clipPath id={clip} clipPathUnits="userSpaceOnUse"><text x={x} y={cy} textAnchor="middle" style={{font:`${size}px ${F.oswald}`}}>{digit}</text></clipPath></defs>
   </svg>
   <div data-number-digit={digit} data-number-fill={item.id} data-number-time={ms} style={{position:'absolute',inset:0,clipPath:`url(#${clip})`}}>
    <div style={{position:'absolute',left:x-effectW/2,top:top-(effectH-height)/2}}>
     <ActualEffect definition={definition} time={ms} width={effectW} height={effectH}/>
    </div>
   </div>
   <svg width={W} height={H} style={{position:'absolute',inset:0,width:W,height:H,pointerEvents:'none'}}><text x={x} y={cy} textAnchor="middle" style={{font:`${size}px ${F.oswald}`,fill:'none',stroke:C.accent,strokeWidth:3}}>{digit}</text></svg>
  </React.Fragment>;
 })}</>;
}
