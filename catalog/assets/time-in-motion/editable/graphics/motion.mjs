import {Easing, interpolate} from 'remotion';

export const ENTER_EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const EXIT_EASE = Easing.bezier(0.55, 0, 0.85, 0.45);
export const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'};
export const clamp01 = (value) => Math.max(0, Math.min(1, value));

export function finite(name, value, minimum = -Infinity) {
  if (!Number.isFinite(value) || value < minimum) {
    throw new Error(`${name} must be a finite number >= ${minimum}`);
  }
  return value;
}

export function phase(frame, from, to, easing = ENTER_EASE) {
  if (to <= from) return frame < from ? 0 : 1;
  return interpolate(frame, [from, to], [0, 1], {...CLAMP, easing});
}

// Shared half-open lifetime. The final active frame is already fully exited.
// Zero exitFrames deliberately holds until the next cut instead.
export function timing(frame, start, duration, enterFrames, exitFrames) {
  finite('frame', frame);
  finite('start', start);
  finite('duration', duration, 2);
  finite('enterFrames', enterFrames, 0);
  finite('exitFrames', exitFrames, 0);
  const end = duration - 1;
  const factor = Math.min(1, end / Math.max(1, enterFrames + exitFrames));
  const enter = enterFrames * factor;
  const exit = exitFrames * factor;
  return {
    local: frame - start,
    active: frame >= start && frame < start + duration,
    end,
    enter,
    exit,
    exitStart: end - exit,
  };
}

export function slotPhases(t, rank, maxRank, stagger) {
  finite('stagger', stagger, 0);
  const enterDelay = rank * Math.min(stagger, t.enter / Math.max(1, maxRank + 2));
  const exitDelay = rank * Math.min(stagger, t.exit / Math.max(1, maxRank + 2));
  const maxEnterDelay = maxRank * Math.min(stagger, t.enter / Math.max(1, maxRank + 2));
  const maxExitDelay = maxRank * Math.min(stagger, t.exit / Math.max(1, maxRank + 2));
  return {
    enter: t.enter === 0 ? 1 : phase(t.local, enterDelay, enterDelay + t.enter - maxEnterDelay),
    exit: t.exit === 0 ? 0 : phase(t.local, t.exitStart + exitDelay, t.end - maxExitDelay + exitDelay, EXIT_EASE),
  };
}
