const clamp = x => Math.min(1, Math.max(0, x));
const lerp = (a, b, p) => a + (b - a) * p;
const progress = (t, a, b) => {
  const p = clamp((t - a) / (b - a));
  return p * p * (3 - 2 * p);
};

export const GARBAGE_BOX = {x: 540, y: 760, w: 360, h: 300};
export const GARBAGE_TITLE = {x: 360, y: 132, size: 120, width: 360};
const SCATTER_COUNT = 36;
// 用轮廓饱满的垃圾填住底部中央，避免随机落点留下大块缺口。
const PILE_FILL = [
  {x: 452, y: 930, scale: 1.10, angle: 32, assetIndex: 4},
  {x: 490, y: 956, scale: 1.04, angle: -24, assetIndex: 0},
  {x: 534, y: 925, scale: 1.14, angle: 17, assetIndex: 5},
  {x: 578, y: 950, scale: 1.10, angle: -41, assetIndex: 4},
  {x: 618, y: 930, scale: 1.06, angle: 53, assetIndex: 0},
  {x: 546, y: 966, scale: 1.04, angle: -8, assetIndex: 0},
  {x: 486, y: 900, scale: 0.94, angle: -63, assetIndex: 0},
  // 去掉“垃圾出”文案后，用纸盒、废纸、瓶罐和垃圾袋接满原文字区域。
  {x: 414, y: 1020, scale: 1.04, angle: -19, assetIndex: 4},
  {x: 476, y: 1046, scale: 1.00, angle: 27, assetIndex: 0},
  {x: 536, y: 1016, scale: 1.12, angle: -14, assetIndex: 5},
  {x: 592, y: 1048, scale: 1.05, angle: 39, assetIndex: 2},
  {x: 662, y: 1028, scale: 1.02, angle: -33, assetIndex: 1},
  {x: 546, y: 1074, scale: 1.02, angle: 13, assetIndex: 0},
];
export const GARBAGE_OUTPUT_COUNT = SCATTER_COUNT + PILE_FILL.length + 18;

// 固定每件垃圾的散落参数，拖动时间轴时仍会落在同一位置。
const scatter = (index, salt) => {
  const n = Math.sin((index + 1) * 127.1 + salt * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
const OUTPUT_PIECES = Array.from({length: GARBAGE_OUTPUT_COUNT}, (_, index) => {
  // 下层铺开、上层收窄；位置加偏移，让交叠形成不规则的垃圾堆。
  const tier = index < 15 ? 0 : index < 29 ? 1 : 2;
  const fill = PILE_FILL[index - SCATTER_COUNT];
  return {
    x: GARBAGE_BOX.x + (scatter(index, 1) * 2 - 1) * [290, 225, 130][tier],
    y: [948, 870, 798][tier] + (scatter(index, 2) * 2 - 1) * 28,
    scale: 0.64 + scatter(index, 3) * 0.50,
    angle: scatter(index, 4) * 360 - 180,
    spin: (scatter(index, 5) > 0.5 ? 1 : -1) * (120 + scatter(index, 6) * 200),
    start: fill ? 23.52 + (index - SCATTER_COUNT) * 0.014
      : 23.47 + index / (SCATTER_COUNT - 1) * 0.13 + scatter(index, 7) * 0.02,
    duration: 0.30 + scatter(index, 8) * 0.09,
    rebound: 0.10 + scatter(index, 9) * 0.04,
    assetIndex: Math.floor(scatter(index, 10) * 6),
    flip: scatter(index, 11) > 0.5 ? 1 : -1,
    ...fill,
  };
});

// 最后一组输入在 23.34 秒进入模型，随后上移，给输出腾出下落空间。
export const garbageBoxAt = t => ({...GARBAGE_BOX,
  y: lerp(GARBAGE_BOX.y, 300, progress(t, 23.35, 23.52)),
});

export const garbageInputMorph = (t, charIndex) => {
  const start = 23.04 + charIndex * 0.03;
  return progress(t, start, start + 0.09);
};

export const garbageTrashAt = (t, index, phase) => {
  if (phase === 'out') {
    const base = OUTPUT_PIECES[index];
    const stream = index >= SCATTER_COUNT + PILE_FILL.length;
    const foreground = stream && index >= GARBAGE_OUTPUT_COUNT - 6;
    const piece = base && {...base,
      x: foreground ? (index % 2 ? 1015 : 65) + (index % 3 - 1) * 42 : 540 + (base.x - 540) * 1.55,
      y: foreground ? 1130 + (index % 3) * 70 : 1090 + (base.y - 948) * 1.45,
      scale: base.scale * (foreground ? 2.7 : stream ? .9 : 1.7),
      start: foreground ? 23.49 : stream ? 23.65 + (index - SCATTER_COUNT - PILE_FILL.length) * .022 : base.start,
      duration: foreground ? .36 : stream ? .48 : .42,
    };
    if (!piece || t < piece.start) return null;
    const q = clamp((t - piece.start) / piece.duration);
    const settle = clamp((t - piece.start - piece.duration) / piece.rebound);
    const bounce = Math.sin(settle * Math.PI) * (1 - settle);
    const x0 = GARBAGE_BOX.x + (scatter(index, 12) * 2 - 1) * 52;
    const y0 = garbageBoxAt(piece.start).y + GARBAGE_BOX.h / 2 - 20;
    return {
      x: lerp(x0, piece.x, 1 - (1 - q) ** 2)
        + Math.sin(q * Math.PI) * (scatter(index, 13) * 2 - 1) * 38
        + bounce * (scatter(index, 14) * 2 - 1) * 22,
      y: lerp(y0, piece.y, q * q) - Math.sin(q * Math.PI) * 24
        - bounce * (14 + scatter(index, 15) * 20),
      opacity: progress(t, piece.start, piece.start + 0.035),
      angle: piece.angle + piece.spin * (1 - q) + bounce * piece.spin * 0.12,
      scale: piece.scale * lerp(foreground ? 0.18 : 0.68, 1, q),
      assetIndex: piece.assetIndex,
      flip: piece.flip,
      layer: Math.round(piece.y),
      blur: foreground ? 2.2 : 0,
    };
  }
  const charIndex = Math.floor(index / 2);
  const start = 23.04 + charIndex * 0.03;
  if (t < start) return null;
  const duration = 0.24;
  const q = clamp((t - start) / duration);
  if (q >= 1) return null;
  const slot = GARBAGE_BOX.x + (index - 2.5) * 16;
  const x0 = GARBAGE_TITLE.x + (charIndex + 0.5) * GARBAGE_TITLE.size + (index % 2 ? 22 : -22);
  const y0 = GARBAGE_TITLE.y + GARBAGE_TITLE.size * 0.61 + (index % 2 ? 18 : -18);
  const y1 = GARBAGE_BOX.y - GARBAGE_BOX.h / 2 + 24;
  const opacity = garbageInputMorph(t, charIndex) * (1 - progress(t, start + 0.20, start + duration));
  return {x: lerp(x0, slot, q * q), y: lerp(y0, y1, q * q), opacity,
    angle: (index % 2 ? 1 : -1) * (12 + q * 115),
    scale: lerp(0.76, 0.88, q),
  };
};
