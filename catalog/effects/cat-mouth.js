/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
/* 小猫加工厂的原猫路径与口型；仅用 SVG 承接原绘图调用，移除外围场景。 */
(function(global){
 'use strict';
 const local={};
 class Path2D {
  constructor(d=''){this.d=d;}
  addPath(path){this.d+=' '+path.d;}
 }
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
    const bob = Math.sin(gait * Math.PI * 4) * 0.4 * moving;
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
      const delta = (u < 0.64 ? reach * (1 - 2 * u / 0.64) : -reach + reach * 2 * ease(swing / 0.7)) * moving;
      const liftHeight = shape === XIAOKUI ? (i === 3 ? 9.5 : 6) : (i === 3 ? 20.5 : 13);
      const lift = (u < 0.64 ? 0 : Math.sin(Math.PI * swing) * liftHeight) * moving;
      const deform = (x, y) => {
        // Her short legs need an even bend: the old concentrated deformation
        // compressed the round sleeve into a wedge during the forward swing.
        const weight = shape === XIAOKUI
          ? clamp((y - shape.roots[i][1]) / (shape.feet[i][1] - shape.roots[i][1]))
          : ease((y - shape.roots[i][1]) / (-12 - shape.roots[i][1]));
        return [x + delta * weight, y + bob * (1 - weight) - lift * weight];
      };
      return { commands: mapCommands(legShape, deform), x: shape.roots[i][0], rootY: shape.roots[i][1] + bob,
        footX: shape.feet[i][0] + delta, footY: shape.feet[i][1] - lift, delta, lift, deform, phase: u, planted: u < 0.64 };
    });
    return { body, head, tail, legs, bob, tailTransform, tailRoot, stride,
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
    if (ctx.canvas && typeof document !== 'undefined' && document.createElement) {
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
      ctx.restore(); return;
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
    ctx.restore();
  }
  const api = Object.freeze({ model, draw });
  root.CatArt = api;
})(local);
 const landmarks=[[0,0],[.07,.55],[.16,.38],[.34,.85],[.50,1],[.70,.7],[.82,.85],[1.02,.28],[1.20,0]];
 const clamp=v=>Math.max(0,Math.min(1,v));
 function opening(ms){
  const t=ms/1000-.24;
  if(t<=0||t>=1.2)return 0;
  for(let i=1;i<landmarks.length;i++)if(t<=landmarks[i][0]){
   const [end,b]=landmarks[i],[start,a]=landmarks[i-1],p=clamp((t-start)/(end-start));return a+(b-a)*p*p*(3-2*p);
  }
  return 0;
 }
 // 原绘图的 save/restore、路径填色与裁切，在同一坐标关系下写入 SVG。
 function drawing(prefix){
  let state={transform:'',clips:[],globalAlpha:1,fillStyle:'#000',strokeStyle:'#000',lineWidth:1,lineCap:'butt',lineJoin:'miter'},stack=[],path='',defs=[],shapes=[];
  const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
  const ctx={
   save(){stack.push({...state,clips:[...state.clips]});},restore(){state=stack.pop();},
   translate(x,y){state.transform+=` translate(${x} ${y})`;},scale(x,y){state.transform+=` scale(${x} ${y})`;},
   beginPath(){path='';},
   ellipse(x,y,rx,ry,rotation,start,end){
    if(rotation!==0||Math.abs(end-start-Math.PI*2)>1e-6)throw Error('猫咪插画仅使用原完整椭圆。');
    path+=`M${x-rx} ${y}a${rx} ${ry} 0 1 0 ${rx*2} 0a${rx} ${ry} 0 1 0 ${-rx*2} 0Z`;
   },
   clip(p){const id=prefix+'-'+defs.length;defs.push(`<clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="${esc(p?.d||path)}" transform="${state.transform}"/></clipPath>`);state.clips.push(id);},
   fill(p){shape(p?.d||path,false);},stroke(p){shape(p?.d||path,true);},
   fillRect(x,y,w,h){shape(`M${x} ${y}h${w}v${h}h${-w}Z`,false);}
  };
  for(const key of Object.keys(state))if(!['transform','clips'].includes(key))Object.defineProperty(ctx,key,{get:()=>state[key],set:value=>{state[key]=value;}});
  function shape(d,stroke){
   const paint=stroke?`fill="none" stroke="${esc(state.strokeStyle)}" stroke-width="${state.lineWidth}" stroke-linecap="${state.lineCap}" stroke-linejoin="${state.lineJoin}"`:`fill="${esc(state.fillStyle)}"`;
   let markup=`<path d="${esc(d)}" transform="${state.transform}" opacity="${state.globalAlpha}" ${paint}/>`;
   for(const id of state.clips)markup=`<g clip-path="url(#${id})">${markup}</g>`;shapes.push(markup);
  }
  return {ctx,markup:()=>`<defs>${defs.join('')}</defs><g data-part="cat">${shapes.join('')}</g>`};
 }
 let serial=0;
 const F=global.MotionFactories=global.MotionFactories||{};
 F['cat-mouth-illustration']=(root,K,def)=>{
  const prefix='cat-mouth-'+(++serial);
  root.innerHTML='<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true"></svg>';
  const svg=root.firstElementChild;let last;
  return ms=>{
   const amount=opening(Math.max(0,Math.min(def.duration_ms,ms)));
   if(amount===last)return;last=amount;
   const draw=drawing(prefix);
   const state={x:0,index:0,walking:0,walkDistance:0,tailLift:1,coat:1,baseCoat:1,recipe:{kind:'xiaokui',ink:'#666560',base:'#FFFFFF'},reaction:{puff:0,hiss:amount}};
   local.CatArt.draw(draw.ctx,state,5+ms/1000,{x:320,y:315,scale:1.72,noBlink:true});
   svg.innerHTML=draw.markup();svg.dataset.opening=String(amount);
  };
 };
})(globalThis);
