/* 与画面共用事件时间；预生成声音在本地加载，用户点击只解锁播放。 */
(() => {
  'use strict';

  const KINDS = new Set(['typing', 'send', 'ripple', 'wind', 'flight', 'leafTouch', 'galaxy']);
  const DEFAULT_DURATION = {typing: 8, send: .18, ripple: 2.8 / 1.2, wind: 1.8, flight: 1.8, leafTouch: .95, galaxy: 8};
  const LEVELS = {typing: .35, send: .45, ripple: .075, wind: .022, flight: .1, leafTouch: .14, galaxy: .075};
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const finite = (value, fallback) => Number.isFinite(value) ? value : fallback;

  class StarLetterSound {
    constructor() {
      this.Context = globalThis.AudioContext || globalThis.webkitAudioContext;
      this.bank = globalThis.STAR_LETTER_AUDIO;
      this.samples = new Map((this.bank?.clips || []).map(clip => [clip.key, clip.pcm]));
      this.supported = typeof this.Context === 'function' && this.samples.size > 0;
      this.enabled = false;
      this.context = null;
      this.events = [];
      this.voices = new Set();
      this.buffers = new Map();
      this.anchor = null;
      this.frame = null;
      this.cursor = 0;
      this.requested = this.supported;
      this.toggleId = 0;
      this.destroyed = false;
      this.hasVoices = false;
      this.warmTimer = null;
      this.warmCache();
    }

    create() {
      const context = this.context = new this.Context({latencyHint: 'interactive'});
      this.master = context.createGain();
      this.master.gain.value = .6;
      this.limiter = context.createDynamicsCompressor();
      this.limiter.threshold.value = -14;
      this.limiter.knee.value = 12;
      this.limiter.ratio.value = 4;
      this.limiter.attack.value = .006;
      this.limiter.release.value = .18;
      this.master.connect(this.limiter);
      this.limiter.connect(context.destination);
    }

    async setEnabled(value) {
      const id = ++this.toggleId;
      this.requested = Boolean(value) && this.supported && !this.destroyed;
      if (!this.requested) {
        this.enabled = false;
        this.invalidate();
        this.suspendWhenIdle();
        return false;
      }
      try {
        if (!this.context) this.create();
        // 页面先尝试默认开启；若浏览器限制自动播放，首次交互再直接调用解锁。
        await this.context.resume();
        this.warmCache();
        if (id !== this.toggleId || this.destroyed) {
          this.suspendWhenIdle();
          return this.enabled;
        }
        this.enabled = this.requested && this.context.state === 'running';
        this.invalidate();
        if (this.enabled && this.frame) this.sync(this.frame);
        return this.enabled;
      } catch (_) {
        if (id === this.toggleId) {
          this.enabled = false;
          // 未获播放许可时保留开关意愿，交互后可重试；主动关闭才设为 false。
          this.invalidate();
          this.suspendWhenIdle();
        }
        return this.enabled;
      }
    }

    setEvents(events) {
      this.events = (Array.isArray(events) ? events : [])
        .filter(event => event && KINDS.has(event.kind) && Number.isFinite(event.time) && event.time >= 0)
        .map(event => ({
          time: event.time,
          kind: event.kind,
          duration: clamp(finite(event.duration, DEFAULT_DURATION[event.kind]), .055, 8),
          gain: clamp(finite(event.gain, 1), 0, 2),
          pan: clamp(finite(event.pan, 0), -1, 1),
          panTo: clamp(finite(event.panTo, finite(event.pan, 0)), -1, 1),
          pitch: Math.round(clamp(finite(event.pitch, 0), -24, 24) * 2) / 2
        }))
        .sort((a, b) => a.time - b.time);
      // 换配色、重播或改文案时，上一组已排程的声音随即退出。
      this.invalidate();
      this.warmCache();
    }

    suspendWhenIdle() {
      if (!this.requested && this.context && !this.voices.size && this.context.state === 'running') {
        Promise.resolve(this.context.suspend()).catch(() => {});
      }
    }

    invalidate() {
      const context = this.context;
      if (context && this.hasVoices) {
        const now = context.currentTime;
        for (const voice of this.voices) {
          if (voice.stopped) continue;
          voice.stopped = true;
          // 十二毫秒收声，避免暂停和拖动时出现咔嗒声。
          voice.gain.gain.cancelScheduledValues(now);
          voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
          voice.gain.gain.linearRampToValueAtTime(0, now + .012);
          try { voice.source.stop(now + .014); } catch (_) { /* 声源已结束。 */ }
        }
      }
      this.hasVoices = false;
      this.anchor = null;
      this.cursor = 0;
    }

    bufferKey(event, rate) {
      return `${event.kind}:${event.pitch}:${rate}`;
    }

    loadBuffer(key) {
      if (this.buffers.has(key)) return this.buffers.get(key);
      const encoded = this.samples.get(key);
      if (!encoded) return null;
      const bytes = atob(encoded), length = bytes.length / 2;
      // 创建无输出的声音缓存不需要开启音频设备；早到的点击也只需一次轻量解码。
      const buffer = typeof globalThis.AudioBuffer === 'function'
        ? new globalThis.AudioBuffer({numberOfChannels: 1, length, sampleRate: this.bank.sampleRate})
        : this.context?.createBuffer(1, length, this.bank.sampleRate);
      if (!buffer) return null;
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        let sample = bytes.charCodeAt(i * 2) | bytes.charCodeAt(i * 2 + 1) << 8;
        if (sample >= 32768) sample -= 65536;
        data[i] = sample / 32768;
      }
      this.buffers.set(key, buffer);
      return buffer;
    }

    bufferFor(event, rate) {
      return this.loadBuffer(this.bufferKey(event, rate));
    }

    warmCache() {
      if (this.warmTimer !== null || this.destroyed || !this.supported) return;
      if (typeof globalThis.AudioBuffer !== 'function' && !this.context) return;
      const queue = [...this.samples.keys()].filter(key => !this.buffers.has(key));
      if (!queue.length) return;
      const step = () => {
        this.warmTimer = null;
        if (this.destroyed) return;
        const key = queue.shift();
        try { this.loadBuffer(key); } catch (_) { return; }
        if (queue.length) this.warmTimer = setTimeout(step, 0);
      };
      // 分帧展开预生成的声音数据，不在点击时合成波形。
      this.warmTimer = setTimeout(step, 0);
    }

    schedule(event, when, rate, offset = 0) {
      if (event.gain <= 0 || this.voices.size >= 14) return;
      const buffer = this.bufferFor(event, rate);
      if (!buffer) return;
      const activeDuration = Math.min(buffer.duration, event.duration / rate);
      const remaining = activeDuration - offset;
      if (remaining <= .025) return;
      const context = this.context;
      const source = context.createBufferSource();
      source.buffer = buffer;
      const gain = context.createGain();
      const level = LEVELS[event.kind] * event.gain;
      gain.gain.value = offset > 0 ? 0 : level;
      if (offset > 0) {
        gain.gain.setValueAtTime(0, when);
        gain.gain.linearRampToValueAtTime(level, when + .012);
      }
      const pan = typeof context.createStereoPanner === 'function' ? context.createStereoPanner() : null;
      source.connect(gain);
      if (pan) {
        const from = clamp(event.pan, -.85, .85), to = clamp(event.panTo, -.85, .85);
        pan.pan.setValueAtTime(from + (to - from) * offset / activeDuration, when);
        if (from !== to) pan.pan.linearRampToValueAtTime(to, when + remaining);
        gain.connect(pan);
        pan.connect(this.master);
      } else gain.connect(this.master);
      const voice = {source, gain, pan, stopped: false};
      this.voices.add(voice);
      this.hasVoices = true;
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
        if (pan) pan.disconnect();
        this.voices.delete(voice);
        if (!this.voices.size) this.hasVoices = false;
        this.suspendWhenIdle();
      };
      // 末段星河声可能被时间线截短，单独收尾避免突然切断。
      const fade = Math.min((event.kind === 'send' ? .018 : event.kind === 'typing' ? .05 : .3) / rate, remaining * .4);
      gain.gain.setValueAtTime(level, when + remaining - fade);
      gain.gain.linearRampToValueAtTime(0, when + remaining);
      source.start(when, offset, remaining);
    }

    sync(frame) {
      const time = Math.max(0, finite(frame?.time, 0));
      const rate = clamp(finite(frame?.rate, 1), .25, 4);
      const playing = Boolean(frame?.playing);
      this.frame = {time, rate, playing};

      if (!this.enabled || !this.context || this.destroyed) return;
      if (!playing || this.context.state !== 'running') {
        if (this.anchor || this.hasVoices) this.invalidate();
        return;
      }
      const now = this.context.currentTime;
      if (this.anchor) {
        const expected = this.anchor.time + (now - this.anchor.clock) * this.anchor.rate;
        if (rate !== this.anchor.rate || time < this.anchor.lastTime - .002 || Math.abs(time - expected) > .09 * rate) this.invalidate();
      }
      if (!this.anchor) {
        this.anchor = {time, clock: now, rate, lastTime: time};
        // 跳转后直接从新位置开始，不补播被越过的音效。
        let low = 0, high = this.events.length;
        while (low < high) {
          const middle = (low + high) >>> 1;
          if (this.events[middle].time < time - .000001) low = middle + 1;
          else high = middle;
        }
        this.cursor = low;
        // 暂停后续播或拖到中段，仅续上此刻尚未结束的长音。
        // 连续键盘声从对应位置续上；水面、飞行和星河也恢复当时的左右位置。
        for (let i = low - 1; i >= 0; i--) {
          const event = this.events[i];
          if (event.time < time - 8) break;
          if (event.time + event.duration - time <= .04 * rate) continue;
          this.schedule(event, now + .004, rate, (time - event.time) / rate);
        }
      }
      this.anchor.lastTime = time;
      // 90 毫秒前瞻，由画面自己的逐帧循环推动，没有常驻计时器。
      while (this.cursor < this.events.length && this.events[this.cursor].time <= time + .09 * rate) {
        const event = this.events[this.cursor++];
        if (event.time < time - .045 * rate) continue;
        this.schedule(event, Math.max(now + .004, now + (event.time - time) / rate), rate);
      }
    }

    destroy() {
      this.destroyed = true;
      this.requested = false;
      this.enabled = false;
      ++this.toggleId;
      this.invalidate();
      clearTimeout(this.warmTimer);
      this.warmTimer = null;
      for (const voice of this.voices) {
        voice.source.onended = null;
        try { voice.source.stop(); } catch (_) { /* 声源已结束。 */ }
        voice.source.disconnect();
        voice.gain.disconnect();
        if (voice.pan) voice.pan.disconnect();
      }
      this.voices.clear();
      this.buffers.clear();
      this.events = [];
      this.samples.clear();
      this.bank = null;
      this.frame = null;
      if (this.master) this.master.disconnect();
      if (this.limiter) this.limiter.disconnect();
      if (this.context && this.context.state !== 'closed') Promise.resolve(this.context.close()).catch(() => {});
    }
  }

  globalThis.StarLetterSound = StarLetterSound;
})();
