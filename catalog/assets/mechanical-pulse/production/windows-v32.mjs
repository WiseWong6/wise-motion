import {key, tween, contains} from './windows-v3.mjs';
import {windowState as previousWindowState} from './windows-v31.mjs';

export {key, tween, contains};

const rect = (cx, cy, width, height, angle = 0) => ({type: 'rect', cx, cy, width, height, angle});

export function windowState(frame) {
  if (!Number.isFinite(frame)) throw new TypeError('Frame must be finite');

  if (frame >= 158 && frame < 248) {
    // Narrow the long cross first; rotation begins only after the brief hold.
    const cx = key(frame, [[158, 1230], [180, 1230], [220, 1190]]);
    const cy = key(frame, [[158, 540], [180, 540], [220, 450]]);
    const stroke = key(frame, [[158, 1084], [168, 600, 'inCubic'], [170, 600], [179, 520], [230, 520], [248, 3000, 'outCubic']]);
    const angle = key(frame, [[158, 0], [170, 0], [179, -28, 'outCubic'], [248, -28]]);
    return {phrase: 'long-cross-narrow-then-rotate', shapes: [
      rect(cx, cy, 3600, stroke, angle),
      rect(cx, cy, stroke, 3600, angle),
    ]};
  }

  // Explicitly finish the cross before the earlier revision's F252 boundary.
  if (frame >= 248 && frame < 252) {
    return {phrase: 'full', shapes: [rect(960, 540, 1924, 1084)]};
  }

  if (frame >= 280 && frame < 390) {
    // A single square grows through all three macro shots on one global clock.
    const side = key(frame, [[280, 720], [320, 1080], [360, 1540], [390, 2160]]);
    return {phrase: 'expanding-mechanism-diamond', shapes: [rect(960, 540, side, side, 45)]};
  }

  return previousWindowState(frame);
}
