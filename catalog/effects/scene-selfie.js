/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
/* 迁入自有原作，绘制函数与原数据共用；移除原界面、独立时钟和音频。 */
(function(global){
 global.WiseSceneSources.selfie=function(S,opt,def){

 {
 // Keep scene globals local without dynamic `with` lookup in every pixel loop.
 const window=S.env,globalThis=S.env,document=S.env.document;
/* 源视频连续的一轮：122–586 帧。提供动作顺序、倒计时和低头时序；
 * 原设定角色、足迹和自拍画面的对应关系由 Film 统一安排。 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.Choreography=api;
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const fps=60,sourceStart=122,sourceEnd=586,frameCount=465,duration=frameCount/fps;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=v=>(v=clamp(v),v*v*(3-2*v));
  const ramp=(f,a,b)=>smooth((f-a)/(b-a));
  const home={x:206,y:2},end={x:286,y:879};
  const length=Math.hypot(end.x-home.x,end.y-home.y);
  const direction=Math.atan2(end.x-home.x,end.y-home.y);
  const span=(a,b,extra={})=>Object.freeze({startFrame:a,endFrame:b,at:(a-sourceStart)/fps,until:(b+1-sourceStart)/fps,...extra});
  const events=Object.freeze({source:span(122,586),turn:span(133,177),outbound:span(178,278),
    press:span(282,287),fall:span(288,307),rise:span(308,317),returnTurn:span(318,337),
    returning:span(338,450),settled:span(535,586),countdown:Object.freeze([
      span(292,351,{number:3}),span(352,397,{number:2}),span(398,451,{number:1})])});
  function travel(f,a,b){
    const p=clamp((f-a)/(b-a)),e=.08;
    if(p<e)return p*p/(2*e*(1-e));
    if(p>1-e)return 1-(1-p)**2/(2*e*(1-e));
    return(p-e/2)/(1-e);
  }
  function at(time){
    const t=clamp(Number(time)||0,0,duration);
    const f=Math.min(sourceEnd,sourceStart+Math.floor(t*fps+1e-8));
    const progress=f<178?0:f<=278?travel(f,178,278):f<338?1:1-travel(f,338,450);
    const outbound=f>=178&&f<=278,returning=f>=338&&f<=450;
    const moving=outbound?Math.min(ramp(f,178,184),1-ramp(f,272,278)):
      returning?Math.min(ramp(f,338,344),1-ramp(f,444,450)):0;
    let yaw=direction+Math.PI,turn=0,turnProgress=0,turnStartYaw=yaw,turnEndYaw=direction;
    if(f>=133&&f<178){turn=-1;turnProgress=ramp(f,133,171);yaw=direction+Math.PI*(1-turnProgress);}
    else if(f>=178&&f<318)yaw=direction;
    else if(f>=318&&f<338){turn=1;turnStartYaw=direction;turnEndYaw=direction+Math.PI;turnProgress=ramp(f,318,337);yaw=direction+Math.PI*turnProgress;}
    const fall=f<288?0:f<=302?ramp(f,288,302):f<308?1:1-ramp(f,308,317);
    const lookDown=f<133?1.1:f<172?1.1*(1-ramp(f,133,159)):f<435?0:1.1*ramp(f,435,451);
    const headDip=f<451?0:f<465?.4*ramp(f,451,465):f<482?.4:.4*(1-ramp(f,482,500));
    const countdown=events.countdown.find(e=>f>=e.startFrame&&f<=e.endFrame);
    const phase=f<133?'ready':f<178?'turn':f<=278?'outbound':f<=287?'press':f<=307?'fall':
      f<=317?'rise':f<338?'returnTurn':f<=450?'returning':f<=500?'home':'settled';
    return {sourceFrame:f,progress,yaw,moving,distance:(returning||f>450?1-progress:progress)*length,
      fall,headDip,lookDown,turn,turnProgress,turnStartYaw,turnEndYaw,shutterPress:f>=282&&f<=287?1:0,
      countdown:countdown?countdown.number:0,phase};
  }
  return Object.freeze({fps,sourceStart,sourceEnd,frameCount,duration,home,end,length,direction,at,events});
});

/* The original six and three new coats share the white reference cat's geometry.
 * Xiaokui uses her approved character sheet, with her own proportions/markings.
 * Both models share the same gait; dye progress never changes their silhouettes.
 */
(function (root) {
  'use strict';
  const WHITE = '#FFFFFF', NAVY = '#172356', UNIT = 0.44;
  const clamp = x => Math.max(0, Math.min(1, x));
  const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const mod = (x, n) => ((x % n) + n) % n;
  function mapCommands(commands, transform) {
    return commands.map(([op, ...args]) => {
      const out = [op];
      for (let i = 0; i < args.length; i += 2) out.push(...transform(args[i], args[i + 1]));
      return out;
    });
  }
  const localPoint = (x, y) => [(x - 440) * UNIT, (y - 374) * UNIT];
  const local = commands => mapCommands(commands, localPoint);
  const BODY = local([
    ['M', 276, 281], ['C', 270, 237, 284, 200, 318, 183],
    ['C', 351, 163, 393, 163, 434, 173],
    ['C', 470, 161, 522, 184, 559, 204],
    ['C', 590, 216, 607, 223, 603, 245],
    ['C', 600, 275, 586, 302, 576, 322],
    ['C', 558, 333, 540, 329, 526, 309],
    ['C', 501, 307, 477, 312, 454, 313],
    ['C', 417, 320, 371, 329, 339, 317],
    ['C', 304, 313, 282, 307, 276, 281], ['Z']
  ]);
  const HEAD = local([
    ['M', 453, 90], ['C', 451, 69, 457, 33, 470, 26],
    ['C', 479, 21, 499, 39, 516, 49],
    ['C', 540, 40, 570, 39, 598, 47],
    ['C', 614, 34, 630, 18, 640, 26],
    ['C', 650, 35, 650, 69, 656, 91],
    ['C', 674, 113, 684, 145, 678, 174],
    ['C', 675, 212, 647, 234, 603, 244],
    ['C', 572, 255, 526, 258, 488, 241],
    ['C', 449, 225, 432, 199, 432, 167],
    ['C', 429, 140, 439, 111, 453, 90], ['Z']
  ]);
  const TAIL = local([
    ['M', 299, 221], ['C', 251, 214, 224, 183, 223, 144],
    ['C', 220, 116, 239, 83, 266, 72],
    ['C', 282, 65, 303, 69, 306, 84],
    ['C', 309, 99, 295, 106, 287, 115],
    ['C', 269, 137, 273, 164, 294, 176],
    ['C', 305, 183, 316, 186, 328, 187],
    ['L', 341, 211], ['Q', 320, 225, 299, 221], ['Z']
  ]);
  // Distinct bent hind legs and tapered front legs, not four repeated columns.
  const LEG_SHAPES = [
    [['M', 278, 274], ['C', 294, 259, 331, 275, 351, 295],
      ['C', 345, 313, 325, 327, 311, 335], ['Q', 307, 340, 312, 344],
      ['C', 325, 349, 323, 363, 314, 370], ['C', 307, 375, 285, 373, 276, 371],
      ['C', 263, 368, 259, 349, 258, 332], ['C', 255, 305, 265, 296, 278, 274], ['Z']],
    [['M', 351, 277], ['C', 366, 269, 394, 279, 409, 298],
      ['C', 403, 309, 395, 321, 392, 330], ['Q', 389, 337, 393, 341],
      ['C', 410, 345, 409, 361, 399, 368], ['C', 390, 375, 366, 371, 357, 368],
      ['C', 347, 362, 343, 350, 339, 337], ['C', 333, 316, 342, 298, 351, 277], ['Z']],
    [['M', 456, 259], ['C', 471, 249, 502, 260, 524, 281],
      ['C', 524, 299, 518, 323, 513, 340], ['C', 527, 346, 527, 360, 517, 370],
      ['C', 510, 376, 480, 375, 471, 371], ['C', 460, 366, 459, 345, 455, 324],
      ['C', 451, 301, 449, 279, 456, 259], ['Z']],
    [['M', 538, 244], ['C', 554, 234, 591, 231, 603, 244],
      ['C', 602, 278, 580, 311, 576, 333], ['Q', 574, 339, 580, 341],
      ['C', 596, 344, 597, 362, 584, 369], ['C', 574, 374, 548, 373, 540, 366],
      ['C', 529, 358, 526, 334, 525, 319], ['C', 523, 291, 531, 263, 538, 244], ['Z']]
  ].map(local);
  const ROOTS = [[306, 289], [367, 296], [486, 286], [559, 279]].map(p => localPoint(...p));
  const FEET = [[291, 373], [377, 372], [491, 374], [562, 372]].map(p => localPoint(...p));
  // Xiaokui is traced from 美术审核/小葵设定/小葵形象设定-v10.png. Keep the approved head/body
  // proportions and asymmetric markings instead of reshaping the white model.
  const xiaokuiPoint = (x, y) => [(x - 500) * 0.22, (y - 880) * 0.22];
  const xiaokuiPath = commands => mapCommands(commands, xiaokuiPoint);
  const XIAOKUI = {
    body: xiaokuiPath([
      ['M', 190, 613], ['C', 189, 566, 224, 515, 281, 486],
      ['C', 325, 464, 358, 445, 403, 431], ['C', 451, 416, 489, 426, 537, 421],
      ['C', 569, 419, 605, 414, 637, 404], ['C', 671, 397, 706, 419, 744, 441],
      ['C', 784, 452, 826, 464, 856, 486], ['C', 870, 500, 879, 509, 875, 541],
      ['C', 872, 584, 852, 637, 830, 684], ['C', 820, 707, 815, 717, 811, 722],
      ['C', 794, 751, 755, 758, 708, 741],
      ['C', 678, 720, 641, 720, 604, 729], ['C', 548, 735, 485, 744, 435, 748],
      ['C', 405, 751, 392, 770, 358, 777], ['C', 300, 803, 250, 787, 219, 765],
      ['C', 182, 740, 180, 690, 190, 613], ['Z']
    ]),
    head: xiaokuiPath([
      ['M', 649, 315], ['C', 643, 281, 645, 229, 660, 213],
      ['C', 673, 197, 714, 232, 740, 246], ['C', 770, 233, 806, 229, 838, 233],
      ['C', 859, 210, 886, 184, 906, 183], ['C', 930, 182, 938, 245, 938, 279],
      ['C', 962, 306, 979, 348, 978, 386], ['C', 976, 423, 959, 454, 930, 475],
      ['C', 906, 494, 879, 506, 852, 510], ['C', 811, 529, 748, 523, 706, 507],
      ['C', 655, 486, 627, 467, 624, 429], ['C', 618, 390, 631, 345, 649, 315], ['Z']
    ]),
    tail: xiaokuiPath([
      ['M', 231, 550], ['C', 167, 559, 109, 519, 77, 464],
      ['C', 51, 393, 60, 329, 95, 309], ['C', 127, 293, 159, 301, 163, 328],
      ['C', 171, 350, 158, 373, 160, 399], ['C', 160, 443, 182, 475, 228, 481],
      ['C', 258, 485, 289, 483, 321, 470], ['L', 352, 523],
      ['C', 293, 542, 264, 551, 231, 550], ['Z']
    ]),
    legs: [
      [['M', 206, 688], ['C', 227, 677, 271, 694, 319, 720],
        ['C', 300, 755, 270, 780, 248, 802], ['C', 245, 810, 247, 818, 251, 822],
        ['C', 271, 834, 273, 858, 256, 873], ['C', 244, 884, 207, 885, 188, 876],
        ['C', 163, 866, 155, 846, 152, 821], ['C', 148, 793, 154, 755, 170, 729],
        ['C', 187, 708, 190, 701, 206, 688], ['Z']],
      [['M', 299, 700], ['C', 326, 687, 402, 702, 437, 726],
        ['C', 444, 744, 426, 770, 416, 788], ['C', 411, 800, 408, 810, 418, 816],
        ['C', 435, 823, 442, 839, 435, 855], ['C', 431, 870, 414, 875, 403, 873],
        ['C', 382, 874, 357, 868, 338, 858], ['C', 321, 846, 311, 824, 305, 803],
        ['C', 294, 769, 291, 729, 299, 700], ['Z']],
      [['M', 583, 649], ['C', 616, 635, 675, 648, 698, 680],
        ['C', 714, 708, 717, 741, 713, 782], ['C', 710, 806, 716, 824, 726, 839],
        ['C', 739, 856, 734, 870, 717, 878], ['C', 702, 884, 666, 882, 650, 877],
        ['C', 631, 871, 619, 849, 613, 826], ['C', 604, 802, 600, 768, 600, 738],
        ['C', 596, 706, 581, 677, 583, 649], ['Z']],
      [['M', 743, 569], ['C', 771, 548, 835, 549, 866, 571],
        ['C', 859, 630, 838, 676, 823, 721], ['C', 811, 758, 804, 786, 808, 810],
        ['C', 828, 815, 839, 833, 834, 849], ['C', 827, 868, 804, 874, 781, 870],
        ['C', 757, 866, 741, 850, 732, 828], ['C', 715, 798, 711, 762, 715, 727],
        ['C', 718, 675, 728, 613, 743, 569], ['Z']]
    ].map(xiaokuiPath),
    roots: [[231, 739], [353, 733], [643, 701], [778, 655]].map(p => xiaokuiPoint(...p)),
    feet: [[219, 880], [403, 873], [687, 880], [797, 870]].map(p => xiaokuiPoint(...p)),
    tailRoot: xiaokuiPoint(270, 516),
    headMetrics: { width: 78, height: 64 }
  };
  const XIAOKUI_SHOULDER = xiaokuiPath([
    ['M', 548, 413], ['L', 603, 402], ['C', 602, 432, 613, 454, 632, 469],
    ['C', 652, 488, 669, 510, 688, 537], ['C', 704, 555, 709, 577, 700, 600],
    ['C', 697, 611, 692, 621, 688, 629], ['C', 709, 668, 717, 690, 713, 721],
    ['C', 711, 746, 701, 761, 682, 765], ['C', 659, 770, 632, 760, 615, 742],
    ['C', 603, 728, 606, 716, 602, 700], ['C', 597, 679, 578, 676, 560, 663],
    ['C', 531, 645, 513, 622, 504, 597], ['C', 488, 565, 490, 531, 499, 497],
    ['C', 509, 458, 524, 432, 548, 413], ['Z']
  ]);
  // Pointed, asymmetric locks follow the coat with varied spacing and height.
  function puffLocks(contour, sections, strength, whiteAt = () => false) {
    const locks = [];
    const spacing = [.82, 1.28, .68, 1.1, .92, 1.24, .76];
    const heights = [.76, 1.15, .50, .89, 1.27, .64, .95];
    for (const [segment, count, height, from = 0, to = 1, sweep = -.32] of sections) {
      const start = contour[segment - 1].slice(-2), args = contour[segment].slice(1);
      const at = t => {
        const u = 1 - t;
        const point = [0, 1].map(i => u ** 3 * start[i] + 3 * u * u * t * args[i] + 3 * u * t * t * args[i + 2] + t ** 3 * args[i + 4]);
        const tangent = [0, 1].map(i => 3 * u * u * (args[i] - start[i]) + 6 * u * t * (args[i + 2] - args[i]) + 3 * t * t * (args[i + 4] - args[i + 2]));
        const length = Math.hypot(...tangent);
        const direction = tangent.map(v => v / length);
        return { point, direction, normal: [direction[1], -direction[0]] };
      };
      const weights = Array.from({ length: count }, (_, i) => spacing[(i + segment * 2) % spacing.length]);
      const total = weights.reduce((a, b) => a + b, 0);
      let cursor = from;
      for (let i = 0; i < count; i++) {
        const step = (to - from) * weights[i] / total;
        const a = at(Math.max(from, cursor - step * .12));
        const b = at(Math.min(to, cursor + step * 1.12));
        const center = at(cursor + step * .54);
        const width = Math.hypot(b.point[0] - a.point[0], b.point[1] - a.point[1]);
        const rise = height * heights[(i + segment) % heights.length] * strength - 2.5;
        const lean = width * (sweep + [.16, -.22, .09, -.05][i % 4]) * strength;
        const offset = (frame, out, along = 0) => frame.point.map((v, axis) => v + frame.normal[axis] * out + frame.direction[axis] * along);
        locks.push({ white: whiteAt(center.point), commands: [
          ['M', ...offset(a, -3.2)],
          ['C', ...offset(a, -1.5), ...offset(center, rise * .16, lean - width * .40), ...offset(center, rise, lean)],
          ['C', ...offset(center, rise * .32, lean + width * .07), ...offset(b, -1.7), ...offset(b, -3.2)], ['Z']
        ] });
        cursor += step;
      }
    }
    return locks;
  }
  function model(state, time) {
    const shape = state.recipe?.kind === 'xiaokui' ? XIAOKUI : {
      body: BODY, head: HEAD, tail: TAIL, legs: LEG_SHAPES, roots: ROOTS, feet: FEET,
      tailRoot: localPoint(306, 204), headMetrics: { width: 109, height: 92 }
    };
    // Only Xiaokui can hiss or puff. Ordinary meows move the mouth alone;
    // missing reactions keep the approved standing/walking model unchanged.
    const reaction = shape === XIAOKUI ? {
      puff: clamp(state.reaction?.puff || 0), hiss: clamp(state.reaction?.hiss || 0)
    } : { puff: 0, hiss: 0, meow: clamp(state.reaction?.meow || 0) };
    const { puff, hiss } = reaction;
    const moving = ease(state.walking || 0);
    const distance = state.walkDistance == null ? state.x : state.walkDistance / 0.93;
    const stride = shape === XIAOKUI ? 40 : 52;
    const gait = distance / stride;
    const bob = Number.isFinite(state.bodyBob) ? state.bodyBob : Math.sin(gait * Math.PI * 4) * 0.4 * moving;
    const tailRoot = shape.tailRoot;
    const tailLift = clamp(state.tailLift || 0);
    // Her reference already includes the lifted tail: lift by rotation, not size.
    const tailAngle = Math.sin(time * 2 + state.index * 0.7) * 0.018 * moving
      - (shape === XIAOKUI ? (1 - tailLift) * 0.06 : 0);
    const tailScale = shape === XIAOKUI ? 1 : 1 + 0.16 * tailLift;
    const bodyTransform = (x, y) => {
      const arch = Math.max(0, 1 - ((x + 12) / 87) ** 2);
      return [x, y + bob - 27 * puff * arch * ease((-y - 43) / 49)];
    };
    const headTransform = (x, y) => {
      // Fold only the ears. Her forehead blaze, eyes and muzzle stay in place.
      const left = ease((52.8 - x) / 13.2), right = ease((x - 74.36) / 14.3);
      const fold = ease((-y - 127.6) / 20.9) * Math.max(puff, hiss);
      return [x + fold * (-9 * left + 8 * right), y + bob + fold * (left + right) * 16];
    };
    const tailTransform = (x, y) => {
      if (puff) {
        const tip = ease((-x - 50) / 29);
        const center = -86 + (y + 112) * 0.24;
        x += (x - center) * 1.15 * puff * tip;
        y -= 7 * puff * tip;
      }
      const dx = (x - tailRoot[0]) * tailScale;
      const dy = (y - tailRoot[1]) * tailScale;
      return [tailRoot[0] + dx * Math.cos(tailAngle) - dy * Math.sin(tailAngle),
        tailRoot[1] + bob + dx * Math.sin(tailAngle) + dy * Math.cos(tailAngle)];
    };
    const body = mapCommands(shape.body, bodyTransform);
    const head = mapCommands(shape.head, headTransform);
    const tail = mapCommands(shape.tail, tailTransform);
    const fur = puff ? [
      ...puffLocks(body, [[1, 4, 12], [2, 4, 16], [3, 3, 15], [4, 2, 11], [15, 3, 10, .5, 1, .28]], puff,
        ([x]) => x > -.66 && x < 10.56),
      ...puffLocks(body, [[8, 3, 10, .22, .87, -.20]], puff, () => true),
      ...puffLocks(tail, [[1, 3, 11, .48, 1, .40], [2, 4, 14, 0, 1, .22], [3, 3, 13, 0, 1, -.12], [4, 2, 11, 0, 1, -.24], [5, 2, 7.5, 0, .60, -.40]], puff)
    ] : [];
    const phases = [0.5, 0, 0.65, 0.15];
    const legs = shape.legs.map((legShape, i) => {
      const u = mod(gait + phases[i], 1);
      const swing = clamp((u - 0.64) / 0.36);
      const reach = stride * 0.64 / 2;
      const target = state.footTargets && state.footTargets[i];
      const delta = target ? Number(target.dx) || 0
        : (u < 0.64 ? reach * (1 - 2 * u / 0.64) : -reach + reach * 2 * ease(swing / 0.7)) * moving;
      const liftHeight = shape === XIAOKUI ? (i === 3 ? 9.5 : 6) : (i === 3 ? 20.5 : 13);
      const lift = target ? Math.max(0, Number(target.lift) || 0)
        : (u < 0.64 ? 0 : Math.sin(Math.PI * swing) * liftHeight) * moving;
      const shiftY = target ? Number(target.dy) || 0 : -lift;
      const bend = target ? Number(target.bend) || 0 : 0;
      // Two short bones carry the painted leg. Rotating each bone keeps the
      // sleeve's width; a single root-to-paw shear made the white sock stretch
      // like rubber. The original drawing remains the exact rest pose.
      let articulated;
      if (shape === XIAOKUI && target && (delta || shiftY || bob || bend)) {
        const root = shape.roots[i], sole = shape.feet[i];
        const ankle = [sole[0], sole[1] - 7];
        const vx = ankle[0] - root[0], vy = ankle[1] - root[1];
        const span = Math.hypot(vx, vy), side = i < 2 ? 1 : -1;
        const restFold = i < 2 ? 4.2 : 3.5;
        const knee = [(root[0] + ankle[0]) / 2 + side * vy / span * restFold,
          (root[1] + ankle[1]) / 2 - side * vx / span * restFold];
        const raisedRoot = [root[0], root[1] + bob];
        const movedAnkle = [ankle[0] + delta, ankle[1] + shiftY];
        const dx = movedAnkle[0] - raisedRoot[0], dy = movedAnkle[1] - raisedRoot[1];
        const distance = Math.max(1e-6, Math.hypot(dx, dy));
        const boneLength = Math.hypot(span / 2, restFold);
        // A lifted paw folds toward the joint's anatomical side. When the
        // projected target is farther away, extend only along the bones;
        // never narrow the painted leg to force the endpoint into place.
        const fold = Math.min(Math.sqrt(Math.max(0, boneLength ** 2 - (distance / 2) ** 2)),
          restFold + Math.abs(bend) * 1.6 + lift * .55);
        const movedKnee = [(raisedRoot[0] + movedAnkle[0]) / 2 + side * dy / distance * fold,
          (raisedRoot[1] + movedAnkle[1]) / 2 - side * dx / distance * fold];
        const boneMap = (from, to, movedFrom, movedTo) => {
          const sx = to[0] - from[0], sy = to[1] - from[1], length = Math.hypot(sx, sy);
          const tx = movedTo[0] - movedFrom[0], ty = movedTo[1] - movedFrom[1];
          const movedLength = Math.max(1e-6, Math.hypot(tx, ty));
          return (x, y) => {
            const along = ((x - from[0]) * sx + (y - from[1]) * sy) / (length * length);
            const across = (-(x - from[0]) * sy + (y - from[1]) * sx) / length;
            return [movedFrom[0] + along * tx - across * ty / movedLength,
              movedFrom[1] + along * ty + across * tx / movedLength];
          };
        };
        const upper = boneMap(root, knee, raisedRoot, movedKnee);
        const lower = boneMap(knee, ankle, movedKnee, movedAnkle);
        const blend = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        articulated = (x, y) => {
          if (y <= root[1]) return [x, y + bob];
          if (y >= ankle[1]) return [x + delta, y + shiftY];
          const t = (y - root[1]) / (ankle[1] - root[1]);
          const joint = blend(upper(x, y), lower(x, y), ease((t - .38) / .24));
          const attached = blend([x, y + bob], joint, ease(t / .18));
          return blend(attached, [x + delta, y + shiftY], ease((t - .82) / .18));
        };
      }
      const deform = (x, y) => {
        if (articulated) return articulated(x, y);
        if (shape === XIAOKUI && target && !delta && !shiftY && !bob && !bend) return [x, y];
        const ankleY = shape.feet[i][1] - (target ? 7 : 0);
        const weight = shape === XIAOKUI
          ? clamp((y - shape.roots[i][1]) / (ankleY - shape.roots[i][1]))
          : ease((y - shape.roots[i][1]) / (-12 - shape.roots[i][1]));
        return [x + delta * weight + bend * Math.sin(Math.PI * weight),
          y + bob * (1 - weight) + shiftY * weight];
      };
      return { commands: mapCommands(legShape, deform), x: shape.roots[i][0], rootY: shape.roots[i][1] + bob,
        footX: shape.feet[i][0] + delta, footY: shape.feet[i][1] + shiftY, delta, lift, deform,
        phase: target && Number.isFinite(target.phase) ? target.phase : u,
        planted: target ? Boolean(target.contact) : u < 0.64 };
    });
    return { body, head, tail, legs, bob, tailTransform, tailRoot, stride,
      feet: legs.map((leg, index) => ({ index, x: leg.footX, y: leg.footY, contact: leg.planted, lift: leg.lift })),
      reaction, bodyTransform, headTransform, fur,
      headMetrics: shape.headMetrics,
      contours: [tail, ...legs.map(l => l.commands), ...fur.map(f => f.commands), body, head] };
  }
  function pathOf(commands) { return new Path2D(commands.map(c => c.join(' ')).join(' ')); }
  const paint = (ctx, color) => typeof color === 'function' ? color(ctx) : color;
  function fillPath(ctx, commands, color) { ctx.fillStyle = paint(ctx, color); ctx.fill(pathOf(commands)); }
  function ellipse(ctx, x, y, rx, ry, color) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  }
  function stroke(ctx, commands, color, width) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(pathOf(commands));
  }
  const refFill = (ctx, commands, color) => fillPath(ctx, local(commands), color);
  function refEllipse(ctx, x, y, rx, ry, color) {
    const p = localPoint(x, y); ellipse(ctx, ...p, rx * UNIT, ry * UNIT, color);
  }
  function gradient(ctx, from, to, colors) {
    return target => {
      if (!target.createLinearGradient) return colors[0][1];
      const g = target.createLinearGradient(...localPoint(...from), ...localPoint(...to));
      for (const [at, color] of colors) g.addColorStop(at, color);
      return g;
    };
  }
  let partCanvas, partContext;
  function region(ctx, contour, color, draw) {
    // Apply the contour once after painting. Repeated antialiased clipping left
    // a white seam around the head, tail and colored back in the previous model.
    // Native Canvas exports may provide a lightweight document shim. Their
    // destination-in path mask can clear whole parts; use direct clipping there.
    // The browser keeps the original single-mask rendering unchanged.
    if (ctx.canvas && typeof document !== 'undefined' && document.nodeType === 9 && document.createElement) {
      if (!partCanvas) {
        partCanvas = document.createElement('canvas'); partCanvas.width = 900; partCanvas.height = 660;
        partContext = partCanvas.getContext('2d');
      }
      const c = partContext;
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 900, 660);
      c.save(); c.scale(3, 3); c.translate(150, 190);
      c.fillStyle = paint(c, color); c.fillRect(-150, -190, 300, 220);
      if (draw) { c.save(); draw(c); c.restore(); }
      c.globalCompositeOperation = 'destination-in'; c.fillStyle = WHITE; c.fill(pathOf(contour));
      c.restore(); ctx.drawImage(partCanvas, -150, -190, 300, 220);
    } else {
      ctx.save(); ctx.clip(pathOf(contour));
      ctx.fillStyle = paint(ctx, color); ctx.fillRect(-150, -190, 300, 220);
      if (draw) draw(ctx); ctx.restore();
    }
  }
  function xiaokuiCoat(ctx, m, ink) {
    region(ctx, m.tail, ink);
    for (const tuft of m.fur) fillPath(ctx, tuft.commands, tuft.white ? WHITE : ink);
    const bodyFill = (target, commands, color) => fillPath(target, mapCommands(xiaokuiPath(commands), m.bodyTransform), color);
    const headFill = (target, commands, color) => fillPath(target, mapCommands(xiaokuiPath(commands), m.headTransform), color);
    const toes = [
      [['M', 213, 853], ['Q', 228, 869, 215, 879], ['M', 243, 851], ['Q', 258, 866, 247, 878]],
      [['M', 411, 843], ['Q', 424, 855, 414, 868]],
      [['M', 684, 853], ['Q', 701, 870, 689, 880], ['M', 716, 852], ['Q', 733, 866, 718, 877]],
      [['M', 811, 843], ['Q', 819, 854, 810, 864]]
    ];
    const drawLeg = i => {
      const leg = m.legs[i];
      region(ctx, leg.commands, WHITE, ctx => {
        if (i === 2) fillPath(ctx, mapCommands(XIAOKUI_SHOULDER, leg.deform), ink);
        stroke(ctx, mapCommands(xiaokuiPath(toes[i]), leg.deform), '#B8B7B4', 0.9);
      });
    };
    for (const i of [1, 3, 0]) drawLeg(i);
    region(ctx, m.body, WHITE, ctx => {
      bodyFill(ctx, [
        ['M', 171, 451 - 140 * m.reaction.puff], ['L', 497, 411 - 140 * m.reaction.puff],
        ['L', 497, 411], ['C', 475, 431, 466, 457, 458, 482],
        ['C', 452, 503, 441, 519, 425, 523], ['C', 413, 527, 406, 544, 399, 558],
        ['C', 394, 568, 395, 578, 406, 578], ['C', 438, 574, 461, 596, 477, 627],
        ['C', 491, 652, 491, 682, 478, 706], ['C', 465, 726, 448, 726, 413, 727],
        ['C', 383, 728, 371, 743, 347, 756], ['C', 313, 774, 282, 785, 255, 773],
        ['C', 214, 757, 188, 730, 171, 694], ['Z']
      ], ink);
      // Small gray island in the white rear streak, not a regular hollow ring.
      bodyFill(ctx, [
        ['M', 430, 539], ['C', 437, 534, 442, 548, 442, 556],
        ['C', 441, 566, 434, 570, 426, 567], ['C', 415, 563, 419, 550, 424, 543],
        ['Q', 427, 540, 430, 539], ['Z']
      ], ink);
      fillPath(ctx, mapCommands(XIAOKUI_SHOULDER, m.bodyTransform), ink);
    });
    // The near front leg must cover the chest; otherwise the white torso cuts
    // the moving gray cuff into a diagonal point while the paw swings forward.
    drawLeg(2);
    region(ctx, m.head, ink, ctx => {
      headFill(ctx, [
        ['M', 806, 272], ['C', 804, 286, 795, 309, 795, 327],
        ['C', 793, 345, 807, 361, 816, 375], ['C', 822, 391, 822, 409, 814, 424],
        ['C', 804, 444, 781, 458, 754, 463], ['C', 714, 473, 658, 455, 627, 430],
        ['L', 605, 490], ['L', 706, 584], ['L', 1006, 520], ['L', 1000, 405],
        ['C', 980, 422, 968, 433, 941, 426], ['C', 919, 425, 906, 416, 895, 400],
        ['C', 887, 389, 882, 383, 869, 382], ['C', 857, 380, 850, 363, 840, 347],
        ['C', 825, 322, 813, 295, 806, 272], ['Z']
      ], WHITE);
      headFill(ctx, [
        ['M', 663, 308], ['C', 658, 278, 659, 239, 670, 229],
        ['C', 680, 222, 705, 246, 721, 261], ['Q', 690, 276, 663, 308], ['Z']
      ], '#514F48');
      headFill(ctx, [
        ['M', 870, 239], ['C', 883, 212, 900, 194, 911, 199],
        ['C', 923, 209, 927, 242, 927, 269], ['Q', 897, 249, 870, 239], ['Z']
      ], '#514F48');
      // The patch overlaps the nose so no white seam can open between them.
      headFill(ctx, [
        ['M', 881, 423], ['C', 889, 426, 897, 429, 903, 433],
        ['C', 909, 436, 910, 442, 907, 449], ['C', 902, 459, 892, 461, 885, 455],
        ['C', 877, 452, 874, 445, 874, 437], ['C', 874, 431, 877, 425, 881, 423], ['Z']
      ], ink);
    });
  }
  // The three approved new coats use the existing round-headed cat unchanged.
  // Each marking shares its part's transform, including moving paws and tail.
  function newCoat(ctx, m, recipe) {
    const { kind, base, ink, cream, accent } = recipe;
    region(ctx, m.tail, base, ctx => {
      const band = (commands, color) => fillPath(ctx, mapCommands(local(commands), m.tailTransform), color);
      if (kind === 'ginger') {
        band([['M', 213, 116], ['Q', 252, 93, 302, 119], ['L', 294, 146], ['Q', 250, 122, 212, 148], ['Z']], ink);
        band([['M', 216, 176], ['Q', 253, 150, 289, 168], ['L', 311, 192], ['Q', 270, 183, 235, 207], ['Z']], ink);
      }
      if (kind === 'calico') {
        band([['M', 198, 117], ['Q', 255, 96, 313, 136], ['L', 323, 200], ['L', 209, 204], ['Z']], accent);
        band([['M', 214, 178], ['Q', 249, 145, 282, 163], ['Q', 290, 178, 326, 184], ['L', 308, 231], ['L', 245, 236], ['Z']], ink);
        band([['M', 309, 177], ['Q', 288, 196, 281, 231], ['L', 313, 244], ['L', 348, 202], ['Z']], WHITE);
      }
    });
    for (const i of [1, 2, 0, 3]) {
      const leg = m.legs[i];
      region(ctx, leg.commands, kind === 'ginger' && [1, 3].includes(i) ? cream : base, ctx => {
        if (kind !== 'ginger') return;
        const cuff = i === 0
          ? [['M', 236, 353], ['Q', 283, 353, 318, 329], ['L', 352, 331], ['L', 365, 390], ['L', 230, 390], ['Z']]
          : [['M', 430, 350], ['Q', 484, 359, 521, 329], ['L', 620, 335], ['L', 620, 392], ['L', 429, 392], ['Z']];
        fillPath(ctx, mapCommands(local(cuff), leg.deform), cream);
      });
    }
    region(ctx, m.body, base, ctx => {
      ctx.translate(0, m.bob);
      if (kind === 'ginger') {
        for (let i = 0; i < 3; i++) {
          const x = 317 + i * 49;
          refFill(ctx, [['M', x - 10, 130], ['L', x + 40, 130], ['C', x + 4, 177, x - 6, 223, x + 17, 265 - i * 9], ['Q', x + 22, 282 - i * 9, x + 7, 270 - i * 9], ['C', x - 32, 236, x - 27, 182, x - 10, 130], ['Z']], ink);
        }
        refFill(ctx, [['M', 510, 222], ['L', 622, 220], ['L', 613, 374], ['L', 509, 381], ['Q', 540, 307, 529, 252], ['Z']], cream);
      }
      if (kind === 'calico') {
        refFill(ctx, [['M', 262, 159], ['L', 405, 148], ['C', 397, 168, 374, 180, 374, 206], ['C', 374, 235, 353, 263, 325, 274], ['C', 299, 283, 270, 278, 256, 260], ['Z']], accent);
        refFill(ctx, [['M', 405, 151], ['L', 484, 151], ['L', 501, 193], ['C', 478, 203, 470, 216, 479, 236], ['C', 493, 263, 478, 285, 452, 287], ['C', 423, 289, 412, 269, 405, 253], ['C', 396, 232, 372, 228, 378, 205], ['C', 383, 183, 387, 170, 405, 151], ['Z']], ink);
      }
    });
    region(ctx, m.head, base, ctx => {
      ctx.translate(0, m.bob);
      if (kind === 'ginger') {
        refFill(ctx, [['M', 417, 208], ['C', 461, 231, 500, 211, 536, 179], ['C', 558, 158, 567, 143, 582, 141], ['C', 600, 134, 613, 151, 627, 157], ['Q', 655, 174, 690, 180], ['L', 703, 280], ['L', 408, 284], ['Z']], cream);
        refFill(ctx, [['M', 523, 38], ['C', 550, 45, 565, 84, 559, 90], ['C', 552, 99, 542, 60, 523, 38], ['Z']], ink);
        refFill(ctx, [['M', 556, 37], ['C', 577, 42, 593, 84, 587, 92], ['C', 578, 103, 572, 63, 556, 37], ['Z']], ink);
        refEllipse(ctx, 606, 77, 4.7, 10, ink);
        refFill(ctx, [['M', 424, 157], ['Q', 450, 150, 470, 156], ['Q', 478, 163, 459, 167], ['Q', 438, 170, 424, 164], ['Z']], ink);
        refFill(ctx, [['M', 457, 184], ['Q', 478, 182, 493, 175], ['C', 511, 171, 497, 189, 474, 197], ['Q', 458, 204, 457, 184], ['Z']], ink);
        refEllipse(ctx, 678, 166, 11, 4.5, ink);
      }
      if (kind === 'calico') {
        refFill(ctx, [['M', 418, 13], ['L', 562, 24], ['C', 561, 68, 544, 103, 516, 119], ['C', 487, 135, 455, 137, 429, 123], ['Z']], accent);
        refFill(ctx, [['M', 642, 78], ['Q', 675, 96, 688, 132], ['Q', 664, 132, 646, 119], ['Z']], accent);
        refFill(ctx, [['M', 560, 24], ['L', 661, 9], ['L', 672, 70], ['Q', 667, 94, 652, 113], ['C', 618, 114, 579, 83, 560, 24], ['Z']], ink);
      }
      if (kind === 'gray') {
        refFill(ctx, [['M', 462, 88], ['Q', 459, 48, 474, 39], ['Q', 490, 43, 513, 66], ['Z']], ink);
        refFill(ctx, [['M', 607, 59], ['L', 636, 35], ['Q', 646, 49, 646, 83], ['Z']], ink);
      }
    });
  }
  function bengalCoat(ctx, m, recipe) {
    const { base, ink, accent, cream } = recipe;
    region(ctx, m.tail, base, ctx => {
      for (const band of [
        [['M', 200, 65], ['L', 314, 61], ['L', 306, 106], ['Q', 260, 94, 202, 119], ['Z']],
        [['M', 211, 149], ['Q', 254, 125, 300, 151], ['L', 307, 176], ['Q', 257, 154, 215, 177], ['Z']],
        [['M', 242, 209], ['Q', 279, 179, 318, 180], ['L', 337, 201], ['Q', 291, 204, 276, 232], ['Z']]
      ]) fillPath(ctx, mapCommands(local(band), m.tailTransform), ink);
    });
    for (const i of [1, 2, 0, 3]) {
      const leg = m.legs[i], x = [284, 357, 494, 560][i];
      region(ctx, leg.commands, base, ctx => {
        fillPath(ctx, mapCommands(local([['M', x - 38, 349], ['Q', x, 363, x + 37, 351],
          ['L', x + 48, 395], ['L', x - 48, 395], ['Z']]), leg.deform), cream);
        for (const [dx, y, r] of [[-4, 315, 6], [6, 338, 5]]) {
          const spot = [['M', x + dx - r, y], ['Q', x + dx - 1, y - r, x + dx + r, y - 2],
            ['Q', x + dx + r + 2, y + r, x + dx, y + r + 1], ['Q', x + dx - r - 1, y + r, x + dx - r, y], ['Z']];
          fillPath(ctx, mapCommands(local(spot), leg.deform), ink);
        }
      });
    }
    region(ctx, m.body, base, ctx => {
      ctx.translate(0, m.bob);
      refFill(ctx, [['M', 270, 307], ['Q', 391, 340, 492, 296], ['Q', 526, 276, 538, 238],
        ['L', 616, 232], ['L', 615, 381], ['L', 254, 388], ['Z']], cream);
      // Offset, varied rosettes: two tapered crescents around an irregular warm center.
      // Open ends leave base fur visible instead of making six identical doughnuts.
      for (const [x, y, w, h, angle] of [[306, 225, 24, 18, -.32], [365, 196, 25, 18, .22],
        [427, 222, 21, 25, -.38], [310, 283, 21, 20, .20], [373, 256, 24, 21, -.25],
        [431, 286, 25, 18, .17], [486, 272, 19, 21, -.28]]) {
        const place = (a, b) => [x + a * w * Math.cos(angle) - b * h * Math.sin(angle),
          y + a * w * Math.sin(angle) + b * h * Math.cos(angle)];
        const patch = (commands, color) => refFill(ctx, mapCommands(commands, place), color);
        patch([['M', -.66, -.53], ['C', -.23, -.91, .39, -.69, .65, -.37],
          ['C', .93, -.04, .59, .70, .14, .75], ['C', -.42, .93, -.95, .22, -.66, -.53], ['Z']], accent);
        patch([['M', -.59, -.85], ['C', -.85, -.85, -1.10, -.31, -1.02, .10],
          ['C', -.98, .73, -.55, 1.04, -.12, .99], ['C', .19, .96, .20, .61, -.11, .62],
          ['C', -.52, .65, -.71, .30, -.68, -.08], ['C', -.65, -.41, -.28, -.68, -.59, -.85], ['Z']], ink);
        patch([['M', -.05, -.97], ['C', .38, -1.14, .96, -.79, 1.02, -.31],
          ['C', 1.12, .11, .91, .60, .62, .78], ['C', .39, .91, .24, .63, .47, .40],
          ['C', .70, .17, .72, -.13, .56, -.40], ['C', .38, -.67, .08, -.57, -.06, -.66],
          ['Q', -.33, -.84, -.05, -.97], ['Z']], ink);
      }
      for (const [x, y, rx, ry] of [[296, 190, 6, 4], [405, 184, 6, 4], [279, 260, 5, 8],
        [348, 302, 6, 4], [408, 253, 4, 6], [463, 301, 6, 4], [480, 222, 5, 7]]) refEllipse(ctx, x, y, rx, ry, ink);
    });
    region(ctx, m.head, base, ctx => {
      ctx.translate(0, m.bob);
      refFill(ctx, [['M', 454, 211], ['Q', 504, 230, 554, 181], ['Q', 589, 150, 621, 170],
        ['Q', 655, 190, 693, 181], ['L', 706, 280], ['L', 450, 282], ['Z']], cream);
      for (const mark of [
        [['M', 517, 40], ['C', 537, 46, 552, 70, 557, 90], ['Q', 551, 108, 542, 82], ['Q', 530, 54, 517, 40], ['Z']],
        [['M', 554, 38], ['C', 574, 38, 584, 65, 589, 91], ['Q', 584, 111, 576, 86], ['Q', 568, 53, 554, 38], ['Z']],
        [['M', 592, 42], ['Q', 611, 40, 618, 77], ['Q', 613, 94, 607, 76], ['Z']],
        [['M', 432, 153], ['Q', 450, 160, 466, 154], ['Q', 478, 161, 462, 167], ['Q', 445, 171, 432, 163], ['Z']],
        [['M', 450, 184], ['Q', 468, 187, 484, 178], ['Q', 494, 184, 480, 194], ['Q', 461, 203, 450, 191], ['Z']],
        [['M', 666, 166], ['L', 687, 159], ['L', 687, 173], ['Q', 671, 177, 666, 166], ['Z']]
      ]) refFill(ctx, mark, ink);
      refFill(ctx, [['M', 463, 78], ['Q', 462, 48, 474, 40], ['L', 501, 65], ['Z']], cream);
      refFill(ctx, [['M', 610, 58], ['L', 634, 36], ['L', 645, 78], ['Z']], cream);
    });
  }
  function coat(ctx, m, recipe) {
    if (recipe.custom && root.FactoryCustomCoat) { root.FactoryCustomCoat(ctx, m, recipe); return; }
    const kind = recipe.kind === 'orangewhite' ? 'bicolor' : recipe.kind, ink = recipe.ink;
    if (kind === 'xiaokui') { xiaokuiCoat(ctx, m, ink); return; }
    if (kind === 'bengal') { bengalCoat(ctx, m, recipe); return; }
    if (['ginger', 'calico', 'gray'].includes(kind)) { newCoat(ctx, m, recipe); return; }
    const golden = ['gold', 'goldtabby'].includes(kind);
    const pale = ['silver', 'silvershaded'].includes(kind) ? '#FDFCFD' : kind === 'tabby' ? '#FFF6E9' : '#FFF6E6';
    const bodyColor = golden ? gradient(ctx, [350, 175], [430, 355], [[0, '#F2CA91'], [1, '#F8D8AD']])
      : kind === 'tabby' ? gradient(ctx, [370, 180], [430, 335], [[0, '#BFA88F'], [1, '#CCB49B']])
      : kind === 'silvershaded' ? gradient(ctx, [380, 150], [420, 345], [[0, recipe.ink], [.55, recipe.base], [1, '#F5F5F7']])
      : kind === 'silver' ? gradient(ctx, [380, 180], [460, 340], [[0, '#D9D8DE'], [1, '#CDCED6']]) : recipe.base;
    region(ctx, m.tail, ['bicolor', 'points'].includes(kind) ? ink : bodyColor, ctx => {
      if (['tabby', 'silver', 'goldtabby'].includes(kind)) {
        const bands = [
          [['M', 220, 105], ['Q', 258, 89, 300, 115], ['L', 295, 142], ['Q', 253, 115, 214, 141], ['Z']],
          [['M', 212, 165], ['Q', 251, 139, 294, 170], ['L', 307, 195], ['Q', 260, 172, 222, 197], ['Z']],
          [['M', 257, 210], ['Q', 288, 180, 319, 180], ['L', 342, 214], ['L', 291, 245], ['Z']]
        ];
        for (const band of bands) fillPath(ctx, mapCommands(local(band), m.tailTransform), ink);
      }
      if (['bicolor', 'silver', 'gold', 'goldtabby', 'silvershaded'].includes(kind)) {
        fillPath(ctx, mapCommands(local([['M', 202, 60], ['L', 317, 52], ['L', 319, 108], ['Q', 265, 97, 219, 124], ['Z']]), m.tailTransform), golden ? '#FFE4B4' : WHITE);
      }
    });
    for (const i of [1, 2, 0, 3]) {
      const leg = m.legs[i];
      region(ctx, leg.commands,
      i === 3 && ['tabby', 'silver', 'gold', 'goldtabby', 'silvershaded'].includes(kind) ? pale : bodyColor, ctx => {
      if (kind === 'points' || ['tabby', 'silver', 'gold', 'goldtabby', 'silvershaded'].includes(kind)) {
        const cuff = i === 0 ? local([['M', 239, 285], ['C', 276, 287, 307, 322, 325, 331], ['L', 352, 308], ['L', 365, 390], ['L', 230, 390], ['Z']])
          : i === 1 ? local([['M', 323, 305], ['Q', 360, 337, 394, 331], ['L', 427, 313], ['L', 428, 390], ['L', 320, 390], ['Z']])
          : local([['M', 430, 325], ['Q', 511, 343, 613, 326], ['L', 620, 392], ['L', 429, 392], ['Z']]);
        const color = kind === 'points' ? ink : i === 2
          ? gradient(ctx, [480, 319], [480, 345], [[0, 'rgba(255,246,230,0)'], [1, pale]]) : pale;
        fillPath(ctx, mapCommands(cuff, leg.deform), color);
      }
      });
    }
    region(ctx, m.body, bodyColor, ctx => {
      ctx.translate(0, m.bob);
      if (kind === 'bicolor') {
        refFill(ctx, [['M', 259, 158], ['L', 451, 151], ['Q', 475, 192, 463, 215], ['C', 428, 277, 326, 311, 270, 264], ['Z']], ink);
      }
      if (golden) {
        refFill(ctx, [['M', 270, 153], ['L', 473, 145], ['L', 477, 219], ['Q', 402, 244, 288, 214], ['Z']], gradient(ctx, [400, 160], [405, 231], [[0, '#E9B574'], [1, '#EFBE80']]));
      }
      if (['tabby', 'silver', 'goldtabby'].includes(kind)) {
        for (let i = 0; i < 3; i++) {
          const x = 317 + i * 49;
          refFill(ctx, [['M', x - 10, 130], ['L', x + 40, 130], ['C', x + 4, 177, x - 6, 223, x + 17, 265 - i * 9], ['Q', x + 22, 282 - i * 9, x + 7, 270 - i * 9], ['C', x - 32, 236, x - 27, 182, x - 10, 130], ['Z']], ink);
        }
      }
      if (['gold', 'tabby', 'silver', 'goldtabby', 'silvershaded'].includes(kind)) {
        refFill(ctx, [['M', 510, 222], ['L', 622, 220], ['L', 613, 374], ['L', 509, 381], ['Q', 540, 307, 529, 252], ['Z']], pale);
      }
    });
    const headColor = golden ? gradient(ctx, [560, 40], [580, 225], [[0, '#EABC7D'], [1, '#F7D29C']])
      : kind === 'tabby' ? gradient(ctx, [550, 35], [570, 225], [[0, '#BFA78D'], [1, '#C9AE96']]) : bodyColor;
    region(ctx, m.head, headColor, ctx => {
      ctx.translate(0, m.bob);
      if (kind === 'bicolor') {
        ctx.fillStyle = ink; ctx.fillRect(-10, -180, 145, 150);
        refFill(ctx, [['M', 561, 45], ['C', 565, 101, 529, 165, 478, 183], ['Q', 449, 190, 431, 174], ['L', 423, 289], ['L', 706, 279], ['L', 704, 172], ['C', 657, 163, 631, 91, 561, 45], ['Z']], WHITE);
        refFill(ctx, [['M', 461, 88], ['Q', 461, 36, 478, 37], ['L', 514, 66], ['Z']], recipe.kind === 'orangewhite' ? '#D99543' : '#293A69');
        refFill(ctx, [['M', 606, 59], ['L', 636, 33], ['Q', 647, 48, 649, 84], ['Z']], recipe.kind === 'orangewhite' ? '#D99543' : '#293A69');
      }
      if (kind === 'points') {
        refFill(ctx, [['M', 432, 124], ['L', 439, 9], ['L', 482, 9], ['L', 522, 65], ['Z']], ink);
        refFill(ctx, [['M', 600, 52], ['L', 639, 0], ['L', 685, 103], ['Z']], ink);
        refFill(ctx, [['M', 455, 99], ['Q', 451, 58, 469, 38], ['L', 511, 67], ['Z']], '#3B3029');
        refFill(ctx, [['M', 608, 60], ['L', 634, 36], ['Q', 643, 48, 648, 79], ['Z']], '#49372D');
        refFill(ctx, [['M', 557, 103], ['C', 586, 82, 630, 85, 651, 108], ['C', 685, 140, 666, 191, 625, 210], ['C', 593, 227, 538, 222, 517, 199], ['C', 490, 170, 510, 131, 557, 103], ['Z']], gradient(ctx, [530, 100], [640, 220], [[0, '#5F483C'], [1, '#534037']]));
      }
      if (['tabby', 'silver', 'gold', 'goldtabby', 'silvershaded'].includes(kind)) {
        if (golden) refFill(ctx, [['M', 421, 171], ['C', 460, 189, 492, 176, 516, 150], ['C', 538, 126, 557, 137, 583, 153], ['Q', 632, 122, 686, 162], ['L', 691, 282], ['L', 415, 282], ['Z']], '#F9D8A5');
        const cheek = golden ? [['M', 426, 177], ['C', 462, 205, 503, 195, 536, 172]]
          : [['M', 417, 208], ['C', 461, 231, 500, 211, 536, 179]];
        refFill(ctx, [...cheek, ['C', 558, 158, 567, 143, 582, 141], ['C', 600, 134, 613, 151, 627, 157], ['Q', 655, 174, 690, 180], ['L', 703, 280], ['L', 408, 284], ['Z']], pale);
      }
      if (golden) {
        refFill(ctx, [['M', 455, 89], ['Q', 457, 44, 472, 37], ['L', 511, 64], ['Z']], '#F9D79E');
        refFill(ctx, [['M', 605, 60], ['L', 636, 34], ['L', 649, 85], ['Z']], '#F9D79E');
      }
      if (['tabby', 'silver', 'goldtabby'].includes(kind)) {
        refFill(ctx, [['M', 554, 46], ['C', 575, 44, 597, 94, 588, 98], ['C', 579, 98, 568, 66, 554, 46], ['Z']], ink);
        refFill(ctx, [['M', 539, 73], ['C', 550, 73, 563, 94, 558, 102], ['C', 552, 110, 540, 88, 539, 73], ['Z']], ink);
        refEllipse(ctx, 603, 83, 4.7, 10, ink);
        refFill(ctx, [['M', 451, 174], ['Q', 469, 179, 489, 177], ['Q', 492, 188, 473, 187], ['Q', 451, 188, 451, 174], ['Z']], ink);
        refEllipse(ctx, 479, 200, 10, 4, kind === 'silver' ? '#B5B4BF' : '#B69A7F');
      }
    });
  }
  function draw(ctx, state, time, options = {}) {
    const m = model(state, time);
    const silhouette = new Path2D();
    for (const contour of m.contours) silhouette.addPath(pathOf(contour));
    ctx.save(); ctx.translate(options.x ?? state.x, options.y ?? 844);
    ctx.scale(options.scale ?? 0.93, options.scale ?? 0.93);
    if (options.headOnly) ctx.clip(pathOf(m.head));
    const amount = clamp(state.coat || 0);
    const staged = state.baseCoat != null;
    const baseAmount = staged ? clamp(state.baseCoat) : 0;
    if (amount < 1) {
      ctx.fillStyle = WHITE; ctx.fill(silhouette, 'nonzero');
      if (baseAmount > 0) {
        ctx.save();
        if (baseAmount < 1) {
          ctx.beginPath(); ctx.ellipse(0, -90, baseAmount * 245, baseAmount * 215, 0, 0, Math.PI * 2); ctx.clip();
        }
        ctx.fillStyle = ['bicolor', 'xiaokui', 'orangewhite'].includes(state.recipe.kind) ? state.recipe.ink : state.recipe.base;
        ctx.fill(silhouette, 'nonzero'); ctx.restore();
      }
    }
    if (amount > 0) {
      ctx.save();
      if (amount < 1) {
        ctx.beginPath();
        if (staged) ctx.ellipse(90, -88, amount * 330, amount * 240, 0, 0, Math.PI * 2);
        else ctx.ellipse(0, -80, amount * 220, amount * 195, 0, 0, Math.PI * 2);
        ctx.clip();
      }
      if (state.recipe.kind === 'solid') { ctx.fillStyle = state.recipe.base; ctx.fill(silhouette, 'nonzero'); }
      else coat(ctx, m, state.recipe);
      ctx.restore();
    }
    ctx.translate(0, m.bob);
    const blink = !options.noBlink && mod(time + state.index * 1.9, 5.3) < 0.11;
    if (state.recipe.kind === 'xiaokui') {
      const hiss = m.reaction.hiss;
      for (const [x, y, rx, ry] of [[790, 404, 26, 27], [925, 376, 20, 24]]) {
        if (blink && hiss < .1) stroke(ctx, xiaokuiPath([['M', x - rx, y], ['Q', x, y + 6, x + rx, y]]), NAVY, 1.4);
        else ellipse(ctx, ...xiaokuiPoint(x, y), rx * 0.22, ry * 0.22 * (1 - .23 * hiss), NAVY);
      }
      fillPath(ctx, xiaokuiPath([
        ['M', 860, 412], ['Q', 873, 407, 885, 409],
        ['C', 894, 409, 897, 413, 892, 420], ['C', 887, 429, 881, 433, 875, 435],
        ['C', 868, 434, 854, 426, 855, 419], ['Q', 854, 415, 860, 412], ['Z']
      ]), NAVY);
      if (hiss > 0) {
        const opening = y => 455 + (y - 455) * hiss;
        fillPath(ctx, xiaokuiPath([
          ['M', 857, 456], ['Q', 877, 451, 898, 454],
          ['C', 899, opening(478), 888, opening(492), 877, opening(494)],
          ['C', 865, opening(492), 854, opening(475), 857, 456], ['Z']
        ]), NAVY);
        fillPath(ctx, xiaokuiPath([
          ['M', 866, opening(488)], ['Q', 877, opening(479), 889, opening(487)],
          ['Q', 878, opening(499), 866, opening(488)], ['Z']
        ]), '#D9979C');
        for (const x of [860, 886]) fillPath(ctx, xiaokuiPath([
          ['M', x, 456], ['L', x + 9, 456], ['Q', x + 7, opening(473), x + 5, opening(471)], ['Z']
        ]), WHITE);
        stroke(ctx, xiaokuiPath([['M', 877, 432], ['L', 877, 454]]), NAVY, 1.05);
        ctx.save(); ctx.globalAlpha = hiss * .65;
        stroke(ctx, xiaokuiPath([
          ['M', 987, 429], ['Q', 1004, 424, 1014 + hiss * 8, 419],
          ['M', 985, 450], ['Q', 1001, 452, 1014 + hiss * 8, 456]
        ]), WHITE, 1.1); ctx.restore();
      }
      if (hiss < 1) {
        ctx.save(); ctx.globalAlpha = 1 - hiss;
        stroke(ctx, xiaokuiPath([
          ['M', 877, 432], ['L', 877, 442], ['Q', 875, 457, 859, 463],
          ['M', 877, 442], ['Q', 882, 456, 898, 454]
        ]), NAVY, 1.05); ctx.restore();
      }
      ctx.restore(); return m;
    }
    const pointOrBlack = ['solid', 'points'].includes(state.recipe.kind);
    const coloredEye = state.recipe.kind === 'points' ? '#96C2F2' : state.recipe.kind === 'gray' ? state.recipe.eye : '#F9CD77';
    for (const [x, y, rx, ry] of [[554, 161, 17, 19], [644, 149, 10, 15]]) {
      const p = localPoint(x, y);
      const threshold = staged ? Math.hypot((p[0] - 90) / 330, (p[1] + 88) / 240) : Math.hypot(p[0] / 220, (p[1] + 80) / 195);
      const dark = (pointOrBlack || state.recipe.kind === 'gray') && amount >= threshold;
      const color = state.recipe.custom && amount >= threshold ? state.recipe.eye : (dark ? coloredEye : NAVY);
      if (blink) stroke(ctx, local([['M', x - rx, y], ['Q', x, y + 4, x + rx, y]]), color, 1.4);
      else refEllipse(ctx, x, y, rx, ry, color);
    }
    const nosePoint = localPoint(611, 176);
    const muzzleThreshold = staged ? Math.hypot((nosePoint[0] - 90) / 330, (nosePoint[1] + 88) / 240) : Math.hypot(nosePoint[0] / 220, (nosePoint[1] + 80) / 195);
    const darkMuzzle = pointOrBlack && amount > muzzleThreshold;
    const faceColor = state.recipe.custom && amount > muzzleThreshold ? state.recipe.faceInk : (darkMuzzle ? '#CBC7C5' : NAVY);
    refFill(ctx, [['M', 602, 170], ['Q', 612, 166, 620, 170], ['C', 627, 175, 616, 184, 612, 186], ['C', 606, 185, 594, 175, 602, 170], ['Z']], faceColor);
    const mouthColor = amount === 1 && ['tabby', 'gold', 'goldtabby'].includes(state.recipe.kind) ? '#714951' : faceColor;
    const meow = m.reaction.meow;
    if (meow < 1) {
      ctx.save(); ctx.globalAlpha = 1 - meow;
      stroke(ctx, local([['M', 612, 184], ['L', 612, 190], ['Q', 608, 201, 600, 197], ['M', 612, 190], ['Q', 617, 198, 624, 193]]), mouthColor, 1.05);
      ctx.restore();
    }
    if (meow > 0) {
      const opening = y => 194 + (y - 194) * meow;
      const mouth = local([
        ['M', 601, 194], ['Q', 612, opening(190), 624, 194],
        ['C', 629, opening(204), 624, opening(218), 613, opening(221)],
        ['C', 603, opening(220), 597, opening(205), 601, 194], ['Z']
      ]);
      ctx.save(); ctx.globalAlpha = meow;
      fillPath(ctx, mouth, '#352639');
      ctx.save(); ctx.clip(pathOf(mouth));
      refFill(ctx, [['M', 604, opening(212)], ['Q', 613, opening(205), 622, opening(212)],
        ['Q', 626, opening(225), 613, opening(225)], ['Q', 600, opening(225), 604, opening(212)], ['Z']], '#D9979C');
      ctx.restore();
      stroke(ctx, mouth, mouthColor, 1.05);
      stroke(ctx, local([['M', 612, 184], ['L', 612, 194]]), mouthColor, 1.05);
      ctx.restore();
    }
    ctx.restore(); return m;
  }
  const reference = Object.freeze({ xiaokui: Object.freeze({
    feet: Object.freeze(XIAOKUI.feet.map(p => Object.freeze({ x: p[0], y: p[1] }))),
    roots: Object.freeze(XIAOKUI.roots.map(p => Object.freeze({ x: p[0], y: p[1] }))),
    width: 202, height: 154
  }) });
  const api = Object.freeze({ model, draw, reference });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CatArt = api;
})(typeof window !== 'undefined' ? window : globalThis);

/* Footprints for the approved factory Xiaokui drawing. The drawing's original
 * paths, eyes and coat stay in vendor/cat.js; this file only places its paws.
 * Screen coordinates: +x right, +y down. All path distances are final pixels.
 */
(function (root, factory) {
  'use strict';
  const isNode = typeof module === 'object' && module.exports;
  const api = factory(isNode ? require('./vendor/cat.js') : root.CatArt);
  if (isNode) module.exports = api;
  else root.CatMotion = api;
})(typeof globalThis === 'object' ? globalThis : this, function (CatArt) {
  'use strict';
  const HOME = Object.freeze({ x: 320, y: 691 });
  const END = Object.freeze({ x: 762, y: 1010 });
  const SCALE = .60, STRIDE = 80, STANCE = .24;
  const recipe = Object.freeze({ name: '小葵', kind: 'xiaokui', ink: '#666560', base: '#FFFFFF' });
  const names = ['hind-near', 'hind-far', 'front-near', 'front-far'];
  // A light trot: diagonal partners follow each other by a small delay. A paw
  // has time to fold and recover instead of flickering through a 3-frame swing.
  const offsets = [0, .5, .56, .06];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = v => (v = clamp(v), v * v * (3 - 2 * v));
  const recover = v => {
    const edge=.10;
    return v<edge?v*v/(2*edge*(1-edge)):
      v>1-edge?1-(1-v)**2/(2*edge*(1-edge)):(v-edge/2)/(1-edge);
  };
  const mix = (a, b, t) => a + (b - a) * t;
  const unit = p => { const n = Math.hypot(p.x, p.y) || 1; return { x: p.x / n, y: p.y / n }; };
  const REFERENCE = CatArt.reference.xiaokui;

  function build(input = {}) {
    const x = Number(input.x) || 0, y = Number(input.y) || 0;
    const scale = Math.max(.01, Number(input.scale) || SCALE);
    const facing = Number(input.facing) < 0 ? -1 : 1;
    // Supplied points already describe the visible view, including its ground
    // heading. `facing` only encodes the horizontal target offset; it must not
    // mirror these points again. Keep the factory's old default coordinates.
    const suppliedFeet = input.restFeet;
    if (suppliedFeet != null && (!Array.isArray(suppliedFeet) || suppliedFeet.length !== 4 ||
      suppliedFeet.some(foot => !Number.isFinite(foot?.x) || !Number.isFinite(foot?.y)))) {
      throw new TypeError('restFeet 必须包含四个有限的局部脚点');
    }
    const restFeet = suppliedFeet ? suppliedFeet.map(foot => ({ x: foot.x, y: foot.y }))
      : REFERENCE.feet.map(foot => ({ x: foot.x * facing, y: foot.y }));
    const totalDistance = Math.max(0, Number(input.totalDistance) || 0);
    const distance = clamp(Number(input.distance) || 0, 0, totalDistance);
    const stride = Math.max(12, Number(input.stride) || STRIDE);
    const direction = unit(input.direction || { x: END.x - HOME.x, y: END.y - HOME.y });
    const moving = clamp(input.moving == null ? 1 : Number(input.moving) || 0);
    let bodyBob = Math.sin((distance / stride - STANCE / 2) * Math.PI * 4 + .5) * 3 * moving;
    const footTargets = [], feet = [];
    const samplePath = s => typeof input.pathAt === 'function' ? input.pathAt(s)
      : { x: x + direction.x * (s - distance), y: y + direction.y * (s - distance) };

    for (let i = 0; i < 4; i++) {
      const nominal = restFeet[i];
      const halfStance = stride * STANCE / 2;
      const first = stride * (STANCE + offsets[i]);
      // Place the last paw at rest, avoiding a tiny final shuffle. Landing and
      // toe-off are separate from footprint spacing: increasing the stride
      // must not make a planted short leg stretch twice as far.
      const anchors = [0];
      for (let s = first; s < totalDistance - 2 * halfStance; s += stride) anchors.push(s);
      if (totalDistance > 0) anchors.push(totalDistance);
      let a = totalDistance, b = totalDistance, takeoff = totalDistance, landing = totalDistance;
      for (let j = 1; j < anchors.length; j++) {
        const end = j === anchors.length - 1
          ? anchors[j] - Math.min(halfStance * [ .8, .25, 0, .65 ][i], (anchors[j] - anchors[j - 1]) * .3)
          : anchors[j] - halfStance;
        if (distance < end) {
          a = anchors[j - 1]; b = anchors[j]; landing = end;
          takeoff = j === 1 ? Math.min(halfStance, Math.max(0, landing - 2 * halfStance))
            : a + halfStance;
          break;
        }
      }
      const contact = distance <= takeoff || distance >= landing;
      const swing = contact ? 0 : clamp((distance - takeoff) / (landing - takeoff));
      const progress = contact ? 0 : swing;
      const anchorDistance = distance < landing ? a : b;
      const pa = samplePath(a), pb = samplePath(b);
      let px, py, lift = 0;
      if (contact) {
        const p = distance < landing ? pa : pb; px = p.x; py = p.y;
      } else {
        const t = recover(swing); px = mix(pa.x, pb.x, t); py = mix(pa.y, pb.y, t);
        lift = Math.min(scale * (i < 2 ? 12 : 14), (b - a) * .24)
          * Math.pow(Math.sin(Math.PI * swing), .9);
        // Uphill projection already raises a recovering paw. Leave a visible
        // bent shin below the hip instead of pulling the sock into the belly.
      }
      const clearance = input.footClearance?.[i];
      if (Number.isFinite(clearance)) {
        // A short leg going uphill needs the torso to clear the planted paw.
        // Raise the rigid body slightly; never crush the paw to fake clearance.
        bodyBob = Math.min(bodyBob, (py - y) / scale + clearance);
        lift = Math.min(lift, Math.max(0, py - y + scale * (clearance - bodyBob)));
      }
      const worldX = px + nominal.x * scale;
      const groundY = py + nominal.y * scale;
      const worldY = groundY - lift;
      const target = {
        dx: ((worldX - x) / scale - nominal.x) / facing,
        dy: (worldY - y) / scale - nominal.y,
        contact, lift: lift / scale, phase: progress,
        bend: contact ? 0 : (i < 2 ? 5.5 : -5.5) * Math.sin(Math.PI * swing)
      };
      footTargets.push(target);
      feet.push({ index: i, name: names[i], x: worldX, y: worldY, groundY,
        contact, lift, anchorDistance, phase: progress });
    }
    // Compression follows a landing; the body rises between diagonal supports.
    // Feet are compensated by the renderers, so a planted sole does not bob.
    const state = { x, index: 0, recipe, coat: 1, tailLift: 1, reaction: { puff: 0, hiss: 0 },
      walking: moving, walkDistance: distance / scale * .93, bodyBob, footTargets };
    return { x, y, scale, facing, distance, totalDistance, stride, direction, moving,
      state, footTargets, feet, bodyBob, restFeet };
  }

  // Override one paw without blending a planted point towards a rest pose.
  // All coordinates remain in the original drawing's units, so the painted
  // sole, contact metadata and ground shadow share exactly the same endpoint.
  function placeFoot(pose, index, dx, dy, lift, contact, anchorKey, phase = 0) {
    const nominal = pose.restFeet[index];
    const target = pose.footTargets[index];
    Object.assign(target, { dx, dy, lift, contact, phase,
      bend: contact ? 0 : (index < 2 ? 1.5 : -2) * Math.sin(Math.PI * phase), anchorKey });
    Object.assign(pose.feet[index], {
      x: pose.x + (nominal.x + dx * pose.facing) * pose.scale,
      y: pose.y + (nominal.y + dy) * pose.scale,
      groundY: pose.y + (nominal.y + dy + lift) * pose.scale,
      lift: lift * pose.scale, contact, phase, anchorKey
    });
  }

  function turning(pose, frame, first, last, direction) {
    const progress = clamp((frame - first) / (last - first));
    // Three feet bear the weight while one foot makes a compact repositioning
    // arc. The underlying artwork's turn is chosen by Film; never turn the
    // entire drawing around four sliding, planted paws here.
    const order = [2, 0, 3, 1];
    const step = Math.min(3, Math.floor(progress * 4));
    const phase = progress >= 1 ? 1 : progress * 4 - step;
    const index = order[step], height = (index < 2 ? 6.5 : 8.5);
    const envelope = Math.sin(Math.PI * phase) ** 2;
    const contact = phase <= 1e-8 || phase >= 1 - 1e-8;
    const lift = contact ? 0 : height * envelope;
    const excursion = direction * (index < 2 ? -1 : 1) * 5.5 * envelope;
    for (let i = 0; i < 4; i++) {
      placeFoot(pose, i, i === index ? excursion : 0, i === index ? -lift : 0,
        i === index ? lift : 0, i !== index || contact,
        'turn-' + first + '-rest-' + i, i === index ? phase : 0);
    }
    Object.assign(pose, { action: 'turn', turning: true, turnProgress: progress,
      activeFoot: contact ? null : index, turnDirection: direction });
  }

  function pressing(pose, frame) {
    const index = 2; // Near front paw is the visible hand that taps the shutter.
    const nominal = pose.restFeet[index];
    const shiftX = ((790 - pose.x) / pose.scale - nominal.x) / pose.facing;
    const shiftY = (1026 - pose.y) / pose.scale - nominal.y;
    let reach = 0, lift = 0, phase = 0, contact = true, anchorKey = 'press-rest';
    if (frame < 282) {
      phase = clamp((frame - 278) / 4);
      reach = ease(phase);
      lift = 10 * Math.sin(Math.PI * phase) ** 2;
      contact = phase === 0 || phase === 1;
      anchorKey = phase === 0 ? 'press-rest' : 'press-button';
    } else if (frame <= 287) {
      reach = 1; anchorKey = 'press-button';
    } else {
      phase = clamp((frame - 287) / 6);
      reach = 1 - ease(phase);
      lift = 7 * Math.sin(Math.PI * phase) ** 2;
      contact = phase === 0 || phase === 1;
      anchorKey = phase === 1 ? 'press-rest' : 'press-button';
    }
    placeFoot(pose, index, shiftX * reach, shiftY * reach - lift,
      lift, contact, anchorKey, phase);
    Object.assign(pose, { action: 'press', activeFoot: contact ? null : index,
      pressing: frame >= 282 && frame <= 287, pressFoot: index });
  }

  function travel(frame, first, last) {
    const p = clamp((frame - first) / (last - first)), e = .08;
    if (p < e) return p * p / (2 * e * (1 - e));
    if (p > 1 - e) return 1 - (1 - p) ** 2 / (2 * e * (1 - e));
    return (p - e / 2) / (1 - e);
  }
  function at(sourceFrame, options = {}) {
    const f = Number(sourceFrame) || 122;
    const home = options.home || HOME, end = options.end || END;
    const dx = end.x - home.x, dy = end.y - home.y, length = Math.hypot(dx, dy);
    const returning = f >= 338;
    const progress = f < 178 ? 0 : f <= 278 ? travel(f, 178, 278) : f < 338 ? 1 : 1 - travel(f, 338, 450);
    const moving = f >= 178 && f <= 278 ? Math.min(ease((f - 178) / 6), 1 - ease((f - 272) / 6))
      : f >= 338 && f <= 450 ? Math.min(ease((f - 338) / 6), 1 - ease((f - 444) / 6)) : 0;
    const pose = build({
      x: home.x + dx * progress, y: home.y + dy * progress,
      distance: (returning ? 1 - progress : progress) * length, totalDistance: length,
      direction: { x: dx * (returning ? -1 : 1), y: dy * (returning ? -1 : 1) },
      scale: options.scale || SCALE, stride: options.stride || STRIDE,
      facing: options.facing == null ? (f >= 318 ? -1 : 1) : options.facing, moving,
      footClearance: options.footClearance, restFeet: options.restFeet
    });
    if (f >= 133 && f <= 177) turning(pose, f, 133, 177, -1);
    else if (f >= 318 && f <= 337) turning(pose, f, 318, 337, 1);
    else if (f >= 278 && f <= 293) pressing(pose, f);
    else Object.assign(pose, { action: moving ? 'walk' : 'stand', activeFoot: null, turning: false });
    return Object.assign(pose, { sourceFrame: f, progress, returning, time: (f - 122) / 60 });
  }

  // This helper maps the actual deformed reference feet, rather than restating
  // target coordinates; it is useful for checking the renderer's contact points.
  function modelFeet(model, pose) {
    return model.feet.map(f => ({ index: f.index,
      x: pose.x + f.x * pose.scale * pose.facing,
      y: pose.y + f.y * pose.scale, contact: f.contact, lift: f.lift * pose.scale }));
  }
  return Object.freeze({ build, at, modelFeet, HOME, END, SCALE, STRIDE, reference: REFERENCE, recipe });
});

/* 转身只规划脚，不旋转、不镜像也不改画面主体。
 * 所有落点由绝对帧号计算；换视角只改变足部偏移的表达方式。
 *
 * TurnMotion.at(frame, {
 *   center: {x, y}, scale: .6,
 *   restFeet: { rear: [四个局部脚点], left: [...], front: [...], factory: [...] },
 *   currentView: 'rear',            // 可省略，采用模块建议的视角
 *   targetAxisX: -1,                // Puppet 的 facing=-1；工厂图用 +1
 *   anchorCenter: {x, y},           // 可省略；该段固定落点的中心，不能含身体起伏
 *   liftHeight: 8.5                 // 原图单位，最终抬脚高度还会乘 scale
 * })
 *
 * restFeet 均为 scale=1、x=y=0、无足部偏移时的脚端，索引必须代表同一只脚。
 * 工厂可用 CatArt.reference.xiaokui.feet，其他图用 Puppet.footPoints。
 * 返回 worldFeet 和“当前视角专用”的 footTargets。非转身时段返回 null。
 * center/scale/anchorCenter 在同一段转身中通常固定；若身体中心变化，
 * 保持 anchorCenter 不变，接触脚仍会锁在原来的世界落点。
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TurnMotion = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const windows = Object.freeze([
    Object.freeze({ start: 133, end: 177, views: Object.freeze(['rear', 'left', 'front', 'outbound']) }),
    Object.freeze({ start: 318, end: 337, views: Object.freeze(['outbound', 'front', 'left', 'rear']) })
  ]);
  const order = Object.freeze([2, 0, 3, 1]);
  const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
  const smooth = value => value * value * (3 - 2 * value);
  const lerp = (from, to, amount) => from + (to - from) * amount;
  const finite = (value, label) => {
    if (!Number.isFinite(value)) throw new Error('转身参数无效：' + label);
    return value;
  };

  function at(sourceFrame, options = {}) {
    if (!Number.isFinite(sourceFrame)) return null;
    const range = (options.windows || windows).find(item => sourceFrame >= item.start && sourceFrame <= item.end);
    if (!range) return null;
    if (!(range.end > range.start)) throw new Error('转身结束帧必须晚于起始帧');
    const sequence = options.views || range.views;
    if (!Array.isArray(sequence) || sequence.length < 2) throw new Error('转身至少需要两个视角');
    const center = options.center || { x: 0, y: 0 };
    const anchor = options.anchorCenter || center;
    finite(center.x, 'center.x'); finite(center.y, 'center.y');
    finite(anchor.x, 'anchorCenter.x'); finite(anchor.y, 'anchorCenter.y');
    const scale = options.scale == null ? 1 : finite(options.scale, 'scale');
    if (scale <= 0) throw new Error('转身比例必须大于零');
    const restFeet = options.restFeet || {};
    for (const view of sequence) {
      const feet = restFeet[view];
      if (!Array.isArray(feet) || feet.length !== 4) throw new Error('缺少视角的四个原始脚点：' + view);
      for (const [index, foot] of feet.entries()) {
        finite(foot.x, view + '.feet[' + index + '].x');
        finite(foot.y, view + '.feet[' + index + '].y');
      }
    }

    const progress = clamp((sourceFrame - range.start) / (range.end - range.start));
    const stageCount = sequence.length - 1;
    const totalSteps = stageCount * order.length;
    const stepClock = progress * totalSteps;
    const stepIndex = Math.min(totalSteps - 1, Math.floor(stepClock));
    const stepPhase = progress === 1 ? 1 : stepClock - stepIndex;
    const stage = Math.floor(stepIndex / order.length);
    // 每个视角阶段中段换图。调用方可自由选别的换图时刻，脚点不受影响。
    const suggestedIndex = Math.min(sequence.length - 1, Math.floor(progress * stageCount + .5));
    const suggestedView = sequence[suggestedIndex];
    const view = options.currentView || suggestedView;
    if (!sequence.includes(view)) throw new Error('当前视角不在本段转身序列中：' + view);
    const axisOption = options.targetAxisX == null ? 1 : options.targetAxisX;
    const axisX = typeof axisOption === 'object' ? axisOption[view] : axisOption;
    if (axisX !== 1 && axisX !== -1) throw new Error('targetAxisX 只能是 +1 或 -1；它只解释腿偏移，不翻转图像');

    const worldRest = name => restFeet[name].map(foot => ({
      x: anchor.x + foot.x * scale,
      y: anchor.y + foot.y * scale
    }));
    const anchors = worldRest(sequence[0]);
    const placements = [0, 0, 0, 0];
    // 重放有限的十二次落脚决策，不读取或修改上一次画面的状态。
    // 每次只更新一只脚的锚点；尚未抬起的其余脚保持旧世界坐标。
    for (let index = 0; index < stepIndex; index++) {
      const footIndex = order[index % order.length];
      const nextView = sequence[Math.floor(index / order.length) + 1];
      anchors[footIndex] = worldRest(nextView)[footIndex];
      placements[footIndex]++;
    }
    const activeIndex = order[stepIndex % order.length];
    const from = { ...anchors[activeIndex] };
    const to = worldRest(sequence[stage + 1])[activeIndex];
    const contact = stepPhase <= 1e-9 || stepPhase >= 1 - 1e-9;
    const eased = smooth(stepPhase);
    const liftHeight = options.liftHeight == null ? 8.5 : finite(options.liftHeight, 'liftHeight');
    if (liftHeight < 0) throw new Error('抬脚高度不可为负');
    const lift = contact ? 0 : liftHeight * scale * Math.sin(Math.PI * stepPhase) ** 2;
    const currentGround = { x: lerp(from.x, to.x, eased), y: lerp(from.y, to.y, eased) };
    const worldFeet = anchors.map((anchorPoint, index) => {
      const active = index === activeIndex;
      const ground = active ? currentGround : anchorPoint;
      const height = active ? lift : 0;
      const landed = active && stepPhase >= 1 - 1e-9 ? 1 : 0;
      return {
        index, x: ground.x, y: ground.y - height, groundX: ground.x, groundY: ground.y,
        lift: height, contact: !active || contact, phase: active ? stepPhase : 0,
        anchorKey: 'turn-' + range.start + '-foot-' + index + '-landing-' + (placements[index] + landed)
      };
    });
    const footTargets = worldFeet.map((foot, index) => ({
      // Puppet 的 dx 最后会乘 facing；在这里抵消该参数，图片本身始终不翻转。
      dx: ((foot.x - center.x) / scale - restFeet[view][index].x) / axisX,
      dy: (foot.y - center.y) / scale - restFeet[view][index].y,
      lift: foot.lift / scale, contact: foot.contact, phase: foot.phase,
      bend: foot.contact ? 0 : (index < 2 ? 1.5 : -2) * Math.sin(Math.PI * foot.phase),
      anchorKey: foot.anchorKey
    }));

    return {
      action: 'turn', sourceFrame, startFrame: range.start, endFrame: range.end,
      progress, stage, stepIndex, stepPhase, fromView: sequence[stage], toView: sequence[stage + 1],
      view, suggestedView, targetAxisX: axisX, activeFoot: contact ? null : activeIndex,
      worldFeet, footTargets
    };
  }

  return Object.freeze({ at, windows, order });
});

/* Extra Xiaokui views, drawn directly from the approved view atlases.
 * The image is never mirrored or stretched. Only the lower legs use a mesh;
 * head, torso, markings and tail retain the source image's rigid proportions.
 * Source measurements below use a 640-unit cell, independent of image size.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ViewPuppet = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  const CELL = 640;
  const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
  const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  const number = (n, fallback = 0) => Number.isFinite(Number(n)) ? Number(n) : fallback;
  const leg = (x, y, rootY, innerWidth, outerWidth, hidden = false) => Object.freeze({
    // The bottom 24 source units contain the round toes; the white sock above
    // them belongs to the shin and must be able to fold with the ankle.
    x, y, rootY, pawY: y - 24, innerWidth, outerWidth, hidden
  });

  // These two generated drawings were measured at half their native 1254 px
  // size. Convert those 627 px measurements into the renderer's 640-unit cell;
  // otherwise the logical soles sit 9–12 units above the actual painted toes.
  function measuredView(view) {
    const ratio = CELL / 627, position = value => value * ratio;
    return Object.freeze({ ...view,
      anchorX: position(view.anchorX), anchorY: position(view.anchorY),
      top: position(view.top), rigidY: position(view.rigidY),
      bands: Object.freeze(view.bands.map(position)),
      regions: Object.freeze(view.regions.map(region => region && ({
        left: region.left.map(([y, x]) => [position(y), position(x)]),
        right: region.right.map(([y, x]) => [position(y), position(x)])
      }))),
      legs: Object.freeze(view.legs.map(foot => Object.freeze({ ...foot,
        x: position(foot.x), y: position(foot.y), rootY: position(foot.rootY),
        pawY: position(foot.pawY), innerWidth: position(foot.innerWidth), outerWidth: position(foot.outerWidth)
      })))
    });
  }

  // Same leg indices as CatMotion: near hind, far hind, near front, far front.
  // The two angles have different apparent widths. Match the 154-unit height
  // uniformly, rather than squeezing either view into the side view's width.
  const views = Object.freeze({
    rear: measuredView({
      column: 0, row: 0, gridColumns: 1, gridRows: 1, anchorX: 307, anchorY: 473, top: 60,
      unit: .38, rigidY: 295,
      bands: Object.freeze([0, 201, 302, 325, 640]),
      bandLegs: Object.freeze([3, 2, 1, 0]),
      // The three exposed paws sit at different depths. Restrict a leg's
      // influence to its own painted sock instead of an infinite vertical
      // strip that would also pull the torso or the lower, nearer leg.
      regions: Object.freeze([
        { left: [[497, 328], [525, 353], [547, 366], [592, 366]], right: [[497, 453], [592, 453]] },
        null,
        { left: [[393, 213], [477, 213]], right: [[393, 278], [477, 278]] },
        { left: [[295, 0], [381, 0]], right: [[295, 179], [330, 195], [381, 195]] }
      ]),
      legs: Object.freeze([
        leg(399, 568, 497, 32, 47),
        leg(427, 510, 460, 24, 34, true),
        leg(248, 455, 393, 26, 35),
        leg(154, 359, 295, 26, 35)
      ])
    }),
    outbound: measuredView({
      column: 0, row: 0, gridColumns: 1, gridRows: 1, anchorX: 294.25, anchorY: 528.75, top: 26,
      // Match the head's width, not the high tail tip, to the original drawing.
      unit: .32, rigidY: 345,
      bands: Object.freeze([0, 195, 281, 392, 640]),
      bandLegs: Object.freeze([0, 1, 2, 3]),
      regions: Object.freeze([
        { left: [[345, 0], [477, 0]], right: [[345, 159], [390, 181], [415, 195], [477, 195]] },
        { left: [[411, 195], [498, 195]], right: [[411, 281], [498, 281]] },
        { left: [[510, 281], [607, 281]], right: [[510, 392], [607, 392]] },
        { left: [[520, 392], [621, 392]], right: [[520, 640], [621, 640]] }
      ]),
      legs: Object.freeze([
        leg(141, 455, 345, 30, 42),
        leg(242, 476, 411, 25, 35),
        leg(345, 585, 510, 30, 40),
        leg(449, 599, 520, 29, 40)
      ])
    }),
    left: Object.freeze({
      column: 1, row: 1, gridColumns: 2, gridRows: 2, anchorX: 310, anchorY: 534, top: 80,
      unit: 154 / (534 - 80), rigidY: 432,
      bands: Object.freeze([0, 211, 322, 430, 640]),
      bandLegs: Object.freeze([3, 2, 1, 0]),
      legs: Object.freeze([
        leg(472, 527, 442, 29, 42),
        leg(376, 517, 444, 28, 40),
        leg(238, 534, 464, 25, 36),
        leg(164, 524, 432, 24, 33)
      ])
    }),
    front: Object.freeze({
      column: 0, row: 0, gridColumns: 2, gridRows: 1,
      anchorX: 350, anchorY: 585, top: 133,
      unit: 154 / (585 - 133), rigidY: 435,
      bands: Object.freeze([0, 239, 270, 360, 640]),
      bandLegs: Object.freeze([0, 1, 2, 3]),
      legs: Object.freeze([
        leg(208, 504, 435, 24, 34),
        // The far hind leg is occluded in the supplied front view. Keep its
        // logical contact for turning, without deforming the overlying chest.
        leg(250, 505, 440, 15, 22, true),
        leg(310, 585, 515, 28, 40),
        leg(410, 583, 510, 29, 42)
      ])
    }),
    dip: Object.freeze({
      column: 1, row: 0, gridColumns: 2, gridRows: 1,
      anchorX: 325, anchorY: 586, top: 176,
      // The rear torso/tail span occupies essentially the same 640-unit cell
      // width. Reuse its scale; the lowered head must not enlarge the body.
      unit: 154 / (526 - 43), rigidY: 498,
      bands: Object.freeze([0, 235, 320, 420, 640]),
      bandLegs: Object.freeze([2, 3, 0, 1]),
      legs: Object.freeze([
        leg(352, 585, 528, 32, 44),
        leg(469, 586, 499, 29, 42),
        leg(185, 574, 498, 27, 37),
        leg(270, 553, 503, 25, 36)
      ])
    })
  });

  function definition(view) {
    return views[view] || views.rear;
  }

  function targets(options) {
    return options.footTargets || options.state?.footTargets || [];
  }

  function bodyBob(options) {
    return number(options.bodyBob, number(options.state?.bodyBob));
  }

  function boundaryAt(points, y) {
    if (y <= points[0][0]) return points[0][1];
    for (let i = 1; i < points.length; i++) {
      const [endY, endX] = points[i], [startY, startX] = points[i - 1];
      if (y <= endY) return startX + (endX - startX) * (y - startY) / (endY - startY);
    }
    return points[points.length - 1][1];
  }

  function localPoint(view, sourceX, sourceY, options = {}) {
    const d = definition(view);
    const x = (sourceX - d.anchorX) * d.unit;
    const bob = bodyBob(options);
    const y = (sourceY - d.anchorY) * d.unit + bob;
    if (sourceY <= d.rigidY) return { x, y };

    const feet = targets(options);
    const facing = number(options.facing, -1) < 0 ? -1 : 1;
    let dx = 0, dy = 0;
    for (let i = 0; i < d.legs.length; i++) {
      const foot = d.legs[i];
      if (foot.hidden || (!feet[i] && !bob) || sourceY <= foot.rootY) continue;
      const target = feet[i] || {};
      const band = d.bandLegs.indexOf(i);
      // Blend only in the transparent gaps between the legs. A narrow radial
      // falloff inside a paw folds its edge back while its centre moves away.
      const region = d.regions?.[i];
      const leftEdge = region ? boundaryAt(region.left, sourceY) : d.bands[band];
      const rightEdge = region ? boundaryAt(region.right, sourceY) : d.bands[band + 1];
      const left = leftEdge <= 0 ? 1 : smooth((sourceX - leftEdge + 3) / 6);
      const right = rightEdge >= CELL ? 1 : 1 - smooth((sourceX - rightEdge + 3) / 6);
      const belowPaw = region ? 1 - smooth((sourceY - foot.y - 4) / 18) : 1;
      const horizontal = left * right * belowPaw;
      // The knee travels in an arc between the fixed hip and ankle. The bend
      // vanishes at both joints, and the entire rounded paw below pawY moves
      // as one piece. Planted soles never inherit the body's vertical bob.
      const vertical = clamp((sourceY - foot.rootY) / (foot.pawY - foot.rootY));
      const weight = horizontal * vertical;
      if (!weight) continue;
      // Targets already use the factory's local units. The image faces left;
      // facing changes target offsets only and never flips image coordinates.
      const knee = Math.sin(Math.PI * vertical);
      dx += facing * horizontal * (number(target.dx) * vertical + number(target.bend) * knee);
      dy += (number(target.dy) - bob) * weight;
    }
    return { x: x + dx, y: y + dy };
  }

  function footPoints(options = {}) {
    const name = options.view || 'rear', d = definition(name);
    const scale = Math.max(0, number(options.scale, .60));
    const angle = number(options.rotation), cos = Math.cos(angle), sin = Math.sin(angle);
    return d.legs.map((foot, index) => {
      const target = targets(options)[index] || {};
      // An occluded leg has no painted vertices. Its logical endpoint must be
      // independent of whichever visible sock happens to cover that pixel.
      const p = foot.hidden ? {
        x: (foot.x - d.anchorX) * d.unit + number(target.dx) * (number(options.facing, -1) < 0 ? -1 : 1),
        y: (foot.y - d.anchorY) * d.unit + number(target.dy)
      } : localPoint(name, foot.x, foot.y, options);
      return { index, localX: p.x, localY: p.y,
        x: number(options.x) + scale * (p.x * cos - p.y * sin),
        y: number(options.y) + scale * (p.x * sin + p.y * cos) };
    });
  }

  // One pixel buffer owns every shared mesh edge. Drawing independently
  // antialiased Canvas triangle clips leaves semi-transparent seams, especially
  // visible over the phone's black screen; a single texture draw cannot do so.
  const sources = new WeakMap();
  function canvasLike(ctx, width, height) {
    let canvas;
    if (typeof OffscreenCanvas === 'function') canvas = new OffscreenCanvas(width, height);
    else if (typeof document === 'object' && document.createElement) {
      canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    } else canvas = new ctx.canvas.constructor(width, height);
    return canvas;
  }

  function texture(ctx, image, d, cellWidth, cellHeight) {
    let entry = sources.get(image);
    if (!entry) { entry = {}; sources.set(image, entry); }
    const key = d.column + ':' + d.row;
    if (!entry[key]) {
      const width = Math.round(cellWidth), height = Math.round(cellHeight);
      const canvas = canvasLike(ctx, width, height), c = canvas.getContext('2d');
      c.drawImage(image, d.column * cellWidth, d.row * cellHeight, cellWidth, cellHeight,
        0, 0, width, height);
      entry[key] = { width, height, pixels: c.getImageData(0, 0, width, height).data,
        canvas: canvasLike(ctx, width, height) };
    }
    return entry[key];
  }

  function splitLegPixels(tex, d) {
    if (tex.legPixels) return tex.legPixels;
    const moving = new Uint8ClampedArray(tex.pixels.length);
    const rigid = tex.pixels.slice();
    for (let y = 0; y < tex.height; y++) {
      const sy = (y + .5) * CELL / tex.height;
      for (let x = 0; x < tex.width; x++) {
        const at = (y * tex.width + x) * 4;
        if (!tex.pixels[at + 3]) continue;
        const sx = (x + .5) * CELL / tex.width;
        for (let i = 0; i < d.legs.length; i++) {
          const foot = d.legs[i], region = d.regions[i];
          if (foot.hidden || !region || sy < foot.rootY || sy > foot.y + 8 ||
            sx < boundaryAt(region.left, sy) || sx > boundaryAt(region.right, sy)) continue;
          // The new oblique views place a gray shoulder immediately beside
          // a white forearm. That shoulder belongs to the rigid torso. Gray
          // toe marks below the ankle remain part of the moving rounded paw.
          if (sy < foot.pawY && Math.max(tex.pixels[at], tex.pixels[at + 1], tex.pixels[at + 2]) < 150) continue;
          moving.set(tex.pixels.subarray(at, at + 4), at);
          // A tiny original overlap at the hip hides the attachment as the
          // white sleeve bends, without repainting any part of the drawing.
          if (sy > foot.rootY + 3) rigid.fill(0, at, at + 4);
          break;
        }
      }
    }
    return tex.legPixels = { moving: { ...tex, pixels: moving }, rigid };
  }

  function overlayRigidPixels(source, tex, output, width, left, top) {
    for (let y = 0; y < tex.height; y++) for (let x = 0; x < tex.width; x++) {
      const from = (y * tex.width + x) * 4, alpha = source[from + 3] / 255;
      if (!alpha) continue;
      const to = ((y - top) * width + x - left) * 4;
      const under = output[to + 3] / 255 * (1 - alpha), total = alpha + under;
      for (let channel = 0; channel < 3; channel++) output[to + channel] =
        (source[from + channel] * alpha + output[to + channel] * under) / total;
      output[to + 3] = total * 255;
    }
  }

  function hasVisiblePixels(tex, source) {
    // Conservative source blocks: skip only triangles whose entire sampling
    // footprint is below the existing alpha cutoff, including bilinear edges.
    const block = 32, columns = Math.ceil(tex.width / block);
    if (!tex.visibleBlocks) {
      const blocks = new Uint8Array(columns * Math.ceil(tex.height / block));
      for (let y = 0; y < tex.height; y++) for (let x = 0; x < tex.width; x++) {
        if (tex.pixels[(y * tex.width + x) * 4 + 3] >= 48)
          blocks[Math.floor(y / block) * columns + Math.floor(x / block)] = 1;
      }
      tex.visibleBlocks = blocks;
    }
    const xs = source.map(p => p.x * tex.width / CELL - .5);
    const ys = source.map(p => p.y * tex.height / CELL - .5);
    const x0 = Math.floor(clamp(Math.floor(Math.min(...xs)), 0, tex.width - 1) / block);
    const x1 = Math.floor(clamp(Math.ceil(Math.max(...xs)), 0, tex.width - 1) / block);
    const y0 = Math.floor(clamp(Math.floor(Math.min(...ys)), 0, tex.height - 1) / block);
    const y1 = Math.floor(clamp(Math.ceil(Math.max(...ys)), 0, tex.height - 1) / block);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++)
      if (tex.visibleBlocks[y * columns + x]) return true;
    return false;
  }

  function rasterTriangle(source, destination, tex, output, width, height) {
    if (!hasVisiblePixels(tex, source)) return;
    const [a, b, c] = destination;
    const determinant = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
    if (Math.abs(determinant) < 1e-8) return;
    const minX = Math.max(0, Math.ceil(Math.min(a.x, b.x, c.x) - .5));
    const maxX = Math.min(width - 1, Math.floor(Math.max(a.x, b.x, c.x) - .5));
    const minY = Math.max(0, Math.ceil(Math.min(a.y, b.y, c.y) - .5));
    const maxY = Math.min(height - 1, Math.floor(Math.max(a.y, b.y, c.y) - .5));
    const pixels = tex.pixels;
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const w0 = ((b.y - c.y) * (x + .5 - c.x) + (c.x - b.x) * (y + .5 - c.y)) / determinant;
        const w1 = ((c.y - a.y) * (x + .5 - c.x) + (a.x - c.x) * (y + .5 - c.y)) / determinant;
        const w2 = 1 - w0 - w1;
        if (w0 < -1e-7 || w1 < -1e-7 || w2 < -1e-7) continue;
        // Pixel centres + premultiplied bilinear sampling retain the original
        // soft silhouette without pulling RGB from transparent neighbours.
        const sx = clamp((source[0].x * w0 + source[1].x * w1 + source[2].x * w2)
          * tex.width / CELL - .5, 0, tex.width - 1);
        const sy = clamp((source[0].y * w0 + source[1].y * w1 + source[2].y * w2)
          * tex.height / CELL - .5, 0, tex.height - 1);
        const ix = Math.floor(sx), iy = Math.floor(sy), fx = sx - ix, fy = sy - iy;
        const jx = Math.min(ix + 1, tex.width - 1), jy = Math.min(iy + 1, tex.height - 1);
        const indices = [(iy * tex.width + ix) * 4, (iy * tex.width + jx) * 4,
          (jy * tex.width + ix) * 4, (jy * tex.width + jx) * 4];
        const weights = [(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy];
        let alpha = 0, red = 0, green = 0, blue = 0;
        for (let i = 0; i < 4; i++) {
          const j = indices[i], wa = weights[i] * pixels[j + 3];
          alpha += wa; red += pixels[j] * wa; green += pixels[j + 1] * wa; blue += pixels[j + 2] * wa;
        }
        const at = (y * width + x) * 4;
        // Very faint matte specks outside the source socks otherwise stretch
        // into visible diagonal trails on a black phone. Keep the actual
        // opaque silhouette and its edge, omitting only this sub-19% residue.
        if (alpha < 48 || alpha < output[at + 3]) continue;
        output[at] = red / alpha; output[at + 1] = green / alpha;
        output[at + 2] = blue / alpha; output[at + 3] = alpha;
      }
    }
  }

  function sealLegJoins(pixels, width, height, top, bottom, radius) {
    // Scan each gap once, using the unchanged source for both directions.
    // Preserve the original horizontal-first rule and nearest white endpoint.
    const original = pixels.slice(), limit = Math.max(1, Math.round(radius));
    const y0 = Math.max(1, top), y1 = Math.min(height - 1, bottom);
    const white = at => original[at] > 225 && original[at + 1] > 225 && original[at + 2] > 225;
    function fillGap(before, after, stride, first, last, vertical) {
      const count = (after - before) / stride;
      if (count <= 1 || count > limit + 1 || !white(before) || !white(after)) return;
      first = before + stride > first ? before + stride : first;
      last = after < last ? after : last;
      for (let at = first; at < last; at += stride) {
        // A horizontal repair already won, just as in the original search.
        if (vertical && pixels[at + 3] > 230) continue;
        const from = at - before <= after - at ? before : after;
        pixels[at] = original[from]; pixels[at + 1] = original[from + 1];
        pixels[at + 2] = original[from + 2]; pixels[at + 3] = original[from + 3];
      }
    }
    for (let y = y0; y < y1; y++) {
      const row = y * width * 4; let before = -1;
      for (let x = 0; x < width; x++) {
        const at = row + x * 4;
        if (original[at + 3] <= 230) continue;
        if (before >= 0) fillGap(before, at, 4, row + limit * 4, row + (width - limit) * 4, false);
        before = at;
      }
    }
    for (let x = limit; x < width - limit; x++) {
      let before = -1;
      for (let y = Math.max(0, y0 - limit); y < Math.min(height, y1 + limit); y++) {
        const at = (y * width + x) * 4;
        if (original[at + 3] <= 230) continue;
        if (before >= 0) fillGap(before, at, width * 4, (y0 * width + x) * 4, (y1 * width + x) * 4, true);
        before = at;
      }
    }
  }

  function warpedTexture(ctx, image, name, options, cellWidth, cellHeight) {
    const d = definition(name), tex = texture(ctx, image, d, cellWidth, cellHeight);
    const bob = bodyBob(options);
    const poseKey = [number(options.facing, -1), bob, ...d.legs.flatMap((_, i) => {
      const foot = targets(options)[i] || {};
      return [number(foot.dx), number(foot.dy), number(foot.bend)];
    })].join(',');
    if (tex.poseKey === poseKey) return tex.warp;
    const rowValues = [d.rigidY];
    for (let y = d.rigidY + 16; y < 560; y += 16) rowValues.push(y);
    rowValues.push(560, CELL, ...d.legs.flatMap(foot => [foot.rootY,
      (foot.rootY + foot.pawY) / 2, foot.pawY, foot.y,
      ...(d.regions ? [foot.y + 4, foot.y + 22] : [])]));
    const regionPoints = (d.regions || []).filter(Boolean).flatMap(region => [...region.left, ...region.right]);
    rowValues.push(...regionPoints.map(point => point[0]));
    const rows = [...new Set(rowValues)].sort((a, b) => a - b);
    const columns = [...new Set([
      ...Array.from({ length: 21 }, (_, i) => i * 32),
      ...d.bands.slice(1, -1).flatMap(x => [x - 3, x, x + 3]),
      ...regionPoints.flatMap(point => [point[1] - 3, point[1], point[1] + 3]).filter(x => x >= 0 && x <= CELL),
      ...d.legs.flatMap(foot => [foot.x - foot.outerWidth, foot.x, foot.x + foot.outerWidth])
    ])].sort((a, b) => a - b);
    const grid = rows.map(y => columns.map(x => ({
      source: { x, y }, destination: localPoint(name, x, y, options)
    })));
    const density = tex.width / (CELL * d.unit);
    // Align the unchanged region with the original texture's pixel centres.
    // Copy it byte-for-byte instead of resampling the head on every frame.
    for (const vertex of grid.flat()) vertex.pixel = {
      x: vertex.destination.x * density + d.anchorX * tex.width / CELL,
      // Draw-time translation carries the original head/body rigidly. Subtract
      // it here so the unchanged pixels retain their original sample centres.
      y: (vertex.destination.y - bob) * density + d.anchorY * tex.height / CELL
    };
    const all = grid.flat().map(v => v.pixel);
    const left = Math.floor(Math.min(0, ...all.map(p => p.x)));
    const top = Math.floor(Math.min(0, ...all.map(p => p.y)));
    const width = Math.ceil(Math.max(tex.width, ...all.map(p => p.x))) - left;
    const height = Math.ceil(Math.max(tex.height, ...all.map(p => p.y))) - top;
    const canvas = tex.canvas;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const c = canvas.getContext('2d'), buffer = c.createImageData(width, height);
    const layers = d.regions ? splitLegPixels(tex, d) : null;
    const rigidRows = Math.max(0, Math.ceil(d.rigidY * tex.height / CELL - .5));
    for (let y = 0; !layers && y < rigidRows; y++) buffer.data.set(
      tex.pixels.subarray(y * tex.width * 4, (y + 1) * tex.width * 4),
      ((y - top) * width - left) * 4);
    for (const vertex of grid.flat()) {
      vertex.pixel.x -= left; vertex.pixel.y -= top;
    }
    for (let row = 0; row < rows.length - 1; row++) {
      for (let column = 0; column < columns.length - 1; column++) {
        const a = grid[row][column], b = grid[row][column + 1];
        const c = grid[row + 1][column + 1], e = grid[row + 1][column];
        for (const part of [[a, b, c], [a, c, e]]) rasterTriangle(
          part.map(v => v.source), part.map(v => v.pixel), layers?.moving || tex, buffer.data, width, height);
      }
    }
    if (layers) overlayRigidPixels(layers.rigid, tex, buffer.data, width, left, top);
    sealLegJoins(buffer.data, width, height,
      Math.floor(d.rigidY * tex.height / CELL) - top,
      Math.ceil((Math.max(...d.legs.map(foot => foot.rootY)) + 34) * tex.height / CELL) - top,
      (layers ? 15 : 10) * tex.width / CELL);
    c.putImageData(buffer, 0, 0);
    tex.poseKey = poseKey;
    tex.warp = { canvas, x: left / density - d.anchorX * d.unit, y: top / density - d.anchorY * d.unit,
      width: width / density, height: height / density };
    return tex.warp;
  }

  // This cut follows the centre of the original continuous white collar,
  // rather than a rectangle through the gray shoulder marking. Coordinates
  // were checked against the rear cell's actual opaque/white pixels.
  const rearHead = Object.freeze([
    [0, 0], [315, 0], [315, 220], [290, 224], [270, 233],
    [240, 242], [210, 249], [180, 249], [150, 240],
    [130, 227], [100, 214], [0, 214]
  ]);
  function headPath(ctx, d) {
    rearHead.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](
      (x - d.anchorX) * d.unit, (y - d.anchorY) * d.unit));
    ctx.closePath();
  }

  function draw(ctx, image, options = {}) {
    if (!ctx || !image) return false;
    const imageWidth = number(image.naturalWidth || image.width);
    const imageHeight = number(image.naturalHeight || image.height);
    if (imageWidth < 2 || imageHeight < 2) return false;
    const name = options.view || 'rear', d = definition(name);
    const cellWidth = imageWidth / d.gridColumns, cellHeight = imageHeight / d.gridRows;
    const cellX = d.column * cellWidth, cellY = d.row * cellHeight;
    const scale = Math.max(0, number(options.scale, .60));
    const bob = bodyBob(options);
    const active = Math.abs(bob) > 1e-8 || targets(options).some(foot => foot &&
      (Math.abs(number(foot.dx)) > 1e-8 || Math.abs(number(foot.dy)) > 1e-8 || Math.abs(number(foot.bend)) > 1e-8));
    ctx.save();
    ctx.translate(number(options.x), number(options.y));
    ctx.rotate(number(options.rotation)); ctx.scale(scale, scale);
    ctx.translate(0, bob);
    if (options.alpha != null) ctx.globalAlpha *= clamp(number(options.alpha, 1));
    ctx.imageSmoothingEnabled = true;

    const paint = () => {
      if (!active) ctx.drawImage(image, cellX, cellY, cellWidth, cellHeight,
        -d.anchorX * d.unit, -d.anchorY * d.unit, CELL * d.unit, CELL * d.unit);
      else {
        // Head/body vertices remain at their original coordinates. Compositing
        // once also avoids an antialiased horizontal join at rigidY.
        const warped = warpedTexture(ctx, image, name, options, cellWidth, cellHeight);
        ctx.drawImage(warped.canvas, warped.x, warped.y, warped.width, warped.height);
      }
    };
    const headDip = name === 'rear' ? clamp(number(options.headDip)) : 0;
    if (!headDip) paint();
    else {
      // Remove the original head before drawing exactly one rigid head. Body,
      // tail and feet keep their existing placement; no crossfade is involved.
      ctx.save(); ctx.beginPath();
      ctx.rect(-10000, -10000, 20000, 20000); headPath(ctx, d);
      ctx.clip('evenodd'); paint(); ctx.restore();
      // Reuse a continuous pure-white part of the original neck as the small
      // overlap backing. It moves by translation only, with no scaling.
      ctx.drawImage(image,
        cellX + 122 * cellWidth / CELL, cellY + 236 * cellHeight / CELL,
        58 * cellWidth / CELL, 10 * cellHeight / CELL,
        (122 - d.anchorX) * d.unit, (236 - 5 * headDip - d.anchorY) * d.unit,
        58 * d.unit, 10 * d.unit);
      const pivotX = (220 - d.anchorX) * d.unit;
      const pivotY = (231 - d.anchorY) * d.unit;
      ctx.save(); ctx.translate(pivotX, pivotY + 10 * headDip * d.unit);
      ctx.rotate(-.12 * headDip); ctx.translate(-pivotX, -pivotY);
      ctx.beginPath(); headPath(ctx, d); ctx.clip();
      ctx.drawImage(image, cellX, cellY, cellWidth, cellHeight,
        -d.anchorX * d.unit, -d.anchorY * d.unit, CELL * d.unit, CELL * d.unit);
      ctx.restore();
    }
    ctx.restore();
    return true;
  }

  return Object.freeze({ draw, localPoint, footPoints, views });
});

/*
 * 个人形象：纯 Canvas 绘制，所有动作只由传入的时间决定。
 * draw 的原点在双脚落地处；portrait 的原点在脸部中心。
 */
(function (root) {
  'use strict';

  const TAU = Math.PI * 2;
  const paths = new Map();
  const C = {
    skin: '#f5c8a9', skinLight: '#ffdfbe', skinShade: '#d99578',
    hair: '#583524', hairLight: '#744932', eye: '#271914',
    jacket: '#66758a', jacketDark: '#465469', jacketLight: '#8a98a9',
    hat: '#252e37', hatDark: '#19232d', hatLight: '#48535f',
    bag: '#a76842', bagDark: '#78472f', seam: '#c49167'
  };

  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
  function path(ctx, d, fill, stroke, width) {
    let shape = paths.get(d);
    if (!shape) { shape = new Path2D(d); paths.set(d, shape); }
    if (fill) { ctx.fillStyle = fill; ctx.fill(shape); }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width || 1;
      ctx.stroke(shape);
    }
    return shape;
  }
  function ellipse(ctx, x, y, rx, ry, fill, rotation) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rotation || 0, 0, TAU);
    ctx.fillStyle = fill;
    ctx.fill();
  }
  function line(ctx, d, color, width) { path(ctx, d, null, color, width); }
  function gradient(ctx, x0, y0, x1, y1, colors) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    colors.forEach((color, i) => g.addColorStop(i / (colors.length - 1), color));
    return g;
  }
  function glow(ctx, x, y, rx, ry, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx, ry);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(239,151,134,0)');
    ellipse(ctx, 0, 0, 1, 1, g);
    ctx.restore();
  }

  function blinkAt(time) {
    // 小范围自然眨眼；拖动时间时不会重新抽取随机数。
    const t = ((time + 0.73) % 5.6 + 5.6) % 5.6;
    if (t > 5.32) return Math.max(0.055, Math.abs(t - 5.46) / 0.14);
    return 1;
  }

  function eye(ctx, x, y, blink) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, blink);
    const g = ctx.createRadialGradient(-3, -5, 1, 1, 3, 17);
    g.addColorStop(0, '#59443c');
    g.addColorStop(0.3, '#38251f');
    g.addColorStop(1, '#1d1715');
    ellipse(ctx, 0, 0, 10.8, 14.2, g);
    ellipse(ctx, -3.3, -5.8, 3.1, 3.9, 'rgba(255,255,247,.82)', -0.28);
    ellipse(ctx, 3.5, 7.7, 1.25, 1.7, 'rgba(202,148,109,.50)');
    ctx.restore();
  }

  function face(ctx, time, smile) {
    // 耳朵与后脑先画，脸部最后覆盖连接处。
    const earShade = gradient(ctx, -75, -12, 74, 24,
      ['#e5ab8b', '#ffd6b2', '#e3a081']);
    ellipse(ctx, -61, 4, 14, 20, earShade, -0.12);
    ellipse(ctx, 61, 4, 14, 20, earShade, 0.12);
    ellipse(ctx, -64, 4, 7.5, 12, '#e4a68c', -0.12);
    ellipse(ctx, 64, 4, 7.5, 12, '#e4a68c', 0.12);
    path(ctx, 'M-57-43 C-68-31-63-4-54 6 L54 6 C65-8 68-34 56-49 Z', C.hair);

    const skin = gradient(ctx, -37, -52, 42, 62,
      ['#ffddbc', '#f5c6a6', '#eeb494']);
    const faceShape = path(ctx,
      'M-55-39 C-55-65 54-65 56-39 C60-19 60 17 51 34 C43 50 22 56 0 56 C-24 56-45 48-52 34 C-61 18-61-16-55-39Z',
      skin);
    ctx.save();
    ctx.clip(faceShape);
    glow(ctx, -40, 24, 24, 15, 'rgba(235,137,127,.24)');
    glow(ctx, 43, 24, 24, 15, 'rgba(235,137,127,.29)');
    glow(ctx, -15, -10, 45, 48, 'rgba(255,227,190,.15)');
    ctx.restore();

    // 帽檐下仍露出参考形象的蓬松碎刘海。
    path(ctx,
      'M-57-40 C-37-72 23-71 57-41 L54-7 C47-14 47-27 44-32 C40-17 34-22 29-37 C20-25 17-19 12-22 C8-25 8-35 8-40 C0-29-5-23-12-22 C-18-21-18-30-16-38 C-28-24-40-25-45-20 L-50-8 C-57-20-60-30-57-40Z',
      gradient(ctx, -24, -54, 30, -9, ['#794b2e', '#613923', '#40291f']));
    line(ctx, 'M-39-37 Q-26-48-14-48 M19-48 Q32-45 38-37', 'rgba(190,132,85,.16)', 2);

    // 粗眉、圆眼与很轻的笑弧保留原形象的辨识度。
    path(ctx, 'M-43-16 C-41-25-28-27-17-22 C-12-20-12-13-17-13 C-26-16-33-14-39-13 C-42-12-44-13-43-16Z', C.hair);
    path(ctx, 'M16-22 C28-27 41-25 43-16 C44-13 42-12 39-13 C30-15 24-16 17-13 C12-12 12-20 16-22Z', C.hair);
    const blink = blinkAt(time);
    eye(ctx, -25, 5, blink);
    eye(ctx, 25, 5, blink);
    glow(ctx, 0, 21, 7, 5, 'rgba(210,134,98,.22)');
    ellipse(ctx, -1, 19.5, 3, 2, 'rgba(255,226,194,.50)');
    if (smile > 0.42) {
      ctx.save();
      ctx.translate(0, 34);
      ctx.scale(1, 0.7 + 0.3 * smile);
      path(ctx, 'M-10-1 Q0 4 10-1 C8 12-8 12-10-1Z', '#794235');
      path(ctx, 'M-6 8 Q0 3 6 8 Q0 12-6 8Z', '#d6887d');
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.moveTo(-9.5, 33.5);
      ctx.quadraticCurveTo(0, 40 + smile * 7, 10, 33.5);
      ctx.strokeStyle = '#985944';
      ctx.lineWidth = 1.7;
      ctx.stroke();
    }

    // 棒球帽用克制的亮面和拼接线表现圆润体积。
    ellipse(ctx, 1, -92, 6, 3, '#303b45');
    path(ctx,
      'M-64-37 C-66-60-58-77-36-89 C-12-102 18-99 41-86 C58-76 65-55 65-35 L50-31 C28-40-37-37-55-29Z',
      gradient(ctx, -36, -84, 45, -22, ['#475360', '#2b3540', '#1e2833']),
      '#27333e', 0.8);
    line(ctx, 'M-9-96 C-9-79-8-59-8-42', '#1d2832', 1.4);
    line(ctx, 'M-5-96 C-4-78-3-58-3-43', 'rgba(165,183,195,.14)', 0.8);
    line(ctx, 'M-40-86 C-51-68-53-51-53-39 M37-86 C49-68 51-54 53-38', '#23303d', 1.1);
    path(ctx,
      'M-65-35 C-49-39-39-49-20-54 C8-63 27-55 44-43 C53-37 63-31 68-24 C73-14 60-15 51-20 C25-34 15-42-3-39 C-25-38-36-27-53-22 C-65-18-71-24-65-35Z',
      gradient(ctx, -11, -57, 9, -17, ['#52606b', '#293541', '#1c2937']),
      '#263340', 1);
    line(ctx, 'M-63-28 C-39-29-29-47-5-48 C21-50 44-29 64-22', 'rgba(169,190,206,.19)', 1.4);
  }

  function jacket(ctx) {
    const torso = path(ctx,
      'M-16-106 C-27-108-38-100-41-83 L-42-36 C-32-24 30-24 41-36 L38-83 C36-100 27-106 15-106Z',
      gradient(ctx, -30, -100, 38, -32, ['#8796a7', '#66778d', '#485b72']));
    ctx.save();
    ctx.clip(torso);
    for (let i = -48; i < 49; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, -106); ctx.lineTo(i - 4, -28);
      ctx.strokeStyle = 'rgba(214,222,221,.28)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
    ctx.restore();
    path(ctx, 'M-16-103 Q0-109 16-103 L14-32 Q0-28-16-32Z', '#edf0e9');
    path(ctx, 'M-13-104 Q0-93 13-104 L12-96 Q0-86-12-96Z', '#d0d5d2');
    path(ctx, 'M-21-108 L-8-95 L-14-76 L-30-96Z', '#a0acb6', '#65768a', 0.7);
    path(ctx, 'M19-108 L8-95 L15-76 L29-97Z', '#8e9baa', '#5f7185', 0.7);
    path(ctx, 'M-32-100 L-19-109 L-16-101 L-29-91Z', '#8291a2');
    path(ctx, 'M31-100 L20-109 L18-101 L29-91Z', '#76879a');
    ellipse(ctx, -21, -61, 2, 2.2, '#b6c0c7');
    ellipse(ctx, -22, -40, 2, 2.2, '#b6c0c7');
    ellipse(ctx, -21, -61, 0.65, 0.8, '#5b6f82');
    ellipse(ctx, -22, -40, 0.65, 0.8, '#5b6f82');
  }

  function arm(ctx, side, time, wave) {
    ctx.save();
    ctx.translate(side * 31, -95);
    const lift = side > 0 ? wave : 0;
    ctx.rotate(side * (-0.11 - lift * (2.14 + Math.sin(time * 6.4) * 0.18)));
    path(ctx, 'M-9 0 C-15 10-13 23-11 35 Q-1 41 10 35 L12 13 Q14-1 3-5 Q-5-7-9 0Z',
      gradient(ctx, -12, 5, 13, 34, ['#8a99a9', '#5a6d82', '#4a5e74']));
    line(ctx, 'M-5 0 L-5 33 M3-1 L3 34', 'rgba(218,226,224,.27)', 0.7);
    path(ctx, 'M-10 31 Q0 35 10 31 L10 38 Q0 42-10 37Z', '#55697e');
    path(ctx, 'M-8 38 C-13 41-12 52-5 55 C0 58 8 54 10 49 C12 46 10 41 8 38Z',
      gradient(ctx, -9, 37, 10, 55, ['#ffdcba', '#e6ad8d']));
    line(ctx, 'M7 43 Q2 42 3 48', 'rgba(178,108,77,.30)', 0.9);
    ctx.restore();
  }

  function bag(ctx) {
    // 斜挎带和右侧棕色小皮包。
    path(ctx, 'M24-106 L32-101 L-21-30 L-31-32Z', '#384851');
    line(ctx, 'M28-102 L-26-32', 'rgba(155,157,147,.3)', 0.8);
    path(ctx, 'M26-105 L34-101 L33-71 L24-73Z', C.bag, C.bagDark, 0.6);
    path(ctx, 'M24-77 C31-80 42-78 44-72 L42-40 Q30-32 22-40 L22-71 Q22-75 24-77Z',
      gradient(ctx, 22, -70, 44, -38, ['#bb8158', '#a26744', '#895435']), C.bagDark, 0.9);
    path(ctx, 'M25-76 Q32-78 41-74 L40-45 Q32-40 25-45Z', null, '#d19c72', 0.65);
    path(ctx, 'M23-76 Q33-80 43-74 L41-61 Q31-53 23-64Z', '#b57a51', '#8b5437', 0.85);
    ellipse(ctx, 33, -62, 2.1, 2.3, '#e5c78c');
    ellipse(ctx, 32.6, -62.7, 0.8, 0.9, '#ffdeb0');
  }

  function legs(ctx) {
    path(ctx, 'M-29-38 L-4-36 L-5-9 Q-17-4-28-10Z',
      gradient(ctx, -29, -31, -6, -9, ['#3d4d5f', '#566478']));
    path(ctx, 'M5-36 L29-38 L28-10 Q16-4 5-9Z',
      gradient(ctx, 5, -31, 29, -9, ['#3c4b5e', '#596778']));
    path(ctx, 'M-29-13 Q-18-10-7-13 L-5-6 Q-5-1-15 0 L-34 0 Q-42-4-36-9Z',
      '#f5f1e8', '#c6cfc9', 0.7);
    path(ctx, 'M7-13 Q18-10 28-13 L36-8 Q42-1 32 0 L12 0 Q5-1 5-5Z',
      '#f7f4eb', '#c6cfc9', 0.7);
    line(ctx, 'M-36-4 Q-23-2-7-4 M7-4 Q22-2 36-4', '#d2d9d2', 1.2);
    line(ctx, 'M-24-9 L-16-8 M-25-6 L-17-5 M16-8 L24-9 M17-5 L25-6', '#b3bec1', 0.9);
  }

  function draw(ctx, options) {
    const { x = 0, y = 0, scale = 1, time = 0, lean = 0, wave = 0, smile = 0 } = options || {};
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.rotate(lean);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    legs(ctx);
    // 呼吸仅作用于上身，脚底保持落地。
    ctx.translate(0, Math.sin(time * 1.9) * 0.65);
    arm(ctx, -1, time, 0);
    arm(ctx, 1, time, clamp(wave, 0, 1));
    jacket(ctx);
    path(ctx, 'M-10-113 L10-113 L12-98 Q0-90-12-98Z', C.skinShade);
    bag(ctx);
    ctx.translate(0, -145);
    face(ctx, time, clamp(smile, 0, 1));
    ctx.restore();
  }

  function portrait(ctx, options) {
    const { x = 0, y = 0, scale = 1, time = 0, smile = 0 } = options || {};
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // 肩颈向下延伸到 107，便于在手机屏幕中裁切。
    path(ctx, 'M-62 108 C-59 80-37 66-14 62 L14 62 C40 67 58 81 62 108Z',
      gradient(ctx, -42, 65, 50, 110, ['#8f9faf', '#5a6e85']));
    for (let i = -50; i <= 50; i += 9) {
      line(ctx, 'M' + i + ' 83 L' + (i * 1.16) + ' 108', 'rgba(221,228,226,.32)', 0.7);
    }
    path(ctx, 'M-18 65 Q0 72 18 65 L25 108 L-25 108Z', '#edf0e9');
    path(ctx, 'M-11 44 L11 44 L12 68 Q0 78-12 68Z',
      gradient(ctx, -10, 48, 8, 72, ['#db9b7b', '#f6c7a4']));
    path(ctx, 'M-20 62 L-10 72 L-19 87 L-32 68Z', '#a1adba', '#65788f', 0.7);
    path(ctx, 'M20 62 L10 72 L19 87 L32 68Z', '#8799ab', '#65788f', 0.7);
    path(ctx, 'M39 73 L46 78 L19 108 L10 108Z', '#384851');
    face(ctx, time, clamp(smile, 0, 1));
    ctx.restore();
  }

  const AvatarArt = Object.freeze({ draw, portrait });
  if (typeof module !== 'undefined' && module.exports) module.exports = AvatarArt;
  root.AvatarArt = AvatarArt;
})(typeof globalThis !== 'undefined' ? globalThis : this);

