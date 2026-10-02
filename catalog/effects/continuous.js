/* Copyright (c) 2026 Wise Wong. SPDX-License-Identifier: AGPL-3.0-only */
(function (F) {
  let conveyorSerial = 0;
  F['card-conveyor'] = (root) => {
    // 原工程的八条斜向泳道：上四条右行，下四条左行；出场节奏保持，滚动位移减半。
    const W = 232, H = 174, STEP = W + 30, LOOP = STEP * 12;
    const ns = 'card-conveyor-' + (++conveyorSerial);
    const wrap = v => ((v + LOOP / 2) % LOOP + LOOP) % LOOP - LOOP / 2;
    const marks = [
      '<circle cx="116" cy="68" r="23"/>',
      '<rect x="95" y="47" width="42" height="42" rx="7"/>',
      '<path d="M116 42l26 26-26 26-26-26Z"/>',
      '<path d="M92 68h48M116 44v48"/>'
    ];
    const cards = marks.map((mark, i) => `<g id="${ns}-card${i}"><rect width="${W}" height="${H}" rx="12" fill="var(--card)" stroke="var(--card-muted)" stroke-width="1.3" stroke-opacity=".3"/><g fill="none" stroke="var(--card-ink)" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${mark}</g><path d="M76 117h80M91 131h50" fill="none" stroke="var(--card-muted)" stroke-width="2" stroke-linecap="round" opacity=".5"/></g>`).join('');
    const lanes = Array.from({length:8}, (_, lane) => `<g data-lane="${lane}" transform="translate(${(lane % 4) * 70} ${(lane - 3.5) * (H + 40)})">` + [-1, 0, 1].map(copy => Array.from({length:12}, (_, col) => `<use href="#${ns}-card${(col + lane) % 4}" x="${col * STEP + copy * LOOP - W / 2}" y="${-H / 2}"/>`).join('')).join('') + '</g>');
    root.innerHTML = `<svg class="pattern-svg" width="640" height="360" viewBox="0 0 640 360" aria-hidden="true"><defs>${cards}<clipPath id="${ns}-upper" clipPathUnits="userSpaceOnUse"><rect data-mask="upper" x="-1700" y="-880" width="0" height="880"/></clipPath><clipPath id="${ns}-lower" clipPathUnits="userSpaceOnUse"><rect data-mask="lower" x="1700" y="0" width="0" height="880"/></clipPath></defs><g transform="translate(320 180) rotate(-12) scale(.3333333333333333)"><g clip-path="url(#${ns}-upper)">${lanes.slice(0, 4).join('')}</g><g clip-path="url(#${ns}-lower)">${lanes.slice(4).join('')}</g></g></svg>`;
    const tracks = [...root.querySelectorAll('[data-lane]')], upper = root.querySelector('[data-mask="upper"]'), lower = root.querySelector('[data-mask="lower"]');
    const set = (el, key, value) => { const v = String(value); if (el.getAttribute(key) !== v) el.setAttribute(key, v); };
    return (t, o = {}) => {
      const frame = Math.max(0, (o.elapsed ?? t) * 30 / 1000 - 4);
      const advance = frame <= 20 ? 4 * frame * frame : 1600 + (frame - 20) * 160;
      const travel = advance * .5;
      const visible = Math.min(3400, advance);
      set(upper, 'width', visible); set(lower, 'width', visible); set(lower, 'x', 1700 - visible);
      // 用首尾副本滚动整条泳道，每帧只更新八组位置，而不逐张修改卡片。
      tracks.forEach((track, lane) => set(track, 'transform', `translate(${wrap((lane % 4) * 70 + (lane < 4 ? travel : -travel))} ${(lane - 3.5) * (H + 40)})`));
    };
  };
  F['seamless-scroll'] = (root, M) => {
    const items = M.cardSet(); const s = M.scene(root, '<div class="scroll-mask"><div class="scroll-track">' + items + items + items + '</div></div>');
    return (t, o) => M.pose(s.one('.scroll-track'), {x: -(t / o.duration % 1) * 496});
  };
  F['curve-path'] = (root, M) => {
    const points = Array.from({length: 121}, (_, i) => { const p = M.curve(i / 120); return `${i ? 'L' : 'M'}${p.x},${p.y}`; }).join(' ');
    const s = M.scene(root, `<svg class="path-guide" viewBox="0 0 640 360"><path d="${points}"/></svg><div class="traveler">›</div>`);
    return (t, o) => { const p = M.ease(t / o.duration, o.ease); const a = M.curve(p), b = M.curve(p + .001); M.pose(s.one('.traveler'), {x: a.x, y: a.y, rotate: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI}); };
  };
  F.orbit = (root, M) => {
    const s = M.scene(root, '<div class="center-shape" style="left:282px;top:166px;width:76px;height:76px"></div>' + M.cardSet(5));
    const cards = s.all('.mini-card'); cards.forEach(c => { c.style.left = '266px'; c.style.top = '125px'; });
    return (t, o) => cards.forEach((c, i) => { const a = (M.ease(t / o.duration, o.ease) + i / 5) * Math.PI * 2; const z = Math.sin(a); M.pose(c, {x: Math.cos(a) * 215, y: z * 26, scale: .68 + (z + 1) * .16, ry: -Math.cos(a) * 16, opacity: .64 + (z + 1) * .18}); c.style.zIndex = String(Math.round((z + 1) * 20)); });
  };
  F.float = (root, M) => {
    const s = M.scene(root, M.tile('留一点轻盈', '缓慢起伏，保持安静'));
    return (t, o) => { const a = M.ease(t / o.duration, o.ease) * Math.PI * 2; M.pose(s.one('.tile'), {y: -Math.sin(a) * 18, rotate: Math.sin(a) * 1.4}); };
  };
})(globalThis.MotionFactories);
