/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: Apache-2.0 */
(function (F) {
  F['fade-rise'] = (root, M) => {
    const s = M.scene(root, M.tile());
    s.one('.tile-symbol').classList.add('tile-symbol-bare');
    s.one('.tile-symbol').innerHTML = '<svg data-motion-icon="grid" width="44" height="44" style="width:44px;height:44px" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>';
    return (t, o) => F['fade-rise'].draw(M, s.one('.tile'), t, o);
  };
  // 组合复用同一上移淡入，只把对象、距离和时段作为参数传入。
  F['fade-rise'].draw = (M, node, t, o, {start = 150, end = 1350, distance = 48} = {}) => {
    const p = M.span(t, start, end, o.ease);
    M.pose(node, {y: distance * (1 - p), opacity: p});
    return p;
  };
  F['scale-in'] = (root, M) => {
    const s = M.scene(root, M.tile('值得注意', '一次登场，一次落定'));
    s.one('.tile-symbol').classList.add('tile-symbol-bare');
    s.one('.tile-symbol').innerHTML = '<svg data-motion-icon="cube" width="44" height="44" style="width:44px;height:44px" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9"/></svg>';
    return (t, o) => { const p = M.span(t, 150, 1300, o.ease); const bounce = Math.sin(M.clamp((t - 150) / 1150) * Math.PI) * .08; M.pose(s.one('.tile'), {scale: .66 + .34 * p + bounce, opacity: M.span(t, 100, 600)}); };
  };
  F['stagger-in'] = (root, M, definition) => M.contentReady(root, definition, () => {
    const s = M.scene(root, M.cardSet());
    const cards = s.all('.mini-card'); cards.forEach((c, i) => { c.style.left = `${80 + i * 124}px`; c.style.top = '111px'; });
    if (definition?.content) cards.forEach((card,i) => {const node=card.querySelector('strong'), label=M.slot(definition,'labels',['想法','内容','细节','结果'])[i]; node.textContent=label; M.fitText(root,node,label,72,16,12);});
    return (t, o) => F['stagger-in'].draw(M, cards, t, o);
  });
  F['stagger-in'].draw = (M, nodes, t, o, {start = 200, end = 1100, gap = 300, distance = 44} = {}) =>
    nodes.map((node, i) => F['fade-rise'].draw(M, node, t, o, {start:start + i * gap, end:end + i * gap, distance}));
  F['group-expand'] = (root, M) => {
    // 保留原第二组六卡的进入关系，按每行三张重排为三列两行，逐张由 .62 放大到 1；标签晚 140ms。
    const ratio = .32, width = 424 * ratio, height = 238.5 * ratio;
    // 编号与卡片留出独立间距，行间额外留白；含编号的整体保持居中。
    const positions = Array.from({length:6}, (_, i) => ({x:320 + (i % 3 - 1) * (width + 18), y:170 + (Math.floor(i / 3) - .5) * 120}));
    root.innerHTML = '<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true">' + positions.map((p, i) =>
      `<g data-card="${i}" opacity="0"><rect x="${-width / 2}" y="${-height / 2}" width="${width}" height="${height}" rx="4" fill="var(--card)" stroke="var(--card-muted)" stroke-opacity=".3" stroke-width=".6"/><circle cx="-43" cy="-12" r="7" fill="none" stroke="var(--card-ink)" stroke-width=".7"/><path d="M-27 -12h52M-50 9h100M-50 20h68" fill="none" stroke="var(--card-muted)" stroke-width=".65" stroke-linecap="round"/></g><text data-label="${i}" x="${p.x}" y="${p.y + height / 2 + 22}" text-anchor="middle" font-size="${M.textSize('caption')}" font-weight="700" fill="var(--ink)" opacity="0">${String(i + 1).padStart(2, '0')}</text>`
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
