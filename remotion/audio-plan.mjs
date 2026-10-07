// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import {normalizeSpeed} from './clock.mjs';

/** 声音只属于完整组合；独立动作即使共用绘制代码也保持无声。 */
export function getAudioPlan(effect, fps = 60, speed = 1) {
  if (effect.kind !== 'composition' || !effect.audio?.tracks?.length) return [];
  const rate = normalizeSpeed(speed);
  return effect.audio.tracks.map((track, index) => {
    const start = track.start_ms ?? 0;
    const duration = Math.min(track.duration_ms ?? effect.duration_ms - start, effect.duration_ms - start);
    return {...track, key: index, from: Math.round(start * fps / (1000 * rate)),
      durationInFrames: Math.max(1, Math.ceil(duration * fps / (1000 * rate) - 1e-9)),
      trimBefore: Math.round((track.offset_ms ?? 0) * fps / 1000),
      playbackRate: rate * (track.rate ?? 1),
      fadeInFrames: (track.fade_in_ms ?? 0) * fps / (1000 * rate),
      fadeOutFrames: (track.fade_out_ms ?? 0) * fps / (1000 * rate)};
  });
}

export function trackVolume(track, frame) {
  const attack = track.fadeInFrames ? Math.min(1, Math.max(0, frame / track.fadeInFrames)) : 1;
  const release = track.fadeOutFrames ? Math.min(1, Math.max(0, (track.durationInFrames - frame) / track.fadeOutFrames)) : 1;
  return (track.volume ?? 1) * Math.min(attack, release);
}
