// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useDelayRender, useVideoConfig} from 'remotion';
import '../effects/time-in-motion-graphics.js';

export function WiseTimeInMotionGraphics({effectId = 'word-block-rise', speed = 1, fontSrc}) {
  const frame = useCurrentFrame(), {fps, width, height} = useVideoConfig();
  const {delayRender, continueRender, cancelRender} = useDelayRender();
  const root = useRef(null), painter = useRef(null), time = useRef(0);
  time.current = frame / fps * speed * 1000;
  const src = fontSrc || staticFile('catalog/fonts/Oswald-Bold.woff2');
  useLayoutEffect(() => {
    let alive = true, done = false, face;
    const handle = delayRender('准备可编辑动效');
    const release = () => {if (!done) {done = true; continueRender(handle);}};
    const mount = () => {
      if (!alive) return;
      painter.current = globalThis.MotionFactories[effectId](root.current);
      painter.current(time.current); release();
    };
    if (effectId === 'word-block-rise') {
      face = new FontFace('Oswald', 'url(' + JSON.stringify(src) + ')', {weight: '700'});
      face.load().then(() => {if (alive) {document.fonts.add(face); mount();}})
        .catch(error => {if (alive) {release(); cancelRender(error);}});
    } else mount();
    return () => {alive = false; painter.current?.destroy(); painter.current = null;
      root.current?.replaceChildren(); if (face) document.fonts.delete(face); release();};
  }, [effectId, src, delayRender, continueRender, cancelRender]);
  useLayoutEffect(() => {painter.current?.(time.current);}, [frame, fps, speed]);
  const scale = Math.min(width / 640, height / 360);
  return <AbsoluteFill style={{background: '#101114', overflow: 'hidden'}}>
    <div ref={root} style={{position: 'absolute', width: 640, height: 360,
      left: (width - 640 * scale) / 2, top: (height - 360 * scale) / 2,
      transformOrigin: '0 0', transform: `scale(${scale})`}}/>
  </AbsoluteFill>;
}
