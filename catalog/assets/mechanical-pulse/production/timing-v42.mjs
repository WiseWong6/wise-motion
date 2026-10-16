// 90 BPM at 30 fps: 20 frames per beat. The first 340 frames stay unchanged.
// Preview and render use the same scene ranges and the same score landing.
export const pacing = Object.freeze({
  frames: 540,
  detail: {from: 340, duration: 48, trim: 3.8, rate: 1.95},
  material: {from: 372, duration: 48, trim: .15, rate: 1.75, revealFrames: 16},
  form: {from: 420, duration: 56},
  finale: {from: 460, duration: 80, revealFrames: 16},
  cadence: 480,
  fadeFrom: 528,
  score: 'score-v4.2.wav',
});
