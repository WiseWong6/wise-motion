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
