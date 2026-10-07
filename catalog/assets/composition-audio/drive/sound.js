'use strict';

// 行驶、风和松绳掠风在本地合成；猫叫播放本地保存的真实录音。
// 气球没有爆开，因此这里没有爆破声。只有主动打开声音时才创建音频设备。
const DRIVING_AUDIO_LEVELS = Object.freeze({master: .65, engine: .064, harmonic: .016, wind: .105, release: .037, meow: .3});

function createDrivingNoise(sampleRate) {
  const data = new Float32Array(Math.ceil(sampleRate * 4));
  let seed = 41827, low = 0;
  for (let i = 0; i < data.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    low += .026 * (seed / 4294967296 * 2 - 1 - low);
    data[i] = low * 2.5;
  }
  // 接回开头前缓慢衔接，避免循环交界产生一下杂音。
  const overlap = Math.round(sampleRate * .16);
  for (let i = 0; i < overlap; i++) {
    const u = i / (overlap - 1), weight = u * u * (3 - 2 * u);
    const at = data.length - overlap + i;
    data[at] = data[at] * (1 - weight) + data[i] * weight;
  }
  return {data, loopStart: overlap / sampleRate};
}

function createReleaseSamples(sampleRate, variant) {
  const duration = .43 + variant * .022;
  const data = new Float32Array(Math.ceil(duration * sampleRate));
  let seed = 7867 + variant * 131, low = 0, lower = 0, peak = 0;
  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 4294967296 * 2 - 1;
    low += (1 - Math.exp(-2 * Math.PI * 1450 / sampleRate)) * (noise - low);
    lower += (1 - Math.exp(-2 * Math.PI * 230 / sampleRate)) * (low - lower);
    const air = Math.sin(Math.PI * Math.min(1, t / duration)) ** 2;
    const rope = (1 - Math.exp(-t / .011)) * Math.exp(-t / .045);
    const tail = Math.min(1, (duration - t) / .035);
    data[i] = ((low - lower) * (.55 * air + .7 * rope) + lower * .17 * air) * tail;
    peak = Math.max(peak, Math.abs(data[i]));
  }
  if (peak) for (let i = 0; i < data.length; i++) data[i] *= .72 / peak;
  return data;
}

// 只还原录音采样，不合成音高；由音频设备按素材采样率播放。
function decodeMeowRecording(clip = XIAOKUI_MEOW) {
  const bytes = atob(clip.data);
  if(bytes.length !== clip.frames*2)throw new Error('猫叫录音不完整');
  const data = new Float32Array(clip.frames);
  for(let i=0;i<data.length;i++){
    const value=bytes.charCodeAt(i*2)|(bytes.charCodeAt(i*2+1)<<8);
    data[i]=(value>=32768?value-65536:value)/32768;
  }
  return data;
}

class DrivingSound {
  constructor(events = []) {
    this.events = events.filter(event => Number.isFinite(event.time) && event.time >= 0)
      .map(event => ({time: event.time, type: event.type === 'meow' ? 'meow' : 'release',
        duration: event.duration || XIAOKUI_MEOW.frames/XIAOKUI_MEOW.rate, index: event.index || 0, x: Math.max(-1, Math.min(1, Number(event.x) || 0))}))
      .sort((a, b) => a.time - b.time);
    this.context = null;
    this.enabled = false;
    this.voices = new Set();
    this.frame = null;
    this.anchor = null;
    this.cursor = 0;
    this.lastMix = -Infinity;
    this.silent = true;
    this.revision = 0;
    this.suspendTimer = null;
    this.resumePromise = null;
    this.starting = false;
  }

  create() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('当前浏览器不支持场景音效');
    const c = this.context = new AudioContext();
    this.master = c.createGain();this.master.gain.value = 0;
    this.limiter = c.createDynamicsCompressor();
    this.limiter.threshold.value = -9;this.limiter.knee.value = 6;
    this.limiter.ratio.value = 10;this.limiter.attack.value = .006;this.limiter.release.value = .16;
    this.master.connect(this.limiter);this.limiter.connect(c.destination);

