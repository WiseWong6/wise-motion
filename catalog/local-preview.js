/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function (global) {
  'use strict';
  const duration = 25866.666666666668, fps = 60, frames = 1553;
  const source = new URL('../.local-previews/point-domain-flow-sequence.mp4', document.currentScript?.src || document.baseURI).href;
  const quantize = ms => Math.round(ms * fps / 1000) * 1000 / fps;
  function create(root, supplied, options = {}) {
    const definition = global.MotionKit.resolveVariant(supplied);
    const defaultVariant = !definition.variant_id || definition.variant_id === definition.variants?.[0]?.id;
    if (global.location.protocol !== 'file:' || definition.id !== 'point-domain-flow-sequence' ||
        !defaultVariant || definition.duration_ms !== duration || definition.loop ||
        (options.ease || definition.default_ease) !== definition.default_ease) {
      return global.MotionRuntime.create(root, supplied, options);
    }
    let mode = 'video', video = null, code = null, mount = null, destroyed = false, videoUnavailable = false, videoSeeking = false;
    let time = 0, speed = 1, ease = definition.default_ease, playing = false, preparing = true, error = null;
    let generation = 0, playGeneration = 0, cleanupVideo = () => {}, seekVideo = () => {}, transition = Promise.resolve(false);
    let settleInitial, initialSettled = false;
    const ready = new Promise(resolve => { settleInitial = resolve; });
    const settleReady = value => { if (!initialSettled) { initialSettled = true; settleInitial(value); } };
    const notify = () => { if (!destroyed) options.onUpdate?.({time, duration, paused:!playing, preparing, error, previewMode:mode}); };
    const sample = ms => {
      if (!Number.isFinite(ms)) throw new TypeError('时间必须是有限数字');
      const clamped = Math.max(0, Math.min(duration, ms));
      return clamped === duration ? duration : Math.min(duration, quantize(clamped));
    };
    function fit() {
      if (destroyed) return;
      if (mode === 'code') { code?.fit(); return; }
      if (!mount) return;
      const box = root.getBoundingClientRect(), ratio = global.devicePixelRatio || 1;
      const raw = Math.min(box.width / 640, box.height / 360) || 1;
      const scale = Math.max(.01, Math.floor(raw * 640 * ratio) / (640 * ratio));
      mount.style.width = 640 * scale + 'px'; mount.style.height = 360 * scale + 'px';
    }
    function stopCurrent() {
      playGeneration++;
      cleanupVideo(); cleanupVideo = () => {};
      if (code) { code.pause(); code.destroy(); code = null; }
      video = null; mount = null; videoSeeking = false; seekVideo = () => {};
    }
    function playVideo() {
      if (!video || preparing || videoSeeking || !playing || destroyed || document.hidden) return;
      const current = video, token = ++playGeneration;
      Promise.resolve(current.play()).then(() => {
        // 迟到的 play() 只能暂停自己的旧视频，不能唤醒或暂停新的实例。
        if (destroyed || current !== video || !playing || videoSeeking || document.hidden) current.pause();
      }, reason => {
        if (destroyed || current !== video || token !== playGeneration) return;
        playing = false; current.pause(); notify();
      });
    }
    function seek(ms) {
      if (destroyed) return;
      time = sample(ms);
      if (mode === 'code') code?.seek(time);
      else if (video?.readyState >= 1) seekVideo(time);
      notify();
    }
    function ensureCode() {
      if (destroyed) return Promise.resolve(false);
      if (mode === 'code' && code) return transition;
      const snapshot = {time, speed, ease, playing}, token = ++generation;
      stopCurrent(); mode = 'code'; preparing = true; error = null;
      let restoring = true;
      try {
        code = global.MotionRuntime.create(root, supplied, {...options, autoplay:false, ease,
          onUpdate(state) {
            if (destroyed || token !== generation || restoring) return;
            time = state.time; playing = !state.paused; preparing = !!state.preparing; error = state.error || null;
            notify();
          }});
        time = snapshot.time; speed = snapshot.speed; ease = snapshot.ease; playing = snapshot.playing && !document.hidden;
        code.setSpeed(speed); code.setEase(ease); code.seek(time);
        if (playing) code.play(); else code.pause();
        restoring = false;
        const current = code;
        transition = Promise.resolve(current.ready ?? true).then(ok => {
          if (destroyed || token !== generation) return false;
          preparing = false; error = current.error || null;
          if (!ok) playing = false;
          settleReady(!!ok); notify(); return !!ok;
        }, reason => {
          if (destroyed || token !== generation) return false;
          current.pause(); playing = false; preparing = false;
          error = reason instanceof Error ? reason : new Error(String(reason));
          settleReady(false); notify(); return false;
        });
      } catch (reason) {
        restoring = false; error = reason instanceof Error ? reason : new Error(String(reason));
        code?.destroy(); code = null; preparing = false; playing = false;
        settleReady(false); transition = Promise.resolve(false);
      }
      notify(); return transition;
    }
    function ensureVideo() {
      if (destroyed || ease !== definition.default_ease) return Promise.resolve(false);
      if (videoUnavailable) return ensureCode();
      if (mode === 'video' && video) return transition;
      const snapshot = {time, speed, ease, playing}, token = ++generation;
      stopCurrent(); mode = 'video'; preparing = true; error = null;
      time = snapshot.time; speed = snapshot.speed; ease = snapshot.ease; playing = snapshot.playing && !document.hidden;
      mount = document.createElement('div');
      Object.assign(mount.style, {position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)'});
      mount.dataset.localPreview = definition.id;
      const current = video = document.createElement('video');
      current.muted = true; current.defaultMuted = true; current.volume = 0; current.playsInline = true;
      current.preload = 'auto'; current.controls = false; current.playbackRate = speed;
      current.setAttribute('aria-label', '光点建网流线展开，本机视频预览');
      Object.assign(current.style, {width:'100%', height:'100%', display:'block', objectFit:'contain'});
      mount.append(current); root.replaceChildren(mount); fit();
      let settled = false, failed = false, metadata = false, awaitingSeek = false, seekCompleted = false, seekTarget = 0, lastFrameTime, frameCallback = null, timeout;
      const hasFrameCallback = typeof current.requestVideoFrameCallback === 'function';
      let resolveTransition;
      transition = new Promise(resolve => { resolveTransition = resolve; });
      const settle = ok => { if (!settled) { settled = true; resolveTransition(ok); } };
      const active = () => !destroyed && token === generation && current === video;
      const listeners = [];
      const on = (event, callback) => { current.addEventListener(event, callback); listeners.push([event, callback]); };
      seekVideo = next => {
        if (!active()) return;
        const targetFrame = Math.round(next * fps / 1000);
        // 媒体回调通常只保留六位小数；按实际帧号比较，避免同帧重复定位后
        // 等待浏览器不会再次提交的画面。未解码或尚在定位的帧不能走此捷径。
        if (!awaitingSeek && current.readyState >= 2 && Number.isFinite(lastFrameTime) &&
            Math.round(lastFrameTime * fps) === targetFrame && Math.round(current.currentTime * fps) === targetFrame) return;
        // 必须在写入媒体时钟之前标记；seeking 事件异步送达，旧帧可能先回调。
        awaitingSeek = videoSeeking = true; seekCompleted = false; seekTarget = next / 1000; playGeneration++;
        current.pause();
        // 浏览器会把媒体时钟截到微秒。797/60 等帧边界可能因此落到前一帧，
        // 写入时向目标帧内部移十微秒；逻辑时间和实际帧校验仍使用原目标。
        current.currentTime = seekTarget + .00001;
      };
      function acceptSeek(mediaTime) {
        if (!awaitingSeek) return true;
        if (Math.abs(mediaTime - seekTarget) > .5 / fps) return false;
        awaitingSeek = videoSeeking = false; return true;
      }
      function fail() {
        if (!active()) return;
        failed = true; videoUnavailable = true;
        // 本机缓存不存在或不能解码时，用相同定义、时间和播放状态恢复源码绘制。
        // 同一实例只尝试一次缓存；目录反复同步拆解面板不会触发重新载入。
        ensureCode().then(settle);
      }
      function decoded() {
        const wasSeeking = awaitingSeek;
        if (!hasFrameCallback && seekCompleted && current.readyState >= 2) acceptSeek(current.currentTime);
        if (!active() || !metadata || awaitingSeek || current.readyState < 2) return;
        if (preparing) {
          clearTimeout(timeout); preparing = false; settle(true); settleReady(true); notify(); playVideo();
        } else if (wasSeeking) playVideo();
      }
      function update(mediaTime) {
        if (!active() || preparing || awaitingSeek) return;
        time = sample(mediaTime * 1000); notify();
      }
      function nextFrame() {
        if (!active() || !hasFrameCallback) return;
        frameCallback = current.requestVideoFrameCallback((_now, frame) => {
          frameCallback = null;
          if (!active()) return;
          const wasSeeking = awaitingSeek, wasPreparing = preparing;
          if (acceptSeek(frame.mediaTime)) {
            lastFrameTime = frame.mediaTime; decoded(); update(frame.mediaTime);
            if (wasSeeking && !wasPreparing) playVideo();
          }
          nextFrame();
        });
      }
      on('loadedmetadata', () => {
        if (!active()) return;
        if (current.videoWidth !== 1280 || current.videoHeight !== 720 ||
            !Number.isFinite(current.duration) || Math.abs(current.duration - frames / fps) > .002) { fail(); return; }
        metadata = true; current.playbackRate = speed;
        if (Math.abs(current.currentTime - time / 1000) > .00001) seekVideo(time);
        decoded();
      });
      on('seeked', () => { if (!active()) return; seekCompleted = true; decoded();
        if (!hasFrameCallback) update(current.currentTime); });
      on('loadeddata', decoded); on('canplay', decoded); on('error', fail);
      if (!hasFrameCallback) on('timeupdate', () => { decoded(); update(current.currentTime); });
      on('ended', () => { if (!active()) return; playing = false; time = duration; notify(); });
      cleanupVideo = () => {
        clearTimeout(timeout); if (!failed) settle(false);
        for (const [event, callback] of listeners) current.removeEventListener(event, callback);
        if (frameCallback !== null && typeof current.cancelVideoFrameCallback === 'function') current.cancelVideoFrameCallback(frameCallback);
        current.pause(); current.removeAttribute('src'); current.load(); current.remove();
      };
      timeout = setTimeout(fail, 15000);
      current.src = source; current.load(); nextFrame(); notify(); return transition;
    }
    const controller = {
      ready, ensureCode, ensureVideo, fit,
      play() { if (destroyed || error || document.hidden) return; if (time >= duration) seek(0); playing = true;
        if (mode === 'code') code?.play(); else playVideo(); notify(); },
      pause() { if (destroyed) return; playing = false; playGeneration++; code?.pause(); video?.pause(); notify(); },
      restart(shouldPlay = true) { if (destroyed) return; this.pause(); seek(0); if (shouldPlay) this.play(); },
      seek, seekElapsed:seek,
      setSpeed(value) { if (destroyed) return; if (!Number.isFinite(value)) throw new TypeError('速度必须是有限数字');
        speed = Math.max(.5, Math.min(2, value)); if (code) code.setSpeed(speed); if (video) video.playbackRate = speed; },
      setEase(value) { if (destroyed) return; const parameter = definition.parameters.ease;
        if (!parameter) ease = definition.default_ease;
        else if (parameter.options.includes(value)) ease = value;
        else throw new TypeError('不支持的速度变化');
        if (code) code.setEase(ease); else if (ease !== definition.default_ease) ensureCode(); },
      destroy(preserve = false) { if (destroyed) return; destroyed = true; playing = false; preparing = false; generation++;
        observer?.disconnect(); document.removeEventListener('visibilitychange', visibility); global.removeEventListener('pagehide', pagehide);
        if (code) { const previous = code; code = null; previous.pause(); previous.destroy(preserve); }
        stopCurrent(); if (mode === 'video') root.replaceChildren(); settleReady(false); },
      get currentTime() { return time; }, get elapsedTime() { return time; }, get paused() { return !playing; },
      get preparing() { return preparing; }, get error() { return error; }, get speed() { return speed; },
      get destroyed() { return destroyed; }, get previewMode() { return mode; },
      get stage() { return code?.stage || mount; }, get session() { return code?.session; },
      get frame() { return code?.frame ?? Math.min(frames - 1, Math.round(time * fps / 1000)); }
    };
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
    observer?.observe(root);
    const visibility = () => { if (document.hidden) controller.pause(); };
    const pagehide = () => controller.pause();
    document.addEventListener('visibilitychange', visibility); global.addEventListener('pagehide', pagehide);
    ensureVideo(); if (options.autoplay) controller.play(); return controller;
  }
  global.MotionLocalPreview = {create};
})(globalThis);
