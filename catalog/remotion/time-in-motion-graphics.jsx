// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import '../effects/time-in-motion-graphics.js';

export function WiseTimeInMotionGraphics({effectId = 'sparse-dial-counterturn', speed = 1}) {
  const frame = useCurrentFrame(), {fps, width, height} = useVideoConfig();
  const root = useRef(null), painter = useRef(null), time = useRef(0);
  time.current = frame / fps * speed * 1000;
  useLayoutEffect(() => {
    const draw = globalThis.MotionFactories[effectId](root.current);
    painter.current = draw; draw(time.current);
    return () => {draw.destroy(); painter.current = null; root.current?.replaceChildren();};
  }, [effectId]);
  useLayoutEffect(() => {painter.current?.(time.current);}, [frame, fps, speed]);
  const scale = Math.min(width / 640, height / 360);
  return <AbsoluteFill style={{background: '#101114', overflow: 'hidden'}}>
    <div ref={root} style={{position: 'absolute', width: 640, height: 360,
      left: (width - 640 * scale) / 2, top: (height - 360 * scale) / 2,
      transformOrigin: '0 0', transform: `scale(${scale})`}}/>
  </AbsoluteFill>;
}
