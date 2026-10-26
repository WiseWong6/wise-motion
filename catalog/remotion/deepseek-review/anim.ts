// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import { Easing, interpolate } from "remotion";

export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_EXPO = Easing.bezier(0.19, 1, 0.22, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_BACK = Easing.bezier(0.34, 1.4, 0.64, 1);

/** 0→1 progress for an entrance that starts at `start` and lasts `dur` frames. */
export const prog = (
  frame: number,
  start: number,
  dur: number,
  easing: (t: number) => number = EASE_EXPO,
) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/** Decaying pulse that fires every `period` frames (beat-synced accents). */
export const pulse = (frame: number, period: number, decay = 5, offset = 0) => {
  const t = (((frame - offset) % period) + period) % period;
  return Math.exp(-t / decay);
};
