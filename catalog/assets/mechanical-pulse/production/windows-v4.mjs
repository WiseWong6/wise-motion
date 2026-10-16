import {key, tween, contains} from './windows-v3.mjs';
import {windowState as previousWindowState} from './windows-v32.mjs';

export {key, tween, contains};

const rect = (cx, cy, width, height, angle = 0) => ({type: 'rect', cx, cy, width, height, angle});
const full = () => ({phrase: 'full', shapes: [rect(960, 540, 1924, 1084)]});
const easeInQuad = p => p * p;

// The final diagonal stroke covers the canvas with 2 px bleed. Its 3600 px
// length already covers the projection along the other axis.
const rotation = 28 * Math.PI / 180;
const crossOpenWidth = 2 * Math.max(...[[-2,-2],[1922,-2],[-2,1082],[1922,1082]].map(([x,y]) =>
  Math.abs((x-1190)*Math.sin(rotation)+(y-450)*Math.cos(rotation))
)) + 4;

export function windowState(frame) {
  if (!Number.isFinite(frame)) throw new TypeError('Frame must be finite');

  if (frame >= 330) return full();

  if (frame >= 158 && frame < 248) {
    const cx = key(frame, [[158,1230],[180,1230],[220,1190]]);
    const cy = key(frame, [[158,540],[180,540],[220,450]]);
    // One uninterrupted width curve crosses the tool edit. The aperture does
    // not stop when its center reaches the tool axis at F220.
    const stroke = key(frame, [[158,1084],[168,600,'inCubic'],[170,600],[179,520],[202,520],[240,crossOpenWidth,easeInQuad],[248,crossOpenWidth]]);
    const angle = key(frame, [[158,0],[170,0],[179,-28,'outCubic'],[248,-28]]);
    return {phrase: 'moving-cross-through-tool', shapes: [
      rect(cx,cy,3600,stroke,angle),
      rect(cx,cy,stroke,3600,angle),
    ]};
  }

  if (frame >= 280 && frame < 330) {
    // One expansion for the three raw, full-frame macro shots. F280 is an
    // intentional cut into a small aperture; neither later edit restarts it.
    const side = key(frame, [[280,720],[300,1300],[320,1900],[330,2132]]);
    return {phrase: 'one-macro-diamond-release', shapes: [rect(960,540,side,side,45)]};
  }

  return previousWindowState(frame);
}
