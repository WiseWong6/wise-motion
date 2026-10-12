// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useDelayRender, useVideoConfig} from 'remotion';
import '../effects/speech-caption.js';

export function WiseSpeechCaption({seconds, speed = 1, caption = globalThis.WiseSpeechCaption.defaults,
  fontSrc, background = '#0A0A0B'}) {
  const frame = useCurrentFrame(), {fps, width, height} = useVideoConfig();
  const {delayRender, continueRender, cancelRender} = useDelayRender();
  const root = useRef(null), painter = useRef(null), time = useRef(0);
  time.current = (seconds ?? frame / fps * speed) * 1000;
  const src = fontSrc || staticFile('fonts/Oswald-Bold.woff2');
  useLayoutEffect(() => {
    let alive = true, released = false;
    const handle = delayRender('准备字幕本地字体');
    const release = () => {if (!released) {released = true; continueRender(handle);}};
    const face = new FontFace('Oswald', 'url(' + JSON.stringify(src) + ')', {weight: '700'});
    face.load().then(() => {
      if (!alive) return;
      document.fonts.add(face);
      painter.current = globalThis.WiseSpeechCaption.mount(root.current, caption);
      painter.current(time.current); release();
    }).catch(error => {if (alive) {release(); cancelRender(error);}});
    return () => {
      alive = false; painter.current?.destroy(); painter.current = null;
      document.fonts.delete(face); root.current?.replaceChildren(); release();
    };
  }, [src, caption, delayRender, continueRender, cancelRender]);
  useLayoutEffect(() => {painter.current?.(time.current);}, [frame, fps, seconds, speed, caption]);
  const scale = Math.min(width / 640, height / 360);
  return <AbsoluteFill style={{background, overflow: 'hidden'}}>
    <div ref={root} style={{position: 'absolute', width: 640, height: 360,
      left: (width - 640 * scale) / 2, top: (height - 360 * scale) / 2,
      transformOrigin: '0 0', transform: `scale(${scale})`}} />
  </AbsoluteFill>;
}
