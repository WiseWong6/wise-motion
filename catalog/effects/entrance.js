/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function (F) {
  F['fade-rise'] = (root, M) => {
    const s = M.scene(root, M.tile());
    return (t, o) => F['fade-rise'].draw(M, s.one('.tile'), t, o);
  };
  // 组合复用同一上移淡入，只把对象、距离和时段作为参数传入。
  F['fade-rise'].draw = (M, node, t, o, {start = 150, end = 1350, distance = 48} = {}) => {
    const p = M.span(t, start, end, o.ease);
    M.pose(node, {y: distance * (1 - p), opacity: p});
    return p;
  };
  F['mask-reveal'] = (root, M) => {
    const s = M.scene(root, '<div class="reveal-clip"><div class="headline">让好想法，<br><span class="muted">被看见。</span></div></div>');
    return (t, o) => F['mask-reveal'].draw(M, s.one('.reveal-clip'), t, o);
  };
  F['mask-reveal'].draw = (M, node, t, o, {start = 200, end = 1900} = {}) => {
    const p = M.span(t, start, end, o.ease);
    node.style.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
  };
  F['scale-in'] = (root, M) => {
    const s = M.scene(root, M.tile('值得注意', '一次登场，一次落定'));
    return (t, o) => { const p = M.span(t, 150, 1300, o.ease); const bounce = Math.sin(M.clamp((t - 150) / 1150) * Math.PI) * .08; M.pose(s.one('.tile'), {scale: .66 + .34 * p + bounce, opacity: M.span(t, 100, 600)}); };
  };
  F['stagger-in'] = (root, M) => {
    const s = M.scene(root, M.cardSet());
    const cards = s.all('.mini-card'); cards.forEach((c, i) => { c.style.left = `${80 + i * 124}px`; c.style.top = '111px'; });
    return (t, o) => F['stagger-in'].draw(M, cards, t, o);
  };
  F['stagger-in'].draw = (M, nodes, t, o, {start = 200, end = 1100, gap = 300, distance = 44} = {}) =>
    nodes.map((node, i) => F['fade-rise'].draw(M, node, t, o, {start:start + i * gap, end:end + i * gap, distance}));
  F['group-expand'] = (root, M) => {
    // 原成组展开的第二组六卡：两列三行，逐张由 .62 放大到 1；标签晚 140ms。
    const ratio = .32, width = 424 * ratio, height = 238.5 * ratio;
    const positions = Array.from({length:6}, (_, i) => ({x:320 + (i % 2 - .5) * 456 * ratio, y:180 + (Math.floor(i / 2) - 1) * 310 * ratio}));
    root.innerHTML = '<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true">' + positions.map((p, i) =>
      `<g data-card="${i}" opacity="0"><rect x="${-width / 2}" y="${-height / 2}" width="${width}" height="${height}" rx="4" fill="var(--card)" stroke="var(--card-muted)" stroke-opacity=".3" stroke-width=".6"/><circle cx="-43" cy="-12" r="7" fill="none" stroke="var(--card-ink)" stroke-width=".7"/><path d="M-27 -12h52M-50 9h100M-50 20h68" fill="none" stroke="var(--card-muted)" stroke-width=".65" stroke-linecap="round"/></g><text data-label="${i}" x="${p.x}" y="${p.y + height / 2 + 34 * ratio}" text-anchor="middle" font-size="${M.textSize('caption')}" font-weight="700" fill="var(--ink)" opacity="0">${String(i + 1).padStart(2, '0')}</text>`
    ).join('') + '</svg>';
    const cards = [...root.querySelectorAll('[data-card]')], labels = [...root.querySelectorAll('[data-label]')];
    const set = (el, key, value) => { const v = String(value); if (el.getAttribute(key) !== v) el.setAttribute(key, v); };
    return t => positions.forEach((p, i) => {
      const start = 120 + i * 145;
      const appear = M.span(t, start, start + 380, 'outQuart');
      const label = M.span(t, start + 140, start + 440, 'outCubic');
      set(cards[i], 'transform', `translate(${p.x} ${p.y}) scale(${M.mix(.62, 1, appear)})`);
      set(cards[i], 'opacity', appear);
      set(labels[i], 'transform', `translate(0 ${10 * ratio * (1 - label)})`);
      set(labels[i], 'opacity', label);
    });
  };
})(globalThis.MotionFactories);