    const carFilter = c.createBiquadFilter();
    carFilter.type = 'lowpass';carFilter.frequency.value = 260;carFilter.Q.value = .5;
    const carPan = this.carPan = c.createStereoPanner();carPan.pan.value = .08;
    carFilter.connect(carPan);carPan.connect(this.master);
    const tone = (frequency, type) => {
      const source = c.createOscillator(), gain = c.createGain();
      source.frequency.value = frequency;source.type = type;gain.gain.value = 0;
      source.connect(gain);gain.connect(carFilter);source.start();
      return {source, gain};
    };
    this.engine = tone(76, 'triangle');
    this.harmonic = tone(152, 'sine');

    const noise = createDrivingNoise(c.sampleRate);
    const buffer = c.createBuffer(1, noise.data.length, c.sampleRate);
    buffer.copyToChannel(noise.data, 0);
    this.windSource = c.createBufferSource();this.windSource.buffer = buffer;
    this.windSource.loop = true;this.windSource.loopStart = noise.loopStart;
    this.windSource.loopEnd = buffer.duration;
    const windFilter = c.createBiquadFilter();windFilter.type = 'lowpass';
    windFilter.frequency.value = 780;windFilter.Q.value = .5;
    this.wind = c.createGain();this.wind.gain.value = 0;
    this.windSource.connect(windFilter);windFilter.connect(this.wind);this.wind.connect(this.master);
    this.windSource.start();
    this.buffers = Array.from({length: 4}, (_, i) => {
      const samples = createReleaseSamples(c.sampleRate, i);
      const result = c.createBuffer(1, samples.length, c.sampleRate);
      result.copyToChannel(samples, 0);return result;
    });
    const meow = decodeMeowRecording();
    this.meowBuffer = c.createBuffer(1, meow.length, XIAOKUI_MEOW.rate);
    this.meowBuffer.copyToChannel(meow, 0);
  }

  currentFrame() {return this.getFrame?.() || this.frame;}

  async resume() {
    if (!this.resumePromise) {
      this.resumePromise = this.context.resume().finally(() => {this.resumePromise = null;});
    }
    await this.resumePromise;
  }

  async setEnabled(enabled) {
    const revision = ++this.revision;
    this.enabled = Boolean(enabled);
    if (!this.enabled) {this.starting = false;this.silence();return;}
    this.starting = true;
    try {
      if (!this.context) this.create();
      clearTimeout(this.suspendTimer);this.suspendTimer = null;
      this.invalidate();
      // 在用户点击中解锁；等待期间可能发生暂停、拖动或关闭声音，所以随后读取最新画面。
      await this.resume();
      if (revision !== this.revision) {
        if (!this.enabled) this.silence();
        return;
      }
      this.starting = false;
      const frame = this.currentFrame();
      if (frame) this.update(frame);else this.silence();
    } catch (error) {
      if (revision === this.revision) {this.starting = false;this.fail(error);}
      throw error;
    } finally {
      if (revision === this.revision) this.starting = false;
    }
  }

  fail(error) {
    this.enabled = false;this.silence();this.onError?.(error);
  }

  set(parameter, value, smoothing = .035) {
    const now = this.context.currentTime;
    parameter.cancelScheduledValues(now);parameter.setTargetAtTime(value, now, smoothing);
  }

  invalidate() {
    if (this.context) {
      const now = this.context.currentTime;
      for (const voice of this.voices) {
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setTargetAtTime(0, now, .004);
        try {voice.source.stop(now + .02);} catch (_) { /* 声音已经结束 */ }
      }
    }
    this.anchor = null;this.lastMix = -Infinity;
  }

  silence() {
    this.silent = true;this.invalidate();
    if (!this.context) return;
    this.set(this.master.gain, 0, .009);
    clearTimeout(this.suspendTimer);
    this.suspendTimer = setTimeout(() => {
      this.suspendTimer = null;
      if (!this.silent) return;
      this.context.suspend().then(() => {
        // 处理挂起尚未完成、画面已经重新播放的情况。
        if (this.enabled && !this.silent) this.update(this.currentFrame());
      }).catch(error => {
        // 设备已关闭时不能再走 silence，否则会不断重新安排挂起。
        if (!this.enabled) return;
        this.enabled = false;this.onError?.(error);
      });
    }, 65);
  }

  schedule(event, when, rate) {
    // 即使一帧跨过很多事件，也不允许短音效无限叠加。
    if (this.voices.size >= 8) return;
    const c = this.context, source = c.createBufferSource(), gain = c.createGain();
    source.buffer = event.type === 'meow' ? this.meowBuffer : this.buffers[Math.abs(Math.round(event.index)) % this.buffers.length];
    source.playbackRate.value = rate;
    gain.gain.value = event.type === 'meow' ? DRIVING_AUDIO_LEVELS.meow : DRIVING_AUDIO_LEVELS.release;
    const pan = c.createStereoPanner();pan.pan.value = event.x * .75;
    source.connect(gain);gain.connect(pan);pan.connect(this.master);
    const voice = {source, gain, pan};this.voices.add(voice);
    source.onended = () => {
      source.disconnect();gain.disconnect();pan.disconnect();this.voices.delete(voice);
    };
    source.start(when);
  }

  update(frame) {
    if (!frame) return;
    this.frame = frame;
    if (!this.enabled || !this.context || this.starting) return;
    const {time, duration, rate, running} = frame;
    if (!running || !Number.isFinite(time) || !Number.isFinite(rate) || rate <= 0) {
      if (!this.silent || (this.context.state === 'running' && !this.suspendTimer)) this.silence();
      return;
    }
    clearTimeout(this.suspendTimer);this.suspendTimer = null;
    this.silent = false;
    if (this.context.state !== 'running') {
      if (!this.resumePromise) this.resume().then(() => {
        if (this.enabled) this.update(this.currentFrame());else this.silence();
      }).catch(error => this.fail(error));
      return;
    }
    const now = this.context.currentTime;
    if (this.anchor && (this.anchor.rate !== rate || time < this.anchor.lastTime
      || Math.abs(time - this.anchor.time - (now - this.anchor.clock) * rate) > .16 * rate)) this.invalidate();
    if (!this.anchor) {
      this.anchor = {time, clock: now, rate, lastTime: time};
      // 首次开启、恢复和拖动都从当前画面往后安排，不补播错过的松绳声。
      this.cursor = this.events.findIndex(event => event.time > time + .00001);
      if (this.cursor < 0) this.cursor = this.events.length;
    }
    this.anchor.lastTime = time;
    const horizon = Math.min(duration, time + .09 * rate);
    while (this.cursor < this.events.length && this.events[this.cursor].time <= horizon) {
      const event = this.events[this.cursor++];
      if (event.time < time - .025 * rate) continue;
      this.schedule(event, now + Math.max(0, (event.time - time) / rate), rate);
    }
    if (now - this.lastMix < .045) return;
    this.lastMix = now;
    const pitch = Math.sqrt(Math.max(.25, Math.min(4, rate)));
    const vehicleGain = Number.isFinite(frame.vehicleGain) ? Math.max(0, Math.min(1, frame.vehicleGain)) : 1;
    const vehiclePan = Number.isFinite(frame.vehiclePan) ? Math.max(-1, Math.min(1, frame.vehiclePan)) : .08;
    this.set(this.engine.source.frequency, 76 * pitch, .08);
    this.set(this.harmonic.source.frequency, 152 * pitch, .08);
    // 汽车驶出右侧时，发动机随位置远去，仍留下少量环境风声。
    this.set(this.engine.gain.gain, DRIVING_AUDIO_LEVELS.engine * vehicleGain, .07);
    this.set(this.harmonic.gain.gain, DRIVING_AUDIO_LEVELS.harmonic * vehicleGain, .07);
    this.set(this.carPan.pan, vehiclePan, .08);
    this.set(this.wind.gain, DRIVING_AUDIO_LEVELS.wind * (.93 + .07 * Math.sin(time * .8)) * (.3 + .7 * vehicleGain), .08);
    this.set(this.master.gain, DRIVING_AUDIO_LEVELS.master);
  }
}