/* 原设定分层角色。自拍先保持正常比例，再把整幅预览映射到手机平面。 */
(function(root){
  'use strict';
  const isNode=typeof module==='object'&&module.exports;
  const Motion=isNode?require('./choreography.js'):root.Choreography;
  const CatArt=isNode?require('./vendor/cat.js'):root.CatArt;
  const CatMotion=isNode?require('./cat-motion.js'):root.CatMotion;
  const Puppet=isNode?require('./view-puppet.js'):root.ViewPuppet;
  const Turn=isNode?require('./turn-motion.js'):root.TurnMotion;
  const width=1086,height=1448,sw=600,sh=820;
  const files={scene:'assets/scene-sources/selfie/手机与人物.webp',person:'assets/scene-sources/selfie/我的自拍.webp',
    views:'assets/scene-sources/selfie/小葵原设定补充视角.webp',extra:'assets/scene-sources/selfie/小葵转身与低头.webp',
    outbound:'assets/scene-sources/selfie/小葵朝右下.webp',rear:'assets/scene-sources/selfie/小葵朝左上.webp'};
  // Stop with the visible front paw level with the shutter, then reach the
  // final ten pixels. The diagonal view has a different natural paw baseline.
  const home={x:320,y:691},end={x:770,y:1015.2},catScale=.60;
  const corners=[[207,765],[507,605],[897,886],[575,1080]];
  function homography(p){
    const[a,b,c,d]=p,dx1=b[0]-c[0],dx2=d[0]-c[0],dx3=a[0]-b[0]+c[0]-d[0];
    const dy1=b[1]-c[1],dy2=d[1]-c[1],dy3=a[1]-b[1]+c[1]-d[1],den=dx1*dy2-dx2*dy1;
    const g=(dx3*dy2-dx2*dy3)/den,h=(dx1*dy3-dx3*dy1)/den;
    return(u,v)=>{const z=g*u+h*v+1;return{x:((b[0]-a[0]+g*b[0])*u+(d[0]-a[0]+h*d[0])*v+a[0])/z,
      y:((b[1]-a[1]+g*b[1])*u+(d[1]-a[1]+h*d[1])*v+a[1])/z};};
  }
  const project=homography(corners),triangles=[];
  function addTriangle(source){
    const target=source.map(([x,y])=>project(x/sw,y/sh));
    const[[x0,y0],[x1,y1],[x2,y2]]=source,[p0,p1,p2]=target;
    const det=(x1-x0)*(y2-y0)-(x2-x0)*(y1-y0);
    const a=((p1.x-p0.x)*(y2-y0)-(p2.x-p0.x)*(y1-y0))/det;
    const c=((x1-x0)*(p2.x-p0.x)-(x2-x0)*(p1.x-p0.x))/det;
    const b=((p1.y-p0.y)*(y2-y0)-(p2.y-p0.y)*(y1-y0))/det;
    const d=((x1-x0)*(p2.y-p0.y)-(x2-x0)*(p1.y-p0.y))/det;
    const cx=(p0.x+p1.x+p2.x)/3,cy=(p0.y+p1.y+p2.y)/3;
    const edge=target.map(p=>{const dx=p.x-cx,dy=p.y-cy,n=Math.hypot(dx,dy);return{x:p.x+dx/n*2.5,y:p.y+dy/n*2.5};});
    triangles.push({edge,matrix:[a,b,c,d,p0.x-a*x0-c*y0,p0.y-b*x0-d*y0]});
  }
  for(let y=0;y<8;y++)for(let x=0;x<6;x++){
    const x0=x*sw/6,x1=(x+1)*sw/6,y0=y*sh/8,y1=(y+1)*sh/8;
    addTriangle([[x0,y0],[x1,y0],[x1,y1]]);addTriangle([[x0,y0],[x1,y1],[x0,y1]]);
  }
  let assets,screen,sc,loading,make;
  async function loadAssets(loader,makeCanvas){
    if(assets)return;if(loading)return loading;
    loader||=(path)=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('无法载入图片：'+path));i.src=path;});
    makeCanvas||=((w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;});make=makeCanvas;
    loading=(async()=>{
      assets=Object.fromEntries(await Promise.all(Object.entries(files).map(async([k,f])=>[k,await loader(f)])));
      screen=make(sw,sh);sc=screen.getContext('2d');
    })();
    try{await loading;}catch(e){assets=null;loading=null;throw e;}
  }
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=v=>(v=clamp(v),v*v*(3-2*v));
  function restFeet(view){return view==='factory'?CatArt.reference.xiaokui.feet:
    Puppet.footPoints({view,scale:1}).map(f=>({x:f.x,y:f.y}));}
  function viewPose(m,view){
    const rest=restFeet(view),facing=1;
    const footTargets=m.feet.map((foot,i)=>({...m.state.footTargets[i],
      dx:((foot.x-m.x)/m.scale-rest[i].x)/facing,dy:(foot.y-m.y)/m.scale-rest[i].y,
      contact:foot.contact,lift:foot.lift/m.scale,anchorKey:foot.anchorKey,phase:foot.phase}));
    return{...m,view,facing,footTargets,state:{...m.state,footTargets}};
  }
  function viewBlend(p){
    const f=p.sourceFrame;
    if(f>=133&&f<=177||f>=318&&f<=337){
      const returning=f>=318,first=returning?318:133,last=returning?337:177;
      const views=returning?['outbound','front','left','rear']:['rear','left','front','outbound'];
      const q=clamp((f-first)/(last-first))*3;
      // Draw one solid pose per frame, like the reference's held animation
      // drawings. Never dissolve two different heads over one another.
      return[{view:views[Math.min(3,Math.floor(q+.5))],weight:1}];
    }
    return[{view:f<133||f>=338?'rear':'outbound',weight:1}];
  }
  function catState(p){
    const view=exteriorView(p),baseView=view==='dip'?'rear':view;
    const footClearance=baseView==='factory'
      ?CatArt.reference.xiaokui.feet.map((foot,i)=>foot.y-CatArt.reference.xiaokui.roots[i].y-8)
      :Puppet.views[baseView].legs.map(foot=>(foot.y-foot.rootY)*Puppet.views[baseView].unit-13);
    const m=CatMotion.at(p.sourceFrame,{home,end,scale:catScale,facing:1,
      restFeet:restFeet(baseView),footClearance});
    const turn=Turn.at(p.sourceFrame,{center:m,scale:m.scale,currentView:baseView,
      targetAxisX:1,
      restFeet:Object.fromEntries(['rear','left','front','outbound'].map(v=>[v,restFeet(v)]))});
    if(turn){m.feet=turn.worldFeet;Object.assign(m,{turnProgress:turn.progress,activeFoot:turn.activeFoot,turn});}
    return viewPose(m,view);
  }
  function catPosition(p){const m=catState(p);return{x:m.x,y:m.y};}
  function previewState(p,m){
    const f=p.sourceFrame;
    const facingLens=f<133?1:f<172?1-smooth((f-133)/38):f<318?0:f<338?smooth((f-318)/19):1;
    const distance=Math.hypot(m.x-home.x,m.y-home.y);
    const nod=p.headDip*60;
    const originY=230+distance*2.8+(1-facingLens)*150+nod;
    // The opening has only the person. The cat enters the selfie on its return;
    // its position and head orientation still follow the exterior state.
    const catVisible=f>=Motion.events.returning.startFrame&&originY<sh+50;
    return{facingLens,catVisible,faceVisible:catVisible&&facingLens>.55,centerX:300-(m.x-home.x)*.3,
      originY,size:660,
      portraitScaleX:1,portraitScaleY:1,mirrorCount:1};
  }
  function drawPreview(c,time,includeUI=true){
    if(!assets)throw Error('请先载入素材');
    const p=Motion.at(time),m=catState(p),v=previewState(p,m),cell=assets.views.width/2;
    c.save();c.clearRect(0,0,sw,sh);c.fillStyle='#fff';c.fillRect(0,0,sw,sh);
    // One selfie mirror. Portraits undergo rigid rotation and UNIFORM scale only.
    c.translate(sw,0);c.scale(-1,1);
    c.save();c.translate(300,230);c.rotate(Math.PI);
    c.drawImage(assets.person,-300,-300,600,600);c.restore();
    if(v.catVisible){
      const col=v.faceVisible?0:1;
      c.drawImage(assets.views,col*cell,0,cell,cell,v.centerX-v.size/2,v.originY,v.size,v.size);
    }
    c.restore();
    if(includeUI&&p.countdown){
      c.save();c.font='500 128px Arial,sans-serif';c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
      c.lineWidth=5;c.strokeStyle='#3e333b';c.strokeText(String(p.countdown),300,455);
      c.fillStyle='#fff';c.fillText(String(p.countdown),300,455);c.restore();
    }
    return v;
  }
  function drawScreen(c){
    c.save();c.beginPath();corners.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
    for(const{edge,matrix}of triangles){c.save();c.beginPath();edge.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));
      c.closePath();c.clip();c.transform(...matrix);c.drawImage(screen,0,0);c.restore();}
    c.restore();
  }
  function drawShadow(c,m,p){
    c.save();c.translate(m.x,m.y+2);c.scale(1,.27);
    const g=c.createRadialGradient(0,0,1,0,0,51);g.addColorStop(0,'rgba(18,26,21,.24)');g.addColorStop(1,'rgba(18,26,21,0)');
    c.fillStyle=g;c.beginPath();c.arc(0,0,51,0,Math.PI*2);c.fill();c.restore();
    const feet=exteriorFeet(p,m);
    for(const foot of feet){if(!foot.contact||p.fall>.05)continue;
      c.save();c.globalAlpha=.12;c.fillStyle='#273326';c.beginPath();c.ellipse(foot.x,foot.y+2,8,2.5,0,0,Math.PI*2);c.fill();c.restore();}
  }
  function exteriorView(p){
    return viewBlend(p).reduce((a,b)=>a.weight>=b.weight?a:b).view;
  }
  function exteriorFeet(p,m){
    const pose=viewPose(m,exteriorView(p));
    const points=pose.view==='factory'?CatMotion.modelFeet(CatArt.model(pose.state,pose.time),pose):
      Puppet.footPoints({view:pose.view,x:pose.x,y:pose.y,scale:pose.scale,
        footTargets:pose.state.footTargets,facing:pose.facing,bodyBob:pose.state.bodyBob});
    return points.map((foot,i)=>({...m.feet[i],x:foot.x,y:foot.y}));
  }
  function drawCat(c,p,m){
    c.save();
    // A brief cartoon tumble is a rigid rotation around the feet, never a squash.
    const pivot=exteriorFeet(p,m)[3];
    c.translate(pivot.x,pivot.y);c.rotate(p.fall*.92);c.translate(-pivot.x,-pivot.y);
    for(const part of viewBlend(p)){
      const pose=viewPose(m,part.view);c.save();c.globalAlpha=part.weight;
      if(part.view==='factory')CatArt.draw(c,pose.state,m.time,{x:m.x,y:m.y,scale:m.scale,noBlink:true});
      else Puppet.draw(c,assets[part.view]||(['front','dip'].includes(part.view)?assets.extra:assets.views),
        {view:part.view,x:m.x,y:m.y,scale:m.scale,footTargets:pose.state.footTargets,
          facing:pose.facing,time:m.time,headDip:p.headDip/.4,bodyBob:pose.state.bodyBob});
      c.restore();
    }
    c.restore();
  }
  function render(c,time,part){
    const show=id=>!part||part===id;
    if(!assets)throw Error('请先等待 Film.loadAssets()');
    const p=Motion.at(time),m=catState(p);
    c.save();c.clearRect(0,0,width,height);if(show('scene'))c.drawImage(assets.scene,0,0,width,height);
    if(show('screen')){drawPreview(sc,time);drawScreen(c);}
    if(show('screen')&&p.shutterPress){c.save();c.translate(790,1026);c.rotate(.15);c.beginPath();c.ellipse(0,0,34,23.5,0,0,Math.PI*2);c.fillStyle='#fff';c.fill();c.restore();}
    if(show('cat')){drawShadow(c,m,p);drawCat(c,p,m);}c.restore();
  }
  const api=Object.freeze({width,height,previewWidth:sw,previewHeight:sh,duration:Motion.duration,files,loadAssets,
    render,renderPhone(c,time){drawPreview(sc,time);drawScreen(c);},drawShadow,renderPreview:drawPreview,at:Motion.at,project,catPosition,catState,previewState,
    exteriorView,exteriorFeet,viewBlend,viewPose,drawCat,CatArt,CatMotion});
  if(isNode)module.exports=api;else root.Film=api;
})(typeof globalThis==='object'?globalThis:this);

 const Film=S.env.Film;
 const ready=Film.loadAssets(S.image,S.canvas);
 return {ready,draw(t,mode,part){const c=S.ctx,p=Film.at(t),m=Film.catState(p);
  if(mode==='full'){Film.render(c,t,part==='art'?null:part);return;}
  // 走位动作保留原手机底图与屏幕，作为转身和返回的位置参照。
  if(mode==='cat-phone'){Film.render(c,t);return;}
  // 独立自拍也保留原手机底图，屏幕内容仍按原四角透视绘制。
  if(mode==='preview'||mode==='phone'){Film.render(c,t,'scene');Film.renderPhone(c,t);return;}
  if(mode==='cat'){Film.drawShadow(c,m,p);Film.drawCat(c,p,m);return;}
 },inspect:t=>{const p=Film.at(t),m=Film.catState(p);return {phase:p.phase,frame:p.sourceFrame,view:Film.exteriorView(p),position:Film.catPosition(p),feet:Film.exteriorFeet(p,m),press:p.shutterPress};}};

}
};
})(globalThis);

