// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import React from 'react';
import {Html5Audio, Loop, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {getAudioPlan, trackVolume} from './audio-plan.mjs';
import {normalizeSpeed} from './clock.mjs';

function AudioCycle({effect, speed, base}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return getAudioPlan(effect, fps, speed).map(track => <Sequence key={track.key} from={track.from}
    durationInFrames={track.durationInFrames} layout="none">
    <Html5Audio src={new URL(track.src, base).href} trimBefore={track.trimBefore}
      playbackRate={track.playbackRate} volume={trackVolume(track, frame - track.from)} />
  </Sequence>);
}

export function CompositionAudio({effect, speed, base}) {
  const {fps} = useVideoConfig();
  if (effect.kind !== 'composition' || !effect.audio?.tracks?.length) return null;
  const cycle = <AudioCycle effect={effect} speed={speed} base={base} />;
  return effect.loop ? <Loop durationInFrames={Math.max(1, Math.ceil(effect.duration_ms * fps / (1000 * normalizeSpeed(speed)) - 1e-9))}>{cycle}</Loop> : cycle;
}
