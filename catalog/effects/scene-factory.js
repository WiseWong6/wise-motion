/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
/* 迁入自有原作，绘制函数与原数据共用；移除原界面、独立时钟和音频。 */
(function(global){
 global.WiseSceneSources.factory=function(S,opt,def){

 with(S.env){
/* Shared deterministic choreography: time in seconds, positions in a 900 × 1200 scene. */
(function (root) {
  'use strict';
  const recipes = Object.freeze([
    { name: '小葵', ink: '#666560', base: '#FFFFFF', kind: 'xiaokui' },
    { name: '银渐层（条纹版）', ink: '#7E818D', base: '#D3D2D7', kind: 'silver' },
    { name: '银渐层（无虎纹）', ink: '#A0A4B0', base: '#EBECF0', kind: 'silvershaded' },
    { name: '金渐层', ink: '#E7B675', base: '#F7D3A3', kind: 'gold' },
    { name: '金渐虎纹', ink: '#996337', base: '#F7D3A3', kind: 'goldtabby' },
    { name: '黑猫', ink: '#1D233C', base: '#1D233C', kind: 'solid' },
    { name: '橘猫', ink: '#BD7639', base: '#EC9C53', cream: '#FCEACA', kind: 'ginger' },
    { name: '橘白', ink: '#E99C43', base: '#FFFFFF', kind: 'orangewhite' },
    { name: '蓝白', ink: '#344A80', base: '#FFFFFF', kind: 'bicolor' },
    { name: '狸花猫', ink: '#806953', base: '#C7AE96', kind: 'tabby' },
    { name: '暹罗猫', ink: '#594238', base: '#FFF1DE', kind: 'points' },
    { name: '三花', ink: '#43455E', base: '#FFFFFF', accent: '#E5914C', kind: 'calico' },
    { name: '纯灰', ink: '#61647D', base: '#9097AF', eye: '#FBBF55', kind: 'gray' },
    { name: '豹猫', ink: '#805638', base: '#E4B76D', accent: '#C48B4C', cream: '#FBE6BC', kind: 'bengal' },
    { name: '纯白', ink: '#FFFFFF', base: '#FFFFFF', kind: 'white', malfunction: true }
  ].map(Object.freeze));
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = v => { const x = clamp(v); return x * x * (3 - 2 * x); };
  const lerp = (a, b, v) => a + (b - a) * v;
  const mod = (v, n) => ((v % n) + n) % n;
  // Five distinct ordinary-cat recordings; white has its own quiet, plaintive call.
  // Durations are scene seconds; mouth landmarks are original recording seconds.
  const voiceShapes = {
    meow: [[.04, 0], [.14, 1], [.22, .92], [.32, .65], [.50, 0]],
    'meow-soft': [[.02, 0], [.10, .2], [.30, .6], [.50, 1], [.565, 0]],
    'meow-bright': [[.07, 0], [.14, 1], [.24, .72], [.36, 1], [.44, .82], [.535, 0]],
    'meow-low': [[.035, 0], [.10, 1], [.28, .82], [.40, .3], [.475, 0]],
    'meow-white': [[.005, 0], [.055, .52], [.105, .65], [.20, .36], [.32, .18], [.45, 0]]
  };
  const voices = Object.freeze(Object.fromEntries([
    ['silver', 'meow-soft', 1.04, .62], ['silvershaded', 'meow-soft', .99, .60],
    ['gold', 'meow', 1.04, .66], ['goldtabby', 'meow-bright', 1, .60],
    ['solid', 'meow-low', .98, .64], ['ginger', 'meow-bright', .99, .64],
    ['orangewhite', 'meow-bright', 1.05, .61], ['bicolor', 'meow', 1, .68],
    ['tabby', 'meow-low', 1.04, .62], ['points', 'meow-bright', 1.08, .60],
    ['calico', 'meow', 1.07, .65], ['gray', 'meow-low', 1, .62],
    ['bengal', 'meow-low', 1.06, .64], ['white', 'meow-white', .98, .43]
  ].map(([kind, clip, pitch, gain]) => [kind, Object.freeze({ clip, start: 5.2,
    duration: .572 / pitch, pitch, gain,
    mouth: Object.freeze(voiceShapes[clip].map(point => Object.freeze(point))) })])));
  function voiceFor(recipe) { return voices[recipe?.kind] || null; }
  const xiaokuiVoice = Object.freeze({ clip: 'angry', start: 5.24, duration: 1.20, pitch: 1, gain: .58,
    mouth: Object.freeze([[0, 0], [.07, .55], [.16, .38], [.34, .85], [.50, 1],
      [.70, .7], [.82, .85], [1.02, .28], [1.20, 0]].map(Object.freeze)) });
  function recipeIndexFromSearch(search = '') {
    const choice = new URLSearchParams(search).get('cat');
    return recipes.findIndex(recipe => recipe.kind === choice || recipe.name === choice);
  }
  function catX(age) {
    if (age < 0) {
      const cycle = Math.floor(age / 8);
      const phase = age - cycle * 8;
      return 175 + cycle * 205 + 205 * ease((phase - 5.8) / 2.2);
    }
    if (age < 1.2) return lerp(175, 435, ease(age / 1.2));
    if (age <= 5.8) return 435;
    return lerp(435, 1040, ease((age - 5.8) / 2.2));
  }
  function beltPosition(time) {
    const round = Math.floor(time / 8), p = time - round * 8;
    const local = p < 1.2 ? ease(p / 1.2) * 0.48 : 0.48 + ease((p - 5.8) / 2.2) * 0.52;
    return (round + local) * 50;
  }
  function xiaokuiReaction(age) {
    // Reuse the approved bared-teeth face for the angry call; departure never waits.
    return { puff: 0, hiss: voiceOpening(age, xiaokuiVoice) };
  }
  function meowOpening(age, recipe) {
    return voiceOpening(age, voiceFor(recipe));
  }
  function voiceOpening(age, voice) {
    if (!voice) return 0;
    const t = (age - voice.start) * voice.pitch, mouth = voice.mouth;
    if (t <= mouth[0][0] + 1e-9 || t >= mouth[mouth.length - 1][0] - 1e-9) return 0;
    for (let i = 1; i < mouth.length; i++) {
      const [end, amount] = mouth[i], [start, previous] = mouth[i - 1];
      if (t <= end) return lerp(previous, amount, ease((t - start) / (end - start)));
    }
    return 0;
  }
  function xiaokuiOverload(phase) {
    const strength = ease((phase - 3.7) / .16) * (1 - ease((phase - 5.2) / .18));
    if (!strength) return { strength: 0, kick: 0 };
    // Push quickly into the gauge's hard stop, hold, then recoil a little.
    // Each cycle meets the next with zero velocity; only the needle moves.
    const pulse = mod((phase - 3.7) / .19, 1);
    const recoil = pulse < .3 ? 1 - ease(pulse / .3)
      : pulse < .56 ? 0 : ease((pulse - .56) / .44);
    return { strength, kick: -.12 * strength * recoil };
  }
  function catState(time, index) {
    const age = time - index * 8;
    const x = catX(age);
    const speed = (catX(age + 0.002) - catX(age - 0.002)) / 0.004;
    const recipe = recipes[mod(index, recipes.length)];
    return {
      index, age, x, speed, walkDistance: x - beltPosition(time), walking: clamp(Math.abs(speed) / 100),
      // Main color starts after the liquid reaches the cat; secondary color follows the wand mist.
      baseCoat: recipe.malfunction ? 0 : ease((age - 3.6) / 0.62), coat: recipe.malfunction ? 0 : ease((age - 4.39) / 0.81),
      tailLift: ease((age - 4.8) / 0.4), recipe,
      reaction: recipe.kind === 'xiaokui' ? xiaokuiReaction(age) : { puff: 0, hiss: 0, meow: meowOpening(age, recipe) }
    };
  }
  const primary = recipe => ['bicolor', 'xiaokui', 'orangewhite'].includes(recipe.kind) ? recipe.ink : recipe.base;
  const secondary = recipe => ['bicolor', 'xiaokui', 'orangewhite'].includes(recipe.kind) ? '#FFFFFF' : recipe.kind === 'solid' ? '#F9CD77' : recipe.kind === 'gray' ? recipe.eye : recipe.ink;
  function beanColors(recipe) {
    if (recipe.beanColors && recipe.beanColors.length) return recipe.beanColors;
    if (['solid', 'gray', 'white'].includes(recipe.kind)) return [recipe.base];
    if (['calico', 'bengal'].includes(recipe.kind)) return [recipe.base, recipe.accent, recipe.ink];
    if (['bicolor', 'xiaokui', 'orangewhite'].includes(recipe.kind)) return [recipe.ink, recipe.base];
    return [recipe.base, recipe.ink];
  }
  const BEAN_BATCH = [
    [257, 293, -.7], [282, 293, .7], [307, 294, -.4], [332, 293, .5], [354, 291, -.6],
    [269, 277, -.4], [295, 277, 1.1], [320, 277, -.7], [344, 275, .65],
    [284, 261, .7], [308, 260, -.6], [332, 261, 1.1]
  ];
  const REFILL_START = 5.2; // Refill after the wand finishes spraying this cat.
  const CLEANUP_START = 5.8; // Unload this batch as its cat starts leaving.
  const PUCK_RELEASE = 6.82;
  const PUCK_FLIGHT = .45;
  const puckLayout = Object.freeze({ columns: 5, rows: 3, startX: 274, startY: 956,
    columnGap: 88, rowGap: 88, faceWidth: 58, dropLift: 34, top: 924, bottom: 1168 });
  function puckSlot(index) {
    const slot = mod(index, recipes.length);
    const row = Math.floor(slot / puckLayout.columns);
    const inRow = Math.min(puckLayout.columns, recipes.length - row * puckLayout.columns);
    const rowStart = 450 - (inRow - 1) * puckLayout.columnGap / 2;
    return { x: rowStart + (slot % puckLayout.columns) * puckLayout.columnGap,
      y: puckLayout.startY + row * puckLayout.rowGap };
  }
  function puckDrop(index = 0) {
    const slot = puckSlot(index);
    return { x: slot.x, y: slot.y - puckLayout.dropLift };
  }
  function collectedPucks(time, startTime = 0) {
    const first = Math.max(0, Math.floor(startTime / 8));
    const last = Math.floor((Math.max(0, time) - PUCK_RELEASE + 1e-9) / 8);
    if (last < first) return [];
    const result = [];
    for (let slot = 0; slot < recipes.length && first + slot <= last; slot++) {
      // One permanent place per recipe. Later cycles replace only that recipe.
      const index = first + slot + Math.floor((last - first - slot) / recipes.length) * recipes.length;
      const target = puckSlot(index, startTime), origin = puckDrop(index, startTime);
      const age = Math.max(0, time - (index * 8 + PUCK_RELEASE));
      const falling = age < PUCK_FLIGHT;
      // Clear only the place about to be refilled, before the new face appears.
      const nextRound = Math.floor(Math.max(0, time) / 8);
      const replacing = index === nextRound - recipes.length;
      const alpha = replacing ? 1 - ease((time - (nextRound * 8 + PUCK_RELEASE - .16)) / .16) : 1;
      const u = clamp(age / PUCK_FLIGHT);
      const settle = clamp((age - PUCK_FLIGHT) / .12);
      result.push({ index, recipe: recipes[mod(index, recipes.length)], x: target.x,
        y: falling ? lerp(origin.y + 3, target.y, u * u) : target.y - 3 * Math.sin(Math.PI * settle),
        angle: falling ? Math.sin(Math.PI * u) * .8 : 0, alpha, falling });
    }
    return result;
  }
  function hopperBeans(phase, prefilled = false, hold = false) {
    // After the opening, this batch was filled during the previous cat's turn.
    return BEAN_BATCH.flatMap(([x, y, angle], id) => {
      const birth = id * .032, land = birth + .68 + (id % 3) * .012;
      const drain = .98 + id * .012, end = drain + .32;
      if ((!prefilled && phase < birth) || (!hold && phase >= end)) return [];
      if (!prefilled && phase < land) {
        const u = (phase - birth) / (land - birth);
        return [{ id, x: x + Math.sin(id * 4.31) * 9 * (1 - u),
          y: lerp(-24, y, u * u), angle: angle + (1 - u) * (id % 2 ? -1.4 : 1.4), scale: 1 }];
      }
      const u = hold ? 0 : ease((phase - drain) / (end - drain));
      return [{ id, x: lerp(x, 306, u), y: lerp(y, 362, u),
        angle: angle + u * (id % 2 ? -.45 : .45), scale: 1 }];
    });
  }
  function refillBeans(phase) {
    // Keep the cadence while letting each bean fall more slowly. Once landed,
    // the next batch waits in the hopper until its own grinding turn.
    if (phase < REFILL_START) return [];
    return hopperBeans(phase - REFILL_START, false, true);
  }
  function handlePose(p, hasUsedPuck = true, drop = puckDrop()) {
    // Yaw turns about the basket's upright axis; roll is used only to empty it.
    let x = 435, y = 598, yaw = 0, roll = 0;
    if (p < 0.3) yaw = lerp(0, -1.0, ease(p / 0.3));
    else if (p < 0.5) { yaw = -1; y += 28 * ease((p - 0.3) / 0.2); }
    else if (p < (hasUsedPuck ? 2.14 : 1.5)) {
      yaw = -1;
      if (hasUsedPuck) {
        if (p < 0.86) {
          const u = ease((p - 0.5) / 0.36);
          x = lerp(435, drop.x, u); y = lerp(626, drop.y - 19, u); roll = Math.PI * u;
        } else if (p < 1.14) {
          // A short downward flick releases the face without striking an object.
          x = drop.x; roll = Math.PI;
          y = drop.y + (p < 1.02 ? lerp(-19, 0, ease((p - 0.86) / 0.16)) : lerp(0, -19, ease((p - 1.02) / 0.12)));
        } else {
          // Return from this cat's own release point before the next cat.
          const u = ease((p - 1.14) / 1.0);
          x = lerp(drop.x, 305, u); y = lerp(drop.y - 19, 638, u); roll = Math.PI * (1 - u);
        }
      } else {
        const u = ease((p - 0.5) / 0.7);
        x = lerp(435, 305, u); y = lerp(626, 638, u);
      }
    } else if (p < 2.45) { x = 305; y = 638; yaw = -1; }
    else if (p < 2.88) {
      const u = ease((p - 2.45) / 0.43);
      x = lerp(305, 435, u); y = 638 + Math.sin(Math.PI * u) * 30 - 16 * u; yaw = -1;
    } else if (p < 3.08) { y = lerp(622, 598, ease((p - 2.88) / 0.2)); yaw = -1; }
    else if (p < 3.35) yaw = lerp(-1, 0, ease((p - 3.08) / 0.27));
    return { x, y, yaw, roll,
      loading: p >= 1.56 && p < 2.38,
      powder: hasUsedPuck && p < 1.02 ? 1 : ease((p - 1.62) / 0.78),
      used: hasUsedPuck && p < 1.02,
      locked: p >= 3.35 || p === 0 };
  }
  function wandPose(p) {
    const active = ease((p - 3.9) / 0.35) * (1 - ease((p - 5.25) / 0.45));
    const sweep = ease((p - 4.2) / 0.9);
    return { active, x: lerp(647, 579 + 14 * sweep, active), y: lerp(718, 705 + 15 * sweep, active),
      targetX: lerp(507, 362, sweep), targetY: lerp(760, 779, sweep),
      spraying: p >= 4.2 && p < 5.2 };
  }
  function coffeeFlow(p) {
    // A 0.25 s fall crosses the 138 px gap from the exposed basket to the back.
    const start = 3.35, stop = 4.3, flight = .25, distance = 138;
    if (p <= start || p >= stop + flight) return null;
    const fall = dt => distance * clamp(dt / flight) ** 2;
    const top = fall(Math.max(0, p - stop));
    const bottom = fall(p - start);
    return bottom > top ? { top, bottom } : null;
  }
  function stateAt(time, collectionStart = 0) {
    const t = Math.max(0, time);
    const round = Math.floor(t / 8);
    const phase = t - round * 8;
    const recipe = recipes[mod(round, recipes.length)];
    const malfunction = !!recipe.malfunction;
    const overload = recipe.kind === 'xiaokui' ? xiaokuiOverload(phase) : { strength: 0, kick: 0 };
    const wand = wandPose(phase);
    if (malfunction) wand.spraying = false;
    const cleaning = phase >= CLEANUP_START;
    // Cleanup belongs to the outgoing cat. Later rounds begin with the empty
    // basket already under the grinder, so the same puck is never knocked twice.
    const handle = cleaning
      ? handlePose(Math.min(phase - CLEANUP_START, 2.14), true, puckDrop(round, collectionStart))
      : handlePose(round > 0 ? Math.max(phase, 1.5) : phase, false);
    if (cleaning) {
      handle.loading = false;
      handle.used = phase < PUCK_RELEASE;
      handle.powder = handle.used ? 1 : 0;
    }
    return {
      time: t, round, phase, recipe, malfunction,
      faultLight: malfunction && phase >= 3.35 && phase < 5.2 && Math.floor((phase - 3.35) * 6) % 2 === 0,
      previousRecipe: recipes[mod(round - 1, recipes.length)],
      hopper: phase < REFILL_START ? hopperBeans(phase, round > 0) : refillBeans(phase),
      hopperRecipe: recipes[mod(round + (phase >= REFILL_START ? 1 : 0), recipes.length)],
      handle, wand,
      flow: malfunction ? null : coffeeFlow(phase),
      pressure: malfunction ? 0 : ease((phase - 3.35) / 0.35) * (1 - ease((phase - 5.2) / 0.45)),
      overload: overload.strength, pressureKick: overload.kick,
      brewing: !malfunction && phase >= 3.35 && phase < 4.3,
      puck: phase >= PUCK_RELEASE && phase < PUCK_RELEASE + PUCK_FLIGHT ? (phase - PUCK_RELEASE) / PUCK_FLIGHT : null,
      pucks: collectedPucks(t, collectionStart),
      cats: Array.from({ length: 5 }, (_, offset) => catState(t, round - 1 + offset))
    };
  }
  const api = Object.freeze({ recipes, voiceFor, xiaokuiVoice, puckDrop, puckSlot, puckLayout, collectedPucks, clamp, ease, lerp, mod, recipeIndexFromSearch, primary, secondary, beanColors, hopperBeans, refillBeans, catX, catState, xiaokuiReaction, beltPosition, handlePose, wandPose, coffeeFlow, stateAt });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FactoryTimeline = api;
})(typeof window !== 'undefined' ? window : globalThis);

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
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CatArt = api;
})(typeof window !== 'undefined' ? window : globalThis);

/* Game-only collection choreography. Every pose comes from the playback clock. */
(function(root){
  'use strict';
  const start=5.8,release=7.06,arrival=7.52;
  const view={x:81,y:-50,scale:.82};
  // The collection button is centered at (401, 40) in the 450 × 600 design.
  const target={x:(802-view.x)/view.scale,y:(80-view.y)/view.scale};
  const clamp=v=>Math.max(0,Math.min(1,v));
  const smooth=v=>{const u=clamp(v);return u*u*u*(10+u*(-15+6*u));};
  const lerp=(a,b,u)=>a+(b-a)*u;
  function curve(a,b,c,d,u){
    const v=1-u;
    return {x:v*v*v*a.x+3*v*v*u*b.x+3*v*u*u*c.x+u*u*u*d.x,
      y:v*v*v*a.y+3*v*v*u*b.y+3*v*u*u*c.y+u*u*u*d.y};
  }
  const tilt=Math.PI*.58,carry={x:760,y:260};
  // Release at the rim of the tilted basket, not at an unrelated screen point.
  const origin={x:carry.x+8*Math.sin(tilt),y:carry.y-8*Math.cos(tilt)};
  function at(time){
    const h={x:435,y:598,yaw:0,roll:0,locked:time<=start,loading:false,used:time<release,powder:time<release?1:0};
    if(time<6){h.yaw=lerp(0,-1,smooth((time-start)/.2));}
    else if(time<6.14){h.yaw=-1;h.y=lerp(598,624,smooth((time-6)/.14));}
    else if(time<6.82){
      const u=smooth((time-6.14)/.68);
      Object.assign(h,curve({x:435,y:624},{x:650,y:650},{x:760,y:460},carry,u));
      h.yaw=-1;h.roll=-.10*Math.sin(Math.PI*u);
    }else if(time<release){Object.assign(h,carry);h.yaw=-1;h.roll=tilt*smooth((time-6.82)/.24);}
    else if(time<7.18){
      const u=smooth((time-release)/.12);h.x=lerp(760,754,u);h.y=lerp(260,270,u);h.yaw=-1;h.roll=lerp(tilt,1.65,u);
    }else if(time<7.82){
      const u=smooth((time-7.18)/.64);
      Object.assign(h,curve({x:754,y:270},{x:742,y:448},{x:606,y:646},{x:435,y:624},u));
      h.yaw=-1;h.roll=1.65*(1-smooth((time-7.18)/.4));
    }else if(time<7.92){h.yaw=-1;h.y=lerp(624,598,smooth((time-7.82)/.1));}
    else{h.yaw=lerp(-1,0,smooth((time-7.92)/.08));h.locked=time>=8;}
    let puck=null;
    if(time>=release&&time<arrival){
      const u=clamp((time-release)/(arrival-release)),travel=smooth(u);
      puck=Object.assign(curve(origin,{x:origin.x+110,y:origin.y+18},{x:target.x+6,y:target.y+60},target,travel),{
        scale:lerp(.7,1.15,smooth(u/.3))*(1-.82*smooth((u-.6)/.4)),
        alpha:1-smooth((u-.72)/.28),angle:-.1*Math.sin(Math.PI*u),falling:true
      });
    }
    const catchU=clamp((time-(arrival-.05))/.36);
    const receive=Math.sin(Math.PI*catchU)*(1-catchU);
    return {handle:h,puck,receive};
  }
  const api={at,start,release,arrival,view,target,origin};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CatCollectionMotion=api;
})(typeof window!=='undefined'?window:globalThis);

/* p5 owns the canvas and frame loop; Canvas paths keep the silhouettes and coat masks identical. */
'use strict';
const F = FactoryTimeline;
const sound = window.FactorySound?.create(F);
const BLUE = '#0E3CF1';
const NAVY = '#172356';
const WHITE = '#FFFFFF';
const ACCENT = '#3D66E2';
let ctx;
let coffeeBeanArt;
let running = true;
const initialTime = Math.max(0, F.recipeIndexFromSearch(window.location ? window.location.search : '')) * 8;
let elapsed = initialTime;
let previousTime = 0;
let hidden = false;
const playbackCycle = F.recipes.length * 8;
let playbackRate = 1, draggingProgress = false, resumeAfterDrag = false;
let playButton, progressInput, speedButton, timeOutput;
let seekCycleBase = 0, heldCycleEnd = false;
const TAU = Math.PI * 2;








function shape(d, color) {
  ctx.fillStyle = color;
  ctx.fill(typeof d === 'string' ? new Path2D(d) : d);
}
function roundBox(x, y, w, h, r, color) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = color; ctx.fill();
}
function oval(x, y, rx, ry, color) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fillStyle = color; ctx.fill();
}
function drawLine(points, color, width = 2) {
  ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = color; ctx.stroke();
}
function strokePath(d, color, width) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(new Path2D(d));
}
// Flat illustration palette shared with the cats; depth comes from separate planes.
const BODY_SIDE = '#344A80';
const BODY_SHADOW = '#111B42';
const PALE = '#CFDAF7';
function renderScene(time,part) {
  const show=id=>!part||part===id;
  const s = F.stateAt(time, initialTime);
  ctx.save();
  if(show('machine')){ctx.fillStyle = BLUE; ctx.fillRect(0, 0, 900, 1200);machine(s);conveyor(s);steamWand(s);}
  if(show('flow'))coffeeFlow(s);
  if(show('cats'))for (const cat of s.cats) {
    if (cat.x > -120 && cat.x < 1050) drawCat(cat, time);
  }
  if(show('pucks')){puckCollection(s);spentPuck(s);}
  if(show('grounds'))groundCoffee(s);
  if(show('handle'))portafilter(s.handle);
  if(show('mist'))secondaryMist(s);
  ctx.restore();
}
const beanArtCache = new Map();
function coloredBeanArt(color) {
  if (beanArtCache.has(color)) return beanArtCache.get(color);
  if (!document.createElement) return null;
  const art = document.createElement('canvas');
  art.width = 104; art.height = 144;
  const paint = art.getContext('2d');
  // Color the existing cutout at runtime; keep its silhouette, groove and alpha.
  // No pixel readback, so the original local PNG also works under file://.
  paint.filter = 'grayscale(1) brightness(1.55)';
  paint.drawImage(coffeeBeanArt, 216, 59, 824, 1140, 0, 0, art.width, art.height);
  paint.filter = 'none';
  paint.globalCompositeOperation = 'source-atop';
  paint.globalAlpha = .72;
  paint.fillStyle = color; paint.fillRect(0, 0, art.width, art.height);
  paint.globalAlpha = 1;
  paint.globalCompositeOperation = 'source-over';
  beanArtCache.set(color, art);
  return art;
}
function bean(x, y, angle, scale = 1, color = '#FFFFFF') {
  if (!coffeeBeanArt || !coffeeBeanArt.complete || !coffeeBeanArt.naturalWidth) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // Smaller beans retain the cutout's proportions instead of shrinking its gap.
  const length = 24, width = length * 824 / 1140;
  const art = coloredBeanArt(color);
  if (art) ctx.drawImage(art, 0, 0, art.width, art.height, -width / 2, -length / 2, width, length);
  else ctx.drawImage(coffeeBeanArt, 216, 59, 824, 1140, -width / 2, -length / 2, width, length);
  ctx.restore();
}
function hopper(s) {
  // Front elevation: a shallow opening, upright chamber and short funnel.
  // The broad mounting base sits on the roof instead of a narrow pedestal.
  roundBox(271, 327, 70, 30, 5, NAVY);
  roundBox(262, 348, 88, 10, 4, BODY_SIDE);
  const chamber = 'M 221 252 H 391 V 294 Q 391 302 385 308 L 353 332 Q 350 335 343 335 H 269 Q 262 335 259 332 L 227 308 Q 221 302 221 294 Z';
  shape(chamber, NAVY);
  ctx.save(); ctx.clip(new Path2D(chamber));
  const colors = F.beanColors(s.hopperRecipe);
  for (const b of s.hopper) bean(b.x, b.y, b.angle, b.scale, colors[b.id % colors.length]);
  shape(chamber, 'rgba(23,35,86,.12)');
  // A short, straight-sided taper, not a rounded bowl or long cone.
  shape('M 222 299 Q 306 307 390 299 L 385 308 L 353 332 Q 350 335 343 335 H 269 Q 262 335 259 332 L 227 308 Z', BODY_SIDE);
  shape('M 222 299 L 239 302 L 272 335 H 269 Q 262 335 259 332 L 227 308 Z', NAVY);
  shape('M 374 302 L 390 299 L 385 308 L 353 332 Q 350 335 343 335 H 339 Z', NAVY);
  ctx.restore();
  // Narrow ellipses match the near-front view of the machine and filter basket.
  oval(306, 251, 89, 8, BODY_SIDE);
  oval(306, 250, 81, 4, BODY_SHADOW);
  ctx.save();
  ctx.clip(new Path2D('M 225 0 H 387 V 250 Q 306 260 225 250 Z'));
  for (const b of s.hopper) bean(b.x, b.y, b.angle, b.scale, colors[b.id % colors.length]);
  ctx.restore();
  shape('M 217 251 Q 306 264 395 251 V 258 Q 306 271 217 258 Z', BODY_SIDE);
}
function machine(s) {
  // Continuous, opaque rear wall in the same navy as the body.
  roundBox(222, 369, 456, 507, 30, NAVY);
  roundBox(250, 590, 400, 231, 8, NAVY);
  // Solid color planes define the recess; the panel stays exactly #172356.
  shape('M 250 590 H 650 V 625 H 267 L 250 642 Z', BODY_SHADOW);
  shape('M 250 604 H 267 V 802 L 250 824 Z', BODY_SHADOW);
  shape('M 633 604 H 650 V 824 L 633 802 Z', BODY_SHADOW);
  // Simplified side posts use the same flat shading as the cats.
  shape('M 222 568 H 249 V 794 Q 249 815 233 829 L 222 840 Z', BODY_SIDE);
  shape('M 650 568 H 678 V 840 L 663 829 Q 650 815 650 794 Z', BODY_SHADOW);
  // The rounded roof and fascia are separate planes, not a single flat arch.
  shape('M 244 352 H 652 Q 670 352 678 374 L 671 394 H 229 L 222 374 Q 228 352 244 352 Z', BODY_SIDE);
  roundBox(222, 368, 456, 229, [28, 28, 23, 23], NAVY);
  // A beveled underside gives the group heads a surface to attach to.
  shape('M 238 591 H 662 L 648 608 H 252 Z', BODY_SIDE);
  ctx.save(); ctx.beginPath(); ctx.roundRect(227, 375, 446, 210, 23); ctx.clip();
  drawLine([[224, 469], [678, 469]], WHITE, 3);
  drawLine([[224, 479], [678, 479]], PALE, 2);
  ctx.restore();
  // Simple concentric shapes echo the clean, rounded cat illustration.
  oval(435, 475, 77, 77, NAVY);
  oval(435, 475, 67, 67, BODY_SIDE);
  oval(435, 475, 59, 59, WHITE);
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (.78 + i * 1.44 / 8);
    drawLine([[435 + Math.cos(a) * 45, 475 + Math.sin(a) * 45], [435 + Math.cos(a) * 51, 475 + Math.sin(a) * 51]], NAVY, i % 2 ? 2 : 3);
  }
  // Xiaokui repeatedly presses against the final tick; the needle's pivot stays fixed.
  const a = Math.PI * (.8 + (s.recipe.kind === 'xiaokui' ? 1.42 : 1.1) * s.pressure) + s.pressureKick;
  drawLine([[435, 475], [435 + 41 * Math.cos(a), 475 + 41 * Math.sin(a)]], BLUE, 5);
  oval(435, 475, 8, 8, NAVY); oval(435, 475, 4, 4, BLUE);
  oval(533, 475, 11, 11, WHITE); oval(533, 475, 7, 7, '#0A1330');
  oval(533, 475, 5, 5, s.malfunction ? (s.faultLight ? '#F9CD77' : BODY_SHADOW) : F.primary(s.recipe));
  if (s.overload > 0) {
    ctx.save();
    ctx.globalAlpha = s.overload;
    oval(533, 475, 6, 6, '#FF514F');
    ctx.globalAlpha = s.overload * .22;
    oval(533, 475, 9, 9, '#FF514F');
    ctx.restore();
  }
  oval(625, 475, 28, 28, BODY_SIDE);
  oval(625, 475, 22, 22, WHITE);
  const knob = -.85 + s.wand.active * .8;
  drawLine([[625 - Math.cos(knob) * 12, 475 - Math.sin(knob) * 12], [625 + Math.cos(knob) * 12, 475 + Math.sin(knob) * 12]], NAVY, 4);
  roundBox(276, 550, 58, 48, 12, NAVY);
  roundBox(284, 559, 42, 36, 8, BODY_SIDE);
  roundBox(288, 590, 34, 12, 3, WHITE);
  roundBox(294, 600, 22, 7, 2, PALE);
  roundBox(389, 569, 92, 17, 4, WHITE);
  roundBox(404, 586, 62, 12, 3, WHITE);
  // Seen from the front, the locking seat is a straight horizontal interface.
  roundBox(404, 596, 62, 2, 0, BODY_SHADOW);
  hopper(s);
  dripTray();
}
function dripTray() {
  // Receding top, inset grate and a thick rounded front: three distinct faces.
  roundBox(246, 867, 49, 29, 9, NAVY);
  roundBox(607, 867, 49, 29, 9, NAVY);
  shape('M 254 797 H 646 L 679 833 H 221 Z', PALE);
  shape('M 266 802 H 634 L 654 825 H 246 Z', BODY_SIDE);
  shape('M 269 804 H 631 L 648 822 H 252 Z', WHITE);
  for (let i = 0; i < 19; i++) {
    const back = 276 + i * 19.3;
    const front = 261 + i * 21;
    strokePath(`M ${back} 808 L ${front} 818`, NAVY, 3.3);
  }
  shape('M 221 830 Q 450 838 679 830 L 676 861 Q 675 879 657 879 H 243 Q 225 879 224 861 Z', BODY_SIDE);
}
function conveyor(s) {
  // The cat lane stays in front of the entire machine, including its tray lip.
  roundBox(-27, 845, 954, 27, 13, WHITE);
  roundBox(-27, 849, 954, 19, 9, NAVY);
  const offset = F.beltPosition(s.time) % 50;
  for (let x = -50; x < 960; x += 50) oval(x + offset, 858, 6, 6, ACCENT);
}
function steamWand(s) {
  const w = s.wand;
  // A joint at the machine and a rigid lower tube aimed toward the cat.
  oval(625, 563, 10, 10, WHITE);
  const elbowX = F.lerp(638, 620, w.active);
  const elbowY = F.lerp(611, 607, w.active);
  strokePath(`M 625 563 V 583 Q 625 599 ${elbowX} ${elbowY} L ${w.x} ${w.y}`, WHITE, 9);
  const d = Math.hypot(w.targetX - w.x, w.targetY - w.y);
  const dx = (w.targetX - w.x) / d, dy = (w.targetY - w.y) / d;
  drawLine([[w.x - dx * 7, w.y - dy * 7], [w.x + dx * 6, w.y + dy * 6]], '#BFCDF6', 12);
  oval(w.x + dx * 7, w.y + dy * 7, 3.5, 3.5, NAVY);
}
function handleRing(distance, radius, angle) {
  // One camera projects every circular cross-section, including the end face.
  const elevation = .16, upright = Math.sqrt(1 - elevation * elevation);
  return Array.from({ length: 32 }, (_, i) => {
    const phi = i * TAU / 32;
    const across = radius * Math.cos(phi), vertical = radius * Math.sin(phi);
    return [distance * Math.sin(angle) + across * Math.cos(angle),
      12 + (distance * Math.cos(angle) - across * Math.sin(angle)) * elevation - vertical * upright];
  });
}
function handleOutline(points) {
  // The hull joins the two projected end rings with their actual tangent edges.
  const sorted = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const half = list => {
    const result = [];
    for (const p of list) {
      while (result.length > 1 && cross(result[result.length - 2], result[result.length - 1], p) <= 0) result.pop();
      result.push(p);
    }
    return result;
  };
  return [...half(sorted).slice(0, -1), ...half(sorted.slice().reverse()).slice(0, -1)];
}
function handlePolygon(points, color) {
  ctx.beginPath(); ctx.moveTo(...points[0]);
  for (const point of points.slice(1)) ctx.lineTo(...point);
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}
function portafilterGrip(yaw) {
  const angle = yaw + .35;
  const collar = handleRing(31, 7, angle);
  const neck = handleOutline([...handleRing(31, 5.5, angle), ...handleRing(49, 5.5, angle)]);
  const tip = handleRing(128, 11.5, angle);
  const body = handleOutline([...handleRing(46, 9, angle), ...tip]);
  return { angle, collar, neck, body, tip, facing: Math.cos(angle) > 0 };
}
function drawPortafilterGrip(grip) {
  handlePolygon(grip.collar, PALE);
  handlePolygon(grip.neck, PALE);
  handlePolygon(grip.body, '#F4D3A2');
  if (grip.facing) handlePolygon(grip.tip, '#DFB989');
}
function portafilter(p) {
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.roll);
  const grip = portafilterGrip(p.yaw);
  if (!grip.facing) drawPortafilterGrip(grip);
  shape('M -32 0 H 32 L 31 19 Q 30 27 24 27 H -24 Q -30 27 -31 19 Z', WHITE);
  // Front elevation keeps the locking seat horizontal and the contents hidden.
  roundBox(-34, -2, 68, 5, 1, PALE);
  roundBox(-25, 25, 50, 3, 1, PALE);
  // The near-side collar attaches to the basket wall rather than disappearing behind it.
  if (grip.facing) drawPortafilterGrip(grip);
  ctx.restore();
}
const PUCK_PORTRAITS = new Map();
function paintPuckFace(target, portrait) {
  target.save();
  target.scale(portrait.scale, portrait.scale);
  target.translate(-portrait.centerX, -portrait.centerY);
  CatArt.draw(target, portrait.state, 0, { x: 0, y: 0, scale: 1, noBlink: true, headOnly: true });
  target.restore();
}
function puckPortrait(recipe) {
  if (PUCK_PORTRAITS.has(recipe)) return PUCK_PORTRAITS.get(recipe);
  const state = { recipe, index: 0, x: 0, walking: 0, walkDistance: 0, coat: 1, baseCoat: 1 };
  const head = CatArt.model(state, 0).head;
  const xs = [], ys = [];
  for (const [, ...points] of head) {
    for (let i = 0; i < points.length; i += 2) { xs.push(points[i]); ys.push(points[i + 1]); }
  }
  // Include the ear tips and curve handles, preserving each approved head's proportions.
  const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
  const scale = F.puckLayout.faceWidth / (right - left);
  const portrait = { state, scale, centerX: (left + right) / 2, centerY: (top + bottom) / 2,
    outline: new Path2D(head.map(command => command.join(' ')).join(' ')), image: null };
  if (typeof document !== 'undefined' && document.createElement) {
    const canvas = document.createElement('canvas');
    canvas.width = (F.puckLayout.faceWidth + 4) * 3;
    canvas.height = Math.ceil(((bottom - top) * scale + 4) * 3);
    const paint = canvas.getContext('2d');
    paint.scale(3, 3); paint.translate(canvas.width / 6, canvas.height / 6);
    paintPuckFace(paint, portrait);
    portrait.image = canvas;
  }
  PUCK_PORTRAITS.set(recipe, portrait);
  return portrait;
}
function drawCatPuck(recipe) {
  const portrait = puckPortrait(recipe);
  // A thin lower edge uses the same ear-and-cheek silhouette as the face.
  ctx.save(); ctx.translate(0, 3); ctx.scale(portrait.scale, portrait.scale);
  ctx.translate(-portrait.centerX, -portrait.centerY);
  shape(portrait.outline, recipe.ink); ctx.restore();
  if (portrait.image) {
    const w = portrait.image.width / 3, h = portrait.image.height / 3;
    ctx.drawImage(portrait.image, -w / 2, -h / 2, w, h);
  } else paintPuckFace(ctx, portrait);
}
function placedPuck(puck) {
  ctx.save();
  ctx.globalAlpha = puck.alpha;
  ctx.translate(puck.x, puck.y); ctx.rotate(puck.angle);
  drawCatPuck(puck.recipe);
  ctx.restore();
}
function puckCollection(s) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, F.puckLayout.top, 900, F.puckLayout.bottom - F.puckLayout.top); ctx.clip();
  for (const puck of s.pucks) if (!puck.falling && puck.alpha > 0) placedPuck(puck);
  ctx.restore();
}
function spentPuck(s) {
  // Flying faces stay visible until they join the persistent collection below.
  for (const puck of s.pucks) if (puck.falling) placedPuck(puck);
}
// Fixed grains make pause, replay and arbitrary time jumps show the same pour.
const GROUND_GRAINS = Array.from({ length: 156 }, (_, i) => {
  const seed = n => F.mod(Math.sin((i + 1) * n) * 43758.5453, 1);
  const birth = 1.56 + i / 155 * .68;
  const density = F.ease((birth - 1.56) / .07) * F.ease((2.24 - birth) / .12);
  return {
    birth, flight: .125 + seed(4.39) * .015, visible: seed(7.13) < density,
    sourceX: 305 + (seed(9.31) - .5) * 9,
    drift: (seed(3.71) - .5) * 13,
    rx: .7 + seed(5.29) * .85, ry: .7 + seed(2.17) * .75,
    tone: i % 5 < 2 ? 0 : i % 5 < 4 ? 1 : 2
  };
});
const GROUND_PALETTES = new Map(F.recipes.map(recipe => {
  const color = F.primary(recipe);
  const rgb = [1, 3, 5].map(at => parseInt(color.slice(at, at + 2), 16));
  // Warm, same-color lighter flecks keep dark grounds visible on the navy wall.
  const tint = amount => '#' + rgb.map((value, i) => Math.round(F.lerp(value, [245, 213, 173][i], amount)).toString(16).padStart(2, '0')).join('');
  return [recipe.kind, [color, tint(.38), tint(.68)]];
}));
function groundCoffee(s) {
  if (s.phase < 1.56 || s.phase >= 2.38) return;
  const colors = GROUND_PALETTES.get(s.recipe.kind);
  for (const grain of GROUND_GRAINS) {
    const u = (s.phase - grain.birth) / grain.flight;
    if (!grain.visible || u < 0 || u >= 1) continue;
    const fall = .24 * u + .76 * u * u;
    // Fall below the basket lip; the opaque front is painted afterward. Never
    // expose an interior heap or spray over the rim in this front-on view.
    oval(grain.sourceX + grain.drift * u, 607 + 36 * fall,
      grain.rx, grain.ry, colors[grain.tone]);
  }
}
function mistParticle(x, y, dx, dy, color, alpha, width) {
  ctx.save(); ctx.globalAlpha = alpha;
  drawLine([[x - dx * 2, y - dy * 2], [x + dx * 2, y + dy * 2]], color, width);
  ctx.restore();
}
function coffeeFlow(s) {
  const flow = s.flow;
  if (!flow) return;
  const x = s.handle.x, y = s.handle.y + 28;
  const width = 3.1 + .15 * Math.sin(s.time * 17);
  // The exposed basket drains into a single stream; no lower hardware is attached.
  // The front-facing grip and cat are drawn afterward, preserving their occlusion.
  drawLine([[x, y + flow.top], [x, y + flow.bottom]], '#C49A72', width + .8);
  drawLine([[x, y + flow.top], [x, y + flow.bottom]], F.primary(s.recipe), width);
  if (flow.top === 0) {
    const length = Math.min(10, flow.bottom);
    shape(`M ${x - 7} ${y} H ${x + 7} Q ${x + 2} ${y + length * .5} ${x + width / 2} ${y + length} H ${x - width / 2} Q ${x - 2} ${y + length * .5} ${x - 7} ${y} Z`, F.primary(s.recipe));
  }
}
function secondaryMist(s) {
  if (s.malfunction) return;
  // Directional spray visibly travels from the wand to the changing coat.
  for (let i = 0; i < 72; i++) {
    const birth = 4.2 + i * 0.0108;
    const u = (s.phase - birth) / 0.19;
    if (u < 0 || u > 1) continue;
    const origin = F.wandPose(birth);
    const ex = origin.targetX + Math.sin(i * 7.93) * 25;
    const ey = origin.targetY + Math.cos(i * 3.97) * 30;
    const x = F.lerp(origin.x, ex, u), y = F.lerp(origin.y, ey, u);
    mistParticle(x, y, -1, 0.35, F.secondary(s.recipe), Math.sin(Math.PI * u) * 0.95, 2.3);
  }
}

