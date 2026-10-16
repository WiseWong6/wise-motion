import {windowState as previousWindowState, key, tween, contains} from './windows-v3.mjs';

export {key, tween, contains};

const rect = (cx, cy, width, height, angle = 0) => ({type: 'rect', cx, cy, width, height, angle});

// Keep the earlier choreography intact outside these two revised passages.
export function windowState(frame) {
  if (!Number.isFinite(frame)) throw new TypeError('Frame must be finite');

  if (frame >= 164 && frame < 252) {
    const cx = key(frame, [[164, 1230], [220, 1190]]);
    const cy = key(frame, [[164, 540], [220, 450]]);
    const arm = key(frame, [[164, 3600], [176, 1200, 'inCubic'], [182, 1200], [202, 3600], [252, 3600]]);
    const stroke = key(frame, [[164, 1084], [176, 440, 'inCubic'], [232, 440], [252, 3000, 'outCubic']]);
    const angle = key(frame, [[164, 0], [180, -28, 'outCubic'], [252, -28]]);
    return {phrase: 'diagonal-cross-through-tool', shapes: [
      rect(cx, cy, arm, stroke, angle),
      rect(cx, cy, stroke, arm, angle),
    ]};
  }

  if (frame >= 280 && frame < 384) {
    const height = key(frame, [[280, 1084], [292, 820, 'inCubic'], [320, 900], [360, 1000], [384, 1084]]);
    return {phrase: 'continuous-mechanism-panel', shapes: [rect(960, 540, 1924, height)]};
  }

  return previousWindowState(frame);
}
