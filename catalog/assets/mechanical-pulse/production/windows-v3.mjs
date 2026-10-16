// Original frame-driven aperture choreography, in 1920 x 1080 composition pixels.
// This clock belongs outside picture Sequences so edits cannot restart a shape.
export const clamp = value => Math.max(0, Math.min(1, value));

const curves = {
  linear: p => p,
  inCubic: p => p * p * p,
  outCubic: p => 1 - (1 - p) ** 3,
};

// Linear by default: a keyframe is not automatically a stop in the movement.
export function tween(frame, start, end, from, to, easing = 'linear') {
  const p = end === start ? Number(frame >= end) : clamp((frame - start) / (end - start));
  const curve = typeof easing === 'function' ? easing : curves[easing];
  if (!curve) throw new RangeError(`Unknown easing: ${easing}`);
  return from + (to - from) * curve(p);
}

// Optional third entry selects the arrival segment's easing: [frame, value, easing].
export function key(frame, points) {
  if (!points.length) throw new RangeError('Keyframes cannot be empty');
  if (frame <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    if (frame <= points[i][0]) {
      return tween(frame, points[i - 1][0], points[i][0], points[i - 1][1], points[i][1], points[i][2] ?? 'linear');
    }
  }
  return points.at(-1)[1];
}

const rect = (cx, cy, width, height, angle = 0) => ({type: 'rect', cx, cy, width, height, angle});
const circle = (cx, cy, r) => ({type: 'circle', cx, cy, r});
const full = () => ({phrase: 'full', shapes: [rect(960, 540, 1924, 1084)]});
const fullRadius = (cx, cy) => Math.hypot(Math.max(cx + 2, 1922 - cx), Math.max(cy + 2, 1082 - cy)) + 1;

export function windowState(frame) {
  if (!Number.isFinite(frame)) throw new TypeError('Frame must be finite');
  const f = Math.max(0, frame);

  if (f < 22) {
    return {phrase: 'opening-columns', shapes: [
      rect(320, 540, 644, tween(f, 0, 12, 0, 1084, 'outCubic')),
      rect(960, 540, 644, tween(f, 4, 17, 0, 1084, 'outCubic')),
      rect(1600, 540, 644, tween(f, 8, 22, 0, 1084, 'outCubic')),
    ]};
  }

  // In particular, the complete drawing/parts interval F40–139 is never clipped.
  if (f >= 164 && f < 198) {
    const arm = key(f, [[164, 2800], [176, 980, 'inCubic'], [181, 980], [191, 2800], [198, 2800]]);
    const stroke = key(f, [[164, 1084], [176, 260, 'inCubic'], [191, 260], [198, 1084]]);
    return {phrase: 'finite-cross', shapes: [
      rect(1230, 540, arm, stroke),
      rect(1230, 540, stroke, arm),
    ]};
  }

  if (f >= 214 && f < 240) {
    const r = key(f, [[214, fullRadius(1190, 450)], [224, 270, 'inCubic'], [228, 270], [240, fullRadius(1190, 450), 'outCubic']]);
    return {phrase: 'tool-circle', shapes: [circle(1190, 450, r)]};
  }

  if (f >= 294 && f < 324) {
    const width = key(f, [[294, 1924], [300, 750, 'inCubic'], [307, 750], [320, 1924], [324, 1924]]);
    const height = key(f, [[294, 1084], [300, 500, 'inCubic'], [307, 500], [320, 700], [324, 1084]]);
    return {phrase: 'mechanism-panel', shapes: [rect(960, 540, width, height)]};
  }

  if (f >= 326 && f < 350) {
    const height = key(f, [[326, 1084], [334, 230, 'inCubic'], [338, 230], [350, 1084, 'outCubic']]);
    return {phrase: 'gear-slot', shapes: [rect(960, 540, 1924, height)]};
  }

  if (f >= 354 && f < 384) {
    const r = key(f, [[354, 1200], [362, 270, 'inCubic'], [366, 270], [384, 1200, 'outCubic']]);
    return {phrase: 'balance-circle', shapes: [circle(960, 540, r)]};
  }

  if (f >= 456 && f < 496) {
    // The 704 px resting width overlaps adjacent columns and bleeds past both edges.
    const widths = [[482, 488], [486, 492], [490, 496]].map(([start, end]) =>
      key(f, [[456, 704], [466, 250, 'inCubic'], [start, 250], [end, 704, 'outCubic']])
    );
    return {phrase: 'three-column-release', shapes: [350, 960, 1570].map((cx, i) => rect(cx, 540, widths[i], 2400))};
  }

  return full();
}

export function contains(shape, x, y) {
  if (shape.type === 'circle') return Math.hypot(x - shape.cx, y - shape.cy) <= shape.r;
  const radians = -shape.angle * Math.PI / 180;
  const dx = x - shape.cx, dy = y - shape.cy;
  const localX = dx * Math.cos(radians) - dy * Math.sin(radians);
  const localY = dx * Math.sin(radians) + dy * Math.cos(radians);
  return Math.abs(localX) <= shape.width / 2 && Math.abs(localY) <= shape.height / 2;
}
