(() => {
  'use strict';

  const scene = window.EncoreScene;
  const duration = Number(scene.duration);
  if (!(duration > 0 && Number.isFinite(duration))) throw new Error('动画时长无效');
  const byId = id => document.getElementById(id);
  const audio = byId('bgm');
  const controls = byId('play-controls');
  const toggle = byId('play-toggle');
  const progress = byId('play-progress');
  const restart = byId('play-restart');
  const speed = byId('play-speed');
  const sound = byId('play-sound');
  const output = byId('play-time');
  const rates = [.5, 1, 1.5, 2, 3];
  const clamp = value => Math.max(0, Math.min(duration, value));
  const query = new URLSearchParams(location.search);
  const initialTime = Number(query.get('t'));
  const startsAtTime = query.has('t') && Number.isFinite(initialTime);
  let time = startsAtTime ? clamp(initialTime) : 0;
  let paused = startsAtTime || matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rate = 1;
  let soundEnabled = query.get('mute') !== '1';
  let soundBlocked = false;
  let dragging = false;
  let pageAway = false;
  let lastTick = null;
  let lastUI = '';
  let playRequest = null;
  let audioRevision = 0;
  const running = () => !paused && !dragging && !document.hidden && !pageAway && time < duration;
  const wantsAudio = () => soundEnabled && running();

  function stopAudio() {
    // 失效请求不能在用户暂停、拖动或切到后台之后重新开启声音。
    audioRevision++;
    playRequest = null;
    audio.muted = true;
    audio.pause();
  }

  function alignAudio(force) {
    audio.playbackRate = rate;
    audio.defaultPlaybackRate = rate;
    if (force || Math.abs(audio.currentTime - time) > .09) {
      try { audio.currentTime = time; } catch (_) { /* 元数据就绪后重试定位。 */ }
    }
  }

  function syncAudio(force = false) {
    if (!wantsAudio()) {
      if (!audio.paused || playRequest || !audio.muted) stopAudio();
      alignAudio(force);
      return;
    }
    alignAudio(force);
    audio.muted = false;
    if (playRequest || !audio.paused) return;
    const request = { revision: audioRevision };
    playRequest = request;
    let attempt;
    try { attempt = audio.play(); } catch (error) { attempt = Promise.reject(error); }
    Promise.resolve(attempt).then(() => {
      if (playRequest !== request) return;
      playRequest = null;
      if (request.revision !== audioRevision || !wantsAudio()) stopAudio();
    }).catch(() => {
      if (playRequest !== request) return;
      playRequest = null;
      if (request.revision !== audioRevision || !wantsAudio()) return;
      soundEnabled = false;
      soundBlocked = true;
      stopAudio();
      updateUI(true);
    });
  }

  function clockText(value) {
    const seconds = Math.max(0, Math.floor(value + 1e-6));
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }

  function updateUI(force = false) {
    const key = [Math.floor(time * 20), paused, rate, soundEnabled, soundBlocked, dragging].join(':');
    if (!force && key === lastUI) return;
    lastUI = key;
    progress.value = String(time);
    progress.style.setProperty('--progress', `${time / duration * 100}%`);
    progress.setAttribute('aria-valuetext', `${clockText(time / rate)}，共 ${clockText(duration / rate)}`);
    toggle.textContent = paused ? '播放' : '暂停';
    toggle.setAttribute('aria-label', paused ? '播放动画' : '暂停动画');
    speed.textContent = `${rate}×`;
    speed.setAttribute('aria-label', `播放速度 ${rate} 倍，点击切换`);
    sound.textContent = soundEnabled ? '声音开' : '声音关';
    sound.setAttribute('aria-pressed', String(soundEnabled));
    sound.setAttribute('aria-label', soundEnabled ? '关闭声音' : '开启声音');
    sound.title = soundBlocked ? '浏览器未允许自动播放，点击开启声音' : soundEnabled ? '关闭配乐' : '开启配乐';
    output.textContent = `${clockText(time / rate)} / ${clockText(duration / rate)}`;
  }

  function update(forceAudio = false) {
    scene.render(time);
    updateUI(true);
    syncAudio(forceAudio);
  }

  function seek(value) {
    value = Number(value);
    if (!Number.isFinite(value)) return;
    stopAudio();
    time = clamp(value);
    if (time === duration && !dragging) paused = true;
    lastTick = null;
    update(true);
  }

  function setPaused(value) {
    paused = value;
    if (!paused && time >= duration) time = 0;
    lastTick = null;
    stopAudio();
    update(true);
  }

  toggle.addEventListener('click', () => setPaused(!paused));
  restart.addEventListener('click', () => {
    time = 0;
    dragging = false;
    setPaused(false);
  });
  speed.addEventListener('click', () => {
    rate = rates[(rates.indexOf(rate) + 1) % rates.length];
    lastTick = null;
    stopAudio();
    update(true);
  });
  sound.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundBlocked = false;
    stopAudio();
    update(true);
  });

  function beginDrag() {
    dragging = true;
    lastTick = null;
    stopAudio();
    controls.classList.remove('is-hidden');
  }

  function finishDrag() {
    if (!dragging) return;
    dragging = false;
    if (time === duration) paused = true;
    lastTick = null;
    update(true);
  }

  progress.addEventListener('pointerdown', beginDrag);
  progress.addEventListener('input', () => seek(progress.value));
  for (const event of ['pointerup', 'pointercancel', 'blur']) window.addEventListener(event, finishDrag);
  progress.addEventListener('change', finishDrag);
  progress.addEventListener('blur', finishDrag);

  const isInteractive = target => target instanceof Element && !!target.closest('button,input,select,textarea,a,[contenteditable="true"]');
  document.addEventListener('keydown', event => {
    if (isInteractive(event.target)) return;
    if (event.code === 'Space' && !event.repeat) {
      event.preventDefault();
      setPaused(!paused);
    } else if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
      event.preventDefault();
      paused = true;
      seek(time + (event.code === 'ArrowRight' ? 1 : -1) / 60);
    }
  });

  document.addEventListener('visibilitychange', () => {
    lastTick = null;
    stopAudio();
    syncAudio(true);
  });
  window.addEventListener('pagehide', () => {
    pageAway = true;
    lastTick = null;
    stopAudio();
  });
  window.addEventListener('pageshow', () => {
    pageAway = false;
    lastTick = null;
    syncAudio(true);
  });
  audio.addEventListener('loadedmetadata', () => syncAudio(true));

  function resize() {
    scene.resize();
    scene.render(time);
  }
  window.addEventListener('resize', resize);
  const reveal = () => controls.classList.remove('is-hidden');
  controls.addEventListener('focusin', reveal);
  window.addEventListener('pointerdown', reveal, { passive: true });
  window.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const bounds = controls.getBoundingClientRect();
    const near = event.clientX >= bounds.left - 20 && event.clientX <= bounds.right + 20 && event.clientY >= bounds.top - 24;
    controls.classList.toggle('is-hidden', !(near || dragging || controls.contains(document.activeElement)));
  }, { passive: true });

  function tick(now) {
    if (lastTick !== null && running()) {
      time = Math.min(duration, time + Math.max(0, now - lastTick) / 1000 * rate);
      if (time >= duration) paused = true;
    }
    lastTick = now;
    scene.render(time);
    updateUI();
    syncAudio();
    requestAnimationFrame(tick);
  }

  progress.max = String(duration);
  window.EncorePlayer = Object.freeze({
    seek,
    getState: () => ({ time, duration, rate, paused, dragging, hidden: document.hidden || pageAway,
      soundEnabled, soundBlocked, ended: time >= duration, playing: running() })
  });
  resize();
  updateUI(true);
  syncAudio(true);
  requestAnimationFrame(tick);
})();