function drawCat(state, time) {
  CatArt.draw(ctx, state, time, { scale: 0.93 * (state.recipe.kind === 'xiaokui' ? 1.1 : 1) });
}

 const ready=S.image("assets/scene-sources/factory/coffee-bean.webp").then(img=>{coffeeBeanArt=img;});
 return {ready,draw(t,mode,part){ctx=S.ctx;const recipe=F.recipes[opt.recipe||0],time=t+(opt.recipe||0)*8,s=F.stateAt(time,0);
  if(mode==='full'){renderScene(time,part==='art'?null:part);return;}
  if(mode==='machine'){machine(s);conveyor(s);steamWand(s);return;}
  if(mode==='cat'){const state={...s.cats.find(c=>c.recipe===recipe)||s.cats[0],x:450};drawCat(state,time);return;}
  if(mode==='handle'){portafilter(s.handle);return;}
  if(mode==='puck'){ctx.save();ctx.translate(450,600);ctx.scale(4,4);drawCatPuck(recipe);ctx.restore();return;}
  if(mode==='collection'){const m=window.CatCollectionMotion.at(t);if(part==='art'||part==='handle')portafilter(m.handle);if((part==='art'||part==='flight')&&m.puck)placedPuck({...m.puck,recipe});if(part==='art'||part==='receive'){ctx.save();ctx.translate(window.CatCollectionMotion.target.x,window.CatCollectionMotion.target.y);ctx.scale(1+m.receive*.12,1+m.receive*.12);drawCatPuck(recipe);ctx.restore();}return;}
 },inspect:t=>({handle:F.handlePose(t),collection:window.CatCollectionMotion.at(t),belt:F.beltPosition(t)})};

}
};
})(globalThis);

