/* Local recorded foley, driven by the same animation clock as the picture. */
(function (root) {
  'use strict';
  const MASTER_GAIN = .72;
  const MACHINE_GAIN = .45;
  function cuesAt(time, timeline) {
    const safeTime = Math.max(0, time);
    const round = Math.floor(safeTime / 8), phase = safeTime - round * 8;
    const recipe = timeline.recipes[timeline.mod(round, timeline.recipes.length)];
    const cues = [];
    const add = (type, clip, start, duration, gain, pitch = 1) => {
      if (phase >= start && phase < start + duration) cues.push({
        key: `${round}:${type}:${start}`, type, clip, start: round * 8 + start, duration,
        gain: gain * (type === 'meow' || type === 'angry' ? 1 : MACHINE_GAIN), pitch
      });
    };
    add('grind', 'grind', .98, 1.42, .28);
    add('latch', 'latch', 3.08, .27, .22);
    add('latch', 'latch', 5.8, .27, .16);
    if (recipe.malfunction) {
      // A failed attempt is a quiet mechanical click, with no liquid or steam.
      add('fault', 'latch', 3.4, .27, .18);
      add('fault', 'latch', 4.25, .27, .14);
    } else {
      // The real brewing recording already contains the pump and flowing liquid.
      add('pump', 'brew', 3.35, 1.2, .24);
      add('steam', 'steam', 4.2, 1, .23);
    }
    if (recipe.kind === 'xiaokui') {
      const voice = timeline.xiaokuiVoice;
      add('angry', voice.clip, voice.start, voice.duration, voice.gain, voice.pitch);
    }
    else {
      const voice = timeline.voiceFor(recipe);
      if (voice) add('meow', voice.clip, voice.start, voice.duration, voice.gain, voice.pitch);
    }
    // One recorded scatter for each batch, timed to the first bean landing.
    if (!timeline.manualBeans && round === 0) add('bean', 'beans', .68, .42, .18);
    if (!timeline.manualBeans) add('bean', 'beans', 5.88, .42, .18);
    add('land', 'land', timeline.collectAt === undefined ? 7.27 : timeline.collectAt, .18, .18);
    return cues;
  }
  function decodeClip(clip, decodeBase64) {
    if (!clip || !Number.isInteger(clip.rate) || clip.rate < 8000 ||
        !Number.isInteger(clip.frames) || clip.frames <= 0) throw new Error('Invalid audio clip');
    const bytes = decodeBase64(clip.data);
    if (bytes.length !== clip.frames * 2) throw new Error('Incomplete audio clip');
    const data = new Float32Array(clip.frames);
    for (let i = 0; i < data.length; i++) {
      const value = bytes.charCodeAt(i * 2) | (bytes.charCodeAt(i * 2 + 1) << 8);
      data[i] = (value >= 32768 ? value - 65536 : value) / 32768;
    }
    return data;
  }
  function create(timeline, host = root) {
    let context, master, enabled = false, lastTime = null, lastClock = null, lastRate = 1;
    const voices = new Map(), buffers = new Map();
    function stopVoice(voice) {
      if (!voice.ended) { try { voice.source.stop(); } catch (_) {} }
      voice.source.disconnect(); voice.gain.disconnect();
    }
    function reset() {
      for (const voice of voices.values()) stopVoice(voice);
      voices.clear(); lastTime = lastClock = null;
    }
    async function setEnabled(value) {
      enabled = !!value; reset();
      if (!enabled) return false;
      const Audio = host.AudioContext || host.webkitAudioContext;
      const library = host.FactoryAudioClips;
      if (!Audio || !library || typeof host.atob !== 'function') { enabled = false; return false; }
      try {
        const required = new Set([timeline.xiaokuiVoice.clip, 'grind', 'brew', 'steam', 'beans', 'latch', 'land']);
        for (const recipe of timeline.recipes) {
          const voice = timeline.voiceFor(recipe);
          if (voice) required.add(voice.clip);
        }
        for (const name of required) if (!Object.prototype.hasOwnProperty.call(library, name)) throw new Error('Missing audio clip');
        if (!context) {
          context = new Audio(); master = context.createGain();
          master.gain.value = MASTER_GAIN; master.connect(context.destination);
        }
        // Clips are embedded PCM. file:// playback needs neither fetch nor a server.
        for (const name of Object.keys(library)) {
          if (buffers.has(name)) continue;
          const clip = library[name], data = decodeClip(clip, text => host.atob(text));
          const buffer = context.createBuffer(1, data.length, clip.rate);
          buffer.getChannelData(0).set(data); buffers.set(name, buffer);
        }
        await context.resume();
        if (context.state !== 'running') enabled = false;
      } catch (_) { enabled = false; }
      return enabled;
    }
    function sync(time, playing, rate = 1) {
      if (!enabled || !context || context.state !== 'running' || !playing) { reset(); return; }
      const clock = context.currentTime;
      if (lastTime !== null && (rate !== lastRate || Math.abs(time - lastTime - (clock - lastClock) * rate) > .12)) reset();
      lastTime = time; lastClock = clock; lastRate = rate;
      const cues = cuesAt(time, timeline), keys = new Set(cues.map(cue => cue.key));
      for (const [key, voice] of voices) if (!keys.has(key)) { stopVoice(voice); voices.delete(key); }
      for (const cue of cues) {
        if (voices.has(cue.key)) continue;
        const buffer = buffers.get(cue.clip);
        if (!buffer) { enabled = false; reset(); return; }
        // start() offsets/durations use original sample seconds; scene playback
        // speed and the cat's fixed pitch both affect wall-clock playback speed.
        const pitch = cue.pitch, offset = Math.max(0, time - cue.start) * pitch;
        const remaining = Math.min(cue.duration * pitch, buffer.duration) - offset;
        if (remaining <= 0) continue;
        const source = context.createBufferSource(), gain = context.createGain();
        source.buffer = buffer; source.playbackRate.value = rate * pitch;
        const wallDuration = remaining / (rate * pitch);
        gain.gain.setValueAtTime(0, clock);
        gain.gain.linearRampToValueAtTime(cue.gain, clock + Math.min(.008, wallDuration / 3));
        gain.gain.setValueAtTime(cue.gain, clock + Math.max(wallDuration / 3, wallDuration - .012));
        gain.gain.linearRampToValueAtTime(0, clock + wallDuration);
        source.connect(gain); gain.connect(master);
        const voice = { source, gain, ended: false };
        source.onended = () => { voice.ended = true; source.disconnect(); gain.disconnect(); };
        voices.set(cue.key, voice);
        source.start(clock, offset, remaining);
      }
    }
    return { setEnabled, sync, reset, get enabled() { return enabled; } };
  }
  const api = { cuesAt, decodeClip, create, MASTER_GAIN };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FactorySound = api;
})(typeof window !== 'undefined' ? window : globalThis);
