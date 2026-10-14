// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0
import React, {useLayoutEffect, useRef} from 'react';
import {AbsoluteFill, Freeze, Html5Audio, Html5Video, OffthreadVideo, staticFile,
  useCurrentFrame, useRemotionEnvironment, useVideoConfig} from 'remotion';

/** A frame cache is metadata on the definition, independent of any particular model. */
export function sampleNativeFrame(cache, timeMs) {
  if (!Number.isFinite(timeMs)) throw new TypeError('时间必须为有限数字');
  if (!cache || !Number.isInteger(cache.frames) || cache.frames < 1 ||
    !Number.isFinite(cache.fps) || cache.fps <= 0 ||
    !Number.isInteger(cache.start_frame ?? 0) || (cache.start_frame ?? 0) < 0) {
    throw new TypeError('原生帧缓存定义无效');
  }
  const local = Math.max(0, Math.min(cache.frames - 1, Math.floor(timeMs * cache.fps / 1000 + 1e-9)));
  const frame = (cache.start_frame || 0) + local;
  return {frame, time: (frame + 0.5) / cache.fps};
}

export function WiseNativeVideo({definition, speed = 1, includeAudio = true,
  assetBaseUrl, width, height, timeOverrideMs, onReady, onFrame, onError}) {
  const frame = useCurrentFrame(), {fps, width: vw, height: vh} = useVideoConfig();
  const {isRendering} = useRemotionEnvironment();
  const stage = useRef(null), video = useRef(null), announced = useRef(false);
  if (!Number.isFinite(speed)) throw new TypeError('播放速度必须为有限数字');
  const cache = definition?.source?.frame_cache;
  const rate = Math.max(0.5, Math.min(2, speed));
  const time = timeOverrideMs ?? frame / fps * rate * 1000;
  const sample = sampleNativeFrame(cache, time);
  const base = assetBaseUrl ? new URL(assetBaseUrl.replace(/\/?$/, '/'),
    typeof document === 'undefined' ? 'http://localhost/' : document.baseURI).href : null;
  const url = file => base ? new URL(file, base).href : staticFile(file);
  const movie = url(cache.video);
  const announce = () => {
    if (announced.current) return;
    announced.current = true;
    onReady?.({native: true, stage: stage.current, destroy() {}, snapshot() {
      const canvas = document.createElement('canvas');
      canvas.width = cache.width; canvas.height = cache.height;
      if (!video.current || video.current.readyState < 2) throw new Error('原生帧尚未就绪');
      canvas.getContext('2d').drawImage(video.current, 0, 0);
      canvas.style.cssText = 'width:100%;height:100%;object-fit:contain';
      return canvas;
    }});
  };
  useLayoutEffect(() => {onFrame?.({time, elapsed: time, frame});}, [time, frame, onFrame]);
  useLayoutEffect(() => {announced.current = false;}, [definition?.id, movie]);
  const props = {src: movie, muted: true, pauseWhenBuffering: true, onError,
    style: {width: '100%', height: '100%', objectFit: 'contain'}};
  return <div ref={stage} data-native-scene={definition.id} data-native-frame={sample.frame}
    style={{position: 'relative', width: width ?? vw, height: height ?? vh, background: '#08090b'}}>
    <AbsoluteFill>
      <Freeze frame={sample.time * fps}>
        {isRendering ? <OffthreadVideo {...props}/> :
          <Html5Video {...props} ref={video} onLoadedData={announce} onSeeked={announce}/>}
      </Freeze>
      {includeAudio && definition.kind === 'composition' && cache.audio ?
        <Html5Audio src={url(cache.audio)} playbackRate={rate}/> : null}
    </AbsoluteFill>
  </div>;
}
