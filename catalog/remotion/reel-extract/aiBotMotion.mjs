const clamp = x => Math.min(1, Math.max(0, x));
const out = (t, a, b) => 1 - (1 - clamp((t - a) / (b - a))) ** 3;

export const AI_SCENE_LAYOUT = {
  confused: {x: 72, y: 484, width: 936, height: 624},
  happy: {x: 72, y: 392, width: 936, height: 624},
};

// Seeking only depends on time; no random state or cumulative updates.
export const aiScenePose = (t, mood) => {
  const happy = mood === 'happy';
  const start = happy ? 46.25 : 12.85;
  return {...AI_SCENE_LAYOUT[mood], opacity: out(t, start, start + 0.4),
    angle: 0, scale: 1, dy: 0};
};
