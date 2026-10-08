const clamp = v => Math.max(0, Math.min(1, v));
const ease = (t, a, b) => { const u = clamp((t - a) / (b - a)); return u * u * (3 - 2 * u); };
const pulse = (t, at, duration) => {
  const u = (t - at) / duration;
  return u > 0 && u < 1 ? Math.sin(u * Math.PI) ** 2 : 0;
};
export const BOT_FACE_ANCHORS = {
  confused: [
    {id: 'gpt', x: 739, y: 559, angle: -21, gap: 105, width: 15, height: 45},
    {id: 'claude', x: 378, y: 342, angle: -16, gap: 101, width: 15, height: 45},
    {id: 'grok', x: 1250, y: 340, angle: 15, gap: 92, width: 15, height: 45},
    {id: 'deepseek', x: 283, y: 686, angle: -23, gap: 95, width: 15, height: 45},
    {id: 'glm', x: 1087, y: 676, angle: 15, gap: 98, width: 15, height: 45},
    {id: 'workbuddy', x: 930, y: 284, angle: 15, gap: 92, width: 11, height: 33},
  ],
  happy: [
    {id: 'gpt', x: 687, y: 428, angle: -19, gap: 90, width: 12, height: 36},
    {id: 'claude', x: 226, y: 450, angle: -15, gap: 78, width: 12, height: 36},
    {id: 'grok', x: 1158, y: 359, angle: 14.5, gap: 85, width: 11, height: 33},
    {id: 'deepseek', x: 442, y: 355, angle: 15, gap: 85, width: 13, height: 39},
    {id: 'glm', x: 1349, y: 512, angle: 17, gap: 87, width: 14, height: 42},
    {id: 'workbuddy', x: 916, y: 450, angle: 17, gap: 76, width: 12, height: 36},
  ],
};

// Every face and symbol is computed from the composition time, including when seeking backwards.
export const botEyePose = (t, mood, index) => {
  const age = t - (mood === 'happy' ? 46.25 : 12.85);
  const id = BOT_FACE_ANCHORS[mood][index].id;
  const blink = Math.max(pulse(age, 0.38 + index * 0.075, 0.16), pulse(age, 1.45 + index * 0.09, 0.18));
  let left = 'capsule', right = 'capsule', leftMorph = 0, rightMorph = 0, openness = 1;
  if (mood === 'confused') {
    if (id === 'claude') openness = 0.58 - 0.12 * Math.sin(age * 3);
    if (id === 'glm') openness = 0.68 - 0.1 * Math.sin(age * 2 + 1);
    if (id === 'grok') {
      const doubt = ease(age, 0.45, 0.75) * (1 - ease(age, 1.65, 1.95));
      right = 'flat'; rightMorph = doubt;
    }
    if (id === 'workbuddy') {
      left = right = 'closed'; leftMorph = rightMorph = 1 - ease(age, 0.8, 1.07);
    }
    if (id === 'gpt') openness = 1 - 0.3 * pulse(age, 0.95, 0.75);
    if (id === 'deepseek') openness = 0.82 + 0.12 * Math.sin(age * 2.5);
  } else {
    const smiling = ease(age, 0.32 + index * 0.055, 0.6 + index * 0.055);
    if (['gpt', 'glm', 'grok'].includes(id)) {left = right = 'smile'; leftMorph = rightMorph = 0.75 + 0.25 * smiling;}
    if (id === 'claude') {right = 'smile'; rightMorph = 0.75 + 0.25 * smiling;}
    if (id === 'workbuddy') {left = right = 'smile'; leftMorph = rightMorph = ease(age, 1.02, 1.3);}
  }
  return {left, right, leftMorph, rightMorph, openness: Math.max(0.08, openness * (1 - 0.92 * blink)),
    blink, x: 0, y: 0};
};

export const botSymbolPose = (t, at, duration = 1.15) => {
  const age = t - at;
  const entrance = ease(age, 0, 0.17);
  const opacity = age < 0 || age >= duration ? 0 : entrance * (1 - ease(age, duration - 0.28, duration));
  return {opacity, scale: 1, y: 0, angle: 0};
};
export const botSweatPose = (t, at) => {
  const age = t - at, cycle = 1.06, n = Math.floor(Math.max(0, age) / cycle);
  const u = Math.max(0, age - n * cycle);
  return {opacity: age < 0 || n >= 3 ? 0 : ease(u, 0, 0.15) * (1 - ease(u, 0.68, 1.03)),
    y: 37 * (u / cycle) ** 2, x: 0, scale: 0.55 + 0.45 * ease(u, 0, 0.18)};
};
export const thoughtCloudPose = t => {
  const age = t - 13.06;
  return {opacity: ease(age, 0, 0.23), scale: 1, y: 0, questionAngle: 0, questionScale: 1};
};
const hash = (i, salt) => ((i * 73 + salt * 127 + i * i * 19) % 997) / 997;
export const liveBotConfetti = t => Array.from({length: 88}, (_, i) => {
  // A few small pieces lead into one continuous hand-to-air release.
  const lead = i < 12, at = lead ? 46.52 + i * 0.023 : 46.82 + hash(i, 1) * 0.28;
  const age = t - at, a = Math.max(0, age), direction = i % 2 ? -1 : 1;
  const originX = direction === 1 ? 325 : 1058, originY = direction === 1 ? 232 : 210;
  const destinationX = (direction === 1 ? 84 : 712) + hash(i, 2) * 740;
  const apexTime = 0.58 + hash(i, 3) * 0.15, apexY = -198 + hash(i, 4) * 190;
  const lifetime = apexTime * (1 + Math.sqrt((690 - apexY) / (originY - apexY)));
  const x = originX + (destinationX - originX) * (1 - Math.exp(-a * 2.4));
  const y = apexY + (originY - apexY) * (1 - a / apexTime) ** 2;
  return {id: i, x, y,
    angle: i * 39 + a * direction * (160 + hash(i, 6) * 180),
    width: (lead ? 14 : 24) + hash(i, 7) * (lead ? 5 : 14),
    height: (lead ? 8 : 14) + hash(i, 8) * (lead ? 4 : 9),
    kind: i % 8 === 0 ? 'star' : i % 5 === 0 ? 'streamer' : 'paper',
    flutter: 0.72 + 0.28 * Math.abs(Math.cos(a * 7 + i)),
    color: ['#FFE9A6', '#FFB1AE', '#B4A4FF', '#B7F2DD', '#EDEEFF', '#8291FF'][i % 6],
    opacity: age < 0 || age >= lifetime || t >= 48.15 ? 0
      : ease(age, 0, 0.09) * (1 - ease(age, lifetime - 0.28, lifetime))};
});
