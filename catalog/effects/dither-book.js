/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
(function (global) {
  'use strict';
  const PAGE_COUNT = 6;
  const INTRO_END = 2640;
  const DURATION = 7600;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const wrap = index => ((index % PAGE_COUNT) + PAGE_COUNT) % PAGE_COUNT;
  const smooth = value => 1 - Math.pow(1 - clamp(value, 0, 1), 3);
  const introEvents = Array.from({length: 10}, (_, i) => ({
    start: 300 + i * 210, duration: i === 9 ? 450 : 140, direction: 1, fast: i < 9
  }));
  const demoEvents = introEvents.concat([
    {start: 3300, duration: 450, direction: 1},
    {start: 4300, duration: 450, direction: 1},
    {start: 5450, duration: 450, direction: -1},
    {start: 6450, duration: 450, direction: -1}
  ]);
  function sequenceAt(time, events) {
    let index = 0, flip = null;
    for (const event of events) {
      if (time < event.start) break;
      const fraction = clamp((time - event.start) / event.duration, 0, 1);
      if (fraction >= 1) index = wrap(index + event.direction);
      else {
        flip = {from: index, direction: event.direction, progress: event.fast ? fraction : smooth(fraction)};
        break;
      }
    }
    return {index, flip, entrance: smooth(time / 1200)};
  }
  const introAt = time => sequenceAt(clamp(time, 0, INTRO_END), introEvents);
  const demoAt = time => sequenceAt(clamp(time, 0, DURATION), demoEvents);
  const titles = ['月相', '山势', '叶脉', '拱廊', '水纹', '轨道'];
  let serial = 0;
  const STYLE = [
    '.wm-book{position:relative;display:grid;place-items:center;width:100%;height:100%;isolation:isolate;--book-pad:10px;--book-radius:20px;--book-crease:.11;--book-paper:var(--card,#ffffff);--book-art:var(--symbol,#eeeeee);--book-ink:var(--card-ink,#202020);--book-muted:var(--card-muted,#686868);color:var(--book-ink);font-family:inherit;font-weight:300}',
    '.wm-book,.wm-book *{box-sizing:border-box}',
    '.wm-book__scene{position:relative;width:min(76%,440px);aspect-ratio:16/10;perspective:2400px;perspective-origin:50% 40%;user-select:none}',
    '.wm-book__body{position:absolute;inset:0;transform-style:preserve-3d;transform:rotateX(6deg) rotateY(-4deg)}',
    '.wm-book__cover{position:absolute;inset:-3px;transform:translateZ(-6px);background:var(--flip-back,#d7d7d7);border:1px solid var(--card-edge);border-radius:7px;box-shadow:0 20px 38px -18px #0009,0 4px 12px #0003}',
    '.wm-book__edges{position:absolute;inset:0;transform:translate3d(0,3px,-3px);border-radius:5px;background:repeating-linear-gradient(to bottom,var(--card) 0 1px,var(--card-edge) 1px 2px);border:1px solid var(--card-edge)}',
    '.wm-book__base{position:absolute;top:0;width:50%;height:100%;padding:0;background:none;border:0;font:inherit;color:inherit;cursor:pointer;transform:translateZ(0px);appearance:none;text-align:inherit}',
    '.wm-book__base--left{left:0}.wm-book__base--right{left:50%}',
    '.wm-book__base:disabled{cursor:default}.wm-book__base:focus-visible{outline:2px solid var(--book-muted);outline-offset:6px}',
    '.wm-book__paper{position:absolute;inset:0;background:var(--book-paper);border:1px solid var(--card-edge);overflow:hidden;box-shadow:inset 0 0 16px #00000006;backface-visibility:hidden;-webkit-backface-visibility:hidden}',
    '.wm-book__paper[data-edge="left"]{border-radius:5px 0 0 5px}.wm-book__paper[data-edge="right"]{border-radius:0 5px 5px 0}',
    '.wm-book__art{position:absolute;inset:var(--book-pad);overflow:hidden;border-radius:var(--book-radius);background:var(--book-art);box-shadow:0 2px 12px #0000000f;pointer-events:none}',
    '.wm-book__art svg{display:block;width:100%;height:100%}',
    '.wm-book__caption{font-family:inherit;font-weight:300}',
    '.wm-book__number{font-family:Oswald,var(--font,"Source Han Sans SC","Source Han Sans CN","Noto Sans SC",sans-serif);font-weight:700;font-variant-numeric:tabular-nums}',
    '.wm-book__grain{position:absolute;inset:0;pointer-events:none;mix-blend-mode:multiply;opacity:.32;background-image:radial-gradient(#68686850 .45px,transparent .8px),radial-gradient(#ffffff90 .6px,transparent 1px);background-size:3px 3px,7px 5px;background-position:0 0,2px 1px}',
    '.wm-book__crease{position:absolute;top:0;bottom:0;width:19%;pointer-events:none}',
    '.wm-book__paper[data-edge="left"] .wm-book__crease{right:0;background:linear-gradient(to left,rgba(0,0,0,var(--book-crease)),rgba(0,0,0,calc(var(--book-crease)/4)) 34%,transparent)}',
    '.wm-book__paper[data-edge="right"] .wm-book__crease{left:0;background:linear-gradient(to right,rgba(0,0,0,var(--book-crease)),rgba(0,0,0,calc(var(--book-crease)/4)) 34%,transparent)}',
    '.wm-book__leaf{position:absolute;left:50%;top:0;width:50%;height:100%;transform-origin:0 50%;transform-style:preserve-3d;pointer-events:none;z-index:3}',
    '.wm-book__back{transform:rotateY(180deg)}',
    '.wm-book__shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(to right,#0002,#000c);opacity:0}',
    '.wm-book__back .wm-book__shade{background:linear-gradient(to left,#0002,#000c)}',
    '.wm-book__hint{position:absolute;inset:0;display:flex;align-items:center;padding:12px;opacity:0;background:#00000004;pointer-events:none;transition:opacity .15s;font-size:20px;color:var(--book-muted)}',
    '.wm-book__base--right .wm-book__hint{justify-content:flex-end}',
    '.wm-book__base:not(:disabled):hover .wm-book__hint,.wm-book__base:focus-visible .wm-book__hint{opacity:1}',
    '.wm-book__spine{position:absolute;left:calc(50% - 1px);top:0;bottom:0;width:2px;background:color-mix(in srgb,var(--card-edge) 45%,transparent);transform:translateZ(1px);pointer-events:none}',
    '.wm-book [data-composition-hidden]{visibility:hidden!important}',
    '.wm-book__illustration{position:relative;inset:auto;width:220px;height:275px;box-shadow:none}',
  ].join('\n');
  function art(index, prefix) {
    const dot = prefix + '-dot', fine = prefix + '-fine';
    const fill = 'url(#' + dot + ')', light = 'url(#' + fine + ')';
    const lines = [];
    let drawing = '';
    if (index === 0) {
      drawing = '<circle cx="122" cy="121" r="73" fill="' + fill + '"/><circle cx="158" cy="93" r="59" fill="var(--book-art)"/>';
      for (let i = 0; i < 14; i++) lines.push('<path d="M-10 ' + (221+i*4) + ' Q65 ' + (199+i*4) + ' 120 ' + (221+i*4) + ' T250 ' + (214+i*4) + '" fill="none" stroke="var(--book-ink)" stroke-width=".75"/>');
      drawing += lines.join('');
    } else if (index === 1) {
      drawing = '<path d="M-10 215L78 80L123 147L159 108L250 218V286H-10Z" fill="' + light + '"/>';
      for (let i = 0; i < 18; i++) lines.push('<path d="M-10 ' + (227+i*3) + 'L78 ' + (80+i*7) + 'L123 ' + (147+i*5) + 'L159 ' + (108+i*7) + 'L250 ' + (225+i*3) + '" fill="none" stroke="var(--book-ink)" stroke-width=".65"/>');
      drawing += lines.join('');
    } else if (index === 2) {
      drawing = '<path d="M113 267Q111 165 141 62" fill="none" stroke="var(--book-ink)" stroke-width="2"/>';
      for (let i = 0; i < 10; i++) {
        const y = 90+i*17, x = 135-i*2, reach = 22+i*2;
        lines.push('<path d="M' + x + ' ' + y + 'Q' + (x-reach-17) + ' ' + (y-32) + ' ' + (x-reach) + ' ' + (y+8) + 'Q' + (x-9) + ' ' + (y+11) + ' ' + x + ' ' + y + 'Z" fill="' + fill + '" stroke="var(--book-muted)" stroke-width=".5"/>');
        lines.push('<path d="M' + x + ' ' + (y+8) + 'Q' + (x+reach+17) + ' ' + (y-21) + ' ' + (x+reach) + ' ' + (y+17) + 'Q' + (x+9) + ' ' + (y+21) + ' ' + x + ' ' + (y+8) + 'Z" fill="' + light + '" stroke="var(--book-muted)" stroke-width=".5"/>');
      }
      drawing += lines.join('');
    } else if (index === 3) {
      drawing = '<path d="M32 270V132A88 88 0 0 1 208 132V270Z" fill="' + fill + '"/><path d="M64 270V134A56 56 0 0 1 176 134V270Z" fill="var(--book-art)"/>';
      for (let i = 0; i < 10; i++) lines.push('<path d="M' + (35+i*3) + ' 270V134A' + (85-i*3) + ' ' + (85-i*3) + ' 0 0 1 ' + (205-i*3) + ' 134V270" fill="none" stroke="var(--book-ink)" stroke-width=".65"/>');
      drawing += lines.join('') + '<rect x="99" y="173" width="42" height="97" fill="' + light + '"/>';
    } else if (index === 4) {
      drawing = '<ellipse cx="120" cy="171" rx="91" ry="72" fill="' + light + '"/>';
      for (let i = 0; i < 17; i++) lines.push('<ellipse cx="120" cy="' + (133+i*2.2) + '" rx="' + (8+i*5.4) + '" ry="' + (3+i*2.4) + '" fill="none" stroke="var(--book-ink)" stroke-width=".8"/>');
      drawing += lines.join('');
    } else {
      drawing = '<circle cx="119" cy="156" r="56" fill="' + fill + '"/>';
      for (let i = 0; i < 7; i++) lines.push('<ellipse cx="120" cy="156" rx="' + (68+i*5) + '" ry="' + (14+i*6) + '" fill="none" stroke="var(--book-ink)" stroke-width=".6" transform="rotate(' + (-46+i*13) + ' 120 156)"/>');
      drawing += lines.join('') + '<circle cx="186" cy="99" r="7" fill="var(--book-ink)"/>';
    }
    return '<svg viewBox="0 0 240 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>' +
      '<pattern id="' + dot + '" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="1.2" cy="1.2" r=".94" fill="var(--book-ink)"/></pattern>' +
      '<pattern id="' + fine + '" width="3.4" height="3.4" patternUnits="userSpaceOnUse"><circle cx="1.2" cy="1.2" r=".48" fill="var(--book-muted)"/></pattern></defs>' +
      '<rect width="240" height="320" fill="var(--book-art)"/>' + drawing +
      '<path d="M29 291H211" stroke="var(--book-muted)" stroke-width=".5"/><text class="wm-book__caption" x="30" y="304" font-size="' + global.MotionKit.textSize('caption',5/6) + '" fill="var(--book-muted)">' +
      titles[index] + '</text><text class="wm-book__number" x="210" y="304" text-anchor="end" font-size="' + global.MotionKit.textSize('caption',5/6) + '" fill="var(--book-muted)">' +
      String(index + 1).padStart(2, '0') + '</text></svg>';
  }
  function paper(edge, extra, parts) {
    return '<div class="wm-book__paper ' + (extra || '') + '" data-edge="' + edge + '">' +
      (parts.has('art') ? '<div class="wm-book__art"></div>' : '') +
      (parts.has('light') ? '<div class="wm-book__grain"></div><div class="wm-book__crease"></div><div class="wm-book__shade"></div>' : '') + '</div>';
  }
  function create(root, options) {
    options = options || {};
    const interactive = !!options.interactive;
    const requestFrame = options.requestFrame || global.requestAnimationFrame.bind(global);
    const cancelFrame = options.cancelFrame || global.cancelAnimationFrame.bind(global);
    const now = options.now || (() => global.performance.now());
    const prefix = 'wm-book-' + (++serial);
    const parts = new Set(options.parts || ['turn', 'art', 'light']);
    root.innerHTML = '<style>' + STYLE + '</style><div class="wm-book"><div class="wm-book__scene"><div class="wm-book__body">' +
      (parts.has('light') ? '<div class="wm-book__cover"></div><div class="wm-book__edges"></div>' : '') +
      '<button class="wm-book__base wm-book__base--left" type="button" aria-label="点击左页，翻到上一页">' + paper('left', '', parts) + '<span class="wm-book__hint">‹</span></button>' +
      '<button class="wm-book__base wm-book__base--right" type="button" aria-label="点击右页，翻到下一页">' + paper('right', '', parts) + '<span class="wm-book__hint">›</span></button>' +
      (parts.has('light') ? '<div class="wm-book__spine"></div>' : '') + '<div class="wm-book__leaf" hidden>' + paper('right', 'wm-book__front', parts) + paper('left', 'wm-book__back', parts) +
      '</div></div></div></div>';
    const shell = root.querySelector('.wm-book');
    const body = root.querySelector('.wm-book__body');
    const left = root.querySelector('.wm-book__base--left');
    const right = root.querySelector('.wm-book__base--right');
    const leaf = root.querySelector('.wm-book__leaf');
    const papers = [left.firstElementChild, right.firstElementChild, leaf.firstElementChild, leaf.lastElementChild];
    if (parts.has('turn')) body.dataset.layer = 'turn';
    root.querySelectorAll('.wm-book__art').forEach(node => { node.dataset.layer = 'art'; });
    root.querySelectorAll('.wm-book__cover,.wm-book__edges,.wm-book__grain,.wm-book__crease,.wm-book__shade,.wm-book__spine')
      .forEach(node => { node.dataset.layer = 'light'; });
    const cache = [null, null, null, null];
    let destroyed = false, frame = null, animation = null;
    let state = {index: 0, flip: null, entrance: 1}, settings = {};
    const handlers = [];
    function notify() {
      if (!destroyed && options.onUpdate) options.onUpdate({
        index: state.flip ? wrap(state.flip.from + state.flip.direction) : state.index,
        settledIndex: state.index, title: titles[state.flip ? wrap(state.flip.from + state.flip.direction) : state.index],
        busy: !!animation || !!state.flip, paused: !!animation && animation.paused,
        pageCount: PAGE_COUNT
      });
    }
    function content(slot, index) {
      index = wrap(index);
      if (cache[slot] === index) return;
      cache[slot] = index;
      papers[slot].dataset.page = String(index);
      const image = papers[slot].querySelector('.wm-book__art');
      if (image) image.innerHTML = art(index, prefix + '-' + slot);
    }
    function paintLight(sweep) {
      sweep = clamp(sweep, 0, 1);
      const front = papers[2].querySelector('.wm-book__shade'), back = papers[3].querySelector('.wm-book__shade');
      if (front) front.style.opacity = String(.36*sweep);
      if (back) back.style.opacity = String(.36*(1-sweep));
    }
    function draw(next) {
      if (destroyed) return;
      state = {index: wrap(next.index), flip: next.flip, entrance: clamp(next.entrance ?? 1, 0, 1)};
      const pose = state.entrance;
      body.style.transform = 'rotateX(' + (12 - 6*pose) + 'deg) rotateY(' + (-10 + 6*pose) + 'deg) rotateZ(' + (-2 + 2*pose) + 'deg) scale(' + (.95+.05*pose) + ')';
      const flip = state.flip;
      leaf.hidden = !flip;
      if (flip) {
        const from = wrap(flip.from), target = wrap(from + flip.direction), fraction = clamp(flip.progress, 0, 1);
        content(0, flip.direction > 0 ? from - 1 : target - 1);
        content(1, flip.direction > 0 ? target : from);
        content(2, flip.direction > 0 ? from : target);
        content(3, flip.direction > 0 ? from : target);
        const sweep = flip.direction > 0 ? fraction : 1 - fraction;
        leaf.style.transform = 'translateZ(2px) rotateY(' + (-180*sweep) + 'deg)';
        paintLight(sweep);
      } else {
        content(0, state.index - 1); content(1, state.index);
        // Reset hidden geometry too, so seeking to the same time reconstructs all state.
        content(2, state.index); content(3, state.index);
        leaf.style.transform = 'translateZ(2px) rotateY(0deg)';
        paintLight(0);
      }
      left.disabled = right.disabled = !interactive || !!animation || !!flip;
      shell.dataset.index = String(state.index);
      shell.dataset.busy = String(!!animation || !!flip);
      notify();
    }
    function stopFrame() {
      if (frame !== null) { cancelFrame(frame); frame = null; }
    }
    function animationState(elapsed) {
      if (animation.type === 'intro') return introAt(elapsed);
      const progress = smooth(elapsed / animation.duration);
      return elapsed >= animation.duration ? {index: wrap(animation.from + animation.direction), flip: null, entrance: 1} :
        {index: animation.from, flip: {from: animation.from, direction: animation.direction, progress}, entrance: 1};
    }
    function tick(timestamp) {
      frame = null;
      if (destroyed || !animation || animation.paused) return;
      const elapsed = clamp(timestamp - animation.started, 0, animation.duration);
      animation.elapsed = elapsed;
      const next = animationState(elapsed);
      if (elapsed >= animation.duration) animation = null;
      draw(next);
      if (animation) frame = requestFrame(tick);
    }
    function start(job) {
      if (destroyed) return false;
      stopFrame();
      animation = Object.assign(job, {started: now(), elapsed: 0, paused: false});
      draw(animationState(0));
      frame = requestFrame(tick);
      return true;
    }
    function turn(direction) {
      if (destroyed || !interactive || animation) return false;
      direction = direction < 0 ? -1 : 1;
      return start({type: 'turn', from: state.index, direction, duration: 450});
    }
    function restartIntro() {
      if (destroyed) return;
      start({type: 'intro', duration: INTRO_END});
    }
    function setSettings(next) {
      if (destroyed) return;
      const validated = {};
      for (const [key, min, max, fallback] of [['padding',0,30,10],['radius',0,40,20],['crease',0,40,11]]) {
        const value = next && key in next ? next[key] : (settings[key] ?? fallback);
        if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError('纸页参数必须是有限数字');
        validated[key] = clamp(value, min, max);
      }
      settings = validated;
      shell.style.setProperty('--book-pad', settings.padding + 'px');
      shell.style.setProperty('--book-radius', settings.radius + 'px');
      shell.style.setProperty('--book-crease', String(settings.crease/100));
    }
    function on(target, type, handler) {
      target.addEventListener(type, handler); handlers.push(() => target.removeEventListener(type, handler));
    }
    if (interactive) {
      on(left, 'click', () => turn(-1)); on(right, 'click', () => turn(1));
      on(root, 'keydown', event => {
        if (event.target.closest('input,select,textarea,[contenteditable="true"]')) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault(); turn(event.key === 'ArrowLeft' ? -1 : 1);
        }
      });
    } else {
      left.tabIndex = right.tabIndex = -1;
    }
    const controller = {
      next: () => turn(1), prev: () => turn(-1), restartIntro, setSettings,
      renderState(next) { stopFrame(); animation = null; draw(next); },
      renderLighting(sweep) { if (!destroyed) paintLight(sweep); },
      pause() {
        if (!animation || animation.paused || destroyed) return;
        stopFrame(); tick(now()); stopFrame();
        if (animation) { animation.paused = true; notify(); }
      },
      resume() {
        if (!animation || !animation.paused || destroyed) return;
        animation.paused = false; animation.started = now() - animation.elapsed;
        frame = requestFrame(tick); notify();
      },
      destroy(preserve) {
        if (destroyed) return;
        destroyed = true; stopFrame(); animation = null;
        handlers.splice(0).forEach(off => off());
        if (!preserve) root.replaceChildren();
      },
      get snapshot() { return {index: state.index, flip: state.flip && Object.assign({}, state.flip), entrance: state.entrance, settings: Object.assign({}, settings)}; },
      get busy() { return !!animation || !!state.flip; },
      get destroyed() { return destroyed; },
      get pendingFrame() { return frame !== null; }
    };
    setSettings(options.settings); draw(state);
    if (interactive && options.intro !== false) restartIntro();
    return controller;
  }
  global.WiseDitherBook = {create, introAt, demoAt, duration: DURATION, introDuration: INTRO_END, pageCount: PAGE_COUNT};
  const factories = global.MotionFactories = global.MotionFactories || {};
  factories['dither-lab-book'] = function (root, kit, definition) {
    const book = create(root, {interactive: false, intro: false, settings: definition?.paper_settings});
    const render = time => book.renderState(demoAt(time));
    render.destroy = preserve => book.destroy(preserve);
    return render;
  };
  factories['book-spine-turn'] = function (root, kit, definition) {
    const book = create(root, {interactive: false, intro: false, settings: definition?.paper_settings, parts: ['turn']});
    const render = time => book.renderState(demoAt(time));
    render.destroy = preserve => book.destroy(preserve);
    return render;
  };
  factories['book-geometric-illustration'] = function (root, kit, definition) {
    const variants = ['moon','mountain','leaf','arch','water','orbit'];
    const index = Math.max(0, variants.indexOf(definition?.variant_id || 'moon'));
    const prefix = 'wm-book-' + (++serial) + '-illustration';
    root.innerHTML = '<style>' + STYLE + '</style><div class="wm-book"><div class="wm-book__art wm-book__illustration" data-layer="art" data-page="' + index + '">' + art(index, prefix) + '</div></div>';
    root.querySelector('svg').classList.add('pattern-svg');
    return () => {};
  };
  factories['book-paper-light'] = function (root, kit, definition) {
    const book = create(root, {interactive: false, intro: false, settings: definition?.paper_settings, parts: ['light']});
    // 固定纸页姿态，只独立演示原翻页角度对应的明暗变化。
    book.renderState({index: 4, flip: {from: 4, direction: 1, progress: .28}, entrance: 1});
    const render = time => {
      const flip = demoAt(time).flip;
      book.renderLighting(flip ? (flip.direction > 0 ? flip.progress : 1 - flip.progress) : 0);
    };
    render.destroy = preserve => book.destroy(preserve);
    return render;
  };
  factories['dither-lab-book'].breakdown = [
    {id:'turn', name:'绕书脊翻页', actions:['book-spine-turn'], start:0, end:DURATION, time:'0–7.6 秒', detail:'纸页绕固定书脊翻转；左右基础页、活动页和正反面共用原翻页状态。'},
    {id:'art', name:'几何网点插画', actions:['book-geometric-illustration'], start:0, end:DURATION, time:'0–7.6 秒', detail:'月相、山势、叶脉、拱廊、水纹和轨道六幅原插画，随纸页正反面承接。'},
    {id:'light', name:'纸张光影', actions:['book-paper-light'], start:0, end:DURATION, time:'0–7.6 秒', detail:'纸纹、页缘、书脊渐变和活动页明暗；阴影强度沿用原翻页角度计算。'},
  ];
})(globalThis);