/* SCENE ENTRIES */
WiseSceneRuntime.register("factory-handle-transfer",{"family": "factory", "mode": "handle", "start": 0, "width": 900, "height": 1200});
WiseSceneRuntime.register("factory-cat-illustration",{"family": "factory", "mode": "cat", "start": 0, "width": 900, "height": 1200, "recipe": 0, "variants": {"0": {"family": "factory", "mode": "cat", "start": 0, "width": 900, "height": 1200, "recipe": 0}, "1": {"family": "factory", "mode": "cat", "start": 0, "width": 900, "height": 1200, "recipe": 1}, "2": {"family": "factory", "mode": "cat", "start": 0, "width": 900, "height": 1200, "recipe": 2}, "3": {"family": "factory", "mode": "cat", "start": 0, "width": 900, "height": 1200, "recipe": 3}, "4": {"family": "factory", "mode": "cat", "start": 0, "width": 900, "height": 1200, "recipe": 4}, "5": {"family": "factory", "mode": "cat", "start": 0, "width": 900, "height": 1200, "recipe": 5}, "6": {"family": "factory", "mode": "cat", "start": 0, "width": 900, "height": 1200, "recipe": 6}, "7": {"family": "factory", "mode": "cat", "start": 0, "width": 900, "height": 1200, "recipe": 7}, "8": {"family": "factory", "mode": "cat", "start": 0, "width": 900, "height": 1200, "recipe": 8}, "9": {"family": "factory", "mode": "cat", "start": 0, "width": 900, "height": 1200, "recipe": 9}, "10": {"family": "factory", "mode": "cat", "start": 0, "width": 900, "height": 1200, "recipe": 10}, "11": {"family": "factory", "mode": "cat", "start": 0, "width": 900, "height": 1200, "recipe": 11}, "12": {"family": "factory", "mode": "cat", "start": 0, "width": 900, "height": 1200, "recipe": 12}, "13": {"family": "factory", "mode": "cat", "start": 0, "width": 900, "height": 1200, "recipe": 13}, "14": {"family": "factory", "mode": "cat", "start": 0, "width": 900, "height": 1200, "recipe": 14}}});
WiseSceneRuntime.register("factory-machine-illustration",{"family": "factory", "mode": "machine", "start": 0, "width": 900, "height": 1200});
WiseSceneRuntime.register("factory-handle-illustration",{"family": "factory", "mode": "handle", "start": 0, "width": 900, "height": 1200});
WiseSceneRuntime.register("factory-cat-puck-illustration",{"family": "factory", "mode": "puck", "start": 0, "width": 900, "height": 1200, "recipe": 0, "variants": {"0": {"family": "factory", "mode": "puck", "start": 0, "width": 900, "height": 1200, "recipe": 0}, "1": {"family": "factory", "mode": "puck", "start": 0, "width": 900, "height": 1200, "recipe": 1}, "2": {"family": "factory", "mode": "puck", "start": 0, "width": 900, "height": 1200, "recipe": 2}, "3": {"family": "factory", "mode": "puck", "start": 0, "width": 900, "height": 1200, "recipe": 3}, "4": {"family": "factory", "mode": "puck", "start": 0, "width": 900, "height": 1200, "recipe": 4}, "5": {"family": "factory", "mode": "puck", "start": 0, "width": 900, "height": 1200, "recipe": 5}, "6": {"family": "factory", "mode": "puck", "start": 0, "width": 900, "height": 1200, "recipe": 6}, "7": {"family": "factory", "mode": "puck", "start": 0, "width": 900, "height": 1200, "recipe": 7}, "8": {"family": "factory", "mode": "puck", "start": 0, "width": 900, "height": 1200, "recipe": 8}, "9": {"family": "factory", "mode": "puck", "start": 0, "width": 900, "height": 1200, "recipe": 9}, "10": {"family": "factory", "mode": "puck", "start": 0, "width": 900, "height": 1200, "recipe": 10}, "11": {"family": "factory", "mode": "puck", "start": 0, "width": 900, "height": 1200, "recipe": 11}, "12": {"family": "factory", "mode": "puck", "start": 0, "width": 900, "height": 1200, "recipe": 12}, "13": {"family": "factory", "mode": "puck", "start": 0, "width": 900, "height": 1200, "recipe": 13}, "14": {"family": "factory", "mode": "puck", "start": 0, "width": 900, "height": 1200, "recipe": 14}}});
WiseSceneRuntime.register("cat-factory-journey",{"family": "factory", "mode": "full", "start": 0, "width": 900, "height": 1200, "breakdown": [{"id": "machine", "name": "机器与传送带", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡机、料斗、压力表、传送带和蒸汽管按一轮加工时间联动。", "actions": ["particle-hopper", "factory-machine-illustration"]}, {"id": "flow", "name": "液流先到", "start": 0, "end": 8000, "time": "0—8秒", "detail": "出口液流在小猫底色改变前落下，随后收住。", "actions": []}, {"id": "cats", "name": "配方小猫", "start": 0, "end": 8000, "time": "0—8秒", "detail": "小猫沿传送带前进，底色与花纹随加工进入，保留脚步与口型。", "actions": ["mouth-open-react", "factory-cat-illustration"]}, {"id": "pucks", "name": "收藏与猫脸粉饼", "start": 0, "end": 8000, "time": "0—8秒", "detail": "猫脸粉饼按卸料时刻落下，并进入下方的收藏排列。", "actions": ["factory-cat-puck-illustration"]}, {"id": "grounds", "name": "咖啡粉落下", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡粉粒按出口与滤篮位置落下。", "actions": ["particle-hopper"]}, {"id": "handle", "name": "手柄装卸与翻转", "start": 0, "end": 8000, "time": "0—8秒", "detail": "手柄装入、拆下、平移、翻转卸料后回到装入位置。", "actions": ["factory-handle-transfer", "factory-handle-illustration"]}, {"id": "mist", "name": "喷雾补花纹", "start": 0, "end": 8000, "time": "0—8秒", "detail": "喷雾位于前景，在底色之后补上第二层花纹并收住。", "actions": []}], "recipe": 0, "layers": ["machine", "flow", "cats", "pucks", "grounds", "handle", "mist"], "variants": {"0": {"family": "factory", "mode": "full", "start": 0, "width": 900, "height": 1200, "breakdown": [{"id": "machine", "name": "机器与传送带", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡机、料斗、压力表、传送带和蒸汽管按一轮加工时间联动。", "actions": ["particle-hopper", "factory-machine-illustration"]}, {"id": "flow", "name": "液流先到", "start": 0, "end": 8000, "time": "0—8秒", "detail": "出口液流在小猫底色改变前落下，随后收住。", "actions": []}, {"id": "cats", "name": "配方小猫", "start": 0, "end": 8000, "time": "0—8秒", "detail": "小猫沿传送带前进，底色与花纹随加工进入，保留脚步与口型。", "actions": ["mouth-open-react", "factory-cat-illustration"]}, {"id": "pucks", "name": "收藏与猫脸粉饼", "start": 0, "end": 8000, "time": "0—8秒", "detail": "猫脸粉饼按卸料时刻落下，并进入下方的收藏排列。", "actions": ["factory-cat-puck-illustration"]}, {"id": "grounds", "name": "咖啡粉落下", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡粉粒按出口与滤篮位置落下。", "actions": ["particle-hopper"]}, {"id": "handle", "name": "手柄装卸与翻转", "start": 0, "end": 8000, "time": "0—8秒", "detail": "手柄装入、拆下、平移、翻转卸料后回到装入位置。", "actions": ["factory-handle-transfer", "factory-handle-illustration"]}, {"id": "mist", "name": "喷雾补花纹", "start": 0, "end": 8000, "time": "0—8秒", "detail": "喷雾位于前景，在底色之后补上第二层花纹并收住。", "actions": []}], "recipe": 0, "layers": ["machine", "flow", "cats", "pucks", "grounds", "handle", "mist"]}, "1": {"family": "factory", "mode": "full", "start": 0, "width": 900, "height": 1200, "breakdown": [{"id": "machine", "name": "机器与传送带", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡机、料斗、压力表、传送带和蒸汽管按一轮加工时间联动。", "actions": ["particle-hopper", "factory-machine-illustration"]}, {"id": "flow", "name": "液流先到", "start": 0, "end": 8000, "time": "0—8秒", "detail": "出口液流在小猫底色改变前落下，随后收住。", "actions": []}, {"id": "cats", "name": "配方小猫", "start": 0, "end": 8000, "time": "0—8秒", "detail": "小猫沿传送带前进，底色与花纹随加工进入，保留脚步与口型。", "actions": ["mouth-open-react", "factory-cat-illustration"]}, {"id": "pucks", "name": "收藏与猫脸粉饼", "start": 0, "end": 8000, "time": "0—8秒", "detail": "猫脸粉饼按卸料时刻落下，并进入下方的收藏排列。", "actions": ["factory-cat-puck-illustration"]}, {"id": "grounds", "name": "咖啡粉落下", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡粉粒按出口与滤篮位置落下。", "actions": ["particle-hopper"]}, {"id": "handle", "name": "手柄装卸与翻转", "start": 0, "end": 8000, "time": "0—8秒", "detail": "手柄装入、拆下、平移、翻转卸料后回到装入位置。", "actions": ["factory-handle-transfer", "factory-handle-illustration"]}, {"id": "mist", "name": "喷雾补花纹", "start": 0, "end": 8000, "time": "0—8秒", "detail": "喷雾位于前景，在底色之后补上第二层花纹并收住。", "actions": []}], "recipe": 1, "layers": ["machine", "flow", "cats", "pucks", "grounds", "handle", "mist"]}, "2": {"family": "factory", "mode": "full", "start": 0, "width": 900, "height": 1200, "breakdown": [{"id": "machine", "name": "机器与传送带", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡机、料斗、压力表、传送带和蒸汽管按一轮加工时间联动。", "actions": ["particle-hopper", "factory-machine-illustration"]}, {"id": "flow", "name": "液流先到", "start": 0, "end": 8000, "time": "0—8秒", "detail": "出口液流在小猫底色改变前落下，随后收住。", "actions": []}, {"id": "cats", "name": "配方小猫", "start": 0, "end": 8000, "time": "0—8秒", "detail": "小猫沿传送带前进，底色与花纹随加工进入，保留脚步与口型。", "actions": ["mouth-open-react", "factory-cat-illustration"]}, {"id": "pucks", "name": "收藏与猫脸粉饼", "start": 0, "end": 8000, "time": "0—8秒", "detail": "猫脸粉饼按卸料时刻落下，并进入下方的收藏排列。", "actions": ["factory-cat-puck-illustration"]}, {"id": "grounds", "name": "咖啡粉落下", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡粉粒按出口与滤篮位置落下。", "actions": ["particle-hopper"]}, {"id": "handle", "name": "手柄装卸与翻转", "start": 0, "end": 8000, "time": "0—8秒", "detail": "手柄装入、拆下、平移、翻转卸料后回到装入位置。", "actions": ["factory-handle-transfer", "factory-handle-illustration"]}, {"id": "mist", "name": "喷雾补花纹", "start": 0, "end": 8000, "time": "0—8秒", "detail": "喷雾位于前景，在底色之后补上第二层花纹并收住。", "actions": []}], "recipe": 2, "layers": ["machine", "flow", "cats", "pucks", "grounds", "handle", "mist"]}, "3": {"family": "factory", "mode": "full", "start": 0, "width": 900, "height": 1200, "breakdown": [{"id": "machine", "name": "机器与传送带", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡机、料斗、压力表、传送带和蒸汽管按一轮加工时间联动。", "actions": ["particle-hopper", "factory-machine-illustration"]}, {"id": "flow", "name": "液流先到", "start": 0, "end": 8000, "time": "0—8秒", "detail": "出口液流在小猫底色改变前落下，随后收住。", "actions": []}, {"id": "cats", "name": "配方小猫", "start": 0, "end": 8000, "time": "0—8秒", "detail": "小猫沿传送带前进，底色与花纹随加工进入，保留脚步与口型。", "actions": ["mouth-open-react", "factory-cat-illustration"]}, {"id": "pucks", "name": "收藏与猫脸粉饼", "start": 0, "end": 8000, "time": "0—8秒", "detail": "猫脸粉饼按卸料时刻落下，并进入下方的收藏排列。", "actions": ["factory-cat-puck-illustration"]}, {"id": "grounds", "name": "咖啡粉落下", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡粉粒按出口与滤篮位置落下。", "actions": ["particle-hopper"]}, {"id": "handle", "name": "手柄装卸与翻转", "start": 0, "end": 8000, "time": "0—8秒", "detail": "手柄装入、拆下、平移、翻转卸料后回到装入位置。", "actions": ["factory-handle-transfer", "factory-handle-illustration"]}, {"id": "mist", "name": "喷雾补花纹", "start": 0, "end": 8000, "time": "0—8秒", "detail": "喷雾位于前景，在底色之后补上第二层花纹并收住。", "actions": []}], "recipe": 3, "layers": ["machine", "flow", "cats", "pucks", "grounds", "handle", "mist"]}, "4": {"family": "factory", "mode": "full", "start": 0, "width": 900, "height": 1200, "breakdown": [{"id": "machine", "name": "机器与传送带", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡机、料斗、压力表、传送带和蒸汽管按一轮加工时间联动。", "actions": ["particle-hopper", "factory-machine-illustration"]}, {"id": "flow", "name": "液流先到", "start": 0, "end": 8000, "time": "0—8秒", "detail": "出口液流在小猫底色改变前落下，随后收住。", "actions": []}, {"id": "cats", "name": "配方小猫", "start": 0, "end": 8000, "time": "0—8秒", "detail": "小猫沿传送带前进，底色与花纹随加工进入，保留脚步与口型。", "actions": ["mouth-open-react", "factory-cat-illustration"]}, {"id": "pucks", "name": "收藏与猫脸粉饼", "start": 0, "end": 8000, "time": "0—8秒", "detail": "猫脸粉饼按卸料时刻落下，并进入下方的收藏排列。", "actions": ["factory-cat-puck-illustration"]}, {"id": "grounds", "name": "咖啡粉落下", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡粉粒按出口与滤篮位置落下。", "actions": ["particle-hopper"]}, {"id": "handle", "name": "手柄装卸与翻转", "start": 0, "end": 8000, "time": "0—8秒", "detail": "手柄装入、拆下、平移、翻转卸料后回到装入位置。", "actions": ["factory-handle-transfer", "factory-handle-illustration"]}, {"id": "mist", "name": "喷雾补花纹", "start": 0, "end": 8000, "time": "0—8秒", "detail": "喷雾位于前景，在底色之后补上第二层花纹并收住。", "actions": []}], "recipe": 4, "layers": ["machine", "flow", "cats", "pucks", "grounds", "handle", "mist"]}, "5": {"family": "factory", "mode": "full", "start": 0, "width": 900, "height": 1200, "breakdown": [{"id": "machine", "name": "机器与传送带", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡机、料斗、压力表、传送带和蒸汽管按一轮加工时间联动。", "actions": ["particle-hopper", "factory-machine-illustration"]}, {"id": "flow", "name": "液流先到", "start": 0, "end": 8000, "time": "0—8秒", "detail": "出口液流在小猫底色改变前落下，随后收住。", "actions": []}, {"id": "cats", "name": "配方小猫", "start": 0, "end": 8000, "time": "0—8秒", "detail": "小猫沿传送带前进，底色与花纹随加工进入，保留脚步与口型。", "actions": ["mouth-open-react", "factory-cat-illustration"]}, {"id": "pucks", "name": "收藏与猫脸粉饼", "start": 0, "end": 8000, "time": "0—8秒", "detail": "猫脸粉饼按卸料时刻落下，并进入下方的收藏排列。", "actions": ["factory-cat-puck-illustration"]}, {"id": "grounds", "name": "咖啡粉落下", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡粉粒按出口与滤篮位置落下。", "actions": ["particle-hopper"]}, {"id": "handle", "name": "手柄装卸与翻转", "start": 0, "end": 8000, "time": "0—8秒", "detail": "手柄装入、拆下、平移、翻转卸料后回到装入位置。", "actions": ["factory-handle-transfer", "factory-handle-illustration"]}, {"id": "mist", "name": "喷雾补花纹", "start": 0, "end": 8000, "time": "0—8秒", "detail": "喷雾位于前景，在底色之后补上第二层花纹并收住。", "actions": []}], "recipe": 5, "layers": ["machine", "flow", "cats", "pucks", "grounds", "handle", "mist"]}, "6": {"family": "factory", "mode": "full", "start": 0, "width": 900, "height": 1200, "breakdown": [{"id": "machine", "name": "机器与传送带", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡机、料斗、压力表、传送带和蒸汽管按一轮加工时间联动。", "actions": ["particle-hopper", "factory-machine-illustration"]}, {"id": "flow", "name": "液流先到", "start": 0, "end": 8000, "time": "0—8秒", "detail": "出口液流在小猫底色改变前落下，随后收住。", "actions": []}, {"id": "cats", "name": "配方小猫", "start": 0, "end": 8000, "time": "0—8秒", "detail": "小猫沿传送带前进，底色与花纹随加工进入，保留脚步与口型。", "actions": ["mouth-open-react", "factory-cat-illustration"]}, {"id": "pucks", "name": "收藏与猫脸粉饼", "start": 0, "end": 8000, "time": "0—8秒", "detail": "猫脸粉饼按卸料时刻落下，并进入下方的收藏排列。", "actions": ["factory-cat-puck-illustration"]}, {"id": "grounds", "name": "咖啡粉落下", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡粉粒按出口与滤篮位置落下。", "actions": ["particle-hopper"]}, {"id": "handle", "name": "手柄装卸与翻转", "start": 0, "end": 8000, "time": "0—8秒", "detail": "手柄装入、拆下、平移、翻转卸料后回到装入位置。", "actions": ["factory-handle-transfer", "factory-handle-illustration"]}, {"id": "mist", "name": "喷雾补花纹", "start": 0, "end": 8000, "time": "0—8秒", "detail": "喷雾位于前景，在底色之后补上第二层花纹并收住。", "actions": []}], "recipe": 6, "layers": ["machine", "flow", "cats", "pucks", "grounds", "handle", "mist"]}, "7": {"family": "factory", "mode": "full", "start": 0, "width": 900, "height": 1200, "breakdown": [{"id": "machine", "name": "机器与传送带", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡机、料斗、压力表、传送带和蒸汽管按一轮加工时间联动。", "actions": ["particle-hopper", "factory-machine-illustration"]}, {"id": "flow", "name": "液流先到", "start": 0, "end": 8000, "time": "0—8秒", "detail": "出口液流在小猫底色改变前落下，随后收住。", "actions": []}, {"id": "cats", "name": "配方小猫", "start": 0, "end": 8000, "time": "0—8秒", "detail": "小猫沿传送带前进，底色与花纹随加工进入，保留脚步与口型。", "actions": ["mouth-open-react", "factory-cat-illustration"]}, {"id": "pucks", "name": "收藏与猫脸粉饼", "start": 0, "end": 8000, "time": "0—8秒", "detail": "猫脸粉饼按卸料时刻落下，并进入下方的收藏排列。", "actions": ["factory-cat-puck-illustration"]}, {"id": "grounds", "name": "咖啡粉落下", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡粉粒按出口与滤篮位置落下。", "actions": ["particle-hopper"]}, {"id": "handle", "name": "手柄装卸与翻转", "start": 0, "end": 8000, "time": "0—8秒", "detail": "手柄装入、拆下、平移、翻转卸料后回到装入位置。", "actions": ["factory-handle-transfer", "factory-handle-illustration"]}, {"id": "mist", "name": "喷雾补花纹", "start": 0, "end": 8000, "time": "0—8秒", "detail": "喷雾位于前景，在底色之后补上第二层花纹并收住。", "actions": []}], "recipe": 7, "layers": ["machine", "flow", "cats", "pucks", "grounds", "handle", "mist"]}, "8": {"family": "factory", "mode": "full", "start": 0, "width": 900, "height": 1200, "breakdown": [{"id": "machine", "name": "机器与传送带", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡机、料斗、压力表、传送带和蒸汽管按一轮加工时间联动。", "actions": ["particle-hopper", "factory-machine-illustration"]}, {"id": "flow", "name": "液流先到", "start": 0, "end": 8000, "time": "0—8秒", "detail": "出口液流在小猫底色改变前落下，随后收住。", "actions": []}, {"id": "cats", "name": "配方小猫", "start": 0, "end": 8000, "time": "0—8秒", "detail": "小猫沿传送带前进，底色与花纹随加工进入，保留脚步与口型。", "actions": ["mouth-open-react", "factory-cat-illustration"]}, {"id": "pucks", "name": "收藏与猫脸粉饼", "start": 0, "end": 8000, "time": "0—8秒", "detail": "猫脸粉饼按卸料时刻落下，并进入下方的收藏排列。", "actions": ["factory-cat-puck-illustration"]}, {"id": "grounds", "name": "咖啡粉落下", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡粉粒按出口与滤篮位置落下。", "actions": ["particle-hopper"]}, {"id": "handle", "name": "手柄装卸与翻转", "start": 0, "end": 8000, "time": "0—8秒", "detail": "手柄装入、拆下、平移、翻转卸料后回到装入位置。", "actions": ["factory-handle-transfer", "factory-handle-illustration"]}, {"id": "mist", "name": "喷雾补花纹", "start": 0, "end": 8000, "time": "0—8秒", "detail": "喷雾位于前景，在底色之后补上第二层花纹并收住。", "actions": []}], "recipe": 8, "layers": ["machine", "flow", "cats", "pucks", "grounds", "handle", "mist"]}, "9": {"family": "factory", "mode": "full", "start": 0, "width": 900, "height": 1200, "breakdown": [{"id": "machine", "name": "机器与传送带", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡机、料斗、压力表、传送带和蒸汽管按一轮加工时间联动。", "actions": ["particle-hopper", "factory-machine-illustration"]}, {"id": "flow", "name": "液流先到", "start": 0, "end": 8000, "time": "0—8秒", "detail": "出口液流在小猫底色改变前落下，随后收住。", "actions": []}, {"id": "cats", "name": "配方小猫", "start": 0, "end": 8000, "time": "0—8秒", "detail": "小猫沿传送带前进，底色与花纹随加工进入，保留脚步与口型。", "actions": ["mouth-open-react", "factory-cat-illustration"]}, {"id": "pucks", "name": "收藏与猫脸粉饼", "start": 0, "end": 8000, "time": "0—8秒", "detail": "猫脸粉饼按卸料时刻落下，并进入下方的收藏排列。", "actions": ["factory-cat-puck-illustration"]}, {"id": "grounds", "name": "咖啡粉落下", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡粉粒按出口与滤篮位置落下。", "actions": ["particle-hopper"]}, {"id": "handle", "name": "手柄装卸与翻转", "start": 0, "end": 8000, "time": "0—8秒", "detail": "手柄装入、拆下、平移、翻转卸料后回到装入位置。", "actions": ["factory-handle-transfer", "factory-handle-illustration"]}, {"id": "mist", "name": "喷雾补花纹", "start": 0, "end": 8000, "time": "0—8秒", "detail": "喷雾位于前景，在底色之后补上第二层花纹并收住。", "actions": []}], "recipe": 9, "layers": ["machine", "flow", "cats", "pucks", "grounds", "handle", "mist"]}, "10": {"family": "factory", "mode": "full", "start": 0, "width": 900, "height": 1200, "breakdown": [{"id": "machine", "name": "机器与传送带", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡机、料斗、压力表、传送带和蒸汽管按一轮加工时间联动。", "actions": ["particle-hopper", "factory-machine-illustration"]}, {"id": "flow", "name": "液流先到", "start": 0, "end": 8000, "time": "0—8秒", "detail": "出口液流在小猫底色改变前落下，随后收住。", "actions": []}, {"id": "cats", "name": "配方小猫", "start": 0, "end": 8000, "time": "0—8秒", "detail": "小猫沿传送带前进，底色与花纹随加工进入，保留脚步与口型。", "actions": ["mouth-open-react", "factory-cat-illustration"]}, {"id": "pucks", "name": "收藏与猫脸粉饼", "start": 0, "end": 8000, "time": "0—8秒", "detail": "猫脸粉饼按卸料时刻落下，并进入下方的收藏排列。", "actions": ["factory-cat-puck-illustration"]}, {"id": "grounds", "name": "咖啡粉落下", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡粉粒按出口与滤篮位置落下。", "actions": ["particle-hopper"]}, {"id": "handle", "name": "手柄装卸与翻转", "start": 0, "end": 8000, "time": "0—8秒", "detail": "手柄装入、拆下、平移、翻转卸料后回到装入位置。", "actions": ["factory-handle-transfer", "factory-handle-illustration"]}, {"id": "mist", "name": "喷雾补花纹", "start": 0, "end": 8000, "time": "0—8秒", "detail": "喷雾位于前景，在底色之后补上第二层花纹并收住。", "actions": []}], "recipe": 10, "layers": ["machine", "flow", "cats", "pucks", "grounds", "handle", "mist"]}, "11": {"family": "factory", "mode": "full", "start": 0, "width": 900, "height": 1200, "breakdown": [{"id": "machine", "name": "机器与传送带", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡机、料斗、压力表、传送带和蒸汽管按一轮加工时间联动。", "actions": ["particle-hopper", "factory-machine-illustration"]}, {"id": "flow", "name": "液流先到", "start": 0, "end": 8000, "time": "0—8秒", "detail": "出口液流在小猫底色改变前落下，随后收住。", "actions": []}, {"id": "cats", "name": "配方小猫", "start": 0, "end": 8000, "time": "0—8秒", "detail": "小猫沿传送带前进，底色与花纹随加工进入，保留脚步与口型。", "actions": ["mouth-open-react", "factory-cat-illustration"]}, {"id": "pucks", "name": "收藏与猫脸粉饼", "start": 0, "end": 8000, "time": "0—8秒", "detail": "猫脸粉饼按卸料时刻落下，并进入下方的收藏排列。", "actions": ["factory-cat-puck-illustration"]}, {"id": "grounds", "name": "咖啡粉落下", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡粉粒按出口与滤篮位置落下。", "actions": ["particle-hopper"]}, {"id": "handle", "name": "手柄装卸与翻转", "start": 0, "end": 8000, "time": "0—8秒", "detail": "手柄装入、拆下、平移、翻转卸料后回到装入位置。", "actions": ["factory-handle-transfer", "factory-handle-illustration"]}, {"id": "mist", "name": "喷雾补花纹", "start": 0, "end": 8000, "time": "0—8秒", "detail": "喷雾位于前景，在底色之后补上第二层花纹并收住。", "actions": []}], "recipe": 11, "layers": ["machine", "flow", "cats", "pucks", "grounds", "handle", "mist"]}, "12": {"family": "factory", "mode": "full", "start": 0, "width": 900, "height": 1200, "breakdown": [{"id": "machine", "name": "机器与传送带", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡机、料斗、压力表、传送带和蒸汽管按一轮加工时间联动。", "actions": ["particle-hopper", "factory-machine-illustration"]}, {"id": "flow", "name": "液流先到", "start": 0, "end": 8000, "time": "0—8秒", "detail": "出口液流在小猫底色改变前落下，随后收住。", "actions": []}, {"id": "cats", "name": "配方小猫", "start": 0, "end": 8000, "time": "0—8秒", "detail": "小猫沿传送带前进，底色与花纹随加工进入，保留脚步与口型。", "actions": ["mouth-open-react", "factory-cat-illustration"]}, {"id": "pucks", "name": "收藏与猫脸粉饼", "start": 0, "end": 8000, "time": "0—8秒", "detail": "猫脸粉饼按卸料时刻落下，并进入下方的收藏排列。", "actions": ["factory-cat-puck-illustration"]}, {"id": "grounds", "name": "咖啡粉落下", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡粉粒按出口与滤篮位置落下。", "actions": ["particle-hopper"]}, {"id": "handle", "name": "手柄装卸与翻转", "start": 0, "end": 8000, "time": "0—8秒", "detail": "手柄装入、拆下、平移、翻转卸料后回到装入位置。", "actions": ["factory-handle-transfer", "factory-handle-illustration"]}, {"id": "mist", "name": "喷雾补花纹", "start": 0, "end": 8000, "time": "0—8秒", "detail": "喷雾位于前景，在底色之后补上第二层花纹并收住。", "actions": []}], "recipe": 12, "layers": ["machine", "flow", "cats", "pucks", "grounds", "handle", "mist"]}, "13": {"family": "factory", "mode": "full", "start": 0, "width": 900, "height": 1200, "breakdown": [{"id": "machine", "name": "机器与传送带", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡机、料斗、压力表、传送带和蒸汽管按一轮加工时间联动。", "actions": ["particle-hopper", "factory-machine-illustration"]}, {"id": "flow", "name": "液流先到", "start": 0, "end": 8000, "time": "0—8秒", "detail": "出口液流在小猫底色改变前落下，随后收住。", "actions": []}, {"id": "cats", "name": "配方小猫", "start": 0, "end": 8000, "time": "0—8秒", "detail": "小猫沿传送带前进，底色与花纹随加工进入，保留脚步与口型。", "actions": ["mouth-open-react", "factory-cat-illustration"]}, {"id": "pucks", "name": "收藏与猫脸粉饼", "start": 0, "end": 8000, "time": "0—8秒", "detail": "猫脸粉饼按卸料时刻落下，并进入下方的收藏排列。", "actions": ["factory-cat-puck-illustration"]}, {"id": "grounds", "name": "咖啡粉落下", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡粉粒按出口与滤篮位置落下。", "actions": ["particle-hopper"]}, {"id": "handle", "name": "手柄装卸与翻转", "start": 0, "end": 8000, "time": "0—8秒", "detail": "手柄装入、拆下、平移、翻转卸料后回到装入位置。", "actions": ["factory-handle-transfer", "factory-handle-illustration"]}, {"id": "mist", "name": "喷雾补花纹", "start": 0, "end": 8000, "time": "0—8秒", "detail": "喷雾位于前景，在底色之后补上第二层花纹并收住。", "actions": []}], "recipe": 13, "layers": ["machine", "flow", "cats", "pucks", "grounds", "handle", "mist"]}, "14": {"family": "factory", "mode": "full", "start": 0, "width": 900, "height": 1200, "breakdown": [{"id": "machine", "name": "机器与传送带", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡机、料斗、压力表、传送带和蒸汽管按一轮加工时间联动。", "actions": ["particle-hopper", "factory-machine-illustration"]}, {"id": "flow", "name": "液流先到", "start": 0, "end": 8000, "time": "0—8秒", "detail": "出口液流在小猫底色改变前落下，随后收住。", "actions": []}, {"id": "cats", "name": "配方小猫", "start": 0, "end": 8000, "time": "0—8秒", "detail": "小猫沿传送带前进，底色与花纹随加工进入，保留脚步与口型。", "actions": ["mouth-open-react", "factory-cat-illustration"]}, {"id": "pucks", "name": "收藏与猫脸粉饼", "start": 0, "end": 8000, "time": "0—8秒", "detail": "猫脸粉饼按卸料时刻落下，并进入下方的收藏排列。", "actions": ["factory-cat-puck-illustration"]}, {"id": "grounds", "name": "咖啡粉落下", "start": 0, "end": 8000, "time": "0—8秒", "detail": "咖啡粉粒按出口与滤篮位置落下。", "actions": ["particle-hopper"]}, {"id": "handle", "name": "手柄装卸与翻转", "start": 0, "end": 8000, "time": "0—8秒", "detail": "手柄装入、拆下、平移、翻转卸料后回到装入位置。", "actions": ["factory-handle-transfer", "factory-handle-illustration"]}, {"id": "mist", "name": "喷雾补花纹", "start": 0, "end": 8000, "time": "0—8秒", "detail": "喷雾位于前景，在底色之后补上第二层花纹并收住。", "actions": []}], "recipe": 14, "layers": ["machine", "flow", "cats", "pucks", "grounds", "handle", "mist"]}}});
