// JRPG Piano — Joth，CC0。只播放原曲，不再叠加合成音效。
// 内存解码不发起请求；音量固定，画面只有开启／关闭两个图标状态。
(() => {
  const button = document.getElementById('sound-toggle');
  if (!button) return;
  const score = globalThis.cityScore;
  const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
  let context = null;
  let master = null;
  let buffer = null;
  let source = null;
  const sources = new Set();
  let enabled = false;
  let wanted = false;
  let revision = 0;
  let session = 0;
  let startedAt = null;
  let suspendTimer = null;
  let preparation = null;

  function updateButton(message) {
    const label = message || (wanted ? '关闭配乐' : '开启配乐');
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', label);
    button.setAttribute('title', label);
  }

  function smoothGain(value) {
    if (!context || !master || context.state === 'closed') return;
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.setTargetAtTime(value, now, 0.035);
  }

  function clearSources() {
    sources.forEach(node => {
      node.onended = null;
      try { node.stop(); } catch (error) { /* 已停止。 */ }
      node.disconnect();
    });
    sources.clear();
    source = null;
  }

  function initialize() {
    if (context && context.state !== 'closed') return;
    context = new AudioContext();
    buffer = null;
    preparation = null;
    master = context.createGain();
    master.gain.value = 0;
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 3;
    limiter.ratio.value = 4;
    limiter.attack.value = 0.01;
    limiter.release.value = 0.25;
    master.connect(limiter);
    limiter.connect(context.destination);
  }

  function prepare(activeContext) {
    if (buffer) return Promise.resolve(buffer);
    if (preparation) return preparation;
    const track = globalThis.cityMusicTrack;
    if (!score || !track || !track.base64 || Math.abs(track.duration - score.duration) > 0.0001) {
      return Promise.reject(new Error('配乐资源缺失或时长不一致'));
    }
    const binary = atob(track.base64);
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    preparation = activeContext.decodeAudioData(bytes.buffer).then(decoded => {
      if (!Number.isFinite(decoded.duration) || decoded.duration < score.duration - 0.0001 ||
          decoded.duration > score.duration + 0.1) throw new Error('配乐长度不正确');
      if (context === activeContext) buffer = decoded;
      return decoded;
    });
    return preparation;
  }

  function transport() {
    if (!enabled || document.hidden || !context || context.state !== 'running' || startedAt === null) return null;
    let audibleTime = context.currentTime;
    const stamp = context.getOutputTimestamp ? context.getOutputTimestamp() : null;
    if (stamp && stamp.contextTime > 0 && stamp.performanceTime > 0 && globalThis.performance) {
      const estimate = stamp.contextTime + (performance.now() - stamp.performanceTime) / 1000;
      if (Number.isFinite(estimate)) audibleTime = Math.max(context.currentTime - 0.5, Math.min(context.currentTime, estimate));
    }
    return { session, time: audibleTime - startedAt, duration: buffer.duration };
  }

  async function setEnabled(value) {
    wanted = value;
    const ticket = ++revision;
    clearTimeout(suspendTimer);
    if (!value) {
      enabled = false;
      startedAt = null;
      smoothGain(0);
      if (source) {
        try { source.stop(context.currentTime + 0.22); } catch (error) { /* 已停止。 */ }
        source = null;
      }
      updateButton();
      suspendTimer = setTimeout(() => {
        if (ticket !== revision || wanted || !context) return;
        clearSources();
        context.suspend().catch(() => {});
      }, 220);
      return;
    }
    updateButton();
    try {
      initialize();
      const activeContext = context;
      await activeContext.resume();
      if (ticket !== revision || !wanted || document.hidden) {
        if (!wanted) activeContext.suspend().catch(() => {});
        return;
      }
      const prepared = await prepare(activeContext);
      if (ticket !== revision || !wanted || document.hidden || context !== activeContext) return;
      if (context.state !== 'running') throw new Error('声音尚未启动');
      clearSources();
      startedAt = context.currentTime + 0.12;
      session++;
      source = context.createBufferSource();
      source.buffer = prepared;
      source.loop = true;
      source.loopStart = 0;
      source.loopEnd = prepared.duration;
      source.connect(master);
      sources.add(source);
      const activeSource = source;
      source.onended = () => { activeSource.disconnect(); sources.delete(activeSource); };
      source.start(startedAt);
      enabled = true;
      smoothGain(0.5);
      updateButton();
    } catch (error) {
      if (ticket !== revision) return;
      wanted = enabled = false;
      startedAt = null;
      clearSources();
      if (context) context.close().catch(() => {});
      context = null;
      buffer = preparation = null;
      updateButton('配乐未能播放，点击重试');
    }
  }

  globalThis.cityAudio = { transport, windowLight() {}, meteor() {} };
  if (!AudioContext) {
    button.disabled = true;
    updateButton('当前浏览器不支持声音');
    return;
  }
  button.addEventListener('click', event => { event.stopPropagation(); void setEnabled(!wanted); });
  ['mousedown', 'touchstart', 'pointerdown'].forEach(name => {
    button.addEventListener(name, event => event.stopPropagation(), { passive: true });
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) void setEnabled(false);
  });
  globalThis.addEventListener('pagehide', () => {
    revision++;
    enabled = wanted = false;
    startedAt = null;
    clearTimeout(suspendTimer);
    clearSources();
    if (context) context.close().catch(() => {});
    context = null;
    buffer = preparation = null;
    updateButton();
  });
})();