/* SCENE ENTRIES */
WiseSceneRuntime.register("selfie-foot-turn",{"family": "selfie", "mode": "cat-phone", "start": 0, "width": 1086, "height": 1448});
WiseSceneRuntime.register("selfie-cat-illustration",{"family": "selfie", "mode": "cat", "start": 0, "width": 1086, "height": 1448});
WiseSceneRuntime.register("selfie-preview-illustration",{"family": "selfie", "mode": "preview", "start": 0, "width": 1086, "height": 1448});
WiseSceneRuntime.register("selfie-phone-screen-illustration",{"family": "selfie", "mode": "phone", "start": 0, "width": 1086, "height": 1448});
WiseSceneRuntime.register("xiaokui-selfie-journey",{"family": "selfie", "mode": "full", "start": 0, "width": 1086, "height": 1448, "breakdown": [{"id": "scene", "name": "手机与人物底图", "start": 0, "end": 7750, "time": "0—7.75秒", "detail": "手机与人物的位置和比例保持，使用自有透明图集。", "actions": ["selfie-phone-illustration"]}, {"id": "screen", "name": "自拍画面与快门", "start": 0, "end": 7750, "time": "0—7.75秒", "detail": "自拍画面在手机透视屏幕内更新，只镜像一次；倒数与按下快门按同一时序出现。", "actions": ["selfie-preview-illustration", "selfie-phone-screen-illustration"]}, {"id": "cat", "name": "小葵走位、转身与低头", "start": 0, "end": 7750, "time": "0—7.75秒", "detail": "小葵从手机旁走开、转身、低头、返回，脚步与影子跟随实际位置。", "actions": ["selfie-foot-turn", "selfie-cat-illustration"]}], "layers": ["scene", "screen", "cat"]});
