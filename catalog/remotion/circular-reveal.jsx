// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import '../effects/circular-reveal.js';

export const circularReveal = globalThis.WiseCircularReveal;

/** Clip any page or cover layer; explicit local seconds preserve existing film timing. */
export function WiseMotionCircularReveal({seconds, variantId = 'paper-expand', speed = 1, background, children}) {
  const frame = useCurrentFrame(), {fps} = useVideoConfig();
  const state = circularReveal.sample(seconds ?? frame / fps * speed, variantId);
  return <div data-wise-motion-effect="iris-open-transition" data-variant={variantId}
    style={{position: 'absolute', inset: 0, background: background ?? state.background, clipPath: state.clipPath}}>
    {children}
  </div>;
}
