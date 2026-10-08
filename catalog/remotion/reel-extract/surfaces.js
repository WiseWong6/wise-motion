import {C} from './colors.js';

// 全片界面外框：参考 Wise Motion 的 glass-light.js 银白反光与透光层。
// 作品本身的纸张、插画、圆形与刻意粗糙的对照内容保留原材质。
export const SURFACE = Object.freeze({
  radius: Object.freeze({frame: 18, small: 6}),
  line: Object.freeze({frame: 1.5, divider: 1, icon: 2}),
});

export const glassPalette = (selected = false) => selected
  ? [`${C.accentPale}e0`, `${C.accentLight}7a`, `${C.accent}b3`, `${C.accentPale}b8`]
  : ['rgba(255,255,255,.52)', 'rgba(226,229,239,.18)', 'rgba(182,190,208,.12)', 'rgba(245,247,255,.32)'];

export const glassStyle = ({t = 0, small = false, selected = false} = {}) => {
  const light = 24 + 7 * Math.sin(t * .32);
  return {
    borderRadius: small ? SURFACE.radius.small : SURFACE.radius.frame,
    border: 0, outline: 'none', boxSizing: 'border-box',
    background: `radial-gradient(ellipse at ${light}% 0%, rgba(255,255,255,.075), transparent 66%), linear-gradient(145deg, rgba(36,38,43,.94), rgba(16,18,21,.96) 68%, rgba(25,28,32,.94))`,
    backdropFilter: `blur(${small ? 8 : 14}px) saturate(115%)`, WebkitBackdropFilter: `blur(${small ? 8 : 14}px) saturate(115%)`,
    boxShadow: `${small ? '0 3px 8px rgba(0,0,0,.18)' : '0 16px 36px rgba(0,0,0,.26)'}, inset 0 1px 0 rgba(255,255,255,.08)${selected ? `, inset 0 0 18px ${C.accent}12` : ''}`,
  };
};

// 画布中的素材缩略图与网页界面共用圆角及描边；保留原图片和扫描时间。
export const paintGlassImage = (c, image, w, h, {selected = false, lit = false} = {}) => {
  const r = Math.min(SURFACE.radius.small, w / 2, h / 2);
  const line = SURFACE.line.frame, inset = line / 2;
  c.save();
  c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, r); c.clip();
  c.drawImage(image, -w / 2, -h / 2, w, h);
  c.restore();
  const edge = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  glassPalette(selected).forEach((color, i) => edge.addColorStop([0, .28, .60, 1][i], color));
  c.save();
  if (lit) { c.shadowColor = '#E5EBF2'; c.shadowBlur = 10; }
  c.beginPath();
  c.roundRect(-w / 2 + inset, -h / 2 + inset, w - line, h - line, r - inset);
  c.strokeStyle = edge; c.lineWidth = line; c.stroke();
  c.restore();
};
