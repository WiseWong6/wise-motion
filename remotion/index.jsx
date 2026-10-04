// Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only
import React, {useLayoutEffect, useMemo, useRef, useState} from 'react';
import {staticFile, useBufferState, useCurrentFrame, useDelayRender, useRemotionEnvironment, useVideoConfig} from 'remotion';
import {createFrameDocument} from './frame-document.mjs';
import {resolveEffect, sampleEffectTime} from './clock.mjs';
export {DEFAULT_FPS, MOTION_WIDTH, MOTION_HEIGHT, effectDefinitions, getEffectMetadata, normalizeSpeed, resolveEffect, sampleEffectTime} from './clock.mjs';

const asError = reason => reason instanceof Error ? reason : new Error(reason?.message || String(reason));

/** An isolated original painter whose only playback clock is Remotion's current frame. */
export function WiseMotionEffect({effectId, variantId, definition, speed = 1, ease,
  theme = 'dark', assetBaseUrl, bookSettings, width = 640, height = 360,
  sampleMode = 'playback', timeOverrideMs, elapsedOverrideMs, onReady, onFrame, onError}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {delayRender, continueRender, cancelRender} = useDelayRender();
  const {isRendering} = useRemotionEnvironment();
  const {delayPlayback} = useBufferState();
  const iframeRef = useRef(null);
  const holderRef = useRef(null);
  const callbacks = useRef({onReady, onFrame, onError});
  const themeRef = useRef(theme);
  themeRef.current = theme;
  callbacks.current = {onReady, onFrame, onError};
  const [failure, setFailure] = useState(null);
  const resolved = resolveEffect(definition ?? effectId, variantId);
  if (bookSettings) resolved.paper_settings = {...resolved.paper_settings, ...bookSettings};
  const definitionJson = JSON.stringify(resolved);
  const defaultBase = assetBaseUrl ?? staticFile('wise-motion');
  const base = typeof document === 'undefined' ? defaultBase : new URL(defaultBase.replace(/\/?$/, '/'), document.baseURI).href;
  if (theme !== 'dark' && theme !== 'light') throw new TypeError('外观必须为 dark 或 light');
  const source = useMemo(() => createFrameDocument({assetBaseUrl: base}), [base]);
  const sample = sampleEffectTime(resolved, frame, fps, {speed, sampleMode});
  if (timeOverrideMs !== undefined) {
    if (!Number.isFinite(timeOverrideMs) || timeOverrideMs < 0 || timeOverrideMs > resolved.duration_ms) throw new TypeError('指定时间必须在动效时长内');
    sample.time = timeOverrideMs;
    sample.elapsed = timeOverrideMs;
  }
  if (elapsedOverrideMs !== undefined) {
    if (!Number.isFinite(elapsedOverrideMs) || elapsedOverrideMs < 0) throw new TypeError('累计时间必须是非负有限数字');
    sample.elapsed = elapsedOverrideMs;
  }
  if (![width, height].every(value => Number.isFinite(value) && value > 0)) throw new TypeError('画面尺寸必须是正数');

  useLayoutEffect(() => {
    const iframe = iframeRef.current;
    iframe.style.visibility = 'hidden';
    let accept, reject;
    const ready = new Promise((resolve, fail) => { accept = resolve; reject = fail; });
    // 初始化可能先于逐帧 effect 失败；这里防止浏览器报告未处理的拒绝。
    ready.catch(() => {});
    const holder = {ready, session: null, disposed: false, notified: false};
    holderRef.current = holder;
    const loaded = async () => {
      if (holder.disposed) return;
      try {
        const child = iframe.contentWindow;
        if (child.document.URL === 'about:blank') return;
        if (typeof child.__wiseMotionCreateSession !== 'function') throw new Error('动效隔离页面初始化失败');
        const session = await child.__wiseMotionCreateSession({definition: JSON.parse(definitionJson), ease, theme: themeRef.current});
        if (holder.disposed) { session.destroy(); return; }
        holder.session = session;
        accept(session);
      } catch (reason) {
        if (!holder.disposed) reject(asError(reason));
      }
    };
    const failed = () => reject(new Error('无法打开动效隔离页面'));
    iframe.addEventListener('load', loaded);
    iframe.addEventListener('error', failed);
    iframe.srcdoc = source;
    return () => {
      holder.disposed = true;
      iframe.removeEventListener('load', loaded);
      iframe.removeEventListener('error', failed);
      (holder.session || iframe.contentWindow?.__wiseMotionSession)?.destroy();
      if (holderRef.current === holder) holderRef.current = null;
      reject(new Error('动效初始化已取消'));
    };
    // ease 在下一帧直接传给原绘制器；改变速度或曲线不重新准备材质。
  }, [source, definitionJson]);

  useLayoutEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    let active = true;
    let released = false;
    const handle = delayRender('Wise Motion ' + resolved.id + ' 第 ' + frame + ' 帧', {timeoutInMilliseconds: 180000});
    const playback = delayPlayback();
    const release = () => { if (!released) { released = true; continueRender(handle); playback.unblock(); } };
    holder.ready.then(async session => {
      if (!active || holder.disposed) return;
      session.doc.documentElement.dataset.theme = theme;
      await session.draw(sample.time, sample.elapsed, sampleMode, ease);
      if (!active || holder.disposed) return;
      iframeRef.current.style.visibility = 'visible';
      if (isRendering) {
        // 原绘制器完成 DOM/Canvas 更新不代表 iframe 已提交到父页面合成。
        // 两次父页面绘制回调之间保留一次真实绘制机会，再解除导出等待。
        await new Promise(resolve => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
        if (!active || holder.disposed) return;
      }
      if (!holder.notified) {
        holder.notified = true;
        callbacks.current.onReady?.(session);
      }
      callbacks.current.onFrame?.({time: sample.time, elapsed: sample.elapsed, frame});
    }).catch(reason => {
      if (!active || holder.disposed) return;
      const error = asError(reason);
      callbacks.current.onError?.(error);
      setFailure(error);
      if (isRendering) cancelRender(error);
    }).finally(release);
    return () => { active = false; release(); };
  }, [source, definitionJson, frame, sample.time, sample.elapsed, sampleMode, ease, theme, delayRender, continueRender, cancelRender, delayPlayback, isRendering]);

  if (failure) throw failure;
  const scale = Math.min(width / 640, height / 360);
  return <div data-wise-motion-effect={resolved.id} style={{position: 'relative', width, height, overflow: 'hidden'}}>
    <iframe ref={iframeRef} title={resolved.name || resolved.id} scrolling="no" aria-hidden="true"
      style={{position: 'absolute', width: 640, height: 360, border: 0, display: 'block',
        left: (width - 640 * scale) / 2, top: (height - 360 * scale) / 2,
        transform: scale === 1 ? 'none' : `scale(${scale})`, transformOrigin: 'top left'}} />
  </div>;
}
