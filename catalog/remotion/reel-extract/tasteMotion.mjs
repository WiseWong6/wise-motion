// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import {lerp,prog,quintInOut} from './math.mjs';
import CUES from './butterfly-cues.json';
import '../../effects/butterfly-motion.js';
const {PARTS,butterflyState}=globalThis.WiseButterflyMotion;
export const tasteButterflyState = t => {
  const enterAt = CUES.enter;
  const entered = prog(t, enterAt, CUES.entered, quintInOut);
  const age = Math.max(0, t - enterAt);
  // The early question has its original space below the illustration.
  const grow = prog(t, CUES.growStart, CUES.growEnd, quintInOut);
  const chosenAt = CUES.chosen;
  // The colour travels out from each hinge, with a small fore/hind-wing stagger.
  const wingSelections = PARTS.map(part => {
    const delay = (part.hind ? 0.045 : 0) + (part.side > 0 ? 0.02 : 0);
    return prog(t, chosenAt + delay, chosenAt + 0.34 + delay, quintInOut);
  });
  const chosenEnd = chosenAt + 0.405;
  const selection = prog(t, chosenAt, chosenEnd, quintInOut);
  const elapsed = Math.max(0, t - chosenAt);
  const duration = 0.32, u = Math.min(1, elapsed / duration);
  // 保留原振翅时钟，选定自己的审美后连续加速。
  const fasterClock = elapsed < duration
    ? duration * (u ** 6 - 3 * u ** 5 + 2.5 * u ** 4)
    : elapsed - duration / 2;
  const seconds = age * 0.5 + fasterClock * 0.5;
  const turn = Math.sin(Math.PI * prog(t, CUES.turnStart, CUES.turnEnd, quintInOut));
  const flight = prog(t, chosenEnd, CUES.flightEnd, quintInOut);
  const strength = lerp(0.3 + 0.12 * turn, 1, selection);
  const pose = butterflyState(seconds);
  const motionState = {...pose, bank: pose.bank + 4 * turn - 3 * flight,
    wings: pose.wings.map((wing, i) => {
      const part = PARTS[i];
      const angle = (part.hind ? 10 : 8) + (part.hind ? 52 : 62) * wing.closed * strength;
      return {...wing, angle, yaw: -part.side * angle, roll: wing.roll * strength,
        brightness: 1 - 0.105 * wing.closed * strength};
    })};
  return {entered, selection, wingSelections, seconds, flight, motionState,
    // 彩蝶与绿蝶共用缩放，保持换色和投影连续，给文字与纸面多留一些空间。
    scale: (lerp(0.98, 1.18, entered) + 0.06 * grow - 0.02 * flight) * 0.88,
    offsetX: entered * (50 + 10 * Math.sin(age * 1.3) + 38 * flight + 10 * Math.sin(Math.PI * flight)),
    offsetY: lerp(-82, 118, grow) + 26 * (1 - entered)
      - entered * 7 * Math.sin(age * 2.3) - 24 * flight + 11 * Math.sin(Math.PI * flight)};
};

