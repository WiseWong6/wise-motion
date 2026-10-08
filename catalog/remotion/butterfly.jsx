// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, staticFile, useCurrentFrame, useDelayRender, useVideoConfig} from 'remotion';
import '../effects/butterfly-motion.js';
import '../effects/butterfly.js';

export const butterflyMotion = globalThis.WiseButterflyMotion;

/** Catalog, illustration and wing action use this same renderer and local image atlas. */
export function WiseMotionButterfly({atlasSrc, wingAtlasSrc, selection = 1, wingSelections,
  revealFromRoot = false, motionState,
  background = 'transparent', seconds, speed = 1}) {
  const frame = useCurrentFrame(), {fps} = useVideoConfig();
  const {delayRender, continueRender, cancelRender} = useDelayRender();
  const root = useRef(null), renderer = useRef(null);
  const src = atlasSrc || staticFile('wise-motion/catalog/assets/butterfly/wing-atlas.webp');
  const alternateSrc = wingAtlasSrc;
  useLayoutEffect(() => {
    let alive = true, released = false;
    const handle = delayRender('蝴蝶图集准备');
    const release = () => {if (!released) {released = true; continueRender(handle);}};
    const instance = globalThis.WiseButterfly.mount(root.current, {atlasSrc: src, alternateSrc});
    renderer.current = instance;
    instance.ready.then(() => {if (alive) release();}).catch(error => {if (alive) {release(); cancelRender(error);}});
    return () => {alive = false; instance.destroy(); if (renderer.current === instance) renderer.current = null; release();};
  }, [src, alternateSrc, delayRender, continueRender, cancelRender]);
  useLayoutEffect(() => {
    renderer.current?.draw(seconds ?? frame / fps * speed, {selection, wingSelections, revealFromRoot, motionState, background});
  }, [src, alternateSrc, seconds, frame, fps, speed, selection, wingSelections, revealFromRoot, motionState, background]);
  return <AbsoluteFill ref={root} data-wise-motion-effect="butterfly-illustration" style={{overflow: 'hidden', background}} />;
}
